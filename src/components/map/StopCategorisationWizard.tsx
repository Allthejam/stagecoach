"use client";

import React, { useState, useEffect } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { RouteStop, StopType } from '@/types/route';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Layers, 
  Sparkles, 
  X, 
  Plus, 
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const CATEGORY_OPTIONS: { type: StopType; label: string; icon: string; color: string; activeColor: string }[] = [
  { 
    type: 'main_stop_time_point', 
    label: 'Main Stop ("Time Point")', 
    icon: '⏱️', 
    color: 'border-blue-500/40 text-blue-300 hover:bg-blue-950/40',
    activeColor: 'bg-blue-600 text-white border-blue-400 font-bold shadow-md shadow-blue-950'
  },
  { 
    type: 'bus_stop_regular', 
    label: 'Bus Stop (Not Time Point)', 
    icon: '🚏', 
    color: 'border-sky-500/40 text-sky-300 hover:bg-sky-950/40',
    activeColor: 'bg-sky-600 text-white border-sky-400 font-bold shadow-md shadow-sky-950'
  },
  { 
    type: 'junction', 
    label: 'Main Road Junction', 
    icon: '🚦', 
    color: 'border-purple-500/40 text-purple-300 hover:bg-purple-950/40',
    activeColor: 'bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-950'
  },
  { 
    type: 'roadworks_long_term', 
    label: 'Planned Roadworks (9m-3yr)', 
    icon: '🚧', 
    color: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40',
    activeColor: 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md shadow-emerald-950'
  },
  { 
    type: 'other', 
    label: 'Other Location', 
    icon: '📍', 
    color: 'border-amber-500/40 text-amber-300 hover:bg-amber-950/40',
    activeColor: 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-950'
  }
];

