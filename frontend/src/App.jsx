import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  LayoutDashboard, 
  Zap, 
  BarChart3, 
  MessageCircle, 
  ShieldCheck, 
  Store,
  Search,
  Bell,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import HomePage from './pages/Home'
import PlanningPage from './pages/Planning'
import AutomationsPage from './pages/Automations'
import AnalyticsPage from './pages/Analytics'
import VoiceChatPage from './pages/VoiceChat'
import CompliancePage from './pages/Compliance'
import StorePage from './pages/Store'
import CustomerPage from './pages/Customer'
import './App.css'

// Animated Logo SVG Component
const BrewLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06C167" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
    </defs>
    <motion.circle 
      cx="20" cy="20" r="18" 
      stroke="url(#brewGradient)" 
      strokeWidth="2" 
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
    <motion.path 
      d="M12 16C12 14 14 12 20 12C26 12 28 14 28 16V24C28 26 26 28 20 28C14 28 12 26 12 24V16Z" 
      fill="url(#brewGradient)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
    />
    <motion.path 
      d="M15 18H25M15 22H25" 
      stroke="black" 
      strokeWidth="2" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    />
    <motion.circle
      cx="20" cy="8" r="2"
      fill="url(#brewGradient)"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: [0, 1, 0] }}
      transition={{ delay: 1, duration: 1, repeat: Infinity, repeatDelay: 2 }}
    />
  </svg>
)

// Navigation items
const navItems = [
  { path: '/', icon: Home, label: 'Dashboard', badge: null },
  { path: '/planning', icon: LayoutDashboard, label: 'Planning', badge: null },
  { path: '/automations', icon: Zap, label: 'Automations', badge: '3' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
  { path: '/voice', icon: MessageCircle, label: 'Brew Chat', badge: 'AI' },
  { path: '/compliance', icon: ShieldCheck, label: 'Compliance', badge: null },
  { path: '/store', icon: Store, label: 'My Store', badge: 'New' },
]

function Sidebar() {
  const location = useLocation()
  
  return (
    <motion.nav 
      className="sidebar"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <BrewLogo />
          <h1>Brew.AI</h1>
        </div>
        <p className="sidebar-subtitle">Autonomous Operations</p>
      </div>
      
      {/* Navigation */}
      <div className="nav-section">
        <div className="nav-group">
          <span className="nav-group-title">Main Menu</span>
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink 
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-link-badge">{item.badge}</span>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Profile */}
      <div className="sidebar-footer">
        <motion.div 
          className="sidebar-profile"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="profile-avatar">CE</div>
          <div className="profile-info">
            <div className="profile-name">Charcoal Eats</div>
            <div className="profile-role">Restaurant Owner</div>
          </div>
          <Settings size={16} style={{ color: 'var(--text-tertiary)' }} />
        </motion.div>
      </div>
    </motion.nav>
  )
}

function Header() {
  const location = useLocation()
  
  const getPageTitle = () => {
    const titles = {
      '/': 'Dashboard',
      '/planning': 'Planning',
      '/automations': 'Automations',
      '/analytics': 'Analytics',
      '/voice': 'Brew Chat',
      '/compliance': 'Compliance',
      '/store': 'My Store'
    }
    return titles[location.pathname] || 'Dashboard'
  }
  
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="breadcrumb">
          <span>Brew.AI</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{getPageTitle()}</span>
        </div>
      </div>
      
      <div className="header-search">
        <Search size={16} />
        <input 
          type="text" 
          placeholder="Search anything... ⌘K" 
        />
      </div>
      
      <div className="header-right">
        <motion.button 
          className="header-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles size={18} />
        </motion.button>
        <motion.button 
          className="header-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={18} />
          <span className="header-btn-badge">5</span>
        </motion.button>
      </div>
    </header>
  )
}

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        style={{ height: '100%' }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/voice" element={<VoiceChatPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/store" element={<StorePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer view - no sidebar/header */}
        <Route path="/customer" element={<CustomerPage />} />
        
        {/* Admin views - with sidebar/header */}
        <Route path="/*" element={
          <div className="app">
            <Sidebar />
            <main className="main-content">
              <Header />
              <div className="page-content">
                <AnimatedRoutes />
              </div>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App