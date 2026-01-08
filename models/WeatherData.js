const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    index: true
  },
  country: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  temperature: {
    current: { type: Number, required: true },
    feels_like: { type: Number, required: true },
    min: Number,
    max: Number
  },
  humidity: {
    type: Number,
    required: true
  },
  pressure: {
    type: Number,
    required: true
  },
  wind: {
    speed: { type: Number, required: true },
    deg: Number,
    gust: Number
  },
  clouds: {
    type: Number,
    default: 0
  },
  visibility: Number,
  weather: {
    main: String,
    description: String,
    icon: String
  },
  rain: {
    '1h': Number,
    '3h': Number
  },
  snow: {
    '1h': Number,
    '3h': Number
  },
  uvi: Number,
  comfortIndex: {
    score: { type: Number, required: true },
    level: { type: String, required: true },
    description: String,
    recommendation: String,
    breakdown: {
      temperature: Number,
      humidity: Number,
      wind: Number,
      pressure: Number
    },
    penalties: {
      precipitation: Number,
      clouds: Number,
      uv: Number
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
weatherDataSchema.index({ city: 1, timestamp: -1 });
weatherDataSchema.index({ userId: 1, timestamp: -1 });
weatherDataSchema.index({ 'comfortIndex.score': -1 });

// Virtual for age of data
weatherDataSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

module.exports = mongoose.model('WeatherData', weatherDataSchema);
