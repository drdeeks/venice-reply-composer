#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const config = {
  type: 'react-scripts',
  scripts: {
    start: 'react-scripts start',
    build: 'react-scripts build',
    test: 'react-scripts test',
    eject: 'react-scripts eject',
  },
  dependencies: {
    react: '18.2.0',
    'react-dom': '18.2.0',
    'web3': '1.10.0',
    'ethers': '6.1.0',
    '@web3-react/core': '8.2.0',
    '@web3-react/injected-connector': '6.0.7',
    'react-router-dom': '6.8.0',
    '@mui/material': '5.11.0',
    '@emotion/react': '11.11.0',
    '@emotion/styled': '11.11.0',
    '@mui/icons-material': '5.11.0',
    axios: '1.3.0',
    recharts: '2.4.0',
  },
  devDependencies: {
    'react-scripts': '5.0.1',
    typescript: '5.0.0',
    '@types/react': '18.0.0',
    '@types/react-dom': '18.0.0',
  },
  eslintConfig: {
    extends: ['react-app'],
  },
  browserslist: {
    production: ['>0.2%', 'not dead', 'not op_mini all'],
    development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
  },
  proxy: 'http://localhost:3001',
};

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

Object.assign(packageJson, config);

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Package.json configured for React development');

