'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const categories = ['All', 'Appetizers', 'Mains', 'Desserts', 'Drinks', 'Sides'];

const menuItems = [
  {
    id: '1',
    name: 'Grilled Salmon',
    category: 'Mains',
    price: 28.99,
    cost: 12.5,
    margin: 57,
    status: 'active',
    popularity: 'high',
    image: '/menu/salmon.jpg',
  },
  {
    id: '2',
    name: 'Caesar Salad',
    category: 'Appetizers',
    price: 12.99,
    cost: 3.2,
    margin: 75,
    status: 'active',
    popularity: 'high',
    image: '/menu/caesar.jpg',
  },
  {
    id: '3',
    name: 'Ribeye Steak',
    category: 'Mains',
    price: 42.99,
    cost: 22.0,
    margin: 49,
    status: 'active',
    popularity: 'medium',
    alert: 'Low margin - consider price increase',
    image: '/menu/steak.jpg',
  },
  {
    id: '4',
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    price: 9.99,
    cost: 2.8,
    margin: 72,
    status: 'active',
    popularity: 'high',
    image: '/menu/cake.jpg',
  },
  {
    id: '5',
    name: 'Mushroom Risotto',
    category: 'Mains',
    price: 24.99,
    cost: 8.5,
    margin: 66,
    status: 'inactive',
    popularity: 'low',
    image: '/menu/risotto.jpg',
  },
  {
    id: '6',
    name: 'Craft Cocktails',
    category: 'Drinks',
    price: 14.99,
    cost: 4.0,
    margin: 73,
    status: 'active',
    popularity: 'high',
    image: '/menu/cocktail.jpg',
  },
];

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState(menuItems);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your menu items, prices, and availability
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Items</p>
          <p className="mt-1 text-2xl font-bold">
            {items.filter((i) => i.status === 'active').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg. Margin</p>
          <p className="mt-1 text-2xl font-bold">
            {Math.round(items.reduce((acc, i) => acc + i.margin, 0) / items.length)}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Low Margin Alerts</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {items.filter((i) => i.margin < 50).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu items..."
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
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Menu Items Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Cost
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Margin
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Popularity
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.alert && (
                          <p className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            {item.alert}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    ${item.cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        item.margin >= 60
                          ? 'text-green-600'
                          : item.margin >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {item.margin}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.popularity === 'high'
                          ? 'bg-green-100 text-green-700'
                          : item.popularity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.popularity === 'high' && <TrendingUp className="h-3 w-3" />}
                      {item.popularity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.status === 'active' ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {item.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
