"""
ScraperAgent - Scrapes Google Maps and Yelp reviews using BrowserUse.
"""
import os
import json
import asyncio
from typing import Dict, Any, List
from services.browseruse_client import get_browseruse_client
from services.weather import search_place
from agents.trace_agent import get_trace_agent


class ScraperAgent:
    """Scrape reviews from Google Maps and Yelp."""
    
    def __init__(
        self,
        restaurant_name: str,
        restaurant_address: str
    ):
        self.restaurant_name = restaurant_name
        self.restaurant_address = restaurant_address
        self.browser_client = get_browseruse_client()
        self.trace = get_trace_agent()
        self.google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    async def run(self) -> Dict[str, Any]:
        """Execute scraping workflow."""
        results = {
            "place_id": None,
            "gmaps_reviews": [],
            "yelp_reviews": [],
            "artifacts": []
        }
        
        try:
            # Step 1: Resolve place_id
            self.trace.log(
                agent="ScraperAgent",
                action="Resolving Google Places place_id",
                metadata={"query": f"{self.restaurant_name} {self.restaurant_address}"}
            )
            
            place_id = search_place(
                f"{self.restaurant_name}, {self.restaurant_address}",
                self.google_api_key
            )
            results["place_id"] = place_id
            
            self.trace.log(
                agent="ScraperAgent",
                action="Resolved place_id",
                result=f"place_id: {place_id}"
            )
            
            # Step 2: Scrape Google Maps reviews
            self.trace.log(
                agent="ScraperAgent",
                action="Opening Google Maps in Chrome",
                url="https://maps.google.com"
            )
            
            gmaps_result = await self.browser_client.scrape_google_maps_reviews(
                self.restaurant_name,
                self.restaurant_address,
                num_reviews=50
            )
            
            if gmaps_result["success"]:
                # Save raw HTML
                html_file = "artifacts/scraped_gmaps.html"
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(str(gmaps_result.get("result", "")))
                results["artifacts"].append(html_file)
                
                # Extract and save reviews
                reviews = self._extract_reviews_from_result(gmaps_result)
                results["gmaps_reviews"] = reviews
                
                self.trace.log(
                    agent="ScraperAgent",
                    action="Scraped Google Maps reviews",
                    result=f"Extracted {len(reviews)} reviews",
                    artifacts=[html_file]
                )
            else:
                self.trace.log(
                    agent="ScraperAgent",
                    action="Failed to scrape Google Maps",
                    result=f"Error: {gmaps_result.get('error')}"
                )
            
            # Step 3: Scrape Yelp if API key provided
            yelp_api_key = os.getenv("YELP_API_KEY")
            if yelp_api_key:
                self.trace.log(
                    agent="ScraperAgent",
                    action="Opening Yelp in new tab",
                    url="https://www.yelp.com"
                )
                
                yelp_result = await self.browser_client.scrape_yelp_reviews(
                    self.restaurant_name,
                    "New York, NY",
                    num_reviews=30
                )
                
                if yelp_result["success"]:
                    # Save raw HTML
                    html_file = "artifacts/scraped_yelp.html"
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(str(yelp_result.get("result", "")))
                    results["artifacts"].append(html_file)
                    
                    # Extract reviews
                    reviews = self._extract_reviews_from_result(yelp_result)
                    results["yelp_reviews"] = reviews
                    
                    self.trace.log(
                        agent="ScraperAgent",
                        action="Scraped Yelp reviews",
                        result=f"Extracted {len(reviews)} reviews",
                        artifacts=[html_file]
                    )
            
            # Step 4: Save combined reviews JSON
            reviews_file = "artifacts/reviews.json"
            with open(reviews_file, 'w') as f:
                json.dump({
                    "restaurant_name": self.restaurant_name,
                    "place_id": place_id,
                    "gmaps_reviews": results["gmaps_reviews"],
                    "yelp_reviews": results["yelp_reviews"],
                    "total_reviews": len(results["gmaps_reviews"]) + len(results["yelp_reviews"])
                }, f, indent=2)
            results["artifacts"].append(reviews_file)
            
            self.trace.log(
                agent="ScraperAgent",
                action="Saved combined reviews",
                artifacts=[reviews_file],
                result=f"Total: {len(results['gmaps_reviews']) + len(results['yelp_reviews'])} reviews"
            )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="ScraperAgent",
                action="Error in scraper workflow",
                result=f"Error: {str(e)}"
            )
            results["success"] = False
            results["error"] = str(e)
            return results
    
    def _extract_reviews_from_result(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract structured reviews from BrowserUse result."""
        reviews = []
        
        # Try to parse extracted_data if available
        extracted = result.get("extracted_data")
        if extracted:
            if isinstance(extracted, list):
                reviews = extracted
            elif isinstance(extracted, str):
                try:
                    reviews = json.loads(extracted)
                except:
                    pass
        
        # Fallback: parse from result text
        if not reviews and result.get("result"):
            result_text = str(result["result"])
            # This is a simplified parser - BrowserUse should return structured data
            # In production, you'd use more robust parsing
            reviews = self._parse_reviews_from_text(result_text)
        
        return reviews if isinstance(reviews, list) else []
    
    def _parse_reviews_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Simple fallback parser for review text."""
        # Placeholder - in production, use proper HTML parsing or rely on BrowserUse
        return []


def run_scraper_agent(restaurant_name: str, restaurant_address: str) -> Dict[str, Any]:
    """Synchronous wrapper for scraper agent."""
    agent = ScraperAgent(restaurant_name, restaurant_address)
    return asyncio.run(agent.run())

