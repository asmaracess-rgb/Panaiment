import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare const __APP_BUILD_ID__: string;

const CURRENT_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const RELOAD_GUARD_KEY = 'pnk_last_reloaded_build_id';
const ACTIVE_BUILD_KEY = 'pnk_active_build_id';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Root render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              Memperbarui Tampilan Portal
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Terjadi pembaruan versi aplikasi. Silakan klik tombol di bawah untuk memuat ulang halaman terbaru.
            </p>
            <button
              type="button"
              onClick={async () => {
                await clearBrowserAssetCaches();
                const url = new URL(window.location.href);
                url.searchParams.set('_v', String(Date.now()));
                window.location.replace(url.toString());
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

async function clearBrowserAssetCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Ignore cache clearing errors
  }
}

function cleanCacheBustParamFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_v')) {
      url.searchParams.delete('_v');
      const nextUrl =
        url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
      window.history.replaceState(null, '', nextUrl);
    }
  } catch {
    // Ignore history API errors
  }
}

async function checkAndApplyLiveUpdate(): Promise<void> {
  if (typeof window === 'undefined' || CURRENT_BUILD_ID === 'dev') return;
  try {
    const previousBuildId = window.localStorage.getItem(ACTIVE_BUILD_KEY);
    if (previousBuildId && previousBuildId !== CURRENT_BUILD_ID) {
      await clearBrowserAssetCaches();
    }
    window.localStorage.setItem(ACTIVE_BUILD_KEY, CURRENT_BUILD_ID);

    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) return;

    const data = (await res.json()) as { buildId?: string };
    const remoteBuildId = data?.buildId;
    if (!remoteBuildId || remoteBuildId === CURRENT_BUILD_ID) {
      return;
    }

    const lastReloadedFor = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (lastReloadedFor === remoteBuildId) {
      return;
    }

    window.sessionStorage.setItem(RELOAD_GUARD_KEY, remoteBuildId);
    await clearBrowserAssetCaches();

    const url = new URL(window.location.href);
    url.searchParams.set('_v', remoteBuildId);
    window.location.replace(url.toString());
  } catch {
    // Ignore network errors when offline
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

if (typeof window !== 'undefined') {
  cleanCacheBustParamFromUrl();

  // Handle Vite chunk preload errors when a new deployment replaces hashed JS/CSS chunks
  window.addEventListener('vite:preloadError', async (event) => {
    event.preventDefault();
    await clearBrowserAssetCaches();
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  });

  // Check shortly after initial mount so rendering never waits on network
  window.setTimeout(() => {
    void checkAndApplyLiveUpdate();
  }, 1200);

  // Check when mobile/desktop browser restores page from back-forward cache (bfcache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      void checkAndApplyLiveUpdate();
    }
  });

  // Check when user switches back to the browser tab or reopens the phone browser
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkAndApplyLiveUpdate();
    }
  });
}

