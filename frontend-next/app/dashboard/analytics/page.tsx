'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const timeRanges = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];

const kpis = [
  {
    name: 'Total Revenue',
    value: '$45,231',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    description: 'vs last period',
  },
  {
    name: 'Orders',
    value: '1,247',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    description: 'vs last period',
  },
  {
    name: 'Avg Order Value',
    value: '$36.27',
    change: '+4.1%',
    trend: 'up',
    icon: TrendingUp,
    description: 'vs last period',
  },
  {
    name: 'Avg Wait Time',
    value: '18 min',
    change: '-2.3%',
    trend: 'up',
    icon: Clock,
    description: 'vs last period',
  },
];

const topItems = [
  { name: 'Grilled Salmon', orders: 245, revenue: '$7,105', trend: 12 },
  { name: 'Caesar Salad', orders: 198, revenue: '$2,572', trend: 8 },
  { name: 'Ribeye Steak', orders: 156, revenue: '$6,706', trend: -3 },
  { name: 'Chocolate Lava Cake', orders: 134, revenue: '$1,339', trend: 15 },
  { name: 'Craft Cocktails', orders: 289, revenue: '$4,332', trend: 22 },
];

const hourlyData = [
  { hour: '10AM', orders: 12, revenue: 456 },
  { hour: '11AM', orders: 28, revenue: 1024 },
  { hour: '12PM', orders: 65, revenue: 2340 },
  { hour: '1PM', orders: 78, revenue: 2808 },
  { hour: '2PM', orders: 45, revenue: 1620 },
  { hour: '3PM', orders: 23, revenue: 828 },
  { hour: '4PM', orders: 18, revenue: 648 },
  { hour: '5PM', orders: 34, revenue: 1224 },
  { hour: '6PM', orders: 67, revenue: 2412 },
  { hour: '7PM', orders: 89, revenue: 3204 },
  { hour: '8PM', orders: 95, revenue: 3420 },
  { hour: '9PM', orders: 72, revenue: 2592 },
];

const maxOrders = Math.max(...hourlyData.map((d) => d.orders));

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('This Week');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Track performance metrics and gain insights
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{kpi.name}</span>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpi.value}</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              {kpi.trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {kpi.change}
              </span>
              <span className="text-sm text-muted-foreground">{kpi.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Orders Chart */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Orders by Hour</h3>
          <p className="text-sm text-muted-foreground">Order volume throughout the day</p>
          
          <div className="mt-6">
            <div className="flex items-end gap-2 h-48">
              {hourlyData.map((data) => (
                <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${(data.orders / maxOrders) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.hour}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Peak Hour: </span>
              <span className="font-medium">8PM (95 orders)</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">626 orders</span>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Top Selling Items</h3>
          <p className="text-sm text-muted-foreground">By order count this period</p>

          <div className="mt-4 space-y-4">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.revenue}</p>
                  <p
                    className={`flex items-center justify-end text-xs ${
                      item.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.trend > 0 ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {Math.abs(item.trend)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Metrics */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Customer Metrics</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">New Customers</p>
              <p className="mt-1 text-xl font-bold">234</p>
              <p className="text-xs text-green-600">+18% vs last period</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Returning Customers</p>
              <p className="mt-1 text-xl font-bold">412</p>
              <p className="text-xs text-green-600">+5% vs last period</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Avg Reviews</p>
              <p className="mt-1 text-xl font-bold">4.7</p>
              <p className="text-xs text-muted-foreground">Based on 156 reviews</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Table Turnover</p>
              <p className="mt-1 text-xl font-bold">2.8x</p>
              <p className="text-xs text-green-600">+0.3 vs last period</p>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Cost Analysis</h3>
          <div className="mt-4 space-y-4">
            {[
              { name: 'Food Cost', percentage: 28, target: 30, status: 'good' },
              { name: 'Labor Cost', percentage: 32, target: 30, status: 'warning' },
              { name: 'Overhead', percentage: 15, target: 18, status: 'good' },
              { name: 'Gross Margin', percentage: 25, target: 22, status: 'good' },
            ].map((cost) => (
              <div key={cost.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{cost.name}</span>
                  <span className="font-medium">{cost.percentage}%</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        cost.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${cost.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Target: {cost.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
