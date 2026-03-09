require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(apiLimiter);

// ─── MongoDB Connection (cached for serverless) ──────────────────────────────
let isConnected = false;
const ensureDB = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

// Connect DB before every request in serverless
app.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'NextUp.ai API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Export app for both Vercel serverless AND local dev
module.exports = app;
