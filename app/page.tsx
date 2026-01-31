'use client';

import Link from 'next/link';
import { ArrowRight, Bot, ChefHat, BarChart3, Package, Zap, Users, Check, Play, Sparkles, TrendingUp, Shield, Globe } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Gradient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
              <ChefHat className="h-5 w-5 text-zinc-950" />
            </div>
            <span className="text-xl font-bold tracking-tight">BREWAI</span>
          </Link>
          
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              How it works
            </Link>
            <Link href="#pricing" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">AI-Powered Restaurant Intelligence</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight leading-tight sm:text-6xl lg:text-7xl">
              Run smarter restaurants with{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                AI agents
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400">
              Automate inventory, optimize menus, and coordinate your team with intelligent agents that understand your business. Built for restaurants ready to scale.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 text-base font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25 sm:w-auto"
              >
                Start free trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-8 text-base font-semibold transition-all hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                  <Play className="h-4 w-4 text-emerald-400" fill="currentColor" />
                </div>
                Watch demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>500+ Restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>$2M+ Saved Monthly</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-24 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: '32%', label: 'Food waste reduction', highlight: true },
              { value: '4.2x', label: 'Faster inventory counts', highlight: false },
              { value: '$48K', label: 'Saved per location/year', highlight: false },
              { value: '89%', label: 'Staff satisfaction', highlight: false },
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
                  stat.highlight 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
              >
                <span className="block text-4xl font-bold tracking-tight text-zinc-100 md:text-5xl">
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm text-zinc-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
            {/* Browser Chrome */}
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-zinc-800 px-4 py-1.5">
                <span className="text-xs text-zinc-500">app.brewai.com/dashboard</span>
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="flex">
              {/* Sidebar */}
              <div className="hidden w-64 border-r border-zinc-800 bg-zinc-950/50 p-4 lg:block">
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600" />
                  <div>
                    <div className="h-4 w-24 rounded bg-zinc-800" />
                    <div className="mt-1.5 h-3 w-16 rounded bg-zinc-800/50" />
                  </div>
                </div>
                <nav className="space-y-1">
                  {['Overview', 'Menu', 'Inventory', 'Analytics', 'AI Agents', 'Team'].map((item, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                        i === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-lg ${i === 0 ? 'bg-emerald-500/20' : 'bg-zinc-800'}`} />
                      {item}
                    </div>
                  ))}
                </nav>
              </div>
              
              {/* Main Area */}
              <div className="flex-1 p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="h-6 w-40 rounded-lg bg-zinc-800" />
                    <div className="mt-2 h-4 w-32 rounded bg-zinc-800/50" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                    <div className="h-10 w-28 rounded-xl bg-emerald-500/20" />
                  </div>
                </div>
                
                {/* Stat Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { label: 'Revenue', value: '$24,892', trend: '+12%', up: true },
                    { label: 'Orders', value: '1,284', trend: '+8%', up: true },
                    { label: 'Inventory', value: '94%', trend: '-2%', up: false },
                    { label: 'Staff', value: '18', trend: '+3', up: true },
                  ].map((card, i) => (
                    <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <span className="text-xs text-zinc-500">{card.label}</span>
                      <div className="mt-1 flex items-end justify-between">
                        <span className="text-2xl font-bold text-zinc-100">{card.value}</span>
                        <span className={`text-xs font-medium ${card.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {card.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Charts */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">Revenue Overview</span>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded-lg bg-zinc-800" />
                        <div className="h-6 w-16 rounded-lg bg-zinc-800" />
                      </div>
                    </div>
                    <div className="flex h-48 items-end gap-2 pt-4">
                      {[35, 55, 45, 70, 60, 80, 75, 95, 85, 70, 90, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <span className="text-sm font-medium text-zinc-400">AI Agent Activity</span>
                    <div className="mt-4 space-y-3">
                      {[
                        { action: 'Reorder: Tomatoes', status: 'Pending approval', color: 'amber' },
                        { action: 'Price update: Pasta', status: 'Approved', color: 'emerald' },
                        { action: 'Schedule: Weekend', status: 'Processing', color: 'blue' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            item.color === 'amber' ? 'bg-amber-400' : 
                            item.color === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex-1">
                            <div className="text-sm text-zinc-300">{item.action}</div>
                            <div className="text-xs text-zinc-600">{item.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to run{' '}
              <span className="text-emerald-400">smarter</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Powerful AI features designed specifically for restaurant operations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bot,
                title: 'AI Agents',
                description: 'Autonomous agents handle inventory reordering, menu pricing, and staff scheduling with human-in-the-loop approval.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Live dashboards with sales metrics, inventory levels, and operational KPIs across all your locations.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: ChefHat,
                title: 'Menu Intelligence',
                description: 'AI-driven menu optimization based on ingredient costs, demand patterns, and profit margins.',
                gradient: 'from-orange-500 to-amber-500',
              },
              {
                icon: Package,
                title: 'Smart Inventory',
                description: 'Predictive inventory management that reduces waste and ensures you never run out.',
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                icon: Zap,
                title: 'Instant Integrations',
                description: 'Connect with your POS, suppliers, and delivery platforms in minutes.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: Users,
                title: 'Team Coordination',
                description: 'Announcements, task assignments, and shift management with role-based access.',
                gradient: 'from-indigo-500 to-blue-500',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                onMouseEnter={() => setIsHovered(i)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-br ${feature.gradient}`} style={{ opacity: isHovered === i ? 0.05 : 0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Get started in <span className="text-emerald-400">minutes</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Three simple steps to transform your restaurant operations
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute top-16 left-0 right-0 hidden h-0.5 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 md:block" />
            
            {[
              {
                step: '01',
                title: 'Connect your systems',
                description: 'Integrate your POS, inventory management, and supplier systems with our one-click connectors.',
              },
              {
                step: '02',
                title: 'Configure AI agents',
                description: 'Set up autonomous agents for inventory, pricing, and scheduling with your approval thresholds.',
              },
              {
                step: '03',
                title: 'Watch it work',
                description: 'AI handles the routine while you focus on growth. Review and approve critical decisions.',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-2xl font-bold text-emerald-400">
                  {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-zinc-100">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, <span className="text-emerald-400">transparent</span> pricing
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Start free, scale as you grow
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '$0',
                description: 'Perfect for trying out BREWAI',
                features: ['1 location', 'Basic analytics', 'Email support', 'POS integration'],
                cta: 'Get started',
                highlighted: false,
              },
              {
                name: 'Professional',
                price: '$149',
                description: 'For growing restaurant groups',
                features: ['Up to 10 locations', 'AI agents', 'Real-time analytics', 'Priority support', 'All integrations'],
                cta: 'Start free trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large-scale operations',
                features: ['Unlimited locations', 'Custom AI agents', 'Dedicated support', 'SLA guarantees', 'On-premise option'],
                cta: 'Contact sales',
                highlighted: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-3xl border p-8 transition-all ${
                  plan.highlighted
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-transparent'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-px left-1/2 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight text-zinc-100">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-zinc-500">/month</span>}
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">{plan.description}</p>
                </div>
                <ul className="mb-8 space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className={`h-5 w-5 ${plan.highlighted ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                      : 'border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 px-8 py-20 sm:px-16">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10" />
            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
            
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to transform your restaurant?
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Join 500+ restaurants already using BREWAI to reduce waste, optimize menus, and scale their business.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 text-base font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25"
                >
                  Start your free trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/50 px-8 text-base font-semibold transition-all hover:bg-zinc-800"
                >
                  Talk to sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <ChefHat className="h-5 w-5 text-zinc-950" />
                </div>
                <span className="text-xl font-bold">BREWAI</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm text-zinc-500">
                AI-powered restaurant operations platform. Smarter inventory, optimized menus, coordinated teams.
              </p>
            </div>
            
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Integrations', 'Changelog'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Security', 'Compliance'],
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="mb-4 text-sm font-semibold text-zinc-100">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link href="#" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 sm:flex-row">
            <p className="text-sm text-zinc-600">2024 BREWAI. All rights reserved.</p>
            <div className="flex gap-6">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <Link key={social} href="#" className="text-sm text-zinc-600 transition-colors hover:text-zinc-400">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
