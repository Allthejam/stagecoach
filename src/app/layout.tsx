import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RouteProvider } from '@/context/RouteContext';
import Header from '@/components/common/Header';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';

export const metadata: Metadata = {
  title: 'Stagecoach Route Risk Assessment & GPS Survey Platform',
  description: 'Enterprise bus route safety auditing, GPS corridor tracing, 5x5 HSE risk assessment, and driver flashcards.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stagecoach RRA',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#002D62',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased">
        <RouteProvider>
          <Header />
          <main className="flex-1 w-full relative">
            {children}
          </main>
          <MobileBottomNav />
          <ConfirmModal />
          <Toast />
        </RouteProvider>
      </body>
    </html>
  );
}
