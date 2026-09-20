"use client";

import React, { useState } from 'react';
import { useAuthContext, ROLE_LABELS } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  User, 
  Phone, 
  Bus, 
  Cloud, 
  ShieldCheck, 
  LogOut, 
  Save, 
  Building2, 
  Warehouse, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  PhoneCall,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function SettingsView() {
  const { 
    user, 
    operatorProfile, 
    updateOperatorProfile, 
    signOut 
  } = useAuthContext();

  const { routes, showToast } = useRouteContext();

  // Profile Form
  const [displayName, setDisplayName] = useState(operatorProfile.displayName);
  const [region, setRegion] = useState(operatorProfile.region);
  const [depot, setDepot] = useState(operatorProfile.depot);
  const [phone, setPhone] = useState(operatorProfile.phone);
  const [assessorNumber, setAssessorNumber] = useState(operatorProfile.assessorNumber);

  // Emergency Contacts
  const [controlRoomPhone, setControlRoomPhone] = useState(operatorProfile.emergencyContacts.controlRoomPhone);
  const [depotManager, setDepotManager] = useState(operatorProfile.emergencyContacts.depotManager);
  const [fleetEngineeringPhone, setFleetEngineeringPhone] = useState(operatorProfile.emergencyContacts.fleetEngineeringPhone);
  const [policeLiaison, setPoliceLiaison] = useState(operatorProfile.emergencyContacts.policeLiaison);

  // Fleet Defaults
  const [maxHeight, setMaxHeight] = useState(operatorProfile.fleetDefaults.maxDoubleDeckerHeightM);
  const [evAllowed, setEvAllowed] = useState(operatorProfile.fleetDefaults.evAllowedByDefault);
  const [minTurningRadius, setMinTurningRadius] = useState(operatorProfile.fleetDefaults.minTurningRadiusM);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOperatorProfile({
      displayName,
      region,
      depot,
      phone,
      assessorNumber,
      emergencyContacts: {
        controlRoomPhone,
        depotManager,
        fleetEngineeringPhone,
        policeLiaison
      },
      fleetDefaults: {
        maxDoubleDeckerHeightM: Number(maxHeight),
        evAllowedByDefault: evAllowed,
        minTurningRadiusM: Number(minTurningRadius)
      }
    });
    setSavedSuccess(true);
    showToast('System configuration & operator profile saved!');
    setTimeout(() => setSavedSuccess(false), 3000);
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

  const roleInfo = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            {operatorProfile.displayName ? operatorProfile.displayName.charAt(0).toUpperCase() : 'SC'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {operatorProfile.displayName}
              </h1>
              <span className={'text-xs font-bold px-2.5 py-0.5 rounded-full border ' + roleInfo.badgeColor}>
                {roleInfo.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {operatorProfile.email || 'Stagecoach Operations Network'} • Assessor ID: {operatorProfile.assessorNumber}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-bold rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center space-x-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>All system configurations and personal credentials successfully synchronized!</span>
          </div>
        )}

        {/* 1. Personal & Assessor Credentials Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-stagecoach-blue" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal & Safety Assessor Credentials</h3>
              <p className="text-xs text-slate-500">Details printed on official safety sign-offs and driver flashcards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Badge Number</label>
              <input
                type="text"
                value={assessorNumber}
                onChange={(e) => setAssessorNumber(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Home Region / Operating Area</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>
          </div>
        </div>

        {/* 2. Regional Emergency & Breakdown Contacts */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Phone className="w-5 h-5 text-stagecoach-amber" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Regional Emergency Directory</h3>
              <p className="text-xs text-slate-500">Printed on driver flashcards for critical on-route incidents.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">24/7 Regional Control Room Hotline</label>
              <input
                type="text"
                value={controlRoomPhone}
                onChange={(e) => setControlRoomPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Depot Duty Manager</label>
              <input
                type="text"
                value={depotManager}
                onChange={(e) => setDepotManager(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fleet Engineering Breakdown Dispatch</label>
              <input
                type="text"
                value={fleetEngineeringPhone}
                onChange={(e) => setFleetEngineeringPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Police Liaison</label>
              <input
                type="text"
                value={policeLiaison}
                onChange={(e) => setPoliceLiaison(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>
          </div>
        </div>

        {/* 3. Fleet Master Clearances */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Bus className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Regional Fleet Master Clearances</h3>
              <p className="text-xs text-slate-500">Benchmark clearance thresholds for low bridge risk ratings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Double Decker Height (m)</label>
              <input
                type="number"
                step="0.05"
                value={maxHeight}
                onChange={(e) => setMaxHeight(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Turning Radius (m)</label>
              <input
                type="number"
                step="0.5"
                value={minTurningRadius}
                onChange={(e) => setMinTurningRadius(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
              />
            </div>

            <div className="flex items-center justify-between pt-5 px-2 bg-slate-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Default EV Fleet</span>
                <span className="text-[10px] text-slate-500">Allow electric buses</span>
              </div>
              <input
                type="checkbox"
                checked={evAllowed}
                onChange={(e) => setEvAllowed(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Complete JSON Database Backup</span>
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4 text-stagecoach-amber" />
            <span>Save Configuration & Credentials</span>
          </button>
        </div>
      </form>
    </div>
  );
}
