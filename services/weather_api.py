"""
Weather API Integration
Uses Open-Meteo (free, no API key required)
"""

import requests
from typing import Dict, List
from datetime import datetime, timedelta

def get_weather_forecast(latitude: float, longitude: float, days: int = 7) -> Dict:
    """
    Get weather forecast for restaurant location.
    
    Args:
        latitude: Location latitude
        longitude: Location longitude
        days: Number of days to forecast
        
    Returns:
        Weather forecast data
    """
    try:
        # Open-Meteo API (free, no key needed)
        url = "https://api.open-meteo.com/v1/forecast"
        
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "temperature_2m,precipitation_probability,weathercode",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
            "temperature_unit": "fahrenheit",
            "timezone": "America/New_York",
            "forecast_days": days
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            print(f"Weather API error: {response.status_code}")
            return {}
        
        # Format the response
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        
        formatted = {
            "location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "daily_forecast": [],
            "hourly_forecast": []
        }
        
        # Daily forecast
        if daily:
            times = daily.get("time", [])
            for i, date in enumerate(times):
                formatted["daily_forecast"].append({
                    "date": date,
                    "temp_max": daily.get("temperature_2m_max", [])[i],
                    "temp_min": daily.get("temperature_2m_min", [])[i],
                    "precipitation": daily.get("precipitation_sum", [])[i],
                    "weather_code": daily.get("weathercode", [])[i]
                })
        
        # Hourly forecast (next 24 hours)
        if hourly:
            times = hourly.get("time", [])[:24]
            for i, time in enumerate(times):
                formatted["hourly_forecast"].append({
                    "time": time,
                    "temperature": hourly.get("temperature_2m", [])[i],
                    "precipitation_prob": hourly.get("precipitation_probability", [])[i],
                    "weather_code": hourly.get("weathercode", [])[i]
                })
        
        print(f"✅ Fetched {days}-day weather forecast")
        return formatted
        
    except Exception as e:
        print(f"ERROR fetching weather: {e}")
        return {}


def get_weather_impact_score(weather_data: Dict) -> float:
    """
    Calculate impact score (0-100) of weather on restaurant demand.
    
    Args:
        weather_data: Weather forecast data
        
    Returns:
        Impact score (higher = better for business)
    """
    if not weather_data or not weather_data.get("daily_forecast"):
        return 50.0  # Neutral
    
    today = weather_data["daily_forecast"][0]
    
    # Factors:
    # - Temperature (optimal: 65-75°F)
    # - Precipitation (bad for delivery/outdoor seating)
    
    temp_max = today.get("temp_max", 70)
    precipitation = today.get("precipitation", 0)
    
    # Temperature score
    if 65 <= temp_max <= 75:
        temp_score = 100
    elif 55 <= temp_max <= 85:
        temp_score = 75
    else:
        temp_score = 50
    
    # Precipitation penalty
    precip_penalty = min(precipitation * 5, 50)  # Max 50 point penalty
    
    final_score = max(temp_score - precip_penalty, 0)
    
    return final_score

