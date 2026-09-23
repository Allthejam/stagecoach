"use client";

import React, { useState, useEffect } from 'react';
import { useRouteContext, SurveyorBasePreset } from '@/context/RouteContext';
import { usePwa } from '@/context/PwaContext';
import { 
  Navigation, 
  X, 
  Check, 
  Radio
} from 'lucide-react';

export default function StartLocationConfirmModal() {
  const {
    isStartLocationModalOpen,
    setIsStartLocationModalOpen,
    confirmAndStartLiveSurvey,
    userGpsPosition,
    surveyorBaseLocation,
    currentRoute,
    showToast
  } = useRouteContext();

  const [locationName, setLocationName] = useState<string>('Route Starting Point');
  const [activeCoords, setActiveCoords] = useState<[number, number]>([57.1950, -3.8290]);

  // When modal opens, acquire location and set starting coordinates
  useEffect(() => {
    if (!isStartLocationModalOpen) return;

    if (userGpsPosition) {
      setActiveCoords(userGpsPosition);
    } else if (currentRoute?.pathCoordinates && currentRoute.pathCoordinates.length > 0) {
      setActiveCoords(currentRoute.pathCoordinates[0]);
    } else {
      setActiveCoords(surveyorBaseLocation?.coords || [57.1950, -3.8290]);
    }

    if (currentRoute?.stops && currentRoute.stops.length > 0) {
      setLocationName(currentRoute.stops[0].name || 'Route Starting Point');
    } else {
      setLocationName(currentRoute ? `Line ${currentRoute.routeNumber} Start` : 'Route Starting Point');
    }

    // Ping device GPS
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (latitude >= 54.5) {
            setActiveCoords([latitude, longitude]);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  }, [isStartLocationModalOpen, userGpsPosition, currentRoute, surveyorBaseLocation]);

  const handleConfirm = () => {
    confirmAndStartLiveSurvey(activeCoords, locationName || 'Route Starting Point');
  };

  if (!isStartLocationModalOpen) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10020] w-[92%] max-w-lg pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500/70 shadow-2xl rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3.5 ring-4 ring-emerald-500/20">
        
        {/* Left Info: Pulsing Radar Beacon */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg relative">
              <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/30">
                Pulsing Road Position
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
              {locationName}
            </div>
            <div className="text-[11px] text-slate-400">
              Marker on map shows your starting point. Tap confirm to begin.
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <button
            type="button"
            onClick={() => setIsStartLocationModalOpen(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
          >
            <Navigation className="w-4 h-4 fill-slate-950" />
            <span>Confirm & Start</span>
          </button>
        </div>

      </div>
    </div>
  );
}
