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

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

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

  // Permissions Manager
  gpsPermission: PermissionState;
  cameraPermission: PermissionState;
  notificationPermission: PermissionState;
  isPermissionsModalOpen: boolean;
  openPermissionsModal: () => void;
  closePermissionsModal: () => void;
  requestGpsPermission: () => Promise<{ success: boolean; lat?: number; lng?: number; error?: string }>;
  requestCameraPermission: () => Promise<{ success: boolean; error?: string }>;
  requestNotificationPermission: () => Promise<{ success: boolean; status: PermissionState }>;
  requestAllPermissions: () => Promise<{ gps: boolean; camera: boolean; notifications: boolean }>;
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

  // Permission States
  const [gpsPermission, setGpsPermission] = useState<PermissionState>('prompt');
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');
  const [notificationPermission, setNotificationPermission] = useState<PermissionState>('prompt');
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandaloneMode);
      return isStandaloneMode;
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

    // Permission checking
    const checkPermissions = async () => {
      // Check Geolocation
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        if ('permissions' in navigator && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: 'geolocation' as any });
            setGpsPermission(status.state as PermissionState);
            status.onchange = () => {
              setGpsPermission(status.state as PermissionState);
            };
          } catch (e) {
            // fallback
          }
        }
      } else {
        setGpsPermission('unsupported');
      }

      // Check Camera
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        if ('permissions' in navigator && navigator.permissions.query) {
          try {
            const camStatus = await navigator.permissions.query({ name: 'camera' as any });
            setCameraPermission(camStatus.state as PermissionState);
            camStatus.onchange = () => {
              setCameraPermission(camStatus.state as PermissionState);
            };
          } catch (e) {
            // fallback
          }
        }
      } else {
        setCameraPermission('unsupported');
      }

      // Check Notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission as PermissionState);
      } else {
        setNotificationPermission('unsupported');
      }
    };

    checkPermissions();

    // Auto prompt permissions if standalone PWA and not yet granted
    const permissionsPrompted = localStorage.getItem('stagecoach_permissions_prompted');
    if (checkStandalone() && !permissionsPrompted) {
      setTimeout(() => {
        setIsPermissionsModalOpen(true);
      }, 1500);
    }
  }, []);

  const openIosGuide = useCallback(() => {
    setIsIosGuideOpen(true);
  }, []);

  const closeIosGuide = useCallback(() => {
    setIsIosGuideOpen(false);
  }, []);

  const openPermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(true);
  }, []);

  const closePermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(false);
    try {
      localStorage.setItem('stagecoach_permissions_prompted', 'true');
    } catch {}
  }, []);

  const requestGpsPermission = useCallback(async (): Promise<{ success: boolean; lat?: number; lng?: number; error?: string }> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsPermission('unsupported');
      return { success: false, error: 'Geolocation is not supported by your browser.' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsPermission('granted');
          resolve({ success: true, lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('GPS permission error:', err);
          if (err.code === 1) {
            setGpsPermission('denied');
            resolve({ success: false, error: 'Location permission was denied. Please allow location access in your browser or device settings.' });
          } else if (err.code === 2) {
            resolve({ success: false, error: 'GPS position unavailable. Please ensure Location Services are switched on.' });
          } else {
            resolve({ success: false, error: 'GPS request timed out. Please try again.' });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission('unsupported');
      return { success: false, error: 'Camera API not supported on this device/browser.' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission('granted');
      return { success: true };
    } catch (err: any) {
      console.warn('Camera permission error:', err);
      setCameraPermission('denied');
      return { success: false, error: err?.message || 'Camera permission denied' };
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<{ success: boolean; status: PermissionState }> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return { success: false, status: 'unsupported' };
    }

    try {
      const result = await Notification.requestPermission();
      const state = result as PermissionState;
      setNotificationPermission(state);
      return { success: state === 'granted', status: state };
    } catch (err) {
      console.warn('Notification permission error:', err);
      return { success: false, status: 'denied' };
    }
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<{ gps: boolean; camera: boolean; notifications: boolean }> => {
    const gpsRes = await requestGpsPermission();
    const camRes = await requestCameraPermission();
    const notifRes = await requestNotificationPermission();
    try {
      localStorage.setItem('stagecoach_permissions_prompted', 'true');
    } catch {}
    return { gps: gpsRes.success, camera: camRes.success, notifications: notifRes.success };
  }, [requestGpsPermission, requestCameraPermission, requestNotificationPermission]);

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
          // Open permissions modal on successful install
          setIsPermissionsModalOpen(true);
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
        gpsPermission,
        cameraPermission,
        notificationPermission,
        isPermissionsModalOpen,
        openPermissionsModal,
        closePermissionsModal,
        requestGpsPermission,
        requestCameraPermission,
        requestNotificationPermission,
        requestAllPermissions,
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
