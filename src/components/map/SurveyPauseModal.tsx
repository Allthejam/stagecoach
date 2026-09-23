"use client";

import React, { useState } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { SurveyPauseReason } from '@/types/route';
import { 
  PauseCircle, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Coffee, 
  Construction, 
  X, 
  Check, 
  TrainTrack
} from 'lucide-react';

const PAUSE_REASONS: { reason: SurveyPauseReason; icon: React.ReactNode; desc: string; color: string }[] = [
  { 
    reason: 'Hazard Site Inspection', 
    icon: <AlertTriangle className="w-4 h-4" />, 
    desc: 'Stopped in layby to photograph / measure bridge, canopy or turning hazard',
    color: 'bg-red-500/10 text-red-400 border-red-500/30'
  },
  { 
    reason: 'Railway Level Crossing', 
    icon: <Clock className="w-4 h-4" />, 
    desc: 'Held at barrier / railway crossing (non-timetable delay)',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  { 
    reason: 'Roadworks / Temporary Diversion', 
    icon: <Construction className="w-4 h-4" />, 
    desc: 'Temporary traffic signals or utility diversion inspection',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  },
  { 
    reason: 'Traffic Congestion / Bottleneck', 
    icon: <Truck className="w-4 h-4" />, 
    desc: 'Severe external gridlock or road blockage',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  { 
    reason: 'Driver Rest / Dwell Hold', 
    icon: <Coffee className="w-4 h-4" />, 
    desc: 'Meal relief, depot shift change, or scheduled layover',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  { 
    reason: 'Depot Operations Consult', 
    icon: <PauseCircle className="w-4 h-4" />, 
    desc: 'Consultation with garage duty manager / schedule coordinator',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  { 
    reason: 'Other Operational Pause', 
    icon: <PauseCircle className="w-4 h-4" />, 
    desc: 'General survey pause or test vehicle adjustment',
    color: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
  }
];

export default function SurveyPauseModal() {
  const { isPauseModalOpen, setIsPauseModalOpen, pauseLiveSurvey, setIsSetRiskModalOpen } = useRouteContext();
  const [selectedReason, setSelectedReason] = useState<SurveyPauseReason>('Hazard Site Inspection');
  const [customNote, setCustomNote] = useState('');

  if (!isPauseModalOpen) return null;

  const handleConfirmPause = () => {
    const finalReason = customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason;
    pauseLiveSurvey(finalReason);
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pause Live RRA Survey</h3>
              <p className="text-xs text-slate-400">
                Protects average speed & timetable calculations
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPauseModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reasons List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-semibold text-slate-300">
            Select Reason for Inspection Hold:
          </p>

          <div className="space-y-2">
            {PAUSE_REASONS.map((item) => {
              const isSelected = selectedReason === item.reason;
              return (
                <button
                  key={item.reason}
                  type="button"
                  onClick={() => setSelectedReason(item.reason)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{item.reason}</span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Note */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Details / Location (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Measuring tree arch at Milepost 4.2"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              handleConfirmPause();
              setIsSetRiskModalOpen(true);
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Pause and immediately document a hazard with camera photos"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>📸 Pause & Set Risk</span>
          </button>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={() => setIsPauseModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPause}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Confirm Pause</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
