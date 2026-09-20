"use client";

import React, { useState, useEffect } from 'react';
import { usePwa } from '@/context/PwaContext';
import { Download, X, Smartphone, Sparkles, Laptop } from 'lucide-react';

export default function PwaInstallBanner() {
  const { 
    isInstalled, 
    bannerDismissed, 
    dismissBanner, 
    promptInstall, 
    isIOS, 
    isAndroid 
  } = usePwa();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isInstalled || bannerDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-[#001f42] via-[#002855] to-[#001733] border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-white backdrop-blur-md flex items-center justify-between gap-3">
        {/* App Icon */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
            SC
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-xs text-white truncate">Install Stagecoach RRA</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1.5 py-0.2 rounded uppercase">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight truncate mt-0.5">
            {isIOS 
              ? 'Add to iPhone / iPad home screen for offline field use' 
              : isAndroid 
                ? 'Install on Android device for instant GPS mapping' 
                : 'Install standalone app on desktop for fast access'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => promptInstall()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={dismissBanner}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
