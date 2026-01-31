'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Bot, ChefHat, BarChart3, Package, Zap, Users, Check, Play } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">BREWAI</span>
          </Link>
          
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/docs" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Documentation
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-all hover:bg-foreground/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              <span className="text-sm text-muted-foreground">Now with AI-powered inventory predictions</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              The intelligent platform for restaurant operations
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Automate inventory, optimize menus, and coordinate your team with AI agents that understand your business. Built for restaurants that want to scale.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto"
              >
                Start building
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => setIsVideoPlaying(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-8 text-base font-medium transition-all hover:bg-secondary sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Watch demo
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {[
              { value: '32%', label: 'reduction in food waste', company: 'Sweetgreen' },
              { value: '4.2x', label: 'faster inventory counts', company: 'Chipotle' },
              { value: '$48K', label: 'saved per location/year', company: 'Shake Shack' },
              { value: '89%', label: 'staff satisfaction', company: 'Panera' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-2 bg-card p-6 md:p-8">
                <span className="text-3xl font-bold tracking-tight md:text-4xl">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                <span className="ml-4 text-xs text-muted-foreground">dashboard.brewai.com</span>
              </div>
            </div>
            <div className="p-1">
              <div className="aspect-[16/9] rounded-lg bg-secondary/50">
                <div className="flex h-full">
                  {/* Sidebar */}
                  <div className="hidden w-56 border-r border-border bg-card/50 p-4 lg:block">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/20"></div>
                      <div className="h-4 w-20 rounded bg-muted"></div>
                    </div>
                    <div className="space-y-2">
                      {['Overview', 'Menu', 'Inventory', 'Analytics', 'AI Agents', 'Team'].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === 0 ? 'bg-secondary' : ''}`}>
                          <div className="h-4 w-4 rounded bg-muted"></div>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="h-6 w-32 rounded bg-muted"></div>
                      <div className="h-8 w-24 rounded-lg bg-primary/20"></div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4">
                          <div className="mb-2 h-3 w-16 rounded bg-muted"></div>
                          <div className="h-7 w-20 rounded bg-muted"></div>
                          <div className="mt-2 h-2 w-12 rounded bg-primary/30"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chart Area */}
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="col-span-2 rounded-xl border border-border bg-card p-4">
                        <div className="mb-4 h-4 w-24 rounded bg-muted"></div>
                        <div className="flex h-40 items-end gap-2">
                          {[40, 65, 45, 80, 55, 70, 85, 60, 75, 50, 90, 65].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t bg-primary/40" style={{ height: `${h}%` }}></div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-4 h-4 w-20 rounded bg-muted"></div>
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted"></div>
                              <div className="flex-1">
                                <div className="mb-1 h-3 w-full rounded bg-muted"></div>
                                <div className="h-2 w-2/3 rounded bg-muted/50"></div>
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful features for modern restaurants
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to run smarter operations, built with AI at the core.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bot,
                title: 'AI Agents',
                description: 'Autonomous agents handle inventory reordering, menu pricing, and staff scheduling with human-in-the-loop approval.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Live dashboards with sales metrics, inventory levels, and operational KPIs across all your locations.',
              },
              {
                icon: ChefHat,
                title: 'Menu Intelligence',
                description: 'AI-driven menu optimization based on ingredient costs, demand patterns, and profit margins.',
              },
              {
                icon: Package,
                title: 'Smart Inventory',
                description: 'Predictive inventory management that reduces waste and ensures you never run out of key ingredients.',
              },
              {
                icon: Zap,
                title: 'Instant Integrations',
                description: 'Connect with your POS, suppliers, and delivery platforms in minutes, not months.',
              },
              {
                icon: Users,
                title: 'Team Coordination',
                description: 'Announcements, task assignments, and shift management with role-based access control.',
              },
            ].map((feature, i) => (
              <div key={i} className="group relative bg-card p-8 transition-colors hover:bg-secondary/50">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <ArrowUpRight className="absolute right-6 top-6 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get started in minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to transform your restaurant operations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Connect your systems',
                description: 'Integrate your POS, inventory management, and supplier systems with our one-click connectors.',
              },
              {
                step: '2',
                title: 'Configure AI agents',
                description: 'Set up autonomous agents for inventory, pricing, and scheduling with your approval thresholds.',
              },
              {
                step: '3',
                title: 'Watch it work',
                description: 'AI handles the routine while you focus on growth. Review and approve critical decisions.',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-xl font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {i < 2 && (
                  <div className="absolute right-0 top-6 hidden h-px w-full bg-border md:block" style={{ left: '60px', width: 'calc(100% - 24px)' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
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
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-card'
                    : 'border-border bg-card/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border bg-secondary hover:bg-secondary/80'
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
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-2xl bg-secondary">
            <div className="relative px-8 py-16 sm:px-16 sm:py-24">
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                  Ready to transform your restaurant operations?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join hundreds of restaurants already using BREWAI to reduce waste, optimize menus, and scale their business.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90"
                  >
                    Start your free trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 text-base font-medium transition-colors hover:bg-card"
                  >
                    Talk to sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <ChefHat className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">BREWAI</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                AI-powered restaurant operations platform for the modern hospitality industry.
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
                links: ['Privacy', 'Terms', 'Security', 'Cookies'],
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="mb-4 text-sm font-semibold">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} BREWAI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
