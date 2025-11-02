"""
Load ALL project data into Captain's knowledge base
"""
import pandas as pd
import os
from typing import Dict, Any, List


def load_all_data_for_captain() -> Dict[str, Any]:
    """Load every single data point from the project into Captain's context."""
    
    knowledge = {
        "restaurant": {
            "name": "Charcoal Eats US",
            "address": "370 Lexington Avenue, Store 104, NYC 10017",
            "type": "Fast casual restaurant",
            "cuisine": "American comfort food"
        },
        "data_loaded": []
    }
    
    # Load orders data
    try:
        orders_df = pd.read_csv("data/orders_realtime.csv")
        knowledge['orders'] = {
            "total_orders": len(orders_df),
            "recent_orders": orders_df.tail(20).to_dict('records'),
            "hourly_distribution": orders_df.groupby(orders_df['timestamp'].str[:13]).size().to_dict() if 'timestamp' in orders_df.columns else {},
            "top_items": orders_df['item'].value_counts().head(10).to_dict() if 'item' in orders_df.columns else {},
            "data_file": "data/orders_realtime.csv"
        }
        knowledge['data_loaded'].append("orders_realtime.csv")
    except Exception as e:
        knowledge['orders'] = {"error": str(e)}
    
    # Load inventory data
    try:
        inventory_df = pd.read_csv("data/inventory.csv")
        knowledge['inventory'] = {
            "items": inventory_df.to_dict('records'),
            "low_stock": inventory_df[inventory_df['quantity'] < inventory_df['reorder_point']].to_dict('records') if 'reorder_point' in inventory_df.columns else [],
            "data_file": "data/inventory.csv"
        }
        knowledge['data_loaded'].append("inventory.csv")
    except Exception as e:
        knowledge['inventory'] = {"error": str(e)}
    
    # Load staff schedule
    try:
        staff_df = pd.read_csv("data/staff_schedule.csv")
        knowledge['staff'] = {
            "schedule": staff_df.to_dict('records'),
            "total_staff": len(staff_df),
            "data_file": "data/staff_schedule.csv"
        }
        knowledge['data_loaded'].append("staff_schedule.csv")
    except Exception as e:
        knowledge['staff'] = {"error": str(e)}
    
    # Load customer reviews
    try:
        reviews_df = pd.read_csv("data/customer_reviews.csv")
        knowledge['reviews'] = {
            "total_reviews": len(reviews_df),
            "recent_reviews": reviews_df.tail(10).to_dict('records'),
            "avg_rating": reviews_df['rating'].mean() if 'rating' in reviews_df.columns else 0,
            "data_file": "data/customer_reviews.csv"
        }
        knowledge['data_loaded'].append("customer_reviews.csv")
    except Exception as e:
        knowledge['reviews'] = {"error": str(e)}
    
    # Load menu
    try:
        menu_df = pd.read_csv("data/menu_recommendations.csv")
        knowledge['menu'] = {
            "items": menu_df.to_dict('records'),
            "total_items": len(menu_df),
            "data_file": "data/menu_recommendations.csv"
        }
        knowledge['data_loaded'].append("menu_recommendations.csv")
    except Exception as e:
        knowledge['menu'] = {"error": str(e)}
    
    return knowledge


def format_knowledge_for_captain(knowledge: Dict[str, Any]) -> str:
    """Format all knowledge into a text prompt for Captain."""
    
    context = f"""CHARCOAL EATS US - COMPLETE RESTAURANT DATA

RESTAURANT INFO:
- Name: {knowledge['restaurant']['name']}
- Location: {knowledge['restaurant']['address']}

DATA SOURCES LOADED: {', '.join(knowledge['data_loaded'])}

"""
    
    # Orders
    if 'orders' in knowledge and 'total_orders' in knowledge['orders']:
        context += f"""
ORDERS DATA:
- Total Orders: {knowledge['orders']['total_orders']}
- Top Items: {knowledge['orders'].get('top_items', {})}
- Recent Orders: Available
"""
    
    # Inventory
    if 'inventory' in knowledge and 'items' in knowledge['inventory']:
        context += f"""
INVENTORY:
- Total Items: {len(knowledge['inventory']['items'])}
- Low Stock Items: {len(knowledge['inventory'].get('low_stock', []))}
"""
    
    # Staff
    if 'staff' in knowledge and 'total_staff' in knowledge['staff']:
        context += f"""
STAFF:
- Total Staff: {knowledge['staff']['total_staff']}
- Schedules: Available
"""
    
    # Reviews
    if 'reviews' in knowledge and 'total_reviews' in knowledge['reviews']:
        context += f"""
CUSTOMER REVIEWS:
- Total Reviews: {knowledge['reviews']['total_reviews']}
- Average Rating: {knowledge['reviews'].get('avg_rating', 0):.2f}
"""
    
    # Menu
    if 'menu' in knowledge and 'total_items' in knowledge['menu']:
        context += f"""
MENU:
- Total Items: {knowledge['menu']['total_items']}
"""
    
    context += "\n\nYou have full access to all this data. Answer questions with specific numbers and details."
    
    return context


def get_captain_with_full_knowledge():
    """Get Captain client with ALL project data loaded."""
    from services.captain_client import get_captain_client
    
    captain = get_captain_client()
    
    if captain:
        # Load all knowledge
        knowledge = load_all_data_for_captain()
        
        # Upload as documents to Captain
        documents = [
            {
                "content": format_knowledge_for_captain(knowledge),
                "title": "Complete Restaurant Data",
                "metadata": {"source": "all_csv_files", "loaded": knowledge['data_loaded']}
            }
        ]
        
        try:
            captain.upload_documents("operations", documents)
            print(f"[OK] Loaded {len(knowledge['data_loaded'])} data sources into Captain")
        except:
            print("[WARNING] Could not upload to Captain, using inline context")
    
    return captain, knowledge

