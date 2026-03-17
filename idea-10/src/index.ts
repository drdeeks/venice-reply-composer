#!/usr/bin/env node

import express from 'express';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes/api';
import { initializeScheduler } from './services/scheduler';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1', router);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = createServer(app);

server.listen(PORT, () => {
  const addr = server.address() as AddressInfo;
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Server listening on ${bind}`);
});

// Initialize background services
initializeScheduler().catch(err => {
  logger.error('Failed to initialize scheduler:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export { app, server };
