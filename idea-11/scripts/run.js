const { execSync } = require('child_process');

// Check if Foundry is available
let foundryAvailable = false;
try {
  execSync('forge --version', { stdio: 'ignore' });
  foundryAvailable = true;
} catch (e) {
  // Forge not available, use npm scripts
}

const scripts = {
  test: foundryAvailable ? 'forge test -vvv' : 'npm run test',
  build: foundryAvailable ? 'forge build' : 'npm run build',
  deploy: foundryAvailable ? 'forge script scripts/Deploy.s.sol:deploy' : 'npm run deploy',
  coverage: foundryAvailable ? 'forge coverage' : 'npm run test:coverage',
  gas: foundryAvailable ? 'forge test --gas-report' : 'npm run test:gas',
  clean: 'forge clean',
  help: 'forge help'
};

console.log('Available scripts:');
Object.entries(scripts).forEach(([name, command]) => {
  console.log(`  ${name}: ${command}`);
});