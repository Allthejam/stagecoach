"use client";

import React, { useState, useEffect } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { RouteStop, StopType } from '@/types/route';
import { MapPin, X, Clock, AlertTriangle } from 'lucide-react';

export default function AddStopModal() {
  const {
    isAddStopModalOpen,
    setIsAddStopModalOpen,
    pendingCoords,
    pendingStopType,
    updateCurrentRoute,
    currentRoute,
    showToast,
  } = useRouteContext();

  const [name, setName] = useState('');
  const [stopType, setStopType] = useState<StopType>('bus_stop');
  const [dwellMinutes, setDwellMinutes] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (pendingStopType) {
      setStopType(pendingStopType);
    }
    if (isAddStopModalOpen) {
      setName('');
      setNotes('');
      setDwellMinutes(1);
    }
  }, [isAddStopModalOpen, pendingStopType]);

  if (!isAddStopModalOpen || !pendingCoords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newStop: RouteStop = {
      id: `stop-${Date.now().toString(36)}`,
      name: name.trim(),
      stopType: stopType,
      lat: pendingCoords[0],
      lng: pendingCoords[1],
      dwellMinutes: Number(dwellMinutes) || 1,
      notes: notes.trim() || undefined,
      order: (currentRoute?.stops.length || 0) + 1,
    };

    updateCurrentRoute((prev) => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));

    setIsAddStopModalOpen(false);
    showToast(`Added ${stopType.replace('_', ' ')}: "${newStop.name}"`);
  };

  const stopTypeOptions: { type: StopType; label: string; icon: string; desc: string; badgeColor: string }[] = [
    { type: 'bus_stop', label: 'Permanent Bus Stop', icon: '🚏', desc: 'Standard timetable Stagecoach stop & shelter', badgeColor: 'border-blue-500 bg-blue-50 text-blue-900' },
    { type: 'popup_stop', label: 'Pop-up Stop (Temp)', icon: '🚧', desc: 'Temporary roadside stop for daily / short-term diversions', badgeColor: 'border-amber-500 bg-amber-50 text-amber-900' },
    { type: 'junction', label: 'Critical Junction / Lights', icon: '🚦', desc: 'Complex intersection, roundabout, or signal delay point', badgeColor: 'border-purple-500 bg-purple-50 text-purple-900' },
    { type: 'roadworks', label: 'Major Roadworks (2-3 Yrs)', icon: '🏗️', desc: 'Long-term infrastructure or utility works bottleneck', badgeColor: 'border-orange-500 bg-orange-50 text-orange-900' },
    { type: 'other', label: 'Other Operational Point', icon: '📍', desc: 'Depot gate, timing point, layover bay, or crew relief', badgeColor: 'border-slate-500 bg-slate-50 text-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-stagecoach-blue font-bold text-lg">
              📍
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Route Stop or Marker</h3>
              <p className="text-xs text-slate-500">
                GPS: {pendingCoords[0].toFixed(5)}, {pendingCoords[1].toFixed(5)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddStopModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Stop Type Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Stop / Marker Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stopTypeOptions.map((opt) => {
                const isSelected = stopType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setStopType(opt.type)}
                    className={`text-left p-2.5 rounded-xl border-2 transition-all flex items-start space-x-2.5 ${
                      isSelected
                        ? `${opt.badgeColor} ring-2 ring-stagecoach-blue/40 font-bold shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{opt.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stop Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Stop / Location Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ashton Interchange Stand C, Snipe Roadworks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
            />
          </div>

          {/* Dwell Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Passenger Dwell Time
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={dwellMinutes}
                  onChange={(e) => setDwellMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue pr-12"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-semibold">min</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Default 1 min baseline dwell per stop</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sequence Order
              </label>
              <div className="text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold">
                Stop #{(currentRoute?.stops.length || 0) + 1}
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Operational Notes / Duration
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Temporary stop for 2-3 week water main works, or 2-3 year major highway remodeling."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddStopModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Save Stop to Route
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
