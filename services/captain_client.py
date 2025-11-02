"""
Captain RAG Client - OpenAI SDK Compatible Interface.
"""
import os
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI


class CaptainClient:
    """Client for Captain RAG API using OpenAI SDK compatibility."""
    
    BASE_URL = "https://api.runcaptain.com/v1"  # Correct Captain endpoint
    
    def __init__(self, api_key: str, org_id: str):
        self.api_key = api_key
        self.org_id = org_id
        
        # Initialize OpenAI client with Captain endpoint
        self.client = OpenAI(
            base_url=self.BASE_URL,
            api_key=api_key,
            default_headers={
                "X-Organization-ID": org_id
            }
        )
        
        print(f"[OK] Captain client initialized (OpenAI SDK)")
        print(f"     Organization: {org_id}")
        print(f"     Endpoint: {self.BASE_URL}")
    
    def create_collection(self, name: str, description: str = None) -> Dict[str, Any]:
        """Create a collection - Captain uses contexts, not collections."""
        # Captain doesn't use collections - context is passed per request
        # Return a mock collection ID for compatibility
        return {
            "id": f"ctx_{name}",
            "name": name,
            "description": description or f"Brew.AI knowledge base for {name}",
            "note": "Captain uses inline context, not persistent collections"
        }
    
    def upload_documents(
        self, 
        collection_id: str,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Store documents for Captain context.
        Captain doesn't use persistent collections - context is passed per request.
        
        Args:
            collection_id: Context identifier (for compatibility)
            documents: List of documents with 'content', 'title', and 'metadata'
        """
        # Store documents in memory for building context
        if not hasattr(self, 'document_store'):
            self.document_store = {}
        
        self.document_store[collection_id] = documents
        
        print(f"[OK] Stored {len(documents)} documents for Captain context")
        
        return {
            "success": True,
            "uploaded": len(documents),
            "collection_id": collection_id,
            "note": "Documents stored for inline context"
        }
    
    def query(
        self,
        collection_id: str,
        query: str,
        top_k: int = 5,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Query Captain using OpenAI SDK interface.
        
        Args:
            collection_id: Context identifier
            query: User question
            top_k: Number of relevant chunks
            include_sources: Include citations
            
        Returns:
            Dict with answer and sources
        """
        # Build context from stored documents
        context = self._build_context(collection_id)
        
        try:
            response = self.client.chat.completions.create(
                model="captain-voyager-latest",
                messages=[
                    {"role": "system", "content": "You are a helpful restaurant operations analyst. Provide specific answers with citations [1], [2], etc."},
                    {"role": "user", "content": query}
                ],
                extra_body={
                    "captain": {
                        "context": context
                    }
                }
            )
            
            answer = response.choices[0].message.content
            
            return {
                "answer": answer,
                "sources": self._extract_sources(collection_id, answer, top_k)
            }
            
        except Exception as e:
            print(f"[ERROR] Captain query failed: {e}")
            raise
    
    def chat(
        self,
        collection_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Chat with Captain using OpenAI SDK interface.
        
        Args:
            collection_id: Context identifier
            message: User message
            conversation_id: Optional (for compatibility)
            context: Additional runtime context (forecast, weather)
            
        Returns:
            Dict with response, sources, and conversation_id
        """
        # Build full context from documents + runtime context
        doc_context = self._build_context(collection_id)
        
        # Add runtime context (forecast, weather) to document context
        if context:
            runtime_info = "\n\n=== CURRENT OPERATIONAL DATA ===\n"
            if 'forecast_data' in context:
                f = context['forecast_data']
                runtime_info += f"\nForecast - Peak Hour: {f.get('peak_hour')}:00, Peak Orders: {f.get('peak_orders')}"
            if 'weather_data' in context:
                w = context['weather_data']
                runtime_info += f"\nWeather - Rain Hours: {w.get('rain_hours')}, Avg Temp: {w.get('avg_temp')}°F"
            
            doc_context += runtime_info
        
        try:
            response = self.client.chat.completions.create(
                model="captain-voyager-latest",
                messages=[
                    {"role": "system", "content": "You are a restaurant operations analyst. Answer questions using the provided context. Include specific citations using [1], [2], etc. referring to sources in the context."},
                    {"role": "user", "content": message}
                ],
                extra_body={
                    "captain": {
                        "context": doc_context
                    }
                }
            )
            
            answer = response.choices[0].message.content
            
            # Generate conversation ID
            conv_id = conversation_id or f"conv_{hash(message) % 1000000:06d}"
            
            return {
                "response": answer,
                "sources": self._extract_sources(collection_id, answer, 4),
                "conversation_id": conv_id
            }
            
        except Exception as e:
            print(f"[ERROR] Captain chat failed: {e}")
            raise
    
    def _build_context(self, collection_id: str) -> str:
        """Build context string from stored documents."""
        if not hasattr(self, 'document_store') or collection_id not in self.document_store:
            return ""
        
        context_parts = []
        documents = self.document_store[collection_id]
        
        for doc in documents:
            title = doc.get('title', 'Document')
            content = doc.get('content', '')
            context_parts.append(f"=== {title} ===\n{content}\n")
        
        return "\n".join(context_parts)
    
    def _extract_sources(self, collection_id: str, answer: str, max_sources: int = 4) -> List[Dict[str, Any]]:
        """Extract source citations from answer."""
        if not hasattr(self, 'document_store') or collection_id not in self.document_store:
            return []
        
        sources = []
        documents = self.document_store[collection_id]
        
        # Find which documents were likely cited
        for i, doc in enumerate(documents[:max_sources], 1):
            if f"[{i}]" in answer:
                content = doc.get('content', '')
                sources.append({
                    "title": doc.get('title', 'Unknown'),
                    "excerpt": content[:200] + "..." if len(content) > 200 else content,
                    "content": content,
                    "score": 0.95 - (i * 0.05),  # Decreasing relevance
                    "metadata": doc.get('metadata', {})
                })
        
        return sources
    
    def get_collections(self) -> List[Dict[str, Any]]:
        """Get collections - Captain uses inline context, so return stored contexts."""
        if not hasattr(self, 'document_store'):
            return []
        
        return [
            {"id": cid, "name": cid, "document_count": len(docs)}
            for cid, docs in self.document_store.items()
        ]
    
    def delete_collection(self, collection_id: str) -> bool:
        """Delete a collection from memory."""
        if hasattr(self, 'document_store') and collection_id in self.document_store:
            del self.document_store[collection_id]
            return True
        return False


def get_captain_client() -> CaptainClient:
    """Get configured Captain client using OpenAI SDK - REAL API ONLY."""
    api_key = os.getenv("CAPTAIN_API_KEY")
    org_id = os.getenv("CAPTAIN_ORG_ID")
    
    if not api_key or not org_id:
        # Load .env explicitly
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("CAPTAIN_API_KEY")
        org_id = os.getenv("CAPTAIN_ORG_ID")
        
        if not api_key or not org_id:
            print("[WARNING] Captain credentials not set - using fallback mode")
            return None
    
    print(f"[INIT] Initializing Captain (OpenAI SDK)...")
    
    return CaptainClient(api_key, org_id)


# Database connection for Captain
def connect_captain_to_database(tenant_id: str) -> Dict[str, Any]:
    """
    Connect Captain context for tenant (inline, not persistent DB).
    
    Args:
        tenant_id: Tenant identifier
        
    Returns:
        Dict with context_id and status
    """
    client = get_captain_client()
    
    collection_name = f"brew_{tenant_id}"
    collection_id = f"ctx_{tenant_id}"
    
    print(f"[SETUP] Captain context for tenant: {tenant_id}")
    
    # Captain uses inline context, not persistent collections
    # Create a context identifier for this tenant
    result = client.create_collection(
        name=collection_name,
        description=f"Brew.AI knowledge base for {tenant_id}"
    )
    
    print(f"[OK] Captain context ready: {collection_name}")
    
    return {
        "collection_id": result.get("id"),
        "name": collection_name,
        "status": "ready"
    }

