// src/config.js
// API Keys Configuration

export const config = {
  // Composio (browser automations)
  composio: {
    apiKey: import.meta.env.VITE_COMPOSIO_API_KEY || 'ak_GfPAqC543NyGqgBX7mPT'
  },
  
  // Firecrawl (web scraping)
  firecrawl: {
    apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || 'fc-10af06f15aa349098f1d1f1e358fc7e1'
  },
  
  // Gemini API (AI chat)
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
  },
  
  // Backend API
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
  }
}

export default config
