import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  FileDown,
  Eye,
  EyeOff,
  Building2,
  Users,
  MapPin,
  Phone,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  CitizenReport,
  KelurahanProfile,
  RtItem,
  RwGroup,
} from '../types';
import {
  generateRtRwReportPdf,
  getPresetForRtRwScope,
  printRtRwReportDirect,
  RtRwReportResult,
  RtRwReportScope,
} from '../utils/rtrwReportGenerator';
import { getKopSuratSizeSpec } from '../utils/officialKopSurat';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

export interface ExternalPrintSelection {
  scope: RtRwReportScope;
  rwCode: string;
  rtCode?: string;
  autoAction?: 'preview' | 'print' | 'pdf';
  timestamp: number;
}

interface AdminRtRwReportPanelProps {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  externalSelection?: ExternalPrintSelection | null;
  onReportPrintedOrExported?: (result: RtRwReportResult, actionType: 'PRINT' | 'PDF') => void;
}

export const AdminRtRwReportPanel: React.FC<AdminRtRwReportPanelProps> = ({
  profile,
  rwGroups,
  reports,
  externalSelection,
  onReportPrintedOrExported,
}) => {
  const [scope, setScope] = useState<RtRwReportScope>('per_rw');
  const [selectedRwCode, setSelectedRwCode] = useState<string>(
    rwGroups[0]?.rwCode || 'RW 01'
  );
  const [selectedRtCode, setSelectedRtCode] = useState<string>(
    rwGroups[0]?.rtList?.[0]?.rtCode || 'RT 01'
  );
  const [documentNumber, setDocumentNumber] = useState<string>(
    '148 / LAP-RW01 / KEL-PNK / X / 2026'
  );
  const [includeCitizenReports, setIncludeCitizenReports] = useState<boolean>(true);
  const [officialNote, setOfficialNote] = useState<string>(
    'Data pengurus Rukun Warga (RW) dan Rukun Tetangga (RT) beserta alamat cakupan wilayah ini merupakan data resmi yang tercatat pada Satu Data Kelurahan Panaikang Kecamatan Panakkukang Kota Makassar.'
  );
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<RtRwReportResult | null>(null);

  const currentRw: RwGroup | undefined = useMemo(
    () => rwGroups.find((g) => g.rwCode === selectedRwCode) || rwGroups[0],
    [rwGroups, selectedRwCode]
  );

  const currentRtList: RtItem[] = useMemo(
    () => currentRw?.rtList || [],
    [currentRw]
  );

  const currentRt: RtItem | undefined = useMemo(
    () =>
      currentRtList.find((r) => r.rtCode === selectedRtCode) || currentRtList[0],
    [currentRtList, selectedRtCode]
  );

  const buildDocNumber = (
    nextScope: RtRwReportScope,
    rwCode: string,
    rtCode: string
  ) => {
    const rwSlug = rwCode.replace(/\s+/g, '');
    const rtSlug = rtCode.replace(/\s+/g, '');
    if (nextScope === 'per_rt') {
      return `148 / LAP-${rwSlug}-${rtSlug} / KEL-PNK / X / 2026`;
    }
    if (nextScope === 'per_rw') {
      return `148 / LAP-${rwSlug} / KEL-PNK / X / 2026`;
    }
    return `148 / LAP-RTRW-ALL / KEL-PNK / X / 2026`;
  };

  const handleScopeChange = (nextScope: RtRwReportScope) => {
    setScope(nextScope);
    const rwCode = currentRw?.rwCode || 'RW 01';
    const rtCode = currentRt?.rtCode || 'RT 01';
    setDocumentNumber(buildDocNumber(nextScope, rwCode, rtCode));
  };

  const handleRwSelect = (rwCode: string) => {
    setSelectedRwCode(rwCode);
    const foundRw = rwGroups.find((g) => g.rwCode === rwCode);
    const firstRtCode = foundRw?.rtList?.[0]?.rtCode || 'RT 01';
    setSelectedRtCode(firstRtCode);
    setDocumentNumber(buildDocNumber(scope, rwCode, firstRtCode));
  };

  const handleRtSelect = (rtCode: string) => {
    setSelectedRtCode(rtCode);
    setDocumentNumber(buildDocNumber(scope, selectedRwCode, rtCode));
  };

  useEffect(() => {
    if (!externalSelection) return;
    const nextScope = externalSelection.scope;
    const nextRw = externalSelection.rwCode || rwGroups[0]?.rwCode || 'RW 01';
    const foundRw = rwGroups.find((g) => g.rwCode === nextRw) || rwGroups[0];
    const nextRt =
      externalSelection.rtCode || foundRw?.rtList?.[0]?.rtCode || 'RT 01';
    const nextDocNum = buildDocNumber(nextScope, nextRw, nextRt);

    setScope(nextScope);
    setSelectedRwCode(nextRw);
    setSelectedRtCode(nextRt);
    setDocumentNumber(nextDocNum);

    if (externalSelection.autoAction === 'preview') {
      setShowPreview(true);
    } else if (externalSelection.autoAction === 'print') {
      setShowPreview(true);
      const res = printRtRwReportDirect({
        scope: nextScope,
        selectedRwCode: nextRw,
        selectedRtCode: nextRt,
        documentNumber: nextDocNum,
        includeCitizenReports,
        officialNote,
        profile,
        rwGroups,
        reports,
      });
      setLastResult(res);
      onReportPrintedOrExported?.(res, 'PRINT');
    } else if (externalSelection.autoAction === 'pdf') {
      const res = generateRtRwReportPdf({
        scope: nextScope,
        selectedRwCode: nextRw,
        selectedRtCode: nextRt,
        documentNumber: nextDocNum,
        includeCitizenReports,
        officialNote,
        profile,
        rwGroups,
        reports,
      });
      setLastResult(res);
      onReportPrintedOrExported?.(res, 'PDF');
    }
  }, [externalSelection]);

  const handlePrintNow = () => {
    const res = printRtRwReportDirect({
      scope,
      selectedRwCode: currentRw?.rwCode || selectedRwCode,
      selectedRtCode: currentRt?.rtCode || selectedRtCode,
      documentNumber: documentNumber.trim() || '148 / LAP-RTRW / KEL-PNK / X / 2026',
      includeCitizenReports,
      officialNote: officialNote.trim(),
      profile,
      rwGroups,
      reports,
    });
    setLastResult(res);
    onReportPrintedOrExported?.(res, 'PRINT');
  };

  const handleDownloadPdf = () => {
    const res = generateRtRwReportPdf({
      scope,
      selectedRwCode: currentRw?.rwCode || selectedRwCode,
      selectedRtCode: currentRt?.rtCode || selectedRtCode,
      documentNumber: documentNumber.trim() || '148 / LAP-RTRW / KEL-PNK / X / 2026',
      includeCitizenReports,
      officialNote: officialNote.trim(),
      profile,
      rwGroups,
      reports,
    });
    setLastResult(res);
    onReportPrintedOrExported?.(res, 'PDF');
  };

  const matchedReportsForSelection = useMemo(() => {
    if (!currentRw) return [];
    if (scope === 'per_rt' && currentRt) {
      return reports.filter(
        (r) =>
          r.rw.trim().toLowerCase() === currentRw.rwCode.trim().toLowerCase() &&
          r.rt.trim().toLowerCase() === currentRt.rtCode.trim().toLowerCase()
      );
    }
    if (scope === 'per_rw') {
      return reports.filter(
        (r) => r.rw.trim().toLowerCase() === currentRw.rwCode.trim().toLowerCase()
      );
    }
    return reports;
  }, [reports, scope, currentRw, currentRt]);

  const rwTotalKk = useMemo(
    () =>
      (currentRw?.rtList || []).reduce(
        (sum, rt) => sum + (Number(rt.householdsCount) || 0),
        0
      ),
    [currentRw]
  );

  const allTotalRt = useMemo(
    () => rwGroups.reduce((acc, g) => acc + (g.rtList?.length || 0), 0),
    [rwGroups]
  );

  const allTotalKk = useMemo(
    () =>
      rwGroups.reduce(
        (acc, g) =>
          acc +
          (g.rtList || []).reduce(
            (sum, rt) => sum + (Number(rt.householdsCount) || 0),
            0
          ),
        0
      ),
    [rwGroups]
  );

  return (
    <div
      id="admin-rtrw-print-menu"
      className="bg-white rounded-2xl border-2 border-[#0D3868]/20 p-5 sm:p-6 space-y-5 shadow-xs"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0D3868] text-white flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-extrabold text-[#1C8237] uppercase tracking-wider">
                MENU CETAK LAPORAN DATA RT & RW
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="text-slate-500">
                Cetak Laporan Per RW, Laporan Per RT, & Rekapitulasi Kelurahan (Format A4 Resmi)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868] mt-0.5">
              Cetak & Unduh Laporan Resmi Data RT/RW (Per RW & Per RT)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Pilih mode cetak <strong>Per RW</strong> atau <strong>Per RT</strong> di bawah ini
              untuk mencetak maupun mengunduh dokumen PDF resmi lengkap dengan Nama Ketua RT/RW,
              Nomor Telepon, Alamat Cakupan Wilayah, Jumlah KK, serta Kop Surat Kelurahan Panaikang.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? 'Tutup Pratinjau' : 'Pratinjau Laporan'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintNow}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {scope === 'per_rt'
                ? `Cetak Laporan ${currentRt?.rtCode || ''} / ${currentRw?.rwCode || ''}`
                : scope === 'per_rw'
                ? `Cetak Laporan ${currentRw?.rwCode || ''}`
                : 'Cetak Seluruh RW & RT'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-emerald-300" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs: Per RW | Per RT | Seluruh RW & RT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleScopeChange('per_rw')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            scope === 'per_rw'
              ? 'bg-[#0D3868] text-white border-[#0D3868] shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <Building2
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              scope === 'per_rw' ? 'text-emerald-300' : 'text-[#0D3868]'
            }`}
          />
          <div>
            <div className="text-xs sm:text-sm font-extrabold">1. Cetak Laporan Per RW</div>
            <div
              className={`text-[11px] mt-0.5 ${
                scope === 'per_rw' ? 'text-sky-100' : 'text-slate-500'
              }`}
            >
              Data Ketua RW + Tabel seluruh RT di bawah RW terpilih ({currentRw?.rwCode})
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleScopeChange('per_rt')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            scope === 'per_rt'
              ? 'bg-[#1C8237] text-white border-[#1C8237] shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <Users
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              scope === 'per_rt' ? 'text-amber-200' : 'text-[#1C8237]'
            }`}
          />
          <div>
            <div className="text-xs sm:text-sm font-extrabold">2. Cetak Laporan Per RT</div>
            <div
              className={`text-[11px] mt-0.5 ${
                scope === 'per_rt' ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              Lembar profil spesifik 1 unit RT ({currentRt?.rtCode} / {currentRw?.rwCode})
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleScopeChange('semua_rtrw')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            scope === 'semua_rtrw'
              ? 'bg-[#0277BD] text-white border-[#0277BD] shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <FileText
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              scope === 'semua_rtrw' ? 'text-amber-200' : 'text-[#0277BD]'
            }`}
          />
          <div>
            <div className="text-xs sm:text-sm font-extrabold">
              3. Rekapitulasi Seluruh RW & RT
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                scope === 'semua_rtrw' ? 'text-sky-100' : 'text-slate-500'
              }`}
            >
              Seluruh {rwGroups.length} Wilayah RW & {allTotalRt} Unit RT se-Kelurahan
            </div>
          </div>
        </button>
      </div>

      {/* Filter Controls: Pilih RW, Pilih RT (bila mode Per RT), Nomor Surat, dan Opsi */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pilih RW */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Wilayah RW {scope === 'semua_rtrw' ? '(Mode Semua RW Aktif)' : '*'}
            </label>
            <select
              value={selectedRwCode}
              disabled={scope === 'semua_rtrw'}
              onChange={(e) => handleRwSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#0D3868] disabled:opacity-50"
            >
              {rwGroups.map((rw) => (
                <option key={rw.id} value={rw.rwCode}>
                  {rw.rwCode} — {rw.ketuaRwName} ({rw.rtList?.length || 0} RT)
                </option>
              ))}
            </select>
          </div>

          {/* Pilih RT (Aktif pada mode Per RT, atau klik cepat untuk pindah ke Per RT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Unit RT pada {currentRw?.rwCode || 'RW'} {scope === 'per_rt' ? '*' : '(Khusus Per RT)'}
            </label>
            <select
              value={selectedRtCode}
              disabled={scope !== 'per_rt'}
              onChange={(e) => handleRtSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#1C8237] disabled:opacity-50"
            >
              {currentRtList.map((rt) => (
                <option key={rt.id} value={rt.rtCode}>
                  {rt.rtCode} — {rt.ketuaRtName} ({rt.areaDescription})
                </option>
              ))}
            </select>
          </div>

          {/* Nomor Dokumen */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Surat / Dokumen Laporan
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-mono-num text-slate-800"
            />
          </div>

          {/* Opsi Lampirkan Laporan Warga */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeCitizenReports}
                onChange={(e) => setIncludeCitizenReports(e.target.checked)}
                className="rounded text-[#0D3868] focus:ring-[#0D3868]"
              />
              <span>Sertakan Rekap Laporan Warga ({matchedReportsForSelection.length})</span>
            </label>
          </div>
        </div>

        {/* Quick Pill Selector for RW & RT */}
        {scope !== 'semua_rtrw' && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                Pilih Cepat RW:
              </span>
              {rwGroups.map((rw) => (
                <button
                  key={rw.id}
                  type="button"
                  onClick={() => handleRwSelect(rw.rwCode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedRwCode === rw.rwCode
                      ? 'bg-[#0D3868] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {rw.rwCode} ({rw.rtList?.length || 0} RT)
                </button>
              ))}
            </div>

            {currentRtList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">
                  {scope === 'per_rt'
                    ? `Pilih Cepat RT di ${currentRw?.rwCode}:`
                    : `Klik RT untuk Cetak Per RT di ${currentRw?.rwCode}:`}
                </span>
                {currentRtList.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => {
                      if (scope !== 'per_rt') {
                        setScope('per_rt');
                        setSelectedRtCode(rt.rtCode);
                        setDocumentNumber(
                          buildDocNumber('per_rt', selectedRwCode, rt.rtCode)
                        );
                      } else {
                        handleRtSelect(rt.rtCode);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      scope === 'per_rt' && selectedRtCode === rt.rtCode
                        ? 'bg-[#1C8237] text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    {rt.rtCode} · {rt.ketuaRtName.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Target Summary Banner */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {scope === 'per_rt' && currentRw && currentRt ? (
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#1C8237]">
                Target Cetak Per RT: {currentRt.rtCode} / {currentRw.rwCode} — {currentRt.rtName}
              </div>
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Ketua RT: <strong>{currentRt.ketuaRtName}</strong>
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num">
                  <Phone className="w-3 h-3 text-amber-600" />
                  {currentRt.phone || '-'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  Cakupan: <strong>{currentRt.areaDescription}</strong>
                </span>
                <span className="font-mono-num font-bold text-slate-800">
                  {currentRt.householdsCount} KK
                </span>
              </div>
            </div>
          ) : scope === 'per_rw' && currentRw ? (
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#0D3868]">
                Target Cetak Per RW: {currentRw.rwCode} — {currentRw.rwName}
              </div>
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Ketua RW: <strong>{currentRw.ketuaRwName}</strong>
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num">
                  <Phone className="w-3 h-3 text-amber-600" />
                  {currentRw.phone || '-'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  Cakupan: <strong>{currentRw.areaDescription}</strong>
                </span>
                <span className="font-mono-num font-bold text-[#1C8237]">
                  {currentRw.rtList?.length || 0} Unit RT ({rwTotalKk} KK)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#0277BD]">
                Target Cetak Rekapitulasi Lengkap: Seluruh Wilayah Kelurahan Panaikang
              </div>
              <div className="text-xs text-slate-600">
                Mencakup <strong>{rwGroups.length} Wilayah RW</strong>,{' '}
                <strong>{allTotalRt} Unit RT</strong>, dan{' '}
                <strong>{allTotalKk.toLocaleString('id-ID')} Kepala Keluarga (KK)</strong>.
              </div>
            </div>
          )}

          {lastResult && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Terakhir diproses: {lastResult.generatedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Document Preview Sheet (A4 Style) */}
      {showPreview && (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-5 text-slate-900">
            {/* Kop Surat Resmi dengan Logo Kota Makassar (Kiri Atas) & Logo Kelurahan Panaikang (Kanan Atas) */}
            {(() => {
              const kopSpec = getKopSuratSizeSpec(getPresetForRtRwScope(scope));
              return (
                <div className="flex items-center justify-between gap-3 sm:gap-5 border-b-2 border-[#0D3868] pb-4">
                  <div className="shrink-0 flex items-center justify-center">
                    <EmblemKotaMakassar className={`${kopSpec.previewLogoClass} shrink-0`} />
                  </div>
                  <div className="text-center flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0D3868]">
                      PEMERINTAH KOTA MAKASSAR
                    </div>
                    <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0D3868] mt-0.5">
                      KECAMATAN PANAKKUKANG
                    </div>
                    <div
                      className={`font-extrabold uppercase text-[#0D3868] mt-0.5 ${
                        scope === 'per_rt'
                          ? 'text-lg sm:text-2xl'
                          : scope === 'per_rw'
                          ? 'text-base sm:text-xl'
                          : 'text-sm sm:text-lg'
                      }`}
                    >
                      KELURAHAN PANAIKANG
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {profile.officeAddress} · Telp: {profile.phoneContact} · Kode Pos{' '}
                      {profile.postalCode}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <EmblemKelurahanPanaikang className={`${kopSpec.previewLogoClass} shrink-0`} />
                  </div>
                </div>
              );
            })()}

            {/* Judul Laporan */}
            <div className="text-center">
              <div className="text-sm sm:text-base font-extrabold text-[#0D3868] underline uppercase">
                {scope === 'per_rt' && currentRw && currentRt
                  ? `LAPORAN DATA PENGURUS & WILAYAH ${currentRt.rtCode} / ${currentRw.rwCode}`
                  : scope === 'per_rw' && currentRw
                  ? `LAPORAN DATA PENGURUS & WILAYAH ${currentRw.rwCode}`
                  : 'LAPORAN REKAPITULASI DATA RT DAN RW KELURAHAN PANAIKANG'}
              </div>
              <div className="text-xs text-slate-500 font-mono-num mt-1">
                Nomor Dokumen: {documentNumber}
              </div>
            </div>

            {/* Isi Pratinjau Sesuai Mode */}
            {scope === 'per_rt' && currentRw && currentRt && (
              <div className="space-y-4">
                <div className="text-xs font-extrabold uppercase text-[#0D3868]">
                  I. Identitas Pengurus & Cakupan Wilayah {currentRt.rtCode} / {currentRw.rwCode}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold w-1/3 border-r border-slate-300">
                          Kode & Nama Unit RT
                        </td>
                        <td className="py-2 px-3 font-bold text-[#0D3868]">
                          {currentRt.rtCode} — {currentRt.rtName}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Nama Ketua RT
                        </td>
                        <td className="py-2 px-3 font-bold">{currentRt.ketuaRtName}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Nomor Telepon / HP Ketua RT
                        </td>
                        <td className="py-2 px-3 font-mono-num">{currentRt.phone || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Cakupan Wilayah / Alamat RT
                        </td>
                        <td className="py-2 px-3 font-semibold text-emerald-800">
                          {currentRt.areaDescription}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Jumlah Kepala Keluarga (KK)
                        </td>
                        <td className="py-2 px-3 font-mono-num font-bold">
                          {currentRt.householdsCount} KK
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Wilayah Induk RW & Ketua RW
                        </td>
                        <td className="py-2 px-3">
                          <strong>{currentRw.rwCode}</strong> — Ketua RW:{' '}
                          <strong>{currentRw.ketuaRwName}</strong> ({currentRw.phone || '-'})
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold border-r border-slate-300">
                          Cakupan Wilayah / Alamat RW
                        </td>
                        <td className="py-2 px-3">{currentRw.areaDescription}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scope === 'per_rw' && currentRw && (
              <div className="space-y-4">
                <div className="text-xs font-extrabold uppercase text-[#0D3868]">
                  I. Identitas Pengurus {currentRw.rwCode} & Daftar {currentRw.rtList?.length || 0} Unit RT
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Wilayah RW:</span>{' '}
                    <strong>{currentRw.rwName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Ketua RW:</span>{' '}
                    <strong>{currentRw.ketuaRwName}</strong> ({currentRw.phone || '-'})
                  </div>
                  <div>
                    <span className="text-slate-500">Cakupan Wilayah RW:</span>{' '}
                    <strong>{currentRw.areaDescription}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total RT & KK:</span>{' '}
                    <strong>
                      {currentRw.rtList?.length || 0} RT ({rwTotalKk} KK)
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-[#0D3868] text-white">
                        <th className="py-2 px-2.5 text-left border border-[#0D3868]">No</th>
                        <th className="py-2 px-2.5 text-left border border-[#0D3868]">Kode RT</th>
                        <th className="py-2 px-2.5 text-left border border-[#0D3868]">
                          Nama Ketua RT
                        </th>
                        <th className="py-2 px-2.5 text-left border border-[#0D3868]">
                          Nomor Telepon / HP
                        </th>
                        <th className="py-2 px-2.5 text-left border border-[#0D3868]">
                          Cakupan Wilayah / Alamat RT
                        </th>
                        <th className="py-2 px-2.5 text-right border border-[#0D3868]">
                          Jumlah KK
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentRw.rtList || []).map((rt, idx) => (
                        <tr key={rt.id} className="border-b border-slate-200">
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 font-bold text-[#1C8237] border-r border-slate-200">
                            {rt.rtCode}
                          </td>
                          <td className="py-1.5 px-2.5 font-semibold border-r border-slate-200">
                            {rt.ketuaRtName}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono-num border-r border-slate-200">
                            {rt.phone || '-'}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">
                            {rt.areaDescription}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono-num">
                            {rt.householdsCount} KK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scope === 'semua_rtrw' && (
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase text-[#0D3868]">
                  Rekapitulasi {rwGroups.length} Wilayah RW & {allTotalRt} Unit RT Kelurahan Panaikang
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-[#0D3868] text-white">
                        <th className="py-2 px-2.5 text-left">Kode RW</th>
                        <th className="py-2 px-2.5 text-left">Nama Ketua RW</th>
                        <th className="py-2 px-2.5 text-left">No. Telepon</th>
                        <th className="py-2 px-2.5 text-left">Cakupan Wilayah / Alamat RW</th>
                        <th className="py-2 px-2.5 text-center">Jumlah RT</th>
                        <th className="py-2 px-2.5 text-right">Total KK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rwGroups.map((rw) => {
                        const kk = (rw.rtList || []).reduce(
                          (s, r) => s + (Number(r.householdsCount) || 0),
                          0
                        );
                        return (
                          <tr key={rw.id} className="border-b border-slate-200">
                            <td className="py-1.5 px-2.5 font-bold text-[#0D3868]">{rw.rwCode}</td>
                            <td className="py-1.5 px-2.5 font-semibold">{rw.ketuaRwName}</td>
                            <td className="py-1.5 px-2.5 font-mono-num">{rw.phone || '-'}</td>
                            <td className="py-1.5 px-2.5">{rw.areaDescription}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold text-[#1C8237]">
                              {rw.rtList?.length || 0} RT
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono-num">{kk} KK</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signature Footer in Preview */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center">
              <div>
                <div className="text-slate-500">Mengetahui Pengurus Wilayah,</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {scope === 'per_rt' && currentRt && currentRw
                    ? `KETUA ${currentRt.rtCode} / ${currentRw.rwCode}`
                    : scope === 'per_rw' && currentRw
                    ? `KETUA ${currentRw.rwCode}`
                    : 'SEKRETARIS KELURAHAN'}
                </div>
                <div className="font-bold text-[#0D3868] underline mt-8">
                  {scope === 'per_rt' && currentRt
                    ? currentRt.ketuaRtName
                    : scope === 'per_rw' && currentRw
                    ? currentRw.ketuaRwName
                    : profile.sekretarisName}
                </div>
              </div>

              <div>
                <div className="text-slate-500">Mengesahkan,</div>
                <div className="font-bold text-slate-900 mt-0.5">LURAH PANAIKANG</div>
                <div className="font-bold text-[#0D3868] underline mt-8">{profile.lurahName}</div>
                <div className="text-[11px] text-slate-500 font-mono-num">
                  NIP. {profile.lurahNip}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
