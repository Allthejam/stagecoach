"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext, ROLE_LABELS, UserRole } from '@/context/AuthContext';
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
  ClipboardList, 
  Navigation, 
  AlertTriangle, 
  Radio, 
  Eye, 
  CheckCircle2, 
  PhoneCall, 
  Crown,
  Download,
  Smartphone
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { usePwa } from '@/context/PwaContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const { 
    operatorProfile, 
    signOut, 
    isAuthenticated, 
    isMasterAdmin, 
    effectiveRole, 
    activePerspectiveRole, 
    switchPerspective, 
    resetPerspective 
  } = useAuthContext();
  const { isInstalled, promptInstall } = usePwa();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) return null;

  const roleInfo = ROLE_LABELS[effectiveRole] || ROLE_LABELS.assessor;
  const showRoleSwitcher = isMasterAdmin || activePerspectiveRole !== null;

  // Role-Specific Navigation Structures
  const getRoleSections = (role: UserRole): NavSection[] => {
    switch (role) {
      case 'master_admin':
        return [
          {
            title: 'CEO & National Governance',
            items: [
              { label: 'CEO Executive Dashboard', href: '/dashboard', icon: BarChart3 },
              { label: 'Chain of Command & Teams', href: '/users', icon: Users, badge: 'HQ' },
              { label: 'Operating Regions & Depots', href: '/depots', icon: Building2 },
              { label: 'National Fleet Directory', href: '/fleet', icon: Bus },
            ]
          },
          {
            title: 'Safety Oversight & Auditing',
            items: [
              { label: 'Route Risk Assessments', href: '/routes', icon: MapPin },
              { label: 'HSE Governance & Sign-Off', href: '/governance', icon: ShieldCheck, badge: '5x5' },
              { label: 'Safety Reports & PDF', href: '/reports', icon: FileText },
              { label: 'System & Security Settings', href: '/settings', icon: Settings },
            ]
          }
        ];

      case 'regional_admin':
        return [
          {
            title: 'Regional Operations',
            items: [
              { label: 'Regional Dashboard', href: '/dashboard', icon: BarChart3 },
              { label: 'Regional Operating Depots', href: '/depots', icon: Building2 },
              { label: 'Depot Managers & Assessors', href: '/users', icon: Users },
              { label: 'Regional Bus Fleet', href: '/fleet', icon: Bus },
            ]
          },
          {
            title: 'Regional Safety & Auditing',
            items: [
              { label: 'Route Risk Assessments', href: '/routes', icon: MapPin },
              { label: 'HSE Compliance Sign-Off', href: '/governance', icon: ShieldCheck },
              { label: 'Safety Dossiers & Briefings', href: '/reports', icon: FileText },
              { label: 'Regional Defaults', href: '/settings', icon: Settings },
            ]
          }
        ];

      case 'depot_admin':
        return [
          {
            title: 'Depot Operations Hub',
            items: [
              { label: 'Depot Dashboard', href: '/dashboard', icon: BarChart3 },
              { label: 'My Depot Bus Fleet', href: '/fleet', icon: Bus, badge: 'Garage' },
              { label: 'Assign Routes to Assessors', href: '/routes', icon: ClipboardList },
              { label: 'Depot Emergency Directory', href: '/depots', icon: PhoneCall },
            ]
          },
          {
            title: 'Local Risk & Briefings',
            items: [
              { label: 'Route Risk Assessments', href: '/routes', icon: MapPin },
              { label: 'Driver Flashcards & A4 Briefings', href: '/reports', icon: FileText },
              { label: 'Depot Settings', href: '/settings', icon: Settings },
            ]
          }
        ];

      case 'assessor':
        return [
          {
            title: 'Field Safety Surveyor',
            items: [
              { label: 'My Assigned Routes', href: '/routes', icon: ClipboardList, badge: 'Live' },
              { label: 'Live GPS Route Surveyor', href: '/routes', icon: Navigation },
              { label: '5x5 HSE Hazard Register', href: '/routes', icon: AlertTriangle },
              { label: 'Driver Safety Flashcards', href: '/reports', icon: FileText },
            ]
          },
          {
            title: 'Compliance & Profile',
            items: [
              { label: 'HSE Assessment Sign-Off', href: '/governance', icon: ShieldCheck },
              { label: 'Assessor Credentials', href: '/settings', icon: Settings },
            ]
          }
        ];
    }
  };

  const sections = getRoleSections(effectiveRole);

  return (
    <>
      {/* Mobile Top Bar with Menu Hamburger */}
      <div className="md:hidden bg-stagecoach-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-sm tracking-tighter">
            SC
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider block">STAGECOACH</span>
            <span className="text-[10px] text-stagecoach-amber font-semibold">{roleInfo.title}</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Toggle Menu"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Permanent Fixed Left Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#001733] text-white z-50 flex flex-col border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & Corporate Header */}
        <div className="p-4 border-b border-slate-800 bg-[#00132b] flex items-center justify-between">
          <Link 
            href="/dashboard" 
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-lg shadow-lg tracking-tighter group-hover:scale-105 transition shrink-0">
              SC
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base tracking-wider text-white">STAGECOACH</span>
              </div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                National RRA System
              </p>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User & Role Identity Card */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                {operatorProfile.displayName ? operatorProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[130px]">
                  {operatorProfile.displayName}
                </p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${roleInfo.badgeColor}`}>
                  {roleInfo.title}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[120px]">{operatorProfile.region || 'UK Network'}</span>
            <span className="text-slate-500">•</span>
            <span className="truncate max-w-[80px] font-medium">{operatorProfile.depot || 'HQ'}</span>
          </div>

          {/* Master Admin / CEO Perspective Switcher */}
          {showRoleSwitcher && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  <Crown className="w-3 h-3" />
                  <span>Perspective Mode</span>
                </div>
                {activePerspectiveRole && (
                  <button
                    onClick={() => resetPerspective()}
                    className="text-[9px] text-amber-300 hover:text-white underline font-semibold"
                  >
                    Reset to CEO
                  </button>
                )}
              </div>
              <select
                value={effectiveRole}
                onChange={(e) => switchPerspective(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg text-[11px] text-amber-200 px-2 py-1.5 font-bold focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="master_admin">👑 Master Admin (CEO / HQ)</option>
                <option value="regional_admin">🏢 Regional Admin View</option>
                <option value="depot_admin">🚌 Depot Admin View</option>
                <option value="assessor">📋 RRA Assessor View</option>
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.label + item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                        isActive
                          ? 'bg-stagecoach-amber text-slate-950 font-black shadow-md shadow-amber-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-stagecoach-amber'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          isActive 
                            ? 'bg-slate-950 text-amber-400' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom System & Logout Strip */}
        <div className="p-3 border-t border-slate-800 bg-[#00132b] space-y-2">
          {/* PWA Install Button or Standalone Badge */}
          {!isInstalled ? (
            <button
              onClick={() => {
                setIsMobileOpen(false);
                promptInstall();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-300 border border-amber-500/30 shadow-sm transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Download className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Install App on Device</span>
              </div>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                PWA
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-200">Installed PWA Ready</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                Offline
              </span>
            </div>
          )}

          {/* Cloud Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-300">
                {isFirebaseConfigured ? 'Cloud Live Sync' : 'Local Offline'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v2.4</span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-950/60 border border-transparent hover:border-red-900/60 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
