import rateLimit, { Options as RateLimitOptions } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Configurable rate limits based on environment
const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // General API rate limiting
    windowMs: isProduction ? 60 * 60 * 1000 : 60 * 1000, // 1 hour in production, 1 minute in dev
    max: isProduction ? 1000 : 100, // max requests per window
    standardHeaders: true, // Return RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: { error: 'Too many requests, please try again later.' },
    statusCode: 429,
    // Skip rate limiting for health checks
    skip: (req: Request) => {
      return req.path.startsWith('/health') || req.path.startsWith('/api/webhooks');
    },
    // Handler to log rate limit hits
    handler: (req: Request, res: Response, next: NextFunction, options?: RateLimitOptions) => {
      const log = require('../utils/logger').logger;
      log.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });
      res.status(options?.statusCode || 429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.round((options?.windowMs || 60000) / 1000),
      });
    },
  } as RateLimitOptions;
};

// More restrictive rate limit for sensitive endpoints
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many attempts, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for transaction creation (protect against spam)
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 transaction attempts per minute
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    // Rate limit by email if provided, fall back to IP
    return req.body?.recipientEmail || req.ip;
  },
  message: { error: 'Too many transaction attempts, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Apply general rate limiting
  const generalLimiter = rateLimit(getRateLimitConfig());
  return generalLimiter(req, res, (error?: any) => {
    if (error) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(getRateLimitConfig().windowMs / 1000),
      });
    }
    next();
  });
};

export const sensitiveRateLimiter = rateLimit({
  ...getRateLimitConfig(),
  max: 10,
  windowMs: 60 * 60 * 1000,
});

export const verifyEmailLimiter = (req: Request, res: Response, next: NextFunction) => {
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req: Request) => req.body?.email || req.ip,
    message: { error: 'Too many verification attempts for this email.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  return limiter(req, res, next);
};

export const webhookLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Webhooks are verified separately but we still limit based on secret
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  return limiter(req, res, next);
};

export { sensitiveLimiter, transactionLimiter };