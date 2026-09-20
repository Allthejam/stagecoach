"use client";

import React from 'react';
import { useRouteContext, ActiveTab } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import { MapPin, AlertTriangle, Bus, FileText, ShieldCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab, currentRoute } = useRouteContext();
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) return null;

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [

    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'hazards', label: 'Hazards', icon: AlertTriangle, count: currentRoute?.hazards.length || 0 },
    { id: 'fleet', label: 'Fleet', icon: Bus },
    { id: 'driver', label: 'Flashcard', icon: FileText },
    { id: 'governance', label: 'Sign-off', icon: ShieldCheck },
  ];

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stagecoach-navy/95 backdrop-blur-md border-t border-slate-800 text-slate-300 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 relative min-h-[48px] rounded-lg transition-colors ${
                isActive ? 'text-stagecoach-amber font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-stagecoach-amber scale-110' : ''}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-stagecoach-navy">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-stagecoach-amber rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
