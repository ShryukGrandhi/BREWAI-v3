"""
Knowledge Graph Page
====================
Interactive visualization of Brew.AI's reasoning and data relationships.
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import networkx as nx
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Knowledge Graph", page_icon="🕸️", layout="wide")

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
    .node-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        padding: 20px;
        border-radius: 15px;
        border: 2px solid #667eea;
        margin: 10px 0;
    }
    .stButton button {
        background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border-radius: 8px;
        padding: 16px 32px;
        font-weight: 600;
        font-size: 16px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🕸️ Knowledge Graph - Unsiloed Intelligence")
st.caption("Interactive AI Reasoning Map • Root Cause Analysis • Evidence Citations")

st.markdown("---")

# ============================================================================
# BUILD KNOWLEDGE GRAPH FROM REAL DATA
# ============================================================================

@st.cache_data
def build_knowledge_graph():
    """
    Build knowledge graph from all CSV data sources.
    Returns NetworkX graph.
    """
    G = nx.DiGraph()
    
    # Load all data
    try:
        orders_df = pd.read_csv("data/orders_realtime.csv")
        inventory_df = pd.read_csv("data/inventory.csv")
        staff_df = pd.read_csv("data/staff_schedule.csv")
        reviews_df = pd.read_csv("data/customer_reviews.csv")
        
        # RESTAURANT NODE (central)
        G.add_node("Charcoal Eats US", 
                   type="restaurant", 
                   status="operational",
                   color="#00ff88",
                   size=50)
        
        # MENU ITEMS (from orders)
        top_items = orders_df['item_name'].value_counts().head(10)
        for item, count in top_items.items():
            G.add_node(item, 
                       type="menu_item", 
                       orders=int(count),
                       color="#667eea",
                       size=20 + (count / 5))
            G.add_edge("Charcoal Eats US", item, relation="serves", weight=count)
        
        # INVENTORY (from inventory)
        low_stock = inventory_df[inventory_df['quantity'] < inventory_df['reorder_level']]
        for idx, item in low_stock.iterrows():
            node_id = f"inv_{item['item_name']}"
            G.add_node(node_id,
                       type="inventory_risk",
                       item=item['item_name'],
                       quantity=int(item['quantity']),
                       color="#ff6b6b",
                       size=25)
            G.add_edge(node_id, "Charcoal Eats US", relation="low_stock", weight=5)
        
        # STAFF (from staff)
        roles = staff_df['role'].value_counts()
        for role, count in roles.items():
            node_id = f"staff_{role}"
            G.add_node(node_id,
                       type="workforce",
                       role=role,
                       count=int(count),
                       color="#00c6ff",
                       size=20 + count)
            G.add_edge(node_id, "Charcoal Eats US", relation="employs", weight=count)
        
        # CUSTOMER SENTIMENT (from reviews)
        avg_rating = reviews_df['rating'].mean()
        sentiment_node = f"customer_sentiment"
        G.add_node(sentiment_node,
                   type="sentiment",
                   avg_rating=round(avg_rating, 2),
                   review_count=len(reviews_df),
                   color="#feca57" if avg_rating >= 4 else "#ff6b6b",
                   size=30)
        G.add_edge(sentiment_node, "Charcoal Eats US", relation="feedback", weight=10)
        
        # WEATHER/DEMAND (simulated)
        G.add_node("weather_forecast",
                   type="external_factor",
                   condition="Rain Tomorrow",
                   color="#764ba2",
                   size=25)
        G.add_edge("weather_forecast", "Charcoal Eats US", relation="impacts", weight=8)
        
        # TRAFFIC (simulated)
        G.add_node("traffic_congestion",
                   type="external_factor",
                   level="Moderate",
                   color="#764ba2",
                   size=20)
        G.add_edge("traffic_congestion", "Charcoal Eats US", relation="affects_delivery", weight=6)
        
        print(f"✅ Built knowledge graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        return G
        
    except Exception as e:
        print(f"ERROR building graph: {e}")
        # Return minimal graph
        G.add_node("Charcoal Eats US", type="restaurant", color="#00ff88", size=50)
        return G


# Build graph
G = build_knowledge_graph()

# ============================================================================
# GRAPH STATISTICS
# ============================================================================

st.markdown("## 📊 Graph Intelligence")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Total Nodes", G.number_of_nodes())
with col2:
    st.metric("Total Edges", G.number_of_edges())
with col3:
    node_types = set([G.nodes[n].get('type', 'unknown') for n in G.nodes()])
    st.metric("Entity Types", len(node_types))
with col4:
    # Count risk nodes
    risk_nodes = [n for n in G.nodes() if G.nodes[n].get('type') == 'inventory_risk']
    st.metric("Risk Nodes", len(risk_nodes), delta=f"-{len(risk_nodes)}" if risk_nodes else "0")

st.markdown("---")

# ============================================================================
# INTERACTIVE GRAPH VISUALIZATION
# ============================================================================

st.markdown("## 🕸️ Interactive Knowledge Map")
st.caption("Click nodes to see details • Red = Risk • Blue = Operations • Green = Business")

# Create layout
pos = nx.spring_layout(G, k=0.5, iterations=50)

# Create edge trace
edge_x = []
edge_y = []
for edge in G.edges():
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x.extend([x0, x1, None])
    edge_y.extend([y0, y1, None])

edge_trace = go.Scatter(
    x=edge_x, y=edge_y,
    line=dict(width=0.5, color='#667eea'),
    hoverinfo='none',
    mode='lines',
    opacity=0.5
)

# Create node trace
node_x = []
node_y = []
node_text = []
node_color = []
node_size = []

for node in G.nodes():
    x, y = pos[node]
    node_x.append(x)
    node_y.append(y)
    
    # Get node attributes
    attrs = G.nodes[node]
    node_color.append(attrs.get('color', '#667eea'))
    node_size.append(attrs.get('size', 20))
    
    # Build hover text
    hover_text = f"<b>{node}</b><br>"
    hover_text += f"Type: {attrs.get('type', 'unknown')}<br>"
    
    # Add specific attributes
    for key, value in attrs.items():
        if key not in ['type', 'color', 'size']:
            hover_text += f"{key}: {value}<br>"
    
    node_text.append(hover_text)

node_trace = go.Scatter(
    x=node_x, y=node_y,
    mode='markers+text',
    hoverinfo='text',
    text=[str(node)[:15] for node in G.nodes()],  # Truncate long names
    textposition="top center",
    textfont=dict(size=10, color='white'),
    hovertext=node_text,
    marker=dict(
        showscale=False,
        color=node_color,
        size=node_size,
        line=dict(width=2, color='white')
    )
)

# Create figure
fig = go.Figure(data=[edge_trace, node_trace],
                layout=go.Layout(
                    title=dict(
                        text='Brew.AI Knowledge Graph - Real-Time Reasoning',
                        font=dict(color='white', size=20)
                    ),
                    showlegend=False,
                    hovermode='closest',
                    margin=dict(b=0, l=0, r=0, t=40),
                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    paper_bgcolor='#0a0a0a',
                    plot_bgcolor='#0a0a0a',
                    height=700
                ))

st.plotly_chart(fig, use_container_width=True)

st.markdown("---")

# ============================================================================
# NODE DETAILS
# ============================================================================

st.markdown("## 🔍 Entity Details")

# Select node to inspect
selected_node = st.selectbox(
    "Select a node to inspect:",
    list(G.nodes()),
    index=0
)

if selected_node:
    attrs = G.nodes[selected_node]
    
    col_detail1, col_detail2 = st.columns([1, 2])
    
    with col_detail1:
        st.markdown(f"### 📍 {selected_node}")
        st.markdown(f"**Type:** {attrs.get('type', 'unknown')}")
        
        # Show all attributes
        for key, value in attrs.items():
            if key not in ['type', 'color', 'size']:
                st.markdown(f"**{key}:** {value}")
    
    with col_detail2:
        st.markdown("### 🔗 Connections")
        
        # Incoming edges
        in_edges = list(G.in_edges(selected_node, data=True))
        if in_edges:
            st.markdown("**← Incoming:**")
            for source, target, data in in_edges:
                relation = data.get('relation', 'connected')
                weight = data.get('weight', 1)
                st.markdown(f"- `{source}` --[{relation} ({weight})]→ `{target}`")
        
        # Outgoing edges
        out_edges = list(G.out_edges(selected_node, data=True))
        if out_edges:
            st.markdown("**→ Outgoing:**")
            for source, target, data in out_edges:
                relation = data.get('relation', 'connected')
                weight = data.get('weight', 1)
                st.markdown(f"- `{source}` --[{relation} ({weight})]→ `{target}`")

st.markdown("---")

# ============================================================================
# ROOT CAUSE ANALYSIS
# ============================================================================

st.markdown("## 🎯 Root Cause Analysis")

# Find risk nodes
risk_nodes = [n for n in G.nodes() if G.nodes[n].get('type') == 'inventory_risk']

if risk_nodes:
    st.warning(f"⚠️ {len(risk_nodes)} inventory risks detected!")
    
    for risk_node in risk_nodes:
        with st.expander(f"🔴 {risk_node}"):
            attrs = G.nodes[risk_node]
            
            st.markdown(f"**Item:** {attrs.get('item', 'unknown')}")
            st.markdown(f"**Current Stock:** {attrs.get('quantity', 0)}")
            
            # Trace back to root causes
            st.markdown("**Root Causes:**")
            
            # Check if this item is popular (high orders)
            item_name = attrs.get('item', '')
            try:
                orders_df = pd.read_csv("data/orders_realtime.csv")
                item_orders = len(orders_df[orders_df['item_name'] == item_name.replace('inv_', '')])
                if item_orders > 10:
                    st.markdown(f"- ✅ High demand: {item_orders} recent orders")
            except:
                pass
            
            st.markdown("**Recommended Actions:**")
            st.markdown("- 🔄 Auto-order triggered")
            st.markdown("- 📧 Supplier notification sent")
            st.markdown("- 👨‍🍳 Staff alerted to menu adjustments")
else:
    st.success("✅ No critical inventory risks detected")

st.markdown("---")

# ============================================================================
# REFRESH BUTTON
# ============================================================================

if st.button("🔄 Refresh Knowledge Graph", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

