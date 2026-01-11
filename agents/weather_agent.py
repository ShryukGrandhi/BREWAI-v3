"""
WeatherAgent - Fetches weather forecast using Open-Meteo and Google Places.
"""
import os
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any
from services.weather import WeatherService, get_location_coords, search_place
from agents.trace_agent import get_trace_agent
import pytz


class WeatherAgent:
    """Fetch and process weather forecast data."""
    
    def __init__(
        self,
        restaurant_name: str,
        restaurant_address: str,
        timezone: str = "America/New_York"
    ):
        self.restaurant_name = restaurant_name
        self.restaurant_address = restaurant_address
        self.timezone = timezone
        self.weather_service = WeatherService(timezone)
        self.trace = get_trace_agent()
        self.google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    def run(self) -> Dict[str, Any]:
        """Execute weather forecast workflow."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            # Step 1: Get place_id and coordinates
            self.trace.log(
                agent="WeatherAgent",
                action="Getting location coordinates",
                metadata={"location": f"{self.restaurant_name}, {self.restaurant_address}"}
            )
            
            place_id = search_place(
                f"{self.restaurant_name}, {self.restaurant_address}",
                self.google_api_key
            )
            
            lat, lng = get_location_coords(place_id, self.google_api_key)
            
            self.trace.log(
                agent="WeatherAgent",
                action="Retrieved coordinates",
                result=f"lat: {lat}, lng: {lng}"
            )
            
            # Step 2: Fetch weather forecast
            self.trace.log(
                agent="WeatherAgent",
                action="Fetching weather forecast from Open-Meteo",
                url="https://api.open-meteo.com/v1/forecast"
            )
            
            raw_forecast = self.weather_service.get_forecast(lat, lng, days_ahead=1)
            
            # Save raw forecast
            raw_file = "artifacts/weather_raw.json"
            with open(raw_file, 'w') as f:
                json.dump(raw_forecast, f, indent=2)
            results["artifacts"].append(raw_file)
            
            # Step 3: Process into features DataFrame
            tomorrow = (datetime.now(pytz.timezone(self.timezone)) + timedelta(days=1)).strftime("%Y-%m-%d")
            df = self.weather_service.process_forecast_df(raw_forecast, target_date=tomorrow)
            
            # Save features CSV
            csv_file = "artifacts/weather_features.csv"
            df.to_csv(csv_file, index=False)
            results["artifacts"].append(csv_file)
            
            # Get summary
            summary = self.weather_service.get_summary(df)
            results["summary"] = summary
            results["forecast_df"] = df
            results["lat"] = lat
            results["lng"] = lng
            
            self.trace.log(
                agent="WeatherAgent",
                action="Processed weather forecast",
                result=f"Tomorrow: {summary['rain_hours']} rain hours, avg temp {summary['avg_temp']}°F",
                artifacts=results["artifacts"],
                metadata=summary
            )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="WeatherAgent",
                action="Error in weather workflow",
                result=f"Error: {str(e)}"
            )
            results["error"] = str(e)
            return results


def run_weather_agent(
    restaurant_name: str,
    restaurant_address: str,
    timezone: str = "America/New_York"
) -> Dict[str, Any]:
    """Run weather agent."""
    agent = WeatherAgent(restaurant_name, restaurant_address, timezone)
    return agent.run()

