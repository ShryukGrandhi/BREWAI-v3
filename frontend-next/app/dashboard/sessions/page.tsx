'use client';

import { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Filter,
  Clock,
  User,
  Monitor,
  MousePointer,
  Calendar,
} from 'lucide-react';

interface SessionEvent {
  timestamp: number;
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'resize';
  data: Record<string, unknown>;
}

interface Session {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  eventsCount: number;
  device: string;
  browser: string;
  pages: string[];
}

const mockSessions: Session[] = [
  {
    id: 'sess_1',
    userId: 'user_1',
    userName: 'Sarah Chen',
    userRole: 'manager',
    startedAt: '2024-01-30T14:30:00Z',
    endedAt: '2024-01-30T14:45:00Z',
    duration: 900,
    eventsCount: 234,
    device: 'Desktop',
    browser: 'Chrome 120',
    pages: ['/dashboard', '/dashboard/menu', '/dashboard/inventory'],
  },
  {
    id: 'sess_2',
    userId: 'user_2',
    userName: 'Mike Johnson',
    userRole: 'staff',
    startedAt: '2024-01-30T12:00:00Z',
    endedAt: '2024-01-30T12:20:00Z',
    duration: 1200,
    eventsCount: 456,
    device: 'Tablet',
    browser: 'Safari 17',
    pages: ['/dashboard', '/dashboard/inventory'],
  },
  {
    id: 'sess_3',
    userId: 'user_3',
    userName: 'Emily Rodriguez',
    userRole: 'staff',
    startedAt: '2024-01-30T10:15:00Z',
    endedAt: '2024-01-30T10:35:00Z',
    duration: 1200,
    eventsCount: 189,
    device: 'Mobile',
    browser: 'Chrome Mobile',
    pages: ['/dashboard'],
  },
  {
    id: 'sess_4',
    userId: 'user_1',
    userName: 'Sarah Chen',
    userRole: 'manager',
    startedAt: '2024-01-29T16:00:00Z',
    endedAt: '2024-01-29T17:30:00Z',
    duration: 5400,
    eventsCount: 892,
    device: 'Desktop',
    browser: 'Chrome 120',
    pages: ['/dashboard', '/dashboard/analytics', '/dashboard/agents', '/dashboard/settings'],
  },
];

export default function SessionsPage() {
  const [sessions] = useState(mockSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Recordings</h1>
          <p className="mt-1 text-muted-foreground">
            Review user sessions and understand behavior patterns
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session);
                    setPlaybackTime(0);
                    setIsPlaying(false);
                  }}
                  className={`w-full border-b p-4 text-left transition-colors hover:bg-muted/50 ${
                    selectedSession?.id === session.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {session.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-medium">{session.userName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{session.userRole}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {session.device}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {session.eventsCount} events
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session Player */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="rounded-lg border bg-card">
              {/* Session Info */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedSession.userName}'s Session</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedSession.startedAt).toLocaleString()} - {selectedSession.browser}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDuration(selectedSession.duration)}
                  </div>
                </div>
              </div>

              {/* Player Area */}
              <div className="aspect-video bg-muted/50">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Monitor className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Session replay visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSession.eventsCount} events recorded
                    </p>
                  </div>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="border-t p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button className="rounded p-1.5 hover:bg-muted">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    <button className="rounded p-1.5 hover:bg-muted">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={selectedSession.duration}
                      value={playbackTime}
                      onChange={(e) => setPlaybackTime(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatDuration(playbackTime)} / {formatDuration(selectedSession.duration)}
                  </div>

                  <select className="h-8 rounded border border-input bg-background px-2 text-sm">
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                  </select>
                </div>

                {/* Timeline Events */}
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium">Pages Visited</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.pages.map((page, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted px-2 py-1 text-xs"
                      >
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center rounded-lg border bg-card">
              <div className="text-center">
                <Monitor className="mx-auto h-16 w-16 text-muted-foreground/50" />
                <h3 className="mt-4 font-medium">Select a session</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a session from the list to view the recording
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
