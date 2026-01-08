/**
 * Comfort Index Service
 * 
 * Calculates a comprehensive comfort index (0-100) based on weather parameters:
 * - Temperature (40% weight)
 * - Humidity (25% weight)
 * - Wind Speed (15% weight)
 * - Cloud Cover (10% weight)
 * - Visibility (10% weight)
 * 
 * Returns comfort level classification and detailed breakdown
 */

/**
 * Calculate temperature comfort score (0-100)
 * Ideal range: 18-24°C
 * @param {number} temp - Temperature in Celsius
 * @returns {number} Score 0-100
 */
const calculateTemperatureScore = (temp) => {
  // Perfect range: 18-24°C
  if (temp >= 18 && temp <= 24) {
    return 100;
  }
  
  // Good range: 15-18°C or 24-27°C
  if (temp >= 15 && temp < 18) {
    return 85 + ((temp - 15) / 3) * 15;
  }
  if (temp > 24 && temp <= 27) {
    return 85 + ((27 - temp) / 3) * 15;
  }
  
  // Acceptable range: 10-15°C or 27-32°C
  if (temp >= 10 && temp < 15) {
    return 60 + ((temp - 10) / 5) * 25;
  }
  if (temp > 27 && temp <= 32) {
    return 60 + ((32 - temp) / 5) * 25;
  }
  
  // Poor range: 5-10°C or 32-37°C
  if (temp >= 5 && temp < 10) {
    return 30 + ((temp - 5) / 5) * 30;
  }
  if (temp > 32 && temp <= 37) {
    return 30 + ((37 - temp) / 5) * 30;
  }
  
  // Very poor: below 5°C or above 37°C
  if (temp < 5) {
    return Math.max(0, 30 - ((5 - temp) / 5) * 30);
  }
  return Math.max(0, 30 - ((temp - 37) / 5) * 30);
};

/**
 * Calculate humidity comfort score (0-100)
 * Ideal range: 40-60%
 * @param {number} humidity - Humidity percentage
 * @returns {number} Score 0-100
 */
const calculateHumidityScore = (humidity) => {
  // Perfect range: 40-60%
  if (humidity >= 40 && humidity <= 60) {
    return 100;
  }
  
  // Good range: 30-40% or 60-70%
  if (humidity >= 30 && humidity < 40) {
    return 80 + ((humidity - 30) / 10) * 20;
  }
  if (humidity > 60 && humidity <= 70) {
    return 80 + ((70 - humidity) / 10) * 20;
  }
  
  // Acceptable range: 20-30% or 70-80%
  if (humidity >= 20 && humidity < 30) {
    return 50 + ((humidity - 20) / 10) * 30;
  }
  if (humidity > 70 && humidity <= 80) {
    return 50 + ((80 - humidity) / 10) * 30;
  }
  
  // Poor range: 10-20% or 80-90%
  if (humidity >= 10 && humidity < 20) {
    return 20 + ((humidity - 10) / 10) * 30;
  }
  if (humidity > 80 && humidity <= 90) {
    return 20 + ((90 - humidity) / 10) * 30;
  }
  
  // Very poor: below 10% or above 90%
  if (humidity < 10) {
    return Math.max(0, 20 - ((10 - humidity) / 10) * 20);
  }
  return Math.max(0, 20 - ((humidity - 90) / 10) * 20);
};

/**
 * Calculate wind speed comfort score (0-100)
 * Ideal: < 10 km/h
 * @param {number} windSpeed - Wind speed in m/s
 * @returns {number} Score 0-100
 */
const calculateWindScore = (windSpeed) => {
  const windKmh = windSpeed * 3.6; // Convert m/s to km/h
  
  // Perfect: 0-10 km/h (light breeze)
  if (windKmh <= 10) {
    return 100;
  }
  
  // Good: 10-20 km/h (gentle breeze)
  if (windKmh <= 20) {
    return 85 - ((windKmh - 10) / 10) * 15;
  }
  
  // Acceptable: 20-30 km/h (moderate breeze)
  if (windKmh <= 30) {
    return 60 - ((windKmh - 20) / 10) * 25;
  }
  
  // Poor: 30-50 km/h (fresh to strong breeze)
  if (windKmh <= 50) {
    return 35 - ((windKmh - 30) / 20) * 25;
  }
  
  // Very poor: 50-70 km/h (near gale to gale)
  if (windKmh <= 70) {
    return 10 - ((windKmh - 50) / 20) * 10;
  }
  
  // Extreme: above 70 km/h
  return Math.max(0, 10 - ((windKmh - 70) / 30) * 10);
};

/**
 * Calculate cloud cover comfort score (0-100)
 * Ideal: 20-50% (partly cloudy)
 * @param {number} cloudiness - Cloud cover percentage
 * @returns {number} Score 0-100
 */
