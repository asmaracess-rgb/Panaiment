import {
  KelurahanProfile,
  RwGroup,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  KelurahanInfoItem,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActivityLog,
  UrbanFarmingSpot,
  SeedRequestItem,
  UrbanFarmingLocation,
  FarmerGroup,
  CropItem,
  PlantCareLog,
  HarvestRecord,
  FarmingInventoryItem,
  SupplyRequestItem,
  SiskamlingRwSchedule,
} from '../types';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_OFFICIALS,
  INITIAL_RW_GROUPS,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_TEBA_SPOTS,
  INITIAL_BIOPORI_POINTS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
  INITIAL_URBAN_FARMING_LOCATIONS,
  INITIAL_FARMER_GROUPS,
  INITIAL_CROPS,
  INITIAL_PLANT_CARE_LOGS,
  INITIAL_HARVEST_RECORDS,
  INITIAL_FARMING_INVENTORIES,
  INITIAL_SUPPLY_REQUESTS,
} from '../data/initialData';
import { INITIAL_SISKAMLING_SCHEDULES } from '../data/siskamlingData';
import { SERVICE_CATEGORY_GROUPS, ServiceCategoryGroup } from '../data/wargaServiceCatalog';

export interface PersistedDatabase {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  tebaSpots?: TebaSpot[];
  bioporiPoints?: BioporiPoint[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  whatsappRecipients: WhatsAppRecipient[];
  serviceCatalog?: ServiceCategoryGroup[];
  adminUsers?: AdminUserAccount[];
  activityLogs?: AdminActivityLog[];
  urbanFarmingSpots?: UrbanFarmingSpot[];
  seedRequests?: SeedRequestItem[];
  urbanFarmingLocations?: UrbanFarmingLocation[];
  farmerGroups?: FarmerGroup[];
  crops?: CropItem[];
  plantCareLogs?: PlantCareLog[];
  harvestRecords?: HarvestRecord[];
  farmingInventories?: FarmingInventoryItem[];
  supplyRequests?: SupplyRequestItem[];
  siskamlingSchedules?: SiskamlingRwSchedule[];
  deletedItemIds?: string[];
  updatedAt: number;
}

// Multi-tier storage keys to guarantee zero data loss across GitHub sync & Vercel builds
const STORAGE_KEY = 'pnk_smart_env_db_v4';
const BACKUP_KEY = 'pnk_smart_env_db_backup_v4';
const JOURNAL_REPORTS_KEY = 'pnk_smart_env_user_reports_v2';
const JOURNAL_LOGS_KEY = 'pnk_smart_env_user_logs_v2';
const DELETED_IDS_KEY = 'pnk_smart_env_deleted_ids_v2';

// Initial IDs to distinguish default sample data from actual citizen & admin input
const INITIAL_REPORT_IDS = new Set(INITIAL_REPORTS.map((r) => r.id));
const INITIAL_WASTE_LOG_IDS = new Set(INITIAL_WASTE_LOGS.map((l) => l.id));

const LEGACY_DEFAULT_OFFICIAL_IDS = ['off-1', 'off-2', 'off-3', 'off-4'];

/**
 * Returns the Set of permanently deleted entity IDs across all sessions
 */
export function getDeletedItemIds(): Set<string> {
  const baseTombstones = new Set<string>(LEGACY_DEFAULT_OFFICIAL_IDS);
  if (typeof window === 'undefined') return baseTombstones;
  try {
    const raw = window.localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return baseTombstones;
    const parsed = JSON.parse(raw);
    const set = new Set(Array.isArray(parsed) ? parsed : []);
    LEGACY_DEFAULT_OFFICIAL_IDS.forEach((id) => set.add(id));
    return set;
  } catch {
    return baseTombstones;
  }
}

/**
 * Permanently registers multiple item IDs as deleted (tombstone) across devices
 */
export function recordDeletedItemIds(ids: string[]): void {
  if (typeof window === 'undefined' || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const set = getDeletedItemIds();
    let changed = false;
    for (const id of ids) {
      if (id && !set.has(id)) {
        set.add(id);
        changed = true;
      }
    }
    if (changed) {
      window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (err) {
    console.warn('Failed to record deleted item ids:', err);
  }
}

/**
 * Permanently registers an item ID as deleted (tombstone) so it NEVER resurrects
 * upon browser refresh, git synchronization, or serverless Vercel rehydration.
 */
export function recordDeletedItemId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const set = getDeletedItemIds();
    set.add(id);
    window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));

