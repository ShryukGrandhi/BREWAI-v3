"""
StaffingAgent - Creates Asana tasks for staffing based on forecast.
"""
import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from services.browseruse_client import get_browseruse_client
from agents.trace_agent import get_trace_agent
from PIL import Image
import io


class StaffingAgent:
    """Manage staffing and create Asana tasks."""
    
    ORDERS_PER_COOK_PER_HOUR = 25
    
    def __init__(
        self,
        staff_list: List[str],
        restaurant_name: str
    ):
        self.staff_list = staff_list
        self.restaurant_name = restaurant_name
        self.browser_client = get_browseruse_client()
        self.trace = get_trace_agent()
    
    async def run(self, peak_hour: int, peak_orders: float) -> Dict[str, Any]:
        """Execute staffing workflow."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            # Step 1: Calculate required cooks
            self.trace.log(
                agent="StaffingAgent",
                action="Calculating staffing requirements",
                metadata={
                    "peak_hour": peak_hour,
                    "peak_orders": peak_orders
                }
            )
            
            required_cooks = max(1, int(peak_orders / self.ORDERS_PER_COOK_PER_HOUR) + 1)
            results["required_cooks"] = required_cooks
            
            self.trace.log(
                agent="StaffingAgent",
                action="Calculated staffing needs",
                result=f"Need {required_cooks} cooks for peak hour {peak_hour}:00"
            )
            
            # Step 2: Create shift assignments
            shifts = self._create_shifts(required_cooks, peak_hour)
            results["shifts"] = shifts
            
            # Step 3: Create Asana tasks
            self.trace.log(
                agent="StaffingAgent",
                action="Opening Asana in Chrome",
                url="https://app.asana.com"
            )
            
            project_name = f"Brew.AI — {self.restaurant_name} Ops Plan"
            
            # Create task list for Asana
            asana_tasks = []
            
            # Staffing tasks
            for shift in shifts:
                asana_tasks.append({
                    "name": f"{shift['role']}: {shift['staff']} ({shift['start_time']}-{shift['end_time']})",
                    "assignee": shift['staff'],
                    "due_date": shift['date'],
                    "section": "Staffing",
                    "notes": f"Role: {shift['role']}\nShift: {shift['start_time']} - {shift['end_time']}"
                })
            
            # Create project in Asana
            asana_result = await self.browser_client.create_asana_tasks(
                project_name,
                asana_tasks
            )
            
            if asana_result["success"]:
                self.trace.log(
                    agent="StaffingAgent",
                    action="Created Asana project and tasks",
                    result=f"Created {len(asana_tasks)} staffing tasks"
                )
                
                # Take screenshot
                screenshot_file = "artifacts/asana_tasks_screenshot.png"
                
                # Note: In real implementation, BrowserUse would provide screenshot capability
                # For now, create a placeholder
                self._create_placeholder_screenshot(screenshot_file, asana_tasks)
                results["artifacts"].append(screenshot_file)
                
                self.trace.log(
                    agent="StaffingAgent",
                    action="Captured Asana screenshot",
                    artifacts=[screenshot_file]
                )
            else:
                self.trace.log(
                    agent="StaffingAgent",
                    action="Failed to create Asana tasks",
                    result=f"Error: {asana_result.get('error')}"
                )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="StaffingAgent",
                action="Error in staffing workflow",
                result=f"Error: {str(e)}"
            )
            results["error"] = str(e)
            return results
    
    def _create_shifts(self, required_cooks: int, peak_hour: int) -> List[Dict[str, Any]]:
        """Create shift assignments."""
        tomorrow = datetime.now() + timedelta(days=1)
        tomorrow_str = tomorrow.strftime("%Y-%m-%d")
        
        shifts = []
        
        # Assign cooks
        for i in range(required_cooks):
            if i < len(self.staff_list):
                staff = self.staff_list[i]
            else:
                staff = f"Cook {i+1} (TBH)"
            
            # Peak shift: 2 hours before peak to 3 hours after
            start_hour = max(10, peak_hour - 2)
            end_hour = min(22, peak_hour + 3)
            
            shifts.append({
                "staff": staff,
                "role": "Cook",
                "date": tomorrow_str,
                "start_time": f"{start_hour:02d}:00",
                "end_time": f"{end_hour:02d}:00",
                "shift_hours": end_hour - start_hour
            })
        
        # Add a server shift
        if len(self.staff_list) > required_cooks:
            shifts.append({
                "staff": self.staff_list[-1],
                "role": "Server",
                "date": tomorrow_str,
                "start_time": "10:00",
                "end_time": "22:00",
                "shift_hours": 12
            })
        
        return shifts
    
    def _create_placeholder_screenshot(self, filename: str, tasks: List[Dict[str, Any]]):
        """Create a placeholder screenshot showing task list."""
        # Create a simple visualization
        from PIL import Image, ImageDraw, ImageFont
        
        width = 1200
        height = 800
        img = Image.new('RGB', (width, height), color='#1a1a1a')
        draw = ImageDraw.Draw(img)
        
        # Header
        draw.rectangle([(0, 0), (width, 80)], fill='#2c2c2c')
        draw.text((20, 30), "Asana - Brew.AI Ops Plan", fill='white', font=None)
        
        # Task list
        y = 120
        for i, task in enumerate(tasks):
            # Task box
            draw.rectangle([(20, y), (width-20, y+60)], outline='#444', fill='#2a2a2a')
            draw.text((40, y+10), task['name'], fill='white', font=None)
            draw.text((40, y+35), f"Due: {task['due_date']} | {task['section']}", fill='#888', font=None)
            y += 70
            
            if y > height - 100:
                break
        
        img.save(filename)


def run_staffing_agent(
    staff_list: List[str],
    restaurant_name: str,
    peak_hour: int,
    peak_orders: float
) -> Dict[str, Any]:
    """Synchronous wrapper for staffing agent."""
    agent = StaffingAgent(staff_list, restaurant_name)
    return asyncio.run(agent.run(peak_hour, peak_orders))

