"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export interface EmergencyContacts {
  controlRoomPhone: string;
  depotManager: string;
  fleetEngineeringPhone: string;
  policeLiaison: string;
}

export interface FleetDefaults {
  maxDoubleDeckerHeightM: number;
  evAllowedByDefault: boolean;
  minTurningRadiusM: number;
}

export interface OperatorProfile {
  displayName: string;
  email: string;
  role: string;
  region: string;
  depot: string;
  phone: string;
  assessorNumber: string;
  emergencyContacts: EmergencyContacts;
  fleetDefaults: FleetDefaults;
}

const DEFAULT_PROFILE: OperatorProfile = {
  displayName: 'Lead Route Assessor',
  email: '',
  role: 'Route Risk Assessor (RRA)',
  region: 'Stagecoach Network',
  depot: 'Main Depot',
  phone: '+44 (0) 141 555 0199',
  assessorNumber: 'SC-RRA-882',
  emergencyContacts: {
    controlRoomPhone: '0800 555 999',
    depotManager: 'Operations Duty Manager',
    fleetEngineeringPhone: '0800 555 888',
    policeLiaison: '101 (Non-Emergency) / 999'
  },
  fleetDefaults: {
    maxDoubleDeckerHeightM: 4.4,
    evAllowedByDefault: true,
    minTurningRadiusM: 12.5
  }
};

const PROFILE_STORAGE_KEY = 'stagecoach_rra_operator_profile_v1';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isSideDrawerOpen: boolean;
  setIsSideDrawerOpen: (open: boolean) => void;
  activeDrawerTab: 'profile' | 'contacts' | 'fleet' | 'sync' | 'security';
  setActiveDrawerTab: (tab: 'profile' | 'contacts' | 'fleet' | 'sync' | 'security') => void;
  operatorProfile: OperatorProfile;
  updateOperatorProfile: (updater: Partial<OperatorProfile>) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  offlineGuestLogin: (name?: string, region?: string, depot?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'profile' | 'contacts' | 'fleet' | 'sync' | 'security'>('profile');
  
  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PROFILE;
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load custom profile from Firestore if available
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'operators', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data() as Partial<OperatorProfile>;
              setOperatorProfile((prev) => {
                const merged = { ...prev, ...data, email: currentUser.email || prev.email };
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
                }
                return merged;
              });
            } else {
              // Update with user email
              setOperatorProfile((prev) => {
                const updated = { ...prev, email: currentUser.email || prev.email };
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
                }
                return updated;
              });
            }
          } catch (err) {
            console.warn('Could not fetch operator profile from Firestore', err);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOperatorProfile = async (updates: Partial<OperatorProfile>) => {
    const updated = {
      ...operatorProfile,
      ...updates,
      emergencyContacts: {
        ...operatorProfile.emergencyContacts,
        ...(updates.emergencyContacts || {})
      },
      fleetDefaults: {
        ...operatorProfile.fleetDefaults,
        ...(updates.fleetDefaults || {})
      }
    };

    setOperatorProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    }

    if (user && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'operators', user.uid), updated, { merge: true });
      } catch (err) {
        console.warn('Failed saving operator profile to Firestore', err);
      }
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Firebase Auth is not connected.' };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(cred.user);
      setIsLoginModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error('Sign in error:', err);
      let msg = 'Authentication failed. Please verify email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Account temporarily locked. Try again later.';
      }
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {}
    }
    setUser(null);
    setIsSideDrawerOpen(false);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Firebase Auth is not configured.' };
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  const offlineGuestLogin = (name?: string, region?: string, depot?: string) => {
    const guestProfile: Partial<OperatorProfile> = {
      displayName: name || 'Field Surveyor (Offline)',
      region: region || 'Stagecoach Network',
      depot: depot || 'Main Depot'
    };
    updateOperatorProfile(guestProfile);
    setIsLoginModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isSideDrawerOpen,
        setIsSideDrawerOpen,
        activeDrawerTab,
        setActiveDrawerTab,
        operatorProfile,
        updateOperatorProfile,
        signIn,
        signOut,
        resetPassword,
        offlineGuestLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
