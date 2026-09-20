import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { RouteAssessment } from '@/types/route';
import { initialMockRoutes } from './mockData';

const LOCAL_STORAGE_KEY = 'stagecoach_rra_live_v4';

/**
 * Get all routes (from Firestore if configured, or LocalStorage)
 */
export async function getAllRoutes(): Promise<RouteAssessment[]> {
  if (typeof window === 'undefined') return initialMockRoutes;

  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'routes'));
      if (!querySnapshot.empty) {
        const routes: RouteAssessment[] = [];
        querySnapshot.forEach((docSnap) => {
          routes.push(docSnap.data() as RouteAssessment);
        });
        return routes;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, falling back to local storage', err);
    }
  }

  // LocalStorage fallback
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData !== null) {
      return JSON.parse(localData);
    }
  } catch (e) {
    console.error('Error loading routes from LocalStorage:', e);
  }

  // Initial clean slate
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockRoutes));
  return initialMockRoutes;
}

/**
 * Save / Update a single Route Assessment
 */
export async function saveRoute(route: RouteAssessment): Promise<void> {
  // Update LocalStorage first for instant UI response and offline safety
  if (typeof window !== 'undefined') {
    try {
      const currentRoutes = await getAllRoutes();
      const existingIdx = currentRoutes.findIndex((r) => r.id === route.id);
      let updatedRoutes: RouteAssessment[];
      if (existingIdx >= 0) {
        updatedRoutes = [...currentRoutes];
        updatedRoutes[existingIdx] = route;
      } else {
        updatedRoutes = [route, ...currentRoutes];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRoutes));
    } catch (e) {
      console.error('Failed saving to LocalStorage', e);
    }
  }

  // Sync to Cloud Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'routes', route.id), route, { merge: true });
    } catch (err) {
      console.warn('Firestore sync failed, saved locally only', err);
    }
  }
}

/**
 * Delete a Route Assessment
 */
export async function deleteRoute(routeId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const currentRoutes = await getAllRoutes();
      const filtered = currentRoutes.filter((r) => r.id !== routeId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed deleting from LocalStorage', e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'routes', routeId));
    } catch (err) {
      console.warn('Firestore delete failed', err);
    }
  }
}

/**
 * Clear all routes (clean slate)
 */
export function resetMockData(): RouteAssessment[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
  }
  return [];
}
