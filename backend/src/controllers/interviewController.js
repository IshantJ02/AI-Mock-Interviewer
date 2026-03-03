const InterviewSession = require('../models/InterviewSession');
const { generateQuestion, evaluateCode, evaluateBehavioral, generateBehavioralQuestion, chatWithInterviewer, analyzeComplexity } = require('../services/aiService');
const { executeCode } = require('../services/executionService');
const { updateSkillMap, detectWeakTopics } = require('../services/analyticsService');
const User = require('../models/User');

/**
 * POST /api/interview/start
 * Start a new interview session
 */
const startSession = async (req, res) => {
    const { mode = 'General', type = 'DSA', difficulty = 'Medium' } = req.body;

    try {
        const session = await InterviewSession.create({
            userId: req.user._id,
            mode,
            type,
            difficulty,
            status: 'active',
        });

        res.status(201).json({
            success: true,
            data: { sessionId: session._id, session },
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
};

/**
 * POST /api/interview/:sessionId/question
 * Generate next question for the session
 */
const getNextQuestion = async (req, res) => {
    const { sessionId } = req.params;
    const { topic } = req.body;

    try {
        const session = await InterviewSession.findOne({
            _id: sessionId,
            userId: req.user._id,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found or inactive' });
        }

        const previousTopics = session.questions.map(q => q.topic).filter(Boolean);

        let questionData;
        if (session.type === 'Behavioral') {
            const previousQs = session.questions.map(q => q.questionText);
            questionData = await generateBehavioralQuestion({
                companyMode: session.mode,
                previousQuestions: previousQs
            });
            questionData.isBehavioral = true;
        } else {
            // Choose random topic if not specified, biased towards weak topics
            const user = await User.findById(req.user._id);
            const selectedTopic = topic || selectTopic(user);

            questionData = await generateQuestion({
                topic: selectedTopic,
                difficulty: session.difficulty,
                companyMode: session.mode,
                previousTopics,
            });
        }

        // Add question to session (without answer yet)
        session.questions.push({
            questionText: questionData.question || questionData.title,
            topic: questionData.topic || 'General',
            startTime: new Date(),
        });
        await session.save();

        const newQuestionIndex = session.questions.length - 1;

        res.json({
            success: true,
            data: {
                questionIndex: newQuestionIndex,
                question: questionData,
            },
        });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate question' });
    }
};

/**
 * POST /api/interview/:sessionId/submit
 * Submit answer for evaluation
 */
const submitAnswer = async (req, res) => {
    const { sessionId } = req.params;
    const { questionIndex, code, language = 'python', textAnswer, questionText, isBehavioral = false } = req.body;

    try {
        const session = await InterviewSession.findOne({
            _id: sessionId,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        let feedback;
        let executionResult = null;

        if (isBehavioral) {
            // Evaluate behavioral answer
            feedback = await evaluateBehavioral({
                question: questionText,
                answer: textAnswer || code,
                companyMode: session.mode,
            });
        } else {
            // Execute code in sandbox
            if (code) {
                executionResult = await executeCode(code, language);
            }

            // Get AI evaluation
            feedback = await evaluateCode({
                question: questionText,
                code: code || textAnswer,
                language,
                companyMode: session.mode,
            });
        }

        // Update session question with answer and feedback
        if (session.questions[questionIndex]) {
            session.questions[questionIndex].userCode = code;
            session.questions[questionIndex].userAnswer = textAnswer || code;
            session.questions[questionIndex].language = language;
            session.questions[questionIndex].feedback = feedback;
            session.questions[questionIndex].executionResult = executionResult;
            session.questions[questionIndex].endTime = new Date();

            const startTime = session.questions[questionIndex].startTime;
            if (startTime) {
                session.questions[questionIndex].timeTaken =
                    Math.round((new Date() - new Date(startTime)) / 1000);
            }
        }

        // Recalculate overall session score
        const scoredQuestions = session.questions.filter(q => q.feedback?.score != null);
        if (scoredQuestions.length > 0) {
            session.overallScore = Math.round(
                scoredQuestions.reduce((sum, q) => sum + q.feedback.score, 0) / scoredQuestions.length
            );
        }

        await session.save();

        // Update user skill map
        const topic = session.questions[questionIndex]?.topic;
        if (topic && feedback.score != null) {
            await updateSkillMap(req.user._id, topic, feedback.score);
        }

        res.json({
            success: true,
            data: {
                feedback,
                executionResult,
                sessionScore: session.overallScore,
            },
        });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ success: false, message: 'Failed to evaluate answer' });
    }
};

/**
 * POST /api/interview/:sessionId/chat
 * Chat with AI interviewer during session
 */
const chat = async (req, res) => {
    const { sessionId } = req.params;
    const { message, questionContext } = req.body;

    try {
        const session = await InterviewSession.findOne({
            _id: sessionId,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Build message history for context
        const history = session.conversationHistory.slice(-10).map(h => ({
            role: h.role === 'ai' ? 'assistant' : h.role,
            content: h.content,
        }));

        history.push({ role: 'user', content: message });

        const aiResponse = await chatWithInterviewer({
            messages: history,
            companyMode: session.mode,
            context: questionContext || '',
        });

        // Save conversation to session
        session.conversationHistory.push({ role: 'user', content: message });
        session.conversationHistory.push({ role: 'assistant', content: aiResponse });
        await session.save();

        res.json({
            success: true,
            data: { response: aiResponse },
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to get AI response' });
    }
};

/**
 * POST /api/interview/:sessionId/end
 * End the interview session
 */
const endSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await InterviewSession.findOne({
            _id: sessionId,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        session.status = 'completed';
        session.endTime = new Date();
        session.duration = Math.round((new Date() - new Date(session.startTime)) / 60000);

        // Collect all topics covered
        session.topicsCovered = [...new Set(session.questions.map(q => q.topic).filter(Boolean))];

        await session.save();

        // Update user overall stats
        await updateUserStats(req.user._id);

        // Get weak topics after session
        const weakTopics = await detectWeakTopics(req.user._id);

        res.json({
            success: true,
            data: {
                session,
                weakTopics,
                message: 'Interview session completed successfully',
            },
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ success: false, message: 'Failed to end session' });
    }
};

/**
 * POST /api/interview/execute
 * Quick code execution endpoint (without session context)
 */
const runCode = async (req, res) => {
    const { code, language, stdin = '' } = req.body;

    try {
        const result = await executeCode(code, language, stdin);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Execution failed' });
    }
};

/**
 * POST /api/interview/analyze-complexity
 */
const analyzeCode = async (req, res) => {
    const { code, language } = req.body;

    try {
        const analysis = await analyzeComplexity({ code, language });
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analysis failed' });
    }
};

/**
 * GET /api/interview/sessions
 * Get user's interview history
 */
const getSessions = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const sessions = await InterviewSession.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-conversationHistory -questions.followUpConversation');

        const total = await InterviewSession.countDocuments({ userId: req.user._id });

        res.json({
            success: true,
            data: {
                sessions,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get sessions' });
    }
};

/**
 * GET /api/interview/sessions/:sessionId
 */
const getSession = async (req, res) => {
    try {
        const session = await InterviewSession.findOne({
            _id: req.params.sessionId,
            userId: req.user._id,
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, data: { session } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get session' });
    }
};

// Helper to update user stats
const updateUserStats = async (userId) => {
    const sessions = await InterviewSession.find({ userId, status: 'completed' });
    if (sessions.length === 0) return;

    const avgScore = sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

    await User.findByIdAndUpdate(userId, {
        'stats.totalInterviews': sessions.length,
        'stats.averageScore': Math.round(avgScore),
        'stats.totalQuestionsAnswered': totalQuestions,
        'stats.lastInterviewDate': new Date(),
    });
};

// Select topic based on user weaknesses (biased random selection)
const selectTopic = (user) => {
    const TOPICS_LIST = [
        'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
        'Dynamic Programming', 'Recursion', 'Sliding Window',
        'Two Pointers', 'Binary Search', 'Sorting', 'Hash Maps'
    ];

    // 60% chance to pick a weak topic if user has them
    if (user?.weakTopics?.length > 0 && Math.random() < 0.6) {
        const weakTopic = user.weakTopics[Math.floor(Math.random() * user.weakTopics.length)];
        // Convert camelCase back to display format
        return weakTopic.replace(/([A-Z])/g, ' $1').trim();
    }

    return TOPICS_LIST[Math.floor(Math.random() * TOPICS_LIST.length)];
};

module.exports = { startSession, getNextQuestion, submitAnswer, chat, endSession, runCode, analyzeCode, getSessions, getSession };
