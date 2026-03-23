const rateLimit = require('express-rate-limit');
const { getRedis } = require('../config/redis');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * AI endpoint rate limiter - more strict to control OpenAI costs
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'AI rate limit exceeded. Please wait before sending another request.' },
});

/**
 * Auth rate limiter - prevent brute force
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes.' },
});

/**
 * Code execution rate limiter
 */
const executionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, message: 'Code execution rate limit exceeded.' },
});

module.exports = { apiLimiter, aiLimiter, authLimiter, executionLimiter };
