/**
 * Custom Weather Comfort Index Calculator
 * 
 * This comprehensive comfort index considers multiple weather factors:
 * - Temperature (ideal range: 18-24°C)
 * - Humidity (ideal range: 40-60%)
 * - Wind Speed (ideal: < 20 km/h)
 * - Pressure (ideal: 1013 ± 10 hPa)
 * - UV Index (if available)
 * - Precipitation (if any)
 * 
 * Returns a score from 0-100 where:
 * - 90-100: Excellent
 * - 75-89: Very Good
 * - 60-74: Good
 * - 45-59: Fair
 * - 30-44: Poor
 * - 0-29: Very Poor
 */

class ComfortIndex {
  /**
   * Calculate temperature comfort score
   * @param {number} temp - Temperature in Celsius
   * @returns {number} Score 0-100
   */
  static calculateTemperatureScore(temp) {
    const idealTemp = 21; // °C
    const idealRange = 6; // ±3°C from ideal
    
    if (temp >= 18 && temp <= 24) {
      return 100;
    } else if (temp >= 15 && temp < 18) {
      return 100 - ((18 - temp) / 3) * 20;
    } else if (temp > 24 && temp <= 27) {
      return 100 - ((temp - 24) / 3) * 20;
    } else if (temp >= 10 && temp < 15) {
      return 60 - ((15 - temp) / 5) * 30;
    } else if (temp > 27 && temp <= 32) {
      return 60 - ((temp - 27) / 5) * 30;
    } else if (temp < 10) {
      return Math.max(0, 30 - ((10 - temp) / 10) * 30);
    } else {
      return Math.max(0, 30 - ((temp - 32) / 10) * 30);
    }
  }

  /**
   * Calculate humidity comfort score
   * @param {number} humidity - Humidity percentage
   * @returns {number} Score 0-100
   */
  static calculateHumidityScore(humidity) {
    if (humidity >= 40 && humidity <= 60) {
      return 100;
    } else if (humidity >= 30 && humidity < 40) {
      return 100 - ((40 - humidity) / 10) * 20;
    } else if (humidity > 60 && humidity <= 70) {
      return 100 - ((humidity - 60) / 10) * 20;
    } else if (humidity >= 20 && humidity < 30) {
      return 60 - ((30 - humidity) / 10) * 30;
    } else if (humidity > 70 && humidity <= 80) {
      return 60 - ((humidity - 70) / 10) * 30;
    } else if (humidity < 20) {
      return Math.max(0, 30 - ((20 - humidity) / 20) * 30);
    } else {
      return Math.max(0, 30 - ((humidity - 80) / 20) * 30);
    }
  }

  /**
   * Calculate wind speed comfort score
   * @param {number} windSpeed - Wind speed in m/s
   * @returns {number} Score 0-100
   */
  static calculateWindScore(windSpeed) {
    const windKmh = windSpeed * 3.6; // Convert m/s to km/h
    
    if (windKmh <= 10) {
      return 100;
    } else if (windKmh <= 20) {
      return 100 - ((windKmh - 10) / 10) * 25;
    } else if (windKmh <= 40) {
      return 75 - ((windKmh - 20) / 20) * 35;
    } else if (windKmh <= 60) {
      return 40 - ((windKmh - 40) / 20) * 20;
    } else {
      return Math.max(0, 20 - ((windKmh - 60) / 40) * 20);
    }
  }

  /**
   * Calculate atmospheric pressure comfort score
   * @param {number} pressure - Pressure in hPa
   * @returns {number} Score 0-100
   */
  static calculatePressureScore(pressure) {
    const idealPressure = 1013; // hPa
    const deviation = Math.abs(pressure - idealPressure);
    
    if (deviation <= 5) {
      return 100;
    } else if (deviation <= 10) {
      return 100 - ((deviation - 5) / 5) * 15;
    } else if (deviation <= 20) {
      return 85 - ((deviation - 10) / 10) * 25;
    } else if (deviation <= 30) {
      return 60 - ((deviation - 20) / 10) * 30;
    } else {
      return Math.max(0, 30 - ((deviation - 30) / 20) * 30);
    }
  }

