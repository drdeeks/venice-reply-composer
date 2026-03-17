import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticationError } from './errorHandler';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId?: string;
  email?: string;
  type?: 'user' | 'admin' | 'service';
  iat?: number;
  exp?: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw authenticationError('No valid token provided');
    }

    const token = authHeader.substring(7);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw authenticationError('Authentication configuration missing on server');
    }

    const payload = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach user info to request
    (req as any).user = payload;
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error.message });
    if (error instanceof jwt.JsonWebTokenError) {
      throw authenticationError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw authenticationError('Token expired');
    }
    throw authenticationError('Authentication failed');
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;
      const payload = jwt.verify(token, jwtSecret) as JWTPayload;
      (req as any).user = payload;
    }
  } catch (error) {
    // Optional auth - just log and continue
    logger.debug('Optional auth failed', { error: error.message });
  }
  next();
};

// Permission checking middleware
export const requirePermission = (permission: 'admin' | 'transaction:create' | 'transaction:read') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw authenticationError('Authentication required');
    }

    // Simple role-based access control
    if (user.type === 'admin') {
      return next();
    }

    if (permission === 'transaction:create' && (user.type === 'user' || user.type === 'admin')) {
      return next();
    }

    if (permission === 'transaction:read' && user.type === 'admin') {
      return next();
    }

    throw authorizationError('Insufficient permissions');
  };
};