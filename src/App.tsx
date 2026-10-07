/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from './types';
import {
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_KELURAHAN_INFOS,
} from './data/initialData';
import { HomePortal } from './components/HomePortal';
import { ProfilKelurahanView } from './components/ProfilKelurahanView';
import { UntukWargaView } from './components/UntukWargaView';
import { DashboardLurahView } from './components/DashboardLurahView';
import { PetaDigitalView } from './components/PetaDigitalView';
import { MonitoringSampahView } from './components/MonitoringSampahView';
import { MonitoringKerjaBaktiView } from './components/MonitoringKerjaBaktiView';
import { AdminPanelView } from './components/AdminPanelView';

interface ToastNotification {
  id: string;
  ticketCode: string;
  reportTitle: string;
  newStatus: ReportStatus;
  assignedTeam: string;
  timestamp: string;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('beranda');
  const [kelurahanProfile, setKelurahanProfile] = useState<KelurahanProfile>(
    INITIAL_KELURAHAN_PROFILE
  );
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [wasteUnits, setWasteUnits] = useState<WasteBankUnit[]>(INITIAL_WASTE_UNITS);
  const [wasteLogs, setWasteLogs] = useState<WasteLogEntry[]>(INITIAL_WASTE_LOGS);
  const [cleanupEvents, setCleanupEvents] = useState<CleanupEvent[]>(INITIAL_CLEANUP_EVENTS);
  const [kelurahanInfos, setKelurahanInfos] = useState<KelurahanInfoItem[]>(
    INITIAL_KELURAHAN_INFOS
  );
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Load persistent state from Express backend on mount
  useEffect(() => {
    let mounted = true;
    fetch('/api/data')
      .then((res) => res.json())
      .then((payload) => {
        if (mounted && payload?.ok && payload.data) {
          if (payload.data.profile) setKelurahanProfile(payload.data.profile);
          if (Array.isArray(payload.data.reports)) setReports(payload.data.reports);
          if (Array.isArray(payload.data.wasteUnits)) setWasteUnits(payload.data.wasteUnits);
          if (Array.isArray(payload.data.wasteLogs)) setWasteLogs(payload.data.wasteLogs);
          if (Array.isArray(payload.data.cleanupEvents)) {
            setCleanupEvents(payload.data.cleanupEvents);
          }
          if (
            Array.isArray(payload.data.kelurahanInfos) &&
            payload.data.kelurahanInfos.length > 0
          ) {
            setKelurahanInfos(payload.data.kelurahanInfos);
          } else {
            // Auto-sync @kelurahan.panaikang posts if backend array was empty
            fetch('/api/infos/sync-instagram', { method: 'POST' })
              .then((r) => r.json())
              .then((syncJson) => {
                if (
                  mounted &&
                  syncJson?.ok &&
                  Array.isArray(syncJson.data) &&
                  syncJson.data.length > 0
                ) {
                  setKelurahanInfos(syncJson.data);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        // Fallback to initial state if needed
      });
    return () => {
      mounted = false;
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

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedProfile, misi: cleanMisi }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi server gagal.'] };
      }
      setKelurahanProfile(json.data);
      return { ok: true };
    } catch {
      setKelurahanProfile({ ...updatedProfile, misi: cleanMisi });
      return { ok: true };
    }
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
    setReports((prev) => [optimistic, ...prev]);

    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimistic),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && json.data) {
          setReports((prev) =>
            prev.map((item) => (item.id === optimistic.id ? json.data : item))
          );
        }
      })
      .catch(() => {});

    return ticketCode;
  };

