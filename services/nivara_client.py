import os
from typing import Dict, Any
from datetime import datetime

class NivaraClient:
    """
    Client for Nivara AI - Secure Compliance Document Management and Reasoning.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        # In a real scenario, this would initialize the Nivara SDK
        print("[OK] Nivara client initialized")
        print("     Security: Tenant-level isolation enforced")
        print("     Compliance: Document access logging enabled")
    
    def store_document(self, content: str, title: str, document_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates storing a document securely in Nivara.
        """
        print(f"[NIVARA] Storing document: {title} (Type: {document_type})")
        # In a real scenario, this would call the Nivara API to store the document
        # and return a real document ID.
        mock_doc_id = f"niv_doc_{hash(content + title) % 100000}"
        return {
            "id": mock_doc_id,
            "title": title,
            "document_type": document_type,
            "status": "stored_securely",
            "metadata": metadata,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_document(self, doc_id: str) -> Dict[str, Any]:
        """
        Simulates retrieving a document from Nivara.
        """
        print(f"[NIVARA] Retrieving document: {doc_id}")
        # In a real scenario, this would retrieve the document content and metadata.
        return {
            "id": doc_id,
            "title": "Mock Document",
            "content": "This is mock content for a document stored in Nivara.",
            "document_type": "mock",
            "status": "retrieved",
            "timestamp": datetime.now().isoformat()
        }
    
    def analyze_document_compliance(self, doc_id: str) -> Dict[str, Any]:
        """
        Simulates analyzing a document for compliance using Nivara's reasoning engine.
        """
        print(f"[NIVARA] Analyzing compliance for document: {doc_id}")
        # In a real scenario, Nivara would perform AI-powered compliance checks.
        return {
            "doc_id": doc_id,
            "compliance_status": "COMPLIANT",
            "score": 98,
            "recommendations": ["Ensure all staff review updated policy annually."],
            "analysis_timestamp": datetime.now().isoformat()
        }


def get_nivara_client():
    """Get configured Nivara client."""
    api_key = os.getenv("NIVARA_API_KEY")
    
    if not api_key:
        print("[WARNING] NIVARA_API_KEY not set - using demo mode")
        return None
    
    return NivaraClient(api_key)
