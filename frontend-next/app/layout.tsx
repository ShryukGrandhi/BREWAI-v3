/**
 * BREWAI v4 Root Layout
 * Author: BUILD-AGENT v1
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BREWAI - AI-Powered Restaurant Operations',
  description: 'Transform your restaurant operations with AI-powered insights, automated announcements, and real-time analytics.',
  keywords: ['restaurant', 'AI', 'operations', 'analytics', 'automation'],
  authors: [{ name: 'BREWAI Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
