const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { optionalAuth, checkJwt } = require('../middleware/auth');

// Public routes with optional authentication
router.get('/current', optionalAuth, weatherController.getCurrentWeather);
router.get('/coordinates', optionalAuth, weatherController.getWeatherByCoordinates);
router.get('/forecast', optionalAuth, weatherController.getForecast);
router.get('/all-cities', checkJwt, weatherController.getAllCitiesWeather);

// Cache debug endpoints (protected)
router.get('/cache/debug', checkJwt, weatherController.getCacheDebug);
router.post('/cache/flush', checkJwt, weatherController.flushCache);

// Protected routes (authentication required)
router.get('/history', checkJwt, weatherController.getHistoricalData);
router.post('/compare', checkJwt, weatherController.compareWeather);

module.exports = router;
