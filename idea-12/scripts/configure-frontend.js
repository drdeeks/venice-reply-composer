const fs = require('fs');
const path = require('path');

// Read current package.json
const packagePath = path.join(__dirname, '..', 'frontend', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Ensure required dependencies are present
const requiredDeps = {
  react: '^18.2.0',
  'react-dom': '^18.2.0',
  'web3': '^1.10.0',
  'ethers': '^6.1.0',
  '@web3-react/core': '^8.2.0',
  '@web3-react/injected-connector': '^6.0.7',
  'react-router-dom': '^6.8.0',
  '@mui/material': '^5.11.0',
  '@emotion/react': '^11.11.0',
  '@emotion/styled': '^11.11.0',
  '@mui/icons-material': '^5.11.0',
  axios: '^1.3.0',
  recharts: '^2.4.0',
};

const requiredDevDeps = {
  'react-scripts': '^5.0.1',
  typescript: '^5.0.0',
  '@types/react': '^18.0.0',
  '@types/react-dom': '^18.0.0',
};

// Merge carefully
pkg.dependencies = pkg.dependencies || {};
Object.assign(pkg.dependencies, requiredDeps);
pkg.devDependencies = pkg.devDependencies || {};
Object.assign(pkg.devDependencies, requiredDevDeps);

// Ensure scripts exist
pkg.scripts = pkg.scripts || {};
pkg.scripts.start = 'react-scripts start';
pkg.scripts.build = 'react-scripts build';
pkg.scripts.test = 'react-scripts test';
pkg.scripts.eject = 'react-scripts eject';

// Ensure config
if (!pkg.eslintConfig) pkg.eslintConfig = { extends: ['react-app'] };
if (!pkg.browserslist) {
  pkg.browserslist = {
    production: ['>0.2%', 'not dead', 'not op_mini all'],
    development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
  };
}
if (!pkg.proxy) pkg.proxy = 'http://localhost:3001';
if (!pkg.homepage) pkg.homepage = '.';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('Frontend package.json configured successfully');