"use client";

import React, { useState, useEffect } from 'react';
import { useRouteContext, SCOTTISH_BASE_PRESETS, SurveyorBasePreset } from '@/context/RouteContext';
import { usePwa } from '@/context/PwaContext';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  X, 
  Crosshair, 
  RotateCw, 
  Building2, 
  Compass, 
  ShieldCheck, 
  AlertCircle,
  Laptop
} from 'lucide-react';

export default function StartLocationConfirmModal() {
  const {
    isStartLocationModalOpen,
    setIsStartLocationModalOpen,
    confirmAndStartLiveSurvey,
    surveyorBaseLocation,
    currentRoute,
    showToast
  } = useRouteContext();

  const { gpsPermission, requestGpsPermission } = usePwa();

  const [lat, setLat] = useState<number>(57.3295);
  const [lng, setLng] = useState<number>(-3.6062);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Depot Departure Stance 1');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // When modal opens, auto-detect location
  useEffect(() => {
    if (!isStartLocationModalOpen) return;

    if (currentRoute?.pathCoordinates && currentRoute.pathCoordinates.length > 0) {
      setLat(currentRoute.pathCoordinates[0][0]);
      setLng(currentRoute.pathCoordinates[0][1]);
      if (currentRoute.stops && currentRoute.stops.length > 0) {
        setLocationName(currentRoute.stops[0].name || 'Route Start Point');
      }
    }

    pingGps();
  }, [isStartLocationModalOpen]);

  const pingGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('GPS is not supported on this device.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy: acc } = pos.coords;

        // If broadband IP placed user in England / Bolton (lat < 55.0) or accuracy > 2km, prefill Scottish Highlands
        if (latitude < 55.0 || (acc && acc > 2000)) {
          setLat(surveyorBaseLocation?.coords[0] || 57.1950);
          setLng(surveyorBaseLocation?.coords[1] || -3.8290);
          setLocationName(surveyorBaseLocation?.name || 'Aviemore Depot Departure Stance 1');
          setAccuracy(acc);
          setIsManualOverride(false);
          showToast(`🏴󠁧󠁢󠁳󠁣󠁴󠁿 Desktop PC broadband IP in England (${latitude.toFixed(2)}°N). Preset to ${surveyorBaseLocation?.name || 'Aviemore (Highlands)'}.`);
        } else {
          setLat(latitude);
          setLng(longitude);
          setAccuracy(acc);
          setIsManualOverride(false);
          showToast(`GPS Locked: ±${Math.round(acc)}m accuracy`);
        }
      },
      (err) => {
        setIsLocating(false);
        setLat(surveyorBaseLocation?.coords[0] || 57.1950);
        setLng(surveyorBaseLocation?.coords[1] || -3.8290);
        setLocationName(surveyorBaseLocation?.name || 'Aviemore Depot Departure Stance 1');
        showToast(`Preset to ${surveyorBaseLocation?.name || 'Aviemore (Highlands)'}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };

  const handleApplyPreset = (preset: SurveyorBasePreset) => {
    setLat(preset.coords[0]);
    setLng(preset.coords[1]);
    setLocationName(preset.name);
    setAccuracy(3);
    setIsManualOverride(true);
    showToast(`Applied preset: ${preset.name}`);
  };

  const handleConfirmAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      alert('Please provide valid starting latitude and longitude coordinates.');
      return;
    }

    confirmAndStartLiveSurvey([lat, lng], locationName.trim() || 'Route Starting Point');
  };

  if (!isStartLocationModalOpen) return null;

  const isDesktopOfficeIp = accuracy && accuracy > 5000;
  const isHighAccuracyGps = accuracy && accuracy <= 25;

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001733] via-[#00244d] to-[#001733] p-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pre-Survey Calibration
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentRoute ? `Line ${currentRoute.routeNumber}` : 'Route Survey'}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Verify Starting GPS Location
              </h3>
            </div>
          </div>
          <button
            onClick={() => setIsStartLocationModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirmAndStart} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Accuracy Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
            isHighAccuracyGps
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : isDesktopOfficeIp
              ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <div className="p-1 rounded-lg shrink-0 mt-0.5">
              {isHighAccuracyGps ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : isDesktopOfficeIp ? (
                <Laptop className="w-5 h-5 text-sky-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold flex items-center space-x-2">
                <span>
                  {isHighAccuracyGps
                    ? `Satellite GPS Locked (±${Math.round(accuracy || 3)}m accuracy)`
                    : isDesktopOfficeIp
                    ? `Office PC Network Detected (±${Math.round((accuracy || 50000) / 1000)}km via ISP Hub)`
                    : `Cellular/WiFi Location (±${Math.round(accuracy || 30)}m accuracy)`}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {isDesktopOfficeIp
                  ? 'Desktop PCs lack satellite GPS chips and use internet routing hubs. You can use the Preset Depots or manually type your starting coordinates below.'
                  : 'Your live position is ready. Confirm below to lock departure coordinates and commence the RRA survey clock.'}
              </p>
            </div>
          </div>

          {/* Coordinate Inputs Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-stagecoach-amber" />
                <span>Starting Coordinates</span>
              </span>
              <button
                type="button"
                onClick={pingGps}
                disabled={isLocating}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center space-x-1 transition disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Re-Ping GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => {
                    setLat(parseFloat(e.target.value) || 0);
                    setIsManualOverride(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-stagecoach-amber outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Longitude (°W/E)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => {
                    setLng(parseFloat(e.target.value) || 0);
                    setIsManualOverride(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-stagecoach-amber outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Departure Point / Stance Name
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Aviemore Garage Stance 1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-stagecoach-amber outline-none"
                required
              />
            </div>
          </div>

          {/* Quick Depot Presets (Essential for Office PC development & Depot Starters) */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Highlands & Regional Depots (Click to Set)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SCOTTISH_BASE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 transition group"
                >
                  <div className="text-[11px] font-bold truncate group-hover:text-amber-400">
                    {p.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    [{p.coords[0].toFixed(2)}, {p.coords[1].toFixed(2)}]
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Confirming locks the official survey start stance. GPS telemetry will auto-calculate moving speed from this coordinate.
            </span>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 shrink-0 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStartLocationModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Confirm Location & Start Survey</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
