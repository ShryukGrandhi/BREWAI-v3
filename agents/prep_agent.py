"""
PrepAgent - Creates purchase orders and fills supplier forms.
"""
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any
from services.browseruse_client import get_browseruse_client
from agents.trace_agent import get_trace_agent
from PIL import Image, ImageDraw


class PrepAgent:
    """Manage inventory prep and supplier orders."""
    
    # Constants for prep planning
    WINGS_PER_ORDER = 12  # Average wings per order
    THAW_TIME_HOURS = 2
    PREP_TIME_MINUTES = 30
    RAIN_BUFFER_MULTIPLIER = 1.15  # 15% extra for rain
    
    def __init__(self, restaurant_name: str):
        self.restaurant_name = restaurant_name
        self.browser_client = get_browseruse_client()
        self.trace = get_trace_agent()
        self.auto_submit = os.getenv("AUTO_SUBMIT_SUPPLIER", "false").lower() == "true"
    
    async def run(
        self,
        peak_orders: float,
        weather_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute prep workflow."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            # Step 1: Calculate wings needed
            self.trace.log(
                agent="PrepAgent",
                action="Calculating inventory requirements",
                metadata={
                    "peak_orders": peak_orders,
                    "rain_hours": weather_summary.get("rain_hours", 0)
                }
            )
            
            total_daily_orders = peak_orders * 8  # Rough estimate for full day
            wings_needed = total_daily_orders * self.WINGS_PER_ORDER
            
            # Apply rain buffer
            if weather_summary.get("rain_hours", 0) > 3:
                wings_needed *= self.RAIN_BUFFER_MULTIPLIER
                buffer_applied = True
            else:
                buffer_applied = False
            
            # Round to reasonable quantities (5 lb boxes)
            wings_lbs = int((wings_needed * 0.1) / 5) * 5  # ~0.1 lb per wing
            
            results["wings_lbs"] = wings_lbs
            results["buffer_applied"] = buffer_applied
            
            # Step 2: Create PO
            tomorrow = datetime.now() + timedelta(days=1)
            delivery_time = tomorrow.replace(hour=8, minute=0)  # 8 AM delivery
            
            po_data = {
                "item": "Chicken Wings (Frozen)",
                "quantity": wings_lbs,
                "unit": "lbs",
                "delivery_date": delivery_time.strftime("%Y-%m-%d %H:%M"),
                "notes": f"Thaw by {(delivery_time + timedelta(hours=self.THAW_TIME_HOURS)).strftime('%H:%M')}. " +
                         f"Prep by {(delivery_time + timedelta(hours=self.THAW_TIME_HOURS, minutes=self.PREP_TIME_MINUTES)).strftime('%H:%M')}. " +
                         f"{'Rain buffer applied (+15%).' if buffer_applied else ''}",
                "estimated_orders": int(total_daily_orders),
                "thaw_time_hours": self.THAW_TIME_HOURS,
                "prep_time_minutes": self.PREP_TIME_MINUTES
            }
            
            results["po_data"] = po_data
            
            self.trace.log(
                agent="PrepAgent",
                action="Created purchase order",
                result=f"{wings_lbs} lbs wings for ~{int(total_daily_orders)} orders",
                metadata=po_data
            )
            
            # Step 3: Save PO to Asana task (would integrate with StaffingAgent)
            po_file = "artifacts/purchase_order.json"
            with open(po_file, 'w') as f:
                json.dump(po_data, f, indent=2)
            results["artifacts"].append(po_file)
            
            # In real implementation, would create Asana task in Inventory Orders section
            self.trace.log(
                agent="PrepAgent",
                action="Saved PO as artifact",
                artifacts=[po_file]
            )
            
            # Step 4: Fill supplier form
            self.trace.log(
                agent="PrepAgent",
                action="Opening supplier portal in new tab",
                url="https://supplier-demo.brew.ai"  # Demo supplier portal
            )
            
            # For demo, use a mock supplier URL
            supplier_url = "https://forms.gle/demo"  # In production, use real supplier portal
            
            supplier_result = await self.browser_client.fill_supplier_form(
                supplier_url,
                po_data,
                submit=self.auto_submit
            )
            
            if supplier_result["success"]:
                # Create screenshot placeholder
                screenshot_file = "artifacts/supplier_po_filled.png"
                self._create_po_screenshot(screenshot_file, po_data)
                results["artifacts"].append(screenshot_file)
                
                action_text = "submitted" if self.auto_submit else "filled (not submitted)"
                self.trace.log(
                    agent="PrepAgent",
                    action=f"Supplier form {action_text}",
                    artifacts=[screenshot_file]
                )
            else:
                self.trace.log(
                    agent="PrepAgent",
                    action="Failed to fill supplier form",
                    result=f"Error: {supplier_result.get('error')}"
                )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="PrepAgent",
                action="Error in prep workflow",
                result=f"Error: {str(e)}"
            )
            results["error"] = str(e)
            return results
    
    def _create_po_screenshot(self, filename: str, po_data: Dict[str, Any]):
        """Create a placeholder screenshot of filled PO form."""
        width = 1000
        height = 800
        img = Image.new('RGB', (width, height), color='#ffffff')
        draw = ImageDraw.Draw(img)
        
        # Header
        draw.rectangle([(0, 0), (width, 80)], fill='#1e40af')
        draw.text((20, 30), "Supplier Portal - Purchase Order", fill='white', font=None)
        
        # Form fields
        y = 120
        fields = [
            ("Item", po_data['item']),
            ("Quantity", f"{po_data['quantity']} {po_data['unit']}"),
            ("Delivery Date", po_data['delivery_date']),
            ("Special Instructions", po_data['notes']),
            ("Estimated Orders", str(po_data['estimated_orders']))
        ]
        
        for label, value in fields:
            draw.text((40, y), f"{label}:", fill='#333', font=None)
            draw.rectangle([(40, y+25), (width-40, y+65)], outline='#ccc', fill='#f9f9f9')
            draw.text((50, y+35), str(value)[:80], fill='#000', font=None)
            y += 90
        
        # Submit button
        if not self.auto_submit:
            draw.rectangle([(40, y+20), (200, y+60)], fill='#10b981')
            draw.text((80, y+35), "READY (NOT SUBMITTED)", fill='white', font=None)
        else:
            draw.rectangle([(40, y+20), (180, y+60)], fill='#059669')
            draw.text((65, y+35), "SUBMITTED ✓", fill='white', font=None)
        
        img.save(filename)


def run_prep_agent(
    restaurant_name: str,
    peak_orders: float,
    weather_summary: Dict[str, Any]
) -> Dict[str, Any]:
    """Synchronous wrapper for prep agent."""
    agent = PrepAgent(restaurant_name)
    return asyncio.run(agent.run(peak_orders, weather_summary))

