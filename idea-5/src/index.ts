import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { transactionRoutes } from './controllers/transactionController';
import { verificationRoutes } from './controllers/verificationController';
import { webhookRoutes } from './controllers/webhookController';
import { emailRoutes } from './controllers/emailController';
import { celoRoutes } from './controllers/celoController';
import { healthRoutes } from './controllers/healthController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https://api.self.xyz", "https://api.ampersend.io"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint (public)
app.use('/health', healthRoutes);

// Public API routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/celo', celoRoutes);

// Protected routes
app.use('/api/protected', authMiddleware, (req, res, next) => {
  // All routes under /api/protected require authentication
  next();
});

// Initialize database connection
createConnection({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development' ? 'all' : false,
  extra: {
    ssl: process.env.NODE_ENV === 'production',
  },
}).then(() => {
  console.log('Database connection established');
}).catch((error) => {
  console.error('Database connection error:', error);
  process.exit(1);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Email-Crypto Remittance API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;