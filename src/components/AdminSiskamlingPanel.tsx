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

// Helper to safely normalize officer lists into clean string arrays
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

export const AdminSiskamlingPanel: React.FC<AdminSiskamlingPanelProps> = ({
  schedules = INITIAL_SISKAMLING_SCHEDULES,
  rwGroups = [],
  profile,
  adminOfficerName = 'Admin Siskamling Kelurahan',
  onSaveSchedules,
}) => {
  const currentSchedules = useMemo(() => {
    const rawList =
      Array.isArray(schedules) && schedules.length > 0
        ? schedules
        : INITIAL_SISKAMLING_SCHEDULES;

    return rawList.map((item, idx) => {
      const schedObj =
        item && typeof item === 'object' && item.schedules && typeof item.schedules === 'object'
          ? item.schedules
          : ({} as Record<SiskamlingDay, string[]>);

      return {
        ...item,
        rw: item?.rw || `RW ${idx + 1}`,
        rwName: item?.rwName || '',
        poskoLocation: item?.poskoLocation || '',
        notes: item?.notes || '',
        schedules: {
          Senin: toOfficerArray(schedObj?.Senin),
          Selasa: toOfficerArray(schedObj?.Selasa),
          Rabu: toOfficerArray(schedObj?.Rabu),
          Kamis: toOfficerArray(schedObj?.Kamis),
          Jumat: toOfficerArray(schedObj?.Jumat),
          Sabtu: toOfficerArray(schedObj?.Sabtu),
          Minggu:
            toOfficerArray(schedObj?.Minggu).length > 0
              ? toOfficerArray(schedObj?.Minggu)
              : [`SELURUH RT/RW 00${idx + 1}`],
        },
      };
    });
  }, [schedules]);

  const [activeRwFilter, setActiveRwFilter] = useState<string>('ALL');
  const [editingRwSchedule, setEditingRwSchedule] = useState<SiskamlingRwSchedule | null>(null);
  const [editDay, setEditDay] = useState<SiskamlingDay>('Senin');
  const [dayOfficersInput, setDayOfficersInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [searchOfficerQuery, setSearchOfficerQuery] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Posko Management States (Tambahkan, Edit, Simpan, Hapus Nama Posko di 7 RW)
  const [isPoskoModalOpen, setIsPoskoModalOpen] = useState<boolean>(false);
  const [editingPoskoRw, setEditingPoskoRw] = useState<{
    rw: string;
    rwName: string;
    poskoLocation: string;
    notes: string;
  } | null>(null);
  const [confirmDeletePoskoRw, setConfirmDeletePoskoRw] = useState<string | null>(null);
  const [poskoDrafts, setPoskoDrafts] = useState<Record<string, { poskoLocation: string; notes: string }>>({});

  const today = getTodaySiskamlingDay();

  // Open 7 RW Posko Manager Modal
  const handleOpenPoskoBatchModal = () => {
    const drafts: Record<string, { poskoLocation: string; notes: string }> = {};
    currentSchedules.forEach((s) => {
      drafts[s.rw] = {
        poskoLocation: s.poskoLocation || '',
        notes: s.notes || '',
      };
    });
    setPoskoDrafts(drafts);
    setIsPoskoModalOpen(true);
    setFeedbackMsg('');
    setErrorList([]);
  };

  // Open individual posko edit
  const handleOpenPoskoEdit = (item: SiskamlingRwSchedule) => {
    setEditingPoskoRw({
      rw: item.rw,
      rwName: item.rwName || '',
      poskoLocation: item.poskoLocation || '',
      notes: item.notes || '',
    });
    setFeedbackMsg('');
    setErrorList([]);
  };

  // Save single posko name / location
  const handleSaveSinglePosko = async (rwCode: string, newLocation: string, newNotes: string) => {
    if (!onSaveSchedules) return;
    setIsSaving(true);
    const nextList = currentSchedules.map((s) =>
      s.rw === rwCode
        ? {
            ...s,
            poskoLocation: newLocation.trim(),
            notes: newNotes.trim(),
          }
        : s
    );
    const res = await onSaveSchedules(nextList);
    setIsSaving(false);
    if (res.ok) {
      setFeedbackMsg(`Nama Posko Siskamling ${rwCode} berhasil disimpan: "${newLocation.trim() || 'Posko Siskamling'}"`);
      setEditingPoskoRw(null);
      setPoskoDrafts((prev) => ({
        ...prev,
        [rwCode]: { poskoLocation: newLocation.trim(), notes: newNotes.trim() },
      }));
    } else {
      setErrorList(res.errors || ['Gagal menyimpan nama posko siskamling.']);
    }
  };

  // Delete posko name (mengosongkan / menghapus nama posko)
  const handleDeletePosko = async (rwCode: string) => {
    if (!onSaveSchedules) return;
    setIsSaving(true);
    const nextList = currentSchedules.map((s) =>
      s.rw === rwCode
        ? {
            ...s,
            poskoLocation: '',
            notes: '',
          }
        : s
    );
    const res = await onSaveSchedules(nextList);
    setIsSaving(false);
    setConfirmDeletePoskoRw(null);
    if (res.ok) {
      setFeedbackMsg(`Nama Posko Siskamling ${rwCode} berhasil dihapus/dikosongkan.`);
      if (editingPoskoRw?.rw === rwCode) {
        setEditingPoskoRw(null);
      }
      setPoskoDrafts((prev) => ({
        ...prev,
        [rwCode]: { poskoLocation: '', notes: '' },
      }));
    } else {
      setErrorList(res.errors || ['Gagal menghapus nama posko siskamling.']);
    }
  };

  // Save all 7 RW Posko names in batch
  const handleSaveAllPoskoBatch = async () => {
    if (!onSaveSchedules) return;
    setIsSaving(true);
    const nextList = currentSchedules.map((s) => {
      const draft = poskoDrafts[s.rw];
      if (!draft) return s;
      return {
        ...s,
        poskoLocation: draft.poskoLocation.trim(),
        notes: draft.notes.trim(),
      };
    });
    const res = await onSaveSchedules(nextList);
    setIsSaving(false);
    if (res.ok) {
      setFeedbackMsg('Seluruh nama & lokasi Posko Siskamling di 7 RW berhasil disimpan permanen.');
      setIsPoskoModalOpen(false);
    } else {
      setErrorList(res.errors || ['Gagal menyimpan perubahan nama posko 7 RW.']);
    }
  };

  // Suggestion list from existing RT & RW database
  const suggestedOfficers = useMemo(() => {
    const list: { name: string; role: string; rw: string }[] = [];
    (rwGroups || []).forEach((rw) => {
      if (!rw) return;
      if (rw.ketuaRwName && rw.ketuaRwName.trim()) {
        list.push({
          name: rw.ketuaRwName.trim().toUpperCase(),
          role: `Ketua ${rw.rwCode || 'RW'}`,
          rw: rw.rwCode || '',
        });
      }
      if (Array.isArray(rw.rtList)) {
        rw.rtList.forEach((rt) => {
          if (!rt) return;
          if (rt.ketuaRtName && rt.ketuaRtName.trim()) {
            list.push({
              name: rt.ketuaRtName.trim().toUpperCase(),
              role: `Ketua ${rt.rtCode || 'RT'} (${rw.rwCode || 'RW'})`,
              rw: rw.rwCode || '',
            });
          }
        });
      }
    });
    return list;
  }, [rwGroups]);

  // Open edit modal for a specific RW
  const handleOpenEdit = (item: SiskamlingRwSchedule) => {
    const safeSchedules: Record<SiskamlingDay, string[]> = {
      Senin: Array.isArray(item?.schedules?.Senin) ? item.schedules.Senin : [],
      Selasa: Array.isArray(item?.schedules?.Selasa) ? item.schedules.Selasa : [],
      Rabu: Array.isArray(item?.schedules?.Rabu) ? item.schedules.Rabu : [],
      Kamis: Array.isArray(item?.schedules?.Kamis) ? item.schedules.Kamis : [],
      Jumat: Array.isArray(item?.schedules?.Jumat) ? item.schedules.Jumat : [],
      Sabtu: Array.isArray(item?.schedules?.Sabtu) ? item.schedules.Sabtu : [],
      Minggu: Array.isArray(item?.schedules?.Minggu) ? item.schedules.Minggu : [],
    };
    setEditingRwSchedule({
      ...item,
      rw: item.rw || 'RW 1',
      rwName: item.rwName || '',
      poskoLocation: item.poskoLocation || '',
      schedules: safeSchedules,
    });
    setEditDay('Senin');
    setDayOfficersInput((safeSchedules['Senin'] || []).join('\n'));
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

    const baseSchedules = editingRwSchedule.schedules || {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
      Sabtu: [],
      Minggu: [],
    };

    const updatedSchedules: Record<SiskamlingDay, string[]> = {
      ...baseSchedules,
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

  // Reset to default transcribed matrix with safe modal dialog
  const handleExecuteResetToDefault = async () => {
    if (!onSaveSchedules) return;
    setIsSaving(true);
    try {
      const res = await onSaveSchedules(INITIAL_SISKAMLING_SCHEDULES);
      setIsSaving(false);
      setShowResetModal(false);
      if (res && res.ok) {
        setFeedbackMsg('Jadwal Siskamling berhasil dikembalikan ke format matriks resmi Kelurahan.');
      } else {
        setErrorList(res?.errors || ['Gagal me-reset jadwal siskamling.']);
      }
    } catch (err) {
      setIsSaving(false);
      setShowResetModal(false);
      setErrorList(['Terjadi kesalahan: ' + (err instanceof Error ? err.message : String(err))]);
    }
  };

  // Print official document matching the government roster format
  const handlePrintOfficialRoster = () => {
    const rowsHtml = currentSchedules
      .map((item, idx) => {
        const no = idx + 1;
        const ketuaName = item?.schedules?.['Senin']?.[0] || 'KETUA RW';
        const rwLabel = (item?.rw || `RW ${idx + 1}`).replace('RW ', 'RW 0');
        const jabatan = `KETUA ${rwLabel}`;

        const renderDayCell = (day: SiskamlingDay) => {
          const officers = toOfficerArray(item?.schedules?.[day]);
          if (officers.length === 0) return '-';
          return officers
            .map((name, i) => `${i + 1}. ${name}`)
            .join('<br/>');
        };

        return `
          <tr>
            <td style="text-align: center; vertical-align: top; padding: 6px; font-weight: bold;">${no}</td>
            <td style="text-align: center; vertical-align: top; padding: 6px; font-weight: bold; white-space: nowrap;">${item?.rw || '-'}</td>
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
            <div style="font-weight: bold; text-decoration: underline;">${profile?.lurahName || 'Lurah Kelurahan Panaikang'}</div>
            <div>Pangkat: ${profile?.lurahRank || 'Penata Tk. I'}</div>
            <div>NIP. ${profile?.lurahNip || '19750812 200212 1 004'}</div>
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

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
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
              onClick={handleOpenPoskoBatchModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Kelola, tambah, edit, simpan, dan hapus nama posko di 7 RW"
            >
              <MapPin className="w-4 h-4 text-emerald-200" />
              <span>Kelola Nama Posko 7 RW</span>
            </button>
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
              onClick={() => setShowResetModal(true)}
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
            {currentSchedules.map((item, idx) => (
              <button
                key={`filter-rw-btn-${item?.rw || idx}`}
                type="button"
                onClick={() => setActiveRwFilter(item?.rw || 'ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeRwFilter === item?.rw
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item?.rw || `RW ${idx + 1}`}
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
                  const ketuaName = item?.schedules?.['Senin']?.[0] || 'KETUA RW';
                  const rwLabel = (item?.rw || `RW ${idx + 1}`).replace('RW ', 'RW 00');

                  return (
                    <tr
                      key={`admin-sched-row-${item?.rw || idx}`}
                      className="hover:bg-sky-50/40 transition-colors align-top"
                    >
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-bold font-mono-num text-slate-600">
                        {no}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-extrabold text-[#0D3868] whitespace-nowrap">
                        <div className="bg-sky-100 text-[#0D3868] px-2 py-1 rounded-md text-[11px]">
                          {item?.rw || `RW ${idx + 1}`}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500 font-normal">
                          {(item?.rwName || '').split('&')[0]}
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 text-xs uppercase">
                          {ketuaName}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1.5">
                          {item?.poskoLocation ? (
                            <span className="text-[10px] text-slate-600 flex items-center gap-1 truncate" title={item.poskoLocation}>
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.poskoLocation}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 italic bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Posko Belum Ditetapkan
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenPoskoEdit(item)}
                            className="text-[10px] font-bold text-[#0277BD] hover:underline cursor-pointer shrink-0"
                            title="Edit atau tambahkan nama posko RW ini"
                          >
                            {item?.poskoLocation ? 'Ubah' : '+ Tambah'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          KETUA {rwLabel}
                        </span>
                      </td>

                      {/* 7 Days Columns */}
                      {SISKAMLING_DAYS.map((day) => {
                        const officers = toOfficerArray(item?.schedules?.[day]);
                        const isSunday = day === 'Minggu';
                        const isCurrentDay = day === today;

                        return (
                          <td
                            key={`cell-${item?.rw || idx}-${day}`}
                            className={`py-2.5 px-2.5 border-r border-slate-200 text-[11px] leading-snug ${
                              isCurrentDay ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            {isSunday ? (
                              <div className="font-bold text-amber-800 bg-amber-50 px-2 py-1.5 rounded border border-amber-200 text-center text-[10px]">
                                {officers.length > 0 ? officers.join(', ') : 'SELURUH RT/RW'}
                              </div>
                            ) : officers.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic block text-center">-</span>
                            ) : (
                              <div className="space-y-1">
                                {officers.map((officer, oIdx) => (
                                  <div
                                    key={`off-${item?.rw || idx}-${day}-${oIdx}-${officer}`}
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPoskoEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Kelola nama & lokasi posko siskamling RW ini"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Posko</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0277BD] border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Edit jadwal petugas siskamling"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Roster</span>
                          </button>
                        </div>
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
                    .filter((s) => s && (s.rw === editingRwSchedule.rw || s.rw === (editingRwSchedule.rw || '').replace('RW ', 'RW 0') || s.rw.replace(/\s+/g, '') === (editingRwSchedule.rw || '').replace(/\s+/g, '')))
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

      {/* Modal 1: Kelola Posko Siskamling Tunggal (Single RW) */}
      {editingPoskoRw && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base font-bold">
                    Kelola Posko Siskamling {editingPoskoRw.rw}
                  </h3>
                  <div className="text-[11px] text-emerald-100">{editingPoskoRw.rwName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPoskoRw(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama & Titik Lokasi Posko Siskamling:
                </label>
                <input
                  type="text"
                  value={editingPoskoRw.poskoLocation}
                  onChange={(e) =>
                    setEditingPoskoRw({ ...editingPoskoRw, poskoLocation: e.target.value })
                  }
                  placeholder={`Contoh: Posko Terpadu ${editingPoskoRw.rw} (Jl. Poros Utama)`}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPoskoRw({
                        ...editingPoskoRw,
                        poskoLocation: `Posko Terpadu ${editingPoskoRw.rw} (Panaikang)`,
                      })
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Posko Terpadu {editingPoskoRw.rw}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPoskoRw({
                        ...editingPoskoRw,
                        poskoLocation: `Posko Kamtibmas ${editingPoskoRw.rw}`,
                      })
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Posko Kamtibmas {editingPoskoRw.rw}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingPoskoRw({
                        ...editingPoskoRw,
                        poskoLocation: `Posko Siaga Ronda ${editingPoskoRw.rw}`,
                      })
                    }
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Posko Siaga Ronda {editingPoskoRw.rw}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan Wilayah / Area Pemantauan:
                </label>
                <input
                  type="text"
                  value={editingPoskoRw.notes}
                  onChange={(e) =>
                    setEditingPoskoRw({ ...editingPoskoRw, notes: e.target.value })
                  }
                  placeholder="Contoh: Patroli berkala kawasan poros jalan dan pemukiman warga."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {editingPoskoRw.poskoLocation ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePoskoRw(editingPoskoRw.rw)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Posko</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-700 font-semibold italic">
                    Posko belum ditetapkan
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPoskoRw(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSinglePosko(
                        editingPoskoRw.rw,
                        editingPoskoRw.poskoLocation,
                        editingPoskoRw.notes
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Nama Posko'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Kelola Nama Posko Siskamling 7 RW Sekaligus (Batch Manager) */}
      {isPoskoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-[#0D3868] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Kelola Nama & Lokasi Posko Siskamling (RW 01 s/d RW 07)
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Tambahkan, edit, simpan, atau hapus nama posko siskamling untuk seluruh 7 RW di Kelurahan Panaikang.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPoskoModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="text-xs text-slate-600 bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Nama posko siskamling yang Anda simpan di sini akan tampil otomatis pada matriks cetak resmi SK Kelurahan, tampilan warga di menu Data RT & RW, serta rincian pos ronda 24 jam.
                </span>
              </div>

              <div className="space-y-4">
                {currentSchedules.map((item, idx) => {
                  const draft = poskoDrafts[item.rw] || {
                    poskoLocation: item.poskoLocation || '',
                    notes: item.notes || '',
                  };
                  const hasLocation = Boolean(draft.poskoLocation && draft.poskoLocation.trim());

                  return (
                    <div
                      key={`batch-posko-${item.rw || idx}`}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#0D3868] text-white text-xs font-black font-mono-num">
                            {item.rw}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {item.rwName || `Wilayah ${item.rw}`}
                          </span>
                          {!hasLocation ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              Belum Ditetapkan
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Aktif
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {!hasLocation && (
                            <button
                              type="button"
                              onClick={() => {
                                setPoskoDrafts({
                                  ...poskoDrafts,
                                  [item.rw]: {
                                    ...draft,
                                    poskoLocation: `Posko Kamtibmas ${item.rw} (Panaikang)`,
                                  },
                                });
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              + Standar {item.rw}
                            </button>
                          )}
                          {hasLocation && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePoskoRw(item.rw)}
                              className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer inline-flex items-center gap-1"
                              title={`Hapus nama posko ${item.rw}`}
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus Posko</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() =>
                              handleSaveSinglePosko(item.rw, draft.poskoLocation, draft.notes)
                            }
                            className="text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded-lg cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                            <span>Simpan</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nama & Lokasi Posko Siskamling:
                          </label>
                          <input
                            type="text"
                            value={draft.poskoLocation}
                            onChange={(e) =>
                              setPoskoDrafts({
                                ...poskoDrafts,
                                [item.rw]: {
                                  ...draft,
                                  poskoLocation: e.target.value,
                                },
                              })
                            }
                            placeholder={`Contoh: Posko Terpadu ${item.rw} (Jl. Poros Utama)`}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Catatan Area Pemantauan:
                          </label>
                          <input
                            type="text"
                            value={draft.notes}
                            onChange={(e) =>
                              setPoskoDrafts({
                                ...poskoDrafts,
                                [item.rw]: {
                                  ...draft,
                                  notes: e.target.value,
                                },
                              })
                            }
                            placeholder="Contoh: Patroli berkala pemukiman warga dan pos ronda."
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                Data posko yang disimpan tersinkronisasi otomatis ke Google Cloud Firestore.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPoskoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAllPoskoBatch}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Seluruh 7 Posko RW'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Dialog Konfirmasi Hapus Nama Posko */}
      {confirmDeletePoskoRw && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Hapus Nama Posko {confirmDeletePoskoRw}?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nama dan lokasi posko siskamling untuk wilayah {confirmDeletePoskoRw} akan dikosongkan dari sistem Satu Data Panaikang.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePoskoRw(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleDeletePosko(confirmDeletePoskoRw)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus Nama Posko'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Konfirmasi Reset Standar SK Kelurahan */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Kembalikan ke Format SK Resmi?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Seluruh susunan jadwal piket petugas siskamling RW 01 s/d RW 07 akan dikembalikan ke data resmi SK Kelurahan Panaikang.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleExecuteResetToDefault}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Memproses...' : 'Ya, Kembalikan ke Standar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiskamlingPanel;
