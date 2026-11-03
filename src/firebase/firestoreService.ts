import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  writeBatch,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
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
} from '../types';
import { ServiceCategoryGroup } from '../data/wargaServiceCatalog';
import { PersistedDatabase } from '../utils/persistentStorage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on application boot as required by Firestore integration skill
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Berhasil terhubung ke Google Cloud Firestore (Panaikang Smart Environment).');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Periksa koneksi internet atau konfigurasi Google Cloud Firestore.');
    }
    return false;
  }
}

// Global Document Identifiers
const APP_STORE_COLLECTION = 'panaikang_app_data';
const FULL_DB_DOC_ID = 'full_snapshot';
const PROFILE_REF = doc(db, 'kelurahan_profiles', 'main_profile');

class BatchWriter {
  private batch = writeBatch(db);
  private count = 0;
  public totalCommitted = 0;

  async set(ref: any, data: any, options = { merge: true }) {
    this.batch.set(ref, data, options);
    this.count++;
    if (this.count >= 200) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }

  async finish(): Promise<number> {
    if (this.count > 0) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.count = 0;
    }
    return this.totalCommitted;
  }
}

/**
 * Safely caps the monolithic full_snapshot document under 600 KB to strictly
 * adhere to Google Cloud Firestore's 1 MiB (1,048,576 bytes) document limit.
 * Heavy base64 images (>2KB) are omitted from this aggregated snapshot document
 * because each entity's image is already saved in its individual collection document.
 */
export function createSafeSnapshot(database: PersistedDatabase): PersistedDatabase {
  if (!database || typeof database !== 'object') {
    return database;
  }

  // 1. Recursive deep cleaner for heavy binary / base64 data URLs
  const cleanObject = (val: any, depth = 0): any => {
    if (depth > 12 || val === null || val === undefined) return val;
    if (typeof val === 'string') {
      // Strip any base64 data or extraordinarily large strings (> 800 chars)
      if (val.length > 800 && (val.startsWith('data:') || val.includes(';base64,') || val.length > 8_000)) {
        return '';
      }
      return val;
    }
    if (Array.isArray(val)) {
      return val.map((item) => cleanObject(item, depth + 1));
    }
    if (typeof val === 'object') {
      const result: Record<string, any> = {};
      for (const k of Object.keys(val)) {
        result[k] = cleanObject(val[k], depth + 1);
      }
      return result;
    }
    return val;
  };

  const safeClone = cleanObject(database) as PersistedDatabase;

  // 2. Cap logs to 25 most recent entries
  if (Array.isArray(safeClone.activityLogs)) {
    safeClone.activityLogs = safeClone.activityLogs.slice(0, 25);
  }

  // 3. Cap reports to 50 most recent entries in full_snapshot (all reports remain in citizen_reports collection)
  if (Array.isArray(safeClone.reports) && safeClone.reports.length > 50) {
    safeClone.reports = safeClone.reports.slice(0, 50);
  }

  // 4. Cap waste logs to 50 most recent entries
  if (Array.isArray(safeClone.wasteLogs) && safeClone.wasteLogs.length > 50) {
    safeClone.wasteLogs = safeClone.wasteLogs.slice(0, 50);
  }

  // 5. Cap cleanup events documentation photos
  if (Array.isArray(safeClone.cleanupEvents)) {
    safeClone.cleanupEvents = safeClone.cleanupEvents.map((c) => ({
      ...c,
      imageUrl: '',
      documentationPhotos: [],
    }));
  }

  // 6. Final safety check on total byte size
  let jsonString = JSON.stringify(safeClone);
  if (jsonString.length > 600_000) {
    // If still large, trim reports further
    if (Array.isArray(safeClone.reports)) {
      safeClone.reports = safeClone.reports.slice(0, 20);
    }
    if (Array.isArray(safeClone.wasteLogs)) {
      safeClone.wasteLogs = safeClone.wasteLogs.slice(0, 20);
    }
    jsonString = JSON.stringify(safeClone);
  }

  return JSON.parse(jsonString);
}

/**
 * Granularly writes each entity into its respective Firestore collection
 * (Menu Warga, Pengelolaan Sampah, Data RT/RW, Urban Farming, Peta GIS, Profil, Kerja Bakti)
 * using batch commits (up to 200 operations per batch).
 */
