const User = require('../models/User');
const InterviewSession = require('../models/InterviewSession');

const TOPICS = [
    'arrays', 'strings', 'linkedLists', 'trees', 'graphs',
    'dynamicProgramming', 'recursion', 'slidingWindow',
    'twoPointers', 'binarySearch', 'sorting', 'hashMaps',
    'heaps', 'backtracking', 'greedy'
];

/**
 * Update user's skill map after completing an interview question
 * Uses exponential moving average to update scores over time
 */
const updateSkillMap = async (userId, topic, score) => {
    const user = await User.findById(userId);
    if (!user) return;

    // Normalize topic name (e.g. "Dynamic Programming" -> "dynamicProgramming")
    const normalizedTopic = normalizeTopic(topic);

    if (normalizedTopic && user.skillMap.hasOwnProperty(normalizedTopic)) {
        // Exponential moving average: new = old * 0.7 + new * 0.3
        const currentScore = user.skillMap[normalizedTopic] || 0;
        const updatedScore = Math.round(currentScore * 0.7 + score * 0.3);
        user.skillMap[normalizedTopic] = updatedScore;
    }

    await user.save();
    return user.skillMap;
};

/**
 * Detect weak topics based on skill map
 * Returns topics with score < 50
 */
const detectWeakTopics = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return [];

    const weakTopics = [];
    const skillMap = user.skillMap.toObject ? user.skillMap.toObject() : user.skillMap;

    for (const [topic, score] of Object.entries(skillMap)) {
        if (score < 50) {
            weakTopics.push({ topic, score });
        }
    }

    // Sort by score ascending (weakest first)
    weakTopics.sort((a, b) => a.score - b.score);

    // Update user's weak topics
    await User.findByIdAndUpdate(userId, {
        weakTopics: weakTopics.slice(0, 5).map(t => t.topic)
    });

    return weakTopics;
};

/**
 * Calculate overall user statistics from all sessions
 */
const calculateUserStats = async (userId) => {
    const sessions = await InterviewSession.find({
        userId,
        status: 'completed'
    }).sort({ createdAt: -1 });

    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalSessions;

    // Score trend (last 10 sessions)
    const recentSessions = sessions.slice(0, 10).reverse();
    const scoreTrend = recentSessions.map(s => ({
        date: s.createdAt,
        score: s.overallScore || 0,
        mode: s.mode,
        type: s.type,
    }));

    // Topics frequency
    const topicFrequency = {};
    sessions.forEach(session => {
        (session.topicsCovered || []).forEach(topic => {
            topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        });
    });

    return {
        totalSessions,
        averageScore: Math.round(averageScore),
        scoreTrend,
        topicFrequency,
        lastSession: sessions[0],
    };
};

/**
 * Normalize topic names from various formats to camelCase keys
 */
const normalizeTopic = (topic) => {
    const mapping = {
        'array': 'arrays', 'arrays': 'arrays',
        'string': 'strings', 'strings': 'strings',
        'linked list': 'linkedLists', 'linked lists': 'linkedLists', 'linkedlists': 'linkedLists',
        'tree': 'trees', 'trees': 'trees', 'binary tree': 'trees',
        'graph': 'graphs', 'graphs': 'graphs',
        'dynamic programming': 'dynamicProgramming', 'dp': 'dynamicProgramming', 'dynamicprogramming': 'dynamicProgramming',
        'recursion': 'recursion',
        'sliding window': 'slidingWindow', 'slidingwindow': 'slidingWindow',
        'two pointers': 'twoPointers', 'twopointers': 'twoPointers',
        'binary search': 'binarySearch', 'binarysearch': 'binarySearch',
        'sorting': 'sorting', 'sort': 'sorting',
        'hash map': 'hashMaps', 'hashmaps': 'hashMaps', 'hash table': 'hashMaps',
        'heap': 'heaps', 'heaps': 'heaps', 'priority queue': 'heaps',
        'backtracking': 'backtracking',
        'greedy': 'greedy',
    };

    const lower = (topic || '').toLowerCase().trim();
    return mapping[lower] || null;
};

/**
 * Generate personalized practice recommendations based on weak topics
 */
const generateRecommendations = async (userId) => {
    const weakTopics = await detectWeakTopics(userId);
    const user = await User.findById(userId);

    const recommendations = weakTopics.slice(0, 3).map(({ topic, score }) => ({
        topic,
        score,
        priority: score < 30 ? 'High' : score < 50 ? 'Medium' : 'Low',
        suggestedDifficulty: score < 30 ? 'Easy' : score < 50 ? 'Medium' : 'Medium',
        message: `Focus on ${topic} - you're at ${score}% mastery`,
    }));

    return recommendations;
};

module.exports = { updateSkillMap, detectWeakTopics, calculateUserStats, generateRecommendations, normalizeTopic };
