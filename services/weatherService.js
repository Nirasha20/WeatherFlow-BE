const axios = require('axios');
const cache = require('../utils/cache');
const { calculateComfortIndex } = require('./comfortIndexService');
const WeatherData = require('../models/WeatherData');

class WeatherService {
  constructor() {
    this.baseURL = process.env.WEATHER_API_URL;
    this.apiKey = process.env.WEATHER_API_KEY;
    console.log('🔑 API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'MISSING');
  }

  /**
   * Fetch current weather data by city code from OpenWeatherMap API
   * @param {string} cityCode - OpenWeatherMap city code
   * @returns {object} Weather data
   */
  async getWeatherByCityCode(cityCode) {
    const cacheKey = `weather:citycode:${cityCode}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✓ Cache hit for city code:', cacheKey);
      return cachedData;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?id=${cityCode}&appid=${this.apiKey}&units=metric`;
      const response = await axios.get(url);

      const data = this.formatWeatherData(response.data);
      
      // Cache the result
      cache.set(cacheKey, data, 300); // 5 minutes
      console.log('✓ Cached weather data for city code:', cityCode);

      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Fetch current weather data from OpenWeatherMap API
   * @param {string} city - City name
   * @param {string} country - Country code (optional)
   * @returns {object} Weather data
   */
  async getCurrentWeather(city, country = '') {
    const cacheKey = `weather:current:${city}:${country}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✓ Cache hit for:', cacheKey);
      return cachedData;
    }

    try {
      const query = country ? `${city},${country}` : city;
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          q: query,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = this.formatWeatherData(response.data);
      
      // Cache the result
      cache.set(cacheKey, data, 300); // 5 minutes
      console.log('✓ Cached weather data for:', cacheKey);

      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Fetch current weather by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {object} Weather data
   */
  async getWeatherByCoordinates(lat, lon) {
    const cacheKey = `weather:coords:${lat}:${lon}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✓ Cache hit for coordinates:', cacheKey);
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = this.formatWeatherData(response.data);
      cache.set(cacheKey, data, 300);

      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Fetch 5-day forecast
   * @param {string} city - City name
   * @param {string} country - Country code (optional)
   * @returns {object} Forecast data
   */
  async getForecast(city, country = '') {
    const cacheKey = `weather:forecast:${city}:${country}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✓ Cache hit for forecast:', cacheKey);
      return cachedData;
    }

    try {
      const query = country ? `${city},${country}` : city;
      const response = await axios.get(`${this.baseURL}/forecast`, {
        params: {
          q: query,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = this.formatForecastData(response.data);
      cache.set(cacheKey, data, 600); // 10 minutes

      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Format raw weather data and calculate comfort index
   * @param {object} rawData - Raw API response
   * @returns {object} Formatted weather data
   */
  formatWeatherData(rawData) {
    const weatherForComfort = {
      temp: rawData.main.temp,
      humidity: rawData.main.humidity,
      wind_speed: rawData.wind.speed,
      clouds: rawData.clouds.all,
      visibility: rawData.visibility
    };

    const comfortIndex = calculateComfortIndex(weatherForComfort);

    return {
      city: rawData.name,
      country: rawData.sys.country,
      coordinates: {
        lat: rawData.coord.lat,
        lon: rawData.coord.lon
      },
      temperature: {
        current: rawData.main.temp,
        feels_like: rawData.main.feels_like,
        min: rawData.main.temp_min,
        max: rawData.main.temp_max
      },
      humidity: rawData.main.humidity,
      pressure: rawData.main.pressure,
      wind: {
        speed: rawData.wind.speed,
        deg: rawData.wind.deg,
        gust: rawData.wind.gust
      },
      clouds: rawData.clouds.all,
      visibility: rawData.visibility,
      weather: {
        main: rawData.weather[0].main,
        description: rawData.weather[0].description,
        icon: rawData.weather[0].icon
      },
      rain: rawData.rain,
      snow: rawData.snow,
      comfortIndex,
      timestamp: new Date(rawData.dt * 1000)
    };
  }

  /**
   * Format forecast data
   * @param {object} rawData - Raw forecast API response
   * @returns {object} Formatted forecast data
   */
  formatForecastData(rawData) {
    const forecasts = rawData.list.map(item => {
      const weatherForComfort = {
        temp: item.main.temp,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        clouds: item.clouds.all,
        visibility: item.visibility || 10000
      };

      const comfortIndex = calculateComfortIndex(weatherForComfort);

      return {
        timestamp: new Date(item.dt * 1000),
        temperature: {
          current: item.main.temp,
          feels_like: item.main.feels_like,
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        wind: {
          speed: item.wind.speed,
          deg: item.wind.deg,
          gust: item.wind.gust
        },
        clouds: item.clouds.all,
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        },
        rain: item.rain,
        snow: item.snow,
        comfortIndex,
        pop: item.pop // Probability of precipitation
      };
    });

    return {
      city: rawData.city.name,
      country: rawData.city.country,
      coordinates: {
        lat: rawData.city.coord.lat,
        lon: rawData.city.coord.lon
      },
      forecasts
    };
  }

  /**
   * Save weather data to database
   * @param {object} weatherData - Formatted weather data
   * @param {string} userId - User ID (optional)
   * @returns {object} Saved document
   */
  async saveWeatherData(weatherData, userId = null) {
    try {
      const dataToSave = {
        ...weatherData,
        userId
      };

      const savedData = await WeatherData.create(dataToSave);
      return savedData;
    } catch (error) {
      console.error('Error saving weather data:', error);
      throw error;
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleAPIError(error) {
    if (error.response) {
      const status = error.response.status;
      let message = 'Weather API Error';

      switch (status) {
        case 401:
          message = 'Invalid API key';
          break;
        case 404:
          message = 'City not found';
          break;
        case 429:
          message = 'API rate limit exceeded';
          break;
        default:
          message = error.response.data.message || 'Weather API Error';
      }

      const err = new Error(message);
      err.status = status;
      return err;
    }

    return error;
  }
}

module.exports = new WeatherService();