export default function StopCategorisationWizard() {
  const {
    isCategorisationWizardOpen,
    setIsCategorisationWizardOpen,
    currentRoute,
    batchUpdateStopCategories,
    setIsSurveySummaryModalOpen
  } = useRouteContext();

  const [stopsList, setStopsList] = useState<RouteStop[]>([]);

  useEffect(() => {
    if (isCategorisationWizardOpen && currentRoute?.stops) {
      // Normalize legacy types if present
      const normalized = currentRoute.stops.map((stop) => {
        let nType: StopType = stop.stopType;
        if ((stop.stopType as string) === 'bus_stop') nType = 'bus_stop_regular';
        if ((stop.stopType as string) === 'popup_stop') nType = 'main_stop_time_point';
        if ((stop.stopType as string) === 'roadworks') nType = 'roadworks_long_term';
        return {
          ...stop,
          stopType: nType
        };
      });
      setStopsList(normalized);
    }
  }, [isCategorisationWizardOpen, currentRoute]);

  if (!isCategorisationWizardOpen) return null;

  const handleUpdateStopType = (stopId: string, newType: StopType) => {
    setStopsList((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, stopType: newType } : s))
    );
  };

  const handleUpdateStopName = (stopId: string, newName: string) => {
    setStopsList((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, name: newName } : s))
    );
  };

  const handleUpdateNotes = (stopId: string, notes: string) => {
    setStopsList((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, notes } : s))
    );
  };

  const handleAddNewStop = () => {
    const lat = currentRoute?.pathCoordinates?.[0]?.[0] || 57.3295;
    const lng = currentRoute?.pathCoordinates?.[0]?.[1] || -3.6062;
    const newStop: RouteStop = {
      id: 'stop_' + Date.now(),
      name: `New Stop #${stopsList.length + 1}`,
      stopType: 'bus_stop_regular',
      lat,
      lng,
      dwellMinutes: 1,
      order: stopsList.length + 1
    };
    setStopsList((prev) => [...prev, newStop]);
  };

  const handleDeleteStop = (stopId: string) => {
    setStopsList((prev) => prev.filter((s) => s.id !== stopId));
  };

  const handleFinalize = () => {
    batchUpdateStopCategories(stopsList);
    setIsCategorisationWizardOpen(false);
    setIsSurveySummaryModalOpen(true);
  };

  // Stats Breakdown
  const timePointsCount = stopsList.filter(s => s.stopType === 'main_stop_time_point' || (s.stopType as string) === 'popup_stop').length;
  const regularStopsCount = stopsList.filter(s => s.stopType === 'bus_stop_regular' || (s.stopType as string) === 'bus_stop').length;
  const junctionsCount = stopsList.filter(s => s.stopType === 'junction').length;
  const roadworksCount = stopsList.filter(s => s.stopType === 'roadworks_long_term' || (s.stopType as string) === 'roadworks').length;
  const otherCount = stopsList.filter(s => s.stopType === 'other').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-stagecoach-amber/20 border border-stagecoach-amber/40 text-stagecoach-amber flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Step 2 of 3: Stop Categorisation
                </span>
                <span className="text-xs text-slate-400">
                  {stopsList.length} Total Stops
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Categorise Survey Stops & Timetable Points
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCategorisationWizardOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Category Badges */}
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs shrink-0">
          <span className="text-slate-400 font-semibold mr-1">Summary:</span>
          <span className="bg-blue-950 text-blue-300 border border-blue-800/60 px-2.5 py-1 rounded-lg font-bold">
            ⏱️ {timePointsCount} Time Points
          </span>
          <span className="bg-sky-950 text-sky-300 border border-sky-800/60 px-2.5 py-1 rounded-lg font-bold">
            🚏 {regularStopsCount} Regular Stops
          </span>
          <span className="bg-purple-950 text-purple-300 border border-purple-800/60 px-2.5 py-1 rounded-lg font-bold">
            🚦 {junctionsCount} Junctions
          </span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-bold">
            🚧 {roadworksCount} Roadworks
          </span>
          {otherCount > 0 && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-lg font-bold">
              📍 {otherCount} Other
            </span>
          )}
        </div>

        {/* Stops List */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {stopsList.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No stops recorded on this route yet.</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You can add stops now to categorise time points and junctions.
              </p>
              <button
                type="button"
                onClick={handleAddNewStop}
                className="px-4 py-2 bg-stagecoach-amber text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer"
              >
                + Add First Stop
              </button>
            </div>
          ) : (
            stopsList.map((stop, index) => (
              <div
                key={stop.id || index}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
              >
                {/* Top Row: Name & Lat/Lng */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center shrink-0 border border-slate-700">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={stop.name}
                      onChange={(e) => handleUpdateStopName(stop.id, e.target.value)}
                      placeholder="Stop Name / Landmark"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-amber-400 flex-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteStop(stop.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition"
                      title="Remove stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Selector Pills */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Categorise Location Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const isSelected = stop.stopType === opt.type || 
                        (opt.type === 'bus_stop_regular' && (stop.stopType as string) === 'bus_stop') ||
                        (opt.type === 'main_stop_time_point' && (stop.stopType as string) === 'popup_stop') ||
                        (opt.type === 'roadworks_long_term' && (stop.stopType as string) === 'roadworks');

                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleUpdateStopType(stop.id, opt.type)}
                          className={`px-2.5 py-2 rounded-xl text-xs border text-left transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isSelected ? opt.activeColor : `bg-slate-900/60 ${opt.color}`
                          }`}
                        >
                          <span className="text-xs">{opt.icon}</span>
                          <span className="truncate text-[11px] font-semibold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes box if 'other' is selected */}
                {stop.stopType === 'other' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={stop.notes || ''}
                      onChange={(e) => handleUpdateNotes(stop.id, e.target.value)}
                      placeholder="Specify details for this custom location point..."
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add Stop Button */}
          {stopsList.length > 0 && (
            <button
              type="button"
              onClick={handleAddNewStop}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-slate-500 rounded-2xl text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Location Point</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsCategorisationWizardOpen(false)}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white font-bold transition"
          >
            Back to Map
          </button>

          <button
            type="button"
            onClick={handleFinalize}
            className="px-5 py-2.5 bg-stagecoach-amber hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
          >
            <span>Complete Assessment & View Summary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
