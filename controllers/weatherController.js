const weatherService = require('../services/weatherService');
const WeatherData = require('../models/WeatherData');
const ComfortIndex = require('../utils/comfortIndex');

/**
 * Get current weather for a city
 */
const getCurrentWeather = async (req, res) => {
  try {
    const { city, country } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const weatherData = await weatherService.getCurrentWeather(city, country);
    
    // Save to database if user is authenticated
    if (req.auth && req.auth.sub) {
      await weatherService.saveWeatherData(weatherData, req.auth.sub);
    }

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error in getCurrentWeather:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch weather data'
    });
  }
};

/**
 * Get weather by coordinates
 */
const getWeatherByCoordinates = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude parameters are required' 
      });
    }

    const weatherData = await weatherService.getWeatherByCoordinates(
      parseFloat(lat), 
      parseFloat(lon)
    );

    // Save to database if user is authenticated
    if (req.auth && req.auth.sub) {
      await weatherService.saveWeatherData(weatherData, req.auth.sub);
    }

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error in getWeatherByCoordinates:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch weather data'
    });
  }
};

/**
 * Get 5-day weather forecast
 */
const getForecast = async (req, res) => {
  try {
    const { city, country } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const forecastData = await weatherService.getForecast(city, country);

    res.json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    console.error('Error in getForecast:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch forecast data'
    });
  }
};

/**
 * Get historical weather data for a user
 */
const getHistoricalData = async (req, res) => {
  try {
    if (!req.auth || !req.auth.sub) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { city, days = 7, limit = 50 } = req.query;
    const userId = req.auth.sub;

    const query = { userId };
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    query.timestamp = { $gte: daysAgo };

    const historicalData = await WeatherData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    res.json({
      success: true,
      data: historicalData,
      count: historicalData.length
    });
  } catch (error) {
    console.error('Error in getHistoricalData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data'
    });
  }
};

/**
 * Compare weather between multiple cities
 */
const compareWeather = async (req, res) => {
  try {
    const { cities } = req.body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ 
        error: 'Cities array is required in request body' 
      });
    }

    if (cities.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 cities can be compared at once' 
      });
    }

    const weatherPromises = cities.map(city => 
      weatherService.getCurrentWeather(city)
    );

    const weatherResults = await Promise.allSettled(weatherPromises);

    const comparison = weatherResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          city: cities[index],
          success: true,
          data: result.value
        };
      } else {
        return {
          city: cities[index],
          success: false,
          error: result.reason.message
        };
      }
    });

    // Find best comfort index
    const successfulResults = comparison.filter(c => c.success);
    const bestComfort = successfulResults.reduce((best, current) => {
      return current.data.comfortIndex.score > best.data.comfortIndex.score 
        ? current 
        : best;
    }, successfulResults[0]);

    res.json({
      success: true,
      data: {
        comparison,
        bestComfort: bestComfort ? {
          city: bestComfort.city,
          score: bestComfort.data.comfortIndex.score,
          level: bestComfort.data.comfortIndex.level
        } : null
      }
    });
  } catch (error) {
    console.error('Error in compareWeather:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare weather data'
    });
  }
};

module.exports = {
  getCurrentWeather,
  getWeatherByCoordinates,
  getForecast,
  getHistoricalData,
  compareWeather
};
