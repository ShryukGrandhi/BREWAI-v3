'use client';

/**
 * BREWAI v4 Session Tracker
 * Author: BUILD-AGENT v1
 * 
 * Client-side session tracking with rrweb-like functionality.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiHelpers } from '@/lib/api';

interface AnalyticsEvent {
  type: string;
  payload: Record<string, unknown>;
  ts: number;
  url: string;
}

const CHUNK_INTERVAL = parseInt(process.env.NEXT_PUBLIC_SESSION_CHUNK_INTERVAL || '10000');
const SAMPLE_RATE = parseFloat(process.env.NEXT_PUBLIC_SESSION_SAMPLE_RATE || '1.0');
const TRACKING_ENABLED = process.env.NEXT_PUBLIC_SESSION_TRACKING_ENABLED !== 'false';
const VISITOR_ID_KEY = 'brewai_visitor_id';
const CONSENT_KEY = 'brewai_tracking_consent';

export function SessionTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const eventsBufferRef = useRef<AnalyticsEvent[]>([]);
  const chunkBufferRef = useRef<unknown[]>([]);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Get or create visitor ID
  const getVisitorId = useCallback(() => {
    if (typeof window === 'undefined') return '';
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  }, []);

  // Check consent status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent !== null) {
      setConsent(savedConsent === 'true');
    } else {
      // Show consent banner
      setShowBanner(true);
    }
  }, []);

  // Initialize session
  const initSession = useCallback(async () => {
    if (!TRACKING_ENABLED || typeof window === 'undefined') return;
    if (consent === null) return; // Wait for consent decision
    
    const visitorId = getVisitorId();
    
    // Get restaurant ID from URL or default
    const restaurantId = getRestaurantIdFromUrl();
    if (!restaurantId) return;

    try {
      const response = await apiHelpers.createSession({
        restaurantId,
        visitorId,
        consent: consent || false,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          devicePixelRatio: window.devicePixelRatio,
          platform: navigator.platform,
          language: navigator.language,
        },
      });

      sessionIdRef.current = response.data.sessionId;
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }, [consent, getVisitorId]);

  // Track event
  const trackEvent = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (!sessionIdRef.current) return;

    const event: AnalyticsEvent = {
      type,
      payload,
      ts: Date.now(),
      url: window.location.href,
    };

    eventsBufferRef.current.push(event);

    // If we have consent, also buffer for replay
    if (consent) {
      chunkBufferRef.current.push(event);
    }
  }, [consent]);

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (!sessionIdRef.current || eventsBufferRef.current.length === 0) return;

    const events = [...eventsBufferRef.current];
    eventsBufferRef.current = [];

    try {
      await apiHelpers.sendEvents(sessionIdRef.current, events);
    } catch (error) {
      // Re-add events to buffer on failure
      eventsBufferRef.current = [...events, ...eventsBufferRef.current];
    }
  }, []);

  // Flush replay chunks
  const flushChunks = useCallback(async () => {
    if (!sessionIdRef.current || !consent || chunkBufferRef.current.length === 0) return;

    const chunk = [...chunkBufferRef.current];
    const eventCount = chunk.length;
    chunkBufferRef.current = [];

    try {
      await apiHelpers.uploadReplayChunk(sessionIdRef.current, chunk, eventCount);
    } catch (error) {
      // Re-add chunk on failure
      chunkBufferRef.current = [...chunk, ...chunkBufferRef.current];
    }
  }, [consent]);

  // Set up event listeners
  useEffect(() => {
    if (!TRACKING_ENABLED || typeof window === 'undefined') return;
    
    initSession();

    // Track page views
    trackEvent('pageview', { 
      title: document.title,
      referrer: document.referrer,
    });

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackEvent('click', {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50),
        x: e.clientX,
        y: e.clientY,
      });
    };

    // Scroll tracking (throttled)
    let lastScrollTime = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < 1000) return;
      lastScrollTime = now;
      
      trackEvent('scroll', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        maxScroll: document.body.scrollHeight - window.innerHeight,
      });
    };

    // Mouse move tracking (heavily sampled)
    let lastMoveTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 150) return;
      lastMoveTime = now;
      
      if (consent) {
        chunkBufferRef.current.push({
          type: 'mousemove',
          ts: now,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    // Input tracking (mask sensitive fields)
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const isSensitive = target.type === 'password' || 
                         target.name?.match(/email|phone|card|cc/i) ||
                         target.hasAttribute('data-mask');
      
      trackEvent('input', {
        tagName: target.tagName,
        type: target.type,
        name: target.name,
        hasValue: !!target.value,
        isSensitive,
      });
    };

    // Visibility change
    const handleVisibility = () => {
      trackEvent('visibility', {
        hidden: document.hidden,
      });
    };

    // Add listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('input', handleInput);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic flush
    const flushInterval = setInterval(() => {
      flushEvents();
      flushChunks();
    }, CHUNK_INTERVAL);

    // Flush on unload
    const handleUnload = () => {
      flushEvents();
      flushChunks();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(flushInterval);
    };
  }, [initSession, trackEvent, flushEvents, flushChunks, consent]);

  // Handle consent
  const handleConsent = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, String(accepted));
    setConsent(accepted);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          We use session recordings to improve your experience. Your data is protected and used only for analytics.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleConsent(false)}
            className="btn-outline text-white border-white hover:bg-white/10"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="btn-accent"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to get restaurant ID from URL
function getRestaurantIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check for restaurant ID in query params or path
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('restaurantId');
  if (fromQuery) return fromQuery;
  
  // Check path like /r/[restaurantId]
  const pathMatch = window.location.pathname.match(/\/r\/([a-f0-9]{24})/);
  if (pathMatch) return pathMatch[1];
  
  // Default demo restaurant ID for development
  return process.env.NEXT_PUBLIC_DEMO_RESTAURANT_ID || null;
}

// UUID v4 generator
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
