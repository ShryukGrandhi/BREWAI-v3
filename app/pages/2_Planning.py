import streamlit as st
import sys
from pathlib import Path
from datetime import datetime, timedelta
import time
import pandas as pd
import random
import plotly.graph_objects as go
import plotly.express as px
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Planning", page_icon="📋", layout="wide")

st.markdown("""
<style>
    /* React-style full-screen layout */
    .main { 
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); 
        color: white;
        padding: 40px 60px !important;
    }
    .block-container {
        padding: 0 !important;
        max-width: 1800px !important;
    }
    h1 { 
        color: white; 
        font-size: 48px !important;
        font-weight: 800 !important;
        margin-bottom: 15px !important;
    }
    h2 { 
        color: white; 
        font-size: 28px !important;
        margin-bottom: 20px !important;
    }
    h3 { 
        color: white; 
        font-size: 20px !important;
    }
    .stButton button {
        background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border-radius: 8px;
        padding: 16px 32px;
        font-weight: 600;
        border: none;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    .stButton button:hover {
        background-image: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.5);
    }
    .day-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        padding: 30px 25px;
        border-radius: 15px;
        border: 2px solid #667eea;
        margin: 10px 0;
        text-align: center;
        min-height: 320px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    }
    .day-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
        border-color: #764ba2;
    }
    .stMetric {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        border: 2px solid #667eea;
        border-radius: 15px;
        padding: 25px 20px;
        min-height: 140px;
    }
    .stMetric:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
</style>
""", unsafe_allow_html=True)

st.title("📋 Weekly Operations Planning & Forecasting")
st.caption("AI-Powered LSTM Predictions • 7-Day Outlook • Auto-Triggered Automations")

# Initialize session state
if 'planning_complete' not in st.session_state:
    st.session_state.planning_complete = False
if 'auto_trigger_enabled' not in st.session_state:
    st.session_state.auto_trigger_enabled = False

# Demo Toggle
demo_col1, demo_col2 = st.columns([4, 1])
with demo_col1:
    st.info("**🎬 Demo Mode:** Detects issues and triggers emergency automations automatically")
with demo_col2:
    st.session_state.auto_trigger_enabled = st.toggle("🚨 Demo", value=st.session_state.auto_trigger_enabled)

st.markdown("---")

# ============ 7-DAY FORECAST CARDS ============
st.markdown("### 📅 7-DAY OPERATIONS FORECAST")

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
weather_icons = ["☀️", "⛅", "🌤️", "☁️", "🌦️", "☀️", "⛅"]
weather_temps = [72, 68, 75, 65, 70, 78, 74]
traffic_levels = ["Medium", "High", "Medium", "Low", "High", "Very High", "High"]
cooks_needed = [6, 7, 6, 5, 8, 10, 9]
peak_hours = ["6-8 PM", "6-9 PM", "6-8 PM", "5-7 PM", "7-10 PM", "6-11 PM", "6-10 PM"]
predicted_orders = [180, 220, 195, 150, 280, 350, 310]
predicted_revenue = [f"${o * 24.50:,.0f}" for o in predicted_orders]

