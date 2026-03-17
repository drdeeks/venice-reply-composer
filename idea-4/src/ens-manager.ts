import { ethers } from 'ethers';
import { ENS } from '@ensdomains/ensjs';
import { SystemConfig } from './types';

export interface ENSSubdomainInfo {
  subdomain: string;
  fullName: string;
  owner: string;
  resolver: string;
  registrationDate: number;
  expiresAt?: number;
  records: {
    addr: string;
    contenthash: string;
    name: string;
    pubkey: string;
    text: Record<string, string>;
  } | null;
}

export class ENSManager {
  private readonly config: SystemConfig;
  private readonly provider: ethers.providers.Provider;
  private readonly signer: ethers.Signer;
  private readonly ensContract: ethers.Contract;
  private readonly registry: any;

  constructor(
    config: SystemConfig,
    provider?: ethers.providers.Provider,
    signer?: ethers.Signer
  ) {
    this.config = config;
    this.provider = provider || new ethers.providers.JsonRpcProvider(config.rpcUrl, config.chainId);
    if (signer) {
      this.signer = signer;
    } else if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    } else {
      throw new Error('Signer or private key required for ENS operations');
    }

    this.ensContract = new ethers.Contract(
      config.ensRegistryAddress,
      [
        'function owner(bytes32 node) view returns (address)',
        'function resolver(bytes32 node) view returns (address)',
        'function setOwner(bytes32 node, address owner)',
        'function setResolver(bytes32 node, address resolver)',
        'function setSubnodeOwner(bytes32 node, bytes32 label, address owner)'
      ],
      this.signer
    );

