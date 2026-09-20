"use client";

import React from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { formatDurationHMS } from '@/lib/calculations';
import { 
  CheckCircle2, 
  Clock, 
  Gauge, 
  MapPin, 
  PauseCircle, 
  Save, 
  RotateCcw, 
  FileText, 
  AlertTriangle,
  Layers,
  X,
  Sparkles
} from 'lucide-react';

export default function SurveySummaryModal() {
  const { 
    isSurveySummaryModalOpen, 
    setIsSurveySummaryModalOpen, 
    currentRoute, 
    surveyElapsedSeconds, 
    surveyActiveSeconds, 
    surveyPausedSeconds, 
    surveyDistanceMiles, 
    surveyDistanceKm, 
    surveyAverageSpeedMph, 
    surveyAverageSpeedKph, 
    surveyPauseLogs,
    resetLiveSurvey,
    saveCurrentRoute
  } = useRouteContext();

  if (!isSurveySummaryModalOpen) return null;

  const totalHazards = currentRoute?.hazards?.length || 0;
  const totalStops = currentRoute?.stops?.length || 0;
  const pathPointsCount = currentRoute?.pathCoordinates?.length || 0;

  const handleSaveAndClose = async () => {
    await saveCurrentRoute();
    setIsSurveySummaryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Survey Finished
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                Live RRA Telemetry Audit
              </h3>
              <p className="text-xs text-slate-400">
                Service {currentRoute?.routeNumber} • {currentRoute?.routeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSurveySummaryModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: True Average Speed */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Avg Moving Speed</span>
                <Gauge className="w-4 h-4 text-stagecoach-amber" />
              </div>
              <div className="text-xl font-black text-white">
                {surveyAverageSpeedMph > 0 ? `${surveyAverageSpeedMph} mph` : `${surveyAverageSpeedKph || 22} km/h`}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                Holds Excluded
              </span>
            </div>

            {/* Metric 2: Active Drive Time */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Drive Time</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-300 font-mono">
                {formatDurationHMS(surveyActiveSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                Total: {formatDurationHMS(surveyElapsedSeconds)}
              </span>
            </div>

            {/* Metric 3: Distance Mapped */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Distance</span>
                <MapPin className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-black text-white">
                {surveyDistanceMiles > 0 ? `${surveyDistanceMiles} mi` : `${surveyDistanceKm || currentRoute?.totalDistanceKm || 0} km`}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {pathPointsCount} GPS points
              </span>
            </div>
          </div>

          {/* Pause Breakdown */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  Inspection Holds & Delays: {formatDurationHMS(surveyPausedSeconds)}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {surveyPauseLogs.length} {surveyPauseLogs.length === 1 ? 'Pause' : 'Pauses'}
              </span>
            </div>
            
            {surveyPauseLogs.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                {surveyPauseLogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-slate-900 last:border-0">
                    <span className="truncate max-w-[220px]">
                      {idx + 1}. {log.reason}
                    </span>
                    <span className="font-mono text-amber-400 font-bold shrink-0">
                      {formatDurationHMS(log.durationSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                No pauses logged — continuous survey corridor trace.
              </p>
            )}
          </div>

          {/* Features Pinned */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400">Hazards Identified:</span>
              <span className="font-bold text-red-400">{totalHazards} pinned</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400">Bus Stops Audited:</span>
              <span className="font-bold text-blue-400">{totalStops} stops</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetLiveSurvey}
            className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard & Reset</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSurveySummaryModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2.5 bg-stagecoach-amber hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Telemetry to Route</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
