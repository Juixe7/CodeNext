const express = require('express');
const aiRouter = express.Router();
const rateLimit = require('express-rate-limit');
const userMiddleware = require('../middleware/userMiddleware');
const solveDoubt = require('../controllers/solveDoubt');

// Rate limit: 15 AI requests per user per minute
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 15,
    keyGenerator: (req) => req.result?._id?.toString() || req.ip,
    message: { message: 'Too many AI requests. Please wait a moment before asking again.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.result,  // skip if auth not yet verified
});

aiRouter.post('/chat', userMiddleware, aiLimiter, solveDoubt);

module.exports = aiRouter;