import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Recycle,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import {
  CitizenReport,
  ReportStatus,
  WasteBankUnit,
  CleanupEvent,
  AppView,
} from '../types';

interface PetaDigitalViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  onUpdateReportStatus: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  onNavigate: (view: AppView) => void;
}

type LayerType = 'semua' | 'laporan' | 'bsu' | 'kerjabakti';

export const PetaDigitalView: React.FC<PetaDigitalViewProps> = ({
  reports,
  wasteUnits,
  cleanupEvents,
  onUpdateReportStatus,
  onNavigate,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerType>('semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ReportStatus>('Semua');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'laporan' | 'bsu' | 'kerjabakti';
    id: string;
  }>({
    type: 'laporan',
    id: reports[0]?.id || '',
  });

  const visibleReports = reports.filter(
    (r) => statusFilter === 'Semua' || r.status === statusFilter
  );

  const selectedReport =
    selectedItem.type === 'laporan'
      ? reports.find((r) => r.id === selectedItem.id) || reports[0]
      : null;

  const selectedBsu =
    selectedItem.type === 'bsu'
      ? wasteUnits.find((u) => u.id === selectedItem.id) || wasteUnits[0]
      : null;

  const selectedCleanup =
    selectedItem.type === 'kerjabakti'
      ? cleanupEvents.find((c) => c.id === selectedItem.id) || cleanupEvents[0]
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00838F] hover:text-[#005662] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Peta Digital Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pemantauan spasial real-time titik laporan warga, lokasi Bank Sampah Unit (BSU), dan
            titik kerja bakti RW 01 – RW 06.
          </p>
        </div>

        {/* Layer Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          {[
            { id: 'semua', label: 'Semua Titik' },
            { id: 'laporan', label: `Laporan (${reports.length})` },
            { id: 'bsu', label: `Bank Sampah (${wasteUnits.length})` },
            { id: 'kerjabakti', label: `Kerja Bakti (${cleanupEvents.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLayer(tab.id as LayerType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeLayer === tab.id
                  ? 'bg-[#00838F] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar for Report Status */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Filter Status Laporan:
          </span>
          {(['Semua', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0D3868] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Verifikasi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
            <span>Ditangani</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Selesai</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
            <span>BSU RW</span>
          </span>
        </div>
      </div>

      {/* Map Canvas + Right Inspection Panel */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Spatial Map of Kelurahan Panaikang */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Navigation className="w-3.5 h-3.5 text-[#00838F]" />
              <span>Peta Spasial Wilayah Kelurahan Panaikang, Kec. Panakkukang (-5.1385, 119.4465)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Perbesar Peta"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Perkecil Peta"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Map Viewport */}
          <div className="relative h-[460px] sm:h-[520px] w-full overflow-hidden bg-[#EEF6F3] select-none">
            <div
              className="relative w-full h-full transition-transform duration-150 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Base Cartographic Vector Map of Kelurahan Panaikang */}
              <svg
                viewBox="0 0 1000 650"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover"
              >
                {/* Background RW Zones */}
                <rect width="1000" height="650" fill="#EDF5F0" />

                {/* RW Zone Blocks */}
                <path d="M40 160H340V380H40V160Z" fill="#E2EFE7" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M350 180H640V380H350V180Z" fill="#E6F2EB" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M650 120H940V360H650V120Z" fill="#DFEFE6" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M120 400H490V610H120V400Z" fill="#E7F1EC" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M510 400H890V610H510V400Z" fill="#E1EFE8" stroke="#CBD5E1" strokeWidth="1.5" />

                {/* Kanal Panaikang - Pampang Waterway (Blue Canal on North-East) */}
                <path
                  d="M520 20C640 90 740 180 980 250"
                  stroke="#38BDF8"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                <path
                  d="M520 20C640 90 740 180 980 250"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                />
                <text x="690" y="135" fill="#0369A1" fontSize="13" fontWeight="700" transform="rotate(24 690 135)">
                  KANAL PANAIKANG - PAMPANG
                </text>

                {/* Secondary Roads: Jl. Racing Centre, Jl. Sukaria, Jl. Abd. Dg. Sirua */}
                <path d="M220 40L250 630" stroke="#FFFFFF" strokeWidth="16" />
                <path d="M220 40L250 630" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6 6" />
                <text x="200" y="140" fill="#475569" fontSize="12" fontWeight="700" transform="rotate(87 200 140)">
                  JL. RACING CENTRE
                </text>

                <path d="M380 310L360 630" stroke="#FFFFFF" strokeWidth="14" />
                <text x="392" y="520" fill="#475569" fontSize="12" fontWeight="700">
                  JL. SUKARIA RAYA
                </text>

                <path d="M120 560L920 530" stroke="#FFFFFF" strokeWidth="15" />
                <text x="580" y="520" fill="#475569" fontSize="12" fontWeight="700">
                  KORIDOR KOMPLEKS KEJAKSAAN / SELATAN
                </text>

                {/* Primary Artery: JL. URIP SUMOHARJO (East-West Highway) */}
                <path d="M0 300Q480 285 1000 295" stroke="#CBD5E1" strokeWidth="36" />
                <path d="M0 300Q480 285 1000 295" stroke="#334155" strokeWidth="28" />
                <path
                  d="M0 300Q480 285 1000 295"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeDasharray="14 10"
                />
                <text x="410" y="275" fill="#0F172A" fontSize="14" fontWeight="800" letterSpacing="1">
                  POROS JL. URIP SUMOHARJO (KELURAHAN PANAIKANG)
                </text>

                {/* Major Landmark Footprints */}
                {/* NIPAH MALL */}
                <rect x="110" y="205" width="115" height="60" rx="8" fill="#D97706" fillOpacity="0.18" stroke="#B45309" strokeWidth="2" />
                <text x="167" y="238" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="800">
                  NIPAH MALL
                </text>

                {/* KAMPUS UMI */}
                <rect x="450" y="175" width="150" height="72" rx="8" fill="#0284C7" fillOpacity="0.16" stroke="#0369A1" strokeWidth="2" />
                <text x="525" y="208" textAnchor="middle" fill="#075985" fontSize="12" fontWeight="800">
                  KAMPUS UMI
                </text>
                <text x="525" y="225" textAnchor="middle" fill="#0369A1" fontSize="10" fontWeight="600">
                  Univ. Muslim Indonesia
                </text>

                {/* KANTOR LURAH PANAIKANG */}
                <rect x="440" y="330" width="140" height="50" rx="8" fill="#15803D" fillOpacity="0.16" stroke="#166534" strokeWidth="2" />
                <text x="510" y="359" textAnchor="middle" fill="#14532D" fontSize="11" fontWeight="800">
                  POSKO SMART ENV
                </text>

                {/* RW Labels */}
                <text x="80" y="195" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 01</text>
                <text x="375" y="215" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 02</text>
                <text x="625" y="215" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 03</text>
                <text x="165" y="455" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 04</text>
                <text x="690" y="465" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 05</text>
                <text x="795" y="185" fill="#64748B" fontSize="16" fontWeight="800" opacity="0.65">RW 06</text>
              </svg>

              {/* Interactive Overlay Markers: Citizen Reports */}
              {(activeLayer === 'semua' || activeLayer === 'laporan') &&
                visibleReports.map((rep) => {
                  const isSelected =
                    selectedItem.type === 'laporan' && selectedItem.id === rep.id;
                  const pinColor =
                    rep.status === 'Selesai'
                      ? 'bg-emerald-600 border-white text-white'
                      : rep.status === 'Sedang Ditangani'
                      ? 'bg-sky-600 border-white text-white'
                      : 'bg-amber-500 border-white text-white';

                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => setSelectedItem({ type: 'laporan', id: rep.id })}
                      style={{ left: `${rep.mapX}%`, top: `${rep.mapY}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer focus:outline-none`}
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 shadow-md transition-transform ${pinColor} ${
                          isSelected ? 'scale-125 ring-4 ring-sky-400/50' : 'hover:scale-110'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-mono-num font-bold whitespace-nowrap">
                          {rep.rw}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {/* Interactive Overlay Markers: Bank Sampah Units (BSU) */}
              {(activeLayer === 'semua' || activeLayer === 'bsu') &&
                wasteUnits.map((unit) => {
                  const isSelected =
                    selectedItem.type === 'bsu' && selectedItem.id === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setSelectedItem({ type: 'bsu', id: unit.id })}
                      style={{ left: `${unit.mapX}%`, top: `${unit.mapY}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EF6C00] text-white border-2 border-white shadow-md transition-transform ${
                          isSelected ? 'scale-125 ring-4 ring-amber-400/50' : 'hover:scale-110'
                        }`}
                      >
                        <Recycle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold whitespace-nowrap">
                          BSU {unit.rw}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {/* Interactive Overlay Markers: Kerja Bakti Points */}
              {(activeLayer === 'semua' || activeLayer === 'kerjabakti') &&
                cleanupEvents.map((ev) => {
                  const isSelected =
                    selectedItem.type === 'kerjabakti' && selectedItem.id === ev.id;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedItem({ type: 'kerjabakti', id: ev.id })}
                      style={{ left: `${ev.mapX}%`, top: `${ev.mapY}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5E35B1] text-white border-2 border-white shadow-md transition-transform ${
                          isSelected ? 'scale-125 ring-4 ring-purple-400/50' : 'hover:scale-110'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold whitespace-nowrap">
                          Kerja Bakti
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right: Real-Time Detail Inspector Panel */}
        <div className="lg:col-span-4">
          {selectedReport && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs text-slate-500 font-mono-num">
                  TITIK LAPORAN WARGA · {selectedReport.ticketCode}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedReport.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">
                  {selectedReport.rw} / {selectedReport.rt}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedReport.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{selectedReport.coordinatesLabel}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedReport.description}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Saat Ini:</span>
                  <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                    {selectedReport.status === 'Selesai' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {selectedReport.status === 'Sedang Ditangani' && (
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    {selectedReport.status === 'Menunggu Verifikasi' && (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {selectedReport.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lokasi:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {selectedReport.locationName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pelapor:</span>
                  <span className="font-medium text-slate-800">{selectedReport.reporterName}</span>
                </div>
              </div>

              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Catatan Petugas: </span>
                {selectedReport.responseNote}
              </div>

              {/* Quick Status Action Buttons directly from Map */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Perbarui Status Titik Secara Cepat:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as ReportStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          onUpdateReportStatus(
                            selectedReport.id,
                            st,
                            selectedReport.assignedTeam,
                            selectedReport.responseNote
                          )
                        }
                        className={`py-2 px-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          selectedReport.status === st
                            ? 'bg-[#00838F] text-white border-[#00838F]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'Menunggu Verifikasi' ? 'Verifikasi' : st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedBsu && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-semibold text-amber-700">
                  TITIK BANK SAMPAH UNIT · {selectedBsu.rw}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedBsu.unitName}
                </h2>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="text-slate-500">Lokasi: </span>
                  <span className="font-medium text-slate-900">{selectedBsu.locationLabel}</span>
                </div>
                <div>
                  <span className="text-slate-500">Koordinator: </span>
                  <span className="font-medium text-slate-900">{selectedBsu.coordinator}</span>
                </div>
                <div>
                  <span className="text-slate-500">Jadwal Jemput: </span>
                  <span className="font-mono-num font-medium text-slate-900">
                    {selectedBsu.pickupSchedule}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[11px] text-emerald-800">Organik</div>
                  <div className="text-sm font-extrabold text-emerald-950 font-mono-num mt-0.5">
                    {selectedBsu.organikKg} kg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-center">
                  <div className="text-[11px] text-sky-800">Anorganik</div>
                  <div className="text-sm font-extrabold text-sky-950 font-mono-num mt-0.5">
                    {selectedBsu.anorganikKg} kg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-[11px] text-amber-800">Residu</div>
                  <div className="text-sm font-extrabold text-amber-950 font-mono-num mt-0.5">
                    {selectedBsu.residuKg} kg
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('sampah')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Modul Monitoring Sampah →
              </button>
            </div>
          )}

          {selectedCleanup && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-semibold text-purple-700">
                  TITIK KERJA BAKTI · {selectedCleanup.rw}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedCleanup.title}
                </h2>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="text-slate-500">Jadwal: </span>
                  <span className="font-semibold text-slate-900">
                    {selectedCleanup.date} · {selectedCleanup.timeRange}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Titik Kumpul: </span>
                  <span className="font-medium text-slate-900">{selectedCleanup.locationName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Partisipasi Warga: </span>
                  <span className="font-mono-num font-bold text-purple-800">
                    {selectedCleanup.registeredParticipants} / {selectedCleanup.targetParticipants}{' '}
                    Peserta
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCleanup.summaryNote}
              </p>

              <button
                type="button"
                onClick={() => onNavigate('kerjabakti')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Lihat Detail & Daftar Kerja Bakti →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
