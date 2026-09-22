import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RouteProvider } from '@/context/RouteContext';
import { AuthProvider } from '@/context/AuthContext';
import { FleetProvider } from '@/context/FleetContext';
import { PwaProvider } from '@/context/PwaContext';
import AppShell from '@/components/navigation/AppShell';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
import LoginModal from '@/components/auth/LoginModal';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';
import IosInstallModal from '@/components/pwa/IosInstallModal';
import PermissionsPromptModal from '@/components/pwa/PermissionsPromptModal';

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
  applicationName: 'Stagecoach RRA',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#001733',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stagecoach RRA" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <FleetProvider>
            <RouteProvider>
              <PwaProvider>
                <AppShell>
                  {children}
                </AppShell>
                <LoginModal />
                <ConfirmModal />
                <Toast />
                <PwaInstallBanner />
                <IosInstallModal />
                <PermissionsPromptModal />
              </PwaProvider>
            </RouteProvider>
          </FleetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



