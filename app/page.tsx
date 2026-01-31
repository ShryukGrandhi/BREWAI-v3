import Link from 'next/link';
import { ArrowRight, Bot, ChefHat, BarChart3, Shield, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BREWAI</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              AI-First Restaurant Operations Platform
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
              BREWAI transforms restaurant management with intelligent automation, real-time analytics, 
              and AI agents that handle inventory, menu optimization, and staff coordination.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-input bg-background px-6 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 sm:mt-20">
            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-xl border bg-card p-2 shadow-2xl">
                <div className="aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                  <div className="flex h-full items-center justify-center">
                    <div className="grid w-full max-w-4xl grid-cols-3 gap-4 p-8">
                      <div className="col-span-2 rounded-lg border bg-background p-4">
                        <div className="mb-3 h-4 w-32 rounded bg-muted" />
                        <div className="grid grid-cols-3 gap-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-md border bg-card p-3">
                              <div className="mb-2 h-3 w-16 rounded bg-muted" />
                              <div className="h-6 w-12 rounded bg-primary/20" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 h-32 rounded-md border bg-muted/50" />
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-lg border bg-background p-4">
                          <div className="mb-2 h-3 w-20 rounded bg-muted" />
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-3 rounded bg-muted" />
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg border bg-background p-4">
                          <div className="mb-2 h-3 w-24 rounded bg-muted" />
                          <div className="h-20 rounded bg-primary/10" />
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
      <section id="features" className="border-t bg-muted/30 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run smarter
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              AI-powered tools designed specifically for restaurant operations
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bot,
                title: 'AI Agents',
                description:
                  'Autonomous agents handle routine tasks with human-in-the-loop approval for critical decisions.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description:
                  'Live dashboards showing sales, inventory levels, and operational metrics across all locations.',
              },
              {
                icon: ChefHat,
                title: 'Menu Intelligence',
                description:
                  'AI-driven menu optimization based on ingredient costs, popularity, and profit margins.',
              },
              {
                icon: Shield,
                title: 'Role-based Access',
                description:
                  'Fine-grained permissions for owners, managers, and staff with audit logging.',
              },
              {
                icon: Zap,
                title: 'Instant Integrations',
                description:
                  'Connect with POS systems, suppliers, and delivery platforms in minutes.',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description:
                  'Announcements, task assignments, and shift management all in one place.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 sm:px-16 sm:py-24">
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to transform your operations?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join hundreds of restaurants already using BREWAI to streamline their business.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-background px-8 text-base font-medium text-foreground transition-colors hover:bg-background/90"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="font-semibold">BREWAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BREWAI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
