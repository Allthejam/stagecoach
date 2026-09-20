"use client";

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  Bus, 
  Lock, 
  Mail, 
  Key, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Wifi, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  UserCheck
} from 'lucide-react';

export default function LoginModal() {
  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    signIn, 
    resetPassword, 
    offlineGuestLogin,
    operatorProfile
  } = useAuthContext();
  
  const { showToast } = useRouteContext();

  const [mode, setMode] = useState<'signin' | 'forgot' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [guestName, setGuestName] = useState(operatorProfile.displayName || '');
  const [guestRegion, setGuestRegion] = useState(operatorProfile.region || '');
  const [guestDepot, setGuestDepot] = useState(operatorProfile.depot || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.success) {
      showToast('Signed in successfully as ' + email);
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);
    if (res.success) {
      setInfoMsg('Password reset email sent! Check your inbox.');
    } else {
      setError(res.error || 'Failed to send reset email.');
    }
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    offlineGuestLogin(guestName, 'assessor', guestRegion, guestDepot);
    showToast('Switched to Offline Assessor Mode (' + (guestName || 'Field Assessor') + ')');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Corporate Top Header Banner */}
        <div className="bg-stagecoach-navy text-white p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-stagecoach-amber/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              SC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wide text-white">STAGECOACH</span>
                <span className="text-[10px] bg-stagecoach-amber text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                  AUTH
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Enterprise Route Risk Assessment Portal
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex space-x-1 bg-slate-900/60 p-1 rounded-xl mt-5 text-xs font-semibold">
            <button
              onClick={() => { setMode('signin'); setError(null); setInfoMsg(null); }}
              className={'flex-1 py-1.5 rounded-lg transition text-center ' + (
                mode === 'signin' ? 'bg-stagecoach-amber text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('forgot'); setError(null); setInfoMsg(null); }}
              className={'flex-1 py-1.5 rounded-lg transition text-center ' + (
                mode === 'forgot' ? 'bg-stagecoach-amber text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              )}
            >
              Reset Password
            </button>
            <button
              onClick={() => { setMode('guest'); setError(null); setInfoMsg(null); }}
              className={'flex-1 py-1.5 rounded-lg transition text-center ' + (
                mode === 'guest' ? 'bg-stagecoach-amber text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'
              )}
            >
              Offline Mode
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="operator@stagecoachbus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password *</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-stagecoach-blue font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Sign In to Safety Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3.5">
              <p className="text-xs text-slate-500">
                Enter your Stagecoach account email and we will send a password reset link directly to your inbox.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="operator@stagecoachbus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-stagecoach-blue hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Send Password Reset Email</span>
                )}
              </button>
            </form>
          )}

          {/* 3. OFFLINE / GUEST ASSESSOR MODE */}
          {mode === 'guest' && (
            <form onSubmit={handleGuestLogin} className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block font-bold flex items-center space-x-1">
                  <Wifi className="w-3.5 h-3.5 text-amber-700" />
                  <span>Field Offline Mode Active</span>
                </strong>
                <p className="text-[11px] text-amber-800">
                  Ideal for surveying remote routes or in cellular blackspots. All data is saved safely to device storage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assessor Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Allan Johnson (Lead Assessor)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Highlands"
                    value={guestRegion}
                    onChange={(e) => setGuestRegion(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Home Depot</label>
                  <input
                    type="text"
                    placeholder="e.g. Aviemore"
                    value={guestDepot}
                    onChange={(e) => setGuestDepot(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-stagecoach-navy hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-stagecoach-amber" />
                <span>Continue in Offline Mode</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
