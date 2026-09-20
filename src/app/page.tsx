"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';

export default function RootPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-stagecoach-amber border-t-transparent animate-spin mb-4"></div>
        <p className="font-bold text-sm">Authenticating Stagecoach Enterprise Session...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to UK Safety Network</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return null;
}
