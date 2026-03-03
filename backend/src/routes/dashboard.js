const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardStats, getSkillHeatmap, updateProfile } = require('../controllers/dashboardController');

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/heatmap', getSkillHeatmap);
router.put('/profile', updateProfile);

module.exports = router;
