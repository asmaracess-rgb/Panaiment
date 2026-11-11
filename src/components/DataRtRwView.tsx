import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Search,
  Building2,
  Home,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Shield,
  ShieldCheck,
  Clock,
  Calendar,
  Printer,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { RwGroup, AppView, SiskamlingRwSchedule, SiskamlingDay, KelurahanProfile } from '../types';
import {
  INITIAL_SISKAMLING_SCHEDULES,
  SISKAMLING_DAYS,
  getTodaySiskamlingDay,
} from '../data/siskamlingData';
import {
  BaganStrukturRtRwModal,
  BaganStrukturRtRwInteractiveViewer,
} from './BaganStrukturRtRwModal';
import { RestrictedAccessModal } from './RestrictedAccessModal';

interface DataRtRwViewProps {
  rwGroups: RwGroup[];
  profile?: KelurahanProfile;
  siskamlingSchedules?: SiskamlingRwSchedule[];
  onNavigate: (view: AppView) => void;
  allowedSubItems?: string[];
}

const toOfficerArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'name' in item) {
          return String((item as any).name || '').trim();
        }
        return String(item || '').trim();
      })
      .filter(Boolean);
  }
  if (typeof val === 'string') {
    return [val.trim()].filter(Boolean);
  }
  return [];
};

