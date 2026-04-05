const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);  // 15 min
const max      = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100',  10);
const authMax  = parseInt(process.env.AUTH_RATE_LIMIT_MAX    || '20',   10);

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
  });
};

/** General API rate limiter */
const apiRateLimiter = rateLimit({ windowMs, max, handler, standardHeaders: true, legacyHeaders: false });

/** Stricter limiter for auth routes */
const authRateLimiter = rateLimit({ windowMs, max: authMax, handler, standardHeaders: true, legacyHeaders: false });

module.exports = { apiRateLimiter, authRateLimiter };
