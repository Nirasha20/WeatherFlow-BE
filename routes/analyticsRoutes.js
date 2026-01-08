const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuth, checkJwt } = require('../middleware/auth');

// Public analytics routes
router.get('/comfort', analyticsController.getComfortAnalytics);
router.get('/global', analyticsController.getGlobalInsights);

// Protected analytics routes
router.get('/user/statistics', checkJwt, analyticsController.getUserStatistics);

module.exports = router;
