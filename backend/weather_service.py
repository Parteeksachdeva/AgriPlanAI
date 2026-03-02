"""
Weather Service for AgriPlanAI
Integrates with OpenWeatherMap API to fetch real-time weather data
and provide climate-based yield adjustments.
"""

import os
import requests
import pandas as pd
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# State to major city mapping for weather lookup
STATE_CITIES = {
    'Punjab': 'Ludhiana',
    'Haryana': 'Chandigarh',
    'Uttar Pradesh': 'Lucknow',
    'Madhya Pradesh': 'Bhopal',
    'Rajasthan': 'Jaipur',
    'Maharashtra': 'Mumbai',
    'Gujarat': 'Ahmedabad',
    'Karnataka': 'Bangalore',
    'Andhra Pradesh': 'Hyderabad',
    'Telangana': 'Hyderabad',
    'Tamil Nadu': 'Chennai',
    'Kerala': 'Kochi',
    'West Bengal': 'Kolkata',
    'Bihar': 'Patna',
    'Odisha': 'Bhubaneswar',
    'Assam': 'Guwahati',
    'Chhattisgarh': 'Raipur',
    'Jharkhand': 'Ranchi',
    'Uttarakhand': 'Dehradun',
    'Himachal Pradesh': 'Shimla'
}

# Historical climate normals (average temperature, humidity, rainfall) by state
STATE_CLIMATE_NORMALS = {
    'Punjab': {'temp': 24.5, 'humidity': 65, 'rainfall': 650},
    'Haryana': {'temp': 25.0, 'humidity': 62, 'rainfall': 580},
    'Uttar Pradesh': {'temp': 26.0, 'humidity': 60, 'rainfall': 900},
    'Madhya Pradesh': {'temp': 27.0, 'humidity': 58, 'rainfall': 1100},
    'Rajasthan': {'temp': 28.0, 'humidity': 50, 'rainfall': 500},
    'Maharashtra': {'temp': 27.0, 'humidity': 70, 'rainfall': 1200},
    'Gujarat': {'temp': 28.0, 'humidity': 65, 'rainfall': 800},
    'Karnataka': {'temp': 25.0, 'humidity': 72, 'rainfall': 1100},
    'Andhra Pradesh': {'temp': 28.0, 'humidity': 68, 'rainfall': 1000},
    'Telangana': {'temp': 28.0, 'humidity': 65, 'rainfall': 950},
    'Tamil Nadu': {'temp': 28.0, 'humidity': 75, 'rainfall': 950},
    'Kerala': {'temp': 27.0, 'humidity': 85, 'rainfall': 3000},
    'West Bengal': {'temp': 26.5, 'humidity': 80, 'rainfall': 1600},
    'Bihar': {'temp': 26.0, 'humidity': 75, 'rainfall': 1200},
    'Odisha': {'temp': 27.0, 'humidity': 78, 'rainfall': 1450},
    'Assam': {'temp': 24.0, 'humidity': 82, 'rainfall': 2400},
    'Chhattisgarh': {'temp': 26.5, 'humidity': 70, 'rainfall': 1300},
    'Jharkhand': {'temp': 25.5, 'humidity': 72, 'rainfall': 1350},
    'Uttarakhand': {'temp': 22.0, 'humidity': 68, 'rainfall': 1400},
    'Himachal Pradesh': {'temp': 18.0, 'humidity': 65, 'rainfall': 1500}
}


