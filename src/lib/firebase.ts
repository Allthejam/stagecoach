import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, createUserWithEmailAndPassword, updateProfile, signOut as secondarySignOut } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBPDXqZMoiapfrD3Ovs-U5hvuBgB7U6MNs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "stagecoach-fc943.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stagecoach-fc943",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "stagecoach-fc943.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "907465387848",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:907465387848:web:b28ebfd61e508594b68d7d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VCD1LRHK61"
};

let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'mock-api-key') {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    isFirebaseConfigured = true;
  }
} catch (e) {
  console.warn('Firebase initialization skipped or failed; using offline LocalStorage mode.', e);
}

export async function createFirebaseUserAccount(
  email: string, 
  temporaryPassword: string, 
  displayName: string
): Promise<{ uid: string; error?: string }> {
  if (!isFirebaseConfigured) {
    // Generate fallback UID in offline/local mode
    return { uid: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) };
  }

  const secondaryAppName = 'SecondaryAuthApp_' + Date.now();
  let secondaryApp: FirebaseApp | null = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, temporaryPassword);
    const newUser = userCredential.user;
    
    if (displayName) {
      await updateProfile(newUser, { displayName });
    }
    
    await secondarySignOut(secondaryAuth);
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => {});
    }
    return { uid: newUser.uid };
  } catch (err: any) {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => {});
    }
    console.error('Firebase Auth user creation error:', err);
    // If user already exists in Firebase Auth, return an informative error
    return { uid: '', error: err.message || 'Firebase Auth error' };
  }
}

export { app, db, auth, storage, isFirebaseConfigured, firebaseConfig };
