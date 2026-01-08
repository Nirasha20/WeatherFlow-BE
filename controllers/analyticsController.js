const WeatherData = require('../models/WeatherData');
const ComfortIndex = require('../utils/comfortIndex');

/**
 * Get comfort index analytics for a city
 */
const getComfortAnalytics = async (req, res) => {
  try {
    const { city, days = 7 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const data = await WeatherData.find({
      city: new RegExp(`^${city}$`, 'i'),
      timestamp: { $gte: daysAgo }
    })
    .sort({ timestamp: 1 })
    .select('comfortIndex temperature humidity wind pressure timestamp');

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified city'
      });
    }

    // Calculate statistics
    const scores = data.map(d => d.comfortIndex.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Get trend analysis
    const trend = ComfortIndex.analyzeTrend(data);

    // Calculate distribution
    const distribution = {
      excellent: scores.filter(s => s >= 90).length,
      veryGood: scores.filter(s => s >= 75 && s < 90).length,
      good: scores.filter(s => s >= 60 && s < 75).length,
      fair: scores.filter(s => s >= 45 && s < 60).length,
      poor: scores.filter(s => s >= 30 && s < 45).length,
      veryPoor: scores.filter(s => s < 30).length
    };

    // Find best and worst times
    const sortedByScore = [...data].sort((a, b) => 
      b.comfortIndex.score - a.comfortIndex.score
    );

    res.json({
      success: true,
      data: {
        city,
        period: `Last ${days} days`,
        statistics: {
          average: Math.round(avgScore * 10) / 10,
          maximum: maxScore,
          minimum: minScore,
          samples: data.length
        },
        trend,
        distribution,
        bestTime: {
          timestamp: sortedByScore[0].timestamp,
          score: sortedByScore[0].comfortIndex.score,
          level: sortedByScore[0].comfortIndex.level
        },
        worstTime: {
          timestamp: sortedByScore[sortedByScore.length - 1].timestamp,
          score: sortedByScore[sortedByScore.length - 1].comfortIndex.score,
          level: sortedByScore[sortedByScore.length - 1].comfortIndex.level
        },
        timeSeries: data.map(d => ({
          timestamp: d.timestamp,
          score: d.comfortIndex.score,
          level: d.comfortIndex.level,
          temperature: d.temperature.current,
          humidity: d.humidity
        }))
      }
    });
  } catch (error) {
    console.error('Error in getComfortAnalytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
};

/**
 * Get user's weather query statistics
 */
const getUserStatistics = async (req, res) => {
  try {
    if (!req.auth || !req.auth.sub) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.auth.sub;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const data = await WeatherData.find({
      userId,
      timestamp: { $gte: daysAgo }
    });

    // Calculate statistics
    const totalQueries = data.length;
    
    const citiesQueried = [...new Set(data.map(d => d.city))];
    
    const cityFrequency = data.reduce((acc, d) => {
      acc[d.city] = (acc[d.city] || 0) + 1;
      return acc;
    }, {});

    const mostQueriedCity = Object.entries(cityFrequency)
      .sort((a, b) => b[1] - a[1])[0];

    const avgComfortScore = data.reduce((sum, d) => 
      sum + d.comfortIndex.score, 0) / totalQueries;

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalQueries,
        uniqueCities: citiesQueried.length,
        mostQueriedCity: mostQueriedCity ? {
          city: mostQueriedCity[0],
          count: mostQueriedCity[1]
        } : null,
        averageComfortScore: Math.round(avgComfortScore * 10) / 10,
        citiesQueried,
        cityFrequency
      }
    });
  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
};

/**
 * Get global weather insights
 */
const getGlobalInsights = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const data = await WeatherData.find({
      timestamp: { $gte: daysAgo }
    });

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available'
      });
    }

    // Find cities with best and worst comfort scores
    const cityAverages = data.reduce((acc, d) => {
      if (!acc[d.city]) {
        acc[d.city] = {
          city: d.city,
          country: d.country,
          scores: [],
          count: 0
        };
      }
      acc[d.city].scores.push(d.comfortIndex.score);
      acc[d.city].count++;
      return acc;
    }, {});

    const cityStats = Object.values(cityAverages).map(city => ({
      city: city.city,
      country: city.country,
      avgScore: city.scores.reduce((a, b) => a + b, 0) / city.count,
      samples: city.count
    }));

    const sortedCities = cityStats.sort((a, b) => b.avgScore - a.avgScore);

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalSamples: data.length,
        uniqueCities: Object.keys(cityAverages).length,
        topCities: sortedCities.slice(0, 10),
        bottomCities: sortedCities.slice(-10).reverse()
      }
    });
  } catch (error) {
    console.error('Error in getGlobalInsights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global insights'
    });
  }
};

module.exports = {
  getComfortAnalytics,
  getUserStatistics,
  getGlobalInsights
};
