"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import DepotsManagementView from '@/components/depots/DepotsManagementView';

export default function DepotsPage() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-4 border-stagecoach-amber border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs">Loading Operating Depots Directory...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-[calc(100vh-100px)] bg-slate-100 py-6">
      <DepotsManagementView />
    </div>
  );
}
