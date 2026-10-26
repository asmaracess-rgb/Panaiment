/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import {
  AppView,
  CitizenReport,
  ReportStatus,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  KelurahanProfile,
  KelurahanInfoItem,
  RwGroup,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActivityLog,
  UrbanFarmingSpot,
  SeedRequestItem,
} from './types';
import {
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_TEBA_SPOTS,
  INITIAL_BIOPORI_POINTS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
} from './data/initialData';
import {
  SERVICE_CATEGORY_GROUPS,
  ServiceCategoryGroup,
} from './data/wargaServiceCatalog';
import {
  loadPersistedDatabase,
  savePersistedDatabase,
  smartMergeDatabases,
  exportDatabaseToJson,
  parseImportDatabaseJson,
  recordDeletedItemId,
  getDeletedItemIds,
  PersistedDatabase,
} from './utils/persistentStorage';
import { HomePortal } from './components/HomePortal';
import { ProfilKelurahanView } from './components/ProfilKelurahanView';
import { DataRtRwView } from './components/DataRtRwView';
import { UntukWargaView } from './components/UntukWargaView';
import { DashboardLurahView } from './components/DashboardLurahView';
import { PetaDigitalView } from './components/PetaDigitalView';
import { MonitoringSampahView } from './components/MonitoringSampahView';
import { MonitoringKerjaBaktiView } from './components/MonitoringKerjaBaktiView';
import { UrbanFarmingView } from './components/UrbanFarmingView';
import { AdminPanelView, AdminTab } from './components/AdminPanelView';
import { EmblemKelurahanPanaikang } from './components/Emblems';
import { recordTrafficHit } from './utils/trafficTracker';

interface ToastNotification {
  id: string;
  ticketCode: string;
  reportTitle: string;
  newStatus: ReportStatus;
  assignedTeam: string;
  timestamp: string;
}

