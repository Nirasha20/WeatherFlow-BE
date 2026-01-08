const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  favoriteLocations: [{
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lon: Number
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    temperatureUnit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    },
    windSpeedUnit: {
      type: String,
      enum: ['ms', 'kmh', 'mph'],
      default: 'ms'
    },
    pressureUnit: {
      type: String,
      enum: ['hpa', 'mmhg', 'inhg'],
      default: 'hpa'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: false
    },
    comfortAlerts: {
      type: Boolean,
      default: true
    }
  },
  lastAccess: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
