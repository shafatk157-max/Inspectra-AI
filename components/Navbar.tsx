'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Database,
  HardDrive,
  Info,
  Plus,
} from 'lucide-react';
import type { StorageMode } from '@/lib/types';

interface NavbarProps {
  storageMode: StorageMode;
}

export function Navbar({ storageMode }: NavbarProps) {
  const pathname = usePathname();
  const [showStorageInfo, setShowStorageInfo] = useState(false);

  const currentView = pathname.startsWith('/results')
    ? 'result'
    : pathname.startsWith('/inspect')
      ? 'inspect'
      : pathname.startsWith('/history')
        ? 'history'
        : 'dashboard';

  const navLinkClass = (view: string) =>
    `py-1.5 transition-colors whitespace-nowrap shrink-0 relative ${
      currentView === view
        ? 'text-blue-600 font-semibold'
        : 'hover:text-slate-900'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-900 font-display block whitespace-nowrap">
                    Inspectra AI
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block -mt-0.5">
                    Visual Quality Inspection
                  </span>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <Link href="/" className={navLinkClass('dashboard')}>
                Dashboard
                {currentView === 'dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>

              <Link href="/inspect" className={navLinkClass('inspect')}>
                New Inspection
                {currentView === 'inspect' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>

              <Link href="/history" className={navLinkClass('history')}>
                Inspection History
                {currentView === 'history' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowStorageInfo(true)}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
                  storageMode === 'supabase'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Click for storage and database details"
              >
                {storageMode === 'supabase' ? (
                  <>
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium">Supabase Cloud</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium">
                      Demo Mode (Local Storage)
                    </span>
                  </>
                )}
                <Info className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              <Link
                href="/inspect"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Inspection</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between text-xs bg-slate-50/50">
          <Link
            href="/"
            className={`px-2 py-1 rounded font-medium ${
              currentView === 'dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/inspect"
            className={`px-2 py-1 rounded font-medium ${
              currentView === 'inspect'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600'
            }`}
          >
            Inspect
          </Link>
          <Link
            href="/history"
            className={`px-2 py-1 rounded font-medium ${
              currentView === 'history'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600'
            }`}
          >
            History
          </Link>
          <button
            onClick={() => setShowStorageInfo(true)}
            className="text-[11px] text-slate-500 flex items-center gap-1"
          >
            {storageMode === 'supabase' ? 'Supabase' : 'Demo Local'}
            <Info className="w-3 h-3" />
          </button>
        </div>
      </header>

      {showStorageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-slate-800">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Storage &amp; Persistence Architecture
                  </h3>
                  <p className="text-xs text-slate-500">
                    Status:{' '}
                    <span className="font-semibold text-slate-700">
                      {storageMode === 'supabase'
                        ? 'Connected to Supabase Cloud'
                        : 'Demo Mode (Persistent Local Storage)'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStorageInfo(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
              {storageMode === 'supabase' ? (
                <>
                  <p className="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100">
                    <strong>
                      Active: Supabase PostgreSQL &amp; Private Storage.
                    </strong>{' '}
                    Inspection records are stored in the{' '}
                    <code className="font-mono text-emerald-800">
                      inspections
                    </code>{' '}
                    table and images in private bucket{' '}
                    <code className="font-mono text-emerald-800">
                      inspection-images
                    </code>
                    . Signed URLs are generated securely on the backend.
                  </p>
                  <p>
                    All API calls remain safely proxied through Next.js route
                    handlers. The privileged service-role key is never exposed
                    to browser bundles.
                  </p>
                </>
              ) : (
                <>
                  <p className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-100">
                    <strong>
                      Active: Persistent Local Storage (Demo Mode).
                    </strong>{' '}
                    Since Supabase environment variables were not supplied,
                    the app is running in resilient demo mode. Records are
                    written to{' '}
                    <code className="font-mono text-amber-800">
                      data/inspections.json
                    </code>{' '}
                    and files saved to{' '}
                    <code className="font-mono text-amber-800">
                      data/uploads/
                    </code>
                    , persisting across server restarts and refreshes.
                  </p>
                  <p className="p-3 bg-rose-50 text-rose-900 rounded-lg border border-rose-100">
                    <strong>Vercel note:</strong> local disk is ephemeral on
                    serverless deployments. Configure Supabase to persist
                    records in production.
                  </p>
                  <p>
                    <strong>Want to connect Supabase?</strong> Add your keys to
                    the project environment:
                  </p>
                  <div className="p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-[11px] space-y-1">
                    <div>SUPABASE_URL=&quot;https://xyz.supabase.co&quot;</div>
                    <div>SUPABASE_SERVICE_ROLE_KEY=&quot;eyJhbG...&quot;</div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    The schema definition script is available in{' '}
                    <code className="font-mono">docs/supabase-schema.sql</code>.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowStorageInfo(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
