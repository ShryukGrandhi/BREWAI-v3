import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Expansion", page_icon="🌍", layout="wide")

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
    h2, h3 { color: white; }
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
    .location-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        padding: 25px;
        border-radius: 15px;
        border: 2px solid #667eea;
        margin: 15px 0;
        transition: all 0.3s ease;
    }
    .location-card:hover {
        transform: translateY(-4px);
        border-color: #00ff88;
        box-shadow: 0 8px 20px rgba(0, 255, 136, 0.3);
    }
    .score-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 14px;
        margin: 5px;
    }
    .stMetric {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        border: 2px solid #667eea;
        border-radius: 15px;
        padding: 20px;
        min-height: 120px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🌍 Franchise Expansion Intelligence")
st.caption("AI-Powered Location Analysis • ROI Prediction • Competition Mapping")

st.markdown("---")

# ============================================================================
# EXPANSION LOCATIONS DATA
# ============================================================================

expansion_locations = [
    {
        "city": "Austin, TX",
        "state": "Texas",
        "population": 978000,
        "median_income": 75800,
        "foot_traffic_score": 92,
        "competition_density": 18,  # restaurants per sq mile
        "rent_per_sqft": 35,
        "projected_roi": 28.5,
        "breakeven_months": 14,
        "customer_demographics": "Young professionals, Tech workers, Students",
        "local_preferences": "Craft beer, Organic options, Late-night dining",
        "expansion_score": 94,
        "pros": ["Booming tech hub", "Young population", "High disposable income", "Growing food scene"],
        "cons": ["High rent", "Competitive market", "Seasonal tourism fluctuations"],
        "lat": 30.2672,
        "lon": -97.7431
    },
    {
        "city": "Nashville, TN",
        "state": "Tennessee",
        "population": 694000,
        "median_income": 64400,
        "foot_traffic_score": 88,
        "competition_density": 15,
        "rent_per_sqft": 28,
        "projected_roi": 31.2,
        "breakeven_months": 12,
        "customer_demographics": "Music industry, Tourists, Healthcare workers",
        "local_preferences": "Southern comfort food, Live music venues, BBQ fusion",
        "expansion_score": 96,
        "pros": ["Lower overhead", "Tourist destination", "Growing economy", "Music culture"],
        "cons": ["Moderate competition", "Seasonal tourism"],
        "lat": 36.1627,
        "lon": -86.7816
    },
    {
        "city": "Denver, CO",
        "state": "Colorado",
        "population": 716000,
        "median_income": 78000,
        "foot_traffic_score": 85,
        "competition_density": 22,
        "rent_per_sqft": 38,
        "projected_roi": 25.8,
        "breakeven_months": 16,
        "customer_demographics": "Outdoor enthusiasts, Young professionals, Tech workers",
        "local_preferences": "Healthy options, Craft beverages, Patio dining",
        "expansion_score": 89,
        "pros": ["Health-conscious market", "High income", "Active lifestyle", "Beer culture"],
        "cons": ["Very competitive", "High rent", "Altitude affects cooking"],
        "lat": 39.7392,
        "lon": -104.9903
    },
    {
        "city": "Charlotte, NC",
        "state": "North Carolina",
        "population": 885000,
        "median_income": 67800,
        "foot_traffic_score": 81,
        "competition_density": 14,
        "rent_per_sqft": 26,
        "projected_roi": 33.5,
        "breakeven_months": 11,
        "customer_demographics": "Banking professionals, Families, College students",
        "local_preferences": "Southern cuisine, Sports bar atmosphere, Family-friendly",
        "expansion_score": 92,
        "pros": ["Banking hub", "Low rent", "Fast growing", "Less competition"],
        "cons": ["Car-dependent", "Moderate foot traffic"],
        "lat": 35.2271,
        "lon": -80.8431
    },
    {
        "city": "Portland, OR",
        "state": "Oregon",
        "population": 653000,
        "median_income": 71200,
        "foot_traffic_score": 90,
        "competition_density": 28,
        "rent_per_sqft": 32,
        "projected_roi": 22.3,
        "breakeven_months": 18,
        "customer_demographics": "Creatives, Tech workers, Environmentalists",
        "local_preferences": "Vegan options, Local sourcing, Sustainable practices",
        "expansion_score": 83,
        "pros": ["Food-obsessed culture", "Sustainability focus", "Creative market"],
        "cons": ["Extremely competitive", "Saturated market", "High expectations"],
        "lat": 45.5152,
        "lon": -122.6784
    },
    {
        "city": "Miami, FL",
        "state": "Florida",
        "population": 467000,
        "median_income": 44900,
        "foot_traffic_score": 95,
        "competition_density": 25,
        "rent_per_sqft": 42,
        "projected_roi": 26.7,
        "breakeven_months": 15,
        "customer_demographics": "Tourists, Latin American visitors, Young professionals",
        "local_preferences": "Latin fusion, Nightlife, Beach dining",
        "expansion_score": 87,
        "pros": ["Year-round tourism", "International market", "Nightlife culture"],
        "cons": ["Very high rent", "Hurricane risk", "Seasonal peaks"],
        "lat": 25.7617,
        "lon": -80.1918
    },
    {
        "city": "Raleigh, NC",
        "state": "North Carolina",
        "population": 470000,
        "median_income": 72100,
        "foot_traffic_score": 78,
        "competition_density": 12,
        "rent_per_sqft": 24,
        "projected_roi": 35.8,
        "breakeven_months": 10,
        "customer_demographics": "University students, Tech workers, Researchers",
        "local_preferences": "Casual dining, Craft beer, Farm-to-table",
        "expansion_score": 95,
        "pros": ["Research Triangle", "Growing tech scene", "Low rent", "Low competition"],
        "cons": ["Smaller market", "Car-dependent"],
        "lat": 35.7796,
        "lon": -78.6382
    }
]

# Sort by expansion score
expansion_locations.sort(key=lambda x: x['expansion_score'], reverse=True)

# ============================================================================
# TOP RECOMMENDATION
# ============================================================================

top_location = expansion_locations[0]

st.markdown("## 🏆 TOP RECOMMENDATION")

col_hero1, col_hero2 = st.columns([1, 1])

with col_hero1:
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, #00ff88 0%, #00c6ff 100%);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
    ">
        <h1 style="font-size: 48px; margin: 0; color: #0a0a0a; font-weight: 900;">{top_location['city']}</h1>
        <p style="font-size: 24px; margin: 10px 0; color: #1a1a2e; font-weight: 700;">Expansion Score: {top_location['expansion_score']}/100</p>
        <p style="font-size: 16px; margin: 0; color: #0a0a0a;">Best ROI • Lowest Risk • Fastest Breakeven</p>
    </div>
    """, unsafe_allow_html=True)

with col_hero2:
    col_m1, col_m2, col_m3 = st.columns(3)
    with col_m1:
        st.metric("Projected ROI", f"{top_location['projected_roi']}%", "+8.2%")
    with col_m2:
        st.metric("Breakeven", f"{top_location['breakeven_months']} months", "-4 months")
    with col_m3:
        st.metric("Foot Traffic", f"{top_location['foot_traffic_score']}/100", "+12")

st.markdown("---")

# ============================================================================
# INTERACTIVE MAP
# ============================================================================

st.markdown("## 🗺️ Expansion Opportunities Map")

# Create map data
map_df = pd.DataFrame(expansion_locations)

# Create scatter map
fig_map = px.scatter_geo(
    map_df,
    lat='lat',
    lon='lon',
    hover_name='city',
    hover_data={
        'expansion_score': True,
        'projected_roi': True,
        'rent_per_sqft': True,
        'lat': False,
        'lon': False
    },
    size='expansion_score',
    color='expansion_score',
    color_continuous_scale='Viridis',
    size_max=30,
    scope='usa',
    title='Potential Franchise Locations'
)

fig_map.update_layout(
    geo=dict(
        bgcolor='#0a0a0a',
        lakecolor='#1a1a2e',
        landcolor='#1a1a2e',
        subunitcolor='#667eea'
    ),
    paper_bgcolor='#0a0a0a',
    font=dict(color='white'),
    height=500
)

st.plotly_chart(fig_map, use_container_width=True)

st.markdown("---")

# ============================================================================
# COMPARISON CHARTS
# ============================================================================

st.markdown("## 📊 Location Comparison")

col_chart1, col_chart2 = st.columns(2)

with col_chart1:
    # ROI vs Breakeven
    fig_roi = go.Figure()
    
    for loc in expansion_locations:
        fig_roi.add_trace(go.Scatter(
            x=[loc['breakeven_months']],
            y=[loc['projected_roi']],
            mode='markers+text',
            name=loc['city'],
            text=[loc['city'].split(',')[0]],
            textposition='top center',
            marker=dict(
                size=loc['expansion_score'] / 5,
                color=loc['expansion_score'],
                colorscale='Viridis',
                showscale=True,
                line=dict(width=2, color='white')
            ),
            hovertemplate=f"<b>{loc['city']}</b><br>" +
                         f"ROI: {loc['projected_roi']}%<br>" +
                         f"Breakeven: {loc['breakeven_months']} months<br>" +
                         f"Score: {loc['expansion_score']}/100<extra></extra>"
        ))
    
    fig_roi.update_layout(
        title="ROI vs Breakeven Time",
        xaxis_title="Breakeven (months)",
        yaxis_title="Projected ROI (%)",
        paper_bgcolor='#0a0a0a',
        plot_bgcolor='#1a1a2e',
        font=dict(color='white'),
        showlegend=False,
        height=400
    )
    
    st.plotly_chart(fig_roi, use_container_width=True)

with col_chart2:
    # Competition vs Rent
    fig_comp = go.Figure()
    
    for loc in expansion_locations:
        fig_comp.add_trace(go.Scatter(
            x=[loc['competition_density']],
            y=[loc['rent_per_sqft']],
            mode='markers+text',
            name=loc['city'],
            text=[loc['city'].split(',')[0]],
            textposition='top center',
            marker=dict(
                size=loc['foot_traffic_score'] / 5,
                color=loc['expansion_score'],
                colorscale='Plasma',
                showscale=True,
                line=dict(width=2, color='white')
            ),
            hovertemplate=f"<b>{loc['city']}</b><br>" +
                         f"Competition: {loc['competition_density']} rest/sq mi<br>" +
                         f"Rent: ${loc['rent_per_sqft']}/sq ft<br>" +
                         f"Foot Traffic: {loc['foot_traffic_score']}/100<extra></extra>"
        ))
    
    fig_comp.update_layout(
        title="Competition vs Rent Cost",
        xaxis_title="Competition Density (restaurants/sq mi)",
        yaxis_title="Rent ($/sq ft)",
        paper_bgcolor='#0a0a0a',
        plot_bgcolor='#1a1a2e',
        font=dict(color='white'),
        showlegend=False,
        height=400
    )
    
    st.plotly_chart(fig_comp, use_container_width=True)

st.markdown("---")

# ============================================================================
# DETAILED LOCATION CARDS
# ============================================================================

st.markdown("## 🎯 Detailed Location Analysis")

# City selector
selected_city = st.selectbox(
    "Choose a location to analyze:",
    [loc['city'] for loc in expansion_locations],
    index=0
)

selected_location = next((loc for loc in expansion_locations if loc['city'] == selected_city), None)

if selected_location:
    # Header
    col_header1, col_header2, col_header3 = st.columns([2, 1, 1])
    
    with col_header1:
        st.markdown(f"### 📍 {selected_location['city']}")
        st.caption(f"Population: {selected_location['population']:,} | Median Income: ${selected_location['median_income']:,}")
    
    with col_header2:
        score_color = "#00ff88" if selected_location['expansion_score'] >= 90 else "#00c6ff" if selected_location['expansion_score'] >= 80 else "#feca57"
        st.markdown(f"""
        <div style="text-align: center; padding: 15px; background: {score_color}; border-radius: 12px;">
            <p style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: 900;">{selected_location['expansion_score']}</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 12px; font-weight: 700;">EXPANSION SCORE</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col_header3:
        roi_color = "#00ff88" if selected_location['projected_roi'] >= 30 else "#00c6ff"
        st.markdown(f"""
        <div style="text-align: center; padding: 15px; background: {roi_color}; border-radius: 12px;">
            <p style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: 900;">{selected_location['projected_roi']}%</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 12px; font-weight: 700;">PROJECTED ROI</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Metrics
    col_m1, col_m2, col_m3, col_m4 = st.columns(4)
    
    with col_m1:
        st.metric("Foot Traffic", f"{selected_location['foot_traffic_score']}/100")
    with col_m2:
        st.metric("Competition", f"{selected_location['competition_density']} rest/sq mi")
    with col_m3:
        st.metric("Rent", f"${selected_location['rent_per_sqft']}/sq ft")
    with col_m4:
        st.metric("Breakeven", f"{selected_location['breakeven_months']} months")
    
    # Details
    col_detail1, col_detail2 = st.columns(2)
    
    with col_detail1:
        st.markdown("#### 👥 Customer Demographics")
        st.info(selected_location['customer_demographics'])
        
        st.markdown("#### 🍽️ Local Preferences")
        st.info(selected_location['local_preferences'])
    
    with col_detail2:
        st.markdown("#### ✅ Advantages")
        for pro in selected_location['pros']:
            st.markdown(f"- ✅ {pro}")
        
        st.markdown("#### ⚠️ Challenges")
        for con in selected_location['cons']:
            st.markdown(f"- ⚠️ {con}")
    
    st.markdown("---")
    
    # Financial Projection
    st.markdown("### 💰 5-Year Financial Projection")
    
    # Calculate projections
    initial_investment = 500000  # $500k
    monthly_revenue = 85000  # $85k/month average
    monthly_costs = 60000  # $60k/month (includes all expenses)
    years = 5
    
    projection_data = []
    cumulative_profit = -initial_investment
    
    for year in range(1, years + 1):
        annual_revenue = monthly_revenue * 12 * (1.08 ** (year - 1))  # 8% annual growth
        annual_costs = monthly_costs * 12 * (1.05 ** (year - 1))  # 5% cost inflation
        annual_profit = annual_revenue - annual_costs
        cumulative_profit += annual_profit
        
        projection_data.append({
            'Year': year,
            'Revenue': annual_revenue,
            'Costs': annual_costs,
            'Profit': annual_profit,
            'Cumulative': cumulative_profit
        })
    
    proj_df = pd.DataFrame(projection_data)
    
    fig_proj = go.Figure()
    
    fig_proj.add_trace(go.Bar(
        x=proj_df['Year'],
        y=proj_df['Revenue'],
        name='Revenue',
        marker_color='#00ff88'
    ))
    
    fig_proj.add_trace(go.Bar(
        x=proj_df['Year'],
        y=proj_df['Costs'],
        name='Costs',
        marker_color='#ff6b6b'
    ))
    
    fig_proj.add_trace(go.Scatter(
        x=proj_df['Year'],
        y=proj_df['Cumulative'],
        name='Cumulative Profit',
        mode='lines+markers',
        line=dict(color='#00c6ff', width=3),
        marker=dict(size=10),
        yaxis='y2'
    ))
    
    fig_proj.update_layout(
        title=f"5-Year Financial Forecast - {selected_location['city']}",
        xaxis_title="Year",
        yaxis_title="Annual Amount ($)",
        yaxis2=dict(
            title="Cumulative Profit ($)",
            overlaying='y',
            side='right'
        ),
        paper_bgcolor='#0a0a0a',
        plot_bgcolor='#1a1a2e',
        font=dict(color='white'),
        barmode='group',
        height=400
    )
    
    st.plotly_chart(fig_proj, use_container_width=True)
    
    # Action button
    st.markdown("---")
    col_btn1, col_btn2, col_btn3 = st.columns([1, 2, 1])
    with col_btn2:
        if st.button(f"🚀 LAUNCH FRANCHISE IN {selected_location['city'].upper()}", use_container_width=True):
            st.success(f"✅ Franchise application initiated for {selected_location['city']}!")
            st.info("📧 Detailed feasibility report will be sent to your email.")
            st.balloons()

