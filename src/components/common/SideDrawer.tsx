"use client";

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  X, 
  User, 
  Phone, 
  Bus, 
  Cloud, 
  ShieldCheck, 
  LogOut, 
  Save, 
  Building2, 
  Warehouse, 
  Mail, 
  BadgeAlert, 
  Download, 
  Wifi, 
  ChevronRight,
  Sparkles,
  PhoneCall,
  HardHat,
  Scale
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function SideDrawer() {
  const { 
    isSideDrawerOpen, 
    setIsSideDrawerOpen, 
    activeDrawerTab, 
    setActiveDrawerTab,
    user, 
    operatorProfile, 
    updateOperatorProfile, 
    signOut,
    setIsLoginModalOpen 
  } = useAuthContext();
  
  const { routes, showToast } = useRouteContext();

  // Profile Form State
  const [displayName, setDisplayName] = useState(operatorProfile.displayName);
  const [role, setRole] = useState(operatorProfile.role);
  const [region, setRegion] = useState(operatorProfile.region);
  const [depot, setDepot] = useState(operatorProfile.depot);
  const [phone, setPhone] = useState(operatorProfile.phone);
  const [assessorNumber, setAssessorNumber] = useState(operatorProfile.assessorNumber);

  // Contacts Form State
  const [controlRoomPhone, setControlRoomPhone] = useState(operatorProfile.emergencyContacts.controlRoomPhone);
  const [depotManager, setDepotManager] = useState(operatorProfile.emergencyContacts.depotManager);
  const [fleetEngineeringPhone, setFleetEngineeringPhone] = useState(operatorProfile.emergencyContacts.fleetEngineeringPhone);
  const [policeLiaison, setPoliceLiaison] = useState(operatorProfile.emergencyContacts.policeLiaison);

  // Fleet Standards Form State
  const [maxHeight, setMaxHeight] = useState(operatorProfile.fleetDefaults.maxDoubleDeckerHeightM);
  const [evAllowed, setEvAllowed] = useState(operatorProfile.fleetDefaults.evAllowedByDefault);
  const [minTurningRadius, setMinTurningRadius] = useState(operatorProfile.fleetDefaults.minTurningRadiusM);

  if (!isSideDrawerOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOperatorProfile({
      displayName,
      role,
      region,
      depot,
      phone,
      assessorNumber
    });
    showToast('Operator Profile updated successfully');
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOperatorProfile({
      emergencyContacts: {
        controlRoomPhone,
        depotManager,
        fleetEngineeringPhone,
        policeLiaison
      }
    });
    showToast('Depot Emergency Contacts saved');
  };

  const handleSaveFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOperatorProfile({
      fleetDefaults: {
        maxDoubleDeckerHeightM: Number(maxHeight),
        evAllowedByDefault: evAllowed,
        minTurningRadiusM: Number(minTurningRadius)
      }
    });
    showToast('Regional Fleet Standards saved');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(routes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'stagecoach_rra_backup_' + new Date().toISOString().split('T')[0] + '.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database exported as JSON');
  };

  const navTabs: { id: 'profile' | 'contacts' | 'fleet' | 'sync' | 'security'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Operator Profile', icon: User },
    { id: 'contacts', label: 'Depot Directory', icon: Phone },
    { id: 'fleet', label: 'Fleet Standards', icon: Bus },
    { id: 'sync', label: 'Cloud & Database', icon: Cloud },
    { id: 'security', label: 'Account & Sign Out', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={() => setIsSideDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Sliding Drawer Container */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col border-r border-slate-200">
          
          {/* Top Header Card */}
          <div className="bg-stagecoach-navy text-white p-5 relative overflow-hidden border-b border-slate-800">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-stagecoach-amber/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                  {operatorProfile.displayName ? operatorProfile.displayName.charAt(0).toUpperCase() : 'SC'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white line-clamp-1">
                    {operatorProfile.displayName || 'Stagecoach Assessor'}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    {operatorProfile.role || 'Route Risk Assessor'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSideDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close Side Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Region Strip */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-300 font-medium flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-stagecoach-amber mr-1" />
                <span>{operatorProfile.region || 'UK Region'}</span>
                <span className="text-slate-500">•</span>
                <span>{operatorProfile.depot || 'Depot'}</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{user ? 'Authenticated' : 'Offline Mode'}</span>
              </span>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex space-x-1 overflow-x-auto scrollbar-none text-xs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDrawerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDrawerTab(tab.id)}
                  className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ' + (
                    isActive 
                      ? 'bg-stagecoach-blue text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  )}
                >
                  <Icon className={'w-3.5 h-3.5 ' + (isActive ? 'text-white' : 'text-slate-500')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* 1. OPERATOR PROFILE TAB */}
            {activeDrawerTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Personal & Assessor Information</h4>
                  <p className="text-xs text-slate-500">Details attached to risk assessment signatures and driver flashcards.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name / Assessor Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Role</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Badge / ID</label>
                    <input
                      type="text"
                      value={assessorNumber}
                      onChange={(e) => setAssessorNumber(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Region</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Home Depot</label>
                    <input
                      type="text"
                      value={depot}
                      onChange={(e) => setDepot(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </form>
            )}

            {/* 2. DEPOT & EMERGENCY DIRECTORY TAB */}
            {activeDrawerTab === 'contacts' && (
              <form onSubmit={handleSaveContacts} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Regional Depot & Emergency Contacts</h4>
                  <p className="text-xs text-slate-500">Emergency numbers embedded into Driver Flashcards and Governance notices.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operations Control Room Telephone</label>
                  <input
                    type="text"
                    value={controlRoomPhone}
                    onChange={(e) => setControlRoomPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Depot Duty Operations Manager</label>
                  <input
                    type="text"
                    value={depotManager}
                    onChange={(e) => setDepotManager(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Engineering Breakdown Hotline</label>
                  <input
                    type="text"
                    value={fleetEngineeringPhone}
                    onChange={(e) => setFleetEngineeringPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Police / Highways Liaison Number</label>
                  <input
                    type="text"
                    value={policeLiaison}
                    onChange={(e) => setPoliceLiaison(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Depot Contacts</span>
                </button>
              </form>
            )}

            {/* 3. FLEET MASTER STANDARDS TAB */}
            {activeDrawerTab === 'fleet' && (
              <form onSubmit={handleSaveFleet} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Regional Fleet Master Standards</h4>
                  <p className="text-xs text-slate-500">Default safety thresholds applied to all new route risk surveys.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Double Decker Vehicle Height (Metres)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">UK standard double-decker height clearance is typically 4.40m.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Turning Radius Requirement (Metres)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minTurningRadius}
                    onChange={(e) => setMinTurningRadius(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="evCheck"
                    checked={evAllowed}
                    onChange={(e) => setEvAllowed(e.target.checked)}
                    className="w-4 h-4 text-stagecoach-blue rounded focus:ring-stagecoach-blue cursor-pointer"
                  />
                  <label htmlFor="evCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Enable Electric Bus (EV) allocation by default
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Fleet Standards</span>
                </button>
              </form>
            )}

            {/* 4. CLOUD & DATABASE TAB */}
            {activeDrawerTab === 'sync' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cloud Sync & Database Health</h4>
                  <p className="text-xs text-slate-500">Live connection to Google Firebase Firestore backend.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Firebase Firestore</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{isFirebaseConfigured ? 'Connected' : 'Offline'}</span>
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-600 space-y-1 font-mono text-[11px]">
                    <div>Project ID: <strong className="text-slate-900">stagecoach-fc943</strong></div>
                    <div>Total Routes in DB: <strong className="text-slate-900">{routes.length}</strong></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleExportData}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-stagecoach-amber" />
                    <span>Export All Routes to JSON Backup</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. SECURITY & SIGN OUT TAB */}
            {activeDrawerTab === 'security' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Account & Security</h4>
                  <p className="text-xs text-slate-500">Manage your active authentication session and security credentials.</p>
                </div>

                {user ? (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-stagecoach-blue" />
                      <span className="text-xs text-slate-700 font-semibold">{user.email}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Signed in via Firebase Authentication
                    </div>

                    <button
                      onClick={signOut}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out of Safety Portal</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-center">
                    <p className="text-xs text-slate-600">
                      You are currently running in <strong>Offline Field Assessor Mode</strong>.
                    </p>
                    <button
                      onClick={() => {
                        setIsSideDrawerOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In with Firebase Account</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Stagecoach RRA Enterprise</span>
            <span className="font-mono text-[10px]">v2.4 Live UK</span>
          </div>

        </div>
      </div>
    </div>
  );
}
