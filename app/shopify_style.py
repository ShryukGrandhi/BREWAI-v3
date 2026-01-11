"""
Shared Shopify-Style CSS for all pages
"""
import streamlit as st
from datetime import datetime

def apply_shopify_style():
    """Apply consistent Shopify-style CSS to all pages."""
    st.markdown("""
    <style>
        /* Shopify color palette */
        :root {
            --shopify-green: #008060;
            --shopify-dark-green: #004c3f;
            --shopify-light-green: #e3f1ec;
            --shopify-bg: #f6f6f7;
            --shopify-card: #ffffff;
            --shopify-border: #e1e3e5;
            --shopify-text: #202223;
            --shopify-text-subdued: #6d7175;
        }
        
        .main {
            background-color: var(--shopify-bg);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', sans-serif;
        }
        
        /* Shopify card style */
        .shopify-card {
            background: var(--shopify-card);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 0 rgba(0,0,0,.05);
            border: 1px solid var(--shopify-border);
            margin-bottom: 16px;
        }
        
        /* Metric cards */
        .metric-card {
            background: var(--shopify-card);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 0 rgba(0,0,0,.05);
            border: 1px solid var(--shopify-border);
            text-align: left;
        }
        
        .metric-label {
            color: var(--shopify-text-subdued);
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-value {
            color: var(--shopify-text);
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .metric-change {
            color: var(--shopify-green);
            font-size: 13px;
            font-weight: 500;
        }
        
        /* Section headers */
        h1, h2, h3 {
            color: var(--shopify-text);
            font-weight: 600;
        }
        
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 20px; margin-bottom: 12px; }
        h3 { font-size: 16px; margin-bottom: 8px; }
        
        /* Badges */
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-success {
            background: var(--shopify-light-green);
            color: var(--shopify-dark-green);
        }
        
        /* Hide Streamlit branding */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        
        /* Button styling */
        .stButton > button {
            background-color: var(--shopify-green);
            color: white;
            border-radius: 6px;
            border: none;
            padding: 8px 16px;
            font-weight: 500;
            font-size: 14px;
        }
        
        .stButton > button:hover {
            background-color: var(--shopify-dark-green);
        }
        
        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
        }
        
        .stTabs [data-baseweb="tab"] {
            background-color: white;
            border-radius: 6px 6px 0 0;
            padding: 8px 16px;
            border: 1px solid var(--shopify-border);
            border-bottom: none;
        }
        
        .stTabs [aria-selected="true"] {
            background-color: var(--shopify-light-green);
            border-color: var(--shopify-green);
        }
    </style>
    """, unsafe_allow_html=True)

def render_page_header(title, subtitle=None, show_date=True):
    """Render consistent Shopify-style page header."""
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f"# {title}")
        if show_date:
            date_str = datetime.now().strftime('%A, %B %d, %Y')
            st.markdown(f"<p style='color: var(--shopify-text-subdued); font-size: 14px;'>{date_str}</p>", unsafe_allow_html=True)
        if subtitle:
            st.markdown(f"<p style='color: var(--shopify-text-subdued); font-size: 14px;'>{subtitle}</p>", unsafe_allow_html=True)
    with col2:
        if st.button("🏠 Home"):
            st.switch_page("Home.py")
    
    st.markdown("<br>", unsafe_allow_html=True)