class WeatherService:
    """
    Service to fetch and process weather data for agricultural predictions.
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.use_api = self.api_key is not None
        
    def get_current_weather(self, state: str) -> Dict:
        """
        Get current weather for a state.
        Falls back to climate normals if API is not available.
        """
        if self.use_api:
            try:
                city = STATE_CITIES.get(state, state)
                url = f"{self.base_url}/weather"
                params = {
                    'q': f"{city},IN",
                    'appid': self.api_key,
                    'units': 'metric'
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'temperature': data['main']['temp'],
                        'humidity': data['main']['humidity'],
                        'rainfall_mm': data.get('rain', {}).get('1h', 0) * 24,  # Estimate daily
                        'description': data['weather'][0]['description'],
                        'source': 'api',
                        'state': state
                    }
            except Exception as e:
                print(f"Weather API error: {e}")
        
        # Fallback to climate normals
        return self._get_climate_normal(state)
    
    def get_weather_forecast(self, state: str, days: int = 7) -> list:
        """
        Get weather forecast for upcoming days.
        """
        if self.use_api:
            try:
                city = STATE_CITIES.get(state, state)
                url = f"{self.base_url}/forecast"
                params = {
                    'q': f"{city},IN",
                    'appid': self.api_key,
                    'units': 'metric',
                    'cnt': days * 8  # 3-hour intervals
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    # Aggregate daily forecasts
                    daily_data = {}
                    for item in data['list']:
                        date = item['dt_txt'][:10]
                        if date not in daily_data:
                            daily_data[date] = {'temps': [], 'humidity': [], 'rain': 0}
                        daily_data[date]['temps'].append(item['main']['temp'])
                        daily_data[date]['humidity'].append(item['main']['humidity'])
                        if 'rain' in item and '3h' in item['rain']:
                            daily_data[date]['rain'] += item['rain']['3h']
                    
                    forecasts = []
                    for date, vals in list(daily_data.items())[:days]:
                        forecasts.append({
                            'date': date,
                            'temperature': round(sum(vals['temps']) / len(vals['temps']), 1),
                            'humidity': round(sum(vals['humidity']) / len(vals['humidity'])),
                            'rainfall_mm': round(vals['rain'], 1),
                            'source': 'api'
                        })
                    return forecasts
            except Exception as e:
                print(f"Forecast API error: {e}")
        
        # Fallback to climate normals
        return [self._get_climate_normal(state) for _ in range(days)]
    
    def _get_climate_normal(self, state: str) -> Dict:
        """Get climate normal data for a state."""
        normals = STATE_CLIMATE_NORMALS.get(state, {
            'temp': 25.0, 'humidity': 70, 'rainfall': 1000
        })
        return {
            'temperature': normals['temp'],
            'humidity': normals['humidity'],
            'rainfall_mm': normals['rainfall'] / 365,  # Daily average
            'description': 'Climate normal',
            'source': 'climate_normal',
            'state': state
        }
    
    def calculate_yield_adjustment(self, state: str, crop: str, 
                                    current_weather: Dict = None) -> Dict:
        """
        Calculate yield adjustment factors based on current weather vs optimal.
        """
        if current_weather is None:
            current_weather = self.get_current_weather(state)
        
        # Get optimal conditions for crop
        crop_optimal = self._get_crop_optimal_conditions(crop)
        
        # Calculate deviations
        temp_dev = current_weather['temperature'] - crop_optimal['temp']
        humidity_dev = current_weather['humidity'] - crop_optimal['humidity']
        
        # Temperature factor (optimal ±3°C = 1.0, ±5°C = 0.9, beyond = 0.8)
        if abs(temp_dev) <= 3:
            temp_factor = 1.0
        elif abs(temp_dev) <= 5:
            temp_factor = 0.95
        elif abs(temp_dev) <= 8:
            temp_factor = 0.85
        else:
            temp_factor = 0.75
        
        # Humidity factor
        if abs(humidity_dev) <= 10:
            humidity_factor = 1.0
        elif abs(humidity_dev) <= 20:
            humidity_factor = 0.95
        else:
            humidity_factor = 0.90
        
        # Combined adjustment
        adjustment = temp_factor * humidity_factor
        
        return {
            'adjustment_factor': round(adjustment, 3),
            'temperature_factor': round(temp_factor, 3),
            'humidity_factor': round(humidity_factor, 3),
            'current_conditions': current_weather,
            'optimal_conditions': crop_optimal,
            'recommendation': self._get_weather_recommendation(
                temp_dev, humidity_dev, crop
            )
        }
    
    def _get_crop_optimal_conditions(self, crop: str) -> Dict:
        """Get optimal growing conditions for a crop."""
        optimal_conditions = {
            'rice': {'temp': 28, 'humidity': 80, 'rainfall': 1500},
            'wheat': {'temp': 20, 'humidity': 60, 'rainfall': 500},
            'maize': {'temp': 25, 'humidity': 65, 'rainfall': 600},
            'cotton': {'temp': 30, 'humidity': 70, 'rainfall': 800},
            'sugarcane': {'temp': 28, 'humidity': 75, 'rainfall': 1200},
            'chickpea': {'temp': 22, 'humidity': 55, 'rainfall': 400},
            'mustard': {'temp': 20, 'humidity': 60, 'rainfall': 350},
            'potato': {'temp': 18, 'humidity': 70, 'rainfall': 500},
            'tomato': {'temp': 24, 'humidity': 70, 'rainfall': 600},
            'onion': {'temp': 22, 'humidity': 65, 'rainfall': 400},
            'default': {'temp': 25, 'humidity': 70, 'rainfall': 800}
        }
        return optimal_conditions.get(crop.lower(), optimal_conditions['default'])
    
    def _get_weather_recommendation(self, temp_dev: float, humidity_dev: float, crop: str) -> str:
        """Generate weather-based recommendations."""
        recommendations = []
        
        if temp_dev > 5:
            recommendations.append(f"High temperature stress expected. Consider irrigation scheduling.")
        elif temp_dev < -5:
            recommendations.append(f"Cooler than optimal. Monitor for delayed growth.")
        
        if abs(humidity_dev) > 20:
            if humidity_dev > 0:
                recommendations.append("High humidity - watch for fungal diseases.")
            else:
                recommendations.append("Low humidity - ensure adequate soil moisture.")
        
        if not recommendations:
            return "Weather conditions are favorable for crop growth."
        
        return " ".join(recommendations)
    
    def get_seasonal_weather_outlook(self, state: str, season: str) -> Dict:
        """
        Get seasonal weather outlook for a state.
        Returns expected conditions for the season.
        """
        season_months = {
            'kharif': [6, 7, 8, 9, 10],  # June-Oct
            'rabi': [11, 12, 1, 2, 3],   # Nov-Mar
            'zaid': [4, 5],               # Apr-May
            'whole year': list(range(1, 13))
        }
        
        months = season_months.get(season.lower(), season_months['whole year'])
        normals = STATE_CLIMATE_NORMALS.get(state, {'temp': 25, 'humidity': 70, 'rainfall': 1000})
        
        # Seasonal adjustments
        if season.lower() == 'kharif':
            temp_adj = 2  # Warmer during monsoon
            rain_adj = 3  # Heavy rainfall
        elif season.lower() == 'rabi':
            temp_adj = -5  # Cooler winter
            rain_adj = 0.2  # Minimal rainfall
        elif season.lower() == 'zaid':
            temp_adj = 5  # Hot summer
            rain_adj = 0.1  # Very dry
        else:
            temp_adj = 0
            rain_adj = 1
        
        return {
            'season': season,
            'expected_temperature': normals['temp'] + temp_adj,
            'expected_humidity': normals['humidity'],
            'expected_rainfall': normals['rainfall'] * rain_adj,
            'source': 'climate_normal',
            'reliability': 'high' if season.lower() in ['kharif', 'rabi'] else 'medium'
        }


# Singleton instance
_weather_service: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    """Get or create weather service instance."""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service


if __name__ == "__main__":
    # Test the weather service
    print("="*60)
    print("Weather Service Test")
    print("="*60)
    
    service = get_weather_service()
    
    test_states = ['Punjab', 'Maharashtra', 'Kerala']
    
    for state in test_states:
        print(f"\n{state}:")
        weather = service.get_current_weather(state)
        print(f"  Current: {weather['temperature']}°C, {weather['humidity']}% humidity")
        print(f"  Source: {weather['source']}")
        
        # Test yield adjustment for wheat in Punjab
        if state == 'Punjab':
            adjustment = service.calculate_yield_adjustment(state, 'wheat', weather)
            print(f"  Wheat yield adjustment: {adjustment['adjustment_factor']}")
            print(f"  Recommendation: {adjustment['recommendation']}")
    
    print("\n" + "="*60)
