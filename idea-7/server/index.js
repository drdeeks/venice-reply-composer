require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const knex = require('knex');
const path = require('path');

const { validation } = require('./middleware/validation');
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { logger } = require('./utils/logger');

const creatorsRoutes = require('./routes/creators');
const tipsRoutes = require('./routes/tips');
const bankrRoutes = require('./routes/bankr');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../data/db.sqlite')
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
});

app.database = db;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Public routes
app.use('/api/health', healthRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/bankr', bankrRoutes);

// Protected routes (creator dashboard)
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handling
app.use(errorHandler);

// Database migrations
async function runMigrations() {
  try {
    await db.migrate.latest();
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}

// Start server
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  db.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  db.destroy();
  process.exit(0);
});

// Export for testing
module.exports = { app, db };

if (require.main === module) {
  start();
}