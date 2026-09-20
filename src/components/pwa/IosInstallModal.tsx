"use client";

import React from 'react';
import { usePwa } from '@/context/PwaContext';
import { 
  X, 
  Share, 
  PlusSquare, 
  Smartphone, 
  CheckCircle2, 
  Download, 
  Compass, 
  MoreVertical,
  Laptop
} from 'lucide-react';

export default function IosInstallModal() {
  const { isIosGuideOpen, closeIosGuide, isIOS, isAndroid } = usePwa();

  if (!isIosGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#001f42] to-[#00132b] border border-slate-700/80 rounded-2xl p-6 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber accent glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              SC
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                Install Stagecoach App
              </h3>
              <p className="text-xs text-slate-300">
                Add to your mobile home screen or desktop
              </p>
            </div>
          </div>
          <button
            onClick={closeIosGuide}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-5 space-y-1.5">
          <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Field Operations Ready
          </p>
          <ul className="text-xs text-slate-300 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Full screen offline GPS route tracking & dwell timing</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Instant 1-tap launch without browser URL bars</span>
            </li>
          </ul>
        </div>

        {/* Step-by-Step Instructions */}
        {isIOS ? (
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Apple iOS / iPadOS Safari Steps:
            </h4>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Tap the <span className="text-sky-300 font-bold">Share button</span> <Share className="inline w-3.5 h-3.5 mx-1 text-sky-400" /> in Safari's toolbar (at the bottom or top).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Scroll down the share sheet and tap <span className="text-amber-300 font-bold">"Add to Home Screen"</span> <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-amber-400" />.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Tap <span className="text-emerald-300 font-bold">"Add"</span> in the top-right corner to finish.
                </p>
              </div>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Android Chrome Steps:
            </h4>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Tap the <span className="text-sky-300 font-bold">Menu (⋮)</span> <MoreVertical className="inline w-3.5 h-3.5 mx-1 text-sky-400" /> in the top right corner of Chrome.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Select <span className="text-amber-300 font-bold">"Install app"</span> or <span className="text-amber-300 font-bold">"Add to Home screen"</span>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Desktop / Laptop Browser Installation:
            </h4>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Look in the browser address bar for the <span className="text-sky-300 font-bold">Install Icon (⊕ / 💻)</span> or click the browser Menu (⋮).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-200">
                <p className="font-semibold">
                  Click <span className="text-amber-300 font-bold">"Install Stagecoach Route Risk Assessment"</span> to add to your desktop & taskbar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={closeIosGuide}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
        >
          <span>Understood, Continue</span>
        </button>
      </div>
    </div>
  );
}
