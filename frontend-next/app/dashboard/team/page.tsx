'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

const teamMembers = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah@restaurant.com',
    phone: '(555) 123-4567',
    role: 'manager',
    status: 'active',
    joinedAt: '2023-06-15',
    avatar: null,
  },
  {
    id: '2',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@restaurant.com',
    phone: '(555) 234-5678',
    role: 'staff',
    status: 'active',
    joinedAt: '2023-08-20',
    avatar: null,
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily@restaurant.com',
    phone: '(555) 345-6789',
    role: 'staff',
    status: 'active',
    joinedAt: '2023-09-10',
    avatar: null,
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james@restaurant.com',
    phone: '(555) 456-7890',
    role: 'staff',
    status: 'inactive',
    joinedAt: '2023-07-01',
    avatar: null,
  },
  {
    id: '5',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@restaurant.com',
    phone: '(555) 567-8901',
    role: 'staff',
    status: 'active',
    joinedAt: '2024-01-05',
    avatar: null,
  },
];

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-700',
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [members] = useState(teamMembers);

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage team members, roles, and permissions
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="mt-1 text-2xl font-bold">{members.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Managers</p>
          <p className="mt-1 text-2xl font-bold">
            {members.filter((m) => m.role === 'manager').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Staff</p>
          <p className="mt-1 text-2xl font-bold">
            {members.filter((m) => m.role === 'staff').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="manager">Managers</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <div key={member.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
                <div>
                  <h3 className="font-medium">
                    {member.firstName} {member.lastName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      roleColors[member.role]
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {member.status === 'active' ? (
                  <UserCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <UserX className="h-4 w-4 text-gray-400" />
                )}
                <button className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-muted">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No team members found matching your search.</p>
        </div>
      )}
    </div>
  );
}
