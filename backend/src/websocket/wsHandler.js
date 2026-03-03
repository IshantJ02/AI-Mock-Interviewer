/**
 * WebSocket handler for real-time interview features
 * Handles: live chat, real-time code analysis, voice transcription relay
 */
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const clients = new Map(); // userId -> Set<WebSocket>

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({
        server,
        path: '/ws',
        verifyClient: async ({ req }, done) => {
            // Extract token from query string
            const url = new URL(req.url, 'http://localhost');
            const token = url.searchParams.get('token');

            if (!token) {
                done(false, 401, 'Unauthorized');
                return;
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (!user) { done(false, 401, 'User not found'); return; }
                req.user = user;
                done(true);
            } catch {
                done(false, 401, 'Invalid token');
            }
        }
    });

    wss.on('connection', (ws, req) => {
        const userId = req.user._id.toString();

        // Register client
        if (!clients.has(userId)) clients.set(userId, new Set());
        clients.get(userId).add(ws);

        console.log(`🔌 WebSocket connected: ${req.user.email}`);

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await handleMessage(ws, req.user, message);
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            const userSet = clients.get(userId);
            if (userSet) {
                userSet.delete(ws);
                if (userSet.size === 0) clients.delete(userId);
            }
            console.log(`🔌 WebSocket disconnected: ${req.user.email}`);
        });

        ws.on('error', (err) => console.error('WebSocket error:', err));

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: `Welcome ${req.user.name}! Ready for your interview.`
        }));
    });

    return wss;
};

/**
 * Handle incoming WebSocket messages
 */
const handleMessage = async (ws, user, message) => {
    const { type, payload } = message;

    switch (type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'typing_start':
            // Broadcast typing indicator (useful for future multiplayer features)
            ws.send(JSON.stringify({ type: 'ai_thinking', message: 'Analyzing...' }));
            break;

        case 'voice_transcript':
            // Relay voice transcript for processing
            ws.send(JSON.stringify({
                type: 'transcript_received',
                payload: { text: payload.text, confidence: payload.confidence }
            }));
            break;

        case 'code_update':
            // Real-time code analysis trigger
            ws.send(JSON.stringify({
                type: 'analysis_queued',
                message: 'Code received for analysis'
            }));
            break;

        default:
            ws.send(JSON.stringify({ type: 'echo', payload }));
    }
};

/**
 * Send message to specific user's WebSocket connections
 */
const sendToUser = (userId, data) => {
    const userClients = clients.get(userId.toString());
    if (!userClients) return;

    const message = JSON.stringify(data);
    userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    });
};

module.exports = { setupWebSocket, sendToUser };
