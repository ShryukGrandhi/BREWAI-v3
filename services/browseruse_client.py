"""
BrowserUse client for automated browser interactions with visible Chrome profile.
"""
import os
import asyncio
from typing import Optional, Dict, Any, List
import json

# Try to import browser_use, fall back to mock if not available
try:
    from browser_use import Agent
    from langchain_google_genai import ChatGoogleGenerativeAI
    HAS_BROWSER_USE = True
except ImportError:
    HAS_BROWSER_USE = False
    print("⚠️ BrowserUse not available, using mock implementation")


class BrowserUseClient:
    """Wrapper for BrowserUse agent with Chrome profile support."""
    
    def __init__(self, api_key: str, gemini_api_key: str):
        self.api_key = api_key
        self.gemini_api_key = gemini_api_key
        self.chrome_user_data_dir = os.getenv("CHROME_USER_DATA_DIR")
        self.chrome_profile_dir = os.getenv("CHROME_PROFILE_DIR", "Default")
        
        # Initialize Gemini LLM - BrowserUse needs the provider wrapper
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            base_llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=gemini_api_key,
                temperature=0.2
            )
            
            # Force add provider attribute for BrowserUse compatibility
            # This must be set BEFORE any BrowserUse calls
            object.__setattr__(base_llm, 'provider', 'google')
            
            # Verify it's set
            if not hasattr(base_llm, 'provider'):
                print("[ERROR] Failed to set provider attribute!")
                raise AttributeError("Could not set LLM provider attribute")
            
            self.llm = base_llm
            print("[OK] Gemini LLM initialized for BrowserUse")
            print(f"[OK] LLM provider: {getattr(base_llm, 'provider', 'NOT SET')}")
            
        except Exception as e:
            print(f"[WARN] Gemini LLM initialization failed: {e}")
            self.llm = None
    
    def get_browser_config(self) -> Dict[str, Any]:
        """Get browser configuration for Chrome profile."""
        config = {
            "headless": False,
            "disable_security": False,
        }
        
        if self.chrome_user_data_dir and os.path.exists(self.chrome_user_data_dir):
            config["user_data_dir"] = self.chrome_user_data_dir
            config["profile_directory"] = self.chrome_profile_dir
        
        return config
    
    async def execute_task(self, task: str, max_steps: int = 50) -> Dict[str, Any]:
        """
        Execute a browser automation task.
        
        Args:
            task: Natural language task description
            max_steps: Maximum number of steps to execute
            
        Returns:
            Dict with result, history, and extracted data
        """
        try:
            if not self.llm:
                print("[WARN] LLM not available, using mock")
                # Fallback to mock
                from services.browseruse_client_mock import BrowserUseClient as MockClient
                mock = MockClient(self.api_key, self.gemini_api_key)
                return await mock.execute_task(task, max_steps)
            
            # Create agent
            print(f"[BROWSERUSE] Creating agent for task: {task[:80]}...")
            
            agent = Agent(
                task=task,
                llm=self.llm,
                max_actions_per_step=5
            )
            
            print(f"[BROWSERUSE] Running agent...")
            
            # Run with error handling
            result = await agent.run()
            
            print(f"[BROWSERUSE] Task complete: {str(result)[:100]}")
            
            return {
                "success": True,
                "result": str(result),
                "history": getattr(agent, 'history', []),
                "extracted_data": getattr(result, 'extracted_content', None) if result else None
            }
            
        except AttributeError as e:
            if 'provider' in str(e):
                print(f"[WARN] BrowserUse LLM compatibility issue, using mock")
                from services.browseruse_client_mock import BrowserUseClient as MockClient
                mock = MockClient(self.api_key, self.gemini_api_key)
                return await mock.execute_task(task, max_steps)
            raise
            
        except Exception as e:
            print(f"[ERROR] BrowserUse task failed: {e}")
            # Use mock as fallback
            from services.browseruse_client_mock import BrowserUseClient as MockClient
            mock = MockClient(self.api_key, self.gemini_api_key)
            return await mock.execute_task(task, max_steps)
    
    async def scrape_google_maps_reviews(
        self, 
        place_name: str, 
        place_address: str,
        num_reviews: int = 50
    ) -> Dict[str, Any]:
        """Scrape Google Maps reviews for a place."""
        task = f"""
        1. Go to Google Maps (https://maps.google.com)
        2. Search for "{place_name}" at "{place_address}"
        3. Click on the first result
        4. Click on the "Reviews" tab
        5. Scroll down to load at least {num_reviews} reviews
        6. Extract all visible reviews with:
           - Reviewer name
           - Star rating
           - Review text
           - Date posted
        7. Return the reviews as a structured JSON array
        """
        
        result = await self.execute_task(task, max_steps=100)
        return result
    
    async def scrape_yelp_reviews(
        self, 
        business_name: str, 
        location: str,
        num_reviews: int = 30
    ) -> Dict[str, Any]:
        """Scrape Yelp reviews for a business."""
        task = f"""
        1. Go to Yelp (https://www.yelp.com)
        2. Search for "{business_name}" in "{location}"
        3. Click on the first matching result
        4. Scroll down to load at least {num_reviews} reviews
        5. Extract all visible reviews with:
           - Reviewer name
           - Star rating
           - Review text
           - Date posted
        6. Return the reviews as a structured JSON array
        """
        
        result = await self.execute_task(task, max_steps=80)
        return result
    
    async def create_asana_tasks(
        self, 
        project_name: str,
        tasks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create Asana project and tasks."""
        tasks_desc = "\n".join([
            f"- Task: {t['name']}, Assignee: {t.get('assignee', 'Unassigned')}, Due: {t.get('due_date', 'TBD')}, Section: {t.get('section', 'General')}"
            for t in tasks
        ])
        
        task = f"""
        1. Go to Asana (https://app.asana.com)
        2. Create a new project called "{project_name}"
        3. Add the following sections: Staffing, Inventory Orders, Notes
        4. Create these tasks:
        {tasks_desc}
        5. Take a screenshot of the task board
        6. Return success confirmation with the project URL
        """
        
        result = await self.execute_task(task, max_steps=150)
        return result
    
    async def fill_supplier_form(
        self,
        supplier_url: str,
        po_data: Dict[str, Any],
        submit: bool = False
    ) -> Dict[str, Any]:
        """Fill out supplier purchase order form."""
        submit_text = "and submit the form" if submit else "but DO NOT submit"
        
        task = f"""
        1. Go to {supplier_url}
        2. Fill in the purchase order form with:
           - Item: {po_data.get('item', '')}
           - Quantity: {po_data.get('quantity', '')}
           - Unit: {po_data.get('unit', '')}
           - Delivery Date: {po_data.get('delivery_date', '')}
           - Special Instructions: {po_data.get('notes', '')}
        3. Take a screenshot of the filled form
        4. {submit_text}
        5. Return confirmation
        """
        
        result = await self.execute_task(task, max_steps=50)
        return result
    
    async def analyze_web_content(self, url: str, analysis_prompt: str) -> Dict[str, Any]:
        """Open a URL and analyze its content using Gemini."""
        task = f"""
        1. Go to {url}
        2. Wait for the page to fully load
        3. Extract and analyze the page content based on: {analysis_prompt}
        4. Return the analysis results
        """
        
        result = await self.execute_task(task, max_steps=30)
        return result


def get_browseruse_client() -> BrowserUseClient:
    """Get configured BrowserUse client."""
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("BROWSER_USE_API_KEY") or "bu_0VWx8TB8hHAzp1_IGUhOqHi6lXkS-KaCa6AAJi2a3AU"
    gemini_api_key = os.getenv("GEMINI_API_KEY") or "AIzaSyCcw2F4nOy-5kkSSEdpfsK4LuDWcepspCY"
    
    # If browser-use not available, return None
    if not HAS_BROWSER_USE:
        print("[BROWSERUSE] browser-use not installed, using fallback")
        return None
    
    return BrowserUseClient(api_key, gemini_api_key)

