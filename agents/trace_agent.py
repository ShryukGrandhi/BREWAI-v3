"""
TraceAgent - Logs all agent actions with timestamps for full transparency.
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import requests


class TraceAgent:
    """Centralized trace logging for all agents."""
    
    def __init__(self, trace_file: str = "artifacts/trace.json"):
        self.trace_file = trace_file
        self.traces: List[Dict[str, Any]] = []
        self.metorial_project_id = os.getenv("METORIAL_PROJECT_ID")
        
        # Ensure artifacts directory exists
        os.makedirs(os.path.dirname(trace_file), exist_ok=True)
        
        # Load existing traces if available
        if os.path.exists(trace_file):
            try:
                with open(trace_file, 'r') as f:
                    self.traces = json.load(f)
            except:
                self.traces = []
    
    def log(
        self,
        agent: str,
        action: str,
        result: Optional[str] = None,
        url: Optional[str] = None,
        selector: Optional[str] = None,
        artifacts: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Log an agent action.
        
        Args:
            agent: Agent name (e.g., "ScraperAgent")
            action: Action description (e.g., "Opened Google Maps")
            result: Result status or message
            url: URL accessed (if applicable)
            selector: CSS selector used (if applicable)
            artifacts: List of artifact file paths created
            metadata: Additional metadata
            
        Returns:
            The trace entry
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "action": action,
            "result": result,
            "url": url,
            "selector": selector,
            "artifacts": artifacts or [],
            "metadata": metadata or {}
        }
        
        self.traces.append(entry)
        self._save()
        
        # Send to Metorial if configured
        if self.metorial_project_id:
            self._send_to_metorial(entry)
        
        return entry
    
    def _save(self):
        """Save traces to file."""
        try:
            with open(self.trace_file, 'w') as f:
                json.dump(self.traces, f, indent=2)
        except Exception as e:
            print(f"Failed to save trace: {e}")
    
    def _send_to_metorial(self, entry: Dict[str, Any]):
        """Send trace entry to Metorial for monitoring."""
        try:
            url = f"https://api.metorial.com/v1/projects/{self.metorial_project_id}/traces"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('METORIAL_API_KEY')}"
            }
            
            response = requests.post(
                url,
                json=entry,
                headers=headers,
                timeout=5
            )
            response.raise_for_status()
            
        except Exception as e:
            # Silent fail - don't block on monitoring
            print(f"Metorial trace failed: {e}")
    
    def get_traces(
        self,
        agent: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get traces, optionally filtered by agent.
        
        Args:
            agent: Filter by agent name
            limit: Maximum number of traces to return
            
        Returns:
            List of trace entries
        """
        traces = self.traces
        
        if agent:
            traces = [t for t in traces if t["agent"] == agent]
        
        if limit:
            traces = traces[-limit:]
        
        return traces
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics of all traces."""
        agents = {}
        for trace in self.traces:
            agent = trace["agent"]
            if agent not in agents:
                agents[agent] = {
                    "count": 0,
                    "artifacts": [],
                    "actions": []
                }
            agents[agent]["count"] += 1
            agents[agent]["artifacts"].extend(trace.get("artifacts", []))
            agents[agent]["actions"].append(trace["action"])
        
        return {
            "total_traces": len(self.traces),
            "agents": agents,
            "start_time": self.traces[0]["timestamp"] if self.traces else None,
            "end_time": self.traces[-1]["timestamp"] if self.traces else None
        }
    
    def clear(self):
        """Clear all traces."""
        self.traces = []
        self._save()


# Global trace agent instance
_trace_agent: Optional[TraceAgent] = None


def get_trace_agent() -> TraceAgent:
    """Get or create global trace agent."""
    global _trace_agent
    if _trace_agent is None:
        _trace_agent = TraceAgent()
    return _trace_agent

