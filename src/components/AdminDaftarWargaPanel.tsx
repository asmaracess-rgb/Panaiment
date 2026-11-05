import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Printer,
  Download,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  X,
  Plus,
  RefreshCw,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { AuthenticatedUserProfile, CitizenReport, RwGroup } from '../types';
import {
  subscribeToAllCitizenProfiles,
  updateCitizenProfileByAdmin,
  deleteCitizenProfileByAdmin,
} from '../firebase/authService';
import { INITIAL_REPORTS } from '../data/initialData';
import { getDeletedItemIds, loadCitizensJournal } from '../utils/persistentStorage';

const INITIAL_SAMPLE_REPORT_IDS = new Set(INITIAL_REPORTS.map((r) => r.id));

interface AdminDaftarWargaPanelProps {
  reports: CitizenReport[];
  rwGroups: RwGroup[];
  citizenUsers?: AuthenticatedUserProfile[];
  onUpdateCitizenUser?: (
    uid: string,
    updates: Partial<AuthenticatedUserProfile>
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCitizenUser?: (uid: string) => Promise<{ ok: boolean; error?: string }>;
  onRecordAudit?: (params: {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
    targetId?: string;
    targetLabel: string;
    summary: string;
    details?: string;
  }) => void;
}

export const AdminDaftarWargaPanel: React.FC<AdminDaftarWargaPanelProps> = ({
  reports,
  rwGroups,
  citizenUsers = [],
  onUpdateCitizenUser,
  onDeleteCitizenUser,
  onRecordAudit,
}) => {
  const [cloudCitizens, setCloudCitizens] = useState<AuthenticatedUserProfile[]>([]);
  const [localDeletedUids, setLocalDeletedUids] = useState<Set<string>>(() => getDeletedItemIds());
  const [localEditedOverrides, setLocalEditedOverrides] = useState<
    Record<string, Partial<AuthenticatedUserProfile>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRw, setSelectedRw] = useState('Semua');
  const [selectedRt, setSelectedRt] = useState('Semua');
  const [emailStatusFilter, setEmailStatusFilter] = useState<'Semua' | 'Google' | 'Terdaftar'>('Semua');

  // Detail Modal State
  const [selectedCitizen, setSelectedCitizen] = useState<AuthenticatedUserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    nik: '',
    phone: '',
    rw: 'RW 01',
    rt: 'RT 01',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Delete Confirm
  const [citizenToDelete, setCitizenToDelete] = useState<AuthenticatedUserProfile | null>(null);

