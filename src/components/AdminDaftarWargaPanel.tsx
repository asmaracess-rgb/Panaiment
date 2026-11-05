import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Printer,
  Download,
  Eye,
  Edit3,
  Trash2,
  ShieldCheck,
  X,
  Loader2,
  UserCheck,
  Sliders,
  Lock,
  Unlock,
  Globe,
  Check,
  RotateCcw,
  LayoutGrid,
} from 'lucide-react';
import {
  AuthenticatedUserProfile,
  CitizenReport,
  RwGroup,
  CitizenMenuAccessConfig,
  CitizenMenuKey,
  ALL_CITIZEN_MENU_KEYS,
  CITIZEN_MENU_DEFINITIONS,
  ALL_CITIZEN_SUB_ITEM_KEYS,
} from '../types';
import {
  subscribeToAllCitizenProfiles,
  updateCitizenProfileByAdmin,
  deleteCitizenProfileByAdmin,
} from '../firebase/authService';
import { INITIAL_REPORTS } from '../data/initialData';
import {
  getDeletedItemIds,
  loadCitizensJournal,
  DEFAULT_CITIZEN_MENU_ACCESS_CONFIG,
  loadCitizenMenuAccessJournal,
} from '../utils/persistentStorage';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';

const INITIAL_SAMPLE_REPORT_IDS = new Set(INITIAL_REPORTS.map((r) => r.id));

