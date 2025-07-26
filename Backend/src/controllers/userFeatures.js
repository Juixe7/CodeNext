const User = require('../models/user');
const Submission = require('../models/submission');
const Problem = require('../models/problem');
const Match = require('../models/match');
const Message = require('../models/message');

// ──────────────────────────────────────────────────────────────
// Helper: update streak when user gets an accepted submission
// ──────────────────────────────────────────────────────────────
const updateStreak = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = user.lastActiveDate
        ? new Date(new Date(user.lastActiveDate).getFullYear(),
                   new Date(user.lastActiveDate).getMonth(),
                   new Date(user.lastActiveDate).getDate())
        : null;

    if (!lastActive) {
        user.streak = 1;
    } else {
        const diffDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            // already active today — no change
        } else if (diffDays === 1) {
            user.streak += 1;  // consecutive day
        } else {
            user.streak = 1;   // streak broken
        }
    }
    user.lastActiveDate = now;
    await user.save();
    return user.streak;
};

// ──────────────────────────────────────────────────────────────
// GET /user/profile — returns user stats including streak
// ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.result._id)
            .select('-password')
            .populate({ path: 'problemSolved', select: '_id title difficulty tags' })
            .populate({ path: 'bookmarkedProblems', select: '_id title difficulty tags' });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Difficulty breakdown
        const solved = user.problemSolved || [];
        const stats = {
            total: solved.length,
            easy:   solved.filter(p => p.difficulty === 'easy').length,
            medium: solved.filter(p => p.difficulty === 'medium').length,
            hard:   solved.filter(p => p.difficulty === 'hard').length,
        };

        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailId: user.emailId,
            role: user.role,
            streak: user.streak || 0,
            lastActiveDate: user.lastActiveDate,
            problemSolved: user.problemSolved,
            bookmarkedProblems: user.bookmarkedProblems,
            stats,
            createdAt: user.createdAt,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /user/heatmap — submission activity for last 365 days
