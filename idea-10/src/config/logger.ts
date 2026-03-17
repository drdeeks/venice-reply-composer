import winston from 'winston';
import { config } from './config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const loggerFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    loggerFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), loggerFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        loggerFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        loggerFormat
      ),
    }),
  ],
});

if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: combine(
      timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}
