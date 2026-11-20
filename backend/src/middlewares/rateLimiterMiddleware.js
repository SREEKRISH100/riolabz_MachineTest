const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter for Authentication Endpoints (Login & Register)
 * Protects against brute-force password guessing, credential stuffing, and bot attacks.
 */
const authLimiter = rateLimit({
  windowMs: process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10)
    : 15 * 60 * 1000, // 15-minute window
  max: process.env.AUTH_RATE_LIMIT_MAX
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)
    : 5, // Limit each IP to 5 login/auth attempts per windowMs
  standardHeaders: true, // Return standard RateLimit-* headers (RFC draft)
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API Limiter for Public Endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
