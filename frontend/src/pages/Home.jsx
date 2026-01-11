import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  Sparkles,
  Send
} from 'lucide-react'
import axios from 'axios'
import { config } from '../config'

const API_BASE = config.api.baseUrl

// Animated stat card component
const StatCard = ({ icon: Icon, label, value, delta, deltaType, color, delay }) => (
  <motion.div 
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.4 }}
    whileHover={{ y: -4 }}
  >
    <div className={`stat-icon ${color}`}>
      <Icon size={24} />
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {delta && (
      <span className={`stat-delta ${deltaType}`}>
        {deltaType === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {delta}
      </span>
    )}
  </motion.div>
)

// Quick action card
const QuickAction = ({ icon: Icon, title, description, onClick, color }) => (
  <motion.div 
    className="card"
    style={{ cursor: 'pointer' }}
    onClick={onClick}
    whileHover={{ scale: 1.02, borderColor: 'var(--accent-green)' }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
      <div className={`stat-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ marginBottom: 'var(--space-xs)' }}>{title}</h4>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>{description}</p>
      </div>
      <ArrowUpRight size={20} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  </motion.div>
)

// Activity item
const ActivityItem = ({ icon: Icon, title, time, status }) => (
  <motion.div 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--space-md)',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-md)',
      transition: 'background var(--transition-fast)'
    }}
    whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
  >
    <div style={{ 
      width: 40, 
      height: 40, 
      borderRadius: 'var(--radius-md)',
      background: status === 'success' ? 'rgba(6, 193, 103, 0.15)' : 
                  status === 'warning' ? 'rgba(251, 191, 36, 0.15)' : 
                  'rgba(59, 130, 246, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: status === 'success' ? 'var(--accent-green)' : 
             status === 'warning' ? 'var(--accent-yellow)' : 
             'var(--accent-blue)'
    }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{title}</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{time}</div>
    </div>
    {status === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />}
    {status === 'warning' && <AlertTriangle size={18} style={{ color: 'var(--accent-yellow)' }} />}
  </motion.div>
)

// AI Insight Card
const AIInsightCard = ({ insight, onSendToStore }) => (
  <motion.div 
    className="card"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{ 
      background: 'linear-gradient(135deg, rgba(6, 193, 103, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
      border: '1px solid rgba(6, 193, 103, 0.3)'
    }}
  >
    <div className="card-body">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={20} style={{ color: 'black' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Brew AI Insight</div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>{insight.text}</p>
        </div>
      </div>
      {insight.actionable && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm">Dismiss</button>
          <motion.button 
            className="btn btn-primary btn-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSendToStore}
          >
            <Send size={14} />
            Send to Store
          </motion.button>
        </div>
      )}
    </div>
  </motion.div>
)

export default function HomePage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activities, setActivities] = useState([])
  const [aiInsight, setAiInsight] = useState(null)

  useEffect(() => {
    fetchAnalytics()
    fetchActivities()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/api/data/analytics`)
      if (response.data.success) {
        setAnalytics(response.data)
        generateInsight(response.data)
      }
    } catch (err) {
      setError('Failed to fetch analytics - make sure backend is running')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const ordersResponse = await axios.get(`${API_BASE}/api/data/orders`)
      if (ordersResponse.data.success) {
        const recentOrders = ordersResponse.data.data.slice(-5).reverse()
        const orderActivities = recentOrders.map((order, idx) => ({
          icon: ShoppingCart,
          title: `Order #${order.order_id || idx + 1} - $${order.total_amount?.toFixed(2) || '0.00'}`,
          time: order.timestamp || 'Just now',
          status: 'success'
        }))
        
        const inventoryResponse = await axios.get(`${API_BASE}/api/data/inventory`)
        if (inventoryResponse.data.success) {
          const lowStock = inventoryResponse.data.data.filter(
            item => item.stock_level < item.reorder_point
          )
          if (lowStock.length > 0) {
            orderActivities.push({
              icon: AlertTriangle,
              title: `Low stock: ${lowStock.map(i => i.item_name).join(', ')}`,
              time: 'Attention needed',
              status: 'warning'
            })
          }
        }
        
        setActivities(orderActivities)
      }
    } catch (err) {
      console.error('Activities fetch error:', err)
    }
  }

  const generateInsight = (data) => {
    const orders = data.orders || 0
    
    let insightText = ''
    let actionable = false
    
    if (orders > 300) {
      insightText = `Great performance today! With ${orders} orders and ${data.revenue} in revenue, you're having a strong day. Consider running a flash sale on slower-moving items to maximize profits.`
      actionable = true
    } else if (orders > 100) {
      insightText = `Solid day so far with ${orders} orders. Based on current trends, promoting your top sellers could help push revenue higher.`
      actionable = true
    } else {
      insightText = `Today shows ${orders} orders so far. Consider a promotional offer to drive more traffic.`
      actionable = true
    }
    
    setAiInsight({ text: insightText, actionable })
  }

  const handleSendToStore = () => {
    navigate('/store', { state: { action: 'flash_sale', discount: 20, category: 'drinks' } })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={48} style={{ color: 'var(--accent-green)' }} />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <AlertTriangle size={48} style={{ color: 'var(--accent-yellow)', marginBottom: 'var(--space-md)' }} />
        <h3>{error}</h3>
        <p>Please make sure the backend server is running on {API_BASE}</p>
        <button className="btn btn-primary" onClick={fetchAnalytics}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 'var(--space-md)' }}
      >
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Charcoal Eats 👋
        </h1>
        <p style={{ fontSize: '1.125rem' }}>
          Here's what's happening with your restaurant today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-4">
        <StatCard 
          icon={DollarSign}
          label="Today's Revenue"
          value={analytics?.revenue || '$0'}
          delta="+12.5%"
          deltaType="positive"
          color="green"
          delay={0}
        />
        <StatCard 
          icon={ShoppingCart}
          label="Total Orders"
          value={analytics?.orders || 0}
          delta="+8.2%"
          deltaType="positive"
          color="blue"
          delay={1}
        />
        <StatCard 
          icon={TrendingUp}
          label="Profit Margin"
          value={analytics?.profit_margin || '0%'}
          delta="+2.1%"
          deltaType="positive"
          color="purple"
          delay={2}
        />
        <StatCard 
          icon={Users}
          label="Active Staff"
          value={analytics?.active_staff || 0}
          delta="Optimal"
          deltaType="positive"
          color="orange"
          delay={3}
        />
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <AIInsightCard insight={aiInsight} onSendToStore={handleSendToStore} />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-2">
        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-sm)' }}>Quick Actions</h3>
          <QuickAction 
            icon={Zap}
            title="Check for Crisis Emails"
            description="Scan emails for employee emergencies & issues"
            onClick={() => navigate('/automations')}
            color="orange"
          />
          <QuickAction 
            icon={Utensils}
            title="Update Menu Pricing"
            description="Adjust prices based on AI recommendations"
            onClick={() => navigate('/store')}
            color="green"
          />
          <QuickAction 
            icon={Users}
            title="Optimize Staffing"
            description="AI-powered shift scheduling"
            onClick={() => navigate('/planning')}
            color="blue"
          />
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} />
              Recent Activity
            </h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-sm)' }}>
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ActivityItem {...activity} />
                </motion.div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading activities...</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders Ticker */}
      <motion.div 
        className="card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-lg)',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'linear-gradient(90deg, var(--bg-tertiary), transparent)'
        }}>
          <div className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>
            LIVE
          </div>
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-xl)',
            overflow: 'hidden',
            flex: 1
          }}>
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex', gap: 'var(--space-xl)', whiteSpace: 'nowrap' }}
            >
              {activities.filter(a => a.status === 'success').map((activity, idx) => (
                <span key={idx} style={{ color: 'var(--text-secondary)' }}>
                  {activity.title} — <span style={{ color: 'var(--accent-green)' }}>✓</span>
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}