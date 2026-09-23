"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { 
  RouteAssessment, 
  GisToolMode, 
  HazardObservation, 
  HazardCategory,
  RouteStop, 
  StopType,
  SurveyStatus,
  SurveyPauseReason,
  SurveyPauseLog,
  LiveSurveyTelemetry
} from '@/types/route';
import { initialMockRoutes } from '@/lib/mockData';
import { 
  getAllRoutes, 
  saveRoute, 
  deleteRoute as deleteRouteApi, 
  resetMockData as resetMockDataApi
} from '@/lib/firestore';
import { 
  calculateTotalRouteDistanceKm, 
  calculateEstimatedRunningTime,
  calculateHaversineDistanceKm,
  kmToMiles,
  mpsToMph,
  calculateTrueAverageSpeed
} from '@/lib/calculations';

export type ActiveTab = 'map' | 'hazards' | 'fleet' | 'driver' | 'governance' | 'assignments';

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
  
  // Live Survey Engine (Start, Pause, Resume, Stop)
  surveyStatus: SurveyStatus;
  surveyElapsedSeconds: number;
  surveyActiveSeconds: number;
  surveyPausedSeconds: number;
  surveyCurrentSpeedMph: number;
  surveyAverageSpeedMph: number;
  surveyAverageSpeedKph: number;
  surveyDistanceMiles: number;
  surveyDistanceKm: number;
  surveyPauseLogs: SurveyPauseLog[];
  activePauseReason: SurveyPauseReason | string;
  isPauseModalOpen: boolean;
  setIsPauseModalOpen: (open: boolean) => void;
  isSurveySummaryModalOpen: boolean;
  setIsSurveySummaryModalOpen: (open: boolean) => void;
  isSetRiskModalOpen: boolean;
  setIsSetRiskModalOpen: (open: boolean) => void;
  isCategorisationWizardOpen: boolean;
  setIsCategorisationWizardOpen: (open: boolean) => void;
  isAutoCenterMap: boolean;
  setIsAutoCenterMap: (autoCenter: boolean) => void;
  startLiveSurvey: () => void;
  pauseLiveSurvey: (reason?: SurveyPauseReason | string) => void;
  resumeLiveSurvey: () => void;
  stopLiveSurvey: () => void;
  resetLiveSurvey: () => void;
  quickSaveRiskHazard: (data: {
    title?: string;
    category?: HazardCategory;
    riskDescription: string;
    controlMeasure: string;
    photos?: string[];
    lat: number;
    lng: number;
    locationName?: string;
  }) => void;
  batchUpdateStopCategories: (updatedStops: RouteStop[]) => void;
  recordGpsBreadcrumb: (lat: number, lng: number, speedMps?: number | null, accuracyMeters?: number | null) => void;
  
  // Dynamic Cascading Filters built strictly from database routes
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
  assignRouteToAssessor: (routeId: string, assessorId: string, assessorName: string, targetDate?: string, notes?: string) => Promise<void>;
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
  
  // Live Survey Telemetry States
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>('idle');
  const [surveyElapsedSeconds, setSurveyElapsedSeconds] = useState<number>(0);
  const [surveyActiveSeconds, setSurveyActiveSeconds] = useState<number>(0);
  const [surveyPausedSeconds, setSurveyPausedSeconds] = useState<number>(0);
  const [surveyCurrentSpeedMph, setSurveyCurrentSpeedMph] = useState<number>(0);
  const [surveyAverageSpeedMph, setSurveyAverageSpeedMph] = useState<number>(0);
  const [surveyAverageSpeedKph, setSurveyAverageSpeedKph] = useState<number>(0);
  const [surveyDistanceMiles, setSurveyDistanceMiles] = useState<number>(0);
  const [surveyDistanceKm, setSurveyDistanceKm] = useState<number>(0);
  const [surveyPauseLogs, setSurveyPauseLogs] = useState<SurveyPauseLog[]>([]);
  const [activePauseReason, setActivePauseReason] = useState<SurveyPauseReason | string>('Hazard Site Inspection');
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isSurveySummaryModalOpen, setIsSurveySummaryModalOpen] = useState(false);
  const [isSetRiskModalOpen, setIsSetRiskModalOpen] = useState(false);
  const [isCategorisationWizardOpen, setIsCategorisationWizardOpen] = useState(false);
  const [isAutoCenterMap, setIsAutoCenterMap] = useState(true);

  const currentPauseLogRef = useRef<SurveyPauseLog | null>(null);
  const lastRecordedCoordRef = useRef<[number, number] | null>(null);

  // Live Survey Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (surveyStatus === 'recording') {
      interval = setInterval(() => {
        setSurveyElapsedSeconds((prev) => prev + 1);
        setSurveyActiveSeconds((prev) => {
          const nextActive = prev + 1;
          if (nextActive > 3 && surveyDistanceKm > 0) {
            const { speedKph, speedMph } = calculateTrueAverageSpeed(surveyDistanceKm, nextActive);
            setSurveyAverageSpeedKph(speedKph);
            setSurveyAverageSpeedMph(speedMph);
          }
          return nextActive;
        });
      }, 1000);
    } else if (surveyStatus === 'paused') {
      interval = setInterval(() => {
        setSurveyElapsedSeconds((prev) => prev + 1);
        setSurveyPausedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [surveyStatus, surveyDistanceKm]);

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

  // 100% DYNAMIC: Regions derived ONLY from routes saved in the database
  const availableRegionsForFilter = useMemo(() => {
    const routeRegions = routes
      .map(r => r.region || r.operatingCompany)
      .filter((reg): reg is string => Boolean(reg && reg.trim()));
    return Array.from(new Set(routeRegions)).sort((a, b) => a.localeCompare(b));
  }, [routes]);

  // 100% DYNAMIC: Garages derived ONLY from routes saved in the database
  const availableGaragesForFilter = useMemo(() => {
    if (!selectedRegionFilter) {
      const routeGarages = routes
        .map(r => r.depot)
        .filter((dep): dep is string => Boolean(dep && dep.trim()));
      return Array.from(new Set(routeGarages)).sort((a, b) => a.localeCompare(b));
    }
    
    // If a region is selected, list only garages from routes belonging to that region
    const routeGarages = routes
      .filter(r => (r.region || r.operatingCompany)?.toLowerCase().trim() === selectedRegionFilter.toLowerCase().trim())
      .map(r => r.depot)
      .filter((dep): dep is string => Boolean(dep && dep.trim()));
    
    return Array.from(new Set(routeGarages)).sort((a, b) => a.localeCompare(b));
  }, [routes, selectedRegionFilter]);

  // Handle region filter change with auto garage validation
  const setSelectedRegionFilter = (region: string) => {
    setSelectedRegionFilterState(region);
    if (!region) {
      setSelectedGarageFilterState('');
    } else {
      // Check if current garage exists in the newly selected region's routes
      const validGaragesForRegion = routes
        .filter(r => (r.region || r.operatingCompany)?.toLowerCase().trim() === region.toLowerCase().trim())
        .map(r => r.depot?.toLowerCase().trim());
      
      if (selectedGarageFilter && !validGaragesForRegion.includes(selectedGarageFilter.toLowerCase().trim())) {
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
      const rRegion = (r.region || r.operatingCompany || '').toLowerCase().trim();
      const rDepot = (r.depot || '').toLowerCase().trim();
      
      const matchRegion = !selectedRegionFilter || rRegion === selectedRegionFilter.toLowerCase().trim();
      const matchGarage = !selectedGarageFilter || rDepot === selectedGarageFilter.toLowerCase().trim();
      
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
    const customRegion = region?.trim() || 'Stagecoach';
    const customDepot = depot?.trim() || 'Depot';
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
    
    // Automatically set active filters to the new route's region and depot
    setSelectedRegionFilterState(customRegion);
    setSelectedGarageFilterState(customDepot);
    
    setCurrentRouteId(newRoute.id);
    saveRoute(newRoute);
    showToast(`Created Route ${newRoute.routeNumber} in ${customRegion} (${customDepot})`);
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
    showToast('Cleared all routes - Database is clean and empty');
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

  const startLiveSurvey = () => {
    setSurveyStatus('recording');
    setIsGpsTracking(true);
    setGisToolMode('browse');
    showToast('Live RRA Survey Started — Active Moving Speed Recording');
  };

  const pauseLiveSurvey = (reason?: SurveyPauseReason | string) => {
    const pauseReason = reason || activePauseReason || 'Hazard Site Inspection';
    setActivePauseReason(pauseReason);
    const newPauseLog: SurveyPauseLog = {
      id: 'pause_' + Date.now(),
      pausedAt: new Date().toISOString(),
      durationSeconds: 0,
      reason: pauseReason,
      coordinates: userGpsPosition || undefined
    };
    currentPauseLogRef.current = newPauseLog;
    setSurveyStatus('paused');
    setIsPauseModalOpen(false);
    showToast(`Survey Paused (${pauseReason}) — Average Speed Protected`);
  };

  const resumeLiveSurvey = () => {
    if (currentPauseLogRef.current) {
      const now = new Date();
      const pausedAt = new Date(currentPauseLogRef.current.pausedAt);
      const durationSec = Math.max(1, Math.round((now.getTime() - pausedAt.getTime()) / 1000));
      const finalizedLog: SurveyPauseLog = {
        ...currentPauseLogRef.current,
        resumedAt: now.toISOString(),
        durationSeconds: durationSec
      };
      setSurveyPauseLogs((prev) => [...prev, finalizedLog]);
      currentPauseLogRef.current = null;
    }
    setSurveyStatus('recording');
    setIsGpsTracking(true);
    showToast('Survey Resumed — Corridor Tracing Active');
  };

  const stopLiveSurvey = () => {
    let finalPauseLogs = [...surveyPauseLogs];
    if (currentPauseLogRef.current) {
      const now = new Date();
      const pausedAt = new Date(currentPauseLogRef.current.pausedAt);
      const durationSec = Math.max(1, Math.round((now.getTime() - pausedAt.getTime()) / 1000));
      const finalizedLog: SurveyPauseLog = {
        ...currentPauseLogRef.current,
        resumedAt: now.toISOString(),
        durationSeconds: durationSec
      };
      finalPauseLogs.push(finalizedLog);
      setSurveyPauseLogs(finalPauseLogs);
      currentPauseLogRef.current = null;
    }

    setSurveyStatus('completed');
    
    // Save telemetry to current route
    if (currentRoute) {
      const finalTelemetry: LiveSurveyTelemetry = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        elapsedSeconds: surveyElapsedSeconds,
        activeMovingSeconds: surveyActiveSeconds,
        pausedSeconds: surveyPausedSeconds,
        currentSpeedMph: 0,
        averageMovingSpeedMph: surveyAverageSpeedMph,
        averageMovingSpeedKph: surveyAverageSpeedKph,
        recordedDistanceMiles: surveyDistanceMiles,
        recordedDistanceKm: surveyDistanceKm,
        pauseLogs: finalPauseLogs
      };

      updateCurrentRoute((prev) => ({
        ...prev,
        surveyTelemetry: finalTelemetry,
        totalDistanceKm: surveyDistanceKm > 0 ? surveyDistanceKm : prev.totalDistanceKm,
        averageSpeedKph: surveyAverageSpeedKph > 0 ? surveyAverageSpeedKph : prev.averageSpeedKph,
        updatedAt: new Date().toISOString()
      }));
    }

    setIsSurveySummaryModalOpen(true);
    showToast('Live Survey Finished — Telemetry Summary Ready');
  };

  const resetLiveSurvey = () => {
    setSurveyStatus('idle');
    setSurveyElapsedSeconds(0);
    setSurveyActiveSeconds(0);
    setSurveyPausedSeconds(0);
    setSurveyCurrentSpeedMph(0);
    setSurveyAverageSpeedMph(0);
    setSurveyAverageSpeedKph(0);
    setSurveyDistanceMiles(0);
    setSurveyDistanceKm(0);
    setSurveyPauseLogs([]);
    currentPauseLogRef.current = null;
    lastRecordedCoordRef.current = null;
    setIsSurveySummaryModalOpen(false);
    setIsPauseModalOpen(false);
    showToast('Survey Telemetry Reset');
  };

  const recordGpsBreadcrumb = (lat: number, lng: number, speedMps?: number | null, accuracyMeters?: number | null) => {
    setUserGpsPosition([lat, lng]);
    if (accuracyMeters !== undefined && accuracyMeters !== null) setUserGpsAccuracy(accuracyMeters);

    if (speedMps !== null && speedMps !== undefined && speedMps >= 0) {
      setSurveyCurrentSpeedMph(mpsToMph(speedMps));
    }

    // Only record breadcrumbs into the route corridor if survey is active/recording
    if (surveyStatus === 'recording') {
      const lastCoord = lastRecordedCoordRef.current;
      let shouldAppend = false;
      let stepDistanceKm = 0;

      if (!lastCoord) {
        shouldAppend = true;
      } else {
        stepDistanceKm = calculateHaversineDistanceKm(lastCoord[0], lastCoord[1], lat, lng);
        // Minimum 5m movement to avoid GPS jitter, max 1km to avoid teleports
        if (stepDistanceKm >= 0.005 && stepDistanceKm < 1.0) {
          shouldAppend = true;
        }
      }

      if (shouldAppend) {
        lastRecordedCoordRef.current = [lat, lng];
        setSurveyDistanceKm((prevKm) => {
          const nextKm = parseFloat((prevKm + stepDistanceKm).toFixed(3));
          setSurveyDistanceMiles(kmToMiles(nextKm));
          return nextKm;
        });

        updateCurrentRoute((prev) => {
          const nextCoords: [number, number][] = [...prev.pathCoordinates, [lat, lng]];
          const nextDistance = calculateTotalRouteDistanceKm(nextCoords);
          const nextRunningTime = calculateEstimatedRunningTime(nextDistance, prev.stops, surveyAverageSpeedKph || 22);
          return {
            ...prev,
            pathCoordinates: nextCoords,
            totalDistanceKm: nextDistance,
            estimatedRunningTimeMin: nextRunningTime,
            updatedAt: new Date().toISOString()
          };
        });
      }
    }
  };

  const assignRouteToAssessor = async (
    routeId: string, 
    assessorId: string, 
    assessorName: string, 
    targetDate?: string, 
    notes?: string
  ) => {
    setRoutes((prev) => {
      const updated = prev.map((r) => {
        if (r.id === routeId) {
          const mod: RouteAssessment = {
            ...r,
            assessorName: assessorName,
            assignedToAssessorId: assessorId,
            assignedAssessorName: assessorName,
            targetCompletionDate: targetDate,
            assignmentNotes: notes,
            status: r.status === 'Draft' ? 'Requires Review' : r.status,
            updatedAt: new Date().toISOString()
          };
          saveRoute(mod);
          return mod;
        }
        return r;
      });
      return updated;
    });
    showToast(`Assigned Route to ${assessorName}`);
  };

  const quickSaveRiskHazard = (data: {
    title?: string;
    category?: HazardCategory;
    riskDescription: string;
    controlMeasure: string;
    photos?: string[];
    lat: number;
    lng: number;
    locationName?: string;
  }) => {
    if (!currentRoute) return;
    const autoTitle = data.title?.trim() || data.category || 'Live Risk Observation';
    const autoLoc = data.locationName?.trim() || `GPS [${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}]`;

    const newHazard: HazardObservation = {
      id: 'haz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: autoTitle,
      category: data.category || 'Other Operational Hazard',
      lat: data.lat,
      lng: data.lng,
      locationName: autoLoc,
      severity: 3,
      likelihood: 3,
      initialScore: 9,
      residualSeverity: 2,
      residualLikelihood: 2,
      residualScore: 4,
      controlMeasures: data.controlMeasure,
      riskDescription: data.riskDescription,
      controlMeasure: data.controlMeasure,
      photos: data.photos || [],
      timestamp: new Date().toISOString(),
    };

    updateCurrentRoute((prev) => ({
      ...prev,
      hazards: [...(prev.hazards || []), newHazard],
      updatedAt: new Date().toISOString(),
    }));

    showToast(`🔴 Red Pin Risk Saved: ${autoTitle}`);
  };

  const batchUpdateStopCategories = (updatedStops: RouteStop[]) => {
    updateCurrentRoute((prev) => ({
      ...prev,
      stops: updatedStops,
      updatedAt: new Date().toISOString(),
    }));
    showToast('Stop categorisations successfully updated');
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
        surveyStatus,
        surveyElapsedSeconds,
        surveyActiveSeconds,
        surveyPausedSeconds,
        surveyCurrentSpeedMph,
        surveyAverageSpeedMph,
        surveyAverageSpeedKph,
        surveyDistanceMiles,
        surveyDistanceKm,
        surveyPauseLogs,
        activePauseReason,
        isPauseModalOpen,
        setIsPauseModalOpen,
        isSurveySummaryModalOpen,
        setIsSurveySummaryModalOpen,
        isSetRiskModalOpen,
        setIsSetRiskModalOpen,
        isCategorisationWizardOpen,
        setIsCategorisationWizardOpen,
        isAutoCenterMap,
        setIsAutoCenterMap,
        startLiveSurvey,
        pauseLiveSurvey,
        resumeLiveSurvey,
        stopLiveSurvey,
        resetLiveSurvey,
        quickSaveRiskHazard,
        batchUpdateStopCategories,
        recordGpsBreadcrumb,
        updateCurrentRoute,
        saveCurrentRoute,
        createNewRoute,
        deleteCurrentRoute,
        resetToCleanSlate,
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
        assignRouteToAssessor,
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
