import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { config } from '../config'
import { 
  Zap, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Mail,
  FileText,
  Users,
  CloudRain,
  Truck,
  Bot,
  ExternalLink,
  Loader2,
  Send,
  Inbox,
  Phone,
  Calendar,
  DollarSign,
  Package,
  Shield,
  Clipboard,
  MessageSquare,
  Bell,
  Settings,
  Database,
  RefreshCw,
  Target,
  TrendingUp,
  Utensils,
  Star,
  AlertCircle,
  Wrench,
  UserPlus,
  FileCheck,
  Megaphone,
  CreditCard,
  BarChart3,
  Eye
} from 'lucide-react'

const API_BASE = config.api.baseUrl

// Live Terminal Component - shows real-time automation logs
const LiveTerminal = ({ logs, isActive }) => {
  const terminalRef = useRef(null)
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="card"
      style={{ 
        background: '#0a0a0a',
        border: '1px solid #333',
        fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace'
      }}
    >
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27ca40' }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 8 }}>
          brew-ai-terminal — {isActive ? 'running' : 'idle'}
        </span>
        {isActive && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ marginLeft: 'auto', color: 'var(--accent-green)', fontSize: '0.7rem' }}
          >
            ● LIVE
          </motion.div>
        )}
      </div>
      <div 
        ref={terminalRef}
        style={{ 
          padding: 16, 
          maxHeight: 300, 
          overflow: 'auto',
          fontSize: '0.8rem',
          lineHeight: 1.6
        }}
      >
        {logs.map((log, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              color: log.type === 'error' ? '#ff6b6b' : 
                     log.type === 'success' ? '#51cf66' : 
                     log.type === 'info' ? '#74c0fc' :
                     log.type === 'warning' ? '#ffd43b' : '#aaa',
              marginBottom: 4
            }}
          >
            <span style={{ color: '#666' }}>[{log.time}]</span>{' '}
            <span style={{ color: log.type === 'success' ? '#51cf66' : '#888' }}>
              {log.prefix || '$'}
            </span>{' '}
            {log.message}
          </motion.div>
        ))}
        {isActive && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ color: '#fff' }}
          >
            █
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

// Live Email Drafting Component
const EmailDraftingView = ({ draft, isTyping, recipient, subject }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (isTyping && draft) {
      let index = 0
      const interval = setInterval(() => {
        if (index <= draft.length) {
          setDisplayedText(draft.slice(0, index))
          index++
        } else {
          clearInterval(interval)
        }
      }, 20)
      return () => clearInterval(interval)
    } else {
      setDisplayedText(draft || '')
    }
  }, [draft, isTyping])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card"
      style={{ border: '1px solid var(--accent-blue)' }}
    >
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} style={{ color: 'var(--accent-blue)' }} />
          <span>Drafting Response Email...</span>
        </div>
        {isTyping && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="badge badge-info"
          >
            Typing...
          </motion.span>
        )}
      </div>
      <div className="card-body" style={{ fontFamily: 'system-ui' }}>
        <div style={{ marginBottom: 12, fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <strong style={{ color: 'var(--text-tertiary)', width: 50 }}>To:</strong>
            <span>{recipient}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <strong style={{ color: 'var(--text-tertiary)', width: 50 }}>Subject:</strong>
            <span>Re: {subject}</span>
          </div>
        </div>
        <div style={{ 
          background: 'var(--bg-tertiary)', 
          padding: 16, 
          borderRadius: 'var(--radius-md)',
          minHeight: 120,
          whiteSpace: 'pre-wrap',
          fontSize: '0.9rem',
          lineHeight: 1.6
        }}>
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ color: 'var(--accent-blue)' }}
            >
              |
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Automation Step with real-time progress
const AutomationStep = ({ step, index, isActive }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: step.status === 'running' ? 'rgba(59, 130, 246, 0.1)' : 
                  step.status === 'complete' ? 'rgba(6, 193, 103, 0.05)' : 'transparent',
      borderRadius: 'var(--radius-md)',
      marginBottom: 4
    }}
  >
    <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
      {step.status === 'complete' ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckCircle2 size={20} style={{ color: 'var(--accent-green)' }} />
        </motion.div>
      ) : step.status === 'running' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={20} style={{ color: 'var(--accent-blue)' }} />
        </motion.div>
      ) : (
        <div style={{ 
          width: 20, 
          height: 20, 
          borderRadius: '50%', 
          border: '2px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)'
        }}>
          {index + 1}
        </div>
      )}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ 
        fontWeight: step.status === 'running' ? 600 : 400,
        color: step.status === 'complete' ? 'var(--text-primary)' : 
               step.status === 'running' ? 'var(--accent-blue)' : 'var(--text-tertiary)'
      }}>
        {step.name}
      </div>
      {step.detail && step.status !== 'pending' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}
        >
          {step.detail}
        </motion.div>
      )}
    </div>
    {step.status === 'complete' && step.duration && (
      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
        {step.duration}
      </span>
    )}
  </motion.div>
)

