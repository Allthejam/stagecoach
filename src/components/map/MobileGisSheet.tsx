"use client";

import React, { useState } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { GisToolMode } from '@/types/route';
import { 
  PenTool, 
  MousePointer, 
  AlertTriangle, 
  Undo2, 
  Layers, 
  Maximize2, 
  Navigation, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

interface MobileGisSheetProps {
  onCenterMap: () => void;
  onToggleGps: () => void;
}

export default function MobileGisSheet({ onCenterMap, onToggleGps }: MobileGisSheetProps) {
  const {
    gisToolMode,
    setGisToolMode,
    undoPathPoint,
    tileLayer,
    setTileLayer,
    isGpsTracking,
    surveyStatus,
    startLiveSurvey,
    resumeLiveSurvey,
    setIsPauseModalOpen
  } = useRouteContext();

  const [isExpanded, setIsExpanded] = useState(false);

  const tools: { mode: GisToolMode; label: string; icon: string }[] = [
    { mode: 'browse', label: 'Select', icon: '👆' },
    { mode: 'draw_path', label: 'Draw Path', icon: '✏️' },
    { mode: 'drop_bus_stop', label: 'Bus Stop', icon: '🚏' },
    { mode: 'drop_popup_stop', label: 'Temp Stop', icon: '🚧' },
    { mode: 'drop_junction', label: 'Junction', icon: '🚦' },
    { mode: 'drop_roadworks', label: 'Works', icon: '🏗️' },
    { mode: 'drop_hazard', label: 'Hazard', icon: '⚠️' },
  ];

  return (
    <div className="lg:hidden absolute top-3 left-3 right-3 z-30 flex flex-col space-y-2 pointer-events-auto">
      
      {/* Quick Action Pill */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl p-2 border border-slate-700 flex items-center justify-between text-white">
        
        {/* Horizontal Scroll of Tools */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-1 scrollbar-none max-w-[calc(100%-80px)]">
          {tools.map((t) => {
            const isActive = gisToolMode === t.mode;
            return (
              <button
                key={t.mode}
                onClick={() => setGisToolMode(t.mode)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-stagecoach-amber text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Undo & Expand */}
        <div className="flex items-center space-x-1 pl-1 border-l border-slate-700">
          <button
            onClick={undoPathPoint}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Undo Path Point"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 text-stagecoach-amber"
            title="More Map Controls"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 border border-slate-700 grid grid-cols-3 gap-2 text-white animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setTileLayer(tileLayer === 'osm' ? 'satellite' : 'osm');
              setIsExpanded(false);
            }}
            className="flex items-center justify-center space-x-1.5 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
          >
            <Layers className="w-3.5 h-3.5 text-stagecoach-amber" />
            <span>{tileLayer === 'osm' ? 'Satellite' : 'Streets'}</span>
          </button>

          <button
            onClick={() => {
              onCenterMap();
              setIsExpanded(false);
            }}
            className="flex items-center justify-center space-x-1.5 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Fit Route</span>
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
              setIsExpanded(false);
            }}
            className={`flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-bold ${
              surveyStatus === 'recording'
                ? 'bg-emerald-600 text-white animate-pulse'
                : surveyStatus === 'paused'
                ? 'bg-amber-500 text-slate-950 font-black'
                : isGpsTracking 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>
              {surveyStatus === 'recording'
                ? 'Survey: REC'
                : surveyStatus === 'paused'
                ? 'Survey: PAUSED'
                : 'Live GPS'}
            </span>
          </button>
        </div>
      )}

    </div>
  );
}
