import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

export default function PlanningPage() {
  const navigate = useNavigate()
  const [autoTrigger, setAutoTrigger] = useState(false)
  const [checklistComplete, setChecklistComplete] = useState(false)
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)

  // 7-Day Forecast Data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weatherIcons = ['☀️', '⛅', '🌤️', '☁️', '🌦️', '☀️', '⛅']
  const temps = [72, 68, 75, 65, 70, 78, 74]
  const traffic = ['Medium', 'High', 'Medium', 'Low', 'High', 'Very High', 'High']
  const cooks = [6, 7, 6, 5, 8, 10, 9]
  const peakHours = ['6-8 PM', '6-9 PM', '6-8 PM', '5-7 PM', '7-10 PM', '6-11 PM', '6-10 PM']
  const orders = [180, 220, 195, 150, 280, 350, 310]
  const revenue = orders.map(o => `$${(o * 24.50).toFixed(0)}`)

  // LSTM Forecast Data (24 hours)
  const lstmData = Array.from({ length: 24 }, (_, i) => ({
    hour: i + 1,
    orders: [15, 12, 10, 8, 6, 5, 8, 12, 18, 25, 22, 28, 30, 20, 18, 22, 35, 42, 38, 32, 25, 20, 18, 15][i],
    revenue: [15, 12, 10, 8, 6, 5, 8, 12, 18, 25, 22, 28, 30, 20, 18, 22, 35, 42, 38, 32, 25, 20, 18, 15][i] * 24.50
  }))

  // Pie Chart Data
  const orderDistData = [
    { name: 'Burgers', value: 35, color: '#667eea' },
    { name: 'Wings', value: 25, color: '#764ba2' },
    { name: 'Bowls', value: 20, color: '#00c6ff' },
    { name: 'Salads', value: 10, color: '#00ff88' },
    { name: 'Drinks', value: 10, color: '#ff6b6b' }
  ]

  const runChecklist = async () => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/api/planning/checklist?auto_trigger=${autoTrigger}`)
      setChecklistComplete(true)
      setIssues(response.data.issues || [])
    } catch (error) {
      console.error('Checklist error:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAutomations = () => {
    const crisis = {
      id: 'planning_issues',
      title: 'WEEKLY READINESS ISSUES',
      description: `Planning detected ${issues.length} issues`,
      severity: 'HIGH',
      automations: issues.map(i => i.automation),
      timestamp: new Date().toISOString(),
      status: 'ACTIVE'
    }
    
    localStorage.setItem('active_crisis', JSON.stringify(crisis))
    navigate('/automations')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '42px', marginBottom: '10px' }}>📋 Weekly Operations Planning & Forecasting</h1>
      <p style={{ color: '#888', marginBottom: '30px', fontSize: '16px' }}>
        AI-Powered LSTM Predictions • 7-Day Outlook • Auto-Triggered Automations
      </p>

      {/* Demo Toggle */}
      <div className="alert alert-info" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>🎬 Demo Mode:</strong> Detects issues and triggers emergency automations automatically
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span>🚨 Demo Auto-Trigger</span>
          </label>
        </div>
      </div>

      {/* 7-Day Forecast Cards */}
      <h2 style={{ marginBottom: '20px' }}>📅 7-Day Operations Forecast</h2>
      <div className="grid-7" style={{ marginBottom: '40px' }}>
        {days.map((day, i) => (
          <motion.div
            key={day}
            className="day-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h3 style={{ color: '#667eea', margin: 0 }}>{day}</h3>
            <div style={{ fontSize: '36px', margin: '10px 0' }}>{weatherIcons[i]}</div>
            <p style={{ margin: '5px 0' }}><strong>{temps[i]}°F</strong></p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>Traffic: {traffic[i]}</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>👨‍🍳 {cooks[i]} cooks</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>⏰ {peakHours[i]}</p>
            <p style={{ margin: '10px 0', fontSize: '18px', color: '#00ff88' }}><strong>{orders[i]}</strong> orders</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#00c6ff' }}>{revenue[i]}</p>
          </motion.div>
        ))}
      </div>

      {/* LSTM Forecast Charts */}
      <h2 style={{ marginBottom: '20px' }}>📈 LSTM Deep Learning Forecast</h2>
      <div className="grid-2" style={{ marginBottom: '40px' }}>
        <div className="insight-card">
          <h3 style={{ marginBottom: '15px' }}>📊 Next 24 Hours - Order Predictions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lstmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="orders" stroke="#00ff88" strokeWidth={3} dot={{ fill: '#00ff88' }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <div className="metric-label">Total Predicted Orders (24h)</div>
            <div className="metric-value">{lstmData.reduce((sum, d) => sum + d.orders, 0)}</div>
            <div className="metric-delta">+18%</div>
          </div>
        </div>

        <div className="insight-card">
          <h3 style={{ marginBottom: '15px' }}>💰 Revenue Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lstmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#00c6ff" strokeWidth={3} dot={{ fill: '#00c6ff' }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <div className="metric-label">Total Predicted Revenue (24h)</div>
            <div className="metric-value">${lstmData.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)}</div>
            <div className="metric-delta">+12%</div>
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <h2 style={{ marginBottom: '20px' }}>📊 Operations Analytics</h2>
      <div className="grid-3" style={{ marginBottom: '40px' }}>
        <div className="insight-card">
          <h3 style={{ marginBottom: '15px' }}>🍔 Order Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderDistData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {orderDistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 10-Point Checklist */}
      <h2 style={{ marginBottom: '20px' }}>✅ 10-Point Readiness Checklist</h2>
      <motion.button
        className="btn btn-primary"
        onClick={runChecklist}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', marginBottom: '20px', padding: '16px', fontSize: '16px' }}
      >
        {loading ? '🔄 Running Checklist...' : '🔄 RUN FULL CHECKLIST'}
      </motion.button>

      {checklistComplete && issues.length > 0 && autoTrigger && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="alert alert-error">
            <h3>🚨 {issues.length} ISSUES DETECTED!</h3>
            {issues.map((issue, i) => (
              <p key={i}>⚠️ <strong>{issue.type.toUpperCase()}:</strong> {issue.message}</p>
            ))}
          </div>

          <motion.button
            className="btn btn-danger"
            onClick={triggerAutomations}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', marginTop: '20px', padding: '16px', fontSize: '16px' }}
          >
            🚀 TRIGGER EMERGENCY AUTOMATIONS NOW
          </motion.button>
        </motion.div>
      )}

      {checklistComplete && issues.length === 0 && (
        <div className="alert alert-success">
          🎉 <strong>ALL SYSTEMS GO!</strong> Week is fully prepared. No issues detected.
        </div>
      )}
    </div>
  )
}

