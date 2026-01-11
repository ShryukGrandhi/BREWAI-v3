import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { config } from '../config'
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  CloudSun,
  TrendingUp,
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react'

const API_BASE = config.api.baseUrl

// Day Card Component
const DayCard = ({ day, isSelected, onClick }) => (
  <motion.div
    onClick={onClick}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    style={{
      padding: 20,
      background: isSelected 
        ? 'linear-gradient(135deg, var(--accent-green), #34D399)' 
        : day.highlight 
          ? 'linear-gradient(135deg, rgba(6, 193, 103, 0.1), rgba(59, 130, 246, 0.1))'
          : 'var(--bg-card)',
      border: `1px solid ${isSelected ? 'var(--accent-green)' : day.highlight ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)',
      cursor: 'pointer',
      transition: 'all var(--transition-base)',
      textAlign: 'center'
    }}
  >
    <div style={{ 
      fontSize: '0.75rem', 
      color: isSelected ? 'rgba(0,0,0,0.6)' : 'var(--text-tertiary)',
      marginBottom: 4 
    }}>
      {day.day}
    </div>
    <div style={{ 
      fontSize: '1.5rem', 
      fontWeight: 700,
      color: isSelected ? 'black' : 'var(--text-primary)',
      marginBottom: 8
    }}>
      {day.date}
    </div>
    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{day.weather}</div>
    <div style={{ 
      fontSize: '0.875rem', 
      color: isSelected ? 'rgba(0,0,0,0.8)' : 'var(--text-secondary)',
      marginBottom: 4
    }}>
      {day.orders} orders
    </div>
    <div style={{ 
      fontSize: '1rem', 
      fontWeight: 600,
      color: isSelected ? 'black' : 'var(--accent-green)'
    }}>
      ${day.revenue.toLocaleString()}
    </div>
    <div style={{
      marginTop: 8,
      padding: '4px 8px',
      background: isSelected ? 'rgba(0,0,0,0.1)' : 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.75rem',
      color: isSelected ? 'black' : 'var(--text-secondary)'
    }}>
      <Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
      {day.staffNeeded} staff
    </div>
  </motion.div>
)

// Prep Item Component
const PrepItem = ({ item }) => {
  const statusColors = {
    ready: 'var(--accent-green)',
    'in-progress': 'var(--accent-yellow)',
    pending: 'var(--text-tertiary)'
  }
  
  const priorityColors = {
    high: 'var(--accent-red)',
    medium: 'var(--accent-yellow)',
    low: 'var(--text-tertiary)'
  }

  return (
    <motion.div
      whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: priorityColors[item.priority]
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{item.item_name || item.item}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          {item.stock_level || item.quantity} {item.unit}
        </div>
      </div>
      <span style={{
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: `${statusColors[item.status]}20`,
        color: statusColors[item.status],
        textTransform: 'capitalize'
      }}>
        {item.status}
      </span>
    </motion.div>
  )
}

// Staff Card Component
const StaffCard = ({ staff }) => (
  <motion.div
    whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-subtle)'
    }}
  >
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'black',
      fontWeight: 700,
      fontSize: '0.875rem'
    }}>
      {staff.name.split(' ').map(n => n[0]).join('')}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500 }}>{staff.name}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{staff.role}</div>
    </div>
    <span style={{
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: staff.shift === 'morning' ? 'rgba(251, 191, 36, 0.15)' : 
                  staff.shift === 'afternoon' ? 'rgba(139, 92, 246, 0.15)' :
                  staff.shift === 'evening' ? 'rgba(59, 130, 246, 0.15)' :
                  'rgba(6, 193, 103, 0.15)',
      color: staff.shift === 'morning' ? 'var(--accent-yellow)' : 
             staff.shift === 'afternoon' ? 'var(--accent-purple)' :
             staff.shift === 'evening' ? 'var(--accent-blue)' :
             'var(--accent-green)',
      textTransform: 'capitalize'
    }}>
      {staff.shift}
    </span>
    <span style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: staff.status === 'active' ? 'var(--accent-green)' : 'var(--text-tertiary)'
    }} />
  </motion.div>
)

export default function PlanningPage() {
  const [selectedDay, setSelectedDay] = useState(4) // Friday
  const [staff, setStaff] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [weeklyForecast, setWeeklyForecast] = useState([])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    try {
      const [staffRes, inventoryRes, ordersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/data/staff`),
        axios.get(`${API_BASE}/api/data/inventory`),
        axios.get(`${API_BASE}/api/data/orders`)
      ])

      if (staffRes.data.success) {
        setStaff(staffRes.data.data)
      }

      if (inventoryRes.data.success) {
        setInventory(inventoryRes.data.data)
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data)
        generateForecast(ordersRes.data.data, staffRes.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching planning data:', error)
      // Generate default forecast
      generateForecast([], [])
    } finally {
      setLoading(false)
    }
  }

  const generateForecast = (orderData, staffData) => {
    const today = new Date()
    const weatherEmojis = ['☀️', '⛅', '🌧️', '☀️', '⛅', '☀️', '☀️']
    const temps = [72, 68, 65, 70, 75, 78, 76]
    
    // Calculate average order value from real orders
    const avgOrderValue = orderData.length > 0 
      ? orderData.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orderData.length 
      : 24.50

    const forecast = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Base prediction on day of week and random variation
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6
      const baseOrders = isWeekend ? 200 : 140
      const variation = Math.floor(Math.random() * 50) - 25
      const predictedOrders = baseOrders + variation + (orderData.length * 2)
      
      forecast.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate().toString(),
        orders: predictedOrders,
        revenue: Math.round(predictedOrders * avgOrderValue),
        weather: weatherEmojis[i],
        temp: temps[i],
        staffNeeded: Math.max(4, Math.ceil(predictedOrders / 35)),
        highlight: isWeekend
      })
    }
    
    setWeeklyForecast(forecast)
  }

  // Calculate prep list from inventory
  const prepList = inventory.map(item => ({
    ...item,
    priority: item.stock_level <= item.reorder_point ? 'high' : 
              item.stock_level <= item.reorder_point * 1.5 ? 'medium' : 'low',
    status: item.stock_level <= item.reorder_point ? 'pending' : 
            item.stock_level <= item.reorder_point * 1.5 ? 'in-progress' : 'ready'
  }))

  const selectedDayData = weeklyForecast[selectedDay] || {
    day: 'Fri',
    date: '17',
    orders: 234,
    revenue: 5733,
    weather: '⛅',
    temp: 70,
    staffNeeded: 7
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <h1 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <LayoutDashboard size={32} style={{ color: 'var(--accent-purple)' }} />
            Weekly Planning
          </h1>
          <p style={{ fontSize: '1rem' }}>
            AI-powered forecasting based on live order data and trends.
          </p>
        </div>
        <motion.button
          className="btn btn-secondary btn-sm"
          whileHover={{ scale: 1.02 }}
          onClick={fetchAllData}
        >
          <RefreshCw size={16} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Week Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Calendar size={20} style={{ color: 'var(--text-tertiary)' }} />
          <h3>Weekly Forecast</h3>
          {orders.length > 0 && (
            <span className="badge badge-success">Based on {orders.length} orders</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
          {weeklyForecast.map((day, index) => (
            <DayCard
              key={day.day}
              day={day}
              isSelected={selectedDay === index}
              onClick={() => setSelectedDay(index)}
            />
          ))}
        </div>
      </motion.div>

      {/* Selected Day Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-2"
          style={{ gap: 24 }}
        >
          {/* Day Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={18} />
                {selectedDayData.day}, {selectedDayData.date} Forecast
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>EXPECTED ORDERS</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{selectedDayData.orders}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>PROJECTED REVENUE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>${selectedDayData.revenue.toLocaleString()}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>WEATHER</div>
                  <div style={{ fontSize: '1.5rem' }}>{selectedDayData.weather} {selectedDayData.temp}°F</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>STAFF NEEDED</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{selectedDayData.staffNeeded}</div>
                </div>
              </div>

              {/* Peak Hours */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>PEAK HOURS</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['12-1 PM', '6-7 PM', '7-8 PM'].map((time) => (
                    <span key={time} style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--accent-red)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      🔥 {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory / Prep List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <ChefHat size={18} />
                Inventory Status
              </h3>
              <span className="badge badge-success">{prepList.length} items</span>
            </div>
            <div className="card-body" style={{ padding: 0, maxHeight: 350, overflow: 'auto' }}>
              {prepList.map((item) => (
                <PrepItem key={item.item_name} item={item} />
              ))}
            </div>
            <div className="card-footer">
              <motion.button
                className="btn btn-primary btn-sm"
                whileHover={{ scale: 1.02 }}
                style={{ width: '100%' }}
              >
                Generate Prep List
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Staff Schedule */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Users size={18} />
            Staff Schedule
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-success">{staff.filter(s => s.status === 'active').length} Active</span>
            <motion.button
              className="btn btn-secondary btn-sm"
              whileHover={{ scale: 1.02 }}
            >
              <Plus size={14} />
              Add Shift
            </motion.button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {staff.length > 0 ? staff.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <StaffCard staff={member} />
            </motion.div>
          )) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No staff data available
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}