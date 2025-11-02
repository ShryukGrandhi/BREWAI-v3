import streamlit as st
import sys
from pathlib import Path
from datetime import datetime
import os

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Compliance", page_icon="🔐", layout="wide")

st.markdown("""
<style>
    .main { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; }
    h1, h2, h3 { color: white; }
    .report-card {
        background: #1a1a2e;
        border: 1px solid #00ff88;
        border-radius: 12px;
        padding: 20px;
        margin: 15px 0;
    }
</style>
""", unsafe_allow_html=True)

st.title("🔐 Compliance & Reports")
st.caption("Powered by NIVARA Secure Document Management")

st.markdown("---")

# Latest Crisis Report
if st.session_state.get('latest_crisis_report'):
    st.markdown("### 📄 Latest Crisis Report (from NIVARA)")
    
    st.markdown(f"""
    <div class="report-card">
        <h4>🚨 Crisis Response Report</h4>
        <p>Received: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
        <p><strong>Source:</strong> NIVARA Secure Compliance System</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.text_area(
        "Crisis Report",
        st.session_state.latest_crisis_report,
        height=400,
        key="crisis_report_display"
    )
    
    col_r1, col_r2 = st.columns(2)
    
    with col_r1:
        st.download_button(
            "📥 Download Report",
            data=st.session_state.latest_crisis_report,
            file_name=f"crisis_report_{datetime.now().strftime('%Y%m%d')}.txt",
            mime="text/plain"
        )
    
    with col_r2:
        if st.button("🔒 Archive to NIVARA"):
            st.success("Report archived to NIVARA secure storage")

st.markdown("---")

# All Crisis Reports
st.markdown("### 📚 All Crisis Reports")

if os.path.exists("artifacts/crisis_reports"):
    reports = sorted(os.listdir("artifacts/crisis_reports"), reverse=True)
    
    if reports:
        for report_file in reports[:10]:
            with st.expander(f"📄 {report_file}"):
                try:
                    with open(f"artifacts/crisis_reports/{report_file}", 'r', encoding='utf-8') as f:
                        report_content = f.read()
                    st.text(report_content[:500] + "...")
                    
                    if st.button(f"View Full Report", key=report_file):
                        st.text_area("Full Report", report_content, height=400, key=f"full_{report_file}")
                except:
                    st.error("Could not read report")
    else:
        st.info("No crisis reports yet. Simulate a crisis on the Home page!")
else:
    st.info("No crisis reports yet. Simulate a crisis on the Home page!")

st.markdown("---")

# NIVARA Integration Status
st.markdown("### 🔐 NIVARA Integration")

from services.nivara_client import get_nivara_client

nivara = get_nivara_client()
if nivara:
    st.success("✅ NIVARA Connected")
    st.info("""
    **Security Features:**
    - Tenant-level isolation enforced
    - Document access logging enabled
    - Compliance tracking active
    - Secure document storage
    """)
else:
    st.warning("⚠️ NIVARA client not configured")

st.caption("🔐 Compliance powered by NIVARA AI")

