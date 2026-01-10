# WeatherFlow Backend API

A secure weather analytics API built with Node.js, Express, MongoDB, and Auth0 authentication.

## Features

- **Weather Data Retrieval**: Integration with OpenWeatherMap API
- **Custom Comfort Index**: Proprietary algorithm analyzing temperature, humidity, wind, pressure, and more
- **Auth0 Authentication**: Secure JWT-based authentication and authorization
- **Caching Layer**: Redis-like in-memory caching for optimal performance
- **Analytics Engine**: Historical data tracking and trend analysis
- **Security**: Helmet, rate limiting, CORS protection
- **MongoDB Storage**: Persistent data storage with efficient indexing

## Comfort Index Algorithm

### Formula Design & Reasoning

The custom Comfort Index is a weighted scoring system (0-100) that evaluates human comfort based on multiple weather parameters. The algorithm was designed based on meteorological research and human comfort zones.

**Parameters & Weights:**

1. **Temperature (40% weight)** - Most significant factor affecting human comfort
   - Ideal range: 18-24°C (64-75°F)
   - Perfect score at 20-22°C
   - Gradually decreases outside this range
   - Extreme temperatures (<5°C or >37°C) score very low

2. **Humidity (25% weight)** - Critical for perceived temperature and comfort
   - Ideal range: 40-60%
   - High humidity makes heat feel oppressive
   - Low humidity causes dry skin and respiratory discomfort
   - Extreme humidity (<20% or >80%) significantly impacts comfort

3. **Wind Speed (15% weight)** - Affects wind chill and perceived temperature
   - Ideal: <10 km/h (gentle breeze)
   - Moderate winds (10-30 km/h) slightly reduce comfort
   - Strong winds (>40 km/h) create discomfort and safety concerns

4. **Cloud Cover (10% weight)** - Influences mood and UV exposure
   - Ideal: 20-50% (partly cloudy)
   - Complete overcast or clear skies score lower
   - Moderate cloud cover provides pleasant conditions

5. **Visibility (10% weight)** - Indicates air quality and atmospheric conditions
   - Ideal: >8 km (clear visibility)
   - Reduced visibility suggests fog, pollution, or precipitation
   - Poor visibility (<2 km) indicates hazardous conditions

### Calculation Method

```
Comfort Index = (T_score × 0.40) + (H_score × 0.25) + (W_score × 0.15) + (C_score × 0.10) + (V_score × 0.10)
```

Each parameter is individually scored from 0-100 using specific curves, then weighted and summed for the final score.

**Score Ranges & Classifications:**
- 90-100: Excellent (Perfect weather conditions)
- 75-89: Very Good (Highly comfortable)
- 60-74: Good (Pleasant conditions)
- 45-59: Fair (Acceptable but not ideal)
- 30-44: Poor (Uncomfortable conditions)
- 0-29: Very Poor (Severe discomfort)

**Why This Formula?**

This algorithm prioritizes factors that humans physiologically respond to most strongly. Temperature and humidity together account for 65% of the score because they directly impact the body's ability to regulate temperature through sweating and heat exchange. Wind, cloud cover, and visibility contribute to overall perceived comfort but have less physiological impact, hence lower weights.

## Prerequisites

- Node.js 16+ and npm
- MongoDB 4.4+
- OpenWeatherMap API Key
- Auth0 Account (for authentication)

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weatherflow
WEATHER_API_KEY=your_openweathermap_api_key
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
CACHE_TTL=300
```

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Run the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Weather Endpoints

#### Get Current Weather
```http
GET /api/weather/current?city=London&country=UK
```

#### Get Weather by Coordinates
```http
GET /api/weather/coordinates?lat=51.5074&lon=-0.1278
```

#### Get 5-Day Forecast
```http
GET /api/weather/forecast?city=Paris
```

#### Get Historical Data (Protected)
```http
GET /api/weather/history?city=Tokyo&days=7
Authorization: Bearer <token>
```

#### Compare Multiple Cities
```http
POST /api/weather/compare
Content-Type: application/json

{
  "cities": ["London", "Paris", "Tokyo"]
}
```

### Analytics Endpoints

#### Get Comfort Analytics
```http
GET /api/analytics/comfort?city=London&days=7
```

#### Get User Statistics (Protected)
```http
GET /api/analytics/user/statistics?days=30
Authorization: Bearer <token>
```

#### Get Global Insights
```http
GET /api/analytics/global?days=7
```

## Auth0 Setup

1. Create an Auth0 account at https://auth0.com
2. Create a new API in Auth0 Dashboard
3. Copy the Domain and API Identifier to `.env`
4. Configure allowed callback URLs and CORS settings

## Response Examples

### Current Weather Response
```json
{
  "success": true,
  "data": {
    "city": "London",
    "country": "GB",
    "temperature": {
      "current": 18.5,
      "feels_like": 17.2,
      "min": 16.0,
      "max": 20.0
    },
    "humidity": 65,
    "pressure": 1015,
    "wind": {
      "speed": 3.5,
      "deg": 220
    },
    "comfortIndex": {
      "score": 82.5,
      "level": "Very Good",
      "description": "Highly comfortable weather",
      "recommendation": "Great for outdoor activities",
      "breakdown": {
        "temperature": 95,
        "humidity": 80,
        "wind": 85,
        "pressure": 98
      }
    }
  }
}
```

## Caching Strategy

- Weather data: 5 minutes TTL
- Forecast data: 10 minutes TTL
- Analytics: Dynamic based on query complexity

## Security Features

- JWT token validation
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- CORS protection
- MongoDB injection prevention
- Input validation

## Project Structure

```
WeatherFlow-BE/
├── controllers/        # Request handlers
├── middleware/        # Auth and validation
├── models/           # MongoDB schemas
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Helper functions
├── .env.example      # Environment template
├── server.js         # Application entry
└── package.json      # Dependencies
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```



