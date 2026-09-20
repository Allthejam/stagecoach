"use client";

import React from 'react';
import { useAuthContext, ROLE_LABELS } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  MapPin, 
  Bus, 
  Building2, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  ShieldCheck,
  Compass,
  AlertTriangle,
  FolderTree
} from 'lucide-react';

export type MainWorkspaceView = 'routes' | 'fleet' | 'depots' | 'users' | 'settings';

interface SidebarNavProps {
  activeView: MainWorkspaceView;
  setActiveView: (view: MainWorkspaceView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function SidebarNav({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed
}: SidebarNavProps) {
  const { operatorProfile, signOut, isAuthenticated } = useAuthContext();
  const { currentRoute } = useRouteContext();

  if (!isAuthenticated) return null;

  const roleInfo = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  const navItems: { id: MainWorkspaceView; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { 
      id: 'routes', 
      label: 'Route Assessments', 
      icon: MapPin, 
      description: 'GIS Map, Hazards, Flashcards' 
    },
    { 
      id: 'fleet', 
      label: 'Depot Bus Fleet', 
      icon: Bus, 
      description: 'Vehicle Specs & Depot Allocations' 
    },
    { 
      id: 'depots', 
      label: 'Regions & Depots', 
      icon: Building2, 
      description: 'Garages & Emergency Contacts' 
    },
    { 
      id: 'users', 
      label: 'Team & Hierarchy', 
      icon: Users, 
      description: 'Master, Regional, Depot Admins' 
    },
    { 
      id: 'settings', 
      label: 'System & Profile', 
      icon: Settings, 
      description: 'Assessor ID & Cloud Backups' 
    }
  ];

  return (
    <aside
      className={'bg-stagecoach-navy text-white flex flex-col justify-between border-r border-slate-800 transition-all duration-300 shadow-2xl relative z-30 shrink-0 select-none ' + (
        isCollapsed ? 'w-16 sm:w-20' : 'w-64 sm:w-72'
      )}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
              SC
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-wide text-white">STAGECOACH</span>
                  <span className="text-[9px] bg-stagecoach-amber/20 text-stagecoach-amber border border-stagecoach-amber/30 px-1 py-0.2 rounded font-bold">
                    RRA
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Enterprise Safety Network
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Card (When Expanded) */}
        {!isCollapsed && (
          <div className="p-3.5 m-3 rounded-2xl bg-slate-900/80 border border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className={'text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ' + roleInfo.badgeColor}>
                {roleInfo.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {operatorProfile.assessorNumber || 'SC-HQ'}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold text-white block truncate">
                {operatorProfile.displayName}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 truncate">
                <span>{operatorProfile.region || 'UK Network'}</span>
                <span>•</span>
                <span>{operatorProfile.depot || 'Depot'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu List */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={'w-full flex items-center rounded-xl transition-all font-semibold text-xs ' + (
                  isCollapsed 
                    ? 'justify-center p-3.5 ' 
                    : 'space-x-3 px-3.5 py-3 '
                ) + (
                  isActive
                    ? 'bg-stagecoach-amber text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )}
                title={item.label}
              >
                <Icon className={'w-5 h-5 shrink-0 ' + (isActive ? 'text-slate-950' : 'text-slate-400')} />
                
                {!isCollapsed && (
                  <div className="text-left animate-in fade-in duration-150">
                    <span className="block text-xs leading-none">{item.label}</span>
                    <span className={'text-[10px] mt-0.5 block line-clamp-1 ' + (
                      isActive ? 'text-slate-800 font-medium' : 'text-slate-400'
                    )}>
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & Log Out */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => signOut()}
          className={'w-full flex items-center rounded-xl text-red-300 hover:text-red-100 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 transition text-xs font-semibold ' + (
            isCollapsed 
              ? 'justify-center p-3' 
              : 'space-x-2.5 px-3 py-2.5'
          )}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