export default function App() {
  const initialPersisted = useMemo(() => loadPersistedDatabase(), []);

  const [activeView, setActiveView] = useState<AppView>('beranda');
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('dashboard_lurah');
  const [kelurahanProfile, setKelurahanProfile] = useState<KelurahanProfile>(
    initialPersisted?.profile ?? INITIAL_KELURAHAN_PROFILE
  );

  const [reports, setReports] = useState<CitizenReport[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.reports)
      ? initialPersisted.reports
      : INITIAL_REPORTS;
    return source.filter((r) => r && r.id && !deleted.has(r.id));
  });

  const [wasteUnits, setWasteUnits] = useState<WasteBankUnit[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.wasteUnits)
      ? initialPersisted.wasteUnits
      : INITIAL_WASTE_UNITS;
    return source.filter((u) => u && u.id && !deleted.has(u.id));
  });

  const [wasteLogs, setWasteLogs] = useState<WasteLogEntry[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.wasteLogs)
      ? initialPersisted.wasteLogs
      : INITIAL_WASTE_LOGS;
    return source.filter((l) => l && l.id && !deleted.has(l.id));
  });

  const [cleanupEvents, setCleanupEvents] = useState<CleanupEvent[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.cleanupEvents)
      ? initialPersisted.cleanupEvents
      : INITIAL_CLEANUP_EVENTS;
    return source.filter((e) => e && e.id && !deleted.has(e.id));
  });

  const [kelurahanInfos, setKelurahanInfos] = useState<KelurahanInfoItem[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.kelurahanInfos)
      ? initialPersisted.kelurahanInfos
      : INITIAL_KELURAHAN_INFOS;
    return source.filter((i) => i && i.id && !deleted.has(i.id));
  });

  const [rwGroups, setRwGroups] = useState<RwGroup[]>(
    initialPersisted?.rwGroups ?? INITIAL_RW_GROUPS
  );

  const [whatsappRecipients, setWhatsappRecipients] = useState<WhatsAppRecipient[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.whatsappRecipients)
      ? initialPersisted.whatsappRecipients
      : INITIAL_WHATSAPP_RECIPIENTS;
    return source.filter((w) => w && w.id && !deleted.has(w.id));
  });

  const [serviceCatalog, setServiceCatalog] = useState<ServiceCategoryGroup[]>(
    Array.isArray(initialPersisted?.serviceCatalog) && initialPersisted.serviceCatalog.length > 0
      ? initialPersisted.serviceCatalog
      : SERVICE_CATEGORY_GROUPS
  );

  const [adminUsers, setAdminUsers] = useState<AdminUserAccount[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.adminUsers)
      ? initialPersisted.adminUsers
      : INITIAL_ADMIN_USERS;
    return source.filter((u) => u && u.id && !deleted.has(u.id));
  });

  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(
    Array.isArray(initialPersisted?.activityLogs)
      ? initialPersisted.activityLogs
      : INITIAL_ACTIVITY_LOGS
  );

  const [urbanFarmingSpots, setUrbanFarmingSpots] = useState<UrbanFarmingSpot[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.urbanFarmingSpots)
      ? initialPersisted.urbanFarmingSpots
      : INITIAL_URBAN_FARMING_SPOTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [seedRequests, setSeedRequests] = useState<SeedRequestItem[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.seedRequests)
      ? initialPersisted.seedRequests
      : INITIAL_SEED_REQUESTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [tebaSpots, setTebaSpots] = useState<TebaSpot[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.tebaSpots)
      ? initialPersisted.tebaSpots
      : INITIAL_TEBA_SPOTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [bioporiPoints, setBioporiPoints] = useState<BioporiPoint[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.bioporiPoints)
      ? initialPersisted.bioporiPoints
      : INITIAL_BIOPORI_POINTS;
    return source.filter((b) => b && b.id && !deleted.has(b.id));
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const stateRef = useRef({
    profile: kelurahanProfile,
    rwGroups,
    reports,
    wasteUnits,
    wasteLogs,
    tebaSpots,
    bioporiPoints,
    cleanupEvents,
    kelurahanInfos,
    whatsappRecipients,
    serviceCatalog,
    adminUsers,
    activityLogs,
    urbanFarmingSpots,
    seedRequests,
  });

  useEffect(() => {
    stateRef.current = {
      profile: kelurahanProfile,
      rwGroups,
      reports,
      wasteUnits,
      wasteLogs,
      tebaSpots,
      bioporiPoints,
      cleanupEvents,
      kelurahanInfos,
      whatsappRecipients,
      serviceCatalog,
      adminUsers,
      activityLogs,
      urbanFarmingSpots,
      seedRequests,
    };
  }, [
    kelurahanProfile,
    rwGroups,
    reports,
    wasteUnits,
    wasteLogs,
    tebaSpots,
    bioporiPoints,
    cleanupEvents,
    kelurahanInfos,
    whatsappRecipients,
    serviceCatalog,
    adminUsers,
    activityLogs,
    urbanFarmingSpots,
    seedRequests,
  ]);

  const commitPersistence = useCallback(
    (partial: Partial<Omit<PersistedDatabase, 'updatedAt'>>, syncServer = true) => {
      const deletedSet = getDeletedItemIds();
      const nextDeletedArray = Array.from(
        new Set([
          ...deletedSet,
          ...(Array.isArray(partial.deletedItemIds) ? partial.deletedItemIds : []),
        ])
      );

      const nextSnapshot: PersistedDatabase = {
        profile: partial.profile ?? stateRef.current.profile,
        rwGroups: partial.rwGroups ?? stateRef.current.rwGroups,
        reports: (partial.reports ?? stateRef.current.reports).filter((r) => r && r.id && !deletedSet.has(r.id)),
        wasteUnits: (partial.wasteUnits ?? stateRef.current.wasteUnits).filter((u) => u && u.id && !deletedSet.has(u.id)),
        wasteLogs: (partial.wasteLogs ?? stateRef.current.wasteLogs).filter((l) => l && l.id && !deletedSet.has(l.id)),
        tebaSpots: (partial.tebaSpots ?? stateRef.current.tebaSpots).filter((s) => s && s.id && !deletedSet.has(s.id)),
        bioporiPoints: (partial.bioporiPoints ?? stateRef.current.bioporiPoints).filter((b) => b && b.id && !deletedSet.has(b.id)),
        cleanupEvents: (partial.cleanupEvents ?? stateRef.current.cleanupEvents).filter((e) => e && e.id && !deletedSet.has(e.id)),
        kelurahanInfos: (partial.kelurahanInfos ?? stateRef.current.kelurahanInfos).filter((i) => i && i.id && !deletedSet.has(i.id)),
        whatsappRecipients: (partial.whatsappRecipients ?? stateRef.current.whatsappRecipients).filter((w) => w && w.id && !deletedSet.has(w.id)),
        serviceCatalog: partial.serviceCatalog ?? stateRef.current.serviceCatalog,
        adminUsers: (partial.adminUsers ?? stateRef.current.adminUsers).filter((u) => u && u.id && !deletedSet.has(u.id)),
        activityLogs: partial.activityLogs ?? stateRef.current.activityLogs,
        urbanFarmingSpots: (partial.urbanFarmingSpots ?? stateRef.current.urbanFarmingSpots).filter((s) => s && s.id && !deletedSet.has(s.id)),
        seedRequests: (partial.seedRequests ?? stateRef.current.seedRequests).filter((s) => s && s.id && !deletedSet.has(s.id)),
        deletedItemIds: nextDeletedArray,
        updatedAt: Date.now(),
      };

      stateRef.current = {
        profile: nextSnapshot.profile,
        rwGroups: nextSnapshot.rwGroups,
        reports: nextSnapshot.reports,
        wasteUnits: nextSnapshot.wasteUnits,
        wasteLogs: nextSnapshot.wasteLogs,
        tebaSpots: nextSnapshot.tebaSpots ?? [],
        bioporiPoints: nextSnapshot.bioporiPoints ?? [],
        cleanupEvents: nextSnapshot.cleanupEvents,
        kelurahanInfos: nextSnapshot.kelurahanInfos,
        whatsappRecipients: nextSnapshot.whatsappRecipients,
        serviceCatalog: nextSnapshot.serviceCatalog ?? SERVICE_CATEGORY_GROUPS,
        adminUsers: nextSnapshot.adminUsers ?? [],
        activityLogs: nextSnapshot.activityLogs ?? [],
        urbanFarmingSpots: nextSnapshot.urbanFarmingSpots ?? [],
        seedRequests: nextSnapshot.seedRequests ?? [],
      };

      savePersistedDatabase(nextSnapshot);

      if (syncServer) {
        fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextSnapshot),
        }).catch(() => {});
      }
    },
    []
  );

  const handleAddUrbanFarmingSpot = useCallback(
    (newSpot: UrbanFarmingSpot) => {
      const updated = [newSpot, ...stateRef.current.urbanFarmingSpots];
      setUrbanFarmingSpots(updated);
      commitPersistence({ urbanFarmingSpots: updated });
    },
    [commitPersistence]
  );

  const handleAddSeedRequest = useCallback(
    (newReq: SeedRequestItem) => {
      const updated = [newReq, ...stateRef.current.seedRequests];
      setSeedRequests(updated);
      commitPersistence({ seedRequests: updated });
    },
    [commitPersistence]
  );

  // Load and synchronize persistent state between browser localStorage and backend on mount
  useEffect(() => {
    let mounted = true;

    // 1. Immediately hydrate all React state from localStorage to ensure zero flash & instant user data availability
    const initialLocal = loadPersistedDatabase();
    if (initialLocal) {
      setKelurahanProfile(initialLocal.profile);
      setRwGroups(initialLocal.rwGroups);
      setReports(initialLocal.reports);
      setWasteUnits(initialLocal.wasteUnits);
      setWasteLogs(initialLocal.wasteLogs);
      setCleanupEvents(initialLocal.cleanupEvents);
      setKelurahanInfos(initialLocal.kelurahanInfos);
      setWhatsappRecipients(initialLocal.whatsappRecipients);
      if (initialLocal.serviceCatalog) setServiceCatalog(initialLocal.serviceCatalog);
      if (initialLocal.adminUsers) setAdminUsers(initialLocal.adminUsers);
      if (initialLocal.activityLogs) setActivityLogs(initialLocal.activityLogs);
      if (initialLocal.urbanFarmingSpots) setUrbanFarmingSpots(initialLocal.urbanFarmingSpots);
      if (initialLocal.seedRequests) setSeedRequests(initialLocal.seedRequests);
      if (initialLocal.tebaSpots) setTebaSpots(initialLocal.tebaSpots);
      if (initialLocal.bioporiPoints) setBioporiPoints(initialLocal.bioporiPoints);
    }

    // 2. Fetch server database and perform bulletproof smart merge
    const syncFromServer = async () => {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = await res.json();
        if (!mounted || !payload?.ok || !payload.data) return;
        const serverDb = payload.data as Partial<PersistedDatabase>;
        const currentLocal = loadPersistedDatabase();

        const merged = smartMergeDatabases(currentLocal, serverDb);

        setKelurahanProfile(merged.profile);
        setRwGroups(merged.rwGroups);
        setReports(merged.reports);
        setWasteUnits(merged.wasteUnits);
        setWasteLogs(merged.wasteLogs);
        setCleanupEvents(merged.cleanupEvents);
        setKelurahanInfos(merged.kelurahanInfos);
        setWhatsappRecipients(merged.whatsappRecipients);
        if (merged.serviceCatalog) setServiceCatalog(merged.serviceCatalog);
        if (merged.adminUsers) setAdminUsers(merged.adminUsers);
        if (merged.activityLogs) setActivityLogs(merged.activityLogs);
        if (merged.urbanFarmingSpots) setUrbanFarmingSpots(merged.urbanFarmingSpots);
        if (merged.seedRequests) setSeedRequests(merged.seedRequests);
        setTebaSpots(merged.tebaSpots ?? []);
        setBioporiPoints(merged.bioporiPoints ?? []);

        savePersistedDatabase(merged);
      } catch {}
    };

    syncFromServer();

    // Cross-device synchronization on window focus / tab visibility
    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromServer();
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Periodic gentle background poll every 12 seconds for multi-device sync
    const pollInterval = window.setInterval(syncFromServer, 12000);

    // Cross-tab synchronization listener
    const handleStorageUpdate = (e: StorageEvent) => {
      if ((e.key === 'pnk_smart_env_db_v3' || e.key === 'pnk_smart_env_db_backup_v3') && e.newValue) {
        try {
          const updated = loadPersistedDatabase();
          if (updated) {
            setReports(updated.reports);
            setWasteLogs(updated.wasteLogs);
            setKelurahanProfile(updated.profile);
            setRwGroups(updated.rwGroups);
            setWasteUnits(updated.wasteUnits);
            setCleanupEvents(updated.cleanupEvents);
            setKelurahanInfos(updated.kelurahanInfos);
            setWhatsappRecipients(updated.whatsappRecipients);
            if (updated.serviceCatalog) setServiceCatalog(updated.serviceCatalog);
            if (updated.adminUsers) setAdminUsers(updated.adminUsers);
            if (updated.activityLogs) setActivityLogs(updated.activityLogs);
            if (updated.urbanFarmingSpots) setUrbanFarmingSpots(updated.urbanFarmingSpots);
            if (updated.seedRequests) setSeedRequests(updated.seedRequests);
            setTebaSpots(updated.tebaSpots ?? []);
            setBioporiPoints(updated.bioporiPoints ?? []);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      mounted = false;
      window.clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const triggerStatusToast = useCallback(
    (
      ticketCode: string,
      reportTitle: string,
      newStatus: ReportStatus,
      assignedTeam: string
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newToast: ToastNotification = {
        id,
        ticketCode,
        reportTitle,
        newStatus,
        assignedTeam,
        timestamp: `${timeStr} WITA`,
      };
      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      recordTrafficHit(view);
    } catch {}

    // Instant non-blocking sync on view transition to reflect changes from other devices
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload?.ok || !payload.data) return;
        const serverDb = payload.data as Partial<PersistedDatabase>;
        const currentLocal = loadPersistedDatabase();
        const merged = smartMergeDatabases(currentLocal, serverDb);
        setKelurahanProfile(merged.profile);
        setRwGroups(merged.rwGroups);
        setReports(merged.reports);
        setWasteUnits(merged.wasteUnits);
        setWasteLogs(merged.wasteLogs);
        setCleanupEvents(merged.cleanupEvents);
        setKelurahanInfos(merged.kelurahanInfos);
        setWhatsappRecipients(merged.whatsappRecipients);
        if (merged.serviceCatalog) setServiceCatalog(merged.serviceCatalog);
        if (merged.adminUsers) setAdminUsers(merged.adminUsers);
        if (merged.activityLogs) setActivityLogs(merged.activityLogs);
        if (merged.urbanFarmingSpots) setUrbanFarmingSpots(merged.urbanFarmingSpots);
        if (merged.seedRequests) setSeedRequests(merged.seedRequests);
        setTebaSpots(merged.tebaSpots ?? []);
        setBioporiPoints(merged.bioporiPoints ?? []);
        savePersistedDatabase(merged);
      })
      .catch(() => {});
  };

  // ================= DATABASE BACKUP & RESTORE HANDLERS =================
  const handleExportDatabase = useCallback(() => {
    const currentSnapshot: PersistedDatabase = {
      profile: kelurahanProfile,
      rwGroups,
      reports,
      wasteUnits,
      wasteLogs,
      tebaSpots,
      bioporiPoints,
      cleanupEvents,
      kelurahanInfos,
      whatsappRecipients,
      serviceCatalog,
      adminUsers,
      activityLogs,
      urbanFarmingSpots,
      seedRequests,
      updatedAt: Date.now(),
    };
    exportDatabaseToJson(currentSnapshot);
  }, [
    kelurahanProfile,
    rwGroups,
    reports,
    wasteUnits,
    wasteLogs,
    tebaSpots,
    bioporiPoints,
    cleanupEvents,
    kelurahanInfos,
    whatsappRecipients,
    serviceCatalog,
    adminUsers,
    activityLogs,
    urbanFarmingSpots,
    seedRequests,
  ]);

  const handleImportDatabase = useCallback(
    (jsonString: string): { ok: boolean; message: string } => {
      const parsed = parseImportDatabaseJson(jsonString);
      if (!parsed) {
        return { ok: false, message: 'Format file JSON tidak valid atau struktur data tidak sesuai.' };
      }
      setKelurahanProfile(parsed.profile);
      setRwGroups(parsed.rwGroups);
      setReports(parsed.reports);
      setWasteUnits(parsed.wasteUnits);
      setWasteLogs(parsed.wasteLogs);
      if (parsed.tebaSpots) setTebaSpots(parsed.tebaSpots);
      if (parsed.bioporiPoints) setBioporiPoints(parsed.bioporiPoints);
      setCleanupEvents(parsed.cleanupEvents);
      setKelurahanInfos(parsed.kelurahanInfos);
      setWhatsappRecipients(parsed.whatsappRecipients);
      if (parsed.serviceCatalog) setServiceCatalog(parsed.serviceCatalog);
      if (parsed.adminUsers) setAdminUsers(parsed.adminUsers);
      if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
      if (parsed.urbanFarmingSpots) setUrbanFarmingSpots(parsed.urbanFarmingSpots);
      if (parsed.seedRequests) setSeedRequests(parsed.seedRequests);

      commitPersistence(parsed, true);
      return {
        ok: true,
        message: `Berhasil memulihkan ${parsed.reports.length} laporan warga, ${parsed.wasteLogs.length} data sampah, dan seluruh informasi kelurahan!`,
      };
    },
    [commitPersistence]
  );

  // ================= BACKEND-SYNCED HANDLERS =================

  // 1. Save / Validate Kelurahan Profile
  const handleSaveProfileApi = async (
    updatedProfile: KelurahanProfile
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    // Client-side pre-validation
    const errors: string[] = [];
    if (!updatedProfile.lurahName || updatedProfile.lurahName.trim().length < 3) {
      errors.push('Nama Lurah wajib diisi (minimal 3 karakter).');
    }
    if (!updatedProfile.lurahNip || updatedProfile.lurahNip.trim().length < 8) {
      errors.push('NIP Lurah wajib diisi dengan format yang valid.');
    }
    if (!updatedProfile.officeAddress || updatedProfile.officeAddress.trim().length < 10) {
      errors.push('Alamat Kantor Kelurahan wajib diisi secara lengkap.');
    }
    if (!updatedProfile.visi || updatedProfile.visi.trim().length < 10) {
      errors.push('Visi Kelurahan wajib diisi (minimal 10 karakter).');
    }
    const cleanMisi = updatedProfile.misi.map((m) => m.trim()).filter(Boolean);
    if (cleanMisi.length === 0) {
      errors.push('Minimal harus terdapat 1 butir Misi Kelurahan.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextProfile: KelurahanProfile = {
      ...kelurahanProfile,
      ...updatedProfile,
      misi: cleanMisi,
    };
    setKelurahanProfile(nextProfile);
    commitPersistence({ profile: nextProfile });

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });
      const json = await response.json();
      if (response.ok && json?.ok && json.data) {
        setKelurahanProfile(json.data);
        commitPersistence({ profile: json.data }, false);
      }
    } catch {
      // Already persisted via commitPersistence
    }
    return { ok: true };
  };

  // 2. Citizen Reports CRUD
  const handleAddReport = (
    newReportData: Omit<
      CitizenReport,
      | 'id'
      | 'ticketCode'
      | 'createdAt'
      | 'updatedAt'
      | 'upvotes'
      | 'status'
      | 'assignedTeam'
      | 'responseNote'
    >
  ): string => {
    const nextNum = 149 + reports.length;
    const ticketCode = `PNK-2026-0${nextNum}`;
    const optimistic: CitizenReport = {
      ...newReportData,
      id: `rep-${Date.now()}`,
      ticketCode,
      status: 'Menunggu Verifikasi',
      createdAt: '06 Okt 2026 · Baru Saja',
      updatedAt: '06 Okt 2026 · Baru Saja',
      assignedTeam: `Koordinator Kebersihan ${newReportData.rw}`,
      responseNote:
        'Laporan baru warga telah masuk dalam antrean verifikasi Dashboard Lurah Panaikang.',
      upvotes: 1,
    };
    const nextReports = [optimistic, ...stateRef.current.reports];
    setReports(nextReports);
    commitPersistence({ reports: nextReports });

    return ticketCode;
  };

  const handleAdminCreateReport = async (
    rep: Partial<CitizenReport>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const errors: string[] = [];
    if (!rep.title || rep.title.trim().length < 5) {
      errors.push('Judul laporan wajib diisi (minimal 5 karakter).');
    }
    if (!rep.description || rep.description.trim().length < 10) {
      errors.push('Deskripsi permasalahan wajib diisi (minimal 10 karakter).');
    }
    if (!rep.reporterName || rep.reporterName.trim().length < 2) {
      errors.push('Nama pelapor wajib diisi.');
    }
    if (!rep.locationName || rep.locationName.trim().length < 4) {
      errors.push('Lokasi atau patokan jalan wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextNum = 149 + stateRef.current.reports.length;
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      ticketCode: rep.ticketCode || `PNK-2026-0${nextNum}`,
      title: rep.title!.trim(),
      description: rep.description!.trim(),
      category: rep.category || 'Sampah Liar & TPS',
      urgency: rep.urgency || 'Normal',
      status: rep.status || 'Menunggu Verifikasi',
      reporterName: rep.reporterName!.trim(),
      reporterPhone: rep.reporterPhone?.trim() || '0812-xxxx-xxxx',
      rw: rep.rw || 'RW 02',
      rt: rep.rt || 'RT 01',
      locationName: rep.locationName!.trim(),
      mapX: typeof rep.mapX === 'number' ? rep.mapX : 50,
      mapY: typeof rep.mapY === 'number' ? rep.mapY : 48,
      coordinatesLabel: rep.coordinatesLabel || '-5.1379, 119.4470',
      createdAt: '06 Okt 2026 · Baru Saja',
      updatedAt: '06 Okt 2026 · Baru Saja',
      assignedTeam: rep.assignedTeam || `Koordinator Kebersihan ${rep.rw || 'RW 02'}`,
      responseNote:
        rep.responseNote ||
        'Laporan baru telah masuk dan tervalidasi dalam sistem Satu Data Panaikang.',
      upvotes: 1,
      imageUrl: rep.imageUrl || '/images/dokumentasi_drainase_bersih_1791349273322.jpg',
      verifiedBy: rep.verifiedBy,
      verifiedAt: rep.verifiedAt,
      completedAt: rep.completedAt,
      completionPhotoUrl: rep.completionPhotoUrl,
      followUpPhotos: Array.isArray(rep.followUpPhotos) ? rep.followUpPhotos : [],
      serviceCategoryId: rep.serviceCategoryId,
      serviceCategoryTitle: rep.serviceCategoryTitle,
      serviceSubItemId: rep.serviceSubItemId,
      serviceSubItemLabel: rep.serviceSubItemLabel,
      documentCode: rep.documentCode,
      officialHeaderTitle: rep.officialHeaderTitle,
      processingUnit: rep.processingUnit,
      applicantNik: rep.applicantNik,
      specificFieldsData: rep.specificFieldsData,
      letterRegisterNumber: rep.letterRegisterNumber,
      signedByOfficer: rep.signedByOfficer,
    };

    const nextReports = [newReport, ...stateRef.current.reports];
    setReports(nextReports);
    commitPersistence({ reports: nextReports });
    return { ok: true };
  };

  const handleAdminUpdateReport = async (
    id: string,
    rep: Partial<CitizenReport>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const existing = stateRef.current.reports.find((r) => r.id === id);
    if (!existing) {
      return { ok: false, errors: ['Data laporan tidak ditemukan.'] };
    }
    const merged: CitizenReport = {
      ...existing,
      ...rep,
      updatedAt: '06 Okt 2026 · Diperbarui',
    };
    const errors: string[] = [];
    if (!merged.title || merged.title.trim().length < 5) {
      errors.push('Judul laporan wajib diisi (minimal 5 karakter).');
    }
    if (!merged.description || merged.description.trim().length < 10) {
      errors.push('Deskripsi permasalahan wajib diisi (minimal 10 karakter).');
    }
    if (!merged.reporterName || merged.reporterName.trim().length < 2) {
      errors.push('Nama pelapor wajib diisi.');
    }
    if (!merged.locationName || merged.locationName.trim().length < 4) {
      errors.push('Lokasi atau patokan jalan wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextReports = stateRef.current.reports.map((r) => (r.id === id ? merged : r));
    setReports(nextReports);
    commitPersistence({ reports: nextReports });
    triggerStatusToast(merged.ticketCode, merged.title, merged.status, merged.assignedTeam);
    return { ok: true };
  };

  const handleAdminDeleteReport = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextReports = stateRef.current.reports.filter((r) => r.id !== id);
    setReports(nextReports);
    commitPersistence({ reports: nextReports });
    return { ok: true };
  };

  const handleUpvoteReport = (id: string) => {
    const target = stateRef.current.reports.find((r) => r.id === id);
    if (!target) return;
    const nextUpvotes = target.upvotes + 1;
    const nextReports = stateRef.current.reports.map((r) =>
      r.id === id ? { ...r, upvotes: nextUpvotes } : r
    );
    setReports(nextReports);
    commitPersistence({ reports: nextReports });
  };

  const handleUpdateReportStatus = (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => {
    const targetReport = stateRef.current.reports.find((r) => r.id === id);
    const nextReports = stateRef.current.reports.map((r) =>
      r.id === id
        ? {
            ...r,
            status: newStatus,
            assignedTeam,
            responseNote,
            updatedAt: '06 Okt 2026 · Diperbarui',
          }
        : r
    );
    setReports(nextReports);
    commitPersistence({ reports: nextReports });
    if (targetReport) {
      triggerStatusToast(
        targetReport.ticketCode,
        targetReport.title,
        newStatus,
        assignedTeam
      );
    }
  };

  // 3. Waste Bank Units & Logs CRUD
  const handleAdminCreateWasteUnit = async (
    unit: Partial<WasteBankUnit>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const errors: string[] = [];
    if (!unit.rw || !unit.rw.trim()) {
      errors.push('Wilayah RW wajib diisi.');
    }
    if (!unit.unitName || unit.unitName.trim().length < 3) {
      errors.push('Nama Bank Sampah Unit (BSU) wajib diisi.');
    }
    if (!unit.coordinator || unit.coordinator.trim().length < 3) {
      errors.push('Nama koordinator BSU wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const newUnit: WasteBankUnit = {
      id: `bsu-${Date.now()}`,
      rw: unit.rw!.trim(),
      unitName: unit.unitName!.trim(),
      coordinator: unit.coordinator!.trim(),
      locationLabel: unit.locationLabel?.trim() || 'Kawasan Kelurahan Panaikang',
      mapX: typeof unit.mapX === 'number' ? unit.mapX : 55,
      mapY: typeof unit.mapY === 'number' ? unit.mapY : 55,
      organikKg: Math.max(0, Number(unit.organikKg) || 0),
      anorganikKg: Math.max(0, Number(unit.anorganikKg) || 0),
      residuKg: Math.max(0, Number(unit.residuKg) || 0),
      activeHouseholds: Math.max(1, Number(unit.activeHouseholds) || 50),
      pickupSchedule: unit.pickupSchedule?.trim() || 'Senin, Rabu, Jumat · 06:30 WITA',
      imageUrl: unit.imageUrl?.trim() || '',
      lastUpdated: '06 Okt 2026',
    };

    const nextUnits = [...stateRef.current.wasteUnits, newUnit];
    setWasteUnits(nextUnits);
    commitPersistence({ wasteUnits: nextUnits });
    return { ok: true };
  };

  const handleAdminUpdateWasteUnit = async (
    id: string,
    unit: Partial<WasteBankUnit>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const existing = stateRef.current.wasteUnits.find((u) => u.id === id);
    if (!existing) {
      return { ok: false, errors: ['Unit Bank Sampah tidak ditemukan.'] };
    }
    const merged: WasteBankUnit = {
      ...existing,
      ...unit,
      organikKg: Math.max(0, Number(unit.organikKg ?? existing.organikKg) || 0),
      anorganikKg: Math.max(0, Number(unit.anorganikKg ?? existing.anorganikKg) || 0),
      residuKg: Math.max(0, Number(unit.residuKg ?? existing.residuKg) || 0),
      activeHouseholds: Math.max(
        1,
        Number(unit.activeHouseholds ?? existing.activeHouseholds) || 1
      ),
      imageUrl: unit.imageUrl !== undefined ? unit.imageUrl : existing.imageUrl,
      lastUpdated: '06 Okt 2026',
    };
    const errors: string[] = [];
    if (!merged.unitName || merged.unitName.trim().length < 3) {
      errors.push('Nama Bank Sampah Unit (BSU) wajib diisi.');
    }
    if (!merged.coordinator || merged.coordinator.trim().length < 3) {
      errors.push('Nama koordinator BSU wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextUnits = stateRef.current.wasteUnits.map((u) => (u.id === id ? merged : u));
    setWasteUnits(nextUnits);
    commitPersistence({ wasteUnits: nextUnits });
    return { ok: true };
  };

  const handleAdminDeleteWasteUnit = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextUnits = stateRef.current.wasteUnits.filter((u) => u.id !== id);
    setWasteUnits(nextUnits);
    commitPersistence({ wasteUnits: nextUnits }, true);
    fetch('/api/waste-units/' + id, { method: 'DELETE' }).catch(() => {});
    return { ok: true };
  };

  const handleAddWasteLog = (
    rw: string,
    organikKg: number,
    anorganikKg: number,
    residuKg: number,
    officerName: string,
    notes: string
  ) => {
    const org = Math.max(0, Number(organikKg) || 0);
    const anorg = Math.max(0, Number(anorganikKg) || 0);
    const resKg = Math.max(0, Number(residuKg) || 0);
    const targetUnit = stateRef.current.wasteUnits.find((u) => u.rw === rw);
    const newLog: WasteLogEntry = {
      id: `log-${Date.now()}`,
      date: '06 Okt 2026 · Baru Saja',
      rw,
      unitName: targetUnit ? targetUnit.unitName : `BSU ${rw}`,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
      officerName: officerName.trim() || `Petugas BSU ${rw}`,
      notes: notes.trim() || `Penimbangan harian terpilah ${rw}.`,
    };
    const nextLogs = [newLog, ...stateRef.current.wasteLogs];
    const nextUnits = stateRef.current.wasteUnits.map((u) =>
      u.rw === rw
        ? {
            ...u,
            organikKg: u.organikKg + org,
            anorganikKg: u.anorganikKg + anorg,
            residuKg: u.residuKg + resKg,
            lastUpdated: '06 Okt 2026',
          }
        : u
    );
    setWasteLogs(nextLogs);
    setWasteUnits(nextUnits);
    commitPersistence({ wasteLogs: nextLogs, wasteUnits: nextUnits });
  };

  const handleAdminUpdateWasteLog = async (
    id: string,
    updated: Partial<WasteLogEntry>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const existing = stateRef.current.wasteLogs.find((l) => l.id === id);
    if (!existing) {
      return { ok: false, errors: ['Log penimbangan tidak ditemukan.'] };
    }
    const org = Math.max(0, Number(updated.organikKg ?? existing.organikKg) || 0);
    const anorg = Math.max(0, Number(updated.anorganikKg ?? existing.anorganikKg) || 0);
    const resKg = Math.max(0, Number(updated.residuKg ?? existing.residuKg) || 0);
    if (org + anorg + resKg <= 0) {
      return { ok: false, errors: ['Total timbangan sampah harus lebih dari 0 kg.'] };
    }
    const merged: WasteLogEntry = {
      ...existing,
      ...updated,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
    };
    const nextLogs = stateRef.current.wasteLogs.map((l) => (l.id === id ? merged : l));
    setWasteLogs(nextLogs);
    commitPersistence({ wasteLogs: nextLogs });
    return { ok: true };
  };

  const handleAdminDeleteWasteLog = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextLogs = stateRef.current.wasteLogs.filter((l) => l.id !== id);
    setWasteLogs(nextLogs);
    commitPersistence({ wasteLogs: nextLogs }, true);
    fetch('/api/waste-logs/' + id, { method: 'DELETE' }).catch(() => {});
    return { ok: true };
  };

  // 3B. Teba Spots CRUD
  const handleAdminCreateTebaSpot = async (
    spot: Partial<TebaSpot>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const rwClean = spot.rw || 'RW 01';
    const newSpot: TebaSpot = {
      id: 'teba-' + Date.now(),
      name: spot.name || 'Titik Teba Komunal',
      code:
        spot.code ||
        'TEBA-' + rwClean.replace(/\s+/g, '') + '-' + Date.now().toString().slice(-3),
      rw: rwClean,
      rt: spot.rt || 'RT 01',
      address: spot.address || 'Kelurahan Panaikang',
      locationTag: spot.locationTag || 'Patokan Titik Teba',
      mapUrl: spot.mapUrl || '',
      imageUrl: spot.imageUrl || '',
      documentationPhotos: spot.documentationPhotos || [spot.imageUrl || ''],
      capacityKg: Number(spot.capacityKg) || 300,
      currentLoadKg: Number(spot.currentLoadKg) || 0,
      wasteTypeProcessed: spot.wasteTypeProcessed || 'Sisa sayur dapur & dedaunan',
      coordinatorName: spot.coordinatorName || 'Kader Lingkungan',
      coordinatorPhone: spot.coordinatorPhone || '',
      status: spot.status || 'Aktif Beroperasi',
      description:
        spot.description || 'Fasilitas teba komunal biopori resapan organik mandiri.',
      lastHarvestDate: spot.lastHarvestDate || 'Belum ada panen',
      createdAt: new Date().toLocaleDateString('id-ID'),
    };
    const next = [newSpot, ...stateRef.current.tebaSpots.filter((s) => s.id !== newSpot.id)];
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpot),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminUpdateTebaSpot = async (
    id: string,
    spot: Partial<TebaSpot>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const next = stateRef.current.tebaSpots.map((s) =>
      s.id === id ? { ...s, ...spot, updatedAt: new Date().toLocaleDateString('id-ID') } : s
    );
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spot),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminDeleteTebaSpot = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const next = stateRef.current.tebaSpots.filter((s) => s.id !== id);
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots/' + id, {
      method: 'DELETE',
    }).catch(() => {});

    return { ok: true };
  };

  // 3C. Biopori Points CRUD
  const handleAdminCreateBioporiPoint = async (
    point: Partial<BioporiPoint>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const rwClean = point.rw || 'RW 01';
    const newPoint: BioporiPoint = {
      id: 'bio-' + Date.now(),
      name: point.name || 'Zona Lubang Biopori Komunal',
      code:
        point.code ||
        'BIO-' + rwClean.replace(/\s+/g, '') + '-' + Date.now().toString().slice(-3),
      rw: rwClean,
      rt: point.rt || 'RT 01',
      address: point.address || 'Kelurahan Panaikang',
      locationTag: point.locationTag || 'Patokan Titik Biopori',
      totalHoles: Number(point.totalHoles) || 12,
      diameterCm: Number(point.diameterCm) || 10,
      depthCm: Number(point.depthCm) || 100,
      organicTypes:
        point.organicTypes || 'Sisa sayuran dapur rumah tangga, dedaunan kering, kulit buah',
      status: point.status || 'Aktif Digunakan',
      coordinatorName: point.coordinatorName || 'Kader Lingkungan',
      coordinatorPhone: point.coordinatorPhone || '',
      mapUrl: point.mapUrl || '',
      imageUrl: point.imageUrl || '',
      documentationPhotos: point.documentationPhotos || [point.imageUrl || ''],
      harvestHistory: point.harvestHistory || 'Belum ada catatan panen',
      installationDate: point.installationDate || new Date().toLocaleDateString('id-ID'),
      notes: point.notes || 'Pipa biopori resapan air & pengomposan organik mandiri.',
      updatedAt: new Date().toLocaleDateString('id-ID'),
    };
    const next = [newPoint, ...stateRef.current.bioporiPoints.filter((b) => b.id !== newPoint.id)];
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPoint),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminUpdateBioporiPoint = async (
    id: string,
    point: Partial<BioporiPoint>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const next = stateRef.current.bioporiPoints.map((b) =>
      b.id === id ? { ...b, ...point, updatedAt: new Date().toLocaleDateString('id-ID') } : b
    );
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(point),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminDeleteBioporiPoint = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const next = stateRef.current.bioporiPoints.filter((b) => b.id !== id);
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points/' + id, {
      method: 'DELETE',
    }).catch(() => {});

    return { ok: true };
  };

  // 4. Cleanup Events (Kerja Bakti) CRUD
  const handleJoinCleanup = (eventId: string, participantCount: number) => {
    const target = stateRef.current.cleanupEvents.find((e) => e.id === eventId);
    if (!target) return;
    const nextCount = target.registeredParticipants + participantCount;
    const nextEvents = stateRef.current.cleanupEvents.map((ev) =>
      ev.id === eventId ? { ...ev, registeredParticipants: nextCount } : ev
    );
    setCleanupEvents(nextEvents);
    commitPersistence({ cleanupEvents: nextEvents });
  };

  const handleAddCleanupEvent = (newEventData: Omit<CleanupEvent, 'id'>) => {
    const created: CleanupEvent = {
      ...newEventData,
      id: `kb-${Date.now()}`,
      imageUrl: newEventData.status === 'Tuntas' ? newEventData.imageUrl : '',
      documentationPhotos:
        newEventData.status === 'Tuntas' ? newEventData.documentationPhotos || [] : [],
    };
    const nextEvents = [created, ...stateRef.current.cleanupEvents];
    setCleanupEvents(nextEvents);
    commitPersistence({ cleanupEvents: nextEvents });
  };

  const handleAdminCreateCleanup = async (
    ev: Partial<CleanupEvent>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const errors: string[] = [];
    if (!ev.title || ev.title.trim().length < 5) {
      errors.push('Nama kegiatan kerja bakti wajib diisi (minimal 5 karakter).');
    }
    if (!ev.date || !ev.date.trim()) {
      errors.push('Hari & tanggal pelaksanaan wajib diisi.');
    }
    if (!ev.locationName || ev.locationName.trim().length < 4) {
      errors.push('Lokasi titik kumpul kerja bakti wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const isCompleted = ev.status === 'Tuntas';
    const rawDocs =
      isCompleted && Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
        ? ev.documentationPhotos
        : isCompleted && ev.imageUrl
        ? [ev.imageUrl]
        : [];

    const created: CleanupEvent = {
      id: `kb-${Date.now()}`,
      title: ev.title!.trim(),
      date: ev.date!.trim(),
      timeRange: ev.timeRange?.trim() || '06:30 – 09:30 WITA',
      rw: ev.rw || 'RW 01',
      rtScope: ev.rtScope || 'Seluruh RT',
      locationName: ev.locationName!.trim(),
      mapX: typeof ev.mapX === 'number' ? ev.mapX : 45,
      mapY: typeof ev.mapY === 'number' ? ev.mapY : 50,
      coordinator: ev.coordinator?.trim() || `Koordinator ${ev.rw || 'RW 01'}`,
      status: ev.status || 'Terjadwal',
      targetParticipants: Math.max(1, Number(ev.targetParticipants) || 80),
      registeredParticipants: Math.max(0, Number(ev.registeredParticipants) || 10),
      collectedWasteKg: isCompleted ? Math.max(0, Number(ev.collectedWasteKg) || 0) : 0,
      focusAreas:
        Array.isArray(ev.focusAreas) && ev.focusAreas.length > 0
          ? ev.focusAreas
          : ['Pembersihan saluran drainase dan jalan lingkungan'],
      equipmentNeeded:
        Array.isArray(ev.equipmentNeeded) && ev.equipmentNeeded.length > 0
          ? ev.equipmentNeeded
          : ['Sapu lidi', 'Cangkul', 'Kantong pilah sampah'],
      imageUrl: isCompleted ? ev.imageUrl || rawDocs[0] || '' : '',
      documentationPhotos: isCompleted ? rawDocs : [],
      summaryNote:
        ev.summaryNote?.trim() || 'Kegiatan gotong royong rutin warga Kelurahan Panaikang.',
    };

    const nextEvents = [created, ...stateRef.current.cleanupEvents];
    setCleanupEvents(nextEvents);
    commitPersistence({ cleanupEvents: nextEvents });
    return { ok: true };
  };

  const handleAdminUpdateCleanup = async (
    id: string,
    ev: Partial<CleanupEvent>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const existing = stateRef.current.cleanupEvents.find((item) => item.id === id);
    if (!existing) {
      return { ok: false, errors: ['Jadwal kerja bakti tidak ditemukan.'] };
    }
    const nextStatus = ev.status ?? existing.status;
    const isCompleted = nextStatus === 'Tuntas';
    const incomingDocs = Array.isArray(ev.documentationPhotos)
      ? ev.documentationPhotos
      : existing.documentationPhotos || [];

    const merged: CleanupEvent = {
      ...existing,
      ...ev,
      status: nextStatus,
      targetParticipants: Math.max(
        1,
        Number(ev.targetParticipants ?? existing.targetParticipants) || 1
      ),
      registeredParticipants: Math.max(
        0,
        Number(ev.registeredParticipants ?? existing.registeredParticipants) || 0
      ),
      collectedWasteKg: isCompleted
        ? Math.max(0, Number(ev.collectedWasteKg ?? existing.collectedWasteKg) || 0)
        : 0,
      imageUrl: isCompleted ? ev.imageUrl ?? existing.imageUrl ?? incomingDocs[0] ?? '' : '',
      documentationPhotos: isCompleted ? incomingDocs : [],
    };

    const errors: string[] = [];
    if (!merged.title || merged.title.trim().length < 5) {
      errors.push('Nama kegiatan kerja bakti wajib diisi (minimal 5 karakter).');
    }
    if (!merged.date || !merged.date.trim()) {
      errors.push('Hari & tanggal pelaksanaan wajib diisi.');
    }
    if (!merged.locationName || merged.locationName.trim().length < 4) {
      errors.push('Lokasi titik kumpul kerja bakti wajib diisi.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextEvents = stateRef.current.cleanupEvents.map((item) =>
      item.id === id ? merged : item
    );
    setCleanupEvents(nextEvents);
    commitPersistence({ cleanupEvents: nextEvents });
    return { ok: true };
  };

  const handleAdminDeleteCleanup = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextEvents = stateRef.current.cleanupEvents.filter((item) => item.id !== id);
    setCleanupEvents(nextEvents);
    commitPersistence({ cleanupEvents: nextEvents });
    return { ok: true };
  };

  // 5. Informasi Seputar Kelurahan Panaikang CRUD
  const handleAdminCreateInfo = async (
    info: Partial<KelurahanInfoItem>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const errors: string[] = [];
    if (!info.title || info.title.trim().length < 5) {
      errors.push('Judul informasi kelurahan wajib diisi (minimal 5 karakter).');
    }
    if (!info.content || info.content.trim().length < 15) {
      errors.push('Isi teks informasi kelurahan wajib diisi (minimal 15 karakter).');
    }
    if (!info.imageUrl || !info.imageUrl.trim()) {
      errors.push('Gambar informasi wajib dipilih atau diunggah.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const cleanContent = info.content!.trim();
    const createdItem: KelurahanInfoItem = {
      id: `info-${Date.now()}`,
      title: info.title!.trim(),
      category: info.category?.trim() || 'Pengumuman Kelurahan',
      summary:
        info.summary?.trim() ||
        (cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent),
      content: cleanContent,
      imageUrl: info.imageUrl!.trim(),
      publishedAt: info.publishedAt?.trim() || '06 Okt 2026',
      author: info.author?.trim() || 'Lurah Panaikang',
      instagramHandle: info.instagramHandle?.trim() || '@kelurahan.panaikang',
      instagramPostUrl:
        info.instagramPostUrl?.trim() || 'https://www.instagram.com/kelurahan.panaikang/',
      instagramLikes: typeof info.instagramLikes === 'number' ? info.instagramLikes : 128,
      instagramCommentsCount:
        typeof info.instagramCommentsCount === 'number' ? info.instagramCommentsCount : 19,
      isInstagramSynced: info.isInstagramSynced ?? true,
      hashtags: Array.isArray(info.hashtags)
        ? info.hashtags
        : ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KotaMakassar'],
    };

    const nextInfos = [createdItem, ...stateRef.current.kelurahanInfos];
    setKelurahanInfos(nextInfos);
    commitPersistence({ kelurahanInfos: nextInfos });
    return { ok: true };
  };

  const handleAdminUpdateInfo = async (
    id: string,
    info: Partial<KelurahanInfoItem>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const errors: string[] = [];
    if (!info.title || info.title.trim().length < 5) {
      errors.push('Judul informasi kelurahan wajib diisi (minimal 5 karakter).');
    }
    if (!info.content || info.content.trim().length < 15) {
      errors.push('Isi teks informasi kelurahan wajib diisi (minimal 15 karakter).');
    }
    if (!info.imageUrl || !info.imageUrl.trim()) {
      errors.push('Gambar informasi wajib dipilih atau diunggah.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const cleanContent = info.content!.trim();
    const nextInfos = stateRef.current.kelurahanInfos.map((item) =>
      item.id === id
        ? ({
            ...item,
            ...info,
            title: info.title!.trim(),
            content: cleanContent,
            summary:
              info.summary?.trim() ||
              (cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent),
          } as KelurahanInfoItem)
        : item
    );
    setKelurahanInfos(nextInfos);
    commitPersistence({ kelurahanInfos: nextInfos });
    return { ok: true };
  };

  const handleAdminDeleteInfo = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextInfos = stateRef.current.kelurahanInfos.filter((item) => item.id !== id);
    setKelurahanInfos(nextInfos);
    commitPersistence({ kelurahanInfos: nextInfos });
    return { ok: true };
  };

  const handleSyncInstagram = async (): Promise<{ ok: boolean; syncedAt?: string }> => {
    const customPosts = stateRef.current.kelurahanInfos.filter(
      (i) => !INITIAL_KELURAHAN_INFOS.some((init) => init.id === i.id)
    );
    const nextInfos = [...customPosts, ...INITIAL_KELURAHAN_INFOS];
    setKelurahanInfos(nextInfos);
    commitPersistence({ kelurahanInfos: nextInfos });
    const syncedAt =
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
    return { ok: true, syncedAt };
  };

  // 6. Data RT & RW CRUD
  const handleSaveRwGroups = async (
    updatedGroups: RwGroup[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const nextProfile: KelurahanProfile = {
      ...stateRef.current.profile,
      totalRw: updatedGroups.length,
      totalRt: updatedGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
    };
    setRwGroups(updatedGroups);
    setKelurahanProfile(nextProfile);
    commitPersistence({ rwGroups: updatedGroups, profile: nextProfile });
    return { ok: true };
  };

  // 7. WhatsApp Recipients CRUD (Lurah / Administrator)
  const handleSaveWhatsAppRecipients = async (
    updatedRecipients: WhatsAppRecipient[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    setWhatsappRecipients(updatedRecipients);
    commitPersistence({ whatsappRecipients: updatedRecipients });
    return { ok: true };
  };

  // 8. Katalog Menu Pengurusan Warga CRUD (Back-End 7 Bidang & 44 Sub-Menu)
  const handleSaveServiceCatalog = async (
    updatedCatalog: ServiceCategoryGroup[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    setServiceCatalog(updatedCatalog);
    commitPersistence({ serviceCatalog: updatedCatalog });
    try {
      await fetch('/api/warga-services/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCatalog: updatedCatalog }),
      });
    } catch {
      // Fallback already persisted via localStorage & /api/data
    }
    return { ok: true };
  };

  // 9. Parameter User & Batasan Akses Admin CRUD (Master Admin / Lurah)
  const handleSaveAdminUsers = async (
    updatedUsers: AdminUserAccount[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    setAdminUsers(updatedUsers);
    commitPersistence({ adminUsers: updatedUsers });
    try {
      await fetch('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsers: updatedUsers }),
      });
    } catch {
      // Fallback already persisted via localStorage & /api/data
    }
    return { ok: true };
  };

  // 10. Log Aktivitas Admin (Audit Trail Lurah)
  const handleRecordActivityLog = useCallback(
    (entry: Omit<AdminActivityLog, 'id' | 'timestamp' | 'createdAtMs'>) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const newLog: AdminActivityLog = {
        ...entry,
        id: `log-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: `${dateStr} · ${timeStr} WITA`,
        createdAtMs: now.getTime(),
      };
      const nextLogs = [newLog, ...stateRef.current.activityLogs].slice(0, 500);
      setActivityLogs(nextLogs);
      commitPersistence({ activityLogs: nextLogs });
      fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch(() => {});
    },
    [commitPersistence]
  );

  const handleResetActivityLogs = async (): Promise<{ ok: boolean; errors?: string[] }> => {
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    commitPersistence({ activityLogs: INITIAL_ACTIVITY_LOGS });
    try {
      await fetch('/api/activity-logs/reset', {
        method: 'POST',
      });
    } catch {
      // Fallback already persisted
    }
    return { ok: true };
  };

  // 11. Urban Farming Spots & Seed Requests Admin CRUD
  const handleAdminAddUrbanFarmingSpot = useCallback(
    async (spot: UrbanFarmingSpot): Promise<{ ok: boolean; errors?: string[] }> => {
      const nextSpots = [spot, ...stateRef.current.urbanFarmingSpots];
      setUrbanFarmingSpots(nextSpots);
      commitPersistence({ urbanFarmingSpots: nextSpots });
      try {
        await fetch('/api/urban-farming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spot),
        });
      } catch {
        // Fallback persisted via localStorage & PUT /api/data
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleAdminUpdateUrbanFarmingSpot = useCallback(
    async (
      id: string,
      updated: Partial<UrbanFarmingSpot>
    ): Promise<{ ok: boolean; errors?: string[] }> => {
      const existing = stateRef.current.urbanFarmingSpots.find((s) => s.id === id);
      if (!existing) {
        return { ok: false, errors: ['Data kebun urban farming tidak ditemukan.'] };
      }
      const merged: UrbanFarmingSpot = { ...existing, ...updated };
      const nextSpots = stateRef.current.urbanFarmingSpots.map((s) => (s.id === id ? merged : s));
      setUrbanFarmingSpots(nextSpots);
      commitPersistence({ urbanFarmingSpots: nextSpots });
      try {
        await fetch(`/api/urban-farming/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleAdminDeleteUrbanFarmingSpot = useCallback(
    async (id: string): Promise<{ ok: boolean; errors?: string[] }> => {
      recordDeletedItemId(id);
      const nextSpots = stateRef.current.urbanFarmingSpots.filter((s) => s.id !== id);
      setUrbanFarmingSpots(nextSpots);
      commitPersistence({ urbanFarmingSpots: nextSpots });
      try {
        await fetch(`/api/urban-farming/${id}`, {
          method: 'DELETE',
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleAdminAddSeedRequest = useCallback(
    async (req: SeedRequestItem): Promise<{ ok: boolean; errors?: string[] }> => {
      const nextReqs = [req, ...stateRef.current.seedRequests];
      setSeedRequests(nextReqs);
      commitPersistence({ seedRequests: nextReqs });
      try {
        await fetch('/api/seed-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleAdminUpdateSeedRequest = useCallback(
    async (
      id: string,
      updated: Partial<SeedRequestItem>
    ): Promise<{ ok: boolean; errors?: string[] }> => {
      const existing = stateRef.current.seedRequests.find((r) => r.id === id);
      if (!existing) {
        return { ok: false, errors: ['Permohonan bibit tidak ditemukan.'] };
      }
      const merged: SeedRequestItem = { ...existing, ...updated };
      const nextReqs = stateRef.current.seedRequests.map((r) => (r.id === id ? merged : r));
      setSeedRequests(nextReqs);
      commitPersistence({ seedRequests: nextReqs });
      try {
        await fetch(`/api/seed-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleAdminDeleteSeedRequest = useCallback(
    async (id: string): Promise<{ ok: boolean; errors?: string[] }> => {
      const nextReqs = stateRef.current.seedRequests.filter((r) => r.id !== id);
      setSeedRequests(nextReqs);
      commitPersistence({ seedRequests: nextReqs });
      try {
        await fetch(`/api/seed-requests/${id}`, {
          method: 'DELETE',
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Compact 3-Zone Single-Row Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        {/* Zone 1: Application Brand Logo */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('beranda');
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-tight text-[#0D3868] whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <img
            src="/assets/aistudio/logo-panaikang-smart-environment-transparent.png"
            alt="Panaikang Smart Environment"
            className="h-7 sm:h-8.5 w-auto object-contain"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.includes('WA0000')) {
                target.src = '/assets/aistudio/IMG-20261024-WA0000_e50bebb6.jpg';
              }
            }}
          />
        </a>

        {/* Zone 2: Compact text navigation links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-xs font-semibold text-slate-600">
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('beranda');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#0D3868] hover:underline underline-offset-4 ${
              activeView === 'beranda' ? 'text-[#0D3868] font-bold underline' : ''
            }`}
          >
            Beranda
          </a>
          <a
            href="#profil"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('profil');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#0D3868] hover:underline underline-offset-4 ${
              activeView === 'profil' ? 'text-[#0D3868] font-bold underline' : ''
            }`}
          >
            Profil Kelurahan
          </a>
          <a
            href="#rtrw"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('rtrw');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#0D3868] hover:underline underline-offset-4 ${
              activeView === 'rtrw' ? 'text-[#0D3868] font-bold underline' : ''
            }`}
          >
            Data RT & RW
          </a>
          <a
            href="#warga"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('warga');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#0277BD] hover:underline underline-offset-4 ${
              activeView === 'warga' ? 'text-[#0277BD] font-bold underline' : ''
            }`}
          >
            Menu Warga
          </a>
          <a
            href="#peta"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('peta');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#00838F] hover:underline underline-offset-4 ${
              activeView === 'peta' ? 'text-[#00838F] font-bold underline' : ''
            }`}
          >
            Peta Digital
          </a>
          <a
            href="#sampah"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('sampah');
            }}
            className={`hidden lg:inline-block whitespace-nowrap transition-colors hover:text-[#EF6C00] hover:underline underline-offset-4 ${
              activeView === 'sampah' ? 'text-[#EF6C00] font-bold underline' : ''
            }`}
          >
            Pengelolaan Sampah
          </a>
          <a
            href="#kerjabakti"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('kerjabakti');
            }}
            className={`hidden lg:inline-block whitespace-nowrap transition-colors hover:text-[#5E35B1] hover:underline underline-offset-4 ${
              activeView === 'kerjabakti' ? 'text-[#5E35B1] font-bold underline' : ''
            }`}
          >
            Kerja Bakti
          </a>
          <a
            href="#urbanfarming"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('urbanfarming');
            }}
            className={`hidden xl:inline-block whitespace-nowrap transition-colors hover:text-[#059669] hover:underline underline-offset-4 ${
              activeView === 'urbanfarming' ? 'text-[#059669] font-bold underline' : ''
            }`}
          >
            Urban Farming
          </a>
        </nav>

        {/* Zone 3: Compact Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate('admin')}
            className="px-2.5 py-1.5 text-[11px] font-bold text-[#0D3868] bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Admin Panel
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('warga')}
            className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#1C8237] rounded-lg hover:bg-[#146329] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Lapor Masalah
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'beranda' && (
          <HomePortal
            onNavigate={handleNavigate}
            reports={reports}
            wasteUnits={wasteUnits}
            cleanupEvents={cleanupEvents}
            kelurahanInfos={kelurahanInfos}
            rwGroups={rwGroups}
            urbanFarmingSpots={urbanFarmingSpots}
            onSyncInstagram={handleSyncInstagram}
            onQuickReportClick={() => handleNavigate('warga')}
          />
        )}

        {activeView === 'profil' && (
          <ProfilKelurahanView
            profile={kelurahanProfile}
            wasteUnits={wasteUnits}
            rwGroups={rwGroups}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'rtrw' && (
          <DataRtRwView rwGroups={rwGroups} onNavigate={handleNavigate} />
        )}

        {activeView === 'warga' && (
          <UntukWargaView
            reports={reports}
            wasteUnits={wasteUnits}
            rwGroups={rwGroups}
            whatsappRecipients={whatsappRecipients}
            kelurahanProfile={kelurahanProfile}
            kelurahanInfos={kelurahanInfos}
            cleanupEvents={cleanupEvents}
            serviceCatalog={serviceCatalog}
            onAddReport={handleAddReport}
            onUpvoteReport={handleUpvoteReport}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'lurah' && (
          <DashboardLurahView
            reports={reports}
            wasteUnits={wasteUnits}
            cleanupEvents={cleanupEvents}
            onUpdateReportStatus={handleUpdateReportStatus}
            onNavigate={handleNavigate}
            onRedirectToAdminLogin={() => {
              setAdminInitialTab('dashboard_lurah');
              handleNavigate('admin');
            }}
          />
        )}

        {activeView === 'peta' && (
          <PetaDigitalView
            reports={reports}
            wasteUnits={wasteUnits}
            cleanupEvents={cleanupEvents}
            onUpdateReportStatus={handleUpdateReportStatus}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'sampah' && (
          <MonitoringSampahView
            wasteUnits={wasteUnits}
            wasteLogs={wasteLogs}
            tebaSpots={tebaSpots}
            bioporiPoints={bioporiPoints}
            onAddWasteLog={handleAddWasteLog}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'kerjabakti' && (
          <MonitoringKerjaBaktiView
            cleanupEvents={cleanupEvents}
            onJoinCleanup={handleJoinCleanup}
            onAddCleanupEvent={handleAddCleanupEvent}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'urbanfarming' && (
          <UrbanFarmingView
            onNavigate={handleNavigate}
            profile={kelurahanProfile}
            rwGroups={rwGroups}
            spots={urbanFarmingSpots}
            onAddSpot={handleAddUrbanFarmingSpot}
            seedRequests={seedRequests}
            onAddSeedRequest={handleAddSeedRequest}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanelView
            profile={kelurahanProfile}
            rwGroups={rwGroups}
            reports={reports}
            wasteUnits={wasteUnits}
            wasteLogs={wasteLogs}
            cleanupEvents={cleanupEvents}
            kelurahanInfos={kelurahanInfos}
            whatsappRecipients={whatsappRecipients}
            serviceCatalog={serviceCatalog}
            adminUsers={adminUsers}
            activityLogs={activityLogs}
            onSaveProfile={handleSaveProfileApi}
            onSaveRwGroups={handleSaveRwGroups}
            onSaveWhatsAppRecipients={handleSaveWhatsAppRecipients}
            onSaveServiceCatalog={handleSaveServiceCatalog}
            onSaveAdminUsers={handleSaveAdminUsers}
            onRecordActivityLog={handleRecordActivityLog}
            onResetActivityLogs={handleResetActivityLogs}
            onCreateReport={handleAdminCreateReport}
            onUpdateReport={handleAdminUpdateReport}
            onDeleteReport={handleAdminDeleteReport}
            onCreateWasteUnit={handleAdminCreateWasteUnit}
            onUpdateWasteUnit={handleAdminUpdateWasteUnit}
            onDeleteWasteUnit={handleAdminDeleteWasteUnit}
            onAddWasteLog={handleAddWasteLog}
            onUpdateWasteLog={handleAdminUpdateWasteLog}
            onDeleteWasteLog={handleAdminDeleteWasteLog}
            onCreateCleanup={handleAdminCreateCleanup}
            onUpdateCleanup={handleAdminUpdateCleanup}
            onDeleteCleanup={handleAdminDeleteCleanup}
            onCreateInfo={handleAdminCreateInfo}
            onUpdateInfo={handleAdminUpdateInfo}
            onDeleteInfo={handleAdminDeleteInfo}
            onSyncInstagram={handleSyncInstagram}
            onNavigate={handleNavigate}
            initialTab={adminInitialTab}
            onUpdateReportStatus={handleUpdateReportStatus}
            urbanFarmingSpots={urbanFarmingSpots}
            seedRequests={seedRequests}
            onAddUrbanFarmingSpot={handleAdminAddUrbanFarmingSpot}
            onUpdateUrbanFarmingSpot={handleAdminUpdateUrbanFarmingSpot}
            onDeleteUrbanFarmingSpot={handleAdminDeleteUrbanFarmingSpot}
            onAddSeedRequest={handleAdminAddSeedRequest}
            onUpdateSeedRequest={handleAdminUpdateSeedRequest}
            onDeleteSeedRequest={handleAdminDeleteSeedRequest}
            tebaSpots={tebaSpots}
            onCreateTebaSpot={handleAdminCreateTebaSpot}
            onUpdateTebaSpot={handleAdminUpdateTebaSpot}
            onDeleteTebaSpot={handleAdminDeleteTebaSpot}
            bioporiPoints={bioporiPoints}
            onCreateBioporiPoint={handleAdminCreateBioporiPoint}
            onUpdateBioporiPoint={handleAdminUpdateBioporiPoint}
            onDeleteBioporiPoint={handleAdminDeleteBioporiPoint}
            onExportDatabase={handleExportDatabase}
            onImportDatabase={handleImportDatabase}
          />
        )}
      </main>

      {/* Global Footer (Visible on inner views, HomePortal includes its own footer) */}
      {activeView !== 'beranda' && (
        <footer className="mt-auto border-t border-slate-200 bg-white py-3.5 px-4 text-center">
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
            Develope by @asmaracess
          </p>
        </footer>
      )}

      {/* Instant Toast Notification Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white rounded-2xl border border-slate-200 shadow-[0_14px_32px_-8px_rgba(15,23,42,0.22)] p-4 flex items-start gap-3 transition-all duration-150"
            >
              <div className="mt-0.5 shrink-0">
                {toast.newStatus === 'Selesai' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                {toast.newStatus === 'Sedang Ditangani' && (
                  <Clock className="w-5 h-5 text-sky-600" />
                )}
                {toast.newStatus === 'Menunggu Verifikasi' && (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-mono-num font-bold text-[#0D3868]">
                    {toast.ticketCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{toast.timestamp}</span>
                </div>

                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Status Diubah:{' '}
                  <span
                    className={
                      toast.newStatus === 'Selesai'
                        ? 'text-emerald-700'
                        : toast.newStatus === 'Sedang Ditangani'
                        ? 'text-sky-700'
                        : 'text-amber-700'
                    }
                  >
                    {toast.newStatus}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-600 truncate">
                  {toast.reportTitle}
                </p>
                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  Unit: {toast.assignedTeam}
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
