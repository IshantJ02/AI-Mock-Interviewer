const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./websocket/wsHandler');

const server = http.createServer(app);

// ─── WebSocket Setup (local dev only, not on Vercel) ─────────────────────────
setupWebSocket(server);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
