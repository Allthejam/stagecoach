"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isIosGuideOpen: boolean;
  openIosGuide: () => void;
  closeIosGuide: () => void;
  promptInstall: () => Promise<void>;
  isUpdateAvailable: boolean;
  reloadApp: () => void;
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIosGuideOpen, setIsIosGuideOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Device detection
    const userAgent = window.navigator.userAgent || window.navigator.vendor || '';
    const isIosDevice = 
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('stagecoach_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setBannerDismissed(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            setSwRegistration(reg);

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setIsUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    } else if ('serviceWorker' in navigator) {
      // In dev mode also register so PWA installability requirements are satisfied
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture beforeinstallprompt event for Android & Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openIosGuide = useCallback(() => {
    setIsIosGuideOpen(true);
  }, []);

  const closeIosGuide = useCallback(() => {
    setIsIosGuideOpen(false);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('stagecoach_pwa_banner_dismissed', 'true');
    } catch {}
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    } else if (isIOS) {
      // Open iOS specific modal
      setIsIosGuideOpen(true);
    } else {
      // Fallback for browsers without beforeinstallprompt (e.g. desktop safari / firefox)
      setIsIosGuideOpen(true);
    }
  }, [deferredPrompt, isIOS]);

  const reloadApp = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [swRegistration]);

  const isInstallable = (!isInstalled && (deferredPrompt !== null || isIOS));

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        isIosGuideOpen,
        openIosGuide,
        closeIosGuide,
        promptInstall,
        isUpdateAvailable,
        reloadApp,
        bannerDismissed,
        dismissBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