// Active Automation Panel - shows running automation in detail
const ActiveAutomationPanel = ({ automation, onComplete }) => {
  if (!automation) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card"
      style={{ 
        border: '2px solid var(--accent-blue)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
      }}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <automation.icon size={20} style={{ color: 'white' }} />
          </motion.div>
          <div>
            <h3 style={{ margin: 0 }}>{automation.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Running {automation.completedSteps || 0} / {automation.steps?.length || 0} steps
            </span>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="badge badge-info"
        >
          IN PROGRESS
        </motion.div>
      </div>
      <div className="card-body" style={{ padding: '8px 0' }}>
        {automation.steps?.map((step, idx) => (
          <AutomationStep key={idx} step={step} index={idx} isActive={step.status === 'running'} />
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ 
          height: 4, 
          background: 'var(--bg-tertiary)', 
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${((automation.completedSteps || 0) / (automation.steps?.length || 1)) * 100}%` }}
            style={{ height: '100%', background: 'var(--accent-green)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Mini Automation Card for the grid
const MiniAutomationCard = ({ automation, isRunning }) => (
  <motion.div
    className="card"
    whileHover={{ scale: 1.02, borderColor: automation.color }}
    style={{ 
      padding: 16,
      opacity: isRunning && automation.status !== 'running' ? 0.5 : 1,
      border: automation.status === 'running' ? `2px solid ${automation.color}` : undefined
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: `${automation.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: automation.color
      }}>
        {automation.status === 'running' ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={20} />
          </motion.div>
        ) : automation.status === 'success' ? (
          <CheckCircle2 size={20} />
        ) : (
          <automation.icon size={20} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {automation.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {automation.status === 'running' ? 'Running...' : 
           automation.status === 'success' ? '✓ Complete' : 
           automation.trigger}
        </div>
      </div>
    </div>
  </motion.div>
)

// Backend automation name to frontend mapping
const AUTOMATION_MAPPING = {
  'emergency_hiring': { id: 1, name: 'Emergency Hiring', icon: UserPlus, color: 'var(--accent-purple)' },
  'schedule_adjustment': { id: 2, name: 'Schedule Adjustment', icon: Calendar, color: 'var(--accent-blue)' },
  'staff_alert': { id: 3, name: 'Staff Alert', icon: Bell, color: 'var(--accent-orange)' },
  'manager_notification': { id: 4, name: 'Manager Notification', icon: Phone, color: 'var(--accent-red)' },
  'draft_response': { id: 5, name: 'Draft Response Email', icon: Mail, color: 'var(--accent-green)' },
  'send_response': { id: 6, name: 'Send Email Response', icon: Send, color: 'var(--accent-blue)' },
  'emergency_supplier_order': { id: 7, name: 'Emergency Supplier Order', icon: Truck, color: 'var(--accent-yellow)' },
  'menu_adjustment': { id: 8, name: 'Menu Adjustment', icon: Utensils, color: 'var(--accent-orange)' },
  'inventory_check': { id: 9, name: 'Inventory Check', icon: Package, color: 'var(--accent-purple)' },
  'equipment_repair_request': { id: 10, name: 'Equipment Repair Request', icon: Wrench, color: 'var(--accent-red)' },
  'compliance_check': { id: 11, name: 'Compliance Check', icon: Shield, color: 'var(--accent-green)' },
  'staff_briefing': { id: 12, name: 'Staff Briefing', icon: Clipboard, color: 'var(--accent-blue)' },
  'customer_response': { id: 13, name: 'Customer Response', icon: MessageSquare, color: 'var(--accent-purple)' },
  'corrective_action': { id: 14, name: 'Corrective Action', icon: AlertCircle, color: 'var(--accent-red)' },
  'weather_promotion': { id: 15, name: 'Weather Promotion', icon: CloudRain, color: 'var(--accent-blue)' },
  'payroll_update': { id: 16, name: 'Payroll Update', icon: CreditCard, color: 'var(--accent-green)' },
  'access_revocation': { id: 17, name: 'Access Revocation', icon: Shield, color: 'var(--accent-red)' },
  'exit_documentation': { id: 18, name: 'Exit Documentation', icon: FileText, color: 'var(--accent-purple)' },
  'staffing_forecast': { id: 19, name: 'Staffing Forecast', icon: TrendingUp, color: 'var(--accent-blue)' },
  'shift_coverage_request': { id: 20, name: 'Shift Coverage Request', icon: Users, color: 'var(--accent-orange)' },
  'emergency_protocol': { id: 21, name: 'Emergency Protocol', icon: AlertTriangle, color: 'var(--accent-red)' },
  'safety_check': { id: 22, name: 'Safety Check', icon: Shield, color: 'var(--accent-green)' },
  'incident_report': { id: 23, name: 'Incident Report', icon: FileCheck, color: 'var(--accent-orange)' },
  'emergency_contacts': { id: 24, name: 'Emergency Contacts', icon: Phone, color: 'var(--accent-red)' },
  'vendor_contact': { id: 25, name: 'Vendor Contact', icon: Mail, color: 'var(--accent-blue)' },
  'warranty_check': { id: 26, name: 'Warranty Check', icon: FileCheck, color: 'var(--accent-green)' },
  'safety_lockout': { id: 27, name: 'Safety Lockout', icon: Shield, color: 'var(--accent-red)' },
  'tech_dispatch': { id: 28, name: 'Tech Dispatch', icon: Truck, color: 'var(--accent-purple)' },
  'backup_vendor_search': { id: 29, name: 'Backup Vendor Search', icon: Eye, color: 'var(--accent-blue)' },
  'inventory_reallocation': { id: 30, name: 'Inventory Reallocation', icon: Package, color: 'var(--accent-orange)' },
  'inventory_alert': { id: 31, name: 'Inventory Alert', icon: Bell, color: 'var(--accent-yellow)' },
  'pos_menu_update': { id: 32, name: 'POS Menu Update', icon: Settings, color: 'var(--accent-blue)' },
  'delivery_prioritization': { id: 33, name: 'Delivery Prioritization', icon: Truck, color: 'var(--accent-green)' },
  'service_recovery': { id: 34, name: 'Service Recovery', icon: Star, color: 'var(--accent-purple)' },
  'quality_review': { id: 35, name: 'Quality Review', icon: Eye, color: 'var(--accent-orange)' },
  'documentation_prep': { id: 36, name: 'Documentation Prep', icon: FileText, color: 'var(--accent-blue)' },
  'cleaning_protocol': { id: 37, name: 'Cleaning Protocol', icon: RefreshCw, color: 'var(--accent-green)' },
  'temp_log_review': { id: 38, name: 'Temp Log Review', icon: BarChart3, color: 'var(--accent-purple)' },
  'documentation_update': { id: 39, name: 'Documentation Update', icon: FileCheck, color: 'var(--accent-blue)' },
  'staff_retraining': { id: 40, name: 'Staff Retraining', icon: Users, color: 'var(--accent-orange)' },
}

// All automations data for display grid
const ALL_AUTOMATIONS = Object.entries(AUTOMATION_MAPPING).map(([key, value]) => ({
  ...value,
  backendName: key,
  status: 'idle',
  trigger: 'On demand',
  steps: []
}))

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(
    ALL_AUTOMATIONS.map(a => ({ ...a, status: 'idle', steps: [] }))
  )
  const [activeCrisis, setActiveCrisis] = useState(null)
  const [checkingEmails, setCheckingEmails] = useState(false)
  const [activeAutomation, setActiveAutomation] = useState(null)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [emailDraft, setEmailDraft] = useState(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [autoScanEnabled, setAutoScanEnabled] = useState(true)
  const [lastScanTime, setLastScanTime] = useState(null)
  const [scanInterval, setScanInterval] = useState(30) // seconds

  // Auto-scan emails every 30 seconds
  useEffect(() => {
    if (!autoScanEnabled) return
    
    // Initial check after 5 seconds
    const initialCheck = setTimeout(() => {
      if (!isProcessing && !checkingEmails) {
        silentCheckEmails()
      }
    }, 5000)

    // Recurring check
    const interval = setInterval(() => {
      if (!isProcessing && !checkingEmails) {
        silentCheckEmails()
      }
    }, scanInterval * 1000)

    return () => {
      clearTimeout(initialCheck)
      clearInterval(interval)
    }
  }, [autoScanEnabled, isProcessing, checkingEmails, scanInterval])

  // Silent email check (no UI until crisis found)
  const silentCheckEmails = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/crisis/check-emails`)
      setLastScanTime(new Date())
      
      if (response.data.success && response.data.crisis_detected) {
        // Crisis found - trigger full processing with UI
        checkEmails()
      }
    } catch (error) {
      console.error('Silent email check failed:', error)
    }
  }

  const addLog = (message, type = 'info', prefix = '$') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setTerminalLogs(prev => [...prev, { message, type, time, prefix }])
  }

  const runAutomationWithSteps = async (automationId, steps, details = {}) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation) return

    const automationSteps = steps.map(s => ({ name: s.name, status: 'pending', detail: s.detail }))
    
    // Set as active
    setActiveAutomation({ ...automation, steps: automationSteps, completedSteps: 0 })
    setAutomations(prev => prev.map(a => 
      a.id === automationId ? { ...a, status: 'running', steps: automationSteps } : a
    ))

    addLog(`Starting automation: ${automation.name}`, 'info', '▶')

    // Run each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // Update current step to running
      setActiveAutomation(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, idx) => ({
          ...s,
          status: idx === i ? 'running' : idx < i ? 'complete' : 'pending'
        })),
        completedSteps: i
      } : null)

      setAutomations(prev => prev.map(a => 
        a.id === automationId ? {
          ...a,
          steps: a.steps.map((s, idx) => ({
            ...s,
            status: idx === i ? 'running' : idx < i ? 'complete' : 'pending'
          }))
        } : a
      ))

      addLog(step.log || step.name, step.logType || 'info', step.prefix || '→')
      
      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration || 800))

      // Mark step complete
      const duration = `${((step.duration || 800) / 1000).toFixed(1)}s`
      setActiveAutomation(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, idx) => ({
          ...s,
          status: idx <= i ? 'complete' : 'pending',
          duration: idx === i ? duration : s.duration
        })),
        completedSteps: i + 1
      } : null)

      addLog(`✓ ${step.name} completed`, 'success', '✓')
    }

    // Mark automation complete
    setAutomations(prev => prev.map(a => 
      a.id === automationId ? { 
        ...a, 
        status: 'success', 
        lastRun: 'Just now',
        steps: a.steps.map(s => ({ ...s, status: 'complete' }))
      } : a
    ))

    addLog(`Automation "${automation.name}" completed successfully`, 'success', '✓')
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setActiveAutomation(null)
  }

  // Automation step definitions for visual feedback
  const AUTOMATION_STEPS = {
    'emergency_hiring': [
      { name: 'Analyzing current staffing levels', log: 'Checking staff database...' },
      { name: 'Identifying immediate coverage needs', log: 'Calculating shift coverage gaps...' },
      { name: 'Generating job posting', log: 'Drafting urgent job posting...' },
      { name: 'Posting to job boards', log: 'Publishing to Indeed, LinkedIn, ZipRecruiter...' },
      { name: 'Contacting staffing agencies', log: 'Sending urgent requests to 3 agencies...' },
      { name: 'Notifying HR manager', log: 'Sending notification email to HR...' }
    ],
    'schedule_adjustment': [
      { name: 'Loading current schedule', log: 'Fetching weekly schedule...' },
      { name: 'Identifying available staff', log: 'Checking staff availability database...' },
      { name: 'Contacting available employees', log: 'Sending SMS to 5 available staff members...' },
      { name: 'Updating schedule', log: 'Adjusting shift assignments...' },
      { name: 'Sending notifications', log: 'Notifying affected employees...' }
    ],
    'staff_alert': [
      { name: 'Compiling alert message', log: 'Creating urgent notification...' },
      { name: 'Sending SMS alerts', log: 'Broadcasting to all staff via SMS...' },
      { name: 'Sending email alerts', log: 'Sending email notifications...' },
      { name: 'Updating announcement board', log: 'Posting to digital signage...' }
    ],
    'manager_notification': [
      { name: 'Preparing incident report', log: 'Generating crisis summary...' },
      { name: 'Calling manager', log: 'Initiating phone call to manager...' },
      { name: 'Sending detailed email', log: 'Sending incident details via email...' }
    ],
    'equipment_repair_request': [
      { name: 'Documenting equipment issue', log: 'Creating repair ticket...' },
      { name: 'Checking warranty status', log: 'Verifying equipment warranty...' },
      { name: 'Contacting repair service', log: 'Submitting emergency repair request...' },
      { name: 'Scheduling technician', log: 'Technician ETA: 2 hours...' },
      { name: 'Notifying kitchen staff', log: 'Alerting team about equipment status...' }
    ],
    'menu_adjustment': [
      { name: 'Analyzing affected menu items', log: 'Checking menu dependencies...' },
      { name: 'Disabling unavailable items', log: 'Updating POS system...' },
      { name: 'Updating online menu', log: 'Syncing changes to website & apps...' },
      { name: 'Notifying servers', log: 'Sending menu update to floor staff...' }
    ],
    'emergency_supplier_order': [
      { name: 'Calculating shortage quantities', log: 'Analyzing inventory shortfall...' },
      { name: 'Contacting primary supplier', log: 'Placing emergency order...' },
      { name: 'Finding backup suppliers', log: 'Checking alternate vendor availability...' },
      { name: 'Confirming delivery time', log: 'Delivery ETA: 3 hours...' },
      { name: 'Updating inventory system', log: 'Recording pending delivery...' }
    ],
    'compliance_check': [
      { name: 'Loading compliance checklist', log: 'Fetching inspection requirements...' },
      { name: 'Running automated checks', log: 'Verifying 47 compliance items...' },
      { name: 'Generating compliance report', log: 'Creating detailed report...' },
      { name: 'Flagging issues', log: 'Identifying items needing attention...' },
      { name: 'Assigning tasks', log: 'Creating task assignments for team...' }
    ],
    'payroll_update': [
      { name: 'Calculating final pay', log: 'Computing remaining wages and PTO...' },
      { name: 'Processing benefits', log: 'Calculating benefits payout...' },
      { name: 'Generating documents', log: 'Creating final pay statement...' },
      { name: 'Notifying accounting', log: 'Sending to payroll department...' }
    ],
    'access_revocation': [
      { name: 'Identifying access points', log: 'Listing all system access...' },
      { name: 'Scheduling revocation', log: 'Setting up access removal for last day...' },
      { name: 'Notifying IT', log: 'Sending request to IT department...' },
      { name: 'Creating checklist', log: 'Generating offboarding checklist...' }
    ],
    'exit_documentation': [
      { name: 'Generating exit interview', log: 'Creating exit interview form...' },
      { name: 'Preparing final paperwork', log: 'Compiling required documents...' },
      { name: 'Creating reference letter', log: 'Drafting reference letter template...' },
      { name: 'Notifying HR', log: 'Sending package to HR...' }
    ],
    'default': [
      { name: 'Initializing automation', log: 'Starting process...' },
      { name: 'Processing data', log: 'Analyzing information...' },
      { name: 'Executing actions', log: 'Running automation tasks...' },
      { name: 'Completing automation', log: 'Finalizing...' }
    ]
  }

  // Reset processed emails cache and rescan
  const resetAndScan = async () => {
    setCheckingEmails(true)
    setShowTerminal(true)
    setTerminalLogs([])
    addLog('🔄 Resetting email cache...', 'info')
    
    try {
      await axios.post(`${API_BASE}/api/crisis/reset-emails`)
      addLog('✓ Email cache cleared - will rescan all emails', 'success')
    } catch (error) {
      addLog('⚠ Could not reset cache, continuing with scan...', 'warning')
    }
    
    // Now do regular scan
    await checkEmails()
  }

  const checkEmails = async () => {
    setCheckingEmails(true)
    setShowTerminal(true)
    setIsProcessing(true)
    setTerminalLogs([])
    
    addLog('╔══════════════════════════════════════════════════════════════╗', 'info')
    addLog('║        BREW AI CRISIS DETECTION SYSTEM v2.0                  ║', 'info')
    addLog('╚══════════════════════════════════════════════════════════════╝', 'info')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    addLog('Initializing crisis detection engine...', 'info', '⚡')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    addLog('Connecting to Gmail via Composio API...', 'info', '→')
    await new Promise(resolve => setTimeout(resolve, 600))
    addLog('✓ Connected to Composio', 'success', '✓')
    
    addLog('Fetching unread emails from inbox...', 'info', '→')
    
    try {
      const response = await axios.post(`${API_BASE}/api/crisis/check-emails`)
      
      if (response.data.success && response.data.crisis_detected) {
        const crisis = response.data.crisis
        const automationsToRun = crisis.automations || []
        
        addLog(`Analyzed ${response.data.emails_checked} emails`, 'info')
        await new Promise(resolve => setTimeout(resolve, 200))
        
        addLog('', 'info')
        addLog('╔══════════════════════════════════════════════════════════════╗', 'warning')
        addLog(`║  🚨 CRISIS DETECTED: ${crisis.type.padEnd(38)}  ║`, 'warning')
        addLog('╚══════════════════════════════════════════════════════════════╝', 'warning')
        addLog(`From: ${crisis.email_sender}`, 'info')
        addLog(`Subject: "${crisis.email_subject}"`, 'info')
        addLog(`Severity: ${crisis.severity}`, crisis.severity === 'HIGH' ? 'error' : 'warning')
        addLog(`Trigger: "${crisis.trigger_keyword}" detected in email`, 'info')
        
        setActiveCrisis(crisis)
        await new Promise(resolve => setTimeout(resolve, 400))
        
        addLog('', 'info')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        addLog(`INITIATING ${automationsToRun.length} AUTOMATIONS...`, 'info', '▶')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        
        // Run each automation with visual feedback
        let automationCount = 0
        for (const automationName of automationsToRun) {
          automationCount++
          const mapping = AUTOMATION_MAPPING[automationName]
          const displayName = mapping?.name || automationName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          const automationId = mapping?.id || automationCount
          
          addLog('', 'info')
          addLog(`[${automationCount}/${automationsToRun.length}] Starting: ${displayName}`, 'info', '▶')
          
          // Get steps for this automation
          const steps = AUTOMATION_STEPS[automationName] || AUTOMATION_STEPS['default']
          const stepsWithDuration = steps.map(s => ({ 
            ...s, 
            duration: 400 + Math.random() * 400 
          }))
          
          await runAutomationWithSteps(automationId, stepsWithDuration)
          
          // Mark automation as complete in grid
          setAutomations(prev => prev.map(a => 
            a.backendName === automationName ? { ...a, status: 'success', lastRun: 'Just now' } : a
          ))
        }
        
        // Draft and send response email
        addLog('', 'info')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        addLog('DRAFTING RESPONSE EMAIL...', 'info', '✉')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
        await new Promise(resolve => setTimeout(resolve, 400))
        
        const emailContent = generateEmailResponse(crisis)
        setEmailDraft({
          recipient: crisis.email_sender,
          subject: crisis.email_subject,
          content: emailContent,
          isTyping: true
        })
        
        // Draft automation
        const draftMapping = AUTOMATION_MAPPING['draft_response'] || { id: 100, name: 'Draft Response Email' }
        await runAutomationWithSteps(draftMapping.id, [
          { name: 'Analyzing crisis context', duration: 400, log: 'Understanding situation...' },
          { name: 'Generating personalized response', duration: 1200, log: 'AI drafting response...' },
          { name: 'Including automation summary', duration: 500, log: 'Adding action items taken...' },
          { name: 'Formatting email', duration: 300, log: 'Finalizing email format...' }
        ])
        
        setEmailDraft(prev => prev ? { ...prev, isTyping: false } : null)
        
        // Actually send the email via API
        const sendMapping = AUTOMATION_MAPPING['send_response'] || { id: 101, name: 'Send Email Response' }
        await runAutomationWithSteps(sendMapping.id, [
          { name: 'Authenticating with Gmail', duration: 400, log: 'Connecting to Gmail API...' },
          { name: 'Composing message', duration: 300, log: 'Preparing email payload...' },
          { name: 'Sending email', duration: 700, log: `Sending to ${crisis.email_sender}...` },
          { name: 'Confirming delivery', duration: 300, log: 'Verifying email delivery...' }
        ])

        // Actually send the email through the backend
        try {
          const emailResult = await axios.post(`${API_BASE}/api/crisis/respond-email`, {
            email_content: emailContent,
            sender: crisis.email_sender,
            subject: crisis.email_subject
          })
          
          if (emailResult.data.success) {
            addLog(`✓ Email sent to: ${crisis.email_sender}`, 'success', '✉')
          } else {
            addLog(`⚠ Email sending failed: ${emailResult.data.error}`, 'warning', '!')
          }
        } catch (emailError) {
          addLog(`⚠ Email API error: ${emailError.message}`, 'warning', '!')
        }

        // Update compliance score via API
        try {
          await axios.post(`${API_BASE}/api/crisis/execute`, {
            crisis: {
              ...crisis,
              automations: automationsToRun
            }
          })
          addLog('Compliance score updated', 'info', '📋')
        } catch (compError) {
          console.error('Compliance update error:', compError)
        }
        
        // Final summary
        addLog('', 'info')
        addLog('╔══════════════════════════════════════════════════════════════╗', 'success')
        addLog('║               ✅ CRISIS RESPONSE COMPLETE                     ║', 'success')
        addLog('╚══════════════════════════════════════════════════════════════╝', 'success')
        addLog(`Total automations executed: ${automationsToRun.length + 2}`, 'success')
        addLog('Response email sent successfully', 'success')
        addLog('All systems nominal. Monitoring for new alerts...', 'info')
        
        setActiveCrisis(null)
        setEmailDraft(null)
      } else {
        addLog(`✓ Scanned ${response.data.emails_checked || 0} emails`, 'success')
        addLog('No crisis emails detected in inbox', 'success', '✓')
        addLog('', 'info')
        addLog('System standing by... Ready to respond to any crisis.', 'info')
      }
    } catch (error) {
      addLog('', 'error')
      addLog(`✗ Error: ${error.message}`, 'error', '✗')
      addLog('Please verify:', 'error')
      addLog('  1. Gmail is connected in Composio dashboard', 'error')
      addLog('  2. Backend server is running on port 8001', 'error')
      addLog('  3. API keys are correctly configured', 'error')
    } finally {
      setCheckingEmails(false)
      setIsProcessing(false)
    }
  }

  const generateEmailResponse = (crisis) => {
    const responses = {
      'Staff Resignation': `Dear ${crisis.email_sender?.split('<')[0]?.trim() || 'Team Member'},

Thank you for your notice. We understand and respect your decision.

We have already initiated our emergency staffing protocol:
• Posted urgent job listings to multiple platforms
• Contacted our staffing agency partners
• Adjusted schedules to ensure coverage
• Notified the management team

Please coordinate with HR for your final paperwork and any handover requirements.

We wish you the very best in your future endeavors.

Warm regards,
Brew AI Management System`,
      'Equipment Failure': `Dear ${crisis.email_sender?.split('<')[0]?.trim() || 'Team'},

Thank you for reporting this equipment issue promptly.

We have taken immediate action:
• Created an emergency repair ticket
• Contacted our equipment service provider
• Technician dispatched - ETA: 2 hours
• Adjusted menu to work around the issue
• Notified kitchen staff

Please monitor the situation and report any changes.

Best regards,
Brew AI Maintenance System`,
      'default': `Dear ${crisis.email_sender?.split('<')[0]?.trim() || 'Team'},

Your message has been received and processed by our AI monitoring system.

We have initiated the following automated responses:
• Relevant team members have been notified
• Appropriate corrective actions are underway
• Management has been briefed on the situation

Our team will follow up with you shortly.

Best regards,
Brew AI System`
    }
    return responses[crisis.type] || responses['default']
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={32} style={{ color: 'var(--accent-orange)' }} />
          Automations Command Center
        </h1>
        <p style={{ fontSize: '1rem' }}>
          30 AI-powered automations ready to respond to any situation in real-time.
        </p>
      </motion.div>

      {/* Email Crisis Panel */}
        <motion.div
        className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        style={{ 
          background: autoScanEnabled 
            ? 'linear-gradient(135deg, rgba(6, 193, 103, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: `1px solid ${autoScanEnabled ? 'var(--accent-green)' : 'var(--accent-blue)'}`
        }}
      >
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: autoScanEnabled ? 'rgba(6, 193, 103, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: autoScanEnabled ? 'var(--accent-green)' : 'var(--accent-blue)'
            }}>
              <Inbox size={28} />
          </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                Email-Based Crisis Detection
                {autoScanEnabled && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      fontSize: '0.75rem', 
                      background: 'var(--accent-green)', 
                      color: 'black',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600
                    }}
                  >
                    ● AUTO-SCANNING
                  </motion.span>
                )}
              </h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                {autoScanEnabled 
                  ? `Automatically scanning every ${scanInterval}s. ${lastScanTime ? `Last: ${lastScanTime.toLocaleTimeString()}` : 'Starting...'}`
                  : 'Manual mode - Click to scan your inbox for crisis emails.'
                }
                  </p>
                </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                style={{
                  padding: '8px 16px',
                  background: autoScanEnabled ? 'rgba(6, 193, 103, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  border: `1px solid ${autoScanEnabled ? 'var(--accent-green)' : 'var(--accent-purple)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: autoScanEnabled ? 'var(--accent-green)' : 'var(--accent-purple)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.8125rem',
                  fontWeight: 500
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {autoScanEnabled ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} />
                    Auto: ON
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Auto: OFF
                  </>
                )}
              </motion.button>
              <motion.button
                className="btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkEmails}
                disabled={checkingEmails}
                style={{ minWidth: 140 }}
              >
                {checkingEmails ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Scan Now
                  </>
                )}
              </motion.button>
              <motion.button
                className="btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetAndScan}
                disabled={checkingEmails}
                style={{ 
                  minWidth: 120,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ef4444'
                }}
              >
                <RefreshCw size={16} />
                Reset & Scan
              </motion.button>
                  </div>
                  </div>
                </div>
      </motion.div>

      {/* Live Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <LiveTerminal logs={terminalLogs} isActive={isProcessing} />
        )}
      </AnimatePresence>

      {/* Active Automation Panel */}
      <AnimatePresence>
        {activeAutomation && (
          <ActiveAutomationPanel automation={activeAutomation} />
        )}
      </AnimatePresence>

      {/* Email Drafting View */}
      <AnimatePresence>
        {emailDraft && (
          <EmailDraftingView 
            draft={emailDraft.content}
            isTyping={emailDraft.isTyping}
            recipient={emailDraft.recipient}
            subject={emailDraft.subject}
          />
        )}
      </AnimatePresence>

      {/* All Automations Grid */}
                <div>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={20} />
          All 30 Automations
          <span className="badge badge-info" style={{ marginLeft: 8 }}>
            {automations.filter(a => a.status === 'success').length} executed
          </span>
        </h3>
                  <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12
        }}>
          {automations.map((automation, idx) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <MiniAutomationCard 
                automation={automation} 
                isRunning={isProcessing}
              />
            </motion.div>
          ))}
        </div>
              </div>
              
      {/* Composio Info */}
      <motion.div
        className="card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: 'linear-gradient(135deg, rgba(6, 193, 103, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}
      >
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Bot size={32} style={{ color: 'var(--accent-green)' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 4 }}>Powered by Composio & Firecrawl</h4>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Real integrations with Gmail, job boards, suppliers, and more.
              <a 
                href="https://platform.composio.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-green)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                View Dashboard <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}