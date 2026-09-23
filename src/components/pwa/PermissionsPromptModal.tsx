"use client";

import React, { useState } from 'react';
import { usePwa } from '@/context/PwaContext';
import { 
  Navigation, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Lock, 
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';

export default function PermissionsPromptModal() {
  const { 
    isPermissionsModalOpen, 
    closePermissionsModal, 
    gpsPermission, 
    cameraPermission,
    notificationPermission, 
    requestAllPermissions,
    requestGpsPermission,
    requestCameraPermission,
    requestNotificationPermission
  } = usePwa();

  const [isRequesting, setIsRequesting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isPermissionsModalOpen) return null;

  const handleEnableAll = async () => {
    setIsRequesting(true);
    setFeedbackMsg(null);
    const res = await requestAllPermissions();
    setIsRequesting(false);

    if (res.gps && res.notifications) {
      setFeedbackMsg('All field permissions enabled successfully!');
      setTimeout(() => {
        closePermissionsModal();
      }, 1500);
    } else if (res.gps) {
      setFeedbackMsg('GPS Location enabled. (Push notifications optional).');
      setTimeout(() => {
        closePermissionsModal();
      }, 1500);
    } else {
      setFeedbackMsg('GPS permission was blocked. Please check your browser address bar settings.');
    }
  };

  const isGpsGranted = gpsPermission === 'granted';
  const isCameraGranted = cameraPermission === 'granted';
  const isNotifGranted = notificationPermission === 'granted';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-[#001733] via-[#00244d] to-[#001733] flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Field Operations Setup
              </span>
              <h3 className="text-base font-black text-white mt-1">
                Enable Field Permissions
              </h3>
            </div>
          </div>
          <button
            onClick={closePermissionsModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions Body */}
        <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            To perform live Route Risk Assessments, GPS corridor tracking, take live camera photos, and upload evidence from device storage, Stagecoach RRA requires:
          </p>

          {/* Feedback message */}
          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
              isGpsGranted 
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            }`}>
              {isGpsGranted ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Permission 1: GPS Geolocation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isGpsGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-white">1. Live GPS Geolocation</h4>
                  {isGpsGranted && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Continuous corridor tracing & automatic map follow
                </p>
              </div>
            </div>

            {!isGpsGranted && (
              <button
                type="button"
                onClick={async () => {
                  const res = await requestGpsPermission();
                  if (!res.success && res.error) setFeedbackMsg(res.error);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0 cursor-pointer"
              >
                Allow GPS
              </button>
            )}
          </div>

          {/* Permission 2: Camera (Front & Back) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isCameraGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-white">2. Device Camera (Front & Back)</h4>
                  {isCameraGranted && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live viewfinder & front/rear lens switching for risk photos
                </p>
              </div>
            </div>

            {!isCameraGranted && (
              <button
                type="button"
                onClick={async () => {
                  const res = await usePwa().requestCameraPermission();
                  if (!res.success && res.error) setFeedbackMsg(res.error);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition shrink-0 cursor-pointer"
              >
                Allow Camera
              </button>
            )}
          </div>

          {/* Permission 3: Device Storage / Gallery */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 text-sky-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-white">3. Device Storage & Gallery</h4>
                  <span className="text-[9px] bg-sky-500/20 text-sky-300 font-extrabold px-1.5 py-0.2 rounded border border-sky-500/40">
                    Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload stored hazard photos & audit documents
                </p>
              </div>
            </div>
          </div>

          {/* Permission 4: Notifications */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isNotifGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-white">4. Safety Push Notifications</h4>
                  {isNotifGranted && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immediate alerts for high-risk hazards & sign-offs
                </p>
              </div>
            </div>

            {!isNotifGranted && (
              <button
                type="button"
                onClick={async () => {
                  await requestNotificationPermission();
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0 cursor-pointer"
              >
                Allow Alerts
              </button>
            )}
          </div>

          {/* Troubleshooting Help */}
          {gpsPermission === 'denied' && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 text-[11px] text-amber-200/90 space-y-1">
              <div className="font-bold flex items-center space-x-1 text-amber-300">
                <Lock className="w-3.5 h-3.5" />
                <span>How to unblock Location in your browser:</span>
              </div>
              <p>
                1. Tap the <strong>Padlock / Settings icon</strong> in your browser address bar.<br/>
                2. Find <strong>Permissions &rarr; Location</strong> and change it to <strong>Allow</strong>.<br/>
                3. Reload the page to start live tracking.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closePermissionsModal}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Skip for Now
          </button>

          <button
            type="button"
            disabled={isRequesting || (isGpsGranted && isNotifGranted)}
            onClick={handleEnableAll}
            className="px-5 py-2.5 bg-stagecoach-amber hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isRequesting ? (
              <span>Requesting Permissions...</span>
            ) : isGpsGranted && isNotifGranted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Permissions Active</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Grant All Permissions</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