interface AdminDaftarWargaPanelProps {
  reports: CitizenReport[];
  rwGroups: RwGroup[];
  citizenUsers?: AuthenticatedUserProfile[];
  citizenMenuConfig?: CitizenMenuAccessConfig;
  onSaveCitizenMenuConfig?: (
    updatedConfig: CitizenMenuAccessConfig
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdateCitizenUser?: (
    uid: string,
    updates: Partial<AuthenticatedUserProfile>
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCitizenUser?: (uid: string) => Promise<{ ok: boolean; error?: string }>;
  onRecordAudit?: (params: {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ACCESS_CHANGE';
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
  citizenMenuConfig,
  onSaveCitizenMenuConfig,
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

  // Modal State for Parameter Batasan Akses Warga
  const [isGlobalAccessModalOpen, setIsGlobalAccessModalOpen] = useState(false);
  const [citizenForAccessModal, setCitizenForAccessModal] = useState<AuthenticatedUserProfile | null>(null);
  const [citizenModalCustomActive, setCitizenModalCustomActive] = useState(false);
  const [citizenModalMenus, setCitizenModalMenus] = useState<CitizenMenuKey[]>([]);
  const [citizenModalSubItems, setCitizenModalSubItems] = useState<string[]>([]);
  const [globalAccessTab, setGlobalAccessTab] = useState<'guest' | 'registered'>('guest');

  // Citizen Menu Access Configuration State (Guest / Belum Terdaftar vs Registered / Login)
  const effectiveMenuConfig = useMemo<CitizenMenuAccessConfig>(() => {
    const fallback = loadCitizenMenuAccessJournal() || DEFAULT_CITIZEN_MENU_ACCESS_CONFIG;
    const source = citizenMenuConfig || fallback;
    return {
      guestAllowedMenus: Array.isArray(source.guestAllowedMenus)
        ? source.guestAllowedMenus
        : [...ALL_CITIZEN_MENU_KEYS],
      registeredAllowedMenus: Array.isArray(source.registeredAllowedMenus)
        ? source.registeredAllowedMenus
        : [...ALL_CITIZEN_MENU_KEYS],
      perCitizenAllowedMenus: source.perCitizenAllowedMenus || {},
      guestAllowedSubItems: Array.isArray(source.guestAllowedSubItems)
        ? source.guestAllowedSubItems
        : [...ALL_CITIZEN_SUB_ITEM_KEYS],
      registeredAllowedSubItems: Array.isArray(source.registeredAllowedSubItems)
        ? source.registeredAllowedSubItems
        : [...ALL_CITIZEN_SUB_ITEM_KEYS],
      perCitizenAllowedSubItems: source.perCitizenAllowedSubItems || {},
      updatedAt: source.updatedAt,
      updatedBy: source.updatedBy,
    };
  }, [citizenMenuConfig]);

  const [draftGuestMenus, setDraftGuestMenus] = useState<CitizenMenuKey[]>(
    () => effectiveMenuConfig.guestAllowedMenus
  );
  const [draftRegisteredMenus, setDraftRegisteredMenus] = useState<CitizenMenuKey[]>(
    () => effectiveMenuConfig.registeredAllowedMenus
  );
  const [draftGuestSubItems, setDraftGuestSubItems] = useState<string[]>(
    () => effectiveMenuConfig.guestAllowedSubItems || [...ALL_CITIZEN_SUB_ITEM_KEYS]
  );
  const [draftRegisteredSubItems, setDraftRegisteredSubItems] = useState<string[]>(
    () => effectiveMenuConfig.registeredAllowedSubItems || [...ALL_CITIZEN_SUB_ITEM_KEYS]
  );
  const [isSavingMenuConfig, setIsSavingMenuConfig] = useState(false);

  useEffect(() => {
    setDraftGuestMenus(effectiveMenuConfig.guestAllowedMenus);
    setDraftRegisteredMenus(effectiveMenuConfig.registeredAllowedMenus);
    setDraftGuestSubItems(
      effectiveMenuConfig.guestAllowedSubItems || [...ALL_CITIZEN_SUB_ITEM_KEYS]
    );
    setDraftRegisteredSubItems(
      effectiveMenuConfig.registeredAllowedSubItems || [...ALL_CITIZEN_SUB_ITEM_KEYS]
    );
  }, [effectiveMenuConfig]);

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
    useCustomMenuAccess: false,
    customAllowedMenus: [...ALL_CITIZEN_MENU_KEYS] as CitizenMenuKey[],
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

  // Save Menu Access Configuration helper
  const persistMenuAccessChanges = async (
    nextGuest: CitizenMenuKey[],
    nextRegistered: CitizenMenuKey[],
    nextPerCitizen?: Record<string, CitizenMenuKey[]>,
    auditSummary?: string,
    nextGuestSubs?: string[],
    nextRegisteredSubs?: string[],
    nextPerCitizenSubs?: Record<string, string[]>
  ) => {
    const safeGuest: CitizenMenuKey[] = Array.from(new Set(nextGuest));
    const safeRegistered: CitizenMenuKey[] = Array.from(new Set(nextRegistered));
    const safeGuestSubs: string[] = Array.from(new Set(nextGuestSubs ?? draftGuestSubItems));
    const safeRegisteredSubs: string[] = Array.from(
      new Set(nextRegisteredSubs ?? draftRegisteredSubItems)
    );

    const updatedConfig: CitizenMenuAccessConfig = {
      guestAllowedMenus: safeGuest,
      registeredAllowedMenus: safeRegistered,
      perCitizenAllowedMenus: nextPerCitizen ?? effectiveMenuConfig.perCitizenAllowedMenus ?? {},
      guestAllowedSubItems: safeGuestSubs,
      registeredAllowedSubItems: safeRegisteredSubs,
      perCitizenAllowedSubItems:
        nextPerCitizenSubs ?? effectiveMenuConfig.perCitizenAllowedSubItems ?? {},
      updatedAt: getRealtimeDateTimeString(),
      updatedBy: 'Administrator Kelurahan',
    };

    setDraftGuestMenus(safeGuest);
    setDraftRegisteredMenus(safeRegistered);
    setDraftGuestSubItems(safeGuestSubs);
    setDraftRegisteredSubItems(safeRegisteredSubs);

    setIsSavingMenuConfig(true);
    if (onSaveCitizenMenuConfig) {
      await onSaveCitizenMenuConfig(updatedConfig).catch(() => {});
    }
    setIsSavingMenuConfig(false);

    setFeedbackSuccess(
      auditSummary ||
        `Parameter akses menu warga berhasil disimpan (${safeGuest.length}/${ALL_CITIZEN_MENU_KEYS.length} menu Pengunjung · ${safeRegistered.length}/${ALL_CITIZEN_MENU_KEYS.length} menu Warga Terdaftar).`
    );

    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'ACCESS_CHANGE',
        targetLabel: 'Parameter Batasan Akses Menu Warga (Pengunjung & Terdaftar)',
        summary:
          auditSummary ||
          `Memperbarui parameter batasan akses menu untuk Pengunjung (${safeGuest.length} menu aktif) & Warga Terdaftar (${safeRegistered.length} menu aktif)`,
        details: `Menu Pengunjung: [${safeGuest.join(', ')}] (${safeGuestSubs.length} sub-item) | Menu Warga Login: [${safeRegistered.join(', ')}] (${safeRegisteredSubs.length} sub-item)`,
      });
    }
  };

  const handleToggleGuestMenu = async (menuKey: CitizenMenuKey) => {
    const exists = draftGuestMenus.includes(menuKey);
    const nextGuest = exists
      ? draftGuestMenus.filter((k) => k !== menuKey)
      : [...draftGuestMenus, menuKey];
    const menuDef = CITIZEN_MENU_DEFINITIONS.find((m) => m.key === menuKey);
    await persistMenuAccessChanges(
      nextGuest,
      draftRegisteredMenus,
      undefined,
      `Menu "${menuDef?.shortLabel || menuKey}" ${
        exists ? 'dinonaktifkan' : 'diaktifkan'
      } untuk Warga Belum Terdaftar (Pengunjung).`
    );
  };

  const handleToggleRegisteredMenu = async (menuKey: CitizenMenuKey) => {
    const exists = draftRegisteredMenus.includes(menuKey);
    const nextRegistered = exists
      ? draftRegisteredMenus.filter((k) => k !== menuKey)
      : [...draftRegisteredMenus, menuKey];
    const menuDef = CITIZEN_MENU_DEFINITIONS.find((m) => m.key === menuKey);
    await persistMenuAccessChanges(
      draftGuestMenus,
      nextRegistered,
      undefined,
      `Menu "${menuDef?.shortLabel || menuKey}" ${
        exists ? 'dinonaktifkan' : 'diaktifkan'
      } untuk Warga Terdaftar (Login).`
    );
  };

  const handleToggleGuestSubItem = async (subKey: string, subLabel: string) => {
    const exists = draftGuestSubItems.includes(subKey);
    const nextSubs = exists
      ? draftGuestSubItems.filter((k) => k !== subKey)
      : [...draftGuestSubItems, subKey];
    await persistMenuAccessChanges(
      draftGuestMenus,
      draftRegisteredMenus,
      undefined,
      `Fitur detail "${subLabel}" ${exists ? 'dinonaktifkan' : 'diaktifkan'} untuk Pengunjung.`,
      nextSubs,
      draftRegisteredSubItems
    );
  };

  const handleToggleRegisteredSubItem = async (subKey: string, subLabel: string) => {
    const exists = draftRegisteredSubItems.includes(subKey);
    const nextSubs = exists
      ? draftRegisteredSubItems.filter((k) => k !== subKey)
      : [...draftRegisteredSubItems, subKey];
    await persistMenuAccessChanges(
      draftGuestMenus,
      draftRegisteredMenus,
      undefined,
      `Fitur detail "${subLabel}" ${exists ? 'dinonaktifkan' : 'diaktifkan'} untuk Warga Terdaftar.`,
      draftGuestSubItems,
      nextSubs
    );
  };

  const handleToggleAllSubItemsForMenu = async (
    tab: 'guest' | 'registered',
    menuDef: (typeof CITIZEN_MENU_DEFINITIONS)[number],
    enableAll: boolean
  ) => {
    if (!menuDef.subItems || menuDef.subItems.length === 0) return;
    const subKeys = menuDef.subItems.map((s) => s.key);
    if (tab === 'guest') {
      const nextSubs = enableAll
        ? Array.from(new Set([...draftGuestSubItems, ...subKeys]))
        : draftGuestSubItems.filter((k) => !subKeys.includes(k));
      await persistMenuAccessChanges(
        draftGuestMenus,
        draftRegisteredMenus,
        undefined,
        `${enableAll ? 'Mengaktifkan' : 'Menonaktifkan'} seluruh detail menu ${menuDef.shortLabel} untuk Pengunjung.`,
        nextSubs,
        draftRegisteredSubItems
      );
    } else {
      const nextSubs = enableAll
        ? Array.from(new Set([...draftRegisteredSubItems, ...subKeys]))
        : draftRegisteredSubItems.filter((k) => !subKeys.includes(k));
      await persistMenuAccessChanges(
        draftGuestMenus,
        draftRegisteredMenus,
        undefined,
        `${enableAll ? 'Mengaktifkan' : 'Menonaktifkan'} seluruh detail menu ${menuDef.shortLabel} untuk Warga Terdaftar.`,
        draftGuestSubItems,
        nextSubs
      );
    }
  };

  const handleApplyPreset = async (
    preset: 'all_open' | 'guest_info_only' | 'guest_beranda_only' | 'registered_all'
  ) => {
    if (preset === 'all_open') {
      await persistMenuAccessChanges(
        [...ALL_CITIZEN_MENU_KEYS],
        [...ALL_CITIZEN_MENU_KEYS],
        undefined,
        'Seluruh menu & detail fitur diaktifkan untuk Pengunjung & Warga Terdaftar.',
        [...ALL_CITIZEN_SUB_ITEM_KEYS],
        [...ALL_CITIZEN_SUB_ITEM_KEYS]
      );
    } else if (preset === 'guest_info_only') {
      const guestLimited: CitizenMenuKey[] = ['beranda', 'profil', 'rtrw', 'peta'];
      await persistMenuAccessChanges(
        guestLimited,
        [...ALL_CITIZEN_MENU_KEYS],
        undefined,
        'Preset diterapkan: Pengunjung hanya dapat melihat Beranda, Profil, Data RT/RW & Peta; menu layanan & program aktif penuh untuk Warga Terdaftar (Login).'
      );
    } else if (preset === 'guest_beranda_only') {
      const guestMinimal: CitizenMenuKey[] = ['beranda'];
      await persistMenuAccessChanges(
        guestMinimal,
        [...ALL_CITIZEN_MENU_KEYS],
        undefined,
        'Preset diterapkan: Pengunjung belum terdaftar hanya dapat mengakses Beranda Utama; seluruh menu lainnya khusus Warga Terdaftar (Login).'
      );
    } else if (preset === 'registered_all') {
      await persistMenuAccessChanges(
        draftGuestMenus,
        [...ALL_CITIZEN_MENU_KEYS],
        undefined,
        'Seluruh menu & detail fitur diaktifkan penuh untuk Warga Terdaftar (Login).',
        draftGuestSubItems,
        [...ALL_CITIZEN_SUB_ITEM_KEYS]
      );
    }
  };

  const handleCheckAll = async (tab: 'guest' | 'registered') => {
    if (tab === 'guest') {
      await persistMenuAccessChanges(
        [...ALL_CITIZEN_MENU_KEYS],
        draftRegisteredMenus,
        undefined,
        'Semua menu (10/10) & detail fitur dicentang aktif untuk Warga Belum Terdaftar (Pengunjung).',
        [...ALL_CITIZEN_SUB_ITEM_KEYS],
        draftRegisteredSubItems
      );
    } else {
      await persistMenuAccessChanges(
        draftGuestMenus,
        [...ALL_CITIZEN_MENU_KEYS],
        undefined,
        'Semua menu (10/10) & detail fitur dicentang aktif untuk Warga Terdaftar (Login).',
        draftGuestSubItems,
        [...ALL_CITIZEN_SUB_ITEM_KEYS]
      );
    }
  };

  const handleUncheckAll = async (tab: 'guest' | 'registered') => {
    if (tab === 'guest') {
      await persistMenuAccessChanges(
        [],
        draftRegisteredMenus,
        undefined,
        'Semua tanda centang menu & detail dikosongkan untuk Warga Belum Terdaftar (Pengunjung).',
        [],
        draftRegisteredSubItems
      );
    } else {
      await persistMenuAccessChanges(
        draftGuestMenus,
        [],
        undefined,
        'Semua tanda centang menu & detail dikosongkan untuk Warga Terdaftar (Login).',
        draftGuestSubItems,
        []
      );
    }
  };

  const openCitizenAccessModal = (citizen: AuthenticatedUserProfile) => {
    const custom =
      effectiveMenuConfig.perCitizenAllowedMenus?.[citizen.uid] || citizen.allowedMenus;
    const isCustom = Array.isArray(custom) && custom.length > 0;
    const customSubs = effectiveMenuConfig.perCitizenAllowedSubItems?.[citizen.uid];
    setCitizenForAccessModal(citizen);
    setCitizenModalCustomActive(isCustom);
    setCitizenModalMenus(isCustom ? [...custom!] : [...draftRegisteredMenus]);
    setCitizenModalSubItems(
      Array.isArray(customSubs) ? [...customSubs] : [...draftRegisteredSubItems]
    );
  };

  const handleSaveCitizenAccessModal = async () => {
    if (!citizenForAccessModal) return;
    const targetCitizen = citizenForAccessModal;
    const nextPerCitizen = { ...(effectiveMenuConfig.perCitizenAllowedMenus || {}) };
    const nextPerCitizenSubs = { ...(effectiveMenuConfig.perCitizenAllowedSubItems || {}) };
    if (citizenModalCustomActive) {
      nextPerCitizen[targetCitizen.uid] = citizenModalMenus;
      nextPerCitizenSubs[targetCitizen.uid] = citizenModalSubItems;
    } else {
      delete nextPerCitizen[targetCitizen.uid];
      delete nextPerCitizenSubs[targetCitizen.uid];
    }

    setLocalEditedOverrides((prev) => ({
      ...prev,
      [targetCitizen.uid]: {
        ...(prev[targetCitizen.uid] || {}),
        allowedMenus: citizenModalCustomActive ? citizenModalMenus : undefined,
      },
    }));

    await persistMenuAccessChanges(
      draftGuestMenus,
      draftRegisteredMenus,
      nextPerCitizen,
      citizenModalCustomActive
        ? `Batasan akses khusus (${citizenModalMenus.length}/10 menu · ${citizenModalSubItems.length} detail) disimpan untuk warga "${targetCitizen.fullName}".`
        : `Warga "${targetCitizen.fullName}" diatur kembali mengikuti parameter standar warga login.`,
      draftGuestSubItems,
      draftRegisteredSubItems,
      nextPerCitizenSubs
    );
    setCitizenForAccessModal(null);
  };

  // Unified, deduplicated list of registered citizens
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
        const perUserMenus =
          effectiveMenuConfig.perCitizenAllowedMenus?.[candidate.uid] || candidate.allowedMenus;
        list.push({
          ...candidate,
          ...override,
          allowedMenus: Array.isArray(override.allowedMenus)
            ? override.allowedMenus
            : perUserMenus,
          role: 'warga',
        });
      } else {
        const existing = list[existingIdx];
        const primaryUid = existing.uid.startsWith('warga_') ? candidate.uid : existing.uid;
        if (deletedSet.has(primaryUid)) return;
        const override = localEditedOverrides[primaryUid] || localEditedOverrides[existing.uid] || {};
        const perUserMenus =
          effectiveMenuConfig.perCitizenAllowedMenus?.[primaryUid] ||
          effectiveMenuConfig.perCitizenAllowedMenus?.[existing.uid] ||
          candidate.allowedMenus ||
          existing.allowedMenus;
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
          allowedMenus: Array.isArray(override.allowedMenus)
            ? override.allowedMenus
            : perUserMenus,
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
  }, [
    citizenUsers,
    cloudCitizens,
    reports,
    localDeletedUids,
    localEditedOverrides,
    effectiveMenuConfig.perCitizenAllowedMenus,
  ]);

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
      const matchSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.nik.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);

      const matchRw = selectedRw === 'Semua' || c.rw === selectedRw;
      const matchRt = selectedRt === 'Semua' || c.rt === selectedRt;

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

  // Citizen's submissions mapping
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
    const customList =
      effectiveMenuConfig.perCitizenAllowedMenus?.[citizen.uid] || citizen.allowedMenus;
    const hasCustom = Array.isArray(customList) && customList.length > 0;
    setSelectedCitizen(citizen);
    setIsEditing(false);
    setEditForm({
      fullName: citizen.fullName,
      nik: citizen.nik || '',
      phone: citizen.phone || '',
      rw: citizen.rw || 'RW 01',
      rt: citizen.rt || 'RT 01',
      address: citizen.address || '',
      useCustomMenuAccess: hasCustom,
      customAllowedMenus: hasCustom ? [...customList!] : [...draftRegisteredMenus],
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

    const resolvedCustomMenus = editForm.useCustomMenuAccess
      ? editForm.customAllowedMenus
      : undefined;

    const updates: Partial<AuthenticatedUserProfile> = {
      fullName: editForm.fullName.trim(),
      nik: cleanNik,
      phone: editForm.phone.trim(),
      rw: editForm.rw,
      rt: editForm.rt,
      address: editForm.address.trim(),
      allowedMenus: resolvedCustomMenus,
    };

    setIsSaving(true);
    setLocalEditedOverrides((prev) => ({
      ...prev,
      [selectedCitizen.uid]: updates,
    }));

    // Update perCitizenAllowedMenus in CitizenMenuAccessConfig
    const nextPerCitizen = { ...(effectiveMenuConfig.perCitizenAllowedMenus || {}) };
    if (editForm.useCustomMenuAccess) {
      nextPerCitizen[selectedCitizen.uid] = editForm.customAllowedMenus;
    } else {
      delete nextPerCitizen[selectedCitizen.uid];
    }

    if (onSaveCitizenMenuConfig) {
      await onSaveCitizenMenuConfig({
        ...effectiveMenuConfig,
        guestAllowedMenus: draftGuestMenus,
        registeredAllowedMenus: draftRegisteredMenus,
        perCitizenAllowedMenus: nextPerCitizen,
        updatedAt: getRealtimeDateTimeString(),
      }).catch(() => {});
    }

    if (onUpdateCitizenUser) {
      await onUpdateCitizenUser(selectedCitizen.uid, updates).catch(() => {});
    }
    if (!selectedCitizen.uid.startsWith('warga_')) {
      await updateCitizenProfileByAdmin(selectedCitizen.uid, {
        fullName: updates.fullName,
        nik: updates.nik,
        phone: updates.phone,
        rw: updates.rw,
        rt: updates.rt,
        address: updates.address,
      }).catch(() => {});
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
      allowedMenus: resolvedCustomMenus,
    };
    setSelectedCitizen(updated);
    setIsEditing(false);
    setFeedbackSuccess(`Data & hak akses menu warga "${updated.fullName}" berhasil diperbarui.`);

    if (onRecordAudit) {
      onRecordAudit({
        actionType: 'UPDATE',
        targetLabel: `Warga: ${updated.fullName} (${updated.email || updated.rw})`,
        summary: `Memperbarui profil & parameter akses menu warga ${updated.fullName} (RW: ${updated.rw}/${updated.rt})`,
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
      'Status Akses Menu',
    ];
    const rows = filteredCitizens.map((c) => {
      const customMenus =
        effectiveMenuConfig.perCitizenAllowedMenus?.[c.uid] || c.allowedMenus;
      const menuLabel = Array.isArray(customMenus)
        ? `Khusus (${customMenus.length} Menu)`
        : `Standar Warga Login (${draftRegisteredMenus.length} Menu)`;
      return [
        c.uid,
        `"${c.fullName.replace(/"/g, '""')}"`,
        c.email || '',
        `'${c.phone || ''}`,
        c.rw,
        c.rt,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${menuLabel}"`,
      ];
    });
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
              <span>Modul Direktori Warga & Parameter Akses Menu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              User Warga Terdaftar & Parameter Batasan Akses Menu
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              Kelola seluruh akun warga yang terdaftar sekaligus atur parameter menu apa saja (di luar menu Administrator) yang diaktifkan untuk <strong>Warga Belum Terdaftar (Pengunjung)</strong> maupun <strong>Warga Terdaftar (Login)</strong>.
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

          <div className="p-4 rounded-2xl bg-emerald-400/15 border border-emerald-300/30 backdrop-blur-xs">
            <div className="text-xs text-emerald-200 font-medium">Menu Aktif Pengunjung</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-200 mt-1">
              {draftGuestMenus.length}/{ALL_CITIZEN_MENU_KEYS.length}
            </div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">
              Warga Belum Terdaftar (Tanpa Login)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-300/30 backdrop-blur-xs">
            <div className="text-xs text-amber-200 font-medium">Menu Aktif Warga Login</div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-amber-300 mt-1">
              {draftRegisteredMenus.length}/{ALL_CITIZEN_MENU_KEYS.length}
            </div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">
              Warga Terdaftar (Sudah Login)
            </div>
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
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
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
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= COMPACT PARAMETER BATASAN AKSES WARGA (SEPERTI PARAMETER ADMIN) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D3868] to-[#0277BD] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sliders className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                  Parameter Batasan Akses Warga
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                  10 Menu Warga
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                Atur pembatasan menu dengan tanda centang (✓) untuk warga belum terdaftar (pengunjung) atau warga terdaftar (login).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                Pengunjung: {draftGuestMenus.length}/10 Aktif
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                Warga Login: {draftRegisteredMenus.length}/10 Aktif
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsGlobalAccessModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>Atur Batasan Akses</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN 2: DIREKTORI & DATABASE USER WARGA TERDAFTAR ================= */}
      {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0D3868]" />
                <h3 className="text-sm font-extrabold text-[#0D3868]">
                  Direktori Akun User Warga Terdaftar ({citizens.length} Warga)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Klik ikon mata pada baris warga untuk melihat detail atau mengatur batasan menu khusus per individu warga.
              </span>
            </div>

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
              {(searchQuery ||
                selectedRw !== 'Semua' ||
                selectedRt !== 'Semua' ||
                emailStatusFilter !== 'Semua') && (
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
                        Akses Menu
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
                      const customMenus =
                        effectiveMenuConfig.perCitizenAllowedMenus?.[citizen.uid] ||
                        citizen.allowedMenus;
                      const hasCustomMenus = Array.isArray(customMenus) && customMenus.length > 0;
                      const activeMenuCount = hasCustomMenus
                        ? customMenus!.length
                        : draftRegisteredMenus.length;

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
                                <span className="truncate max-w-[200px]">{citizen.email}</span>
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
                            <div
                              className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]"
                              title={citizen.address}
                            >
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

                          {/* Menu Access Status */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openCitizenAccessModal(citizen)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer transition shadow-2xs ${
                                hasCustomMenus
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Klik untuk mengatur hak akses menu warga ini"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {hasCustomMenus
                                  ? `Khusus (${activeMenuCount}/${ALL_CITIZEN_MENU_KEYS.length})`
                                  : `Standar (${activeMenuCount}/${ALL_CITIZEN_MENU_KEYS.length})`}
                              </span>
                            </button>
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
                                onClick={() => openCitizenAccessModal(citizen)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0D3868] text-xs font-bold transition cursor-pointer"
                                title="Atur Batasan Akses Menu Warga Ini"
                              >
                                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden xl:inline">Atur Akses</span>
                              </button>
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
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0D3868] to-[#0277BD] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isEditing
                      ? 'Edit Profil & Parameter Akses Menu Warga'
                      : 'Detail Profil & Hak Akses Menu Warga'}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </div>

                  <div className="grid grid-cols-3 gap-3">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Domisili Lengkap
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  {/* Per-Citizen Menu Access Customization */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-[#0D3868] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Parameter Akses Menu Khusus Warga Ini</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Secara bawaan warga mengikuti parameter global <strong>Warga Terdaftar (Login)</strong>. Aktifkan opsi di samping jika ingin membatasi menu khusus untuk warga ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            useCustomMenuAccess: !prev.useCustomMenuAccess,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer shrink-0 ${
                          editForm.useCustomMenuAccess
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {editForm.useCustomMenuAccess
                          ? 'Mode Kustomisasi Aktif'
                          : 'Ikuti Parameter Global'}
                      </button>
                    </div>

                    {editForm.useCustomMenuAccess && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                        {CITIZEN_MENU_DEFINITIONS.map((m) => {
                          const checked = editForm.customAllowedMenus.includes(m.key);
                          return (
                            <label
                              key={m.key}
                              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                checked
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500'
                              }`}
                            >
                              <span className="truncate">{m.shortLabel}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? editForm.customAllowedMenus.filter((k) => k !== m.key)
                                    : [...editForm.customAllowedMenus, m.key];
                                  setEditForm({ ...editForm, customAllowedMenus: next });
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
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
                        {selectedCitizen.email || 'Belum mencantumkan email'}
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

                  {/* Active Menu Access for This Citizen */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Akses Menu yang Diaktifkan untuk Warga Ini
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {Array.isArray(
                          effectiveMenuConfig.perCitizenAllowedMenus?.[selectedCitizen.uid] ||
                            selectedCitizen.allowedMenus
                        )
                          ? 'Kustomisasi Khusus'
                          : 'Mengikuti Parameter Warga Terdaftar'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CITIZEN_MENU_DEFINITIONS.map((m) => {
                        const activeList =
                          effectiveMenuConfig.perCitizenAllowedMenus?.[selectedCitizen.uid] ||
                          selectedCitizen.allowedMenus ||
                          draftRegisteredMenus;
                        const enabled = activeList.includes(m.key);
                        return (
                          <span
                            key={m.key}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              enabled
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                            }`}
                          >
                            {enabled ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{m.shortLabel}</span>
                          </span>
                        );
                      })}
                    </div>
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
                      <span>Edit Profil & Batasan Menu</span>
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
      {/* Modal 1: Parameter Batasan Akses Menu Warga Global (Pengunjung & Warga Login) */}
      {isGlobalAccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0D3868] via-[#072647] to-[#0277BD] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Atur Batasan Akses Menu Warga
                  </h3>
                  <p className="text-xs text-sky-100">
                    Beri tanda centang [✓] pada menu yang diaktifkan untuk ditampilkan ke warga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalAccessModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header: Segmented Role Tabs */}
            <div className="px-6 pt-4 pb-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setGlobalAccessTab('guest')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    globalAccessTab === 'guest'
                      ? 'bg-white text-[#0D3868] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#0277BD]" />
                    <span>Warga Belum Terdaftar (Pengunjung)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      globalAccessTab === 'guest'
                        ? 'bg-sky-100 text-[#0277BD]'
                        : 'bg-slate-300/80 text-slate-700'
                    }`}
                  >
                    {draftGuestMenus.length}/10 Menu Aktif
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGlobalAccessTab('registered')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    globalAccessTab === 'registered'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Warga Terdaftar (Sudah Login)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      globalAccessTab === 'registered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-300/80 text-slate-700'
                    }`}
                  >
                    {draftRegisteredMenus.length}/10 Menu Aktif
                  </span>
                </button>
              </div>

              {/* Role Context & Preset Bar */}
              <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <p className="text-xs text-slate-600">
                  {globalAccessTab === 'guest' ? (
                    <>
                      Batasan menu untuk <strong>pengunjung umum / warga yang belum login</strong>. Hanya menu bercentang yang dapat dibuka di portal.
                    </>
                  ) : (
                    <>
                      Hak akses standar untuk <strong>warga yang sudah login akun</strong>. Berlaku untuk seluruh warga terdaftar secara default.
                    </>
                  )}
                </p>

                {/* Quick Toggle Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCheckAll(globalAccessTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Centang Semua (10/10)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUncheckAll(globalAccessTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kosongkan Centang</span>
                  </button>

                  {globalAccessTab === 'guest' && (
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('guest_info_only')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-[#0D3868] text-xs font-bold transition cursor-pointer"
                    >
                      <span>Info Umum Saja (4 Menu)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body: 10 Menu Checkbox Grid & Granular Sub-Items */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CITIZEN_MENU_DEFINITIONS.map((m) => {
                  const currentList =
                    globalAccessTab === 'guest' ? draftGuestMenus : draftRegisteredMenus;
                  const currentSubList =
                    globalAccessTab === 'guest' ? draftGuestSubItems : draftRegisteredSubItems;
                  const isChecked = currentList.includes(m.key);
                  const activeSubCount = m.subItems
                    ? m.subItems.filter((s) => currentSubList.includes(s.key)).length
                    : 0;

                  return (
                    <div
                      key={m.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-400/30'
                          : 'bg-slate-100/70 border-slate-200 opacity-85'
                      }`}
                    >
                      <div>
                        {/* Parent Menu Header & Toggle */}
                        <div
                          onClick={() =>
                            globalAccessTab === 'guest'
                              ? handleToggleGuestMenu(m.key)
                              : handleToggleRegisteredMenu(m.key)
                          }
                          className="flex items-start gap-3.5 cursor-pointer select-none"
                        >
                          {/* Checkbox square indicator */}
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>

                          {/* Menu Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                                {m.shortLabel}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                                  isChecked
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isChecked ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                                    <span>Menu Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Terkunci</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="text-[10px] text-[#0277BD] font-bold uppercase tracking-wider mb-1">
                              {m.category}
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                              {m.description}
                            </p>
                          </div>
                        </div>

                        {/* Granular Sub-Items Checklist */}
                        {m.subItems && m.subItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                                <span>Detail Fitur yang Ditampilkan:</span>
                                <span className="text-[10px] text-emerald-700 font-mono-num font-bold">
                                  ({activeSubCount}/{m.subItems.length} Aktif)
                                </span>
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAllSubItemsForMenu(globalAccessTab, m, true);
                                  }}
                                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                                >
                                  Centang Semua
                                </button>
                                <span className="text-slate-300">·</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAllSubItemsForMenu(globalAccessTab, m, false);
                                  }}
                                  className="font-bold text-slate-500 hover:underline cursor-pointer"
                                >
                                  Kosongkan
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {m.subItems.map((sub) => {
                                const subChecked = currentSubList.includes(sub.key);
                                return (
                                  <div
                                    key={sub.key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      globalAccessTab === 'guest'
                                        ? handleToggleGuestSubItem(sub.key, sub.label)
                                        : handleToggleRegisteredSubItem(sub.key, sub.label);
                                    }}
                                    className={`p-2 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                                      subChecked
                                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                        subChecked
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'bg-white border-slate-300 text-transparent'
                                      }`}
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold leading-tight">
                                        {sub.label}
                                      </div>
                                      <div className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                                        {sub.description}
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                        subChecked
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      {subChecked ? 'Tampil' : 'Sembunyi'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Centang menu tersimpan langsung secara real-time ke Cloud Firestore & Journal.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsGlobalAccessModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Parameter Batasan Akses Khusus Per Individu Warga */}
      {citizenForAccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0D3868] to-[#0277BD] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    Atur Batasan Akses: {citizenForAccessModal.fullName}
                  </h3>
                  <p className="text-xs text-sky-100">
                    {citizenForAccessModal.email || 'Tanpa Email'} · {citizenForAccessModal.rw} / {citizenForAccessModal.rt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitizenForAccessModal(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Mode: Standar vs Kustom */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCitizenModalCustomActive(false)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    !citizenModalCustomActive
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-xs text-slate-900">
                      Standar Warga Login
                    </span>
                    {!citizenModalCustomActive && (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Otomatis mengikuti parameter global ({draftRegisteredMenus.length}/10 Menu Aktif).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCitizenModalCustomActive(true)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    citizenModalCustomActive
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-extrabold text-xs text-slate-900">
                      Kustomisasi Akses Khusus
                    </span>
                    {citizenModalCustomActive && (
                      <Check className="w-4 h-4 text-amber-600 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Centang secara spesifik menu mana saja yang boleh dibuka oleh warga ini.
                  </p>
                </button>
              </div>

              {/* Checklist when custom mode active */}
              {citizenModalCustomActive && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-800">
                      Centang Menu & Detail untuk Warga Ini ({citizenModalMenus.length}/10 Menu):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCitizenModalMenus([...ALL_CITIZEN_MENU_KEYS]);
                          setCitizenModalSubItems([...ALL_CITIZEN_SUB_ITEM_KEYS]);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Centang Semua
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCitizenModalMenus([]);
                          setCitizenModalSubItems([]);
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {CITIZEN_MENU_DEFINITIONS.map((m) => {
                      const checked = citizenModalMenus.includes(m.key);
                      const subItems = m.subItems || [];
                      const activeSubCount = subItems.filter((s) =>
                        citizenModalSubItems.includes(s.key)
                      ).length;

                      return (
                        <div
                          key={m.key}
                          className={`p-3 rounded-2xl border transition-all ${
                            checked
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-white border-slate-200 opacity-80'
                          }`}
                        >
                          <div
                            onClick={() => {
                              const next = checked
                                ? citizenModalMenus.filter((k) => k !== m.key)
                                : [...citizenModalMenus, m.key];
                              setCitizenModalMenus(next);
                            }}
                            className="flex items-center gap-3 cursor-pointer select-none"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                                checked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-extrabold text-slate-900">
                                {m.shortLabel}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">
                                {m.description}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                checked
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {checked ? 'Aktif' : 'Terkunci'}
                            </span>
                          </div>

                          {subItems.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5 pl-8">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                <span>Detail Fitur ({activeSubCount}/{subItems.length}):</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const keys = subItems.map((s) => s.key);
                                      setCitizenModalSubItems(
                                        Array.from(new Set([...citizenModalSubItems, ...keys]))
                                      );
                                    }}
                                    className="text-emerald-700 hover:underline cursor-pointer"
                                  >
                                    Semua
                                  </button>
                                  <span className="text-slate-300">·</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const keys = subItems.map((s) => s.key);
                                      setCitizenModalSubItems(
                                        citizenModalSubItems.filter((k) => !keys.includes(k))
                                      );
                                    }}
                                    className="text-slate-500 hover:underline cursor-pointer"
                                  >
                                    Kosongkan
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {subItems.map((sub) => {
                                  const subChecked = citizenModalSubItems.includes(sub.key);
                                  return (
                                    <div
                                      key={sub.key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const nextSubs = subChecked
                                          ? citizenModalSubItems.filter((k) => k !== sub.key)
                                          : [...citizenModalSubItems, sub.key];
                                        setCitizenModalSubItems(nextSubs);
                                      }}
                                      className={`p-1.5 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-2 ${
                                        subChecked
                                          ? 'bg-white border-emerald-300 text-slate-900'
                                          : 'bg-slate-50/60 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      <div
                                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                          subChecked
                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                            : 'bg-white border-slate-300 text-transparent'
                                        }`}
                                      >
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-semibold">{sub.label}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setCitizenForAccessModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCitizenAccessModal}
                className="px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Simpan Batasan Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