  const handleAdminCreateReport = async (
    rep: Partial<CitizenReport>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rep),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Gagal memvalidasi data laporan.'] };
      }
      setReports((prev) => [json.data, ...prev]);
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminUpdateReport = async (
    id: string,
    rep: Partial<CitizenReport>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rep),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi perubahan laporan gagal.'] };
      }
      setReports((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      triggerStatusToast(
        json.data.ticketCode,
        json.data.title,
        json.data.status,
        json.data.assignedTeam
      );
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminDeleteReport = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Gagal menghapus data laporan.'] };
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
      return { ok: true };
    } catch {
      setReports((prev) => prev.filter((r) => r.id !== id));
      return { ok: true };
    }
  };

  const handleUpvoteReport = (id: string) => {
    const target = reports.find((r) => r.id === id);
    if (!target) return;
    const nextUpvotes = target.upvotes + 1;
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, upvotes: nextUpvotes } : r))
    );
    fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upvotes: nextUpvotes }),
    }).catch(() => {});
  };

  const handleUpdateReportStatus = (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => {
    const targetReport = reports.find((r) => r.id === id);
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              assignedTeam,
              responseNote,
              updatedAt: '06 Okt 2026 · Diperbarui',
            }
          : r
      )
    );
    if (targetReport) {
      triggerStatusToast(
        targetReport.ticketCode,
        targetReport.title,
        newStatus,
        assignedTeam
      );
    }
    fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, assignedTeam, responseNote }),
    }).catch(() => {});
  };

  // 3. Waste Bank Units & Logs CRUD
  const handleAdminCreateWasteUnit = async (
    unit: Partial<WasteBankUnit>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch('/api/waste-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi BSU gagal.'] };
      }
      setWasteUnits((prev) => [...prev, json.data]);
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminUpdateWasteUnit = async (
    id: string,
    unit: Partial<WasteBankUnit>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch(`/api/waste-units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi perubahan BSU gagal.'] };
      }
      setWasteUnits((prev) => prev.map((u) => (u.id === id ? json.data : u)));
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminDeleteWasteUnit = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      await fetch(`/api/waste-units/${id}`, { method: 'DELETE' });
      setWasteUnits((prev) => prev.filter((u) => u.id !== id));
      return { ok: true };
    } catch {
      setWasteUnits((prev) => prev.filter((u) => u.id !== id));
      return { ok: true };
    }
  };

  const handleAddWasteLog = (
    rw: string,
    organikKg: number,
    anorganikKg: number,
    residuKg: number,
    officerName: string,
    notes: string
  ) => {
    fetch('/api/waste-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rw, organikKg, anorganikKg, residuKg, officerName, notes }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && json.data) {
          setWasteLogs((prev) => [json.data.log, ...prev]);
          setWasteUnits(json.data.wasteUnits);
        }
      })
      .catch(() => {
        const targetUnit = wasteUnits.find((u) => u.rw === rw);
        const newLog: WasteLogEntry = {
          id: `log-${Date.now()}`,
          date: '06 Okt 2026 · Baru Saja',
          rw,
          unitName: targetUnit ? targetUnit.unitName : `BSU ${rw}`,
          organikKg,
          anorganikKg,
          residuKg,
          officerName,
          notes,
        };
        setWasteLogs((prev) => [newLog, ...prev]);
      });
  };

  const handleAdminDeleteWasteLog = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      await fetch(`/api/waste-logs/${id}`, { method: 'DELETE' });
      setWasteLogs((prev) => prev.filter((l) => l.id !== id));
      return { ok: true };
    } catch {
      setWasteLogs((prev) => prev.filter((l) => l.id !== id));
      return { ok: true };
    }
  };

  // 4. Cleanup Events (Kerja Bakti) CRUD
  const handleJoinCleanup = (eventId: string, participantCount: number) => {
    const target = cleanupEvents.find((e) => e.id === eventId);
    if (!target) return;
    const nextCount = target.registeredParticipants + participantCount;
    setCleanupEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, registeredParticipants: nextCount } : ev
      )
    );
    fetch(`/api/cleanup-events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registeredParticipants: nextCount }),
    }).catch(() => {});
  };

  const handleAddCleanupEvent = (newEventData: Omit<CleanupEvent, 'id'>) => {
    fetch('/api/cleanup-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEventData),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && json.data) {
          setCleanupEvents((prev) => [json.data, ...prev]);
        }
      })
      .catch(() => {
        setCleanupEvents((prev) => [{ ...newEventData, id: `kb-${Date.now()}` }, ...prev]);
      });
  };

  const handleAdminCreateCleanup = async (
    ev: Partial<CleanupEvent>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch('/api/cleanup-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi jadwal kerja bakti gagal.'] };
      }
      setCleanupEvents((prev) => [json.data, ...prev]);
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminUpdateCleanup = async (
    id: string,
    ev: Partial<CleanupEvent>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      const response = await fetch(`/api/cleanup-events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi perubahan kerja bakti gagal.'] };
      }
      setCleanupEvents((prev) => prev.map((item) => (item.id === id ? json.data : item)));
      return { ok: true };
    } catch {
      return { ok: false, errors: ['Gagal menghubungi server Back-End.'] };
    }
  };

  const handleAdminDeleteCleanup = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      await fetch(`/api/cleanup-events/${id}`, { method: 'DELETE' });
      setCleanupEvents((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    } catch {
      setCleanupEvents((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    }
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

    try {
      const response = await fetch('/api/infos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return { ok: false, errors: json.errors || ['Validasi informasi kelurahan gagal.'] };
      }
      setKelurahanInfos((prev) => [json.data, ...prev]);
      return { ok: true };
    } catch {
      const cleanContent = info.content!.trim();
      const fallbackItem: KelurahanInfoItem = {
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
      };
      setKelurahanInfos((prev) => [fallbackItem, ...prev]);
      return { ok: true };
    }
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

    try {
      const response = await fetch(`/api/infos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        return {
          ok: false,
          errors: json.errors || ['Validasi perubahan informasi kelurahan gagal.'],
        };
      }
      setKelurahanInfos((prev) => prev.map((item) => (item.id === id ? json.data : item)));
      return { ok: true };
    } catch {
      setKelurahanInfos((prev) =>
        prev.map((item) => (item.id === id ? ({ ...item, ...info } as KelurahanInfoItem) : item))
      );
      return { ok: true };
    }
  };

  const handleAdminDeleteInfo = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    try {
      await fetch(`/api/infos/${id}`, { method: 'DELETE' });
      setKelurahanInfos((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    } catch {
      setKelurahanInfos((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    }
  };

  const handleSyncInstagram = async (): Promise<{ ok: boolean; syncedAt?: string }> => {
    try {
      const res = await fetch('/api/infos/sync-instagram', { method: 'POST' });
      const json = await res.json();
      if (json?.ok && Array.isArray(json.data)) {
        setKelurahanInfos(json.data);
        return { ok: true, syncedAt: json.syncedAt };
      }
    } catch {
      // Fallback to initial Instagram posts if offline
    }
    setKelurahanInfos((prev) => (prev.length > 0 ? prev : INITIAL_KELURAHAN_INFOS));
    return { ok: true, syncedAt: 'Baru Saja' };
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
            href="#warga"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('warga');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#0277BD] hover:underline underline-offset-4 ${
              activeView === 'warga' ? 'text-[#0277BD] font-bold underline' : ''
            }`}
          >
            Untuk Warga
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
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('admin');
            }}
            className={`hidden xl:inline-block whitespace-nowrap transition-colors hover:text-[#0D3868] hover:underline underline-offset-4 ${
              activeView === 'admin' ? 'text-[#0D3868] font-bold underline' : ''
            }`}
          >
            Administrator
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

        {activeView === 'warga' && (
          <UntukWargaView
            reports={reports}
            wasteUnits={wasteUnits}
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
            reports={reports}
            wasteUnits={wasteUnits}
            wasteLogs={wasteLogs}
            cleanupEvents={cleanupEvents}
            kelurahanInfos={kelurahanInfos}
            onSaveProfile={handleSaveProfileApi}
            onCreateReport={handleAdminCreateReport}
            onUpdateReport={handleAdminUpdateReport}
            onDeleteReport={handleAdminDeleteReport}
            onCreateWasteUnit={handleAdminCreateWasteUnit}
            onUpdateWasteUnit={handleAdminUpdateWasteUnit}
            onDeleteWasteUnit={handleAdminDeleteWasteUnit}
            onDeleteWasteLog={handleAdminDeleteWasteLog}
            onCreateCleanup={handleAdminCreateCleanup}
            onUpdateCleanup={handleAdminUpdateCleanup}
            onDeleteCleanup={handleAdminDeleteCleanup}
            onCreateInfo={handleAdminCreateInfo}
            onUpdateInfo={handleAdminUpdateInfo}
            onDeleteInfo={handleAdminDeleteInfo}
            onSyncInstagram={handleSyncInstagram}
            onNavigate={handleNavigate}
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
