"use client";

import React, { useState } from 'react';
import { useAuthContext, ROLE_LABELS } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import UserManagementView from '@/components/admin/UserManagementView';
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
  Scale, 
  Users 
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

  const navTabs: { id: 'profile' | 'users' | 'contacts' | 'fleet' | 'sync' | 'security'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'users', label: 'Team & Roles', icon: Users },
    { id: 'contacts', label: 'Depot Directory', icon: Phone },
    { id: 'fleet', label: 'Fleet Standards', icon: Bus },
    { id: 'sync', label: 'Cloud Database', icon: Cloud },
    { id: 'security', label: 'Security & Sign Out', icon: ShieldCheck },
  ];

  const roleInfo = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={() => setIsSideDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Sliding Drawer Container */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md sm:max-w-xl bg-white shadow-2xl flex flex-col border-r border-slate-200">
          
          {/* Top Header Card */}
          <div className="bg-stagecoach-navy text-white p-5 relative overflow-hidden border-b border-slate-800">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-stagecoach-amber/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                  {operatorProfile.displayName ? operatorProfile.displayName.charAt(0).toUpperCase() : 'SC'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-white line-clamp-1">
                      {operatorProfile.displayName || 'Stagecoach Assessor'}
                    </h3>
                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + roleInfo.badgeColor}>
                      {roleInfo.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    {operatorProfile.email || 'Stagecoach Operations'}
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
                <span>{user ? 'Cloud Active' : 'Field Offline'}</span>
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
                  <h4 className="text-sm font-bold text-slate-900">Personal & Assessor Credentials</h4>
                  <p className="text-xs text-slate-500">Details attached to risk assessment signatures and driver flashcards.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor ID Badge</label>
                    <input
                      type="text"
                      value={assessorNumber}
                      onChange={(e) => setAssessorNumber(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Home Region</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Depot</label>
                    <input
                      type="text"
                      value={depot}
                      onChange={(e) => setDepot(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stagecoach-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-2 transition"
                  >
                    <Save className="w-4 h-4 text-stagecoach-amber" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. TEAM & ROLES HIERARCHY TAB */}
            {activeDrawerTab === 'users' && (
              <div className="animate-in fade-in duration-150">
                <UserManagementView />
              </div>
            )}

            {/* 3. DEPOT DIRECTORY & EMERGENCY CONTACTS TAB */}
            {activeDrawerTab === 'contacts' && (
              <form onSubmit={handleSaveContacts} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Regional Emergency & Depot Directory</h4>
                  <p className="text-xs text-slate-500">Contact details printed on driver flashcards for critical incidents.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">24/7 Regional Control Room Hotline</label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={controlRoomPhone}
                      onChange={(e) => setControlRoomPhone(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Depot Duty Manager Contact</label>
                  <input
                    type="text"
                    value={depotManager}
                    onChange={(e) => setDepotManager(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fleet Breakdown & Engineering Dispatch</label>
                  <input
                    type="text"
                    value={fleetEngineeringPhone}
                    onChange={(e) => setFleetEngineeringPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Police Liaison / Emergency</label>
                  <input
                    type="text"
                    value={policeLiaison}
                    onChange={(e) => setPoliceLiaison(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stagecoach-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-2 transition"
                  >
                    <Save className="w-4 h-4 text-stagecoach-amber" />
                    <span>Save Emergency Contacts</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. FLEET MASTER CLEARANCES TAB */}
            {activeDrawerTab === 'fleet' && (
              <form onSubmit={handleSaveFleet} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Regional Fleet Master Standards</h4>
                  <p className="text-xs text-slate-500">Default engineering parameters used for vehicle clearances.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Double Decker Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Standard Stagecoach DD height is ~4.40m</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Minimum Safe Turning Circle Radius (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={minTurningRadius}
                      onChange={(e) => setMinTurningRadius(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Allow EV Fleet by Default</span>
                      <span className="text-[11px] text-slate-500">Enable Electric Bus corridor compatibility</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={evAllowed}
                      onChange={(e) => setEvAllowed(e.target.checked)}
                      className="w-4 h-4 text-stagecoach-blue rounded border-slate-300 focus:ring-stagecoach-blue"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stagecoach-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-2 transition"
                  >
                    <Save className="w-4 h-4 text-stagecoach-amber" />
                    <span>Save Fleet Standards</span>
                  </button>
                </div>
              </form>
            )}

            {/* 5. CLOUD DATABASE & BACKUP TAB */}
            {activeDrawerTab === 'sync' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Database & Cloud Synchronization</h4>
                  <p className="text-xs text-slate-500">Export route assessments or verify Firestore cloud sync.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Firestore Cloud Backend</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {isFirebaseConfigured ? 'stagecoach-fc943' : 'Local Offline'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Total Loaded Routes in DB</span>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {routes.length} Active
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExportData}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Export Full JSON Database Backup</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. SECURITY & SIGN OUT TAB */}
            {activeDrawerTab === 'security' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Account Security & Session</h4>
                  <p className="text-xs text-slate-500">Manage your active authentication session.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Status</span>
                    <span className="font-semibold text-slate-800">{user ? 'Signed In (Cloud)' : 'Field Offline'}</span>
                  </div>
                  {user && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Firebase User UID</span>
                      <span className="font-mono text-[11px] text-slate-700 truncate max-w-[170px]">{user.uid}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => signOut()}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Stagecoach RRA</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
