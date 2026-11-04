import { AppView } from '../types';

export interface DailyTrafficPoint {
  date: string; // e.g., "04 Nov"
  isoDate: string; // YYYY-MM-DD
  pageviews: number;
  uniqueVisitors: number;
  sessions: number;
}

export interface PageTrafficItem {
  path: string;
  title: string;
  views: number;
  uniqueUsers: number;
  avgTimeOnPage: string;
  percentage: number;
}

export interface TrafficSourceItem {
  source: string;
  visits: number;
  percentage: number;
  color: string;
}

export interface RealtimeVisitorLog {
  id: string;
  timestamp: string;
  dateStr: string;
  visitorId?: string;
  page: string;
  pageTitle: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  platform: string;
  browser: string;
  locationHint: string;
  referrer: string;
  ipMasked: string;
}

export interface BrowserBreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TrafficAnalyticsData {
  totalPageviews: number;
  uniqueVisitors: number;
  activeVisitorsNow: number;
  avgSessionDuration: string;
  bounceRate: number;
  todayPageviews: number;
  pwaInstalls: number;
  dailyPoints: DailyTrafficPoint[];
  topPages: PageTrafficItem[];
  sources: TrafficSourceItem[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browserBreakdown?: BrowserBreakdownItem[];
  rwBreakdown: Array<{
    rw: string;
    sessions: number;
    reportsSubmitted: number;
    percentage: number;
  }>;
  realtimeLogs: RealtimeVisitorLog[];
  lastUpdated: string;
  serverUptimeSec?: number;
}

const TRAFFIC_STORAGE_KEY = 'pnk_smart_env_real_traffic_v4';
const VISITOR_ID_KEY = 'pnk_real_visitor_id_v1';
const SESSION_ID_KEY = 'pnk_real_session_id_v1';
const LAST_VIEW_KEY = 'pnk_real_last_view_v1';
const LAST_VIEW_ENTER_MS_KEY = 'pnk_real_last_view_ms_v1';
const PWA_RECORDED_KEY = 'pnk_real_pwa_installed_v1';

const PAGE_METADATA: Record<AppView, { path: string; title: string }> = {
  beranda: { path: '/beranda', title: 'Beranda Utama Portal' },
  profil: { path: '/profil', title: 'Profil & Kelembagaan Kelurahan' },
  rtrw: { path: '/rtrw', title: 'Direktori RT/RW & Jadwal Siskamling' },
  warga: { path: '/warga', title: 'Layanan Pengurusan & E-Lapor Warga' },
  lurah: { path: '/lurah', title: 'Dashboard Eksekutif Lurah' },
  peta: { path: '/peta', title: 'Peta GIS Interaktif Panaikang' },
  sampah: { path: '/sampah', title: 'Monitoring Bank Sampah & Konservasi' },
  kerjabakti: { path: '/kerjabakti', title: 'Jadwal Kerja Bakti & Armada' },
  urbanfarming: { path: '/urbanfarming', title: 'Urban Farming & Ketahanan Pangan' },
  admin: { path: '/admin', title: 'Panel Administrator Kelurahan' },
};

const getLocalIsoDate = (d = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (d: Date): string => {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

export const getOrCreateRealVisitorId = (): string => {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `VID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `VID-ANON`;
  }
};

export const getOrCreateRealSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `SES-ACTIVE`;
  }
};

function detectRealDeviceAndBrowser(): {
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  platform: string;
  browser: string;
} {
  if (typeof navigator === 'undefined') {
    return { deviceType: 'Desktop', platform: 'Web OS', browser: 'Browser' };
  }

  const ua = navigator.userAgent || '';
  let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  let platform = 'Web OS';
  if (/Windows NT 10|Windows NT 11/i.test(ua)) platform = 'Windows 10/11';
  else if (/Windows/i.test(ua)) platform = 'Windows';
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9.]+)/i);
    platform = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS / iPadOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) platform = 'macOS';
  else if (/CrOS/i.test(ua)) platform = 'ChromeOS';
  else if (/Linux/i.test(ua)) platform = 'Linux';

  let browser = 'Browser';
  if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox\/|FxiOS/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Chrome\/|CriOS/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari';

  return { deviceType, platform, browser };
}

function detectRealReferrerSource(): string {
  if (typeof window === 'undefined') return 'Direct URL / Bookmark Warga';

  try {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      return 'PWA Home Screen (Aplikasi)';
    }

    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || params.get('ref') || '').toLowerCase();
    if (utmSource.includes('wa') || utmSource.includes('whatsapp')) {
      return 'WhatsApp Broadcast RT/RW';
    }
    if (utmSource.includes('google')) {
      return 'Google Search (Organik)';
    }
    if (utmSource.includes('ig') || utmSource.includes('fb') || utmSource.includes('social')) {
      return 'Media Sosial & Rujukan Lainnya';
    }

    const ref = (document.referrer || '').toLowerCase();
    if (!ref || ref.includes(window.location.host.toLowerCase())) {
      return 'Direct URL / Bookmark Warga';
    }
    if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.')) {
      return 'Google Search (Organik)';
    }
    if (ref.includes('whatsapp.') || ref.includes('wa.me')) {
      return 'WhatsApp Broadcast RT/RW';
    }
    return 'Media Sosial & Rujukan Lainnya';
  } catch {
    return 'Direct URL / Bookmark Warga';
  }
}

function detectRealNetworkAndTimezoneHint(): string {
  if (typeof window === 'undefined') return 'Zona WITA';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Makassar';
    const cityPart = tz.includes('/') ? tz.split('/')[1].replace(/_/g, ' ') : tz;
    const navConn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    const netType = navConn?.effectiveType ? navConn.effectiveType.toUpperCase() : '';
    const screenRes = `${window.innerWidth}x${window.innerHeight}`;
    return netType ? `${cityPart} (${netType} • ${screenRes})` : `${cityPart} (${screenRes})`;
  } catch {
    return 'Makassar (WITA)';
  }
}

function createInitialEmptyAnalytics(): TrafficAnalyticsData {
  const dailyPoints: DailyTrafficPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyPoints.push({
      date: formatShortDate(d),
      isoDate: getLocalIsoDate(d),
      pageviews: 0,
      uniqueVisitors: 0,
      sessions: 0,
    });
  }

  const topPages: PageTrafficItem[] = (Object.keys(PAGE_METADATA) as AppView[]).map((key) => ({
    path: PAGE_METADATA[key].path,
    title: PAGE_METADATA[key].title,
    views: 0,
    uniqueUsers: 0,
    avgTimeOnPage: '0m 00s',
    percentage: 0,
  }));

  const sources: TrafficSourceItem[] = [
    { source: 'Direct URL / Bookmark Warga', visits: 0, percentage: 0, color: '#059669' },
    { source: 'Google Search (Organik)', visits: 0, percentage: 0, color: '#2563eb' },
    { source: 'WhatsApp Broadcast RT/RW', visits: 0, percentage: 0, color: '#10b981' },
    { source: 'PWA Home Screen (Aplikasi)', visits: 0, percentage: 0, color: '#7c3aed' },
    { source: 'Media Sosial & Rujukan Lainnya', visits: 0, percentage: 0, color: '#f59e0b' },
  ];

  const rwBreakdown = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'].map((rw) => ({
    rw,
    sessions: 0,
    reportsSubmitted: 0,
    percentage: 0,
  }));

  return {
    totalPageviews: 0,
    uniqueVisitors: 0,
    activeVisitorsNow: 1,
    avgSessionDuration: '0m 00s',
    bounceRate: 0,
    todayPageviews: 0,
    pwaInstalls: 0,
    dailyPoints,
    topPages,
    sources,
    deviceBreakdown: {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    },
    browserBreakdown: [],
    rwBreakdown,
    realtimeLogs: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function loadTrafficAnalytics(): TrafficAnalyticsData {
  try {
    const raw = localStorage.getItem(TRAFFIC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrafficAnalyticsData;
      if (parsed && typeof parsed.totalPageviews === 'number' && Array.isArray(parsed.dailyPoints)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load cached real traffic analytics:', err);
  }
  return createInitialEmptyAnalytics();
}

export function saveTrafficAnalytics(data: TrafficAnalyticsData): void {
  try {
    localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('pnk_traffic_updated', { detail: data }));
  } catch (err) {
    console.warn('Failed to save traffic analytics cache:', err);
  }
}

export async function fetchRealTrafficAnalytics(): Promise<{
  data: TrafficAnalyticsData;
  latencyMs: number;
  fromServer: boolean;
}> {
  const startMs = performance.now();
  try {
    const res = await fetch('/api/traffic', { cache: 'no-store' });
    const latencyMs = Math.max(1, Math.round(performance.now() - startMs));
    if (res.ok) {
      const payload = await res.json();
      if (payload?.ok && payload.data) {
        const serverData = payload.data as TrafficAnalyticsData;
        saveTrafficAnalytics(serverData);
        return { data: serverData, latencyMs, fromServer: true };
      }
    }
  } catch {
    // Fallback to local real cache if offline
  }
  const latencyMs = Math.max(1, Math.round(performance.now() - startMs));
  return { data: loadTrafficAnalytics(), latencyMs, fromServer: false };
}

/**
 * Records a 100% real page navigation hit from the user's browser and syncs with the server.
 */
export function recordTrafficHit(view: AppView): TrafficAnalyticsData {
  const nowMs = Date.now();
  const visitorId = getOrCreateRealVisitorId();
  const sessionId = getOrCreateRealSessionId();
  const { deviceType, platform, browser } = detectRealDeviceAndBrowser();
  const referrer = detectRealReferrerSource();
  const locationHint = detectRealNetworkAndTimezoneHint();

  let prevView = '';
  let prevPageDurationSec = 0;
  try {
    prevView = sessionStorage.getItem(LAST_VIEW_KEY) || '';
    const lastEnterStr = sessionStorage.getItem(LAST_VIEW_ENTER_MS_KEY);
    if (prevView && lastEnterStr) {
      const elapsedSec = Math.round((nowMs - Number(lastEnterStr)) / 1000);
      if (elapsedSec > 0 && elapsedSec < 3600) {
        prevPageDurationSec = elapsedSec;
      }
    }
    sessionStorage.setItem(LAST_VIEW_KEY, view);
    sessionStorage.setItem(LAST_VIEW_ENTER_MS_KEY, String(nowMs));
  } catch {}

  // Check if running as installed standalone PWA for the first time on this device
  try {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone && !localStorage.getItem(PWA_RECORDED_KEY)) {
      localStorage.setItem(PWA_RECORDED_KEY, '1');
      fetch('/api/traffic/pwa-install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standalone: true }),
      }).catch(() => {});
    }
  } catch {}

  // Send real telemetry hit to server
  fetch('/api/traffic/hit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      view,
      visitorId,
      sessionId,
      deviceType,
      platform,
      browser,
      referrer,
      locationHint,
      prevView,
      prevPageDurationSec,
    }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      if (payload?.ok && payload.data) {
        saveTrafficAnalytics(payload.data as TrafficAnalyticsData);
      }
    })
    .catch(() => {});

  return loadTrafficAnalytics();
}

export async function recordRealPwaInstallEvent(): Promise<void> {
  try {
    localStorage.setItem(PWA_RECORDED_KEY, '1');
    const res = await fetch('/api/traffic/pwa-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'appinstalled', standalone: true }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.ok && payload.data) {
        saveTrafficAnalytics(payload.data as TrafficAnalyticsData);
      }
    }
  } catch {}
}

export async function resetRealTrafficAnalytics(): Promise<TrafficAnalyticsData> {
  try {
    const res = await fetch('/api/traffic/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.ok && payload.data) {
        const fresh = payload.data as TrafficAnalyticsData;
        saveTrafficAnalytics(fresh);
        return fresh;
      }
    }
  } catch {}
  const empty = createInitialEmptyAnalytics();
  saveTrafficAnalytics(empty);
  return empty;
}

export function exportTrafficCsv(data: TrafficAnalyticsData): void {
  const headers = ['Tanggal', 'ISO Date', 'Pageviews', 'Unique Visitors', 'Sessions'];
  const rows = data.dailyPoints.map((pt) => [
    `"${pt.date}"`,
    `"${pt.isoDate}"`,
    pt.pageviews,
    pt.uniqueVisitors,
    pt.sessions,
  ]);

  const pageHeaders = ['Path Halaman', 'Judul Modul', 'Total Views', 'Unique Users', 'Avg Time', 'Persentase (%)'];
  const pageRows = data.topPages.map((pg) => [
    `"${pg.path}"`,
    `"${pg.title}"`,
    pg.views,
    pg.uniqueUsers,
    `"${pg.avgTimeOnPage}"`,
    pg.percentage,
  ]);

  const logHeaders = ['ID Log', 'Waktu', 'Tanggal', 'Halaman', 'Perangkat', 'OS', 'Browser', 'Sumber Trafik', 'IP Masked'];
  const logRows = data.realtimeLogs.map((l) => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.dateStr}"`,
    `"${l.pageTitle} (${l.page})"`,
    `"${l.deviceType}"`,
    `"${l.platform}"`,
    `"${l.browser}"`,
    `"${l.referrer}"`,
    `"${l.ipMasked}"`,
  ]);

  const csvContent = [
    'LAPORAN REAL TRAFIK & KUNJUNGAN WEB - PORTAL SMART ENVIRONMENT KELURAHAN PANAIKANG',
    `Diekspor pada: ${new Date().toLocaleString('id-ID')}`,
    `Total Pageviews Riil: ${data.totalPageviews} | Unique Visitors Riil: ${data.uniqueVisitors} | Sesi Aktif Saat Ini: ${data.activeVisitorsNow}`,
    '',
    '--- TREN HARIAN (14 HARI TERAKHIR) ---',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    '--- HALAMAN TERPOPULER (REAL HITS) ---',
    pageHeaders.join(','),
    ...pageRows.map((r) => r.join(',')),
    '',
    '--- LOG KUNJUNGAN REAL-TIME TERAKHIR ---',
    logHeaders.join(','),
    ...logRows.map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Laporan_Real_Traffic_Panaikang_${getLocalIsoDate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
