import React, { useState } from 'react';
import {
  X,
  Building2,
  UserCheck,
  Briefcase,
  Phone,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { KelurahanProfile, StructuralOfficial } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface BaganStrukturKelurahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: KelurahanProfile;
  onOpenAdminManage?: () => void;
}

export const BaganStrukturKelurahanModal: React.FC<BaganStrukturKelurahanModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenAdminManage,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficial, setSelectedOfficial] = useState<{
    title: string;
    name: string;
    nip?: string;
    rank?: string;
    department?: string;
    phone?: string;
    tupoksi?: string;
    isLurah?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  // Derive officials list or fallback
  const officials: StructuralOfficial[] =
    Array.isArray(profile.officials) && profile.officials.length > 0
      ? profile.officials
      : [
          {
            id: 'off-1',
            positionTitle: 'Sekretaris Lurah',
            officialName: profile.sekretarisName || 'Hj. Rahmawati Dg. Ngasseng, S.Sos.',
            nip: '19790412 200801 2 015',
            rank: 'Penata Tk. I (III/d)',
            department: 'Sekretariat Kelurahan',
            phone: '0812-4421-9801',
            orderIndex: 1,
          },
          {
            id: 'off-2',
            positionTitle: 'Kepala Seksi Kebersihan & Lingkungan Hidup',
            officialName: profile.kasiKebersihanName || 'Muh. Syahrul Ramadhan, S.T.',
            nip: '19850918 201101 1 008',
            rank: 'Penata (III/c)',
            department: 'Seksi Kebersihan & Lingkungan Hidup',
            phone: '0852-9981-4432',
            orderIndex: 2,
          },
          {
            id: 'off-3',
            positionTitle: 'Kepala Seksi Ketentraman, Ketertiban & Pemerintahan',
            officialName: profile.kasiPemerintahanName || 'Drs. H. Kamaruddin Lira',
            nip: '19810325 200902 1 003',
            rank: 'Penata Tk. I (III/d)',
            department: 'Seksi Pemerintahan & Trantib',
            phone: '0813-5567-1120',
            orderIndex: 3,
          },
          {
            id: 'off-4',
            positionTitle: 'Kepala Seksi Pemberdayaan Masyarakat & Kesejahteraan Sosial',
            officialName: 'Dra. Hj. Nurhayati, M.M.',
            nip: '19830715 201001 2 018',
            rank: 'Penata (III/c)',
            department: 'Seksi Kesra & Pemberdayaan',
            phone: '0811-4198-3321',
            orderIndex: 4,
          },
        ];

  // Group officials by level / type
  const sekretaris = officials.find(
    (o) =>
      o.positionTitle.toLowerCase().includes('sekretaris') ||
      o.department.toLowerCase().includes('sekretariat')
  ) || officials[0];

  const seksiList = officials.filter((o) => o.id !== sekretaris?.id);

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
        {/* Top Navigation & Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0D3868]/10 text-[#0D3868]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                  SOTK Resmi Kelurahan
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono-num font-semibold">
                  Tahun Anggaran 2025/2026
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868] tracking-tight">
                Bagan Struktur Organisasi Kelurahan Panaikang
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

            {/* Close Modal */}
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

        {/* Scrollable Diagram Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50/60">
          <div
            style={{ zoom: `${zoomLevel}%` }}
            className="transition-transform duration-150 origin-top flex flex-col items-center max-w-5xl mx-auto"
          >
            {/* Bagan Official Header */}
            <div className="text-center pb-6 border-b-2 border-slate-300 w-full mb-8">
              <div className="flex items-center justify-center gap-4 mb-2">
                <EmblemKotaMakassar className="w-12 h-14 shrink-0" />
                <div className="h-10 w-[2px] bg-slate-200" />
                <EmblemKelurahanPanaikang className="w-12 h-14 shrink-0" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Pemerintah Kota Makassar · Kecamatan Panakkukang
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0D3868] uppercase tracking-tight mt-0.5">
                BAGAN STRUKTUR ORGANISASI KELURAHAN PANAIKANG
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl mx-auto">
                Berdasarkan Peraturan Walikota Makassar tentang Susunan Organisasi, Kedudukan, dan
                Tata Kerja Pemerintah Kelurahan
              </p>
            </div>

            {/* Top Level: LURAH PANAIKANG */}
            <div className="flex flex-col items-center relative w-full">
              {/* Lurah Card */}
              <div
                onClick={() =>
                  setSelectedOfficial({
                    title: 'Lurah Panaikang (Kepala Kelurahan)',
                    name: profile.lurahName,
                    nip: profile.lurahNip,
                    rank: profile.lurahRank || 'Penata (Gol. III/c)',
                    department: 'Pimpinan Eksekutif Wilayah',
                    phone: profile.phoneContact,
                    tupoksi:
                      'Memimpin penyelenggaraan pemerintahan kelurahan, pembinaan ketentraman ketertiban, pelayanan masyarakat, dan koordinasi program Panaikang Smart Environment.',
                    isLurah: true,
                  })
                }
                className="group relative z-10 w-full max-w-md bg-gradient-to-br from-[#0D3868] to-[#072647] text-white rounded-2xl p-5 shadow-xl border-2 border-amber-400/80 hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-950" />
                  <span>KEPALA KELURAHAN / PIMPINAN WILAYAH</span>
                </div>

                <div className="mt-1 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-extrabold text-lg shadow-inner">
                    <UserCheck className="w-6 h-6 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
                      LURAH PANAIKANG
                    </div>
                    <div className="text-base sm:text-lg font-black text-white leading-tight mt-0.5 group-hover:text-amber-200 transition-colors">
                      {profile.lurahName}
                    </div>
                    <div className="text-[11px] font-mono-num text-sky-200 mt-0.5">
                      NIP. {profile.lurahNip}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-sky-100">
                  <span>Pangkat: {profile.lurahRank || 'Penata (III/c)'}</span>
                  <span className="font-mono-num text-amber-300 font-semibold">
                    Masa Tugas: {profile.lurahPeriod || '2025 – Sekarang'}
                  </span>
                </div>
              </div>

              {/* Side Coordination Boxes: Babinsa, Bhabinkamtibmas, LPM, PKK */}
              <div className="w-full flex justify-between items-center max-w-3xl my-3 px-2 sm:px-4">
                <div className="border border-dashed border-slate-300 rounded-xl p-2.5 bg-white shadow-xs text-left text-xs max-w-[190px]">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Babinsa & Bhabinkamtibmas</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Mitra Keamanan, Ketertiban & TNI/Polri
                  </div>
                </div>

                <div className="h-0.5 flex-1 border-t-2 border-dashed border-slate-300 mx-2" />

                <div className="border border-dashed border-slate-300 rounded-xl p-2.5 bg-white shadow-xs text-right text-xs max-w-[190px]">
                  <div className="font-bold text-slate-900 flex items-center justify-end gap-1.5 text-[11px]">
                    <span>LPM & TP PKK Kelurahan</span>
                    <Users className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Lembaga Pemberdayaan & Penggerak Warga
                  </div>
                </div>
              </div>

              {/* Connecting Line Down to Level 2 */}
              <div className="w-0.5 h-8 bg-slate-400" />

              {/* Level 2: SEKRETARIS LURAH */}
              {sekretaris && (
                <div className="flex flex-col items-center w-full">
                  <div
                    onClick={() =>
                      setSelectedOfficial({
                        title: sekretaris.positionTitle,
                        name: sekretaris.officialName,
                        nip: sekretaris.nip,
                        rank: sekretaris.rank,
                        department: sekretaris.department,
                        phone: sekretaris.phone,
                        tupoksi:
                          'Memimpin kesekretariatan kelurahan, koordinasi administrasi umum, kepegawaian, keuangan, perlengkapan, dan Satu Data Lingkungan.',
                      })
                    }
                    className="group relative z-10 w-full max-w-sm bg-white rounded-2xl p-4 shadow-md border-2 border-sky-400 hover:border-sky-600 hover:shadow-lg transition-all cursor-pointer text-center"
                  >
                    <div className="inline-block px-2.5 py-0.5 bg-sky-50 text-[#0277BD] border border-sky-200 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      {sekretaris.positionTitle}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#0D3868] transition-colors">
                      {sekretaris.officialName}
                    </div>
                    {sekretaris.nip && (
                      <div className="text-xs font-mono-num text-slate-500 mt-0.5">
                        NIP. {sekretaris.nip}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>{sekretaris.rank || 'Penata (III/d)'}</span>
                      <span className="text-emerald-700 font-semibold font-mono-num">
                        {sekretaris.phone || '0812-4421-9801'}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Line Down to Level 3 (Branches) */}
                  <div className="w-0.5 h-8 bg-slate-400" />
                </div>
              )}

              {/* Horizontal Connecting Bar for Seksi-Seksi */}
              <div className="w-full max-w-4xl h-0.5 bg-slate-400 mb-6 hidden md:block" />

              {/* Level 3: SEKSI-SEKSI JABATAN TEKNIS & BIDANG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {seksiList.map((seksi, idx) => {
                  const isKebersihan = seksi.positionTitle.toLowerCase().includes('kebersihan');
                  const isPemerintahan = seksi.positionTitle.toLowerCase().includes('pemerintahan');
                  const isKesra = seksi.positionTitle.toLowerCase().includes('pemberdayaan') || seksi.positionTitle.toLowerCase().includes('sosial');

                  const borderColor = isKebersihan
                    ? 'border-emerald-300 hover:border-emerald-500'
                    : isPemerintahan
                    ? 'border-blue-300 hover:border-blue-500'
                    : isKesra
                    ? 'border-purple-300 hover:border-purple-500'
                    : 'border-slate-300 hover:border-slate-500';

                  const badgeBg = isKebersihan
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isPemerintahan
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : isKesra
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200';

                  return (
                    <div
                      key={seksi.id || idx}
                      onClick={() =>
                        setSelectedOfficial({
                          title: seksi.positionTitle,
                          name: seksi.officialName,
                          nip: seksi.nip,
                          rank: seksi.rank,
                          department: seksi.department,
                          phone: seksi.phone,
                          tupoksi: isKebersihan
                            ? 'Pengelolaan kebersihan lingkungan, pembinaan 6 Bank Sampah Unit RW, operasional fasilitas Teba komunal, biopori, drainase lingkungan, dan kerja bakti rutin.'
                            : isPemerintahan
                            ? 'Pembinaan ketertiban umum, penegakan perda, pengawasan siskamling, pembinaan administrasi 7 RW dan 62 RT, serta penerbitan pengantar adminduk.'
                            : isKesra
                            ? 'Pemberdayaan potensi ekonomi warga, ketahanan pangan & urban farming lorong, penanganan PMKS/bansos, pembinaan posyandu, dan program stunting.'
                            : 'Pelaksanaan tugas operasional dan koordinasi teknis perangkat kelurahan.',
                        })
                      }
                      className={`group bg-white rounded-2xl p-4 shadow-xs border-2 ${borderColor} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`inline-block px-2.5 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}
                          >
                            {seksi.positionTitle}
                          </span>
                          <span className="text-[10px] font-mono-num text-slate-400">
                            0{idx + 1}
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0D3868] transition-colors leading-snug">
                          {seksi.officialName}
                        </h3>

                        {seksi.nip && (
                          <div className="text-xs font-mono-num text-slate-500 mt-1">
                            NIP. {seksi.nip}
                          </div>
                        )}
                        {seksi.rank && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Pangkat: {seksi.rank}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 truncate mr-2">
                          {seksi.department || 'Perangkat Teknis'}
                        </span>
                        {seksi.phone && (
                          <span className="font-mono-num text-emerald-700 font-semibold shrink-0">
                            {seksi.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Layer: Unit Operasional & Lapangan */}
              <div className="mt-8 pt-6 border-t border-slate-200 w-full">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Satuan Operasional Lapangan & Mitra Wilayah Kelurahan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="font-bold text-[#0D3868]">Satgas Drainase & Kebersihan</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Operasional Lapangan 24 Jam</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="font-bold text-[#1C8237]">6 Bank Sampah Unit (BSU)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Jaringan Penimbangan RW</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="font-bold text-[#0277BD]">7 RW & 62 RT Panaikang</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Lembaga Kemasyarakatan</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="font-bold text-purple-700">Kader Posyandu & Pertanian</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Urban Farming & Kesehatan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner & Detail Drawer if an official is clicked */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Klik salah satu kotak pejabat pada bagan di atas untuk melihat rincian NIP, kontak, dan
              tugas pokok fungsi (tupoksi).
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdminManage && (
              <button
                type="button"
                onClick={onOpenAdminManage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Kelola Jabatan di Admin</span>
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

      {/* Official Detail Modal Drawer */}
      {selectedOfficial && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOfficial(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-[#0277BD] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 uppercase">
                  {selectedOfficial.title}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedOfficial.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfficial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700">
              {selectedOfficial.nip && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Induk Pegawai (NIP):</span>
                  <span className="font-mono-num font-bold text-slate-900">
                    {selectedOfficial.nip}
                  </span>
                </div>
              )}
              {selectedOfficial.rank && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Pangkat / Golongan Ruang:</span>
                  <span className="font-semibold text-slate-900">{selectedOfficial.rank}</span>
                </div>
              )}
              {selectedOfficial.department && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Unit Kerja / Bidang:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedOfficial.department}
                  </span>
                </div>
              )}
              {selectedOfficial.phone && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Kontak Resmi:</span>
                  <a
                    href={`https://wa.me/${selectedOfficial.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono-num font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedOfficial.phone}</span>
                  </a>
                </div>
              )}
              {selectedOfficial.tupoksi && (
                <div className="pt-2">
                  <div className="font-bold text-slate-900 mb-1">
                    Tugas Pokok & Fungsi (Tupoksi):
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    {selectedOfficial.tupoksi}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOfficial(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
