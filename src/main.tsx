import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare const __APP_BUILD_ID__: string;

const CURRENT_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const RELOAD_GUARD_KEY = 'pnk_last_reloaded_build_id';
const ACTIVE_BUILD_KEY = 'pnk_active_build_id';

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

async function checkAndApplyLiveUpdate(): Promise<void> {
  if (typeof window === 'undefined') return;
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

if (typeof window !== 'undefined') {
  // Handle Vite chunk preload errors when a new deployment replaces hashed JS/CSS chunks
  window.addEventListener('vite:preloadError', async (event) => {
    event.preventDefault();
    await clearBrowserAssetCaches();
    window.location.reload();
  });

  // Check immediately on initial visit
  void checkAndApplyLiveUpdate();

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

createRoot(document.getElementById('root')!).render(<App />);

