"""
KnowledgeMapAgent - Build interactive knowledge graph of agent reasoning.
"""
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
import networkx as nx


class KnowledgeMapAgent:
    """Agent to build knowledge graph from all agent outputs."""
    
    def __init__(self, tenant_id: str, trace_agent=None):
        self.tenant_id = tenant_id
        self.trace = trace_agent
        self.graph = nx.DiGraph()
        
        print(f"[INIT] KnowledgeMapAgent for tenant: {tenant_id}")
    
    def run(
        self,
        forecast_data: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None,
        staffing_data: Optional[Dict[str, Any]] = None,
        prep_data: Optional[Dict[str, Any]] = None,
        scraper_data: Optional[Dict[str, Any]] = None,
        compliance_data: Optional[Dict[str, Any]] = None,
        geo_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build knowledge graph from all agent outputs.
        
        Args:
            forecast_data: Forecast agent results
            weather_data: Weather agent results
            staffing_data: Staffing agent results
            prep_data: Prep agent results
            scraper_data: Scraper agent results
            compliance_data: Compliance agent results
            geo_data: Geo agent results
            
        Returns:
            Dict with graph data and visualization HTML
        """
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            if self.trace:
                self.trace.log(
                    agent="KnowledgeMapAgent",
                    action="Building knowledge graph",
                    metadata={"tenant_id": self.tenant_id}
                )
            
            # Add center node
            self._add_center_node()
            
            # Build graph from each agent's output
            if weather_data:
                self._add_weather_nodes(weather_data)
            
            if forecast_data:
                self._add_forecast_nodes(forecast_data)
            
            if staffing_data:
                self._add_staffing_nodes(staffing_data)
            
            if prep_data:
                self._add_prep_nodes(prep_data)
            
            if scraper_data:
                self._add_review_nodes(scraper_data)
            
            if compliance_data:
                self._add_compliance_nodes(compliance_data)
            
            if geo_data:
                self._add_geo_nodes(geo_data)
            
            # Add menu nodes
            self._add_menu_nodes()
            
            # Calculate edge weights and impact scores
            self._calculate_edge_weights()
            
            # Save graph data
            graph_file = "artifacts/knowledge_graph.json"
            graph_data = self._export_graph_data()
            
            with open(graph_file, 'w', encoding='utf-8') as f:
                json.dump(graph_data, f, indent=2, ensure_ascii=False)
            
            results["artifacts"].append(graph_file)
            
            if self.trace:
                self.trace.log(
                    agent="KnowledgeMapAgent",
                    action="Knowledge graph built",
                    result=f"Nodes: {len(self.graph.nodes())}, Edges: {len(self.graph.edges())}",
                    metadata={
                        "nodes": len(self.graph.nodes()),
                        "edges": len(self.graph.edges())
                    }
                )
            
            results["success"] = True
            results["graph_data"] = graph_data
            results["node_count"] = len(self.graph.nodes())
            results["edge_count"] = len(self.graph.edges())
            
            return results
            
        except Exception as e:
            error_msg = str(e)
            
            if self.trace:
                self.trace.log(
                    agent="KnowledgeMapAgent",
                    action="Error building graph",
                    result=f"Error: {error_msg[:200]}"
                )
            
            print(f"[ERROR] KnowledgeMapAgent: {error_msg}")
            
            results["success"] = False
            results["error"] = error_msg
            
            return results
    
    def _add_center_node(self):
        """Add central restaurant node."""
        self.graph.add_node(
            "Charcoal Eats US",
            type="restaurant",
            cluster="CENTER",
            color="#FF6B35",
            size=50,
            title="Central Hub - All decisions connect here",
            shape="star"
        )
    
    def _add_weather_nodes(self, weather_data: Dict[str, Any]):
        """Add weather condition nodes."""
        if not weather_data.get('success'):
            return
        
        # Rain node
        rain_hours = weather_data.get('rain_hours', 0)
        if rain_hours > 0:
            rain_node = "Rain 🌧️"
            self.graph.add_node(
                rain_node,
                type="condition",
                cluster="CONDITIONS",
                color="#FCD34D",
                size=30,
                title=f"Rain expected {rain_hours} hours",
                impact_score=0.45,
                confidence=0.9
            )
            
            # Rain → Delivery Surge
            surge_node = "Delivery Surge +45%"
            self.graph.add_node(
                surge_node,
                type="effect",
                cluster="CONDITIONS",
                color="#FBBF24",
                size=25,
                title="Rain drives delivery orders up 45%"
            )
            
            self.graph.add_edge(
                rain_node,
                surge_node,
                relationship="causes",
                confidence=0.9,
                impact=0.45
            )
            
            # Connect to center
            self.graph.add_edge("Charcoal Eats US", rain_node, relationship="observes")
        
        # Temperature
        temp = weather_data.get('avg_temp', 65)
        if temp > 75:
            temp_node = f"Hot Day {temp}°F ☀️"
            self.graph.add_node(
                temp_node,
                type="condition",
                cluster="CONDITIONS",
                color="#FCD34D",
                size=25,
                title=f"High temperature increases cold drink demand",
                impact_score=0.2
            )
            self.graph.add_edge("Charcoal Eats US", temp_node, relationship="observes")
    
    def _add_forecast_nodes(self, forecast_data: Dict[str, Any]):
        """Add demand forecast nodes."""
        if not forecast_data.get('success'):
            return
        
        # Peak hour node
        peak_hour = forecast_data.get('peak_hour', 18)
        peak_orders = forecast_data.get('peak_orders', 40)
        
        peak_node = f"Peak: {peak_hour}:00 ({peak_orders} orders)"
        self.graph.add_node(
            peak_node,
            type="forecast",
            cluster="FORECAST",
            color="#8B5CF6",
            size=35,
            title=f"LSTM predicts peak at {peak_hour}:00",
            confidence=forecast_data.get('confidence', 0.85)
        )
        
        self.graph.add_edge("Charcoal Eats US", peak_node, relationship="forecasts")
        
        # Daily orders
        daily_orders = forecast_data.get('total_daily_orders', 193)
        orders_node = f"Forecast: {int(daily_orders)} orders"
        self.graph.add_node(
            orders_node,
            type="forecast",
            cluster="FORECAST",
            color="#A78BFA",
            size=30,
            title=f"Expected daily orders: {int(daily_orders)}"
        )
        
        self.graph.add_edge(peak_node, orders_node, relationship="contributes_to")
        
        # Revenue
        revenue = forecast_data.get('total_daily_revenue', 3571)
        revenue_node = f"Revenue: ${revenue:,.0f}"
        self.graph.add_node(
            revenue_node,
            type="forecast",
            cluster="FORECAST",
            color="#A78BFA",
            size=28,
            title=f"Projected revenue: ${revenue:,.2f}"
        )
        
        self.graph.add_edge(orders_node, revenue_node, relationship="generates")
    
    def _add_staffing_nodes(self, staffing_data: Dict[str, Any]):
        """Add staffing decision nodes."""
        # Staff members
        staff_names = ["Bobby Maguire", "Mary Mcunnigham", "Lia Hunt", "Tory Kest"]
        
        for name in staff_names:
            staff_node = f"👤 {name}"
            self.graph.add_node(
                staff_node,
                type="staff",
                cluster="STAFF",
                color="#60A5FA",
                size=25,
                title=f"Staff member: {name}",
                role="Cook" if "Bobby" in name or "Mary" in name else "Cashier"
            )
            
            self.graph.add_edge("Charcoal Eats US", staff_node, relationship="employs")
        
        # Staffing decision
        decision_node = "Decision: Add Cook Tomorrow"
        self.graph.add_node(
            decision_node,
            type="decision",
            cluster="DECISIONS",
            color="#8B5CF6",
            size=35,
            title="AI Decision: Additional cook needed for peak volume",
            confidence=0.88
        )
        
        # Connect forecast to decision
        if "Peak:" in str(list(self.graph.nodes())):
            peak_nodes = [n for n in self.graph.nodes() if "Peak:" in n]
            if peak_nodes:
                self.graph.add_edge(
                    peak_nodes[0],
                    decision_node,
                    relationship="triggers",
                    confidence=0.88,
                    impact=0.7
                )
        
        # Assign to Mary
        assign_node = "Assign: Mary Fryer"
        self.graph.add_node(
            assign_node,
            type="action",
            cluster="TASKS",
            color="#10B981",
            size=28,
            title="Mary is fryer-certified"
        )
        
        self.graph.add_edge(decision_node, assign_node, relationship="executes")
        self.graph.add_edge(assign_node, "👤 Mary Mcunnigham", relationship="assigns_to")
    
    def _add_prep_nodes(self, prep_data: Dict[str, Any]):
        """Add prep and inventory nodes."""
        # Wings prep
        wings_node = "🍗 Wings Prep"
        self.graph.add_node(
            wings_node,
            type="prep",
            cluster="TASKS",
            color="#F59E0B",
            size=30,
            title="Wings require 2hr thaw + 30min prep"
        )
        
        self.graph.add_edge("Charcoal Eats US", wings_node, relationship="requires")
        
        # Thaw deadline
        thaw_node = "Thaw Deadline: 11:00am"
        self.graph.add_node(
            thaw_node,
            type="deadline",
            cluster="TASKS",
            color="#EF4444",
            size=28,
            title="Must start thaw by 9:00am for lunch service",
            risk_level="MEDIUM"
        )
        
        self.graph.add_edge(wings_node, thaw_node, relationship="must_meet")
        
        # Connect to forecast
        if any("Peak:" in n for n in self.graph.nodes()):
            self.graph.add_edge(
                thaw_node,
                [n for n in self.graph.nodes() if "Peak:" in n][0],
                relationship="enables"
            )
    
    def _add_review_nodes(self, scraper_data: Dict[str, Any]):
        """Add customer review theme nodes."""
        themes = [
            ("Slow Service", "negative", "#EF4444", "8 mentions, impacts wait time"),
            ("Great Wings 🍗", "positive", "#10B981", "15 mentions, signature item"),
            ("Crowded at Lunch", "neutral", "#F59E0B", "12 mentions, capacity issue")
        ]
        
        for theme, sentiment, color, desc in themes:
            theme_node = f"📝 {theme}"
            self.graph.add_node(
                theme_node,
                type="review",
                cluster="REVIEWS",
                color=color,
                size=25,
                title=desc,
                sentiment=sentiment
            )
            
            self.graph.add_edge("Charcoal Eats US", theme_node, relationship="receives_feedback")
            
            # Connect slow service to staffing decision
            if "Slow Service" in theme:
                decision_nodes = [n for n in self.graph.nodes() if "Decision:" in n]
                if decision_nodes:
                    self.graph.add_edge(
                        theme_node,
                        decision_nodes[0],
                        relationship="motivates",
                        confidence=0.75
                    )
    
    def _add_compliance_nodes(self, compliance_data: Dict[str, Any]):
        """Add compliance rule nodes (Nivara secured)."""
        rules = [
            ("Fryer Cert Required", "All fryer operators must be certified", "CRITICAL"),
            ("Thaw Limit: 2hr Max", "Cold water thaw maximum 2 hours", "CRITICAL"),
            ("Food Code NYC §81", "NYC Health Code Article 81 compliance", "HIGH")
        ]
        
        for rule_name, desc, risk in rules:
            rule_node = f"🔒 {rule_name}"
            self.graph.add_node(
                rule_node,
                type="compliance",
                cluster="COMPLIANCE",
                color="#F97316",
                size=30,
                title=f"{desc} (Risk: {risk})",
                risk_level=risk,
                secured_by="Nivara",
                access_level="manager_only"
            )
            
            self.graph.add_edge("Charcoal Eats US", rule_node, relationship="must_comply")
            
            # Connect fryer cert to Mary assignment
            if "Fryer Cert" in rule_name:
                assign_nodes = [n for n in self.graph.nodes() if "Assign: Mary" in n]
                if assign_nodes:
                    self.graph.add_edge(
                        rule_node,
                        assign_nodes[0],
                        relationship="requires",
                        confidence=1.0,
                        impact=1.0
                    )
            
            # Connect thaw limit to deadline
            if "Thaw Limit" in rule_name:
                thaw_nodes = [n for n in self.graph.nodes() if "Thaw Deadline" in n]
                if thaw_nodes:
                    self.graph.add_edge(
                        rule_node,
                        thaw_nodes[0],
                        relationship="enforces",
                        confidence=1.0
                    )
    
    def _add_geo_nodes(self, geo_data: Dict[str, Any]):
        """Add expansion location nodes."""
        locations = [
            ("SF Marina", 0.85, "High foot traffic, low competition"),
            ("SF Mission", 0.78, "Young demographic, medium competition"),
            ("SF SOMA", 0.72, "Business district, high rent")
        ]
        
        for loc, roi, desc in locations:
            loc_node = f"📍 {loc} (ROI: {roi:.0%})"
            self.graph.add_node(
                loc_node,
                type="expansion",
                cluster="EXPANSION",
                color="#06B6D4",
                size=25,
                title=desc,
                roi_score=roi
            )
            
            self.graph.add_edge("Charcoal Eats US", loc_node, relationship="considers")
    
    def _add_menu_nodes(self):
        """Add menu item nodes."""
        menu_items = [
            ("🍗 Wings", "#10B981", "Signature item"),
            ("🍟 Fries", "#10B981", "Popular side"),
            ("🍔 Combo Meal", "#10B981", "Best value")
        ]
        
        for item, color, desc in menu_items:
            self.graph.add_node(
                item,
                type="menu",
                cluster="MENU",
                color=color,
                size=25,
                title=desc
            )
            
            self.graph.add_edge("Charcoal Eats US", item, relationship="serves")
            
            # Connect wings to prep
            if "Wings" in item:
                wings_prep = [n for n in self.graph.nodes() if "Wings Prep" in n]
                if wings_prep:
                    self.graph.add_edge(wings_prep[0], item, relationship="prepares")
    
    def _calculate_edge_weights(self):
        """Calculate edge weights based on confidence and impact."""
        for u, v, data in self.graph.edges(data=True):
            confidence = data.get('confidence', 0.5)
            impact = data.get('impact', 0.5)
            data['weight'] = confidence * impact
            data['width'] = max(1, int(confidence * impact * 5))
    
    def _export_graph_data(self) -> Dict[str, Any]:
        """Export graph to JSON format."""
        nodes = []
        edges = []
        
        for node, data in self.graph.nodes(data=True):
            nodes.append({
                "id": node,
                **data
            })
        
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                **data
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "tenant_id": self.tenant_id,
            "generated_at": datetime.now().isoformat()
        }


def run_knowledge_map_agent(
    tenant_id: str,
    forecast_data: Optional[Dict[str, Any]] = None,
    weather_data: Optional[Dict[str, Any]] = None,
    staffing_data: Optional[Dict[str, Any]] = None,
    prep_data: Optional[Dict[str, Any]] = None,
    scraper_data: Optional[Dict[str, Any]] = None,
    compliance_data: Optional[Dict[str, Any]] = None,
    geo_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Convenience function to run knowledge map agent."""
    from agents.trace_agent import TraceAgent
    
    trace = TraceAgent()
    agent = KnowledgeMapAgent(tenant_id, trace)
    
    return agent.run(
        forecast_data=forecast_data,
        weather_data=weather_data,
        staffing_data=staffing_data,
        prep_data=prep_data,
        scraper_data=scraper_data,
        compliance_data=compliance_data,
        geo_data=geo_data
    )

