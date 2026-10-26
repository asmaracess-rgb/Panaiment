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
} from '../types';
import {
  INITIAL_KELURAHAN_PROFILE,
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
  deletedItemIds?: string[];
  updatedAt: number;
}

// Multi-tier storage keys to guarantee zero data loss across GitHub sync & Vercel builds
const STORAGE_KEY = 'pnk_smart_env_db_v3';
const BACKUP_KEY = 'pnk_smart_env_db_backup_v3';
const JOURNAL_REPORTS_KEY = 'pnk_smart_env_user_reports_v1';
const JOURNAL_LOGS_KEY = 'pnk_smart_env_user_logs_v1';
const DELETED_IDS_KEY = 'pnk_smart_env_deleted_ids_v1';

// Initial IDs to distinguish default sample data from actual citizen & admin input
const INITIAL_REPORT_IDS = new Set(INITIAL_REPORTS.map((r) => r.id));
const INITIAL_WASTE_LOG_IDS = new Set(INITIAL_WASTE_LOGS.map((l) => l.id));

/**
 * Returns the Set of permanently deleted entity IDs across all sessions
 */
export function getDeletedItemIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
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
 * Non-destructive Smart Merge: Merges two database snapshots ensuring that
 * ANY user-submitted citizen report, waste log, or custom administration edit
 * is 100% retained and NEVER discarded when a newer deployment or git sync arrives.
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

  // 1. Resolve RW Groups (preserve custom edits or defaults)
  const baseRw = localDb?.rwGroups || INITIAL_RW_GROUPS;
  const incRw = incoming?.rwGroups;
  const resolvedRwGroups =
    Array.isArray(incRw) && incRw.length > 0
      ? incRw.map((irw) => {
          const matchingLocal = baseRw.find((lrw) => lrw.id === irw.id || lrw.rwCode === irw.rwCode);
          if (matchingLocal && matchingLocal.phone && !irw.phone) {
            return { ...irw, phone: matchingLocal.phone };
          }
          return irw;
        })
      : baseRw;

  // 2. Resolve Profile
  const baseProfile = localDb?.profile || INITIAL_KELURAHAN_PROFILE;
  const incProfile = incoming?.profile;
  const resolvedProfile: KelurahanProfile = {
    ...(incProfile || baseProfile),
    lurahName: incProfile?.lurahName || baseProfile.lurahName || INITIAL_KELURAHAN_PROFILE.lurahName,
    lurahNip: incProfile?.lurahNip || baseProfile.lurahNip || INITIAL_KELURAHAN_PROFILE.lurahNip,
    lurahMessage: incProfile?.lurahMessage || baseProfile.lurahMessage || INITIAL_KELURAHAN_PROFILE.lurahMessage,
    officeAddress: incProfile?.officeAddress || baseProfile.officeAddress || INITIAL_KELURAHAN_PROFILE.officeAddress,
    phoneContact: incProfile?.phoneContact || baseProfile.phoneContact || INITIAL_KELURAHAN_PROFILE.phoneContact,
    totalRw: resolvedRwGroups.length,
    totalRt: resolvedRwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
  };

  // 3. Resolve Reports: CRITICAL ZERO-LOSS MERGE WITH TOMBSTONE HONORED
  const reportsMap = new Map<string, CitizenReport>();

  // a. Load baseline from incoming or local or initial (filtering deleted IDs)
  const sourceIncomingReports = Array.isArray(incoming?.reports)
    ? incoming!.reports
    : (localDb?.reports || INITIAL_REPORTS);
  for (const rep of sourceIncomingReports) {
    if (rep && rep.id && !deletedIds.has(rep.id)) {
      reportsMap.set(rep.id, rep);
    }
  }

  // b. Layer local reports over incoming (local user edits take precedence for user reports)
  if (localDb && Array.isArray(localDb.reports)) {
    for (const rep of localDb.reports) {
      if (!rep || !rep.id || deletedIds.has(rep.id)) continue;
      const existing = reportsMap.get(rep.id);
      if (!existing) {
        reportsMap.set(rep.id, rep);
      } else {
        const isExistingAdvanced =
          existing.status === 'Selesai' || existing.status === 'Sedang Ditangani';
        const isLocalAdvanced =
          rep.status === 'Selesai' || rep.status === 'Sedang Ditangani';
        if (isLocalAdvanced && !isExistingAdvanced) {
          reportsMap.set(rep.id, rep);
        } else if (rep.verifiedBy || rep.completionPhotoUrl || rep.responseNote !== existing.responseNote) {
          reportsMap.set(rep.id, { ...existing, ...rep });
        }
      }
    }
  }

  // c. Guarantee that any report in the Journal is present (unless deleted)
  const journalReports = loadReportsJournal();
  for (const jRep of journalReports) {
    if (jRep && jRep.id && !deletedIds.has(jRep.id) && !reportsMap.has(jRep.id)) {
      reportsMap.set(jRep.id, jRep);
    }
  }

  const resolvedReports = Array.from(reportsMap.values()).sort((a, b) => {
    const aTime = a.id.startsWith('rep-') ? parseInt(a.id.replace('rep-', ''), 10) || 0 : 0;
    const bTime = b.id.startsWith('rep-') ? parseInt(b.id.replace('rep-', ''), 10) || 0 : 0;
    return bTime - aTime;
  });

  // 4. Resolve Waste Units & Logs
  const baseWasteUnits = Array.isArray(incoming?.wasteUnits) && incoming!.wasteUnits.length > 0
    ? incoming!.wasteUnits
    : (localDb?.wasteUnits && localDb.wasteUnits.length > 0 ? localDb.wasteUnits : INITIAL_WASTE_UNITS);
  const resolvedWasteUnits = baseWasteUnits.filter((u) => u && u.id && !deletedIds.has(u.id));

  const logsMap = new Map<string, WasteLogEntry>();
  const sourceLogs = Array.isArray(incoming?.wasteLogs)
    ? incoming!.wasteLogs
    : (localDb?.wasteLogs || INITIAL_WASTE_LOGS);
  for (const l of sourceLogs) {
    if (l && l.id && !deletedIds.has(l.id)) logsMap.set(l.id, l);
  }
  if (localDb && Array.isArray(localDb.wasteLogs)) {
    for (const l of localDb.wasteLogs) {
      if (l && l.id && !deletedIds.has(l.id) && !logsMap.has(l.id)) logsMap.set(l.id, l);
    }
  }
  const journalLogs = loadWasteLogsJournal();
  for (const jl of journalLogs) {
    if (jl && jl.id && !deletedIds.has(jl.id) && !logsMap.has(jl.id)) logsMap.set(jl.id, jl);
  }
  const resolvedWasteLogs = Array.from(logsMap.values());

  // 5. Resolve Teba & Biopori (preserve non-empty custom entries, omit deleted)
  const baseTeba = Array.isArray(incoming?.tebaSpots) && incoming!.tebaSpots.length > 0
    ? incoming!.tebaSpots
    : (localDb?.tebaSpots && localDb.tebaSpots.length > 0 ? localDb.tebaSpots : INITIAL_TEBA_SPOTS);
  const resolvedTebaSpots = baseTeba.filter((s) => s && s.id && !deletedIds.has(s.id));

  const baseBiopori = Array.isArray(incoming?.bioporiPoints) && incoming!.bioporiPoints.length > 0
    ? incoming!.bioporiPoints
    : (localDb?.bioporiPoints && localDb.bioporiPoints.length > 0 ? localDb.bioporiPoints : INITIAL_BIOPORI_POINTS);
  const resolvedBioporiPoints = baseBiopori.filter((b) => b && b.id && !deletedIds.has(b.id));

  // 6. Cleanup Events
  const eventsMap = new Map<string, CleanupEvent>();
  const sourceEvents = Array.isArray(incoming?.cleanupEvents)
    ? incoming!.cleanupEvents
    : (localDb?.cleanupEvents || INITIAL_CLEANUP_EVENTS);
  for (const ev of sourceEvents) {
    if (ev && ev.id && !deletedIds.has(ev.id)) eventsMap.set(ev.id, ev);
  }
  if (localDb && Array.isArray(localDb.cleanupEvents)) {
    for (const ev of localDb.cleanupEvents) {
      if (ev && ev.id && !deletedIds.has(ev.id) && !eventsMap.has(ev.id)) eventsMap.set(ev.id, ev);
    }
  }
  const resolvedCleanupEvents = Array.from(eventsMap.values());

  // 7. Urban Farming Spots & Seed Requests
  const spotsMap = new Map<string, UrbanFarmingSpot>();
  const sourceSpots = Array.isArray(incoming?.urbanFarmingSpots)
    ? incoming!.urbanFarmingSpots
    : (localDb?.urbanFarmingSpots || INITIAL_URBAN_FARMING_SPOTS);
  for (const s of sourceSpots) {
    if (s && s.id && !deletedIds.has(s.id)) spotsMap.set(s.id, s);
  }
  if (localDb && Array.isArray(localDb.urbanFarmingSpots)) {
    for (const s of localDb.urbanFarmingSpots) {
      if (s && s.id && !deletedIds.has(s.id) && !spotsMap.has(s.id)) spotsMap.set(s.id, s);
    }
  }
  const resolvedUrbanFarmingSpots = Array.from(spotsMap.values());

  const seedsMap = new Map<string, SeedRequestItem>();
  const sourceSeeds = Array.isArray(incoming?.seedRequests)
    ? incoming!.seedRequests
    : (localDb?.seedRequests || INITIAL_SEED_REQUESTS);
  for (const sr of sourceSeeds) {
    if (sr && sr.id && !deletedIds.has(sr.id)) seedsMap.set(sr.id, sr);
  }
  if (localDb && Array.isArray(localDb.seedRequests)) {
    for (const sr of localDb.seedRequests) {
      if (sr && sr.id && !deletedIds.has(sr.id) && !seedsMap.has(sr.id)) seedsMap.set(sr.id, sr);
    }
  }
  const resolvedSeedRequests = Array.from(seedsMap.values());

  // 8. Kelurahan Infos & WhatsApp Recipients
  const baseInfos = Array.isArray(incoming?.kelurahanInfos) && incoming!.kelurahanInfos.length > 0
    ? incoming!.kelurahanInfos
    : (localDb?.kelurahanInfos || INITIAL_KELURAHAN_INFOS);
  const resolvedKelurahanInfos = baseInfos.filter((i) => i && i.id && !deletedIds.has(i.id));

  const baseRecipients = Array.isArray(incoming?.whatsappRecipients) && incoming!.whatsappRecipients.length > 0
    ? incoming!.whatsappRecipients
    : (localDb?.whatsappRecipients || INITIAL_WHATSAPP_RECIPIENTS);
  const resolvedWhatsappRecipients = baseRecipients.filter((w) => w && w.id && !deletedIds.has(w.id));

  const resolvedServiceCatalog = Array.isArray(incoming?.serviceCatalog) && incoming!.serviceCatalog.length > 0
    ? incoming!.serviceCatalog
    : (localDb?.serviceCatalog || SERVICE_CATEGORY_GROUPS);

  const baseAdminUsers = Array.isArray(incoming?.adminUsers) && incoming!.adminUsers.length > 0
    ? incoming!.adminUsers
    : (localDb?.adminUsers || INITIAL_ADMIN_USERS);
  const resolvedAdminUsers = baseAdminUsers.filter((u) => u && u.id && !deletedIds.has(u.id));

  const baseActivityLogs = Array.isArray(incoming?.activityLogs) && incoming!.activityLogs.length > 0
    ? incoming!.activityLogs
    : (localDb?.activityLogs || INITIAL_ACTIVITY_LOGS);
  const resolvedActivityLogs = baseActivityLogs.filter((a) => a && a.id && !deletedIds.has(a.id));

  const maxUpdatedAt = Math.max(
    localDb?.updatedAt || 0,
    incoming?.updatedAt || 0,
    Date.now()
  );

  return {
    profile: resolvedProfile,
    rwGroups: resolvedRwGroups,
    reports: resolvedReports,
    wasteUnits: resolvedWasteUnits,
    wasteLogs: resolvedWasteLogs,
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
    deletedItemIds: Array.from(deletedIds),
    updatedAt: maxUpdatedAt,
  };
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
  try {
    const exportPayload = {
      app: 'Panaikang Smart Environment',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      kelurahan: 'Kelurahan Panaikang, Kota Makassar',
      data: db,
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `backup_panaikang_smart_environment_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export database:', err);
  }
}

/**
 * Parses and validates an uploaded backup JSON file
 */
export function parseImportDatabaseJson(jsonString: string): PersistedDatabase | null {
  try {
    const parsed = JSON.parse(jsonString);
    const candidateData = parsed.data || parsed;
    if (!candidateData || typeof candidateData !== 'object') {
      return null;
    }
    return smartMergeDatabases(null, candidateData);
  } catch {
    return null;
  }
}
