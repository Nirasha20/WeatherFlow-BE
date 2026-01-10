const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuth, checkJwt } = require('../middleware/auth');

// Protected analytics routes (authentication required)
router.get('/comfort', checkJwt, analyticsController.getComfortAnalytics);
router.get('/global', checkJwt, analyticsController.getGlobalInsights);
router.get('/user/statistics', checkJwt, analyticsController.getUserStatistics);

module.exports = router;
