'use client';

import { useState } from 'react';
import {
  Bot,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Shield,
  Settings,
} from 'lucide-react';

type ActionStatus = 'pending' | 'approved' | 'rejected' | 'auto-executed';

interface AgentAction {
  id: string;
  agentType: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  status: ActionStatus;
  createdAt: string;
  executedAt?: string;
  executedBy?: string;
}

const agentActions: AgentAction[] = [
  {
    id: '1',
    agentType: 'inventory',
    title: 'Auto-order chicken breast',
    description: 'Stock is at 15 lbs, below the reorder point of 20 lbs. Recommended order: 50 lbs from Sysco.',
    reasoning: 'Based on historical usage (avg 8 lbs/day) and current stock levels, we will run out in approximately 2 days. Ordering now ensures delivery before stockout.',
    confidence: 94,
    impact: 'medium',
    status: 'pending',
    createdAt: '2024-01-30T10:30:00Z',
  },
  {
    id: '2',
    agentType: 'pricing',
    title: 'Update salmon dish price',
    description: 'Ingredient cost increased 18%. Suggested new price: $28.99 (+$3.00)',
    reasoning: 'Atlantic salmon cost increased from $10.99/lb to $12.99/lb. To maintain target 60% margin, price should increase from $25.99 to $28.99.',
    confidence: 87,
    impact: 'high',
    status: 'pending',
    createdAt: '2024-01-30T09:15:00Z',
  },
  {
    id: '3',
    agentType: 'scheduling',
    title: 'Add server for Saturday evening',
    description: 'Predicted 40% increase in covers. Recommend scheduling additional server 5PM-10PM.',
    reasoning: 'Historical data shows 40% higher traffic on last Saturday of month. Current staffing of 4 servers may result in longer wait times.',
    confidence: 91,
    impact: 'medium',
    status: 'pending',
    createdAt: '2024-01-30T08:00:00Z',
  },
  {
    id: '4',
    agentType: 'inventory',
    title: 'Bread order confirmed',
    description: '24 baguettes ordered from Artisan Bakery for morning delivery.',
    reasoning: 'Daily bread order based on par level and next-day reservation count. Auto-approved per policy settings.',
    confidence: 98,
    impact: 'low',
    status: 'auto-executed',
    createdAt: '2024-01-30T06:00:00Z',
    executedAt: '2024-01-30T06:00:05Z',
  },
  {
    id: '5',
    agentType: 'menu',
    title: 'Disable mushroom risotto',
    description: 'Arborio rice critically low. Recommend temporarily disabling menu item.',
    reasoning: 'Current stock (2 lbs) only sufficient for ~4 portions. Reorder not arriving until Thursday. Preventing customer disappointment.',
    confidence: 96,
    impact: 'medium',
    status: 'approved',
    createdAt: '2024-01-29T14:30:00Z',
    executedAt: '2024-01-29T14:35:00Z',
    executedBy: 'Manager Sarah',
  },
];

const agentStats = [
  { label: 'Actions Today', value: '12', icon: Activity },
  { label: 'Auto-executed', value: '8', icon: Zap },
  { label: 'Pending Approval', value: '3', icon: Clock },
  { label: 'Accuracy Rate', value: '96%', icon: Shield },
];

export default function AgentsPage() {
  const [actions, setActions] = useState(agentActions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ActionStatus>('all');

  const handleApprove = (id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'approved', executedAt: new Date().toISOString(), executedBy: 'You' }
          : a
      )
    );
  };

  const handleReject = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    );
  };

  const filteredActions = filter === 'all' ? actions : actions.filter((a) => a.status === filter);

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'auto-executed':
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agent Actions</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve AI-recommended actions for your restaurant
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
          <Settings className="h-4 w-4" />
          Agent Settings
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {agentStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All Actions' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'auto-executed', label: 'Auto-executed' },
          { value: 'rejected', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <div key={action.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{action.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getImpactColor(action.impact)}`}>
                        {action.impact} impact
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize">{action.agentType} Agent</span>
                      <span>Confidence: {action.confidence}%</span>
                      <span>{new Date(action.createdAt).toLocaleString()}</span>
                      {action.executedBy && <span>by {action.executedBy}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(action.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-destructive hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-muted"
                  >
                    {expandedId === action.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {expandedId === action.id && (
              <div className="border-t bg-muted/30 p-4">
                <h4 className="text-sm font-medium">AI Reasoning</h4>
                <p className="mt-2 text-sm text-muted-foreground">{action.reasoning}</p>
                
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(action.createdAt).toLocaleString()}</p>
                  </div>
                  {action.executedAt && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Executed</p>
                      <p className="text-sm">{new Date(action.executedAt).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Confidence Score</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${action.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{action.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredActions.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No actions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI agents are monitoring your operations. Actions will appear here when recommendations are made.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
