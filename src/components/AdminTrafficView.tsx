import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Users,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  TrendingUp,
  Download,
  RefreshCw,
  ArrowUpRight,
  MapPin,
  Share2,
  ShieldCheck,
  Search,
  BarChart3,
  Layers,
  ExternalLink,
  Signal,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AppView } from '../types';
import {
  TrafficAnalyticsData,
  loadTrafficAnalytics,
  fetchRealTrafficAnalytics,
  resetRealTrafficAnalytics,
  exportTrafficCsv,
  saveTrafficAnalytics,
} from '../utils/trafficTracker';
import { isLocalExpressAvailable } from '../utils/runtimeEnv';

interface AdminTrafficViewProps {
  onNavigateToView?: (view: AppView) => void;
}

export const AdminTrafficView: React.FC<AdminTrafficViewProps> = ({ onNavigateToView }) => {
  const [trafficData, setTrafficData] = useState<TrafficAnalyticsData>(() => loadTrafficAnalytics());
  const [chartRange, setChartRange] = useState<'7d' | '14d'>('14d');
  const [chartMetric, setChartMetric] = useState<'pageviews' | 'uniqueVisitors' | 'sessions'>('pageviews');
  const [logSearch, setLogSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'Mobile' | 'Desktop' | 'Tablet'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverLatencyMs, setServerLatencyMs] = useState<number>(12);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const syncWithServer = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    const result = await fetchRealTrafficAnalytics();
    setTrafficData(result.data);
    setServerLatencyMs(result.latencyMs);
    setIsServerConnected(result.fromServer);
    if (showSpinner) {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  useEffect(() => {
    syncWithServer(false);

    const handleLocalTrafficUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<TrafficAnalyticsData>;
      if (customEvent.detail) {
        setTrafficData(customEvent.detail);
      } else {
        setTrafficData(loadTrafficAnalytics());
      }
    };

    const handleSseTrafficUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TrafficAnalyticsData>;
      if (customEvent.detail) {
        setTrafficData(customEvent.detail);
        saveTrafficAnalytics(customEvent.detail);
        setIsServerConnected(true);
      }
    };

    window.addEventListener('pnk_traffic_updated', handleLocalTrafficUpdated);
    window.addEventListener('pnk_traffic_sse', handleSseTrafficUpdate);

    // Periodic real server poll only when local Express backend is active and tab is visible
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLocalExpressAvailable()) {
      interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        if (!isLocalExpressAvailable()) return;
        syncWithServer(false);
      }, 15000);
    }

    return () => {
      window.removeEventListener('pnk_traffic_updated', handleLocalTrafficUpdated);
      window.removeEventListener('pnk_traffic_sse', handleSseTrafficUpdate);
      if (interval) clearInterval(interval);
    };
  }, [syncWithServer]);

  const handleRefresh = () => {
    syncWithServer(true);
  };

  const handleConfirmReset = async () => {
    setIsRefreshing(true);
    const fresh = await resetRealTrafficAnalytics();
    setTrafficData(fresh);
    setShowResetModal(false);
    setIsRefreshing(false);
    setStatusBanner('Data trafik web berhasil direset ke 0. Sistem kini merekam kunjungan riil baru dari awal.');
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const displayedPoints = useMemo(() => {
    const pts = trafficData.dailyPoints || [];
    if (chartRange === '7d') {
      return pts.slice(-7);
    }
    return pts;
  }, [trafficData.dailyPoints, chartRange]);

  const maxChartValue = useMemo(() => {
    if (displayedPoints.length === 0) return 10;
    const vals = displayedPoints.map((pt) => pt[chartMetric]);
    return Math.max(...vals, 5);
  }, [displayedPoints, chartMetric]);

  // Period summary totals & real comparison between recent half and previous half
  const periodTotals = useMemo(() => {
    const totalViews = displayedPoints.reduce((acc, p) => acc + p.pageviews, 0);
    const totalUniques = displayedPoints.reduce((acc, p) => acc + p.uniqueVisitors, 0);
    const totalSessions = displayedPoints.reduce((acc, p) => acc + p.sessions, 0);
    const avgDailyViews = displayedPoints.length > 0 ? Math.round(totalViews / displayedPoints.length) : 0;
    return { totalViews, totalUniques, totalSessions, avgDailyViews };
  }, [displayedPoints]);

  const filteredLogs = useMemo(() => {
    return (trafficData.realtimeLogs || []).filter((log) => {
      const matchDevice = deviceFilter === 'ALL' || log.deviceType === deviceFilter;
      const q = logSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        log.pageTitle.toLowerCase().includes(q) ||
        log.page.toLowerCase().includes(q) ||
        log.locationHint.toLowerCase().includes(q) ||
        log.referrer.toLowerCase().includes(q) ||
        log.platform.toLowerCase().includes(q) ||
        log.browser.toLowerCase().includes(q) ||
        log.ipMasked.toLowerCase().includes(q);
      return matchDevice && matchSearch;
    });
  }, [trafficData.realtimeLogs, deviceFilter, logSearch]);

  const totalDeviceCount =
    (trafficData.deviceBreakdown?.mobile || 0) +
    (trafficData.deviceBreakdown?.desktop || 0) +
    (trafficData.deviceBreakdown?.tablet || 0);

  const mobilePct =
    totalDeviceCount > 0 ? ((trafficData.deviceBreakdown.mobile / totalDeviceCount) * 100).toFixed(1) : '0.0';
  const desktopPct =
    totalDeviceCount > 0 ? ((trafficData.deviceBreakdown.desktop / totalDeviceCount) * 100).toFixed(1) : '0.0';
  const tabletPct =
    totalDeviceCount > 0 ? ((trafficData.deviceBreakdown.tablet / totalDeviceCount) * 100).toFixed(1) : '0.0';

  const realBrowserList = useMemo(() => {
    if (trafficData.browserBreakdown && trafficData.browserBreakdown.length > 0) {
      return trafficData.browserBreakdown;
    }
    const counts: Record<string, number> = {};
    for (const log of trafficData.realtimeLogs || []) {
      const b = log.browser || 'Browser';
      counts[b] = (counts[b] || 0) + 1;
    }
    const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);
  }, [trafficData.browserBreakdown, trafficData.realtimeLogs]);

  const formatServerUptime = (sec?: number) => {
    if (!sec || sec <= 0) return 'Aktif';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}j ${mins}m nonstop`;
    if (mins > 0) return `${mins} menit aktif`;
    return `${sec} detik aktif`;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {statusBanner && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-emerald-600 hover:text-emerald-900 font-black px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Action Controls (Compact & Simplified) */}
      <div className="bg-gradient-to-r from-[#0D3868] via-[#0B2F57] to-[#1C8237] rounded-2xl p-3.5 sm:p-4 text-white shadow-xs border border-slate-200 space-y-2.5">
        <div className="w-full space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Web Telemetry • 100% Data Kunjungan Riil</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-sky-200 text-[10px] font-semibold">
              <Signal className="w-3 h-3 text-emerald-300" />
              <span>{trafficData.activeVisitorsNow} Sesi Terhubung</span>
              <span>•</span>
              <span>
                Hit:{' '}
                {new Date(trafficData.lastUpdated).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}{' '}
                WITA
              </span>
            </div>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
            Analitik Trafik &amp; Kunjungan Portal Kelurahan Panaikang
          </h2>
          <p className="text-xs text-sky-100 w-full leading-relaxed">
            Merekam setiap akses halaman nyata dari browser warga &amp; perangkat yang terhubung ke server, lengkap dengan deteksi IP nyata (masked), User-Agent perangkat, durasi sesi riil, serta interaksi layanan RW 01 – RW 07.
          </p>
        </div>

        {/* Action Buttons Below Text */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportTrafficCsv(trafficData)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV Trafik Riil</span>
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/30 hover:bg-sky-500/45 text-white border border-sky-300/40 font-bold text-xs transition cursor-pointer"
              title="Sinkronkan ulang dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
              <span>Sinkronkan Server</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition cursor-pointer"
              title="Reset seluruh log & hitungan trafik ke nol"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isServerConnected
                ? `Server Telemetry Aktif (${serverLatencyMs} ms • ${formatServerUptime(trafficData.serverUptimeSec)})`
                : 'Mode Cache Lokal Browser'}
            </span>
          </div>
        </div>

        {/* 6 Compact Primary KPI Number Boxes Inside Banner */}
        <div className="pt-2.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Total Pageviews</div>
              <div className="text-[10px] text-emerald-300 truncate">Real Hits</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white font-mono-num shrink-0">
              {trafficData.totalPageviews.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Pengunjung Unik</div>
              <div className="text-[10px] text-sky-100 truncate">Browser ID</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-sky-200 font-mono-num shrink-0">
              {trafficData.uniqueVisitors.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Hari Ini (WITA)</div>
              <div className="text-[10px] text-amber-300 truncate">Sejak 00:00</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-amber-300 font-mono-num shrink-0">
              {trafficData.todayPageviews.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Rata Durasi</div>
              <div className="text-[10px] text-sky-100 truncate">Sesi Riil</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white font-mono-num shrink-0">
              {trafficData.avgSessionDuration}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Bounce Rate</div>
              <div className="text-[10px] text-sky-100 truncate">1-Page Sesi</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-emerald-300 font-mono-num shrink-0">
              {trafficData.bounceRate}%
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-200 truncate">Instalasi PWA</div>
              <div className="text-[10px] text-sky-100 truncate">Standalone</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white font-mono-num shrink-0">
              {trafficData.pwaInstalls.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reset Seluruh Data Trafik Web?</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan mengosongkan riwayat log kunjungan di server</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh penghitung <strong>Total Pageviews</strong>, <strong>Pengunjung Unik</strong>,{' '}
              <strong>Tren Harian</strong>, dan <strong>Log Pengunjung Real-Time</strong> akan dikembalikan ke{' '}
              <strong>0</strong> untuk memulai pencatatan baru dari awal.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Ya, Reset ke 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart + Device Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Traffic Bar/Trend Chart (2 columns wide) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Grafik Tren Trafik Harian (Rekaman Riil Server)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan jumlah riil tayangan halaman, pengunjung unik, dan sesi berdasarkan tanggal kalender
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Selector */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    onClick={() => setChartMetric('pageviews')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      chartMetric === 'pageviews'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pageviews
                  </button>
                  <button
                    onClick={() => setChartMetric('uniqueVisitors')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      chartMetric === 'uniqueVisitors'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unik
                  </button>
                  <button
                    onClick={() => setChartMetric('sessions')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      chartMetric === 'sessions'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sesi
                  </button>
                </div>

                {/* Range Selector */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    onClick={() => setChartRange('7d')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      chartRange === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => setChartRange('14d')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      chartRange === '14d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    14 Hari
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Strip Inside Chart */}
            <div className="grid grid-cols-3 gap-3 my-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Total Pageviews ({chartRange === '7d' ? '7 Hari' : '14 Hari'})
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  {periodTotals.totalViews.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Total Sesi ({chartRange === '7d' ? '7 Hari' : '14 Hari'})
                </span>
                <span className="text-base sm:text-lg font-black text-blue-700">
                  {periodTotals.totalSessions.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Rata-rata / Hari</span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {periodTotals.avgDailyViews.toLocaleString('id-ID')} hits
                </span>
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="h-56 flex items-end gap-1.5 sm:gap-2.5 border-b border-slate-200 pb-2 px-1">
                {displayedPoints.map((pt, idx) => {
                  const val = pt[chartMetric];
                  const heightPercent = val > 0 ? Math.max(8, Math.round((val / maxChartValue) * 100)) : 2;
                  const isToday = idx === displayedPoints.length - 1;

                  const barColor =
                    chartMetric === 'pageviews'
                      ? isToday
                        ? 'bg-emerald-500'
                        : 'bg-emerald-600/80 hover:bg-emerald-600'
                      : chartMetric === 'uniqueVisitors'
                      ? isToday
                        ? 'bg-blue-500'
                        : 'bg-blue-600/80 hover:bg-blue-600'
                      : isToday
                      ? 'bg-purple-500'
                      : 'bg-purple-600/80 hover:bg-purple-600';

                  return (
                    <div
                      key={pt.isoDate}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                        <p className="text-emerald-300">{pt.date}</p>
                        <p>
                          {val.toLocaleString('id-ID')}{' '}
                          {chartMetric === 'pageviews'
                            ? 'Tayangan'
                            : chartMetric === 'uniqueVisitors'
                            ? 'Pengunjung Unik'
                            : 'Sesi'}
                        </p>
                      </div>

                      {/* Value label on top of bar */}
                      <span
                        className={`text-[10px] font-bold mb-1 ${
                          isToday ? 'text-emerald-700 font-black' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      >
                        {val}
                      </span>

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[34px] rounded-t-lg transition-all duration-300 ${
                          val > 0 ? barColor : 'bg-slate-200'
                        } ${isToday ? 'ring-2 ring-emerald-400/50' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 pt-2 px-1">
                {displayedPoints.map((pt, idx) => {
                  const isToday = idx === displayedPoints.length - 1;
                  return (
                    <div key={pt.isoDate} className="flex-1 text-center">
                      <span
                        className={`text-[10px] sm:text-[11px] block truncate ${
                          isToday ? 'font-black text-emerald-700' : 'font-semibold text-slate-500'
                        }`}
                      >
                        {isToday ? 'Hari Ini' : pt.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Sumber Data:{' '}
              <strong className="text-slate-700">Server Telemetry (`data/traffic_analytics.json`) & Browser Hits</strong>
            </span>
            <span className="text-emerald-700 font-bold">
              ● Diperbarui otomatis saat warga membuka halaman
            </span>
          </div>
        </div>

        {/* Device, Browser & Source Breakdown (1 column wide) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          {/* Device Distribution */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Perangkat Pengunjung (Riil)</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {totalDeviceCount.toLocaleString('id-ID')} hits
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {/* Mobile */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Smartphone (Android / iOS)
                  </span>
                  <span className="text-slate-900">
                    {mobilePct}% ({trafficData.deviceBreakdown.mobile.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${mobilePct}%` }}
                  />
                </div>
              </div>

              {/* Desktop */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Monitor className="w-4 h-4 text-blue-600" />
                    Desktop / Laptop PC
                  </span>
                  <span className="text-slate-900">
                    {desktopPct}% ({trafficData.deviceBreakdown.desktop.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${desktopPct}%` }}
                  />
                </div>
              </div>

              {/* Tablet */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Tablet className="w-4 h-4 text-purple-600" />
                    Tablet / iPad
                  </span>
                  <span className="text-slate-900">
                    {tabletPct}% ({trafficData.deviceBreakdown.tablet.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${tabletPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Real Browser Breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Browser Terdeteksi (User-Agent Riil)
              </p>
              {realBrowserList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {realBrowserList.map((b) => (
                    <span
                      key={b.name}
                      className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      {b.name} ({b.percentage}% • {b.count})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada data browser yang terekam.</p>
              )}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="pt-4 border-t border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-900">Sumber Rujukan Trafik (Referrer Riil)</h4>
            </div>
            <div className="space-y-2.5">
              {trafficData.sources.map((src) => (
                <div key={src.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: src.color }}
                    />
                    <span className="font-semibold text-slate-700 truncate">{src.source}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 font-medium">{src.visits.toLocaleString('id-ID')}</span>
                    <span className="font-black text-slate-900 w-12 text-right">{src.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages & RW Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages Table (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Halaman & Modul Paling Banyak Diakses (Real Hits)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringkat modul layanan berdasarkan jumlah navigasi halaman riil dan durasi baca pengguna
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {trafficData.topPages.length} Rute Modul
            </span>
          </div>

          <div className="overflow-x-auto mt-3 max-h-[420px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 pr-3">#</th>
                  <th className="py-2.5 px-3">Modul / Path Halaman</th>
                  <th className="py-2.5 px-3 text-right">Tayangan</th>
                  <th className="py-2.5 px-3 text-right">Pengunjung Unik</th>
                  <th className="py-2.5 px-3 text-right">Rata-rata Waktu</th>
                  <th className="py-2.5 pl-3 text-right">Proporsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {trafficData.topPages.map((page, index) => (
                  <tr key={page.path} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 pr-3 font-black text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{page.title}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const targetView = page.path.replace(/^\//, '') as AppView;
                          if (onNavigateToView && targetView) {
                            onNavigateToView(targetView);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 font-mono cursor-pointer hover:underline"
                      >
                        {page.path}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {page.views.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-600">
                      {page.uniqueUsers.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-600">{page.avgTimeOnPage}</td>
                    <td className="py-3 pl-3 text-right w-28">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, page.percentage * 2.5)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 w-9 text-right">{page.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional RW Traffic & Citizen Participation (1 column - Computed from Real DB) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">Partisipasi Digital Warga per RW</h3>
                <p className="text-xs text-slate-500">
                  Dihitung langsung dari data riil E-Lapor, Bank Sampah, Kerja Bakti, Urban Farming, Teba & Siskamling (RW 01 – RW 07)
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {trafficData.rwBreakdown.map((item) => (
                <div key={item.rw} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-black text-slate-900">{item.rw} Kel. Panaikang</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {item.reportsSubmitted} Aduan E-Lapor
                      </span>
                      <span className="font-bold text-slate-700">
                        {item.sessions.toLocaleString('id-ID')} aktivitas ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, item.percentage * 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900">
            <p className="font-bold">Basis Perhitungan Partisipasi RW:</p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Menggabungkan jumlah tiket E-Lapor warga, titik Bank Sampah, jadwal Kerja Bakti, kebun Urban Farming,
              pengajuan bibit, Teba/Biopori, dan jadwal Siskamling aktif di masing-masing RW.
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time Visitor Stream Log */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Log Kunjungan Real-Time (Live Visitor Stream)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live SSE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar aktivitas akses halaman terbaru yang benar-benar terekam oleh server beserta IP (masked) dan perangkat nyata
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari halaman, OS, browser, IP..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52 sm:w-64"
              />
            </div>

            {/* Device Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(['ALL', 'Mobile', 'Desktop', 'Tablet'] as const).map((dev) => (
                <button
                  key={dev}
                  onClick={() => setDeviceFilter(dev)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    deviceFilter === dev ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dev === 'ALL' ? 'Semua' : dev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-3 max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 pr-3">Waktu (WITA)</th>
                <th className="py-2.5 px-3">Halaman Diakses</th>
                <th className="py-2.5 px-3">Perangkat & Browser</th>
                <th className="py-2.5 px-3">Zona / Resolusi & Jaringan</th>
                <th className="py-2.5 px-3">Sumber Trafik</th>
                <th className="py-2.5 pl-3 text-right">IP (Masked)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada log kunjungan yang sesuai dengan filter pencarian. Silakan navigasi menu portal untuk melihat log riil masuk secara langsung.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 30).map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition ${idx === 0 ? 'bg-emerald-50/40' : ''}`}
                  >
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.dateStr} • {log.id}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{log.pageTitle}</span>
                      <span className="text-[11px] text-emerald-600 font-mono">{log.page}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          log.deviceType === 'Mobile'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.deviceType === 'Desktop'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {log.deviceType}
                      </span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {log.platform} • {log.browser}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700">{log.locationHint}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600 font-medium">{log.referrer}</span>
                    </td>
                    <td className="py-3 pl-3 text-right font-mono text-slate-500 whitespace-nowrap">
                      {log.ipMasked}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
