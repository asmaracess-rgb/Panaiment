import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Recycle,
  PlusCircle,
  Calculator,
  Scale,
  Leaf,
  Trash2,
  Sprout,
  Droplets,
  MapPin,
  ExternalLink,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Maximize2,
  Info,
  Layers,
  CircleDot,
} from 'lucide-react';
import {
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  AppView,
} from '../types';
import { resolveImageUrl } from '../utils/resolveImageUrl';

interface MonitoringSampahViewProps {
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  tebaSpots?: TebaSpot[];
  bioporiPoints?: BioporiPoint[];
  onAddWasteLog: (
    rw: string,
    organikKg: number,
    anorganikKg: number,
    residuKg: number,
    officerName: string,
    notes: string
  ) => void;
  onNavigate: (view: AppView) => void;
}

export const MonitoringSampahView: React.FC<MonitoringSampahViewProps> = ({
  wasteUnits,
  wasteLogs,
  tebaSpots = [],
  bioporiPoints = [],
  onAddWasteLog,
  onNavigate,
}) => {
  // Main Sub-menu Switcher: 'bsu' | 'teba' | 'biopori'
  const [activeSubMenu, setActiveSubMenu] = useState<'bsu' | 'teba' | 'biopori'>('bsu');

  // Citizen Waste Bank Conversion Calculator State
  const [petKg, setPetKg] = useState<number>(5);
  const [cardboardKg, setCardboardKg] = useState<number>(8);
  const [aluminumKg, setAluminumKg] = useState<number>(2);
  const [cookingOilLiters, setCookingOilLiters] = useState<number>(3);

  const totalOrganik = wasteUnits.reduce((acc, u) => acc + u.organikKg, 0);
  const totalAnorganik = wasteUnits.reduce((acc, u) => acc + u.anorganikKg, 0);
  const totalResidu = wasteUnits.reduce((acc, u) => acc + u.residuKg, 0);
  const grandTotal = totalOrganik + totalAnorganik + totalResidu;

  const pctOrganik = Math.round((totalOrganik / Math.max(grandTotal, 1)) * 100);
  const pctAnorganik = Math.round((totalAnorganik / Math.max(grandTotal, 1)) * 100);
  const pctResidu = 100 - pctOrganik - pctAnorganik;

  const estimatedRupiah =
    petKg * 4200 + cardboardKg * 2500 + aluminumKg * 14000 + cookingOilLiters * 6500;

  // ==================== TEBA SUB-MENU STATE ====================
  const [tebaSearch, setTebaSearch] = useState('');
  const [tebaRwFilter, setTebaRwFilter] = useState('Semua');
  const [tebaStatusFilter, setTebaStatusFilter] = useState('Semua');
  const [selectedTebaModal, setSelectedTebaModal] = useState<TebaSpot | null>(null);

  const tebaList = Array.isArray(tebaSpots) ? tebaSpots : [];

  const filteredTeba = useMemo(() => {
    return tebaList.filter((spot) => {
      const q = tebaSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        spot.code.toLowerCase().includes(q) ||
        spot.address.toLowerCase().includes(q) ||
        spot.locationTag.toLowerCase().includes(q) ||
        spot.coordinatorName.toLowerCase().includes(q);

      const matchRw = tebaRwFilter === 'Semua' || spot.rw === tebaRwFilter;
      const matchStatus = tebaStatusFilter === 'Semua' || spot.status === tebaStatusFilter;

      return matchQuery && matchRw && matchStatus;
    });
  }, [tebaList, tebaSearch, tebaRwFilter, tebaStatusFilter]);

  const totalTebaKapasitas = tebaList.reduce((acc, s) => acc + s.capacityKg, 0);
  const totalTebaTerurai = tebaList.reduce((acc, s) => acc + s.currentLoadKg, 0);
  const tebaAktifCount = tebaList.filter((s) => s.status === 'Aktif Beroperasi').length;

  // ==================== BIOPORI SUB-MENU STATE ====================
  const [bioporiSearch, setBioporiSearch] = useState('');
  const [bioporiRwFilter, setBioporiRwFilter] = useState('Semua');
  const [bioporiStatusFilter, setBioporiStatusFilter] = useState('Semua');
  const [selectedBioporiModal, setSelectedBioporiModal] = useState<BioporiPoint | null>(null);

  const bioporiList = Array.isArray(bioporiPoints) ? bioporiPoints : [];

  const filteredBiopori = useMemo(() => {
    return bioporiList.filter((point) => {
      const q = bioporiSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        point.name.toLowerCase().includes(q) ||
        point.code.toLowerCase().includes(q) ||
        point.address.toLowerCase().includes(q) ||
        point.locationTag.toLowerCase().includes(q) ||
        point.coordinatorName.toLowerCase().includes(q);

      const matchRw = bioporiRwFilter === 'Semua' || point.rw === bioporiRwFilter;
      const matchStatus = bioporiStatusFilter === 'Semua' || point.status === bioporiStatusFilter;

      return matchQuery && matchRw && matchStatus;
    });
  }, [bioporiList, bioporiSearch, bioporiRwFilter, bioporiStatusFilter]);

  const totalBioporiHoles = bioporiList.reduce((acc, b) => acc + b.totalHoles, 0);
  const bioporiSiapPanenCount = bioporiList.filter((b) => b.status === 'Siap Panen Kompos').length;
  const bioporiAktifCount = bioporiList.filter((b) => b.status === 'Aktif Digunakan').length;

  // Shared Lightbox
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string } | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EF6C00] hover:text-[#E65100] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Pengelolaan Sampah
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
            Sistem tata kelola persampahan terpadu Kelurahan Panaikang: Pemilahan 3 aliran (Organik,
            Anorganik, Residu) melalui 6 BSU RW, fasilitas pengomposan Teba komunal, dan lubang resapan Biopori organik mandiri warga.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('peta')}
          className="self-start px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
        >
          Lihat Titik di Peta Digital
        </button>
      </div>

      {/* Sub Menu Navigation (3 Sub Menus: Bank Sampah Unit (BSU), Teba, Biopori) */}
      <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        {/* Sub-menu 1: BSU */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('bsu')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubMenu === 'bsu'
              ? 'bg-[#EF6C00] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Recycle className="w-4 h-4 shrink-0" />
          <span>Bank Sampah Unit (BSU)</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-num ${
              activeSubMenu === 'bsu' ? 'bg-amber-800/40 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {wasteUnits.length} Unit
          </span>
        </button>

        {/* Sub-menu 2: Teba */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('teba')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubMenu === 'teba'
              ? 'bg-[#1C8237] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sprout className="w-4 h-4 shrink-0" />
          <span>Teba</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-num ${
              activeSubMenu === 'teba' ? 'bg-emerald-800/40 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {tebaList.length} Titik
          </span>
        </button>

        {/* Sub-menu 3: Biopori (New requested sub-menu) */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('biopori')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubMenu === 'biopori'
              ? 'bg-[#0277BD] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Droplets className="w-4 h-4 shrink-0" />
          <span>Biopori</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-num ${
              activeSubMenu === 'biopori' ? 'bg-sky-800/40 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {bioporiList.length} Zona · {totalBioporiHoles} Lubang
          </span>
        </button>
      </div>

      {/* ==================== SUB MENU 1: BANK SAMPAH UNIT (BSU) ==================== */}
      {activeSubMenu === 'bsu' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* 3 Primary Waste Stream Cards: Organik, Anorganik, Residu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>SAMPAH ORGANIK (KOMPOS & MAGGOT)</span>
                <Leaf className="w-4 h-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
                  {totalOrganik.toLocaleString('id-ID')} kg
                </span>
                <span className="text-xs font-semibold text-emerald-700 font-mono-num">
                  ({pctOrganik}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Diolah menjadi kompos tanaman lorong, biopori Teba, dan pakan budidaya maggot BSF
                Kelurahan Panaikang.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
                <span>SAMPAH ANORGANIK (DAUR ULANG BSU)</span>
                <Recycle className="w-4 h-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
                  {totalAnorganik.toLocaleString('id-ID')} kg
                </span>
                <span className="text-xs font-semibold text-sky-700 font-mono-num">
                  ({pctAnorganik}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Botol plastik PET, kardus, kertas, kaleng, dan minyak jelantah tabungan warga di BSU
                RW.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                <span>SAMPAH RESIDU (DIANGKUT KE TPA)</span>
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
                  {totalResidu.toLocaleString('id-ID')} kg
                </span>
                <span className="text-xs font-semibold text-amber-700 font-mono-num">
                  ({pctResidu}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Residu non-daur ulang yang diangkut armada kebersihan menuju TPA Tamangapa Antang.
              </p>
            </div>
          </div>

          {/* Proportion Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Komposisi Pengelolaan Sampah Kelurahan Panaikang (Total{' '}
                <span className="font-mono-num">{grandTotal.toLocaleString('id-ID')} kg</span>)
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-600 font-mono-num">
                <span>Organik {pctOrganik}%</span>
                <span>·</span>
                <span>Anorganik {pctAnorganik}%</span>
                <span>·</span>
                <span>Residu {pctResidu}%</span>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                style={{ width: `${pctOrganik}%` }}
                className="bg-emerald-500"
                title={`Organik: ${pctOrganik}%`}
              />
              <div
                style={{ width: `${pctAnorganik}%` }}
                className="bg-sky-500"
                title={`Anorganik: ${pctAnorganik}%`}
              />
              <div
                style={{ width: `${pctResidu}%` }}
                className="bg-amber-500"
                title={`Residu: ${pctResidu}%`}
              />
            </div>
          </div>

          {/* 6 Waste Bank Unit Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#0D3868]">
                Daftar Bank Sampah Unit (BSU) RW Aktif
              </h2>
              <span className="text-xs font-semibold text-slate-500 font-mono-num">
                6 Unit Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {wasteUnits.map((u) => {
                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors"
                  >
                    <div>
                      {u.imageUrl ? (
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                          <img
                            src={resolveImageUrl(u.imageUrl)}
                            alt={u.unitName}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-amber-800 font-bold border border-amber-200 text-xs shadow-xs">
                              {u.rw}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-white font-mono-num text-[11px]">
                              {u.lastUpdated}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-gradient-to-r from-emerald-600 to-teal-700 relative p-4 flex items-center justify-between text-white border-b border-emerald-800/10">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-bold text-xs">
                              {u.rw}
                            </span>
                          </div>
                          <Recycle className="w-10 h-10 text-white/30" />
                          <div className="absolute bottom-2 right-3">
                            <span className="text-white/80 font-mono-num text-[11px]">
                              {u.lastUpdated}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-5 pb-0">
                        {!u.imageUrl && (
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                              {u.rw}
                            </span>
                            <span className="text-slate-400 font-mono-num text-[11px]">
                              {u.lastUpdated}
                            </span>
                          </div>
                        )}
                        <h3 className="text-base font-bold text-slate-900">{u.unitName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{u.locationLabel}</p>

                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                          <div className="bg-emerald-50 rounded-xl p-2">
                            <span className="text-[10px] font-semibold text-emerald-800 block">
                              ORGANIK
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono-num">
                              {u.organikKg} kg
                            </span>
                          </div>
                          <div className="bg-sky-50 rounded-xl p-2">
                            <span className="text-[10px] font-semibold text-sky-800 block">
                              ANORGANIK
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono-num">
                              {u.anorganikKg} kg
                            </span>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2">
                            <span className="text-[10px] font-semibold text-amber-800 block">
                              RESIDU
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono-num">
                              {u.residuKg} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>Koordinator:</span>
                        <span className="font-semibold text-slate-700">{u.coordinator}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Jadwal Penjemputan:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[170px] text-right">
                          {u.pickupSchedule}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Nasabah BSU:</span>
                        <span className="font-semibold text-slate-700 font-mono-num">
                          {u.activeHouseholds} KK
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Tools: Layanan Penimbangan BSU & Kalkulator Simulasi Tabungan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Layanan Penimbangan Harian BSU (Dikelola di Halaman Admin BSU) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Scale className="w-5 h-5 text-[#EF6C00]" />
                  <h2 className="text-base font-bold text-[#0D3868]">
                    Layanan Penimbangan Sampah Harian BSU
                  </h2>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#EF6C00] shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">
                      Menu Input Timbangan Harian BSU dikelola secara terpusat oleh Pengurus BSU & Petugas melalui Panel Admin BSU.
                    </p>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    Warga dapat menyetorkan sampah terpilah (Organik, Anorganik, dan Residu) langsung ke Bank Sampah Unit RW terdekat. Petugas unit akan menimbang dan mencatat mutasi timbangan harian langsung ke dalam sistem Satu Data Panaikang.
                  </p>
                </div>

                {/* Real-time stats */}
                <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Log</span>
                    <span className="text-base font-bold text-slate-800 font-mono-num">{wasteLogs.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Penimbangan</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Organik</span>
                    <span className="text-base font-bold text-emerald-700 font-mono-num">{wasteUnits.reduce((a, b) => a + b.organikKg, 0)}</span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Kilogram</span>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/60">
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Total Anorganik</span>
                    <span className="text-base font-bold text-sky-700 font-mono-num">{wasteUnits.reduce((a, b) => a + b.anorganikKg, 0)}</span>
                    <span className="text-[10px] text-sky-600 block mt-0.5">Kilogram</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0D3868] hover:bg-[#092547] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Scale className="w-4 h-4 text-[#EF6C00]" />
                  <span>Buka Menu Input Timbangan di Halaman Admin BSU</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Akses khusus Koordinator BSU & Petugas Kelurahan Panaikang
                </p>
              </div>
            </div>

            {/* Interactive Waste Bank Savings Calculator for Citizens */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-base font-bold text-[#0D3868]">
                    Simulasi Tabungan Bank Sampah Warga
                  </h2>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Hitung nilai ekonomis sampah terpilah rumah tangga Anda berdasarkan harga acuan BSU
                  Kelurahan Panaikang:
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Botol Plastik PET (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={petKg}
                      onChange={(e) => setPetKg(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kardus & Kertas (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cardboardKg}
                      onChange={(e) => setCardboardKg(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kaleng Aluminium (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={aluminumKg}
                      onChange={(e) => setAluminumKg(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Minyak Jelantah (Liter)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cookingOilLiters}
                      onChange={(e) =>
                        setCookingOilLiters(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="text-xs font-semibold text-emerald-900">
                  Estimasi Saldo Tabungan BSU:
                </div>
                <div className="text-xl font-extrabold text-emerald-800 font-mono-num">
                  Rp {estimatedRupiah.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Weighing History Table */}
          {wasteLogs && wasteLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Log Penimbangan BSU Terakhir
                </h3>
                <span className="text-xs text-slate-500 font-mono-num">
                  {wasteLogs.length} Catatan
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <th className="py-2.5 px-4">Tanggal & Waktu</th>
                      <th className="py-2.5 px-4">Wilayah BSU</th>
                      <th className="py-2.5 px-4">Organik</th>
                      <th className="py-2.5 px-4">Anorganik</th>
                      <th className="py-2.5 px-4">Residu</th>
                      <th className="py-2.5 px-4">Petugas</th>
                      <th className="py-2.5 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wasteLogs.slice(0, 8).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {log.unitName} ({log.rw})
                        </td>
                        <td className="py-2.5 px-4 font-mono-num text-emerald-700 font-bold">
                          {log.organikKg} kg
                        </td>
                        <td className="py-2.5 px-4 font-mono-num text-sky-700 font-bold">
                          {log.anorganikKg} kg
                        </td>
                        <td className="py-2.5 px-4 font-mono-num text-amber-700 font-bold">
                          {log.residuKg} kg
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{log.officerName}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                          {log.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB MENU 2: MONITORING TEBA ==================== */}
      {activeSubMenu === 'teba' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* Teba Educational & Overview Banner */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-400/40 text-emerald-100 text-xs font-semibold">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Program Kelurahan Panaikang Hijau & Mandiri</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Sistem Peresapan & Pengomposan Teba Komunal
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Teba Komunal adalah fasilitas lubang resapan biopori organik terpadu berbasis
                  kearifan lokal yang dibangun di lingkungan permukiman RW. Berfungsi mengurai
                  sisa makanan dapur dan dedaunan menjadi pupuk kompos organik berkualitas tinggi,
                  sekaligus mencegah pembuangan sampah organik ke drainase dan TPA.
                </p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-emerald-200 block uppercase tracking-wider">
                    Total Titik Teba
                  </span>
                  <span className="text-2xl font-black text-white font-mono-num">
                    {tebaList.length} Titik
                  </span>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block">
                    Di 7 RW se-Panaikang
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-emerald-200 block uppercase tracking-wider">
                    Aktif Beroperasi
                  </span>
                  <span className="text-2xl font-black text-emerald-300 font-mono-num">
                    {tebaAktifCount} Titik
                  </span>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block">
                    Siap tampung organik
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-emerald-200 block uppercase tracking-wider">
                    Kapasitas Olah
                  </span>
                  <span className="text-xl font-black text-white font-mono-num">
                    {totalTebaKapasitas.toLocaleString('id-ID')} kg
                  </span>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block">
                    Daya tampung komunal
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-emerald-200 block uppercase tracking-wider">
                    Organik Terurai
                  </span>
                  <span className="text-xl font-black text-amber-200 font-mono-num">
                    {totalTebaTerurai.toLocaleString('id-ID')} kg
                  </span>
                  <span className="text-[10px] text-emerald-200/80 mt-0.5 block">
                    Proses jadi pupuk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tebaSearch}
                  onChange={(e) => setTebaSearch(e.target.value)}
                  placeholder="Cari titik teba, alamat, patokan / tag lokasi..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Wilayah:</span>
                <select
                  value={tebaRwFilter}
                  onChange={(e) => setTebaRwFilter(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua RW</option>
                  <option value="RW 01">RW 01</option>
                  <option value="RW 02">RW 02</option>
                  <option value="RW 03">RW 03</option>
                  <option value="RW 04">RW 04</option>
                  <option value="RW 05">RW 05</option>
                  <option value="RW 06">RW 06</option>
                  <option value="RW 07">RW 07</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Status:</span>
                <select
                  value={tebaStatusFilter}
                  onChange={(e) => setTebaStatusFilter(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif Beroperasi">Aktif Beroperasi</option>
                  <option value="Penuh / Masa Pengomposan">Penuh / Pengomposan</option>
                  <option value="Perawatan & Pembersihan">Perawatan</option>
                  <option value="Rencana Pembangunan">Rencana</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid: Informasi Lokasi Titik Teba (Alamat, Tag Lokasi, Foto) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#0D3868] flex items-center gap-2">
                <span>Informasi Titik Sebaran Teba Komunal</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1C8237] text-xs font-mono-num font-bold">
                  {filteredTeba.length} Lokasi
                </span>
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Dilengkapi Alamat Lengkap, Tag Patokan Lapangan, dan Foto Lokasi
              </span>
            </div>

            {filteredTeba.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Tidak ada titik Teba ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Silakan periksa kembali kata kunci pencarian Anda atau reset filter wilayah RW.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTebaSearch('');
                    setTebaRwFilter('Semua');
                    setTebaStatusFilter('Semua');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1C8237] text-xs font-bold border border-emerald-200 cursor-pointer"
                >
                  Reset Filter Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeba.map((spot) => {
                  const percentFilled = Math.min(
                    100,
                    Math.round((spot.currentLoadKg / Math.max(spot.capacityKg, 1)) * 100)
                  );

                  return (
                    <div
                      key={spot.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* FOTO LOKASI TITIK TEBA */}
                        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={resolveImageUrl(spot.imageUrl)}
                            alt={spot.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                                spot.status === 'Aktif Beroperasi'
                                  ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                                  : spot.status === 'Penuh / Masa Pengomposan'
                                  ? 'bg-amber-600/90 text-white border border-amber-400/40'
                                  : 'bg-slate-700/90 text-white border border-slate-400/40'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>{spot.status}</span>
                            </span>
                          </div>

                          {/* Quick Lightbox Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                title: `${spot.name} (${spot.rw})`,
                                url: spot.imageUrl,
                              })
                            }
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors cursor-pointer"
                            title="Perbesar Foto Titik Teba"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>

                          {/* Bottom Photo Overlay Info */}
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <span className="font-mono text-[11px] bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                              {spot.code}
                            </span>
                            <span className="bg-emerald-700/80 px-2 py-0.5 rounded font-bold text-[11px] backdrop-blur-xs">
                              {spot.rw} · {spot.rt}
                            </span>
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 space-y-3.5">
                          {/* Nama Titik */}
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#1C8237] transition-colors">
                              {spot.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {spot.description}
                            </p>
                          </div>

                          {/* TAG LOKASI / PATOKAN KHUSUS */}
                          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                                  Tag & Patokan Lokasi:
                                </span>
                                <span className="font-semibold text-slate-800 leading-tight">
                                  {spot.locationTag}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ALAMAT LENGKAP LOKASI TITIK TEBA */}
                          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Alamat Titik Teba:
                            </span>
                            <p className="text-slate-800 font-medium leading-relaxed">
                              {spot.address}
                            </p>
                            {spot.mapUrl && (
                              <a
                                href={spot.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0277BD] hover:text-[#01579B] hover:underline pt-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Buka Peta / Navigasi Google Maps</span>
                              </a>
                            )}
                          </div>

                          {/* Capacity & Progress Bar */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-xs font-mono-num mb-1">
                              <span className="text-slate-500">Beban Olah Kompos:</span>
                              <span className="font-bold text-slate-800">
                                {spot.currentLoadKg} kg / {spot.capacityKg} kg
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percentFilled > 85
                                    ? 'bg-amber-600'
                                    : percentFilled > 60
                                    ? 'bg-emerald-600'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                              <span>Terisi {percentFilled}%</span>
                              <span>Panen Terakhir: {spot.lastHarvestDate || '-'}</span>
                            </div>
                          </div>

                          {/* Jenis Sampah yang Diolah */}
                          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                            <span className="font-semibold text-slate-700">Bahan Diolah: </span>
                            <span>{spot.wasteTypeProcessed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Koordinator & Modal Detail Button */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Koordinator:
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate block">
                            {spot.coordinatorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {spot.coordinatorPhone && (
                            <a
                              href={`https://wa.me/62${spot.coordinatorPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1C8237] border border-emerald-200 transition-colors"
                              title="Hubungi Koordinator Titik Teba via WhatsApp"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedTebaModal(spot)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Detail Titik
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB MENU 3: BIOPORI (LUBANG RESAPAN BIOPORI / LRB) ==================== */}
      {activeSubMenu === 'biopori' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* Biopori Overview Banner */}
          <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-700/60 border border-sky-400/40 text-sky-100 text-xs font-semibold">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Program Resapan Air & Kesuburan Tanah Mandiri</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Lubang Resapan Biopori (LRB) Kelurahan Panaikang
                </h2>
                <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                  Lubang Resapan Biopori adalah silinder lubang vertikal ke dalam tanah yang
                  berfungsi ganda: mempercepat resapan air hujan guna mencegah genangan lorong,
                  serta mengubah sampah organik dapur menjadi kompos alami bernutrisi tinggi melalui
                  aktivitas fauna tanah dan mikroorganisme.
                </p>
              </div>

              {/* Quick Biopori Metrics */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-sky-200 block uppercase tracking-wider">
                    Total Lubang
                  </span>
                  <span className="text-2xl font-black text-white font-mono-num">
                    {totalBioporiHoles} Lubang
                  </span>
                  <span className="text-[10px] text-sky-200/80 mt-0.5 block">
                    Di sekeliling lorong RW
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-sky-200 block uppercase tracking-wider">
                    Zona / Kluster
                  </span>
                  <span className="text-2xl font-black text-sky-300 font-mono-num">
                    {bioporiList.length} Titik
                  </span>
                  <span className="text-[10px] text-sky-200/80 mt-0.5 block">
                    Tersebar di 7 RW
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-sky-200 block uppercase tracking-wider">
                    Siap Panen Pupuk
                  </span>
                  <span className="text-xl font-black text-amber-200 font-mono-num">
                    {bioporiSiapPanenCount} Kluster
                  </span>
                  <span className="text-[10px] text-sky-200/80 mt-0.5 block">
                    Kompos matang
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                  <span className="text-[10px] font-bold text-sky-200 block uppercase tracking-wider">
                    Aktif Berfungsi
                  </span>
                  <span className="text-xl font-black text-emerald-300 font-mono-num">
                    {bioporiAktifCount} Kluster
                  </span>
                  <span className="text-[10px] text-sky-200/80 mt-0.5 block">
                    Resapan & tampung
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edukasi & Tata Cara Pengisian Biopori */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Bahan Organik yang Boleh Diisi:</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Sisa sayuran mentah & kulit buah</li>
                <li>Dedaunan kering gugur dari taman</li>
                <li>Ampas kopi, ampas teh, sisa kelapa</li>
                <li>Cacahan rumput & kulit telur hancur</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-red-800 mb-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Dilarang Dimasukkan:</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Sampah anorganik (plastik, kaleng, kaca)</li>
                <li>Minyak goreng jelantah & cairan kimia</li>
                <li>Daging berlemak tebal & tulang keras</li>
                <li>Baterai, puntung rokok, atau limbah B3</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800 mb-2">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Manfaat Bagi Lingkungan RW:</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Mencegah genangan air saat hujan lebat</li>
                <li>Meningkatkan cadangan air tanah sumur</li>
                <li>Menghasilkan pupuk kompos gratis bagi warga</li>
                <li>Menyuburkan struktur tanah tanaman lorong</li>
              </ul>
            </div>
          </div>

          {/* Search & Filter Bar Biopori */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bioporiSearch}
                  onChange={(e) => setBioporiSearch(e.target.value)}
                  placeholder="Cari zona biopori, kode, alamat, patokan lokasi..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Wilayah:</span>
                <select
                  value={bioporiRwFilter}
                  onChange={(e) => setBioporiRwFilter(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Semua">Semua RW</option>
                  <option value="RW 01">RW 01</option>
                  <option value="RW 02">RW 02</option>
                  <option value="RW 03">RW 03</option>
                  <option value="RW 04">RW 04</option>
                  <option value="RW 05">RW 05</option>
                  <option value="RW 06">RW 06</option>
                  <option value="RW 07">RW 07</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Status:</span>
                <select
                  value={bioporiStatusFilter}
                  onChange={(e) => setBioporiStatusFilter(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif Digunakan">Aktif Digunakan</option>
                  <option value="Siap Panen Kompos">Siap Panen Kompos</option>
                  <option value="Penuh Kompos">Penuh Kompos</option>
                  <option value="Perlu Perawatan">Perlu Perawatan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid: Informasi Titik Sebaran Biopori */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#0D3868] flex items-center gap-2">
                <span>Daftar Titik & Kluster Lubang Biopori RW</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0277BD] text-xs font-mono-num font-bold">
                  {filteredBiopori.length} Kluster Lokasi
                </span>
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Alamat, Tag Lokasi Lapangan, Dimensi Lubang, dan Dokumentasi
              </span>
            </div>

            {filteredBiopori.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Tidak ada zona Biopori yang sesuai</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Silakan sesuaikan kata kunci pencarian atau reset filter wilayah.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBioporiSearch('');
                    setBioporiRwFilter('Semua');
                    setBioporiStatusFilter('Semua');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0277BD] text-xs font-bold border border-sky-200 cursor-pointer"
                >
                  Reset Filter Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBiopori.map((point) => (
                  <div
                    key={point.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* FOTO LOKASI BIOPORI */}
                      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={resolveImageUrl(point.imageUrl)}
                          alt={point.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                              point.status === 'Siap Panen Kompos'
                                ? 'bg-amber-600/90 text-white border border-amber-400/40'
                                : point.status === 'Aktif Digunakan'
                                ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                                : point.status === 'Penuh Kompos'
                                ? 'bg-sky-700/90 text-white border border-sky-400/40'
                                : 'bg-slate-700/90 text-white border border-slate-400/40'
                            }`}
                          >
                            <CircleDot className="w-2.5 h-2.5" />
                            <span>{point.status}</span>
                          </span>
                        </div>

                        {/* Quick Lightbox Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              title: `${point.name} (${point.rw})`,
                              url: point.imageUrl,
                            })
                          }
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title="Perbesar Foto Titik Biopori"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>

                        {/* Bottom Overlay Info */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <span className="font-mono text-[11px] bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                            {point.code}
                          </span>
                          <span className="bg-sky-700/80 px-2.5 py-0.5 rounded font-bold text-[11px] backdrop-blur-xs">
                            {point.rw} · {point.rt}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 space-y-3.5">
                        {/* Nama Kluster */}
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#0277BD] transition-colors">
                              {point.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {point.notes}
                          </p>
                        </div>

                        {/* TAG LOKASI / PATOKAN KHUSUS */}
                        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                                Tag & Patokan Lokasi:
                              </span>
                              <span className="font-semibold text-slate-800 leading-tight">
                                {point.locationTag}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ALAMAT LENGKAP */}
                        <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Alamat Lokasi:
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed">
                            {point.address}
                          </p>
                          {point.mapUrl && (
                            <a
                              href={point.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0277BD] hover:text-[#01579B] hover:underline pt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka Google Maps</span>
                            </a>
                          )}
                        </div>

                        {/* Spesifikasi Teknis Lubang Biopori */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-sky-50 rounded-xl p-2 border border-sky-100">
                            <span className="text-[10px] font-bold text-sky-800 block">
                              JUMLAH
                            </span>
                            <span className="text-sm font-black text-sky-950 font-mono-num">
                              {point.totalHoles} Lubang
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 block">
                              DIAMETER
                            </span>
                            <span className="text-sm font-bold text-slate-800 font-mono-num">
                              Ø {point.diameterCm} cm
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 block">
                              KEDALAMAN
                            </span>
                            <span className="text-sm font-bold text-slate-800 font-mono-num">
                              {point.depthCm} cm
                            </span>
                          </div>
                        </div>

                        {/* Bahan Organik & Riwayat Panen */}
                        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 space-y-1">
                          <div>
                            <span className="font-semibold text-slate-700">Sampah Diisi: </span>
                            <span>{point.organicTypes}</span>
                          </div>
                          {point.harvestHistory && (
                            <div className="text-emerald-700 font-medium">
                              <span className="font-semibold text-emerald-800">Panen: </span>
                              <span>{point.harvestHistory}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Koordinator & Modal Detail Button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Koordinator:
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate block">
                          {point.coordinatorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {point.coordinatorPhone && (
                          <a
                            href={`https://wa.me/62${point.coordinatorPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0277BD] border border-sky-200 transition-colors"
                            title="Hubungi Koordinator Biopori via WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedBioporiModal(point)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Detail Zona
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Detail Lengkap Titik Teba */}
      {selectedTebaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold">Informasi Detail Titik Teba Komunal</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTebaModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <img
                  src={resolveImageUrl(selectedTebaModal.imageUrl)}
                  alt={selectedTebaModal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImage({
                      title: selectedTebaModal.name,
                      url: selectedTebaModal.imageUrl,
                    })
                  }
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Lihat Ukuran Penuh</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    {selectedTebaModal.name}
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    Kode: {selectedTebaModal.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#1C8237] text-xs font-bold">
                    {selectedTebaModal.rw} · {selectedTebaModal.rt}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {selectedTebaModal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    Tag Patokan Lokasi Lapangan:
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedTebaModal.locationTag}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Alamat Lengkap:
                  </span>
                  <p className="text-sm text-slate-800 font-medium mt-0.5">
                    {selectedTebaModal.address}
                  </p>
                  {selectedTebaModal.mapUrl && (
                    <a
                      href={selectedTebaModal.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Titik di Google Maps</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Kapasitas Maksimal</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono-num">
                    {selectedTebaModal.capacityKg} kg
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Beban Terisi</span>
                  <span className="text-base font-extrabold text-emerald-800 font-mono-num">
                    {selectedTebaModal.currentLoadKg} kg
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Panen Pupuk Terakhir</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedTebaModal.lastHarvestDate || 'Belum ada panen'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Koordinator / Penanggung Jawab:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedTebaModal.coordinatorName}
                  </span>
                </div>
                {selectedTebaModal.coordinatorPhone && (
                  <a
                    href={`https://wa.me/62${selectedTebaModal.coordinatorPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hubungi WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTebaModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Lengkap Titik Biopori */}
      {selectedBioporiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-sky-200" />
                <h3 className="text-base font-bold">Informasi Detail Zona Biopori</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBioporiModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <img
                  src={resolveImageUrl(selectedBioporiModal.imageUrl)}
                  alt={selectedBioporiModal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImage({
                      title: selectedBioporiModal.name,
                      url: selectedBioporiModal.imageUrl,
                    })
                  }
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Lihat Ukuran Penuh</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    {selectedBioporiModal.name}
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    Kode: {selectedBioporiModal.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-[#0277BD] text-xs font-bold">
                    {selectedBioporiModal.rw} · {selectedBioporiModal.rt}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {selectedBioporiModal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    Tag Patokan Lokasi Lapangan:
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedBioporiModal.locationTag}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Alamat Lengkap:
                  </span>
                  <p className="text-sm text-slate-800 font-medium mt-0.5">
                    {selectedBioporiModal.address}
                  </p>
                  {selectedBioporiModal.mapUrl && (
                    <a
                      href={selectedBioporiModal.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Google Maps</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-center">
                  <span className="text-sky-800 block font-bold text-[10px]">TOTAL LUBANG</span>
                  <span className="text-lg font-black text-sky-950 font-mono-num">
                    {selectedBioporiModal.totalHoles} Lubang
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-slate-500 block font-bold text-[10px]">DIAMETER PIPA</span>
                  <span className="text-lg font-black text-slate-800 font-mono-num">
                    {selectedBioporiModal.diameterCm} cm
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-slate-500 block font-bold text-[10px]">KEDALAMAN</span>
                  <span className="text-lg font-black text-slate-800 font-mono-num">
                    {selectedBioporiModal.depthCm} cm
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700">Sampah Organik yang Dimasukkan:</span>
                  <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {selectedBioporiModal.organicTypes}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700">Riwayat Panen & Catatan Teknis:</span>
                  <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedBioporiModal.notes} {selectedBioporiModal.harvestHistory ? `· ${selectedBioporiModal.harvestHistory}` : ''}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-sky-800 uppercase block">
                    Koordinator / Penanggung Jawab:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedBioporiModal.coordinatorName}
                  </span>
                </div>
                {selectedBioporiModal.coordinatorPhone && (
                  <a
                    href={`https://wa.me/62${selectedBioporiModal.coordinatorPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0277BD] hover:bg-[#01579B] text-white font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hubungi WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBioporiModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lightbox Foto */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl cursor-default animate-fadeIn"
          >
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
              <span>{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[80vh] bg-slate-950 flex items-center justify-center p-2">
              <img
                src={resolveImageUrl(lightboxImage.url)}
                alt={lightboxImage.title}
                className="max-h-[78vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
