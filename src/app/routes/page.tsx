"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouteContext, ActiveTab } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import HazardRegister from '@/components/hazards/HazardRegister';
import FleetCompatibility from '@/components/fleet/FleetCompatibility';
import DriverFlashcard from '@/components/driver/DriverFlashcard';
import GovernanceSignOff from '@/components/governance/GovernanceSignOff';
import RouteAssignmentManager from '@/components/routes/RouteAssignmentManager';
import { 
  Bus, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  RotateCcw, 
  FileText,
  Printer,
  Trash2,
  Building2,
  Warehouse,
  ClipboardList
} from 'lucide-react';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-170px)] bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 rounded-full border-4 border-stagecoach-amber border-t-transparent animate-spin mb-4"></div>
      <p className="font-bold text-base">Loading Stagecoach GIS Engine...</p>
      <p className="text-xs text-slate-400 mt-1">Calibrating UK GPS & Vector Layers</p>
    </div>
  ),
});

export default function RoutesPage() {
  const { isAuthenticated, loading, operatorProfile } = useAuthContext();
  const { 
    activeTab, 
    setActiveTab,
    currentRouteId,
    currentRoute, 
    routes, 
    filteredRoutes, 
    selectRoute,
    selectedRegionFilter, 
    selectedGarageFilter, 
    setSelectedRegionFilter, 
    setSelectedGarageFilter, 
    availableRegionsForFilter, 
    availableGaragesForFilter, 
    createNewRoute,
    deleteCurrentRoute,
    showConfirmModal
  } = useRouteContext();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalRegion, setModalRegion] = useState('');
  const [modalDepot, setModalDepot] = useState('');
  const [modalNumber, setModalNumber] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalAssessor, setModalAssessor] = useState('');

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading Route Assessments...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNumber.trim() || !modalTitle.trim()) return;
    createNewRoute(
      modalNumber.trim(), 
      modalTitle.trim(), 
      modalRegion.trim() || operatorProfile.region || 'North Scotland', 
      modalDepot.trim() || operatorProfile.depot || 'Inverness Depot',
      modalAssessor.trim() || operatorProfile.displayName || undefined
    );
    setModalNumber('');
    setModalTitle('');
    setModalRegion('');
    setModalDepot('');
    setModalAssessor('');
    setIsNewModalOpen(false);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'map', label: 'GIS & Route Map', icon: MapPin },
    { id: 'assignments', label: 'Assessor Delegation', icon: ClipboardList },
    { id: 'hazards', label: 'Hazard Register', icon: AlertTriangle, count: currentRoute?.hazards.length || 0 },
    { id: 'fleet', label: 'Fleet Clearance', icon: Bus },
    { id: 'driver', label: 'Driver Flashcard', icon: FileText },
    { id: 'governance', label: 'Governance Sign-off', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-slate-100">
      
      {/* Secondary Route Assessment Filter Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-2.5 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Cascading Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* TIER 1: Region */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-inner">
              <Building2 className="w-3.5 h-3.5 text-stagecoach-amber mr-1.5 shrink-0" />
              <select
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                disabled={availableRegionsForFilter.length === 0}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="" className="bg-slate-900">
                  {availableRegionsForFilter.length === 0 ? 'No Regions' : 'All Regions (' + availableRegionsForFilter.length + ')'}
                </option>
                {availableRegionsForFilter.map((reg) => (
                  <option key={reg} value={reg} className="bg-slate-900">{reg}</option>
                ))}
              </select>
            </div>

            {/* TIER 2: Depot */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-inner">
              <Warehouse className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
              <select
                value={selectedGarageFilter}
                onChange={(e) => setSelectedGarageFilter(e.target.value)}
                disabled={availableGaragesForFilter.length === 0}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="" className="bg-slate-900">
                  {availableGaragesForFilter.length === 0 ? 'No Depots' : 'All Depots (' + availableGaragesForFilter.length + ')'}
                </option>
                {availableGaragesForFilter.map((garage) => (
                  <option key={garage} value={garage} className="bg-slate-900">{garage}</option>
                ))}
              </select>
            </div>

            {/* TIER 3: Route */}
            <div className="flex items-center bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 shadow-inner">
              <Bus className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
              <select
                value={currentRouteId}
                onChange={(e) => selectRoute(e.target.value)}
                disabled={filteredRoutes.length === 0}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {filteredRoutes.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-400">No routes found</option>
                ) : (
                  filteredRoutes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900">
                      Rte {r.routeNumber} - {r.routeTitle}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* New Route Button */}
            <button
              onClick={() => {
                setModalRegion(selectedRegionFilter || operatorProfile.region || '');
                setModalDepot(selectedGarageFilter || operatorProfile.depot || '');
                setModalAssessor(operatorProfile.displayName || '');
                setIsNewModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stagecoach-blue hover:bg-blue-700 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Route</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              disabled={!currentRoute}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 transition disabled:opacity-40 flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Dossier</span>
            </button>

            {currentRoute && (
              <button
                onClick={() => {
                  showConfirmModal({
                    title: 'Delete Route ' + (currentRoute?.routeNumber || '') + '?',
                    message: 'Are you sure you want to delete ' + (currentRoute?.routeTitle || '') + '? All hazards and GPS tracks will be removed.',
                    confirmText: 'Delete Route',
                    isDestructive: true,
                    onConfirm: () => deleteCurrentRoute(),
                  });
                }}
                className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 transition"
                title="Delete Current Route"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Route Assessment Tabs Strip */}
        <div className="max-w-7xl mx-auto pt-2 border-t border-slate-800 flex space-x-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                disabled={!currentRoute}
                className={'flex items-center space-x-2 py-1.5 px-3 rounded-lg font-semibold text-xs transition whitespace-nowrap disabled:opacity-40 ' + (
                  isActive
                    ? 'bg-stagecoach-amber text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className={'w-3.5 h-3.5 ' + (isActive ? 'text-slate-950' : 'text-slate-400')} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={'px-1.5 py-0.2 rounded-full text-[10px] font-black ' + (
                    isActive ? 'bg-slate-950 text-white' : 'bg-red-600 text-white'
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Route Content */}
      <div className="flex-1">
        {!currentRoute ? (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Bus className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">No Active Route Selected</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Select a route from the top toolbar or create a new assessment for your depot.
              </p>
            </div>
            <button
              onClick={() => {
                setModalRegion(selectedRegionFilter || operatorProfile.region || '');
                setModalDepot(selectedGarageFilter || operatorProfile.depot || '');
                setModalAssessor(operatorProfile.displayName || '');
                setIsNewModalOpen(true);
              }}
              className="px-6 py-3 bg-stagecoach-navy hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              + Create New Route Risk Assessment
            </button>
          </div>
        ) : (
          <div className="w-full h-full pb-12">
            {activeTab === 'map' && <LeafletMap />}
            {activeTab === 'assignments' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <RouteAssignmentManager />
              </div>
            )}
            {activeTab === 'hazards' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <HazardRegister />
              </div>
            )}
            {activeTab === 'fleet' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <FleetCompatibility />
              </div>
            )}
            {activeTab === 'driver' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <DriverFlashcard />
              </div>
            )}
            {activeTab === 'governance' && (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
                <GovernanceSignOff />
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Route Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stagecoach-navy text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Create New Route Risk Assessment</h3>
                  <p className="text-[11px] text-slate-300">Set route number, operating company, region and garage</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Region</label>
                  <input
                    type="text"
                    required
                    value={modalRegion}
                    onChange={(e) => setModalRegion(e.target.value)}
                    placeholder="e.g. North Scotland"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Depot / Garage</label>
                  <input
                    type="text"
                    required
                    value={modalDepot}
                    onChange={(e) => setModalDepot(e.target.value)}
                    placeholder="e.g. Inverness Depot"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Route Number / Line</label>
                  <input
                    type="text"
                    required
                    value={modalNumber}
                    onChange={(e) => setModalNumber(e.target.value)}
                    placeholder="e.g. 10A, X99"
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Safety Assessor</label>
                  <input
                    type="text"
                    value={modalAssessor}
                    onChange={(e) => setModalAssessor(e.target.value)}
                    placeholder="Assessor Name"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Route Title / Corridor Name</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Inverness Bus Station to Aviemore Rail Interchange"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Create & Launch Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
