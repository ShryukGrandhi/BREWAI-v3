"""
GeoAgent - Expansion analysis for new city with ROI scoring.
"""
import os
import json
import asyncio
from typing import Dict, Any, List, Tuple
import requests
import folium
from agents.trace_agent import get_trace_agent
from services.browseruse_client import get_browseruse_client


class GeoAgent:
    """Analyze expansion opportunities in a new city."""
    
    def __init__(self, expansion_city: str):
        self.expansion_city = expansion_city
        self.google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.trace = get_trace_agent()
        self.browser_client = get_browseruse_client()
    
    async def run(self) -> Dict[str, Any]:
        """Execute expansion analysis workflow."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            # Step 1: Define candidate locations
            self.trace.log(
                agent="GeoAgent",
                action="Identifying candidate locations",
                metadata={"city": self.expansion_city}
            )
            
            candidates = self._get_candidate_locations()
            
            # Step 2: Analyze each location
            self.trace.log(
                agent="GeoAgent",
                action="Analyzing locations",
                result=f"Evaluating {len(candidates)} candidates"
            )
            
            analyzed_locations = []
            
            for candidate in candidates:
                analysis = await self._analyze_location(candidate)
                analyzed_locations.append(analysis)
                
                self.trace.log(
                    agent="GeoAgent",
                    action=f"Analyzed: {candidate['name']}",
                    result=f"ROI Score: {analysis['roi_score']:.2f}",
                    metadata=analysis
                )
            
            # Sort by ROI score
            analyzed_locations.sort(key=lambda x: x['roi_score'], reverse=True)
            results["locations"] = analyzed_locations
            
            # Step 3: Create interactive map
            self.trace.log(
                agent="GeoAgent",
                action="Creating expansion map"
            )
            
            map_file = "artifacts/expansion_map.html"
            self._create_expansion_map(analyzed_locations, map_file)
            results["artifacts"].append(map_file)
            
            # Save JSON data
            json_file = "artifacts/expansion_map.json"
            with open(json_file, 'w') as f:
                json.dump({
                    "city": self.expansion_city,
                    "locations": analyzed_locations,
                    "top_location": analyzed_locations[0] if analyzed_locations else None
                }, f, indent=2)
            results["artifacts"].append(json_file)
            
            self.trace.log(
                agent="GeoAgent",
                action="Expansion analysis complete",
                result=f"Top location: {analyzed_locations[0]['name']} (ROI: {analyzed_locations[0]['roi_score']:.2f})",
                artifacts=results["artifacts"]
            )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="GeoAgent",
                action="Error in geo analysis",
                result=f"Error: {str(e)}"
            )
            results["error"] = str(e)
            return results
    
    def _get_candidate_locations(self) -> List[Dict[str, Any]]:
        """Get predefined candidate locations for the expansion city."""
        # For San Francisco
        if "San Francisco" in self.expansion_city or "SF" in self.expansion_city:
            return [
                {"name": "Marina District", "lat": 37.8030, "lng": -122.4360},
                {"name": "Mission District", "lat": 37.7599, "lng": -122.4148},
                {"name": "SoMa (South of Market)", "lat": 37.7749, "lng": -122.4194},
                {"name": "Financial District", "lat": 37.7946, "lng": -122.3999},
                {"name": "Hayes Valley", "lat": 37.7749, "lng": -122.4268},
                {"name": "Nob Hill", "lat": 37.7927, "lng": -122.4145},
                {"name": "Castro District", "lat": 37.7609, "lng": -122.4350},
                {"name": "North Beach", "lat": 37.8006, "lng": -122.4103},
                {"name": "Embarcadero", "lat": 37.7955, "lng": -122.3937},
                {"name": "Haight-Ashbury", "lat": 37.7693, "lng": -122.4482}
            ]
        else:
            # Generic city center
            return [
                {"name": "Downtown", "lat": 37.7749, "lng": -122.4194},
                {"name": "Business District", "lat": 37.7849, "lng": -122.4094},
                {"name": "Arts District", "lat": 37.7649, "lng": -122.4294}
            ]
    
    async def _analyze_location(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a single location for expansion potential."""
        lat = candidate["lat"]
        lng = candidate["lng"]
        name = candidate["name"]
        
        # Get competitor density
        competitors = self._get_competitors(lat, lng, radius_miles=0.5)
        competition_score = max(0, 1 - (len(competitors) / 20))  # Normalize
        
        # Get foot traffic proxy (nearby businesses)
        businesses = self._get_nearby_businesses(lat, lng)
        traffic_score = min(1.0, len(businesses) / 50)  # Normalize
        
        # Income proxy (simplified - would use census data in production)
        income_score = self._estimate_income_score(name)
        
        # Calculate ROI score (weighted average)
        roi_score = (
            0.4 * traffic_score +
            0.3 * income_score +
            0.3 * competition_score
        )
        
        return {
            "name": name,
            "lat": lat,
            "lng": lng,
            "competitors_count": len(competitors),
            "businesses_count": len(businesses),
            "competition_score": round(competition_score, 3),
            "traffic_score": round(traffic_score, 3),
            "income_score": round(income_score, 3),
            "roi_score": round(roi_score, 3),
            "gmaps_url": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
        }
    
    def _get_competitors(self, lat: float, lng: float, radius_miles: float = 0.5) -> List[Dict[str, Any]]:
        """Get competing restaurants using Google Places API."""
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        # Convert miles to meters
        radius_meters = int(radius_miles * 1609.34)
        
        params = {
            "location": f"{lat},{lng}",
            "radius": radius_meters,
            "type": "restaurant",
            "keyword": "wings chicken fast casual",
            "key": self.google_api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return data.get("results", [])
        except Exception as e:
            print(f"Error fetching competitors: {e}")
            return []
    
    def _get_nearby_businesses(self, lat: float, lng: float) -> List[Dict[str, Any]]:
        """Get nearby businesses as foot traffic proxy."""
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        params = {
            "location": f"{lat},{lng}",
            "radius": 500,  # 500 meters
            "type": "establishment",
            "key": self.google_api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return data.get("results", [])
        except Exception as e:
            print(f"Error fetching businesses: {e}")
            return []
    
    def _estimate_income_score(self, neighborhood: str) -> float:
        """Estimate income level for neighborhood (simplified)."""
        # In production, use census API or similar
        # For now, use heuristics
        high_income = ["Marina", "Nob Hill", "Financial", "Embarcadero", "Pacific Heights"]
        medium_income = ["Hayes Valley", "North Beach", "Castro", "SoMa"]
        
        neighborhood_lower = neighborhood.lower()
        
        for area in high_income:
            if area.lower() in neighborhood_lower:
                return 0.9
        
        for area in medium_income:
            if area.lower() in neighborhood_lower:
                return 0.7
        
        return 0.5  # Default medium
    
    def _create_expansion_map(self, locations: List[Dict[str, Any]], output_file: str):
        """Create interactive Folium map with location markers."""
        # Center on first location or default
        if locations:
            center_lat = sum(loc["lat"] for loc in locations) / len(locations)
            center_lng = sum(loc["lng"] for loc in locations) / len(locations)
        else:
            center_lat, center_lng = 37.7749, -122.4194
        
        # Create map
        m = folium.Map(
            location=[center_lat, center_lng],
            zoom_start=12,
            tiles="OpenStreetMap"
        )
        
        # Add markers
        for i, loc in enumerate(locations):
            # Color based on ROI score
            if loc["roi_score"] >= 0.7:
                color = "green"
            elif loc["roi_score"] >= 0.5:
                color = "orange"
            else:
                color = "red"
            
            # Create popup
            popup_html = f"""
            <div style="font-family: Arial; width: 250px;">
                <h4>{loc['name']}</h4>
                <b>ROI Score:</b> {loc['roi_score']:.2f}<br>
                <b>Traffic:</b> {loc['traffic_score']:.2f}<br>
                <b>Income:</b> {loc['income_score']:.2f}<br>
                <b>Competition:</b> {loc['competition_score']:.2f}<br>
                <b>Competitors:</b> {loc['competitors_count']}<br>
                <b>Nearby Businesses:</b> {loc['businesses_count']}<br>
                <br>
                <a href="{loc['gmaps_url']}" target="_blank">Open in Google Maps</a>
            </div>
            """
            
            folium.Marker(
                location=[loc["lat"], loc["lng"]],
                popup=folium.Popup(popup_html, max_width=300),
                tooltip=f"{loc['name']} (ROI: {loc['roi_score']:.2f})",
                icon=folium.Icon(color=color, icon="info-sign")
            ).add_to(m)
        
        # Save map
        m.save(output_file)


def run_geo_agent(expansion_city: str) -> Dict[str, Any]:
    """Synchronous wrapper for geo agent."""
    agent = GeoAgent(expansion_city)
    return asyncio.run(agent.run())

