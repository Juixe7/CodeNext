const express = require('express');
const router = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { getProfile, getHeatmap, getLeaderboard, toggleBookmark, getStreak } = require('../controllers/userFeatures');
const { reviewCode } = require('../controllers/codeReview');

// Profile + streak
router.get('/profile', userMiddleware, getProfile);
router.get('/streak', userMiddleware, getStreak);

// Activity heatmap
router.get('/heatmap', userMiddleware, getHeatmap);

// Leaderboard (public but needs auth to know current user rank)
router.get('/leaderboard', userMiddleware, getLeaderboard);

// Bookmarks
router.post('/bookmark/:problemId', userMiddleware, toggleBookmark);

// AI code review
router.post('/review', userMiddleware, reviewCode);

module.exports = router;
