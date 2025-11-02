# 🔧 Brew.AI Environment Setup

## Quick Fix for Current Error

The error you're seeing is because the application is missing required environment variables. Here's how to fix it:

### Create a `.env` file

Create a new file named `.env` in the root directory of your project (next to `app`, `agents`, `data` folders) with the following content:

```env
# ============================================
# CRITICAL - REQUIRED FOR CORE FUNCTIONALITY
# ============================================

# Gemini API Key (Google AI Studio)
# Get it from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Captain AI API (for RAG with citations)
# Get it from: https://www.captaindata.co/
CAPTAIN_API_KEY=your_captain_api_key_here
CAPTAIN_ORG_ID=your_captain_org_id_here

# ============================================
# OPTIONAL - ENHANCE SPECIFIC FEATURES
# ============================================

# Google Places API (for scraping restaurant reviews)
# If not set, will use CSV data instead
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# TomTom Traffic API (for real-time traffic data)
# If not set, traffic features will be limited
TOMTOM_API_KEY=your_tomtom_api_key_here

# ============================================
# CONFIGURATION OPTIONS
# ============================================

# Tenant ID (defaults to charcoal_eats_us)
TENANT_ID=charcoal_eats_us

# Confirm scraping (set to 'true' to enable all scraping features)
CONFIRM_SCRAPE=true
```

## Priority Setup

### Minimum Required (to get started):

1. **GEMINI_API_KEY** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **CAPTAIN_API_KEY** - Get from [Captain Data](https://www.captaindata.co/)
3. **CAPTAIN_ORG_ID** - From your Captain Data account

### Optional (can be added later):

- **GOOGLE_PLACES_API_KEY** - For live restaurant review scraping (falls back to CSV data)
- **TOMTOM_API_KEY** - For real-time traffic data

## What Changed?

✅ **Fixed**: Removed BrowserUse dependency completely

The application will now:
- ✅ Start successfully with just the 3 critical keys (Gemini + Captain)
- ⚠️ Show warnings for missing optional keys (Google Places, TomTom)
- 📊 Generate supplier orders offline without browser automation
- ✅ All features work without external browser dependencies

## After Creating `.env` File

1. Make sure your `.env` file is in the project root
2. Fill in at least the 3 required API keys
3. Restart your Streamlit application
4. The orchestrator will now start successfully!

## Need Help Getting API Keys?

### Gemini API Key (FREE)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

### Captain AI
1. Visit: https://www.captaindata.co/
2. Sign up for an account
3. Find your API key and Org ID in account settings

### Optional Keys
- **Google Places**: https://console.cloud.google.com/ (enable Places API)
- **TomTom Traffic**: https://developer.tomtom.com/

## Verification

Run this Python command to verify your environment is set up:

```python
import os
from dotenv import load_dotenv

load_dotenv()

required = ["GEMINI_API_KEY", "CAPTAIN_API_KEY", "CAPTAIN_ORG_ID"]
optional = ["GOOGLE_PLACES_API_KEY", "TOMTOM_API_KEY"]

print("✅ REQUIRED KEYS:")
for key in required:
    status = "✓" if os.getenv(key) else "✗"
    print(f"  {status} {key}")

print("\n⚠️  OPTIONAL KEYS:")
for key in optional:
    status = "✓" if os.getenv(key) else "✗"
    print(f"  {status} {key}")
```

---

**Note**: The `.env` file should **never** be committed to git. It's automatically ignored by `.gitignore`.

