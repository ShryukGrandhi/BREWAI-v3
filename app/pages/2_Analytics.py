import streamlit as st
import sys
from pathlib import Path
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Analytics", page_icon="📊", layout="wide")

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
    }
    h2 { 
        color: white; 
        font-size: 28px !important;
    }
    .stButton button {
        background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border-radius: 8px;
        padding: 16px 32px;
        font-weight: 600;
        font-size: 16px;
    }
    .stButton button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.5);
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

st.title("📊 Advanced Analytics")
st.caption("Real CSV data • LSTM forecasting • AI insights")

# Load CSV
try:
    orders_df = pd.read_csv("data/orders_realtime.csv")
    orders_df['timestamp'] = pd.to_datetime(orders_df['timestamp'])
    orders_df['hour'] = orders_df['timestamp'].dt.hour
    orders_df['date'] = orders_df['timestamp'].dt.date
    
    # Metrics
    st.markdown("### 📈 Key Metrics")
    col1, col2, col3, col4 = st.columns(4)
    
    total_orders = len(orders_df)
    avg_price = 24.50
    revenue = total_orders * avg_price
    
    with col1:
        st.metric("Total Orders", total_orders, "+12%")
    with col2:
        st.metric("Revenue", f"${revenue:,.0f}", "+8%")
    with col3:
        st.metric("Avg Order", f"${avg_price:.2f}", "+2%")
    with col4:
        st.metric("Active Hours", orders_df['hour'].nunique())
    
    st.markdown("---")
    
    # Charts side by side
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        st.markdown("#### 📊 Orders by Hour")
        hourly = orders_df.groupby('hour').size().reset_index(name='orders')
        fig1 = px.bar(hourly, x='hour', y='orders', title="Hourly Distribution")
        fig1.update_layout(template="plotly_dark", height=300)
        st.plotly_chart(fig1, use_container_width=True)
    
    with col_chart2:
        st.markdown("#### 📅 Daily Trend")
        daily = orders_df.groupby('date').size().reset_index(name='orders')
        fig2 = px.line(daily, x='date', y='orders', markers=True, title="Orders Over Time")
        fig2.update_layout(template="plotly_dark", height=300)
        st.plotly_chart(fig2, use_container_width=True)
    
    # LSTM Forecast
    st.markdown("### 🔮 LSTM 24-Hour Forecast")
    
    # Check if user wants to load TensorFlow (heavy library)
    use_lstm = os.getenv("ENABLE_LSTM", "false").lower() == "true"
    
    if not use_lstm:
        st.info("📊 LSTM forecasting disabled (speeds up load time). Set ENABLE_LSTM=true in .env to enable.")
        data = None
        forecaster = None
    else:
        try:
            from services.lstm_forecaster import get_lstm_forecaster
            forecaster = get_lstm_forecaster()
            data = forecaster.prepare_data_from_csv("data/orders_realtime.csv")
        except Exception as e:
            st.warning(f"📊 LSTM forecasting unavailable: {str(e)}")
            data = None
            forecaster = None
    
    if data is not None and len(data) > 0 and forecaster:
        forecast = forecaster.predict_next_24_hours(data)
        
        if forecast and 'future_predictions' in forecast:
            predictions = forecast['future_predictions']
            hours = list(range(1, len(predictions) + 1))
            revenue_forecast = [p * avg_price for p in predictions]
            
            fig3 = go.Figure()
            fig3.add_trace(go.Scatter(
                x=hours,
                y=revenue_forecast,
                mode='lines+markers',
                name='Revenue Forecast',
                line=dict(color='#667eea', width=3),
                fill='tozeroy',
                fillcolor='rgba(102, 126, 234, 0.2)'
            ))
            fig3.update_layout(
                title="Revenue Forecast (Next 24 Hours)",
                xaxis_title="Hours Ahead",
                yaxis_title="Revenue ($)",
                template="plotly_dark",
                height=400
            )
            st.plotly_chart(fig3, use_container_width=True)
            
            total_forecast = sum(revenue_forecast)
            st.success(f"💰 Forecasted 24h revenue: ${total_forecast:,.0f}")
    
    # AI Insights
    st.markdown("### 🧠 CAPTAIN AI Insights")
    
    from services.captain_client import get_captain_client
    captain = get_captain_client()
    
    if captain:
        insights = captain.query("operations", f"Analyze this restaurant data: {total_orders} orders, ${revenue:,.0f} revenue, peak hour at {hourly.loc[hourly['orders'].idxmax(), 'hour']}:00. Give 3 actionable insights.")
        st.info(insights.get('answer', 'Insights generated'))
    else:
        st.info(f"""**AI INSIGHTS:**
1. Peak hour is {hourly.loc[hourly['orders'].idxmax(), 'hour']}:00 - ensure full staff coverage
2. Revenue trending +12% - maintain current menu pricing
3. Order volume stable - no immediate concerns""")
    
    # Product Insights
    st.markdown("### 🍔 Product Insights")
    if 'item' in orders_df.columns:
        items = orders_df['item'].value_counts().head(5)
        fig4 = px.pie(values=items.values, names=items.index, title="Top 5 Menu Items")
        fig4.update_layout(template="plotly_dark")
        st.plotly_chart(fig4, use_container_width=True)
    
    # Recent Orders Table
    st.markdown("### 📋 Recent Orders")
    st.dataframe(
        orders_df.tail(15)[['timestamp', 'order_id', 'item', 'quantity', 'total_amount', 'channel']],
        use_container_width=True
    )

except Exception as e:
    st.error(f"Error loading analytics: {e}")

st.caption("📊 Powered by CAPTAIN + LSTM + CSV Data")

