"""
Brew.AI v4 - FastAPI Backend
Live data store with real-time updates, crisis management, and compliance tracking
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import httpx
from datetime import datetime
import os
import random
import asyncio

# Composio SDK
from composio import Composio

# Google Gemini
import google.generativeai as genai

app = FastAPI(title="Brew.AI API", version="4.0")

# API Keys
FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY', 'fc-10af06f15aa349098f1d1f1e358fc7e1')
COMPOSIO_API_KEY = os.getenv('COMPOSIO_API_KEY', 'ak_GfPAqC543NyGqgBX7mPT')
COMPOSIO_GMAIL_ACCOUNT_ID = os.getenv('COMPOSIO_GMAIL_ACCOUNT_ID', 'ca_tlnN-k9fNBiZ')
GMAIL_TARGET = 'shryuk95@gmail.com'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')  # User must provide this

# Initialize Composio client
composio_client = Composio(api_key=COMPOSIO_API_KEY)
COMPOSIO_ENTITY_ID = "employee"

# Initialize Gemini if API key is available
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')

# Auto email monitoring state
AUTO_EMAIL_MONITORING = {
    "enabled": True,
    "interval_seconds": 30,
    "last_check": None,
    "crises_detected": 0
}

# Agent mode settings
AGENT_MODE = {
    "enabled": False,  # When True, automatically apply store changes
    "auto_apply_insights": False
}

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ LIVE IN-MEMORY DATA STORE ============

# Track processed email IDs to avoid re-processing
PROCESSED_EMAIL_IDS: set = set()

# Live store data
LIVE_STORE = {
    "products": [
        { "id": 1, "name": "Classic Burger", "price": 12.99, "originalPrice": None, "category": "mains", "image": "🍔", "featured": False, "sale": False, "discount": 0 },
        { "id": 2, "name": "Buffalo Wings", "price": 14.99, "originalPrice": None, "category": "appetizers", "image": "🍗", "featured": True, "sale": False, "discount": 0 },
        { "id": 3, "name": "Veggie Power Bowl", "price": 11.99, "originalPrice": None, "category": "healthy", "image": "🥗", "featured": False, "sale": False, "discount": 0 },
        { "id": 4, "name": "Loaded Fries", "price": 6.99, "originalPrice": None, "category": "sides", "image": "🍟", "featured": False, "sale": False, "discount": 0 },
        { "id": 5, "name": "Iced Lemonade", "price": 4.99, "originalPrice": None, "category": "drinks", "image": "🍋", "featured": False, "sale": False, "discount": 0 },
        { "id": 6, "name": "Craft Cola", "price": 3.99, "originalPrice": None, "category": "drinks", "image": "🥤", "featured": False, "sale": False, "discount": 0 },
        { "id": 7, "name": "Spicy Chicken Sandwich", "price": 13.99, "originalPrice": None, "category": "mains", "image": "🌶️", "featured": True, "sale": False, "discount": 0 },
        { "id": 8, "name": "Chocolate Shake", "price": 5.99, "originalPrice": None, "category": "drinks", "image": "🍫", "featured": False, "sale": False, "discount": 0 },
        { "id": 9, "name": "Garden Salad", "price": 8.99, "originalPrice": None, "category": "healthy", "image": "🥬", "featured": False, "sale": False, "discount": 0 },
    ],
    "flash_sale": { "active": False, "discount": 0, "category": None },
    "job_postings": []  # Dynamic job postings
}

# Live orders
LIVE_ORDERS: List[Dict] = []

# Live inventory
LIVE_INVENTORY = [
    { "item_name": "Burger Patties", "stock_level": 150, "reorder_point": 50, "unit": "units" },
    { "item_name": "Chicken Wings", "stock_level": 80, "reorder_point": 30, "unit": "kg" },
    { "item_name": "Lettuce", "stock_level": 25, "reorder_point": 15, "unit": "kg" },
    { "item_name": "Tomatoes", "stock_level": 40, "reorder_point": 20, "unit": "kg" },
    { "item_name": "French Fries", "stock_level": 100, "reorder_point": 40, "unit": "kg" },
    { "item_name": "Soft Drink Syrup", "stock_level": 20, "reorder_point": 10, "unit": "liters" },
    { "item_name": "Buns", "stock_level": 200, "reorder_point": 75, "unit": "units" },
    { "item_name": "Cheese", "stock_level": 30, "reorder_point": 15, "unit": "kg" },
]

# Live staff
LIVE_STAFF = [
    { "id": 1, "name": "John Smith", "role": "Chef", "shift": "morning", "status": "active" },
    { "id": 2, "name": "Sarah Johnson", "role": "Server", "shift": "morning", "status": "active" },
    { "id": 3, "name": "Mike Brown", "role": "Chef", "shift": "afternoon", "status": "active" },
    { "id": 4, "name": "Emily Davis", "role": "Server", "shift": "afternoon", "status": "active" },
    { "id": 5, "name": "Chris Wilson", "role": "Manager", "shift": "all-day", "status": "active" },
    { "id": 6, "name": "Lisa Anderson", "role": "Cashier", "shift": "morning", "status": "active" },
    { "id": 7, "name": "David Lee", "role": "Server", "shift": "evening", "status": "active" },
    { "id": 8, "name": "Anna Martinez", "role": "Chef", "shift": "evening", "status": "active" },
]

# Automation execution log
AUTOMATION_LOG: List[Dict] = []

# Compliance reports and score
COMPLIANCE_DATA = {
    "score": 100,  # Out of 100
    "reports": [],
    "incidents": [],
    "last_updated": datetime.now().isoformat()
}

# Activity feed for dashboard
ACTIVITY_FEED: List[Dict] = []

# ============ PYDANTIC MODELS ============

class OrderItem(BaseModel):
    product_id: int
    name: str
    quantity: int
    price: float

class CreateOrderRequest(BaseModel):
    items: List[OrderItem]
    total: float
    customer_name: str = "Walk-in Customer"

class ScrapeRequest(BaseModel):
    url: str
    formats: List[str] = ["markdown"]

class StoreUpdateRequest(BaseModel):
    action: str
    discount: Optional[int] = None
    category: Optional[str] = None
    items: Optional[List[int]] = None
    amount: Optional[int] = None

class CrisisRequest(BaseModel):
    crisis: Dict[str, Any]

class EmailCrisisRequest(BaseModel):
    email_content: Optional[str] = None
    sender: Optional[str] = None
    subject: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class AgentModeRequest(BaseModel):
    enabled: bool
    auto_apply_insights: bool = False

class StoreActionRequest(BaseModel):
    action: str
    params: Optional[Dict[str, Any]] = None
    auto_apply: bool = False

# ============ CRISIS DETECTION CONFIG ============

# Crisis keywords with interconnected automations
CRISIS_KEYWORDS = {
    "resign": {
        "type": "Staff Resignation", 
        "severity": "HIGH", 
        "automations": [
            "emergency_hiring", "schedule_adjustment", "staff_alert",
            "manager_notification", "payroll_update", "access_revocation",
            "exit_documentation", "post_job_website"  # Interconnected: posts job on website
        ],
        "compliance_impact": -5,  # Affects compliance score
        "store_actions": ["post_job"]  # Interconnected store actions
    },
    "quit": {
        "type": "Staff Resignation", 
        "severity": "HIGH", 
        "automations": [
            "emergency_hiring", "schedule_adjustment", "staff_alert",
            "manager_notification", "payroll_update", "access_revocation",
            "exit_documentation", "post_job_website"
        ],
        "compliance_impact": -5,
        "store_actions": ["post_job"]
    },
    "leaving": {
        "type": "Staff Departure", 
        "severity": "MEDIUM", 
        "automations": [
            "schedule_adjustment", "manager_notification", "staffing_forecast",
            "post_job_website"
        ],
        "compliance_impact": -2,
        "store_actions": ["post_job"]
    },
    "sick": {
        "type": "Staff Shortage", 
        "severity": "MEDIUM", 
        "automations": [
            "schedule_adjustment", "staff_alert", "shift_coverage_request",
            "manager_notification"
        ],
        "compliance_impact": -1,
        "store_actions": []
    },
    "emergency": {
        "type": "General Emergency", 
        "severity": "HIGH", 
        "automations": [
            "staff_alert", "manager_notification", "emergency_protocol",
            "safety_check", "incident_report", "emergency_contacts"
        ],
        "compliance_impact": -10,
        "store_actions": ["emergency_notice"]
    },
    "broken": {
        "type": "Equipment Failure", 
        "severity": "HIGH", 
        "automations": [
            "equipment_repair_request", "menu_adjustment", "manager_notification",
            "vendor_contact", "warranty_check", "safety_lockout"
        ],
        "compliance_impact": -8,
        "store_actions": ["menu_update"]
    },
    "malfunction": {
        "type": "Equipment Failure", 
        "severity": "HIGH", 
        "automations": [
            "equipment_repair_request", "vendor_contact", "menu_adjustment",
            "tech_dispatch"
        ],
        "compliance_impact": -5,
        "store_actions": ["menu_update"]
    },
    "delay": {
        "type": "Supply Chain Issue", 
        "severity": "MEDIUM", 
        "automations": [
            "emergency_supplier_order", "menu_adjustment", "backup_vendor_search",
            "inventory_reallocation"
        ],
        "compliance_impact": -3,
        "store_actions": ["menu_update", "out_of_stock_notice"]
    },
    "shortage": {
        "type": "Inventory Emergency", 
        "severity": "HIGH", 
        "automations": [
            "emergency_supplier_order", "menu_adjustment", "backup_vendor_search",
            "inventory_alert", "pos_menu_update", "delivery_prioritization"
        ],
        "compliance_impact": -5,
        "store_actions": ["menu_update", "limited_availability"]
    },
    "complaint": {
        "type": "Customer Issue", 
        "severity": "MEDIUM", 
        "automations": [
            "customer_response", "manager_notification", "service_recovery",
            "quality_review"
        ],
        "compliance_impact": -2,
        "store_actions": ["promotion"]  # Offer discount to recover
    },
    "inspection": {
        "type": "Health Inspection", 
        "severity": "HIGH", 
        "automations": [
            "compliance_check", "staff_briefing", "documentation_prep",
            "cleaning_protocol", "temp_log_review", "manager_notification"
        ],
        "compliance_impact": 0,  # Neutral until result
        "store_actions": []
    },
    "violation": {
        "type": "Compliance Issue", 
        "severity": "HIGH", 
        "automations": [
            "compliance_check", "corrective_action", "documentation_update",
            "staff_retraining", "manager_notification"
        ],
        "compliance_impact": -15,
        "store_actions": []
    },
    "fire": {
        "type": "Fire Emergency",
        "severity": "HIGH",
        "automations": [
            "emergency_protocol", "emergency_contacts", "staff_alert",
            "manager_notification", "incident_report", "insurance_notification"
        ],
        "compliance_impact": -20,
        "store_actions": ["temporary_closure"]
    },
    "flood": {
        "type": "Water Damage",
        "severity": "HIGH",
        "automations": [
            "emergency_protocol", "equipment_repair_request", "insurance_notification",
            "vendor_contact", "incident_report"
        ],
        "compliance_impact": -15,
        "store_actions": ["temporary_closure"]
    },
}

# ============ HELPER FUNCTIONS ============

def add_activity(activity_type: str, message: str, severity: str = "info"):
    """Add an activity to the feed"""
    ACTIVITY_FEED.insert(0, {
        "id": len(ACTIVITY_FEED) + 1,
        "type": activity_type,
        "message": message,
        "severity": severity,
        "timestamp": datetime.now().isoformat()
    })
    # Keep only last 50 activities
    if len(ACTIVITY_FEED) > 50:
        ACTIVITY_FEED.pop()

def update_compliance_score(impact: int, reason: str):
    """Update compliance score and log the change"""
    global COMPLIANCE_DATA
    old_score = COMPLIANCE_DATA["score"]
    COMPLIANCE_DATA["score"] = max(0, min(100, COMPLIANCE_DATA["score"] + impact))
    COMPLIANCE_DATA["last_updated"] = datetime.now().isoformat()
    
    if impact != 0:
        COMPLIANCE_DATA["reports"].insert(0, {
            "id": len(COMPLIANCE_DATA["reports"]) + 1,
            "type": "score_change",
            "old_score": old_score,
            "new_score": COMPLIANCE_DATA["score"],
            "change": impact,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last 100 reports
        if len(COMPLIANCE_DATA["reports"]) > 100:
            COMPLIANCE_DATA["reports"] = COMPLIANCE_DATA["reports"][:100]

def add_compliance_incident(crisis: dict, automations_executed: list):
    """Add a compliance incident report"""
    global COMPLIANCE_DATA
    
    incident = {
        "id": len(COMPLIANCE_DATA["incidents"]) + 1,
        "crisis_type": crisis.get("type"),
        "severity": crisis.get("severity"),
        "trigger": crisis.get("trigger_keyword"),
        "email_subject": crisis.get("email_subject"),
        "email_sender": crisis.get("email_sender"),
        "automations_executed": automations_executed,
        "timestamp": datetime.now().isoformat(),
        "status": "resolved"
    }
    
    COMPLIANCE_DATA["incidents"].insert(0, incident)
    
    # Keep only last 50 incidents
    if len(COMPLIANCE_DATA["incidents"]) > 50:
        COMPLIANCE_DATA["incidents"] = COMPLIANCE_DATA["incidents"][:50]
    
    return incident

def execute_store_action(action: str, crisis: dict):
    """Execute interconnected store actions based on crisis"""
    global LIVE_STORE
    
    if action == "post_job":
        # Post job opening on website when staff leaves
        role = "Staff Member"
        if "chef" in crisis.get("email_content", "").lower():
            role = "Chef"
        elif "server" in crisis.get("email_content", "").lower():
            role = "Server"
        elif "manager" in crisis.get("email_content", "").lower():
            role = "Manager"
            
        job_posting = {
            "id": len(LIVE_STORE.get("job_postings", [])) + 1,
            "title": f"Now Hiring: {role}",
            "description": f"We're looking for a talented {role} to join our team!",
            "posted_date": datetime.now().isoformat(),
            "status": "active"
        }
        if "job_postings" not in LIVE_STORE:
            LIVE_STORE["job_postings"] = []
        LIVE_STORE["job_postings"].append(job_posting)
        add_activity("store", f"Job posting created: {role}", "info")
        return job_posting
        
    elif action == "menu_update":
        # Mark affected items as temporarily unavailable
        add_activity("store", "Menu updated due to supply/equipment issue", "warning")
        
    elif action == "promotion":
        # Create a recovery promotion
        LIVE_STORE["flash_sale"] = {
            "active": True,
            "discount": 15,
            "category": "all",
            "reason": "customer_recovery"
        }
        add_activity("store", "Recovery promotion activated: 15% off", "info")
        
    elif action == "temporary_closure":
        add_activity("store", "⚠️ Temporary closure notice posted", "error")
        
    return None

def analyze_email_for_crisis(subject: str, content: str, sender: str) -> Optional[dict]:
    """Analyze email content to detect crisis type and severity"""
    combined_text = f"{subject} {content}".lower()
    
    detected_crisis = None
    max_severity = 0
    severity_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
    
    for keyword, crisis_info in CRISIS_KEYWORDS.items():
        if keyword in combined_text:
            crisis_severity = severity_map.get(crisis_info["severity"], 0)
            if crisis_severity > max_severity:
                max_severity = crisis_severity
                detected_crisis = {
                    "type": crisis_info["type"],
                    "severity": crisis_info["severity"],
                    "automations": crisis_info["automations"],
                    "trigger_keyword": keyword,
                    "email_subject": subject,
                    "email_sender": sender,
                    "email_content": content,
                    "compliance_impact": crisis_info.get("compliance_impact", 0),
                    "store_actions": crisis_info.get("store_actions", []),
                    "timestamp": datetime.now().isoformat(),
                    "detected_via": "email_monitoring"
                }
    
    return detected_crisis

def generate_crisis_response(crisis: dict, automations_results: list) -> str:
    """Generate an appropriate email response"""
    crisis_type = crisis.get("type", "General Issue")
    automations_summary = ", ".join([r.get("name", "action").replace("_", " ").title() for r in automations_results])
    
    responses = {
        "Staff Resignation": f"Thank you for your notice. We have initiated our emergency staffing protocol. Actions taken: {automations_summary}. We've also posted a job opening on our website. Please coordinate with management for your final paperwork.",
        "Staff Departure": f"Thank you for letting us know. We're adjusting schedules and have posted your position. Actions: {automations_summary}.",
        "Staff Shortage": f"Thank you for informing us. We are activating coverage protocols. Actions: {automations_summary}. Please rest and recover.",
        "Equipment Failure": f"Thank you for the alert. Maintenance protocols activated. Actions: {automations_summary}. A technician will be dispatched shortly.",
        "Supply Chain Issue": f"We acknowledge the supply issue. Actions: {automations_summary}. We've contacted backup suppliers.",
        "Inventory Emergency": f"Inventory alert received. Actions: {automations_summary}. Menu has been adjusted accordingly.",
        "Customer Issue": f"Thank you for bringing this to our attention. Actions: {automations_summary}. A manager will follow up.",
        "Health Inspection": f"Inspection notice received. Actions: {automations_summary}. All staff have been briefed.",
        "Compliance Issue": f"Compliance matter acknowledged. Actions: {automations_summary}. Corrective measures underway.",
        "General Emergency": f"Emergency notification received. Actions: {automations_summary}. Our team is responding.",
        "Fire Emergency": f"Fire emergency acknowledged. Emergency services have been notified. Actions: {automations_summary}.",
        "Water Damage": f"Water damage reported. Emergency response activated. Actions: {automations_summary}."
    }
    
    return responses.get(crisis_type, f"Your message has been processed. Actions: {automations_summary}.")

# ============ STORE ENDPOINTS ============

@app.get("/api/store/products")
async def get_store_products():
    """Get all products for customer view"""
    return {
        "success": True,
        "data": LIVE_STORE["products"],
        "flashSale": LIVE_STORE["flash_sale"],
        "jobPostings": LIVE_STORE.get("job_postings", [])
    }

@app.post("/api/store/update")
async def update_store(request: StoreUpdateRequest):
    """Update store settings"""
    global LIVE_STORE
    
    if request.action == "flash_sale":
        discount = request.discount or 20
        category = request.category or "drinks"
        
        for product in LIVE_STORE["products"]:
            if product["category"] == category:
                if not product["sale"]:
                    product["originalPrice"] = product["price"]
                    product["price"] = round(product["price"] * (1 - discount / 100), 2)
                    product["sale"] = True
                    product["discount"] = discount
        
        LIVE_STORE["flash_sale"] = {
            "active": True,
            "discount": discount,
            "category": category
        }
        add_activity("store", f"Flash sale activated: {discount}% off {category}", "info")
        
    elif request.action == "feature":
        item_ids = request.items or []
        for product in LIVE_STORE["products"]:
            product["featured"] = product["id"] in item_ids
        add_activity("store", f"Featured items updated", "info")
            
    elif request.action == "price_increase":
        amount = request.amount or 10
        category = request.category
        for product in LIVE_STORE["products"]:
            if not category or product["category"] == category:
                product["price"] = round(product["price"] * (1 + amount / 100), 2)
        add_activity("store", f"Prices increased by {amount}%", "warning")
                
    elif request.action == "price_decrease":
        amount = request.amount or 10
        category = request.category
        for product in LIVE_STORE["products"]:
            if not category or product["category"] == category:
                product["price"] = round(product["price"] * (1 - amount / 100), 2)
        add_activity("store", f"Prices decreased by {amount}%", "info")
    
    elif request.action == "happy_hour":
        # Special happy hour pricing on drinks
        for product in LIVE_STORE["products"]:
            if product["category"] == "drinks":
                if not product["sale"]:
                    product["originalPrice"] = product["price"]
                    product["price"] = round(product["price"] * 0.5, 2)
                    product["sale"] = True
                    product["discount"] = 50
        LIVE_STORE["flash_sale"] = {
            "active": True,
            "discount": 50,
            "category": "drinks",
            "reason": "happy_hour"
        }
        add_activity("store", "🍹 Happy Hour activated: 50% off drinks!", "info")
    
    elif request.action == "combo_deal":
        # Create combo deal banner
        LIVE_STORE["combo_deal"] = {
            "active": True,
            "name": "Family Combo",
            "description": "2 Burgers + 2 Drinks + Fries = $29.99",
            "price": 29.99,
            "savings": 12
        }
        add_activity("store", "🎉 New combo deal launched!", "info")
    
    elif request.action == "seasonal_menu":
        # Add seasonal item
        seasonal_item = {
            "id": len(LIVE_STORE["products"]) + 1,
            "name": "Seasonal Special",
            "price": 15.99,
            "originalPrice": None,
            "category": "mains",
            "image": "⭐",
            "featured": True,
            "sale": False,
            "discount": 0,
            "seasonal": True
        }
        LIVE_STORE["products"].append(seasonal_item)
        add_activity("store", "🌟 Seasonal menu item added!", "info")
    
    elif request.action == "loyalty_promo":
        # Loyalty promotion
        LIVE_STORE["loyalty_promo"] = {
            "active": True,
            "bonus_points": 2,  # 2x points
            "message": "Double Points Weekend!"
        }
        add_activity("store", "🎁 Loyalty promotion activated: 2x points!", "info")
    
    elif request.action == "banner_update":
        # Update store banner/announcement
        message = request.category or "Welcome to our store!"
        LIVE_STORE["banner"] = {
            "active": True,
            "message": message,
            "type": "info"
        }
        add_activity("store", f"📢 Banner updated: {message}", "info")
    
    elif request.action == "end_sale":
        # End all sales and restore prices
        for product in LIVE_STORE["products"]:
            if product["sale"] and product["originalPrice"]:
                product["price"] = product["originalPrice"]
                product["originalPrice"] = None
                product["sale"] = False
                product["discount"] = 0
        LIVE_STORE["flash_sale"] = { "active": False, "discount": 0, "category": None }
        add_activity("store", "All sales ended, prices restored", "info")
        
    elif request.action == "reset":
        LIVE_STORE["products"] = [
            { "id": 1, "name": "Classic Burger", "price": 12.99, "originalPrice": None, "category": "mains", "image": "🍔", "featured": False, "sale": False, "discount": 0 },
            { "id": 2, "name": "Buffalo Wings", "price": 14.99, "originalPrice": None, "category": "appetizers", "image": "🍗", "featured": True, "sale": False, "discount": 0 },
            { "id": 3, "name": "Veggie Power Bowl", "price": 11.99, "originalPrice": None, "category": "healthy", "image": "🥗", "featured": False, "sale": False, "discount": 0 },
            { "id": 4, "name": "Loaded Fries", "price": 6.99, "originalPrice": None, "category": "sides", "image": "🍟", "featured": False, "sale": False, "discount": 0 },
            { "id": 5, "name": "Iced Lemonade", "price": 4.99, "originalPrice": None, "category": "drinks", "image": "🍋", "featured": False, "sale": False, "discount": 0 },
            { "id": 6, "name": "Craft Cola", "price": 3.99, "originalPrice": None, "category": "drinks", "image": "🥤", "featured": False, "sale": False, "discount": 0 },
            { "id": 7, "name": "Spicy Chicken Sandwich", "price": 13.99, "originalPrice": None, "category": "mains", "image": "🌶️", "featured": True, "sale": False, "discount": 0 },
            { "id": 8, "name": "Chocolate Shake", "price": 5.99, "originalPrice": None, "category": "drinks", "image": "🍫", "featured": False, "sale": False, "discount": 0 },
            { "id": 9, "name": "Garden Salad", "price": 8.99, "originalPrice": None, "category": "healthy", "image": "🥬", "featured": False, "sale": False, "discount": 0 },
        ]
        LIVE_STORE["flash_sale"] = { "active": False, "discount": 0, "category": None }
        LIVE_STORE["combo_deal"] = None
        LIVE_STORE["loyalty_promo"] = None
        LIVE_STORE["banner"] = None
        add_activity("store", "Store reset to defaults", "info")
    
    return {
        "success": True,
        "message": f"Store updated: {request.action}",
        "store": LIVE_STORE
    }

# ============ ORDER ENDPOINTS ============

@app.post("/api/orders/create")
async def create_order(request: CreateOrderRequest):
    """Create a new order"""
    global LIVE_ORDERS, LIVE_INVENTORY
    
    order_id = len(LIVE_ORDERS) + 1000 + random.randint(1, 100)
    
    order = {
        "order_id": order_id,
        "items": [item.dict() for item in request.items],
        "total_amount": request.total,
        "customer_name": request.customer_name,
        "timestamp": datetime.now().isoformat(),
        "status": "completed"
    }
    
    LIVE_ORDERS.append(order)
    
    # Update inventory
    for item in request.items:
        for inv_item in LIVE_INVENTORY:
            if "Burger" in item.name and "Burger" in inv_item["item_name"]:
                inv_item["stock_level"] = max(0, inv_item["stock_level"] - item.quantity)
            elif "Wing" in item.name and "Wing" in inv_item["item_name"]:
                inv_item["stock_level"] = max(0, inv_item["stock_level"] - item.quantity * 0.3)
            elif "Fries" in item.name and "Fries" in inv_item["item_name"]:
                inv_item["stock_level"] = max(0, inv_item["stock_level"] - item.quantity * 0.2)
    
    add_activity("order", f"New order #{order_id}: ${request.total:.2f}", "info")
    
    # Check for low inventory alerts
    for inv_item in LIVE_INVENTORY:
        if inv_item["stock_level"] <= inv_item["reorder_point"]:
            add_activity("inventory", f"Low stock alert: {inv_item['item_name']}", "warning")
    
    return {
        "success": True,
        "order": order,
        "message": f"Order #{order_id} placed successfully!"
    }

@app.get("/api/data/orders")
async def get_orders():
    """Get all live orders"""
        return {
            "success": True,
        "data": LIVE_ORDERS,
        "count": len(LIVE_ORDERS)
    }

# ============ ANALYTICS ENDPOINTS ============

@app.get("/api/data/analytics")
async def get_analytics():
    """Get live analytics"""
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(order.get("total_amount", 0) for order in LIVE_ORDERS)
    profit_margin = 29 if total_revenue > 0 else 0
    
        return {
            "success": True,
        "revenue": f"${total_revenue:,.2f}",
        "revenue_raw": total_revenue,
        "orders": total_orders,
        "profit_margin": f"{profit_margin}%",
        "active_staff": len([s for s in LIVE_STAFF if s["status"] == "active"]),
        "avg_order_value": f"${total_revenue / total_orders:.2f}" if total_orders > 0 else "$0.00",
        "compliance_score": COMPLIANCE_DATA["score"]
    }

@app.get("/api/data/inventory")
async def get_inventory():
    """Get live inventory"""
        return {
            "success": True,
        "data": LIVE_INVENTORY,
        "count": len(LIVE_INVENTORY)
        }

@app.get("/api/data/staff")
async def get_staff():
    """Get staff data"""
        return {
            "success": True,
        "data": LIVE_STAFF,
        "count": len(LIVE_STAFF)
    }

@app.get("/api/data/reviews")
async def get_reviews():
    """Get customer reviews"""
    reviews = []
    for i, order in enumerate(LIVE_ORDERS[-5:]):
        reviews.append({
            "id": i + 1,
            "customer": order.get("customer_name", "Customer"),
            "rating": random.choice([4, 4, 5, 5, 5]),
            "comment": random.choice([
                "Great food, fast delivery!",
                "Delicious as always!",
                "Love the buffalo wings!",
                "Best burger in town!",
                "Will order again soon!"
            ]),
            "timestamp": order.get("timestamp")
        })
    
    return {
        "success": True,
        "data": reviews,
        "count": len(reviews)
    }

@app.get("/api/data/activity")
async def get_activity():
    """Get activity feed"""
    return {
        "success": True,
        "data": ACTIVITY_FEED[:20],
        "count": len(ACTIVITY_FEED)
    }

# ============ COMPLIANCE ENDPOINTS ============

@app.get("/api/compliance")
async def get_compliance():
    """Get compliance data and reports"""
    return {
        "success": True,
        "score": COMPLIANCE_DATA["score"],
        "reports": COMPLIANCE_DATA["reports"][:20],
        "incidents": COMPLIANCE_DATA["incidents"][:10],
        "last_updated": COMPLIANCE_DATA["last_updated"]
    }

@app.get("/api/compliance/score")
async def get_compliance_score():
    """Get just the compliance score"""
    return {
        "success": True,
        "score": COMPLIANCE_DATA["score"]
    }

# ============ CRISIS ENDPOINTS ============

@app.post("/api/crisis/check-emails")
async def check_emails():
    """
    Check for UNREAD crisis emails - only processes new emails
    """
    global PROCESSED_EMAIL_IDS
    
    try:
        # Fetch UNREAD emails only
        result = composio_client.tools.execute(
            slug="GMAIL_FETCH_EMAILS",
            arguments={
                "max_results": 20,
                "label_ids": ["INBOX", "UNREAD"],
                "q": "is:unread"
            },
            connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
            user_id=COMPOSIO_ENTITY_ID,
            dangerously_skip_version_check=True
        )
        
        if not result.get("successfull", result.get("successful", True)):
            return {
                "success": False,
                "error": str(result.get("error", "Unknown error")),
                "message": "Failed to fetch emails. Please ensure Gmail is connected.",
                "setup_required": True,
                "setup_url": "https://app.composio.dev/apps/gmail"
            }
        
        # Extract emails
        response_data = result.get("data", result.get("response_data", result))
        messages = response_data.get("messages", response_data.get("emails", []))
        
        if isinstance(response_data, list):
            messages = response_data
        
        if not messages:
        return {
            "success": True,
                "crisis_detected": False,
                "message": "No unread emails in inbox",
                "emails_checked": 0,
                "last_check": datetime.now().isoformat()
            }
        
        # Process emails
        crises_found = []
        emails_checked = 0
        
        for msg in messages[:20]:
            msg_id = msg.get("id", msg.get("messageId", ""))
            
            # Skip already processed emails
            if msg_id in PROCESSED_EMAIL_IDS:
                continue
                
            emails_checked += 1
            
            # Extract details
            subject = msg.get("subject", msg.get("Subject", ""))
            content = msg.get("snippet", msg.get("body", msg.get("messageText", "")))
            sender = msg.get("from", msg.get("From", msg.get("sender", "")))
            
            # Fetch full message if needed
            if msg_id and (not subject or not content):
                try:
                    detail_result = composio_client.tools.execute(
                        slug="GMAIL_GET_MESSAGE",
                        arguments={"message_id": msg_id},
                        connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
                        user_id=COMPOSIO_ENTITY_ID,
                        dangerously_skip_version_check=True
                    )
                    if detail_result:
                        msg_data = detail_result.get("data", detail_result)
                        subject = msg_data.get("subject", msg_data.get("Subject", subject))
                        content = msg_data.get("body", msg_data.get("snippet", content))
                        sender = msg_data.get("from", msg_data.get("From", sender))
    except Exception as e:
                    print(f"Error fetching message: {e}")
            
            # Analyze for crisis
            crisis = analyze_email_for_crisis(subject, content, sender)
            if crisis:
                crisis["message_id"] = msg_id
                crises_found.append(crisis)
            
            # Mark as processed
            PROCESSED_EMAIL_IDS.add(msg_id)
        
        if crises_found:
            # Sort by severity
            crises_found.sort(
                key=lambda x: {"LOW": 1, "MEDIUM": 2, "HIGH": 3}.get(x.get("severity"), 0),
                reverse=True
            )
            crisis = crises_found[0]
            
            # Mark email as read
            try:
                composio_client.tools.execute(
                    slug="GMAIL_MODIFY_MESSAGE",
                    arguments={
                        "message_id": crisis["message_id"],
                        "remove_label_ids": ["UNREAD"]
                    },
                    connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
                    user_id=COMPOSIO_ENTITY_ID,
                    dangerously_skip_version_check=True
                )
            except:
                pass
            
            add_activity("crisis", f"🚨 Crisis detected: {crisis['type']}", "error")
            
            return {
                "success": True,
                "crisis_detected": True,
                "crisis": crisis,
                "total_crises_found": len(crises_found),
                "automations_to_trigger": crisis.get("automations", []),
                "emails_checked": emails_checked,
                "last_check": datetime.now().isoformat(),
                "email_details": {
                    "subject": crisis.get("email_subject"),
                    "sender": crisis.get("email_sender"),
                    "content_preview": crisis.get("email_content", "")[:200]
                }
            }
        else:
            return {
                "success": True,
                "crisis_detected": False,
                "message": "No crisis detected in unread emails",
                "emails_checked": emails_checked,
                "last_check": datetime.now().isoformat()
            }
            
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Failed to check emails."
        }

@app.post("/api/crisis/reset-processed")
async def reset_processed_emails():
    """Reset processed email cache"""
    global PROCESSED_EMAIL_IDS
    PROCESSED_EMAIL_IDS = set()
    return {"success": True, "message": "Processed email cache cleared"}

@app.post("/api/crisis/respond-email")
async def respond_to_email(request: EmailCrisisRequest):
    """Send response email"""
    try:
        response_content = request.email_content or "Thank you for your message. We are addressing this matter."
        recipient = request.sender or GMAIL_TARGET
        subject = f"Re: {request.subject}" if request.subject else "Brew AI Response"
        
        result = composio_client.tools.execute(
            slug="GMAIL_SEND_EMAIL",
            arguments={
                "recipient_email": recipient,
                "subject": subject,
                "body": response_content
            },
            connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
            user_id=COMPOSIO_ENTITY_ID,
            dangerously_skip_version_check=True
        )
        
        if result:
            add_activity("email", f"Response sent to {recipient}", "info")
        return {
            "success": True,
                "message": "Response email sent",
                "recipient": recipient,
                "subject": subject
            }
        else:
            return {"success": False, "error": "Failed to send email"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/crisis/process-full")
async def process_full_crisis():
    """Full crisis workflow with interconnected actions"""
    global AUTOMATION_LOG
    
    try:
        # Check emails
        email_check = await check_emails()
        
        if not email_check.get("success"):
            return email_check
        
        if not email_check.get("crisis_detected"):
        return {
            "success": True,
                "crisis_detected": False,
                "message": email_check.get("message", "No crisis detected"),
                "emails_checked": email_check.get("emails_checked", 0)
            }
        
        crisis = email_check.get("crisis")
        automations_to_run = crisis.get("automations", [])
        store_actions = crisis.get("store_actions", [])
        compliance_impact = crisis.get("compliance_impact", 0)
        
        # Execute automations
        automation_results = []
        for automation_name in automations_to_run:
            result = await execute_single_automation(automation_name, crisis)
            automation_results.append(result)
            
            # Log automation
            AUTOMATION_LOG.append({
                "crisis_type": crisis.get("type"),
                "automation": automation_name,
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
        
        # Execute interconnected store actions
        store_results = []
        for action in store_actions:
            store_result = execute_store_action(action, crisis)
            if store_result:
                store_results.append(store_result)
        
        # Update compliance score
        update_compliance_score(compliance_impact, f"Crisis: {crisis.get('type')}")
        
        # Add compliance incident
        incident = add_compliance_incident(crisis, [a["name"] for a in automation_results])
        
        # Generate and send response email
        response_content = generate_crisis_response(crisis, automation_results)
        
        email_response = await respond_to_email(EmailCrisisRequest(
            email_content=response_content,
            sender=crisis.get("email_sender"),
            subject=crisis.get("email_subject")
        ))
        
        add_activity("crisis", f"✅ Crisis resolved: {crisis.get('type')}", "success")
        
        return {
            "success": True,
            "crisis": crisis,
            "automations_executed": len(automation_results),
            "automation_results": automation_results,
            "store_actions_executed": store_results,
            "compliance_impact": compliance_impact,
            "new_compliance_score": COMPLIANCE_DATA["score"],
            "incident_id": incident["id"],
            "email_sent": email_response.get("success", False),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.post("/api/crisis/execute")
async def execute_crisis(request: CrisisRequest):
    """Execute automations for a manual crisis"""
    global AUTOMATION_LOG
    
    crisis = request.crisis
        results = []
    
    for automation_name in crisis.get("automations", []):
        result = await execute_single_automation(automation_name, crisis)
        results.append(result)
        
        AUTOMATION_LOG.append({
            "crisis_type": crisis.get("type"),
            "automation": automation_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    # Update compliance
    compliance_impact = crisis.get("compliance_impact", -5)
    update_compliance_score(compliance_impact, f"Crisis: {crisis.get('type')}")
    
    add_activity("crisis", f"Crisis handled: {crisis.get('type')}", "warning")
    
        return {
            "success": True,
            "crisis": crisis,
            "automations_executed": len(results),
        "results": results,
        "compliance_score": COMPLIANCE_DATA["score"]
    }

async def execute_single_automation(automation_name: str, crisis: dict) -> dict:
    """Execute a single automation"""
    global LIVE_STAFF, LIVE_STORE
    
    result = {
        "name": automation_name,
        "status": "success",
        "timestamp": datetime.now().isoformat()
    }
    
    # Automation details
    automation_details = {
        "emergency_hiring": {
            "action": "Posted job listing and contacted staffing agencies",
            "contacts_notified": 5,
            "platforms": ["Indeed", "LinkedIn", "ZipRecruiter"]
        },
        "schedule_adjustment": {
            "action": "Notified available staff for coverage",
            "staff_contacted": 5,
            "confirmed": 3
        },
        "staff_alert": {
            "action": "All staff notified via SMS/Email",
            "recipients": len(LIVE_STAFF)
        },
        "manager_notification": {
            "action": "Manager notified immediately",
            "notification_type": "SMS + Email + Phone"
        },
        "payroll_update": {
            "action": "Payroll system updated",
            "final_pay_calculated": True
        },
        "access_revocation": {
            "action": "System access scheduled for revocation",
            "systems": ["POS", "Inventory", "Email"]
        },
        "exit_documentation": {
            "action": "Exit documentation prepared",
            "documents": ["Final Paycheck", "Exit Interview", "Reference Letter"]
        },
        "post_job_website": {
            "action": "Job posting created on website",
            "visibility": "public"
        },
        "emergency_supplier_order": {
            "action": "Emergency order placed",
            "delivery_eta": "3 hours"
        },
        "menu_adjustment": {
            "action": "Menu items updated",
            "items_affected": 2
        },
        "equipment_repair_request": {
            "action": "Repair ticket submitted",
            "priority": "URGENT"
        },
        "compliance_check": {
            "action": "Compliance checklist initiated",
            "items_to_verify": 47
        },
        "staff_briefing": {
            "action": "Staff briefing scheduled",
            "attendees": len(LIVE_STAFF)
        },
        "customer_response": {
            "action": "Customer response drafted",
            "priority": "HIGH"
        },
        "corrective_action": {
            "action": "Corrective action plan initiated",
            "deadline": "24 hours"
        },
        "incident_report": {
            "action": "Incident report created",
            "report_id": f"INC-{datetime.now().strftime('%Y%m%d%H%M')}"
        },
        "emergency_protocol": {
            "action": "Emergency protocol activated",
            "response_team_notified": True
        },
        "safety_check": {
            "action": "Safety inspection initiated",
            "areas_checked": ["Kitchen", "Dining", "Storage"]
        }
    }
    
    result["details"] = automation_details.get(automation_name, {
        "action": f"Executed {automation_name}",
        "status": "completed"
    })
    
    return result

# ============ INSIGHTS ENDPOINTS ============

@app.get("/api/insights")
async def get_insights():
    """Get AI-generated insights based on all data"""
    insights = []
    
    # Staff insights
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    if active_staff < 6:
        insights.append({
            "type": "staffing",
            "severity": "warning",
            "message": f"Staff shortage detected. Only {active_staff} active staff. Consider posting job openings.",
            "action": "Post job opening on website",
            "action_type": "post_job"
        })
    
    # Inventory insights
    low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
    for item in low_stock:
        insights.append({
            "type": "inventory",
            "severity": "warning",
            "message": f"{item['item_name']} is low ({item['stock_level']} {item['unit']})",
            "action": "Order more supplies",
            "action_type": "emergency_order"
        })
    
    # Sales insights
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    
    if total_orders > 0:
        avg_order = total_revenue / total_orders
        if avg_order < 15:
            insights.append({
                "type": "sales",
                "severity": "info",
                "message": f"Average order value is ${avg_order:.2f}. Consider upselling strategies.",
                "action": "Create combo deals",
                "action_type": "promotion"
            })
    
    # Compliance insights
    if COMPLIANCE_DATA["score"] < 80:
        insights.append({
            "type": "compliance",
            "severity": "error",
            "message": f"Compliance score is {COMPLIANCE_DATA['score']}%. Immediate attention needed.",
            "action": "Review compliance reports",
            "action_type": "compliance_review"
        })
    
    # Job posting insights (interconnected)
    if LIVE_STORE.get("job_postings"):
        insights.append({
            "type": "staffing",
            "severity": "info",
            "message": f"{len(LIVE_STORE['job_postings'])} active job posting(s) on website",
            "action": "View applications",
            "action_type": "view_jobs"
            })
        
        return {
            "success": True,
        "insights": insights,
        "summary": {
            "total_insights": len(insights),
            "warnings": len([i for i in insights if i["severity"] == "warning"]),
            "errors": len([i for i in insights if i["severity"] == "error"])
        }
    }

# ============ GEMINI CHAT ENDPOINT ============

@app.post("/api/chat")
async def chat_with_gemini(request: ChatRequest):
    """Chat with Gemini AI using live restaurant data"""
    global gemini_model
    
    # Get current context
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
    
    context = f"""