const calculateCloudScore = (cloudiness) => {
  // Perfect: 20-50% (partly cloudy - ideal for comfort)
  if (cloudiness >= 20 && cloudiness <= 50) {
    return 100;
  }
  
  // Good: 10-20% or 50-70%
  if (cloudiness >= 10 && cloudiness < 20) {
    return 85 + ((cloudiness - 10) / 10) * 15;
  }
  if (cloudiness > 50 && cloudiness <= 70) {
    return 85 + ((70 - cloudiness) / 20) * 15;
  }
  
  // Acceptable: 0-10% or 70-85% (clear or mostly cloudy)
  if (cloudiness >= 0 && cloudiness < 10) {
    return 70 + (cloudiness / 10) * 15;
  }
  if (cloudiness > 70 && cloudiness <= 85) {
    return 60 + ((85 - cloudiness) / 15) * 25;
  }
  
  // Poor: 85-100% (overcast)
  if (cloudiness > 85 && cloudiness <= 100) {
    return Math.max(30, 60 - ((cloudiness - 85) / 15) * 30);
  }
  
  return 70; // Default for edge cases
};

/**
 * Calculate visibility comfort score (0-100)
 * Ideal: > 10 km
 * @param {number} visibility - Visibility in meters
 * @returns {number} Score 0-100
 */
const calculateVisibilityScore = (visibility) => {
  const visibilityKm = visibility / 1000; // Convert meters to km
  
  // Perfect: > 10 km (excellent visibility)
  if (visibilityKm >= 10) {
    return 100;
  }
  
  // Good: 5-10 km
  if (visibilityKm >= 5) {
    return 80 + ((visibilityKm - 5) / 5) * 20;
  }
  
  // Acceptable: 2-5 km
  if (visibilityKm >= 2) {
    return 50 + ((visibilityKm - 2) / 3) * 30;
  }
  
  // Poor: 1-2 km
  if (visibilityKm >= 1) {
    return 25 + ((visibilityKm - 1) / 1) * 25;
  }
  
  // Very poor: < 1 km (fog/mist)
  if (visibilityKm >= 0.5) {
    return 10 + ((visibilityKm - 0.5) / 0.5) * 15;
  }
  
  // Extremely poor: < 500m
  return Math.max(0, (visibilityKm / 0.5) * 10);
};

/**
 * Get comfort level classification based on score
 * @param {number} score - Comfort score (0-100)
 * @returns {object} Level classification with description and recommendation
 */
const getComfortLevel = (score) => {
  if (score >= 90) {
    return {
      level: 'Excellent',
      description: 'Perfect weather conditions for all activities',
      recommendation: 'Ideal time for outdoor activities and exercise',
      emoji: '⭐⭐⭐⭐⭐',
      color: '#2ecc71'
    };
  }
  
  if (score >= 75) {
    return {
      level: 'Very Good',
      description: 'Highly comfortable weather conditions',
      recommendation: 'Great for outdoor activities and sports',
      emoji: '⭐⭐⭐⭐',
      color: '#3498db'
    };
  }
  
  if (score >= 60) {
    return {
      level: 'Good',
      description: 'Pleasant weather conditions',
      recommendation: 'Suitable for most outdoor activities',
      emoji: '⭐⭐⭐',
      color: '#f39c12'
    };
  }
  
  if (score >= 45) {
    return {
      level: 'Fair',
      description: 'Acceptable weather conditions',
      recommendation: 'Consider weather factors before going out',
      emoji: '⭐⭐',
      color: '#e67e22'
    };
  }
  
  if (score >= 30) {
    return {
      level: 'Poor',
      description: 'Uncomfortable weather conditions',
      recommendation: 'Indoor activities recommended',
      emoji: '⭐',
      color: '#e74c3c'
    };
  }
  
  return {
    level: 'Very Poor',
    description: 'Severe weather conditions',
    recommendation: 'Stay indoors and take necessary precautions',
    emoji: '❌',
    color: '#c0392b'
  };
};

/**
 * Calculate overall comfort index
 * @param {object} weatherData - Weather data object
 * @param {number} weatherData.temp - Temperature in Celsius
 * @param {number} weatherData.humidity - Humidity percentage
 * @param {number} weatherData.wind_speed - Wind speed in m/s
 * @param {number} weatherData.clouds - Cloud cover percentage
 * @param {number} weatherData.visibility - Visibility in meters
 * @returns {object} Comfort index result with score, level, and breakdown
 */
