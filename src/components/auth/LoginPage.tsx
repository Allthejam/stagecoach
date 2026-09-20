"use client";

import React, { useState } from 'react';
import { useAuthContext, UserRole, ROLE_LABELS } from '@/context/AuthContext';
import { 
  Bus, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  KeyRound, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Warehouse,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function LoginPage() {
  const { 
    signIn, 
    resetPassword, 
    offlineGuestLogin, 
    operatorProfile 
  } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isQuickTestingOpen, setIsQuickTestingOpen] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both work email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await signIn(email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Login failed. Please verify credentials.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Please provide your work email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const res = await resetPassword(resetEmail);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Password reset instructions sent to ' + resetEmail);
      setIsResetMode(false);
    } else {
      setErrorMessage(res.error || 'Password reset request failed.');
    }
  };

  const handleQuickRoleSelect = (role: UserRole, name: string, region: string, depot: string) => {
    offlineGuestLogin(name, role, region, depot);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-stagecoach-amber flex items-center justify-center font-black text-xl text-slate-950 shadow-lg tracking-tighter">
            SC
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white">STAGECOACH</span>
              <span className="text-[10px] bg-stagecoach-amber/20 text-stagecoach-amber border border-stagecoach-amber/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                RRA Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Route Risk Assessment & National GIS Network
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{isFirebaseConfigured ? 'Firebase Cloud Connected' : 'Local Storage Mode'}</span>
        </div>
      </header>

      {/* Main Center Auth Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
          
          {/* Left Hero & Tier Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-stagecoach-amber text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HSE 5x5 Matrix & UK Bus Route Governance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              Stagecoach Route Safety & Risk Governance Portal
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Multi-tiered enterprise platform for Master Administrators, Regional Directors, Depot Operations Managers, and RRA Field Assessors conducting GPS corridor mapping and hazard sign-offs.
            </p>

            {/* Hierarchical Tier Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => {
                const info = ROLE_LABELS[r];
                return (
                  <div key={r} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className={'inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ' + info.badgeColor}>
                      {info.title}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-3 pt-1">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center space-x-6 pt-2 text-xs text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live GPS Corridors</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Screen Wake Lock</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Driver Flashcards</span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              
              {/* Card Header */}
              <div className="space-y-1.5 mb-6 text-center sm:text-left">
                <h2 className="text-xl font-black text-white">
                  {isResetMode ? 'Reset Password' : 'Sign in to your Account'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isResetMode 
                    ? 'Enter your registered email to receive a recovery link.'
                    : 'Access your assigned regional network and route risk dossiers.'
                  }
                </p>
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Standard Email/Pass Sign In */}
              {!isResetMode ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Stagecoach Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@stagecoach.co.uk"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-stagecoach-amber transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(true);
                          setErrorMessage('');
                        }}
                        className="text-[11px] text-stagecoach-amber hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-stagecoach-amber transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Sign In to Safety Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Password Reset Form */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@stagecoach.co.uk"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-stagecoach-amber transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setErrorMessage('');
                      }}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-2.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow transition flex items-center justify-center space-x-1.5"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Send Recovery Email</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Quick Field Assessor & Role Access Section */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-semibold">Demo & Quick Tier Access</span>
                  <button
                    onClick={() => setIsQuickTestingOpen(!isQuickTestingOpen)}
                    className="text-stagecoach-amber hover:underline text-[11px] font-bold"
                  >
                    {isQuickTestingOpen ? 'Hide Tiers' : 'Show Roles'}
                  </button>
                </div>

                {isQuickTestingOpen && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleQuickRoleSelect('master_admin', 'Allan (Master Admin)', 'All Regions', 'HQ')}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs text-left transition"
                    >
                      <div>
                        <span className="font-bold block">Master Administrator</span>
                        <span className="text-[10px] text-amber-400/80">Top of tree • UK Wide control</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleQuickRoleSelect('regional_admin', 'Regional Director (North)', 'North Scotland', 'Highlands Central')}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs text-left transition"
                    >
                      <div>
                        <span className="font-bold block">Regional Admin</span>
                        <span className="text-[10px] text-blue-400/80">North Scotland Region</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleQuickRoleSelect('depot_admin', 'Depot Operations Manager', 'North Scotland', 'Inverness Depot')}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs text-left transition"
                    >
                      <div>
                        <span className="font-bold block">Depot Admin</span>
                        <span className="text-[10px] text-emerald-400/80">Inverness Depot Operations</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleQuickRoleSelect('assessor', 'Field Safety Surveyor', 'North Scotland', 'Inverness Depot')}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs text-left transition"
                    >
                      <div>
                        <span className="font-bold block">RRA Assessor</span>
                        <span className="text-[10px] text-purple-400/80">GPS Logging & Risk Scorer</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-900 text-center sm:flex sm:justify-between text-xs text-slate-500 relative z-10">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Stagecoach Group plc. Safety First Governance System.</p>
        <p className="mt-1 sm:mt-0">Encrypted UK Transit Safety Network</p>
      </footer>
    </div>
  );
}
