"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { RouteStop, HazardObservation, StopType, GisToolMode } from '@/types/route';
import { getRiskLevel } from '@/lib/calculations';
import GisToolbar from './GisToolbar';
import MobileGisSheet from './MobileGisSheet';
import HazardDetailModal from './HazardDetailModal';
import AddStopModal from './AddStopModal';
import AddHazardModal from './AddHazardModal';
import LiveSurveyControlBar from './LiveSurveyControlBar';
import SurveyPauseModal from './SurveyPauseModal';
import SurveySummaryModal from './SurveySummaryModal';
import QuickSetRiskModal from './QuickSetRiskModal';
import StopCategorisationWizard from './StopCategorisationWizard';
import { usePwa } from '@/context/PwaContext';
import { 
  Maximize2, 
  Minimize2, 
  Layers, 
  Navigation, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Bus, 
  Info, 
  Undo2, 
  ArrowLeftRight, 
  Trash2, 
  RotateCcw,
  PenTool,
  MousePointer,
  Crosshair,
  Locate
} from 'lucide-react';

let L: typeof import('leaflet') | null = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

export default function LeafletMap() {
  const {
    currentRoute,
    routes,
    gisToolMode,
    setGisToolMode,
    tileLayer,
    setTileLayer,
    setPendingCoords,
    setPendingStopType,
    setIsAddStopModalOpen,
    setIsAddHazardModalOpen,
    setSelectedHazardForModal,
    addPathPoint,
    undoPathPoint,
    reversePath,
    clearPath,
    startOver,
    isGpsTracking,
    setIsGpsTracking,
    userGpsPosition,
    setUserGpsPosition,
    showToast,
    surveyStatus,
    recordGpsBreadcrumb,
    isAutoCenterMap,
    setIsAutoCenterMap,
  } = useRouteContext();

  const { openPermissionsModal, requestGpsPermission, gpsPermission } = usePwa();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const wakeLockSentinelRef = useRef<any>(null);

  // Toggle Fullscreen with CSS viewport overlay + HTML5 API fallback
  const toggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    try {
      if (nextState) {
        if (mapWrapperRef.current?.requestFullscreen) {
          await mapWrapperRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      // Ignore native fullscreen errors; CSS fullscreen overlay functions seamlessly
    }
  };

  // Sync native fullscreen state (e.g. if user presses native Escape key)
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      const isNativeFull = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isNativeFull && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Screen Wake Lock handlers to keep mobile screen on during GPS survey
  const requestWakeLock = async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockSentinelRef.current) {
      try {
        wakeLockSentinelRef.current.release();
      } catch (err) {}
      wakeLockSentinelRef.current = null;
    }
  };

  // Re-acquire wake lock if mobile user minimizes and comes back while tracking
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isGpsTracking) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isGpsTracking]);

  // Initialize Map ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !L) return;

    const initialCenter: [number, number] = currentRoute?.pathCoordinates[0] || [57.3295, -3.6062];
    
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
    });

    // Place zoom controls at bottom-right so top-left and top-right are dedicated for action bars
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl =
      tileLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© Stagecoach GIS / OpenStreetMap',
    }).addTo(map);

    currentTileLayerRef.current = tiles;

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Continuous ResizeObserver to immediately resize Leaflet on any layout/fullscreen change
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    });
    ro.observe(mapContainerRef.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }
    const tileUrl =
      tileLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© Stagecoach GIS / OpenStreetMap',
    }).addTo(mapInstanceRef.current);

    currentTileLayerRef.current = tiles;
  }, [tileLayer]);

  // Recalculate dimensions smoothly across micro-frames on fullscreen toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const invalidate = () => mapInstanceRef.current?.invalidateSize({ animate: false });
    invalidate();
    const timers = [
      setTimeout(invalidate, 50),
      setTimeout(invalidate, 150),
      setTimeout(invalidate, 300),
      setTimeout(invalidate, 600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isFullscreen]);

  // Handle Map Click based on Active GIS Tool
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const coord: [number, number] = [lat, lng];

      if (gisToolMode === 'draw_path') {
        addPathPoint(coord);
        showToast(`Added path node (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } else if (
        gisToolMode === 'drop_bus_stop' ||
        gisToolMode === 'drop_popup_stop' ||
        gisToolMode === 'drop_junction' ||
        gisToolMode === 'drop_roadworks' ||
        gisToolMode === 'drop_other'
      ) {
        setPendingCoords(coord);
        let type: StopType = 'bus_stop';
        if (gisToolMode === 'drop_popup_stop') type = 'popup_stop';
        if (gisToolMode === 'drop_junction') type = 'junction';
        if (gisToolMode === 'drop_roadworks') type = 'roadworks';
        if (gisToolMode === 'drop_other') type = 'other';
        setPendingStopType(type);
        setIsAddStopModalOpen(true);
      } else if (gisToolMode === 'drop_hazard') {
        setPendingCoords(coord);
        setIsAddHazardModalOpen(true);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [gisToolMode, addPathPoint, setPendingCoords, setPendingStopType, setIsAddStopModalOpen, setIsAddHazardModalOpen, showToast]);

  // Render Path & Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !L || !currentRoute) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    if (currentRoute.pathCoordinates && currentRoute.pathCoordinates.length > 0) {
      const polyline = L.polyline(currentRoute.pathCoordinates, {
        color: '#002D62',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(map);

      polylineLayerRef.current = polyline;
    }

    currentRoute.stops.forEach((stop) => {
      let iconEmoji = '🚏';
      let bgColor = 'bg-sky-600';
      let labelType = 'Bus Stop';

      if (stop.stopType === 'main_stop_time_point' || (stop.stopType as string) === 'popup_stop') {
        iconEmoji = '⏱️';
        bgColor = 'bg-blue-600 ring-2 ring-amber-400';
        labelType = 'Main Stop ("Time Point")';
      } else if (stop.stopType === 'bus_stop_regular' || (stop.stopType as string) === 'bus_stop') {
        iconEmoji = '🚏';
        bgColor = 'bg-sky-600';
        labelType = 'Bus Stop (Not Time Point)';
      } else if (stop.stopType === 'junction') {
        iconEmoji = '🚦';
        bgColor = 'bg-purple-600';
        labelType = 'Main Road Junction';
      } else if (stop.stopType === 'roadworks_long_term' || (stop.stopType as string) === 'roadworks') {
        iconEmoji = '🚧';
        bgColor = 'bg-emerald-600';
        labelType = 'Planned Roadworks (9m-3yr)';
      } else if (stop.stopType === 'other') {
        iconEmoji = '📍';
        bgColor = 'bg-amber-500';
        labelType = 'Other';
      }

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgColor} text-white shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform">
            <span class="text-xs">${iconEmoji}</span>
            <span class="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
              ${stop.dwellMinutes}m
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(markersGroup);
      
      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 180px; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${stop.name}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            Type: <strong>${labelType}</strong>
          </div>
          <div style="font-size: 11px; color: #475569;">
            Dwell Time: <strong>${stop.dwellMinutes} min</strong>
          </div>
          ${stop.notes ? `<div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">${stop.notes}</div>` : ''}
        </div>
      `);
    });

    currentRoute.hazards.forEach((hazard) => {
      const isHighRisk = hazard.residualScore >= 15;

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${isHighRisk ? 'bg-red-600 animate-bounce' : 'bg-red-600'} text-white shadow-2xl border-2 border-white cursor-pointer hover:scale-125 transition-transform">
            <span class="text-sm">⚠️</span>
            <span class="absolute -bottom-1.5 -right-1.5 bg-black text-white text-[9px] font-extrabold px-1 rounded-full border border-white">
              ${hazard.residualScore || 4}
            </span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon }).addTo(markersGroup);

      const popupDiv = document.createElement('div');
      popupDiv.style.fontFamily = 'inherit';
      popupDiv.style.minWidth = '240px';
      popupDiv.style.maxWidth = '280px';
      popupDiv.style.padding = '4px';

      let photosHtml = '';
      if (hazard.photos && hazard.photos.length > 0) {
        photosHtml = `
          <div style="display: flex; gap: 4px; margin-top: 6px; overflow-x: auto; padding-bottom: 2px;">
            ${hazard.photos.map(p => `<img src="${p}" style="width: 55px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />`).join('')}
          </div>
        `;
      }

      popupDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b91c1c;">⚠️ ${hazard.category}</span>
          <span style="font-size: 10px; font-weight: 800; background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 9999px;">
            Score: ${hazard.residualScore || 4}
          </span>
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.3;">${hazard.title}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">📍 ${hazard.locationName}</div>
        ${hazard.riskDescription ? `<div style="font-size: 11px; color: #991b1b; margin-top: 4px;"><strong>Risk:</strong> ${hazard.riskDescription}</div>` : ''}
        <div style="font-size: 11px; color: #15803d; margin-top: 4px; font-weight: 600;">
          🛡️ <strong>Control:</strong> ${hazard.controlMeasure || hazard.controlMeasures}
        </div>
        ${photosHtml}
        <button id="view-hazard-btn-${hazard.id}" style="margin-top: 8px; width: 100%; background: #002D62; color: white; border: none; border-radius: 8px; padding: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
          View Full Assessment Details
        </button>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-hazard-btn-${hazard.id}`);
        if (btn) {
          btn.onclick = (ev) => {
            ev.stopPropagation();
            setSelectedHazardForModal(hazard);
          };
        }
      });
    });

  }, [currentRoute, setSelectedHazardForModal]);

  const handleGpsError = (err: GeolocationPositionError) => {
    let msg = 'Could not acquire GPS position.';
    if (err.code === 1) { // PERMISSION_DENIED
      msg = 'Location permission is blocked. Please allow Location access in your browser to enable live GPS surveying.';
      openPermissionsModal();
    } else if (err.code === 2) { // POSITION_UNAVAILABLE
      msg = 'GPS signal unavailable. Please ensure Location Services are turned ON in your device settings.';
    } else if (err.code === 3) { // TIMEOUT
      msg = 'GPS fix timed out. Retrying with active cellular / Wi-Fi positioning...';
    }
    showToast(msg);
  };

  // Reactive GPS tracking watcher: automatically starts/stops whenever isGpsTracking or surveyStatus changes
  useEffect(() => {
    const isLive = isGpsTracking || surveyStatus === 'recording' || surveyStatus === 'paused';

    if (!isLive) {
      if (gpsWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      if (gpsMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      if (accuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      releaseWakeLock();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported in this browser environment.');
      return;
    }

    requestWakeLock();
    showToast('Acquiring live GPS fix (Screen Stay-Awake Active)...');

    // Immediate single fix to quickly center on surveyor
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const posCoord: [number, number] = [latitude, longitude];
        recordGpsBreadcrumb(latitude, longitude, speed, accuracy);

        if (mapInstanceRef.current && L) {
          // Center and zoom to user's location on initial fix
          mapInstanceRef.current.setView(posCoord, Math.max(mapInstanceRef.current.getZoom(), 16), { animate: true });

          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle(posCoord, {
              radius: accuracy || 15,
              color: '#0284c7',
              weight: 1,
              fillColor: '#0284c7',
              fillOpacity: 0.15,
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng(posCoord);
            accuracyCircleRef.current.setRadius(accuracy || 15);
          }

          if (!gpsMarkerRef.current) {
            gpsMarkerRef.current = L.circleMarker(posCoord, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: surveyStatus === 'paused' ? '#f59e0b' : surveyStatus === 'recording' ? '#10b981' : '#0284c7',
              fillOpacity: 0.95,
            }).addTo(mapInstanceRef.current);
          } else {
            gpsMarkerRef.current.setLatLng(posCoord);
          }
        }
        showToast(`GPS Position Fixed (±${Math.round(accuracy || 5)}m accuracy)`);
      },
      (err) => {
        console.warn('Initial GPS fetch notice:', err);
        handleGpsError(err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    // Continuous watchPosition
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const posCoord: [number, number] = [latitude, longitude];
        recordGpsBreadcrumb(latitude, longitude, speed, accuracy);

        if (mapInstanceRef.current && L) {
          // Keep GPS location strictly centered on screen and move map as vehicle moves
          if (isAutoCenterMap || surveyStatus === 'recording') {
            mapInstanceRef.current.panTo(posCoord, { animate: true, duration: 0.8 });
          }

          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle(posCoord, {
              radius: accuracy || 15,
              color: '#0284c7',
              weight: 1,
              fillColor: '#0284c7',
              fillOpacity: 0.15,
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng(posCoord);
            accuracyCircleRef.current.setRadius(accuracy || 15);
          }

          if (!gpsMarkerRef.current) {
            gpsMarkerRef.current = L.circleMarker(posCoord, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: surveyStatus === 'paused' ? '#f59e0b' : surveyStatus === 'recording' ? '#10b981' : '#0284c7',
              fillOpacity: 0.95,
            }).addTo(mapInstanceRef.current);
          } else {
            gpsMarkerRef.current.setLatLng(posCoord);
            gpsMarkerRef.current.setStyle({
              fillColor: surveyStatus === 'paused' ? '#f59e0b' : surveyStatus === 'recording' ? '#10b981' : '#0284c7',
            });
          }
        }
      },
      (err) => {
        console.error('GPS Watch error:', err);
        handleGpsError(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );

    gpsWatchIdRef.current = watchId;

    return () => {
      if (gpsWatchIdRef.current !== null && navigator && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [isGpsTracking, surveyStatus]);

  const handleToggleGps = () => {
    if (isGpsTracking || surveyStatus !== 'idle') {
      setIsGpsTracking(false);
      setUserGpsPosition(null);
      showToast('GPS Survey Tracking stopped');
    } else {
      setIsGpsTracking(true);
    }
  };

  const handleLocateMe = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    showToast('Locating your position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const posCoord: [number, number] = [latitude, longitude];
        setUserGpsPosition(posCoord);

        if (mapInstanceRef.current && L) {
          mapInstanceRef.current.setView(posCoord, 16, { animate: true });

          if (!gpsMarkerRef.current) {
            gpsMarkerRef.current = L.circleMarker(posCoord, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: '#0284c7',
              fillOpacity: 0.95,
            }).addTo(mapInstanceRef.current);
          } else {
            gpsMarkerRef.current.setLatLng(posCoord);
          }

          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle(posCoord, {
              radius: accuracy || 15,
              color: '#0284c7',
              weight: 1,
              fillColor: '#0284c7',
              fillOpacity: 0.15,
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng(posCoord);
            accuracyCircleRef.current.setRadius(accuracy || 15);
          }
          if (accuracy && accuracy > 5000) {
            showToast(`PC Location (ISP Hub): [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] (±${Math.round(accuracy / 1000)}km). Note: Mobile phones in the field use real satellite GPS (2-5m accuracy).`);
          } else {
            showToast(`Located: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] (±${Math.round(accuracy || 5)}m)`);
          }
        }
      },
      (err) => {
        setIsLocating(false);
        handleGpsError(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCenterMap = () => {
    if (!mapInstanceRef.current || !currentRoute) return;
    if (currentRoute.pathCoordinates.length > 0 && polylineLayerRef.current) {
      mapInstanceRef.current.fitBounds(polylineLayerRef.current.getBounds(), {
        padding: [50, 50],
      });
      showToast('Map centered to route geometry');
    } else if (currentRoute.stops.length > 0) {
      const latlngs = currentRoute.stops.map((s) => [s.lat, s.lng] as [number, number]);
      mapInstanceRef.current.fitBounds(latlngs, { padding: [50, 50] });
    }
  };

  const totalDwellMin = currentRoute?.stops.reduce((sum, s) => sum + (s.dwellMinutes || 1), 0) || 0;
  const totalDriveMin = Math.max(0, (currentRoute?.estimatedRunningTimeMin || 0) - totalDwellMin);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24 md:pb-12">
        
        {/* Live Route Profile & Timetable Metrics Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-stagecoach-blue font-black text-xs uppercase">
                  Service {currentRoute?.routeNumber}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {currentRoute?.routeTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                <strong>Region:</strong> {currentRoute?.region || currentRoute?.operatingCompany} • <strong>Garage:</strong> {currentRoute?.depot} • <strong>Surveyor:</strong> {currentRoute?.assessorName} • <strong>Date:</strong> {currentRoute?.assessmentDate}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>RRA {currentRoute?.status?.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Route Distance</span>
              <strong className="text-sm font-black text-stagecoach-navy">{currentRoute?.totalDistanceKm} km</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Driving Time</span>
              <strong className="text-sm font-black text-stagecoach-blue">{totalDriveMin} min</strong>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 font-medium block">Total Dwell Time</span>
              <strong className="text-sm font-black text-amber-700">{totalDwellMin} min</strong>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-medium block">Total Cycle Time</span>
              <strong className="text-sm font-black text-emerald-700">{currentRoute?.estimatedRunningTimeMin} min</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Bus Stops / Points</span>
              <strong className="text-sm font-black text-slate-700">{currentRoute?.stops.length}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Active Hazards</span>
              <strong className="text-sm font-black text-red-600">{currentRoute?.hazards.length}</strong>
            </div>
          </div>
        </div>

        {/* Live Survey Control HUD (Start / Pause / Resume / Stop) */}
        <LiveSurveyControlBar />

        {/* Main 2-Column GIS Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: GIS Toolboxes */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            
            {/* Box 1: GIS Drawing Tools */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  GIS Drawing Tools
                </span>
                <span className="text-[10px] bg-blue-100 text-stagecoach-blue font-bold px-2 py-0.5 rounded-full capitalize">
                  {gisToolMode.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setGisToolMode('browse')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'browse' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <MousePointer className="w-4 h-4" />
                    <span>Select & Inspect</span>
                  </span>
                  <span className="text-[10px] opacity-75">Pan/Click</span>
                </button>

                <button
                  onClick={() => setGisToolMode('draw_path')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'draw_path' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span>Draw / Extend Route Path</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click Map</span>
                </button>

                <button
                  onClick={() => setGisToolMode('drop_bus_stop')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'drop_bus_stop' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">🚏</span>
                    <span>Drop Bus Stop (Permanent)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">1 min dwell</span>
                </button>

                <button
                  onClick={() => setGisToolMode('drop_popup_stop')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'drop_popup_stop' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">🚧</span>
                    <span>Drop Pop-up Stop (Temp)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Diversion</span>
                </button>

                <button
                  onClick={() => setGisToolMode('drop_junction')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'drop_junction' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">🚦</span>
                    <span>Drop Critical Junction</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Lights/Roundabout</span>
                </button>

                <button
                  onClick={() => setGisToolMode('drop_roadworks')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'drop_roadworks' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">🏗️</span>
                    <span>Drop Roadworks (2-3 Yrs)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Contraflow</span>
                </button>

                <button
                  onClick={() => setGisToolMode('drop_hazard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition ${
                    gisToolMode === 'drop_hazard' ? 'bg-stagecoach-navy text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Pin Geotagged Hazard</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Photo/5×5</span>
                </button>
              </div>
            </div>

            {/* Box 2: Route Path Geometry Operations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-2.5">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider block border-b border-slate-100 pb-2">
                Route Path Operations
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={undoPathPoint}
                  disabled={!currentRoute || currentRoute.pathCoordinates.length === 0}
                  className="flex items-center justify-center space-x-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-700 transition disabled:opacity-40"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Undo Point</span>
                </button>

                <button
                  onClick={reversePath}
                  disabled={!currentRoute || currentRoute.pathCoordinates.length < 2}
                  className="flex items-center justify-center space-x-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-700 transition disabled:opacity-40"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reverse</span>
                </button>

                <button
                  onClick={clearPath}
                  disabled={!currentRoute || currentRoute.pathCoordinates.length === 0}
                  className="flex items-center justify-center space-x-1 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 font-semibold text-amber-800 transition disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Clear Path</span>
                </button>

                <button
                  onClick={startOver}
                  className="flex items-center justify-center space-x-1 p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 font-semibold text-red-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>

            {/* Box 3: GIS Layer & View Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-2.5">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider block border-b border-slate-100 pb-2">
                GIS Layer & View Controls
              </span>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setTileLayer(tileLayer === 'osm' ? 'satellite' : 'osm')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-700 transition"
                >
                  <span className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>{tileLayer === 'osm' ? 'Satellite Imagery' : 'Standard Streets'}</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">Switch</span>
                </button>

                <button
                  onClick={handleCenterMap}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-slate-700 transition"
                >
                  <span className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Center & Fit Route</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Zoom</span>
                </button>
              </div>
            </div>

            {/* Box 4: GPS Surveyor Deck */}
            <div className="bg-slate-900 text-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Navigation className="w-4 h-4" />
                  <span>GPS Surveyor Deck</span>
                </span>
                <div className="text-[10px] text-slate-400 font-medium">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isGpsTracking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  {isGpsTracking ? 'Tracking Active' : 'Idle'}
                </div>
              </div>

              <button
                onClick={handleToggleGps}
                className={`w-full flex items-center justify-center space-x-2 text-white font-bold text-xs py-2.5 rounded-xl shadow transition ${
                  isGpsTracking ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-stagecoach-amber hover:bg-amber-600'
                }`}
              >
                <Navigation className={`w-4 h-4 ${isGpsTracking ? 'animate-spin' : ''}`} />
                <span>{isGpsTracking ? 'Stop Live GPS Survey' : 'Start Live GPS Survey'}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800">
                <span className="text-slate-400">☀️ Screen Stay-Awake:</span>
                <span className={`font-bold ${isGpsTracking ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isGpsTracking ? 'ACTIVE (No Sleep)' : 'Standard'}
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Leaflet Map Card */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-3">
            
            {/* The Outer Wrapper that seamlessly handles Fullscreen without unmounting the Map */}
            <div 
              ref={mapWrapperRef}
              className={`${
                isFullscreen 
                  ? 'fixed inset-0 z-[9990] bg-slate-950 w-screen h-screen p-0 m-0 overflow-hidden' 
                  : 'bg-white p-3 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden'
              }`}
            >
              
              {/* === CARD VIEW ONLY: TOP PROMPT STRIP === */}
              {!isFullscreen && (
                <div className="bg-slate-100 text-slate-700 text-xs px-3.5 py-2 rounded-xl mb-2.5 flex items-center justify-between border border-slate-200">
                  <span className="font-semibold flex items-center space-x-2">
                    <Info className="w-4 h-4 text-stagecoach-blue flex-shrink-0" />
                    <span>
                      {gisToolMode === 'browse' && 'Browse mode: Click any stop, waypoint, or hazard to inspect.'}
                      {gisToolMode === 'draw_path' && 'Drawing mode: Click anywhere on the map to add route nodes.'}
                      {gisToolMode === 'drop_bus_stop' && 'Click map to place a Permanent Bus Stop.'}
                      {gisToolMode === 'drop_popup_stop' && 'Click map to place a Pop-up Temp Stop.'}
                      {gisToolMode === 'drop_junction' && 'Click map to place a Critical Junction.'}
                      {gisToolMode === 'drop_roadworks' && 'Click map to place 2-3 Year Roadworks.'}
                      {gisToolMode === 'drop_hazard' && 'Click map to pin a Geotagged 5×5 Hazard.'}
                    </span>
                  </span>
                  <button
                    onClick={() => setGisToolMode('browse')}
                    className="text-[11px] text-stagecoach-blue font-bold hover:underline cursor-pointer ml-2"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* === MAP CONTAINER VIEWPORT (100% Fullscreen via absolute inset-0) === */}
              <div className={`${
                isFullscreen 
                  ? 'absolute inset-0 w-full h-full min-h-screen z-10' 
                  : 'relative w-full h-[580px] sm:h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-inner'
              }`}>
                
                {/* 1. TOP-LEFT HUD */}
                {isFullscreen ? (
                  /* Fullscreen Top-Left Stats Badge */
                  <div className="absolute top-4 left-4 z-[1000] flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 text-xs text-white shadow-2xl pointer-events-none">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Route</span>
                      <strong className="font-bold text-amber-400">{currentRoute ? `Line ${currentRoute.routeNumber}` : 'Live Survey'}</strong>
                    </div>
                    <div className="h-5 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Distance</span>
                      <strong className="font-black text-amber-400">{currentRoute?.totalDistanceKm} km</strong>
                    </div>
                    <div className="h-5 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Nodes</span>
                      <strong className="font-black text-white">{currentRoute?.pathCoordinates.length || 0}</strong>
                    </div>
                    <div className="h-5 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Stops</span>
                      <strong className="font-black text-blue-400">{currentRoute?.stops.length || 0}</strong>
                    </div>
                  </div>
                ) : (
                  /* Normal Card View Floating Controls */
                  <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
                    <button
                      onClick={toggleFullscreen}
                      className="bg-slate-900/90 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur"
                      title="Expand Map to Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-stagecoach-amber" />
                      <span>Fullscreen</span>
                    </button>

                    <button
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      className={`bg-slate-900/90 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur ${
                        isLocating ? 'opacity-75' : ''
                      }`}
                      title="Center map on your current GPS location"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isLocating ? 'text-stagecoach-amber animate-spin' : 'text-sky-400'}`} />
                      <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
                    </button>

                    <button
                      onClick={() => setIsAutoCenterMap(!isAutoCenterMap)}
                      className={`bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur ${
                        isAutoCenterMap 
                          ? 'border-emerald-500/60 bg-slate-900 text-emerald-300 ring-1 ring-emerald-500/40' 
                          : 'text-slate-400'
                      }`}
                      title="Keeps your GPS location strictly centered on screen as the vehicle moves"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isAutoCenterMap ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                      <span>Follow: {isAutoCenterMap ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                )}

                {/* 2. TOP-RIGHT CONTROLS */}
                {isFullscreen ? (
                  /* Fullscreen Top-Right Control Bar (Locate + Follow + Exit Fullscreen) */
                  <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2">
                    <button
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      className={`bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700/80 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isLocating ? 'opacity-75' : ''
                      }`}
                      title="Center map on your current GPS location"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isLocating ? 'text-stagecoach-amber animate-spin' : 'text-sky-400'}`} />
                      <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Locate Me'}</span>
                    </button>

                    <button
                      onClick={() => setIsAutoCenterMap(!isAutoCenterMap)}
                      className={`px-3.5 py-2 rounded-2xl shadow-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-md ${
                        isAutoCenterMap 
                          ? 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/50' 
                          : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:bg-slate-800'
                      }`}
                      title="Keeps your GPS location strictly centered on screen as the vehicle moves"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isAutoCenterMap ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                      <span>Follow: {isAutoCenterMap ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="bg-stagecoach-amber hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-amber-300"
                      title="Exit Fullscreen (Esc)"
                    >
                      <Minimize2 className="w-4 h-4 text-slate-950" />
                      <span>Exit Fullscreen</span>
                    </button>
                  </div>
                ) : (
                  /* Normal Card View Top-Right HUD Stats */
                  <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-3 text-xs pointer-events-none">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Distance</span>
                      <strong className="font-black text-amber-400">{currentRoute?.totalDistanceKm} km</strong>
                    </div>
                    <div className="h-5 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Nodes</span>
                      <strong className="font-black text-white">{currentRoute?.pathCoordinates.length || 0}</strong>
                    </div>
                    <div className="h-5 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Stops</span>
                      <strong className="font-black text-blue-400">{currentRoute?.stops.length || 0}</strong>
                    </div>
                  </div>
                )}

                {/* 3. FULLSCREEN FLOATING BOTTOM-CENTER GIS TOOLS ISLAND */}
                {isFullscreen && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700/80 max-w-[calc(100vw-32px)]">
                    <button
                      onClick={() => setGisToolMode('browse')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'browse' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Select & Inspect elements"
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('draw_path')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'draw_path' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Draw / Extend Route Path"
                    >
                      <PenTool className="w-3.5 h-3.5 text-sky-400" />
                      <span>Draw</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('drop_bus_stop')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'drop_bus_stop' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Drop Bus Stop"
                    >
                      <span>🚏</span>
                      <span>Stop</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('drop_popup_stop')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'drop_popup_stop' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Drop Pop-up / Temporary Stop"
                    >
                      <span>🚧</span>
                      <span>Temp</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('drop_junction')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'drop_junction' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Drop Critical Junction"
                    >
                      <span>🚦</span>
                      <span>Junction</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('drop_roadworks')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'drop_roadworks' ? 'bg-stagecoach-blue text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Drop Long-term Roadworks (9m-3yr)"
                    >
                      <span>🏗️</span>
                      <span>Roadworks</span>
                    </button>

                    <button
                      onClick={() => setGisToolMode('drop_hazard')}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gisToolMode === 'drop_hazard' ? 'bg-red-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Drop Geotagged 5x5 Hazard"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hazard</span>
                    </button>

                    <div className="h-5 w-px bg-slate-700 mx-1"></div>

                    <button
                      onClick={undoPathPoint}
                      disabled={!currentRoute || currentRoute.pathCoordinates.length === 0}
                      className="p-1.5 rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
                      title="Undo last path point"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setTileLayer(tileLayer === 'osm' ? 'satellite' : 'osm')}
                      className="p-1.5 rounded-xl text-slate-300 hover:bg-slate-800 transition"
                      title={tileLayer === 'osm' ? 'Switch to Satellite View' : 'Switch to Street View'}
                    >
                      <Layers className="w-4 h-4 text-sky-400" />
                    </button>

                    <button
                      onClick={handleCenterMap}
                      className="p-1.5 rounded-xl text-slate-300 hover:bg-slate-800 transition"
                      title="Center & Fit Route"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                )}

                {/* THE MAP ELEMENT (Continuously Mounted in DOM - 100% Size) */}
                <div
                  ref={mapContainerRef}
                  className="w-full h-full min-h-[300px] bg-slate-950"
                />
              </div>

              {/* Bottom Legend (in Card view only) */}
              {!isFullscreen && (
                <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap">
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span><span>Time Point ⏱️</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span><span>Bus Stop 🚏</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span><span>Junction 🚦</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span><span>Roadworks (9m-3yr) 🚧</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span><span>Risk Event 🔴</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span><span>Other 📍</span></span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Highland GIS Engine • Scottish Grid
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      <HazardDetailModal />
      <AddStopModal />
      <AddHazardModal />
      <SurveyPauseModal />
      <SurveySummaryModal />
      <QuickSetRiskModal />
      <StopCategorisationWizard />
    </>
  );
}
