'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2 } from 'lucide-react';

interface SessionEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'custom';
  timestamp: string;
  data: Record<string, any>;
  target?: string;
}

interface PageView {
  path: string;
  title?: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number;
}

interface SessionData {
  _id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  deviceType?: string;
  browser?: string;
  os?: string;
  events: SessionEvent[];
  pageViews: PageView[];
}

interface SessionPlayerProps {
  session: SessionData;
  onClose?: () => void;
}

export function SessionPlayer({ session, onClose }: SessionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const startTime = new Date(session.startedAt).getTime();
  const endTime = session.endedAt 
    ? new Date(session.endedAt).getTime() 
    : startTime + (session.duration || 0);
  const totalDuration = endTime - startTime;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentEvent = useCallback(() => {
    const currentTimestamp = startTime + currentTime;
    for (let i = session.events.length - 1; i >= 0; i--) {
      const eventTime = new Date(session.events[i].timestamp).getTime();
      if (eventTime <= currentTimestamp) {
        return i;
      }
    }
    return 0;
  }, [currentTime, session.events, startTime]);

  useEffect(() => {
    if (isPlaying) {
      const startTimestamp = performance.now();
      const startPosition = currentTime;

      const animate = (timestamp: number) => {
        const elapsed = (timestamp - startTimestamp) * playbackSpeed;
        const newTime = Math.min(startPosition + elapsed, totalDuration);
        setCurrentTime(newTime);
        setCurrentEventIndex(getCurrentEvent());

        if (newTime < totalDuration) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, currentTime, playbackSpeed, totalDuration, getCurrentEvent]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    setCurrentEventIndex(getCurrentEvent());
  };

  const handleSkipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 5000));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(totalDuration, currentTime + 5000));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getCurrentPage = () => {
    const currentTimestamp = startTime + currentTime;
    for (let i = session.pageViews.length - 1; i >= 0; i--) {
      const pageTime = new Date(session.pageViews[i].enteredAt).getTime();
      if (pageTime <= currentTimestamp) {
        return session.pageViews[i];
      }
    }
    return session.pageViews[0];
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'click': return 'bg-blue-500';
      case 'scroll': return 'bg-green-500';
      case 'input': return 'bg-yellow-500';
      case 'navigation': return 'bg-purple-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const currentPage = getCurrentPage();

  return (
    <div 
      ref={containerRef}
      className="flex flex-col bg-card rounded-lg border shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Session: </span>
            <span className="font-mono">{session._id.slice(0, 8)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Device: </span>
            <span>{session.deviceType || 'Unknown'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Browser: </span>
            <span>{session.browser || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="px-2 py-1 text-sm bg-background border rounded"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-muted rounded"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-[400px]">
        {/* Replay viewport */}
        <div className="flex-1 bg-muted/30 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-3xl aspect-video bg-background rounded-lg shadow-inner border flex flex-col">
            {/* Simulated browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded px-3 py-1 text-sm text-muted-foreground">
                  {currentPage?.path || '/'}
                </div>
              </div>
            </div>
            
            {/* Page content placeholder */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">{currentPage?.title || 'Page View'}</p>
                <p className="text-sm">{currentPage?.path}</p>
                {session.events[currentEventIndex] && (
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <p className="font-medium">Current Event:</p>
                    <p className="text-xs font-mono">
                      {session.events[currentEventIndex].type}
                      {session.events[currentEventIndex].target && (
                        <span> on {session.events[currentEventIndex].target}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event timeline sidebar */}
        <div className="w-64 border-l bg-muted/30 overflow-hidden flex flex-col">
          <div className="p-3 border-b font-medium text-sm">
            Events ({session.events.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {session.events.map((event, index) => {
              const eventTime = new Date(event.timestamp).getTime() - startTime;
              const isActive = index === currentEventIndex;
              const isPast = index < currentEventIndex;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTime(eventTime);
                    setCurrentEventIndex(index);
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast 
                        ? 'bg-muted/50 text-muted-foreground' 
                        : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`} />
                    <span className="font-medium capitalize">{event.type}</span>
                    <span className="ml-auto opacity-70">
                      {formatTime(eventTime)}
                    </span>
                  </div>
                  {event.target && (
                    <p className="mt-1 truncate opacity-70 font-mono">
                      {event.target}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="border-t bg-muted/50 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipBack}
              className="p-2 hover:bg-muted rounded"
              title="Skip back 5s"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={handleSkipForward}
              className="p-2 hover:bg-muted rounded"
              title="Skip forward 5s"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-mono w-12">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={totalDuration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono w-12 text-right">
              {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Event markers on timeline */}
        <div className="mt-2 relative h-4">
          {session.events.map((event, index) => {
            const eventTime = new Date(event.timestamp).getTime() - startTime;
            const position = (eventTime / totalDuration) * 100;
            
            return (
              <div
                key={index}
                className={`absolute top-1 w-1 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                style={{ left: `${position}%` }}
                title={`${event.type} at ${formatTime(eventTime)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
