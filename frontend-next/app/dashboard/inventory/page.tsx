'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  BarChart3,
} from 'lucide-react';

const inventoryItems = [
  {
    id: '1',
    name: 'Chicken Breast',
    category: 'Protein',
    currentStock: 15,
    unit: 'lbs',
    parLevel: 50,
    reorderPoint: 20,
    cost: 4.99,
    supplier: 'Sysco',
    lastOrdered: '2024-01-28',
    status: 'low',
  },
  {
    id: '2',
    name: 'Atlantic Salmon',
    category: 'Protein',
    currentStock: 25,
    unit: 'lbs',
    parLevel: 40,
    reorderPoint: 15,
    cost: 12.99,
    supplier: 'US Foods',
    lastOrdered: '2024-01-26',
    status: 'ok',
  },
  {
    id: '3',
    name: 'Romaine Lettuce',
    category: 'Produce',
    currentStock: 8,
    unit: 'heads',
    parLevel: 30,
    reorderPoint: 10,
    cost: 2.49,
    supplier: 'FreshFarms',
    lastOrdered: '2024-01-29',
    status: 'low',
  },
  {
    id: '4',
    name: 'Heavy Cream',
    category: 'Dairy',
    currentStock: 12,
    unit: 'quarts',
    parLevel: 20,
    reorderPoint: 8,
    cost: 5.99,
    supplier: 'Sysco',
    lastOrdered: '2024-01-27',
    status: 'ok',
  },
  {
    id: '5',
    name: 'Olive Oil',
    category: 'Pantry',
    currentStock: 4,
    unit: 'gallons',
    parLevel: 10,
    reorderPoint: 3,
    cost: 24.99,
    supplier: 'Restaurant Depot',
    lastOrdered: '2024-01-20',
    status: 'ok',
  },
  {
    id: '6',
    name: 'Arborio Rice',
    category: 'Pantry',
    currentStock: 2,
    unit: 'lbs',
    parLevel: 15,
    reorderPoint: 5,
    cost: 3.99,
    supplier: 'Sysco',
    lastOrdered: '2024-01-15',
    status: 'critical',
  },
];

const categories = ['All', 'Protein', 'Produce', 'Dairy', 'Pantry', 'Beverages'];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = inventoryItems.filter((i) => i.status === 'low' || i.status === 'critical').length;
  const totalValue = inventoryItems.reduce((acc, i) => acc + i.currentStock * i.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="mt-1 text-muted-foreground">
            Track stock levels, costs, and automate reordering
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
            <BarChart3 className="h-4 w-4" />
            Count Inventory
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Items</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{inventoryItems.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Low Stock Alerts</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-yellow-600">{lowStockCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Inventory Value</span>
          </div>
          <p className="mt-2 text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Pending Orders</span>
          </div>
          <p className="mt-2 text-2xl font-bold">3</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border bg-card p-4 ${
              item.status === 'critical'
                ? 'border-red-300 bg-red-50/50'
                : item.status === 'low'
                ? 'border-yellow-300 bg-yellow-50/50'
                : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.status === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : item.status === 'low'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {item.status === 'critical' ? 'Critical' : item.status === 'low' ? 'Low' : 'In Stock'}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {item.currentStock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
                </span>
                <span className="text-sm text-muted-foreground">Par: {item.parLevel}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === 'critical'
                      ? 'bg-red-500'
                      : item.status === 'low'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((item.currentStock / item.parLevel) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Unit Cost</p>
                <p className="font-medium">${item.cost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Supplier</p>
                <p className="font-medium">{item.supplier}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
                Edit
              </button>
              <button className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
