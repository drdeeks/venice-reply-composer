#!/usr/bin/env node

/**
 * Vite configuration for Uniswap v4 Hook Revenue Share project
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Project root
  root: '.',
  
  // Build output
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: 'src/index.ts',
    },
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@contracts': resolve(__dirname, 'contracts'),
      '@interfaces': resolve(__dirname, 'contracts/interfaces'),
      '@libraries': resolve(__dirname, 'contracts/libraries'),
      '@mocks': resolve(__dirname, 'contracts/mocks'),
      '@scripts': resolve(__dirname, 'scripts'),
      '@test': resolve(__dirname, 'test'),
    },
  },
  
  // TypeScript configuration
  typescript: {
    tsconfig: './tsconfig.json',
    useTsconfigDeclarationDir: true,
  },
  
  // Plugins
  plugins: [
    // TypeScript plugin
    // Other plugins can be added here
  ],
  
  // Development settings
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  
  // Optimization
  optimizeDeps: {
    exclude: ['@uniswap/v4-core', '@openzeppelin/contracts'],
  },
  
  // Testing configuration
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
  
  // Build options
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      external: [
        'forge-std',
        '@openzeppelin/contracts',
        '@uniswap/v4-core',
      ],
    },
  },
  
  // Development configuration
  dev: {
    port: 3000,
    open: '/index.html',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});