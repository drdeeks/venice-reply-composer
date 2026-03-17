import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Error ${req.method} ${req.url}:`, error);

  const statusCode = (error as any).statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}
