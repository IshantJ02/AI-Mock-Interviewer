const User = require('../models/User');
const { calculateUserStats, generateRecommendations, detectWeakTopics } = require('../services/analyticsService');

/**
 * GET /api/dashboard/stats
 * Get complete dashboard statistics for the current user
 */
const getDashboardStats = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const stats = await calculateUserStats(req.user._id);
        const weakTopics = await detectWeakTopics(req.user._id);
        const recommendations = await generateRecommendations(req.user._id);

        res.json({
            success: true,
            data: {
                user,
                stats,
                skillMap: user.skillMap,
                weakTopics,
                recommendations,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
};

/**
 * GET /api/dashboard/heatmap
 * Get skill heatmap data
 */
const getSkillHeatmap = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('skillMap');

        const heatmapData = Object.entries(user.skillMap.toObject ? user.skillMap.toObject() : user.skillMap)
            .map(([topic, score]) => ({
                topic: topic.replace(/([A-Z])/g, ' $1').trim(), // camelCase to spaces
                score,
                level: score < 30 ? 'weak' : score < 60 ? 'developing' : score < 80 ? 'good' : 'excellent',
            }))
            .sort((a, b) => b.score - a.score);

        res.json({ success: true, data: { heatmap: heatmapData } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch heatmap' });
    }
};

/**
 * PUT /api/dashboard/profile
 * Update user profile
 */
const updateProfile = async (req, res) => {
    const { name, avatar } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, avatar },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

module.exports = { getDashboardStats, getSkillHeatmap, updateProfile };
