"""
CAPTAIN KNOWLEDGE LOADER - ALL CSV DATA
========================================
Loads EVERY CSV file in the project into Captain's context.
Captain has access to ALL restaurant data for analysis.
"""

import pandas as pd
from pathlib import Path
import os
from typing import Dict, Any

def load_all_data_for_captain() -> Dict[str, Any]:
    """
    Load ALL CSV files from the data directory into Captain's context.
    
    Returns:
        dict with all data from EVERY CSV file
    """
    
    knowledge = {
        "restaurant": {
            "name": "Charcoal Eats US",
            "address": "370 Lexington Avenue, Store 104, NYC 10017",
            "type": "Fast casual restaurant",
            "cuisine": "American comfort food"
        },
        "csv_data": {},
        "data_loaded": []
    }
    
    # List of ALL CSV files in the project (17 files)
    csv_files = [
        'orders_realtime.csv',
        'orders.csv',
        'customer_reviews.csv',
        'inventory.csv',
        'staff_schedule.csv',
        'menu_recommendations.csv',
        'sales_by_hour.csv',
        'supplier_orders.csv',
        'daily_summary.csv',
        'customer_retention.csv',
        'marketing_campaigns.csv',
        'equipment_maintenance.csv',
        'recent_activities.csv',
        'weather_forecast.csv',
        'sentiment_metrics.csv',
        'events_calendar.csv',
        'labor_rates.csv'
    ]
    
    total_records = 0
    
    print(f"\nLoading ALL CSV files for Captain...")
    
    for csv_file in csv_files:
        try:
            file_path = Path("data") / csv_file
            if file_path.exists():
                df = pd.read_csv(file_path)
                key = csv_file.replace('.csv', '').replace('_', ' ').title()
                
                # Store full dataframe
                knowledge['csv_data'][key] = {
                    'dataframe': df,
                    'records': len(df),
                    'columns': list(df.columns),
                    'sample_data': df.head(5).to_dict('records') if len(df) > 0 else [],
                    'file_path': str(file_path)
                }
                
                knowledge['data_loaded'].append(csv_file)
                total_records += len(df)
                print(f"  [OK] {csv_file}: {len(df)} records, {len(df.columns)} columns")
            else:
                print(f"  [WARN] File not found: {csv_file}")
        except Exception as e:
            print(f"  [ERROR] Loading {csv_file}: {e}")
    
    print(f"\nCAPTAIN NOW HAS ACCESS TO:")
    print(f"   - {len(knowledge['data_loaded'])} CSV files")
    print(f"   - {total_records} total records")
    print(f"   - ALL restaurant operational data\n")
    
    return knowledge


def format_knowledge_for_captain(knowledge: Dict[str, Any]) -> str:
    """
    Format ALL data into a comprehensive string for Captain's context.
    
    Args:
        knowledge: Dictionary with all loaded CSV data
        
    Returns:
        Formatted string with complete data summary
    """
    
    lines = []
    
    lines.append("=" * 80)
    lines.append("CHARCOAL EATS US - COMPLETE OPERATIONAL DATA")
    lines.append(f"Restaurant: {knowledge['restaurant']['name']}")
    lines.append(f"Location: {knowledge['restaurant']['address']}")
    lines.append("=" * 80)
    lines.append("")
    lines.append(f"DATA LOADED: {len(knowledge['data_loaded'])} CSV files")
    lines.append("")
    
    for file_name in knowledge['data_loaded']:
        key = file_name.replace('.csv', '').replace('_', ' ').title()
        if key in knowledge['csv_data']:
            data_info = knowledge['csv_data'][key]
            
            lines.append(f"\n{'='*70}")
            lines.append(f"FILE: {key.upper()}")
            lines.append(f"{'='*70}")
            lines.append(f"Records: {data_info['records']}")
            lines.append(f"Columns: {', '.join(data_info['columns'])}")
            
            # Add sample data for context
            if data_info['sample_data']:
                lines.append(f"\nSample Data (first 3 records):")
                for i, record in enumerate(data_info['sample_data'][:3], 1):
                    lines.append(f"  {i}. {record}")
            
            # Add specific insights for key datasets
            df = data_info['dataframe']
            
            if 'Orders' in key:
                if 'total' in df.columns:
                    try:
                        total_revenue = pd.to_numeric(df['total'], errors='coerce').sum()
                        lines.append(f"  Total Revenue: ${total_revenue:,.2f}")
                    except:
                        pass
                if 'item_name' in df.columns:
                    top_items = df['item_name'].value_counts().head(5)
                    lines.append(f"  Top 5 Items: {', '.join(f'{item} ({count})' for item, count in top_items.items())}")
            
            elif 'Review' in key:
                if 'rating' in df.columns:
                    avg_rating = df['rating'].mean()
                    lines.append(f"  Average Rating: {avg_rating:.2f}/5.0")
                    rating_dist = df['rating'].value_counts().sort_index(ascending=False)
                    lines.append(f"  Rating Distribution: {dict(rating_dist)}")
            
            elif 'Inventory' in key:
                if 'quantity' in df.columns and 'reorder_level' in df.columns:
                    low_stock = df[df['quantity'] < df['reorder_level']]
                    lines.append(f"  Low Stock Items: {len(low_stock)}")
                    if len(low_stock) > 0:
                        lines.append(f"  Critical Items: {', '.join(low_stock['item_name'].tolist()[:5])}")
            
            elif 'Staff' in key:
                if 'role' in df.columns:
                    role_counts = df['role'].value_counts()
                    lines.append(f"  Staff by Role: {dict(role_counts)}")
    
    lines.append("\n" + "="*80)
    lines.append("CAPTAIN HAS FULL ACCESS TO ALL DATA ABOVE")
    lines.append("")
    lines.append("You can answer ANY question about:")
    lines.append("  • Orders, sales, revenue, and transactions")
    lines.append("  • Customer reviews, ratings, and sentiment")
    lines.append("  • Inventory levels, stock, and suppliers")
    lines.append("  • Staff schedules, roles, and labor")
    lines.append("  • Menu items, prices, and recommendations")
    lines.append("  • Equipment status and maintenance")
    lines.append("  • Marketing campaigns and performance")
    lines.append("  • Weather forecasts and events")
    lines.append("  • Customer retention and loyalty")
    lines.append("  • And EVERYTHING else in the data!")
    lines.append("="*80)
    
    return "\n".join(lines)


def get_data_summary() -> Dict[str, Any]:
    """
    Get a quick summary of all available data.
    
    Returns:
        dict with data counts and file info
    """
    knowledge = load_all_data_for_captain()
    
    summary = {
        "total_files": len(knowledge['data_loaded']),
        "total_records": sum(data['records'] for data in knowledge['csv_data'].values()),
        "files": {}
    }
    
    for key, data_info in knowledge['csv_data'].items():
        summary["files"][key] = {
            "records": data_info['records'],
            "columns": data_info['columns']
        }
    
    return summary


def get_captain_with_full_knowledge():
    """Get Captain client with ALL project data loaded."""
    from services.captain_client import get_captain_client
    
    captain = get_captain_client()
    
    if not captain:
        print("[WARNING] Captain client not available")
        return None, None
    
    # Load all knowledge
    knowledge = load_all_data_for_captain()
    formatted_knowledge = format_knowledge_for_captain(knowledge)
    
    print(f"[OK] Loaded {len(knowledge['data_loaded'])} data sources for Captain")
    
    return captain, knowledge, formatted_knowledge
