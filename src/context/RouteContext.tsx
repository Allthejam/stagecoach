"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { RouteAssessment, GisToolMode, HazardObservation, RouteStop, StopType, STAGECOACH_UK_REGIONS } from '@/types/route';
import { initialMockRoutes } from '@/lib/mockData';
import { 
  getAllRoutes, 
  saveRoute, 
  deleteRoute as deleteRouteApi, 
  resetMockData as resetMockDataApi,
  loadSampleTemplates as loadSampleTemplatesApi 
} from '@/lib/firestore';
import { calculateTotalRouteDistanceKm, calculateEstimatedRunningTime } from '@/lib/calculations';

export type ActiveTab = 'map' | 'hazards' | 'fleet' | 'driver' | 'governance';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface RouteContextType {
  routes: RouteAssessment[];
  filteredRoutes: RouteAssessment[];
  currentRouteId: string;
  currentRoute: RouteAssessment | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  gisToolMode: GisToolMode;
  setGisToolMode: (mode: GisToolMode) => void;
  selectRoute: (id: string) => void;
  
  // 3-Tier Cascading Filter State
  selectedRegionFilter: string;
  setSelectedRegionFilter: (region: string) => void;
  selectedGarageFilter: string;
  setSelectedGarageFilter: (garage: string) => void;
  availableRegionsForFilter: string[];
  availableGaragesForFilter: string[];
  
  updateCurrentRoute: (updater: (prev: RouteAssessment) => RouteAssessment) => void;
  saveCurrentRoute: () => Promise<void>;
  createNewRoute: (routeNumber: string, routeTitle: string, region: string, depot: string, assessorName?: string) => void;
  deleteCurrentRoute: () => Promise<void>;
  resetToCleanSlate: () => void;
  loadSampleTemplateRoutes: () => Promise<void>;
  
  // Pending placement coordinates for modals
  pendingCoords: [number, number] | null;
  setPendingCoords: (coords: [number, number] | null) => void;
  pendingStopType: StopType | null;
  setPendingStopType: (type: StopType | null) => void;
  
  // Modals
  isAddStopModalOpen: boolean;
  setIsAddStopModalOpen: (open: boolean) => void;
  isAddHazardModalOpen: boolean;
  setIsAddHazardModalOpen: (open: boolean) => void;
  selectedHazardForModal: HazardObservation | null;
  setSelectedHazardForModal: (hazard: HazardObservation | null) => void;
  confirmModal: ConfirmModalState;
  showConfirmModal: (config: Omit<ConfirmModalState, 'isOpen'>) => void;
  hideConfirmModal: () => void;
  
  // GPS & Field State
  isGpsTracking: boolean;
  setIsGpsTracking: (tracking: boolean) => void;
  userGpsPosition: [number, number] | null;
  setUserGpsPosition: (pos: [number, number] | null) => void;
  gpsAccuracyMeters: number | null;
  setUserGpsAccuracy: (acc: number | null) => void;
  
  // Map View
  tileLayer: 'osm' | 'satellite';
  setTileLayer: (layer: 'osm' | 'satellite') => void;
  
  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Path manipulation helpers
  addPathPoint: (coord: [number, number]) => void;
  undoPathPoint: () => void;
  reversePath: () => void;
  clearPath: () => void;
  startOver: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [routes, setRoutes] = useState<RouteAssessment[]>(initialMockRoutes);
  const [currentRouteId, setCurrentRouteId] = useState<string>(initialMockRoutes[0]?.id || '');
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [gisToolMode, setGisToolMode] = useState<GisToolMode>('browse');
  const [tileLayer, setTileLayer] = useState<'osm' | 'satellite'>('osm');
  
  // Cascading Filter States
  const [selectedRegionFilter, setSelectedRegionFilterState] = useState<string>('');
  const [selectedGarageFilter, setSelectedGarageFilterState] = useState<string>('');
  
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [pendingStopType, setPendingStopType] = useState<StopType | null>(null);
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [isAddHazardModalOpen, setIsAddHazardModalOpen] = useState(false);
  const [selectedHazardForModal, setSelectedHazardForModal] = useState<HazardObservation | null>(null);
  
  const [isGpsTracking, setIsGpsTracking] = useState(false);
  const [userGpsPosition, setUserGpsPosition] = useState<[number, number] | null>(null);
  const [gpsAccuracyMeters, setUserGpsAccuracy] = useState<number | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Client hydration from LocalStorage / Firestore
  useEffect(() => {
    async function load() {
      const data = await getAllRoutes();
      if (data) {
        setRoutes(data);
        if (data.length > 0) {
          setCurrentRouteId((prev) => {
            if (data.some((r) => r.id === prev)) return prev;
            return data[0].id;
          });
        } else {
          setCurrentRouteId('');
        }
      }
    }
    load();
  }, []);

  // Compute dynamic list of all available regions (from routes + presets)
  const availableRegionsForFilter = useMemo(() => {
    const routeRegions = routes.map(r => r.region || r.operatingCompany).filter(Boolean);
    const presetRegions = STAGECOACH_UK_REGIONS.map(r => r.regionName);
    const combined = Array.from(new Set([...routeRegions, ...presetRegions]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [routes]);

  // Compute available garages for currently selected region
  const availableGaragesForFilter = useMemo(() => {
    if (!selectedRegionFilter) {
      const routeGarages = routes.map(r => r.depot).filter(Boolean);
      const presetGarages = STAGECOACH_UK_REGIONS.flatMap(r => r.garages);
      return Array.from(new Set([...routeGarages, ...presetGarages])).sort((a, b) => a.localeCompare(b));
    }
    
    // Garages for selected region
    const routeGarages = routes
      .filter(r => (r.region || r.operatingCompany)?.toLowerCase() === selectedRegionFilter.toLowerCase())
      .map(r => r.depot)
      .filter(Boolean);
    
    const presetObj = STAGECOACH_UK_REGIONS.find(r => r.regionName.toLowerCase() === selectedRegionFilter.toLowerCase());
    const presetGarages = presetObj ? presetObj.garages : [];
    
    return Array.from(new Set([...routeGarages, ...presetGarages])).sort((a, b) => a.localeCompare(b));
  }, [routes, selectedRegionFilter]);

  // Handle region filter change with auto garage validation
  const setSelectedRegionFilter = (region: string) => {
    setSelectedRegionFilterState(region);
    if (!region) {
      setSelectedGarageFilterState('');
    } else {
      // If the current garage is not valid for this new region, reset it
      const validForRegion = routes
        .filter(r => (r.region || r.operatingCompany)?.toLowerCase() === region.toLowerCase())
        .map(r => r.depot?.toLowerCase())
        .concat((STAGECOACH_UK_REGIONS.find(r => r.regionName.toLowerCase() === region.toLowerCase())?.garages || []).map(g => g.toLowerCase()));
      
      if (selectedGarageFilter && !validForRegion.includes(selectedGarageFilter.toLowerCase())) {
        setSelectedGarageFilterState('');
      }
    }
  };

  const setSelectedGarageFilter = (garage: string) => {
    setSelectedGarageFilterState(garage);
  };

  // Filter routes based on 3-tier cascading selections
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const rRegion = (r.region || r.operatingCompany || '').toLowerCase();
      const rDepot = (r.depot || '').toLowerCase();
      
      const matchRegion = !selectedRegionFilter || rRegion === selectedRegionFilter.toLowerCase();
      const matchGarage = !selectedGarageFilter || rDepot === selectedGarageFilter.toLowerCase() || rDepot.includes(selectedGarageFilter.toLowerCase());
      
      return matchRegion && matchGarage;
    });
  }, [routes, selectedRegionFilter, selectedGarageFilter]);

  // Keep currentRoute in sync with filtered list
  useEffect(() => {
    if (filteredRoutes.length > 0) {
      if (!filteredRoutes.some(r => r.id === currentRouteId)) {
        setCurrentRouteId(filteredRoutes[0].id);
      }
    } else if (routes.length === 0) {
      setCurrentRouteId('');
    }
  }, [filteredRoutes, currentRouteId, routes.length]);

  const currentRoute = routes.find((r) => r.id === currentRouteId) || filteredRoutes[0] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const showConfirmModal = (config: Omit<ConfirmModalState, 'isOpen'>) => {
    setConfirmModal({
      isOpen: true,
      ...config,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const selectRoute = (id: string) => {
    setCurrentRouteId(id);
    const target = routes.find((r) => r.id === id);
    if (target) {
      showToast(`Switched to Route ${target.routeNumber} (${target.region || target.operatingCompany || 'UK Network'})`);
    }
  };

  const updateCurrentRoute = (updater: (prev: RouteAssessment) => RouteAssessment) => {
    if (!currentRoute) return;
    const updated = updater(currentRoute);
    
    const distanceKm = calculateTotalRouteDistanceKm(updated.pathCoordinates);
    const estTime = calculateEstimatedRunningTime(distanceKm, updated.stops, updated.averageSpeedKph || 22);
    
    const finalized: RouteAssessment = {
      ...updated,
      totalDistanceKm: distanceKm,
      estimatedRunningTimeMin: estTime,
      updatedAt: new Date().toISOString(),
    };

    setRoutes((prev) => prev.map((r) => (r.id === finalized.id ? finalized : r)));
    saveRoute(finalized);
  };

  const saveCurrentRoute = async () => {
    if (currentRoute) {
      await saveRoute(currentRoute);
      showToast(`Route ${currentRoute.routeNumber} saved successfully.`);
    }
  };

  const createNewRoute = (
    routeNumber: string, 
    routeTitle: string, 
    region: string, 
    depot: string, 
    assessorName?: string
  ) => {
    const customRegion = region?.trim() || 'Stagecoach Highlands';
    const customDepot = depot?.trim() || 'Aviemore Depot';
    const assessor = assessorName?.trim() || 'Field Route Assessor';

    const newRoute: RouteAssessment = {
      id: `SC-RRA-${Date.now().toString(36).toUpperCase()}`,
      routeNumber: routeNumber?.trim() || 'New Route',
      routeTitle: routeTitle?.trim() || 'New Survey Corridor',
      region: customRegion,
      depot: customDepot,
      operatingCompany: customRegion,
      assessorName: assessor,
      assessmentDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'Draft',
      pathCoordinates: [],
      totalDistanceKm: 0,
      estimatedRunningTimeMin: 0,
      averageSpeedKph: 22,
      stops: [],
      hazards: [],
      vehicleRestrictions: {
        maxVehicleHeightM: 4.4,
        doubleDeckerAllowed: true,
        coachAllowed: true,
        evAllowed: true,
        notes: 'Initial clearance survey required'
      },
      governance: {
        assessorName: assessor,
        assessorRole: 'Route Risk Assessor',
        managerName: 'Operations Safety Manager',
        managerRole: 'Head of Operations',
        status: 'DRAFT'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRoutes((prev) => [newRoute, ...prev]);
    
    // Update active filters so the new route is immediately visible and selected
    if (selectedRegionFilter && selectedRegionFilter.toLowerCase() !== customRegion.toLowerCase()) {
      setSelectedRegionFilterState(customRegion);
    }
    if (selectedGarageFilter && selectedGarageFilter.toLowerCase() !== customDepot.toLowerCase()) {
      setSelectedGarageFilterState(customDepot);
    }
    
    setCurrentRouteId(newRoute.id);
    saveRoute(newRoute);
    showToast(`Created Route ${newRoute.routeNumber} (${customRegion} - ${customDepot})`);
  };

  const deleteCurrentRoute = async () => {
    if (!currentRoute) return;
    const toDeleteId = currentRoute.id;
    await deleteRouteApi(toDeleteId);
    setRoutes((prev) => {
      const remaining = prev.filter((r) => r.id !== toDeleteId);
      if (remaining.length > 0) {
        setCurrentRouteId(remaining[0].id);
      } else {
        setCurrentRouteId('');
      }
      return remaining;
    });
    showToast('Route deleted');
  };

  const resetToCleanSlate = () => {
    resetMockDataApi();
    setRoutes([]);
    setCurrentRouteId('');
    setSelectedRegionFilterState('');
    setSelectedGarageFilterState('');
    showToast('Cleared all routes - Clean slate ready for custom testing');
  };

  const loadSampleTemplateRoutes = async () => {
    const templates = await loadSampleTemplatesApi();
    setRoutes(templates);
    if (templates.length > 0) {
      setSelectedRegionFilterState('Stagecoach Highlands');
      setSelectedGarageFilterState('Aviemore');
      setCurrentRouteId(templates[0].id);
    }
    showToast('Loaded Scottish Highlands reference routes');
  };

  // GIS Path Operations
  const addPathPoint = (coord: [number, number]) => {
    updateCurrentRoute((prev) => ({
      ...prev,
      pathCoordinates: [...prev.pathCoordinates, coord],
    }));
  };

  const undoPathPoint = () => {
    if (!currentRoute || currentRoute.pathCoordinates.length === 0) return;
    updateCurrentRoute((prev) => ({
      ...prev,
      pathCoordinates: prev.pathCoordinates.slice(0, -1),
    }));
    showToast('Removed last path coordinate');
  };

  const reversePath = () => {
    if (!currentRoute || currentRoute.pathCoordinates.length === 0) return;
    updateCurrentRoute((prev) => ({
      ...prev,
      pathCoordinates: [...prev.pathCoordinates].reverse(),
    }));
    showToast('Route path reversed');
  };

  const clearPath = () => {
    showConfirmModal({
      title: 'Clear Route Path?',
      message: 'This will erase all drawn GPS path coordinates for this route. Stops and Hazards will remain intact.',
      confirmText: 'Clear Path',
      isDestructive: true,
      onConfirm: () => {
        updateCurrentRoute((prev) => ({
          ...prev,
          pathCoordinates: [],
        }));
        showToast('Route path cleared');
      },
    });
  };

  const startOver = () => {
    showConfirmModal({
      title: 'Start Over Route Assessment?',
      message: 'This will reset all drawn path coordinates, stops, and hazards on this route to blank. This action cannot be undone.',
      confirmText: 'Start Over',
      isDestructive: true,
      onConfirm: () => {
        updateCurrentRoute((prev) => ({
          ...prev,
          pathCoordinates: [],
          stops: [],
          hazards: [],
          totalDistanceKm: 0,
          estimatedRunningTimeMin: 0,
        }));
        showToast('Route reset to blank state');
      },
    });
  };

  return (
    <RouteContext.Provider
      value={{
        routes,
        filteredRoutes,
        currentRouteId,
        currentRoute,
        activeTab,
        setActiveTab,
        gisToolMode,
        setGisToolMode,
        selectRoute,
        selectedRegionFilter,
        setSelectedRegionFilter,
        selectedGarageFilter,
        setSelectedGarageFilter,
        availableRegionsForFilter,
        availableGaragesForFilter,
        updateCurrentRoute,
        saveCurrentRoute,
        createNewRoute,
        deleteCurrentRoute,
        resetToCleanSlate,
        loadSampleTemplateRoutes,
        pendingCoords,
        setPendingCoords,
        pendingStopType,
        setPendingStopType,
        isAddStopModalOpen,
        setIsAddStopModalOpen,
        isAddHazardModalOpen,
        setIsAddHazardModalOpen,
        selectedHazardForModal,
        setSelectedHazardForModal,
        confirmModal,
        showConfirmModal,
        hideConfirmModal,
        isGpsTracking,
        setIsGpsTracking,
        userGpsPosition,
        setUserGpsPosition,
        gpsAccuracyMeters,
        setUserGpsAccuracy,
        tileLayer,
        setTileLayer,
        toastMessage,
        showToast,
        addPathPoint,
        undoPathPoint,
        reversePath,
        clearPath,
        startOver,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRouteContext() {
  const ctx = useContext(RouteContext);
  if (!ctx) {
    throw new Error('useRouteContext must be used within a RouteProvider');
  }
  return ctx;
}
