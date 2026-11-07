'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Navbar } from './Navbar';
import {
  NotificationProvider,
  useNotification,
} from './NotificationProvider';
import type { StorageMode } from '@/lib/types';

function ShellInner({
  storageMode,
  model,
  children,
}: {
  storageMode: StorageMode;
  model: string;
  children: ReactNode;
}) {
  const { notification, dismissNotification } = useNotification();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#142B4A] flex flex-col">
      <Navbar storageMode={storageMode} />

      {notification && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-between border-b ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={dismissNotification}
            className="text-xs font-bold px-2 py-0.5 opacity-60 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Inspectra AI</span>{' '}
            &mdash; Visual Quality Control MVP
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Model: {model}</span>
            <span>&middot;</span>
            <span>
              Persistence:{' '}
              {storageMode === 'supabase'
                ? 'Supabase S3 & Postgres'
                : 'Local Disk'}
            </span>
            <span>&middot;</span>
            <span>Assistive Prototype</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AppShell({
  storageMode,
  model,
  children,
}: {
  storageMode: StorageMode;
  model: string;
  children: ReactNode;
}) {
  return (
    <NotificationProvider>
      <ShellInner storageMode={storageMode} model={model}>
        {children}
      </ShellInner>
    </NotificationProvider>
  );
}
