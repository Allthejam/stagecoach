"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouteContext } from '@/context/RouteContext';
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
  FolderOpen, 
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  FileCheck2
} from 'lucide-react';
import { STAGECOACH_UK_REGIONS } from '@/types/route';

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
    createNewRoute,
    loadSampleTemplateRoutes 
  } = useRouteContext();

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [initRegion, setInitRegion] = useState('');
  const [initDepot, setInitDepot] = useState('');
  const [initNumber, setInitNumber] = useState('');
  const [initTitle, setInitTitle] = useState('');
  const [initAssessor, setInitAssessor] = useState('');

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initNumber.trim() || !initTitle.trim()) return;
    createNewRoute(
      initNumber.trim(), 
      initTitle.trim(), 
      initRegion.trim() || 'Stagecoach UK', 
      initDepot.trim() || 'Depot',
      initAssessor.trim() || undefined
    );
    setInitNumber('');
    setInitTitle('');
    setInitRegion('');
    setInitDepot('');
    setInitAssessor('');
    setIsOnboardingModalOpen(false);
  };

  // Render Onboarding / Clean Slate Landing when no route is active
  if (!currentRoute) {
    if (routes.length > 0 && filteredRoutes.length === 0) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Bus className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">No Routes Found for Current Filter</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              No route assessments match <strong className="text-slate-800">{selectedRegionFilter || 'All Regions'}</strong> and garage <strong className="text-slate-800">{selectedGarageFilter || 'All Garages'}</strong>.
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
                setInitRegion(selectedRegionFilter || 'Stagecoach UK');
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
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-stagecoach-navy via-slate-900 to-stagecoach-blue rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-stagecoach-amber/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-stagecoach-amber/20 border border-stagecoach-amber/40 px-3 py-1 rounded-full text-xs font-bold text-stagecoach-amber">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Slate Database Ready</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              UK Stagecoach Route Risk Assessment
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Standardised digital safety dossier, GPS coordinate surveying, 5×5 HSE risk scoring, and fleet clearance engine across all UK operating companies and depots. Type your region and garage to begin.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setInitRegion('Stagecoach Highlands');
                  setInitDepot('Aviemore');
                  setIsOnboardingModalOpen(true);
                }}
                className="px-6 py-3.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Route Assessment</span>
              </button>

              <button
                onClick={() => loadSampleTemplateRoutes()}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition flex items-center space-x-2 cursor-pointer backdrop-blur-sm"
              >
                <FolderOpen className="w-4 h-4 text-stagecoach-amber" />
                <span>Load Scottish Highlands Templates</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-stagecoach-blue">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Custom Regions & Depots</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full flexibility to type any Operating Region and Garage anywhere in the UK, with instant smart suggestions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">5×5 HSE Risk Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Geotagged hazard observations with initial & residual risk calculations, speed limits, and mitigation protocols.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Driver Briefings & Sign-off</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interactive route safety flashcards, double-decker/coach fleet clearance verifications, and digital assessor/manager signatures.
            </p>
          </div>
        </div>

        {/* Modal: New Route Assessment */}
        {isOnboardingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-stagecoach-blue shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Route Assessment</h3>
                  <p className="text-xs text-slate-500">Type any custom Region & Depot or choose from suggestions</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoute} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Operating Region *</label>
                    <span className="text-[10px] text-slate-400">Type or select suggestion</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="landing-modal-regions"
                    placeholder="e.g. Stagecoach West, Stagecoach London, Stagecoach Highlands..."
                    value={initRegion}
                    onChange={(e) => setInitRegion(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue bg-white font-medium"
                  />
                  <datalist id="landing-modal-regions">
                    {availableRegionsForFilter.map((reg) => (
                      <option key={reg} value={reg} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Operating Garage / Depot *</label>
                    <span className="text-[10px] text-slate-400">Type or select suggestion</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="landing-modal-depots"
                    placeholder="e.g. Gloucester, Bow, Inverness, Sharston, Cheltenham..."
                    value={initDepot}
                    onChange={(e) => setInitDepot(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue bg-white font-medium"
                  />
                  <datalist id="landing-modal-depots">
                    {availableGaragesForFilter.map((garage) => (
                      <option key={garage} value={garage} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Route / Line # *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 37, 192, 94"
                      value={initNumber}
                      onChange={(e) => setInitNumber(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Route Title / Corridor *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gloucester - Cheltenham Express"
                      value={initTitle}
                      onChange={(e) => setInitTitle(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Name / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Allan Johnson (Lead Risk Assessor)"
                    value={initAssessor}
                    onChange={(e) => setInitAssessor(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOnboardingModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stagecoach-blue hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Create & Launch GIS</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {activeTab === 'map' && <LeafletMap />}
      {activeTab === 'hazards' && <HazardRegister />}
      {activeTab === 'fleet' && <FleetCompatibility />}
      {activeTab === 'driver' && <DriverFlashcard />}
      {activeTab === 'governance' && <GovernanceSignOff />}
    </div>
  );
}
