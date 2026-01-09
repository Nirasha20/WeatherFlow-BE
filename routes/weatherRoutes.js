const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { optionalAuth, checkJwt } = require('../middleware/auth');

// Public routes with optional authentication
router.get('/current', optionalAuth, weatherController.getCurrentWeather);
router.get('/coordinates', optionalAuth, weatherController.getWeatherByCoordinates);
router.get('/forecast', optionalAuth, weatherController.getForecast);
router.get('/all-cities', weatherController.getAllCitiesWeather);

// Cache debug endpoints
router.get('/cache/debug', weatherController.getCacheDebug);
router.post('/cache/flush', weatherController.flushCache);

// Protected routes (authentication required)
router.get('/history', checkJwt, weatherController.getHistoricalData);
router.post('/compare', optionalAuth, weatherController.compareWeather);

module.exports = router;
