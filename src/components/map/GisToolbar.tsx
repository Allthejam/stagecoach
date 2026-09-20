"use client";

import React from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { GisToolMode } from '@/types/route';
import { 
  MousePointer, 
  PenTool, 
  MapPin, 
  AlertTriangle, 
  Undo2, 
  ArrowLeftRight, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Maximize2, 
  Navigation 
} from 'lucide-react';

interface GisToolbarProps {
  onCenterMap: () => void;
  onToggleGps: () => void;
}

export default function GisToolbar({ onCenterMap, onToggleGps }: GisToolbarProps) {
  const {
    gisToolMode,
    setGisToolMode,
    undoPathPoint,
    reversePath,
    clearPath,
    startOver,
    currentRoute,
    tileLayer,
    setTileLayer,
    isGpsTracking,
    surveyStatus,
    startLiveSurvey,
    pauseLiveSurvey,
    resumeLiveSurvey,
    setIsPauseModalOpen
  } = useRouteContext();

  const toolButtons: { mode: GisToolMode; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { mode: 'browse', label: 'Select & Inspect', icon: <MousePointer className="w-4 h-4" />, color: 'text-slate-700', desc: 'Pan / Click elements' },
    { mode: 'draw_path', label: 'Draw / Extend Route', icon: <PenTool className="w-4 h-4 text-blue-600" />, color: 'text-blue-700', desc: 'Click map to add points' },
    { mode: 'drop_bus_stop', label: 'Bus Stop (Perm)', icon: <span className="text-base">🚏</span>, color: 'text-blue-700', desc: 'Standard timetable stop' },
    { mode: 'drop_popup_stop', label: 'Pop-up Stop (Temp)', icon: <span className="text-base">🚧</span>, color: 'text-amber-700', desc: 'Short-term diversion' },
    { mode: 'drop_junction', label: 'Critical Junction', icon: <span className="text-base">🚦</span>, color: 'text-purple-700', desc: 'Lights / Roundabout' },
    { mode: 'drop_roadworks', label: 'Roadworks (2-3 Yrs)', icon: <span className="text-base">🏗️</span>, color: 'text-orange-700', desc: 'Long-term works' },
    { mode: 'drop_hazard', label: 'Pin Geotagged Hazard', icon: <AlertTriangle className="w-4 h-4 text-red-600" />, color: 'text-red-700', desc: '5×5 Matrix & Photos' },
  ];

  return (
    <div className="hidden lg:flex flex-col w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
      
      {/* Tool Category: Drawing & Drop Tools */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">GIS Drawing Tools</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {currentRoute?.pathCoordinates.length || 0} pts
          </span>
        </div>

        <div className="space-y-1">
          {toolButtons.map((tool) => {
            const isActive = gisToolMode === tool.mode;
            return (
              <button
                key={tool.mode}
                onClick={() => setGisToolMode(tool.mode)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-stagecoach-navy text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`p-1 rounded-lg ${isActive ? 'text-white' : tool.color}`}>
                    {tool.icon}
                  </div>
                  <span className="truncate">{tool.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-stagecoach-amber"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Category: Path Operations */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Path Operations
        </span>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={undoPathPoint}
            disabled={!currentRoute || currentRoute.pathCoordinates.length === 0}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40"
            title="Undo last path point"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Point</span>
          </button>

          <button
            onClick={reversePath}
            disabled={!currentRoute || currentRoute.pathCoordinates.length < 2}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40"
            title="Reverse Route Path Direction"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Reverse</span>
          </button>

          <button
            onClick={clearPath}
            disabled={!currentRoute || currentRoute.pathCoordinates.length === 0}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40"
            title="Clear Route Path"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Path</span>
          </button>

          <button
            onClick={startOver}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors"
            title="Start Over Route Assessment"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* Tool Category: Layer & GPS Controls */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          GIS Layer & GPS Controls
        </span>

        <div className="space-y-1.5">
          <button
            onClick={() => setTileLayer(tileLayer === 'osm' ? 'satellite' : 'osm')}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>{tileLayer === 'osm' ? 'Standard Streets' : 'Satellite Imagery'}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">Toggle</span>
          </button>

          <button
            onClick={onCenterMap}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Maximize2 className="w-4 h-4 text-slate-600" />
              <span>Center & Fit Route</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">Zoom</span>
          </button>

          <button
            onClick={() => {
              if (surveyStatus === 'idle') {
                startLiveSurvey();
              } else if (surveyStatus === 'recording') {
                setIsPauseModalOpen(true);
              } else if (surveyStatus === 'paused') {
                resumeLiveSurvey();
              } else {
                onToggleGps();
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              surveyStatus === 'recording'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 shadow animate-pulse'
                : surveyStatus === 'paused'
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 shadow'
                : isGpsTracking
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 shadow'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Navigation className={`w-4 h-4 ${surveyStatus === 'recording' || isGpsTracking ? 'animate-spin' : ''}`} />
              <span>
                {surveyStatus === 'recording'
                  ? 'GPS Survey: LIVE'
                  : surveyStatus === 'paused'
                  ? 'GPS Survey: PAUSED'
                  : 'Start Live GPS Survey'}
              </span>
            </div>
            <span className="text-[10px] font-bold">
              {surveyStatus === 'recording' ? 'Rec' : surveyStatus === 'paused' ? 'Hold' : 'Off'}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
