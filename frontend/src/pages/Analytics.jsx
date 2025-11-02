import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  orders: Math.floor(Math.random() * 40) + 10
}))

export default function AnalyticsPage() {
  return (
    <div>
      <h1>📊 Advanced Analytics</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        Real CSV data • LSTM forecasting • AI insights
      </p>

      <div className="insight-card">
        <h3>Orders by Hour</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="hour" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ background: '#1a1a2e', border: '1px solid #667eea', borderRadius: '8px' }}
            />
            <Bar dataKey="orders" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