// ──────────────────────────────────────────────────────────────
const getHeatmap = async (req, res) => {
    try {
        const userId = req.query.userId || req.result._id;
        const since = new Date();
        since.setFullYear(since.getFullYear() - 1);

        const submissions = await Submission.find({
            userId,
            createdAt: { $gte: since }
        }).select('createdAt status');

        // Group by date string YYYY-MM-DD
        const heatmap = {};
        for (const sub of submissions) {
            const date = sub.createdAt.toISOString().split('T')[0];
            if (!heatmap[date]) heatmap[date] = { count: 0, accepted: 0 };
            heatmap[date].count++;
            if (sub.status === 'accepted') heatmap[date].accepted++;
        }

        res.status(200).json(heatmap);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /user/leaderboard — top 20 users by score
// ──────────────────────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('firstName lastName emailId problemSolved streak')
            .populate({ path: 'problemSolved', select: 'difficulty' })
            .lean();

        const scored = users.map(u => {
            const solved = u.problemSolved || [];
            const score =
                solved.filter(p => p.difficulty === 'easy').length * 1 +
                solved.filter(p => p.difficulty === 'medium').length * 3 +
                solved.filter(p => p.difficulty === 'hard').length * 5;
            return {
                _id: u._id,
                firstName: u.firstName,
                lastName: u.lastName,
                totalSolved: solved.length,
                easy:   solved.filter(p => p.difficulty === 'easy').length,
                medium: solved.filter(p => p.difficulty === 'medium').length,
                hard:   solved.filter(p => p.difficulty === 'hard').length,
                score,
                streak: u.streak || 0,
            };
        });

        scored.sort((a, b) => b.score - a.score || b.totalSolved - a.totalSolved);
        res.status(200).json(scored.slice(0, 20));
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// POST /user/bookmark/:problemId — toggle bookmark
// ──────────────────────────────────────────────────────────────
const toggleBookmark = async (req, res) => {
    try {
        const userId = req.result._id;
        const { problemId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const idx = user.bookmarkedProblems.findIndex(id => id.toString() === problemId);
        let bookmarked;
        if (idx === -1) {
            user.bookmarkedProblems.push(problemId);
            bookmarked = true;
        } else {
            user.bookmarkedProblems.splice(idx, 1);
            bookmarked = false;
        }
        await user.save();
        res.status(200).json({ bookmarked, bookmarkedProblems: user.bookmarkedProblems });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /user/streak — just the streak value + update it
// ──────────────────────────────────────────────────────────────
const getStreak = async (req, res) => {
    try {
        const user = await User.findById(req.result._id).select('streak lastActiveDate');
        res.status(200).json({ streak: user?.streak || 0, lastActiveDate: user?.lastActiveDate });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
// ──────────────────────────────────────────────────────────────
// GET /user/search?q= — Search users by name/email
// ──────────────────────────────────────────────────────────────
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.status(200).json([]);
        
        const regex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [{ firstName: regex }, { lastName: regex }, { emailId: regex }],
            role: 'user'
        }).select('firstName lastName emailId eloRating streak').limit(10);
        
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /user/public-profile/:id — Get another user's profile
// ──────────────────────────────────────────────────────────────
const getPublicProfile = async (req, res) => {
    try {
        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(req.params.id)
            .select('-password -emailId')
            .populate({ path: 'friends', select: 'firstName lastName eloRating' });
            
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Filter out any nulls from deleted/missing friends
        user.friends = user.friends ? user.friends.filter(f => f != null) : [];

        // Fetch submissions — wrapped so a failure here doesn't break the whole profile
        let submissions = [];
        try {
            submissions = await Submission.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate({ path: 'problemId', select: 'title difficulty' });
        } catch (subErr) {
            console.error('⚠️  Failed to fetch submissions for profile:', subErr.message);
        }

        // Fetch matches — wrapped independently
        let recentMatches = [];
        try {
            recentMatches = await Match.find({ 
                players: user._id, 
                status: 'finished' 
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({ path: 'problem', select: 'title difficulty' })
                .populate({ path: 'players', select: 'firstName lastName eloRating' })
                .populate({ path: 'winner', select: 'firstName lastName' });
        } catch (matchErr) {
            console.error('⚠️  Failed to fetch matches for profile:', matchErr.message);
        }

        // Check if the requesting user is a friend of this profile
        const isFriend = (req.result && user.friends.length > 0)
            ? user.friends.some(f => f._id && f._id.toString() === req.result._id.toString())
            : false;

        res.status(200).json({
            profile: user,
            recentSubmissions: submissions,
            recentMatches: recentMatches,
            isFriend
        });
    } catch (err) {
        console.error('❌ getPublicProfile error:', err.message, err.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// POST /user/friend/:id — Add or remove a friend
// ──────────────────────────────────────────────────────────────
const toggleFriend = async (req, res) => {
    try {
        const currentUserId = req.result._id;
        const targetUserId = req.params.id;
        
        if (currentUserId.toString() === targetUserId) {
            return res.status(400).json({ message: 'Cannot friend yourself' });
        }

        const currentUser = await User.findById(currentUserId);
        const idx = currentUser.friends.indexOf(targetUserId);
        
        let isFriend;
        if (idx === -1) {
            currentUser.friends.push(targetUserId);
            isFriend = true;
        } else {
            currentUser.friends.splice(idx, 1);
            isFriend = false;
        }
        await currentUser.save();
        
        res.status(200).json({ isFriend, friends: currentUser.friends });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ──────────────────────────────────────────────────────────────
// GET /user/messages/:friendId — Get chat history
// ──────────────────────────────────────────────────────────────
const getMessages = async (req, res) => {
    try {
        const currentUserId = req.result._id;
        const friendId = req.params.friendId;
        
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: friendId },
                { sender: friendId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 }).limit(100);
        
        res.status(200).json(messages);
    } catch (err) {
        console.error('getMessages error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProfile, getHeatmap, getLeaderboard, toggleBookmark, getStreak, updateStreak, searchUsers, getPublicProfile, toggleFriend, getMessages };
