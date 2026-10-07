import React, { useState, useMemo } from 'react';
import {
  FileDown,
  FileText,
  CheckCircle2,
  Printer,
  Calendar,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import {
  CitizenReport,
  CleanupEvent,
  KelurahanProfile,
  RwGroup,
  WasteBankUnit,
} from '../types';
import { INITIAL_MONTHLY_TRENDS } from '../data/initialData';
import {
  filterReportsForMonthlyArchive,
  generateMonthlyEnvironmentalPdf,
  GeneratedPdfResult,
} from '../utils/monthlyReportPdfGenerator';

interface MonthlyArchivePdfPanelProps {
  profile: KelurahanProfile;
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  rwGroups: RwGroup[];
  onPdfDownloaded?: (result: GeneratedPdfResult) => void;
}

const ROMAN_MONTHS: Record<string, string> = {
  Jan: 'I',
  Feb: 'II',
  Mar: 'III',
  Apr: 'IV',
  Mei: 'V',
  Jun: 'VI',
  Jul: 'VII',
  Agu: 'VIII',
  Sep: 'IX',
  Okt: 'X',
  ALL_2026: 'I-X',
};

export const MonthlyArchivePdfPanel: React.FC<MonthlyArchivePdfPanelProps> = ({
  profile,
  reports,
  wasteUnits,
  cleanupEvents,
  rwGroups,
  onPdfDownloaded,
}) => {
  const [periodKey, setPeriodKey] = useState<string>('Okt');
  const [rwFilter, setRwFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [archiveNumber, setArchiveNumber] = useState<string>(
    '660.1 / 048 / KEL-PNK / X / 2026'
  );
  const [includeRwBreakdown, setIncludeRwBreakdown] = useState<boolean>(true);
  const [includeWasteBankSummary, setIncludeWasteBankSummary] = useState<boolean>(true);
  const [includeCleanupSummary, setIncludeCleanupSummary] = useState<boolean>(true);
  const [executiveNote, setExecutiveNote] = useState<string>(
    'Seluruh laporan permasalahan lingkungan warga pada periode ini telah diverifikasi dan ditindaklanjuti bersama Satgas Kebersihan, Koordinator Bank Sampah Unit (BSU), serta Ketua RT/RW. Dokumen ini dicetak sebagai arsip fisik resmi Kelurahan Panaikang.'
  );
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [showDocPreview, setShowDocPreview] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastDownload, setLastDownload] = useState<GeneratedPdfResult | null>(null);

  const rwList = useMemo(() => {
    if (rwGroups && rwGroups.length > 0) {
      return rwGroups.map((g) => g.rwCode);
    }
    return ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
  }, [rwGroups]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriodKey(newPeriod);
    const roman = ROMAN_MONTHS[newPeriod] || 'X';
    setArchiveNumber(`660.1 / 048 / KEL-PNK / ${roman} / 2026`);
  };

  const selectedTrend = useMemo(
    () => INITIAL_MONTHLY_TRENDS.find((m) => m.month === periodKey),
    [periodKey]
  );

  const periodLabel = useMemo(() => {
    if (periodKey === 'ALL_2026') {
      return 'Rekapitulasi Tahunan (Januari – Oktober 2026)';
    }
    return selectedTrend?.fullMonth.replace(' (Berjalan)', '') || `Bulan ${periodKey} 2026`;
  }, [periodKey, selectedTrend]);

  const { matchedReports } = useMemo(
    () => filterReportsForMonthlyArchive(reports, periodKey, rwFilter, statusFilter),
    [reports, periodKey, rwFilter, statusFilter]
  );

  const selesaiCount = matchedReports.filter((r) => r.status === 'Selesai').length;
  const prosesCount = matchedReports.filter((r) => r.status === 'Sedang Ditangani').length;
  const menungguCount = matchedReports.filter((r) => r.status === 'Menunggu Verifikasi').length;

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const result = generateMonthlyEnvironmentalPdf({
        periodKey,
        rwFilter,
        statusFilter,
        archiveNumber: archiveNumber.trim() || '660.1 / 048 / KEL-PNK / X / 2026',
        executiveNote: executiveNote.trim(),
        includeWasteBankSummary,
        includeCleanupSummary,
        includeRwBreakdown,
        profile,
        reports,
        wasteUnits,
        cleanupEvents,
        rwGroups,
        monthlyTrends: INITIAL_MONTHLY_TRENDS,
      });
      setLastDownload(result);
      if (onPdfDownloaded) {
        onPdfDownloaded(result);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#0D3868]/25 p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Top Header & Primary Download Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0D3868] text-white flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-[#1C8237]">DOKUMEN ARSIP FISIK LURAH</span>
              <span aria-hidden="true">·</span>
              <span>Format Resmi A4 Kop Surat Pemerintah Kota Makassar</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868] mt-0.5">
              Unduh Laporan Bulanan Permasalahan Lingkungan (File PDF)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Cetak dan unduh dokumen rekapitulasi bulanan permasalahan lingkungan, rincian tindak
              lanjut laporan warga, capaian Bank Sampah Unit, serta lembar pengesahan tanda tangan
              Lurah Panaikang untuk keperluan arsip fisik kelurahan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => setShowDocPreview((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            {showDocPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDocPreview ? 'Tutup Pratinjau' : 'Pratinjau Arsip'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomize((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0D3868]" />
            <span>{showCustomize ? 'Sembunyikan Opsi' : 'Atur Format & Catatan'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-emerald-300" />
            <span>
              {isGenerating
                ? 'Menyusun File PDF...'
                : 'Unduh Laporan Bulanan (PDF)'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Filter Bar (Month, RW, Status, Archive Number) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Periode Bulan Laporan Arsip
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={periodKey}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#0D3868] focus:outline-none"
            >
              {[...INITIAL_MONTHLY_TRENDS].reverse().map((m) => (
                <option key={m.month} value={m.month}>
                  {m.fullMonth}
                </option>
              ))}
              <option value="ALL_2026">
                Rekapitulasi Tahunan (Januari – Oktober 2026)
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cakupan Wilayah RW
          </label>
          <select
            value={rwFilter}
            onChange={(e) => setRwFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
          >
            <option value="Semua">Seluruh Wilayah ({rwList.length} RW)</option>
            {rwList.map((rw) => (
              <option key={rw} value={rw}>
                Khusus Wilayah {rw}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Filter Status Laporan
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
          >
            <option value="Semua">Semua Status Penanganan</option>
            <option value="Selesai">Selesai Ditangani (Tuntas)</option>
            <option value="Sedang Ditangani">Sedang Ditangani Satgas</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Registrasi Arsip Fisik
          </label>
          <input
            type="text"
            value={archiveNumber}
            onChange={(e) => setArchiveNumber(e.target.value)}
            placeholder="660.1 / 048 / KEL-PNK / X / 2026"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono-num text-slate-900 focus:border-[#0D3868] focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Strip of Data to be Printed in PDF */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
          <span className="font-bold text-[#0D3868] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#1C8237]" />
            <span>Isi Dokumen PDF ({periodLabel}):</span>
          </span>
          <span>
            Total: <strong className="font-mono-num text-slate-900">{matchedReports.length}</strong> Laporan
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Tuntas: <strong className="font-mono-num text-emerald-700">{selesaiCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Proses: <strong className="font-mono-num text-sky-700">{prosesCount}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Menunggu: <strong className="font-mono-num text-amber-700">{menungguCount}</strong>
          </span>
          {selectedTrend && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Indeks Kebersihan:{' '}
                <strong className="font-mono-num text-[#1C8237]">
                  {selectedTrend.indeksKebersihan}/100
                </strong>
              </span>
            </>
          )}
        </div>

        <div className="text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D3868]" />
          <span>Pengesah: <strong>{profile.lurahName}</strong></span>
        </div>
      </div>

      {/* Expandable Advanced Options (Checkboxes & Executive Note) */}
      {showCustomize && (
        <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 space-y-4">
          <div className="text-xs font-bold text-[#0D3868]">
            Pengaturan Lampiran & Catatan Evaluasi Lurah pada Dokumen PDF
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRwBreakdown}
                onChange={(e) => setIncludeRwBreakdown(e.target.checked)}
                className="rounded text-[#0D3868]"
              />
              <span>Sertakan Tabel Distribusi per Wilayah RW</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWasteBankSummary}
                onChange={(e) => setIncludeWasteBankSummary(e.target.checked)}
                className="rounded text-[#0D3868]"
              />
              <span>Sertakan Rekapitulasi Bank Sampah Unit ({wasteUnits.length} BSU)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCleanupSummary}
                onChange={(e) => setIncludeCleanupSummary(e.target.checked)}
                className="rounded text-[#0D3868]"
              />
              <span>Sertakan Rekapitulasi Kerja Bakti ({cleanupEvents.length} Kegiatan)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Evaluasi & Arahan Lurah (Tercetak di Atas Kolom Tanda Tangan Arsip Fisik)
            </label>
            <textarea
              rows={2}
              value={executiveNote}
              onChange={(e) => setExecutiveNote(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0D3868] focus:outline-none"
              placeholder="Tuliskan catatan evaluasi bulanan Lurah untuk arsip fisik..."
            />
          </div>
        </div>
      )}

      {/* Expandable Live Document Preview */}
      {showDocPreview && (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-5 sm:p-7 space-y-5">
          {/* Simulated Official Kop Surat Preview */}
          <div className="text-center border-b-2 border-[#0D3868] pb-4">
            <div className="text-xs font-bold text-[#0D3868] tracking-wider">
              PEMERINTAH KOTA MAKASSAR · KECAMATAN PANAKKUKANG
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#0D3868]">
              PEMERINTAH KELURAHAN PANAIKANG
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Alamat: {profile.officeAddress} · Telp: {profile.phoneContact} · Email: {profile.emailContact}
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-xs sm:text-sm font-extrabold text-[#0D3868] uppercase">
              Laporan Bulanan Permasalahan Lingkungan & Kebersihan Wilayah
            </div>
            <div className="text-xs font-semibold text-[#1C8237]">
              Nomor Arsip: <span className="font-mono-num">{archiveNumber}</span> · Periode: {periodLabel}
            </div>
          </div>

          {/* Mini Preview Table of Reports */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0D3868] text-white">
                  <th className="py-2 px-3 font-bold">No. Tiket</th>
                  <th className="py-2 px-3 font-bold">Tanggal</th>
                  <th className="py-2 px-3 font-bold">Wilayah</th>
                  <th className="py-2 px-3 font-bold">Permasalahan Lingkungan</th>
                  <th className="py-2 px-3 font-bold">Kategori</th>
                  <th className="py-2 px-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matchedReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono-num font-bold text-[#0D3868]">
                      {rep.ticketCode}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono-num">{rep.createdAt}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {rep.rw} / {rep.rt}
                    </td>
                    <td className="py-2 px-3 text-slate-800">{rep.title}</td>
                    <td className="py-2 px-3 text-slate-600">{rep.category}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{rep.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simulated Signature Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs text-slate-700">
            <div className="max-w-md">
              <div className="font-bold text-[#0D3868]">Catatan Evaluasi Lurah:</div>
              <p className="text-slate-600 italic mt-0.5">{executiveNote}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-slate-500">Mengetahui & Mengesahkan,</div>
              <div className="font-bold text-[#0D3868] mt-0.5">LURAH PANAIKANG</div>
              <div className="mt-4 font-extrabold text-[#0D3868] underline">{profile.lurahName}</div>
              <div className="font-mono-num text-[11px] text-slate-500">NIP. {profile.lurahNip}</div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Banner After PDF Download */}
      {lastDownload && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              File PDF Arsip Fisik <strong>{lastDownload.fileName}</strong> ({lastDownload.totalReportsIncluded} laporan · {lastDownload.periodLabel}) berhasil diunduh pada {lastDownload.generatedAt}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastDownload(null)}
            className="text-emerald-800 font-bold hover:underline self-end sm:self-auto cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};
