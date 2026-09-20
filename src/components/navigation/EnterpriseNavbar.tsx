"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext, ROLE_LABELS } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  Bus, 
  MapPin, 
  Building2, 
  Users, 
  Settings, 
  ShieldCheck, 
  BarChart3, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Cloud,
  Wifi
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function EnterpriseNavbar() {
  const pathname = usePathname();
  const { operatorProfile, signOut, isAuthenticated } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) return null;

  const roleInfo = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/routes', label: 'Route Risk Assessments', icon: MapPin },
    { href: '/fleet', label: 'Depot Bus Fleet', icon: Bus },
    { href: '/depots', label: 'Regions & Depots', icon: Building2 },
    { href: '/users', label: 'Team & Hierarchy', icon: Users },
    { href: '/governance', label: 'HSE Governance', icon: ShieldCheck },
    { href: '/reports', label: 'Safety Reports & PDF', icon: FileText },
    { href: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <header className="bg-stagecoach-navy text-white shadow-xl sticky top-0 z-50 border-b border-slate-800 select-none">
      {/* Top Corporate Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xl shadow-lg tracking-tighter group-hover:scale-105 transition shrink-0">
            SC
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">STAGECOACH</span>
              <span className="text-[10px] bg-stagecoach-amber/20 text-stagecoach-amber border border-stagecoach-amber/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                National RRA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium hidden sm:block">
              Route Risk Assessment & National Operations Portal
            </p>
          </div>
        </Link>

        {/* Right Side: Operator Profile & Sign Out */}
        <div className="flex items-center space-x-3">
          
          {/* Cloud Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{isFirebaseConfigured ? 'Cloud Sync Active' : 'Offline Mode'}</span>
          </div>

          {/* Operator Chip */}
          <div className="hidden sm:flex items-center space-x-2.5 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-xs">
              {operatorProfile.displayName ? operatorProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xs text-white max-w-[120px] truncate block">
                  {operatorProfile.displayName}
                </span>
                <span className={'text-[9px] font-bold px-1.5 py-0.2 rounded border ' + roleInfo.badgeColor}>
                  {roleInfo.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                {operatorProfile.region || 'UK Network'} • {operatorProfile.depot || 'Depot'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-red-300 hover:bg-red-950/50 rounded-xl transition border border-transparent hover:border-red-900/50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 md:hidden transition"
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main Multi-Page Menu Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={'flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ' + (
                    isActive
                      ? 'bg-stagecoach-amber text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className={'w-4 h-4 ' + (isActive ? 'text-slate-950' : 'text-slate-400')} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1 animate-in fade-in duration-150">
          <div className="p-3 mb-2 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + roleInfo.badgeColor}>
              {roleInfo.title}
            </span>
            <p className="text-xs font-bold text-white mt-1">{operatorProfile.displayName}</p>
            <p className="text-[11px] text-slate-400">{operatorProfile.region} • {operatorProfile.depot}</p>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ' + (
                  isActive
                    ? 'bg-stagecoach-amber text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className={'w-4 h-4 ' + (isActive ? 'text-slate-950' : 'text-slate-400')} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
