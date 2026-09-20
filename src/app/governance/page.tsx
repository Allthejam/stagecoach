"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import LoginPage from '@/components/auth/LoginPage';
import GovernanceSignOff from '@/components/governance/GovernanceSignOff';
import { ShieldCheck, FileCheck2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function GovernancePage() {
  const { isAuthenticated, loading, operatorProfile } = useAuthContext();
  const { currentRoute, routes } = useRouteContext();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading Governance & Safety Compliance...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                HSE Safety Governance & Audit Sign-Off
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                5x5 HSE Risk Matrix compliance, Lead Safety Assessor sign-offs, and Operations Director authorization.
              </p>
            </div>
          </div>
        </div>

        {currentRoute ? (
          <GovernanceSignOff />
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Select an Active Route to Review Governance Sign-Off</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please choose a route from the Route Risk Assessments page to inspect or complete its HSE compliance audit.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
