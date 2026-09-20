"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import EnterpriseSidebar from './EnterpriseSidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();

  return (
    <>
      <EnterpriseSidebar />
      <main
        className={`flex-1 w-full min-h-screen flex flex-col transition-all ${
          !loading && isAuthenticated ? 'md:pl-64' : ''
        }`}
      >
        {children}
      </main>
    </>
  );
}
