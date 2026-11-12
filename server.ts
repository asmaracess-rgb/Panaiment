import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_OFFICIALS,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
} from './src/data/initialData.ts';
import type {
  KelurahanProfile,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  KerjaBaktiIgHighlightItem,
  KelurahanInfoItem,
  RwGroup,
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
  AuthenticatedUserProfile,
  CitizenMenuAccessConfig,
  GoogleAdminVerificationRequest,
} from './src/types.ts';
import {
  INITIAL_TEBA_SPOTS,
  INITIAL_BIOPORI_POINTS,
  INITIAL_KERJABAKTI_IG_HIGHLIGHTS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
  INITIAL_URBAN_FARMING_LOCATIONS,
  INITIAL_FARMER_GROUPS,
  INITIAL_CROPS,
  INITIAL_PLANT_CARE_LOGS,
  INITIAL_HARVEST_RECORDS,
  INITIAL_FARMING_INVENTORIES,
  INITIAL_SUPPLY_REQUESTS,
} from './src/data/initialData.ts';
import { INITIAL_SISKAMLING_SCHEDULES } from './src/data/siskamlingData.ts';
import {
  SERVICE_CATEGORY_GROUPS,
  type ServiceCategoryGroup,
} from './src/data/wargaServiceCatalog.ts';
import {
  getRealtimeDateTimeString,
  getRealtimeDateString,
  getRealtimeTimeString,
} from './src/utils/realtimeDate.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception (recovered):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection (recovered):', reason);
});

interface DatabaseSchema {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  tebaSpots: TebaSpot[];
  bioporiPoints: BioporiPoint[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  whatsappRecipients: WhatsAppRecipient[];
  serviceCatalog: ServiceCategoryGroup[];
  adminUsers: AdminUserAccount[];
  activityLogs: AdminActivityLog[];
  urbanFarmingSpots: UrbanFarmingSpot[];
  seedRequests: SeedRequestItem[];
  urbanFarmingLocations: UrbanFarmingLocation[];
  farmerGroups: FarmerGroup[];
  crops: CropItem[];
  plantCareLogs: PlantCareLog[];
  harvestRecords: HarvestRecord[];
  farmingInventories: FarmingInventoryItem[];
  supplyRequests: SupplyRequestItem[];
  siskamlingSchedules?: SiskamlingRwSchedule[];
  waDispatchLogs?: any[];
  citizenUsers?: AuthenticatedUserProfile[];
  citizenMenuConfig?: CitizenMenuAccessConfig;
  googleAdminVerificationRequests?: GoogleAdminVerificationRequest[];
  deletedItemIds?: string[];
  lastModified: string;
  updatedAt?: number;
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'panaikang_db.json');

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (parsed && parsed.profile) {
        const deletedSet = new Set<string>(
          Array.isArray(parsed.deletedItemIds) ? parsed.deletedItemIds : []
        );

        const hasOfficialRwData =
          Array.isArray(parsed.rwGroups) && parsed.rwGroups.length > 0;
        const resolvedRwGroups = hasOfficialRwData ? parsed.rwGroups! : INITIAL_RW_GROUPS;
        const legacyOfficialIds = new Set(['off-1', 'off-2', 'off-3', 'off-4']);
        const resolvedOfficials = (
          Array.isArray(parsed.profile?.officials) ? parsed.profile.officials : []
        ).filter((o) => o && o.id && !deletedSet.has(o.id) && !legacyOfficialIds.has(o.id));

        const resolvedProfile: KelurahanProfile = {
          ...INITIAL_KELURAHAN_PROFILE,
          ...parsed.profile,
          officials: resolvedOfficials,
          lurahPhotoUrl:
            parsed.profile?.lurahPhotoUrl?.trim() ||
            INITIAL_KELURAHAN_PROFILE.lurahPhotoUrl ||
            '/images/lurah_muthmainnah_panaikang_1791548085422.jpg',
          sekretarisName:
            parsed.profile?.sekretarisName === 'Hj. Rahmawati Dg. Ngasseng, S.Sos.'
              ? ''
              : (parsed.profile?.sekretarisName || ''),
          kasiKebersihanName:
            parsed.profile?.kasiKebersihanName === 'Muh. Syahrul Ramadhan, S.T.'
              ? ''
              : (parsed.profile?.kasiKebersihanName || ''),
          kasiPemerintahanName:
            parsed.profile?.kasiPemerintahanName === 'Drs. H. Kamaruddin Lira'
              ? ''
              : (parsed.profile?.kasiPemerintahanName || ''),
          totalRw: resolvedRwGroups.length,
          totalRt: resolvedRwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
        };

        const filterDeleted = <T extends { id: string }>(arr: T[] | undefined, fallback: T[]): T[] => {
          const list = Array.isArray(arr) ? arr : fallback;
          return list.filter((item) => item && item.id && !deletedSet.has(item.id));
        };

        const rawAdminUsers = filterDeleted(parsed.adminUsers, INITIAL_ADMIN_USERS);
        const normalizeCategoryId = (catId: string): string => {
          if (catId === 'adminduk') return 'administrasi_kependudukan';
          if (catId === 'pengaduan_warga') return 'pengaduan_permasalahan_warga';
          return catId;
        };
        const normalizedAdminUsers = rawAdminUsers.map((u) => ({
          ...u,
          allowedServiceCategories: Array.from(
            new Set((u.allowedServiceCategories || []).map(normalizeCategoryId))
          ),
        }));
        const kasiPemberdayaanInit = INITIAL_ADMIN_USERS.find(
          (u) => u.id === 'usr-kasi-pemberdayaan'
        );
        if (
          kasiPemberdayaanInit &&
          !deletedSet.has('usr-kasi-pemberdayaan') &&
          !normalizedAdminUsers.some(
            (u) => u.id === 'usr-kasi-pemberdayaan' || u.username === 'kasi.pemberdayaan'
          )
        ) {
          const insertIdx = normalizedAdminUsers.findIndex((u) => u.id === 'usr-kasi-pemerintahan');
          if (insertIdx !== -1) {
            normalizedAdminUsers.splice(insertIdx + 1, 0, kasiPemberdayaanInit);
          } else {
            normalizedAdminUsers.push(kasiPemberdayaanInit);
          }
        }

        return {
          profile: resolvedProfile,
          rwGroups: resolvedRwGroups,
          reports: filterDeleted(parsed.reports, INITIAL_REPORTS),
          wasteUnits: filterDeleted(parsed.wasteUnits, INITIAL_WASTE_UNITS),
          wasteLogs: filterDeleted(parsed.wasteLogs, INITIAL_WASTE_LOGS),
          tebaSpots: filterDeleted(parsed.tebaSpots, INITIAL_TEBA_SPOTS),
          bioporiPoints: filterDeleted(parsed.bioporiPoints, INITIAL_BIOPORI_POINTS),
          cleanupEvents: filterDeleted(parsed.cleanupEvents, INITIAL_CLEANUP_EVENTS).filter(
            (e) => e && e.id && !e.id.startsWith('ig-kb-')
          ),
          kelurahanInfos: (() => {
            const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
            const existingInfos = filterDeleted(parsed.kelurahanInfos, INITIAL_KELURAHAN_INFOS);
            const map = new Map<string, KelurahanInfoItem>();
            const seenUrls = new Set<string>();
            for (const item of existingInfos) {
              if (!item || !item.id || deletedSet.has(item.id) || legacyIds.has(item.id)) continue;
              const urlKey = item.instagramPostUrl ? item.instagramPostUrl.trim() : '';
              if (urlKey && seenUrls.has(urlKey)) continue;
              if (urlKey) seenUrls.add(urlKey);
              map.set(item.id, item);
            }
            for (const initItem of INITIAL_KELURAHAN_INFOS) {
              if (!initItem || !initItem.id || deletedSet.has(initItem.id)) continue;
              const urlKey = initItem.instagramPostUrl ? initItem.instagramPostUrl.trim() : '';
              if (urlKey && seenUrls.has(urlKey)) continue;
              if (!map.has(initItem.id)) {
                if (urlKey) seenUrls.add(urlKey);
                map.set(initItem.id, initItem);
              }
            }
            return Array.from(map.values());
          })(),
          whatsappRecipients: (() => {
            const legacyWaIds = new Set([
              'wa-rec-lurah',
              'wa-rec-seklur',
              'wa-rec-kebersihan',
              'wa-rec-pemerintahan',
            ]);
            const list = filterDeleted(parsed.whatsappRecipients, INITIAL_WHATSAPP_RECIPIENTS).filter(
              (w) => w && w.id && !legacyWaIds.has(w.id)
            );
            return list.length > 0 ? list : INITIAL_WHATSAPP_RECIPIENTS;
          })(),
          serviceCatalog:
            Array.isArray(parsed.serviceCatalog) && parsed.serviceCatalog.length > 0
              ? parsed.serviceCatalog
              : SERVICE_CATEGORY_GROUPS,
          adminUsers: normalizedAdminUsers,
          activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : INITIAL_ACTIVITY_LOGS,
          urbanFarmingSpots: filterDeleted(parsed.urbanFarmingSpots, INITIAL_URBAN_FARMING_SPOTS),
          seedRequests: filterDeleted(parsed.seedRequests, INITIAL_SEED_REQUESTS),
          urbanFarmingLocations: Array.isArray(parsed.urbanFarmingLocations)
            ? parsed.urbanFarmingLocations
            : INITIAL_URBAN_FARMING_LOCATIONS,
          farmerGroups: Array.isArray(parsed.farmerGroups) ? parsed.farmerGroups : INITIAL_FARMER_GROUPS,
          crops: Array.isArray(parsed.crops) ? parsed.crops : INITIAL_CROPS,
          plantCareLogs: Array.isArray(parsed.plantCareLogs) ? parsed.plantCareLogs : INITIAL_PLANT_CARE_LOGS,
          harvestRecords: Array.isArray(parsed.harvestRecords) ? parsed.harvestRecords : INITIAL_HARVEST_RECORDS,
          farmingInventories: Array.isArray(parsed.farmingInventories)
            ? parsed.farmingInventories
            : INITIAL_FARMING_INVENTORIES,
          supplyRequests: Array.isArray(parsed.supplyRequests) ? parsed.supplyRequests : INITIAL_SUPPLY_REQUESTS,
          siskamlingSchedules:
            Array.isArray(parsed.siskamlingSchedules) && parsed.siskamlingSchedules.length > 0
              ? parsed.siskamlingSchedules
              : INITIAL_SISKAMLING_SCHEDULES,
          waDispatchLogs: Array.isArray(parsed.waDispatchLogs) ? parsed.waDispatchLogs : [],
          citizenUsers: Array.isArray(parsed.citizenUsers)
            ? parsed.citizenUsers.filter((c) => c && c.uid && !deletedSet.has(c.uid))
            : [],
          citizenMenuConfig: parsed.citizenMenuConfig,
          googleAdminVerificationRequests: Array.isArray(parsed.googleAdminVerificationRequests)
            ? parsed.googleAdminVerificationRequests.filter((r) => r && r.email && (!r.id || !deletedSet.has(r.id)))
            : [],
          deletedItemIds: Array.from(deletedSet),
          lastModified: parsed.lastModified || new Date().toISOString(),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        };
      }
    }
  } catch (err) {
    console.error('Failed to read DB file, seeding initial data:', err);
  }

  const initialDb: DatabaseSchema = {
    profile: INITIAL_KELURAHAN_PROFILE,
    rwGroups: INITIAL_RW_GROUPS,
    reports: INITIAL_REPORTS,
    wasteUnits: INITIAL_WASTE_UNITS,
    wasteLogs: INITIAL_WASTE_LOGS,
    tebaSpots: INITIAL_TEBA_SPOTS,
    bioporiPoints: INITIAL_BIOPORI_POINTS,
    cleanupEvents: INITIAL_CLEANUP_EVENTS,
    kelurahanInfos: INITIAL_KELURAHAN_INFOS,
    whatsappRecipients: INITIAL_WHATSAPP_RECIPIENTS,
    serviceCatalog: SERVICE_CATEGORY_GROUPS,
    adminUsers: INITIAL_ADMIN_USERS,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    urbanFarmingSpots: INITIAL_URBAN_FARMING_SPOTS,
    seedRequests: INITIAL_SEED_REQUESTS,
    urbanFarmingLocations: INITIAL_URBAN_FARMING_LOCATIONS,
    farmerGroups: INITIAL_FARMER_GROUPS,
    crops: INITIAL_CROPS,
    plantCareLogs: INITIAL_PLANT_CARE_LOGS,
    harvestRecords: INITIAL_HARVEST_RECORDS,
    farmingInventories: INITIAL_FARMING_INVENTORIES,
    supplyRequests: INITIAL_SUPPLY_REQUESTS,
    siskamlingSchedules: INITIAL_SISKAMLING_SCHEDULES,
    waDispatchLogs: [],
    deletedItemIds: [],
    lastModified: new Date().toISOString(),
    updatedAt: 0,
  };
  saveDatabase(initialDb, 0);
  return initialDb;
}

const sseClients = new Set<express.Response>();

interface ActiveAdminSession {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  nip: string;
  role: string;
  roleLevel: string;
  loginAt: string;
  lastHeartbeat: number;
}

let activeAdminSession: ActiveAdminSession | null = null;
const ADMIN_LOCK_FILE = path.join(DATA_DIR, 'admin_session_lock.json');
const ADMIN_HEARTBEAT_TIMEOUT_MS = 30000; // 30 seconds of inactivity releases the single admin lock

function readPersistedAdminLock(): ActiveAdminSession | null {
  try {
    if (fs.existsSync(ADMIN_LOCK_FILE)) {
      const raw = fs.readFileSync(ADMIN_LOCK_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw) as ActiveAdminSession;
        if (parsed && parsed.token && typeof parsed.lastHeartbeat === 'number') {
          const age = Date.now() - parsed.lastHeartbeat;
          if (age <= ADMIN_HEARTBEAT_TIMEOUT_MS) {
            return parsed;
          } else {
            console.log(`[Admin Lock] Lock file kedaluwarsa (${Math.round(age / 1000)}s > 30s). Menghapus lock.`);
            try {
              fs.unlinkSync(ADMIN_LOCK_FILE);
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.error('[Admin Lock] Gagal membaca file lock:', err);
  }
  return null;
}

function writePersistedAdminLock(session: ActiveAdminSession | null): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!session) {
      if (fs.existsSync(ADMIN_LOCK_FILE)) {
        try {
          fs.unlinkSync(ADMIN_LOCK_FILE);
        } catch {}
      }
    } else {
      fs.writeFileSync(ADMIN_LOCK_FILE, JSON.stringify(session, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Admin Lock] Gagal menyimpan file lock:', err);
  }
}

function getValidActiveAdminSession(): ActiveAdminSession | null {
  const diskSession = readPersistedAdminLock();
  if (!diskSession) {
    if (activeAdminSession) {
      activeAdminSession = null;
      broadcastAdminSessionStatus();
    }
    return null;
  }
  activeAdminSession = diskSession;
  return diskSession;
}

function getPublicActiveAdminInfo() {
  const session = getValidActiveAdminSession();
  if (!session) {
    return {
      isLocked: false,
      activeAdmin: null,
    };
  }
  return {
    isLocked: true,
    activeAdmin: {
      userId: session.userId,
      username: session.username,
      fullName: session.fullName,
      role: session.role,
      roleLevel: session.roleLevel,
      loginAt: session.loginAt,
    },
  };
}

function broadcastAdminSessionStatus(): void {
  const info = getPublicActiveAdminInfo();
  const session = getValidActiveAdminSession();
  const payload = JSON.stringify({
    type: 'admin_session_changed',
    ...info,
    activeToken: session ? session.token : null,
  });
  const message = `event: admin_session\ndata: ${payload}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

function broadcastRealtimeDataUpdate(dbData: DatabaseSchema): void {
  const payload = JSON.stringify({
    type: 'data_updated',
    updatedAt: dbData.updatedAt || Date.now(),
    data: dbData,
  });
  const message = `event: data_update\ndata: ${payload}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

function saveDatabase(db: DatabaseSchema, customUpdatedAt?: number): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastModified = new Date().toISOString();
    db.updatedAt = typeof customUpdatedAt === 'number' ? customUpdatedAt : Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    broadcastRealtimeDataUpdate(db);
  } catch (err) {
    console.error('Failed to write DB file:', err);
  }
}

// Validation Helpers
function validateProfile(body: Partial<KelurahanProfile>): string[] {
  const errors: string[] = [];
  if (body.lurahName !== undefined && body.lurahName.trim().length > 0 && body.lurahName.trim().length < 2) {
    errors.push('Nama Lurah minimal 2 karakter.');
  }
  if (body.emailContact && body.emailContact.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailContact.trim())) {
    errors.push('Format alamat email resmi kelurahan tidak valid.');
  }
  return errors;
}

function validateReport(body: Partial<CitizenReport>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Judul laporan wajib diisi (minimal 5 karakter).');
  }
  if (!body.description || body.description.trim().length < 10) {
    errors.push('Deskripsi permasalahan wajib diisi (minimal 10 karakter).');
  }
  if (!body.reporterName || body.reporterName.trim().length < 2) {
    errors.push('Nama pelapor wajib diisi.');
  }
  if (!body.locationName || body.locationName.trim().length < 4) {
    errors.push('Lokasi atau patokan jalan wajib diisi.');
  }
  if (!body.rw || !body.rt) {
    errors.push('Wilayah RW dan RT wajib dipilih.');
  }
  return errors;
}

function validateWasteUnit(body: Partial<WasteBankUnit>): string[] {
  const errors: string[] = [];
  if (!body.rw || !body.rw.trim()) {
    errors.push('Wilayah RW wajib diisi.');
  }
  if (!body.unitName || body.unitName.trim().length < 3) {
    errors.push('Nama Bank Sampah Unit (BSU) wajib diisi.');
  }
  if (!body.coordinator || body.coordinator.trim().length < 3) {
    errors.push('Nama koordinator BSU wajib diisi.');
  }
  if (
    typeof body.organikKg !== 'number' ||
    body.organikKg < 0 ||
    typeof body.anorganikKg !== 'number' ||
    body.anorganikKg < 0 ||
    typeof body.residuKg !== 'number' ||
    body.residuKg < 0
  ) {
    errors.push('Volume sampah (Organik, Anorganik, Residu) harus berupa angka >= 0.');
  }
  return errors;
}

function validateTebaSpot(body: Partial<TebaSpot>): string[] {
  const errors: string[] = [];
  if (!body.name || body.name.trim().length < 3) {
    errors.push('Nama Titik Teba wajib diisi (minimal 3 karakter).');
  }
  if (!body.rw || !body.rw.trim()) {
    errors.push('Wilayah RW wajib dipilih.');
  }
  if (!body.address || body.address.trim().length < 5) {
    errors.push('Alamat lokasi titik Teba wajib diisi (minimal 5 karakter).');
  }
  if (!body.locationTag || !body.locationTag.trim()) {
    errors.push('Tag atau patokan lokasi wajib diisi.');
  }
  if (!body.imageUrl || !body.imageUrl.trim()) {
    errors.push('Foto lokasi titik Teba wajib diunggah.');
  }
  return errors;
}

