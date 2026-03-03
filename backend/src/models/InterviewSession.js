const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['Google', 'Amazon', 'Meta', 'Startup', 'General'], default: 'General' },
    type: { type: String, enum: ['DSA', 'Behavioral', 'Mixed'], default: 'DSA' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },

    // Questions asked in this session
    questions: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        questionText: String,
        topic: String,
        userAnswer: String,       // Code or text answer
        userCode: String,          // Actual code submitted
        language: { type: String, default: 'python' },

        // AI feedback
        feedback: {
            score: { type: Number, min: 0, max: 100 },
            timeComplexity: String,
            spaceComplexity: String,
            optimalTimeComplexity: String,
            optimalSpaceComplexity: String,
            codeQuality: Number,      // 0-100
            edgeCasesCovered: Number, // 0-100
            strengths: [String],
            improvements: [String],
            detailedFeedback: String,
        },

        // Follow-up conversation
        followUpConversation: [{
            role: { type: String, enum: ['ai', 'user'] },
            content: String,
            timestamp: { type: Date, default: Date.now },
        }],

        executionResult: {
            passed: Boolean,
            output: String,
            error: String,
            executionTime: Number, // ms
        },

        startTime: { type: Date, default: Date.now },
        endTime: Date,
        timeTaken: Number, // seconds
    }],

    // Overall session score
    overallScore: { type: Number, min: 0, max: 100, default: 0 },

    // Behavioral scores (if behavioral session)
    behavioralScores: {
        clarity: Number,
        confidence: Number,
        starMethodAdherence: Number,
        relevance: Number,
    },

    // AI chat conversation history for the session
    conversationHistory: [{
        role: { type: String, enum: ['system', 'user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
    }],

    startTime: { type: Date, default: Date.now },
    endTime: Date,
    duration: Number, // minutes

    // Topics covered in this session
    topicsCovered: [String],

}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
