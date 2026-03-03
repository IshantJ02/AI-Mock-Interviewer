const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiLimiter, executionLimiter } = require('../middleware/rateLimiter');
const {
    startSession, getNextQuestion, submitAnswer, chat, endSession,
    runCode, analyzeCode, getSessions, getSession
} = require('../controllers/interviewController');

// All interview routes require authentication
router.use(authenticate);

router.post('/start', startSession);
router.post('/:sessionId/question', aiLimiter, getNextQuestion);
router.post('/:sessionId/submit', aiLimiter, submitAnswer);
router.post('/:sessionId/chat', aiLimiter, chat);
router.post('/:sessionId/end', endSession);
router.post('/execute', executionLimiter, runCode);
router.post('/analyze', aiLimiter, analyzeCode);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId', getSession);

module.exports = router;
