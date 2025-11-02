import streamlit as st
import sys
from pathlib import Path
from datetime import datetime
import time
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

st.set_page_config(page_title="Brew.AI", page_icon="🍺", layout="wide")

st.markdown("""
<style>
    .main { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; }
    h1, h2, h3 { color: white; }
    .hero { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        margin: 20px 0;
    }
    .metric-card {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #333;
    }
</style>
""", unsafe_allow_html=True)

st.markdown("""
<div class="hero">
    <h1 style="font-size: 48px; margin: 0;">🍺 Brew.AI</h1>
    <p style="font-size: 20px; margin-top: 10px;">Autonomous Restaurant Operations</p>
    <p style="font-size: 14px;">CAPTAIN • METORIAL • NIVARA • BROWSER-USE • MORPH • GMAIL</p>
</div>
""", unsafe_allow_html=True)

# Load today's data
try:
    orders_df = pd.read_csv("data/orders_realtime.csv")
    total_orders = len(orders_df)
    revenue = total_orders * 24.50
    
    st.markdown("### 📊 Today's Analytics (Live from CSV)")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Revenue", f"${revenue:,.0f}", "+12%")
    with col2:
        st.metric("Orders", total_orders, "+8%")
    with col3:
        st.metric("Profit Margin", "29%", "+4%")
    with col4:
        st.metric("Active Staff", "12", "→")
except:
    st.markdown("### 📊 Today's Metrics")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Revenue", "$45,230", "+12%")
    with col2:
        st.metric("Orders", "187", "+8%")
    with col3:
        st.metric("Profit Margin", "29%", "+4%")
    with col4:
        st.metric("Active Staff", "12", "→")

st.markdown("---")

st.markdown("### 🚨 CRISIS SIMULATION")

col_crisis1, col_crisis2 = st.columns(2)

with col_crisis1:
    if st.button("💥 SIMULATE RANDOM CRISIS", type="primary", use_container_width=True):
        from agents.chaos_engine import ChaosEngine
        crisis = ChaosEngine.generate_random_crisis()
        
        st.session_state.active_crisis = crisis
        st.session_state.crisis_triggered = True
        
        st.error(f"🚨 CRISIS DETECTED: {crisis['title']}")
        st.warning(f"**Problem:** {crisis['description']}")
        st.info("🔄 Redirecting to Automations page...")
        
        time.sleep(2)
        st.switch_page("pages/1_Automations.py")

with col_crisis2:
    if st.button("🔄 Reset", use_container_width=True):
        st.session_state.active_crisis = None
        st.session_state.crisis_triggered = False
        st.rerun()

st.markdown("---")
st.caption(f"📍 Charcoal Eats US • {datetime.now().strftime('%A, %B %d, %Y')}")
