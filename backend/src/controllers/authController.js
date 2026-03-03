const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password });
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: { user, accessToken },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const userWithoutPassword = user.toJSON();

        res.json({
            success: true,
            message: 'Login successful',
            data: { user: userWithoutPassword, accessToken },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const { accessToken, refreshToken } = generateTokens(decoded.id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, data: { accessToken } });
    } catch {
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
};

// Validation rules
const registerValidation = [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { register, login, refresh, logout, getMe, registerValidation, loginValidation };