  // Subscribe to all citizen user profiles from Firestore in real-time
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToAllCitizenProfiles(
      (data) => {
        setCloudCitizens(data);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Unified, deduplicated list of registered citizens from:
  // 1) Firestore `/user_profiles`
  // 2) PersistedDatabase `citizenUsers` + localStorage `loadCitizensJournal()`
  // 3) Real user-submitted `reports` (non-sample reports where reporterName !== 'Warga Anonim')
  const citizens = useMemo(() => {
    const deletedSet = new Set<string>([
      ...getDeletedItemIds(),
      ...localDeletedUids,
    ]);
    const list: AuthenticatedUserProfile[] = [];

    const mergeIntoList = (candidate: AuthenticatedUserProfile | undefined | null) => {
      if (!candidate || !candidate.uid || deletedSet.has(candidate.uid)) return;
      const cleanEmail = (candidate.email || '').trim().toLowerCase();
      const cleanName = (candidate.fullName || '').trim().toLowerCase();

      const existingIdx = list.findIndex(
        (item) =>
          item.uid === candidate.uid ||
          (cleanEmail && item.email && item.email.trim().toLowerCase() === cleanEmail) ||
          (cleanName &&
            cleanName !== 'warga panaikang' &&
            cleanName !== 'warga kelurahan panaikang' &&
            item.fullName.trim().toLowerCase() === cleanName)
      );

      if (existingIdx === -1) {
        const override = localEditedOverrides[candidate.uid] || {};
        list.push({
          ...candidate,
          ...override,
          role: 'warga',
        });
      } else {
        const existing = list[existingIdx];
        const primaryUid = existing.uid.startsWith('warga_') ? candidate.uid : existing.uid;
        if (deletedSet.has(primaryUid)) return;
        const override = localEditedOverrides[primaryUid] || localEditedOverrides[existing.uid] || {};
        list[existingIdx] = {
          ...existing,
          ...candidate,
          uid: primaryUid,
          fullName:
            (candidate.fullName &&
            candidate.fullName !== 'Warga Panaikang' &&
            candidate.fullName !== 'Warga Kelurahan Panaikang'
              ? candidate.fullName
              : existing.fullName) || 'Warga Panaikang',
          email: candidate.email || existing.email || '',
          nik: candidate.nik || existing.nik || '',
          phone:
            (candidate.phone && candidate.phone !== '-' ? candidate.phone : existing.phone) || '',
          rw: candidate.rw || existing.rw || 'RW 01',
          rt: candidate.rt || existing.rt || 'RT 01',
          address: candidate.address || existing.address || 'Kelurahan Panaikang',
          createdAt: candidate.createdAt || existing.createdAt,
          updatedAt: candidate.updatedAt || existing.updatedAt,
          ...override,
          role: 'warga',
        };
      }
    };

    // 1. Persisted & journal citizen users
    for (const c of citizenUsers) {
      mergeIntoList(c);
    }
    for (const jc of loadCitizensJournal()) {
      mergeIntoList(jc);
    }

    // 2. Cloud Firestore /user_profiles
    for (const cc of cloudCitizens) {
      mergeIntoList(cc);
    }

    // 3. Backfill from user-submitted reports (non-sample reports)
    for (const rep of reports) {
      if (!rep || INITIAL_SAMPLE_REPORT_IDS.has(rep.id)) continue;
      const cleanReporter = (rep.reporterName || '').trim();
      if (!cleanReporter || cleanReporter.toLowerCase() === 'warga anonim') continue;

      const derivedUid =
        rep.ownerId ||
        (rep.ownerEmail
          ? `warga_${rep.ownerEmail.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`
          : `warga_${cleanReporter.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`);

      if (deletedSet.has(derivedUid)) continue;

      mergeIntoList({
        uid: derivedUid,
        email: rep.ownerEmail || '',
        fullName: cleanReporter,
        nik: rep.applicantNik || '',
        phone: rep.reporterPhone && rep.reporterPhone !== '-' ? rep.reporterPhone : '',
        rw: rep.rw || 'RW 01',
        rt: rep.rt || 'RT 01',
        address: rep.citizenAddress || rep.locationName || 'Kelurahan Panaikang',
        role: 'warga',
        createdAt: rep.createdAt,
        updatedAt: rep.updatedAt,
      });
    }

    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [citizenUsers, cloudCitizens, reports, localDeletedUids, localEditedOverrides]);

  // Available RWs
  const rwList = useMemo(() => {
    if (rwGroups && rwGroups.length > 0) {
      return rwGroups.map((g) => g.rwCode);
    }
    return ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07', 'RW 08'];
  }, [rwGroups]);

  // Available RTs for selected RW
  const rtList = useMemo(() => {
    if (selectedRw === 'Semua') return [];
    const found = rwGroups.find((g) => g.rwCode === selectedRw);
    if (found && Array.isArray(found.rtList) && found.rtList.length > 0) {
      return found.rtList.map((r) => r.rtCode);
    }
    return ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];
  }, [rwGroups, selectedRw]);

  // Filtered citizens
  const filteredCitizens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return citizens.filter((c) => {
      // Search
      const matchSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.nik.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);

      // RW filter
      const matchRw = selectedRw === 'Semua' || c.rw === selectedRw;

      // RT filter
      const matchRt = selectedRt === 'Semua' || c.rt === selectedRt;

      // Email filter
      const hasEmail = Boolean(c.email && c.email.trim());
      const isGoogle = Boolean(c.email && c.email.toLowerCase().includes('@gmail.com'));
      const matchEmail =
        emailStatusFilter === 'Semua' ||
        (emailStatusFilter === 'Google' && isGoogle) ||
        (emailStatusFilter === 'Terdaftar' && hasEmail);

      return matchSearch && matchRw && matchRt && matchEmail;
    });
  }, [citizens, searchQuery, selectedRw, selectedRt, emailStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = citizens.length;
    const withEmail = citizens.filter((c) => Boolean(c.email && c.email.trim())).length;
    const withPhone = citizens.filter((c) => Boolean(c.phone && c.phone.trim().length >= 8)).length;
    const rws = new Set(citizens.map((c) => c.rw).filter(Boolean)).size;
    return { total, withEmail, withPhone, rws };
  }, [citizens]);

  // Citizen's submissions mapping (matches by ownerId, ownerEmail, or reporterName on user-submitted reports)
  const citizenSubmissionsMap = useMemo(() => {
    const map = new Map<string, CitizenReport[]>();
    for (const citizen of citizens) {
      const cleanEmail = (citizen.email || '').trim().toLowerCase();
      const cleanName = (citizen.fullName || '').trim().toLowerCase();
      const matched = reports.filter((r) => {
        if (!r) return false;
        if (r.ownerId && r.ownerId === citizen.uid) return true;
        if (cleanEmail && r.ownerEmail && r.ownerEmail.trim().toLowerCase() === cleanEmail) {
          return true;
        }
        if (
          !INITIAL_SAMPLE_REPORT_IDS.has(r.id) &&
          cleanName &&
          r.reporterName &&
          r.reporterName.trim().toLowerCase() === cleanName
        ) {
          return true;
        }
        return false;
      });
      map.set(citizen.uid, matched);
    }
    return map;
  }, [citizens, reports]);

  const citizenSubmissionsCount = useMemo(() => {
    const countMap = new Map<string, number>();
    citizenSubmissionsMap.forEach((list, uid) => {
      countMap.set(uid, list.length);
    });
    return countMap;
  }, [citizenSubmissionsMap]);

  const handleOpenDetail = (citizen: AuthenticatedUserProfile) => {
    setSelectedCitizen(citizen);
    setIsEditing(false);
    setEditForm({
      fullName: citizen.fullName,
      nik: citizen.nik || '',
      phone: citizen.phone || '',
      rw: citizen.rw || 'RW 01',
      rt: citizen.rt || 'RT 01',
      address: citizen.address || '',
    });
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  const handleSaveCitizenEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen) return;
    setFeedbackError('');
    setFeedbackSuccess('');

    if (editForm.fullName.trim().length < 2) {
      setFeedbackError('Nama lengkap minimal 2 karakter.');
      return;
    }
    const cleanNik = editForm.nik.replace(/\D/g, '').trim();
    if (cleanNik && cleanNik.length !== 16) {
      setFeedbackError('Jika diisi, NIK harus berupa 16 digit angka.');
      return;
    }

    const updates: Partial<AuthenticatedUserProfile> = {
      fullName: editForm.fullName.trim(),
      nik: cleanNik,
      phone: editForm.phone.trim(),
      rw: editForm.rw,
      rt: editForm.rt,
      address: editForm.address.trim(),
    };

    setIsSaving(true);
    setLocalEditedOverrides((prev) => ({
      ...prev,
      [selectedCitizen.uid]: updates,
    }));

    if (onUpdateCitizenUser) {
      await onUpdateCitizenUser(selectedCitizen.uid, updates).catch(() => {});
    }
    if (!selectedCitizen.uid.startsWith('warga_')) {
      await updateCitizenProfileByAdmin(selectedCitizen.uid, updates).catch(() => {});
    }
    setIsSaving(false);

    const updated: AuthenticatedUserProfile = {
      ...selectedCitizen,
      fullName: editForm.fullName.trim(),
      nik: cleanNik,
      phone: editForm.phone.trim(),
      rw: editForm.rw,
      rt: editForm.rt,
      address: editForm.address.trim(),
    };
    setSelectedCitizen(updated);
    setIsEditing(false);
    setFeedbackSuccess(`Data warga "${updated.fullName}" berhasil diperbarui.`);

    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'UPDATE',
        targetLabel: `Warga: ${updated.fullName} (${updated.email || updated.rw})`,
        summary: `Memperbarui data profil warga ${updated.fullName} (RW: ${updated.rw}/${updated.rt})`,
      });
    }
  };

  const handleDeleteCitizen = async () => {
    if (!citizenToDelete) return;
    const targetName = citizenToDelete.fullName;
    const targetEmail = citizenToDelete.email;
    const uid = citizenToDelete.uid;

    setLocalDeletedUids((prev) => new Set([...prev, uid]));
    if (onDeleteCitizenUser) {
      await onDeleteCitizenUser(uid).catch(() => {});
    }
    if (!uid.startsWith('warga_')) {
      await deleteCitizenProfileByAdmin(uid).catch(() => {});
    }
    setCitizenToDelete(null);

    if (selectedCitizen?.uid === uid) {
      setSelectedCitizen(null);
    }

    setFeedbackSuccess(`Profil warga "${targetName}" berhasil dihapus.`);
    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'DELETE',
        targetLabel: `Warga: ${targetName} (${targetEmail || uid})`,
        summary: `Menghapus akun profil warga ${targetName} (${targetEmail || uid}) dari basis data`,
      });
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'UID',
      'Nama Lengkap',
      'Alamat Email Terdaftar',
      'No Telepon / WhatsApp',
      'Wilayah RW',
      'Wilayah RT',
      'Alamat Domisili',
    ];
    const rows = filteredCitizens.map((c) => [
      c.uid,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email || '',
      `'${c.phone || ''}`,
      c.rw,
      c.rt,
      `"${(c.address || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_User_Warga_Panaikang_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'EXPORT',
        targetLabel: 'Database User Warga',
        summary: `Mengekspor ${filteredCitizens.length} data user warga ke file CSV`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0D3868] via-[#072647] to-[#0277BD] text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Modul Direktori Warga Terdaftar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Daftar User Warga Kelurahan Panaikang
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              Pantau seluruh akun warga yang telah terdaftar melalui autentikasi portal, verifikasi alamat email terdaftar, kontak WhatsApp, serta riwayat pelayanan permohonan surat dan laporan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Daftar</span>
            </button>
          </div>
        </div>

        {/* Statistics Metric Cards */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-medium">Total Warga Terdaftar</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num mt-1">
              {stats.total}
            </div>
            <div className="text-[10px] text-sky-200/80 mt-0.5">Akun Warga Aktif</div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-400/15 border border-indigo-300/30 backdrop-blur-xs">
            <div className="text-xs text-indigo-200 font-medium">Alamat Email Terdaftar</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-indigo-200 mt-1">
              {stats.withEmail}
            </div>
            <div className="text-[10px] text-indigo-200/80 mt-0.5">
              {stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}% Akun Terautentikasi
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-400/15 border border-sky-300/30 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-medium">No. Telepon / WhatsApp</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-sky-200 mt-1">
              {stats.withPhone}
            </div>
            <div className="text-[10px] text-sky-200/80 mt-0.5">Siap Koordinasi</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-300/30 backdrop-blur-xs">
            <div className="text-xs text-amber-200 font-medium">Sebaran Wilayah RW</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-amber-300 mt-1">
              {stats.rws}
            </div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">RW Memiliki Warga Terdaftar</div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess('')}
            className="text-emerald-500 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError('')}
            className="text-red-500 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Live Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama warga, NIK, email, no HP, atau alamat..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* RW Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedRw}
              onChange={(e) => {
                setSelectedRw(e.target.value);
                setSelectedRt('Semua');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="Semua">Semua RW</option>
              {rwList.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>
          </div>

          {/* RT Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedRt}
              disabled={selectedRw === 'Semua'}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-[#0D3868] focus:outline-none disabled:opacity-50"
            >
              <option value="Semua">Semua RT</option>
              {rtList.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          {/* Email Status Filter */}
          <div className="md:col-span-3">
            <select
              value={emailStatusFilter}
              onChange={(e) => setEmailStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="Semua">Semua Status Email</option>
              <option value="Google">✓ Akun Google (@gmail.com)</option>
              <option value="Terdaftar">Alamat Email Terdaftar</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Menampilkan <strong className="text-slate-800">{filteredCitizens.length}</strong> dari{' '}
            <strong className="text-slate-800">{citizens.length}</strong> warga terdaftar
          </div>
          {(searchQuery || selectedRw !== 'Semua' || selectedRt !== 'Semua' || emailStatusFilter !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRw('Semua');
                setSelectedRt('Semua');
                setEmailStatusFilter('Semua');
              }}
              className="text-xs font-bold text-[#0277BD] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading && filteredCitizens.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#0D3868] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              Memuat data warga dari basis data Google Cloud Firestore...
            </p>
          </div>
        ) : filteredCitizens.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Tidak Ada Data Warga yang Sesuai
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {citizens.length === 0
                ? 'Belum ada warga yang terdaftar. Saat warga masuk atau mendaftar melalui portal, data profilnya akan otomatis tampil di sini secara real-time.'
                : 'Tidak ada warga yang cocok dengan kriteria pencarian atau filter yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Nama Warga
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Alamat Email Terdaftar
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Wilayah Domisili
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Kontak WhatsApp
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Pengajuan
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCitizens.map((citizen) => {
                  const subsCount = citizenSubmissionsCount.get(citizen.uid) || 0;
                  const initials = citizen.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={citizen.uid} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D3868] to-[#0277BD] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                            {initials || 'W'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {citizen.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">
                              Warga Kelurahan Panaikang
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Alamat Email Terdaftar */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {citizen.email ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono font-bold text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px]">{citizen.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum terdaftar</span>
                        )}
                      </td>

                      {/* Domisili */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">
                          {citizen.rw || 'RW 01'} / {citizen.rt || 'RT 01'}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]" title={citizen.address}>
                          {citizen.address || 'Kelurahan Panaikang'}
                        </div>
                      </td>

                      {/* Phone / WA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {citizen.phone ? (
                          <a
                            href={`https://wa.me/${citizen.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#1C8237] hover:text-[#146329] font-bold font-mono hover:underline"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{citizen.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Submissions count */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                            subsCount > 0
                              ? 'bg-sky-100 text-[#0277BD]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {subsCount} Berkas
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(citizen)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#0D3868] transition cursor-pointer"
                            title="Lihat Detail Profil Warga"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCitizenToDelete(citizen)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                            title="Hapus Data Warga"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Edit Citizen Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0D3868] to-[#0277BD] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isEditing ? 'Edit Data Warga' : 'Detail Profil Warga'}
                  </h3>
                  <p className="text-[11px] text-sky-100">
                    UID: <span className="font-mono">{selectedCitizen.uid}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isEditing ? (
                /* Edit Form */
                <form onSubmit={handleSaveCitizenEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap (Sesuai KTP) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Kependudukan (NIK - Opsional)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={editForm.nik}
                      onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                      placeholder="Tidak diwajibkan / opsional"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono focus:border-[#0D3868] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Wilayah RW
                      </label>
                      <select
                        value={editForm.rw}
                        onChange={(e) => setEditForm({ ...editForm, rw: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {rwList.map((rw) => (
                          <option key={rw} value={rw}>
                            {rw}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Wilayah RT
                      </label>
                      <input
                        type="text"
                        value={editForm.rt}
                        onChange={(e) => setEditForm({ ...editForm, rt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Domisili Lengkap
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              ) : (
                /* View Details */
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        {selectedCitizen.fullName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {selectedCitizen.email}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      Warga Terdaftar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Alamat Email Terdaftar
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
                        {selectedCitizen.email || '-'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Kontak WhatsApp
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                        {selectedCitizen.phone || '-'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Wilayah RW / RT
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                        {selectedCitizen.rw || 'RW 01'} / {selectedCitizen.rt || 'RT 01'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Jumlah Pengajuan
                      </span>
                      <span className="text-xs font-bold text-[#0277BD] mt-0.5 block">
                        {citizenSubmissionsCount.get(selectedCitizen.uid) || 0} Pengajuan Terdata
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Alamat Domisili
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedCitizen.address || 'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar'}
                    </p>
                  </div>

                  {/* Citizen's Submitted Reports / Letters */}
                  {(citizenSubmissionsMap.get(selectedCitizen.uid) || []).length > 0 && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Riwayat Laporan & Permohonan Surat ({(citizenSubmissionsMap.get(selectedCitizen.uid) || []).length})
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(citizenSubmissionsMap.get(selectedCitizen.uid) || []).map((rep) => (
                          <div
                            key={rep.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-[11px] text-[#0D3868]">
                                #{rep.ticketCode}
                              </div>
                              <div className="font-bold text-slate-800 truncate">{rep.title}</div>
                              <div className="text-[10px] text-slate-500">{rep.createdAt}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                rep.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rep.status === 'Sedang Ditangani'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions in Detail View */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Data Warga</span>
                    </button>

                    {selectedCitizen.phone && (
                      <a
                        href={`https://wa.me/${selectedCitizen.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Kirim WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Citizen Modal */}
      {citizenToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Konfirmasi Hapus Data Warga
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus data warga <strong>"{citizenToDelete.fullName}"</strong> ({citizenToDelete.email})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCitizenToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCitizen}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Ya, Hapus Warga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