const calculateComfortIndex = (weatherData) => {
  const { temp, humidity, wind_speed, clouds, visibility } = weatherData;
  
  // Validate input data
  if (temp === undefined || humidity === undefined || wind_speed === undefined) {
    throw new Error('Missing required weather parameters for comfort index calculation');
  }
  
  // Calculate individual scores
  const temperatureScore = calculateTemperatureScore(temp);
  const humidityScore = calculateHumidityScore(humidity);
  const windScore = calculateWindScore(wind_speed);
  const cloudScore = calculateCloudScore(clouds || 0);
  const visibilityScore = calculateVisibilityScore(visibility || 10000);
  
  // Apply weights
  const weights = {
    temperature: 0.40,  // 40%
    humidity: 0.25,     // 25%
    wind: 0.15,         // 15%
    cloud: 0.10,        // 10%
    visibility: 0.10    // 10%
  };
  
  // Calculate weighted final score
  const finalScore = (
    temperatureScore * weights.temperature +
    humidityScore * weights.humidity +
    windScore * weights.wind +
    cloudScore * weights.cloud +
    visibilityScore * weights.visibility
  );
  
  // Round to one decimal place
  const roundedScore = Math.round(finalScore * 10) / 10;
  
  // Get comfort level classification
  const classification = getComfortLevel(roundedScore);
  
  // Return comprehensive result
  return {
    score: roundedScore,
    level: classification.level,
    description: classification.description,
    recommendation: classification.recommendation,
    emoji: classification.emoji,
    color: classification.color,
    breakdown: {
      temperature: {
        score: Math.round(temperatureScore),
        weight: weights.temperature * 100,
        contribution: Math.round(temperatureScore * weights.temperature * 10) / 10
      },
      humidity: {
        score: Math.round(humidityScore),
        weight: weights.humidity * 100,
        contribution: Math.round(humidityScore * weights.humidity * 10) / 10
      },
      wind: {
        score: Math.round(windScore),
        weight: weights.wind * 100,
        contribution: Math.round(windScore * weights.wind * 10) / 10
      },
      cloud: {
        score: Math.round(cloudScore),
        weight: weights.cloud * 100,
        contribution: Math.round(cloudScore * weights.cloud * 10) / 10
      },
      visibility: {
        score: Math.round(visibilityScore),
        weight: weights.visibility * 100,
        contribution: Math.round(visibilityScore * weights.visibility * 10) / 10
      }
    },
    metadata: {
      temperature: `${temp}°C`,
      humidity: `${humidity}%`,
      windSpeed: `${(wind_speed * 3.6).toFixed(1)} km/h`,
      cloudCover: `${clouds || 0}%`,
      visibility: `${((visibility || 10000) / 1000).toFixed(1)} km`
    }
  };
};

/**
 * Calculate comfort index trend from historical data
 * @param {array} historicalData - Array of weather data with timestamps
 * @returns {object} Trend analysis
 */
const analyzeComfortTrend = (historicalData) => {
  if (!historicalData || historicalData.length === 0) {
    return { trend: 'insufficient_data', message: 'Not enough data for trend analysis' };
  }
  
  // Calculate comfort index for each data point
  const comfortScores = historicalData.map(data => {
    const comfortIndex = calculateComfortIndex({
      temp: data.temperature?.current || data.temp,
      humidity: data.humidity,
      wind_speed: data.wind?.speed || data.wind_speed,
      clouds: data.clouds,
      visibility: data.visibility
    });
    return {
      timestamp: data.timestamp,
      score: comfortIndex.score
    };
  });
  
  if (comfortScores.length < 2) {
    return { trend: 'insufficient_data', message: 'Need at least 2 data points' };
  }
  
  // Calculate trend
  const recentScore = comfortScores[comfortScores.length - 1].score;
  const previousScore = comfortScores[comfortScores.length - 2].score;
  const change = recentScore - previousScore;
  
  // Calculate average
  const avgScore = comfortScores.reduce((sum, item) => sum + item.score, 0) / comfortScores.length;
  
  // Determine trend
  let trend, trendDescription;
  if (change > 5) {
    trend = 'improving';
    trendDescription = 'Weather comfort is improving';
  } else if (change < -5) {
    trend = 'declining';
    trendDescription = 'Weather comfort is declining';
  } else {
    trend = 'stable';
    trendDescription = 'Weather comfort is stable';
  }
  
  return {
    trend,
    trendDescription,
    change: Math.round(change * 10) / 10,
    current: recentScore,
    previous: previousScore,
    average: Math.round(avgScore * 10) / 10,
    dataPoints: comfortScores.length,
    timeRange: {
      from: comfortScores[0].timestamp,
      to: comfortScores[comfortScores.length - 1].timestamp
    }
  };
};

module.exports = {
  calculateComfortIndex,
  analyzeComfortTrend,
  calculateTemperatureScore,
  calculateHumidityScore,
  calculateWindScore,
  calculateCloudScore,
  calculateVisibilityScore,
  getComfortLevel
};
