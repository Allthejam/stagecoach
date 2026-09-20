"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import LoginPage from '@/components/auth/LoginPage';
import DriverFlashcard from '@/components/driver/DriverFlashcard';
import { FileText, Printer, Download, Bus, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const { currentRoute, routes } = useRouteContext();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading Safety Reports...</p>
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Safety Dossiers & Driver Flashcards
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Print A4 safety flashcards, vehicle clearance sheets, and regional route safety reports.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            disabled={!currentRoute}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4 Dossier</span>
          </button>
        </div>

        {currentRoute ? (
          <DriverFlashcard />
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Select a Route to Generate Driver Safety Flashcard</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please choose a route from the Route Risk Assessments page to print or export its hazard flashcard.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
