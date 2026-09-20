"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouteContext } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import SidebarNav, { MainWorkspaceView } from '@/components/common/SidebarNav';
import DepotFleetManagement from '@/components/fleet/DepotFleetManagement';
import DepotsManagementView from '@/components/depots/DepotsManagementView';
import UserManagementView from '@/components/admin/UserManagementView';
import SettingsView from '@/components/settings/SettingsView';
import HazardRegister from '@/components/hazards/HazardRegister';
import FleetCompatibility from '@/components/fleet/FleetCompatibility';
import DriverFlashcard from '@/components/driver/DriverFlashcard';
import GovernanceSignOff from '@/components/governance/GovernanceSignOff';
import { 
  Bus, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Compass, 
  FileCheck2 
} from 'lucide-react';

// Dynamically import LeafletMap with SSR disabled
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-125px)] sm:h-[calc(100vh-115px)] bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 rounded-full border-4 border-stagecoach-amber border-t-transparent animate-spin mb-4"></div>
      <p className="font-bold text-base">Loading Stagecoach GIS Engine...</p>
      <p className="text-xs text-slate-400 mt-1">Calibrating UK GPS & Vector Layers</p>
    </div>
  ),
});

export default function HomePage() {
  const { isAuthenticated, loading } = useAuthContext();
  const [activeMainView, setActiveMainView] = useState<MainWorkspaceView>('routes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { 
    activeTab, 
    currentRoute, 
    routes, 
    filteredRoutes, 
    selectedRegionFilter, 
    selectedGarageFilter, 
    setSelectedRegionFilter, 
    setSelectedGarageFilter, 
    availableRegionsForFilter, 
    availableGaragesForFilter, 
    createNewRoute 
  } = useRouteContext();

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [initRegion, setInitRegion] = useState('');
  const [initDepot, setInitDepot] = useState('');
  const [initNumber, setInitNumber] = useState('');
  const [initTitle, setInitTitle] = useState('');
  const [initAssessor, setInitAssessor] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-stagecoach-amber border-t-transparent animate-spin mb-4"></div>
        <p className="font-bold text-sm">Authenticating Stagecoach Session...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to UK Safety Network</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initNumber.trim() || !initTitle.trim()) return;
    createNewRoute(
      initNumber.trim(), 
      initTitle.trim(), 
      initRegion.trim() || 'Region 1', 
      initDepot.trim() || 'Main Depot',
      initAssessor.trim() || undefined
    );
    setInitNumber('');
    setInitTitle('');
    setInitRegion('');
    setInitDepot('');
    setInitAssessor('');
    setIsOnboardingModalOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden bg-slate-100">
      
      {/* Left Persistent Navigation Sidebar */}
      <SidebarNav
        activeView={activeMainView}
        setActiveView={setActiveMainView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Active Workspace */}
      <div className="flex-1 h-full overflow-y-auto relative">
        
        {/* VIEW 1: ROUTE RISK ASSESSMENTS & GIS */}
        {activeMainView === 'routes' && (
          <div>
            {!currentRoute ? (
              routes.length > 0 && filteredRoutes.length === 0 ? (
                <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
                  <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Bus className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">No Routes Found for Current Filter</h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      No route assessments match region <strong className="text-slate-800">{selectedRegionFilter || 'All'}</strong> and garage <strong className="text-slate-800">{selectedGarageFilter || 'All'}</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedRegionFilter('');
                        setSelectedGarageFilter('');
                      }}
                      className="px-4 py-2.5 bg-stagecoach-navy hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => {
                        setInitRegion(selectedRegionFilter || '');
                        setInitDepot(selectedGarageFilter || '');
                        setIsOnboardingModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Route for this Garage</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Clean Slate Initial Onboarding Hero */
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
                  <div className="bg-gradient-to-br from-stagecoach-navy via-slate-900 to-stagecoach-blue rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-stagecoach-amber/15 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="max-w-2xl relative z-10 space-y-4">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stagecoach-amber/20 border border-stagecoach-amber/30 text-stagecoach-amber text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ready for Enterprise Live Route Assessments</span>
                      </div>
                      
                      <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                        Stagecoach Route Risk Assessment & GPS Survey Platform
                      </h1>
                      
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Database initialized. Create your official route assessment below, record high-precision live GPS bus corridors, and evaluate hazards on the 5x5 HSE risk matrix.
                      </p>

                      <div className="pt-2 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setInitRegion(selectedRegionFilter || '');
                            setInitDepot(selectedGarageFilter || '');
                            setIsOnboardingModalOpen(true);
                          }}
                          className="px-6 py-3.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Create First Route Risk Assessment</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feature Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-stagecoach-blue flex items-center justify-center font-bold">
                        <Compass className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">Live GPS Tracking & Vector Waypoints</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Trace outbound and inbound bus routes in real-time or import GPS tracks with automatic corridor polyline generation.
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">5x5 HSE Risk Matrix Register</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Log low bridges, tight turns, school crossings, and tree strikes with pre & post control risk scoring.
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900">A4 Safety Flashcards & Sign-Off</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Generate driver hazard cards, depot emergency hotlines, and safety director governance sign-offs.
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Active Route Workspace Tabs */
              <div className="w-full h-full pb-20 md:pb-6">
                {activeTab === 'map' && <LeafletMap />}
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
        )}

        {/* VIEW 2: DEPOT BUS FLEET MANAGEMENT */}
        {activeMainView === 'fleet' && <DepotFleetManagement />}

        {/* VIEW 3: REGIONS & DEPOTS DIRECTORY */}
        {activeMainView === 'depots' && <DepotsManagementView />}

        {/* VIEW 4: TEAM & ROLE HIERARCHY */}
        {activeMainView === 'users' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <UserManagementView />
          </div>
        )}

        {/* VIEW 5: OPERATOR PROFILE & SYSTEM SETTINGS */}
        {activeMainView === 'settings' && <SettingsView />}

      </div>

      {/* Onboarding Create Route Modal */}
      {isOnboardingModalOpen && (
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
                onClick={() => setIsOnboardingModalOpen(false)}
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
                    value={initRegion}
                    onChange={(e) => setInitRegion(e.target.value)}
                    placeholder="e.g. North Scotland"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Depot / Garage</label>
                  <input
                    type="text"
                    required
                    value={initDepot}
                    onChange={(e) => setInitDepot(e.target.value)}
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
                    value={initNumber}
                    onChange={(e) => setInitNumber(e.target.value)}
                    placeholder="e.g. 10A, X99"
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Safety Assessor</label>
                  <input
                    type="text"
                    value={initAssessor}
                    onChange={(e) => setInitAssessor(e.target.value)}
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
                  value={initTitle}
                  onChange={(e) => setInitTitle(e.target.value)}
                  placeholder="e.g. Inverness Bus Station to Aviemore Rail Interchange"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Create & Launch GIS Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
