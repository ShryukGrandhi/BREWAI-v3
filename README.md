# 🍺 Brew.AI v3 - Autonomous Restaurant Operations

AI-powered restaurant management system with predictive analytics, automated crisis response, and multi-agent orchestration.

## 🚀 Features

### 📋 **Planning Dashboard**
- 7-day operational forecast (Mon-Sun)
- Weather, traffic, and demand predictions
- LSTM deep learning for 24-hour order/revenue forecasting
- 3 interactive pie charts (orders, peak hours, payments)
- CAPTAIN AI insights and recommendations
- Product performance analytics
- 10-point readiness checklist with auto-trigger

### 🤖 **18 Visual Automations**
- Emergency hiring with email generation (Gmail API)
- Contract drafting (CAPTAIN RAG)
- Job posting to Indeed
- Asana task creation
- Supplier order automation
- Equipment repair requests
- Voice agent phone calls (NIVARA)
- Social media responses
- Menu adjustments
- Customer apologies
- Flash sales
- Refund processing
- P&L analysis
- Health audits
- Legal document review

### 📊 **Analytics**
- LSTM 24-hour forecasting
- 5+ interactive Plotly charts
- Real-time CSV data integration
- AI-powered insights

### 🎤 **Voice & Chatbot**
- Speech-to-Text (Google STT)
- Text-to-Speech (NIVARA TTS)
- CAPTAIN RAG with full data access
- Gemini fallback

### 🚨 **Crisis Management**
- 17 random crisis types
- Auto-detection of understaffing and low inventory
- Automated emergency response
- Visual automation execution
- Crisis report generation
- NIVARA compliance integration

### 📄 **Compliance**
- Secure document storage (NIVARA)
- Crisis response reports
- Audit trails

## 🛠️ Tech Stack

- **Frontend:** Streamlit
- **AI/ML:** TensorFlow/Keras (LSTM), OpenAI SDK
- **RAG:** Captain (OpenAI-compatible)
- **Voice:** Google Speech Recognition, NIVARA TTS/STT
- **Automation:** Browser-Use, Playwright
- **APIs:** Gmail, Asana, Open-Meteo, TomTom, PredictHQ
- **Compliance:** NIVARA AI
- **Data:** Pandas, NumPy
- **Visualization:** Plotly, Pyvis

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/ShryukGrandhi/BREWAI-v3.git
cd BREWAI-v3

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

## 🔑 Required API Keys

Create a `.env` file with:

```
CAPTAIN_API_KEY=your_captain_key
CAPTAIN_ORG_ID=your_org_id
GEMINI_API_KEY=your_gemini_key
BROWSER_USE_API_KEY=your_browser_use_key
NIVARA_API_KEY=your_nivara_key
GMAIL_API_KEY=your_gmail_key
```

## 🚀 Usage

```bash
streamlit run app/Home.py
```

Open http://localhost:8501

## 🎬 Demo Flow

1. **Home Page:** View live analytics, trigger crisis simulation
2. **Planning Page:** 
   - View 7-day forecast
   - Toggle Demo Mode ON
   - Click "RUN FULL CHECKLIST"
   - Detect issues (staffing/inventory)
   - Click "TRIGGER EMERGENCY AUTOMATIONS"
3. **Automations Page:** Watch 18 automations execute visually
4. **Analytics Page:** View LSTM forecasts and insights
5. **Voice & Chatbot:** Ask questions via voice or text
6. **Compliance:** Review crisis reports

## 📁 Project Structure

```
BrewAI v2/
├── app/
│   ├── Home.py                 # Main landing page
│   └── pages/
│       ├── 1_Automations.py    # 18 visual automations
│       ├── 2_Planning.py       # 7-day forecast + LSTM
│       ├── 3_Analytics.py      # Charts and insights
│       ├── 4_Voice_Chatbot.py  # STT + Captain
│       └── 5_Compliance.py     # Crisis reports
├── agents/
│   ├── chaos_engine.py         # 17 crisis scenarios
│   └── automation_engine.py    # Automation execution
├── services/
│   ├── captain_client.py       # CAPTAIN RAG integration
│   ├── lstm_forecaster.py      # Deep learning forecasts
│   ├── nivara_client.py        # Compliance & voice
│   └── gmail_sender.py         # Email automation
├── data/
│   ├── orders_realtime.csv
│   ├── inventory.csv
│   ├── staff_schedule.csv
│   └── customer_reviews.csv
└── models/
    └── lstm_demand_model.h5    # Trained LSTM model
```

## 🏆 Sponsors & Integrations

- **CAPTAIN** - RAG and knowledge management
- **METORIAL** - Web scraping and MCP
- **NIVARA** - Compliance, security, and voice agents
- **BROWSER-USE** - Web automation
- **MORPH** - Workflow automation
- **GMAIL API** - Email sending

## 📊 Key Metrics

- **18 Automations** - Fully visual and interactive
- **17 Crisis Types** - Randomly generated scenarios
- **7-Day Forecast** - Weather, traffic, demand
- **10-Point Checklist** - Operational readiness
- **24-Hour LSTM** - Deep learning predictions
- **5+ Charts** - Interactive Plotly visualizations

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📝 License

MIT License

## 👨‍💻 Author

**Shryuk Grandhi**
- GitHub: [@ShryukGrandhi](https://github.com/ShryukGrandhi)

---

**Built with ❤️ for autonomous restaurant operations**
