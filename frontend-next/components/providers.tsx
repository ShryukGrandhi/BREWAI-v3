'use client';

/**
 * BREWAI v4 App Providers
 * Author: BUILD-AGENT v1
 * 
 * Client-side providers for auth, state, and analytics.
 */

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider } from '@/lib/auth-context';
import { SessionTracker } from '@/components/session-tracker';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
      }}
    >
      <AuthProvider>
        <SessionTracker />
        {children}
      </AuthProvider>
    </SWRConfig>
  );
}
