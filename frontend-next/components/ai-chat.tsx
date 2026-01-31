'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
}

interface AgentAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  requiresApproval: boolean;
}

interface AIChatProps {
  restaurantId: string;
  onActionApproved?: (actionId: string) => void;
  onActionRejected?: (actionId: string) => void;
  className?: string;
}

export function AIChat({ restaurantId, onActionApproved, onActionRejected, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your BREWAI assistant. I can help you with inventory management, pricing optimization, menu analysis, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          restaurantId,
          history: messages.slice(-10)
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        actions: data.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    try {
      await fetch(`/api/agents/actions/${actionId}/approve`, {
        method: 'POST'
      });
      
      setMessages(prev => prev.map(msg => ({
        ...msg,
        actions: msg.actions?.map(action => 
          action.id === actionId 
            ? { ...action, status: 'approved' as const }
            : action
        )
      })));

      onActionApproved?.(actionId);
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const handleRejectAction = async (actionId: string) => {
    try {
      await fetch(`/api/agents/actions/${actionId}/reject`, {
        method: 'POST'
      });
      
      setMessages(prev => prev.map(msg => ({
        ...msg,
        actions: msg.actions?.map(action => 
          action.id === actionId 
            ? { ...action, status: 'rejected' as const }
            : action
        )
      })));

      onActionRejected?.(actionId);
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  };

  const quickActions = [
    'Show inventory alerts',
    'Analyze menu performance',
    'Suggest price optimizations',
    'Generate weekly report'
  ];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-4 right-4 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all',
          className
        )}
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div 
      className={cn(
        'flex flex-col bg-card border rounded-lg shadow-xl transition-all',
        isExpanded 
          ? 'fixed inset-4 z-50' 
          : 'fixed bottom-4 right-4 w-96 h-[600px] z-40',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-foreground/20 rounded">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold">BREWAI Assistant</h3>
            <p className="text-xs opacity-80">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-primary-foreground/20 rounded"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-primary-foreground/20 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            )}>
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              'flex flex-col gap-2 max-w-[80%]',
              message.role === 'user' ? 'items-end' : 'items-start'
            )}>
              <div className={cn(
                'p-3 rounded-lg',
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-muted rounded-bl-none'
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Agent Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="w-full space-y-2">
                  {message.actions.map((action) => (
                    <div 
                      key={action.id}
                      className="p-3 bg-muted/50 border rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">
                            {action.type}
                          </p>
                          <p className="text-sm mt-1">{action.description}</p>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          action.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                          action.status === 'approved' && 'bg-green-100 text-green-800',
                          action.status === 'rejected' && 'bg-red-100 text-red-800',
                          action.status === 'executed' && 'bg-blue-100 text-blue-800'
                        )}>
                          {action.status}
                        </span>
                      </div>

                      {action.requiresApproval && action.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleApproveAction(action.id)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectAction(action.id)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="p-3 bg-muted rounded-lg rounded-bl-none">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => setInput(action)}
                className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
