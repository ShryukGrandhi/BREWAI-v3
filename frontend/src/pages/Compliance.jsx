import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { config } from '../config'
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  FileText,
  Thermometer,
  Droplets,
  ClipboardCheck,
  Download,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Package,
  AlertCircle,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

const API_BASE = config.api.baseUrl

// Compliance Card Component
const ComplianceCard = ({ check }) => {
  const [expanded, setExpanded] = useState(false)
  const Icon = check.icon

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: `${check.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: check.color,
            flexShrink: 0
          }}>
            <Icon size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h4 style={{ margin: 0 }}>{check.category}</h4>
              <span className={`badge badge-${check.status === 'compliant' ? 'success' : 'warning'}`}>
                {check.status === 'compliant' ? 'Compliant' : 'Action Needed'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Last checked: {check.lastChecked}
            </p>
          </div>
          {check.status === 'compliant' ? (
            <CheckCircle2 size={24} style={{ color: 'var(--accent-green)' }} />
          ) : (
            <AlertTriangle size={24} style={{ color: 'var(--accent-yellow)' }} />
          )}
        </div>

        {/* Expanded Details */}
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          style={{ overflow: 'hidden', marginTop: expanded ? 16 : 0 }}
        >
          <div style={{ 
            borderTop: '1px solid var(--border-subtle)', 
            paddingTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12
          }}>
            {check.items.map((item, index) => (
              <div 
                key={index}
                style={{
                  padding: 12,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                  <div style={{ fontWeight: 600 }}>{item.value}</div>
                  {item.target && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Target: {item.target}</div>
                  )}
                </div>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: item.status === 'ok' ? 'rgba(6, 193, 103, 0.2)' :
                              item.status === 'warning' ? 'rgba(251, 191, 36, 0.2)' :
                              'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.status === 'ok' ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
                  ) : item.status === 'warning' ? (
                    <AlertTriangle size={14} style={{ color: 'var(--accent-yellow)' }} />
                  ) : (
                    <Clock size={14} style={{ color: 'var(--accent-blue)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Incident Card Component
const IncidentCard = ({ incident }) => {
  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ 
        borderLeft: `4px solid ${
          incident.severity === 'HIGH' ? 'var(--accent-red)' : 
          incident.severity === 'MEDIUM' ? 'var(--accent-yellow)' : 
          'var(--accent-blue)'
        }`
      }}
    >
      <div className="card-body" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AlertCircle size={16} style={{ color: 'var(--accent-red)' }} />
              <h4 style={{ margin: 0 }}>{incident.crisis_type}</h4>
              <span className={`badge badge-${incident.severity === 'HIGH' ? 'danger' : 'warning'}`}>
                {incident.severity}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Trigger: "{incident.trigger}" • From: {incident.email_sender || 'System'}
            </p>
          </div>
          <span className={`badge badge-${incident.status === 'resolved' ? 'success' : 'warning'}`}>
            {incident.status}
          </span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {incident.automations_executed?.slice(0, 5).map((auto, idx) => (
            <span key={idx} style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {auto.replace(/_/g, ' ')}
            </span>
          ))}
          {incident.automations_executed?.length > 5 && (
            <span style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              +{incident.automations_executed.length - 5} more
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
          {new Date(incident.timestamp).toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}

export default function CompliancePage() {
  const [inventory, setInventory] = useState([])
  const [staff, setStaff] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [complianceChecks, setComplianceChecks] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [complianceData, setComplianceData] = useState({ score: 100, reports: [], incidents: [] })

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    try {
      const [inventoryRes, staffRes, ordersRes, complianceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/data/inventory`),
        axios.get(`${API_BASE}/api/data/staff`),
        axios.get(`${API_BASE}/api/data/orders`),
        axios.get(`${API_BASE}/api/compliance`)
      ])

      if (inventoryRes.data.success) {
        setInventory(inventoryRes.data.data)
      }

      if (staffRes.data.success) {
        setStaff(staffRes.data.data)
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data)
      }

      if (complianceRes.data.success) {
        setComplianceData({
          score: complianceRes.data.score,
          reports: complianceRes.data.reports || [],
          incidents: complianceRes.data.incidents || []
        })
      }

      // Generate compliance checks based on live data
      generateComplianceData(
        inventoryRes.data?.data || [], 
        staffRes.data?.data || [],
        ordersRes.data?.data || [],
        complianceRes.data?.reports || []
      )
    } catch (error) {
      console.error('Error fetching compliance data:', error)
      generateComplianceData([], [], [], [])
    } finally {
      setLoading(false)
    }
  }

  const generateComplianceData = (inventoryData, staffData, orderData, reports) => {
    const lowStockItems = inventoryData.filter(i => i.stock_level <= i.reorder_point)
    const totalStaff = staffData.length
    const activeStaff = staffData.filter(s => s.status === 'active').length

    const checks = [
      {
        id: 1,
        category: 'Temperature Logs',
        icon: Thermometer,
        color: 'var(--accent-blue)',
        status: 'compliant',
        lastChecked: 'Just now',
        items: [
          { name: 'Walk-in Refrigerator', value: '38°F', status: 'ok', target: '35-40°F' },
          { name: 'Walk-in Freezer', value: '-5°F', status: 'ok', target: '-10 to 0°F' },
          { name: 'Prep Station', value: '68°F', status: 'ok', target: '65-75°F' },
          { name: 'Hot Hold Station', value: '145°F', status: 'ok', target: '140°F+' }
        ]
      },
      {
        id: 2,
        category: 'Inventory Compliance',
        icon: Package,
        color: 'var(--accent-green)',
        status: lowStockItems.length > 2 ? 'action-needed' : 'compliant',
        lastChecked: 'Live data',
        items: inventoryData.slice(0, 4).map(item => ({
          name: item.item_name,
          value: `${item.stock_level} ${item.unit}`,
          status: item.stock_level <= item.reorder_point ? 'warning' : 'ok',
          target: `Reorder: ${item.reorder_point} ${item.unit}`
        }))
      },
      {
        id: 3,
        category: 'Sanitation',
        icon: Droplets,
        color: 'var(--accent-purple)',
        status: 'compliant',
        lastChecked: '2 hours ago',
        items: [
          { name: 'Hand washing stations', value: 'Stocked', status: 'ok' },
          { name: 'Sanitizer concentration', value: '200ppm', status: 'ok', target: '150-400ppm' },
          { name: 'Surface cleaning', value: 'Completed', status: 'ok' },
          { name: 'Floor drains', value: 'Clean', status: 'ok' }
        ]
      },
      {
        id: 4,
        category: 'Staff Training',
        icon: ClipboardCheck,
        color: 'var(--accent-orange)',
        status: activeStaff < totalStaff * 0.8 ? 'action-needed' : 'compliant',
        lastChecked: 'Live data',
        items: [
          { name: 'Food handler certifications', value: `${activeStaff}/${totalStaff} active`, status: activeStaff >= totalStaff * 0.8 ? 'ok' : 'warning' },
          { name: 'Allergen awareness', value: 'All trained', status: 'ok' },
          { name: 'Fire safety', value: 'Current', status: 'ok' },
          { name: 'First aid certified', value: `${Math.ceil(totalStaff * 0.4)} staff`, status: 'ok' }
        ]
      }
    ]

    setComplianceChecks(checks)

    // Generate recent logs from reports and orders
    const logs = []
    
    reports.slice(0, 3).forEach((report) => {
      logs.push({
        date: new Date(report.timestamp).toLocaleDateString(),
        type: 'Compliance',
        action: `Score ${report.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(report.change)} - ${report.reason}`,
        user: 'System',
        change: report.change
      })
    })

    orderData.slice(-3).forEach((order) => {
      logs.push({
        date: new Date(order.timestamp).toLocaleDateString(),
        type: 'Order',
        action: `Order #${order.order_id} completed - $${order.total_amount?.toFixed(2)}`,
        user: order.customer_name || 'Customer'
      })
    })

    if (lowStockItems.length > 0) {
      logs.push({
        date: new Date().toLocaleDateString(),
        type: 'Inventory',
        action: `Low stock alert: ${lowStockItems.map(i => i.item_name).join(', ')}`,
        user: 'System'
      })
    }

    setRecentLogs(logs.slice(0, 8))
  }

  // Calculate overall compliance score from backend
  const overallScore = complianceData.score
  const compliantCount = complianceChecks.filter(c => c.status === 'compliant').length
  const totalChecks = complianceChecks.length

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
            <ShieldCheck size={32} style={{ color: 'var(--accent-green)' }} />
            Compliance Center
          </h1>
          <p style={{ fontSize: '1rem' }}>
            Real-time compliance monitoring. Crisis incidents automatically update your score.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            className="btn btn-secondary"
            whileHover={{ scale: 1.02 }}
            onClick={fetchAllData}
          >
            <RefreshCw size={16} />
            Refresh
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            whileHover={{ scale: 1.02 }}
          >
            <Download size={16} />
            Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, ${overallScore >= 80 ? 'rgba(6, 193, 103, 0.1)' : 'rgba(251, 191, 36, 0.1)'} 0%, rgba(59, 130, 246, 0.1) 100%)`,
          border: overallScore >= 80 ? '1px solid var(--accent-green)' : overallScore >= 60 ? '1px solid var(--accent-yellow)' : '1px solid var(--accent-red)'
        }}
      >
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={overallScore >= 80 ? 'var(--accent-green)' : overallScore >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)'}
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 339 }}
                animate={{ strokeDashoffset: 339 - (339 * overallScore / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ strokeDasharray: 339 }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{overallScore}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Score</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 8 }}>
              Compliance Score: {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Needs Attention' : 'Critical'}
            </h3>
            <p style={{ fontSize: '0.9375rem', marginBottom: 16 }}>
              {overallScore >= 80 
                ? 'Your restaurant is meeting compliance standards.' 
                : 'Recent incidents have impacted your compliance score.'}
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>CHECKS PASSING</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>{compliantCount}/{totalChecks}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>INCIDENTS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-red)' }}>{complianceData.incidents.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>LIVE ORDERS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{orders.length}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Incidents */}
      {complianceData.incidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} style={{ color: 'var(--accent-red)' }} />
            Recent Incidents
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complianceData.incidents.slice(0, 5).map((incident, index) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Compliance Checks */}
      <div>
        <h3 style={{ marginBottom: 16 }}>Compliance Checks</h3>
        <div className="grid grid-2">
          {complianceChecks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <ComplianceCard check={check} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Score History */}
      {complianceData.reports.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} />
              Score History
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>DATE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>CHANGE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>REASON</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>NEW SCORE</th>
                </tr>
              </thead>
              <tbody>
                {complianceData.reports.slice(0, 10).map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {new Date(report.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        color: report.change > 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                      }}>
                        {report.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {report.change > 0 ? '+' : ''}{report.change}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{report.reason}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{report.new_score}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}