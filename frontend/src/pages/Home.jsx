import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'

const API_BASE = 'http://localhost:8000'

export default function HomePage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/data/analytics`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Analytics error:', error)
    }
  }

  const handleCrisisSimulation = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/api/crisis/generate`)
      const crisis = response.data.crisis
      
      // Store crisis and redirect to automations
      localStorage.setItem('active_crisis', JSON.stringify(crisis))
      navigate('/automations')
    } catch (error) {
      console.error('Crisis generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <motion.div 
        className="hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ minHeight: '180px' }}
      >
        <h1 style={{ fontSize: '56px', marginBottom: '15px' }}>🍺 Brew.AI</h1>
        <p style={{ fontSize: '24px' }}>Autonomous Restaurant Operations</p>
        <p style={{ fontSize: '14px', marginTop: '15px', opacity: 0.8 }}>
          CAPTAIN • METORIAL • NIVARA • BROWSER-USE • MORPH • GMAIL
        </p>
      </motion.div>

      {/* Today's Analytics */}
      <h2 style={{ marginBottom: '20px' }}>📊 Today's Analytics</h2>
      <div className="grid-4">
        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="metric-label">Revenue</div>
          <div className="metric-value">{analytics?.revenue || '$0'}</div>
          <div className="metric-delta">+12%</div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="metric-label">Orders</div>
          <div className="metric-value">{analytics?.orders || 0}</div>
          <div className="metric-delta">+8%</div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="metric-label">Profit Margin</div>
          <div className="metric-value">{analytics?.profit_margin || '0%'}</div>
          <div className="metric-delta">+4%</div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="metric-label">Active Staff</div>
          <div className="metric-value">{analytics?.active_staff || 0}</div>
          <div className="metric-delta">→</div>
        </motion.div>
      </div>

      {/* Crisis Simulation */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>🚨 Crisis Simulation</h2>
        <div className="grid-2">
          <motion.button
            className="btn btn-danger"
            onClick={handleCrisisSimulation}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', padding: '20px', fontSize: '16px' }}
          >
            {loading ? '🔄 Generating Crisis...' : '💥 SIMULATE RANDOM CRISIS'}
          </motion.button>

          <motion.button
            className="btn"
            onClick={() => localStorage.removeItem('active_crisis')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', padding: '20px', fontSize: '16px' }}
          >
            🔄 Reset Simulation
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '60px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        📍 Charcoal Eats US • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}

