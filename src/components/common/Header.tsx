"use client";

import React, { useState } from 'react';
import { useRouteContext, ActiveTab } from '@/context/RouteContext';
import { STAGECOACH_UK_REGIONS } from '@/types/route';
import { 
  Bus, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Plus, 
  RotateCcw, 
  Wifi, 
  Cloud,
  Trash2,
  Building2,
  Warehouse,
  FolderOpen
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function Header() {
  const { 
    routes,
    filteredRoutes,
    currentRouteId, 
    currentRoute, 
    selectRoute, 
    activeTab, 
    setActiveTab,
    selectedRegionFilter,
    setSelectedRegionFilter,
    selectedGarageFilter,
    setSelectedGarageFilter,
    availableRegionsForFilter,
    availableGaragesForFilter,
    createNewRoute,
    showConfirmModal,
    deleteCurrentRoute,
    resetToCleanSlate,
    loadSampleTemplateRoutes
  } = useRouteContext();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalRegion, setModalRegion] = useState('');
  const [modalDepot, setModalDepot] = useState('');
  const [modalRouteNumber, setModalRouteNumber] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalAssessor, setModalAssessor] = useState('');

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRouteNumber.trim() || !modalTitle.trim()) return;
    createNewRoute(
      modalRouteNumber.trim(), 
      modalTitle.trim(), 
      modalRegion.trim() || 'Stagecoach UK', 
      modalDepot.trim() || 'Depot',
      modalAssessor.trim() || undefined
    );
    setModalRouteNumber('');
    setModalTitle('');
    setModalRegion('');
    setModalDepot('');
    setModalAssessor('');
    setIsNewModalOpen(false);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'map', label: 'GIS & Route Map', icon: MapPin },
    { id: 'hazards', label: 'Hazard Register', icon: AlertTriangle, count: currentRoute?.hazards.length || 0 },
    { id: 'fleet', label: 'Fleet Clearance', icon: Bus },
    { id: 'driver', label: 'Driver Flashcard', icon: FileText },
    { id: 'governance', label: 'Governance Sign-off', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="bg-stagecoach-navy border-b border-slate-800 text-white shadow-lg sticky top-0 z-40">
        {/* Top Corporate Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Brand Logo & System Title */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-stagecoach-amber flex items-center justify-center font-black text-lg shadow-md tracking-tighter text-white shrink-0">
              SC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">STAGECOACH</span>
                <span className="text-[10px] bg-stagecoach-amber/20 text-stagecoach-amber border border-stagecoach-amber/30 px-1.5 py-0.2 rounded-full font-semibold">
                  RRA Enterprise
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium line-clamp-1">
                Route Risk Assessment & GPS Platform
              </p>
            </div>
          </div>

          {/* 3-Tier Cascading Filter Toolbar */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            
            {/* TIER 1: Region Selector Dropdown */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 shadow-inner">
              <Building2 className="w-3.5 h-3.5 text-stagecoach-amber mr-1.5 shrink-0" />
              <select
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                aria-label="Filter by UK Region"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-200">🇬🇧 All Regions</option>
                {availableRegionsForFilter.map((reg) => (
                  <option key={reg} value={reg} className="bg-slate-900 text-slate-200">
                    {reg.replace('Stagecoach ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* TIER 2: Garage / Depot Dropdown */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 shadow-inner">
              <Warehouse className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
              <select
                value={selectedGarageFilter}
                onChange={(e) => setSelectedGarageFilter(e.target.value)}
                aria-label="Filter by Garage / Depot"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Garages</option>
                {availableGaragesForFilter.map((garage) => (
                  <option key={garage} value={garage} className="bg-slate-900 text-slate-200">
                    {garage}
                  </option>
                ))}
              </select>
            </div>

            {/* TIER 3: Route Selector Dropdown */}
            <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 shadow-inner">
              <Bus className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
              <select
                value={currentRouteId}
                onChange={(e) => selectRoute(e.target.value)}
                aria-label="Select active route assessment"
                disabled={filteredRoutes.length === 0}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[190px] truncate disabled:opacity-50"
              >
                {filteredRoutes.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-400">No matching routes</option>
                ) : (
                  filteredRoutes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                      Rte {r.routeNumber} - {r.routeTitle.length > 22 ? r.routeTitle.substring(0, 22) + '...' : r.routeTitle}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* New Route Button */}
            <button
              onClick={() => {
                setModalRegion(selectedRegionFilter || 'Stagecoach Highlands');
                setModalDepot(selectedGarageFilter || 'Aviemore');
                setIsNewModalOpen(true);
              }}
              className="inline-flex items-center px-2.5 py-1.5 bg-stagecoach-blue hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors border border-blue-600"
              title="Create New Route Assessment"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Route</span>
            </button>

            {/* Sync Status Badge */}
            <div className="hidden lg:flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isFirebaseConfigured ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400 ml-0.5" />
                  <span>Cloud Active</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400 ml-0.5" />
                  <span>Offline Ready</span>
                </>
              )}
            </div>

            {/* Print / Export A4 PDF */}
            <button
              onClick={() => window.print()}
              disabled={!currentRoute}
              className="inline-flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 transition-colors disabled:opacity-40"
              title="Print / Save A4 Route Safety Dossier"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-300" />
              <span className="hidden xl:inline">PDF</span>
            </button>

            {/* Load Samples / Template Button */}
            <button
              onClick={() => {
                showConfirmModal({
                  title: 'Load Scottish Highlands Templates?',
                  message: 'This will import the 3 reference Highland routes (Route 37 Aviemore, Route 11 Inverness, Route N44 Fort William) for testing.',
                  confirmText: 'Load Templates',
                  isDestructive: false,
                  onConfirm: () => loadSampleTemplateRoutes(),
                });
              }}
              className="p-1.5 text-slate-400 hover:text-stagecoach-amber rounded-lg hover:bg-slate-800 transition-colors"
              title="Load Scottish Highlands Sample Templates"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>

            {/* Clear All / Clean Slate */}
            <button
              onClick={() => {
                showConfirmModal({
                  title: 'Clear All Routes (Clean Slate)?',
                  message: 'This will clear all route assessments from local memory so you can test creating your own from scratch.',
                  confirmText: 'Clear All Routes',
                  isDestructive: true,
                  onConfirm: () => resetToCleanSlate(),
                });
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear all routes (Clean Slate)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Delete Single Active Route */}
            {currentRoute && (
              <button
                onClick={() => {
                  showConfirmModal({
                    title: 'Delete Route ' + (currentRoute?.routeNumber || '') + '?',
                    message: 'Are you sure you want to delete ' + (currentRoute?.routeTitle || '') + '? All hazards and GIS coordinates for this route will be permanently removed.',
                    confirmText: 'Delete Route',
                    isDestructive: true,
                    onConfirm: () => deleteCurrentRoute(),
                  });
                }}
                className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 transition-colors"
                title="Delete Current Route"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 hidden md:block">
          <nav className="flex space-x-1 border-t border-slate-800/80 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  disabled={!currentRoute}
                  className={'flex items-center space-x-2 py-2 px-3.5 font-semibold text-xs lg:text-sm border-b-2 transition-all disabled:opacity-40 ' + (
                    isActive
                      ? 'border-stagecoach-amber text-stagecoach-amber bg-slate-800/50'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/30'
                  )}
                >
                  <Icon className={'w-4 h-4 ' + (isActive ? 'text-stagecoach-amber' : 'text-slate-400')} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ' + (
                      isActive ? 'bg-stagecoach-amber text-slate-900' : 'bg-slate-700 text-slate-200'
                    )}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Modal: New Route Assessment with Free-Text Typing & Datalist Suggestions */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-stagecoach-blue shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Route Assessment</h3>
                <p className="text-xs text-slate-500">Type any Operating Region & Garage, or choose from suggestions</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-3.5">
              
              {/* Region Field (Type freely or choose from datalist) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Operating Region *</label>
                  <span className="text-[10px] text-slate-400">Type or select suggestion</span>
                </div>
                <input
                  type="text"
                  required
                  list="header-modal-regions"
                  placeholder="e.g. Stagecoach West, Stagecoach London, Stagecoach Highlands..."
                  value={modalRegion}
                  onChange={(e) => setModalRegion(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue bg-white font-medium"
                />
                <datalist id="header-modal-regions">
                  {availableRegionsForFilter.map((reg) => (
                    <option key={reg} value={reg} />
                  ))}
                </datalist>
              </div>

              {/* Garage / Depot Field (Type freely or choose from datalist) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Operating Garage / Depot *</label>
                  <span className="text-[10px] text-slate-400">Type or select suggestion</span>
                </div>
                <input
                  type="text"
                  required
                  list="header-modal-depots"
                  placeholder="e.g. Gloucester, Bow, Inverness, Sharston, Cheltenham..."
                  value={modalDepot}
                  onChange={(e) => setModalDepot(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue bg-white font-medium"
                />
                <datalist id="header-modal-depots">
                  {availableGaragesForFilter.map((garage) => (
                    <option key={garage} value={garage} />
                  ))}
                </datalist>
              </div>

              {/* Route Number & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route / Line # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 37, 192, X5"
                    value={modalRouteNumber}
                    onChange={(e) => setModalRouteNumber(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route Title / Corridor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gloucester - Cheltenham Express"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              {/* Assessor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Name / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Allan Johnson (Lead Risk Assessor)"
                  value={modalAssessor}
                  onChange={(e) => setModalAssessor(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stagecoach-blue hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create Assessment & Open GIS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
