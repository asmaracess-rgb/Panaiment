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
  CleanupEvent,
  KelurahanProfile,
  KelurahanInfoItem,
  RwGroup,
  WhatsAppRecipient,
} from './types';
import {
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
} from './data/initialData';
import {
  loadPersistedDatabase,
  savePersistedDatabase,
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
import { AdminPanelView, AdminTab } from './components/AdminPanelView';

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
  const [reports, setReports] = useState<CitizenReport[]>(
    initialPersisted?.reports ?? INITIAL_REPORTS
  );
  const [wasteUnits, setWasteUnits] = useState<WasteBankUnit[]>(
    initialPersisted?.wasteUnits ?? INITIAL_WASTE_UNITS
  );
  const [wasteLogs, setWasteLogs] = useState<WasteLogEntry[]>(
    initialPersisted?.wasteLogs ?? INITIAL_WASTE_LOGS
  );
  const [cleanupEvents, setCleanupEvents] = useState<CleanupEvent[]>(
    initialPersisted?.cleanupEvents ?? INITIAL_CLEANUP_EVENTS
  );
  const [kelurahanInfos, setKelurahanInfos] = useState<KelurahanInfoItem[]>(
    initialPersisted?.kelurahanInfos ?? INITIAL_KELURAHAN_INFOS
  );
  const [rwGroups, setRwGroups] = useState<RwGroup[]>(
    initialPersisted?.rwGroups ?? INITIAL_RW_GROUPS
  );
  const [whatsappRecipients, setWhatsappRecipients] = useState<WhatsAppRecipient[]>(
    initialPersisted?.whatsappRecipients ?? INITIAL_WHATSAPP_RECIPIENTS
  );
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const stateRef = useRef({
    profile: kelurahanProfile,
    rwGroups,
    reports,
    wasteUnits,
    wasteLogs,
    cleanupEvents,
    kelurahanInfos,
    whatsappRecipients,
  });

  useEffect(() => {
    stateRef.current = {
      profile: kelurahanProfile,
      rwGroups,
      reports,
      wasteUnits,
      wasteLogs,
      cleanupEvents,
      kelurahanInfos,
      whatsappRecipients,
    };
  }, [
    kelurahanProfile,
    rwGroups,
    reports,
    wasteUnits,
    wasteLogs,
    cleanupEvents,
    kelurahanInfos,
    whatsappRecipients,
  ]);

  const commitPersistence = useCallback(
    (partial: Partial<Omit<PersistedDatabase, 'updatedAt'>>, syncServer = true) => {
      const nextSnapshot: PersistedDatabase = {
        profile: partial.profile ?? stateRef.current.profile,
        rwGroups: partial.rwGroups ?? stateRef.current.rwGroups,
        reports: partial.reports ?? stateRef.current.reports,
        wasteUnits: partial.wasteUnits ?? stateRef.current.wasteUnits,
        wasteLogs: partial.wasteLogs ?? stateRef.current.wasteLogs,
        cleanupEvents: partial.cleanupEvents ?? stateRef.current.cleanupEvents,
        kelurahanInfos: partial.kelurahanInfos ?? stateRef.current.kelurahanInfos,
        whatsappRecipients: partial.whatsappRecipients ?? stateRef.current.whatsappRecipients,
        updatedAt: Date.now(),
      };
      stateRef.current = {
        profile: nextSnapshot.profile,
        rwGroups: nextSnapshot.rwGroups,
        reports: nextSnapshot.reports,
        wasteUnits: nextSnapshot.wasteUnits,
        wasteLogs: nextSnapshot.wasteLogs,
        cleanupEvents: nextSnapshot.cleanupEvents,
        kelurahanInfos: nextSnapshot.kelurahanInfos,
        whatsappRecipients: nextSnapshot.whatsappRecipients,
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

  // Load and synchronize persistent state between browser localStorage and Express backend on mount
  useEffect(() => {
    let mounted = true;
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => res.json())
      .then((payload) => {
        if (!mounted || !payload?.ok || !payload.data) return;
        const serverDb = payload.data as Partial<PersistedDatabase>;
        const serverUpdatedAt = typeof serverDb.updatedAt === 'number' ? serverDb.updatedAt : 0;
        const currentLocal = loadPersistedDatabase();

        if (currentLocal && currentLocal.updatedAt >= serverUpdatedAt) {
          // Local browser state is up-to-date or has more recent edits/deletions: ensure server is synced
          if (currentLocal.updatedAt > serverUpdatedAt) {
            fetch('/api/data', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentLocal),
            }).catch(() => {});
          }
          return;
        }

        const nextProfile = serverDb.profile || INITIAL_KELURAHAN_PROFILE;
        const nextRwGroups = Array.isArray(serverDb.rwGroups)
          ? serverDb.rwGroups
          : INITIAL_RW_GROUPS;
        const nextReports = Array.isArray(serverDb.reports) ? serverDb.reports : INITIAL_REPORTS;
        const nextWasteUnits = Array.isArray(serverDb.wasteUnits)
          ? serverDb.wasteUnits
          : INITIAL_WASTE_UNITS;
        const nextWasteLogs = Array.isArray(serverDb.wasteLogs)
          ? serverDb.wasteLogs
          : INITIAL_WASTE_LOGS;
        const nextCleanupEvents = Array.isArray(serverDb.cleanupEvents)
          ? serverDb.cleanupEvents
          : INITIAL_CLEANUP_EVENTS;
        const nextKelurahanInfos = Array.isArray(serverDb.kelurahanInfos)
          ? serverDb.kelurahanInfos
          : INITIAL_KELURAHAN_INFOS;
        const nextWhatsappRecipients = Array.isArray(serverDb.whatsappRecipients)
          ? serverDb.whatsappRecipients
          : INITIAL_WHATSAPP_RECIPIENTS;

        setKelurahanProfile(nextProfile);
        setRwGroups(nextRwGroups);
        setReports(nextReports);
        setWasteUnits(nextWasteUnits);
        setWasteLogs(nextWasteLogs);
        setCleanupEvents(nextCleanupEvents);
        setKelurahanInfos(nextKelurahanInfos);
        setWhatsappRecipients(nextWhatsappRecipients);

        savePersistedDatabase({
          profile: nextProfile,
          rwGroups: nextRwGroups,
          reports: nextReports,
          wasteUnits: nextWasteUnits,
          wasteLogs: nextWasteLogs,
          cleanupEvents: nextCleanupEvents,
          kelurahanInfos: nextKelurahanInfos,
          whatsappRecipients: nextWhatsappRecipients,
          updatedAt: serverUpdatedAt || Date.now(),
        });
      })
      .catch(() => {
        // Offline or static Vercel environment: ensure current state is saved in localStorage
        const existingLocal = loadPersistedDatabase();
        if (!existingLocal) {
          commitPersistence({}, false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [commitPersistence]);

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
  };

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
    const nextUnits = stateRef.current.wasteUnits.filter((u) => u.id !== id);
    setWasteUnits(nextUnits);
    commitPersistence({ wasteUnits: nextUnits });
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
    const nextLogs = stateRef.current.wasteLogs.filter((l) => l.id !== id);
    setWasteLogs(nextLogs);
    commitPersistence({ wasteLogs: nextLogs });
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Compact 3-Zone Single-Row Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('beranda');
          }}
          className="text-xs sm:text-sm font-extrabold tracking-tight text-[#0D3868] whitespace-nowrap shrink-0"
        >
          Panaikang Smart Environment
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
            href="#lurah"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('lurah');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#2E7D32] hover:underline underline-offset-4 ${
              activeView === 'lurah' ? 'text-[#2E7D32] font-bold underline' : ''
            }`}
          >
            Dashboard Lurah
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
            Bank Sampah
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
            onSyncInstagram={handleSyncInstagram}
            onQuickReportClick={() => handleNavigate('warga')}
          />
        )}

        {activeView === 'profil' && (
          <ProfilKelurahanView
            profile={kelurahanProfile}
            wasteUnits={wasteUnits}
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
            onSaveProfile={handleSaveProfileApi}
            onSaveRwGroups={handleSaveRwGroups}
            onSaveWhatsAppRecipients={handleSaveWhatsAppRecipients}
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
          />
        )}
      </main>

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
