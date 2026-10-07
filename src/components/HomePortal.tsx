import React, { useState } from 'react';
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  Recycle,
  Calendar,
  X,
  Newspaper,
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Users,
  Camera,
} from 'lucide-react';
import {
  AppView,
  CitizenReport,
  WasteBankUnit,
  CleanupEvent,
  KelurahanInfoItem,
  RwGroup,
} from '../types';
import {
  HERO_IMAGE_PATH,
  IG_PROFILE_PANAIKANG,
  INITIAL_KELURAHAN_INFOS,
} from '../data/initialData';
import {
  resolveImageUrl,
  getInstagramEmbedUrl,
  getInstagramProxyUrl,
} from '../utils/resolveImageUrl';
import {
  EmblemKotaMakassar,
  EmblemKelurahanPanaikang,
  LeafAccent,
  IconUntukWarga,
  IconDashboardLurah,
  IconPetaDigital,
  IconMonitoringSampah,
  IconMonitoringKerjaBakti,
} from './Emblems';

interface HomePortalProps {
  onNavigate: (view: AppView) => void;
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  rwGroups?: RwGroup[];
  onSyncInstagram: () => Promise<{ ok: boolean; syncedAt?: string }>;
  onQuickReportClick: () => void;
}

export const HomePortal: React.FC<HomePortalProps> = ({
  onNavigate,
  reports,
  wasteUnits,
  cleanupEvents,
  kelurahanInfos,
  rwGroups = [],
  onSyncInstagram,
  onQuickReportClick,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<KelurahanInfoItem | null>(null);
  const [infoFilter, setInfoFilter] = useState<'semua' | 'ig' | 'pengumuman'>('semua');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [localLikesOffset, setLocalLikesOffset] = useState<Record<string, number>>({});
  const [isSyncingIg, setIsSyncingIg] = useState(false);
  const [igSyncStatus, setIgSyncStatus] = useState<string>('Terhubung Otomatis · @kelurahan.panaikang');
  const [igEmbedMode, setIgEmbedMode] = useState<boolean>(false);
  const [embedFallbackPosts, setEmbedFallbackPosts] = useState<Record<string, boolean>>({});
  const [modalShowEmbed, setModalShowEmbed] = useState<boolean>(false);

  // Display current kelurahanInfos (including edits, additions, or deletions)
  const activeInfos = Array.isArray(kelurahanInfos) ? kelurahanInfos : INITIAL_KELURAHAN_INFOS;

  const handleToggleLike = (e: React.MouseEvent, info: KelurahanInfoItem) => {
    e.stopPropagation();
    const currentlyLiked = !!likedPosts[info.id];
    const nextLiked = !currentlyLiked;
    setLikedPosts((prev) => ({ ...prev, [info.id]: nextLiked }));
    setLocalLikesOffset((prev) => ({
      ...prev,
      [info.id]: (prev[info.id] || 0) + (nextLiked ? 1 : -1),
    }));
  };

  const handleSyncInstagramFeed = async () => {
    setIsSyncingIg(true);
    try {
      const result = await onSyncInstagram();
      if (result.ok) {
        setIgSyncStatus(
          `Tersinkronisasi dengan @kelurahan.panaikang · ${result.syncedAt || 'Baru Saja'}`
        );
      }
    } catch {
      setIgSyncStatus('Tersinkronisasi dengan @kelurahan.panaikang · Baru Saja');
    } finally {
      window.setTimeout(() => setIsSyncingIg(false), 350);
    }
  };

  const filteredInfos = activeInfos.filter((item) => {
    if (infoFilter === 'ig') return item.isInstagramSynced !== false;
    if (infoFilter === 'pengumuman') return item.category === 'Pengumuman Kelurahan';
    return true;
  });

  const completedReports = reports.filter((r) => r.status === 'Selesai').length;
  const activeReports = reports.filter((r) => r.status !== 'Selesai').length;
  const totalRecycledKg = wasteUnits.reduce((acc, u) => acc + u.organikKg + u.anorganikKg, 0);
  const scheduledCleanups = cleanupEvents.filter((e) => e.status !== 'Tuntas');
  const completedCleanups = cleanupEvents.filter((e) => e.status === 'Tuntas');
  const upcomingCleanups = scheduledCleanups.length;
  const totalRtCount = rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);

  return (
    <div className="relative overflow-hidden bg-white">
      {/* ================= HERO STREETSCAPE & EMBLEMS SECTION ================= */}
      <section className="relative w-full overflow-hidden">
        {/* Background Streetscape Container Featuring Nipah Mall Makassar, Kampus UMI & Jl. Urip Sumoharjo */}
        <div className="relative h-[300px] sm:h-[340px] lg:h-[370px] w-full overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-white">
          {!heroImgError ? (
            <img
              src={resolveImageUrl(HERO_IMAGE_PATH)}
              alt="Panorama Nipah Mall Makassar, Kampus UMI, dan Jalan Urip Sumoharjo di Kelurahan Panaikang Kota Makassar"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-sky-400 via-sky-200 to-white" />
          )}

          {/* Top Sky Lightening Scrim for Emblem Contrast */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-200/70 via-sky-100/40 to-transparent" />

          {/* Bottom White Cloud/Mist Fade Transition into Title Lockup */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-44 bg-gradient-to-t from-white via-white/95 to-transparent" />

          {/* Official Dual Emblems at Top Center: KOTA MAKASSAR | KELURAHAN PANAIKANG */}
          <div className="relative z-10 pt-2.5 sm:pt-3.5 flex flex-col items-center">
            <div className="inline-flex items-center justify-center gap-4 sm:gap-7">
              <button
                type="button"
                onClick={() => onNavigate('profil')}
                title="Lihat Profil Resmi Kelurahan Panaikang"
                className="flex flex-col items-center hover:scale-105 transition-transform duration-150 cursor-pointer focus:outline-none"
              >
                <EmblemKotaMakassar className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-[0_4px_12px_rgba(255,255,255,0.9)]" />
              </button>

              {/* Vertical Navy Divider Line matching prototype */}
              <div className="h-14 sm:h-18 w-[2.5px] bg-[#0D3868] rounded-full shadow-xs" />

              <button
                type="button"
                onClick={() => onNavigate('profil')}
                title="Lihat Profil Resmi Kelurahan Panaikang"
                className="flex flex-col items-center hover:scale-105 transition-transform duration-150 cursor-pointer focus:outline-none"
              >
                <EmblemKelurahanPanaikang className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-[0_4px_12px_rgba(255,255,255,0.9)]" />
              </button>
            </div>
          </div>

          {/* Main Prototype Title Lockup positioned over the white mist fade */}
          <div className="absolute inset-x-0 bottom-1.5 sm:bottom-2.5 z-10 flex flex-col items-center text-center px-4">
            {/* PANAIKANG with Green Leaf above the 'i', strictly baseline-aligned */}
            <h1 className="relative inline-block text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D3868] drop-shadow-[0_2px_10px_rgba(255,255,255,0.95)] leading-none select-none pt-4 sm:pt-5">
              <span>PANA</span>
              <span className="relative inline-block">
                <LeafAccent className="pointer-events-none absolute -top-[0.34em] left-1/2 -translate-x-[35%] w-[0.52em] h-[0.52em] transform -rotate-12" />
                <span>ı</span>
              </span>
              <span>KANG</span>
            </h1>

            {/* SMART ENVIRONMENT */}
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-wide text-[#1C8237] drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)] leading-tight">
              SMART ENVIRONMENT
            </p>

            {/* Italic Tagline */}
            <p className="mt-1 text-xs sm:text-sm lg:text-base italic font-semibold text-[#0D3868]">
              Satu Laporan, Satu Data, Satu Aksi untuk Panaikang.
            </p>
          </div>
        </div>
      </section>

      {/* ================= WELCOME & COMPACT 5 PORTAL MENU CARDS SECTION ================= */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-2 pb-12">
        {/* Compact Welcome Heading Flanked by Two Green Leaves */}
        <div className="text-center max-w-xl mx-auto mb-4 sm:mb-5">
          <div className="inline-flex items-center justify-center gap-2 sm:gap-3">
            <LeafAccent className="w-6 h-6 sm:w-7 sm:h-7 transform -rotate-45 shrink-0" flip />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
              Selamat Datang
            </h2>
            <LeafAccent className="w-6 h-6 sm:w-7 sm:h-7 transform rotate-12 shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-[#0D3868]">
            di Aplikasi Panaikang Smart Environment
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#1E3A5F] leading-snug text-balance">
            Bersama kita wujudkan lingkungan yang bersih, sehat dan berkelanjutan di Kelurahan
            Panaikang.
          </p>
        </div>

        {/* TOP ROW: 3 Compact Portal Menu Cards (Untuk Warga, Dashboard Lurah, Peta Digital) */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* Card 1: Untuk Warga (Blue Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('warga')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#0288D1] via-[#0277BD] to-[#004BA0] text-white shadow-[0_6px_16px_-4px_rgba(2,119,189,0.4)] border border-sky-300/40 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150">
                <IconUntukWarga className="w-8 h-7 sm:w-9 sm:h-8" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Untuk Warga
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-sky-50 leading-tight max-w-[165px] line-clamp-2">
                Lapor, pantau, dan lihat informasi lingkungan sekitar Anda.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#0277BD] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>

          {/* Card 2: Dashboard Lurah (Green Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('lurah')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#43A047] via-[#2E7D32] to-[#1B5E20] text-white shadow-[0_6px_16px_-4px_rgba(46,125,50,0.4)] border border-emerald-300/40 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150">
                <IconDashboardLurah className="w-8 h-7 sm:w-9 sm:h-8" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Dashboard Lurah
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-emerald-50 leading-tight max-w-[165px] line-clamp-2">
                Pantau laporan, data lingkungan, dan progres penanganan.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#2E7D32] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>

          {/* Card 3: Peta Digital (Teal Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('peta')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#00ACC1] via-[#00838F] to-[#005662] text-white shadow-[0_6px_16px_-4px_rgba(0,131,143,0.4)] border border-cyan-200/40 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150">
                <IconPetaDigital className="w-8 h-7 sm:w-9 sm:h-8" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Peta Digital
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-cyan-50 leading-tight max-w-[165px] line-clamp-2">
                Lihat titik permasalahan dan status penanganan secara real-time.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#00838F] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* BOTTOM ROW: 3 Compact Portal Menu Cards (Data RT & RW, Monitoring Sampah, Monitoring Kerja Bakti) */}
        <div className="mt-2.5 sm:mt-3.5 max-w-2xl mx-auto grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* Card 4: Data RT dan RW (Navy/Indigo Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('rtrw')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#1E4E8C] via-[#0D3868] to-[#072647] text-white shadow-[0_6px_16px_-4px_rgba(13,56,104,0.4)] border border-sky-200/40 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150 flex items-center justify-center w-8 h-7 sm:w-9 sm:h-8">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Data RT dan RW
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-sky-100 leading-tight max-w-[175px] line-clamp-2">
                Nama RW & daftar RT yang terbagi di tiap wilayah RW.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#0D3868] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>

          {/* Card 5: Monitoring Sampah (Orange/Amber Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('sampah')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#FB8C00] via-[#EF6C00] to-[#E65100] text-white shadow-[0_6px_16px_-4px_rgba(239,108,0,0.4)] border border-amber-200/45 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150">
                <IconMonitoringSampah className="w-8 h-7 sm:w-9 sm:h-8" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Monitoring Sampah
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-amber-50 leading-tight max-w-[175px] line-clamp-2">
                Data residu, organik, dan anorganik di Kelurahan Panaikang.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#EF6C00] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>

          {/* Card 6: Monitoring Kerja Bakti (Purple/Indigo Gradient) */}
          <button
            type="button"
            onClick={() => onNavigate('kerjabakti')}
            className="group relative flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-b from-[#7E57C2] via-[#5E35B1] to-[#4527A0] text-white shadow-[0_6px_16px_-4px_rgba(94,53,177,0.4)] border border-purple-200/40 hover:-translate-y-0.5 transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 p-1.5 rounded-xl bg-white/10 group-hover:scale-105 transition-transform duration-150">
                <IconMonitoringKerjaBakti className="w-8 h-7 sm:w-9 sm:h-8" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Monitoring Kerja Bakti
              </h3>
              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-purple-50 leading-tight max-w-[175px] line-clamp-2">
                Jadwal, lokasi, peserta, dan dokumentasi kegiatan.
              </p>
            </div>

            <div className="mt-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#5E35B1] shadow-xs group-hover:translate-x-0.5 transition-transform duration-150">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* ================= LIVE RINGKASAN SATU DATA PANAIKANG ================= */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0D3868]">
                Ringkasan Satu Data Lingkungan Kelurahan Panaikang
              </h3>
              <p className="text-xs text-slate-600">
                Data terintegrasi dari laporan warga RW 01 – RW 06, Bank Sampah Unit, dan agenda
                Sabtu Bersih
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('rtrw')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-[#0D3868] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#1C8237]" />
                <span>
                  Data RT & RW ({rwGroups.length || 6} RW / {totalRtCount || 30} RT)
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('profil')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-[#0D3868] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Profil Kelurahan & Visi Misi</span>
              </button>
              <button
                type="button"
                onClick={onQuickReportClick}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C8237] hover:bg-[#15652B] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                <span>+ Buat Laporan Lingkungan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('lurah')}
              className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Laporan Selesai</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
                {completedReports} / {reports.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Tingkat penyelesaian{' '}
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {Math.round((completedReports / Math.max(reports.length, 1)) * 100)}%
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('peta')}
              className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Titik Aktif Dipantau</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
                {activeReports} Titik
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Terpetakan di Peta Digital Panaikang
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sampah')}
              className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Sampah Terkelola BSU</span>
                <Recycle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
                {(totalRecycledKg / 1000).toFixed(2)} Ton
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Organik & Daur Ulang ({wasteUnits.length} BSU RW)
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('kerjabakti')}
              className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Agenda Kerja Bakti</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
                {upcomingCleanups} Jadwal
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Gotong royong warga & Satgas
              </div>
            </button>
          </div>
        </div>

        {/* ================= JADWAL & DOKUMENTASI FOTO KERJA BAKTI DI HALAMAN UTAMA ================= */}
        <div className="mt-10 pt-8 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5E35B1]">
                <Calendar className="w-4 h-4" />
                <span>AGENDA TERJADWAL & DOKUMENTASI KERJA BAKTI SELESAI</span>
              </div>
              <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-[#0D3868] tracking-tight">
                Monitoring Kerja Bakti Kelurahan Panaikang
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Pemisahan antara kerja bakti yang masih terjadwal (tanpa foto) dan kerja bakti yang
                telah selesai dilaksanakan beserta lampiran foto dokumentasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('kerjabakti')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Buka Menu Kerja Bakti Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: Kerja Bakti yang Masih Terjadwal (Tanpa Foto) */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#5E35B1] uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>Kerja Bakti Terjadwal ({scheduledCleanups.length})</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Tanpa Foto</span>
                </div>

                <div className="mt-3 space-y-3">
                  {scheduledCleanups.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">
                      Belum ada jadwal kerja bakti yang akan datang.
                    </div>
                  ) : (
                    scheduledCleanups.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onNavigate('kerjabakti')}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                          <span className="font-bold text-[#5E35B1]">
                            {ev.rw} · {ev.rtScope}
                          </span>
                          <span className="font-mono-num font-semibold text-amber-700">
                            Terjadwal: {ev.date}
                          </span>
                        </div>
                        <div className="mt-1 text-xs sm:text-sm font-bold text-[#0D3868] line-clamp-2">
                          {ev.title}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate">{ev.locationName}</span>
                          <span className="font-mono-num font-semibold text-slate-700 shrink-0 ml-2">
                            {ev.registeredParticipants}/{ev.targetParticipants} peserta
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('kerjabakti')}
                className="mt-4 w-full py-2 px-3 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-bold text-[#5E35B1] transition-colors cursor-pointer"
              >
                Lihat Jadwal & Daftar Hadir Warga →
              </button>
            </div>

            {/* Right 7 Cols: Kerja Bakti yang Telah Selesai Dilaksanakan (Dengan Foto) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#1C8237] uppercase tracking-wider">
                  <Camera className="w-4 h-4" />
                  <span>
                    Kerja Bakti Telah Dilaksanakan & Lampiran Foto ({completedCleanups.length})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Selesai Dilaksanakan
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {completedCleanups.slice(0, 3).map((ev) => {
                  const photos =
                    Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
                      ? ev.documentationPhotos.filter(Boolean)
                      : ev.imageUrl
                      ? [ev.imageUrl]
                      : [];
                  const mainPhoto = photos[0] || ev.imageUrl;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onNavigate('kerjabakti')}
                      className="group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                          {mainPhoto && (
                            <img
                              src={resolveImageUrl(mainPhoto)}
                              alt={ev.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-150"
                            />
                          )}
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-bold">
                            {photos.length} Foto
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-[10px] font-bold text-[#1C8237] font-mono-num">
                            {ev.rw} · {ev.date}
                          </div>
                          <h4 className="mt-0.5 text-xs font-bold text-[#0D3868] line-clamp-2">
                            {ev.title}
                          </h4>
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                        <span>Tuntas</span>
                        <span className="font-mono-num font-bold text-emerald-700">
                          {ev.collectedWasteKg} kg terangkat
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= INFORMASI SEPUTAR KELURAHAN PANAIKANG & INSTAGRAM @kelurahan.panaikang ================= */}
        <div className="mt-12 pt-8 border-t border-slate-200/80">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C8237]">
                <Newspaper className="w-4 h-4" />
                <span>PUBLIKASI RESMI & FEED INSTAGRAM KELURAHAN</span>
              </div>
              <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
                Informasi Seputar Kelurahan Panaikang
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
                Terhubung langsung dengan postingan Instagram resmi{' '}
                <span className="font-bold text-[#0D3868]">@kelurahan.panaikang</span> serta
                publikasi Lurah dan Operator Kelurahan Panaikang.
              </p>
            </div>

            {/* Filter Segmented Control */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
              <button
                type="button"
                onClick={() => setInfoFilter('semua')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  infoFilter === 'semua'
                    ? 'bg-[#0D3868] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Feed ({activeInfos.length})
              </button>
              <button
                type="button"
                onClick={() => setInfoFilter('ig')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  infoFilter === 'ig'
                    ? 'bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Postingan @kelurahan.panaikang</span>
              </button>
              <button
                type="button"
                onClick={() => setInfoFilter('pengumuman')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  infoFilter === 'pengumuman'
                    ? 'bg-[#1C8237] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengumuman
              </button>
            </div>
          </div>

          {/* Connected Official Instagram Profile Header Card (@kelurahan.panaikang) */}
          <div className="mb-7 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-rose-50/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Instagram Story Ring around Official @kelurahan.panaikang Profile Picture */}
              <a
                href="https://www.instagram.com/kelurahan.panaikang/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-700 shrink-0 hover:scale-105 transition-transform"
                title="Buka Instagram @kelurahan.panaikang"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden">
                  <img
                    src={resolveImageUrl(IG_PROFILE_PANAIKANG)}
                    alt="Foto Profil Resmi @kelurahan.panaikang"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const proxyUrl = getInstagramProxyUrl(IG_PROFILE_PANAIKANG);
                      if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                        e.currentTarget.dataset.proxyTried = '1';
                        e.currentTarget.src = proxyUrl;
                        return;
                      }
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = resolveImageUrl(HERO_IMAGE_PATH);
                    }}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </a>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://www.instagram.com/kelurahan.panaikang/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#E1306C] transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-[#E1306C]" />
                    <span>@kelurahan.panaikang</span>
                  </a>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kelurahan panaikang · Layanan Publik & Pemerintah</span>
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-600">
                  Akun Resmi Pemerintah Kelurahan Panaikang · Kecamatan Panakkukang, Kota Makassar
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>
                    <strong className="font-mono-num text-slate-800">206</strong> kiriman (
                    <strong className="font-mono-num text-slate-800">{activeInfos.length}</strong>{' '}
                    tampil)
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-mono-num text-slate-800">638</strong> pengikut
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-mono-num text-slate-800">174</strong> diikuti
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-semibold">{igSyncStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
              <button
                type="button"
                onClick={() => setIgEmbedMode((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  igEmbedMode
                    ? 'border-[#E1306C] bg-rose-50 text-[#E1306C]'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                <span>
                  {igEmbedMode ? 'Tampilan Foto Cepat' : 'Tampilan Embed Interaktif IG'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSyncInstagramFeed}
                disabled={isSyncingIg}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#E1306C] ${isSyncingIg ? 'animate-spin' : ''}`} />
                <span>{isSyncingIg ? 'Menyinkronkan...' : 'Sinkronkan Feed IG'}</span>
              </button>

              <a
                href="https://www.instagram.com/kelurahan.panaikang/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-opacity"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Kunjungi @kelurahan.panaikang</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Galeri Grid Visual Feed Instagram @kelurahan.panaikang */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                <Instagram className="w-4 h-4 text-[#E1306C]" />
                <span>Feed Galeri Postingan Instagram @kelurahan.panaikang ({activeInfos.length} Postingan)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Klik foto untuk melihat detail postingan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {activeInfos.map((post) => {
                const postLikes =
                  (post.instagramLikes ?? 47) + (localLikesOffset[post.id] || 0);
                const postComments = post.instagramCommentsCount ?? 7;
                return (
                  <button
                    key={`grid-${post.id}`}
                    type="button"
                    onClick={() => {
                      setModalShowEmbed(false);
                      setSelectedInfo(post);
                    }}
                    className="group relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer focus:outline-none"
                  >
                    <img
                      src={resolveImageUrl(post.imageUrl, post.instagramPostUrl)}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const proxyUrl = getInstagramProxyUrl(
                          post.imageUrl,
                          post.instagramPostUrl
                        );
                        if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                          e.currentTarget.dataset.proxyTried = '1';
                          e.currentTarget.src = proxyUrl;
                          return;
                        }
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = resolveImageUrl(HERO_IMAGE_PATH);
                      }}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-150"
                    />
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 text-white flex items-center justify-center">
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center p-2 text-white text-center">
                      <div className="flex items-center gap-3 text-xs font-bold font-mono-num">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          {postLikes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          {postComments}
                        </span>
                      </div>
                      <span className="mt-1.5 text-[10px] font-medium line-clamp-3 text-slate-100">
                        {post.content}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredInfos.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              Belum ada publikasi informasi atau postingan Instagram pada kategori ini. Lurah atau
              Operator dapat menambahkan melalui Panel Administrator.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfos.map((info) => {
                const isLiked = !!likedPosts[info.id];
                const likeCount = (info.instagramLikes ?? 47) + (localLikesOffset[info.id] || 0);
                const commentCount = info.instagramCommentsCount ?? 7;
                const handle = info.instagramHandle || '@kelurahan.panaikang';
                const postUrl =
                  info.instagramPostUrl || 'https://www.instagram.com/kelurahan.panaikang/';
                const tags =
                  info.hashtags && info.hashtags.length > 0
                    ? info.hashtags
                    : ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KotaMakassar'];
                const resolvedImg = resolveImageUrl(info.imageUrl, info.instagramPostUrl);
                const embedUrl = getInstagramEmbedUrl(info.imageUrl, info.instagramPostUrl);
                const showLiveEmbed =
                  Boolean(embedUrl) && (igEmbedMode || Boolean(embedFallbackPosts[info.id]));

                return (
                  <article
                    key={info.id}
                    onClick={() => {
                      setModalShowEmbed(false);
                      setSelectedInfo(info);
                    }}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 shadow-xs transition-all cursor-pointer"
                  >
                    <div>
                      {/* Instagram Post Header Bar */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-700 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden">
                              <img
                                src={resolveImageUrl(IG_PROFILE_PANAIKANG)}
                                alt={handle}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const proxyUrl = getInstagramProxyUrl(IG_PROFILE_PANAIKANG);
                                  if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                                    e.currentTarget.dataset.proxyTried = '1';
                                    e.currentTarget.src = proxyUrl;
                                    return;
                                  }
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = resolveImageUrl(HERO_IMAGE_PATH);
                                }}
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 truncate">
                              <span>{handle.replace(/^@/, '')}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              Kelurahan Panaikang · {info.publishedAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {embedUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmbedFallbackPosts((prev) => ({
                                  ...prev,
                                  [info.id]: !showLiveEmbed,
                                }));
                              }}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-[#E1306C] border border-rose-200 transition-colors cursor-pointer"
                              title="Alihkan antara Gambar Visual dan Embed Interaktif Instagram"
                            >
                              {showLiveEmbed ? 'Mode Foto' : 'Embed IG'}
                            </button>
                          )}
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Lihat di Instagram ${handle}`}
                            className="p-1.5 rounded-lg text-[#E1306C] hover:bg-rose-50 transition-colors shrink-0"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* Post Visual Content — Supports both Serverless Image Proxy AND Live Official Instagram Embed */}
                      {showLiveEmbed && embedUrl ? (
                        <div
                          className="relative h-96 sm:h-[430px] w-full overflow-hidden bg-white border-b border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <iframe
                            src={embedUrl}
                            title={info.title}
                            className="w-full h-full border-0"
                            loading="lazy"
                            allow="encrypted-media; picture-in-picture"
                          />
                        </div>
                      ) : (
                        <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                          <img
                            src={resolvedImg}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const proxyUrl = getInstagramProxyUrl(
                                info.imageUrl,
                                info.instagramPostUrl
                              );
                              if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                                e.currentTarget.dataset.proxyTried = '1';
                                e.currentTarget.src = proxyUrl;
                              }
                            }}
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-45 scale-110"
                          />
                          <img
                            src={resolvedImg}
                            alt={info.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const proxyUrl = getInstagramProxyUrl(
                                info.imageUrl,
                                info.instagramPostUrl
                              );
                              if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                                e.currentTarget.dataset.proxyTried = '1';
                                e.currentTarget.src = proxyUrl;
                                return;
                              }
                              if (embedUrl) {
                                setEmbedFallbackPosts((prev) => ({ ...prev, [info.id]: true }));
                              }
                            }}
                            className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-150"
                          />
                        </div>
                      )}

                      {/* Instagram Interaction & Exact Caption Area */}
                      <div className="p-4 sm:p-5">
                        {/* Action Row: Like, Comment, Published Date */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => handleToggleLike(e, info)}
                              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                isLiked
                                  ? 'text-rose-600'
                                  : 'text-slate-700 hover:text-rose-600'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isLiked ? 'fill-rose-600 text-rose-600' : ''
                                }`}
                              />
                              <span className="font-mono-num">{likeCount} suka</span>
                            </button>

                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <MessageCircle className="w-4 h-4 text-slate-500" />
                              <span className="font-mono-num">{commentCount}</span>
                            </span>
                          </div>

                          <div className="text-xs text-slate-500">
                            <span className="font-mono-num">{info.publishedAt}</span>
                          </div>
                        </div>

                        {/* Exact Instagram Caption */}
                        <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line line-clamp-5">
                          <span className="font-extrabold text-slate-900 mr-1.5">
                            {handle.replace(/^@/, '')}
                          </span>
                          {info.content}
                        </p>

                        {/* Hashtags line (unboxed text, zero-pill discipline) */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#0277BD]">
                          {tags.map((tag) => (
                            <span key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <span className="text-[#0277BD] inline-flex items-center gap-1">
                        <span>Lihat Caption & Gambar Penuh</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
                      </span>

                      <a
                        href={postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#E1306C] hover:underline"
                      >
                        <span>Buka IG</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal Detail Informasi & Postingan Instagram @kelurahan.panaikang */}
      {selectedInfo && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedInfo(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Instagram Header in Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-700">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden">
                    <img
                      src={resolveImageUrl(IG_PROFILE_PANAIKANG)}
                      alt="@kelurahan.panaikang"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = resolveImageUrl(HERO_IMAGE_PATH);
                      }}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    <span>{selectedInfo.instagramHandle || '@kelurahan.panaikang'}</span>
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xs text-slate-500">
                    Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getInstagramEmbedUrl(selectedInfo.imageUrl, selectedInfo.instagramPostUrl) && (
                  <button
                    type="button"
                    onClick={() => setModalShowEmbed((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-[#E1306C] cursor-pointer"
                  >
                    {modalShowEmbed ? 'Lihat Gambar Penuh' : 'Putar Embed Asli IG'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInfo(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                  aria-label="Tutup detail informasi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {(() => {
              const modalEmbedUrl = getInstagramEmbedUrl(
                selectedInfo.imageUrl,
                selectedInfo.instagramPostUrl
              );
              const showModalIframe =
                Boolean(modalEmbedUrl) &&
                (modalShowEmbed || Boolean(embedFallbackPosts[selectedInfo.id]));

              if (showModalIframe && modalEmbedUrl) {
                return (
                  <div className="relative h-[480px] sm:h-[560px] w-full bg-white border-b border-slate-100">
                    <iframe
                      src={modalEmbedUrl}
                      title={selectedInfo.title}
                      className="w-full h-full border-0"
                      allow="encrypted-media; picture-in-picture"
                    />
                  </div>
                );
              }

              const modalResolvedImg = resolveImageUrl(
                selectedInfo.imageUrl,
                selectedInfo.instagramPostUrl
              );

              return (
                <div className="relative h-80 sm:h-[440px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={modalResolvedImg}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-45 scale-110"
                  />
                  <img
                    src={modalResolvedImg}
                    alt={selectedInfo.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const proxyUrl = getInstagramProxyUrl(
                        selectedInfo.imageUrl,
                        selectedInfo.instagramPostUrl
                      );
                      if (proxyUrl && e.currentTarget.dataset.proxyTried !== '1') {
                        e.currentTarget.dataset.proxyTried = '1';
                        e.currentTarget.src = proxyUrl;
                        return;
                      }
                      if (modalEmbedUrl) {
                        setModalShowEmbed(true);
                      }
                    }}
                    className="relative z-10 max-h-full max-w-full object-contain"
                  />
                </div>
              );
            })()}

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#1C8237]">{selectedInfo.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{selectedInfo.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>Oleh: {selectedInfo.author}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleToggleLike(e, selectedInfo)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    likedPosts[selectedInfo.id] ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedPosts[selectedInfo.id] ? 'fill-rose-600 text-rose-600' : ''
                    }`}
                  />
                  <span className="font-mono-num">
                    {(selectedInfo.instagramLikes ?? 142) +
                      (localLikesOffset[selectedInfo.id] || 0)}{' '}
                    suka di Instagram
                  </span>
                </button>
              </div>

              <h3 className="mt-4 text-xl sm:text-2xl font-extrabold text-[#0D3868] leading-snug">
                {selectedInfo.title}
              </h3>

              <div className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedInfo.content}
              </div>

              {selectedInfo.hashtags && selectedInfo.hashtags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0277BD]">
                  {selectedInfo.hashtags.map((tag) => (
                    <span key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={
                    selectedInfo.instagramPostUrl ||
                    'https://www.instagram.com/kelurahan.panaikang/'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-xs sm:text-sm font-bold"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Lihat Postingan di Instagram @kelurahan.panaikang</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedInfo(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Tutup Informasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIGNATURE WAVE FOOTER MATCHING PROTOTYPE ================= */}
      <footer className="relative w-full pt-12 sm:pt-16 overflow-hidden select-none">
        {/* Decorative Botanical Green Plant Sprouting on Left Side (matches prototype) */}
        <div className="pointer-events-none absolute left-4 sm:left-12 bottom-20 sm:bottom-24 z-20">
          <svg
            viewBox="0 0 180 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-28 h-24 sm:w-40 sm:h-36"
          >
            {/* Left Leaf */}
            <path
              d="M75 135C45 120 15 95 10 55C45 55 75 85 78 135"
              fill="url(#plantLeaf1)"
            />
            <path
              d="M76 133C55 105 35 80 15 60"
              stroke="#DCFCE7"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Center Tall Leaf */}
            <path
              d="M82 140C75 95 95 45 135 20C140 65 115 110 82 140Z"
              fill="url(#plantLeaf2)"
            />
            <path
              d="M82 138C95 100 112 62 130 26"
              stroke="#DCFCE7"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Right Lower Leaf */}
            <path
              d="M86 142C110 115 142 100 172 105C152 135 120 145 86 142Z"
              fill="url(#plantLeaf3)"
            />
            <defs>
              <linearGradient id="plantLeaf1" x1="10" y1="55" x2="78" y2="135" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ADE80" />
                <stop offset="1" stopColor="#15803D" />
              </linearGradient>
              <linearGradient id="plantLeaf2" x1="135" y1="20" x2="82" y2="140" gradientUnits="userSpaceOnUse">
                <stop stopColor="#86EFAC" />
                <stop offset="0.5" stopColor="#22C55E" />
                <stop offset="1" stopColor="#166534" />
              </linearGradient>
              <linearGradient id="plantLeaf3" x1="172" y1="105" x2="86" y2="142" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ADE80" />
                <stop offset="1" stopColor="#14532D" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Multi-layered Curved Green & Deep Navy Wave SVG */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 1440 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-24 sm:h-36 lg:h-44 block preserve-3d"
            preserveAspectRatio="none"
          >
            {/* Soft Mint Back Wave */}
            <path
              d="M0 140C320 210 720 190 1120 90C1260 55 1370 30 1440 20V220H0V140Z"
              fill="#BBF7D0"
              opacity="0.7"
            />
            {/* Vibrant Green Mid Wave */}
            <path
              d="M0 95C280 120 560 195 940 155C1160 130 1320 85 1440 60V220H0V95Z"
              fill="#2E7D32"
            />
            {/* Deep Navy Foreground Wave */}
            <path
              d="M0 135C340 135 640 195 1020 130C1210 95 1350 65 1440 50V220H0V135Z"
              fill="#073763"
            />
          </svg>

          {/* Footer Content Bar on Deep Navy Canvas */}
          <div className="bg-[#073763] text-white px-6 sm:px-12 pb-8 pt-2">
            <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              {/* Bottom Left: Pin Icon + Kelurahan Panaikang Kota Makassar */}
              <div className="flex items-center gap-3.5">
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#073763] shadow-md shrink-0">
                  <MapPin className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-base sm:text-xl font-bold tracking-tight text-white leading-snug">
                    Kelurahan <span className="font-extrabold">Panaikang</span>
                  </div>
                  <div className="text-sm sm:text-lg font-medium text-sky-100 leading-snug">
                    Kota Makassar
                  </div>
                </div>
              </div>

              {/* Bottom Right: Tilted Brush Script "Panaikang Lebih Bersih Lebih Maju" */}
              <div className="self-end sm:self-auto text-right transform -rotate-6 pr-2">
                <div className="font-script text-2xl sm:text-4xl font-bold text-white leading-[1.05] tracking-wide drop-shadow-xs">
                  <div>Panaikang</div>
                  <div>Lebih Bersih</div>
                  <div>Lebih Maju</div>
                </div>
                {/* Brush Swoosh Underline */}
                <svg
                  viewBox="0 0 180 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-36 sm:w-48 h-4 ml-auto mt-0.5"
                >
                  <path
                    d="M4 14C55 6 115 4 176 8"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
