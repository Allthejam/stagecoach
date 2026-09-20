"use client";

import React from 'react';
import Link from 'next/link';
import { useRouteContext } from '@/context/RouteContext';
import { useFleetContext } from '@/context/FleetContext';
import { useAuthContext, ROLE_LABELS } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import { 
  BarChart3, 
  MapPin, 
  Bus, 
  Building2, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, loading, operatorProfile } = useAuthContext();
  const { routes } = useRouteContext();
  const { buses } = useFleetContext();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading National Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  // Calculate National Metrics
  const totalRoutes = routes.length;
  const totalBuses = buses.length;
  const doubleDeckers = buses.filter((b) => b.vehicleType === 'double_decker').length;
  const evBuses = buses.filter((b) => b.isEv || b.vehicleType === 'electric_ev').length;
  
  let totalHazards = 0;
  let highRiskHazards = 0;
  routes.forEach((r) => {
    totalHazards += r.hazards?.length || 0;
    r.hazards?.forEach((h) => {
      if (h.residualScore >= 15 || h.initialScore >= 15) highRiskHazards++;
    });
  });

  const roleInfo = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-stagecoach-navy via-slate-900 to-stagecoach-blue rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-stagecoach-amber/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stagecoach-amber/20 border border-stagecoach-amber/30 text-stagecoach-amber text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>National Route Risk Governance Network</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Welcome back, {operatorProfile.displayName}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Operating as <strong className="text-white">{roleInfo.title}</strong> across {operatorProfile.region || 'UK Network'} ({operatorProfile.depot || 'All Depots'}). Monitor live route safety audits, vehicle clearances, and depot operations.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              href="/routes"
              className="px-5 py-3 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Open Route Risk Assessments</span>
            </Link>
            <Link
              href="/fleet"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-2"
            >
              <Bus className="w-4 h-4" />
              <span>Manage Depot Bus Fleet</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link href="/routes" className="bg-white border border-slate-200 hover:border-stagecoach-blue rounded-2xl p-5 shadow-sm transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Routes</span>
            <MapPin className="w-4 h-4 text-stagecoach-blue group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalRoutes}</span>
            <span className="text-xs text-slate-500">GIS Corridors</span>
          </div>
          <div className="mt-3 text-xs text-stagecoach-blue font-bold flex items-center space-x-1 group-hover:underline">
            <span>View routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link href="/fleet" className="bg-white border border-slate-200 hover:border-stagecoach-blue rounded-2xl p-5 shadow-sm transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Depot Bus Fleet</span>
            <Bus className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalBuses}</span>
            <span className="text-xs text-slate-500">Vehicles</span>
          </div>
          <div className="mt-3 text-xs text-indigo-600 font-bold flex items-center space-x-1 group-hover:underline">
            <span>{doubleDeckers} Double Deckers • {evBuses} EVs</span>
          </div>
        </Link>

        <Link href="/governance" className="bg-white border border-slate-200 hover:border-stagecoach-blue rounded-2xl p-5 shadow-sm transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Hazards</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalHazards}</span>
            <span className="text-xs text-slate-500">Logged</span>
          </div>
          <div className="mt-3 text-xs text-amber-700 font-bold flex items-center space-x-1">
            <span>{highRiskHazards} High Risk Hotspots</span>
          </div>
        </Link>

        <Link href="/depots" className="bg-white border border-slate-200 hover:border-stagecoach-blue rounded-2xl p-5 shadow-sm transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Depots & Emergency</span>
            <Building2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{operatorProfile.region || 'UK'}</span>
          </div>
          <div className="mt-3 text-xs text-emerald-600 font-bold flex items-center space-x-1 group-hover:underline">
            <span>{operatorProfile.depot || 'Main Depot'} Operations</span>
          </div>
        </Link>

      </div>

      {/* Domain Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">National Operational Workspaces</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/routes" className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-stagecoach-blue flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-stagecoach-blue transition">
              Route Risk Assessments & GIS
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conduct high-precision GPS surveys, log low bridges & tight corners, compute 5x5 HSE risk scores, and generate driver flashcards.
            </p>
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-stagecoach-blue pt-2 group-hover:underline">
              <span>Open GIS Assessments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/fleet" className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Bus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
              Depot Bus Fleet & Vehicle Roster
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add and manage buses assigned to specific depots. Track Double Decker bridge heights, EV zero-emission allocations, and vehicle geometry.
            </p>
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 pt-2 group-hover:underline">
              <span>Open Bus Fleet Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/depots" className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition">
              Regions & Operating Depots
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Directory of operating company garages, 24/7 Control Room hotlines, Duty Managers, and breakdown engineering dispatch.
            </p>
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 pt-2 group-hover:underline">
              <span>Open Depots Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

        </div>
      </div>

    </div>
  );
}
