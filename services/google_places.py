"""
Google Places API Integration
Get real restaurant reviews and ratings
"""

import os
import requests
from typing import List, Dict

def get_restaurant_reviews(name: str, address: str) -> List[Dict]:
    """
    Fetch real Google reviews for a restaurant.
    
    Args:
        name: Restaurant name
        address: Restaurant address
        
    Returns:
        List of review dictionaries
    """
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    if not api_key:
        print("WARNING: GOOGLE_PLACES_API_KEY not set")
        return []
    
    try:
        # Step 1: Find place ID
        search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        search_params = {
            "input": f"{name} {address}",
            "inputtype": "textquery",
            "fields": "place_id,name",
            "key": api_key
        }
        
        search_response = requests.get(search_url, params=search_params, timeout=10)
        search_data = search_response.json()
        
        if search_data.get("status") != "OK" or not search_data.get("candidates"):
            print(f"Place not found: {search_data.get('status')}")
            return []
        
        place_id = search_data["candidates"][0]["place_id"]
        
        # Step 2: Get place details with reviews
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        details_params = {
            "place_id": place_id,
            "fields": "name,rating,reviews,user_ratings_total",
            "key": api_key
        }
        
        details_response = requests.get(details_url, params=details_params, timeout=10)
        details_data = details_response.json()
        
        if details_data.get("status") != "OK":
            print(f"Details fetch failed: {details_data.get('status')}")
            return []
        
        result = details_data.get("result", {})
        reviews = result.get("reviews", [])
        
        # Format reviews
        formatted_reviews = []
        for review in reviews:
            formatted_reviews.append({
                "author": review.get("author_name", "Anonymous"),
                "rating": review.get("rating", 0),
                "text": review.get("text", ""),
                "time": review.get("relative_time_description", ""),
                "source": "Google Maps"
            })
        
        print(f"✅ Fetched {len(formatted_reviews)} Google reviews")
        return formatted_reviews
        
    except Exception as e:
        print(f"ERROR fetching Google reviews: {e}")
        return []

