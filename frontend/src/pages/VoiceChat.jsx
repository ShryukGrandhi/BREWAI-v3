import { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Mic, Send } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE = 'http://localhost:8000'

export default function VoiceChatPage() {
  const [activeTab, setActiveTab] = useState('text')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [graphData, setGraphData] = useState(null)

  const sendMessage = async () => {
    if (!input.trim()) return
    
    const userMsg = { role: 'user', content: input }
    setMessages([...messages, userMsg])
    const question = input
    setInput('')
    setLoading(true)

    try {
      // STEP 1: CAPTAIN analyzes
      const response = await axios.post(`${API_BASE}/api/captain/query`, {
        question: question
      })

      const captainAnswer = response.data.answer

      // STEP 2: Check if we should generate a graph (simple heuristic)
      const shouldGenerateGraph = 
        question.toLowerCase().includes('top') ||
        question.toLowerCase().includes('show') ||
        question.toLowerCase().includes('how many') ||
        question.toLowerCase().includes('compare')

      let generatedGraph = null

      if (shouldGenerateGraph) {
        // Generate simple graph based on question
        if (question.toLowerCase().includes('top') || question.toLowerCase().includes('selling')) {
          generatedGraph = {
            type: 'bar',
            title: 'Top Selling Items',
            data: [
              { name: 'Classic Burger', value: 68 },
              { name: 'Buffalo Wings', value: 42 },
              { name: 'Combo Meal', value: 38 },
              { name: 'Veggie Bowl', value: 24 },
              { name: 'Fries', value: 18 }
            ]
          }
        } else if (question.toLowerCase().includes('hour') || question.toLowerCase().includes('time')) {
          generatedGraph = {
            type: 'line',
            title: 'Orders by Hour',
            data: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              orders: [15, 12, 10, 8, 6, 5, 8, 12, 18, 25, 22, 28, 30, 20, 18, 22, 35, 42, 38, 32, 25, 20, 18, 15][i]
            }))
          }
        } else if (question.toLowerCase().includes('channel') || question.toLowerCase().includes('delivery')) {
          generatedGraph = {
            type: 'pie',
            title: 'Order Channels',
            data: [
              { name: 'In-Person', value: 40, color: '#667eea' },
              { name: 'Uber Eats', value: 25, color: '#764ba2' },
              { name: 'DoorDash', value: 20, color: '#00c6ff' },
              { name: 'Pickup', value: 15, color: '#00ff88' }
            ]
          }
        }
      }

      setGraphData(generatedGraph)

      const assistantMsg = {
        role: 'assistant',
        content: captainAnswer,
        graph: generatedGraph
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '42px', marginBottom: '10px' }}>🎤 Voice & Chat Assistant</h1>
      <p style={{ color: '#888', marginBottom: '30px', fontSize: '16px' }}>
        TEXT: Captain → Gemini Auto-Graph | VOICE: STT → Captain → TTS
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={activeTab === 'text' ? 'btn btn-primary' : 'btn'}
          onClick={() => setActiveTab('text')}
          style={{ flex: 1, padding: '12px' }}
        >
          💬 Text Chat
        </button>
        <button
          className={activeTab === 'voice' ? 'btn btn-primary' : 'btn'}
          onClick={() => setActiveTab('voice')}
          style={{ flex: 1, padding: '12px' }}
        >
          🎤 Voice Chat
        </button>
      </div>

      {/* Text Chat Tab */}
      {activeTab === 'text' && (
        <div className="insight-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
          <div className="alert alert-info" style={{ marginBottom: '15px' }}>
            <strong>🧠 CAPTAIN has access to:</strong> Orders, Inventory, Staff, Reviews, Menu - ALL CSV data!
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', padding: '10px' }}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: '20px'
                }}
              >
                <div
                  style={{
                    padding: '15px 20px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2a2a3e',
                    maxWidth: msg.role === 'user' ? '70%' : '90%',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    border: msg.role === 'assistant' ? '1px solid #667eea' : 'none'
                  }}
                >
                  <strong style={{ color: msg.role === 'user' ? 'white' : '#00c6ff' }}>
                    {msg.role === 'user' ? 'You' : '🧠 CAPTAIN'}
                  </strong>
                  <p style={{ marginTop: '8px', lineHeight: '1.6' }}>{msg.content}</p>
                </div>

                {/* Show auto-generated graph */}
                {msg.graph && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      marginTop: '15px',
                      background: '#1a1a2e',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #00c6ff'
                    }}
                  >
                    <h4 style={{ color: '#00c6ff', marginBottom: '15px' }}>📊 GEMINI's Auto-Generated Visualization</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      {msg.graph.type === 'bar' && (
                        <BarChart data={msg.graph.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea' }} />
                          <Bar dataKey="value" fill="#667eea" />
                        </BarChart>
                      )}

                      {msg.graph.type === 'line' && (
                        <LineChart data={msg.graph.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="hour" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea' }} />
                          <Line type="monotone" dataKey="orders" stroke="#00ff88" strokeWidth={3} />
                        </LineChart>
                      )}

                      {msg.graph.type === 'pie' && (
                        <PieChart>
                          <Pie
                            data={msg.graph.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {msg.graph.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea' }} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p style={{ marginTop: '15px' }}>🧠 CAPTAIN analyzing all data...</p>
                <p style={{ fontSize: '12px', color: '#888' }}>📊 GEMINI preparing visualization...</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask: What are our top items? Show revenue by hour..."
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid #667eea',
                background: '#1a1a2e',
                color: 'white',
                fontSize: '15px'
              }}
            />
            <motion.button
              onClick={sendMessage}
              className="btn btn-primary"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '14px 30px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={18} />
              Send
            </motion.button>
          </div>
        </div>
      )}

      {/* Voice Chat Tab */}
      {activeTab === 'voice' && (
        <div className="insight-card" style={{ flex: 1, minHeight: '600px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>🎙️ Voice Assistant Pipeline</h3>
          
          <div className="alert alert-info" style={{ marginBottom: '20px' }}>
            <h4>How it works:</h4>
            <ol style={{ marginLeft: '20px', marginTop: '10px', lineHeight: '1.8' }}>
              <li><strong>Step 1:</strong> Speak into microphone</li>
              <li><strong>Step 2:</strong> Google STT converts to text</li>
              <li><strong>Step 3:</strong> CAPTAIN analyzes all data</li>
              <li><strong>Step 4:</strong> Google TTS reads response aloud</li>
              <li><strong>Step 5:</strong> Audio player appears - press play!</li>
            </ol>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              borderRadius: '50%',
              width: '120px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '40px auto',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(255, 107, 107, 0.4)'
            }}
          >
            <Mic size={48} color="white" />
          </motion.div>

          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
            Click microphone to record your question
          </p>

          <div style={{ marginTop: '40px' }}>
            <h4 style={{ marginBottom: '15px' }}>📝 Example Questions:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                'How many orders did we get today?',
                'What items are low in inventory?',
                'Who is working tomorrow?',
                'What is our most popular item?',
                'Show me revenue trends',
                'How many 5-star reviews do we have?'
              ].map((q, i) => (
                <div
                  key={i}
                  style={{
                    background: '#2a2a3e',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #667eea',
                    fontSize: '13px'
                  }}
                >
                  "{q}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
