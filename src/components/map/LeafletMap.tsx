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
  MousePointer
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
  } = useRouteContext();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !L) return;

    const initialCenter: [number, number] = currentRoute?.pathCoordinates[0] || [57.3295, -3.6062];
    
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

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

  // Recalculate dimensions smoothly on fullscreen toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timers = [
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150),
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300),
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
      let bgColor = 'bg-blue-600';
      if (stop.stopType === 'popup_stop') {
        iconEmoji = '🚧';
        bgColor = 'bg-amber-600';
      } else if (stop.stopType === 'junction') {
        iconEmoji = '🚦';
        bgColor = 'bg-purple-600';
      } else if (stop.stopType === 'roadworks') {
        iconEmoji = '🏗️';
        bgColor = 'bg-orange-600';
      } else if (stop.stopType === 'other') {
        iconEmoji = '📍';
        bgColor = 'bg-slate-700';
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
            Type: <strong>${stop.stopType.replace('_', ' ').toUpperCase()}</strong>
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
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${isHighRisk ? 'bg-red-600 animate-bounce' : 'bg-amber-600'} text-white shadow-2xl border-2 border-white cursor-pointer hover:scale-125 transition-transform">
            <span class="text-sm">⚠️</span>
            <span class="absolute -bottom-1.5 -right-1.5 bg-black text-white text-[9px] font-extrabold px-1 rounded-full border border-white">
              ${hazard.residualScore}
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
      popupDiv.style.minWidth = '220px';
      popupDiv.style.padding = '4px';

      popupDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b91c1c;">⚠️ ${hazard.category}</span>
          <span style="font-size: 10px; font-weight: 800; background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 9999px;">
            Score: ${hazard.residualScore}
          </span>
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.3;">${hazard.title}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">📍 ${hazard.locationName}</div>
        <div style="font-size: 11px; color: #15803d; margin-top: 4px; font-weight: 600;">
          🛡️ ${hazard.controlMeasures.length > 55 ? hazard.controlMeasures.substring(0, 55) + '...' : hazard.controlMeasures}
        </div>
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

  const handleToggleGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    if (isGpsTracking) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      if (gpsMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      setIsGpsTracking(false);
      setUserGpsPosition(null);
      showToast('GPS Survey Tracking stopped');
    } else {
      setIsGpsTracking(true);
      showToast('Acquiring high-accuracy GPS fix...');

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const posCoord: [number, number] = [latitude, longitude];
          setUserGpsPosition(posCoord);

          if (mapInstanceRef.current && L) {
            if (!gpsMarkerRef.current) {
              gpsMarkerRef.current = L.circleMarker(posCoord, {
                radius: 8,
                color: '#ffffff',
                weight: 3,
                fillColor: '#0284c7',
                fillOpacity: 0.9,
              }).addTo(mapInstanceRef.current);
            } else {
              gpsMarkerRef.current.setLatLng(posCoord);
            }
          }
        },
        (err) => {
          console.error(err);
          showToast(`GPS Error: ${err.message}`);
          setIsGpsTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );
      gpsWatchIdRef.current = watchId;
    }
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
            </div>

          </div>

          {/* RIGHT COLUMN: Leaflet Map Card */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-3">
            
            {/* The Outer Wrapper that seamlessly handles Fullscreen without unmounting the Map */}
            <div className={`${
              isFullscreen 
                ? 'fixed inset-0 z-50 bg-slate-950 w-screen h-screen p-0 m-0 overflow-hidden' 
                : 'bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden'
            }`}>
              
              {/* Floating Fullscreen / Exit Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`absolute z-30 bg-slate-900/90 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isFullscreen ? 'top-4 right-14' : 'top-5 left-5'
                }`}
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map to Fullscreen'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-stagecoach-amber" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-stagecoach-amber" />
                    <span>Fullscreen</span>
                  </>
                )}
              </button>

              {/* Floating Toolbar inside Fullscreen */}
              {isFullscreen && (
                <div className="absolute top-4 left-4 z-30 pointer-events-auto">
                  <GisToolbar onCenterMap={handleCenterMap} onToggleGps={handleToggleGps} />
                </div>
              )}

              {/* Floating Top HUD Stats */}
              <div className={`absolute top-5 right-5 z-20 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-3 text-xs pointer-events-none ${
                isFullscreen ? 'hidden sm:flex' : ''
              }`}>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Distance</span>
                  <strong className="font-black text-amber-400">{currentRoute?.totalDistanceKm} km</strong>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Nodes</span>
                  <strong className="font-black text-white">{currentRoute?.pathCoordinates.length || 0}</strong>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Stops</span>
                  <strong className="font-black text-blue-400">{currentRoute?.stops.length || 0}</strong>
                </div>
              </div>

              {/* Mode Prompt Strip (in Card view only) */}
              {!isFullscreen && (
                <div className="bg-slate-100 text-slate-700 text-xs px-3.5 py-2 rounded-xl mb-2 flex items-center justify-between border border-slate-200">
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
                    className="text-[11px] text-stagecoach-blue font-bold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* THE MAP ELEMENT (Continuously Mounted in DOM) */}
              <div
                ref={mapContainerRef}
                className={`w-full transition-all duration-150 z-10 ${
                  isFullscreen 
                    ? 'h-screen w-screen' 
                    : 'h-[580px] sm:h-[620px] rounded-xl overflow-hidden'
                }`}
              />

              {/* Bottom Legend (in Card view only) */}
              {!isFullscreen && (
                <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span><span>Bus Stop 🚏</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span><span>Pop-up Stop 🚧</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span><span>Junction 🚦</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span><span>Roadworks 🏗️</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span><span>Hazard ⚠️</span></span>
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
    </>
  );
}
