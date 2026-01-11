import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Sparkles, TrendingUp, DollarSign, Users, ArrowRight, Bot, User, 
  Lightbulb, Store, BarChart3, Loader2, Zap, Coffee, Gift, Star, Tag, 
  Percent, Shield, AlertTriangle, Package, Calendar, RefreshCw
} from 'lucide-react'
import axios from 'axios'
import { config } from '../config'

const API_BASE = config.api.baseUrl

// Chat Message Component
const ChatMessage = ({ message, isUser, onActionClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      marginBottom: 16
    }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: isUser ? 'var(--accent-green)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {isUser ? <User size={18} /> : <Bot size={18} />}
    </div>
    <div style={{
      background: isUser ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      borderTopLeftRadius: isUser ? 16 : 4,
      borderTopRightRadius: isUser ? 4 : 16,
      padding: '12px 16px',
      maxWidth: '70%',
      color: isUser ? '#000' : '#fff'
    }}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{message.text}</div>
      
      {message.action && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onActionClick(message.action)}
          style={{
            marginTop: 12, width: '100%',
            padding: '10px 14px', borderRadius: 10,
            background: isUser ? 'rgba(0,0,0,0.2)' : 'var(--accent-green)',
            color: isUser ? '#fff' : '#000',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontWeight: 600, fontSize: '0.875rem'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Store size={14} /> {message.action.label}
          </span>
          <ArrowRight size={14} />
        </motion.button>
      )}
      
      {message.liveData && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: `1px solid ${isUser ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          fontSize: '0.75rem'
        }}>
          <div><span style={{ opacity: 0.7 }}>Orders:</span> <strong>{message.liveData.orders}</strong></div>
          <div><span style={{ opacity: 0.7 }}>Revenue:</span> <strong>${message.liveData.revenue?.toFixed(0)}</strong></div>
          <div><span style={{ opacity: 0.7 }}>Staff:</span> <strong>{message.liveData.staff}</strong></div>
          <div><span style={{ opacity: 0.7 }}>Compliance:</span> <strong>{message.liveData.compliance}%</strong></div>
        </div>
      )}
    </div>
  </motion.div>
)

export default function VoiceChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [agentMode, setAgentMode] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, agentRes] = await Promise.all([
        axios.get(`${API_BASE}/api/data/analytics`),
        axios.get(`${API_BASE}/api/agent/status`).catch(() => ({ data: {} }))
      ])
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data)
      }
      if (agentRes.data.agent_mode) {
        setAgentMode(agentRes.data.agent_mode.enabled)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { text: input, isUser: true }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, { message: input })
      
      let action = null
      const text = response.data.response?.toLowerCase() || ''
      
      // Detect recommended actions from response
      if (text.includes('flash sale') || text.includes('discount')) {
        action = { type: 'flash_sale', label: 'Start Flash Sale', params: { discount: 20 } }
      } else if (text.includes('feature') || text.includes('highlight')) {
        action = { type: 'feature', label: 'Feature Top Items', params: {} }
      } else if (text.includes('price increase') || text.includes('raise price')) {
        action = { type: 'price_increase', label: 'Increase Prices 10%', params: {} }
      } else if (text.includes('combo') || text.includes('bundle')) {
        action = { type: 'combo_deal', label: 'Create Combo Deal', params: {} }
      }

      const botMessage = {
        text: response.data.response || 'I apologize, I encountered an issue processing your request.',
        isUser: false,
        action,
        liveData: response.data.live_data
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action) => {
    navigate('/store', { state: action })
  }

  const quickQuestions = [
    { icon: <BarChart3 size={16} />, text: "How are sales today?", q: "How are my sales performing today? Give me specific numbers." },
    { icon: <Package size={16} />, text: "Inventory status", q: "What's my inventory status? Are there any items running low?" },
    { icon: <Users size={16} />, text: "Staff overview", q: "Give me an overview of my staff. Who's working and any issues?" },
    { icon: <Shield size={16} />, text: "Compliance check", q: "What's my compliance score? Any issues I should address?" },
    { icon: <Lightbulb size={16} />, text: "Recommendations", q: "What do you recommend I do right now to improve my business?" },
    { icon: <AlertTriangle size={16} />, text: "Any crises?", q: "Are there any crises or urgent issues I should know about?" }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Brew AI Assistant</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Powered by Gemini • Real-time data access
            </p>
          </div>
        </div>

        {/* Live Stats */}
        {analytics && (
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { icon: <DollarSign size={16} />, label: 'Revenue', value: `$${analytics.total_revenue?.toFixed(0) || 0}`, color: '#22c55e' },
              { icon: <BarChart3 size={16} />, label: 'Orders', value: analytics.total_orders || 0, color: '#3b82f6' },
              { icon: <Users size={16} />, label: 'Staff', value: analytics.active_staff || 0, color: '#f59e0b' },
              { icon: <Shield size={16} />, label: 'Score', value: `${analytics.compliance_score || 100}%`, color: '#8b5cf6' }
            ].map((stat, idx) => (
              <div key={idx} style={{
                background: `${stat.color}15`,
                borderRadius: 12, padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{stat.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Chat Area */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-secondary)',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                <Bot size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p>Ask me anything about your restaurant!</p>
                <p style={{ fontSize: '0.85rem' }}>I have access to all your live data.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={idx} 
                message={msg} 
                isUser={msg.isUser}
                onActionClick={handleActionClick}
              />
            ))}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: 12, alignItems: 'center' }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Loader2 size={18} className="animate-spin" />
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '12px 16px'
                }}>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Thinking...
                  </motion.div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            padding: 16, borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: 12
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Brew AI anything..."
              style={{
                flex: 1, padding: '14px 18px',
                borderRadius: 14, border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '14px 24px', borderRadius: 14,
                background: loading ? 'var(--bg-tertiary)' : 'var(--accent-green)',
                border: 'none', color: loading ? 'var(--text-tertiary)' : '#000',
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Send
            </motion.button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Questions */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 16, padding: 16,
            border: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} /> Quick Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickQuestions.map((q, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setInput(q.q); }}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.8rem'
                  }}
                >
                  {q.icon} {q.text}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Store Actions */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 16, padding: 16,
            border: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store size={16} /> Quick Store Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <Percent size={14} />, label: 'Flash Sale', action: 'flash_sale', color: '#ef4444' },
                { icon: <Star size={14} />, label: 'Feature', action: 'feature', color: '#f59e0b' },
                { icon: <TrendingUp size={14} />, label: 'Price +', action: 'price_increase', color: '#22c55e' },
                { icon: <Tag size={14} />, label: 'Price -', action: 'price_decrease', color: '#3b82f6' }
              ].map((btn, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/store', { state: { type: btn.action } })}
                  style={{
                    padding: '10px', borderRadius: 10,
                    background: `${btn.color}15`,
                    border: `1px solid ${btn.color}30`,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontSize: '0.75rem', fontWeight: 500
                  }}
                >
                  <span style={{ color: btn.color }}>{btn.icon}</span>
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Agent Mode Indicator */}
          <div style={{
            background: agentMode ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
            borderRadius: 16, padding: 16,
            border: `1px solid ${agentMode ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-subtle)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bot size={20} style={{ color: agentMode ? '#8b5cf6' : 'var(--text-tertiary)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Agent Mode: {agentMode ? 'ON' : 'OFF'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {agentMode ? 'Auto-applying recommendations' : 'Manual approval required'}
                </div>
              </div>
              {agentMode && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginLeft: 'auto' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
