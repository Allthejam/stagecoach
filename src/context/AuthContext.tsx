"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export type UserRole = 'master_admin' | 'regional_admin' | 'depot_admin' | 'assessor';

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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  region: string;
  depot: string;
  phone: string;
  assessorNumber: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface OperatorProfile extends UserProfile {
  emergencyContacts: EmergencyContacts;
  fleetDefaults: FleetDefaults;
}

export const ROLE_LABELS: Record<UserRole, { title: string; description: string; badgeColor: string }> = {
  master_admin: {
    title: 'Master Admin',
    description: 'Full UK Network authority. Manages system settings, Regional Admins, Depot Admins, and all Assessors.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  regional_admin: {
    title: 'Regional Admin',
    description: 'Regional executive. Manages Depot Admins and Assessors across designated regional garages.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  depot_admin: {
    title: 'Depot Admin',
    description: 'Depot Operations Manager. Oversees depot fleet standards, emergency directory, and local assessors.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  assessor: {
    title: 'RRA Assessor',
    description: 'Field Safety Surveyor. Conducts live GPS traces, logs hazards, and completes 5x5 HSE sign-offs.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
};

const DEFAULT_PROFILE: OperatorProfile = {
  uid: 'master-01',
  displayName: 'Allan (Master Admin)',
  email: 'admin@stagecoach.co.uk',
  role: 'master_admin',
  region: 'All Regions',
  depot: 'All Depots',
  phone: '+44 (0) 141 555 0199',
  assessorNumber: 'SC-HQ-001',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
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

const DEFAULT_USERS_LIST: UserProfile[] = [
  {
    uid: 'master-01',
    displayName: 'Master Administrator',
    email: 'allan@stagecoach.co.uk',
    role: 'master_admin',
    region: 'All Regions',
    depot: 'All Depots',
    phone: '+44 (0) 141 555 0100',
    assessorNumber: 'SC-MASTER-01',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const PROFILE_STORAGE_KEY = 'stagecoach_rra_operator_profile_v2';
const USERS_CACHE_KEY = 'stagecoach_rra_users_cache_v2';
const SESSION_KEY = 'stagecoach_rra_session_active_v2';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isSideDrawerOpen: boolean;
  setIsSideDrawerOpen: (open: boolean) => void;
  activeDrawerTab: 'profile' | 'users' | 'contacts' | 'fleet' | 'sync' | 'security';
  setActiveDrawerTab: (tab: 'profile' | 'users' | 'contacts' | 'fleet' | 'sync' | 'security') => void;
  operatorProfile: OperatorProfile;
  usersList: UserProfile[];
  updateOperatorProfile: (updater: Partial<OperatorProfile>) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  offlineGuestLogin: (name?: string, role?: UserRole, region?: string, depot?: string) => void;
  createOrUpdateUser: (userData: Partial<UserProfile> & { email: string; displayName: string }) => Promise<{ success: boolean; error?: string }>;
  deleteUserRecord: (uid: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsersList: () => Promise<void>;
  canManageRole: (targetRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestSession, setIsGuestSession] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'profile' | 'users' | 'contacts' | 'fleet' | 'sync' | 'security'>('profile');
  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile>(DEFAULT_PROFILE);
  const [usersList, setUsersList] = useState<UserProfile[]>(DEFAULT_USERS_LIST);

  // Load client cached values after mount to eliminate SSR hydration mismatch
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY) === 'true';
      if (savedSession) setIsGuestSession(true);

      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        setOperatorProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
      }

      const savedUsers = localStorage.getItem(USERS_CACHE_KEY);
      if (savedUsers) {
        setUsersList(JSON.parse(savedUsers));
      }
    } catch (e) {
      console.warn('Could not read local storage during hydration:', e);
    }
  }, []);

  const refreshUsersList = async () => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data() as UserProfile;
        list.push({ ...data, uid: d.id });
      });
      if (list.length > 0) {
        setUsersList(list);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
        }
      }
    } catch (err) {
      console.warn('Could not refresh users list from Firestore:', err);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load user record from Firestore 'users' collection
        if (db) {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserProfile;
              setOperatorProfile((prev) => {
                const merged: OperatorProfile = {
                  ...prev,
                  ...userData,
                  uid: currentUser.uid,
                  email: currentUser.email || userData.email || prev.email,
                  displayName: userData.displayName || prev.displayName,
                  role: userData.role || 'master_admin'
                };
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
                }
                return merged;
              });
            } else {
              // Create initial profile for this user in 'users' collection (defaulting to master_admin for initial admin/owner)
              const initialUser: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || 'operator@stagecoach.co.uk',
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Stagecoach Admin',
                role: 'master_admin',
                region: 'All Regions',
                depot: 'Main Depot',
                phone: '+44 (0) 141 555 0199',
                assessorNumber: 'SC-ADM-01',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };

              await setDoc(userRef, initialUser, { merge: true });

              setOperatorProfile((prev) => {
                const merged: OperatorProfile = {
                  ...prev,
                  ...initialUser
                };
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
                }
                return merged;
              });
            }

            // Also load any custom emergency contacts / fleet overrides
            const opRef = doc(db, 'operators', currentUser.uid);
            const opDoc = await getDoc(opRef);
            if (opDoc.exists()) {
              const opData = opDoc.data();
              if (opData.emergencyContacts || opData.fleetDefaults) {
                setOperatorProfile((prev) => ({
                  ...prev,
                  emergencyContacts: opData.emergencyContacts || prev.emergencyContacts,
                  fleetDefaults: opData.fleetDefaults || prev.fleetDefaults
                }));
              }
            }

            // Refresh team users list
            await refreshUsersList();
          } catch (err) {
            console.warn('Could not fetch user record from Firestore', err);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOperatorProfile = async (updates: Partial<OperatorProfile>) => {
    const updated: OperatorProfile = {
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
        await setDoc(doc(db, 'users', user.uid), {
          displayName: updated.displayName,
          phone: updated.phone,
          assessorNumber: updated.assessorNumber,
          region: updated.region,
          depot: updated.depot,
          role: updated.role,
          email: updated.email
        }, { merge: true });

        await setDoc(doc(db, 'operators', user.uid), {
          emergencyContacts: updated.emergencyContacts,
          fleetDefaults: updated.fleetDefaults
        }, { merge: true });
      } catch (err) {
        console.warn('Failed saving operator profile to Firestore', err);
      }
    }
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    const myRole = operatorProfile.role;
    if (myRole === 'master_admin') return true;
    if (myRole === 'regional_admin') {
      return targetRole === 'depot_admin' || targetRole === 'assessor';
    }
    if (myRole === 'depot_admin') {
      return targetRole === 'assessor';
    }
    return false;
  };

  const createOrUpdateUser = async (userData: Partial<UserProfile> & { email: string; displayName: string }) => {
    const targetRole = userData.role || 'assessor';
    if (!canManageRole(targetRole)) {
      return { success: false, error: 'Permission denied: Your role (' + operatorProfile.role + ') cannot manage ' + targetRole + ' users.' };
    }

    const uid = userData.uid || ('user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const newRecord: UserProfile = {
      uid,
      email: userData.email.trim().toLowerCase(),
      displayName: userData.displayName.trim(),
      role: targetRole,
      region: userData.region || operatorProfile.region || 'Stagecoach Network',
      depot: userData.depot || operatorProfile.depot || 'Main Depot',
      phone: userData.phone || '',
      assessorNumber: userData.assessorNumber || ('SC-RRA-' + Math.floor(100 + Math.random() * 900)),
      status: userData.status || 'active',
      createdAt: userData.createdAt || new Date().toISOString()
    };

    // Update local list state
    setUsersList((prev) => {
      const existingIdx = prev.findIndex((u) => u.uid === uid || u.email === newRecord.email);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...newRecord };
      } else {
        updated = [newRecord, ...prev];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // Save to Firestore 'users' collection
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), newRecord, { merge: true });
      } catch (err: any) {
        console.error('Firestore user save error:', err);
        return { success: false, error: err.message || 'Could not save user in database.' };
      }
    }

    return { success: true };
  };

  const deleteUserRecord = async (uid: string) => {
    setUsersList((prev) => {
      const filtered = prev.filter((u) => u.uid !== uid);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    });

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.warn('Could not delete user document:', err);
      }
    }
    return { success: true };
  };

  const signIn = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Firebase Auth is not connected.' };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(cred.user);
      setIsGuestSession(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, 'true');
      }
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
    setIsGuestSession(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
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

  const offlineGuestLogin = (name?: string, role?: UserRole, region?: string, depot?: string) => {
    const guestProfile: Partial<OperatorProfile> = {
      displayName: name || 'Field Surveyor (Offline)',
      role: role || 'assessor',
      region: region || 'Stagecoach Network',
      depot: depot || 'Main Depot'
    };
    updateOperatorProfile(guestProfile);
    setIsGuestSession(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, 'true');
    }
    setIsLoginModalOpen(false);
  };

  const isAuthenticated = Boolean(user || isGuestSession);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isSideDrawerOpen,
        setIsSideDrawerOpen,
        activeDrawerTab,
        setActiveDrawerTab,
        operatorProfile,
        usersList,
        updateOperatorProfile,
        signIn,
        signOut,
        resetPassword,
        offlineGuestLogin,
        createOrUpdateUser,
        deleteUserRecord,
        refreshUsersList,
        canManageRole
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

