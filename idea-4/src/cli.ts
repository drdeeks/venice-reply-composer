import { Command } from 'commander';
import { loadConfig } from './config';
import { TalentProtocolClient } from './talent-protocol';
import { MeritSystemsClient } from './merit-systems';
import { ENSManager } from './ens-manager';
import { BuilderCredential, IssuanceRequest, VerificationResult } from './types';
import { CredentialIssuer } from './credential-issuer';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';

const program = new Command();

program
  .name('builder-credential-ens')
  .description('ENS subdomain issuer backed by Merit attestations and Talent builder score')
  .version('1.0.0');

program
  .command('issue')
  .description('Issue a new builder credential with ENS subdomain')
  .requiredOption('-a, --address <address>', 'Builder Ethereum address')
  .option('--merit-ids <ids>', 'Comma-separated Merit attestation IDs')
  .option('--include-talent', 'Include Talent Protocol score', true)
  .option('--expiry <timestamp>', 'Expiry timestamp (Unix)')
  .option('--subdomain <subdomain>', 'Custom subdomain (optional)')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const builderAddress = options.address;

      console.log(`\n🔐 Issuing builder credential for ${builderAddress}...\n`);

      // Fetch Talent score if requested
      let talentScore: number | undefined;
      if (options.includeTalent) {
        console.log('📊 Fetching Talent Protocol data...');
        const talentClient = new TalentProtocolClient(config.talentApiBaseUrl, config.talentApiKey);
        const profile = await talentClient.getProfileByAddress(builderAddress);
        
        if (profile) {
          talentScore = profile.score;
          console.log(`  ✓ Builder score: ${talentScore} (rank #${profile.rank})`);
        } else {
          console.log('  ⚠ No Talent Protocol profile found');
        }
      }

      // Fetch Merit attestations if IDs provided
      const meritAttestations = [];
      if (options.meritIds) {
        console.log('\n📜 Fetching Merit attestations...');
        const meritClient = new MeritSystemsClient(
          config.meritApiBaseUrl,
          config.meritContractAddress,
          config.meritApiKey
        );

        for (const id of options.meritIds.split(',')) {
          const attestations = await meritClient.getAttestationsByIds([id.trim()]);
          if (attestations.length > 0 && attestations[0].recipient.toLowerCase() === builderAddress.toLowerCase()) {
            meritAttestations.push(attestations[0]);
            console.log(`  ✓ Attestation verified: ${id}`);
          } else {
            console.log(`  ✗ Attestation not valid for this builder: ${id}`);
          }
        }
      }

      // Create ENS manager
      const ensManager = new ENSManager(config);
      const subdomain = options.subdomain || ensManager.generateSubdomainFromAddress(builderAddress);

      // Validate subdomain
      if (!ensManager.validateSubdomain(subdomain)) {
        throw new Error(`Invalid subdomain format: ${subdomain}`);
      }

      console.log(`\n🌐 Registering ENS subdomain: ${subdomain}.${config.verifiedBuildersDomain}...`);

      // Register subdomain
      await ensManager.registerSubdomain(subdomain, builderAddress);

      // Create credential
      console.log('\n🔑 Creating credential with cryptographic proof...');
      const issuer = new CredentialIssuer(config);
      const issuanceRequest: IssuanceRequest = {
        builderAddress,
        meritAttestationIds: options.meritIds?.split(',').map(id => id.trim()),
        includeTalentScore: options.includeTalent,
        expiry: options.expiry ? parseInt(options.expiry, 10) : undefined
      };

      const credential = await issuer.createCredential(
        issuanceRequest,
        talentScore,
        meritAttestations
      );

      console.log(`  ✓ Subdomain registered: ${credential.fullEnsName}`);
      console.log(`  ✓ Credential issued with ${meritAttestations.length} attestations`);

      // Save credential
      const outputDir = path.join(process.cwd(), 'credentials');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${subdomain}-${Date.now()}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(credential, null, 2));

      console.log(`\n✅ Credential saved to: ${outputPath}`);
      console.log(`\n📋 Credential Summary:`);
      console.log(`  ENS Name: ${credential.fullEnsName}`);
      console.log(`  Builder: ${credential.address}`);
      console.log(`  Talent Score: ${credential.talentScore || 'N/A'}`);
      console.log(`  Merit Attestations: ${credential.meritAttestations.length}`);
      console.log(`  Issued: ${new Date(credential.issuedAt).toISOString()}`);
      console.log(`  Proof Signature: ${credential.proof.signature.slice(0, 20)}...`);

    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify a builder credential')
  .argument('<credential-file>', 'Path to the credential JSON file')
  .action(async (filePath) => {
    try {
      const config = loadConfig();
      const credentialContent = fs.readFileSync(filePath, 'utf-8');
      const credential: BuilderCredential = JSON.parse(credentialContent);

      console.log(`\n🔍 Verifying credential for ${credential.fullEnsName}...\n`);

      const issuer = new CredentialIssuer(config);
      const result = await issuer.verifyCredential(credential);

      if (result.valid) {
        console.log('✅ Credential is VALID');
        console.log(`\n📋 Details:`);
        console.log(`  ENS Name: ${result.ensName}`);
        console.log(`  Builder: ${result.builderAddress}`);
        console.log(`  Talent Score: ${result.talentScore || 'N/A'}`);
        console.log(`  Merit Attestations: ${result.meritCount}`);
      } else {
        console.log('❌ Credential is INVALID');
        if (result.errors) {
          console.log('\nErrors:');
          result.errors.forEach(err => console.log(`  • ${err}`));
        }
        process.exit(1);
      }

    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description("Get status of a builder's credential")
  .argument('<ens-name>', 'ENS name (e.g., alice.verified-builders.eth)')
  .action(async (ensName) => {
    try {
      const config = loadConfig();
      const ensManager = new ENSManager(config);
      const info = await ensManager.getSubdomainInfo(ensName.replace('.verified-builders.eth', ''));

      console.log(`\n📊 Status for ${ensName}`);
      console.log(`  Owner: ${info.owner}`);
      console.log(`  Resolver: ${info.resolver}`);
      if (info.records?.addr) {
        console.log(`  Address: ${info.records.addr}`);
      }
      console.log(`  Registration date: ${new Date(info.registrationDate).toISOString()}`);
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('check-availability')
  .description('Check availability of subdomains')
  .argument('<subdomains>', 'Comma-separated list of subdomains to check')
  .action(async (subdomains) => {
    try {
      const config = loadConfig();
      const ensManager = new ENSManager(config);
      const names = subdomains.split(',').map(s => s.trim());
      const results = await ensManager.checkAvailabilityBatch(names);

      console.log(`\n🔍 Subdomain Availability Check:\n`);
      for (const [subdomain, available] of results) {
        const status = available ? '✅ AVAILABLE' : '❌ TAKEN';
        console.log(`  ${subdomain}.${config.verifiedBuildersDomain} - ${status}`);
      }
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate-subdomain')
  .description('Generate a subdomain from an Ethereum address')
  .argument('<address>', 'Ethereum address')
  .action(async (address) => {
    try {
      if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const config = loadConfig();
      const ensManager = new ENSManager(config);
      const subdomain = ensManager.generateSubdomainFromAddress(address);
      const fullName = `${subdomain}.${config.verifiedBuildersDomain}`;

      console.log(`\n🔧 Generated subdomain suggestion:`);
      console.log(`  ${fullName}`);
      console.log(`\nUse --subdomain option to set this explicitly.`);
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}