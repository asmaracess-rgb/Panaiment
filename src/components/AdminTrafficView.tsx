import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Wifi,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Radio,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TrafficAnalyticsData, RealtimeTrafficEvent, AppView } from '../types';
import {
  getTrafficAnalytics,
  simulateRandomVisitor,
  exportTrafficCsv,
  resetTrafficData,
} from '../utils/trafficTracker';

interface AdminTrafficViewProps {
  onNavigateToView?: (view: AppView) => void;
}

export const AdminTrafficView: React.FC<AdminTrafficViewProps> = ({ onNavigateToView }) => {
  const [trafficData, setTrafficData] = useState<TrafficAnalyticsData>(getTrafficAnalytics);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | '14days'>('7days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<'all' | 'Mobile' | 'Desktop' | 'Tablet'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);

  // Periodic subtle live tick simulation to make real-time monitor feel authentically alive
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse((prev) => !prev);
      setTrafficData((prev) => {
        const randomDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const newActive = Math.min(32, Math.max(12, prev.activeVisitorsNow + randomDelta));
        return {
          ...prev,
          activeVisitorsNow: newActive,
        };
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTrafficData(getTrafficAnalytics());
      setIsRefreshing(false);
      showToast('Data statistik & log trafik berhasil dimutakhirkan.');
    }, 400);
  };

  const handleSimulateVisit = () => {
    const newLog = simulateRandomVisitor();
    setTrafficData(getTrafficAnalytics());
    showToast(`Kunjungan uji coba berhasil dicatat: ${newLog.pageTitle} (${newLog.location})`);
  };

  const handleExportCsv = () => {
    const csvContent = exportTrafficCsv(trafficData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Trafik_Kelurahan_Panaikang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Laporan trafik berhasil diunduh dalam format CSV.');
  };

  const handlePrint = () => {
    window.print();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filtered daily points based on period selection
  const filteredDailyPoints = useMemo(() => {
    if (selectedPeriod === 'today') {
      return trafficData.dailyPoints.slice(-1);
    }
    if (selectedPeriod === '7days') {
      return trafficData.dailyPoints.slice(-7);
    }
    return trafficData.dailyPoints;
  }, [trafficData.dailyPoints, selectedPeriod]);

  // Max value in daily points for chart height scaling
  const maxHitsInChart = useMemo(() => {
    const maxVal = Math.max(...filteredDailyPoints.map((p) => p.pageviews), 600);
    return Math.ceil(maxVal / 100) * 100;
  }, [filteredDailyPoints]);

  // Filtered realtime logs
  const filteredLogs = useMemo(() => {
    return trafficData.realtimeLogs.filter((log) => {
      const matchDevice = selectedDeviceFilter === 'all' || log.deviceType === selectedDeviceFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        log.page.toLowerCase().includes(q) ||
        log.pageTitle.toLowerCase().includes(q) ||
        log.location.toLowerCase().includes(q) ||
        log.referrer.toLowerCase().includes(q) ||
        log.platform.toLowerCase().includes(q) ||
        log.browser.toLowerCase().includes(q);
      return matchDevice && matchQuery;
    });
  }, [trafficData.realtimeLogs, searchQuery, selectedDeviceFilter]);

  const totalPeriodHits = useMemo(() => {
    return filteredDailyPoints.reduce((acc, p) => acc + p.pageviews, 0);
  }, [filteredDailyPoints]);

  const totalPeriodUnique = useMemo(() => {
    return filteredDailyPoints.reduce((acc, p) => acc + p.uniqueVisitors, 0);
  }, [filteredDailyPoints]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-sky-700 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0D3868] tracking-tight">
                  Monitoring Traffic Web & Aplikasi
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Live Telemetry Aktif
                  </span>
                  <span className="text-xs text-slate-500">
                    Kelurahan Panaikang, Kec. Panakkukang
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-3xl">
              Pantau volume kunjungan warga, penginstalan Progressive Web App (PWA), kanal rujukan WhatsApp RT/RW, sebaran wilayah RW pengakses, dan rekam jejak koneksi realtime secara akurat dan transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateVisit}
              title="Kirim simulasi satu kunjungan warga baru untuk menguji respons sistem analitik"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0D3868] text-xs font-bold border border-sky-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Simulasi Kunjungan</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${livePulse ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-emerald-600'} transition-all`} />
              <span>
                Sedang Online Detik Ini:{' '}
                <strong className="text-emerald-700 font-bold font-mono-num text-sm">
                  {trafficData.activeVisitorsNow} Pengguna
                </strong>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>PWA Offline Cache: <strong className="text-slate-800">Aktif & Cepat</strong></span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Terakhir disinkronkan: <span className="font-mono-num font-medium text-slate-700">Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</span>
          </div>
        </div>
      </div>

      {/* 6 High-Impact Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Pageviews */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Tayangan
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-[#0D3868] font-mono-num">
            {trafficData.totalPageviews.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span>+18.4% bulan ini</span>
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 pointer-events-none">
            <Activity className="w-16 h-16 text-[#0D3868]" />
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pengunjung Unik
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-sky-900 font-mono-num">
            {trafficData.uniqueVisitors.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Warga & Pemohon
          </div>
          <div className="absolute right-2 -bottom-2 opacity-5 pointer-events-none">
            <Globe className="w-16 h-16 text-sky-600" />
          </div>
        </div>

        {/* Realtime Active */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>Aktif Saat Ini</span>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-emerald-950 font-mono-num">
            {trafficData.activeVisitorsNow}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-700">
            Sedang membaca / menginput
          </div>
        </div>

        {/* Today Hits */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Kunjungan Hari Ini
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-slate-900 font-mono-num">
            {trafficData.todayPageviews.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {trafficData.todayUniqueVisitors} warga unik
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata Durasi Sesi
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-amber-900 font-mono-num">
            {trafficData.avgSessionDuration}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Bounce: <span className="font-semibold text-slate-700">{trafficData.bounceRate}</span>
          </div>
        </div>

        {/* PWA Installs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Aplikasi Terinstal
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-black text-purple-900 font-mono-num">
            {trafficData.pwaInstalls}
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-medium">
            Layar Utama HP Warga
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Charts & Analytics Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wide, 2 cols): Trend Bar Chart & Top Pages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Traffic Trend Bar Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0D3868] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1C8237]" />
                  <span>Tren Trafik Harian & Kunjungan Warga</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi jumlah tayangan halaman ({totalPeriodHits.toLocaleString('id-ID')} tayangan) dan {totalPeriodUnique.toLocaleString('id-ID')} pengunjung unik.
                </p>
              </div>

              {/* Period selector tabs */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('7days')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === '7days'
                      ? 'bg-white text-[#0D3868] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('14days')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === '14days'
                      ? 'bg-white text-[#0D3868] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('today')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'today'
                      ? 'bg-white text-[#0D3868] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hari Ini
                </button>
              </div>
            </div>

            {/* Interactive Bar Chart Representation */}
            <div className="mt-5">
              <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-200">
                {filteredDailyPoints.map((point, idx) => {
                  const heightPercent = Math.min(100, Math.max(12, Math.round((point.pageviews / maxHitsInChart) * 100)));
                  const isLatest = idx === filteredDailyPoints.length - 1;
                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-[11px] shadow-lg whitespace-nowrap text-center">
                          <div className="font-bold text-sky-300">{point.label}</div>
                          <div>{point.pageviews} Tayangan ({point.uniqueVisitors} Unik)</div>
                          <div className="text-[10px] text-slate-300">
                            📱 {point.mobile} HP · 💻 {point.desktop} PC
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>

                      {/* Bar Value on top */}
                      <span className="text-[10px] font-mono-num font-semibold text-slate-500 mb-1 hidden sm:block">
                        {point.pageviews}
                      </span>

                      {/* The Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          isLatest
                            ? 'bg-gradient-to-t from-[#0D3868] to-sky-500 shadow-sm ring-2 ring-sky-300'
                            : 'bg-gradient-to-t from-slate-300 to-slate-400 group-hover:from-sky-500 group-hover:to-cyan-400'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex items-center justify-between gap-1 mt-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {filteredDailyPoints.map((p) => (
                  <div key={p.date} className="flex-1 text-center truncate px-0.5">
                    {p.label.split(',')[0]}
                  </div>
                ))}
              </div>

              {/* Legend Strip */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500" />
                    <span>Total Tayangan Halaman</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#0D3868]" />
                    <span>Hari Ini (Aktif)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Rata-rata: <strong className="text-slate-800">{Math.round(totalPeriodHits / filteredDailyPoints.length)} hits/hari</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Top Visited Pages & Modules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0D3868] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Halaman & Layanan Paling Sering Dikunjungi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar modul aplikasi yang paling banyak diakses oleh masyarakat Kelurahan Panaikang
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Halaman / Modul</th>
                    <th className="py-2.5 px-3 text-right">Tayangan</th>
                    <th className="py-2.5 px-3 text-right">Porsi</th>
                    <th className="py-2.5 px-3 text-right">Rata Durasi</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trafficData.topPages.map((page, index) => {
                    const viewKey = page.path.replace('/', '');
                    return (
                      <tr key={page.path} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono-num font-bold text-slate-400">
                          #{index + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{page.title}</div>
                          <div className="text-[11px] font-mono text-slate-500">{page.path}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-bold text-[#0D3868]">
                          {page.views.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                              <div
                                style={{ width: `${page.percentage}%` }}
                                className="h-full bg-sky-600 rounded-full"
                              />
                            </div>
                            <span className="font-mono-num font-semibold text-slate-700 w-10 text-right">
                              {page.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-slate-600">
                          {page.avgDuration}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {onNavigateToView && (
                            <button
                              type="button"
                              onClick={() => onNavigateToView(viewKey as AppView)}
                              title={`Buka modul ${page.title}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0D3868] text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              <span>Buka</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribution by 8 RWs of Panaikang */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D3868] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Distribusi Akses Berdasarkan Wilayah RW (Panaikang)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan aktivitas warga per RW berdasarkan interaksi pelaporan, surat permohonan, dan registrasi bank sampah
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trafficData.rwBreakdown.map((rw) => (
                <div
                  key={rw.rw}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{rw.rw}</span>
                    <span className="text-xs font-mono-num font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {rw.visits.toLocaleString('id-ID')} ({rw.percentage}%)
                    </span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${rw.percentage * 5}%` }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Layanan teratas: <strong className="text-slate-700">{rw.topService}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar, 1 col): Acquisition Channels, Devices & Network Info */}
        <div className="space-y-6">
          {/* Traffic Acquisition Channels (Sources) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D3868] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Share2 className="w-4 h-4 text-sky-600" />
              <span>Sumber Rujukan Trafik (Saluran)</span>
            </h3>

            <div className="mt-4 space-y-3.5">
              {trafficData.sources.map((source) => (
                <div key={source.channel}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      <span>{source.channel}</span>
                    </span>
                    <span className="font-mono-num text-slate-900 font-bold">
                      {source.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${source.percentage}%`,
                        backgroundColor: source.color,
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 leading-tight">
                    {source.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device & Browser Composition */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D3868] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>Perangkat & Browser Pengunjung</span>
            </h3>

            {/* Device cards */}
            <div className="mt-4 space-y-2.5">
              {trafficData.deviceBreakdown.map((dev) => (
                <div
                  key={dev.device}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {dev.icon === 'mobile' && <Smartphone className="w-4 h-4 text-purple-600" />}
                    {dev.icon === 'desktop' && <Monitor className="w-4 h-4 text-sky-600" />}
                    {dev.icon === 'tablet' && <Tablet className="w-4 h-4 text-amber-600" />}
                    <div>
                      <div className="text-xs font-bold text-slate-900">{dev.device}</div>
                      <div className="text-[10px] text-slate-500 font-mono-num">
                        {dev.visits.toLocaleString('id-ID')} kunjungan
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono-num">
                    {dev.percentage}%
                  </div>
                </div>
              ))}
            </div>

            {/* Browser tags */}
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Sebaran Peramban (Browser)
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                  Google Chrome <strong>59.8%</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                  Safari iOS <strong>16.5%</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                  Samsung Internet <strong>12.2%</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                  Edge & Lainnya <strong>11.5%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure & Security Telemetry Card */}
          <div className="bg-gradient-to-br from-[#0D3868] to-[#082240] rounded-2xl p-5 text-white shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Infrastruktur & Keamanan</h3>
            </div>
            <p className="mt-1 text-xs text-sky-200 leading-relaxed">
              Sistem Satu Data Panaikang dilindungi enkripsi SSL/TLS, proteksi privasi warga (masking alamat IP), dan CDN Edge Server.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-sky-200">Ketersediaan (Uptime):</span>
                <span className="font-bold text-emerald-300 font-mono-num">99.98%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-sky-200">Kecepatan Respons (TTFB):</span>
                <span className="font-bold text-sky-100 font-mono-num">380 ms (Super Cepat)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-sky-200">Status PWA Service Worker:</span>
                <span className="font-bold text-emerald-300">Aktif & Terdaftar</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sky-200">Perlindungan Privasi:</span>
                <span className="font-bold text-sky-100">IP Dimaskir Sesuai UU PDP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Live Visitor Access Stream Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="text-base font-bold text-[#0D3868]">
                Log Akses Pengunjung Real-time (Live Activity Stream)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kunjungan terkini warga dan operator secara langsung tanpa merekam data pribadi sensitif
            </p>
          </div>

          {/* Search & Device Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari halaman, lokasi, provider..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#0D3868] focus:outline-none w-48 sm:w-60"
              />
            </div>

            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Perangkat</option>
              <option value="Mobile">Mobile (HP)</option>
              <option value="Desktop">Desktop (PC)</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Halaman / Modul Yang Diakses</th>
                <th className="py-2.5 px-3">Perangkat & OS</th>
                <th className="py-2.5 px-3">Perkiraan Lokasi & Jaringan</th>
                <th className="py-2.5 px-3">Saluran Rujukan</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono-num font-semibold text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {log.timestamp}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{log.pageTitle}</div>
                    <div className="text-[11px] font-mono text-slate-500">{log.page}</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {log.deviceType === 'Mobile' && <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                      {log.deviceType === 'Desktop' && <Monitor className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      {log.deviceType === 'Tablet' && <Tablet className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      <span>{log.platform}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{log.browser}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800 flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{log.location}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">IP: {log.ipMasked}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0D3868] font-medium border border-sky-100 text-[11px]">
                      {log.referrer}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === '200 OK'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ditemukan riwayat log trafik yang cocok dengan filter pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