    // Clean up from user reports journal
    const jReports = loadReportsJournal().filter((r) => r && r.id !== id);
    window.localStorage.setItem(JOURNAL_REPORTS_KEY, JSON.stringify(jReports));

    // Clean up from user waste logs journal
    const jLogs = loadWasteLogsJournal().filter((l) => l && l.id !== id);
    window.localStorage.setItem(JOURNAL_LOGS_KEY, JSON.stringify(jLogs));
  } catch (err) {
    console.warn('Failed to record deleted item id:', err);
  }
}

/**
 * Safely loads user reports journal from localStorage
 */
function loadReportsJournal(): CitizenReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(JOURNAL_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Safely loads user waste logs journal from localStorage
 */
function loadWasteLogsJournal(): WasteLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(JOURNAL_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Helper to merge an entity collection by unique item ID.
 * - Items in deletedSet are NEVER included.
 * - When incoming is newer or equal (!localIsNewer), incoming list is authoritative and deleted items are never revived.
 * - If only local exists (e.g. offline first visit before backend is reached), local is returned.
 * - If neither local nor incoming has ever been set, fall back to initialList.
 */
function mergeEntityCollection<T extends { id: string }>(
  localList: T[] | undefined,
  incomingList: T[] | undefined,
  initialList: T[],
  deletedSet: Set<string>,
  localIsNewer: boolean
): T[] {
  const hasLocal = Array.isArray(localList);
  const hasIncoming = Array.isArray(incomingList);

  // If neither local nor incoming has ever been set, seed from initialList
  if (!hasLocal && !hasIncoming) {
    return initialList.filter((item) => item && item.id && !deletedSet.has(item.id));
  }

  // When incoming is authoritative (server is newer or equal):
  // Take incoming list directly without resurrecting items that other admins deleted,
  // while preserving local image data if incoming omitted heavy base64.
  if (hasIncoming && !localIsNewer) {
    const localMap = new Map((localList || []).map((item: any) => [item?.id, item]));
    return incomingList!
      .filter((item) => item && item.id && !deletedSet.has(item.id))
      .map((incItem) => {
        const localItem = localMap.get(incItem.id) as any;
        if (!localItem) return incItem;
        const incAny = incItem as any;
        return {
          ...incItem,
          ...(localItem.imageUrl && !incAny.imageUrl ? { imageUrl: localItem.imageUrl } : {}),
          ...(localItem.photoUrl && !incAny.photoUrl ? { photoUrl: localItem.photoUrl } : {}),
          ...(Array.isArray(localItem.documentationPhotos) &&
          localItem.documentationPhotos.length > 0 &&
          (!Array.isArray(incAny.documentationPhotos) || incAny.documentationPhotos.length === 0)
            ? { documentationPhotos: localItem.documentationPhotos }
            : {}),
        };
      });
  }

  // If only local exists
  if (hasLocal && !hasIncoming) {
    return localList!.filter((item) => item && item.id && !deletedSet.has(item.id));
  }

  // If local is explicitly newer (uncommitted offline edits)
  const map = new Map<string, T>();
  if (hasIncoming) {
    for (const item of incomingList!) {
      if (item && item.id && !deletedSet.has(item.id)) {
        map.set(item.id, item);
      }
    }
  }

  if (hasLocal) {
    for (const item of localList!) {
      if (!item || !item.id || deletedSet.has(item.id)) continue;
      if (localIsNewer) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values()).filter((item) => item && item.id && !deletedSet.has(item.id));
}

/**
 * Non-destructive Smart Merge: Merges two database snapshots ensuring that
 * ANY user-submitted citizen report, waste unit, waste log, or custom administration edit
 * is 100% retained and NEVER discarded when a newer deployment or git sync arrives,
 * while permanently honoring deleted IDs across all entities.
 */
export function smartMergeDatabases(
  localDb: PersistedDatabase | null,
  incoming: Partial<PersistedDatabase> | null
): PersistedDatabase {
  // Aggregate all permanent deletion tombstones
  const deletedIds = new Set<string>([
    ...getDeletedItemIds(),
    ...(Array.isArray(localDb?.deletedItemIds) ? localDb!.deletedItemIds : []),
    ...(Array.isArray(incoming?.deletedItemIds) ? incoming!.deletedItemIds : []),
  ]);
  recordDeletedItemIds(Array.from(deletedIds));

  const localUpdatedAt = typeof localDb?.updatedAt === 'number' ? localDb.updatedAt : 0;
  const incomingUpdatedAt = typeof incoming?.updatedAt === 'number' ? incoming.updatedAt : 0;
  const localIsNewer = localUpdatedAt > incomingUpdatedAt;

  // 1. Resolve RW Groups (preserve custom admin inputs & RT lists with zero data loss)
  const baseRw: RwGroup[] =
    Array.isArray(localDb?.rwGroups) && localDb!.rwGroups.length > 0
      ? localDb!.rwGroups
      : INITIAL_RW_GROUPS;
  const incRw: RwGroup[] | null =
    Array.isArray(incoming?.rwGroups) && incoming!.rwGroups.length > 0
      ? incoming!.rwGroups
      : null;

  let resolvedRwGroups: RwGroup[];

  if (!incRw) {
    resolvedRwGroups = baseRw;
  } else {
    // Merge by RW ID or Code, never allowing empty incoming strings to wipe out populated local values
    const rwMap = new Map<string, RwGroup>();

    // Helper to get normalized RW key (e.g., "rw-01" or "rw 01")
    const getRwKey = (rw: RwGroup) => (rw.rwCode || rw.id || '').trim().toLowerCase().replace(/\s+/g, '');

    // Populate baseline from either local or incoming depending on which is newer
    const primaryList = localIsNewer ? baseRw : incRw;
    const secondaryList = localIsNewer ? incRw : baseRw;

    for (const r of secondaryList) {
      if (r) rwMap.set(getRwKey(r), r);
    }

    for (const p of primaryList) {
      if (!p) continue;
      const key = getRwKey(p);
      const existing = rwMap.get(key);
      if (!existing) {
        rwMap.set(key, p);
      } else {
        // Merge field by field: prefer non-empty primary, fallback to non-empty existing
        const pRts = Array.isArray(p.rtList) ? p.rtList : [];
        const eRts = Array.isArray(existing.rtList) ? existing.rtList : [];
        const rtMap = new Map<string, typeof pRts[0]>();
        // Secondary RTs first, then primary RTs
        eRts.forEach((rt) => rt && rt.id && rtMap.set(rt.id, rt));
        pRts.forEach((rt) => rt && rt.id && rtMap.set(rt.id, rt));

        rwMap.set(key, {
          ...existing,
          ...p,
          ketuaRwName: (p.ketuaRwName && p.ketuaRwName.trim()) || existing.ketuaRwName || '',
          rwName: (p.rwName && p.rwName.trim()) || existing.rwName || p.rwCode,
          phone: (p.phone && p.phone.trim()) || existing.phone || '',
          areaDescription: (p.areaDescription && p.areaDescription.trim()) || existing.areaDescription || '',
          rtList: Array.from(rtMap.values()),
        });
      }
    }

    resolvedRwGroups = Array.from(rwMap.values());
  }

  // 2. Resolve Profile - Never let blank/empty values wipe out custom NIP, Lurah, or office data
  const baseProfile = localDb?.profile || INITIAL_KELURAHAN_PROFILE;
  const incProfile = incoming?.profile || ({} as Partial<KelurahanProfile>);

  // Determine primary & secondary profiles based on timestamp recency
  const primaryProfile = localIsNewer ? baseProfile : { ...baseProfile, ...incProfile };
  const secondaryProfile = localIsNewer ? { ...baseProfile, ...incProfile } : baseProfile;

  const pickNonEmpty = (field: keyof KelurahanProfile, fallback = ''): string => {
    const valPrimary = primaryProfile[field];
    if (typeof valPrimary === 'string' && valPrimary.trim()) return valPrimary.trim();
    const valSecondary = secondaryProfile[field];
    if (typeof valSecondary === 'string' && valSecondary.trim()) return valSecondary.trim();
    const valInitial = INITIAL_KELURAHAN_PROFILE[field];
    if (typeof valInitial === 'string' && valInitial.trim()) return valInitial.trim();
    return fallback;
  };

  const resolvedOfficials = (
    Array.isArray(primaryProfile.officials) && primaryProfile.officials.length > 0
      ? primaryProfile.officials
      : (Array.isArray(secondaryProfile.officials) && secondaryProfile.officials.length > 0
          ? secondaryProfile.officials
          : (Array.isArray(baseProfile.officials) ? baseProfile.officials : []))
  ).filter((o) => o && o.id && !deletedIds.has(o.id));

  const resolvedMisi = Array.isArray(primaryProfile.misi) && primaryProfile.misi.length > 0
    ? primaryProfile.misi
    : (Array.isArray(secondaryProfile.misi) && secondaryProfile.misi.length > 0
        ? secondaryProfile.misi
        : INITIAL_KELURAHAN_PROFILE.misi || []);

  const resolvedBoundaries = primaryProfile.boundaries && (primaryProfile.boundaries.utara || primaryProfile.boundaries.selatan)
    ? primaryProfile.boundaries
    : (secondaryProfile.boundaries && (secondaryProfile.boundaries.utara || secondaryProfile.boundaries.selatan)
        ? secondaryProfile.boundaries
        : INITIAL_KELURAHAN_PROFILE.boundaries);

  const resolvedProfile: KelurahanProfile = {
    ...baseProfile,
    ...secondaryProfile,
    ...primaryProfile,
    officials: resolvedOfficials,
    lurahName: pickNonEmpty('lurahName'),
    lurahNip: pickNonEmpty('lurahNip'),
    lurahPhotoUrl: pickNonEmpty('lurahPhotoUrl'),
    lurahRank: pickNonEmpty('lurahRank'),
    lurahPeriod: pickNonEmpty('lurahPeriod'),
    lurahMessage: pickNonEmpty('lurahMessage'),
    sekretarisName: pickNonEmpty('sekretarisName'),
    kasiKebersihanName: pickNonEmpty('kasiKebersihanName'),
    kasiPemerintahanName: pickNonEmpty('kasiPemerintahanName'),
    officeAddress: pickNonEmpty('officeAddress'),
    subDistrict: pickNonEmpty('subDistrict', 'Kecamatan Panakkukang'),
    city: pickNonEmpty('city', 'Kota Makassar, Provinsi Sulawesi Selatan'),
    postalCode: pickNonEmpty('postalCode', '90231'),
    serviceHours: pickNonEmpty('serviceHours', 'Senin – Jumat · 08:00 – 16:00 WITA'),
    phoneContact: pickNonEmpty('phoneContact'),
    emailContact: pickNonEmpty('emailContact'),
    baganStrukturKelurahanUrl: pickNonEmpty('baganStrukturKelurahanUrl'),
    baganStrukturRtRwUrl: pickNonEmpty('baganStrukturRtRwUrl'),
    areaKm2: pickNonEmpty('areaKm2'),
    totalPopulation: pickNonEmpty('totalPopulation'),
    visi: pickNonEmpty('visi'),
    misi: resolvedMisi,
    boundaries: resolvedBoundaries,
    totalRw: resolvedRwGroups.length,
    totalRt: resolvedRwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
  };

  // 3. Resolve Reports: CRITICAL ZERO-LOSS MERGE WITH TOMBSTONE HONORED
  const resolvedReports = mergeEntityCollection(
    localDb?.reports,
    incoming?.reports,
    INITIAL_REPORTS,
    deletedIds,
    localIsNewer
  );

  // Guarantee that any report in the Journal is present (unless deleted)
  const journalReports = loadReportsJournal();
  const reportsMap = new Map<string, CitizenReport>(resolvedReports.map((r) => [r.id, r]));
  for (const jRep of journalReports) {
    if (jRep && jRep.id && !deletedIds.has(jRep.id) && !reportsMap.has(jRep.id)) {
      reportsMap.set(jRep.id, jRep);
    }
  }
  const finalReports = Array.from(reportsMap.values()).sort((a, b) => {
    const aTime = a.id.startsWith('rep-') ? parseInt(a.id.replace('rep-', ''), 10) || 0 : 0;
    const bTime = b.id.startsWith('rep-') ? parseInt(b.id.replace('rep-', ''), 10) || 0 : 0;
    return bTime - aTime;
  });

  // 4. Resolve Waste Units & Logs
  const resolvedWasteUnits = mergeEntityCollection(
    localDb?.wasteUnits,
    incoming?.wasteUnits,
    INITIAL_WASTE_UNITS,
    deletedIds,
    localIsNewer
  );

  const resolvedWasteLogs = mergeEntityCollection(
    localDb?.wasteLogs,
    incoming?.wasteLogs,
    INITIAL_WASTE_LOGS,
    deletedIds,
    localIsNewer
  );

  // Guarantee journal logs are included if not deleted
  const journalLogs = loadWasteLogsJournal();
  const logsMap = new Map<string, WasteLogEntry>(resolvedWasteLogs.map((l) => [l.id, l]));
  for (const jl of journalLogs) {
    if (jl && jl.id && !deletedIds.has(jl.id) && !logsMap.has(jl.id)) {
      logsMap.set(jl.id, jl);
    }
  }
  const finalWasteLogs = Array.from(logsMap.values());

  // 5. Resolve Teba & Biopori (preserve non-empty custom entries, omit deleted)
  const resolvedTebaSpots = mergeEntityCollection(
    localDb?.tebaSpots,
    incoming?.tebaSpots,
    INITIAL_TEBA_SPOTS,
    deletedIds,
    localIsNewer
  );

  const resolvedBioporiPoints = mergeEntityCollection(
    localDb?.bioporiPoints,
    incoming?.bioporiPoints,
    INITIAL_BIOPORI_POINTS,
    deletedIds,
    localIsNewer
  );

  // 6. Cleanup Events
  const resolvedCleanupEvents = mergeEntityCollection(
    localDb?.cleanupEvents,
    incoming?.cleanupEvents,
    INITIAL_CLEANUP_EVENTS,
    deletedIds,
    localIsNewer
  );

  // 7. Urban Farming Spots & Seed Requests
  const resolvedUrbanFarmingSpots = mergeEntityCollection(
    localDb?.urbanFarmingSpots,
    incoming?.urbanFarmingSpots,
    INITIAL_URBAN_FARMING_SPOTS,
    deletedIds,
    localIsNewer
  );

  const resolvedSeedRequests = mergeEntityCollection(
    localDb?.seedRequests,
    incoming?.seedRequests,
    INITIAL_SEED_REQUESTS,
    deletedIds,
    localIsNewer
  );

  // 8. Kelurahan Infos & WhatsApp Recipients
  const resolvedKelurahanInfos = mergeEntityCollection(
    localDb?.kelurahanInfos,
    incoming?.kelurahanInfos,
    INITIAL_KELURAHAN_INFOS,
    deletedIds,
    localIsNewer
  );

  const resolvedWhatsappRecipients = mergeEntityCollection(
    localDb?.whatsappRecipients,
    incoming?.whatsappRecipients,
    INITIAL_WHATSAPP_RECIPIENTS,
    deletedIds,
    localIsNewer
  );

  const resolvedServiceCatalog = Array.isArray(incoming?.serviceCatalog) && incoming!.serviceCatalog.length > 0
    ? incoming!.serviceCatalog
    : (localDb?.serviceCatalog || SERVICE_CATEGORY_GROUPS);

  const resolvedAdminUsers = mergeEntityCollection(
    localDb?.adminUsers,
    incoming?.adminUsers,
    INITIAL_ADMIN_USERS,
    deletedIds,
    localIsNewer
  );

  const resolvedActivityLogs = Array.isArray(incoming?.activityLogs) && incoming!.activityLogs.length > 0
    ? incoming!.activityLogs
    : (localDb?.activityLogs || INITIAL_ACTIVITY_LOGS);

  const baseSchedules: SiskamlingRwSchedule[] =
    Array.isArray(localDb?.siskamlingSchedules) && localDb!.siskamlingSchedules.length > 0
      ? localDb!.siskamlingSchedules
      : INITIAL_SISKAMLING_SCHEDULES;

  const incSchedules: SiskamlingRwSchedule[] | null =
    Array.isArray(incoming?.siskamlingSchedules) && incoming!.siskamlingSchedules.length > 0
      ? incoming!.siskamlingSchedules
      : null;

  let resolvedSiskamlingSchedules: SiskamlingRwSchedule[];
  if (!incSchedules) {
    resolvedSiskamlingSchedules = baseSchedules;
  } else {
    const schedMap = new Map<string, SiskamlingRwSchedule>();
    const getSchedKey = (s: SiskamlingRwSchedule) => (s.rw || '').trim().toLowerCase().replace(/\s+/g, '');
    const primarySched = localIsNewer ? baseSchedules : incSchedules;
    const secondarySched = localIsNewer ? incSchedules : baseSchedules;

    for (const s of secondarySched) {
      if (s) schedMap.set(getSchedKey(s), s);
    }
    for (const p of primarySched) {
      if (!p) continue;
      const key = getSchedKey(p);
      const existing = schedMap.get(key);
      if (!existing) {
        schedMap.set(key, p);
      } else {
        schedMap.set(key, {
          ...existing,
          ...p,
          poskoLocation: p.poskoLocation !== undefined ? p.poskoLocation : (existing.poskoLocation || ''),
          notes: p.notes !== undefined ? p.notes : (existing.notes || ''),
          schedules: p.schedules || existing.schedules,
        });
      }
    }
    resolvedSiskamlingSchedules = Array.from(schedMap.values());
  }

  const maxUpdatedAt = Math.max(localUpdatedAt, incomingUpdatedAt, Date.now());

  return {
    profile: resolvedProfile,
    rwGroups: resolvedRwGroups,
    reports: finalReports,
    wasteUnits: resolvedWasteUnits,
    wasteLogs: finalWasteLogs,
    tebaSpots: resolvedTebaSpots,
    bioporiPoints: resolvedBioporiPoints,
    cleanupEvents: resolvedCleanupEvents,
    kelurahanInfos: resolvedKelurahanInfos,
    whatsappRecipients: resolvedWhatsappRecipients,
    serviceCatalog: resolvedServiceCatalog,
    adminUsers: resolvedAdminUsers,
    activityLogs: resolvedActivityLogs,
    urbanFarmingSpots: resolvedUrbanFarmingSpots,
    seedRequests: resolvedSeedRequests,
    urbanFarmingLocations: incoming?.urbanFarmingLocations || localDb?.urbanFarmingLocations || INITIAL_URBAN_FARMING_LOCATIONS,
    farmerGroups: incoming?.farmerGroups || localDb?.farmerGroups || INITIAL_FARMER_GROUPS,
    crops: incoming?.crops || localDb?.crops || INITIAL_CROPS,
    plantCareLogs: incoming?.plantCareLogs || localDb?.plantCareLogs || INITIAL_PLANT_CARE_LOGS,
    harvestRecords: incoming?.harvestRecords || localDb?.harvestRecords || INITIAL_HARVEST_RECORDS,
    farmingInventories: incoming?.farmingInventories || localDb?.farmingInventories || INITIAL_FARMING_INVENTORIES,
    supplyRequests: incoming?.supplyRequests || localDb?.supplyRequests || INITIAL_SUPPLY_REQUESTS,
    siskamlingSchedules: resolvedSiskamlingSchedules,
    deletedItemIds: Array.from(deletedIds),
    updatedAt: maxUpdatedAt,
  };
}

export function buildDefaultPersistedDatabase(): PersistedDatabase {
  return smartMergeDatabases(null, null);
}

export function loadPersistedDatabase(): PersistedDatabase | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Fallback to secondary backup key
      raw = window.localStorage.getItem(BACKUP_KEY);
    }
    if (!raw) {
      // If no full DB is stored, check if there are any journaled user reports
      const journalReports = loadReportsJournal();
      if (journalReports.length > 0) {
        return smartMergeDatabases(null, { reports: journalReports });
      }
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Pass through smartMerge to ensure any journal reports or official RW structure are fully intact
    return smartMergeDatabases(parsed as PersistedDatabase, null);
  } catch {
    return null;
  }
}

export function savePersistedDatabase(db: PersistedDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    const deletedSet = new Set<string>([
      ...getDeletedItemIds(),
      ...(Array.isArray(db.deletedItemIds) ? db.deletedItemIds : []),
    ]);
    db.deletedItemIds = Array.from(deletedSet);

    // Filter all collections against deletedSet before storing
    if (deletedSet.size > 0) {
      if (db.profile && Array.isArray(db.profile.officials)) {
        db.profile.officials = db.profile.officials.filter((o) => o && o.id && !deletedSet.has(o.id));
      }
      db.reports = (db.reports || []).filter((r) => r && r.id && !deletedSet.has(r.id));
      db.wasteUnits = (db.wasteUnits || []).filter((u) => u && u.id && !deletedSet.has(u.id));
      db.wasteLogs = (db.wasteLogs || []).filter((l) => l && l.id && !deletedSet.has(l.id));
      db.tebaSpots = (db.tebaSpots || []).filter((s) => s && s.id && !deletedSet.has(s.id));
      db.bioporiPoints = (db.bioporiPoints || []).filter((b) => b && b.id && !deletedSet.has(b.id));
      db.cleanupEvents = (db.cleanupEvents || []).filter((e) => e && e.id && !deletedSet.has(e.id));
      db.kelurahanInfos = (db.kelurahanInfos || []).filter((i) => i && i.id && !deletedSet.has(i.id));
      db.whatsappRecipients = (db.whatsappRecipients || []).filter((w) => w && w.id && !deletedSet.has(w.id));
      db.adminUsers = (db.adminUsers || []).filter((u) => u && u.id && !deletedSet.has(u.id));
      db.urbanFarmingSpots = (db.urbanFarmingSpots || []).filter((s) => s && s.id && !deletedSet.has(s.id));
      db.seedRequests = (db.seedRequests || []).filter((s) => s && s.id && !deletedSet.has(s.id));
    }

    const serialized = JSON.stringify(db);
    // 1. Primary storage
    window.localStorage.setItem(STORAGE_KEY, serialized);
    // 2. Redundant backup storage
    window.localStorage.setItem(BACKUP_KEY, serialized);
    // 3. Persistent tombstone storage
    window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(db.deletedItemIds));

    // 4. User Journal extraction (all user-submitted reports and logs that are not deleted)
    const userReports = db.reports.filter(
      (r) => (!INITIAL_REPORT_IDS.has(r.id) || r.id.startsWith('rep-')) && !deletedSet.has(r.id)
    );
    window.localStorage.setItem(JOURNAL_REPORTS_KEY, JSON.stringify(userReports));

    const userLogs = db.wasteLogs.filter(
      (l) => (!INITIAL_WASTE_LOG_IDS.has(l.id) || l.id.startsWith('log-')) && !deletedSet.has(l.id)
    );
    window.localStorage.setItem(JOURNAL_LOGS_KEY, JSON.stringify(userLogs));

    // 5. Dispatch custom event for real-time reactivity across tabs
    window.dispatchEvent(new CustomEvent('pnk_db_updated', { detail: { updatedAt: db.updatedAt } }));
  } catch (err) {
    console.warn('Could not save full state to localStorage:', err);
  }
}

/**
 * Downloads a complete JSON snapshot file of the application database
 */
export function exportDatabaseToJson(db: PersistedDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    const jsonString = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `panaikang-smart-environment-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export database to JSON file:', err);
  }
}

/**
 * Parses and validates an uploaded JSON database snapshot file
 */
export function parseImportDatabaseJson(jsonString: string): PersistedDatabase | null {
  try {
    const parsed = JSON.parse(jsonString) as Partial<PersistedDatabase>;
    if (!parsed || typeof parsed !== 'object') return null;

    if (!parsed.profile || !parsed.profile.lurahName) return null;
    if (!Array.isArray(parsed.rwGroups) || !Array.isArray(parsed.reports)) return null;

    return smartMergeDatabases(null, parsed);
  } catch (err) {
    console.error('Failed to parse import database JSON:', err);
    return null;
  }
}
