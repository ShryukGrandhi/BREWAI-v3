'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  BarChart3,
  Bot,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BookOpen,
  MonitorPlay,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SessionTracker } from '@/components/session-tracker';
import { AIChat } from '@/components/ai-chat';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'Sessions', href: '/dashboard/sessions', icon: MonitorPlay },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-muted/30">
      <SessionTracker />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold">BREWAI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="rounded-md bg-primary/10 p-3">
            <p className="text-sm font-medium text-primary">Pro Plan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              AI actions: 847 / 1000 used
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[85%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold">
                {user?.currentRestaurant?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <span className="hidden text-sm font-medium md:block">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-card py-1 shadow-lg">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* AI Chat Assistant */}
      <AIChat restaurantId={user?.currentRestaurant?._id || ''} />
    </div>
  );
}
