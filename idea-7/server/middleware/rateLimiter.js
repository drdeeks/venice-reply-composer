const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client if available
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

// General rate limiter
const generalLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:'
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiter (stricter for sensitive endpoints)
const apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:api:'
  }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per hour
  message: { error: 'API rate limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Tipping endpoint rate limiter
const tippingLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:tipping:'
  }) : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 tips per minute
  message: { error: 'Too many tip attempts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Bankr API rate limiter
const bankrLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:bankr:'
  }) : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 Bankr calls per minute
  message: { error: 'Bankr API rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  rateLimiter: generalLimiter,
  apiLimiter,
  tippingLimiter,
  bankrLimiter
};