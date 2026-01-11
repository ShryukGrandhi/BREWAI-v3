import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { config } from '../config'
import { 
  Store, Star, TrendingUp, Percent, Tag, RefreshCw, CheckCircle2, Loader2, 
  Zap, ExternalLink, ShoppingBag, Sparkles, Bot, Settings, ArrowRight,
  Gift, Coffee, Heart, Megaphone, BarChart3, DollarSign, Users, AlertTriangle
} from 'lucide-react'

const API_BASE = config.api.baseUrl

export default function StorePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [flashSale, setFlashSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applyingAction, setApplyingAction] = useState(null)
  const [lastAction, setLastAction] = useState(null)
  const [agentMode, setAgentMode] = useState(false)
  const [insights, setInsights] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [autoApplying, setAutoApplying] = useState(false)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (location.state?.type || location.state?.action) {
      handleAction(location.state.type || location.state.action, location.state)
    }
  }, [location.state])

  // Auto-apply insights when agent mode is enabled
  useEffect(() => {
    if (agentMode && insights.length > 0 && !autoApplying) {
      autoApplyInsights()
    }
  }, [agentMode, insights])

  const fetchAll = async () => {
    try {
      const [prodRes, analyticsRes, insightsRes, agentRes] = await Promise.all([
        axios.get(`${API_BASE}/api/store/products`),
        axios.get(`${API_BASE}/api/data/analytics`),
        axios.get(`${API_BASE}/api/insights`).catch(() => ({ data: { insights: [] } })),
        axios.get(`${API_BASE}/api/agent/status`).catch(() => ({ data: { agent_mode: { enabled: false } } }))
      ])
      
      if (prodRes.data.success) {
        setProducts(prodRes.data.products || [])
        setFlashSale(prodRes.data.flash_sale)
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data)
      }
      if (insightsRes.data.insights) {
        setInsights(insightsRes.data.insights)
      }
      if (agentRes.data.agent_mode) {
        setAgentMode(agentRes.data.agent_mode.enabled)
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAgentMode = async () => {
    try {
      const newMode = !agentMode
      await axios.post(`${API_BASE}/api/agent/mode`, {
        enabled: newMode,
        auto_apply_insights: newMode
      })
      setAgentMode(newMode)
      setLastAction({ 
        success: true, 
        message: `Agent Mode ${newMode ? 'ENABLED - AI will auto-adjust store' : 'DISABLED'}` 
      })
      setTimeout(() => setLastAction(null), 3000)
    } catch (error) {
      console.error('Error toggling agent mode:', error)
    }
  }

  const autoApplyInsights = async () => {
    if (!insights.length || autoApplying) return
    setAutoApplying(true)
    
    // Apply top insight automatically
    const topInsight = insights[0]
    if (topInsight?.action) {
      setLastAction({ success: true, message: `🤖 Agent applying: ${topInsight.title}` })
      await handleAction(topInsight.action.type, topInsight.action.params || {})
    }
    
    setTimeout(() => setAutoApplying(false), 10000) // Cooldown
  }

  const handleAction = async (action, params = {}) => {
    setApplyingAction(action)
    try {
      const res = await axios.post(`${API_BASE}/api/store/update`, {
        action,
        discount: params.discount || 20,
        category: params.category || 'drinks',
        items: params.items,
        amount: params.amount
      })
      
      if (res.data.success) {
        setLastAction({ success: true, message: res.data.message || `✓ ${action.replace('_', ' ')} applied!` })
        await fetchAll()
      }
    } catch (error) {
      setLastAction({ success: false, message: error.message })
    } finally {
      setApplyingAction(null)
      setTimeout(() => setLastAction(null), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Store size={48} style={{ color: 'var(--accent-green)' }} />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with Agent Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Store size={28} /> Store Command Center
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            AI-powered store management with real-time insights
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Agent Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleAgentMode}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: agentMode 
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Bot size={18} />
            Agent Mode: {agentMode ? 'ON' : 'OFF'}
            {agentMode && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}
              />
            )}
          </motion.button>

          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open('/customer', '_blank')}
          >
            <ExternalLink size={16} /> Customer View
          </motion.button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '14px 20px',
              borderRadius: 12,
              background: lastAction.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${lastAction.success ? '#22c55e' : '#ef4444'}`,
              display: 'flex', alignItems: 'center', gap: 10,
              fontWeight: 500
            }}
          >
            {lastAction.success ? <CheckCircle2 size={20} style={{ color: '#22c55e' }} /> : <AlertTriangle size={20} style={{ color: '#ef4444' }} />}
            {lastAction.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insights Showcase - Main Attraction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Recommendations</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {agentMode ? '🤖 Auto-applying changes' : 'Click to apply or enable Agent Mode'}
              </p>
            </div>
          </div>
          
          {analytics && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Revenue</div>
                <div style={{ fontWeight: 700, color: '#22c55e' }}>${analytics.total_revenue?.toFixed(0) || 0}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Orders</div>
                <div style={{ fontWeight: 700 }}>{analytics.total_orders || 0}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Smart Recommendations */}
          {[
            { 
              icon: <Percent size={20} />, title: 'Flash Sale', 
              desc: 'Drive quick traffic with 25% off drinks',
              impact: '+15% orders', confidence: 89,
              action: 'flash_sale', params: { discount: 25, category: 'drinks' },
              color: '#ef4444'
            },
            { 
              icon: <Star size={20} />, title: 'Feature Best Sellers', 
              desc: 'Highlight Espresso & Classic Burger',
              impact: '+12% visibility', confidence: 92,
              action: 'feature', params: { items: [1, 4] },
              color: '#f59e0b'
            },
            { 
              icon: <Gift size={20} />, title: 'Combo Deal', 
              desc: 'Coffee + Pastry bundle at $8.99',
              impact: '+20% avg order', confidence: 85,
              action: 'combo_deal', params: {},
              color: '#8b5cf6'
            },
            { 
              icon: <TrendingUp size={20} />, title: 'Price Optimization', 
              desc: 'Increase food prices 8% (demand high)',
              impact: '+8% margin', confidence: 78,
              action: 'price_increase', params: { amount: 8 },
              color: '#22c55e'
            }
          ].map((rec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => handleAction(rec.action, rec.params)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
                border: `1px solid ${rec.color}40`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {applyingAction === rec.action && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  style={{
                    position: 'absolute', top: 0, left: 0, height: 3,
                    background: rec.color
                  }}
                />
              )}
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${rec.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: rec.color, flexShrink: 0
                }}>
                  {applyingAction === rec.action ? <Loader2 size={20} className="animate-spin" /> : rec.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{rec.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{rec.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem' }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{rec.impact}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{rec.confidence}% confidence</span>
                  </div>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { icon: Percent, label: 'Flash Sale', action: 'flash_sale', color: '#ef4444' },
          { icon: Star, label: 'Feature', action: 'feature', color: '#f59e0b' },
          { icon: TrendingUp, label: 'Price +10%', action: 'price_increase', color: '#22c55e' },
          { icon: Tag, label: 'Price -10%', action: 'price_decrease', color: '#3b82f6' },
          { icon: RefreshCw, label: 'Reset', action: 'end_sale', color: '#6b7280' }
        ].map((btn) => (
          <motion.button
            key={btn.action}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(btn.action)}
            disabled={applyingAction === btn.action}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: `1px solid ${btn.color}40`,
              background: `${btn.color}15`,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.85rem', fontWeight: 500
            }}
          >
            <btn.icon size={16} style={{ color: btn.color }} />
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* Flash Sale Banner */}
      <AnimatePresence>
        {flashSale?.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: 20, borderRadius: 16,
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              textAlign: 'center', fontWeight: 700, fontSize: '1.2rem'
            }}
          >
            🔥 FLASH SALE ACTIVE: {flashSale.discount}% OFF {flashSale.category?.toUpperCase() || 'DRINKS'}! 🔥
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Store Preview */}
      <div style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 20, overflow: 'hidden',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(6,193,103,0.1) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #06C167, #00a655)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem'
            }}>☕</div>
            <div>
              <div style={{ fontWeight: 700 }}>Brew Cafe - Live Preview</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{products.length} products</div>
            </div>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(34,197,94,0.2)', color: '#22c55e',
            fontSize: '0.75rem', fontWeight: 600
          }}>● LIVE</div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12
          }}>
            {products.slice(0, 8).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  position: 'relative'
                }}
              >
                {product.sale && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    background: '#ef4444', color: 'white',
                    padding: '2px 6px', borderRadius: 8,
                    fontSize: '0.6rem', fontWeight: 700
                  }}>-{product.discount}%</div>
                )}
                {product.featured && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: '#f59e0b', color: 'black',
                    padding: '2px 6px', borderRadius: 8,
                    fontSize: '0.55rem', fontWeight: 700
                  }}>⭐</div>
                )}
                <div style={{
                  height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem',
                  background: product.category === 'beverages' ? 'rgba(6,193,103,0.1)' : 'rgba(249,115,22,0.1)'
                }}>
                  {product.image || (product.category === 'beverages' ? '☕' : '🍔')}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: 4 }}>{product.name}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: product.sale ? '#22c55e' : 'inherit' }}>
                    ${product.price.toFixed(2)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
