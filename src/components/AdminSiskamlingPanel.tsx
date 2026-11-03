import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Calendar,
  Printer,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Users,
  Search,
  X,
  FileText,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SiskamlingRwSchedule, SiskamlingDay, RwGroup, KelurahanProfile } from '../types';
import {
  SISKAMLING_DAYS,
  INITIAL_SISKAMLING_SCHEDULES,
  getTodaySiskamlingDay,
  POSKO_SISKAMLING_COORDINATES,
} from '../data/siskamlingData';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface AdminSiskamlingPanelProps {
  schedules?: SiskamlingRwSchedule[];
  rwGroups: RwGroup[];
  profile: KelurahanProfile;
  adminOfficerName?: string;
  onSaveSchedules?: (
    updated: SiskamlingRwSchedule[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
}

export const AdminSiskamlingPanel: React.FC<AdminSiskamlingPanelProps> = ({
  schedules = INITIAL_SISKAMLING_SCHEDULES,
  rwGroups,
  profile,
  adminOfficerName = 'Admin Siskamling Kelurahan',
  onSaveSchedules,
}) => {
  const currentSchedules = useMemo(() => {
    return Array.isArray(schedules) && schedules.length > 0
      ? schedules
      : INITIAL_SISKAMLING_SCHEDULES;
  }, [schedules]);

  const [activeRwFilter, setActiveRwFilter] = useState<string>('ALL');
  const [editingRwSchedule, setEditingRwSchedule] = useState<SiskamlingRwSchedule | null>(null);
  const [editDay, setEditDay] = useState<SiskamlingDay>('Senin');
  const [dayOfficersInput, setDayOfficersInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [searchOfficerQuery, setSearchOfficerQuery] = useState<string>('');

  const today = getTodaySiskamlingDay();

  // Suggestion list from existing RT & RW database
  const suggestedOfficers = useMemo(() => {
    const list: { name: string; role: string; rw: string }[] = [];
    rwGroups.forEach((rw) => {
      if (rw.ketuaRwName && rw.ketuaRwName.trim()) {
        list.push({
          name: rw.ketuaRwName.trim().toUpperCase(),
          role: `Ketua ${rw.rwCode}`,
          rw: rw.rwCode,
        });
      }
      if (Array.isArray(rw.rtList)) {
        rw.rtList.forEach((rt) => {
          if (rt.ketuaRtName && rt.ketuaRtName.trim()) {
            list.push({
              name: rt.ketuaRtName.trim().toUpperCase(),
              role: `Ketua ${rt.rtCode} (${rw.rwCode})`,
              rw: rw.rwCode,
            });
          }
        });
      }
    });
    return list;
  }, [rwGroups]);

  // Open edit modal for a specific RW
  const handleOpenEdit = (item: SiskamlingRwSchedule) => {
    setEditingRwSchedule({ ...item });
    setEditDay('Senin');
    setDayOfficersInput((item.schedules['Senin'] || []).join('\n'));
    setFeedbackMsg('');
    setErrorList([]);
  };

  // Switch edited day in modal
  const handleSwitchEditDay = (day: SiskamlingDay) => {
    if (!editingRwSchedule) return;
    // Save current textarea to editing state before switching
    const currentLines = dayOfficersInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedSchedules = {
      ...editingRwSchedule.schedules,
      [editDay]: currentLines,
    };

    setEditingRwSchedule({
      ...editingRwSchedule,
      schedules: updatedSchedules,
    });

    setEditDay(day);
    setDayOfficersInput((updatedSchedules[day] || []).join('\n'));
  };

  // Quick insert suggested officer into textarea
  const handleAddSuggestedOfficer = (name: string) => {
    const currentLines = dayOfficersInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentLines.includes(name)) {
      currentLines.push(name);
      setDayOfficersInput(currentLines.join('\n'));
    }
  };

  // Save changes to database
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRwSchedule || !onSaveSchedules) return;

    const currentLines = dayOfficersInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const finalizedSchedule: SiskamlingRwSchedule = {
      ...editingRwSchedule,
      schedules: {
        ...editingRwSchedule.schedules,
        [editDay]: currentLines.length > 0 ? currentLines : ['SELURUH RT/RW'],
      },
    };

    const nextList = currentSchedules.map((item) =>
      item.rw === finalizedSchedule.rw ? finalizedSchedule : item
    );

    setIsSaving(true);
    const res = await onSaveSchedules(nextList);
    setIsSaving(false);

    if (res.ok) {
      setEditingRwSchedule(null);
      setFeedbackMsg(`Jadwal Siskamling ${finalizedSchedule.rw} berhasil diperbarui.`);
    } else {
      setErrorList(res.errors || ['Gagal menyimpan perubahan jadwal Siskamling.']);
    }
  };

  // Reset to default transcribed matrix
  const handleResetToDefault = async () => {
    if (!onSaveSchedules) return;
    if (
      !window.confirm(
        'Kembalikan seluruh susunan jadwal Siskamling RW 01 s/d RW 07 ke format resmi SK Kelurahan Panaikang?'
      )
    ) {
      return;
    }
    setIsSaving(true);
    const res = await onSaveSchedules(INITIAL_SISKAMLING_SCHEDULES);
    setIsSaving(false);
    if (res.ok) {
      setFeedbackMsg('Jadwal Siskamling berhasil dikembalikan ke format matriks resmi Kelurahan.');
    }
  };

  // Print official document matching the government roster format
  const handlePrintOfficialRoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = currentSchedules
      .map((item, idx) => {
        const no = idx + 1;
        const ketuaName = item.schedules['Senin']?.[0] || 'KETUA RW';
        const rwLabel = item.rw.replace('RW ', 'RW 00');
        const jabatan = `KETUA ${rwLabel}`;

        const renderDayCell = (day: SiskamlingDay) => {
          const officers = item.schedules[day] || [];
          if (officers.length === 0) return '-';
          return officers
            .map((name, i) => `${i + 1}. ${name}`)
            .join('<br/>');
        };

        return `
          <tr>
            <td style="text-align: center; vertical-align: top; padding: 6px; font-weight: bold;">${no}</td>
            <td style="text-align: center; vertical-align: top; padding: 6px; font-weight: bold; white-space: nowrap;">${item.rw}</td>
            <td style="vertical-align: top; padding: 6px; font-weight: bold; text-transform: uppercase;">${ketuaName}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${jabatan}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Senin')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Selasa')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Rabu')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Kamis')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Jumat')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px;">${renderDayCell('Sabtu')}</td>
            <td style="vertical-align: top; padding: 6px; font-size: 11px; font-weight: bold; text-align: center;">${renderDayCell('Minggu')}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Daftar Siskamling RW 01 s/d RW 07 Kelurahan Panaikang</title>
        <style>
          @page { size: landscape; margin: 15mm 12mm 15mm 12mm; }
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 10px; color: #000; }
          .header-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          th, td { border: 1.5px solid #000; padding: 5px 6px; }
          th { background-color: #f2f2f2; text-align: center; vertical-align: middle; font-weight: bold; text-transform: uppercase; }
          .signature-section { margin-top: 30px; display: flex; justify-content: flex-end; }
          .signature-box { width: 280px; text-align: center; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="header-title">
          DAFTAR SISKAMLING RW 01 S/D RW 07 KELURAHAN PANAIKANG
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 30px;">NO</th>
              <th rowspan="2" style="width: 60px;">NAMA RW</th>
              <th rowspan="2" style="width: 140px;">NAMA</th>
              <th rowspan="2" style="width: 110px;">JABATAN</th>
              <th colspan="7">HARI</th>
            </tr>
            <tr>
              <th style="width: 120px;">SENIN</th>
              <th style="width: 120px;">SELASA</th>
              <th style="width: 120px;">RABU</th>
              <th style="width: 120px;">KAMIS</th>
              <th style="width: 120px;">JUMAT</th>
              <th style="width: 120px;">SABTU</th>
              <th style="width: 110px;">MINGGU</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <div>Panaikang, Makassar</div>
            <div style="font-weight: bold; margin-top: 4px;">LURAH PANAIKANG</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; text-decoration: underline;">${profile.lurahName}</div>
            <div>Pangkat: ${profile.lurahRank || 'Penata Tk. I'}</div>
            <div>NIP. ${profile.lurahNip || '19750812 200212 1 004'}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filter schedules if specific RW selected
  const filteredList = useMemo(() => {
    if (activeRwFilter === 'ALL') return currentSchedules;
    return currentSchedules.filter((s) => s.rw === activeRwFilter);
  }, [currentSchedules, activeRwFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] px-5 sm:px-7 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>🛡️ SISTEM KEAMANAN LINGKUNGAN (SISKAMLING) TERPADU</span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-white">
                Daftar Siskamling RW 01 s/d RW 07 Kelurahan Panaikang
              </h2>
              <p className="mt-0.5 text-xs text-sky-100 max-w-2xl leading-relaxed">
                Matriks penugasan ronda malam dan pengamanan wilayah Senin s/d Minggu untuk seluruh
                7 RW, terhubung langsung dengan nama Ketua RW & RT, serta pratinjau peta digital.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintOfficialRoster}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Matriks Roster (A4 Landscape)</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              title="Kembalikan nama ke format default dari SK Kelurahan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar SK</span>
            </button>
          </div>
        </div>

        {/* Status Bar: Hari Aktif & Filter RW */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Piket Hari Ini:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>{today} (Malam Ini)</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">
              · 7 Posko RW Siaga 24 Jam
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 font-medium">Filter RW:</span>
            <button
              type="button"
              onClick={() => setActiveRwFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeRwFilter === 'ALL'
                  ? 'bg-[#0D3868] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua (RW 01–07)
            </button>
            {currentSchedules.map((item) => (
              <button
                key={item.rw}
                type="button"
                onClick={() => setActiveRwFilter(item.rw)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeRwFilter === item.rw
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.rw}
              </button>
            ))}
          </div>
        </div>

        {feedbackMsg && (
          <div className="mx-5 sm:mx-7 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg('')}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorList.length > 0 && (
          <div className="mx-5 sm:mx-7 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            {errorList.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}

        {/* Government Official Layout Table */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase text-[11px] font-extrabold tracking-wider">
                  <th rowSpan={2} className="py-3 px-3 border-r border-slate-300 text-center w-12">
                    NO
                  </th>
                  <th rowSpan={2} className="py-3 px-3 border-r border-slate-300 text-center w-24">
                    NAMA RW
                  </th>
                  <th rowSpan={2} className="py-3 px-4 border-r border-slate-300 min-w-[150px]">
                    NAMA KETUA
                  </th>
                  <th rowSpan={2} className="py-3 px-3 border-r border-slate-300 text-center w-24">
                    JABATAN
                  </th>
                  <th colSpan={7} className="py-2 px-3 border-r border-slate-300 text-center bg-slate-200 text-[#0D3868]">
                    JADWAL PENUGASAN (HARI)
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center w-20">
                    AKSI
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 font-bold text-[10px]">
                  {SISKAMLING_DAYS.map((day) => (
                    <th
                      key={day}
                      className={`py-2 px-2 border-r border-slate-300 text-center min-w-[110px] ${
                        day === today ? 'bg-emerald-100/70 text-emerald-900 font-extrabold' : ''
                      }`}
                    >
                      {day.toUpperCase()} {day === today ? '★' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredList.map((item, idx) => {
                  const no = idx + 1;
                  const ketuaName = item.schedules['Senin']?.[0] || 'KETUA RW';
                  const rwLabel = item.rw.replace('RW ', 'RW 00');

                  return (
                    <tr
                      key={item.rw}
                      className="hover:bg-sky-50/40 transition-colors align-top"
                    >
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-bold font-mono-num text-slate-600">
                        {no}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-extrabold text-[#0D3868] whitespace-nowrap">
                        <div className="bg-sky-100 text-[#0D3868] px-2 py-1 rounded-md text-[11px]">
                          {item.rw}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500 font-normal">
                          {(item.rwName || '').split('&')[0]}
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 text-xs uppercase">
                          {ketuaName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {item.poskoLocation}
                        </div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          KETUA {rwLabel}
                        </span>
                      </td>

                      {/* 7 Days Columns */}
                      {SISKAMLING_DAYS.map((day) => {
                        const officers = item.schedules[day] || [];
                        const isSunday = day === 'Minggu';
                        const isCurrentDay = day === today;

                        return (
                          <td
                            key={day}
                            className={`py-2.5 px-2.5 border-r border-slate-200 text-[11px] leading-snug ${
                              isCurrentDay ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            {isSunday ? (
                              <div className="font-bold text-amber-800 bg-amber-50 px-2 py-1.5 rounded border border-amber-200 text-center text-[10px]">
                                {officers.join(', ')}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {officers.map((officer, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`truncate ${
                                      oIdx === 0
                                        ? 'font-bold text-slate-900'
                                        : 'text-slate-600'
                                    }`}
                                    title={officer}
                                  >
                                    <span className="text-[9px] font-mono-num text-slate-400 mr-1">
                                      {oIdx + 1}.
                                    </span>
                                    <span>{officer}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0277BD] border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Roster Siskamling */}
      {editingRwSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-[#0D3868] to-[#0277BD] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold">
                  Edit Petugas Siskamling {editingRwSchedule.rw} ({editingRwSchedule.rwName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRwSchedule(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              {/* Posko Location & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Posko Siskamling
                  </label>
                  <input
                    type="text"
                    value={editingRwSchedule.poskoLocation}
                    onChange={(e) =>
                      setEditingRwSchedule({
                        ...editingRwSchedule,
                        poskoLocation: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Area Pengawasan
                  </label>
                  <input
                    type="text"
                    value={editingRwSchedule.notes || ''}
                    onChange={(e) =>
                      setEditingRwSchedule({
                        ...editingRwSchedule,
                        notes: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Day Selector for Editing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Hari yang Diedit:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SISKAMLING_DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSwitchEditDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        editDay === d
                          ? 'bg-[#0D3868] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {d} {d === today ? '(Hari Ini)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for officers on that day */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Daftar Nama Petugas Piket Hari {editDay} (Satu nama per baris):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Urutan 1 = Koordinator / Ketua Regu
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={dayOfficersInput}
                  onChange={(e) => setDayOfficersInput(e.target.value)}
                  placeholder="Contoh:&#10;EDWIN BURHANUDDIN&#10;SYAMSUL BAHRI&#10;IVAN RUDI"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold leading-relaxed focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Suggested officers from RT/RW Data */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-[#0D3868] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Usulan Tokoh & Pengurus RT/RW {editingRwSchedule.rw}:</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Klik untuk menambahkan ke daftar</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {suggestedOfficers
                    .filter((s) => s.rw === editingRwSchedule.rw || s.rw === editingRwSchedule.rw.replace('RW ', 'RW 0'))
                    .map((s, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleAddSuggestedOfficer(s.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-slate-800 text-[11px] font-bold hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-sky-600" />
                        <span>{s.name} ({s.role})</span>
                      </button>
                    ))}
                  {suggestedOfficers.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">
                      Belum ada data Ketua RT/RW yang tersimpan untuk RW ini.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRwSchedule(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Jadwal Siskamling'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiskamlingPanel;