function validateBioporiPoint(body: Partial<BioporiPoint>): string[] {
  const errors: string[] = [];
  if (!body.name || body.name.trim().length < 3) {
    errors.push('Nama zona / kluster Biopori wajib diisi (minimal 3 karakter).');
  }
  if (!body.rw || !body.rw.trim()) {
    errors.push('Wilayah RW wajib dipilih.');
  }
  if (!body.address || body.address.trim().length < 5) {
    errors.push('Alamat lokasi Biopori wajib diisi (minimal 5 karakter).');
  }
  if (!body.locationTag || !body.locationTag.trim()) {
    errors.push('Tag atau patokan lokasi wajib diisi.');
  }
  if (!body.imageUrl || !body.imageUrl.trim()) {
    errors.push('Foto lokasi Biopori wajib diunggah.');
  }
  return errors;
}

function validateCleanupEvent(body: Partial<CleanupEvent>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Nama kegiatan kerja bakti wajib diisi (minimal 5 karakter).');
  }
  if (!body.date || !body.date.trim()) {
    errors.push('Hari & tanggal pelaksanaan wajib diisi.');
  }
  if (!body.locationName || !body.locationName.trim().length || body.locationName.trim().length < 4) {
    errors.push('Lokasi titik kumpul kerja bakti wajib diisi.');
  }
  if (typeof body.targetParticipants === 'number' && body.targetParticipants < 1) {
    errors.push('Target peserta minimal 1 orang.');
  }
  return errors;
}

