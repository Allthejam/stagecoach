"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export type VehicleType = 'double_decker' | 'single_decker' | 'electric_ev' | 'midi_bus' | 'coach' | 'articulated';
export type VehicleStatus = 'in_service' | 'maintenance' | 'reserve' | 'retired';

export interface BusVehicle {
  id: string;
  fleetNumber: string;
  registration: string;
  region: string;
  depot: string;
  vehicleType: VehicleType;
  makeModel: string;
  heightM: number;
  widthM: number;
  lengthM: number;
  turningRadiusM: number;
  seatingCapacity: number;
  isEv: boolean;
  status: VehicleStatus;
  notes?: string;
  updatedAt: string;
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, { label: string; badgeColor: string }> = {
  double_decker: { label: 'Double Decker', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  single_decker: { label: 'Single Decker', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  electric_ev: { label: 'Electric EV', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  midi_bus: { label: 'Midi Bus', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  coach: { label: 'Intercity Coach', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  articulated: { label: 'Articulated / Bendy', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
};

const FLEET_STORAGE_KEY = 'stagecoach_rra_depot_fleet_v1';

interface FleetContextType {
  buses: BusVehicle[];
  loadingFleet: boolean;
  addBus: (bus: Omit<BusVehicle, 'id' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateBus: (id: string, bus: Partial<BusVehicle>) => Promise<{ success: boolean; error?: string }>;
  deleteBus: (id: string) => Promise<{ success: boolean; error?: string }>;
  getBusesForDepot: (region?: string, depot?: string) => BusVehicle[];
  refreshFleet: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [buses, setBuses] = useState<BusVehicle[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(FLEET_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [loadingFleet, setLoadingFleet] = useState(false);

  const refreshFleet = async () => {
    if (!isFirebaseConfigured || !db) return;
    setLoadingFleet(true);
    try {
      const snap = await getDocs(collection(db, 'buses'));
      const list: BusVehicle[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as BusVehicle), id: d.id });
      });
      if (list.length > 0) {
        setBuses(list);
        if (typeof window !== 'undefined') {
          localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch (err) {
      console.warn('Could not refresh bus fleet from Firestore:', err);
    } finally {
      setLoadingFleet(false);
    }
  };

  useEffect(() => {
    refreshFleet();
  }, []);

  const addBus = async (newBusData: Omit<BusVehicle, 'id' | 'updatedAt'>) => {
    const id = 'bus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const busRecord: BusVehicle = {
      ...newBusData,
      id,
      updatedAt: new Date().toISOString()
    };

    setBuses((prev) => {
      const updated = [busRecord, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'buses', id), busRecord);
      } catch (err: any) {
        console.error('Firestore save bus error:', err);
        return { success: false, error: err.message || 'Could not save bus to cloud database.' };
      }
    }

    return { success: true };
  };

  const updateBus = async (id: string, updates: Partial<BusVehicle>) => {
    setBuses((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
      if (typeof window !== 'undefined') {
        localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'buses', id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err: any) {
        console.error('Firestore update bus error:', err);
        return { success: false, error: err.message || 'Could not update bus in cloud database.' };
      }
    }

    return { success: true };
  };

  const deleteBus = async (id: string) => {
    setBuses((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'buses', id));
      } catch (err: any) {
        console.warn('Firestore delete bus error:', err);
      }
    }

    return { success: true };
  };

  const getBusesForDepot = (region?: string, depot?: string): BusVehicle[] => {
    return buses.filter((b) => {
      const matchesRegion = !region || region === 'All' || b.region.toLowerCase() === region.toLowerCase();
      const matchesDepot = !depot || depot === 'All' || b.depot.toLowerCase() === depot.toLowerCase();
      return matchesRegion && matchesDepot;
    });
  };

  return (
    <FleetContext.Provider
      value={{
        buses,
        loadingFleet,
        addBus,
        updateBus,
        deleteBus,
        getBusesForDepot,
        refreshFleet
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleetContext() {
  const ctx = useContext(FleetContext);
  if (!ctx) {
    throw new Error('useFleetContext must be used within a FleetProvider');
  }
  return ctx;
}
