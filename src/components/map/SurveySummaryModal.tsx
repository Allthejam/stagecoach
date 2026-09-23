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
  Sparkles,
  ArrowRight
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
    saveCurrentRoute,
    setActiveTab
  } = useRouteContext();

  if (!isSurveySummaryModalOpen) return null;

  const totalHazards = currentRoute?.hazards?.length || 0;
  const stops = currentRoute?.stops || [];
  const totalStops = stops.length;
  const pathPointsCount = currentRoute?.pathCoordinates?.length || 0;

  const timePointsCount = stops.filter(s => s.stopType === 'main_stop_time_point' || (s.stopType as string) === 'popup_stop').length;
  const regularStopsCount = stops.filter(s => s.stopType === 'bus_stop_regular' || (s.stopType as string) === 'bus_stop').length;
  const junctionsCount = stops.filter(s => s.stopType === 'junction').length;
  const roadworksCount = stops.filter(s => s.stopType === 'roadworks_long_term' || (s.stopType as string) === 'roadworks').length;
  const otherCount = stops.filter(s => s.stopType === 'other').length;

  const handleProceedToRiskMatrix = async () => {
    await saveCurrentRoute();
    setIsSurveySummaryModalOpen(false);
    setActiveTab('hazards');
  };

  const handleSaveAndClose = async () => {
    await saveCurrentRoute();
    setIsSurveySummaryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Step 3 of 3: Field Survey Complete
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Route Risk Assessment (RRA) Summary
              </h3>
              <p className="text-xs text-slate-400">
                Service {currentRoute?.routeNumber} • {currentRoute?.routeTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSurveySummaryModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* 1 & 2: Speed and Time Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: Average Speed */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">1. Avg Moving Speed</span>
                <Gauge className="w-4 h-4 text-stagecoach-amber" />
              </div>
              <div className="text-xl font-black text-white">
                {surveyAverageSpeedMph > 0 ? `${surveyAverageSpeedMph} mph` : `${surveyAverageSpeedKph || 22} km/h`}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                ⏱️ Holds Excluded
              </span>
            </div>

            {/* Metric 2: Entire Route Duration */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">2. Entire Duration</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-300 font-mono">
                {formatDurationHMS(surveyElapsedSeconds)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                Drive: {formatDurationHMS(surveyActiveSeconds)}
              </span>
            </div>

            {/* Total Distance */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Distance Mapped</span>
                <MapPin className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-black text-white">
                {surveyDistanceMiles > 0 ? `${surveyDistanceMiles} mi` : `${surveyDistanceKm || currentRoute?.totalDistanceKm || 0} km`}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {pathPointsCount} GPS Nodes
              </span>
            </div>
          </div>

          {/* Metric 3: Amount of Stops Recorded (Categorised) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>3. Recorded Stops & Junctions ({totalStops})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Audited
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
                <div className="text-[10px] text-blue-400 font-bold uppercase">Time Points</div>
                <div className="text-base font-black text-blue-200 mt-0.5">⏱️ {timePointsCount}</div>
              </div>
              <div className="bg-sky-950/40 border border-sky-800/40 p-2.5 rounded-xl">
                <div className="text-[10px] text-sky-400 font-bold uppercase">Bus Stops</div>
                <div className="text-base font-black text-sky-200 mt-0.5">🚏 {regularStopsCount}</div>
              </div>
              <div className="bg-purple-950/40 border border-purple-800/40 p-2.5 rounded-xl">
                <div className="text-[10px] text-purple-400 font-bold uppercase">Junctions</div>
                <div className="text-base font-black text-purple-200 mt-0.5">🚦 {junctionsCount}</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Roadworks</div>
                <div className="text-base font-black text-emerald-200 mt-0.5">🚧 {roadworksCount}</div>
              </div>
            </div>
          </div>

          {/* Metric 4: Amount of Risk Events Recorded (With Photos & Details) */}
          <div className="bg-slate-950 border border-red-900/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>4. Risk Events Recorded ({totalHazards})</span>
              </span>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-full font-bold">
                🔴 Red Pins
              </span>
            </div>

            {currentRoute?.hazards && currentRoute.hazards.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {currentRoute.hazards.map((haz, idx) => (
                  <div key={haz.id || idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-bold">{idx + 1}. {haz.title}</strong>
                      <span className="text-[10px] text-red-400 font-mono">{haz.category}</span>
                    </div>
                    {haz.riskDescription && (
                      <p className="text-slate-300 text-[11px] leading-tight">
                        <strong className="text-red-300 font-semibold">Risk:</strong> {haz.riskDescription}
                      </p>
                    )}
                    {haz.controlMeasure && (
                      <p className="text-emerald-300 text-[11px] leading-tight">
                        <strong className="text-emerald-400 font-semibold">Control:</strong> {haz.controlMeasure}
                      </p>
                    )}
                    {/* Photos list */}
                    {haz.photos && haz.photos.length > 0 && (
                      <div className="flex items-center space-x-2 pt-1">
                        {haz.photos.map((imgSrc, pIdx) => (
                          <img
                            key={pIdx}
                            src={imgSrc}
                            alt={`Hazard photo ${pIdx + 1}`}
                            className="w-12 h-9 object-cover rounded-lg border border-slate-700"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No specific risk events pinned during this survey.
              </p>
            )}
          </div>

          {/* Metric 5: Standardized Map Pins Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              5. Final GIS Map Pin Legend
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center space-x-1.5 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg text-blue-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span>🔵 Stops & Time Points</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-lg text-red-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>🔴 Risk Events</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>🟢 Roadworks</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>🟡 Other</span>
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={resetLiveSurvey}
            className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center space-x-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Survey</span>
          </button>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Save & Stay on Map
            </button>

            <button
              type="button"
              onClick={handleProceedToRiskMatrix}
              className="px-5 py-2.5 bg-gradient-to-r from-stagecoach-amber to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Proceed to 5×5 Risk Matrix ➡️</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
