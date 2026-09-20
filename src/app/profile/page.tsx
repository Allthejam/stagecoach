"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext, ROLE_LABELS, UserRole } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Building2, 
  Warehouse, 
  Key, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Upload, 
  Sparkles, 
  QrCode, 
  BadgeCheck,
  Save,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  LogOut
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
  const { 
    isAuthenticated,
    loading,
    operatorProfile, 
    updateUserProfileDetails, 
    updateUserPassword, 
    signOut,
    isMasterAdmin,
    effectiveRole
  } = useAuthContext();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState(operatorProfile.displayName || '');
  const [phone, setPhone] = useState(operatorProfile.phone || '');
  const [jobTitle, setJobTitle] = useState(operatorProfile.jobTitle || '');
  const [assessorNumber, setAssessorNumber] = useState(operatorProfile.assessorNumber || '');
  const [region, setRegion] = useState(operatorProfile.region || '');
  const [depot, setDepot] = useState(operatorProfile.depot || '');
  const [avatarUrl, setAvatarUrl] = useState(operatorProfile.avatarUrl || '');
  const [emergencyContactName, setEmergencyContactName] = useState(operatorProfile.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(operatorProfile.emergencyContactPhone || '');
  const [notes, setNotes] = useState(operatorProfile.notes || '');

  // Password fields state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile save state
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state when operatorProfile changes
  useEffect(() => {
    setDisplayName(operatorProfile.displayName || '');
    setPhone(operatorProfile.phone || '');
    setJobTitle(operatorProfile.jobTitle || '');
    setAssessorNumber(operatorProfile.assessorNumber || '');
    setRegion(operatorProfile.region || '');
    setDepot(operatorProfile.depot || '');
    setAvatarUrl(operatorProfile.avatarUrl || '');
    setEmergencyContactName(operatorProfile.emergencyContactName || '');
    setEmergencyContactPhone(operatorProfile.emergencyContactPhone || '');
    setNotes(operatorProfile.notes || '');
  }, [operatorProfile]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    const res = await updateUserProfileDetails({
      displayName: displayName.trim(),
      phone: phone.trim(),
      jobTitle: jobTitle.trim(),
      assessorNumber: assessorNumber.trim(),
      region: region.trim(),
      depot: depot.trim(),
      avatarUrl: avatarUrl.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      notes: notes.trim()
    });

    setIsSavingProfile(false);

    if (res.success) {
      setProfileSuccess('Your profile details and avatar were saved successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(res.error || 'Failed to save profile changes.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordSuccess('Your password has been securely updated. You can now use it for future logins.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } else {
      setPasswordError(res.error || 'Could not update password. Please try again.');
    }
  };

  const roleMeta = ROLE_LABELS[operatorProfile.role] || ROLE_LABELS.assessor;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading Profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001733] via-[#002855] to-[#001f42] border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg shadow-amber-500/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.slice(0, 2).toUpperCase() || 'SC'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-amber-400 hover:text-white rounded-xl border border-slate-700 shadow-md transition"
              title="Upload New Avatar Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleAvatarFileUpload} 
              className="hidden" 
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{displayName || 'Stagecoach Team Member'}</h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${roleMeta.badgeColor}`}>
                {roleMeta.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">{operatorProfile.email}</p>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{jobTitle || 'Route Safety Assessor'}</span>
              <span>•</span>
              <span>{depot || 'Main Depot'} ({region || 'National'})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accreditation ID</p>
            <p className="text-sm font-black font-mono text-amber-400">{assessorNumber || 'SC-RRA-001'}</p>
          </div>
        </div>
      </div>

      {/* Temporary Password Warning Alert */}
      {operatorProfile.mustChangePassword && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-amber-200 flex items-start space-x-3 animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-300">Action Required: First Login Password Change</p>
            <p className="text-amber-200/80 mt-0.5">
              You are currently logged in with a temporary password. Please set your permanent secure password in the <strong>"Password & Security"</strong> section below.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info & Avatar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Details Form */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-stagecoach-blue" />
              <span>Personal & Operational Details</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Update your contact credentials, job title, and emergency details.
            </p>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Chooser */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choose or Upload Avatar Image
                </label>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                        avatarUrl === preset ? 'border-stagecoach-amber ring-2 ring-amber-400/50' : 'border-slate-200'
                      }`}
                    >
                      <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Reset to Initials
                    </button>
                  )}
                </div>
              </div>

              {/* Names & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-stagecoach-blue focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email (Account Login)</label>
                  <input
                    type="email"
                    disabled
                    value={operatorProfile.email}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Principal Route Safety Auditor"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-stagecoach-blue focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-stagecoach-blue focus:bg-white"
                  />
                </div>
              </div>

              {/* Operating Region & Depot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operating Region</label>
                  <input
                    type="text"
                    value={region}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-stagecoach-blue focus:bg-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Garage / Depot</label>
                  <input
                    type="text"
                    value={depot}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setDepot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-stagecoach-blue focus:bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  <span>Next of Kin / Emergency Contact</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Sarah MacLeod (Spouse)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-stagecoach-blue focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+44 7700 900111"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-stagecoach-blue focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-stagecoach-blue hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password & Security Section */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Security & Password Management</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Update your account password. Must be at least 6 characters.
            </p>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new permanent password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new permanent password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2.5 bg-stagecoach-amber hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isUpdatingPassword ? 'Updating Password...' : 'Set Permanent Password'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Digital Stagecoach ID Badge */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#001733] via-[#00244d] to-[#00132b] border border-amber-500/30 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Hologram strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-sky-400 to-amber-400" />
            
            <div className="flex items-center justify-between mb-4 pt-1">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                  SC
                </span>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-amber-400">Stagecoach UK</p>
                  <p className="text-[9px] text-slate-400">Digital Safety ID Pass</p>
                </div>
              </div>
              <BadgeCheck className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Badge Photo */}
            <div className="flex flex-col items-center my-4">
              <div className="w-24 h-24 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-3xl overflow-hidden border-4 border-slate-900 shadow-xl mb-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.slice(0, 2).toUpperCase() || 'SC'}</span>
                )}
              </div>
              <h3 className="font-extrabold text-base text-white text-center">{displayName}</h3>
              <p className="text-xs text-amber-300 font-medium text-center">{jobTitle || roleMeta.title}</p>
              <span className="mt-2 text-[10px] font-mono bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800 text-slate-300">
                {assessorNumber || 'SC-RRA-001'}
              </span>
            </div>

            {/* Badge Metadata */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="font-semibold text-slate-200">{region || 'UK Network'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Base Garage:</span>
                <span className="font-semibold text-slate-200">{depot || 'HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HSE Clearance:</span>
                <span className="font-semibold text-emerald-400">Level 4 Certified</span>
              </div>
            </div>

            {/* Security QR */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <QrCode className="w-7 h-7 text-slate-300" />
                <div>
                  <p className="font-bold text-slate-300">Encrypted Pass</p>
                  <p>Valid 2026-2027</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase text-[9px]">
                Active
              </span>
            </div>
          </div>

          {/* Session Control Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Active Session
            </h3>
            <p className="text-xs text-slate-600">
              Logged in as <strong className="text-slate-900">{operatorProfile.email || displayName}</strong> ({roleMeta.title})
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
