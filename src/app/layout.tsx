import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RouteProvider } from '@/context/RouteContext';
import { AuthProvider } from '@/context/AuthContext';
import { FleetProvider } from '@/context/FleetContext';
import EnterpriseSidebar from '@/components/navigation/EnterpriseSidebar';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
import LoginModal from '@/components/auth/LoginModal';

export const metadata: Metadata = {
  title: 'Stagecoach Route Risk Assessment & National Operations Platform',
  description: 'Enterprise bus route safety auditing, GPS corridor tracing, 5x5 HSE risk assessment, and depot fleet management.',
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <FleetProvider>
            <RouteProvider>
              <EnterpriseSidebar />
              <main className="flex-1 w-full relative md:pl-64 min-h-screen flex flex-col transition-all">
                {children}
              </main>
              <LoginModal />
              <ConfirmModal />
              <Toast />
            </RouteProvider>
          </FleetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