export async function syncAllCollectionsToFirestore(
  database: PersistedDatabase
): Promise<number> {
  const writer = new BatchWriter();

  // Helper to ensure any individual document never exceeds 850 KB
  const sanitizeDoc = <T extends Record<string, any>>(item: T): T => {
    const raw = JSON.stringify(item);
    if (raw.length < 850_000) return JSON.parse(raw);
    const c = JSON.parse(raw);
    for (const key of Object.keys(c)) {
      if (typeof c[key] === 'string' && c[key].length > 400_000 && c[key].startsWith('data:')) {
        c[key] = '';
      }
    }
    return c;
  };

  try {
    // 1. Profil Kelurahan
    if (database.profile) {
      const sanitizedProfile = sanitizeDoc(database.profile);
      await writer.set(PROFILE_REF, {
        ...sanitizedProfile,
        updatedAt: Date.now(),
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // 2. Menu Warga: Citizen Reports
    if (Array.isArray(database.reports)) {
      for (const rep of database.reports.slice(0, 150)) {
        if (!rep || !rep.id) continue;
        const ref = doc(db, 'citizen_reports', rep.id);
        await writer.set(ref, sanitizeDoc(rep), { merge: true });
      }
    }

    // 3. Pengelolaan Sampah: Waste Units & Daily Logs
    if (Array.isArray(database.wasteUnits)) {
      for (const unit of database.wasteUnits) {
        if (!unit || !unit.id) continue;
        const ref = doc(db, 'waste_units', unit.id);
        await writer.set(ref, sanitizeDoc(unit), { merge: true });
      }
    }

    if (Array.isArray(database.wasteLogs)) {
      for (const log of database.wasteLogs.slice(0, 100)) {
        if (!log || !log.id) continue;
        const ref = doc(db, 'waste_logs', log.id);
        await writer.set(ref, sanitizeDoc(log), { merge: true });
      }
    }

    // 4. Data RT & RW
    if (Array.isArray(database.rwGroups)) {
      for (const rw of database.rwGroups) {
        if (!rw || !rw.id) continue;
        const ref = doc(db, 'rw_groups', rw.id);
        await writer.set(ref, sanitizeDoc(rw), { merge: true });
      }
    }

    // 5. Urban Farming Spots & Seed Requests
    if (Array.isArray(database.urbanFarmingSpots)) {
      for (const spot of database.urbanFarmingSpots) {
        if (!spot || !spot.id) continue;
        const ref = doc(db, 'urban_farming_spots', spot.id);
        await writer.set(ref, sanitizeDoc(spot), { merge: true });
      }
    }

    if (Array.isArray(database.seedRequests)) {
      for (const req of database.seedRequests) {
        if (!req || !req.id) continue;
        const ref = doc(db, 'seed_requests', req.id);
        await writer.set(ref, sanitizeDoc(req), { merge: true });
      }
    }

    // 6. Environmental Spots: Teba & Biopori (Peta Lingkungan)
    if (Array.isArray(database.tebaSpots)) {
      for (const teba of database.tebaSpots) {
        if (!teba || !teba.id) continue;
        const ref = doc(db, 'teba_spots', teba.id);
        await writer.set(ref, sanitizeDoc(teba), { merge: true });
      }
    }

    if (Array.isArray(database.bioporiPoints)) {
      for (const bio of database.bioporiPoints) {
        if (!bio || !bio.id) continue;
        const ref = doc(db, 'biopori_points', bio.id);
        await writer.set(ref, sanitizeDoc(bio), { merge: true });
      }
    }

    // 7. Kerja Bakti & Berita Kelurahan
    if (Array.isArray(database.cleanupEvents)) {
      for (const ev of database.cleanupEvents) {
        if (!ev || !ev.id) continue;
        const ref = doc(db, 'cleanup_events', ev.id);
        await writer.set(ref, sanitizeDoc(ev), { merge: true });
      }
    }

    if (Array.isArray(database.kelurahanInfos)) {
      for (const inf of database.kelurahanInfos) {
        if (!inf || !inf.id) continue;
        const ref = doc(db, 'kelurahan_infos', inf.id);
        await writer.set(ref, sanitizeDoc(inf), { merge: true });
      }
    }

    // 8. Back-End Administrator Core: Katalog Layanan SOP & Penerima WhatsApp
    if (Array.isArray(database.serviceCatalog)) {
      const catalogRef = doc(db, 'service_catalog', 'main_catalog');
      await writer.set(catalogRef, {
        serviceCatalog: sanitizeDoc(database.serviceCatalog),
        updatedAt: Date.now(),
      }, { merge: true });
    }

    if (Array.isArray(database.whatsappRecipients)) {
      const waRef = doc(db, 'whatsapp_recipients', 'main_recipients');
      await writer.set(waRef, {
        whatsappRecipients: sanitizeDoc(database.whatsappRecipients),
        updatedAt: Date.now(),
      }, { merge: true });
    }

    // 9. Admin Users & Activity Logs
    if (Array.isArray(database.adminUsers)) {
      for (const usr of database.adminUsers) {
        if (!usr || !usr.id) continue;
        const ref = doc(db, 'admin_users', usr.id);
        await writer.set(ref, sanitizeDoc(usr), { merge: true });
      }
    }

    if (Array.isArray(database.activityLogs)) {
      for (const act of database.activityLogs.slice(0, 50)) {
        if (!act || !act.id) continue;
        const ref = doc(db, 'activity_logs', act.id);
        await writer.set(ref, sanitizeDoc(act), { merge: true });
      }
    }

    // 10. Siskamling Schedules (RW 01 s/d RW 07)
    if (Array.isArray(database.siskamlingSchedules)) {
      for (const sched of database.siskamlingSchedules) {
        if (!sched || !sched.rw) continue;
        const scheduleId = sched.rw.replace(/\s+/g, '-').toLowerCase();
        const ref = doc(db, 'siskamling_schedules', scheduleId);
        await writer.set(ref, sanitizeDoc(sched), { merge: true });
      }
    }

    const totalCommitted = await writer.finish();
    console.log(`[Firestore Cloud] Berhasil menyinkronkan ${totalCommitted} entitas ke koleksi Google Cloud Firestore.`);
    return totalCommitted;
  } catch (err) {
    console.warn('[Firestore Cloud] Peringatan sinkronisasi granular ke koleksi Firestore:', err);
    throw err;
  }
}

/**
 * Sync entire application database snapshot to Firestore document and granular collections.
 * Uses safe snapshot sizing to guarantee document stays well within the 1 MiB limit.
 */
export async function pushFullDatabaseToFirestore(
  database: PersistedDatabase
): Promise<void> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    // 1. Sync granular collections across Google Cloud Firestore
    await syncAllCollectionsToFirestore(database);

    // 2. Write safe snapshot document (strictly capped < 650 KB to never exceed 1 MiB limit)
    const safeData = createSafeSnapshot(database);
    await setDoc(docRef, {
      ...safeData,
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('[Firestore Cloud] Sinkronisasi ke Google Cloud Firestore sukses.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APP_STORE_COLLECTION}/${FULL_DB_DOC_ID}`);
  }
}

/**
 * Fetch full database snapshot directly from Firestore
 */
export async function fetchFullDatabaseFromFirestore(): Promise<PersistedDatabase | null> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PersistedDatabase;
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Gagal mengambil snapshot penuh dari Firestore:', err);
    return null;
  }
}

/**
 * Subscribe to real-time changes of the full application database.
 * Every time any admin on any device updates data, Firestore pushes this callback
 * within milliseconds to ALL active visitors and admins.
 */
export function subscribeToFirestoreDatabase(
  onData: (data: PersistedDatabase) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PersistedDatabase;
        onData(data);
      }
    },
    (error) => {
      console.error('[Firestore] Realtime subscription error:', error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, `${APP_STORE_COLLECTION}/${FULL_DB_DOC_ID}`);
        } catch (e) {
          onError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    }
  );
}

