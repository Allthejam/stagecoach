"use client";

import React from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { usePwa } from '@/context/PwaContext';
import { formatDurationHMS } from '@/lib/calculations';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Gauge, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Navigation, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Locate
} from 'lucide-react';

export default function LiveSurveyControlBar() {
  const {
    surveyStatus,
    surveyElapsedSeconds,
    surveyActiveSeconds,
    surveyPausedSeconds,
    surveyCurrentSpeedMph,
    surveyAverageSpeedMph,
    surveyDistanceMiles,
    surveyDistanceKm,
    activePauseReason,
    startLiveSurvey,
    resumeLiveSurvey,
    stopLiveSurvey,
    resetLiveSurvey,
    setIsPauseModalOpen,
    userGpsPosition,
    setIsAddHazardModalOpen,
    setPendingCoords
  } = useRouteContext();

  const { gpsPermission, openPermissionsModal, requestGpsPermission } = usePwa();

  const handleStartSurvey = async () => {
    if (gpsPermission === 'denied') {
      openPermissionsModal();
      return;
    }
    if (gpsPermission === 'prompt') {
      const granted = await requestGpsPermission();
      if (!granted) {
        openPermissionsModal();
        return;
      }
    }
    startLiveSurvey();
  };

  const handlePinHazardAtGps = () => {
    if (userGpsPosition) {
      setPendingCoords(userGpsPosition);
      setIsAddHazardModalOpen(true);
    } else {
      setIsAddHazardModalOpen(true);
    }
  };

  if (surveyStatus === 'idle') {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-white">Live RRA GPS Survey Engine</span>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-semibold uppercase">
                Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Corridor tracing with intelligent inspection pauses to protect true average operational speeds.
            </p>
          </div>
        </div>

        <button
          onClick={handleStartSurvey}
          className="px-4 py-2.5 bg-stagecoach-amber hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Start Live Survey</span>
        </button>
      </div>
    );
  }

  const isRecording = surveyStatus === 'recording';
  const isPaused = surveyStatus === 'paused';

  return (
    <div className={`backdrop-blur-md rounded-2xl p-3 sm:p-4 border shadow-2xl transition-all ${
      isRecording 
        ? 'bg-slate-900/95 border-emerald-500/50 ring-1 ring-emerald-500/30' 
        : isPaused
        ? 'bg-slate-900/95 border-amber-500/60 ring-1 ring-amber-500/30'
        : 'bg-slate-900/95 border-slate-800'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section: Status & Timers */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Status Badge */}
          <div className="flex items-center space-x-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isRecording ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20' : 'bg-amber-400 ring-4 ring-amber-500/20'
            }`} />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  isRecording ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isRecording ? 'RECORDING LIVE' : 'PAUSED (HOLD)'}
                </span>
              </div>
              {isPaused && (
                <p className="text-[11px] text-amber-200/80 max-w-[200px] truncate">
                  Hold: {activePauseReason}
                </p>
              )}
            </div>
          </div>

          {/* Active Drive Timer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Drive Time</div>
              <div className="font-mono text-sm sm:text-base font-black text-white">
                {formatDurationHMS(surveyActiveSeconds)}
              </div>
            </div>
          </div>

          {/* Paused Time (If any) */}
          {(surveyPausedSeconds > 0 || isPaused) && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center space-x-2">
              <Pause className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Hold Time</div>
                <div className="font-mono text-sm sm:text-base font-black text-amber-300">
                  {formatDurationHMS(surveyPausedSeconds)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Section: Speedometer & Distance */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Live Speed */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <Gauge className="w-4 h-4 text-stagecoach-amber" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Speed</div>
              <div className="text-xs sm:text-sm font-black text-white">
                {surveyCurrentSpeedMph > 0 ? `${surveyCurrentSpeedMph} mph` : '0.0 mph'}
              </div>
            </div>
          </div>

          {/* True Average Moving Speed */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Moving Speed</div>
              <div className="text-xs sm:text-sm font-black text-sky-300">
                {surveyAverageSpeedMph > 0 ? `${surveyAverageSpeedMph} mph` : 'Calculating...'}
              </div>
            </div>
          </div>

          {/* Mapped Distance */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <MapPin className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distance</div>
              <div className="text-xs sm:text-sm font-black text-white">
                {surveyDistanceMiles > 0 ? `${surveyDistanceMiles} mi` : `${surveyDistanceKm} km`}
              </div>
            </div>
          </div>

        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Pin Hazard at current GPS */}
          <button
            type="button"
            onClick={handlePinHazardAtGps}
            className="px-3 py-2 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            title="Geotag a hazard at current GPS coordinates"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Pin Hazard</span>
          </button>

          {/* Pause / Resume Button */}
          {isRecording ? (
            <button
              type="button"
              onClick={() => setIsPauseModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>Pause Survey</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={resumeLiveSurvey}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer animate-pulse"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resume Survey</span>
            </button>
          ) : null}

          {/* Stop / Finish Survey */}
          <button
            type="button"
            onClick={stopLiveSurvey}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
            title="Stop survey and generate telemetry report"
          >
            <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Finish</span>
          </button>
        </div>

      </div>
    </div>
  );
}
