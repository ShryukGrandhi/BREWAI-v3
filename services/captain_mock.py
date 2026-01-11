"""
Captain RAG Mock Implementation - Works seamlessly when API is unavailable.
"""
import os
import json
from typing import Dict, Any, List, Optional
import hashlib


class CaptainMock:
    """Mock Captain client that provides realistic responses."""
    
    def __init__(self, api_key: str, org_id: str):
        self.api_key = api_key
        self.org_id = org_id
        self.collections = {}
        self.documents_store = {}
        print("[OK] Captain Mock initialized (API unavailable, using local simulation)")
    
    def create_collection(self, name: str, description: str = None) -> Dict[str, Any]:
        """Mock create collection."""
        collection_id = f"mock_col_{hashlib.md5(name.encode()).hexdigest()[:12]}"
        
        self.collections[collection_id] = {
            "id": collection_id,
            "name": name,
            "description": description,
            "created_at": "2025-11-02T00:00:00Z"
        }
        
        return self.collections[collection_id]
    
    def upload_documents(
        self, 
        collection_id: str,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Mock document upload."""
        if collection_id not in self.documents_store:
            self.documents_store[collection_id] = []
        
        self.documents_store[collection_id].extend(documents)
        
        return {
            "success": True,
            "uploaded": len(documents),
            "collection_id": collection_id
        }
    
    def query(
        self,
        collection_id: str,
        query: str,
        top_k: int = 5,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """Mock query with intelligent responses."""
        # Simple keyword-based matching
        documents = self.documents_store.get(collection_id, [])
        
        results = []
        query_lower = query.lower()
        
        for doc in documents:
            content = doc.get("content", "")
            title = doc.get("title", "Unknown")
            
            # Simple scoring based on keyword presence
            score = 0
            for word in query_lower.split():
                if word in content.lower():
                    score += 1
            
            if score > 0:
                results.append({
                    "title": title,
                    "content": content[:500],
                    "excerpt": content[:200] + "...",
                    "score": min(1.0, score / len(query_lower.split())),
                    "metadata": doc.get("metadata", {})
                })
        
        # Sort by score
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:top_k]
        
        # Generate contextual answer
        answer = self._generate_mock_answer(query, results)
        
        return {
            "answer": answer,
            "sources": results[:4]
        }
    
    def chat(
        self,
        collection_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Mock chat with context-aware responses."""
        # Generate conversation ID
        if not conversation_id:
            conversation_id = f"mock_conv_{hashlib.md5(message.encode()).hexdigest()[:12]}"
        
        # Query documents
        query_result = self.query(collection_id, message, top_k=5)
        
        # Enhanced answer with context
        answer = query_result["answer"]
        
        # Inject context information
        if context:
            forecast_data = context.get("forecast_data", {})
            weather_data = context.get("weather_data", {})
            
            if forecast_data:
                peak_hour = forecast_data.get("peak_hour", "N/A")
                peak_orders = forecast_data.get("peak_orders", "N/A")
                answer = answer.replace("{peak_hour}", str(peak_hour))
                answer = answer.replace("{peak_orders}", str(peak_orders))
        
        return {
            "response": answer,
            "sources": query_result["sources"],
            "conversation_id": conversation_id,
            "context_used": context is not None
        }
    
    def get_collections(self) -> List[Dict[str, Any]]:
        """Mock get collections."""
        return list(self.collections.values())
    
    def delete_collection(self, collection_id: str) -> bool:
        """Mock delete collection."""
        if collection_id in self.collections:
            del self.collections[collection_id]
            if collection_id in self.documents_store:
                del self.documents_store[collection_id]
            return True
        return False
    
    def _generate_mock_answer(self, query: str, sources: List[Dict[str, Any]]) -> str:
        """Generate contextual answer based on query and sources."""
        query_lower = query.lower()
        
        # Context-specific answers
        if "cook" in query_lower or "staff" in query_lower:
            return """Based on the forecast data and operational planning rules [1][2], we're adding an additional cook tomorrow due to:

1. **Peak Order Volume [1]**: The forecast predicts a peak of {peak_orders} orders at {peak_hour}:00, which exceeds our standard 2-cook capacity. Each cook can handle approximately 25 orders per hour [3].

2. **Weather Impact [2]**: With rain expected tomorrow, delivery orders typically increase by 15-25% according to our weather planning rules. This means we need extra capacity to handle the surge.

3. **Capacity Planning [3]**: Following our operations manual, we maintain a ratio of 25 orders per cook per hour. The predicted peak requires at least 2 cooks, and the weather buffer necessitates a third.

4. **Service Standards [4]**: To maintain our 8-12 minute ticket time service standard during peak periods, adequate staffing is essential."""

        elif "weather" in query_lower or "rain" in query_lower:
            return """Weather significantly impacts our operations [1]:

1. **Rain Effect [1]**: When precipitation probability exceeds 60%, we typically see:
   - 15-25% increase in delivery orders
   - 10-15% decrease in dine-in traffic
   - Overall 15% net increase in total orders

2. **Operational Adjustments [2]**:
   - Add 1 cook when rain probability > 60% during peak hours
   - Increase wing prep by 15% over forecast baseline
   - Extra delivery supplies (bags, containers, napkins)

3. **Prep Timing [3]**: Start prep 30 minutes earlier on rainy days to handle larger volumes and ensure adequate thaw/prep time for increased inventory needs."""

        elif "menu" in query_lower or "wings" in query_lower:
            return """Our menu features signature chicken wings [1]:

1. **Wing Varieties [1]**: We offer 6 signature flavors including Classic Buffalo ($12.99), Nashville Hot ($13.99), and Korean BBQ ($14.99). Average order size is 12 wings.

2. **Prep Requirements [2]**: Wings must be thawed 2 hours in advance, pat dried, and par-cooked at 375°F for 10 minutes, then finished for 3-4 minutes for crispy skin.

3. **Popular Combinations [1]**: Wing Combo (10 wings + fries + drink) at $18.99 is our best seller, especially during lunch rush."""

        else:
            # Generic operational answer
            return """Based on our operational guidelines [1][2], this relates to our capacity planning and service standards:

1. **Capacity Management [1]**: Each team member has specific capacity thresholds - cooks handle 25 orders/hour, and we maintain 2-3 cooks during peak periods.

2. **Weather Considerations [2]**: Environmental factors like rain, temperature, and time of day significantly influence order volume and staffing needs.

3. **Service Standards [3]**: We maintain 8-12 minute ticket times during all periods by proactively adjusting staffing based on forecasts.

4. **Quality Focus [4]**: All adjustments prioritize maintaining food quality and customer experience standards."""


def get_captain_mock(api_key: str, org_id: str) -> CaptainMock:
    """Get Captain mock client."""
    return CaptainMock(api_key, org_id)

