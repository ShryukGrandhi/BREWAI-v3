"""
Traffic API Integration
Uses TomTom Traffic API
"""

import os
import requests
from typing import Dict

def get_traffic_data(latitude: float, longitude: float, radius: int = 1000) -> Dict:
    """
    Get real-time traffic data for restaurant area.
    
    Args:
        latitude: Location latitude
        longitude: Location longitude
        radius: Radius in meters
        
    Returns:
        Traffic data
    """
    api_key = os.getenv("TOMTOM_API_KEY")
    
    if not api_key:
        print("WARNING: TOMTOM_API_KEY not set")
        return _get_fallback_traffic()
    
    try:
        # TomTom Traffic Flow API
        url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
        
        params = {
            "key": api_key,
            "point": f"{latitude},{longitude}"
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            print(f"TomTom API error: {response.status_code}")
            return _get_fallback_traffic()
        
        # Extract relevant traffic info
        flow_data = data.get("flowSegmentData", {})
        
        formatted = {
            "current_speed": flow_data.get("currentSpeed", 0),
            "free_flow_speed": flow_data.get("freeFlowSpeed", 0),
            "current_travel_time": flow_data.get("currentTravelTime", 0),
            "free_flow_travel_time": flow_data.get("freeFlowTravelTime", 0),
            "confidence": flow_data.get("confidence", 0),
            "road_closure": flow_data.get("roadClosure", False)
        }
        
        # Calculate congestion level
        if formatted["free_flow_speed"] > 0:
            speed_ratio = formatted["current_speed"] / formatted["free_flow_speed"]
            if speed_ratio >= 0.8:
                formatted["congestion_level"] = "LOW"
                formatted["congestion_score"] = 90
            elif speed_ratio >= 0.5:
                formatted["congestion_level"] = "MODERATE"
                formatted["congestion_score"] = 60
            else:
                formatted["congestion_level"] = "HIGH"
                formatted["congestion_score"] = 30
        else:
            formatted["congestion_level"] = "UNKNOWN"
            formatted["congestion_score"] = 50
        
        print(f"✅ Fetched traffic data: {formatted['congestion_level']} congestion")
        return formatted
        
    except Exception as e:
        print(f"ERROR fetching traffic: {e}")
        return _get_fallback_traffic()


def _get_fallback_traffic() -> Dict:
    """Return fallback traffic data."""
    from datetime import datetime
    hour = datetime.now().hour
    
    # Simulate traffic based on time of day
    if 7 <= hour <= 9 or 17 <= hour <= 19:
        # Rush hour
        return {
            "current_speed": 15,
            "free_flow_speed": 35,
            "congestion_level": "HIGH",
            "congestion_score": 30,
            "source": "fallback"
        }
    elif 11 <= hour <= 14:
        # Lunch time
        return {
            "current_speed": 25,
            "free_flow_speed": 35,
            "congestion_level": "MODERATE",
            "congestion_score": 60,
            "source": "fallback"
        }
    else:
        # Off-peak
        return {
            "current_speed": 32,
            "free_flow_speed": 35,
            "congestion_level": "LOW",
            "congestion_score": 90,
            "source": "fallback"
        }


def get_delivery_time_estimate(traffic_data: Dict, base_minutes: int = 30) -> int:
    """
    Estimate delivery time based on traffic.
    
    Args:
        traffic_data: Traffic data from get_traffic_data()
        base_minutes: Base delivery time in ideal conditions
        
    Returns:
        Estimated delivery time in minutes
    """
    congestion_score = traffic_data.get("congestion_score", 50)
    
    # Higher congestion = longer delivery time
    multiplier = 1.0 + ((100 - congestion_score) / 100)
    
    return int(base_minutes * multiplier)

