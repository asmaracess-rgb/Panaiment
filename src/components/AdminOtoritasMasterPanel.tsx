import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  X,
  Mail,
  UserCheck,
  Clock,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
  Sliders,
  ExternalLink,
  Building2,
  UserX,
  Plus,
} from 'lucide-react';
import {
  AdminUserAccount,
  AuthenticatedUserProfile,
  GoogleAdminVerificationRequest,
  KelolaAdminWargaSubTab,
} from '../types';
import {
  loadGoogleAdminVerificationRequests,
  saveGoogleAdminVerificationRequests,
  fetchGoogleAdminVerificationRequestsFromCloud,
} from '../firebase/authService';
import { getRealtimeDateString, getRealtimeDateTimeString } from '../utils/realtimeDate';

interface AdminOtoritasMasterPanelProps {
  adminUsers: AdminUserAccount[];
  googleAdminRequests?: GoogleAdminVerificationRequest[];
  isMasterLurah: boolean;
  currentUsername: string;
  onSaveAdminUsers: (
    updatedUsers: AdminUserAccount[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onForceTakeover?: (masterPassword: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  onRecordAudit?: (params: {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
    targetLabel: string;
    summary: string;
    details?: string;
  }) => void;
  onSwitchSubTab?: (tab: KelolaAdminWargaSubTab) => void;
}

export const AdminOtoritasMasterPanel: React.FC<AdminOtoritasMasterPanelProps> = ({
  adminUsers,
  googleAdminRequests: propGoogleRequests,
  isMasterLurah,
  currentUsername,
  onSaveAdminUsers,
  onForceTakeover,
  onRecordAudit,
  onSwitchSubTab,
}) => {
  const [googleRequests, setGoogleRequests] = useState<GoogleAdminVerificationRequest[]>(() =>
    loadGoogleAdminVerificationRequests()
  );
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [selectedAdminIdForGoogle, setSelectedAdminIdForGoogle] = useState('__NEW_OPERATOR__');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackErrors, setFeedbackErrors] = useState<string[]>([]);

  // Takeover state
  const [takeoverPassword, setTakeoverPassword] = useState('');
  const [takeoverNotice, setTakeoverNotice] = useState('');

  // Keep googleRequests synchronized with parent props, localStorage events, and cloud/server
  useEffect(() => {
    if (Array.isArray(propGoogleRequests) && propGoogleRequests.length > 0) {
      setGoogleRequests((prev) => {
        const map = new Map<string, GoogleAdminVerificationRequest>();
        for (const r of [...prev, ...propGoogleRequests]) {
          if (!r || !r.email) continue;
          const key = r.email.trim().toLowerCase();
          const ex = map.get(key);
          const rTs = r.updatedAtMs || r.requestedAtMs || 0;
          const exTs = ex ? (ex.updatedAtMs || ex.requestedAtMs || 0) : -1;
          if (!ex || rTs >= exTs) {
            map.set(key, { ...ex, ...r, email: key });
          }
        }
        return Array.from(map.values()).sort((a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0));
      });
    }
  }, [propGoogleRequests]);

  useEffect(() => {
    let active = true;
    const syncNow = () => {
      fetchGoogleAdminVerificationRequestsFromCloud().then((cloudReqs) => {
        if (active && Array.isArray(cloudReqs)) {
          setGoogleRequests(cloudReqs);
        }
      });
    };
    syncNow();
    const pollInterval = setInterval(syncNow, 4000);

    const handleSyncEvent = () => {
      setGoogleRequests(loadGoogleAdminVerificationRequests());
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'pnk_google_admin_requests_v1' ||
        e.key === 'pnk_smart_env_db_v4' ||
        e.key === 'pnk_admin_users_journal_v1'
      ) {
        setGoogleRequests(loadGoogleAdminVerificationRequests());
      }
    };
    window.addEventListener('pnk_google_requests_updated', handleSyncEvent);
    window.addEventListener('pnk_db_updated', handleSyncEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      active = false;
      clearInterval(pollInterval);
      window.removeEventListener('pnk_google_requests_updated', handleSyncEvent);
      window.removeEventListener('pnk_db_updated', handleSyncEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const verifiedAdmins = useMemo(
    () =>
      adminUsers.filter(
        (u) =>
          u.isGoogleVerified ||
          u.isMasterLurah ||
          (u.googleEmail && u.googleEmail.trim().length > 0)
      ),
    [adminUsers]
  );

  // Map email -> latest updatedAtMs of a verified adminUser so a newer verification request still shows as Menunggu Persetujuan
  const verifiedEmailTimestampMap = useMemo(() => {
    const map = new Map<string, number>();
    map.set('asmaracess@gmail.com', Number.MAX_SAFE_INTEGER);
    for (const u of adminUsers) {
      if (u.isGoogleVerified === false && !u.isMasterLurah) continue;
      const uTs = u.updatedAtMs || 0;
      if (u.googleEmail && u.googleEmail.trim()) {
        const key = u.googleEmail.trim().toLowerCase();
        map.set(key, Math.max(map.get(key) || 0, uTs));
      }
      if (Array.isArray(u.additionalGoogleEmails)) {
        u.additionalGoogleEmails.forEach((e) => {
          if (e && e.trim()) {
            const key = e.trim().toLowerCase();
            map.set(key, Math.max(map.get(key) || 0, uTs));
          }
        });
      }
    }
    return map;
  }, [adminUsers]);

  // Only include explicit verification requests submitted by staff
  const combinedRequests = useMemo(() => {
    const map = new Map<string, GoogleAdminVerificationRequest>();
    for (const r of googleRequests) {
      if (!r || !r.email) continue;
      if (r.id?.startsWith('req-portal-') && r.notes?.includes('Akun Google terdaftar di Portal Panaikang')) {
        continue;
      }
      const cleanEmail = r.email.trim().toLowerCase();
      if (!cleanEmail) continue;
      const rawStatus = r.status || 'Menunggu Persetujuan';
      const verifiedTs = verifiedEmailTimestampMap.get(cleanEmail);
      const reqTs = r.requestedAtMs || r.updatedAtMs || 0;
      // Only auto-mark as Disetujui if the admin user was verified AFTER or AT the same time as the request, or if master email
      const isAlreadyVerifiedAfterRequest =
        verifiedTs !== undefined && (cleanEmail === 'asmaracess@gmail.com' || (verifiedTs > 0 && verifiedTs >= reqTs));
      const effectiveStatus =
        rawStatus === 'Menunggu Persetujuan' && isAlreadyVerifiedAfterRequest
          ? 'Disetujui'
          : rawStatus;
      map.set(cleanEmail, {
        ...r,
        email: cleanEmail,
        status: effectiveStatus,
      });
    }
    return Array.from(map.values()).sort((a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0));
  }, [googleRequests, verifiedEmailTimestampMap]);

  const pendingRequests = useMemo(
    () => combinedRequests.filter((r) => r.status === 'Menunggu Persetujuan'),
    [combinedRequests]
  );

  const processedRequests = useMemo(
    () => combinedRequests.filter((r) => r.status !== 'Menunggu Persetujuan'),
    [combinedRequests]
  );

  const handleRefreshRequests = async () => {
    setIsRefreshingRequests(true);
    const merged = await fetchGoogleAdminVerificationRequestsFromCloud();
    setGoogleRequests(merged);
    setIsRefreshingRequests(false);
    setFeedbackSuccess('Daftar permohonan verifikasi & akun whitelist berhasil disinkronkan dari server & cloud.');
  };

  /**
   * Builds updated adminUsers list when whitelisting one or more emails without EVER overwriting
   * an existing official's already-verified email.
   */
  const buildWhitelistedAdminUsers = useCallback(
    (
      currentUsers: AdminUserAccount[],
      emailsToRegister: { email: string; displayName?: string }[],
      targetSelectionId: string
    ): { nextUsers: AdminUserAccount[]; linkedSummary: string[] } => {
      const now = new Date();
      const nowStr = getRealtimeDateTimeString(now);
      const nowDateOnly = getRealtimeDateString(now);
      const nowMs = now.getTime();

      const nextUsers = [...currentUsers];
      const linkedSummary: string[] = [];

      const templateOfficial =
        nextUsers.find((u) => u.id === targetSelectionId) ||
        nextUsers.find((u) => u.id === 'usr-operator-pelayanan') ||
        nextUsers.find((u) => !u.isMasterLurah);

      emailsToRegister.forEach((entry, idx) => {
        const cleanEmail = entry.email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) return;

        // 1. Check if this email already exists on any AdminUserAccount
        const existingIdx = nextUsers.findIndex(
          (u) => u.googleEmail && u.googleEmail.trim().toLowerCase() === cleanEmail
        );
        if (existingIdx >= 0) {
          const ex = nextUsers[existingIdx];
          nextUsers[existingIdx] = {
            ...ex,
            fullName: entry.displayName?.trim() || ex.fullName,
            googleEmail: cleanEmail,
            isGoogleVerified: true,
            isActive: true,
            googleVerifiedAt: nowStr,
            googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
            updatedAt: `${nowDateOnly} · Whitelist Google Diperbarui`,
            updatedAtMs: nowMs + idx,
          };
          linkedSummary.push(`${cleanEmail} (${nextUsers[existingIdx].fullName})`);
          return;
        }

        // 2. If a specific structural official was selected AND that official does NOT yet have a verified email
        const directTargetIdx =
          targetSelectionId !== '__NEW_OPERATOR__'
            ? nextUsers.findIndex((u) => u.id === targetSelectionId)
            : -1;

        if (directTargetIdx >= 0) {
          const target = nextUsers[directTargetIdx];
          const targetHasActiveEmail =
            Boolean(target.isMasterLurah) ||
            Boolean(
              target.googleEmail &&
                target.googleEmail.trim().length > 0 &&
                target.isGoogleVerified !== false &&
                target.googleEmail.trim().toLowerCase() !== cleanEmail
            );

          if (!targetHasActiveEmail) {
            nextUsers[directTargetIdx] = {
              ...target,
              fullName: entry.displayName?.trim() || target.fullName,
              googleEmail: cleanEmail,
              isGoogleVerified: true,
              isActive: true,
              googleVerifiedAt: nowStr,
              googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
              updatedAt: `${nowDateOnly} · Whitelist Google Terverifikasi`,
              updatedAtMs: nowMs + idx,
            };
            linkedSummary.push(`${cleanEmail} → ${nextUsers[directTargetIdx].fullName}`);
            return;
          }
        }

        // 3. Otherwise, create a new dedicated whitelisted AdminUserAccount row so existing accounts are NEVER overwritten!
        const emailPrefix = cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || 'staf';
        let uniqueUsername = emailPrefix;
        let suffix = 1;
        while (nextUsers.some((u) => u.username.toLowerCase() === uniqueUsername)) {
          suffix++;
          uniqueUsername = `${emailPrefix}${suffix}`;
        }

        const resolvedFullName =
          entry.displayName?.trim() ||
          (directTargetIdx >= 0
            ? `${nextUsers[directTargetIdx].jabatan} (${cleanEmail.split('@')[0]})`
            : `Staf Admin (${cleanEmail.split('@')[0]})`);

        const newAccount: AdminUserAccount = {
          id: `usr-wl-${nowMs}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          username: uniqueUsername,
          password: templateOfficial?.password || 'Panaikang2026!',
          fullName: resolvedFullName,
          nip: templateOfficial?.nip && directTargetIdx >= 0 ? templateOfficial.nip : '-',
          jabatan:
            directTargetIdx >= 0 && templateOfficial
              ? templateOfficial.jabatan
              : 'Staf / Operator Pelayanan Kelurahan',
          unitBidang:
            directTargetIdx >= 0 && templateOfficial
              ? templateOfficial.unitBidang
              : 'Pelayanan Terpadu Kelurahan Panaikang',
          phone: templateOfficial?.phone || '',
          roleLevel:
            directTargetIdx >= 0 && templateOfficial && !templateOfficial.isMasterLurah
              ? templateOfficial.roleLevel
              : 'operator',
          isMasterLurah: false,
          isActive: true,
          allowedAdminTabs:
            directTargetIdx >= 0 && templateOfficial?.allowedAdminTabs
              ? [...templateOfficial.allowedAdminTabs]
              : ['pengurusan_warga', 'laporan', 'rtrw', 'sampah', 'urban_farming', 'kerjabakti', 'info'],
          allowedServiceCategories:
            directTargetIdx >= 0 && templateOfficial?.allowedServiceCategories
              ? [...templateOfficial.allowedServiceCategories]
              : [
                  'administrasi_kependudukan',
                  'surat_keterangan',
                  'sosial_kesejahteraan',
                  'pembangunan_lingkungan',
                  'ketertiban_keamanan',
                  'kebersihan_persampahan',
                  'pengaduan_permasalahan_warga',
                ],
          actionPermissions:
            directTargetIdx >= 0 && templateOfficial?.actionPermissions
              ? { ...templateOfficial.actionPermissions }
              : {
                  canCreate: true,
                  canEdit: true,
                  canDelete: false,
                  canVerifyAndIssueLetter: true,
                  canConfigureCatalog: false,
                  canManageWhatsApp: false,
                  canExportPrintPdf: true,
                },
          createdAt: nowDateOnly,
          updatedAt: `${nowDateOnly} · Whitelist Google Mandiri`,
          updatedAtMs: nowMs + idx,
          googleEmail: cleanEmail,
          isGoogleVerified: true,
          googleVerifiedAt: nowStr,
          googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
          notes: `Akun Google Whitelist terdaftar oleh Master Admin (${cleanEmail})`,
        };

        nextUsers.push(newAccount);
        linkedSummary.push(`${cleanEmail} → ${newAccount.fullName} (${newAccount.jabatan})`);
      });

      return { nextUsers, linkedSummary };
    },
    []
  );

  const handleApproveRequest = async (
    req: GoogleAdminVerificationRequest,
    targetAdminId: string
  ) => {
    const effectiveTargetId = targetAdminId || '__NEW_OPERATOR__';

    setIsProcessing(true);
    setFeedbackErrors([]);
    setFeedbackSuccess('');

    const nowMs = Date.now();
    const nowStr = getRealtimeDateTimeString(new Date());
    const { nextUsers, linkedSummary } = buildWhitelistedAdminUsers(
      adminUsers,
      [{ email: req.email, displayName: req.displayName }],
      effectiveTargetId
    );

    const res = await onSaveAdminUsers(nextUsers);
    setIsProcessing(false);

    if (res.ok) {
      const cleanReqEmail = req.email.trim().toLowerCase();
      const matchedAccount = nextUsers.find(
        (u) => u.googleEmail && u.googleEmail.trim().toLowerCase() === cleanReqEmail
      );

      const baseList = combinedRequests.map((r) =>
        r.email.trim().toLowerCase() === cleanReqEmail
          ? {
              ...r,
              status: 'Disetujui' as const,
              processedAt: nowStr,
              processedBy: 'Master Admin (Lurah)',
              linkedAdminId: matchedAccount?.id || effectiveTargetId,
              linkedAdminName: matchedAccount?.fullName || req.displayName,
              updatedAtMs: nowMs,
            }
          : r
      );
      saveGoogleAdminVerificationRequests(baseList);
      setGoogleRequests(baseList);

      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'UPDATE',
          targetLabel: `Otoritas Google Admin · ${req.email}`,
          summary: `Master Admin menyetujui verifikasi login Google untuk ${req.email}`,
          details: `Tertaut ke: ${linkedSummary.join(', ')}`,
        });
      }

      setFeedbackSuccess(
        `Akun Google "${req.email}" berhasil disetujui & masuk daftar Whitelist (${linkedSummary.join(', ')}).`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal menyetujui permohonan verifikasi.']);
    }
  };

  const handleRejectRequest = (req: GoogleAdminVerificationRequest) => {
    const nowMs = Date.now();
    const nowStr = getRealtimeDateTimeString(new Date());
    const cleanReqEmail = req.email.trim().toLowerCase();
    const existingHasEmail = googleRequests.some(
      (r) => r.email.trim().toLowerCase() === cleanReqEmail
    );
    const updatedReqs = existingHasEmail
      ? googleRequests.map((r) =>
          r.email.trim().toLowerCase() === cleanReqEmail
            ? {
                ...r,
                status: 'Ditolak' as const,
                processedAt: nowStr,
                processedBy: 'Master Admin (Lurah)',
                updatedAtMs: nowMs,
              }
            : r
        )
      : [
          {
            ...req,
            email: cleanReqEmail,
            status: 'Ditolak' as const,
            processedAt: nowStr,
            processedBy: 'Master Admin (Lurah)',
            updatedAtMs: nowMs,
          },
          ...googleRequests,
        ];

    saveGoogleAdminVerificationRequests(updatedReqs);
    setGoogleRequests(updatedReqs);

    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'UPDATE',
        targetLabel: `Tolak Verifikasi Google · ${req.email}`,
        summary: `Master Admin menolak permohonan verifikasi login Google untuk ${req.email}`,
      });
    }

    setFeedbackSuccess(`Permohonan verifikasi akun Google "${req.email}" telah ditolak.`);
  };

  const handleDirectWhitelist = async () => {
    setFeedbackErrors([]);
    setFeedbackSuccess('');

    // Support registering single or multiple emails at once (comma, semicolon, or newline separated)
    const rawEmails = newGoogleEmail
      .split(/[,;\n\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 3 && e.includes('@'));

    if (rawEmails.length === 0) {
      setFeedbackErrors(['Masukkan minimal satu alamat email Google yang valid (contoh: nama.staf@gmail.com).']);
      return;
    }

    const effectiveTargetId = selectedAdminIdForGoogle || '__NEW_OPERATOR__';
    setIsProcessing(true);

    const entries = rawEmails.map((email) => ({
      email,
      displayName: rawEmails.length === 1 && newStaffFullName.trim() ? newStaffFullName.trim() : undefined,
    }));

    const { nextUsers, linkedSummary } = buildWhitelistedAdminUsers(
      adminUsers,
      entries,
      effectiveTargetId
    );

    const res = await onSaveAdminUsers(nextUsers);
    setIsProcessing(false);

    if (res.ok) {
      // Also mark any matching pending requests as Disetujui
      const nowMs = Date.now();
      const nowStr = getRealtimeDateTimeString(new Date());
      const emailSet = new Set(rawEmails);
      if (googleRequests.some((r) => emailSet.has(r.email.trim().toLowerCase()))) {
        const syncedReqs = googleRequests.map((r) =>
          emailSet.has(r.email.trim().toLowerCase())
            ? {
                ...r,
                status: 'Disetujui' as const,
                processedAt: nowStr,
                processedBy: 'Master Admin (Lurah)',
                updatedAtMs: nowMs,
              }
            : r
        );
        saveGoogleAdminVerificationRequests(syncedReqs);
        setGoogleRequests(syncedReqs);
      }

      setNewGoogleEmail('');
      setNewStaffFullName('');

      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'CREATE',
          targetLabel: `Whitelist Google (${rawEmails.length} Akun)`,
          summary: `Master Admin mendaftarkan & memverifikasi email Google: ${rawEmails.join(', ')}`,
          details: `Detail Whitelist: ${linkedSummary.join(' | ')}`,
        });
      }

      setFeedbackSuccess(
        `Berhasil menyimpan & memverifikasi ${rawEmails.length} akun Google ke Whitelist: ${linkedSummary.join(', ')}.`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal mendaftarkan email Google.']);
    }
  };

  const handleRevokeGoogle = async (userId: string) => {
    const targetAdmin = adminUsers.find((u) => u.id === userId);
    if (!targetAdmin) return;

    if (targetAdmin.isMasterLurah) {
      setFeedbackErrors(['Otoritas login Master Admin (Lurah) utama tidak dapat dicabut.']);
      return;
    }

    setIsProcessing(true);
    const nowMs = Date.now();
    const nowStr = getRealtimeDateString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === userId
        ? {
            ...u,
            googleEmail: undefined,
            isGoogleVerified: false,
            googleVerifiedAt: undefined,
            updatedAt: `${nowStr} · Verifikasi Google Dicabut`,
            updatedAtMs: nowMs,
          }
        : u
    );

    const res = await onSaveAdminUsers(nextUsers);
    setIsProcessing(false);

    if (res.ok) {
      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'DELETE',
          targetLabel: `Cabut Otoritas Google · ${targetAdmin.fullName}`,
          summary: `Master Admin mencabut otorisasi login Google untuk pejabat ${targetAdmin.fullName} (${targetAdmin.googleEmail || '-'})`,
        });
      }

      setFeedbackSuccess(
        `Otorisasi login Google untuk "${targetAdmin.fullName}" (${targetAdmin.googleEmail || ''}) telah berhasil dicabut.`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal mencabut otorisasi Google.']);
    }
  };

  const handleTakeoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTakeoverNotice('');
    if (!takeoverPassword.trim()) {
      setTakeoverNotice('Masukkan kata sandi otoritas Master Lurah.');
      return;
    }

    if (onForceTakeover) {
      setIsProcessing(true);
      const res = await onForceTakeover(takeoverPassword.trim());
      setIsProcessing(false);
      if (res.ok) {
        setTakeoverNotice('✓ Sesi admin pada perangkat lain berhasil diputus paksa. Slot portal kini terbuka.');
        setTakeoverPassword('');
      } else {
        setTakeoverNotice(`Gagal: ${res.error || 'Kata sandi master tidak cocok.'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Otoritas Master Admin (Compact & Simplified) */}
      <div className="bg-gradient-to-r from-[#0D3868] via-[#0B2F57] to-[#1C8237] rounded-2xl p-3.5 sm:p-4 text-white shadow-xs border border-slate-200 space-y-2.5">
        <div className="w-full space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sub-Menu 1: Otoritas Master Admin (Lurah Panaikang)</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
            Pusat Kendali Keamanan &amp; Verifikasi Login Admin
          </h2>
          <p className="text-xs text-sky-100 w-full leading-relaxed">
            Otoritas tertinggi pengelolaan keamanan portal Kelurahan Panaikang. Master Admin (Lurah) memegang hak mutlak atas verifikasi akun login Google pejabat/staf, pemutusan sesi perangkat lain, dan pengawasan hak akses sesuai Perwali No. 65 Tahun 2023.
          </p>
        </div>

        {/* Info Strip Below Text */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold shadow-2xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Muthmainnah, SE, MM (Lurah / Super Admin)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600/80 border border-emerald-400/40 text-white text-xs font-bold font-mono-num">
            <span>Google: AsmaraCess@gmail.com</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/30 border border-sky-300/40 text-white text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-sky-200" />
            <span>Zero-Trust · Perwali Makassar No. 65/2023</span>
          </span>
        </div>

        {/* 4 Compact Cards Metrik Otoritas */}
        <div className="pt-2.5 border-t border-white/20 grid grid-cols-2 lg:grid-cols-4 gap-2 text-slate-800">
          <div className="px-3 py-2 rounded-xl bg-white/95 border border-white/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-600 truncate">Status Otoritas</div>
              <div className="text-[10px] text-slate-500 truncate">Perwali No. 65/2023</div>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aktif</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/95 border border-white/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-600 truncate">Menunggu Verifikasi</div>
              <div className="text-[10px] text-slate-500 truncate">Akun Google Staf</div>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-700 font-mono-num shrink-0">
              {pendingRequests.length}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/95 border border-white/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-600 truncate">Whitelist Google</div>
              <div className="text-[10px] text-slate-500 truncate">Admin Terverifikasi</div>
            </div>
            <div className="text-sm sm:text-base font-black text-[#0D3868] font-mono-num shrink-0">
              {verifiedAdmins.length}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/95 border border-white/40 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-600 truncate">Proteksi Akses</div>
              <div className="text-[10px] text-slate-500 truncate">Blokir Non-Admin</div>
            </div>
            <div className="text-xs sm:text-sm font-black text-[#0277BD] flex items-center gap-1 shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Trust</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedbackErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Perhatian:</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs">
                {feedbackErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackErrors([])}
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* SEKSI 1: ANTREAN PERMOHONAN VERIFIKASI AKUN GOOGLE MASUK */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Permohonan Verifikasi Akun Google Masuk ({pendingRequests.length})
              </h3>
              <p className="text-[11px] text-amber-100">
                Staf yang mengajukan verifikasi atau mencoba login dengan Google dan memerlukan persetujuan Master Admin Lurah
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isRefreshingRequests}
            onClick={handleRefreshRequests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRequests ? 'animate-spin' : ''}`} />
            <span>{isRefreshingRequests ? 'Menyinkronkan...' : 'Muat Ulang Cloud'}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Tidak ada permohonan yang menunggu persetujuan</div>
              <div className="text-[11px] text-slate-500">
                Anda juga dapat langsung mendaftarkan satu atau beberapa email Google staf pada formulir Pre-Registration di bawah.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id || req.email}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-sm shrink-0">
                      {req.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-amber-700" />
                        <span className="font-mono-num">{req.email}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Nama Pengguna: <span className="font-semibold text-slate-800">{req.displayName || '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Waktu: <span className="font-mono-num">{req.requestedAt}</span>
                        {req.notes ? ` · ${req.notes}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-200">
                    <select
                      id={`select-role-${req.id}`}
                      defaultValue="__NEW_OPERATOR__"
                      className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-[#0D3868] focus:outline-none"
                    >
                      <option value="__NEW_OPERATOR__">
                        + Buat Akun Staf / Operator Baru (Otomatis)
                      </option>
                      {adminUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.jabatan})
                          {u.googleEmail && u.isGoogleVerified !== false ? ` [Sudah ada: ${u.googleEmail}]` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        const sel = document.getElementById(
                          `select-role-${req.id}`
                        ) as HTMLSelectElement | null;
                        const val = sel?.value || '__NEW_OPERATOR__';
                        handleApproveRequest(req, val);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui & Verifikasi</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleRejectRequest(req)}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Riwayat Permohonan Verifikasi (Disetujui / Ditolak) */}
          {processedRequests.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-extrabold text-slate-700 mb-2">
                Riwayat Permohonan Verifikasi Sebelumnya ({processedRequests.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {processedRequests.slice(0, 8).map((req) => (
                  <div
                    key={req.id || req.email}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate font-mono-num">{req.email}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {req.displayName || '-'} · {req.processedAt || req.requestedAt}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        req.status === 'Disetujui'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEKSI 2: DAFTARKAN EMAIL GOOGLE STAF SECARA MANDIRI OLEH LURAH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
              Daftarkan & Verifikasi Email Google Staf Baru (Pre-Registration / Multi-Akun)
            </h3>
            <p className="text-[11px] text-slate-500">
              Setiap email yang didaftarkan akan disimpan permanen sebagai akun Whitelist tersendiri tanpa menimpa akun yang sudah ada. Bisa masukkan beberapa email sekaligus dipisahkan koma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Alamat Email Google (Bisa Lebih dari 1, Pisahkan Koma) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newGoogleEmail}
                onChange={(e) => setNewGoogleEmail(e.target.value)}
                placeholder="staf1@gmail.com, staf2@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono-num focus:border-[#0D3868] focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Nama Pejabat / Staf (Opsional)
            </label>
            <input
              type="text"
              value={newStaffFullName}
              onChange={(e) => setNewStaffFullName(e.target.value)}
              placeholder="Contoh: Andi Pratama, S.STP"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Peran Jabatan / Tautkan Pejabat
            </label>
            <select
              value={selectedAdminIdForGoogle}
              onChange={(e) => setSelectedAdminIdForGoogle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="__NEW_OPERATOR__">
                + Buat Akun Whitelist Staf Baru (Otomatis)
              </option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.jabatan})
                  {u.googleEmail && u.isGoogleVerified !== false ? ` [${u.googleEmail}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDirectWhitelist}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Simpan Whitelist</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI 3: DAFTAR AKUN ADMIN TERVERIKASI GOOGLE SAAT INI */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0D3868] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                Daftar Akun Administrator yang Memiliki Izin Login Google
              </h3>
              <p className="text-[11px] text-slate-500">
                Pejabat/staf yang telah diverifikasi oleh Master Admin (Lurah) dan berhak masuk ke panel
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold w-fit">
            {verifiedAdmins.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-6">Pejabat / Staf</th>
                <th className="p-3.5">Jabatan & Seksi</th>
                <th className="p-3.5">Email Google Tertaut</th>
                <th className="p-3.5">Status Whitelist</th>
                <th className="p-3.5 pr-6 text-right">Aksi Lurah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifiedAdmins.map((u) => {
                const isSuper = u.isMasterLurah || (u.googleEmail || '').toLowerCase() === 'asmaracess@gmail.com';
                const isVerified = u.isGoogleVerified || isSuper;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-6">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {u.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-num">
                        Username: @{u.username} · NIP. {u.nip}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#0D3868]">{u.jabatan}</div>
                      <div className="text-[11px] text-slate-500">{u.unitBidang}</div>
                    </td>
                    <td className="p-3.5 font-mono-num font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.googleEmail || (isSuper ? 'AsmaraCess@gmail.com' : '-')}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          Master Admin (Lurah)
                        </span>
                      ) : isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terverifikasi Lurah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          Belum Diverifikasi
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      {!isSuper && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRevokeGoogle(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer transition disabled:opacity-50"
                        >
                          Cabut Izin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEKSI 4: KONTROL PUTUS PAKSA SESI PERANGKAT LAIN (FORCE TAKEOVER) & PINTASAN SUB-MENU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Force Takeover Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <KeyRound className="w-4 h-4 text-[#0D3868]" />
            <span>Putus Sesi Paksa Perangkat Lain (Force Takeover)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jika sesi admin terkunci karena ada perangkat lain yang belum logout, Master Admin dapat memutus sesi tersebut dengan sandi otoritas master.
          </p>
          <form onSubmit={handleTakeoverSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="password"
                value={takeoverPassword}
                onChange={(e) => setTakeoverPassword(e.target.value)}
                placeholder="Kata Sandi Otoritas Master..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#0D3868] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition disabled:opacity-50 shrink-0"
              >
                Putus Sesi
              </button>
            </div>
            {takeoverNotice && (
              <div className="text-[11px] font-semibold text-[#0D3868] bg-sky-50 p-2 rounded-lg border border-sky-200">
                {takeoverNotice}
              </div>
            )}
          </form>
        </div>

        {/* Pintasan Sub-Menu Lain */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#0D3868] uppercase tracking-wider mb-1">
              Navigasi Cepat Kelola Admin & Warga
            </div>
            <p className="text-xs text-slate-600">
              Beralih cepat ke pengaturan akun pejabat atau direktori warga terdaftar:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onSwitchSubTab && (
              <>
                <button
                  type="button"
                  onClick={() => onSwitchSubTab('parameter_admin')}
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Parameter Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchSubTab('user_warga')}
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>User Warga Terdaftar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
