const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const userMiddleware = require('../middleware/userMiddleware');
const { getProfile, getHeatmap, getLeaderboard, toggleBookmark, getStreak, searchUsers, getPublicProfile, toggleFriend, getMessages } = require('../controllers/userFeatures');
const { reviewCode } = require('../controllers/codeReview');

// Rate limit: 5 code reviews per user per minute (more expensive)
const reviewLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.result?._id?.toString() || req.ip,
    message: { message: 'Too many review requests. Please wait before requesting another review.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Profile + streak
router.get('/profile', userMiddleware, getProfile);
router.get('/streak', userMiddleware, getStreak);

// Social Features
router.get('/search', userMiddleware, searchUsers);
router.get('/public-profile/:id', userMiddleware, getPublicProfile);
router.post('/friend/:id', userMiddleware, toggleFriend);
router.get('/messages/:friendId', userMiddleware, getMessages);

// Activity heatmap
router.get('/heatmap', userMiddleware, getHeatmap);

// Leaderboard (public but needs auth to know current user rank)
router.get('/leaderboard', userMiddleware, getLeaderboard);

// Bookmarks
router.post('/bookmark/:problemId', userMiddleware, toggleBookmark);

// AI code review
router.post('/review', userMiddleware, reviewLimiter, reviewCode);

module.exports = router;
