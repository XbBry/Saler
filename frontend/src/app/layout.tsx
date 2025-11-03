import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/query-provider';

import { AuthProvider } from '@/lib/auth-context';
import { messages } from '@/lib/messages';
import './globals.css';

// Loading States and Error Boundaries System
import { 
  LoadingProvider,
  ApplicationErrorBoundary,
  NetworkErrorBoundary 
} from '@/components/loading';

// Initialize font
const inter = Inter({
  subsets: ['latin', 'arabic'],
  display: 'swap',
  variable: '--font-inter',
});

// React Query client is initialized by QueryProvider

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

// Generate metadata for the application
export const metadata: Metadata = {
  title: {
    default: 'Saler - Sales Management Platform',
    template: '%s | Saler',
  },
  description: 'Complete sales management platform with leads, playbooks, and analytics',
  keywords: [
    'sales management',
    'CRM',
    'leads',
    'playbooks',
    'analytics',
    'sales automation',
    'Arabic CRM',
    'منصة المبيعات'
  ],
  authors: [{ name: 'Saler Team' }],
  creator: 'Saler',
  publisher: 'Saler',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/ar',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: '/',
    title: 'Saler - Sales Management Platform',
    description: 'Complete sales management platform with leads, playbooks, and analytics',
    siteName: 'Saler',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Saler Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saler - Sales Management Platform',
    description: 'Complete sales management platform with leads, playbooks, and analytics',
    images: ['/og-image.png'],
    creator: '@saler',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
};

// Generate static parameters for locales
export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // Validate locale
  if (!['ar', 'en'].includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // Get messages for the current locale
  const messages_data = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={inter.variable}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        
        {/* Additional meta tags */}
        <meta name="application-name" content="Saler" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Saler" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-slate-50`}>
        {/* Network Error Boundary - handles network-related errors */}
        <NetworkErrorBoundary
          enableErrorReporting={true}
          enablePerformanceTracking={true}
          enableOfflineSupport={true}
          enableRetryMechanism={true}
          maxRetries={3}
          retryDelay={2000}
        >
          {/* Application Error Boundary - handles all other errors */}
          <ApplicationErrorBoundary
            enableErrorReporting={true}
            enablePerformanceTracking={true}
            enableRecoveryMode={true}
            enableErrorAnalytics={true}
            maxRetries={3}
            retryDelay={1000}
            retryStrategy="exponential"
          >
            <NextIntlClientProvider 
              messages={messages_data} 
              locale={locale}
              timeZone="Asia/Riyadh"
              now={new Date()}
            >
              {/* Loading States Provider */}
              <LoadingProvider
                enableGlobalLoading={true}
                maxConcurrentOperations={10}
                defaultTimeout={30000}
              >
                <QueryProvider 
                  enableDevtools={process.env.NODE_ENV === 'development'}
                  enableOfflineSupport={true}
                  enablePerformanceMonitoring={process.env.NODE_ENV === 'development'}
                >
                  <AuthProvider>
                    <div className="flex min-h-screen flex-col">
                      {/* Main content */}
                      <main className="flex-1">
                        {children}
                      </main>
                    </div>

                    {/* Toast notifications */}
                    <Toaster
                      position={locale === 'ar' ? 'top-left' : 'top-right'}
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                          fontSize: '14px',
                          borderRadius: '8px',
                          padding: '12px 16px',
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />
                  </AuthProvider>
                </QueryProvider>
              </LoadingProvider>
            </NextIntlClientProvider>
          </ApplicationErrorBoundary>
        </NetworkErrorBoundary>

        {/* Loading indicator */}
        <div
          id="loading-indicator"
          className="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-2 rounded-lg bg-white px-6 py-4 shadow-xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
            <span className="text-sm font-medium text-slate-700">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}

// Force static generation for better performance
export const dynamic = 'force-static';