export const DataRtRwView: React.FC<DataRtRwViewProps> = ({
  rwGroups,
  profile,
  siskamlingSchedules = INITIAL_SISKAMLING_SCHEDULES,
  onNavigate,
  allowedSubItems,
}) => {
  const isAllowed = (subKey: string) => !allowedSubItems || allowedSubItems.includes(subKey);
  const [restrictedModal, setRestrictedModal] = useState<{ isOpen: boolean; title: string } | null>(null);

  const handleSubItemClick = (subKey: string, title: string, allowedAction: () => void) => {
    if (isAllowed(subKey)) {
      allowedAction();
    } else {
      setRestrictedModal({ isOpen: true, title });
    }
  };

  const [activeTab, setActiveTab] = useState<'rtrw' | 'siskamling'>('rtrw');
  const [selectedRwCode, setSelectedRwCode] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRwIds, setExpandedRwIds] = useState<Record<string, boolean>>({});
  const [showBaganRtRw, setShowBaganRtRw] = useState<boolean>(false);
  const [showInlineRtRwChart, setShowInlineRtRwChart] = useState<boolean>(false);

  // Siskamling specific state
  const [selectedDay, setSelectedDay] = useState<SiskamlingDay>(() => getTodaySiskamlingDay());
  const [selectedSiskamlingRw, setSelectedSiskamlingRw] = useState<string>('Semua');
  const [siskamlingSearch, setSiskamlingSearch] = useState<string>('');
  const [showWeeklyMatrixModal, setShowWeeklyMatrixModal] = useState<boolean>(false);
  const [expandedSiskamlingRw, setExpandedSiskamlingRw] = useState<Record<string, boolean>>({});

  const todayDay = useMemo(() => getTodaySiskamlingDay(), []);

  const currentSchedules = useMemo(() => {
    const rawList =
      Array.isArray(siskamlingSchedules) && siskamlingSchedules.length > 0
        ? siskamlingSchedules
        : INITIAL_SISKAMLING_SCHEDULES;

    return rawList.map((item, idx) => {
      const schedulesObj =
        item && typeof item === 'object' && item.schedules && typeof item.schedules === 'object'
          ? item.schedules
          : ({} as Record<SiskamlingDay, string[]>);
      return {
        ...item,
        rw: item?.rw || `RW ${idx + 1}`,
        rwName: '',
        poskoLocation: (item?.poskoLocation || '')
          .replace(/kawasan\s+/gi, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim(),
        notes: (item?.notes || '').replace(/kawasan\s+/gi, ''),
        schedules: {
          Senin: toOfficerArray(schedulesObj?.Senin),
          Selasa: toOfficerArray(schedulesObj?.Selasa),
          Rabu: toOfficerArray(schedulesObj?.Rabu),
          Kamis: toOfficerArray(schedulesObj?.Kamis),
          Jumat: toOfficerArray(schedulesObj?.Jumat),
          Sabtu: toOfficerArray(schedulesObj?.Sabtu),
          Minggu:
            toOfficerArray(schedulesObj?.Minggu).length > 0
              ? toOfficerArray(schedulesObj?.Minggu)
              : [`SELURUH RT/RW 00${idx + 1}`],
        },
      };
    });
  }, [siskamlingSchedules]);

  const toggleRwDetail = (rwId: string) => {
    setExpandedRwIds((prev) => ({
      ...prev,
      [rwId]: !prev[rwId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    (rwGroups || []).forEach((rw) => {
      if (rw?.id) all[rw.id] = true;
    });
    setExpandedRwIds(all);
  };

  const collapseAll = () => {
    setExpandedRwIds({});
  };

  const toggleSiskamlingDetail = (rwKey: string) => {
    setExpandedSiskamlingRw((prev) => ({
      ...prev,
      [rwKey]: !prev[rwKey],
    }));
  };

  const totalRwCount = rwGroups?.length || 0;
  const totalRtCount = (rwGroups || []).reduce((acc, rw) => acc + (rw?.rtList?.length || 0), 0);
  const totalHouseholds = (rwGroups || []).reduce(
    (acc, rw) =>
      acc + (rw?.rtList || []).reduce((sum, rt) => sum + (Number(rt?.householdsCount) || 0), 0),
    0
  );

  const totalOfficersToday = useMemo(() => {
    return currentSchedules.reduce((acc, item) => {
      const list = item?.schedules?.[selectedDay];
      return acc + (Array.isArray(list) ? list.length : 0);
    }, 0);
  }, [currentSchedules, selectedDay]);

  const filteredRwGroups = (rwGroups || [])
    .filter((rw) => rw && (selectedRwCode === 'Semua' || rw.rwCode === selectedRwCode))
    .map((rw) => {
      if (!searchQuery.trim()) return rw;
      const q = searchQuery.toLowerCase();
      const rwMatches =
        (rw.rwCode || '').toLowerCase().includes(q) ||
        (rw.rwName || '').toLowerCase().includes(q) ||
        (rw.ketuaRwName || '').toLowerCase().includes(q) ||
        (rw.areaDescription || '').toLowerCase().includes(q);
      if (rwMatches) return rw;
      const matchingRts = (rw.rtList || []).filter(
        (rt) =>
          rt &&
          ((rt.rtCode || '').toLowerCase().includes(q) ||
            (rt.rtName || '').toLowerCase().includes(q) ||
            (rt.ketuaRtName || '').toLowerCase().includes(q) ||
            (rt.areaDescription || '').toLowerCase().includes(q))
      );
      if (matchingRts.length > 0) {
        return { ...rw, rtList: matchingRts };
      }
      return null;
    })
    .filter((item): item is RwGroup => item !== null);

  const filteredSiskamling = useMemo(() => {
    return currentSchedules.filter((item) => {
      if (!item || !item.rw) return false;
      const matchRw =
        selectedSiskamlingRw === 'Semua' ||
        item.rw.toLowerCase() === selectedSiskamlingRw.toLowerCase() ||
        item.rw.replace(/\s+/g, '').toLowerCase() ===
          selectedSiskamlingRw.replace(/\s+/g, '').toLowerCase() ||
        item.rw.replace('RW ', 'RW 0').toLowerCase() === selectedSiskamlingRw.toLowerCase();

      if (!matchRw) return false;

      if (!siskamlingSearch.trim()) return true;
      const q = siskamlingSearch.toLowerCase();
      const matchPosko = (item.poskoLocation || '').toLowerCase().includes(q);
      const matchRwName = (item.rwName || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const officers = item?.schedules?.[selectedDay] || [];
      const matchOfficers = officers.some((name) => (name || '').toLowerCase().includes(q));

      return matchPosko || matchRwName || matchNotes || matchOfficers;
    });
  }, [currentSchedules, selectedSiskamlingRw, siskamlingSearch, selectedDay]);

  const handleOpenSiskamlingForRw = (rwCode: string) => {
    setActiveTab('siskamling');
    setSelectedSiskamlingRw(rwCode);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D3868] hover:text-[#0277BD] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Data RT & RW Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Direktori resmi Rukun Warga (RW 01 s/d RW 07), Rukun Tetangga (RT), dan Jadwal Posko Siskamling Lingkungan.
          </p>
        </div>

        {/* Action Buttons: Bagan Struktur RT/RW, Profil Kelurahan, Peta Wilayah RT RW, Jadwal Siskamling RT RW */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start">
          <button
            type="button"
            onClick={() =>
              handleSubItemClick('rtrw_bagan_struktur', 'Bagan Struktur Organisasi RT/RW', () =>
                setShowBaganRtRw(true)
              )
            }
            className="px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs inline-flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Bagan Struktur Organisasi RT/RW</span>
            {!isAllowed('rtrw_bagan_struktur') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.75} />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profil')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            Profil Kelurahan
          </button>

          <button
            type="button"
            onClick={() => onNavigate('peta')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            Peta Wilayah RT RW
          </button>

          <button
            type="button"
            onClick={() =>
              handleSubItemClick('rtrw_jadwal_siskamling', 'Jadwal Siskamling RT RW', () =>
                setActiveTab(activeTab === 'siskamling' ? 'rtrw' : 'siskamling')
              )
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
              activeTab === 'siskamling'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300 font-extrabold'
                : 'bg-[#0D3868] hover:bg-[#072647] text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Jadwal Siskamling RT RW</span>
            {!isAllowed('rtrw_jadwal_siskamling') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mt-6 flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() =>
            handleSubItemClick('rtrw_direktori_rw', 'Direktori RT & RW', () =>
              setActiveTab('rtrw')
            )
          }
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rtrw'
              ? 'border-[#0D3868] text-[#0D3868]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="inline-flex items-center gap-1.5">
            <span>Direktori RT &amp; RW ({totalRwCount} RW · {totalRtCount} RT)</span>
            {!isAllowed('rtrw_direktori_rw') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSubItemClick('rtrw_jadwal_siskamling', 'Jadwal Siskamling RT RW', () =>
              setActiveTab('siskamling')
            )
          }
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'siskamling'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span className="inline-flex items-center gap-1.5">
            <span>Jadwal Siskamling RT RW (7 Posko RW)</span>
            {!isAllowed('rtrw_jadwal_siskamling') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
          </span>
          <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-full">
            Hari Ini: {todayDay}
          </span>
        </button>
      </div>

      {/* TAB 1: DIREKTORI DATA RT & RW */}
      {activeTab === 'rtrw' && (
        <div className="animate-fadeIn">
          {/* Summary KPI Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Rukun Warga (RW)</div>
                <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0D3868] font-mono-num">
                  {totalRwCount} Wilayah RW
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Terdata aktif di Kelurahan Panaikang</div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0277BD]">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Rukun Tetangga (RT)</div>
                <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1C8237] font-mono-num">
                  {totalRtCount} Unit RT
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Terbagi ke dalam masing-masing wilayah RW
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1C8237]">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Kepala Keluarga (KK)</div>
                <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
                  {totalHouseholds.toLocaleString('id-ID')} KK
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Cakupan warga seluruh RT & RW</div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Home className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Bagan Struktur RT/RW Card (Responsif HP, Tablet, PC) */}
          <div className="mt-6 bg-white rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C8237]">
                  <Layers className="w-4 h-4" />
                  <span>BAGAN STRUKTUR ORGANISASI RT/RW & LPM (RESPONSIF HP · TABLET · PC)</span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#0D3868] mt-0.5 flex items-center gap-2">
                  <span>Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang</span>
                  {!isAllowed('rtrw_bagan_struktur') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold">
                      <Lock className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                      <span>Perlu Login</span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Dilengkapi fitur <strong>Perkecil (-)</strong>, <strong>Perbesar (+)</strong>, dan{' '}
                  <strong>Pas Layar</strong> otomatis untuk pengguna HP, Tablet, maupun PC.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleSubItemClick(
                      'rtrw_bagan_struktur',
                      'Bagan Struktur Organisasi RT/RW',
                      () => setShowInlineRtRwChart((prev) => !prev)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#146329] text-xs font-bold transition cursor-pointer"
                >
                  <span>
                    {isAllowed('rtrw_bagan_struktur') && showInlineRtRwChart
                      ? 'Sembunyikan Pratinjau'
                      : 'Tampilkan Bagan di Halaman Ini'}
                  </span>
                  {!isAllowed('rtrw_bagan_struktur') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSubItemClick(
                      'rtrw_bagan_struktur',
                      'Bagan Struktur Organisasi RT/RW',
                      () => setShowBaganRtRw(true)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <span>Buka Layar Penuh</span>
                  {!isAllowed('rtrw_bagan_struktur') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {isAllowed('rtrw_bagan_struktur') && showInlineRtRwChart && (
              <div className="pt-2 border-t border-slate-100">
                <BaganStrukturRtRwInteractiveViewer
                  rwGroups={rwGroups}
                  profile={profile}
                  onExpandFullScreen={() => setShowBaganRtRw(true)}
                />
              </div>
            )}
          </div>

          {/* Filter RW & Search Bar */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRwCode('Semua')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedRwCode === 'Semua'
                    ? 'bg-[#0D3868] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua RW ({rwGroups.length})
              </button>
              {rwGroups.map((rw, rwIdx) => (
                <button
                  key={`rw-filter-${rw.id || rw.rwCode || rwIdx}`}
                  type="button"
                  onClick={() => setSelectedRwCode(rw.rwCode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedRwCode === rw.rwCode
                      ? 'bg-[#1C8237] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {rw.rwCode} ({rw.rtList?.length || 0} RT)
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nama RW, Nama RT, Ketua, atau jalan..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0D3868] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                  title="Buka semua daftar RT di seluruh RW"
                >
                  Buka Semua RT
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                  title="Tutup semua daftar RT agar ringkas"
                >
                  Tutup Semua RT
                </button>
              </div>
            </div>
          </div>

          {/* RW List Cards */}
          <div className="mt-4 space-y-2.5">
            {filteredRwGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Data RW atau RT yang dicari tidak ditemukan.
              </div>
            ) : (
              filteredRwGroups.map((rw, rwIdx) => {
                const isExpanded = !!expandedRwIds[rw.id];
                const rwHouseholds = (rw.rtList || []).reduce(
                  (sum, rt) => sum + (Number(rt.householdsCount) || 0),
                  0
                );
                const rtCount = rw.rtList?.length || 0;

                return (
                  <section
                    key={`rw-sec-${rw.id || rw.rwCode || rwIdx}`}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-[#0277BD]/60 transition-all"
                  >
                    {/* Compact RW Bilah / Bar Header */}
                    <div className="bg-gradient-to-r from-[#0D3868] via-[#0E417A] to-[#0277BD] px-3.5 sm:px-4 py-2.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[11px] font-black tracking-wider uppercase font-mono-num">
                            {rw.rwCode}
                          </span>
                          <span className="text-[11px] font-semibold text-sky-100 flex items-center gap-1">
                            <span>{rtCount} RT</span>
                            <span aria-hidden="true" className="text-white/40">·</span>
                            <span className="font-mono-num font-bold text-emerald-200">
                              {rwHouseholds.toLocaleString('id-ID')} KK
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenSiskamlingForRw(rw.rwCode)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 transition cursor-pointer"
                            title="Buka Jadwal Siskamling RW ini"
                          >
                            <ShieldCheck className="w-3 h-3 text-amber-300" />
                            <span>Siskamling</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
                            {rw.rwName}
                          </h2>
                          {rw.areaDescription && (
                            <p className="text-[11px] text-sky-100/80 truncate max-w-md hidden md:inline">
                              · {rw.areaDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
                        {/* Ketua RW Compact Info */}
                        <div className="text-left sm:text-right text-[11px]">
                          <span className="text-[10px] uppercase font-bold text-sky-200/90 block leading-tight">
                            Ketua {rw.rwCode}
                          </span>
                          <span className="font-extrabold text-white text-xs block leading-tight truncate max-w-[150px]">
                            {rw.ketuaRwName}
                          </span>
                          {rw.phone && (
                            <span className="text-[10px] font-mono-num text-emerald-300 block leading-tight">
                              {rw.phone}
                            </span>
                          )}
                        </div>

                        {/* Tombol Lihat Detail RT */}
                        <button
                          type="button"
                          onClick={() => toggleRwDetail(rw.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                            isExpanded
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-1 ring-white/50'
                              : 'bg-white/95 hover:bg-white text-[#0D3868]'
                          }`}
                          aria-expanded={isExpanded}
                        >
                          <Layers className="w-3 h-3 text-[#0277BD]" />
                          <span>{isExpanded ? 'Tutup' : `Detail (${rtCount} RT)`}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* RT Division List under this RW */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 bg-slate-50/70 border-t border-slate-200 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-200">
                          <h3 className="text-[11px] sm:text-xs font-extrabold text-[#0D3868] uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1C8237]" />
                            <span>Daftar {rtCount} Rukun Tetangga (RT) di Wilayah {rw.rwCode}</span>
                          </h3>
                          <span className="text-[11px] font-mono-num font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Total {rwHouseholds} KK
                          </span>
                        </div>

                        {!rw.rtList || rw.rtList.length === 0 ? (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 text-center">
                            Belum ada data RT pada {rw.rwCode}.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                            {rw.rtList.map((rt, rtIdx) => (
                              <div
                                key={`rt-card-${rw.id || rw.rwCode}-${rt.id || rt.rtCode || rtIdx}`}
                                className="rounded-lg border border-slate-200 bg-white hover:border-[#0277BD]/70 p-2.5 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#1C8237] text-[11px] font-extrabold font-mono-num border border-emerald-200">
                                      {rt.rtCode} · {rw.rwCode}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-700 font-mono-num">
                                      {rt.householdsCount} KK
                                    </span>
                                  </div>

                                  <h4 className="mt-1 text-xs font-extrabold text-[#0D3868] truncate">
                                    {rt.rtName}
                                  </h4>

                                  <div className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                                    <div className="flex items-start gap-1">
                                      <UserCheck className="w-3 h-3 text-[#0277BD] shrink-0 mt-0.5" />
                                      <span className="truncate">
                                        Ketua: <strong className="text-slate-900">{rt.ketuaRtName}</strong>
                                      </span>
                                    </div>
                                    {rt.areaDescription && (
                                      <div className="flex items-start gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                                        <span className="line-clamp-1">{rt.areaDescription}</span>
                                      </div>
                                    )}
                                    {rt.phone && (
                                      <div className="flex items-center gap-1 font-mono-num text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80">
                                        <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>{rt.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL SISKAMLING RT RW LENGKAP */}
      {activeTab === 'siskamling' && (
        <div className="animate-fadeIn">
          {/* Header Banner Siskamling */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#0D3868] via-[#0D3868] to-[#0277BD] p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>SISTEM KEAMANAN LINGKUNGAN (SISKAMLING) SWAKARSA 2026</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Jadwal Posko & Roster Ronda Malam RW 01 s/d RW 07
                </h2>
                <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
                  Jadwal resmi petugas siskamling dan ronda swakarsa Kelurahan Panaikang. Bertugas menjaga keamanan, ketertiban, dan kewaspadaan lingkungan warga setiap malam.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-sky-200 pt-1 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Jam Operasional: 22.00 - 04.30 WITA</span>
                  </span>
                  <span aria-hidden="true" className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>7 Posko Terpadu RW</span>
                  </span>
                  <span aria-hidden="true" className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-300" />
                    <span>Darurat: Babinsa & Bhabinkamtibmas / 112</span>
                  </span>
                </div>
              </div>

              {/* Action Button: Matriks Mingguan */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWeeklyMatrixModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-slate-900" />
                  <span>Matriks 7 Hari (Senin - Minggu)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Siskamling Day Selector Bar (Senin - Minggu) */}
          <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold text-[#0D3868] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>PILIH HARI JADWAL PIKET SISKAMLING:</span>
              </span>

              <div className="text-xs text-slate-600 font-medium">
                Piket Terpilih:{' '}
                <strong className="text-[#0D3868] font-extrabold text-sm font-mono-num">
                  {selectedDay}
                </strong>
                {selectedDay === todayDay && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    Malam Ini
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {SISKAMLING_DAYS.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = day === todayDay;
                return (
                  <button
                    key={`siskamling-day-btn-${day}`}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#0D3868] text-white shadow-sm ring-2 ring-sky-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="font-extrabold tracking-wide">{day}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        Hari Ini
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPI Strip & Siskamling Filter */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Petugas Hari {selectedDay}
                </div>
                <div className="mt-1 text-2xl font-black text-[#0D3868] font-mono-num">
                  {totalOfficersToday} Personel
                </div>
                <div className="text-[11px] text-slate-500">Tersebar di 7 Posko RW</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0277BD] flex items-center justify-center border border-sky-200">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Posko Siskamling Aktif
                </div>
                <div className="mt-1 text-2xl font-black text-[#1C8237] font-mono-num">
                  7 Posko RW
                </div>
                <div className="text-[11px] text-slate-500">RW 01 s/d RW 07 Siaga</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1C8237] flex items-center justify-center border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Jam Siaga Ronda
                </div>
                <div className="mt-1 text-xl font-black text-amber-700 font-mono-num">
                  22.00 - 04.30 WITA
                </div>
                <div className="text-[11px] text-slate-500">Patroli berkala tiap 2 jam</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* RW Filter Chips & Search Bar for Siskamling */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSiskamlingRw('Semua')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedSiskamlingRw === 'Semua'
                    ? 'bg-[#0D3868] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua Posko (7 RW)
              </button>
              {currentSchedules.map((item, schedIdx) => (
                <button
                  key={`siskamling-chip-${item.rw || schedIdx}`}
                  type="button"
                  onClick={() => setSelectedSiskamlingRw(item.rw)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedSiskamlingRw === item.rw
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.rw}
                </button>
              ))}
            </div>

            <div className="relative flex-1 lg:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={siskamlingSearch}
                onChange={(e) => setSiskamlingSearch(e.target.value)}
                placeholder="Cari nama petugas, posko, atau RW..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0D3868] focus:outline-none"
              />
            </div>
          </div>

          {/* Siskamling Roster Cards */}
          <div className="mt-6 space-y-4">
            {filteredSiskamling.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Tidak ada data jadwal siskamling yang cocok dengan pencarian.
              </div>
            ) : (
              filteredSiskamling.map((item, schedIdx) => {
                const officersToday = item?.schedules?.[selectedDay] || [];
                const isExpanded = !!expandedSiskamlingRw[item.rw];
                const leadOfficer = officersToday[0] || 'Koordinator RW';

                return (
                  <div
                    key={`siskamling-card-${item.rw || schedIdx}`}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#0277BD]/60 transition-all"
                  >
                    {/* Header Bar Posko */}
                    <div className="bg-gradient-to-r from-slate-900 to-[#0D3868] px-5 sm:px-6 py-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase font-mono-num">
                            POSKO {item.rw}
                          </span>
                          <span className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Piket {selectedDay}: {officersToday.length} Petugas Siaga</span>
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>{item.poskoLocation || `Posko Siskamling ${item.rw}`}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleSubItemClick('rtrw_matriks_siskamling', 'Matriks Jadwal Posko 7 Hari', () =>
                              toggleSiskamlingDetail(item.rw)
                            )
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            isExpanded
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-300" />
                          <span className="inline-flex items-center gap-1.5">
                            <span>{isExpanded ? 'Tutup Matriks 7 Hari' : 'Lihat Matriks 7 Hari'}</span>
                            {!isAllowed('rtrw_matriks_siskamling') && <Lock className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.75} />}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Duty Officers on Selected Day */}
                    <div className="p-5 sm:p-6 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <h4 className="text-xs sm:text-sm font-extrabold text-[#0D3868] uppercase tracking-wide">
                            Daftar Petugas Ronda Hari {selectedDay} ({officersToday.length} Orang)
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Koordinator: <strong className="text-slate-800">{leadOfficer}</strong>
                        </span>
                      </div>

                      {officersToday.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                          Belum ada petugas terdaftar untuk hari {selectedDay}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {officersToday.map((officer, i) => (
                            <div
                              key={`officer-${item.rw || 'posko'}-${selectedDay}-${i}-${officer || 'petugas'}`}
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                i === 0
                                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                                  : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-[#0277BD]/50 hover:shadow-2xs'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-mono-num shrink-0 ${
                                  i === 0
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-[#0D3868] text-white'
                                }`}
                              >
                                {i + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-extrabold text-slate-900 truncate">
                                  {officer}
                                </div>
                                <div className="text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                                  {i === 0 ? (
                                    <span className="text-amber-800 font-extrabold">
                                      Koordinator Lapangan
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Anggota Ronda</span>
                                  )}
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Siap</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Posko Details & Notes */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Titik Posko:</strong> {item.poskoLocation}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              <strong>Catatan:</strong> {item.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expandable Weekly Mini Table for this RW */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
                          <div className="text-xs font-bold text-[#0D3868] mb-2 uppercase tracking-wide flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>Roster Lengkap 7 Hari Wilayah {item.rw}</span>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                                <tr>
                                  {SISKAMLING_DAYS.map((d) => (
                                    <th
                                      key={`th-mini-${d}`}
                                      className={`p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap ${
                                        d === selectedDay ? 'bg-amber-100 text-slate-900' : ''
                                      }`}
                                    >
                                      {d} {d === todayDay && '(Hari Ini)'}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                <tr>
                                  {SISKAMLING_DAYS.map((d) => {
                                    const officers = item?.schedules?.[d] || [];
                                    return (
                                      <td
                                        key={`td-mini-${item.rw}-${d}`}
                                        className={`p-2.5 align-top border-r border-slate-200 last:border-r-0 min-w-[130px] ${
                                          d === selectedDay ? 'bg-amber-50/50' : ''
                                        }`}
                                      >
                                        <div className="space-y-1">
                                          {officers.map((off, idx) => (
                                            <div
                                              key={`mini-off-${item.rw}-${d}-${idx}-${off}`}
                                              className="text-[11px] font-semibold text-slate-800 leading-tight"
                                            >
                                              <span className="text-slate-400 font-mono-num mr-1">
                                                {idx + 1}.
                                              </span>
                                              <span>{off}</span>
                                              {idx === 0 && (
                                                <span className="block text-[9px] text-amber-800 font-bold">
                                                  (Koor)
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: MATRIKS MINGGUAN (SENIN - MINGGU) SELURUH RW */}
      {showWeeklyMatrixModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-[#0D3868] text-white p-5 sm:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Matriks Jadwal Siskamling RW 01 s/d RW 07 (Senin - Minggu)
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Kelurahan Panaikang, Panakkukang, Kota Makassar · Jam Operasional 22.00 - 04.30 WITA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Jadwal Roster"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak Roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWeeklyMatrixModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                  aria-label="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Full Matrix Table */}
            <div className="p-5 sm:p-6 overflow-x-auto flex-1">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[11px] font-black uppercase">
                    <th className="p-3 border border-slate-200 whitespace-nowrap bg-slate-200/80 sticky left-0 z-10">
                      Wilayah & Posko
                    </th>
                    {SISKAMLING_DAYS.map((day) => (
                      <th
                        key={`matrix-th-${day}`}
                        className={`p-3 border border-slate-200 whitespace-nowrap text-center ${
                          day === todayDay ? 'bg-amber-100 text-slate-900 font-black' : ''
                        }`}
                      >
                        {day}
                        {day === todayDay && (
                          <span className="block text-[9px] text-amber-800 font-bold">
                            (Hari Ini)
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentSchedules.map((row, rowIdx) => (
                    <tr key={`matrix-row-${row.rw || rowIdx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 border border-slate-200 font-bold bg-white sticky left-0 z-10">
                        <div className="text-xs font-extrabold text-[#0D3868]">{row.rw}</div>
                        <div className="text-[11px] text-slate-500 font-normal truncate max-w-[140px]">
                          {row.poskoLocation}
                        </div>
                      </td>
                      {SISKAMLING_DAYS.map((day) => {
                        const officers = row?.schedules?.[day] || [];
                        return (
                          <td
                            key={`matrix-td-${row.rw}-${day}`}
                            className={`p-2.5 border border-slate-200 align-top min-w-[125px] ${
                              day === todayDay ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              {officers.map((officer, idx) => (
                                <div
                                  key={`matrix-off-${row.rw}-${day}-${idx}-${officer}`}
                                  className="text-[11px] font-semibold text-slate-800 leading-tight"
                                >
                                  <span className="text-slate-400 font-mono-num mr-1">
                                    {idx + 1}.
                                  </span>
                                  <span>{officer}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Terverifikasi resmi berdasarkan SK Kelurahan Panaikang</span>
              </span>
              <button
                type="button"
                onClick={() => setShowWeeklyMatrixModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bagan Struktur Organisasi RT/RW Modal */}
      <BaganStrukturRtRwModal
        isOpen={showBaganRtRw}
        onClose={() => setShowBaganRtRw(false)}
        rwGroups={rwGroups}
        profile={profile}
      />

      {/* Modal Prompt untuk Fitur yang Dibatasi Aksesnya */}
      <RestrictedAccessModal
        isOpen={Boolean(restrictedModal?.isOpen)}
        onClose={() => setRestrictedModal(null)}
        title={restrictedModal?.title || ''}
        onNavigateToLogin={() => onNavigate('login')}
      />
    </div>
  );
};
