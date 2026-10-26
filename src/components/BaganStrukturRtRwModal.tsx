import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Users,
  Shield,
  Phone,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  MapPin,
  Home,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { RwGroup, RtItem, KelurahanProfile } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface BaganStrukturRtRwModalProps {
  isOpen: boolean;
  onClose: () => void;
  rwGroups: RwGroup[];
  profile: KelurahanProfile;
  initialSelectedRw?: string;
  onNavigateToRtRw?: () => void;
}

export const BaganStrukturRtRwModal: React.FC<BaganStrukturRtRwModalProps> = ({
  isOpen,
  onClose,
  rwGroups,
  profile,
  initialSelectedRw = 'RW 01',
  onNavigateToRtRw,
}) => {
  const [selectedRwCode, setSelectedRwCode] = useState<string>(initialSelectedRw);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState<{
    rwCode: string;
    rtCode: string;
    rtName: string;
    ketuaRtName: string;
    phone?: string;
    areaDescription?: string;
    householdsCount?: number;
  } | null>(null);

  if (!isOpen) return null;

  // Find currently active RW
  const activeRw = rwGroups.find((r) => r.rwCode === selectedRwCode) || rwGroups[0];

  // Filtered RT list for active RW or global search
  const displayedRtList: RtItem[] = useMemo(() => {
    if (!activeRw || !Array.isArray(activeRw.rtList)) return [];
    if (!searchQuery.trim()) return activeRw.rtList;
    const q = searchQuery.toLowerCase().trim();
    return activeRw.rtList.filter(
      (rt) =>
        rt.rtCode.toLowerCase().includes(q) ||
        rt.ketuaRtName.toLowerCase().includes(q) ||
        (rt.phone && rt.phone.includes(q)) ||
        (rt.areaDescription && rt.areaDescription.toLowerCase().includes(q))
    );
  }, [activeRw, searchQuery]);

  const totalRtCount = rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
  const totalHhInActiveRw = (activeRw?.rtList || []).reduce(
    (acc, rt) => acc + (rt.householdsCount || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header & RW Switcher Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/10 text-emerald-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0D3868] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 uppercase tracking-wider">
                  Lembaga Kemasyarakatan Kelurahan (LKK)
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono-num font-semibold">
                  7 RW & 62 RT Panaikang
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868] tracking-tight">
                Bagan Struktur Organisasi Rukun Warga (RW) & Rukun Tetangga (RT)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono-num font-bold text-slate-700 text-[11px]">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(130, prev + 15))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition cursor-pointer"
                title="Reset Ukuran"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RW Selector Navigation Pills */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-100/70 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 mr-1 whitespace-nowrap">
              Pilih Wilayah RW:
            </span>
            {rwGroups.map((rw) => {
              const isSelected = rw.rwCode === selectedRwCode;
              return (
                <button
                  key={rw.id}
                  type="button"
                  onClick={() => {
                    setSelectedRwCode(rw.rwCode);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D3868] text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                  }`}
                >
                  <span>{rw.rwCode}</span>
                  <span
                    className={`ml-1.5 text-[10px] font-mono-num px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-sky-500/30 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rw.rtList?.length || 0} RT
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari RT atau Ketua RT..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#0D3868]"
            />
          </div>
        </div>

        {/* Scrollable Diagram Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50/60">
          <div
            style={{ zoom: `${zoomLevel}%` }}
            className="transition-transform duration-150 origin-top flex flex-col items-center max-w-5xl mx-auto"
          >
            {/* Header Bagan RT/RW */}
            <div className="text-center pb-6 border-b-2 border-slate-300 w-full mb-8">
              <div className="flex items-center justify-center gap-4 mb-2">
                <EmblemKotaMakassar className="w-12 h-14 shrink-0" />
                <div className="h-10 w-[2px] bg-slate-200" />
                <EmblemKelurahanPanaikang className="w-12 h-14 shrink-0" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Lembaga Kemasyarakatan Kelurahan Panaikang · Kota Makassar
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0D3868] uppercase tracking-tight mt-0.5">
                BAGAN STRUKTUR ORGANISASI {activeRw?.rwCode || 'RUKUN WARGA'}
              </h1>
              <p className="text-xs font-medium text-slate-600 mt-1 max-w-2xl mx-auto">
                {activeRw?.rwName || 'Wilayah Kelurahan Panaikang'} · {activeRw?.areaDescription}
              </p>
            </div>

            {/* LEVEL 1: PELINDUNG & PEMBINA WILAYAH */}
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-xl bg-slate-100/90 rounded-2xl p-3 border border-slate-300 text-center shadow-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  PELINDUNG & PEMBINA LINGKUNGAN
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-[#0D3868]">Lurah Panaikang</div>
                    <div className="text-[11px] text-slate-700 mt-0.5 font-semibold">
                      {profile.lurahName}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-emerald-800">Babinsa TNI AD</div>
                    <div className="text-[11px] text-slate-700 mt-0.5">Koramil Panakkukang</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-blue-800">Bhabinkamtibmas</div>
                    <div className="text-[11px] text-slate-700 mt-0.5">Polsek Panakkukang</div>
                  </div>
                </div>
              </div>

              {/* Connecting Line Down to Level 2 */}
              <div className="w-0.5 h-8 bg-slate-400" />

              {/* LEVEL 2: PIMPINAN RUKUN WARGA (RW) */}
              <div className="w-full max-w-2xl bg-gradient-to-r from-emerald-800 via-[#1C8237] to-emerald-900 text-white rounded-2xl p-5 shadow-lg border-2 border-emerald-400/80 text-center relative z-10">
                <div className="inline-block px-3 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full mb-2 shadow-xs">
                  PIMPINAN {activeRw?.rwCode} KELURAHAN PANAIKANG
                </div>

                <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                  KETUA RUKUN WARGA
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {activeRw?.ketuaRwName || 'KETUA RW TERPILIH'}
                </div>

                {activeRw?.phone && (
                  <div className="mt-1">
                    <a
                      href={`https://wa.me/${activeRw.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono-num text-xs text-amber-200 hover:underline font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp: {activeRw.phone}</span>
                    </a>
                  </div>
                )}

                {/* Sekretaris RW & Bendahara RW */}
                <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-emerald-200">
                      Sekretaris RW:
                    </span>
                    <div className="font-bold text-white mt-0.5">Sekretaris Pengurus RW</div>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-emerald-200">
                      Bendahara RW:
                    </span>
                    <div className="font-bold text-white mt-0.5">Bendahara Pengurus RW</div>
                  </div>
                </div>
              </div>

              {/* Connecting Line Down to Level 3 */}
              <div className="w-0.5 h-8 bg-slate-400" />

              {/* LEVEL 3: SEKSI-SEKSI LINGKUNGAN TINGKAT RW */}
              <div className="w-full max-w-4xl">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Seksi-Seksi Kerja & Pelaksana Tingkat RW
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        Seksi Kebersihan
                      </div>
                      <div className="font-bold text-slate-900">Bank Sampah Unit (BSU)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Penimbangan pilah sampah, Teba komunal & Sabtu Bersih
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border-2 border-blue-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-blue-800 uppercase bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        Seksi Keamanan
                      </div>
                      <div className="font-bold text-slate-900">Siskamling & Trantib</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Pos ronda malam, ketertiban warga & koordinasi Babinsa
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border-2 border-amber-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        Seksi Pembangunan
                      </div>
                      <div className="font-bold text-slate-900">Sarpras & Drainase</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Pemeliharaan lorong wisata, drainase air & sarana umum
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border-2 border-purple-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-purple-800 uppercase bg-purple-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        Seksi Pemberdayaan
                      </div>
                      <div className="font-bold text-slate-900">Posyandu & PKK RW</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Kesehatan balita, ketahanan pangan & urban farming
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line Down to Level 4 */}
              <div className="w-0.5 h-8 bg-slate-400" />
              <div className="w-full max-w-5xl h-0.5 bg-slate-400 mb-6 hidden md:block" />

              {/* LEVEL 4: JAJARAN RUKUN TETANGGA (RT) */}
              <div className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0D3868] flex items-center gap-2">
                      <span>Jajaran Rukun Tetangga (RT) di Bawah Naungan {activeRw?.rwCode}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0D3868] text-xs font-mono-num font-bold">
                        {displayedRtList.length} RT Terdaftar
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total estimasi Kepala Keluarga (KK):{' '}
                      <strong className="text-slate-800 font-mono-num">{totalHhInActiveRw} KK</strong>
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    Klik kartu RT untuk rincian kontak & wilayah
                  </span>
                </div>

                {displayedRtList.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-500">
                      Tidak ada RT yang sesuai dengan kata kunci pencarian.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {displayedRtList.map((rt) => (
                      <div
                        key={rt.id}
                        onClick={() =>
                          setSelectedRt({
                            rwCode: activeRw.rwCode,
                            rtCode: rt.rtCode,
                            rtName: rt.rtName,
                            ketuaRtName: rt.ketuaRtName,
                            phone: rt.phone,
                            areaDescription: rt.areaDescription,
                            householdsCount: rt.householdsCount,
                          })
                        }
                        className="group bg-white rounded-2xl p-4 border border-slate-200 hover:border-sky-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-sky-50 text-[#0D3868] border border-sky-100 rounded-md text-[11px] font-bold font-mono-num">
                              {rt.rtCode}
                            </span>
                            {rt.householdsCount && (
                              <span className="text-[10px] font-mono-num text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {rt.householdsCount} KK
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            Ketua RT:
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0D3868] transition-colors leading-tight mt-0.5">
                            {rt.ketuaRtName || 'Nama Ketua RT'}
                          </h4>

                          {rt.areaDescription && (
                            <div className="mt-2 text-xs text-slate-600 line-clamp-2 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-snug">{rt.areaDescription}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {rt.phone ? (
                            <span className="font-mono-num text-emerald-700 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{rt.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Belum ada no. kontak</span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LEVEL 5: MASYARAKAT / WARGA LINGKUNGAN RT */}
              <div className="mt-8 pt-5 border-t border-slate-200 w-full text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  <Home className="w-4 h-4 text-emerald-700" />
                  <span>WARGA DAN ANGGOTA MASYARAKAT RUKUN TETANGGA (RT)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xl mx-auto">
                  Pondasi partisipasi aktif warga dalam pemilahan sampah di sumber, kerja bakti
                  lingkungan, dan ketertiban bersama di Kelurahan Panaikang.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Pilih tab wilayah RW di atas (RW 01 s/d RW 07) untuk melihat bagan struktur RT/RW tiap
              lingkungan.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToRtRw && (
              <button
                type="button"
                onClick={onNavigateToRtRw}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Buka Direktori Lengkap RT/RW</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white font-semibold cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* RT Detail Modal Popup */}
      {selectedRt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRt(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedRt.rwCode} · {selectedRt.rtCode}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedRt.ketuaRtName || 'Ketua RT'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Jabatan:</span>
                <span className="font-semibold text-slate-900">
                  Ketua {selectedRt.rtCode} / {selectedRt.rwCode}
                </span>
              </div>
              {selectedRt.householdsCount && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Jumlah Kepala Keluarga:</span>
                  <span className="font-mono-num font-bold text-slate-900">
                    {selectedRt.householdsCount} KK
                  </span>
                </div>
              )}
              {selectedRt.areaDescription && (
                <div className="py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Wilayah Cakupan Jalan / Lorong:</span>
                  <span className="font-medium text-slate-800 leading-snug">
                    {selectedRt.areaDescription}
                  </span>
                </div>
              )}
              {selectedRt.phone && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Nomor WhatsApp Resmi:</span>
                  <a
                    href={`https://wa.me/${selectedRt.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Hubungi Ketua RT via WhatsApp ({selectedRt.phone})</span>
                  </a>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRt(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
