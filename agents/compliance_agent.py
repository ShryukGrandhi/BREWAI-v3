"""
ComplianceAgent - Secure compliance reasoning with Nivara AI.
"""
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path


class ComplianceAgent:
    """Agent for secure compliance document management and reasoning."""
    
    def __init__(self, tenant_id: str, trace_agent=None):
        self.tenant_id = tenant_id
        self.trace = trace_agent
        
        print(f"[INIT] ComplianceAgent for tenant: {tenant_id}")
    
    def run(
        self,
        question: str,
        user_role: str = "manager",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run compliance query with secure document access.
        
        Args:
            question: Compliance question
            user_role: User's role (manager, staff, owner)
            context: Operational context (orders, staffing, etc.)
            
        Returns:
            Dict with compliance analysis, citations, security badges
        """
        results = {
            "success": False,
            "question": question,
            "artifacts": []
        }
        
        try:
            # Initialize Nivara client
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Initializing Nivara secure client",
                    metadata={"tenant_id": self.tenant_id}
                )
            
            from services.nivara_client import get_nivara_client
            
            nivara = get_nivara_client()
            
            # Check if documents are available
            docs = nivara.get_tenant_documents(self.tenant_id, user_role)
            
            if not docs:
                results["warning"] = "No compliance documents uploaded yet"
                results["message"] = "Upload documents first to enable compliance reasoning"
                return results
            
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Retrieved compliance documents",
                    result=f"Found {len(docs)} documents (role: {user_role})",
                    metadata={"doc_count": len(docs)}
                )
            
            # Query compliance
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Querying compliance knowledge",
                    metadata={"question": question}
                )
            
            response = nivara.query_compliance(
                tenant_id=self.tenant_id,
                question=question,
                user_role=user_role,
                context=context
            )
            
            if not response.get("success"):
                raise Exception(response.get("error", "Compliance query failed"))
            
            # Store results
            results["success"] = True
            results["answer"] = response["answer"]
            results["status"] = response["status"]
            results["reasoning"] = response["reasoning"]
            results["citations"] = response["citations"]
            results["confidence"] = response["confidence"]
            results["risk_level"] = response.get("risk_level")
            results["recommendations"] = response.get("recommendations", [])
            results["security_badge"] = response["security_badge"]
            results["documents_accessed"] = response["documents_accessed"]
            
            # Save compliance report
            report_file = "artifacts/compliance_report.json"
            import json
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "question": question,
                    "status": results["status"],
                    "confidence": results["confidence"],
                    "risk_level": results["risk_level"],
                    "answer": results["answer"],
                    "citations": results["citations"],
                    "recommendations": results["recommendations"],
                    "security": results["security_badge"],
                    "tenant_id": self.tenant_id,
                    "timestamp": datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
            
            results["artifacts"].append(report_file)
            
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Compliance analysis complete",
                    result=f"Status: {results['status']}, Confidence: {results['confidence']}%",
                    metadata={
                        "risk_level": results["risk_level"],
                        "documents": results["documents_accessed"],
                        "security": "Nivara-protected"
                    }
                )
            
            return results
            
        except Exception as e:
            error_msg = str(e)
            
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Error during compliance check",
                    result=f"Error: {error_msg[:200]}"
                )
            
            print(f"[ERROR] ComplianceAgent: {error_msg}")
            
            results["success"] = False
            results["error"] = error_msg
            
            return results
    
    def upload_document(
        self,
        file_path: str,
        doc_type: str,
        access_level: str = "manager_only",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Upload a compliance document with Nivara security.
        
        Args:
            file_path: Path to document
            doc_type: Type (food_safety, certification, labor, etc.)
            access_level: manager_only, all_staff, owner_only
            metadata: Additional metadata
            
        Returns:
            Dict with upload status and security confirmation
        """
        try:
            if self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Uploading compliance document",
                    metadata={
                        "filename": Path(file_path).name,
                        "doc_type": doc_type,
                        "access_level": access_level
                    }
                )
            
            from services.nivara_client import get_nivara_client
            
            nivara = get_nivara_client()
            
            result = nivara.upload_document(
                tenant_id=self.tenant_id,
                file_path=file_path,
                doc_type=doc_type,
                access_level=access_level,
                metadata=metadata
            )
            
            if result.get("success") and self.trace:
                self.trace.log(
                    agent="ComplianceAgent",
                    action="Document uploaded securely",
                    result=result["message"],
                    metadata={
                        "doc_id": result["doc_id"],
                        "security": "Nivara-protected"
                    }
                )
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Document upload failed: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }


def run_compliance_agent(
    tenant_id: str,
    question: str,
    user_role: str = "manager",
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Convenience function to run compliance agent."""
    from agents.trace_agent import TraceAgent
    
    trace = TraceAgent()
    agent = ComplianceAgent(tenant_id, trace)
    
    return agent.run(question, user_role, context)

