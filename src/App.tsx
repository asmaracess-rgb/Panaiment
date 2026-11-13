/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Lock,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import {
  resolveTrustedUserRoleAndProfile,
  logoutFirebaseUser,
  checkIsIncomingEmailSignInLink,
  completePasswordlessEmailSignIn,
  getSavedEmailForSignIn,
  subscribeToAllCitizenProfiles,
} from './firebase/authService';
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
  SiskamlingRwSchedule,
  AuthenticatedUserProfile,
  CitizenMenuAccessConfig,
  CitizenMenuKey,
  ALL_CITIZEN_MENU_KEYS,
  CITIZEN_MENU_DEFINITIONS,
  ALL_CITIZEN_SUB_ITEM_KEYS,
  KerjaBaktiIgHighlightItem,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  PraRegistrasiStatus,
  PengaduanOnlineStatus,
  MasterLayananItem,
  MasterPersyaratanItem,
  PengaduanKategori,
  GoogleAdminVerificationRequest,
} from './types';
import {
  DEFAULT_LURAH_PHOTO_URL,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_TEBA_SPOTS,
  INITIAL_BIOPORI_POINTS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KERJABAKTI_IG_HIGHLIGHTS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
} from './data/initialData';
import { INITIAL_SISKAMLING_SCHEDULES } from './data/siskamlingData';
import {
  INITIAL_MASTER_LAYANAN,
  INITIAL_MASTER_PERSYARATAN,
  DAFTAR_KATEGORI_PENGADUAN,
} from './data/pelayananMasterData';
import {
  SERVICE_CATEGORY_GROUPS,
  ServiceCategoryGroup,
} from './data/wargaServiceCatalog';
import {
  isValidWhatsAppPhone,
  resolveCitizenWhatsAppPhone,
  dispatchComplaintToRegisteredWhatsApp,
  loadWhatsAppAutoDispatchLogs,
} from './utils/whatsappHelper';
import {
  testConnection,
  subscribeToFirestoreDatabase,
  fetchFullDatabaseFromFirestore,
  pushFullDatabaseToFirestore,
  seedInitialFirestoreIfEmpty,
  pushProfileToFirestore,
  subscribeToFirestoreProfile,
  pushAdminUsersAndRequestsToFirestore,
  pushLiveWargaStateToFirestore,
  subscribeToLiveWargaState,
} from './firebase/firestoreService';
import {
  loadPersistedDatabase,
  savePersistedDatabase,
  smartMergeDatabases,
  exportDatabaseToJson,
  parseImportDatabaseJson,
  recordDeletedItemId,
  getDeletedItemIds,
  PersistedDatabase,
  DEFAULT_CITIZEN_MENU_ACCESS_CONFIG,
  loadCitizenMenuAccessJournal,
  saveCitizenMenuAccessJournal,
  loadAdminUsersJournal,
  saveAdminUsersJournal,
  loadGoogleAdminRequestsJournal,
  saveGoogleAdminRequestsJournal,
  loadKerjaBaktiIgHighlights,
  saveKerjaBaktiIgHighlights,
  setExplicitUrbanFarmingSpotPhoto,
  saveCitizenToJournal,
} from './utils/persistentStorage';
import { getLayananSeksiInfo, isSuratAdministrasi } from './utils/layananSeksiHelper';
import { compressDataUrlIfNeeded } from './utils/compressImage';
import {
  getRealtimeDateTimeString,
  getRealtimeDateString,
  getRealtimeTimeString,
  getRealtimeTimeWithSecondsString,
} from './utils/realtimeDate';
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
import { AuthView } from './components/AuthView';
import { DashboardWargaView } from './components/DashboardWargaView';
import { PelayananKelurahanModule } from './components/PelayananKelurahanModule';
import { BottomNavBar } from './components/BottomNavBar';
import { EmblemKelurahanPanaikang } from './components/Emblems';
import { recordTrafficHit, recordRealPwaInstallEvent } from './utils/trafficTracker';
import {
  fetchLocalExpressOnly,
  isLocalExpressAvailable,
  isVercelServerlessRuntime,
  markLocalExpressUnavailable,
} from './utils/runtimeEnv';

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
  const [authUserProfile, setAuthUserProfile] = useState<AuthenticatedUserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string>('');
  const [kelurahanProfile, setKelurahanProfile] = useState<KelurahanProfile>(
    initialPersisted?.profile ?? INITIAL_KELURAHAN_PROFILE
  );
  const [showPublicWargaCatalog, setShowPublicWargaCatalog] = useState<boolean>(false);

  // Subscribe to Firebase Authentication state & resolve trusted role from Firestore (/admins/{uid} & /user_profiles/{uid})
  // Also automatically process incoming Passwordless Email Verification Links (`isSignInWithEmailLink`)
  useEffect(() => {
    let mounted = true;

    if (checkIsIncomingEmailSignInLink(window.location.href)) {
      const savedEmail = getSavedEmailForSignIn();
      if (savedEmail) {
        completePasswordlessEmailSignIn(savedEmail, window.location.href)
          .then((res) => {
            if (!mounted) return;
            if (res.ok && res.profile) {
              setAuthUserProfile(res.profile);
              setIsAuthReady(true);
              setAuthNotice('');
              if (res.targetView === 'admin') {
                setActiveView('admin');
              } else {
                setActiveView('dashboard_warga');
              }
            } else if (res.needsEmailConfirmation) {
              setAuthNotice(
                res.error ||
                  'Konfirmasi alamat email Anda untuk menyelesaikan aktivasi tautan login.'
              );
              setActiveView('login');
            } else if (res.error) {
              setAuthNotice(res.error);
              setActiveView('login');
            }
          })
          .catch(() => {
            if (mounted) {
              setActiveView('login');
            }
          });
      } else {
        setAuthNotice(
          'Masukkan kembali alamat email Anda untuk menyelesaikan validasi tautan dan mengaktifkan akun.'
        );
        setActiveView('login');
      }
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      if (!firebaseUser) {
        setAuthUserProfile(null);
        setIsAuthReady(true);
        return;
      }
      try {
        const profile = await resolveTrustedUserRoleAndProfile(firebaseUser);
        if (mounted) {
          setAuthUserProfile(profile);
          setIsAuthReady(true);
        }
      } catch (err) {
        console.warn('[Firebase Auth] Gagal memuat profil peran pengguna:', err);
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    });
    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, []);

  const handleFirebaseLogout = useCallback(async () => {
    await logoutFirebaseUser();
    setAuthUserProfile(null);
    setAuthNotice('');
    if (activeView === 'dashboard_warga') {
      setActiveView('beranda');
    }
  }, [activeView]);

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
    const persistedList = Array.isArray(initialPersisted?.cleanupEvents)
      ? initialPersisted.cleanupEvents.filter(
          (e) => e && e.id && !deleted.has(e.id) && !String(e.id).startsWith('ig-kb-')
        )
      : [];
    const map = new Map<string, CleanupEvent>();
    for (const item of persistedList) {
      map.set(item.id, item);
    }
    for (const initItem of INITIAL_CLEANUP_EVENTS) {
      if (
        initItem &&
        initItem.id &&
        !deleted.has(initItem.id) &&
        !String(initItem.id).startsWith('ig-kb-') &&
        !map.has(initItem.id)
      ) {
        map.set(initItem.id, initItem);
      }
    }
    return Array.from(map.values());
  });

  const initialKbHighlights = useMemo(() => loadKerjaBaktiIgHighlights(), []);
  const [kerjaBaktiHighlights, setKerjaBaktiHighlights] = useState<KerjaBaktiIgHighlightItem[]>(
    () => initialKbHighlights.items.slice(0, 3)
  );
  const [kerjaBaktiHighlightsSyncedAt, setKerjaBaktiHighlightsSyncedAt] = useState<string>(
    () => initialKbHighlights.syncedAt
  );

  const [kelurahanInfos, setKelurahanInfos] = useState<KelurahanInfoItem[]>(() => {
    const deleted = getDeletedItemIds();
    const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
    const persistedList = Array.isArray(initialPersisted?.kelurahanInfos)
      ? initialPersisted.kelurahanInfos.filter(
          (i) => i && i.id && !deleted.has(i.id) && !legacyIds.has(i.id)
        )
      : [];
    const map = new Map<string, KelurahanInfoItem>();
    const seenUrls = new Set<string>();
    for (const item of persistedList) {
      if (!item || !item.id || deleted.has(item.id)) continue;
      const urlKey = item.instagramPostUrl ? item.instagramPostUrl.trim() : '';
      if (urlKey && seenUrls.has(urlKey)) continue;
      if (urlKey) seenUrls.add(urlKey);
      map.set(item.id, item);
    }
    for (const initItem of INITIAL_KELURAHAN_INFOS) {
      if (!initItem || !initItem.id || deleted.has(initItem.id)) continue;
      const urlKey = initItem.instagramPostUrl ? initItem.instagramPostUrl.trim() : '';
      if (urlKey && seenUrls.has(urlKey)) continue;
      if (!map.has(initItem.id)) {
        if (urlKey) seenUrls.add(urlKey);
        map.set(initItem.id, initItem);
      }
    }
    return Array.from(map.values());
  });

  const [siskamlingSchedules, setSiskamlingSchedules] = useState<SiskamlingRwSchedule[]>(() => {
    return Array.isArray(initialPersisted?.siskamlingSchedules) && initialPersisted.siskamlingSchedules.length > 0
      ? initialPersisted.siskamlingSchedules
      : INITIAL_SISKAMLING_SCHEDULES;
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
    const journal = loadAdminUsersJournal();
    const source =
      journal && Array.isArray(journal.users) && journal.users.length > 0
        ? journal.users
        : Array.isArray(initialPersisted?.adminUsers) && initialPersisted.adminUsers.length > 0
        ? initialPersisted.adminUsers
        : INITIAL_ADMIN_USERS;
    const normalizeCat = (c: string) => {
      if (c === 'adminduk') return 'administrasi_kependudukan';
      if (c === 'pengaduan_warga') return 'pengaduan_permasalahan_warga';
      return c;
    };
    const filtered = source
      .filter((u) => u && u.id && !deleted.has(u.id))
      .map((u) => ({
        ...u,
        allowedServiceCategories: Array.from(
          new Set((u.allowedServiceCategories || []).map(normalizeCat))
        ),
      }));
    const kasiPemberdayaanInit = INITIAL_ADMIN_USERS.find((u) => u.id === 'usr-kasi-pemberdayaan');
    if (
      kasiPemberdayaanInit &&
      !deleted.has('usr-kasi-pemberdayaan') &&
      !filtered.some((u) => u.id === 'usr-kasi-pemberdayaan' || u.username === 'kasi.pemberdayaan')
    ) {
      const idx = filtered.findIndex((u) => u.id === 'usr-kasi-pemerintahan');
      if (idx !== -1) {
        filtered.splice(idx + 1, 0, kasiPemberdayaanInit);
      } else {
        filtered.push(kasiPemberdayaanInit);
      }
    }
    return filtered;
  });

  const [googleAdminRequests, setGoogleAdminRequests] = useState<GoogleAdminVerificationRequest[]>(
    () => {
      if (
        Array.isArray(initialPersisted?.googleAdminVerificationRequests) &&
        initialPersisted.googleAdminVerificationRequests.length > 0
      ) {
        return initialPersisted.googleAdminVerificationRequests;
      }
      return loadGoogleAdminRequestsJournal();
    }
  );

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

  const [citizenUsers, setCitizenUsers] = useState<AuthenticatedUserProfile[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.citizenUsers)
      ? initialPersisted.citizenUsers
      : [];
    return source.filter((c) => c && c.uid && !deleted.has(c.uid));
  });

  const [citizenMenuConfig, setCitizenMenuConfig] = useState<CitizenMenuAccessConfig>(() => {
    return (
      initialPersisted?.citizenMenuConfig ??
      loadCitizenMenuAccessJournal() ??
      DEFAULT_CITIZEN_MENU_ACCESS_CONFIG
    );
  });

  const [praRegistrasiList, setPraRegistrasiList] = useState<PraRegistrasiRecord[]>(() => {
    const deleted = getDeletedItemIds();
    const source: PraRegistrasiRecord[] = Array.isArray(initialPersisted?.praRegistrasiRecords)
      ? initialPersisted.praRegistrasiRecords.filter(
          (r) => r && (r.id || r.ticketCode) && !deleted.has(r.id || r.ticketCode)
        )
      : [];

    const existingTickets = new Set(source.map((p) => p.ticketCode));
    const existingReports = Array.isArray(initialPersisted?.reports)
      ? initialPersisted.reports
      : INITIAL_REPORTS;

    for (const r of existingReports) {
      if (!r || !r.id || deleted.has(r.id)) continue;
      const isSurat = isSuratAdministrasi(r);

      if (isSurat && !existingTickets.has(r.ticketCode)) {
        let mappedStatus: PraRegistrasiStatus = 'MENUNGGU_KEDATANGAN';
        if (r.status === 'Selesai') mappedStatus = 'SURAT_SELESAI';
        else if (r.status === 'Sedang Ditangani') mappedStatus = 'DIPROSES';
        else mappedStatus = 'MENUNGGU_PERSETUJUAN';

        source.push({
          id: r.id,
          ticketCode: r.ticketCode,
          serviceId: r.serviceSubItemId || 'layanan-administrasi',
          serviceCode: r.documentCode || r.serviceSubItemId || 'PM-01',
          serviceName: r.serviceSubItemLabel || r.title || 'Surat Keterangan',
          applicantName: r.reporterName || 'Warga Pemohon',
          applicantNik: r.applicantNik || '737112xxxxxxxx',
          applicantPhone:
            resolveCitizenWhatsAppPhone({
              rawPhone: r.reporterPhone,
              citizenName: r.reporterName,
              ownerId: r.ownerId,
              ownerEmail: r.ownerEmail,
              nik: r.applicantNik,
              citizenUsers: initialPersisted?.citizenUsers || [],
            }) || '',
          applicantRw: r.rw || 'RW 01',
          applicantRt: r.rt || 'RT 01',
          applicantAddress: r.locationName || 'Kelurahan Panaikang',
          formData: {},
          uploadedDocs: [],
          status: mappedStatus,
          submittedAt: r.createdAt || '01 November 2026',
          updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
          assignedOfficerName: r.verifiedBy || r.assignedTeam || 'Petugas Loket Pelayanan',
          officerNotes: r.responseNote || 'Berkas telah diverifikasi oleh petugas loket.',
          physicalDocsChecked: r.status === 'Selesai' || r.status === 'Sedang Ditangani',
          lurahApprovalStatus:
            r.status === 'Selesai'
              ? 'DISETUJUI'
              : r.status === 'Sedang Ditangani'
              ? 'DISETUJUI'
              : 'MENUNGGU',
          letterRegisterNumber: r.letterRegisterNumber,
        });
        existingTickets.add(r.ticketCode);
      }
    }
    return source;
  });

  const [pengaduanOnlineList, setPengaduanOnlineList] = useState<PengaduanOnlineRecord[]>(() => {
    const deleted = getDeletedItemIds();
    const source: PengaduanOnlineRecord[] = Array.isArray(initialPersisted?.pengaduanRecords)
      ? initialPersisted.pengaduanRecords.filter(
          (p) => p && (p.id || p.ticketCode) && !deleted.has(p.id || p.ticketCode)
        )
      : [];

    const existingTickets = new Set(source.map((p) => p.ticketCode));
    const existingReports = Array.isArray(initialPersisted?.reports)
      ? initialPersisted.reports
      : INITIAL_REPORTS;

    for (const r of existingReports) {
      if (!r || !r.id || deleted.has(r.id)) continue;
      const isSurat = isSuratAdministrasi(r);

      if (!isSurat && !existingTickets.has(r.ticketCode)) {
        let mappedStatus: PengaduanOnlineStatus = 'DIAJUKAN';
        if (r.status === 'Selesai') mappedStatus = 'SELESAI';
        else if (r.status === 'Sedang Ditangani') mappedStatus = 'DITINDAKLANJUTI';
        else mappedStatus = 'DIVERIFIKASI';

        source.push({
          id: r.id,
          ticketCode: r.ticketCode,
          category: (r.category as any) || 'Lainnya',
          title: r.title,
          content: r.description,
          locationAddress: r.locationName,
          incidentDate: r.createdAt?.slice(0, 10) || '01 November 2026',
          proofPhotos: r.imageUrl ? [r.imageUrl] : [],
          isAnonymous: r.reporterName?.toLowerCase().includes('anonim') || false,
          reporterName: r.reporterName || 'Warga Panaikang',
          reporterPhone:
            resolveCitizenWhatsAppPhone({
              rawPhone: r.reporterPhone,
              citizenName: r.reporterName,
              ownerId: r.ownerId,
              ownerEmail: r.ownerEmail,
              nik: r.applicantNik,
              citizenUsers: initialPersisted?.citizenUsers || [],
            }) || '',
          reporterRw: r.rw || 'RW 01',
          reporterRt: r.rt || 'RT 01',
          status: mappedStatus,
          isPriority: r.urgency === 'Darurat' || r.urgency === 'Tinggi',
          submittedAt: r.createdAt || '01 November 2026',
          updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
          assignedUnit: r.assignedTeam,
          assignedOfficer: r.verifiedBy || r.assignedTeam,
          followUpNotes: r.responseNote,
        });
        existingTickets.add(r.ticketCode);
      }
    }
    return source;
  });

  const [masterLayananList, setMasterLayananList] = useState<MasterLayananItem[]>(() => {
    return Array.isArray(initialPersisted?.masterLayananList) && initialPersisted.masterLayananList.length > 0
      ? initialPersisted.masterLayananList
      : INITIAL_MASTER_LAYANAN;
  });

  const [masterPersyaratanList, setMasterPersyaratanList] = useState<MasterPersyaratanItem[]>(() => {
    return Array.isArray(initialPersisted?.masterPersyaratanList) && initialPersisted.masterPersyaratanList.length > 0
      ? initialPersisted.masterPersyaratanList
      : INITIAL_MASTER_PERSYARATAN;
  });

  const [kategoriPengaduanList, setKategoriPengaduanList] = useState<PengaduanKategori[]>(() => {
    return Array.isArray(initialPersisted?.kategoriPengaduanList) && initialPersisted.kategoriPengaduanList.length > 0
      ? initialPersisted.kategoriPengaduanList
      : DAFTAR_KATEGORI_PENGADUAN;
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
    siskamlingSchedules,
    citizenUsers,
    citizenMenuConfig,
    praRegistrasiRecords: praRegistrasiList,
    pengaduanRecords: pengaduanOnlineList,
    masterLayananList,
    masterPersyaratanList,
    kategoriPengaduanList,
    googleAdminVerificationRequests: googleAdminRequests,
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
      siskamlingSchedules,
      citizenUsers,
      citizenMenuConfig,
      praRegistrasiRecords: praRegistrasiList,
      pengaduanRecords: pengaduanOnlineList,
      masterLayananList,
      masterPersyaratanList,
      kategoriPengaduanList,
      googleAdminVerificationRequests: googleAdminRequests,
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
    siskamlingSchedules,
    citizenUsers,
    citizenMenuConfig,
    praRegistrasiList,
    pengaduanOnlineList,
    masterLayananList,
    masterPersyaratanList,
    kategoriPengaduanList,
    googleAdminRequests,
  ]);

  const serverSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDataEtagRef = useRef<string>('');
  const hasHydratedRemoteRef = useRef<boolean>(false);

  const commitPersistence = useCallback(
    (
      partial: Partial<Omit<PersistedDatabase, 'updatedAt'>>,
      syncServer = true,
      immediateCloud = false
    ) => {
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
        waDispatchLogs: partial.waDispatchLogs ?? loadWhatsAppAutoDispatchLogs(),
        serviceCatalog: partial.serviceCatalog ?? stateRef.current.serviceCatalog,
        adminUsers: (partial.adminUsers ?? stateRef.current.adminUsers).filter((u) => u && u.id && !deletedSet.has(u.id)),
        activityLogs: partial.activityLogs ?? stateRef.current.activityLogs,
        urbanFarmingSpots: (partial.urbanFarmingSpots ?? stateRef.current.urbanFarmingSpots).filter((s) => s && s.id && !deletedSet.has(s.id)),
        seedRequests: (partial.seedRequests ?? stateRef.current.seedRequests).filter((s) => s && s.id && !deletedSet.has(s.id)),
        siskamlingSchedules: partial.siskamlingSchedules ?? stateRef.current.siskamlingSchedules,
        citizenUsers: (partial.citizenUsers ?? stateRef.current.citizenUsers).filter((c) => c && c.uid && !deletedSet.has(c.uid)),
        citizenMenuConfig: partial.citizenMenuConfig ?? stateRef.current.citizenMenuConfig,
        praRegistrasiRecords: partial.praRegistrasiRecords ?? stateRef.current.praRegistrasiRecords,
        pengaduanRecords: partial.pengaduanRecords ?? stateRef.current.pengaduanRecords,
        masterLayananList: partial.masterLayananList ?? stateRef.current.masterLayananList,
        masterPersyaratanList: partial.masterPersyaratanList ?? stateRef.current.masterPersyaratanList,
        kategoriPengaduanList: partial.kategoriPengaduanList ?? stateRef.current.kategoriPengaduanList,
        googleAdminVerificationRequests: (() => {
          const incomingList =
            partial.googleAdminVerificationRequests ?? stateRef.current.googleAdminVerificationRequests ?? [];
          const journalList = loadGoogleAdminRequestsJournal();
          const map = new Map<string, GoogleAdminVerificationRequest>();
          for (const r of [...journalList, ...incomingList]) {
            if (!r || !r.email) continue;
            const key = r.email.trim().toLowerCase();
            if (!key) continue;
            const prev = map.get(key);
            const rTs = r.updatedAtMs || r.requestedAtMs || 0;
            const prevTs = prev ? (prev.updatedAtMs || prev.requestedAtMs || 0) : -1;
            if (!prev || rTs >= prevTs) {
              map.set(key, { ...prev, ...r, email: key });
            }
          }
          return Array.from(map.values()).sort((a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0));
        })(),
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
        siskamlingSchedules: nextSnapshot.siskamlingSchedules ?? [],
        citizenUsers: nextSnapshot.citizenUsers ?? [],
        citizenMenuConfig: nextSnapshot.citizenMenuConfig ?? DEFAULT_CITIZEN_MENU_ACCESS_CONFIG,
        praRegistrasiRecords: nextSnapshot.praRegistrasiRecords ?? [],
        pengaduanRecords: nextSnapshot.pengaduanRecords ?? [],
        masterLayananList: nextSnapshot.masterLayananList ?? INITIAL_MASTER_LAYANAN,
        masterPersyaratanList: nextSnapshot.masterPersyaratanList ?? INITIAL_MASTER_PERSYARATAN,
        kategoriPengaduanList: nextSnapshot.kategoriPengaduanList ?? DAFTAR_KATEGORI_PENGADUAN,
        googleAdminVerificationRequests: nextSnapshot.googleAdminVerificationRequests ?? [],
      };

      savePersistedDatabase(nextSnapshot);

      // Push lightweight real-time warga & aduan state immediately whenever citizen/report collections change
      if (
        partial.citizenUsers !== undefined ||
        partial.reports !== undefined ||
        partial.pengaduanRecords !== undefined ||
        partial.praRegistrasiRecords !== undefined ||
        partial.seedRequests !== undefined
      ) {
        pushLiveWargaStateToFirestore({
          citizenUsers: nextSnapshot.citizenUsers,
          reports: nextSnapshot.reports,
          pengaduanRecords: nextSnapshot.pengaduanRecords,
          praRegistrasiRecords: nextSnapshot.praRegistrasiRecords,
          seedRequests: nextSnapshot.seedRequests,
          deletedItemIds: nextSnapshot.deletedItemIds,
        }).catch(() => {});
      }

      // Primary Cloud Sync: Firebase Firestore Cloud Database (permanent cross-device sync)
      pushFullDatabaseToFirestore(nextSnapshot, immediateCloud).catch((err) => {
        console.warn('[Firestore Sync Notice]', err);
      });

      // Secondary Server Sync: Send to /api/data (works on both Express server.ts and Vercel Serverless /api/data.js)
      if (syncServer) {
        if (serverSyncTimerRef.current) {
          clearTimeout(serverSyncTimerRef.current);
        }
        serverSyncTimerRef.current = setTimeout(
          () => {
            fetch('/api/data', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nextSnapshot),
            }).catch(() => {});
          },
          immediateCloud ? 50 : 800
        );
      }
    },
    []
  );

  const upsertCitizenUser = useCallback(
    (profile: AuthenticatedUserProfile | null | undefined) => {
      if (!profile || !profile.uid) return;
      const deletedSet = getDeletedItemIds();
      if (deletedSet.has(profile.uid)) return;

      const currentList = stateRef.current.citizenUsers || [];
      const existingIdx = currentList.findIndex(
        (c) =>
          c.uid === profile.uid ||
          (c.email &&
            profile.email &&
            c.email.trim().toLowerCase() === profile.email.trim().toLowerCase())
      );

      let nextList: AuthenticatedUserProfile[];
      if (existingIdx >= 0) {
        const existing = currentList[existingIdx];
        const nextUid = existing.uid.startsWith('warga_') ? profile.uid : existing.uid;
        const nextFullName =
          (profile.fullName && profile.fullName !== 'Warga Panaikang'
            ? profile.fullName
            : existing.fullName) || 'Warga Panaikang';
        const nextEmail = profile.email || existing.email || '';
        const nextNik = profile.nik || existing.nik || '';
        const nextPhone = (profile.phone && profile.phone !== '-' ? profile.phone : existing.phone) || '';
        const nextRw = profile.rw || existing.rw || 'RW 01';
        const nextRt = profile.rt || existing.rt || 'RT 01';
        const nextAddress = profile.address || existing.address || 'Kelurahan Panaikang';

        // Skip redundant full-database write if citizen profile fields are already identical
        const isUnchanged =
          existing.uid === nextUid &&
          existing.fullName === nextFullName &&
          existing.email === nextEmail &&
          (existing.nik || '') === nextNik &&
          (existing.phone || '') === nextPhone &&
          (existing.rw || 'RW 01') === nextRw &&
          (existing.rt || 'RT 01') === nextRt &&
          (existing.address || 'Kelurahan Panaikang') === nextAddress &&
          existing.role === 'warga';

        if (isUnchanged) {
          return;
        }

        const mergedItem: AuthenticatedUserProfile = {
          ...existing,
          ...profile,
          uid: nextUid,
          fullName: nextFullName,
          email: nextEmail,
          nik: nextNik,
          phone: nextPhone,
          rw: nextRw,
          rt: nextRt,
          address: nextAddress,
          role: 'warga',
          updatedAt: getRealtimeDateTimeString(),
        };
        nextList = currentList.map((item, idx) => (idx === existingIdx ? mergedItem : item));
        saveCitizenToJournal(mergedItem);
      } else {
        const nowStr = getRealtimeDateTimeString();
        const newCitizen: AuthenticatedUserProfile = {
          ...profile,
          role: 'warga',
          createdAt: profile.createdAt || nowStr,
          updatedAt: nowStr,
        };
        nextList = [newCitizen, ...currentList];
        saveCitizenToJournal(newCitizen);
      }

      setCitizenUsers(nextList);
      stateRef.current.citizenUsers = nextList;

      if (!hasHydratedRemoteRef.current) {
        // Before remote DB has hydrated, only push lightweight citizen list to live_warga_state
        // so we NEVER overwrite full_snapshot with unhydrated empty initial arrays.
        const currentLocal = loadPersistedDatabase();
        if (currentLocal) {
          savePersistedDatabase({
            ...currentLocal,
            citizenUsers: nextList,
            updatedAt: Date.now(),
          });
        }
        pushLiveWargaStateToFirestore({ citizenUsers: nextList }).catch(() => {});
        return;
      }

      commitPersistence({ citizenUsers: nextList }, true, true);
    },
    [commitPersistence]
  );

  useEffect(() => {
    if (authUserProfile && authUserProfile.uid) {
      upsertCitizenUser(authUserProfile);
    }
  }, [authUserProfile, upsertCitizenUser]);

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

  const applyRemoteDatabase = useCallback((serverDb: Partial<PersistedDatabase>) => {
    if (!serverDb) return;
    hasHydratedRemoteRef.current = true;
    const storedLocal = loadPersistedDatabase();
    const currentLocal: PersistedDatabase | null = storedLocal
      ? {
          ...storedLocal,
          reports:
            stateRef.current.reports?.length > 0
              ? stateRef.current.reports
              : storedLocal.reports,
          citizenUsers:
            stateRef.current.citizenUsers?.length > 0
              ? stateRef.current.citizenUsers
              : storedLocal.citizenUsers,
          pengaduanRecords:
            stateRef.current.pengaduanRecords?.length > 0
              ? stateRef.current.pengaduanRecords
              : storedLocal.pengaduanRecords,
          praRegistrasiRecords:
            stateRef.current.praRegistrasiRecords?.length > 0
              ? stateRef.current.praRegistrasiRecords
              : storedLocal.praRegistrasiRecords,
          urbanFarmingSpots:
            stateRef.current.urbanFarmingSpots?.length > 0
              ? stateRef.current.urbanFarmingSpots
              : storedLocal.urbanFarmingSpots,
        }
      : null;
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
    if (merged.siskamlingSchedules) setSiskamlingSchedules(merged.siskamlingSchedules);
    if (merged.citizenUsers) setCitizenUsers(merged.citizenUsers);
    if (merged.citizenMenuConfig) setCitizenMenuConfig(merged.citizenMenuConfig);

    const deleted = getDeletedItemIds();
    const effectivePra = Array.isArray(merged.praRegistrasiRecords) ? [...merged.praRegistrasiRecords] : [];
    const effectiveAduan = Array.isArray(merged.pengaduanRecords) ? [...merged.pengaduanRecords] : [];

    const existingPraTickets = new Set(effectivePra.map((p) => p.ticketCode));
    const existingAduanTickets = new Set(effectiveAduan.map((p) => p.ticketCode));

    if (Array.isArray(merged.reports)) {
      for (const r of merged.reports) {
        if (!r || !r.id || deleted.has(r.id)) continue;
        const isSurat = isSuratAdministrasi(r);

        if (isSurat && !existingPraTickets.has(r.ticketCode)) {
          let mappedStatus: PraRegistrasiStatus = 'SURAT_SELESAI';
          if (r.status === 'Menunggu Verifikasi') mappedStatus = 'MENUNGGU_PERSETUJUAN';
          else if (r.status === 'Sedang Ditangani') mappedStatus = 'DIPROSES';
          else if (r.status === 'Selesai') mappedStatus = 'SURAT_SELESAI';

          effectivePra.push({
            id: r.id,
            ticketCode: r.ticketCode || `SRT-2026-${r.id.slice(-4)}`,
            serviceId: r.serviceSubItemId || r.serviceCategoryId || 'sk-usaha',
            serviceCode: r.documentCode || r.serviceSubItemId || 'PM-01',
            serviceName: r.serviceSubItemLabel || r.serviceCategoryTitle || r.title || 'Surat Keterangan',
            applicantNik: r.applicantNik || '7371110000000001',
            applicantName: r.reporterName || 'Warga Panaikang',
            applicantPhone:
              resolveCitizenWhatsAppPhone({
                rawPhone: r.reporterPhone,
                citizenName: r.reporterName,
                ownerId: r.ownerId,
                ownerEmail: r.ownerEmail,
                nik: r.applicantNik,
                citizenUsers: merged.citizenUsers || [],
              }) || '',
            applicantRw: r.rw || 'RW 01',
            applicantRt: r.rt || 'RT 01',
            applicantAddress: r.locationName || 'Kelurahan Panaikang',
            formData: {},
            uploadedDocs: [],
            status: mappedStatus,
            submittedAt: r.createdAt || '01 November 2026',
            updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
            assignedOfficerName: r.verifiedBy || r.assignedTeam || 'Petugas Loket Pelayanan',
            officerNotes: r.responseNote || 'Berkas telah diverifikasi oleh petugas loket.',
            physicalDocsChecked: r.status === 'Selesai' || r.status === 'Sedang Ditangani',
            lurahApprovalStatus:
              r.status === 'Selesai' || r.status === 'Sedang Ditangani'
                ? 'DISETUJUI'
                : 'MENUNGGU',
            letterRegisterNumber: r.letterRegisterNumber,
          });
          existingPraTickets.add(r.ticketCode);
        } else if (!isSurat && !existingAduanTickets.has(r.ticketCode)) {
          let mappedStatus: PengaduanOnlineStatus = 'DIAJUKAN';
          if (r.status === 'Selesai') mappedStatus = 'SELESAI';
          else if (r.status === 'Sedang Ditangani') mappedStatus = 'DITINDAKLANJUTI';
          else mappedStatus = 'DIVERIFIKASI';

          effectiveAduan.push({
            id: r.id,
            ticketCode: r.ticketCode || `ADU-2026-${r.id.slice(-4)}`,
            category: (r.category as any) || 'Lainnya',
            title: r.title,
            content: r.description,
            locationAddress: r.locationName,
            incidentDate: r.createdAt?.slice(0, 10) || '01 November 2026',
            proofPhotos: r.imageUrl ? [r.imageUrl] : [],
            isAnonymous: r.reporterName?.toLowerCase().includes('anonim') || false,
            reporterName: r.reporterName || 'Warga Panaikang',
            reporterPhone:
              resolveCitizenWhatsAppPhone({
                rawPhone: r.reporterPhone,
                citizenName: r.reporterName,
                ownerId: r.ownerId,
                ownerEmail: r.ownerEmail,
                nik: r.applicantNik,
                citizenUsers: merged.citizenUsers || [],
              }) || '',
            reporterRw: r.rw || 'RW 01',
            reporterRt: r.rt || 'RT 01',
            status: mappedStatus,
            isPriority: r.urgency === 'Darurat' || r.urgency === 'Tinggi',
            submittedAt: r.createdAt || '01 November 2026',
            updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
            assignedUnit: r.assignedTeam,
            assignedOfficer: r.verifiedBy || r.assignedTeam,
            followUpNotes: r.responseNote,
          });
          existingAduanTickets.add(r.ticketCode);
        }
      }
    }

    setPraRegistrasiList(effectivePra);
    setPengaduanOnlineList(effectiveAduan);
    if (merged.masterLayananList) setMasterLayananList(merged.masterLayananList);
    if (merged.masterPersyaratanList) setMasterPersyaratanList(merged.masterPersyaratanList);
    if (merged.kategoriPengaduanList) setKategoriPengaduanList(merged.kategoriPengaduanList);
    if (merged.googleAdminVerificationRequests) {
      setGoogleAdminRequests(merged.googleAdminVerificationRequests);
    }
    setTebaSpots(merged.tebaSpots ?? []);
    setBioporiPoints(merged.bioporiPoints ?? []);

    stateRef.current = {
      profile: merged.profile,
      rwGroups: merged.rwGroups,
      reports: merged.reports,
      wasteUnits: merged.wasteUnits,
      wasteLogs: merged.wasteLogs,
      tebaSpots: merged.tebaSpots ?? [],
      bioporiPoints: merged.bioporiPoints ?? [],
      cleanupEvents: merged.cleanupEvents,
      kelurahanInfos: merged.kelurahanInfos,
      whatsappRecipients: merged.whatsappRecipients,
      serviceCatalog: merged.serviceCatalog ?? SERVICE_CATEGORY_GROUPS,
      adminUsers: merged.adminUsers ?? [],
      activityLogs: merged.activityLogs ?? [],
      urbanFarmingSpots: merged.urbanFarmingSpots ?? [],
      seedRequests: merged.seedRequests ?? [],
      siskamlingSchedules: merged.siskamlingSchedules ?? [],
      citizenUsers: merged.citizenUsers ?? [],
      citizenMenuConfig: merged.citizenMenuConfig ?? DEFAULT_CITIZEN_MENU_ACCESS_CONFIG,
      praRegistrasiRecords: effectivePra,
      pengaduanRecords: effectiveAduan,
      masterLayananList: merged.masterLayananList ?? INITIAL_MASTER_LAYANAN,
      masterPersyaratanList: merged.masterPersyaratanList ?? INITIAL_MASTER_PERSYARATAN,
      kategoriPengaduanList: merged.kategoriPengaduanList ?? DAFTAR_KATEGORI_PENGADUAN,
      googleAdminVerificationRequests: merged.googleAdminVerificationRequests ?? [],
    };

    savePersistedDatabase(merged);
  }, []);

  // Load and continuously synchronize persistent state between browser and backend in real-time
  useEffect(() => {
    let mounted = true;

    // 0. Test Firestore Cloud connection and subscribe to live changes
    testConnection();

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
      if (initialLocal.citizenUsers) setCitizenUsers(initialLocal.citizenUsers);
      if (initialLocal.citizenMenuConfig) setCitizenMenuConfig(initialLocal.citizenMenuConfig);
      if (initialLocal.praRegistrasiRecords) setPraRegistrasiList(initialLocal.praRegistrasiRecords);
      if (initialLocal.pengaduanRecords) setPengaduanOnlineList(initialLocal.pengaduanRecords);
      if (initialLocal.masterLayananList) setMasterLayananList(initialLocal.masterLayananList);
      if (initialLocal.masterPersyaratanList) setMasterPersyaratanList(initialLocal.masterPersyaratanList);
      if (initialLocal.kategoriPengaduanList) setKategoriPengaduanList(initialLocal.kategoriPengaduanList);
      if (initialLocal.googleAdminVerificationRequests) {
        setGoogleAdminRequests(initialLocal.googleAdminVerificationRequests);
      }
    }

    const loadStaticSeedBaseline = async () => {
      try {
        const res = await fetch('/seed-snapshot.json', { cache: 'no-store' });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || !ct.includes('application/json')) return null;
        const seedJson = await res.json();
        if (seedJson && typeof seedJson === 'object' && Array.isArray(seedJson.rwGroups)) {
          return seedJson as Partial<PersistedDatabase>;
        }
      } catch {}
      return null;
    };

    // 1B. Hydrate from /api/data (Express / Vercel / Cloudflare Pages Function) with /seed-snapshot.json fallback
    fetch('/api/data', { cache: 'no-store' })
      .then(async (res) => {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || !ct.includes('application/json')) return null;
        return res.json();
      })
      .then(async (json) => {
        if (!mounted) return;
        if (json?.data) {
          applyRemoteDatabase(json.data);
          return;
        }
        const seedData = await loadStaticSeedBaseline();
        if (mounted && seedData) {
          applyRemoteDatabase({ ...seedData, updatedAt: 1 });
        }
      })
      .catch(async () => {
        const seedData = await loadStaticSeedBaseline();
        if (mounted && seedData) {
          applyRemoteDatabase({ ...seedData, updatedAt: 1 });
        }
      });

    // 1C. Direct Firestore fetch on boot so fresh domains (pages.dev / vercel.app) hydrate immediately
    fetchFullDatabaseFromFirestore()
      .then(async (firestoreData) => {
        if (!mounted) return;
        if (firestoreData) {
          applyRemoteDatabase(firestoreData);
        } else {
          const seedData = await loadStaticSeedBaseline();
          if (mounted && seedData) {
            applyRemoteDatabase({ ...seedData, updatedAt: 1 });
          }
        }
      })
      .catch(() => {});

    // 1D. Safety check after 1.6s: if core collections are still empty on a static domain, merge static baseline
    const baselineCheckTimer = setTimeout(async () => {
      if (!mounted) return;
      const missingReports = !stateRef.current.reports || stateRef.current.reports.length === 0;
      const missingWaste = !stateRef.current.wasteUnits || stateRef.current.wasteUnits.length === 0;
      const missingRts = !stateRef.current.rwGroups || stateRef.current.rwGroups.every((rw) => !rw.rtList || rw.rtList.length === 0);
      if (missingReports || missingWaste || missingRts) {
        const seedData = await loadStaticSeedBaseline();
        if (mounted && seedData) {
          applyRemoteDatabase({ ...seedData, updatedAt: 1 });
        }
      }
    }, 1600);

    fetch('/api/profile', { cache: 'no-store' })
      .then((res) => {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        return res.ok && ct.includes('application/json') ? res.json() : null;
      })
      .then((json) => {
        if (mounted && json?.ok && json.data) {
          const fresh = json.data as KelurahanProfile;
          if (
            fresh.lurahPhotoUrl &&
            fresh.lurahPhotoUrl.trim() &&
            fresh.lurahPhotoUrl.trim() !== DEFAULT_LURAH_PHOTO_URL
          ) {
            setKelurahanProfile((prev) => ({
              ...prev,
              ...fresh,
              lurahPhotoUrl: fresh.lurahPhotoUrl!.trim(),
            }));
            stateRef.current.profile = {
              ...stateRef.current.profile,
              ...fresh,
              lurahPhotoUrl: fresh.lurahPhotoUrl!.trim(),
            };
          }
        }
      })
      .catch(() => {});

    fetch('/api/google-admin-requests', { cache: 'no-store' })
      .then((res) => {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        return res.ok && ct.includes('application/json') ? res.json() : null;
      })
      .then((json) => {
        if (mounted && Array.isArray(json?.data) && json.data.length > 0) {
          setGoogleAdminRequests((prev) => {
            const map = new Map<string, GoogleAdminVerificationRequest>();
            for (const r of [...prev, ...json.data]) {
              if (!r || !r.email) continue;
              const key = r.email.trim().toLowerCase();
              if (!key) continue;
              const ex = map.get(key);
              const rTs = r.updatedAtMs || r.requestedAtMs || 0;
              const exTs = ex ? (ex.updatedAtMs || ex.requestedAtMs || 0) : -1;
              if (!ex || rTs >= exTs) {
                map.set(key, { ...ex, ...r, email: key });
              }
            }
            const merged = Array.from(map.values()).sort(
              (a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0)
            );
            stateRef.current.googleAdminVerificationRequests = merged;
            return merged;
          });
        }
      })
      .catch(() => {});

    // 2. Real-time Firestore Subscription (instant push across all devices/smartphones/computers)
    const unsubscribeFirestore = subscribeToFirestoreDatabase(
      (firestoreDb) => {
        if (!mounted || !firestoreDb) return;
        applyRemoteDatabase(firestoreDb);
      },
      (err) => {
        console.warn('[Firestore] Realtime subscription notice:', err.message);
      },
      async () => {
        // Only seed Firestore if we actually have a populated static seed or local DB — never push empty initialData!
        const seedData = await loadStaticSeedBaseline();
        if (seedData && mounted) {
          applyRemoteDatabase({ ...seedData, updatedAt: 1 });
          pushFullDatabaseToFirestore(seedData as PersistedDatabase).catch(() => {});
        } else if (initialLocal && (initialLocal.reports?.length > 0 || initialLocal.wasteUnits?.length > 0)) {
          pushFullDatabaseToFirestore(initialLocal).catch(() => {});
        }
      }
    );

    // 2B. Dedicated Real-time Firestore Profile Subscription (guarantees profile identical everywhere)
    const unsubscribeProfile = subscribeToFirestoreProfile((cloudProfile) => {
      if (!mounted || !cloudProfile) return;
      const incomingPhoto = (cloudProfile.lurahPhotoUrl && cloudProfile.lurahPhotoUrl.trim()) || '';
      const localPhoto = (stateRef.current.profile?.lurahPhotoUrl && stateRef.current.profile.lurahPhotoUrl.trim()) || '';
      const nextPhoto = (incomingPhoto && incomingPhoto !== DEFAULT_LURAH_PHOTO_URL)
        ? incomingPhoto
        : incomingPhoto || localPhoto || DEFAULT_LURAH_PHOTO_URL;

      setKelurahanProfile((prev) => ({
        ...prev,
        ...cloudProfile,
        lurahPhotoUrl: nextPhoto,
      }));

      stateRef.current.profile = {
        ...stateRef.current.profile,
        ...cloudProfile,
        lurahPhotoUrl: nextPhoto,
      };

      const local = loadPersistedDatabase();
      if (local) {
        savePersistedDatabase({
          ...local,
          profile: {
            ...local.profile,
            ...cloudProfile,
            lurahPhotoUrl: nextPhoto,
          },
          updatedAt: Date.now(),
        });
      }
    });

    // 2C. Dedicated Real-time Citizen & Complaint State Subscription (instant cross-device sync for new registrations & aduan)
    const unsubscribeLiveWarga = subscribeToLiveWargaState((liveWargaData) => {
      if (!mounted || !liveWargaData) return;
      applyRemoteDatabase(liveWargaData);
    });

    // 2D. Real-time subscription to /user_profiles collection when authenticated via Firebase Auth
    const unsubscribeUserProfiles = subscribeToAllCitizenProfiles((cloudProfiles) => {
      if (!mounted || !Array.isArray(cloudProfiles) || cloudProfiles.length === 0) return;
      applyRemoteDatabase({ citizenUsers: cloudProfiles });
    });

    // 3. Connect to Server-Sent Events (SSE) only when local Express backend is active.
    // On Vercel Serverless Production, real-time cross-device updates are handled by Firestore onSnapshot above.
    let es: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let sseConnectedOnce = false;

    const initEventSource = () => {
      if (!mounted || isVercelServerlessRuntime()) return;
      try {
        es = new EventSource('/api/realtime/stream');

        es.addEventListener('init', (e) => {
          sseConnectedOnce = true;
          try {
            const parsed = JSON.parse(e.data);
            if (parsed?.data && mounted) {
              applyRemoteDatabase(parsed.data);
            }
          } catch {}
        });

        es.addEventListener('data_update', (e) => {
          sseConnectedOnce = true;
          try {
            const parsed = JSON.parse(e.data);
            if (parsed?.data && mounted) {
              applyRemoteDatabase(parsed.data);
            }
          } catch {}
        });

        es.addEventListener('admin_session', (e) => {
          sseConnectedOnce = true;
          try {
            const parsed = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('pnk_admin_session_sse', { detail: parsed }));
          } catch {}
        });

        es.addEventListener('traffic_update', (e) => {
          sseConnectedOnce = true;
          try {
            const parsed = JSON.parse(e.data);
            if (parsed?.data) {
              window.dispatchEvent(new CustomEvent('pnk_traffic_sse', { detail: parsed.data }));
            }
          } catch {}
        });

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          // If SSE failed on first connection attempt, /api/realtime/stream is not available (serverless hosting).
          // Trip circuit breaker to prevent infinite 3-second reconnect loops.
          if (!sseConnectedOnce) {
            markLocalExpressUnavailable();
            return;
          }
          if (mounted && !reconnectTimeout && isLocalExpressAvailable()) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              initEventSource();
            }, 5000);
          }
        };
      } catch {
        markLocalExpressUnavailable();
      }
    };

    if (isLocalExpressAvailable()) {
      initEventSource();
    }

    // Record initial real page visit on first mount
    try {
      recordTrafficHit('beranda');
    } catch {}

    const handlePwaInstalled = () => {
      recordRealPwaInstallEvent();
    };
    window.addEventListener('appinstalled', handlePwaInstalled);

    // Cross-tab synchronization listener
    const handleStorageUpdate = (e: StorageEvent) => {
      if (
        (e.key === 'pnk_smart_env_db_v4' ||
          e.key === 'pnk_smart_env_db_v3' ||
          e.key === 'pnk_smart_env_db_backup_v3' ||
          e.key === 'pnk_google_admin_requests_v1' ||
          e.key === 'pnk_admin_users_journal_v1') &&
        e.newValue
      ) {
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
            if (updated.adminUsers) {
              setAdminUsers(updated.adminUsers);
              stateRef.current.adminUsers = updated.adminUsers;
            }
            if (updated.activityLogs) setActivityLogs(updated.activityLogs);
            if (updated.urbanFarmingSpots) setUrbanFarmingSpots(updated.urbanFarmingSpots);
            if (updated.seedRequests) setSeedRequests(updated.seedRequests);
            if (updated.citizenUsers) setCitizenUsers(updated.citizenUsers);
            if (updated.citizenMenuConfig) setCitizenMenuConfig(updated.citizenMenuConfig);
            if (updated.googleAdminVerificationRequests) {
              setGoogleAdminRequests(updated.googleAdminVerificationRequests);
              stateRef.current.googleAdminVerificationRequests = updated.googleAdminVerificationRequests;
            }
            setTebaSpots(updated.tebaSpots ?? []);
            setBioporiPoints(updated.bioporiPoints ?? []);
          }
        } catch {}
      }
    };
    const handleGoogleRequestsUpdated = (e: Event) => {
      const customEv = e as CustomEvent<{ requests?: GoogleAdminVerificationRequest[] }>;
      const reqs = customEv?.detail?.requests || loadGoogleAdminRequestsJournal();
      if (Array.isArray(reqs)) {
        setGoogleAdminRequests(reqs);
        stateRef.current.googleAdminVerificationRequests = reqs;
      }
    };
    window.addEventListener('pnk_google_requests_updated', handleGoogleRequestsUpdated);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      mounted = false;
      clearTimeout(baselineCheckTimer);
      unsubscribeFirestore();
      unsubscribeProfile();
      unsubscribeLiveWarga();
      unsubscribeUserProfiles();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) es.close();
      window.removeEventListener('pnk_google_requests_updated', handleGoogleRequestsUpdated);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('appinstalled', handlePwaInstalled);
    };
  }, [applyRemoteDatabase]);

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
      const newToast: ToastNotification = {
        id,
        ticketCode,
        reportTitle,
        newStatus,
        assignedTeam,
        timestamp: getRealtimeTimeWithSecondsString(new Date()),
      };
      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const [wargaModuleState, setWargaModuleState] = useState<{
    module: 'hub' | 'pra_registrasi' | 'pengaduan';
    seq: number;
  }>({ module: 'hub', seq: 0 });

  const handleNavigate = (
    view: AppView,
    initialWargaModule: 'hub' | 'pra_registrasi' | 'pengaduan' = 'hub'
  ) => {
    if (view === 'warga') {
      setWargaModuleState((prev) => ({
        module: initialWargaModule,
        seq: prev.seq + 1,
      }));
    }
    setActiveView(view);
    setShowPublicWargaCatalog(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      recordTrafficHit(view);
    } catch {}

    // On Vercel Production, Firestore onSnapshot already keeps state synchronized in real-time.
    // Only poll /api/data if running against local Express server, with ETag 304 support.
    if (isLocalExpressAvailable()) {
      const headers: Record<string, string> = {};
      if (lastDataEtagRef.current) {
        headers['If-None-Match'] = lastDataEtagRef.current;
      }
      fetch('/api/data', { headers })
        .then((res) => {
          if (res.status === 304 || !res.ok) return null;
          const etag = res.headers.get('etag');
          if (etag) lastDataEtagRef.current = etag;
          return res.json();
        })
        .then((payload) => {
          if (!payload?.ok || !payload.data) return;
          const serverDb = payload.data as Partial<PersistedDatabase>;
          applyRemoteDatabase(serverDb);
        })
        .catch(() => {});
    }
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
    // Client-side pre-validation: only reject if provided data is malformed
    const errors: string[] = [];
    if (updatedProfile.lurahName !== undefined && updatedProfile.lurahName.trim().length > 0 && updatedProfile.lurahName.trim().length < 2) {
      errors.push('Nama Lurah minimal 2 karakter.');
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const cleanMisi = Array.isArray(updatedProfile.misi)
      ? updatedProfile.misi.map((m) => m.trim()).filter(Boolean)
      : (kelurahanProfile.misi || []);

    const nextProfile: KelurahanProfile = {
      ...kelurahanProfile,
      ...updatedProfile,
      lurahPhotoUrl:
        updatedProfile.lurahPhotoUrl && updatedProfile.lurahPhotoUrl.trim()
          ? updatedProfile.lurahPhotoUrl.trim()
          : (kelurahanProfile.lurahPhotoUrl && kelurahanProfile.lurahPhotoUrl.trim()) ||
            DEFAULT_LURAH_PHOTO_URL,
      misi: cleanMisi,
    };
    setKelurahanProfile(nextProfile);
    commitPersistence({ profile: nextProfile });
    pushProfileToFirestore(nextProfile).catch((err) => {
      console.warn('[Firestore] Gagal update profil ke cloud:', err);
    });

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });
      if (response && response.ok) {
        const json = await response.json();
        if (json?.ok && json.data) {
          setKelurahanProfile(json.data);
          commitPersistence({ profile: json.data }, false);
        }
      }
    } catch {
      // Fallback already saved in local state & Firestore
    }
    return { ok: true };
  };

  const handleSaveSiskamlingSchedules = useCallback(
    async (updated: SiskamlingRwSchedule[]): Promise<{ ok: boolean; errors?: string[] }> => {
      setSiskamlingSchedules(updated);
      commitPersistence({ siskamlingSchedules: updated });
      fetchLocalExpressOnly('/api/siskamling', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return { ok: true };
    },
    [commitPersistence]
  );

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
    const isDoc = Boolean(
      newReportData.documentCode ||
      newReportData.applicantNik ||
      newReportData.letterRegisterNumber ||
      newReportData.serviceCategoryId === 'surat_keterangan' ||
      (newReportData.serviceCategoryTitle && newReportData.serviceCategoryTitle.toLowerCase().includes('administrasi')) ||
      (newReportData.serviceSubItemId && (newReportData.serviceSubItemId.startsWith('PM-') || newReportData.serviceSubItemId.startsWith('SL-')))
    );
    const prefix = isDoc ? 'SRT-2026-' : 'ADU-2026-';
    let maxSeq = 0;
    for (const r of stateRef.current.reports) {
      if (!r.ticketCode) continue;
      if (r.ticketCode.startsWith(prefix)) {
        const numPart = parseInt(r.ticketCode.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
    const ticketCode = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
    const nowTime = getRealtimeDateTimeString();
    const optimistic: CitizenReport = {
      ...newReportData,
      id: `rep-${Date.now()}`,
      ticketCode,
      status: 'Menunggu Verifikasi',
      createdAt: nowTime,
      updatedAt: nowTime,
      assignedTeam: `Koordinator Kebersihan ${newReportData.rw}`,
      responseNote:
        'Laporan baru warga telah masuk dalam antrean verifikasi Dashboard Lurah Panaikang.',
      upvotes: 1,
    };
    const nextReports = [optimistic, ...stateRef.current.reports];
    setReports(nextReports);

    // Also ensure the citizen who submitted this report is recorded in citizenUsers
    const cleanReporter = (optimistic.reporterName || '').trim();
    let nextCitizenUsers = stateRef.current.citizenUsers || [];
    if (cleanReporter && cleanReporter.toLowerCase() !== 'warga anonim') {
      const targetUid =
        optimistic.ownerId ||
        authUserProfile?.uid ||
        (optimistic.ownerEmail
          ? `warga_${optimistic.ownerEmail.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`
          : `warga_${cleanReporter.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`);

      const existingIdx = nextCitizenUsers.findIndex(
        (c) =>
          c.uid === targetUid ||
          (optimistic.ownerEmail &&
            c.email &&
            c.email.trim().toLowerCase() === optimistic.ownerEmail.trim().toLowerCase()) ||
          c.fullName.trim().toLowerCase() === cleanReporter.toLowerCase()
      );

      const citizenEntry: AuthenticatedUserProfile = {
        uid: existingIdx >= 0 ? nextCitizenUsers[existingIdx].uid : targetUid,
        email:
          optimistic.ownerEmail ||
          authUserProfile?.email ||
          (existingIdx >= 0 ? nextCitizenUsers[existingIdx].email : '') ||
          '',
        fullName: cleanReporter,
        nik:
          optimistic.applicantNik ||
          authUserProfile?.nik ||
          (existingIdx >= 0 ? nextCitizenUsers[existingIdx].nik : '') ||
          '',
        phone:
          (isValidWhatsAppPhone(optimistic.reporterPhone)
            ? optimistic.reporterPhone
            : isValidWhatsAppPhone(authUserProfile?.phone)
            ? authUserProfile?.phone
            : existingIdx >= 0 && isValidWhatsAppPhone(nextCitizenUsers[existingIdx].phone)
            ? nextCitizenUsers[existingIdx].phone
            : optimistic.reporterPhone && optimistic.reporterPhone !== '-'
            ? optimistic.reporterPhone
            : '') || '',
        rw: optimistic.rw || authUserProfile?.rw || 'RW 01',
        rt: optimistic.rt || authUserProfile?.rt || 'RT 01',
        address:
          optimistic.citizenAddress ||
          optimistic.locationName ||
          authUserProfile?.address ||
          'Kelurahan Panaikang',
        role: 'warga',
        createdAt:
          existingIdx >= 0 ? nextCitizenUsers[existingIdx].createdAt || nowTime : nowTime,
        updatedAt: nowTime,
      };

      if (existingIdx >= 0) {
        nextCitizenUsers = nextCitizenUsers.map((item, idx) =>
          idx === existingIdx ? citizenEntry : item
        );
      } else {
        nextCitizenUsers = [citizenEntry, ...nextCitizenUsers];
      }
      saveCitizenToJournal(citizenEntry);
      setCitizenUsers(nextCitizenUsers);
    }

    commitPersistence({ reports: nextReports, citizenUsers: nextCitizenUsers }, true, true);

    // Automatically dispatch WhatsApp notification in background specifically for Complaint Reports (!isDoc)
    if (!isDoc) {
      void dispatchComplaintToRegisteredWhatsApp({
        report: {
          ticketCode,
          title: optimistic.title,
          description: optimistic.description,
          category: optimistic.category,
          urgency: optimistic.urgency,
          rw: optimistic.rw,
          rt: optimistic.rt,
          locationName: optimistic.locationName,
          reporterName: optimistic.reporterName,
          reporterPhone: optimistic.reporterPhone,
          submittedAt: nowTime,
          createdAt: nowTime,
        },
        whatsappRecipients: stateRef.current.whatsappRecipients,
        adminUsers: stateRef.current.adminUsers,
        kelurahanPhone: stateRef.current.profile?.phoneContact,
        lurahName: stateRef.current.profile?.lurahName,
      });
    }

    return ticketCode;
  };

  const handleAddPraRegistrasi = useCallback(
    async (
      record: Omit<PraRegistrasiRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>
    ): Promise<string> => {
      const nowTime = getRealtimeDateTimeString();
      const currentList = stateRef.current.praRegistrasiRecords || [];
      const prefix = 'REG-2026-';
      let maxSeq = 0;
      for (const p of currentList) {
        if (!p.ticketCode) continue;
        if (p.ticketCode.startsWith(prefix)) {
          const numPart = parseInt(p.ticketCode.slice(prefix.length), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      }
      const ticketCode = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
      const newPraRecord: PraRegistrasiRecord = {
        ...record,
        id: `pra-${Date.now()}`,
        ticketCode,
        status: 'MENUNGGU_KEDATANGAN',
        submittedAt: nowTime,
        updatedAt: nowTime,
      };

      const nextPraList = [newPraRecord, ...currentList];
      setPraRegistrasiList(nextPraList);

      // Determine authoritative Seksi & municipal unit for this administrative letter
      const seksiInfo = getLayananSeksiInfo(record.serviceCode, record.serviceName);

      // Create matching CitizenReport for backward compatibility & unified dashboard
      const matchingReport: CitizenReport = {
        id: `rep-pra-${Date.now()}`,
        ticketCode,
        ownerId: authUserProfile?.uid,
        ownerEmail: authUserProfile?.email,
        category: seksiInfo.category,
        serviceCategoryId: seksiInfo.serviceCategoryId,
        serviceCategoryTitle: seksiInfo.serviceCategoryTitle,
        serviceSubItemId: record.serviceCode,
        serviceSubItemLabel: record.serviceName,
        documentCode: seksiInfo.canonicalCode || record.serviceCode,
        officialHeaderTitle: record.serviceName.toUpperCase(),
        title: `${record.serviceName} a.n. ${record.applicantName}`,
        description: `Pra Registrasi ${record.serviceName} (${seksiInfo.seksiName}). Pemohon: ${record.applicantName} (NIK: ${record.applicantNik})`,
        urgency: 'Normal',
        status: 'Menunggu Verifikasi',
        createdAt: nowTime,
        updatedAt: nowTime,
        reporterName: record.applicantName,
        applicantNik: record.applicantNik,
        reporterPhone: record.applicantPhone,
        rw: record.applicantRw,
        rt: record.applicantRt,
        locationName: record.applicantAddress,
        assignedTeam: seksiInfo.assignedTeam,
        processingUnit: seksiInfo.processingUnit,
        responseNote: `Pra registrasi online telah terdaftar pada ${seksiInfo.seksiName}. Silakan bawa berkas fisik asli ke ${seksiInfo.processingUnit} untuk verifikasi.`,
        mapX: 50,
        mapY: 48,
        coordinatesLabel: '-5.1379, 119.4470',
        imageUrl: (record.uploadedDocs && record.uploadedDocs[0]?.fileUrl) || '',
        upvotes: 1,
      };

      const nextReports = [matchingReport, ...stateRef.current.reports];
      setReports(nextReports);

      // Ensure applicant citizen is also persisted in citizenUsers
      let nextCitizenUsers = stateRef.current.citizenUsers || [];
      const cleanApplicant = (record.applicantName || '').trim();
      if (cleanApplicant) {
        const targetUid =
          authUserProfile?.uid ||
          (authUserProfile?.email
            ? `warga_${authUserProfile.email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`
            : `warga_${(record.applicantNik || cleanApplicant).toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`);
        const existingIdx = nextCitizenUsers.findIndex(
          (c) =>
            c.uid === targetUid ||
            (authUserProfile?.email &&
              c.email &&
              c.email.trim().toLowerCase() === authUserProfile.email.trim().toLowerCase()) ||
            (record.applicantNik && c.nik === record.applicantNik) ||
            c.fullName.trim().toLowerCase() === cleanApplicant.toLowerCase()
        );
        const citizenEntry: AuthenticatedUserProfile = {
          uid: existingIdx >= 0 ? nextCitizenUsers[existingIdx].uid : targetUid,
          email:
            authUserProfile?.email ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].email : '') ||
            '',
          fullName: cleanApplicant,
          nik:
            record.applicantNik ||
            authUserProfile?.nik ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].nik : '') ||
            '',
          phone:
            record.applicantPhone ||
            authUserProfile?.phone ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].phone : '') ||
            '',
          rw: record.applicantRw || authUserProfile?.rw || 'RW 01',
          rt: record.applicantRt || authUserProfile?.rt || 'RT 01',
          address: record.applicantAddress || authUserProfile?.address || 'Kelurahan Panaikang',
          role: 'warga',
          createdAt: existingIdx >= 0 ? nextCitizenUsers[existingIdx].createdAt || nowTime : nowTime,
          updatedAt: nowTime,
        };
        if (existingIdx >= 0) {
          nextCitizenUsers = nextCitizenUsers.map((item, idx) =>
            idx === existingIdx ? citizenEntry : item
          );
        } else {
          nextCitizenUsers = [citizenEntry, ...nextCitizenUsers];
        }
        saveCitizenToJournal(citizenEntry);
        setCitizenUsers(nextCitizenUsers);
      }

      commitPersistence(
        {
          praRegistrasiRecords: nextPraList,
          reports: nextReports,
          citizenUsers: nextCitizenUsers,
        },
        true,
        true
      );

      return ticketCode;
    },
    [commitPersistence, authUserProfile]
  );

  const handleAddPengaduan = useCallback(
    async (
      record: Omit<PengaduanOnlineRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>
    ): Promise<string> => {
      const nowTime = getRealtimeDateTimeString();
      const currentList = stateRef.current.pengaduanRecords || [];
      const prefix = 'PGD-2026-';
      let maxSeq = 0;
      for (const p of currentList) {
        if (!p.ticketCode) continue;
        if (p.ticketCode.startsWith(prefix)) {
          const numPart = parseInt(p.ticketCode.slice(prefix.length), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      }
      const ticketCode = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
      const newPengaduanRecord: PengaduanOnlineRecord = {
        ...record,
        id: `pgd-${Date.now()}`,
        ticketCode,
        status: 'DIAJUKAN',
        submittedAt: nowTime,
        updatedAt: nowTime,
      };

      const nextPengaduanList = [newPengaduanRecord, ...currentList];
      setPengaduanOnlineList(nextPengaduanList);

      // Create matching CitizenReport
      const matchingReport: CitizenReport = {
        id: `rep-pgd-${Date.now()}`,
        ticketCode,
        ownerId: authUserProfile?.uid,
        ownerEmail: authUserProfile?.email,
        category: (record.category as any) || 'Laporan Warga',
        serviceCategoryId: 'pengaduan_permasalahan_warga',
        serviceCategoryTitle: 'Laporan dan Pengaduan Warga',
        officialHeaderTitle: 'LAPORAN DAN PENGADUAN PERMASALAHAN WARGA',
        title: record.title,
        description: record.content,
        urgency: record.isPriority ? 'Darurat' : 'Normal',
        status: 'Menunggu Verifikasi',
        createdAt: nowTime,
        updatedAt: nowTime,
        reporterName: record.isAnonymous ? 'Warga Panaikang (Anonim)' : record.reporterName,
        applicantNik: authUserProfile?.nik,
        reporterPhone: record.reporterPhone,
        rw: record.reporterRw,
        rt: record.reporterRt,
        locationName: record.locationAddress,
        assignedTeam: 'Satgas & Tim Reaksi Cepat Kelurahan Panaikang',
        responseNote: 'Pengaduan online telah diterima dan sedang menunggu verifikasi tindak lanjut.',
        mapX: 50,
        mapY: 48,
        coordinatesLabel: '-5.1379, 119.4470',
        imageUrl: (record.proofPhotos && record.proofPhotos[0]) || '',
        upvotes: 1,
      };

      const nextReports = [matchingReport, ...stateRef.current.reports];
      setReports(nextReports);

      // Ensure the citizen who submitted this complaint is also recorded in citizenUsers
      let nextCitizenUsers = stateRef.current.citizenUsers || [];
      const cleanReporter = (record.reporterName || authUserProfile?.fullName || '').trim();
      if (!record.isAnonymous && cleanReporter && cleanReporter.toLowerCase() !== 'warga anonim') {
        const targetUid =
          authUserProfile?.uid ||
          (authUserProfile?.email
            ? `warga_${authUserProfile.email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`
            : `warga_${cleanReporter.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`);
        const existingIdx = nextCitizenUsers.findIndex(
          (c) =>
            c.uid === targetUid ||
            (authUserProfile?.email &&
              c.email &&
              c.email.trim().toLowerCase() === authUserProfile.email.trim().toLowerCase()) ||
            c.fullName.trim().toLowerCase() === cleanReporter.toLowerCase()
        );
        const citizenEntry: AuthenticatedUserProfile = {
          uid: existingIdx >= 0 ? nextCitizenUsers[existingIdx].uid : targetUid,
          email:
            authUserProfile?.email ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].email : '') ||
            '',
          fullName: cleanReporter,
          nik:
            authUserProfile?.nik ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].nik : '') ||
            '',
          phone:
            record.reporterPhone ||
            authUserProfile?.phone ||
            (existingIdx >= 0 ? nextCitizenUsers[existingIdx].phone : '') ||
            '',
          rw: record.reporterRw || authUserProfile?.rw || 'RW 01',
          rt: record.reporterRt || authUserProfile?.rt || 'RT 01',
          address: record.locationAddress || authUserProfile?.address || 'Kelurahan Panaikang',
          role: 'warga',
          createdAt: existingIdx >= 0 ? nextCitizenUsers[existingIdx].createdAt || nowTime : nowTime,
          updatedAt: nowTime,
        };
        if (existingIdx >= 0) {
          nextCitizenUsers = nextCitizenUsers.map((item, idx) =>
            idx === existingIdx ? citizenEntry : item
          );
        } else {
          nextCitizenUsers = [citizenEntry, ...nextCitizenUsers];
        }
        saveCitizenToJournal(citizenEntry);
        setCitizenUsers(nextCitizenUsers);
      }

      commitPersistence(
        {
          pengaduanRecords: nextPengaduanList,
          reports: nextReports,
          citizenUsers: nextCitizenUsers,
        },
        true,
        true
      );

      // Automatically dispatch WhatsApp notification in background to registered recipients (Lurah, etc.)
      void dispatchComplaintToRegisteredWhatsApp({
        report: {
          ticketCode,
          title: matchingReport.title,
          description: matchingReport.description,
          category: String(record.category || matchingReport.category),
          urgency: matchingReport.urgency,
          rw: matchingReport.rw,
          rt: matchingReport.rt,
          locationName: matchingReport.locationName,
          reporterName: matchingReport.reporterName,
          reporterPhone: matchingReport.reporterPhone,
          submittedAt: nowTime,
          createdAt: nowTime,
        },
        whatsappRecipients: stateRef.current.whatsappRecipients,
        adminUsers: stateRef.current.adminUsers,
        kelurahanPhone: stateRef.current.profile?.phoneContact,
        lurahName: stateRef.current.profile?.lurahName,
      });

      return ticketCode;
    },
    [commitPersistence, authUserProfile]
  );

  const handleLurahApproveService = useCallback(
    async (
      ticketCode: string,
      action: 'SETUJUI' | 'TOLAK' | 'KEMBALIKAN',
      lurahNote: string
    ): Promise<void> => {
      const nowTime = getRealtimeDateTimeString();
      const currentPra = stateRef.current.praRegistrasiRecords || [];
      const nextStatus =
        action === 'SETUJUI'
          ? 'DISETUJUI'
          : action === 'TOLAK'
          ? 'DITUTUP'
          : 'PERLU_PERBAIKAN';
      const nextApprovalStatus =
        action === 'SETUJUI'
          ? ('DISETUJUI' as const)
          : action === 'TOLAK'
          ? ('DITOLAK' as const)
          : ('KEMBALIKAN_PERBAIKAN' as const);

      let foundInPra = false;
      const updatedPra = currentPra.map((item) => {
        if (item.ticketCode === ticketCode) {
          foundInPra = true;
          return {
            ...item,
            status: nextStatus as any,
            lurahApprovalStatus: nextApprovalStatus,
            lurahNotes: lurahNote,
            lurahActionAt: nowTime,
            updatedAt: nowTime,
          };
        }
        return item;
      });

      const matchedRep = stateRef.current.reports.find((r) => r.ticketCode === ticketCode);
      if (!foundInPra && matchedRep) {
        updatedPra.unshift({
          id: matchedRep.id,
          ticketCode: matchedRep.ticketCode,
          serviceId: matchedRep.serviceSubItemId || matchedRep.serviceCategoryId || 'sk-usaha',
          serviceCode: matchedRep.documentCode || matchedRep.serviceSubItemId || 'PM-01',
          serviceName:
            matchedRep.serviceSubItemLabel ||
            matchedRep.serviceCategoryTitle ||
            matchedRep.title ||
            'Surat Keterangan',
          applicantNik: matchedRep.applicantNik || '7371110000000001',
          applicantName: matchedRep.reporterName || 'Warga Panaikang',
          applicantPhone: matchedRep.reporterPhone || '',
          applicantRw: matchedRep.rw || 'RW 01',
          applicantRt: matchedRep.rt || 'RT 01',
          applicantAddress: matchedRep.locationName || 'Kelurahan Panaikang',
          formData: matchedRep.specificFieldsData || {},
          uploadedDocs: [],
          status: nextStatus as any,
          submittedAt: matchedRep.createdAt || nowTime,
          updatedAt: nowTime,
          assignedOfficerName:
            matchedRep.verifiedBy || matchedRep.assignedTeam || 'Petugas Loket Pelayanan',
          officerNotes: matchedRep.responseNote || '',
          physicalDocsChecked: action === 'SETUJUI',
          lurahApprovalStatus: nextApprovalStatus,
          lurahNotes: lurahNote,
          lurahActionAt: nowTime,
          letterRegisterNumber: matchedRep.letterRegisterNumber,
        });
      }

      setPraRegistrasiList(updatedPra);

      // Also update matching CitizenReport
      const actionPrefix =
        action === 'SETUJUI'
          ? '[BERKAS DISETUJUI]'
          : action === 'KEMBALIKAN'
          ? '[BERKAS DIKEMBALIKAN]'
          : '[BERKAS DITOLAK]';

      const updatedReports = stateRef.current.reports.map((r) => {
        if (r.ticketCode === ticketCode) {
          return {
            ...r,
            status:
              action === 'SETUJUI'
                ? ('Sedang Ditangani' as const)
                : action === 'TOLAK'
                ? ('Selesai' as const)
                : ('Menunggu Verifikasi' as const),
            responseNote: `${actionPrefix}: ${lurahNote}`,
            updatedAt: nowTime,
          };
        }
        return r;
      });
      setReports(updatedReports);

      commitPersistence({
        praRegistrasiRecords: updatedPra,
        reports: updatedReports,
      });
    },
    [commitPersistence]
  );

  const handleSaveMasterLayanan = useCallback(
    async (list: MasterLayananItem[]): Promise<{ ok: boolean; errors?: string[] }> => {
      setMasterLayananList(list);
      commitPersistence({ masterLayananList: list });
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleSaveMasterPersyaratan = useCallback(
    async (list: MasterPersyaratanItem[]): Promise<{ ok: boolean; errors?: string[] }> => {
      setMasterPersyaratanList(list);
      commitPersistence({ masterPersyaratanList: list });
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleSaveKategoriPengaduan = useCallback(
    async (list: PengaduanKategori[]): Promise<{ ok: boolean; errors?: string[] }> => {
      setKategoriPengaduanList(list);
      commitPersistence({ kategoriPengaduanList: list });
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleUpdateCitizenUser = useCallback(
    async (
      uid: string,
      updates: Partial<AuthenticatedUserProfile>
    ): Promise<{ ok: boolean; error?: string }> => {
      const currentList = stateRef.current.citizenUsers || [];
      const existingIdx = currentList.findIndex((c) => c.uid === uid);
      let nextList: AuthenticatedUserProfile[];
      if (existingIdx >= 0) {
        nextList = currentList.map((c, idx) =>
          idx === existingIdx
            ? {
                ...c,
                ...updates,
                updatedAt: getRealtimeDateTimeString(),
              }
            : c
        );
      } else {
        nextList = [
          {
            uid,
            email: updates.email || '',
            fullName: updates.fullName || 'Warga Panaikang',
            nik: updates.nik || '',
            phone: updates.phone || '',
            rw: updates.rw || 'RW 01',
            rt: updates.rt || 'RT 01',
            address: updates.address || 'Kelurahan Panaikang',
            role: 'warga',
            createdAt: getRealtimeDateTimeString(),
            updatedAt: getRealtimeDateTimeString(),
          },
          ...currentList,
        ];
      }
      setCitizenUsers(nextList);

      // If a valid phone number was saved for this citizen, backfill any reports with missing/masked phone
      const updatedCitizen = nextList.find((c) => c.uid === uid);
      if (updatedCitizen && isValidWhatsAppPhone(updatedCitizen.phone)) {
        const cleanPhone = updatedCitizen.phone.trim();
        const cleanName = updatedCitizen.fullName.trim().toLowerCase();
        const cleanEmail = (updatedCitizen.email || '').trim().toLowerCase();
        const cleanNik = (updatedCitizen.nik || '').replace(/\D/g, '').trim();

        let reportsChanged = false;
        const nextReports = (stateRef.current.reports || []).map((r) => {
          const matchesCitizen =
            (r.ownerId && r.ownerId === uid) ||
            (cleanEmail && r.ownerEmail && r.ownerEmail.trim().toLowerCase() === cleanEmail) ||
            (cleanNik && r.applicantNik && r.applicantNik.replace(/\D/g, '').trim() === cleanNik) ||
            (cleanName && (r.reporterName || '').trim().toLowerCase() === cleanName);

          if (matchesCitizen && !isValidWhatsAppPhone(r.reporterPhone)) {
            reportsChanged = true;
            return { ...r, reporterPhone: cleanPhone };
          }
          return r;
        });

        if (reportsChanged) {
          setReports(nextReports);
          commitPersistence({ citizenUsers: nextList, reports: nextReports });
          return { ok: true };
        }
      }

      commitPersistence({ citizenUsers: nextList });
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleDeleteCitizenUser = useCallback(
    async (uid: string): Promise<{ ok: boolean; error?: string }> => {
      recordDeletedItemId(uid);
      const nextList = (stateRef.current.citizenUsers || []).filter((c) => c.uid !== uid);
      setCitizenUsers(nextList);
      commitPersistence({ citizenUsers: nextList });
      return { ok: true };
    },
    [commitPersistence]
  );

  const handleSaveCitizenMenuConfig = useCallback(
    async (config: CitizenMenuAccessConfig): Promise<{ ok: boolean; error?: string }> => {
      const nowMs = Date.now();
      const normalized: CitizenMenuAccessConfig = {
        ...config,
        updatedAt: config.updatedAt || getRealtimeDateTimeString(),
        updatedAtMs: nowMs,
      };
      saveCitizenMenuAccessJournal(normalized);
      setCitizenMenuConfig(normalized);
      commitPersistence({ citizenMenuConfig: normalized });
      try {
        await fetchLocalExpressOnly('/api/citizen-menu-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizenMenuConfig: normalized }),
        });
      } catch {
        // Fallback already persisted in localStorage, journal, and Firestore
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  // Compute effective allowed citizen menus outside Administrator
  const effectiveCitizenMenus = useMemo<CitizenMenuKey[]>(() => {
    const ensureCoreMenus = (menus: CitizenMenuKey[]): CitizenMenuKey[] => {
      const coreMenus: CitizenMenuKey[] = ['beranda', 'warga', 'dashboard_warga'];
      return Array.from(new Set([...coreMenus, ...menus]));
    };

    if (authUserProfile?.role === 'admin') {
      return ALL_CITIZEN_MENU_KEYS;
    }
    if (authUserProfile && authUserProfile.uid) {
      const perUserOverride = citizenMenuConfig?.perCitizenAllowedMenus?.[authUserProfile.uid];
      if (Array.isArray(perUserOverride)) {
        return ensureCoreMenus(perUserOverride);
      }
      const matchedDirectoryUser = citizenUsers.find((u) => u.uid === authUserProfile.uid);
      if (Array.isArray(matchedDirectoryUser?.allowedMenus)) {
        return ensureCoreMenus(matchedDirectoryUser.allowedMenus);
      }
      if (Array.isArray(authUserProfile.allowedMenus)) {
        return ensureCoreMenus(authUserProfile.allowedMenus);
      }
      return Array.isArray(citizenMenuConfig?.registeredAllowedMenus)
        ? ensureCoreMenus(citizenMenuConfig.registeredAllowedMenus)
        : ALL_CITIZEN_MENU_KEYS;
    }
    return Array.isArray(citizenMenuConfig?.guestAllowedMenus)
      ? ensureCoreMenus(citizenMenuConfig.guestAllowedMenus)
      : ALL_CITIZEN_MENU_KEYS;
  }, [authUserProfile, citizenMenuConfig, citizenUsers]);

  const effectiveCitizenSubItems = useMemo<string[]>(() => {
    if (authUserProfile?.role === 'admin') {
      return ALL_CITIZEN_SUB_ITEM_KEYS;
    }
    if (authUserProfile && authUserProfile.uid) {
      const perUserOverride = citizenMenuConfig?.perCitizenAllowedSubItems?.[authUserProfile.uid];
      if (Array.isArray(perUserOverride)) {
        return perUserOverride;
      }
      return Array.isArray(citizenMenuConfig?.registeredAllowedSubItems)
        ? citizenMenuConfig.registeredAllowedSubItems
        : ALL_CITIZEN_SUB_ITEM_KEYS;
    }
    return Array.isArray(citizenMenuConfig?.guestAllowedSubItems)
      ? citizenMenuConfig.guestAllowedSubItems
      : ALL_CITIZEN_SUB_ITEM_KEYS;
  }, [authUserProfile, citizenMenuConfig]);

  const isCitizenMenuAllowed = useCallback(
    (menuKey: CitizenMenuKey) => effectiveCitizenMenus.includes(menuKey),
    [effectiveCitizenMenus]
  );

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

    const isDoc = Boolean(
      rep.documentCode ||
      rep.applicantNik ||
      rep.letterRegisterNumber ||
      rep.serviceCategoryId === 'surat_keterangan' ||
      (rep.serviceCategoryTitle && rep.serviceCategoryTitle.toLowerCase().includes('administrasi')) ||
      (rep.serviceSubItemId && (rep.serviceSubItemId.startsWith('PM-') || rep.serviceSubItemId.startsWith('SL-')))
    );
    const prefix = isDoc ? 'SRT-2026-' : 'ADU-2026-';
    let maxSeq = 0;
    for (const r of stateRef.current.reports) {
      if (!r.ticketCode) continue;
      if (r.ticketCode.startsWith(prefix)) {
        const numPart = parseInt(r.ticketCode.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
    const generatedTicketCode = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      ticketCode: rep.ticketCode || generatedTicketCode,
      title: rep.title!.trim(),
      description: rep.description!.trim(),
      category: rep.category || 'Sampah Liar & TPS',
      urgency: rep.urgency || 'Normal',
      status: rep.status || 'Menunggu Verifikasi',
      reporterName: rep.reporterName!.trim(),
      reporterPhone: rep.reporterPhone?.trim() || '',
      rw: rep.rw || 'RW 02',
      rt: rep.rt || 'RT 01',
      locationName: rep.locationName!.trim(),
      mapX: typeof rep.mapX === 'number' ? rep.mapX : 50,
      mapY: typeof rep.mapY === 'number' ? rep.mapY : 48,
      coordinatesLabel: rep.coordinatesLabel || '-5.1379, 119.4470',
      createdAt: rep.createdAt || getRealtimeDateTimeString(),
      updatedAt: getRealtimeDateTimeString(),
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
      citizenAddress: rep.citizenAddress,
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
      updatedAt: getRealtimeDateTimeString(),
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

    // Also sync updated valid phone to citizenUsers if matched
    let nextCitizenUsers = stateRef.current.citizenUsers || [];
    let citizenChanged = false;
    if (isValidWhatsAppPhone(merged.reporterPhone)) {
      const cleanPhone = merged.reporterPhone.trim();
      const cleanName = (merged.reporterName || '').trim().toLowerCase();
      const cleanEmail = (merged.ownerEmail || '').trim().toLowerCase();
      const cleanNik = (merged.applicantNik || '').replace(/\D/g, '').trim();

      nextCitizenUsers = nextCitizenUsers.map((c) => {
        const matches =
          (merged.ownerId && c.uid === merged.ownerId) ||
          (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) ||
          (cleanNik && c.nik && c.nik.replace(/\D/g, '').trim() === cleanNik) ||
          (cleanName && c.fullName.trim().toLowerCase() === cleanName);
        if (matches && c.phone !== cleanPhone) {
          citizenChanged = true;
          return { ...c, phone: cleanPhone, updatedAt: getRealtimeDateTimeString() };
        }
        return c;
      });
      if (citizenChanged) {
        setCitizenUsers(nextCitizenUsers);
      }
    }

    commitPersistence(
      citizenChanged ? { reports: nextReports, citizenUsers: nextCitizenUsers } : { reports: nextReports }
    );
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
            updatedAt: getRealtimeDateTimeString(),
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
      lastUpdated: getRealtimeDateString(),
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
      lastUpdated: getRealtimeDateString(),
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
    fetchLocalExpressOnly('/api/waste-units/' + id, { method: 'DELETE' }).catch(() => {});
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
      date: getRealtimeDateTimeString(),
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
            lastUpdated: getRealtimeDateString(),
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
    fetchLocalExpressOnly('/api/waste-logs/' + id, { method: 'DELETE' }).catch(() => {});
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

    fetchLocalExpressOnly('/api/teba-spots', {
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

    fetchLocalExpressOnly('/api/teba-spots/' + id, {
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

    fetchLocalExpressOnly('/api/teba-spots/' + id, {
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

    fetchLocalExpressOnly('/api/biopori-points', {
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

    fetchLocalExpressOnly('/api/biopori-points/' + id, {
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

    fetchLocalExpressOnly('/api/biopori-points/' + id, {
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
      publishedAt: info.publishedAt?.trim() || getRealtimeDateString(),
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

  const handleSyncInstagram = useCallback(async (): Promise<{ ok: boolean; syncedAt?: string }> => {
    const nowDate = new Date();
    const syncedTime = getRealtimeTimeString(nowDate);
    const syncedFull = `${getRealtimeDateTimeString(nowDate)} WITA`;
    const cloudBackendBase =
      'https://ais-pre-xdr54nppc6d3xrjatu4qda-341890100407.asia-southeast1.run.app';

    try {
      let res = await fetch('/api/infos/sync-instagram', { method: 'POST' }).catch(() => null);
      let ct = res?.headers.get('content-type') || '';
      if (
        (!res || !res.ok || !ct.includes('application/json')) &&
        typeof window !== 'undefined' &&
        !window.location.origin.includes('run.app')
      ) {
        res = await fetch(`${cloudBackendBase}/api/infos/sync-instagram`, {
          method: 'POST',
        }).catch(() => null);
        ct = res?.headers.get('content-type') || '';
      }

      if (res && res.ok && ct.includes('application/json')) {
        const json = await res.json();
        if (Array.isArray(json.kerjaBaktiHighlights) && json.kerjaBaktiHighlights.length > 0) {
          const top3 = (json.kerjaBaktiHighlights as KerjaBaktiIgHighlightItem[]).slice(0, 3);
          setKerjaBaktiHighlights(top3);
          setKerjaBaktiHighlightsSyncedAt(syncedFull);
          saveKerjaBaktiIgHighlights(top3, syncedFull);
        } else {
          const fallbackTop3 = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3);
          setKerjaBaktiHighlights(fallbackTop3);
          setKerjaBaktiHighlightsSyncedAt(syncedFull);
          saveKerjaBaktiIgHighlights(fallbackTop3, syncedFull);
        }

        if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
          setKelurahanInfos(json.data);
          commitPersistence({ kelurahanInfos: json.data });
          return { ok: true, syncedAt: json.syncedAt || syncedTime };
        }
      }
    } catch {
      // Fallback to local sync below
    }

    const latestHighlights = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3);
    setKerjaBaktiHighlights(latestHighlights);
    setKerjaBaktiHighlightsSyncedAt(syncedFull);
    saveKerjaBaktiIgHighlights(latestHighlights, syncedFull);

    const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
    const initUrls = new Set(
      INITIAL_KELURAHAN_INFOS.map((init) => init.instagramPostUrl).filter(Boolean)
    );
    const customPosts = stateRef.current.kelurahanInfos.filter(
      (i) =>
        i &&
        i.id &&
        !legacyIds.has(i.id) &&
        !i.id.startsWith('ig-latest-') &&
        !(i.instagramPostUrl && initUrls.has(i.instagramPostUrl)) &&
        !INITIAL_KELURAHAN_INFOS.some((init) => init.id === i.id)
    );
    const nextInfos = [...INITIAL_KELURAHAN_INFOS, ...customPosts];
    setKelurahanInfos(nextInfos);
    commitPersistence({ kelurahanInfos: nextInfos });
    return { ok: true, syncedAt: syncedTime };
  }, [commitPersistence]);

  const handleSyncKerjaBaktiHighlights = useCallback(async (): Promise<{
    ok: boolean;
    syncedAt?: string;
  }> => {
    const nowDate = new Date();
    const syncedAt = `${getRealtimeDateTimeString(nowDate)} WITA`;
    const cloudBackendBase =
      'https://ais-pre-xdr54nppc6d3xrjatu4qda-341890100407.asia-southeast1.run.app';

    // Also trigger full Instagram sync so Beranda and Sorotan Kerja Bakti both get the latest live posts
    void handleSyncInstagram();

    try {
      let res = await fetch('/api/cleanup-events/sync-ig-highlights', {
        method: 'POST',
      }).catch(() => null);
      let ct = res?.headers.get('content-type') || '';
      if (
        (!res || !res.ok || !ct.includes('application/json')) &&
        typeof window !== 'undefined' &&
        !window.location.origin.includes('run.app')
      ) {
        res = await fetch(`${cloudBackendBase}/api/cleanup-events/sync-ig-highlights`, {
          method: 'POST',
        }).catch(() => null);
        ct = res?.headers.get('content-type') || '';
      }

      if (res && res.ok && ct.includes('application/json')) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
          const top3 = (json.data as KerjaBaktiIgHighlightItem[]).slice(0, 3);
          const remoteSyncedAt = json.syncedAt || syncedAt;
          setKerjaBaktiHighlights(top3);
          setKerjaBaktiHighlightsSyncedAt(remoteSyncedAt);
          saveKerjaBaktiIgHighlights(top3, remoteSyncedAt);
          return { ok: true, syncedAt: remoteSyncedAt };
        }
      }
    } catch {
      // Fallback to local sync below
    }
    const top3 = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3);
    setKerjaBaktiHighlights(top3);
    setKerjaBaktiHighlightsSyncedAt(syncedAt);
    saveKerjaBaktiIgHighlights(top3, syncedAt);
    return { ok: true, syncedAt };
  }, [handleSyncInstagram]);

  // Automatically sync Instagram @kelurahan.panaikang posts & Kerja Bakti highlights on app startup and every 5 minutes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void handleSyncInstagram();
    }, 800);
    const interval = window.setInterval(() => {
      void handleSyncInstagram();
    }, 5 * 60 * 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [handleSyncInstagram]);

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
    fetchLocalExpressOnly('/api/rw-groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedGroups),
    }).catch(() => {});
    return { ok: true };
  };

  // 7. WhatsApp Recipients CRUD (Lurah / Administrator)
  const handleSaveWhatsAppRecipients = async (
    updatedRecipients: WhatsAppRecipient[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const updatedIds = new Set(updatedRecipients.map((r) => r.id));
    for (const prev of stateRef.current.whatsappRecipients || []) {
      if (prev && prev.id && !updatedIds.has(prev.id)) {
        recordDeletedItemId(prev.id);
      }
    }
    setWhatsappRecipients(updatedRecipients);
    commitPersistence({ whatsappRecipients: updatedRecipients });
    fetchLocalExpressOnly('/api/whatsapp-recipients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappRecipients: updatedRecipients }),
    }).catch(() => {});
    return { ok: true };
  };

  // 8. Katalog Menu Pengurusan Warga CRUD (Back-End 7 Bidang & 44 Sub-Menu)
  const handleSaveServiceCatalog = async (
    updatedCatalog: ServiceCategoryGroup[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    setServiceCatalog(updatedCatalog);
    commitPersistence({ serviceCatalog: updatedCatalog });
    try {
      await fetchLocalExpressOnly('/api/warga-services/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCatalog: updatedCatalog }),
      });
    } catch {
      // Fallback already persisted via localStorage & Firestore
    }
    return { ok: true };
  };

  // 9. Parameter User & Batasan Akses Admin CRUD (Master Admin / Lurah)
  const handleSaveAdminUsers = async (
    updatedUsers: AdminUserAccount[]
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const nowMs = Date.now();
    const stampedUsers: AdminUserAccount[] = updatedUsers.map((u) => ({
      ...u,
      updatedAtMs: u.updatedAtMs && u.updatedAtMs >= nowMs - 2000 ? u.updatedAtMs : nowMs,
    }));
    // Save journal with +10s buffer so subsequent audit logs never make journal appear older than SSE/localDb
    saveAdminUsersJournal(stampedUsers, nowMs + 10000);
    setAdminUsers(stampedUsers);
    commitPersistence({ adminUsers: stampedUsers });
    // Immediate direct write to Firestore so fast page reloads or tab switches never lose whitelist accounts
    pushAdminUsersAndRequestsToFirestore(
      stampedUsers,
      stateRef.current.googleAdminVerificationRequests
    ).catch(() => {});
    try {
      await fetchLocalExpressOnly('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsers: stampedUsers }),
      });
    } catch {
      // Fallback already persisted via localStorage & Firestore
    }
    try {
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stateRef.current,
          adminUsers: stampedUsers,
          updatedAt: nowMs,
        }),
      }).catch(() => {});
    } catch {
      // Ignore network error
    }
    return { ok: true };
  };

  // 10. Log Aktivitas Admin (Audit Trail Lurah)
  const handleRecordActivityLog = useCallback(
    (entry: Omit<AdminActivityLog, 'id' | 'timestamp' | 'createdAtMs'>) => {
      const now = new Date();
      const newLog: AdminActivityLog = {
        ...entry,
        id: `log-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: getRealtimeDateTimeString(now),
        createdAtMs: now.getTime(),
      };
      const nextLogs = [newLog, ...stateRef.current.activityLogs].slice(0, 500);
      setActivityLogs(nextLogs);
      commitPersistence({ activityLogs: nextLogs });
      fetchLocalExpressOnly('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch(() => {});
    },
    [commitPersistence]
  );

  const handleDeleteActivityLog = useCallback(
    (logId: string) => {
      recordDeletedItemId(logId);
      const nextLogs = stateRef.current.activityLogs.filter((l) => l.id !== logId);
      setActivityLogs(nextLogs);
      commitPersistence({ activityLogs: nextLogs });
      fetchLocalExpressOnly(`/api/activity-logs/${encodeURIComponent(logId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [commitPersistence]
  );

  const handleResetActivityLogs = async (): Promise<{ ok: boolean; errors?: string[] }> => {
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    commitPersistence({ activityLogs: INITIAL_ACTIVITY_LOGS });
    try {
      await fetchLocalExpressOnly('/api/activity-logs/reset', {
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
      const compactPhoto = spot.photoUrl
        ? await compressDataUrlIfNeeded(spot.photoUrl, 85_000)
        : spot.photoUrl;
      const finalSpot: UrbanFarmingSpot = { ...spot, photoUrl: compactPhoto };
      if (finalSpot.id && finalSpot.photoUrl) {
        setExplicitUrbanFarmingSpotPhoto(finalSpot.id, finalSpot.photoUrl);
      }
      const compactedExisting = await Promise.all(
        stateRef.current.urbanFarmingSpots.map(async (s) => {
          if (s.photoUrl && s.photoUrl.startsWith('data:image/') && s.photoUrl.length > 85_000) {
            const p = await compressDataUrlIfNeeded(s.photoUrl, 85_000);
            setExplicitUrbanFarmingSpotPhoto(s.id, p);
            return { ...s, photoUrl: p };
          }
          return s;
        })
      );
      const nextSpots = [finalSpot, ...compactedExisting];
      setUrbanFarmingSpots(nextSpots);
      commitPersistence({ urbanFarmingSpots: nextSpots });
      try {
        await fetchLocalExpressOnly('/api/urban-farming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalSpot),
        });
      } catch {
        // Fallback persisted via localStorage & Firestore
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
      const rawMerged: UrbanFarmingSpot = { ...existing, ...updated };
      const compactMergedPhoto = rawMerged.photoUrl
        ? await compressDataUrlIfNeeded(rawMerged.photoUrl, 85_000)
        : rawMerged.photoUrl;
      const merged: UrbanFarmingSpot = { ...rawMerged, photoUrl: compactMergedPhoto };
      if (merged.photoUrl) {
        setExplicitUrbanFarmingSpotPhoto(id, merged.photoUrl);
      }
      const nextSpots = await Promise.all(
        stateRef.current.urbanFarmingSpots.map(async (s) => {
          if (s.id === id) return merged;
          if (s.photoUrl && s.photoUrl.startsWith('data:image/') && s.photoUrl.length > 85_000) {
            const p = await compressDataUrlIfNeeded(s.photoUrl, 85_000);
            setExplicitUrbanFarmingSpotPhoto(s.id, p);
            return { ...s, photoUrl: p };
          }
          return s;
        })
      );
      setUrbanFarmingSpots(nextSpots);
      commitPersistence({ urbanFarmingSpots: nextSpots });
      try {
        await fetchLocalExpressOnly(`/api/urban-farming/${id}`, {
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
        await fetchLocalExpressOnly(`/api/urban-farming/${id}`, {
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
        await fetchLocalExpressOnly('/api/seed-requests', {
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
        await fetchLocalExpressOnly(`/api/seed-requests/${id}`, {
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
      recordDeletedItemId(id);
      const nextReqs = stateRef.current.seedRequests.filter((r) => r.id !== id);
      setSeedRequests(nextReqs);
      commitPersistence({ seedRequests: nextReqs });
      try {
        await fetchLocalExpressOnly(`/api/seed-requests/${id}`, {
          method: 'DELETE',
        });
      } catch {
        // Fallback persisted
      }
      return { ok: true };
    },
    [commitPersistence]
  );

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour >= 4 && currentHour < 11
      ? 'Selamat Pagi'
      : currentHour >= 11 && currentHour < 15
      ? 'Selamat Siang'
      : currentHour >= 15 && currentHour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 sm:pb-20">
      {/* Top Bar: Simplified Brand Logo + Time-of-Day Greeting */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        {/* Left: Brand Logo + Simple Greeting Text beside Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

          <div className="h-4 w-px bg-slate-200 shrink-0" aria-hidden="true" />

          <span className="text-xs sm:text-sm font-extrabold text-[#0D3868] tracking-tight truncate">
            {timeGreeting}
            {authUserProfile?.fullName ? `, ${authUserProfile.fullName}` : ''}
          </span>
        </div>

        {/* Right: Realtime Date Badge in Top Bar */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-600 font-mono-num">
            {getRealtimeDateString(new Date())}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView !== 'admin' &&
        activeView !== 'login' &&
        (ALL_CITIZEN_MENU_KEYS as string[]).includes(activeView) &&
        !isCitizenMenuAllowed(activeView as CitizenMenuKey) ? (
          <div className="mx-auto max-w-lg px-4 py-16">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Parameter Batasan Akses Menu Warga
                </span>
                <h2 className="mt-2 text-lg sm:text-xl font-extrabold text-[#0D3868]">
                  Akses Menu{' '}
                  {CITIZEN_MENU_DEFINITIONS.find((m) => m.key === activeView)?.label || activeView}{' '}
                  Dibatasi
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {!authUserProfile &&
                  citizenMenuConfig.registeredAllowedMenus.includes(activeView as CitizenMenuKey)
                    ? 'Menu ini hanya diaktifkan oleh Administrator untuk Warga Terdaftar (Sudah Login). Silakan masuk atau daftar akun warga terlebih dahulu untuk mengakses layanan ini.'
                    : 'Menu ini sedang dinonaktifkan oleh Administrator Kelurahan Panaikang pada pengaturan Parameter Batasan Akses Menu Warga.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                {!authUserProfile && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('login')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#09294D] text-white text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Masuk / Daftar Akun Warga</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNavigate('beranda')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
                >
                  <span>Kembali ke Halaman Publik (Beranda)</span>
                </button>
                {effectiveCitizenMenus.length > 0 &&
                  effectiveCitizenMenus[0] !== activeView &&
                  effectiveCitizenMenus[0] !== 'beranda' && (
                    <button
                      type="button"
                      onClick={() => handleNavigate(effectiveCitizenMenus[0] as AppView)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>
                        Buka Menu Aktif (
                        {CITIZEN_MENU_DEFINITIONS.find((m) => m.key === effectiveCitizenMenus[0])
                          ?.label || 'Beranda'}
                        )
                      </span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <>
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
            onQuickReportClick={() => handleNavigate('warga', 'pengaduan')}
          />
        )}

        {activeView === 'profil' && (
          <ProfilKelurahanView
            profile={kelurahanProfile}
            wasteUnits={wasteUnits}
            rwGroups={rwGroups}
            onNavigate={handleNavigate}
            allowedSubItems={effectiveCitizenSubItems}
          />
        )}

        {activeView === 'rtrw' && (
          <DataRtRwView
            rwGroups={rwGroups}
            profile={kelurahanProfile}
            siskamlingSchedules={siskamlingSchedules}
            onNavigate={handleNavigate}
            allowedSubItems={effectiveCitizenSubItems}
          />
        )}

        {activeView === 'warga' && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Main Pelayanan Kelurahan Module (2 Cards: Pra Registrasi Online & Pengaduan Online) */}
            <PelayananKelurahanModule
              userProfile={authUserProfile}
              rwGroups={rwGroups}
              praRegistrasiList={praRegistrasiList}
              pengaduanList={pengaduanOnlineList}
              masterLayananList={masterLayananList}
              masterPersyaratanList={masterPersyaratanList}
              kategoriPengaduanList={kategoriPengaduanList}
              onAddPraRegistrasi={handleAddPraRegistrasi}
              onAddPengaduan={handleAddPengaduan}
              onNavigate={handleNavigate}
              defaultActiveModule={wargaModuleState.module}
              moduleTriggerSeq={wargaModuleState.seq}
            />
          </div>
        )}

        {activeView === 'login' && (
          <AuthView
            rwGroups={rwGroups}
            initialNotice={authNotice}
            onNavigate={handleNavigate}
            onAuthenticated={(profile) => {
              setAuthUserProfile(profile);
              setAuthNotice('');
              // Redirect based on trusted role read from Firestore (/admins/{uid} or /user_profiles/{uid})
              handleNavigate('dashboard_warga');
            }}
            onViewPublicCatalog={() => {
              setShowPublicWargaCatalog(true);
              handleNavigate('warga');
            }}
          />
        )}

        {activeView === 'dashboard_warga' && (
          !isAuthReady ? (
            <div className="mx-auto max-w-md px-4 py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#0D3868] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                Memuat halaman layanan warga...
              </p>
            </div>
          ) : !authUserProfile ? (
            <AuthView
              rwGroups={rwGroups}
              initialNotice="Silakan masuk terlebih dahulu untuk mengakses Dashboard Warga."
              onNavigate={handleNavigate}
              onAuthenticated={(profile) => {
                setAuthUserProfile(profile);
                setAuthNotice('');
                handleNavigate('dashboard_warga');
              }}
            />
          ) : (
            <DashboardWargaView
              userProfile={authUserProfile}
              profile={kelurahanProfile}
              rwGroups={rwGroups}
              reports={reports}
              seedRequests={seedRequests}
              praRegistrasiList={praRegistrasiList}
              pengaduanList={pengaduanOnlineList}
              masterLayananList={masterLayananList}
              masterPersyaratanList={masterPersyaratanList}
              kategoriPengaduanList={kategoriPengaduanList}
              onAddReport={handleAddReport}
              onAddPraRegistrasi={handleAddPraRegistrasi}
              onAddPengaduan={handleAddPengaduan}
              onNavigate={handleNavigate}
              onLogout={handleFirebaseLogout}
              onProfileUpdated={(updatedProfile) => {
                setAuthUserProfile(updatedProfile);
                upsertCitizenUser(updatedProfile);
                saveCitizenToJournal(updatedProfile);
              }}
            />
          )
        )}

        {activeView === 'lurah' && (
          <DashboardLurahView
            reports={reports}
            wasteUnits={wasteUnits}
            cleanupEvents={cleanupEvents}
            praRegistrasiList={praRegistrasiList}
            pengaduanList={pengaduanOnlineList}
            whatsappRecipients={whatsappRecipients}
            onSaveWhatsAppRecipients={handleSaveWhatsAppRecipients}
            onLurahApproveService={handleLurahApproveService}
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
            rwGroups={rwGroups}
            onUpdateReportStatus={handleUpdateReportStatus}
            onNavigate={handleNavigate}
            profile={kelurahanProfile}
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
            allowedSubItems={effectiveCitizenSubItems}
          />
        )}

        {activeView === 'kerjabakti' && (
          <MonitoringKerjaBaktiView
            cleanupEvents={cleanupEvents}
            onJoinCleanup={handleJoinCleanup}
            onAddCleanupEvent={handleAddCleanupEvent}
            onNavigate={handleNavigate}
            allowedSubItems={effectiveCitizenSubItems}
            igHighlights={kerjaBaktiHighlights}
            igHighlightsSyncedAt={kerjaBaktiHighlightsSyncedAt}
            onSyncHighlights={handleSyncKerjaBaktiHighlights}
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
            allowedSubItems={effectiveCitizenSubItems}
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
            onDeleteActivityLog={handleDeleteActivityLog}
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
            kerjaBaktiHighlights={kerjaBaktiHighlights}
            kerjaBaktiHighlightsSyncedAt={kerjaBaktiHighlightsSyncedAt}
            onSyncKerjaBaktiHighlights={handleSyncKerjaBaktiHighlights}
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
            siskamlingSchedules={siskamlingSchedules}
            onSaveSiskamlingSchedules={handleSaveSiskamlingSchedules}
            onExportDatabase={handleExportDatabase}
            onImportDatabase={handleImportDatabase}
            firebaseUserProfile={authUserProfile}
            onFirebaseLogout={handleFirebaseLogout}
            citizenUsers={citizenUsers}
            googleAdminRequests={googleAdminRequests}
            onUpdateCitizenUser={handleUpdateCitizenUser}
            onDeleteCitizenUser={handleDeleteCitizenUser}
            citizenMenuConfig={citizenMenuConfig}
            onSaveCitizenMenuConfig={handleSaveCitizenMenuConfig}
            praRegistrasiList={praRegistrasiList}
            pengaduanList={pengaduanOnlineList}
            masterLayananList={masterLayananList}
            masterPersyaratanList={masterPersyaratanList}
            kategoriPengaduanList={kategoriPengaduanList}
            onSaveMasterLayanan={handleSaveMasterLayanan}
            onSaveMasterPersyaratan={handleSaveMasterPersyaratan}
            onSaveKategoriPengaduan={handleSaveKategoriPengaduan}
            onLurahApproveService={handleLurahApproveService}
          />
        )}
          </>
        )}
      </main>

      {/* Global Footer (Visible on inner views, HomePortal includes its own footer) */}
      {activeView !== 'beranda' && (
        <footer className="mt-auto border-t border-slate-200 bg-white py-3.5 px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
              Developed by @asmaracess
            </p>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-[#0D3868] transition-colors cursor-pointer"
              title="Akses Sistem Internal"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Akses Sistem Internal</span>
            </button>
          </div>
        </footer>
      )}

      {/* Global Bottom Navigation Bar (HP, Tablet & Desktop) */}
      <BottomNavBar
        activeView={activeView}
        activeWargaModule={wargaModuleState.module}
        onNavigate={handleNavigate}
        isCitizenMenuAllowed={isCitizenMenuAllowed}
        authUserProfile={authUserProfile}
        onLogout={handleFirebaseLogout}
      />

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