function validateKelurahanInfo(body: Partial<KelurahanInfoItem>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Judul informasi kelurahan wajib diisi (minimal 5 karakter).');
  }
  if (!body.content || body.content.trim().length < 15) {
    errors.push('Isi teks informasi kelurahan wajib diisi (minimal 15 karakter).');
  }
  if (!body.imageUrl || !body.imageUrl.trim()) {
    errors.push('Gambar informasi wajib dipilih atau diunggah.');
  }
  return errors;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  let db = loadDatabase();

  function recordServerDeletedId(id: string): void {
    if (!id) return;
    if (!Array.isArray(db.deletedItemIds)) db.deletedItemIds = [];
    if (!db.deletedItemIds.includes(id)) {
      db.deletedItemIds.push(id);
    }
  }

  // Keep in-memory db synchronized with disk before every API request
  app.use('/api', (_req, _res, next) => {
    db = loadDatabase();
    next();
  });

  // ================= API ROUTES =================

  // ================= REALTIME SSE & AUTHENTICATION ROUTES =================

  // 0A. Server-Sent Events (SSE) Stream: Live continuous synchronization for all clients
  app.get('/api/realtime/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initialPayload = JSON.stringify({
      type: 'init',
      updatedAt: db.updatedAt || Date.now(),
      data: db,
      ...getPublicActiveAdminInfo(),
    });
    res.write(`event: init\ndata: ${initialPayload}\n\n`);

    sseClients.add(res);

    // Keep-alive heartbeat every 20 seconds to prevent network proxy timeout
    const keepAliveTimer = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAliveTimer);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAliveTimer);
      sseClients.delete(res);
    });
  });

  // 0B. Query current Admin Session Lock status
  app.get('/api/auth/session-status', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const clientToken =
      (req.query.token as string | undefined) ||
      (req.headers['x-admin-token'] as string | undefined) ||
      '';
    const session = getValidActiveAdminSession();
    if (!session) {
      res.json({
        ok: true,
        isLocked: false,
        activeAdmin: null,
        isCurrentTokenValid: false,
      });
      return;
    }
    const isSameToken = Boolean(clientToken && session.token === clientToken);
    res.json({
      ok: true,
      isLocked: true,
      activeAdmin: {
        userId: session.userId,
        username: session.username,
        fullName: session.fullName,
        role: session.role,
        roleLevel: session.roleLevel,
        loginAt: session.loginAt,
      },
      isCurrentTokenValid: isSameToken,
    });
  });

  // 0C. Administrator Authentication with Strict Single-Live Admin Enforcement
  app.post('/api/auth/login', (req, res) => {
    const { username, password, clientToken, forceTakeover, masterPassphrase, clientLoginAt } = req.body as {
      username?: string;
      password?: string;
      clientToken?: string;
      forceTakeover?: boolean;
      masterPassphrase?: string;
      clientLoginAt?: string;
    };
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanNip = cleanUser.replace(/\s+/g, '');
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      res.status(400).json({
        ok: false,
        error: 'Username/NIP dan kata sandi wajib diisi.',
      });
      return;
    }

    const users =
      Array.isArray(db.adminUsers) && db.adminUsers.length > 0
        ? db.adminUsers
        : INITIAL_ADMIN_USERS;

    const matchedUser = users.find((u) => {
      const uName = (u.username || '').trim().toLowerCase();
      const uNip = (u.nip || '').replace(/\s+/g, '').toLowerCase();
      const uEmail = (u.googleEmail || '').trim().toLowerCase();
      const uEmailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      const uFullName = (u.fullName || '').trim().toLowerCase();
      const additionalEmails = Array.isArray(u.additionalGoogleEmails)
        ? u.additionalGoogleEmails.map((e: string) => (e || '').trim().toLowerCase())
        : [];
      const isMasterAlias =
        Boolean(u.isMasterLurah || u.roleLevel === 'master_admin') &&
        ['admin', 'lurah', 'lurah.panaikang'].includes(cleanUser);
      return (
        uName === cleanUser ||
        (uNip && uNip !== '-' && uNip === cleanNip) ||
        (uEmail && (uEmail === cleanUser || uEmailPrefix === cleanUser)) ||
        additionalEmails.some(
          (em: string) => em === cleanUser || (em.includes('@') && em.split('@')[0] === cleanUser)
        ) ||
        (uFullName && uFullName === cleanUser) ||
        isMasterAlias
      );
    });

    if (!matchedUser) {
      res.status(401).json({
        ok: false,
        error: 'Username/NIP/Email atau kata sandi yang dimasukkan tidak terdaftar. Silakan coba kembali.',
      });
      return;
    }

    const legacyFallbackPasswords = ['panaikang2026', 'panaikang2026!', 'admin123', 'makassar2026'];
    const isMaster = Boolean(matchedUser.isMasterLurah || matchedUser.roleLevel === 'master_admin');
    const storedPassLower = (matchedUser.password || '').trim().toLowerCase();
    const cleanPassLower = cleanPass.toLowerCase();
    const passwordMatches =
      matchedUser.password === cleanPass ||
      (storedPassLower === 'panaikang2026' && legacyFallbackPasswords.includes(cleanPassLower)) ||
      (storedPassLower === 'panaikang2026!' && legacyFallbackPasswords.includes(cleanPassLower)) ||
      (isMaster && legacyFallbackPasswords.includes(cleanPassLower));

    if (!passwordMatches) {
      res.status(401).json({
        ok: false,
        error: 'Kata sandi yang dimasukkan tidak sesuai untuk akun tersebut.',
      });
      return;
    }

    if (!matchedUser.isActive) {
      res.status(403).json({
        ok: false,
        error:
          'Akun user ini sedang dinonaktifkan oleh Master Admin (Lurah). Silakan hubungi Lurah Panaikang.',
      });
      return;
    }

    // STRICT SINGLE-ADMIN LIVE LOCK CHECK
    const currentSession = getValidActiveAdminSession();
    if (currentSession) {
      const headerToken = req.headers['x-admin-token'] as string | undefined;
      const isSameSession =
        (clientToken && clientToken === currentSession.token) ||
        (headerToken && headerToken === currentSession.token);

      if (!isSameSession) {
        const canForce =
          Boolean(forceTakeover) &&
          (isMaster ||
            cleanPass === 'panaikang2026' ||
            (masterPassphrase && ['panaikang2026', 'admin123'].includes(masterPassphrase.trim())));

        if (canForce) {
          console.log(
            `[Admin Lock] Otoritas Master (${cleanUser}) mengambil alih sesi tunggal dari ${currentSession.username}`
          );
          writePersistedAdminLock(null);
          activeAdminSession = null;
        } else {
          res.status(409).json({
            ok: false,
            isLocked: true,
            activeAdmin: {
              userId: currentSession.userId,
              username: currentSession.username,
              fullName: currentSession.fullName,
              role: currentSession.role,
              roleLevel: currentSession.roleLevel,
              loginAt: currentSession.loginAt,
            },
            error: `Saat ini akun Administrator "${currentSession.fullName}" (@${currentSession.username}) sedang aktif di perangkat lain sejak ${currentSession.loginAt}. Demi keamanan dan konsistensi data Satu Data Panaikang, hanya 1 admin yang dapat online dalam waktu bersamaan. Admin tersebut harus melakukan Logout terlebih dahulu sebelum admin lain dapat masuk.`,
          });
          return;
        }
      }
    }

    const loginTimeStr =
      typeof clientLoginAt === 'string' && clientLoginAt.trim().length > 0
        ? clientLoginAt.trim()
        : getRealtimeDateTimeString(new Date());

    matchedUser.lastLoginAt = loginTimeStr;

    const sessionToken = `pnk-adm-${matchedUser.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    activeAdminSession = {
      token: sessionToken,
      userId: matchedUser.id,
      username: matchedUser.username,
      fullName: matchedUser.fullName,
      nip: matchedUser.nip,
      role: `${matchedUser.jabatan} · ${matchedUser.unitBidang}`,
      roleLevel: matchedUser.roleLevel,
      loginAt: loginTimeStr,
      lastHeartbeat: Date.now(),
    };

    writePersistedAdminLock(activeAdminSession);
    saveDatabase(db);
    broadcastAdminSessionStatus();

    res.json({
      ok: true,
      session: {
        token: sessionToken,
        userId: matchedUser.id,
        username: matchedUser.username,
        fullName: matchedUser.fullName,
        nip: matchedUser.nip,
        role: `${matchedUser.jabatan} · ${matchedUser.unitBidang}`,
        roleLevel: matchedUser.roleLevel,
        isMasterLurah: Boolean(
          matchedUser.isMasterLurah || matchedUser.roleLevel === 'master_admin'
        ),
        allowedAdminTabs: matchedUser.allowedAdminTabs,
        allowedServiceCategories: matchedUser.allowedServiceCategories,
        actionPermissions: matchedUser.actionPermissions,
        loginAt: loginTimeStr,
      },
    });
  });

  // 0D. Admin Heartbeat (renews single-admin occupancy lock)
  app.post('/api/auth/heartbeat', (req, res) => {
    const { token, loginAt } = req.body as { token?: string; loginAt?: string };
    const headerToken = req.headers['x-admin-token'] as string | undefined;
    const reqToken = token || headerToken;
    const current = getValidActiveAdminSession();
    if (current && reqToken && current.token === reqToken) {
      current.lastHeartbeat = Date.now();
      if (typeof loginAt === 'string' && loginAt.trim().length > 0) {
        current.loginAt = loginAt.trim();
      }
      writePersistedAdminLock(current);
      activeAdminSession = current;
      res.json({ ok: true, active: true });
      return;
    }
    res.json({ ok: true, active: true });
  });

  // 0E. Explicit Admin Logout (Immediately releases lock so another admin can login)
  app.post('/api/auth/logout', (req, res) => {
    const { token } = req.body as { token?: string };
    const headerToken = req.headers['x-admin-token'] as string | undefined;
    const reqToken = token || headerToken;
    const current = getValidActiveAdminSession();
    if (current && (!reqToken || current.token === reqToken)) {
      console.log(`[Admin Lock] Admin ${current.username} telah logout. Kunci admin dilepaskan.`);
      writePersistedAdminLock(null);
      activeAdminSession = null;
      broadcastAdminSessionStatus();
    }
    res.json({ ok: true });
  });

  // 0F. Beacon Logout on window/tab close (Immediately releases lock)
  app.post('/api/auth/beacon-logout', express.text({ type: '*/*' }), (req, res) => {
    let bodyToken = '';
    try {
      if (typeof req.body === 'string') {
        const parsed = JSON.parse(req.body);
        bodyToken = parsed.token || '';
      } else if (req.body?.token) {
        bodyToken = req.body.token;
      }
    } catch {}

    const current = getValidActiveAdminSession();
    if (current && (!bodyToken || current.token === bodyToken)) {
      console.log(`[Admin Lock] Admin ${current.username} beacon logout. Kunci admin dilepaskan.`);
      writePersistedAdminLock(null);
      activeAdminSession = null;
      broadcastAdminSessionStatus();
    }
    res.status(204).end();
  });

  // 0G. Force Logout / Break Stale Session (For Master Lurah)
  app.post('/api/auth/force-logout', (req, res) => {
    const { masterPassword } = req.body as { masterPassword?: string };
    const cleanPass = (masterPassword || '').trim();
    if (cleanPass !== 'panaikang2026' && cleanPass !== 'admin123' && cleanPass !== 'makassar2026') {
      res.status(403).json({ ok: false, error: 'Kata sandi otoritas Master Lurah tidak sesuai.' });
      return;
    }
    const prev = getValidActiveAdminSession();
    writePersistedAdminLock(null);
    activeAdminSession = null;
    broadcastAdminSessionStatus();
    console.log(`[Admin Lock] Sesi admin sebelumnya (${prev?.username || 'unknown'}) diputus paksa.`);
    res.json({ ok: true, message: 'Sesi admin sebelumnya telah diputus paksa. Slot login sekarang terbuka.' });
  });

  app.post('/api/lurah-photo', (req, res) => {
    try {
      const { imageDataUrl } = req.body as { imageDataUrl?: string };
      if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        res.status(400).json({ ok: false, error: 'Format gambar tidak valid.' });
        return;
      }
      const base64Match = imageDataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
      if (!base64Match || !base64Match[1]) {
        res.status(400).json({ ok: false, error: 'Data base64 gambar tidak ditemukan.' });
        return;
      }
      const buffer = Buffer.from(base64Match[1], 'base64');
      const publicImgPath = path.join(__dirname, 'public', 'images', 'lurah_muthmainnah_cutout.png');
      fs.mkdirSync(path.dirname(publicImgPath), { recursive: true });
      fs.writeFileSync(publicImgPath, buffer);

      const versionedUrl = `/images/lurah_muthmainnah_cutout.png?v=${Date.now()}`;
      db.profile.lurahPhotoUrl = versionedUrl;
      saveDatabase(db);
      res.json({ ok: true, photoUrl: versionedUrl });
    } catch (err) {
      console.error('Failed to save Lurah photo:', err);
      res.status(500).json({ ok: false, error: 'Gagal menyimpan foto Lurah.' });
    }
  });

  // 0b. Instagram Media Proxy for @kelurahan.panaikang (Local & Vercel parity)
  const LOCAL_IG_FILE_MAP: Record<string, string> = {
    profile: 'ig_profile_panaikang.jpg',
    Dfiuay9j8M0: 'ig_post_latest_0_Dfiuay9j8M0.jpg',
    DfgPz35v2Ed: 'ig_post_latest_0b_DfgPz35v2Ed.jpg',
    DfZsJAUvDQG: 'ig_post_kerjabakti_0_DfZsJAUvDQG.jpg',
    DfYirNrJjaT: 'ig_post_kerjabakti_1_DfYirNrJjaT.jpg',
    DfHDLK2vqk0: 'ig_post_kerjabakti_2_DfHDLK2vqk0.jpg',
    DfT7acUJdwh: 'ig_post_latest_1_DfT7acUJdwh.jpg',
    DfM0_MZvZON: 'ig_post_latest_2_DfM0_MZvZON.jpg',
    DfM0LNqPFR5: 'ig_post_latest_3_DfM0LNqPFR5.jpg',
    DdrMaapvrr4: 'ig_post_1_DdrMaapvrr4.jpg',
    DbnJW3OvANh: 'ig_post_2_DbnJW3OvANh.jpg',
    DcN5ah3vZdT: 'ig_post_3_DcN5ah3vZdT.jpg',
    DeJpFcVJ6jq: 'ig_post_4_DeJpFcVJ6jq.jpg',
    DeGDDkFPvJs: 'ig_post_5_DeGDDkFPvJs.jpg',
    'Dd-xlSLvXKn': 'ig_post_6_Dd-xlSLvXKn.jpg',
    Dd33fJSy13M: 'ig_post_7_Dd33fJSy13M.jpg',
    Ddtg69NPsBB: 'ig_post_8_Ddtg69NPsBB.jpg',
    Ddn9BnBvEId: 'ig_post_9_Ddn9BnBvEId.jpg',
    DdfhgGQPaJX: 'ig_post_10_DdfhgGQPaJX.jpg',
    'DdfU_r-PUM3': 'ig_post_11_DdfU_r-PUM3.jpg',
    Dda51qXP4nb: 'ig_post_12_Dda51qXP4nb.jpg',
  };

  app.get('/api/ig-media', async (req, res) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const rawCode = String(req.query.code || 'DdrMaapvrr4').trim();
      const localFilename = LOCAL_IG_FILE_MAP[rawCode] || `ig_auto_${rawCode.replace(/[^A-Za-z0-9_-]/g, '')}.jpg`;
      if (localFilename) {
        const localFilePath = path.join(__dirname, 'public', 'images', localFilename);
        if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1500) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.sendFile(localFilePath);
          return;
        }
      }

      const isProfile = rawCode === 'profile' || rawCode.includes('ig_profile');
      const shortcode = isProfile
        ? 'DdrMaapvrr4'
        : rawCode.replace(/[^A-Za-z0-9_-]/g, '') || 'DdrMaapvrr4';
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
      const embedResponse = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'curl/8.5.0',
        },
      });
      if (!embedResponse.ok) {
        res.status(502).json({ ok: false, error: 'Gagal memuat embed Instagram.' });
        return;
      }
      const html = await embedResponse.text();
      let targetImageUrl: string | null = null;
      if (isProfile) {
        const avatarMatch =
          html.match(/class="EmbedFrame[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
          html.match(
            /<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com[^"]+)"[^>]+alt="kelurahan\.panaikang"/i
          );
        if (avatarMatch && avatarMatch[1]) {
          targetImageUrl = avatarMatch[1].replace(/&amp;/g, '&');
        }
      }
      if (!targetImageUrl) {
        const mediaMatch =
          html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ||
          html.match(/src="([^"]+)"[^>]*class="EmbeddedMediaImage"/i) ||
          html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com\/v\/t51\.82787-15\/[^"]+)"/i);
        if (mediaMatch && mediaMatch[1]) {
          targetImageUrl = mediaMatch[1].replace(/&amp;/g, '&');
        }
      }
      if (!targetImageUrl) {
        res.redirect(302, embedUrl);
        return;
      }
      const imageResponse = await fetch(targetImageUrl, {
        headers: { 'User-Agent': 'curl/8.5.0' },
      });
      if (!imageResponse.ok) {
        res.redirect(302, embedUrl);
        return;
      }
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      if (buf.length > 1500 && !isProfile) {
        try {
          const autoCachePath = path.join(__dirname, 'public', 'images', `ig_auto_${shortcode}.jpg`);
          fs.writeFileSync(autoCachePath, buf);
        } catch {}
      }
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(buf);
    } catch {
      res.status(500).json({ ok: false, error: 'Gagal memproses media Instagram.' });
    }
  });

  // 1. Get & Sync Full Application Data
  app.get('/api/data', (req, res) => {
    res.setHeader('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    const etag = `W/"pnk-db-${db.updatedAt || db.lastModified || 0}"`;
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.json({
      ok: true,
      data: db,
    });
  });

  app.put('/api/data', (req, res) => {
    const incoming = req.body as Partial<DatabaseSchema>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ ok: false, errors: ['Data sinkronisasi tidak valid.'] });
      return;
    }

    // Merge deletedItemIds tombstones
    const deletedSet = new Set<string>([
      ...(Array.isArray(db.deletedItemIds) ? db.deletedItemIds : []),
      ...(Array.isArray(incoming.deletedItemIds) ? incoming.deletedItemIds : []),
    ]);
    db.deletedItemIds = Array.from(deletedSet);

    if (incoming.profile) {
      const prevPhoto = db.profile?.lurahPhotoUrl || '';
      db.profile = {
        ...incoming.profile,
        lurahPhotoUrl:
          incoming.profile.lurahPhotoUrl && incoming.profile.lurahPhotoUrl.trim()
            ? incoming.profile.lurahPhotoUrl.trim()
            : incoming.profile.lurahName
            ? prevPhoto
            : '',
      };
      if (Array.isArray(incoming.profile.officials)) {
        db.profile.officials = incoming.profile.officials.filter(
          (o) => o && o.id && !deletedSet.has(o.id)
        );
      }
    }
    if (Array.isArray(incoming.rwGroups) && incoming.rwGroups.length > 0) {
      db.rwGroups = incoming.rwGroups;
      db.profile.totalRw = incoming.rwGroups.length;
      db.profile.totalRt = incoming.rwGroups.reduce(
        (acc, rw) => acc + (rw.rtList?.length || 0),
        0
      );
    } else if (!Array.isArray(db.rwGroups) || db.rwGroups.length === 0) {
      db.rwGroups = INITIAL_RW_GROUPS;
      db.profile.totalRw = INITIAL_RW_GROUPS.length;
      db.profile.totalRt = INITIAL_RW_GROUPS.reduce(
        (acc, rw) => acc + (rw.rtList?.length || 0),
        0
      );
    }
    if (Array.isArray(incoming.reports)) db.reports = incoming.reports;
    if (Array.isArray(incoming.wasteUnits)) db.wasteUnits = incoming.wasteUnits;
    if (Array.isArray(incoming.wasteLogs)) db.wasteLogs = incoming.wasteLogs;
    if (Array.isArray(incoming.tebaSpots)) db.tebaSpots = incoming.tebaSpots;
    if (Array.isArray(incoming.bioporiPoints)) db.bioporiPoints = incoming.bioporiPoints;
    if (Array.isArray(incoming.cleanupEvents)) db.cleanupEvents = incoming.cleanupEvents;
    if (Array.isArray(incoming.kelurahanInfos)) db.kelurahanInfos = incoming.kelurahanInfos;
    if (Array.isArray(incoming.whatsappRecipients))
      db.whatsappRecipients = incoming.whatsappRecipients;
    if (Array.isArray(incoming.serviceCatalog))
      db.serviceCatalog = incoming.serviceCatalog;
    if (Array.isArray(incoming.adminUsers)) {
      const userMap = new Map<string, AdminUserAccount>();
      for (const existingUser of db.adminUsers || []) {
        if (existingUser && existingUser.id && !deletedSet.has(existingUser.id)) {
          userMap.set(existingUser.id, existingUser);
        }
      }
      for (const incUser of incoming.adminUsers) {
        if (!incUser || !incUser.id || deletedSet.has(incUser.id)) continue;
        const prev = userMap.get(incUser.id);
        if (!prev) {
          userMap.set(incUser.id, incUser);
        } else {
          const incMs = typeof incUser.updatedAtMs === 'number' ? incUser.updatedAtMs : 0;
          const prevMs = typeof prev.updatedAtMs === 'number' ? prev.updatedAtMs : 0;
          const incNewer = incMs >= prevMs;
          const primary = incNewer ? incUser : prev;
          const secondary = incNewer ? prev : incUser;
          const explicitlyRevoked =
            primary.isGoogleVerified === false &&
            typeof primary.updatedAt === 'string' &&
            primary.updatedAt.toLowerCase().includes('dicabut');
          const resolvedEmail =
            primary.googleEmail && primary.googleEmail.trim()
              ? primary.googleEmail.trim().toLowerCase()
              : !explicitlyRevoked && secondary.googleEmail && secondary.googleEmail.trim()
              ? secondary.googleEmail.trim().toLowerCase()
              : undefined;
          userMap.set(incUser.id, {
            ...secondary,
            ...primary,
            googleEmail: resolvedEmail,
            isGoogleVerified: explicitlyRevoked
              ? false
              : Boolean(primary.isGoogleVerified || (!explicitlyRevoked && secondary.isGoogleVerified && resolvedEmail)),
            googleVerifiedAt:
              primary.googleVerifiedAt || (!explicitlyRevoked ? secondary.googleVerifiedAt : undefined),
            googleVerifiedBy:
              primary.googleVerifiedBy || (!explicitlyRevoked ? secondary.googleVerifiedBy : undefined),
            updatedAtMs: Math.max(incMs, prevMs),
          });
        }
      }
      db.adminUsers = Array.from(userMap.values());
    }
    if (Array.isArray(incoming.googleAdminVerificationRequests)) {
      const reqMap = new Map<string, GoogleAdminVerificationRequest>();
      for (const r of [...(db.googleAdminVerificationRequests || []), ...incoming.googleAdminVerificationRequests]) {
        if (!r || !r.email || (r.id && deletedSet.has(r.id))) continue;
        const cleanEmail = r.email.trim().toLowerCase();
        const prev = reqMap.get(cleanEmail);
        const rTs = r.updatedAtMs || r.requestedAtMs || 0;
        const prevTs = prev ? (prev.updatedAtMs || prev.requestedAtMs || 0) : -1;
        if (!prev || rTs >= prevTs) {
          reqMap.set(cleanEmail, { ...prev, ...r, email: cleanEmail, updatedAtMs: Math.max(rTs, prevTs, 1) });
        }
      }
      db.googleAdminVerificationRequests = Array.from(reqMap.values()).sort(
        (a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0)
      );
    }
    if (Array.isArray(incoming.activityLogs))
      db.activityLogs = incoming.activityLogs;
    if (Array.isArray(incoming.urbanFarmingSpots))
      db.urbanFarmingSpots = incoming.urbanFarmingSpots;
    if (Array.isArray(incoming.seedRequests))
      db.seedRequests = incoming.seedRequests;
    if (Array.isArray(incoming.urbanFarmingLocations))
      db.urbanFarmingLocations = incoming.urbanFarmingLocations;
    if (Array.isArray(incoming.farmerGroups))
      db.farmerGroups = incoming.farmerGroups;
    if (Array.isArray(incoming.crops))
      db.crops = incoming.crops;
    if (Array.isArray(incoming.plantCareLogs))
      db.plantCareLogs = incoming.plantCareLogs;
    if (Array.isArray(incoming.harvestRecords))
      db.harvestRecords = incoming.harvestRecords;
    if (Array.isArray(incoming.farmingInventories))
      db.farmingInventories = incoming.farmingInventories;
    if (Array.isArray(incoming.supplyRequests))
      db.supplyRequests = incoming.supplyRequests;
    if (Array.isArray(incoming.siskamlingSchedules))
      db.siskamlingSchedules = incoming.siskamlingSchedules;
    if (Array.isArray(incoming.waDispatchLogs) && incoming.waDispatchLogs.length > 0) {
      const existingLogs = Array.isArray(db.waDispatchLogs) ? db.waDispatchLogs : [];
      const logMap = new Map<string, any>();
      for (const l of [...incoming.waDispatchLogs, ...existingLogs]) {
        if (l && l.id && !logMap.has(l.id)) logMap.set(l.id, l);
      }
      db.waDispatchLogs = Array.from(logMap.values()).slice(0, 120);
    }
    if (Array.isArray(incoming.citizenUsers))
      db.citizenUsers = incoming.citizenUsers;
    if (incoming.citizenMenuConfig && typeof incoming.citizenMenuConfig === 'object') {
      const incMs = incoming.citizenMenuConfig.updatedAtMs || 0;
      const curMs = db.citizenMenuConfig?.updatedAtMs || 0;
      if (!db.citizenMenuConfig || incMs >= curMs) {
        db.citizenMenuConfig = incoming.citizenMenuConfig;
      }
    }

    // Prune any items that were permanently deleted
    if (deletedSet.size > 0) {
      if (db.profile && Array.isArray(db.profile.officials)) {
        db.profile.officials = db.profile.officials.filter((o) => o && o.id && !deletedSet.has(o.id));
      }
      db.reports = db.reports.filter((r) => r && r.id && !deletedSet.has(r.id));
      db.wasteUnits = db.wasteUnits.filter((u) => u && u.id && !deletedSet.has(u.id));
      db.wasteLogs = db.wasteLogs.filter((l) => l && l.id && !deletedSet.has(l.id));
      db.tebaSpots = db.tebaSpots.filter((s) => s && s.id && !deletedSet.has(s.id));
      db.bioporiPoints = db.bioporiPoints.filter((b) => b && b.id && !deletedSet.has(b.id));
      db.cleanupEvents = db.cleanupEvents.filter((e) => e && e.id && !deletedSet.has(e.id));
      db.kelurahanInfos = db.kelurahanInfos.filter((i) => i && i.id && !deletedSet.has(i.id));
      db.whatsappRecipients = db.whatsappRecipients.filter((w) => w && w.id && !deletedSet.has(w.id));
      db.adminUsers = db.adminUsers.filter((u) => u && u.id && !deletedSet.has(u.id));
      db.activityLogs = db.activityLogs.filter((a) => a && a.id && !deletedSet.has(a.id));
      db.urbanFarmingSpots = db.urbanFarmingSpots.filter((s) => s && s.id && !deletedSet.has(s.id));
      db.seedRequests = db.seedRequests.filter((s) => s && s.id && !deletedSet.has(s.id));
      db.crops = db.crops.filter((c) => c && c.id && !deletedSet.has(c.id));
      db.farmerGroups = db.farmerGroups.filter((f) => f && f.id && !deletedSet.has(f.id));
      if (Array.isArray(db.citizenUsers)) {
        db.citizenUsers = db.citizenUsers.filter((c) => c && c.uid && !deletedSet.has(c.uid));
      }
    }

    saveDatabase(db, incoming.updatedAt);
    res.json({ ok: true, updatedAt: db.updatedAt, lastModified: db.lastModified });
  });

  // 1AC. Parameter Batasan Akses Menu Warga (CitizenMenuAccessConfig) CRUD
  app.get('/api/citizen-menu-config', (_req, res) => {
    res.json({
      ok: true,
      data: db.citizenMenuConfig || null,
    });
  });

  app.put('/api/citizen-menu-config', (req, res) => {
    const incoming = (req.body?.citizenMenuConfig || req.body) as CitizenMenuAccessConfig | null;
    if (
      !incoming ||
      !Array.isArray(incoming.guestAllowedMenus) ||
      !Array.isArray(incoming.registeredAllowedMenus)
    ) {
      res.status(400).json({
        ok: false,
        errors: ['Format konfigurasi parameter batasan akses warga tidak valid.'],
      });
      return;
    }
    db.citizenMenuConfig = {
      ...incoming,
      updatedAt: incoming.updatedAt || getRealtimeDateTimeString(new Date()),
      updatedAtMs: incoming.updatedAtMs || Date.now(),
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.citizenMenuConfig });
  });

  // 1AB. Log Aktivitas / Audit Trail Admin Endpoints
  app.get('/api/activity-logs', (_req, res) => {
    res.json({
      ok: true,
      data: db.activityLogs || INITIAL_ACTIVITY_LOGS,
    });
  });

  app.post('/api/activity-logs', (req, res) => {
    const incoming = req.body as Partial<AdminActivityLog>;
    if (!incoming.summary || !incoming.targetLabel) {
      res.status(400).json({ ok: false, errors: ['Ringkasan dan target log wajib diisi.'] });
      return;
    }
    const created: AdminActivityLog = {
      id: incoming.id || `LOG-2026-${String(Date.now()).slice(-6)}`,
      timestamp: incoming.timestamp || getRealtimeDateTimeString(new Date()),
      createdAtMs: incoming.createdAtMs || Date.now(),
      actorUsername: incoming.actorUsername || 'lurah',
      actorName: incoming.actorName || 'Muthmainnah, SE, MM',
      actorJabatan: incoming.actorJabatan || 'Lurah Panaikang',
      actorNip: incoming.actorNip || '-',
      actorRoleLevel: incoming.actorRoleLevel || 'master_admin',
      actionType: incoming.actionType || 'UPDATE',
      module: incoming.module || 'PENGURUSAN_WARGA',
      targetId: incoming.targetId,
      targetLabel: incoming.targetLabel,
      summary: incoming.summary,
      details: incoming.details,
      beforeValue: incoming.beforeValue,
      afterValue: incoming.afterValue,
      severity: incoming.severity || 'info',
    };
    db.activityLogs = [created, ...(db.activityLogs || [])].slice(0, 500);
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created, allLogs: db.activityLogs });
  });

  app.put('/api/activity-logs', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as AdminActivityLog[])
      : Array.isArray(req.body?.activityLogs)
      ? (req.body.activityLogs as AdminActivityLog[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar log aktivitas tidak valid.'] });
      return;
    }
    db.activityLogs = incoming.slice(0, 500);
    saveDatabase(db);
    res.json({ ok: true, data: db.activityLogs });
  });

  app.post('/api/activity-logs/reset', (_req, res) => {
    db.activityLogs = [];
    saveDatabase(db);
    res.json({ ok: true, data: db.activityLogs });
  });

  app.delete('/api/activity-logs/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.activityLogs = (db.activityLogs || []).filter((l) => l.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id, data: db.activityLogs });
  });

  // 1AA. Parameter User & Batasan Akses Admin CRUD (Managed by Master Admin / Lurah)
  app.get('/api/admin-users', (_req, res) => {
    res.json({
      ok: true,
      data: db.adminUsers || INITIAL_ADMIN_USERS,
    });
  });

  app.put('/api/admin-users', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as AdminUserAccount[])
      : Array.isArray(req.body?.adminUsers)
      ? (req.body.adminUsers as AdminUserAccount[])
      : null;
    if (!incoming || incoming.length === 0) {
      res.status(400).json({ ok: false, errors: ['Format daftar akun user admin tidak valid.'] });
      return;
    }
    const nowMs = Date.now();
    db.adminUsers = incoming.map((u) => ({
      ...u,
      updatedAtMs: u.updatedAtMs || nowMs,
    }));
    saveDatabase(db);
    res.json({ ok: true, data: db.adminUsers });
  });

  // 1AA-2. Google Admin Verification Requests CRUD (Synced across devices & Master Admin panel)
  app.get('/api/google-admin-requests', (_req, res) => {
    res.json({
      ok: true,
      data: db.googleAdminVerificationRequests || [],
    });
  });

  app.post('/api/google-admin-requests', (req, res) => {
    const body = req.body as Partial<GoogleAdminVerificationRequest>;
    const cleanEmail = (body?.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ ok: false, errors: ['Alamat email Google tidak valid.'] });
      return;
    }
    const nowMs = Date.now();
    const nowDisplay = body.requestedAt || getRealtimeDateTimeString(new Date());
    const currentList = Array.isArray(db.googleAdminVerificationRequests)
      ? [...db.googleAdminVerificationRequests]
      : [];
    const existingIdx = currentList.findIndex(
      (r) => (r.email || '').trim().toLowerCase() === cleanEmail
    );
    if (existingIdx >= 0) {
      currentList[existingIdx] = {
        ...currentList[existingIdx],
        ...body,
        email: cleanEmail,
        displayName:
          body.displayName ||
          currentList[existingIdx].displayName ||
          cleanEmail.split('@')[0],
        status: body.status || 'Menunggu Persetujuan',
        requestedAt: nowDisplay,
        requestedAtMs: body.requestedAtMs || nowMs,
        updatedAtMs: nowMs,
      };
    } else {
      currentList.unshift({
        id: body.id || `req-admin-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
        email: cleanEmail,
        displayName: body.displayName || cleanEmail.split('@')[0],
        photoUrl: body.photoUrl,
        requestedAt: nowDisplay,
        requestedAtMs: body.requestedAtMs || nowMs,
        updatedAtMs: nowMs,
        status: body.status || 'Menunggu Persetujuan',
        notes: body.notes,
      });
    }
    db.googleAdminVerificationRequests = currentList;
    saveDatabase(db);
    res.status(201).json({ ok: true, data: db.googleAdminVerificationRequests });
  });

  app.put('/api/google-admin-requests', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as GoogleAdminVerificationRequest[])
      : Array.isArray(req.body?.requests)
      ? (req.body.requests as GoogleAdminVerificationRequest[])
      : Array.isArray(req.body?.googleAdminVerificationRequests)
      ? (req.body.googleAdminVerificationRequests as GoogleAdminVerificationRequest[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar permohonan verifikasi tidak valid.'] });
      return;
    }
    const nowMs = Date.now();
    const existingList = Array.isArray(db.googleAdminVerificationRequests)
      ? db.googleAdminVerificationRequests
      : [];
    const reqMap = new Map<string, GoogleAdminVerificationRequest>();
    for (const item of existingList) {
      if (!item || !item.email) continue;
      const key = item.email.trim().toLowerCase();
      if (key) reqMap.set(key, { ...item, email: key });
    }
    for (const item of incoming) {
      if (!item || !item.email) continue;
      const key = item.email.trim().toLowerCase();
      if (!key) continue;
      const prev = reqMap.get(key);
      const itemTs = item.updatedAtMs || item.requestedAtMs || 0;
      const prevTs = prev ? (prev.updatedAtMs || prev.requestedAtMs || 0) : -1;
      if (!prev || itemTs >= prevTs) {
        reqMap.set(key, {
          ...prev,
          ...item,
          email: key,
          updatedAtMs: item.updatedAtMs || nowMs,
        });
      }
    }
    db.googleAdminVerificationRequests = Array.from(reqMap.values()).sort(
      (a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0)
    );
    saveDatabase(db);
    res.json({ ok: true, data: db.googleAdminVerificationRequests });
  });

  app.post('/api/admin-users', (req, res) => {
    const incoming = req.body as Partial<AdminUserAccount>;
    if (!incoming.username || !incoming.fullName || !incoming.password) {
      res.status(400).json({
        ok: false,
        errors: ['Username, Nama Lengkap, dan Kata Sandi wajib diisi.'],
      });
      return;
    }
    const cleanUsername = incoming.username.trim().toLowerCase();
    if (db.adminUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      res.status(400).json({
        ok: false,
        errors: [`Username "${cleanUsername}" sudah digunakan oleh akun lain.`],
      });
      return;
    }
    const created: AdminUserAccount = {
      id: incoming.id || `usr-${Date.now()}`,
      username: cleanUsername,
      password: incoming.password.trim(),
      fullName: incoming.fullName.trim(),
      nip: incoming.nip?.trim() || '-',
      jabatan: incoming.jabatan?.trim() || 'Staf / Operator Kelurahan',
      unitBidang: incoming.unitBidang?.trim() || 'Pelayanan Terpadu Kelurahan Panaikang',
      phone: incoming.phone?.trim() || '',
      roleLevel: incoming.roleLevel || 'operator',
      isMasterLurah: Boolean(incoming.isMasterLurah || incoming.roleLevel === 'master_admin'),
      isActive: incoming.isActive ?? true,
      allowedAdminTabs: Array.isArray(incoming.allowedAdminTabs)
        ? incoming.allowedAdminTabs
        : ['pengurusan_warga', 'laporan'],
      allowedServiceCategories: Array.isArray(incoming.allowedServiceCategories)
        ? incoming.allowedServiceCategories
        : ['administrasi_kependudukan', 'surat_keterangan'],
      actionPermissions: incoming.actionPermissions || {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: false,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
      createdAt: incoming.createdAt || getRealtimeDateString(new Date()),
      updatedAt: getRealtimeDateString(new Date()),
      notes: incoming.notes?.trim() || '',
    };
    db.adminUsers = [...db.adminUsers, created];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/admin-users/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Akun user admin tidak ditemukan.'] });
      return;
    }
    const existing = db.adminUsers[idx];
    const incoming = req.body as Partial<AdminUserAccount>;
    const nextUsername = incoming.username
      ? incoming.username.trim().toLowerCase()
      : existing.username;
    if (
      db.adminUsers.some(
        (u) => u.id !== id && u.username.toLowerCase() === nextUsername
      )
    ) {
      res.status(400).json({
        ok: false,
        errors: [`Username "${nextUsername}" sudah digunakan oleh akun lain.`],
      });
      return;
    }
    const merged: AdminUserAccount = {
      ...existing,
      ...incoming,
      id: existing.id,
      username: nextUsername,
      password:
        incoming.password && incoming.password.trim().length > 0
          ? incoming.password.trim()
          : existing.password,
      updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui`,
    };
    db.adminUsers[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: merged });
  });

  app.delete('/api/admin-users/:id', (req, res) => {
    const { id } = req.params;
    const target = db.adminUsers.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ ok: false, errors: ['Akun user admin tidak ditemukan.'] });
      return;
    }
    if (target.isMasterLurah && db.adminUsers.filter((u) => u.isMasterLurah).length <= 1) {
      res.status(400).json({
        ok: false,
        errors: ['Akun Master Admin (Lurah) utama tidak dapat dihapus.'],
      });
      return;
    }
    db.adminUsers = db.adminUsers.filter((u) => u.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 1A. Back-End Katalog & Pengurusan Layanan Warga (7 Kategori & 44 Sub-Menu)
  app.get('/api/warga-services/catalog', (_req, res) => {
    res.json({
      ok: true,
      data: db.serviceCatalog || SERVICE_CATEGORY_GROUPS,
    });
  });

  app.put('/api/warga-services/catalog', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as ServiceCategoryGroup[])
      : Array.isArray(req.body?.serviceCatalog)
      ? (req.body.serviceCatalog as ServiceCategoryGroup[])
      : null;
    if (!incoming || incoming.length === 0) {
      res.status(400).json({ ok: false, errors: ['Format katalog layanan warga tidak valid.'] });
      return;
    }
    db.serviceCatalog = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.serviceCatalog });
  });

  app.get('/api/warga-services/submissions', (_req, res) => {
    res.json({
      ok: true,
      data: db.reports,
    });
  });

  // 1B. WhatsApp Recipients CRUD (Managed by Lurah / Administrator)
  app.get('/api/whatsapp-recipients', (_req, res) => {
    res.json({ ok: true, data: db.whatsappRecipients });
  });

  app.put('/api/whatsapp-recipients', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as WhatsAppRecipient[])
      : Array.isArray(req.body?.whatsappRecipients)
      ? (req.body.whatsappRecipients as WhatsAppRecipient[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar nomor WhatsApp tidak valid.'] });
      return;
    }
    db.whatsappRecipients = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.whatsappRecipients });
  });

  // WhatsApp Dispatch Logs Persistence
  app.options('/api/whatsapp-dispatch-logs', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
  });

  app.get('/api/whatsapp-dispatch-logs', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ ok: true, data: db.waDispatchLogs || [] });
  });

  app.put('/api/whatsapp-dispatch-logs', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const incoming = Array.isArray(req.body?.waDispatchLogs)
      ? req.body.waDispatchLogs
      : Array.isArray(req.body)
      ? req.body
      : [];
    const existing = Array.isArray(db.waDispatchLogs) ? db.waDispatchLogs : [];
    const map = new Map<string, any>();
    for (const item of [...incoming, ...existing]) {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    db.waDispatchLogs = Array.from(map.values()).slice(0, 120);
    saveDatabase(db);
    res.json({ ok: true, data: db.waDispatchLogs });
  });

  // 2. Kelurahan Profile Endpoints (GET & PUT)
  app.get('/api/profile', (_req, res) => {
    res.json({ ok: true, data: db.profile });
  });

  app.put('/api/profile', (req, res) => {
    const incoming = req.body as KelurahanProfile;
    const errors = validateProfile(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const prevPhoto = db.profile?.lurahPhotoUrl || '';
    db.profile = {
      ...db.profile,
      ...incoming,
      lurahPhotoUrl:
        incoming.lurahPhotoUrl && incoming.lurahPhotoUrl.trim()
          ? incoming.lurahPhotoUrl.trim()
          : incoming.lurahName
          ? prevPhoto
          : '',
      misi: Array.isArray(incoming.misi)
        ? incoming.misi.map((m) => (typeof m === 'string' ? m.trim() : '')).filter(Boolean)
        : (db.profile.misi || []),
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.profile });
  });

  // 2A. Siskamling Schedules & Posko CRUD
  app.get('/api/siskamling', (_req, res) => {
    res.json({ ok: true, data: db.siskamlingSchedules || INITIAL_SISKAMLING_SCHEDULES });
  });

  app.put('/api/siskamling', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as SiskamlingRwSchedule[])
      : Array.isArray(req.body?.siskamlingSchedules)
      ? (req.body.siskamlingSchedules as SiskamlingRwSchedule[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format data jadwal & posko siskamling tidak valid.'] });
      return;
    }
    db.siskamlingSchedules = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.siskamlingSchedules });
  });

  // 2B. Data RT & RW CRUD
  app.put('/api/rw-groups', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as RwGroup[])
      : Array.isArray(req.body?.rwGroups)
      ? (req.body.rwGroups as RwGroup[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format data RW/RT tidak valid.'] });
      return;
    }
    db.rwGroups = incoming;
    db.profile.totalRw = incoming.length;
    db.profile.totalRt = incoming.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, data: db.rwGroups, profile: db.profile });
  });

  app.post('/api/rw-groups', (req, res) => {
    const incoming = req.body as Partial<RwGroup>;
    if (!incoming.rwCode || !incoming.rwName || !incoming.ketuaRwName) {
      res.status(400).json({
        ok: false,
        errors: ['Kode RW, Nama RW, dan Nama Ketua RW wajib diisi.'],
      });
      return;
    }
    const newRw: RwGroup = {
      id: `rw-${Date.now()}`,
      rwCode: incoming.rwCode.trim(),
      rwName: incoming.rwName.trim(),
      ketuaRwName: incoming.ketuaRwName.trim(),
      phone: incoming.phone?.trim() || '',
      areaDescription: incoming.areaDescription?.trim() || 'Wilayah Kelurahan Panaikang',
      rtList: Array.isArray(incoming.rtList) ? incoming.rtList : [],
    };
    db.rwGroups = [...db.rwGroups, newRw];
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newRw, rwGroups: db.rwGroups });
  });

  app.put('/api/rw-groups/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.rwGroups.findIndex((rw) => rw.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data RW tidak ditemukan.'] });
      return;
    }
    const merged: RwGroup = {
      ...db.rwGroups[idx],
      ...req.body,
      rtList: Array.isArray(req.body.rtList) ? req.body.rtList : db.rwGroups[idx].rtList,
    };
    if (!merged.rwCode || !merged.rwName || !merged.ketuaRwName) {
      res.status(400).json({
        ok: false,
        errors: ['Kode RW, Nama RW, dan Nama Ketua RW wajib diisi.'],
      });
      return;
    }
    db.rwGroups[idx] = merged;
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, data: merged, rwGroups: db.rwGroups });
  });

  app.delete('/api/rw-groups/:id', (req, res) => {
    const { id } = req.params;
    db.rwGroups = db.rwGroups.filter((rw) => rw.id !== id);
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id, rwGroups: db.rwGroups });
  });

  // 3. Citizen Reports CRUD
  app.post('/api/reports', (req, res) => {
    const incoming = req.body as Partial<CitizenReport>;
    const errors = validateReport(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const nextNum = 149 + db.reports.length;
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      ticketCode: incoming.ticketCode || `PNK-2026-0${nextNum}`,
      title: incoming.title!.trim(),
      description: incoming.description!.trim(),
      category: incoming.category || 'Sampah Liar & TPS',
      urgency: incoming.urgency || 'Normal',
      status: incoming.status || 'Menunggu Verifikasi',
      reporterName: incoming.reporterName!.trim(),
      reporterPhone: incoming.reporterPhone?.trim() || '0812-xxxx-xxxx',
      rw: incoming.rw || 'RW 02',
      rt: incoming.rt || 'RT 01',
      locationName: incoming.locationName!.trim(),
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 50,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 48,
      coordinatesLabel: incoming.coordinatesLabel || '-5.1379, 119.4470',
      createdAt: incoming.createdAt || getRealtimeDateTimeString(new Date()),
      updatedAt: getRealtimeDateTimeString(new Date()),
      assignedTeam: incoming.assignedTeam || `Koordinator Kebersihan ${incoming.rw || 'RW 02'}`,
      responseNote:
        incoming.responseNote ||
        'Laporan baru telah masuk dan tervalidasi dalam sistem Satu Data Panaikang.',
      upvotes: typeof incoming.upvotes === 'number' ? incoming.upvotes : 1,
      imageUrl: incoming.imageUrl || '/images/dokumentasi_drainase_bersih_1791349273322.jpg',
      verifiedBy: incoming.verifiedBy,
      verifiedAt: incoming.verifiedAt,
      completedAt: incoming.completedAt,
      completionPhotoUrl: incoming.completionPhotoUrl,
      followUpPhotos: Array.isArray(incoming.followUpPhotos) ? incoming.followUpPhotos : [],
      serviceCategoryId: incoming.serviceCategoryId,
      serviceCategoryTitle: incoming.serviceCategoryTitle,
      serviceSubItemId: incoming.serviceSubItemId,
      serviceSubItemLabel: incoming.serviceSubItemLabel,
      documentCode: incoming.documentCode,
      officialHeaderTitle: incoming.officialHeaderTitle,
      processingUnit: incoming.processingUnit,
      applicantNik: incoming.applicantNik,
      specificFieldsData: incoming.specificFieldsData,
      letterRegisterNumber: incoming.letterRegisterNumber,
      signedByOfficer: incoming.signedByOfficer,
    };

    db.reports = [newReport, ...db.reports];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newReport });
  });

  app.put('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data laporan tidak ditemukan.'] });
      return;
    }

    const updatedFields = { ...db.reports[idx], ...req.body };
    const errors = validateReport(updatedFields);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.reports[idx] = {
      ...updatedFields,
      updatedAt: `${getRealtimeDateTimeString(new Date())} · Diperbarui`,
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.reports[idx] });
  });

  app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const exists = db.reports.some((r) => r.id === id);
    if (!exists) {
      res.status(404).json({ ok: false, errors: ['Data laporan tidak ditemukan.'] });
      return;
    }
    recordServerDeletedId(id);
    db.reports = db.reports.filter((r) => r.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 3B. Automatic Multi-Recipient WhatsApp Dispatch for Citizen Complaint Reports (Fonnte Gateway Only)
  const FONNTE_ENDPOINT = 'https://api.fonnte.com/send';
  const FONNTE_DEVICE_ENDPOINT = 'https://api.fonnte.com/device';
  const FONNTE_GET_DEVICES_ENDPOINT = 'https://api.fonnte.com/get-devices';
  const FIRESTORE_WA_STATE_REST_URL =
    'https://firestore.googleapis.com/v1/projects/panaikang-smart-environment/databases/ai-studio-panaikangsmarten-4feb23ef-f14d-4f7d-ab34-e0951be3a4fd/documents/panaikang_app_data/wa_gateway_state';
  const WA_CIPHER_KEY = 'pnk-wa-gw-2026-sec-key';

  const encodeServerWaToken = (rawToken: string): string => {
    const clean = (rawToken || '').trim();
    if (!clean) return '';
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i++) {
      bytes.push(clean.charCodeAt(i) ^ WA_CIPHER_KEY.charCodeAt(i % WA_CIPHER_KEY.length));
    }
    return `v1:${bytes.map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  };

  const decodeServerWaToken = (encoded: string): string => {
    if (!encoded || !encoded.startsWith('v1:')) return '';
    const hex = encoded.slice(3);
    if (hex.length % 2 !== 0) return '';
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.slice(i, i + 2), 16);
      if (Number.isNaN(byte)) return '';
      const idx = i / 2;
      out += String.fromCharCode(byte ^ WA_CIPHER_KEY.charCodeAt(idx % WA_CIPHER_KEY.length));
    }
    return out.trim();
  };

  const sanitizeFonnteError = (rawMessage: unknown, secretToken: string): string => {
    let text =
      rawMessage instanceof Error
        ? rawMessage.message
        : typeof rawMessage === 'string'
        ? rawMessage
        : 'Gagal mengirim pesan melalui Fonnte';
    if (secretToken && secretToken.length >= 4) {
      text = text.split(secretToken).join('[REDACTED]');
    }
    if (/disconnected|disconnect/i.test(text)) {
      return 'Perangkat WhatsApp belum tersambung di Fonnte (Status: Disconnected). Silakan buka fonnte.com > menu Device, lalu scan QR Code WhatsApp di HP Anda.';
    }
    if (/invalid token|token invalid/i.test(text)) {
      return 'Token Fonnte tidak valid (pastikan menggunakan Token Perangkat dari menu Device di fonnte.com). Silakan klik "Ganti Token Fonnte" di Kartu 01 untuk memperbarui token.';
    }
    if (/out of quota|quota habis/i.test(text)) {
      return 'Kuota pesan WhatsApp di akun Fonnte telah habis. Silakan top up di fonnte.com.';
    }
    if (/package expired/i.test(text)) {
      return 'Paket langganan Fonnte Anda telah kedaluwarsa. Silakan perpanjang di fonnte.com.';
    }
    return text.slice(0, 240);
  };

  const FONNTE_TOKEN_FILE = path.join(DATA_DIR, 'fonnte_token.txt');

  const getCleanFonnteToken = (): string => {
    let raw =
      process.env.FONNTE_TOKEN ||
      process.env.FONNTE_API_TOKEN ||
      process.env.FONNTETOKEN ||
      '';
    if (
      raw &&
      (raw.includes('YOUR_FONNTE_TOKEN') ||
        raw.includes('placeholder') ||
        raw === 'undefined' ||
        raw === 'null')
    ) {
      raw = '';
    }
    if (!raw) {
      try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const match = envContent.match(/FONNTE_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/i);
          if (match && match[1]) {
            raw = match[1];
          }
        }
      } catch {}
    }
    if (
      raw &&
      (raw.includes('YOUR_FONNTE_TOKEN') ||
        raw.includes('placeholder') ||
        raw === 'undefined' ||
        raw === 'null')
    ) {
      raw = '';
    }
    if (!raw && fs.existsSync(FONNTE_TOKEN_FILE)) {
      try {
        raw = fs.readFileSync(FONNTE_TOKEN_FILE, 'utf-8');
      } catch {}
    }
    return (raw || '')
      .replace(/^Bearer\s+/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
  };

  const persistTokenToLocalAndCloud = async (cleanToken: string): Promise<void> => {
    if (!cleanToken) return;
    process.env.FONNTE_TOKEN = cleanToken;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(FONNTE_TOKEN_FILE, cleanToken, 'utf-8');
    } catch {}

    try {
      const encodedToken = encodeServerWaToken(cleanToken);
      const tokenMasked =
        cleanToken.length >= 8
          ? `${cleanToken.slice(0, 4)}••••••••${cleanToken.slice(-4)}`
          : `${cleanToken.slice(0, 2)}••••`;
      const patchUrl = `${FIRESTORE_WA_STATE_REST_URL}?updateMask.fieldPaths=encodedToken&updateMask.fieldPaths=tokenMasked&updateMask.fieldPaths=updatedAt`;
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            encodedToken: { stringValue: encodedToken },
            tokenMasked: { stringValue: tokenMasked },
            updatedAt: { integerValue: String(Date.now()) },
          },
        }),
      });
    } catch {}
  };

  let hasSyncedBootTokenToCloud = false;

  const getCleanFonnteTokenAsync = async (): Promise<string> => {
    const localToken = getCleanFonnteToken();
    if (localToken) {
      if (!hasSyncedBootTokenToCloud) {
        hasSyncedBootTokenToCloud = true;
        void persistTokenToLocalAndCloud(localToken);
      }
      return localToken;
    }

    // Recover token from Firestore Cloud (`panaikang_app_data/wa_gateway_state`) if container restarted
    try {
      const resp = await fetch(FIRESTORE_WA_STATE_REST_URL);
      if (resp.ok) {
        const docJson: any = await resp.json().catch(() => null);
        const encoded = docJson?.fields?.encodedToken?.stringValue || '';
        const decoded = decodeServerWaToken(encoded);
        if (decoded) {
          process.env.FONNTE_TOKEN = decoded;
          try {
            if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(FONNTE_TOKEN_FILE, decoded, 'utf-8');
          } catch {}
          return decoded;
        }
      }
    } catch {}
    return '';
  };

  // Immediately sync boot FONNTE_TOKEN to local file and Firestore Cloud if present
  const bootFonnteToken = getCleanFonnteToken();
  if (bootFonnteToken) {
    hasSyncedBootTokenToCloud = true;
    void persistTokenToLocalAndCloud(bootFonnteToken);
  }

  /**
   * Resolves an Account Token into an active Device Token if the user pasted their Account Token
   * from fonnte.com instead of the Device Token.
   */
  const resolveFonnteDeviceTokenIfAccountToken = async (candidateToken: string): Promise<string> => {
    if (!candidateToken) return '';
    try {
      const resp = await fetch(FONNTE_GET_DEVICES_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: candidateToken },
      });
      if (!resp.ok) return candidateToken;
      const data: any = await resp.json().catch(() => null);
      if (data && (data.status === true || data.status === 'true') && Array.isArray(data.data) && data.data.length > 0) {
        const connectedDev =
          data.data.find((d: any) => String(d?.status || '').toLowerCase() === 'connect') ||
          data.data[0];
        if (connectedDev?.token && typeof connectedDev.token === 'string') {
          const resolvedDeviceToken = connectedDev.token.trim();
          if (resolvedDeviceToken && resolvedDeviceToken !== candidateToken) {
            await persistTokenToLocalAndCloud(resolvedDeviceToken);
            return resolvedDeviceToken;
          }
        }
      }
    } catch {}
    return candidateToken;
  };

  const setWaCorsHeaders = (res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  };

  const handleWhatsAppAutoDispatch = async (req: express.Request, res: express.Response) => {
    setWaCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    let fonnteToken = await getCleanFonnteTokenAsync();
    try {
      const report = req.body?.report || req.body || {};
      const isExplicitRecipients = Array.isArray(req.body?.recipients);
      const rawRecipients = isExplicitRecipients
        ? req.body.recipients
        : db.whatsappRecipients || [];
      const reportRw = String(report.rw || '').trim();

      const normalizePhone = (rawPhone?: string) => {
        if (!rawPhone) return '';
        const str = String(rawPhone).trim();
        if (!str || str === '-' || /x/i.test(str)) return '';
        let digits = str.replace(/\D+/g, '');
        if (!digits) return '';
        if (digits.startsWith('0062')) digits = `62${digits.slice(4)}`;
        else if (digits.startsWith('620')) digits = `62${digits.slice(3)}`;
        else if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
        else if (digits.startsWith('8')) digits = `62${digits}`;
        return digits.length >= 10 ? digits : '';
      };

      const validRecipients = rawRecipients.filter((r: any) => {
        if (!r) return false;
        const norm = normalizePhone(r.phoneNumber);
        if (!norm) return false;
        if (isExplicitRecipients) {
          return true;
        }
        if (r.isActive === false) return false;
        const scope = String(r.rwScope || 'Seluruh Wilayah').trim();
        return !scope || scope === 'Seluruh Wilayah' || !reportRw || scope === reportRw;
      });

      if (validRecipients.length === 0) {
        return res.json({
          ok: false,
          error:
            'Tidak ada nomor WhatsApp penerima aktif yang valid (nomor HP belum diisi atau format belum sesuai). Silakan atur nomor WhatsApp pejabat/koordinator penerima di menu Kelola WhatsApp Gateway.',
          totalDispatched: 0,
          totalFailed: 0,
          deliveries: [],
        });
      }

      const sendSingleMessage = async (tokenToUse: string, targetPhone: string, msgText: string) => {
        const params = new URLSearchParams();
        params.append('target', targetPhone);
        params.append('message', msgText);
        params.append('countryCode', '62');

        const resp = await fetch(FONNTE_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: tokenToUse,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        let respData: any = null;
        let rawText = '';
        try {
          rawText = await resp.text();
          try {
            respData = JSON.parse(rawText);
          } catch {
            respData = { message: rawText };
          }
        } catch {
          respData = null;
        }
        return { resp, respData, rawText };
      };

      const dispatchedAt = new Date().toISOString();
      const deliveries = await Promise.all(
        validRecipients.map(async (recipient: any) => {
          const normalizedPhone = normalizePhone(recipient.phoneNumber);
          const greetingName = recipient?.name
            ? `Yth. *${recipient.name}* (${recipient.role || 'Pejabat / Tim Terkait'})`
            : 'Yth. *Lurah Panaikang & Tim Penerima Laporan Warga*';
          const message = [
            `*🔔 NOTIFIKASI OTOMATIS PENGADUAN WARGA MASUK*`,
            `*PEMERINTAH KELURAHAN PANAIKANG — KOTA MAKASSAR*`,
            `----------------------------------------`,
            greetingName,
            `Telah masuk laporan pengaduan warga baru yang diteruskan otomatis oleh sistem ke *${validRecipients.length} nomor pejabat/pihak terkait terdaftar*:`,
            ``,
            `• *No. Tiket:* ${report.ticketCode || '-'}`,
            `• *Judul Pengaduan:* ${report.title || '-'}`,
            `• *Kategori:* ${report.category || 'Pengaduan Warga'}`,
            `• *Tingkat Urgensi:* ${report.urgency || 'Normal'}`,
            `• *Wilayah:* ${report.rw || '-'} / ${report.rt || '-'}`,
            `• *Lokasi Kejadian:* ${report.locationName || '-'}`,
            `• *Tanggal / Waktu:* ${report.submittedAt || report.createdAt || '-'}`,
            `• *Pelapor:* ${report.reporterName || 'Warga Kelurahan Panaikang'}`,
            `• *Kontak Pelapor:* ${report.reporterPhone && report.reporterPhone !== '-' ? report.reporterPhone : 'Anonim / Tidak Dicantumkan'}`,
            `----------------------------------------`,
            `*Uraian Masalah / Isi Pengaduan:*`,
            `${report.description || report.content || '-'}`,
            `----------------------------------------`,
            `_Pesan ini dikirim secara otomatis oleh Sistem Satu Data Kelurahan Panaikang saat laporan disubmit warga (tanpa melalui WA pribadi pelapor)._`,
          ].join('\n');

          let deliveryStatus: 'TERKIRIM_OTOMATIS' | 'GAGAL_KIRIM' = 'GAGAL_KIRIM';
          let errorMessage = '';

          if (!fonnteToken) {
            deliveryStatus = 'GAGAL_KIRIM';
            errorMessage =
              'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan masukkan Token Fonnte Anda pada Kartu 01 di menu Kelola WhatsApp Gateway.';
          } else {
            try {
              let { resp, respData, rawText } = await sendSingleMessage(
                fonnteToken,
                normalizedPhone,
                message
              );

              const firstReason = String(
                respData?.reason || respData?.detail || respData?.message || ''
              );
              if (/token invalid|invalid token/i.test(firstReason)) {
                const resolvedDevToken = await resolveFonnteDeviceTokenIfAccountToken(fonnteToken);
                if (resolvedDevToken && resolvedDevToken !== fonnteToken) {
                  fonnteToken = resolvedDevToken;
                  const retry = await sendSingleMessage(fonnteToken, normalizedPhone, message);
                  resp = retry.resp;
                  respData = retry.respData;
                  rawText = retry.rawText;
                }
              }

              const fonnteOk =
                resp.ok &&
                respData &&
                respData.status !== false &&
                respData.status !== 'false' &&
                (respData.status === true ||
                  respData.status === 'true' ||
                  String(respData.status).toLowerCase() === 'connect' ||
                  String(respData.status).toLowerCase() === 'connected' ||
                  String(respData.status).toLowerCase() === 'success' ||
                  Boolean(respData.id) ||
                  /success/i.test(String(respData.detail || respData.message || rawText)));

              if (fonnteOk) {
                deliveryStatus = 'TERKIRIM_OTOMATIS';
              } else {
                deliveryStatus = 'GAGAL_KIRIM';
                const reason =
                  respData?.reason ||
                  respData?.detail ||
                  respData?.message ||
                  rawText ||
                  `Fonnte HTTP ${resp.status}`;
                errorMessage = sanitizeFonnteError(reason, fonnteToken);
              }
            } catch (err) {
              deliveryStatus = 'GAGAL_KIRIM';
              errorMessage = sanitizeFonnteError(err, fonnteToken);
            }
          }

          return {
            id: `wad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ticketCode: report.ticketCode || '-',
            reportTitle: report.title || '-',
            reportCategory: report.category || 'Pengaduan Warga',
            reportRw: report.rw || '-',
            reportRt: report.rt || '-',
            recipientId: recipient.id || normalizedPhone,
            recipientName: recipient.name || 'Pejabat Terkait',
            recipientRole: recipient.role || 'Tim Kelurahan Panaikang',
            phoneNumber: normalizedPhone,
            rwScope: recipient.rwScope || 'Seluruh Wilayah',
            status: deliveryStatus,
            provider: 'fonnte',
            errorMessage: errorMessage || undefined,
            dispatchedAt,
            messagePreview: message,
          };
        })
      );

      const successCount = deliveries.filter((d) => d.status === 'TERKIRIM_OTOMATIS').length;
      const failedCount = deliveries.length - successCount;

      if (!Array.isArray(db.waDispatchLogs)) {
        db.waDispatchLogs = [];
      }
      db.waDispatchLogs = [...deliveries, ...db.waDispatchLogs].slice(0, 120);
      saveDatabase(db);

      res.json({
        ok: deliveries.length > 0 && failedCount === 0,
        ticketCode: report.ticketCode || '-',
        totalDispatched: successCount,
        totalFailed: failedCount,
        dispatchedAt,
        deliveries,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: sanitizeFonnteError(err, fonnteToken),
      });
    }
  };

  const handleWhatsAppGatewayStatus = async (req: express.Request, res: express.Response) => {
    setWaCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    let fonnteToken = await getCleanFonnteTokenAsync();
    const getMasked = (tok: string) =>
      tok ? (tok.length >= 8 ? `${tok.slice(0, 4)}••••••••${tok.slice(-4)}` : `${tok.slice(0, 2)}••••`) : '';

    if (!fonnteToken) {
      return res.json({
        ok: false,
        configured: false,
        hasToken: false,
        tokenMasked: '',
        deviceStatus: 'unconfigured',
        message:
          'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan klik tombol "+ Input Token Fonnte" di bawah untuk menyimpan Token Perangkat dari fonnte.com.',
      });
    }

    try {
      const checkDevice = async (tokenToUse: string) => {
        const resp = await fetch(FONNTE_DEVICE_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: tokenToUse,
          },
        });
        const data: any = await resp.json().catch(() => null);
        return { resp, data };
      };

      let { resp, data } = await checkDevice(fonnteToken);
      const firstReason = String((data && (data.reason || data.detail || data.message)) || '');
      if (/token invalid|invalid token/i.test(firstReason)) {
        const resolvedDevToken = await resolveFonnteDeviceTokenIfAccountToken(fonnteToken);
        if (resolvedDevToken && resolvedDevToken !== fonnteToken) {
          fonnteToken = resolvedDevToken;
          const retry = await checkDevice(fonnteToken);
          resp = retry.resp;
          data = retry.data;
        }
      }

      const tokenMasked = getMasked(fonnteToken);

      if (resp.ok && data && (data.status === true || data.status === 'true')) {
        const deviceStatusStr = String(data.device_status || '').toLowerCase();
        const generalStatus = String(data.status || '').toLowerCase();

        const isConnected =
          deviceStatusStr === 'connect' ||
          deviceStatusStr === 'connected' ||
          deviceStatusStr === 'online' ||
          (deviceStatusStr === '' && (generalStatus === 'connect' || generalStatus === 'connected' || data.status === true));

        return res.json({
          ok: isConnected,
          configured: true,
          hasToken: true,
          tokenMasked,
          deviceStatus: isConnected ? 'connect' : 'disconnect',
          device: data.device || '',
          name: data.name || '',
          quota: data.quota !== undefined ? String(data.quota) : '',
          package: data.package || '',
          expired: data.expired || '',
          messagesCount: data.messages !== undefined ? Number(data.messages) : undefined,
          message: isConnected
            ? 'Perangkat WhatsApp terhubung (Connect) dan siap mengirim pesan otomatis.'
            : 'Perangkat WhatsApp berstatus Disconnected di Fonnte. Silakan scan QR Code di menu Device pada dashboard fonnte.com.',
        });
      }

      const reason = (data && (data.reason || data.detail || data.message)) || `HTTP ${resp.status}`;
      return res.json({
        ok: false,
        configured: true,
        hasToken: true,
        tokenMasked,
        deviceStatus: /invalid token|token invalid/i.test(reason) ? 'invalid_token' : 'disconnect',
        reason,
        message: sanitizeFonnteError(reason, fonnteToken),
      });
    } catch (err) {
      return res.json({
        ok: false,
        configured: true,
        hasToken: true,
        tokenMasked: getMasked(fonnteToken),
        deviceStatus: 'error',
        message: err instanceof Error ? err.message : 'Koneksi ke server Fonnte gagal.',
      });
    }
  };

  app.options('/api/whatsapp-gateway/token', (_req, res) => {
    setWaCorsHeaders(res);
    res.status(200).end();
  });

  app.post('/api/whatsapp-gateway/token', async (req, res) => {
    setWaCorsHeaders(res);
    const tokenInput = String(req.body?.token || req.body?.fonnteToken || '').trim();
    if (!tokenInput) {
      return res.status(400).json({ ok: false, message: 'Token Fonnte tidak boleh kosong.' });
    }
    let cleaned = tokenInput.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    try {
      // Automatically resolve Account Token -> Device Token if user pasted Account Token
      cleaned = await resolveFonnteDeviceTokenIfAccountToken(cleaned);
      await persistTokenToLocalAndCloud(cleaned);
      return res.json({
        ok: true,
        message:
          'FONNTE_TOKEN berhasil disimpan secara aman di Server & Cloud Database (tahan restart & tersinkronisasi lintas platform).',
      });
    } catch {
      return res.status(500).json({ ok: false, message: 'Gagal menyimpan token Fonnte ke server.' });
    }
  });

  app.all('/api/reports/dispatch-whatsapp', handleWhatsAppAutoDispatch);
  app.all('/api/whatsapp-dispatch', handleWhatsAppAutoDispatch);
  app.all('/api/whatsapp-gateway/status', handleWhatsAppGatewayStatus);
  app.all('/api/whatsapp-status', handleWhatsAppGatewayStatus);

  // 4. Waste Bank Units (BSU) CRUD
  app.post('/api/waste-units', (req, res) => {
    const incoming = req.body as Partial<WasteBankUnit>;
    const errors = validateWasteUnit(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const newUnit: WasteBankUnit = {
      id: `bsu-${Date.now()}`,
      rw: incoming.rw!.trim(),
      unitName: incoming.unitName!.trim(),
      coordinator: incoming.coordinator!.trim(),
      locationLabel: incoming.locationLabel?.trim() || 'Kawasan Kelurahan Panaikang',
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 55,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 55,
      organikKg: Number(incoming.organikKg) || 0,
      anorganikKg: Number(incoming.anorganikKg) || 0,
      residuKg: Number(incoming.residuKg) || 0,
      activeHouseholds: Number(incoming.activeHouseholds) || 50,
      pickupSchedule: incoming.pickupSchedule?.trim() || 'Senin, Rabu, Jumat · 06:30 WITA',
      imageUrl: incoming.imageUrl?.trim() || '',
      lastUpdated: getRealtimeDateString(new Date()),
    };

    db.wasteUnits = [...db.wasteUnits, newUnit];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newUnit });
  });

  app.put('/api/waste-units/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.wasteUnits.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Unit Bank Sampah tidak ditemukan.'] });
      return;
    }

    const merged = {
      ...db.wasteUnits[idx],
      ...req.body,
      organikKg: Number(req.body.organikKg ?? db.wasteUnits[idx].organikKg),
      anorganikKg: Number(req.body.anorganikKg ?? db.wasteUnits[idx].anorganikKg),
      residuKg: Number(req.body.residuKg ?? db.wasteUnits[idx].residuKg),
      activeHouseholds: Number(req.body.activeHouseholds ?? db.wasteUnits[idx].activeHouseholds),
      imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : db.wasteUnits[idx].imageUrl,
    };

    const errors = validateWasteUnit(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.wasteUnits[idx] = {
      ...merged,
      lastUpdated: getRealtimeDateString(new Date()),
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.wasteUnits[idx] });
  });

  app.delete('/api/waste-units/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.wasteUnits = db.wasteUnits.filter((u) => u.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 5. Waste Weighing Logs CRUD
  app.post('/api/waste-logs', (req, res) => {
    const { rw, organikKg, anorganikKg, residuKg, officerName, notes } = req.body;
    const org = Number(organikKg) || 0;
    const anorg = Number(anorganikKg) || 0;
    const resKg = Number(residuKg) || 0;

    if (org < 0 || anorg < 0 || resKg < 0 || org + anorg + resKg <= 0) {
      res.status(400).json({
        ok: false,
        errors: ['Total timbangan sampah harus lebih dari 0 kg dan tidak boleh bernilai negatif.'],
      });
      return;
    }

    const targetUnit = db.wasteUnits.find((u) => u.rw === rw);
    const newLog: WasteLogEntry = {
      id: `log-${Date.now()}`,
      date: getRealtimeDateTimeString(new Date()),
      rw: rw || 'RW 02',
      unitName: targetUnit ? targetUnit.unitName : `BSU ${rw}`,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
      officerName: officerName?.trim() || `Petugas BSU ${rw}`,
      notes: notes?.trim() || `Penimbangan harian terpilah ${rw}.`,
    };

    db.wasteLogs = [newLog, ...db.wasteLogs];
    db.wasteUnits = db.wasteUnits.map((u) =>
      u.rw === rw
        ? {
            ...u,
            organikKg: u.organikKg + org,
            anorganikKg: u.anorganikKg + anorg,
            residuKg: u.residuKg + resKg,
            lastUpdated: getRealtimeDateString(new Date()),
          }
        : u
    );
    saveDatabase(db);
    res.status(201).json({ ok: true, data: { log: newLog, wasteUnits: db.wasteUnits } });
  });

  app.put('/api/waste-logs/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.wasteLogs.findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Log penimbangan tidak ditemukan.'] });
      return;
    }
    const prevLog = db.wasteLogs[idx];
    const org = Number(req.body.organikKg ?? prevLog.organikKg) || 0;
    const anorg = Number(req.body.anorganikKg ?? prevLog.anorganikKg) || 0;
    const resKg = Number(req.body.residuKg ?? prevLog.residuKg) || 0;
    if (org < 0 || anorg < 0 || resKg < 0 || org + anorg + resKg <= 0) {
      res.status(400).json({
        ok: false,
        errors: ['Total timbangan sampah harus lebih dari 0 kg dan tidak boleh bernilai negatif.'],
      });
      return;
    }

    const updatedLog: WasteLogEntry = {
      ...prevLog,
      ...req.body,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
      officerName: (req.body.officerName ?? prevLog.officerName ?? '').trim(),
      notes: (req.body.notes ?? prevLog.notes ?? '').trim(),
    };
    db.wasteLogs[idx] = updatedLog;
    saveDatabase(db);
    res.json({ ok: true, data: updatedLog });
  });

  app.delete('/api/waste-logs/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.wasteLogs = db.wasteLogs.filter((l) => l.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 5B. Teba Spots CRUD (Monitoring & Kelola Titik Teba)
  app.get('/api/teba-spots', (_req, res) => {
    res.json({ ok: true, data: db.tebaSpots || [] });
  });

  app.post('/api/teba-spots', (req, res) => {
    const incoming = req.body as Partial<TebaSpot>;
    const errors = validateTebaSpot(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const rwClean = incoming.rw?.trim() || 'RW 01';
    const rtClean = incoming.rt?.trim() || 'RT 01';
    const nowIso = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const newSpot: TebaSpot = {
      id: `teba-${Date.now()}`,
      name: incoming.name!.trim(),
      code: incoming.code?.trim() || `TEBA-${rwClean.replace(/\s+/g, '')}-${Date.now().toString().slice(-3)}`,
      rw: rwClean,
      rt: rtClean,
      address: incoming.address!.trim(),
      locationTag: incoming.locationTag!.trim(),
      mapUrl: incoming.mapUrl?.trim() || '',
      latitude: typeof incoming.latitude === 'number' ? incoming.latitude : -5.1385,
      longitude: typeof incoming.longitude === 'number' ? incoming.longitude : 119.4475,
      imageUrl: incoming.imageUrl!.trim(),
      documentationPhotos:
        Array.isArray(incoming.documentationPhotos) && incoming.documentationPhotos.length > 0
          ? incoming.documentationPhotos
          : [incoming.imageUrl!.trim()],
      capacityKg: Number(incoming.capacityKg) || 300,
      currentLoadKg: Number(incoming.currentLoadKg) || 0,
      wasteTypeProcessed:
        incoming.wasteTypeProcessed?.trim() || 'Limbah organik basah, sisa sayur/buah & dedaunan',
      coordinatorName: incoming.coordinatorName?.trim() || 'Koordinator Lingkungan RW Setempat',
      coordinatorPhone: incoming.coordinatorPhone?.trim() || '',
      status: incoming.status || 'Aktif Beroperasi',
      description: incoming.description?.trim() || 'Fasilitas teba komunal biopori resapan organik mandiri.',
      lastHarvestDate: incoming.lastHarvestDate?.trim() || 'Belum ada panen',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(db.tebaSpots)) {
      db.tebaSpots = [];
    }
    db.tebaSpots = [newSpot, ...db.tebaSpots];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newSpot, tebaSpots: db.tebaSpots });
  });

  app.put('/api/teba-spots/:id', (req, res) => {
    const { id } = req.params;
    if (!Array.isArray(db.tebaSpots)) db.tebaSpots = [];
    const idx = db.tebaSpots.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Titik Teba tidak ditemukan.'] });
      return;
    }

    const prevSpot = db.tebaSpots[idx];
    const incoming = req.body as Partial<TebaSpot>;
    const merged: TebaSpot = {
      ...prevSpot,
      ...incoming,
      name: (incoming.name ?? prevSpot.name).trim(),
      rw: (incoming.rw ?? prevSpot.rw).trim(),
      rt: (incoming.rt ?? prevSpot.rt).trim(),
      address: (incoming.address ?? prevSpot.address).trim(),
      locationTag: (incoming.locationTag ?? prevSpot.locationTag).trim(),
      imageUrl: (incoming.imageUrl ?? prevSpot.imageUrl).trim(),
      capacityKg: Number(incoming.capacityKg ?? prevSpot.capacityKg) || 300,
      currentLoadKg: Number(incoming.currentLoadKg ?? prevSpot.currentLoadKg) || 0,
      updatedAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };

    const errors = validateTebaSpot(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.tebaSpots[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: merged, tebaSpots: db.tebaSpots });
  });

  app.delete('/api/teba-spots/:id', (req, res) => {
    const { id } = req.params;
    if (!Array.isArray(db.tebaSpots)) db.tebaSpots = [];
    recordServerDeletedId(id);
    db.tebaSpots = db.tebaSpots.filter((t) => t.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id, tebaSpots: db.tebaSpots });
  });

  // 5C. Biopori Points CRUD (Lubang Resapan Biopori / LRB)
  app.get('/api/biopori-points', (_req, res) => {
    res.json({ ok: true, data: db.bioporiPoints || [] });
  });

  app.post('/api/biopori-points', (req, res) => {
    const incoming = req.body as Partial<BioporiPoint>;
    const errors = validateBioporiPoint(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const rwClean = incoming.rw?.trim() || 'RW 01';
    const rtClean = incoming.rt?.trim() || 'RT 01';
    const nowIso = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const newPoint: BioporiPoint = {
      id: `bio-${Date.now()}`,
      name: incoming.name!.trim(),
      code:
        incoming.code?.trim() ||
        `BIO-${rwClean.replace(/\s+/g, '')}-${Date.now().toString().slice(-3)}`,
      rw: rwClean,
      rt: rtClean,
      address: incoming.address!.trim(),
      locationTag: incoming.locationTag!.trim(),
      totalHoles: Math.max(1, Number(incoming.totalHoles) || 10),
      diameterCm: Math.max(5, Number(incoming.diameterCm) || 10),
      depthCm: Math.max(30, Number(incoming.depthCm) || 100),
      organicTypes:
        incoming.organicTypes?.trim() || 'Sisa sayuran dapur rumah tangga, dedaunan kering, kulit buah',
      status: incoming.status || 'Aktif Digunakan',
      coordinatorName: incoming.coordinatorName?.trim() || 'Kader Lingkungan RW Setempat',
      coordinatorPhone: incoming.coordinatorPhone?.trim() || '',
      mapUrl: incoming.mapUrl?.trim() || '',
      imageUrl: incoming.imageUrl!.trim(),
      documentationPhotos:
        Array.isArray(incoming.documentationPhotos) && incoming.documentationPhotos.length > 0
          ? incoming.documentationPhotos
          : [incoming.imageUrl!.trim()],
      harvestHistory: incoming.harvestHistory?.trim() || 'Belum ada catatan panen',
      installationDate: incoming.installationDate?.trim() || nowIso,
      notes: incoming.notes?.trim() || 'Pipa biopori resapan air hujan & pengomposan sampah organik mandiri.',
      updatedAt: nowIso,
    };

    if (!Array.isArray(db.bioporiPoints)) {
      db.bioporiPoints = [];
    }
    db.bioporiPoints = [newPoint, ...db.bioporiPoints];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newPoint, bioporiPoints: db.bioporiPoints });
  });

  app.put('/api/biopori-points/:id', (req, res) => {
    const { id } = req.params;
    if (!Array.isArray(db.bioporiPoints)) db.bioporiPoints = [];
    const idx = db.bioporiPoints.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Titik / Zona Biopori tidak ditemukan.'] });
      return;
    }

    const prevPoint = db.bioporiPoints[idx];
    const incoming = req.body as Partial<BioporiPoint>;
    const merged: BioporiPoint = {
      ...prevPoint,
      ...incoming,
      name: (incoming.name ?? prevPoint.name).trim(),
      rw: (incoming.rw ?? prevPoint.rw).trim(),
      rt: (incoming.rt ?? prevPoint.rt).trim(),
      address: (incoming.address ?? prevPoint.address).trim(),
      locationTag: (incoming.locationTag ?? prevPoint.locationTag).trim(),
      imageUrl: (incoming.imageUrl ?? prevPoint.imageUrl).trim(),
      totalHoles: Math.max(1, Number(incoming.totalHoles ?? prevPoint.totalHoles) || 1),
      diameterCm: Math.max(5, Number(incoming.diameterCm ?? prevPoint.diameterCm) || 10),
      depthCm: Math.max(30, Number(incoming.depthCm ?? prevPoint.depthCm) || 100),
      updatedAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };

    const errors = validateBioporiPoint(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.bioporiPoints[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: merged, bioporiPoints: db.bioporiPoints });
  });

  app.delete('/api/biopori-points/:id', (req, res) => {
    const { id } = req.params;
    if (!Array.isArray(db.bioporiPoints)) db.bioporiPoints = [];
    recordServerDeletedId(id);
    db.bioporiPoints = db.bioporiPoints.filter((b) => b.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id, bioporiPoints: db.bioporiPoints });
  });

  // 6. Cleanup Events (Kerja Bakti) CRUD
  app.post('/api/cleanup-events', (req, res) => {
    const incoming = req.body as Partial<CleanupEvent>;
    const errors = validateCleanupEvent(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const isCompleted = incoming.status === 'Tuntas';
    const rawDocs =
      isCompleted && Array.isArray(incoming.documentationPhotos) && incoming.documentationPhotos.length > 0
        ? incoming.documentationPhotos
        : isCompleted && incoming.imageUrl
        ? [incoming.imageUrl]
        : [];

    const created: CleanupEvent = {
      id: `kb-${Date.now()}`,
      title: incoming.title!.trim(),
      date: incoming.date!.trim(),
      timeRange: incoming.timeRange?.trim() || '06:30 – 09:30 WITA',
      rw: incoming.rw || 'RW 01',
      rtScope: incoming.rtScope || 'Seluruh RT',
      locationName: incoming.locationName!.trim(),
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 45,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 50,
      coordinator: incoming.coordinator?.trim() || `Koordinator ${incoming.rw || 'RW 01'}`,
      status: incoming.status || 'Terjadwal',
      targetParticipants: Number(incoming.targetParticipants) || 80,
      registeredParticipants: Number(incoming.registeredParticipants) || 10,
      collectedWasteKg: isCompleted ? Number(incoming.collectedWasteKg) || 0 : 0,
      focusAreas:
        Array.isArray(incoming.focusAreas) && incoming.focusAreas.length > 0
          ? incoming.focusAreas
          : ['Pembersihan saluran drainase dan jalan lingkungan'],
      equipmentNeeded:
        Array.isArray(incoming.equipmentNeeded) && incoming.equipmentNeeded.length > 0
          ? incoming.equipmentNeeded
          : ['Sapu lidi', 'Cangkul', 'Kantong pilah sampah'],
      imageUrl: isCompleted ? incoming.imageUrl || rawDocs[0] || '' : '',
      documentationPhotos: isCompleted ? rawDocs : [],
      summaryNote:
        incoming.summaryNote?.trim() || 'Kegiatan gotong royong rutin warga Kelurahan Panaikang.',
    };

    db.cleanupEvents = [created, ...db.cleanupEvents];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/cleanup-events/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.cleanupEvents.findIndex((e) => e.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Jadwal kerja bakti tidak ditemukan.'] });
      return;
    }

    const nextStatus = req.body.status ?? db.cleanupEvents[idx].status;
    const isCompleted = nextStatus === 'Tuntas';
    const incomingDocs = Array.isArray(req.body.documentationPhotos)
      ? req.body.documentationPhotos
      : db.cleanupEvents[idx].documentationPhotos || [];

    const merged: CleanupEvent = {
      ...db.cleanupEvents[idx],
      ...req.body,
      status: nextStatus,
      targetParticipants: Number(
        req.body.targetParticipants ?? db.cleanupEvents[idx].targetParticipants
      ),
      registeredParticipants: Number(
        req.body.registeredParticipants ?? db.cleanupEvents[idx].registeredParticipants
      ),
      collectedWasteKg: isCompleted
        ? Number(req.body.collectedWasteKg ?? db.cleanupEvents[idx].collectedWasteKg)
        : 0,
      imageUrl: isCompleted
        ? req.body.imageUrl ?? db.cleanupEvents[idx].imageUrl ?? incomingDocs[0] ?? ''
        : '',
      documentationPhotos: isCompleted ? incomingDocs : [],
    };

    const errors = validateCleanupEvent(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.cleanupEvents[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: db.cleanupEvents[idx] });
  });

  app.delete('/api/cleanup-events/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.cleanupEvents = db.cleanupEvents.filter((e) => e.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  app.options('/api/cleanup-events/sync-ig-highlights', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
  });

  app.post('/api/cleanup-events/sync-ig-highlights', async (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let syncedStories: KerjaBaktiIgHighlightItem[] = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3);
    try {
      const embedRes = await fetch('https://www.instagram.com/kelurahan.panaikang/embed/', {
        headers: {
          'User-Agent': 'curl/8.5.0',
        },
      });
      if (embedRes.ok) {
        const html = await embedRes.text();
        const match = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
        if (match && match[1]) {
          const rawJsonStr = JSON.parse(match[1]);
          const parsed = JSON.parse(rawJsonStr);
          const mediaList = Array.isArray(parsed?.context?.graphql_media)
            ? parsed.context.graphql_media
            : [];
          const kbMatches: KerjaBaktiIgHighlightItem[] = [];
          for (let i = 0; i < mediaList.length; i++) {
            const sm = mediaList[i]?.shortcode_media;
            if (!sm || !sm.shortcode) continue;
            const code = String(sm.shortcode);
            const rawCaption = sm.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() || '';
            const lowerCap = rawCaption.toLowerCase();
            const isKerjaBakti =
              lowerCap.includes('kerja bakti') ||
              lowerCap.includes('jumat asri') ||
              lowerCap.includes('kebersihan') ||
              lowerCap.includes('pengelolaan sampah') ||
              lowerCap.includes('gotong royong') ||
              lowerCap.includes('clean up') ||
              lowerCap.includes('drainase') ||
              INITIAL_KERJABAKTI_IG_HIGHLIGHTS.some((h) => h.shortcode === code);
            if (!isKerjaBakti) continue;

            const existingInit = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.find((h) => h.shortcode === code);
            if (existingInit) {
              kbMatches.push(existingInit);
            } else {
              const firstLine = rawCaption.split('\n')[0].trim();
              const dateObj = sm.taken_at_timestamp
                ? new Date(sm.taken_at_timestamp * 1000)
                : new Date();
              const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
              const isVideo = Boolean(sm.is_video);
              kbMatches.push({
                id: `kb-ig-story-${kbMatches.length + 1}-${code}`,
                shortcode: code,
                title:
                  firstLine.length > 10 && firstLine.length <= 95
                    ? firstLine
                    : `${rawCaption.slice(0, 80)}...`,
                caption: rawCaption.length > 220 ? `${rawCaption.slice(0, 220)}...` : rawCaption,
                publishedAt: dateFormatted,
                rwScope: 'Kelurahan Panaikang',
                imageUrl: LOCAL_IG_FILE_MAP[code]
                  ? `/images/${LOCAL_IG_FILE_MAP[code]}`
                  : `/api/ig-media?code=${code}`,
                instagramPostUrl: `https://www.instagram.com/${isVideo ? 'reel' : 'p'}/${code}/`,
                highlightName: 'Sorotan: Kerja Bakti & Kebersihan',
              });
            }
            if (kbMatches.length >= 3) break;
          }
          // Ensure we always have 3 stories by filling from INITIAL_KERJABAKTI_IG_HIGHLIGHTS if needed
          for (const fallbackItem of INITIAL_KERJABAKTI_IG_HIGHLIGHTS) {
            if (kbMatches.length >= 3) break;
            if (!kbMatches.some((m) => m.shortcode === fallbackItem.shortcode)) {
              kbMatches.push(fallbackItem);
            }
          }
          if (kbMatches.length > 0) {
            syncedStories = kbMatches.slice(0, 3);
          }
        }
      }
    } catch {
      // Fallback to INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3)
    }

    res.json({
      ok: true,
      handle: '@kelurahan.panaikang',
      syncedAt: `${getRealtimeDateString(new Date())} · ${getRealtimeTimeString(new Date())}`,
      data: syncedStories.slice(0, 3),
    });
  });

  // 7. Informasi Seputar Kelurahan Panaikang & Instagram @kelurahan.panaikang CRUD
  app.post('/api/infos', (req, res) => {
    const incoming = req.body as Partial<KelurahanInfoItem>;
    const errors = validateKelurahanInfo(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const cleanContent = incoming.content!.trim();
    const rawHashtags = Array.isArray(incoming.hashtags)
      ? incoming.hashtags
      : ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KotaMakassar'];

    const created: KelurahanInfoItem = {
      id: `info-${Date.now()}`,
      title: incoming.title!.trim(),
      category: incoming.category?.trim() || 'Pengumuman Kelurahan',
      summary:
        incoming.summary?.trim() ||
        (cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent),
      content: cleanContent,
      imageUrl: incoming.imageUrl!.trim(),
      publishedAt: incoming.publishedAt?.trim() || getRealtimeDateString(new Date()),
      author: incoming.author?.trim() || 'Lurah Panaikang',
      instagramHandle: incoming.instagramHandle?.trim() || '@kelurahan.panaikang',
      instagramPostUrl:
        incoming.instagramPostUrl?.trim() || 'https://www.instagram.com/kelurahan.panaikang/',
      instagramLikes: typeof incoming.instagramLikes === 'number' ? incoming.instagramLikes : 128,
      instagramCommentsCount:
        typeof incoming.instagramCommentsCount === 'number' ? incoming.instagramCommentsCount : 19,
      isInstagramSynced: incoming.isInstagramSynced ?? true,
      hashtags: rawHashtags,
    };

    db.kelurahanInfos = [created, ...db.kelurahanInfos];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.options('/api/infos/sync-instagram', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
  });

  app.post('/api/infos/sync-instagram', async (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
    let liveSyncedPosts: KelurahanInfoItem[] = [...INITIAL_KELURAHAN_INFOS];
    let liveKbHighlights: KerjaBaktiIgHighlightItem[] = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.slice(0, 3);

    try {
      const embedRes = await fetch('https://www.instagram.com/kelurahan.panaikang/embed/', {
        headers: {
          'User-Agent': 'curl/8.5.0',
        },
      });
      if (embedRes.ok) {
        const html = await embedRes.text();
        const match = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
        if (match && match[1]) {
          const rawJsonStr = JSON.parse(match[1]);
          const parsed = JSON.parse(rawJsonStr);
          const mediaList = Array.isArray(parsed?.context?.graphql_media)
            ? parsed.context.graphql_media.slice(0, 6)
            : [];
          if (mediaList.length > 0) {
            const fetchedItems: KelurahanInfoItem[] = [];
            const kbMatches: KerjaBaktiIgHighlightItem[] = [];
            for (let i = 0; i < mediaList.length; i++) {
              const sm = mediaList[i]?.shortcode_media;
              if (!sm || !sm.shortcode) continue;
              const code = String(sm.shortcode);
              const rawCaption =
                sm.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() ||
                'Publikasi terbaru Instagram Resmi Pemerintah Kelurahan Panaikang (@kelurahan.panaikang).';
              const firstLine = rawCaption.split('\n')[0].trim();
              const dateObj = sm.taken_at_timestamp
                ? new Date(sm.taken_at_timestamp * 1000)
                : new Date();
              const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
              const isVideo = Boolean(sm.is_video);

              const existingInit = INITIAL_KELURAHAN_INFOS.find(
                (init) => init.id.includes(code) || init.instagramPostUrl?.includes(code)
              );
              if (existingInit) {
                fetchedItems.push({
                  ...existingInit,
                  instagramLikes:
                    sm.edge_liked_by?.count ??
                    sm.edge_media_preview_like?.count ??
                    existingInit.instagramLikes,
                  instagramCommentsCount:
                    sm.edge_media_to_comment?.count ?? existingInit.instagramCommentsCount,
                });
              } else {
                fetchedItems.push({
                  id: `ig-latest-${i + 1}-${code}`,
                  title:
                    firstLine.length > 10 && firstLine.length <= 100
                      ? firstLine
                      : `${rawCaption.slice(0, 82)}...`,
                  category: 'Kegiatan Lingkungan',
                  summary:
                    rawCaption.length > 130 ? `${rawCaption.slice(0, 130)}...` : rawCaption,
                  content: rawCaption,
                  imageUrl: LOCAL_IG_FILE_MAP[code]
                    ? `/images/${LOCAL_IG_FILE_MAP[code]}`
                    : `/api/ig-media?code=${code}`,
                  publishedAt: dateFormatted,
                  author: 'Lurah Panaikang · @kelurahan.panaikang',
                  instagramHandle: '@kelurahan.panaikang',
                  instagramPostUrl: `https://www.instagram.com/${isVideo ? 'reel' : 'p'}/${code}/`,
                  instagramLikes:
                    sm.edge_liked_by?.count ?? sm.edge_media_preview_like?.count ?? 25,
                  instagramCommentsCount: sm.edge_media_to_comment?.count ?? 2,
                  isInstagramSynced: true,
                  hashtags: [
                    '#KelurahanPanaikang',
                    '#PanaikangSmartEnvironment',
                    '#KecamatanPanakkukang',
                    '#KotaMakassar',
                  ],
                });
              }

              // Also check if this post qualifies for Sorotan Kerja Bakti & Kebersihan
              const lowerCap = rawCaption.toLowerCase();
              const isKerjaBakti =
                lowerCap.includes('kerja bakti') ||
                lowerCap.includes('jumat asri') ||
                lowerCap.includes('kebersihan') ||
                lowerCap.includes('pengelolaan sampah') ||
                lowerCap.includes('gotong royong') ||
                lowerCap.includes('clean up') ||
                lowerCap.includes('drainase') ||
                INITIAL_KERJABAKTI_IG_HIGHLIGHTS.some((h) => h.shortcode === code);

              if (isKerjaBakti && kbMatches.length < 3) {
                const existingKb = INITIAL_KERJABAKTI_IG_HIGHLIGHTS.find((h) => h.shortcode === code);
                if (existingKb) {
                  kbMatches.push(existingKb);
                } else {
                  kbMatches.push({
                    id: `kb-ig-story-${kbMatches.length + 1}-${code}`,
                    shortcode: code,
                    title:
                      firstLine.length > 10 && firstLine.length <= 95
                        ? firstLine
                        : `${rawCaption.slice(0, 80)}...`,
                    caption: rawCaption.length > 220 ? `${rawCaption.slice(0, 220)}...` : rawCaption,
                    publishedAt: dateFormatted,
                    rwScope: 'Kelurahan Panaikang',
                    imageUrl: LOCAL_IG_FILE_MAP[code]
                      ? `/images/${LOCAL_IG_FILE_MAP[code]}`
                      : `/api/ig-media?code=${code}`,
                    instagramPostUrl: `https://www.instagram.com/${isVideo ? 'reel' : 'p'}/${code}/`,
                    highlightName: 'Sorotan: Kerja Bakti & Kebersihan',
                  });
                }
              }
            }
            if (fetchedItems.length > 0) {
              liveSyncedPosts = fetchedItems;
            }
            for (const fallbackItem of INITIAL_KERJABAKTI_IG_HIGHLIGHTS) {
              if (kbMatches.length >= 3) break;
              if (!kbMatches.some((m) => m.shortcode === fallbackItem.shortcode)) {
                kbMatches.push(fallbackItem);
              }
            }
            if (kbMatches.length > 0) {
              liveKbHighlights = kbMatches.slice(0, 3);
            }
          }
        }
      }
    } catch {
      // Fallback to INITIAL_KELURAHAN_INFOS
    }

    const syncedUrls = new Set(liveSyncedPosts.map((p) => p.instagramPostUrl).filter(Boolean));
    const customPosts = db.kelurahanInfos.filter(
      (i) =>
        i &&
        i.id &&
        !legacyIds.has(i.id) &&
        !i.id.startsWith('ig-latest-') &&
        !(i.instagramPostUrl && syncedUrls.has(i.instagramPostUrl)) &&
        !INITIAL_KELURAHAN_INFOS.some((init) => init.id === i.id)
    );
    db.kelurahanInfos = [...liveSyncedPosts, ...customPosts];
    saveDatabase(db);
    res.json({
      ok: true,
      handle: '@kelurahan.panaikang',
      syncedAt: getRealtimeTimeString(new Date()),
      data: db.kelurahanInfos,
      kerjaBaktiHighlights: liveKbHighlights,
    });
  });

  app.put('/api/infos/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.kelurahanInfos.findIndex((item) => item.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data informasi kelurahan tidak ditemukan.'] });
      return;
    }

    const merged: KelurahanInfoItem = {
      ...db.kelurahanInfos[idx],
      ...req.body,
    };
    if (!merged.summary || !merged.summary.trim()) {
      const cleanContent = (merged.content || '').trim();
      merged.summary =
        cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent;
    }

    const errors = validateKelurahanInfo(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.kelurahanInfos[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: db.kelurahanInfos[idx] });
  });

  app.delete('/api/infos/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.kelurahanInfos = db.kelurahanInfos.filter((item) => item.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 6. Urban Farming & Seed Requests
  app.get('/api/urban-farming', (_req, res) => {
    res.json({ ok: true, data: db.urbanFarmingSpots || INITIAL_URBAN_FARMING_SPOTS });
  });

  app.post('/api/urban-farming', (req, res) => {
    const incoming = req.body as Partial<UrbanFarmingSpot>;
    if (!incoming.name || !incoming.rw) {
      res.status(400).json({ ok: false, errors: ['Nama kebun dan wilayah RW wajib diisi.'] });
      return;
    }
    const created: UrbanFarmingSpot = {
      id: incoming.id || `uf-${Date.now()}`,
      name: incoming.name.trim(),
      rw: incoming.rw.trim(),
      rt: incoming.rt?.trim() || 'RT 01',
      locationAddress: incoming.locationAddress?.trim() || 'Kelurahan Panaikang',
      groupName: incoming.groupName?.trim() || `Kelompok Tani ${incoming.rw}`,
      coordinatorName: incoming.coordinatorName?.trim() || 'Koordinator Warga',
      coordinatorPhone: incoming.coordinatorPhone?.trim() || '0812-xxxx-xxxx',
      farmingType: incoming.farmingType || 'Hidroponik / NFT',
      commodities: Array.isArray(incoming.commodities) ? incoming.commodities : ['Pakcoy', 'Selada'],
      activeMembers: Number(incoming.activeMembers) || 12,
      monthlyProductionKg: Number(incoming.monthlyProductionKg) || 40,
      nextHarvestDate: incoming.nextHarvestDate?.trim() || 'Akhir Bulan Ini',
      harvestEstimatedKg: Number(incoming.harvestEstimatedKg) || 20,
      status: incoming.status || 'Aktif Produktif',
      description: incoming.description?.trim() || 'Kebun lorong produktif binaan warga.',
      photoUrl: incoming.photoUrl?.trim() || '/images/uf_kesadaran_rw07.jpg',
    };
    db.urbanFarmingSpots = [created, ...(db.urbanFarmingSpots || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/urban-farming/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.urbanFarmingSpots || []).findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Kebun urban farming tidak ditemukan.'] });
      return;
    }
    db.urbanFarmingSpots[idx] = {
      ...db.urbanFarmingSpots[idx],
      ...req.body,
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.urbanFarmingSpots[idx] });
  });

  app.delete('/api/urban-farming/:id', (req, res) => {
    const { id } = req.params;
    recordServerDeletedId(id);
    db.urbanFarmingSpots = (db.urbanFarmingSpots || []).filter((s) => s.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  app.get('/api/seed-requests', (_req, res) => {
    res.json({ ok: true, data: db.seedRequests || INITIAL_SEED_REQUESTS });
  });

  app.post('/api/seed-requests', (req, res) => {
    const incoming = req.body as Partial<SeedRequestItem>;
    if (!incoming.applicantName || !incoming.applicantPhone) {
      res.status(400).json({ ok: false, errors: ['Nama pemohon dan kontak telepon/WA wajib diisi.'] });
      return;
    }
    const created: SeedRequestItem = {
      id: incoming.id || `REQ-SEED-${Date.now()}`,
      applicantName: incoming.applicantName.trim(),
      applicantPhone: incoming.applicantPhone.trim(),
      rw: incoming.rw?.trim() || 'RW 01',
      rt: incoming.rt?.trim() || 'RT 01',
      address: incoming.address?.trim() || '',
      requestedSeeds: Array.isArray(incoming.requestedSeeds) ? incoming.requestedSeeds : ['Benih Sayuran Daun'],
      plantingMethod: incoming.plantingMethod?.trim() || 'Polybag Pekarangan',
      needsTraining: Boolean(incoming.needsTraining),
      status: incoming.status || 'Menunggu Pengambilan',
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · Baru Saja',
    };
    db.seedRequests = [created, ...(db.seedRequests || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/seed-requests/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.seedRequests || []).findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Permohonan bibit tidak ditemukan.'] });
      return;
    }
    db.seedRequests[idx] = {
      ...db.seedRequests[idx],
      ...req.body,
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.seedRequests[idx] });
  });

  app.delete('/api/seed-requests/:id', (req, res) => {
    const { id } = req.params;
    db.seedRequests = (db.seedRequests || []).filter((r) => r.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 6B. Full Urban Farming CRUD Endpoints
  // Locations
  app.get('/api/urban-farming/locations', (_req, res) => {
    res.json({ ok: true, data: db.urbanFarmingLocations || INITIAL_URBAN_FARMING_LOCATIONS });
  });
  app.post('/api/urban-farming/locations', (req, res) => {
    const item = req.body as UrbanFarmingLocation;
    if (!item.name || !item.rw) {
      res.status(400).json({ ok: false, errors: ['Nama lokasi dan wilayah RW wajib diisi.'] });
      return;
    }
    const newLoc: UrbanFarmingLocation = {
      ...item,
      id: item.id || `LOK-${Date.now()}`,
      recordedDate: item.recordedDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    db.urbanFarmingLocations = [newLoc, ...(db.urbanFarmingLocations || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newLoc });
  });
  app.put('/api/urban-farming/locations/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.urbanFarmingLocations || []).findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Lokasi tidak ditemukan.'] });
      return;
    }
    db.urbanFarmingLocations[idx] = { ...db.urbanFarmingLocations[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.urbanFarmingLocations[idx] });
  });
  app.delete('/api/urban-farming/locations/:id', (req, res) => {
    const { id } = req.params;
    db.urbanFarmingLocations = (db.urbanFarmingLocations || []).filter((l) => l.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Groups
  app.get('/api/urban-farming/groups', (_req, res) => {
    res.json({ ok: true, data: db.farmerGroups || INITIAL_FARMER_GROUPS });
  });
  app.post('/api/urban-farming/groups', (req, res) => {
    const item = req.body as FarmerGroup;
    if (!item.name || !item.leaderName) {
      res.status(400).json({ ok: false, errors: ['Nama kelompok dan nama ketua wajib diisi.'] });
      return;
    }
    const newGrp: FarmerGroup = {
      ...item,
      id: item.id || `KT-${Date.now()}`,
    };
    db.farmerGroups = [newGrp, ...(db.farmerGroups || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newGrp });
  });
  app.put('/api/urban-farming/groups/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.farmerGroups || []).findIndex((g) => g.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Kelompok tani tidak ditemukan.'] });
      return;
    }
    db.farmerGroups[idx] = { ...db.farmerGroups[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.farmerGroups[idx] });
  });
  app.delete('/api/urban-farming/groups/:id', (req, res) => {
    const { id } = req.params;
    db.farmerGroups = (db.farmerGroups || []).filter((g) => g.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Crops
  app.get('/api/urban-farming/crops', (_req, res) => {
    res.json({ ok: true, data: db.crops || INITIAL_CROPS });
  });
  app.post('/api/urban-farming/crops', (req, res) => {
    const item = req.body as CropItem;
    if (!item.name || !item.locationId) {
      res.status(400).json({ ok: false, errors: ['Nama tanaman dan lokasi wajib dipilih.'] });
      return;
    }
    const newCrop: CropItem = {
      ...item,
      id: item.id || `TNM-${Date.now()}`,
    };
    db.crops = [newCrop, ...(db.crops || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newCrop });
  });
  app.put('/api/urban-farming/crops/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.crops || []).findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data tanaman tidak ditemukan.'] });
      return;
    }
    db.crops[idx] = { ...db.crops[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.crops[idx] });
  });
  app.delete('/api/urban-farming/crops/:id', (req, res) => {
    const { id } = req.params;
    db.crops = (db.crops || []).filter((c) => c.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Care Logs
  app.get('/api/urban-farming/care-logs', (_req, res) => {
    res.json({ ok: true, data: db.plantCareLogs || INITIAL_PLANT_CARE_LOGS });
  });
  app.post('/api/urban-farming/care-logs', (req, res) => {
    const item = req.body as PlantCareLog;
    if (!item.activityType || !item.locationId) {
      res.status(400).json({ ok: false, errors: ['Jenis kegiatan dan lokasi wajib dipilih.'] });
      return;
    }
    const newLog: PlantCareLog = {
      ...item,
      id: item.id || `CR-${Date.now()}`,
      dateTime: item.dateTime || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · Baru Saja',
    };
    db.plantCareLogs = [newLog, ...(db.plantCareLogs || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newLog });
  });
  app.put('/api/urban-farming/care-logs/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.plantCareLogs || []).findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Log kegiatan tidak ditemukan.'] });
      return;
    }
    db.plantCareLogs[idx] = { ...db.plantCareLogs[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.plantCareLogs[idx] });
  });
  app.delete('/api/urban-farming/care-logs/:id', (req, res) => {
    const { id } = req.params;
    db.plantCareLogs = (db.plantCareLogs || []).filter((c) => c.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Harvests
  app.get('/api/urban-farming/harvests', (_req, res) => {
    res.json({ ok: true, data: db.harvestRecords || INITIAL_HARVEST_RECORDS });
  });
  app.post('/api/urban-farming/harvests', (req, res) => {
    const item = req.body as HarvestRecord;
    if (!item.yieldAmount || !item.unit) {
      res.status(400).json({ ok: false, errors: ['Jumlah hasil panen dan satuan wajib diisi.'] });
      return;
    }
    const newHarvest: HarvestRecord = {
      ...item,
      id: item.id || `HV-${Date.now()}`,
      harvestDate: item.harvestDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    db.harvestRecords = [newHarvest, ...(db.harvestRecords || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newHarvest });
  });
  app.put('/api/urban-farming/harvests/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.harvestRecords || []).findIndex((h) => h.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data panen tidak ditemukan.'] });
      return;
    }
    db.harvestRecords[idx] = { ...db.harvestRecords[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.harvestRecords[idx] });
  });
  app.delete('/api/urban-farming/harvests/:id', (req, res) => {
    const { id } = req.params;
    db.harvestRecords = (db.harvestRecords || []).filter((h) => h.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Inventories
  app.get('/api/urban-farming/inventories', (_req, res) => {
    res.json({ ok: true, data: db.farmingInventories || INITIAL_FARMING_INVENTORIES });
  });
  app.post('/api/urban-farming/inventories', (req, res) => {
    const item = req.body as FarmingInventoryItem;
    if (!item.itemName || !item.category) {
      res.status(400).json({ ok: false, errors: ['Nama barang dan kategori wajib diisi.'] });
      return;
    }
    const newInv: FarmingInventoryItem = {
      ...item,
      id: item.id || `INV-${Date.now()}`,
      recordedDate: item.recordedDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    db.farmingInventories = [newInv, ...(db.farmingInventories || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newInv });
  });
  app.put('/api/urban-farming/inventories/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.farmingInventories || []).findIndex((i) => i.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Barang inventaris tidak ditemukan.'] });
      return;
    }
    db.farmingInventories[idx] = { ...db.farmingInventories[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.farmingInventories[idx] });
  });
  app.delete('/api/urban-farming/inventories/:id', (req, res) => {
    const { id } = req.params;
    db.farmingInventories = (db.farmingInventories || []).filter((i) => i.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Supply Requests
  app.get('/api/urban-farming/supply-requests', (_req, res) => {
    res.json({ ok: true, data: db.supplyRequests || INITIAL_SUPPLY_REQUESTS });
  });
  app.post('/api/urban-farming/supply-requests', (req, res) => {
    const item = req.body as SupplyRequestItem;
    if (!item.itemNeeded || !item.requesterName) {
      res.status(400).json({ ok: false, errors: ['Nama pemohon dan kebutuhan wajib diisi.'] });
      return;
    }
    const newReq: SupplyRequestItem = {
      ...item,
      id: item.id || `AJU-${Date.now()}`,
      requestDate: item.requestDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: item.status || 'Diajukan',
    };
    db.supplyRequests = [newReq, ...(db.supplyRequests || [])];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newReq });
  });
  app.put('/api/urban-farming/supply-requests/:id', (req, res) => {
    const { id } = req.params;
    const idx = (db.supplyRequests || []).findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Pengajuan kebutuhan tidak ditemukan.'] });
      return;
    }
    db.supplyRequests[idx] = { ...db.supplyRequests[idx], ...req.body };
    saveDatabase(db);
    res.json({ ok: true, data: db.supplyRequests[idx] });
  });
  app.delete('/api/urban-farming/supply-requests/:id', (req, res) => {
    const { id } = req.params;
    db.supplyRequests = (db.supplyRequests || []).filter((s) => s.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // ============================================================================
  // REAL WEB TRAFFIC TELEMETRY & ANALYTICS ENGINE (100% Real Server & Client Data)
  // ============================================================================
  const TRAFFIC_FILE = path.join(DATA_DIR, 'traffic_analytics.json');
  const SERVER_START_TIME = Date.now();
  const activeVisitorHeartbeats = new Map<string, number>();

  interface StoredTrafficSession {
    sessionId: string;
    visitorId: string;
    firstSeenMs: number;
    lastSeenMs: number;
    hits: number;
  }

  interface StoredDailyBucket {
    dateIso: string; // YYYY-MM-DD
    pageviews: number;
    visitorIds: string[];
  }

  interface StoredRealtimeLog {
    id: string;
    timestamp: string;
    dateStr: string;
    visitorId?: string;
    page: string;
    pageTitle: string;
    deviceType: 'Mobile' | 'Desktop' | 'Tablet';
    platform: string;
    browser: string;
    locationHint: string;
    referrer: string;
    ipMasked: string;
  }

  interface StoredTrafficState {
    totalPageviews: number;
    uniqueVisitorIds: string[];
    sessions: Record<string, StoredTrafficSession>;
    pwaInstalls: number;
    dailyBuckets: Record<string, StoredDailyBucket>;
    pageStats: Record<string, { views: number; visitorIds: string[]; totalDurationSec: number; durationSamples: number }>;
    sourceCounts: Record<string, number>;
    deviceCounts: { mobile: number; desktop: number; tablet: number };
    browserCounts: Record<string, number>;
    realtimeLogs: StoredRealtimeLog[];
    lastUpdated: string;
  }

  const createEmptyTrafficState = (): StoredTrafficState => ({
    totalPageviews: 0,
    uniqueVisitorIds: [],
    sessions: {},
    pwaInstalls: 0,
    dailyBuckets: {},
    pageStats: {},
    sourceCounts: {},
    deviceCounts: { mobile: 0, desktop: 0, tablet: 0 },
    browserCounts: {},
    realtimeLogs: [],
    lastUpdated: new Date().toISOString(),
  });

  const loadTrafficState = (): StoredTrafficState => {
    try {
      if (fs.existsSync(TRAFFIC_FILE)) {
        const raw = fs.readFileSync(TRAFFIC_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<StoredTrafficState>;
        return {
          ...createEmptyTrafficState(),
          ...parsed,
          deviceCounts: {
            mobile: parsed.deviceCounts?.mobile ?? 0,
            desktop: parsed.deviceCounts?.desktop ?? 0,
            tablet: parsed.deviceCounts?.tablet ?? 0,
          },
          realtimeLogs: Array.isArray(parsed.realtimeLogs) ? parsed.realtimeLogs.slice(0, 60) : [],
        };
      }
    } catch (err) {
      console.error('Failed to read traffic_analytics.json:', err);
    }
    return createEmptyTrafficState();
  };

  let trafficState: StoredTrafficState = loadTrafficState();

  const saveTrafficState = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(TRAFFIC_FILE, JSON.stringify(trafficState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write traffic_analytics.json:', err);
    }
  };

  const getLocalIsoDate = (d = new Date()): string => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const map: Record<string, string> = {};
      for (const p of parts) {
        if (p.type !== 'literal') map[p.type] = p.value;
      }
      if (map.year && map.month && map.day) {
        return `${map.year}-${map.month}-${map.day}`;
      }
    } catch {}
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatShortIndoDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return isoDate;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const extractAndMaskClientIp = (req: express.Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    let rawIp = '';
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      rawIp = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      rawIp = forwarded[0].trim();
    } else {
      rawIp = req.socket?.remoteAddress || req.ip || '';
    }
    rawIp = rawIp.replace(/^::ffff:/, '');
    if (!rawIp || rawIp === '::1' || rawIp === '127.0.0.1') {
      return '127.0.0.1 (Local)';
    }
    const ipv4Parts = rawIp.split('.');
    if (ipv4Parts.length === 4) {
      return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.***`;
    }
    if (rawIp.includes(':')) {
      const ipv6Parts = rawIp.split(':').filter(Boolean);
      return `${ipv6Parts.slice(0, 2).join(':')}:****`;
    }
    return rawIp;
  };

  const PAGE_META_CATALOG: Record<string, { path: string; title: string }> = {
    beranda: { path: '/beranda', title: 'Beranda Utama Portal' },
    profil: { path: '/profil', title: 'Profil & Kelembagaan Kelurahan' },
    rtrw: { path: '/rtrw', title: 'Direktori RT/RW & Jadwal Siskamling' },
    warga: { path: '/warga', title: 'Layanan Pengurusan & E-Lapor Warga' },
    lurah: { path: '/lurah', title: 'Dashboard Eksekutif Lurah' },
    peta: { path: '/peta', title: 'Peta GIS Interaktif Panaikang' },
    sampah: { path: '/sampah', title: 'Monitoring Bank Sampah & Konservasi' },
    kerjabakti: { path: '/kerjabakti', title: 'Jadwal Kerja Bakti & Armada' },
    urbanfarming: { path: '/urbanfarming', title: 'Urban Farming & Ketahanan Pangan' },
    admin: { path: '/admin', title: 'Panel Administrator Kelurahan' },
  };

  const computeRealTrafficPayload = () => {
    const nowMs = Date.now();
    // Clean expired visitor heartbeats (> 2 minutes idle)
    for (const [vid, lastSeen] of activeVisitorHeartbeats.entries()) {
      if (nowMs - lastSeen > 2 * 60 * 1000) {
        activeVisitorHeartbeats.delete(vid);
      }
    }
    const activeVisitorsNow = Math.max(sseClients.size, activeVisitorHeartbeats.size);

    const todayIso = getLocalIsoDate(new Date());
    const todayBucket = trafficState.dailyBuckets[todayIso];
    const todayPageviews = todayBucket ? todayBucket.pageviews : 0;

    // Calculate real Avg Session Duration and Bounce Rate from real sessions
    const sessionList = Object.values(trafficState.sessions);
    let totalSessionDurationSec = 0;
    let bounceSessions = 0;
    for (const s of sessionList) {
      const durSec = Math.max(1, Math.round((s.lastSeenMs - s.firstSeenMs) / 1000));
      totalSessionDurationSec += Math.min(durSec, 3600);
      if (s.hits <= 1) {
        bounceSessions += 1;
      }
    }
    const avgSec = sessionList.length > 0 ? Math.round(totalSessionDurationSec / sessionList.length) : 0;
    const avgMin = Math.floor(avgSec / 60);
    const remSec = avgSec % 60;
    const avgSessionDuration = sessionList.length > 0 ? `${avgMin}m ${String(remSec).padStart(2, '0')}s` : '0m 00s';
    const bounceRate = sessionList.length > 0 ? Number(((bounceSessions / sessionList.length) * 100).toFixed(1)) : 0;

    // Build 14-day daily chart points from real recorded buckets
    const dailyPoints: Array<{ date: string; isoDate: string; pageviews: number; uniqueVisitors: number; sessions: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getLocalIsoDate(d);
      const bucket = trafficState.dailyBuckets[iso];
      const sessionsForDay = sessionList.filter((s) => getLocalIsoDate(new Date(s.firstSeenMs)) === iso).length;
      dailyPoints.push({
        date: formatShortIndoDate(iso),
        isoDate: iso,
        pageviews: bucket ? bucket.pageviews : 0,
        uniqueVisitors: bucket ? bucket.visitorIds.length : 0,
        sessions: sessionsForDay,
      });
    }

    // Build Top Pages from real recorded page hits + all portal routes
    const totalViewsSafe = Math.max(1, trafficState.totalPageviews);
    const allViewKeys = Object.keys(PAGE_META_CATALOG);
    const topPages = allViewKeys
      .map((viewKey) => {
        const meta = PAGE_META_CATALOG[viewKey];
        const stat = trafficState.pageStats[viewKey] || { views: 0, visitorIds: [], totalDurationSec: 0, durationSamples: 0 };
        const avgTimeSec = stat.durationSamples > 0 ? Math.round(stat.totalDurationSec / stat.durationSamples) : 0;
        const m = Math.floor(avgTimeSec / 60);
        const s = avgTimeSec % 60;
        return {
          path: meta.path,
          title: meta.title,
          views: stat.views,
          uniqueUsers: stat.visitorIds.length,
          avgTimeOnPage: stat.views > 0 ? (avgTimeSec > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : 'Aktif') : '0m 00s',
          percentage: trafficState.totalPageviews > 0 ? Number(((stat.views / totalViewsSafe) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.views - a.views);

    // Build Traffic Sources from real referrer telemetry
    const defaultSources = [
      { source: 'Direct URL / Bookmark Warga', color: '#059669' },
      { source: 'Google Search (Organik)', color: '#2563eb' },
      { source: 'WhatsApp Broadcast RT/RW', color: '#10b981' },
      { source: 'PWA Home Screen (Aplikasi)', color: '#7c3aed' },
      { source: 'Media Sosial & Rujukan Lainnya', color: '#f59e0b' },
    ];
    const totalSourceVisits = Math.max(
      1,
      Object.values(trafficState.sourceCounts).reduce((acc, v) => acc + v, 0)
    );
    const sources = defaultSources
      .map((item) => {
        const visits = trafficState.sourceCounts[item.source] || 0;
        return {
          source: item.source,
          visits,
          percentage: Object.values(trafficState.sourceCounts).some((v) => v > 0)
            ? Number(((visits / totalSourceVisits) * 100).toFixed(1))
            : 0,
          color: item.color,
        };
      })
      .sort((a, b) => b.visits - a.visits);

    // Build real RW 01 - RW 07 Activity Breakdown directly from actual database records
    const rwList = (db.rwGroups && db.rwGroups.length > 0
      ? db.rwGroups.map((g) => g.rwName)
      : ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07']
    ).slice(0, 7);

    const rwRawCounts = rwList.map((rwName) => {
      const rwShort = rwName.replace(/^RW\s*0?/i, '').trim(); // e.g. "1" or "01"
      const rwRegex = new RegExp(`\\bRW\\s*0?${rwShort}\\b`, 'i');

      const reportsCount = (db.reports || []).filter(
        (r) => rwRegex.test(r.rw || '') || rwRegex.test(r.locationName || '')
      ).length;
      const wasteUnitsCount = (db.wasteUnits || []).filter(
        (u) => rwRegex.test(u.rw || '') || rwRegex.test(u.locationLabel || '')
      ).length;
      const cleanupCount = (db.cleanupEvents || []).filter(
        (c) => rwRegex.test(c.rw || '') || rwRegex.test(c.locationName || '') || /Seluruh RW/i.test(c.rw || '')
      ).length;
      const farmingCount = (db.urbanFarmingSpots || []).filter(
        (f) => rwRegex.test(f.rw || '') || rwRegex.test(f.locationAddress || '')
      ).length;
      const seedCount = (db.seedRequests || []).filter(
        (s) => rwRegex.test(s.rw || '')
      ).length;
      const tebaCount = (db.tebaSpots || []).filter(
        (t) => rwRegex.test(t.rw || '') || rwRegex.test(t.address || '')
      ).length;
      const bioporiCount = (db.bioporiPoints || []).filter(
        (b) => rwRegex.test(b.rw || '') || rwRegex.test(b.address || '')
      ).length;
      const siskamlingCount = (db.siskamlingSchedules || []).filter(
        (sk) => rwRegex.test(sk.rw || '')
      ).length;

      const totalInteractions =
        reportsCount +
        wasteUnitsCount +
        cleanupCount +
        farmingCount +
        seedCount +
        tebaCount +
        bioporiCount +
        siskamlingCount;

      return {
        rw: rwName,
        sessions: totalInteractions,
        reportsSubmitted: reportsCount,
      };
    });

    const totalRwInteractions = Math.max(
      1,
      rwRawCounts.reduce((acc, r) => acc + r.sessions, 0)
    );
    const rwBreakdown = rwRawCounts.map((r) => ({
      rw: r.rw,
      sessions: r.sessions,
      reportsSubmitted: r.reportsSubmitted,
      percentage:
        rwRawCounts.some((x) => x.sessions > 0)
          ? Number(((r.sessions / totalRwInteractions) * 100).toFixed(1))
          : 0,
    }));

    // Build real Browser Breakdown from recorded browserCounts
    const totalBrowserHits = Math.max(
      1,
      Object.values(trafficState.browserCounts).reduce((acc, v) => acc + v, 0)
    );
    const browserBreakdown = Object.entries(trafficState.browserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Number(((count / totalBrowserHits) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalPageviews: trafficState.totalPageviews,
      uniqueVisitors: trafficState.uniqueVisitorIds.length,
      activeVisitorsNow,
      avgSessionDuration,
      bounceRate,
      todayPageviews,
      pwaInstalls: trafficState.pwaInstalls,
      dailyPoints,
      topPages,
      sources,
      deviceBreakdown: trafficState.deviceCounts,
      browserBreakdown,
      rwBreakdown,
      realtimeLogs: trafficState.realtimeLogs.slice(0, 50),
      lastUpdated: trafficState.lastUpdated,
      serverUptimeSec: Math.round((nowMs - SERVER_START_TIME) / 1000),
    };
  };

  app.get('/api/traffic', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, data: computeRealTrafficPayload() });
  });

  app.post('/api/traffic/hit', (req, res) => {
    const body = req.body || {};
    const viewKey = typeof body.view === 'string' && body.view.trim() ? body.view.trim() : 'beranda';
    const visitorId = typeof body.visitorId === 'string' && body.visitorId.trim() ? body.visitorId.trim() : `vis-${Date.now()}`;
    const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : `ses-${Date.now()}`;
    const deviceType: 'Mobile' | 'Desktop' | 'Tablet' =
      body.deviceType === 'Mobile' || body.deviceType === 'Tablet' || body.deviceType === 'Desktop'
        ? body.deviceType
        : 'Desktop';
    const platform = typeof body.platform === 'string' && body.platform.trim() ? body.platform.trim() : 'Web OS';
    const browser = typeof body.browser === 'string' && body.browser.trim() ? body.browser.trim() : 'Browser';
    const referrer = typeof body.referrer === 'string' && body.referrer.trim() ? body.referrer.trim() : 'Direct URL / Bookmark Warga';
    const locationHint = typeof body.locationHint === 'string' && body.locationHint.trim() ? body.locationHint.trim() : 'Makassar (WITA)';
    const prevPageView = typeof body.prevView === 'string' ? body.prevView.trim() : '';
    const prevPageDurationSec = typeof body.prevPageDurationSec === 'number' && body.prevPageDurationSec > 0 ? Math.min(body.prevPageDurationSec, 1800) : 0;

    const now = new Date();
    const nowMs = now.getTime();
    const todayIso = getLocalIsoDate(now);

    activeVisitorHeartbeats.set(visitorId, nowMs);

    // 1. Update total pageviews & unique visitors
    trafficState.totalPageviews += 1;
    if (!trafficState.uniqueVisitorIds.includes(visitorId)) {
      trafficState.uniqueVisitorIds.push(visitorId);
    }

    // 2. Update session tracking
    const existingSession = trafficState.sessions[sessionId];
    if (existingSession) {
      existingSession.lastSeenMs = nowMs;
      existingSession.hits += 1;
    } else {
      trafficState.sessions[sessionId] = {
        sessionId,
        visitorId,
        firstSeenMs: nowMs,
        lastSeenMs: nowMs,
        hits: 1,
      };
    }

    // 3. Update daily bucket for today
    if (!trafficState.dailyBuckets[todayIso]) {
      trafficState.dailyBuckets[todayIso] = {
        dateIso: todayIso,
        pageviews: 0,
        visitorIds: [],
      };
    }
    trafficState.dailyBuckets[todayIso].pageviews += 1;
    if (!trafficState.dailyBuckets[todayIso].visitorIds.includes(visitorId)) {
      trafficState.dailyBuckets[todayIso].visitorIds.push(visitorId);
    }

    // 4. Update page statistics
    if (!trafficState.pageStats[viewKey]) {
      trafficState.pageStats[viewKey] = {
        views: 0,
        visitorIds: [],
        totalDurationSec: 0,
        durationSamples: 0,
      };
    }
    trafficState.pageStats[viewKey].views += 1;
    if (!trafficState.pageStats[viewKey].visitorIds.includes(visitorId)) {
      trafficState.pageStats[viewKey].visitorIds.push(visitorId);
    }

    // Record time spent on previous page if reported by client
    if (prevPageView && prevPageDurationSec > 0 && trafficState.pageStats[prevPageView]) {
      trafficState.pageStats[prevPageView].totalDurationSec += prevPageDurationSec;
      trafficState.pageStats[prevPageView].durationSamples += 1;
    }

    // 5. Update traffic source only on first hit of session or every hit
    trafficState.sourceCounts[referrer] = (trafficState.sourceCounts[referrer] || 0) + 1;

    // 6. Update device & browser breakdown
    if (deviceType === 'Mobile') trafficState.deviceCounts.mobile += 1;
    else if (deviceType === 'Tablet') trafficState.deviceCounts.tablet += 1;
    else trafficState.deviceCounts.desktop += 1;

    trafficState.browserCounts[browser] = (trafficState.browserCounts[browser] || 0) + 1;

    // 7. Create real visitor log entry
    const meta = PAGE_META_CATALOG[viewKey] || { path: `/${viewKey}`, title: `Halaman ${viewKey}` };
    const timeStr = `${now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Makassar',
    })} WITA`;
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });

    const newLog: StoredRealtimeLog = {
      id: `VIS-${nowMs.toString().slice(-6)}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
      timestamp: timeStr,
      dateStr,
      visitorId,
      page: meta.path,
      pageTitle: meta.title,
      deviceType,
      platform,
      browser,
      locationHint,
      referrer,
      ipMasked: extractAndMaskClientIp(req),
    };

    trafficState.realtimeLogs = [newLog, ...trafficState.realtimeLogs.slice(0, 59)];
    trafficState.lastUpdated = now.toISOString();

    saveTrafficState();

    const payload = computeRealTrafficPayload();
    const sseMsg = `event: traffic_update\ndata: ${JSON.stringify({ timestamp: trafficState.lastUpdated, data: payload })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(sseMsg);
      } catch {
        sseClients.delete(client);
      }
    });

    res.json({ ok: true, data: payload });
  });

  app.post('/api/traffic/pwa-install', (req, res) => {
    const isStandalone = Boolean(req.body?.standalone);
    if (isStandalone || req.body?.event === 'appinstalled') {
      trafficState.pwaInstalls += 1;
      trafficState.lastUpdated = new Date().toISOString();
      saveTrafficState();
    }
    const payload = computeRealTrafficPayload();
    res.json({ ok: true, data: payload });
  });

  app.post('/api/traffic/reset', (_req, res) => {
    trafficState = createEmptyTrafficState();
    activeVisitorHeartbeats.clear();
    saveTrafficState();
    const payload = computeRealTrafficPayload();
    const sseMsg = `event: traffic_update\ndata: ${JSON.stringify({ timestamp: trafficState.lastUpdated, data: payload })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(sseMsg);
      } catch {
        sseClients.delete(client);
      }
    });
    res.json({ ok: true, data: payload });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html') || filePath.endsWith('version.json')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listenWithRetry = (retriesLeft = 5) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Panaikang Smart Environment Full-Stack Server running on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`[Server] Port ${PORT} masih digunakan, mencoba ulang dalam 500ms...`);
        setTimeout(() => {
          try {
            server.close();
          } catch {}
          listenWithRetry(retriesLeft - 1);
        }, 500);
        return;
      }
      console.error('[Server] HTTP server error:', err);
    });
  };

  listenWithRetry();
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});
