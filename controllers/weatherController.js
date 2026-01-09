const weatherService = require('../services/weatherService');
const WeatherData = require('../models/WeatherData');
const ComfortIndex = require('../utils/comfortIndex');
const citiesData = require('../data/cities.json');
const cache = require('../utils/cache');

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

/**
 * Get all cities weather data with comfort index rankings
 * Reads city codes from cities.json and fetches weather for each
 */
const getAllCitiesWeather = async (req, res) => {
  try {
    console.log('📍 Fetching weather for all cities from cities.json...');
    
    // Extract city codes from cities.json
    const cities = citiesData.cities;
    console.log(`✓ Found ${cities.length} cities to process`);

    // Fetch weather for all cities in parallel
    const weatherPromises = cities.map(city => 
      weatherService.getWeatherByCityCode(city.CityCode)
        .then(data => ({
          ...data,
          cityInfo: {
            name: city.CityName,
            country: city.Country,
            coordinates: city.Coordinates
          }
        }))
        .catch(error => {
          console.error(`❌ Failed to fetch weather for ${city.CityName}:`, error.message);
          return null;
        })
    );

    const weatherResults = await Promise.all(weatherPromises);

    // Filter out failed requests
    const successfulResults = weatherResults.filter(result => result !== null);
    console.log(`✓ Successfully fetched weather for ${successfulResults.length} cities`);

    // Sort by comfort index (highest to lowest)
    const rankedCities = successfulResults
      .sort((a, b) => b.comfortIndex.score - a.comfortIndex.score)
      .map((city, index) => ({
        rank: index + 1,
        city: city.name,
        country: city.country,
        coordinates: city.coord,
        weather: {
          description: city.weather.description,
          main: city.weather.main,
          icon: city.weather.icon
        },
        temperature: {
          current: city.temperature.current,
          feelsLike: city.temperature.feelsLike,
          min: city.temperature.min,
          max: city.temperature.max
        },
        humidity: city.humidity,
        windSpeed: city.windSpeed,
        cloudCover: city.cloudiness,
        visibility: city.visibility,
        pressure: city.pressure,
        comfortIndex: city.comfortIndex,
        timestamp: city.timestamp
      }));

    res.json({
      success: true,
      data: {
        cities: rankedCities,
        totalCities: rankedCities.length,
        timestamp: new Date().toISOString(),
        summary: {
          mostComfortable: rankedCities[0],
          leastComfortable: rankedCities[rankedCities.length - 1],
          averageComfortScore: (rankedCities.reduce((sum, city) => sum + city.comfortIndex.score, 0) / rankedCities.length).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllCitiesWeather:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities weather data'
    });
  }
};

/**
 * Get cache debug information
 * Shows cache hits, misses, and all cached keys
 */
const getCacheDebug = async (req, res) => {
  try {
    const debugInfo = cache.getDebugInfo();
    
    res.json({
      success: true,
      data: {
        ...debugInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getCacheDebug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache debug information'
    });
  }
};

/**
 * Flush all cache entries
 */
const flushCache = async (req, res) => {
  try {
    cache.flush();
    
    res.json({
      success: true,
      message: 'Cache flushed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in flushCache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to flush cache'
    });
  }
};

module.exports = {
  getCurrentWeather,
  getWeatherByCoordinates,
  getForecast,
  getHistoricalData,
  compareWeather,
  getAllCitiesWeather,
  getCacheDebug,
  flushCache
};
