'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    name: 'Revenue Today',
    value: '$4,289',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    name: 'Orders Today',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
  },
  {
    name: 'Inventory Value',
    value: '$23,450',
    change: '-3.1%',
    trend: 'down',
    icon: Package,
  },
  {
    name: 'Low Stock Items',
    value: '7',
    change: '+2',
    trend: 'down',
    icon: AlertTriangle,
  },
];

const pendingActions = [
  {
    id: '1',
    type: 'inventory',
    title: 'Auto-order chicken breast',
    description: 'Stock below threshold (15 lbs remaining). Suggested order: 50 lbs from Sysco.',
    confidence: 94,
    impact: 'Medium',
    createdAt: '10 min ago',
  },
  {
    id: '2',
    type: 'menu',
    title: 'Update salmon dish price',
    description: 'Ingredient cost increased 18%. Suggested price: $28.99 (+$3.00)',
    confidence: 87,
    impact: 'High',
    createdAt: '25 min ago',
  },
  {
    id: '3',
    type: 'staffing',
    title: 'Add server for Saturday',
    description: 'Predicted 40% increase in covers. Recommend scheduling additional server.',
    confidence: 91,
    impact: 'Medium',
    createdAt: '1 hour ago',
  },
];

const recentActivity = [
  { action: 'Order placed', item: 'Produce delivery from FreshFarms', time: '2 min ago', status: 'success' },
  { action: 'Menu updated', item: 'Seasonal specials published', time: '15 min ago', status: 'success' },
  { action: 'Alert', item: 'Walk-in cooler temp warning', time: '45 min ago', status: 'warning' },
  { action: 'AI approved', item: 'Bread order auto-confirmed', time: '1 hour ago', status: 'success' },
  { action: 'Staff update', item: 'Maria clocked in', time: '2 hours ago', status: 'info' },
];

export default function DashboardOverview() {
  const [actions, setActions] = useState(pendingActions);

  const handleApprove = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReject = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening at your restaurant today
          </p>
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.name}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span
                className={`flex items-center text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-0.5 h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending AI Actions */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Pending AI Actions</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {actions.length} pending
                </span>
              </div>
              <Link
                href="/dashboard/agents"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y">
              {actions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pending actions. The AI is monitoring your operations.
                </div>
              ) : (
                actions.map((action) => (
                  <div key={action.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{action.title}</h3>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              action.impact === 'High'
                                ? 'bg-red-100 text-red-700'
                                : action.impact === 'Medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {action.impact}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confidence: {action.confidence}%</span>
                          <span>{action.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(action.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-700 transition-colors hover:bg-green-200"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(action.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 transition-colors hover:bg-red-200"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    activity.status === 'success'
                      ? 'bg-green-500'
                      : activity.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.item}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Add Menu Item', href: '/dashboard/menu/new', color: 'bg-blue-500' },
          { label: 'Record Inventory', href: '/dashboard/inventory/count', color: 'bg-green-500' },
          { label: 'View Reports', href: '/dashboard/analytics', color: 'bg-purple-500' },
          { label: 'Send Announcement', href: '/dashboard/team/announce', color: 'bg-orange-500' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className={`h-3 w-3 rounded-full ${action.color}`} />
            <span className="font-medium">{action.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
