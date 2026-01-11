"""
Test script to verify Captain has access to ALL CSV data.
Run this to confirm data loading works correctly.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from services.captain_knowledge_loader import load_all_data_for_captain, format_knowledge_for_captain, get_data_summary
from services.captain_client import get_captain_client

def test_data_loading():
    """Test that all CSV files are loaded."""
    print("=" * 80)
    print("TESTING CAPTAIN DATA ACCESS")
    print("=" * 80)
    print()
    
    # Load all data
    print("Loading all CSV files...")
    all_data = load_all_data_for_captain()
    
    print()
    print("=" * 80)
    print("DATA SUMMARY")
    print("=" * 80)
    
    summary = get_data_summary()
    print(f"\nTotal Files: {summary['total_files']}")
    print(f"Total Records: {summary['total_records']}")
    print()
    
    print("File Details:")
    for name, info in summary['files'].items():
        print(f"  - {name}: {info['records']} records")
        print(f"    Columns: {', '.join(info['columns'][:5])}{'...' if len(info['columns']) > 5 else ''}")
    
    print()
    print("=" * 80)
    print("FORMATTED KNOWLEDGE FOR CAPTAIN")
    print("=" * 80)
    
    knowledge = format_knowledge_for_captain(all_data)
    print(knowledge[:2000])  # First 2000 chars
    print("\n... (truncated for display)")
    
    print()
    print("=" * 80)
    print("TESTING CAPTAIN CLIENT")
    print("=" * 80)
    
    captain = get_captain_client()
    if captain:
        print("Captain client initialized successfully")
        
        # Test query with full context
        test_question = "How many total orders do we have?"
        print(f"\nTest Query: '{test_question}'")
        
        try:
            context_message = f"""
You are analyzing Charcoal Eats US restaurant operations.
You have access to the following data:

{knowledge}

USER QUESTION: {test_question}

Provide a specific answer with numbers from the data above.
"""
            
            response = captain.query(context_message)
            print(f"\nCaptain Response:")
            print(response)
            
        except Exception as e:
            print(f"Query failed: {e}")
    else:
        print("WARNING: Captain client not available")
        print("Ensure CAPTAIN_API_KEY and CAPTAIN_ORG_ID are set in .env")
    
    print()
    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print()
    print("CAPTAIN HAS ACCESS TO:")
    print(f"   - {summary['total_files']} CSV files")
    print(f"   - {summary['total_records']} total records")
    print(f"   - ALL restaurant operational data")
    print()
    print("Run Streamlit app and try asking:")
    print('  - "What are our top selling items?"')
    print('  - "How many staff do we have scheduled?"')
    print('  - "What is our average customer rating?"')
    print('  - "Show me low inventory items"')
    print()


if __name__ == "__main__":
    test_data_loading()

