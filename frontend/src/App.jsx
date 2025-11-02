import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Home, LayoutDashboard, Activity, MessageSquare, FileCheck, Bot } from 'lucide-react'
import HomePage from './pages/Home'
import PlanningPage from './pages/Planning'
import AutomationsPage from './pages/Automations'
import AnalyticsPage from './pages/Analytics'
import VoiceChatPage from './pages/VoiceChat'
import CompliancePage from './pages/Compliance'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>🍺 Brew.AI</h1>
            <p className="subtitle">Autonomous Operations</p>
          </div>
          
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/planning" className="nav-link">
              <LayoutDashboard size={20} />
              <span>Planning</span>
            </Link>
            <Link to="/automations" className="nav-link">
              <Bot size={20} />
              <span>Automations</span>
            </Link>
            <Link to="/analytics" className="nav-link">
              <Activity size={20} />
              <span>Analytics</span>
            </Link>
            <Link to="/voice" className="nav-link">
              <MessageSquare size={20} />
              <span>Voice & Chat</span>
            </Link>
            <Link to="/compliance" className="nav-link">
              <FileCheck size={20} />
              <span>Compliance</span>
            </Link>
          </div>
          
          <div className="sidebar-footer">
            <p>CAPTAIN • GEMINI • NIVARA</p>
            <p>BROWSER-USE • MORPH • GMAIL</p>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/voice" element={<VoiceChatPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