cols = st.columns(7)
for i, col in enumerate(cols):
    with col:
        st.markdown(f"""
        <div class="day-card">
            <h3 style="margin: 0; color: #667eea;">{days[i][:3]}</h3>
            <p style="font-size: 36px; margin: 10px 0;">{weather_icons[i]}</p>
            <p style="margin: 5px 0;"><b>{weather_temps[i]}°F</b></p>
            <p style="margin: 5px 0; font-size: 12px;">Traffic: {traffic_levels[i]}</p>
            <p style="margin: 5px 0; font-size: 12px;">👨‍🍳 {cooks_needed[i]} cooks</p>
            <p style="margin: 5px 0; font-size: 12px;">⏰ {peak_hours[i]}</p>
            <p style="margin: 10px 0; font-size: 18px; color: #00ff88;"><b>{predicted_orders[i]}</b> orders</p>
            <p style="margin: 0; font-size: 14px; color: #00c6ff;">{predicted_revenue[i]}</p>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")

# ============ PREDICTED ORDERS & REVENUE ============
st.markdown("### 📈 LSTM Deep Learning Forecast")

col_pred1, col_pred2 = st.columns(2)

with col_pred1:
    st.markdown("#### 📊 Next 24 Hours - Order Predictions")
    
    # Generate LSTM-style forecast
    hours = list(range(1, 25))
    base_orders = [15, 12, 10, 8, 6, 5, 8, 12, 18, 25, 22, 28, 30, 20, 18, 22, 35, 42, 38, 32, 25, 20, 18, 15]
    lstm_predictions = [o + random.randint(-3, 3) for o in base_orders]
    
    fig_lstm = go.Figure()
    fig_lstm.add_trace(go.Scatter(
        x=hours,
        y=lstm_predictions,
        mode='lines+markers',
        name='Predicted Orders',
        line=dict(color='#00ff88', width=3),
        fill='tozeroy',
        fillcolor='rgba(0, 255, 136, 0.2)'
    ))
    
    fig_lstm.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=300,
        margin=dict(l=0, r=0, t=20, b=0),
        xaxis_title="Hour",
        yaxis_title="Orders",
        font=dict(color='white')
    )
    
    st.plotly_chart(fig_lstm, use_container_width=True, key="lstm_forecast_chart")
    
    total_predicted = sum(lstm_predictions)
    st.metric("Total Predicted Orders (24h)", total_predicted, "+18%")

with col_pred2:
    st.markdown("#### 💰 Revenue Forecast")
    
    revenue_forecast = [o * 24.50 for o in lstm_predictions]
    
    fig_revenue = go.Figure()
    fig_revenue.add_trace(go.Scatter(
        x=hours,
        y=revenue_forecast,
        mode='lines+markers',
        name='Predicted Revenue',
        line=dict(color='#00c6ff', width=3),
        fill='tozeroy',
        fillcolor='rgba(0, 198, 255, 0.2)'
    ))
    
    fig_revenue.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=300,
        margin=dict(l=0, r=0, t=20, b=0),
        xaxis_title="Hour",
        yaxis_title="Revenue ($)",
        font=dict(color='white')
    )
    
    st.plotly_chart(fig_revenue, use_container_width=True, key="revenue_forecast_chart")
    
    total_revenue = sum(revenue_forecast)
    st.metric("Total Predicted Revenue (24h)", f"${total_revenue:,.0f}", "+12%")

st.markdown("---")

# ============ PIE CHARTS & GRAPHS ============
st.markdown("### 📊 Operations Analytics")

col_pie1, col_pie2, col_pie3 = st.columns(3)

with col_pie1:
    st.markdown("#### 🍔 Order Distribution")
    
    categories = ['Burgers', 'Wings', 'Bowls', 'Salads', 'Drinks']
    values = [35, 25, 20, 10, 10]
    
    fig_pie1 = go.Figure(data=[go.Pie(
        labels=categories,
        values=values,
        hole=0.4,
        marker=dict(colors=['#667eea', '#764ba2', '#00c6ff', '#00ff88', '#ff6b6b'])
    )])
    
    fig_pie1.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=250,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        font=dict(color='white', size=10)
    )
    
    st.plotly_chart(fig_pie1, use_container_width=True, key="order_dist_pie")

with col_pie2:
    st.markdown("#### ⏰ Peak Hours Distribution")
    
    time_slots = ['11am-2pm', '2pm-5pm', '5pm-8pm', '8pm-11pm']
    time_values = [25, 15, 45, 15]
    
    fig_pie2 = go.Figure(data=[go.Pie(
        labels=time_slots,
        values=time_values,
        hole=0.4,
        marker=dict(colors=['#ff6b6b', '#feca57', '#00ff88', '#667eea'])
    )])
    
    fig_pie2.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=250,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        font=dict(color='white', size=10)
    )
    
    st.plotly_chart(fig_pie2, use_container_width=True, key="peak_hours_pie")

with col_pie3:
    st.markdown("#### 💳 Payment Methods")
    
    payment_methods = ['Card', 'Cash', 'Mobile', 'Other']
    payment_values = [60, 20, 15, 5]
    
    fig_pie3 = go.Figure(data=[go.Pie(
        labels=payment_methods,
        values=payment_values,
        hole=0.4,
        marker=dict(colors=['#00c6ff', '#00ff88', '#764ba2', '#ff6b6b'])
    )])
    
    fig_pie3.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=250,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        font=dict(color='white', size=10)
    )
    
    st.plotly_chart(fig_pie3, use_container_width=True, key="payment_pie")

st.markdown("---")

# ============ AI INSIGHTS ============
st.markdown("### 🧠 CAPTAIN AI Insights")

col_ai1, col_ai2 = st.columns(2)

with col_ai1:
    st.success("""
    **📈 Strong Growth Trend**
    
    Weekend orders are projected to increase 35% compared to weekdays. 
    Friday-Sunday accounts for 60% of weekly revenue ($28,000+).
    
    **Recommendation:** Add 2 extra cooks for weekend shifts.
    """)
    
    st.info("""
    **⏰ Peak Hour Optimization**
    
    5-8 PM generates 45% of daily orders. Current staffing may be insufficient.
    
    **Recommendation:** Implement staggered shifts: 4:30-9:30 PM.
    """)

with col_ai2:
    st.warning("""
    **📦 Inventory Alert**
    
    Wing demand exceeds supply by 15% on Saturdays. Risk of stockouts.
    
    **Recommendation:** Increase Friday supplier order by 20 lbs.
    """)
    
    st.success("""
    **🌤️ Weather Impact Analysis**
    
    Sunny days (>70°F) correlate with +22% order volume.
    Saturday forecast: 78°F ☀️
    
    **Recommendation:** Prep for 350+ orders on Saturday.
    """)

st.markdown("---")

# ============ PRODUCT INSIGHTS ============
st.markdown("### 🍔 Product Performance Insights")

col_prod1, col_prod2, col_prod3 = st.columns(3)

with col_prod1:
    st.markdown("""
    <div class="day-card">
        <h3 style="color: #00ff88;">🍔 Classic Burger</h3>
        <p style="font-size: 24px; margin: 10px 0;"><b>$12.99</b></p>
        <p style="margin: 5px 0;">Sales: 450/week</p>
        <p style="margin: 5px 0;">Rating: 4.7 ⭐</p>
        <p style="margin: 5px 0; color: #00ff88;">Revenue: $5,845</p>
        <hr style="border-color: #667eea;">
        <p style="font-size: 12px; margin-top: 10px;">
        <b>Insight:</b> Top seller. Consider upselling with fries combo (+$3.99).
        </p>
    </div>
    """, unsafe_allow_html=True)

with col_prod2:
    st.markdown("""
    <div class="day-card">
        <h3 style="color: #764ba2;">🍗 Buffalo Wings</h3>
        <p style="font-size: 24px; margin: 10px 0;"><b>$10.99</b></p>
        <p style="margin: 5px 0;">Sales: 380/week</p>
        <p style="margin: 5px 0;">Rating: 4.8 ⭐</p>
        <p style="margin: 5px 0; color: #00c6ff;">Revenue: $4,176</p>
        <hr style="border-color: #667eea;">
        <p style="font-size: 12px; margin-top: 10px;">
        <b>Insight:</b> Highest rated. Weekend favorite. Stock up Fridays.
        </p>
    </div>
    """, unsafe_allow_html=True)

with col_prod3:
    st.markdown("""
    <div class="day-card">
        <h3 style="color: #00c6ff;">🥗 Power Bowl</h3>
        <p style="font-size: 24px; margin: 10px 0;"><b>$11.49</b></p>
        <p style="margin: 5px 0;">Sales: 280/week</p>
        <p style="margin: 5px 0;">Rating: 4.5 ⭐</p>
        <p style="margin: 5px 0; color: #feca57;">Revenue: $3,217</p>
        <hr style="border-color: #667eea;">
        <p style="font-size: 12px; margin-top: 10px;">
        <b>Insight:</b> Growing trend. Lunch hours peak. Promote health benefits.
        </p>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# ============ 10-POINT CHECKLIST ============
st.markdown("### ✅ 10-POINT READINESS CHECKLIST")

if st.button("🔄 RUN FULL CHECKLIST", type="primary", use_container_width=True):
    st.session_state.planning_complete = False
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    checklist_items = [
        {"id": 1, "name": "Weather Forecast", "icon": "🌤️"},
        {"id": 2, "name": "Staff Availability", "icon": "👥"},
        {"id": 3, "name": "Inventory Levels", "icon": "📦"},
        {"id": 4, "name": "Supplier Orders", "icon": "🚚"},
        {"id": 5, "name": "Equipment Status", "icon": "🔧"},
        {"id": 6, "name": "LSTM Demand Forecast", "icon": "📈"},
        {"id": 7, "name": "Menu Prep Requirements", "icon": "🍽️"},
        {"id": 8, "name": "Marketing Campaigns", "icon": "📢"},
        {"id": 9, "name": "Compliance & Health", "icon": "🏥"},
        {"id": 10, "name": "Financial Reserves", "icon": "💰"}
    ]
    
    issues_detected = []
    
    for i, item in enumerate(checklist_items):
        status_text.text(f"Checking: {item['name']}...")
        time.sleep(0.3)
        
        # Simulate checks
        if item['name'] == "Staff Availability" and st.session_state.auto_trigger_enabled:
            issues_detected.append({
                'type': 'staffing',
                'severity': 'HIGH',
                'message': 'Only 6/8 staff scheduled for Saturday',
                'automation': 'emergency_hiring'
            })
        
        if item['name'] == "Inventory Levels" and st.session_state.auto_trigger_enabled:
            issues_detected.append({
                'type': 'inventory',
                'severity': 'MEDIUM',
                'message': 'Wings and rice below reorder point',
                'automation': 'emergency_supplier_order'
            })
        
        progress_bar.progress((i + 1) / len(checklist_items))
    
    status_text.text("✅ Checklist Complete!")
    st.session_state.planning_complete = True
    st.session_state.detected_issues = issues_detected
    time.sleep(0.5)
    st.rerun()

# Display results
if st.session_state.planning_complete:
    issues = st.session_state.get('detected_issues', [])
    
    if len(issues) > 0 and st.session_state.auto_trigger_enabled:
        st.error(f"🚨 **{len(issues)} ISSUES DETECTED!**")
        
        for issue in issues:
            st.warning(f"⚠️ **{issue['type'].upper()}:** {issue['message']}")
        
        if st.button("🚀 TRIGGER EMERGENCY AUTOMATIONS NOW", type="primary", use_container_width=True):
            crisis = {
                'id': 'planning_issues',
                'title': 'WEEKLY READINESS ISSUES',
                'description': f"Planning detected {len(issues)} issues for the week.",
                'severity': 'HIGH',
                'automations': [issue['automation'] for issue in issues],
                'timestamp': datetime.now().isoformat(),
                'status': 'ACTIVE'
            }
            
            st.session_state.active_crisis = crisis
            st.session_state.crisis_triggered = True
            
            st.success("🔄 Redirecting to Automations...")
            time.sleep(1)
            st.switch_page("pages/1_Automations.py")
    else:
        st.success("🎉 **ALL SYSTEMS GO!** Week is fully prepared!")

st.markdown("---")
st.caption("Powered by: CAPTAIN AI • LSTM Deep Learning • Real-Time Analytics")