  /**
   * Calculate overall comfort index
   * @param {object} weatherData - Weather data object
   * @returns {object} Comfort index result
   */
  static calculate(weatherData) {
    const { temp, humidity, wind_speed, pressure, clouds, rain, snow, uvi } = weatherData;

    // Calculate individual scores
    const tempScore = this.calculateTemperatureScore(temp);
    const humidityScore = this.calculateHumidityScore(humidity);
    const windScore = this.calculateWindScore(wind_speed);
    const pressureScore = this.calculatePressureScore(pressure);

    // Precipitation penalty
    let precipitationPenalty = 0;
    if (rain && rain['1h']) {
      precipitationPenalty = Math.min(rain['1h'] * 5, 15);
    }
    if (snow && snow['1h']) {
      precipitationPenalty = Math.min(snow['1h'] * 8, 20);
    }

    // Cloud coverage adjustment (slight preference for some clouds)
    let cloudAdjustment = 0;
    if (clouds > 90) {
      cloudAdjustment = -5;
    } else if (clouds < 10) {
      cloudAdjustment = -3; // Very clear can be too sunny
    }

    // UV Index penalty (if available)
    let uvPenalty = 0;
    if (uvi !== undefined) {
      if (uvi > 8) {
        uvPenalty = 10;
      } else if (uvi > 6) {
        uvPenalty = 5;
      }
    }

    // Weighted average calculation
    const weights = {
      temperature: 0.35,
      humidity: 0.25,
      wind: 0.20,
      pressure: 0.20
    };

    let comfortScore = (
      tempScore * weights.temperature +
      humidityScore * weights.humidity +
      windScore * weights.wind +
      pressureScore * weights.pressure
    );

    // Apply penalties and adjustments
    comfortScore = comfortScore - precipitationPenalty + cloudAdjustment - uvPenalty;
    comfortScore = Math.max(0, Math.min(100, comfortScore));

    // Determine comfort level
    let level, description, recommendation;
    
    if (comfortScore >= 90) {
      level = 'Excellent';
      description = 'Perfect weather conditions';
      recommendation = 'Ideal for all outdoor activities';
    } else if (comfortScore >= 75) {
      level = 'Very Good';
      description = 'Highly comfortable weather';
      recommendation = 'Great for outdoor activities';
    } else if (comfortScore >= 60) {
      level = 'Good';
      description = 'Pleasant weather conditions';
      recommendation = 'Suitable for most outdoor activities';
    } else if (comfortScore >= 45) {
      level = 'Fair';
      description = 'Acceptable weather conditions';
      recommendation = 'Consider weather factors for outdoor plans';
    } else if (comfortScore >= 30) {
      level = 'Poor';
      description = 'Uncomfortable weather conditions';
      recommendation = 'Indoor activities recommended';
    } else {
      level = 'Very Poor';
      description = 'Severe weather conditions';
      recommendation = 'Stay indoors and take precautions';
    }

    return {
      score: Math.round(comfortScore * 10) / 10,
      level,
      description,
      recommendation,
      breakdown: {
        temperature: Math.round(tempScore),
        humidity: Math.round(humidityScore),
        wind: Math.round(windScore),
        pressure: Math.round(pressureScore)
      },
      penalties: {
        precipitation: Math.round(precipitationPenalty),
        clouds: cloudAdjustment,
        uv: uvPenalty
      }
    };
  }

  /**
   * Get comfort trend from historical data
   * @param {array} historicalData - Array of weather data with comfort scores
   * @returns {object} Trend analysis
   */
  static analyzeTrend(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const scores = historicalData.map(d => d.comfortIndex.score);
    const recentScore = scores[scores.length - 1];
    const previousScore = scores[scores.length - 2];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const change = recentScore - previousScore;
    let trend;

    if (change > 5) {
      trend = 'improving';
    } else if (change < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      change: Math.round(change * 10) / 10,
      average: Math.round(avgScore * 10) / 10,
      current: recentScore
    };
  }
}

module.exports = ComfortIndex;
