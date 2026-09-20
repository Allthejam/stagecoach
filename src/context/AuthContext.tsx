"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, createFirebaseUserAccount } from '@/lib/firebase';

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
  avatarUrl?: string;
  jobTitle?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  tempPassword?: string;
  mustChangePassword?: boolean;
  status: 'active' | 'suspended' | 'terminated';
  createdAt: string;
  updatedAt?: string;
  promotedAt?: string;
  lastLoginAt?: string;
  terminationDate?: string;
  notes?: string;
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
  avatarUrl: '',
  jobTitle: 'Chief Executive Officer / Master Administrator',
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
    avatarUrl: '',
    jobTitle: 'Master Administrator',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const PROFILE_STORAGE_KEY = 'stagecoach_rra_operator_profile_v2';
const USERS_CACHE_KEY = 'stagecoach_rra_users_cache_v2';
const SESSION_KEY = 'stagecoach_rra_session_active_v2';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  }
  return clean;
}

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
  activePerspectiveRole: UserRole | null;
  effectiveRole: UserRole;
  isMasterAdmin: boolean;
  switchPerspective: (role: UserRole) => void;
  resetPerspective: () => void;
  updateOperatorProfile: (updater: Partial<OperatorProfile>) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfileDetails: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  offlineGuestLogin: (name?: string, role?: UserRole, region?: string, depot?: string) => void;
  createOrUpdateUser: (userData: Partial<UserProfile> & { email: string; displayName: string; temporaryPassword?: string }) => Promise<{ success: boolean; error?: string; uid?: string; temporaryPassword?: string }>;
  deleteUserRecord: (uid: string) => Promise<{ success: boolean; error?: string }>;
  promoteUserRole: (uid: string, newRole: UserRole, newRegion?: string, newDepot?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (uid: string, status: 'active' | 'suspended' | 'terminated', notes?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsersList: () => Promise<void>;
  syncAllUsersToFirestore: () => Promise<{ count: number; authCreatedCount: number }>;
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
  const [activePerspectiveRole, setActivePerspectiveRole] = useState<UserRole | null>(null);

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

  const isMasterAdmin = operatorProfile.role === 'master_admin' || operatorProfile.email === 'admin@stagecoach.co.uk' || operatorProfile.uid === 'master-01';
  const effectiveRole = activePerspectiveRole || operatorProfile.role;

  const switchPerspective = (newRole: UserRole) => {
    if (newRole === 'master_admin') {
      setActivePerspectiveRole(null);
      setOperatorProfile((prev) => ({
        ...prev,
        role: 'master_admin',
        displayName: 'Allan (Master Admin)',
        region: 'All Regions',
        depot: 'All Depots'
      }));
    } else if (newRole === 'regional_admin') {
      setActivePerspectiveRole('regional_admin');
      setOperatorProfile((prev) => ({
        ...prev,
        role: 'regional_admin',
        displayName: 'Regional Director (Highlands)',
        region: 'Highlands & Islands',
        depot: 'Inverness HQ'
      }));
    } else if (newRole === 'depot_admin') {
      setActivePerspectiveRole('depot_admin');
      setOperatorProfile((prev) => ({
        ...prev,
        role: 'depot_admin',
        displayName: 'Depot Manager (Aviemore)',
        region: 'Highlands & Islands',
        depot: 'Aviemore Depot'
      }));
    } else {
      setActivePerspectiveRole('assessor');
      setOperatorProfile((prev) => ({
        ...prev,
        role: 'assessor',
        displayName: 'Field Assessor (Surveyor)',
        region: 'Highlands & Islands',
        depot: 'Aviemore Depot'
      }));
    }
  };

  const resetPerspective = () => {
    setActivePerspectiveRole(null);
    setOperatorProfile((prev) => ({
      ...prev,
      role: 'master_admin',
      displayName: 'Allan (Master Admin)',
      region: 'All Regions',
      depot: 'All Depots'
    }));
  };

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
      } else {
        // Automatically create and seed 'users' collection with Master Admin
        const initialMaster: UserProfile = {
          uid: 'master-01',
          displayName: 'Allan (Master Admin)',
          email: 'admin@stagecoach.co.uk',
          role: 'master_admin',
          region: 'All Regions',
          depot: 'All Depots',
          phone: '+44 (0) 141 555 0199',
          assessorNumber: 'SC-HQ-001',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', 'master-01'), initialMaster, { merge: true });
        setUsersList([initialMaster]);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USERS_CACHE_KEY, JSON.stringify([initialMaster]));
        }
      }
    } catch (err) {
      console.warn('Could not refresh users list from Firestore:', err);
    }
  };

  const syncAllUsersToFirestore = async (): Promise<{ count: number; authCreatedCount: number }> => {
    if (!isFirebaseConfigured || !db) return { count: 0, authCreatedCount: 0 };
    try {
      let savedCount = 0;
      let authCreatedCount = 0;
      const updatedList: UserProfile[] = [];

      for (const u of usersList) {
        let currentUid = u.uid;
        // If not a real Firebase Auth UID and has email, provision them in Firebase Auth
        const isRealAuth = Boolean(currentUid && !currentUid.startsWith('user_') && !currentUid.startsWith('master-') && currentUid.length >= 20);
        
        if (!isRealAuth && u.email) {
          const pass = u.tempPassword || ('Stagecoach#' + Math.floor(1000 + Math.random() * 9000));
          const authRes = await createFirebaseUserAccount(u.email.trim().toLowerCase(), pass, u.displayName.trim());
          if (authRes.uid) {
            // Delete old temporary user_ doc from Firestore
            if (currentUid && currentUid.startsWith('user_')) {
              await deleteDoc(doc(db, 'users', currentUid)).catch(() => {});
            }
            currentUid = authRes.uid;
            u.uid = authRes.uid;
            u.tempPassword = pass;
            authCreatedCount++;
          }
        }

        const cleanUser = sanitizeForFirestore({ ...u, uid: currentUid });
        await setDoc(doc(db, 'users', currentUid), cleanUser, { merge: true });
        savedCount++;
        updatedList.push({ ...u, uid: currentUid });
      }

      setUsersList(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updatedList));
      }

      return { count: savedCount, authCreatedCount };
    } catch (err) {
      console.error('Error syncing users to Firestore:', err);
      return { count: 0, authCreatedCount: 0 };
    }
  };

  // Sync users collection on client mount
  useEffect(() => {
    refreshUsersList();
  }, []);

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

  const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
        if (db) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            mustChangePassword: false,
            tempPassword: '',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err: any) {
        console.error('Password update error:', err);
        if (err.code === 'auth/requires-recent-login') {
          return { success: false, error: 'For security, please sign out and sign in again before changing your password.' };
        }
        return { success: false, error: err.message || 'Could not update password.' };
      }
    }

    // Update local profile state
    setOperatorProfile((prev) => {
      const updated: OperatorProfile = { 
        ...prev, 
        mustChangePassword: false, 
        tempPassword: '',
        updatedAt: new Date().toISOString()
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    return { success: true };
  };

  const updateUserProfileDetails = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    const updatedProfile: OperatorProfile = {
      ...operatorProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setOperatorProfile(updatedProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    }

    // Update in usersList cache
    setUsersList((prev) => {
      const list = prev.map((u) => (u.uid === updatedProfile.uid || u.email === updatedProfile.email ? { ...u, ...updates } : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
      }
      return list;
    });

    // Update Firebase Auth user profile (display name and photoURL) if logged in
    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updates.displayName || operatorProfile.displayName,
          photoURL: updates.avatarUrl || operatorProfile.avatarUrl || undefined
        });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile metadata:', err);
      }
    }

    // Update Firestore user document
    if (isFirebaseConfigured && db) {
      try {
        const targetUid = operatorProfile.uid;
        await setDoc(doc(db, 'users', targetUid), {
          ...updates,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err: any) {
        console.warn('Could not sync profile to Firestore:', err);
        return { success: false, error: err.message || 'Failed saving profile to database.' };
      }
    }

    return { success: true };
  };

  const createOrUpdateUser = async (
    userData: Partial<UserProfile> & { email: string; displayName: string; temporaryPassword?: string }
  ): Promise<{ success: boolean; error?: string; uid?: string; temporaryPassword?: string }> => {
    const targetRole = userData.role || 'assessor';
    if (!canManageRole(targetRole)) {
      return { success: false, error: 'Permission denied: Your role (' + operatorProfile.role + ') cannot manage ' + targetRole + ' users.' };
    }

    let finalUid = userData.uid;
    const isRealAuth = Boolean(finalUid && !finalUid.startsWith('user_') && !finalUid.startsWith('master-') && finalUid.length >= 20);
    const isNewUser = !finalUid;
    const shouldProvisionAuth = !isRealAuth;
    const tempPass = userData.temporaryPassword || userData.tempPassword || 'Stagecoach#' + Math.floor(1000 + Math.random() * 9000);

    // If creating a brand new user or migrating a temporary user to a real Firebase Auth account:
    if (shouldProvisionAuth && isFirebaseConfigured) {
      const authRes = await createFirebaseUserAccount(
        userData.email.trim().toLowerCase(),
        tempPass,
        userData.displayName.trim()
      );

      if (authRes.uid) {
        // If they had an old temporary user_ ID in Firestore, remove the old document
        if (finalUid && finalUid.startsWith('user_') && db) {
          await deleteDoc(doc(db, 'users', finalUid)).catch(() => {});
        }
        finalUid = authRes.uid;
      } else if (authRes.error) {
        console.warn('Firebase Auth creation notice:', authRes.error);
        if (!authRes.error.includes('auth/email-already-in-use')) {
          return { success: false, error: authRes.error };
        }
        if (!finalUid) {
          finalUid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        }
      }
    } else if (!finalUid) {
      finalUid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    const newRecord: UserProfile = {
      uid: finalUid || ('user_' + Date.now()),
      email: userData.email.trim().toLowerCase(),
      displayName: userData.displayName.trim(),
      role: targetRole,
      region: userData.region || operatorProfile.region || 'All Regions',
      depot: userData.depot || operatorProfile.depot || 'All Depots',
      phone: userData.phone || '',
      assessorNumber: userData.assessorNumber || ('SC-RRA-' + Math.floor(100 + Math.random() * 900)),
      avatarUrl: userData.avatarUrl || '',
      jobTitle: userData.jobTitle || '',
      emergencyContactName: userData.emergencyContactName || '',
      emergencyContactPhone: userData.emergencyContactPhone || '',
      tempPassword: tempPass,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : isNewUser,
      status: userData.status || 'active',
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update local list state
    setUsersList((prev) => {
      const existingIdx = prev.findIndex((u) => u.uid === newRecord.uid || (userData.uid && u.uid === userData.uid) || u.email === newRecord.email);
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
        const cleanRecord = sanitizeForFirestore(newRecord);
        await setDoc(doc(db, 'users', newRecord.uid), cleanRecord, { merge: true });
      } catch (err: any) {
        console.error('Firestore user save error:', err);
        const isPerm = err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'));
        const friendlyError = isPerm
          ? 'Firebase Permission Denied: Your Firestore Rules in Firebase Console require an update to allow writing to the "users" collection.'
          : (err.message || 'Could not save user in database.');

        return { 
          success: false, 
          error: friendlyError,
          uid: newRecord.uid,
          temporaryPassword: tempPass
        };
      }
    }

    return { 
      success: true, 
      uid: newRecord.uid, 
      temporaryPassword: tempPass 
    };
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

  const promoteUserRole = async (
    uid: string, 
    newRole: UserRole, 
    newRegion?: string, 
    newDepot?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'User not found.' };

    const updatedUser: UserProfile = {
      ...target,
      role: newRole,
      region: newRegion !== undefined ? newRegion : target.region,
      depot: newDepot !== undefined ? newDepot : target.depot,
      promotedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setUsersList((prev) => {
      const list = prev.map((u) => (u.uid === uid ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
      }
      return list;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), updatedUser, { merge: true });
      } catch (err: any) {
        console.error('Firestore promote user error:', err);
        return { success: false, error: err.message || 'Could not update user in database.' };
      }
    }

    return { success: true };
  };

  const updateUserStatus = async (
    uid: string, 
    status: 'active' | 'suspended' | 'terminated',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'User not found.' };

    const updatedUser: UserProfile = {
      ...target,
      status,
      terminationDate: status === 'terminated' ? new Date().toISOString() : undefined,
      notes: notes !== undefined ? notes : target.notes,
      updatedAt: new Date().toISOString()
    };

    setUsersList((prev) => {
      const list = prev.map((u) => (u.uid === uid ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
      }
      return list;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), updatedUser, { merge: true });
      } catch (err: any) {
        console.error('Firestore update status error:', err);
        return { success: false, error: err.message || 'Could not update status in database.' };
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
        activePerspectiveRole,
        effectiveRole,
        isMasterAdmin,
        switchPerspective,
        resetPerspective,
        updateOperatorProfile,
        updateUserPassword,
        updateUserProfileDetails,
        signIn,
        signOut,
        resetPassword,
        offlineGuestLogin,
        createOrUpdateUser,
        deleteUserRecord,
        promoteUserRole,
        updateUserStatus,
        refreshUsersList,
        syncAllUsersToFirestore,
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