    // Initialize ENS registry
    this.registry = new (require('@ensdomains/ensjs').ENS)({
      provider: this.provider,
      ensAddress: config.ensRegistryAddress
    });
  }

  /**
   * Convert domain name to node (hash)
   */
  private namehash(name: string): string {
    return ethers.utils.namehash(name);
  }

  /**
   * Create node from parent domain and subdomain
   */
  private node(parent: string, subdomain: string): string {
    return this.namehash(`${subdomain}.${parent}`);
  }

  /**
   * Check if a subdomain is available for registration
   */
  async isAvailable(subdomain: string): Promise<boolean> {
    try {
      const fullName = `${subdomain}.${this.config.verifiedBuildersDomain}`;
      const node = this.namehash(fullName);
      const owner = await this.ensContract.owner(node);
      return owner === ethers.constants.AddressZero;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Register a new subdomain for a builder
   */
  async registerSubdomain(
    subdomain: string,
    builderAddress: string,
    ttl: number = 3600
  ): Promise<ENSSubdomainInfo> {
    // Validate addresses
    if (!ethers.utils.isAddress(builderAddress)) {
      throw new Error('Invalid builder address');
    }

    // Check availability
    const available = await this.isAvailable(subdomain);
    if (!available) {
      throw new Error(`Subdomain '${subdomain}' is already taken`);
    }

    const fullName = `${subdomain}.${this.config.verifiedBuildersDomain}`;
    const parentNode = this.namehash(this.config.verifiedBuildersDomain);
    const subdomainNode = ethers.utils.formatBytes32String(subdomain);

    // Set subdomain owner
    const tx = await this.ensContract.setSubnodeOwner(
      parentNode,
      subdomainNode,
      builderAddress
    );

    await tx.wait();

    // Optionally set resolver
    if (this.config.ensPublicResolverAddress !== ethers.constants.AddressZero) {
      const node = this.node(this.config.verifiedBuildersDomain, subdomain);
      await this.ensContract.setResolver(
        node,
        this.config.ensPublicResolverAddress
      );
    }

    // Fetch subdomain info
    return this.getSubdomainInfo(subdomain);
  }

  /**
   * Get information about a subdomain
   */
  async getSubdomainInfo(subdomain: string): Promise<ENSSubdomainInfo> {
    const fullName = `${subdomain}.${this.config.verifiedBuildersDomain}`;
    const node = this.node(this.config.verifiedBuildersDomain, subdomain);

    try {
      const [owner, resolver] = await Promise.all([
        this.ensContract.owner(node),
        this.ensContract.resolver(node)
      ]);

      let records: ENSSubdomainInfo['records'] = null;

      if (resolver !== ethers.constants.AddressZero) {
        try {
          const resolverContract = new ethers.Contract(
            resolver,
            [
              'function addr(bytes32 node) view returns (bytes)',
              'function contenthash(bytes32 node) view returns (bytes)',
              'function name(bytes32 node) view returns (string)',
              'function pubkey(bytes32 node) view returns (bytes)',
              'function text(bytes32 node, string key) view returns (string)'
            ],
            this.provider
          );

          const [addr, contenthash, name] = await Promise.all([
            resolverContract.addr(node),
            resolverContract.contenthash(node),
            resolverContract.name(node)
          ]);

          // Get text records (common ones)
          const textKeys = ['email', 'url', 'com.github', 'com.twitter', 'org.description'];
          const text: Record<string, string> = {};

          for (const key of textKeys) {
            try {
              const value = await resolverContract.text(node, key);
              if (value) text[key] = value;
            } catch (e) {
              // Ignore missing text records
            }
          }

          records = {
            addr: addr ? ethers.utils.getAddress(addr) : null,
            contenthash: contenthash ? ethers.utils.parseBytes32String(contenthash) : null,
            name: name || '',
            pubkey: '',
            text
          };
        } catch (error) {
          console.warn('Could not fetch resolver records:', error);
        }
      }

      return {
        subdomain,
        fullName,
        owner,
        resolver,
        registrationDate: Date.now(), // Would need event parsing for actual registration date
        records
      };
    } catch (error) {
      console.error('Error getting subdomain info:', error);
      throw error;
    }
  }

  /**
   * Set additional records for a subdomain (requires resolver)
   */
  async setRecords(
    subdomain: string,
    records: {
      addr?: string;
      contenthash?: string;
      name?: string;
      text?: Record<string, string>;
    }
  ): Promise<{ txHash: string }> {
    const fullName = `${subdomain}.${this.config.verifiedBuildersDomain}`;
    const node = this.node(this.config.verifiedBuildersDomain, subdomain);

    // Check ownership
    const owner = await this.ensContract.owner(node);
    if (owner.toLowerCase() !== (await this.signer.getAddress()).toLowerCase()) {
      throw new Error('Not authorized: you do not own this subdomain');
    }

    const nodeNamehash = this.namehash(fullName);

    // Contruct transaction(s)
    // Note: In production, use the resolver contract directly
    throw new Error('setRecords not implemented - use direct resolver contract calls');
  }

  /**
   * Transfer ownership of a subdomain
   */
  async transferOwnership(
    subdomain: string,
    newOwner: string
  ): Promise<{ txHash: string }> {
    if (!ethers.utils.isAddress(newOwner)) {
      throw new Error('Invalid new owner address');
    }

    const fullName = `${subdomain}.${this.config.verifiedBuildersDomain}`;
    const node = this.namehash(fullName);

    const currentOwner = await this.ensContract.owner(node);
    if (currentOwner.toLowerCase() !== (await this.signer.getAddress()).toLowerCase()) {
      throw new Error('Not authorized: you do not own this subdomain');
    }

    const subdomainNode = ethers.utils.formatBytes32String(subdomain);
    const parentNode = this.namehash(this.config.verifiedBuildersDomain);

    const tx = await this.ensContract.setSubnodeOwner(
      parentNode,
      subdomainNode,
      newOwner
    );

    await tx.wait();

    return { txHash: tx.hash };
  }

  /**
   * Bulk check availability for multiple subdomains
   */
  async checkAvailabilityBatch(subdomains: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    await Promise.allSettled(
      subdomains.map(async (subdomain) => {
        try {
          const available = await this.isAvailable(subdomain);
          results.set(subdomain, available);
        } catch (error) {
          results.set(subdomain, false);
        }
      })
    );

    return results;
  }

  /**
   * Generate a suggested subdomain from an address
   */
  generateSubdomainFromAddress(address: string): string {
    const last8 = address.slice(-8);
    return `builder-${last8.toLowerCase()}`;
  }

  /**
   * Validate subdomain format (ENS labels)
   */
  validateSubdomain(subdomain: string): boolean {
    // ENS labels must be >= 1 and <= 255 characters
    // Allowed: a-z, 0-9, and hyphens (but not start/end with hyphen)
    if (subdomain.length < 1 || subdomain.length > 255) {
      return false;
    }
    if (/^[a-z0-9]/.test(subdomain) && /[a-z0-9]$/.test(subdomain)) {
      // Check all characters are valid
      return /^[a-z0-9-]+$/.test(subdomain);
    }
    return false;
  }
}