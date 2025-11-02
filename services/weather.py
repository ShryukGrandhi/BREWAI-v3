"""
Weather service using Open-Meteo API for forecast data.
"""
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
import pytz


class WeatherService:
    """Fetch and process weather forecast data."""
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    def __init__(self, timezone: str = "America/New_York"):
        self.timezone = timezone
    
    def get_forecast(
        self, 
        latitude: float, 
        longitude: float,
        days_ahead: int = 1
    ) -> Dict[str, Any]:
        """
        Get hourly weather forecast.
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            days_ahead: Number of days to forecast (1-7)
            
        Returns:
            Dict with raw forecast data
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "temperature_2m,precipitation_probability,precipitation",
            "temperature_unit": "fahrenheit",
            "precipitation_unit": "inch",
            "timezone": self.timezone,
            "forecast_days": days_ahead + 1
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            raise Exception(f"Weather API error: {str(e)}")
    
    def process_forecast_df(
        self, 
        raw_data: Dict[str, Any],
        target_date: str = None
    ) -> pd.DataFrame:
        """
        Process raw forecast into a tidy DataFrame.
        
        Args:
            raw_data: Raw API response
            target_date: Target date in YYYY-MM-DD format (default: tomorrow)
            
        Returns:
            DataFrame with columns: time, temp, precip_prob, precip, is_rain
        """
        hourly = raw_data.get("hourly", {})
        
        df = pd.DataFrame({
            "time": pd.to_datetime(hourly["time"]),
            "temp": hourly["temperature_2m"],
            "precip_prob": hourly["precipitation_probability"],
            "precip": hourly["precipitation"]
        })
        
        # Filter to target date
        if target_date is None:
            tomorrow = datetime.now(pytz.timezone(self.timezone)) + timedelta(days=1)
            target_date = tomorrow.strftime("%Y-%m-%d")
        
        df = df[df["time"].dt.date.astype(str) == target_date].copy()
        
        # Add derived features
        df["is_rain"] = (df["precip_prob"] > 50).astype(int)
        df["hour"] = df["time"].dt.hour
        
        return df
    
    def get_peak_rain_hours(self, df: pd.DataFrame) -> list:
        """Get hours with highest rain probability."""
        rain_hours = df[df["is_rain"] == 1]["hour"].tolist()
        return sorted(rain_hours)
    
    def get_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get weather summary statistics."""
        return {
            "avg_temp": round(df["temp"].mean(), 1),
            "max_temp": round(df["temp"].max(), 1),
            "min_temp": round(df["temp"].min(), 1),
            "avg_precip_prob": round(df["precip_prob"].mean(), 1),
            "max_precip_prob": round(df["precip_prob"].max(), 1),
            "total_precip": round(df["precip"].sum(), 2),
            "rain_hours": len(df[df["is_rain"] == 1]),
            "peak_rain_hours": self.get_peak_rain_hours(df)
        }


def get_location_coords(place_id: str, api_key: str) -> Tuple[float, float]:
    """
    Get coordinates from Google Places API.
    
    Args:
        place_id: Google Places place_id
        api_key: Google Places API key
        
    Returns:
        Tuple of (latitude, longitude)
    """
    url = f"https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "geometry",
        "key": api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "OK":
            location = data["result"]["geometry"]["location"]
            return location["lat"], location["lng"]
        else:
            raise Exception(f"Places API error: {data.get('status')}")
            
    except Exception as e:
        raise Exception(f"Failed to get coordinates: {str(e)}")


def search_place(query: str, api_key: str) -> str:
    """
    Search for a place and get its place_id.
    
    Args:
        query: Search query (name + address)
        api_key: Google Places API key
        
    Returns:
        place_id string
    """
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "place_id,name,formatted_address",
        "key": api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "OK" and data.get("candidates"):
            return data["candidates"][0]["place_id"]
        else:
            raise Exception(f"No place found for query: {query}")
            
    except Exception as e:
        raise Exception(f"Place search error: {str(e)}")