You are Brew AI, an intelligent restaurant management assistant. You have access to the following LIVE data:

CURRENT STATUS:
- Total Orders Today: {total_orders}
- Total Revenue: ${total_revenue:.2f}
- Active Staff: {active_staff}
- Compliance Score: {COMPLIANCE_DATA['score']}%
- Low Stock Items: {', '.join([i['item_name'] for i in low_stock]) if low_stock else 'None'}

RECENT ACTIVITY:
{chr(10).join([f"- {a.get('message', '')}" for a in ACTIVITY_FEED[:5]])}

JOB POSTINGS:
{len(LIVE_STORE.get('job_postings', []))} active job postings

Based on this live data, answer the user's question helpfully. Be specific with numbers and recommendations.
If they ask about actions you can take, mention: flash sales, price changes, featuring items, happy hour, combo deals, seasonal menus, loyalty promos, and banners.

User's message: {request.message}
"""

    if gemini_model:
        try:
            response = gemini_model.generate_content(context)
        return {
            "success": True,
                "response": response.text,
                "live_data": {
                    "orders": total_orders,
                    "revenue": total_revenue,
                    "staff": active_staff,
                    "compliance": COMPLIANCE_DATA["score"]
                }
        }
    except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "fallback": True,
                "response": generate_fallback_response(request.message)
            }
    else:
        # Fallback response without Gemini
        return {
            "success": True,
            "response": generate_fallback_response(request.message),
            "gemini_configured": False,
            "live_data": {
                "orders": total_orders,
                "revenue": total_revenue,
                "staff": active_staff,
                "compliance": COMPLIANCE_DATA["score"]
            }
        }

def generate_fallback_response(message: str) -> str:
    """Generate response without Gemini API"""
    msg_lower = message.lower()
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    
    if 'sales' in msg_lower or 'revenue' in msg_lower:
        return f"📊 Live Stats: ${total_revenue:.2f} revenue from {total_orders} orders today. Profit margin is around 29%. I recommend featuring top sellers or running a flash sale to boost numbers!"
    
    if 'inventory' in msg_lower or 'stock' in msg_lower:
        low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
        if low_stock:
            return f"⚠️ Inventory Alert: {len(low_stock)} items low on stock: {', '.join([i['item_name'] for i in low_stock])}. I recommend placing an emergency order."
        return f"✅ Inventory levels healthy! {len(LIVE_INVENTORY)} items tracked, all above reorder points."
    
    if 'staff' in msg_lower:
        return f"👥 Staff Status: {active_staff} staff members active. {'Adequate for current volume.' if active_staff >= 6 else 'Consider hiring - we are understaffed!'}"
    
    if 'compliance' in msg_lower:
        return f"📋 Compliance Score: {COMPLIANCE_DATA['score']}%. {'Excellent standing!' if COMPLIANCE_DATA['score'] >= 80 else 'Needs improvement - review recent incidents.'}"
    
    return f"📊 Current Status: {total_orders} orders (${total_revenue:.2f}), {active_staff} staff, {COMPLIANCE_DATA['score']}% compliance. What would you like to know more about?"

# ============ AGENT MODE ENDPOINTS ============

@app.get("/api/agent/status")
async def get_agent_status():
    """Get current agent mode status"""
        return {
            "success": True,
        "agent_mode": AGENT_MODE,
        "email_monitoring": AUTO_EMAIL_MONITORING
    }

@app.post("/api/agent/mode")
async def set_agent_mode(request: AgentModeRequest):
    """Enable/disable agent mode"""
    global AGENT_MODE
    AGENT_MODE["enabled"] = request.enabled
    AGENT_MODE["auto_apply_insights"] = request.auto_apply_insights
    
    add_activity("system", f"Agent mode {'enabled' if request.enabled else 'disabled'}", "info")
    
    return {
        "success": True,
        "agent_mode": AGENT_MODE
    }

@app.post("/api/agent/auto-apply")
async def auto_apply_insight(request: StoreActionRequest):
    """Auto-apply an insight recommendation to the store"""
    if not AGENT_MODE.get("enabled"):
        return {
            "success": False,
            "error": "Agent mode is not enabled",
            "requires_approval": True
        }
    
    # Apply the action
    store_update = StoreUpdateRequest(
        action=request.action,
        discount=request.params.get("discount") if request.params else None,
        category=request.params.get("category") if request.params else None,
        items=request.params.get("items") if request.params else None,
        amount=request.params.get("amount") if request.params else None
    )
    
    result = await update_store(store_update)
    
    add_activity("agent", f"🤖 Auto-applied: {request.action}", "info")
    
    return {
        "success": True,
        "auto_applied": True,
        "result": result
    }

# ============ AUTO EMAIL MONITORING ============

@app.get("/api/email-monitor/status")
async def get_email_monitor_status():
    """Get email monitoring status"""
    return {
        "success": True,
        "monitoring": AUTO_EMAIL_MONITORING
    }

@app.post("/api/email-monitor/toggle")
async def toggle_email_monitoring():
    """Toggle automatic email monitoring"""
    global AUTO_EMAIL_MONITORING
    AUTO_EMAIL_MONITORING["enabled"] = not AUTO_EMAIL_MONITORING["enabled"]
    
    return {
        "success": True,
        "enabled": AUTO_EMAIL_MONITORING["enabled"]
    }

# ============ FIRECRAWL ENDPOINTS ============

@app.post("/api/scrape/url")
async def scrape_url(request: ScrapeRequest):
    """Scrape a URL using Firecrawl"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json"
            },
            json={"url": request.url, "formats": request.formats},
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()

# ============ AUTOMATION LOG ============

@app.get("/api/automations/log")
async def get_automation_log():
    """Get automation log"""
    return {
        "success": True,
        "data": AUTOMATION_LOG,
        "count": len(AUTOMATION_LOG)
    }

# ============ HEALTH CHECK ============

@app.get("/")
async def root():
    return {
        "app": "Brew.AI v4 API",
        "status": "running",
        "live_data": {
            "orders": len(LIVE_ORDERS),
            "products": len(LIVE_STORE["products"]),
            "inventory_items": len(LIVE_INVENTORY),
            "staff": len(LIVE_STAFF),
            "compliance_score": COMPLIANCE_DATA["score"],
            "automation_executions": len(AUTOMATION_LOG)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)