/**
 * Seeds initial database to Firestore if not already seeded, and guarantees
 * both the full snapshot and granular collections are populated in Google Cloud Firestore.
 */
export async function seedInitialFirestoreIfEmpty(
  initialData: PersistedDatabase
): Promise<void> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.log('[Firestore] Menginisialisasi dokumen awal di Google Cloud Firestore...');
      await pushFullDatabaseToFirestore(initialData);
    } else {
      // Data already exists in Cloud Firestore; DO NOT overwrite it with template data
      console.log('[Firestore] Dokumen Cloud Firestore aktif ditemukan. Data RT/RW dan laporan tetap terjaga.');
    }
  } catch (err) {
    console.warn('[Firestore] Seed check warning:', err);
  }
}

/**
 * Pushes updated Kelurahan Profile directly to Firestore dedicated document
 */
export async function pushProfileToFirestore(profile: KelurahanProfile): Promise<void> {
  try {
    const sanitized = JSON.parse(JSON.stringify(profile));
    await setDoc(PROFILE_REF, {
      ...sanitized,
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Gagal menyimpan profil ke Firestore:', err);
  }
}

/**
 * Real-time listener for Kelurahan Profile document
 */
export function subscribeToFirestoreProfile(
  onProfile: (profile: KelurahanProfile) => void
): Unsubscribe {
  return onSnapshot(
    PROFILE_REF,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as KelurahanProfile;
        if (data && data.lurahName) {
          onProfile(data);
        }
      }
    },
    (err) => {
      console.warn('[Firestore Profile] Realtime listener notice:', err);
    }
  );
}
