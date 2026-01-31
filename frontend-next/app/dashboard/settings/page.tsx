'use client';

import { useState } from 'react';
import {
  User,
  Building,
  Bell,
  Shield,
  Bot,
  CreditCard,
  Link,
  Save,
} from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'restaurant', label: 'Restaurant', icon: Building },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'ai-settings', label: 'AI Settings', icon: Bot },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Link },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, restaurant, and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="w-full lg:w-56 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          <div className="rounded-lg border bg-card">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold">Profile Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your personal information
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-medium text-primary">
                      JD
                    </div>
                    <button className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
                      Change Photo
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <input
                        type="text"
                        defaultValue="John"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <input
                        type="text"
                        defaultValue="Doe"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      defaultValue="john@restaurant.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      type="tel"
                      defaultValue="(555) 123-4567"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-settings' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold">AI Agent Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure AI behavior and approval thresholds
                </p>

                <div className="mt-6 space-y-6">
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium">Auto-Approval Rules</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Actions below these thresholds will be auto-approved
                    </p>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Inventory Orders</p>
                          <p className="text-xs text-muted-foreground">Max auto-approve amount</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">$</span>
                          <input
                            type="number"
                            defaultValue="200"
                            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Menu Price Changes</p>
                          <p className="text-xs text-muted-foreground">Max percentage change</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue="5"
                            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Confidence Threshold</p>
                          <p className="text-xs text-muted-foreground">Minimum confidence for auto-approval</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue="95"
                            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <h3 className="font-medium">Notification Preferences</h3>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: 'Email me for all pending actions', defaultChecked: true },
                        { label: 'Email me for high-impact actions only', defaultChecked: false },
                        { label: 'Send daily summary digest', defaultChecked: true },
                        { label: 'Push notifications for critical alerts', defaultChecked: true },
                      ].map((pref, i) => (
                        <label key={i} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            defaultChecked={pref.defaultChecked}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{pref.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold">Notification Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose how you want to be notified
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Email notifications', description: 'Receive updates via email' },
                    { label: 'Push notifications', description: 'Browser and mobile notifications' },
                    { label: 'SMS alerts', description: 'Critical alerts via text message' },
                    { label: 'Weekly reports', description: 'Summary of weekly performance' },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab !== 'profile' && activeTab !== 'ai-settings' && activeTab !== 'notifications') && (
              <div className="p-6">
                <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')} Settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure your {activeTab.replace('-', ' ')} preferences
                </p>
                <div className="mt-6 flex h-40 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Settings panel coming soon
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end border-t p-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
