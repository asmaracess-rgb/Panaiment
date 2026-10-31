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

/**
 * Granularly writes each entity into its respective Firestore collection
 * (Menu Warga, Pengelolaan Sampah, Data RT/RW, Urban Farming, Peta GIS, Profil, Kerja Bakti)
 * using batch commits (up to 500 operations per batch).
 */
export async function syncAllCollectionsToFirestore(
  database: PersistedDatabase
): Promise<void> {
  try {
    const batch = writeBatch(db);
    let opCount = 0;

    // 1. Profil Kelurahan
    if (database.profile) {
      const sanitizedProfile = JSON.parse(JSON.stringify(database.profile));
      batch.set(PROFILE_REF, {
        ...sanitizedProfile,
        updatedAt: Date.now(),
        syncedAt: new Date().toISOString(),
      }, { merge: true });
      opCount++;
    }

    // 2. Menu Warga: Citizen Reports
    if (Array.isArray(database.reports)) {
      for (const rep of database.reports.slice(0, 100)) {
        if (!rep || !rep.id) continue;
        const ref = doc(db, 'citizen_reports', rep.id);
        batch.set(ref, JSON.parse(JSON.stringify(rep)), { merge: true });
        opCount++;
      }
    }

    // 3. Pengelolaan Sampah: Waste Units & Daily Logs
    if (Array.isArray(database.wasteUnits)) {
      for (const unit of database.wasteUnits) {
        if (!unit || !unit.id) continue;
        const ref = doc(db, 'waste_units', unit.id);
        batch.set(ref, JSON.parse(JSON.stringify(unit)), { merge: true });
        opCount++;
      }
    }

    if (Array.isArray(database.wasteLogs)) {
      for (const log of database.wasteLogs.slice(0, 60)) {
        if (!log || !log.id) continue;
        const ref = doc(db, 'waste_logs', log.id);
        batch.set(ref, JSON.parse(JSON.stringify(log)), { merge: true });
        opCount++;
      }
    }

    // 4. Data RT & RW
    if (Array.isArray(database.rwGroups)) {
      for (const rw of database.rwGroups) {
        if (!rw || !rw.id) continue;
        const ref = doc(db, 'rw_groups', rw.id);
        batch.set(ref, JSON.parse(JSON.stringify(rw)), { merge: true });
        opCount++;
      }
    }

    // 5. Urban Farming Spots & Seed Requests
    if (Array.isArray(database.urbanFarmingSpots)) {
      for (const spot of database.urbanFarmingSpots) {
        if (!spot || !spot.id) continue;
        const ref = doc(db, 'urban_farming_spots', spot.id);
        batch.set(ref, JSON.parse(JSON.stringify(spot)), { merge: true });
        opCount++;
      }
    }

    if (Array.isArray(database.seedRequests)) {
      for (const req of database.seedRequests) {
        if (!req || !req.id) continue;
        const ref = doc(db, 'seed_requests', req.id);
        batch.set(ref, JSON.parse(JSON.stringify(req)), { merge: true });
        opCount++;
      }
    }

    // 6. Environmental Spots: Teba & Biopori (Peta Lingkungan)
    if (Array.isArray(database.tebaSpots)) {
      for (const teba of database.tebaSpots) {
        if (!teba || !teba.id) continue;
        const ref = doc(db, 'teba_spots', teba.id);
        batch.set(ref, JSON.parse(JSON.stringify(teba)), { merge: true });
        opCount++;
      }
    }

    if (Array.isArray(database.bioporiPoints)) {
      for (const bio of database.bioporiPoints) {
        if (!bio || !bio.id) continue;
        const ref = doc(db, 'biopori_points', bio.id);
        batch.set(ref, JSON.parse(JSON.stringify(bio)), { merge: true });
        opCount++;
      }
    }

    // 7. Kerja Bakti & Berita Kelurahan
    if (Array.isArray(database.cleanupEvents)) {
      for (const ev of database.cleanupEvents) {
        if (!ev || !ev.id) continue;
        const ref = doc(db, 'cleanup_events', ev.id);
        batch.set(ref, JSON.parse(JSON.stringify(ev)), { merge: true });
        opCount++;
      }
    }

    if (Array.isArray(database.kelurahanInfos)) {
      for (const inf of database.kelurahanInfos) {
        if (!inf || !inf.id) continue;
        const ref = doc(db, 'kelurahan_infos', inf.id);
        batch.set(ref, JSON.parse(JSON.stringify(inf)), { merge: true });
        opCount++;
      }
    }

    // 8. Back-End Administrator Core: Katalog Layanan SOP & Penerima WhatsApp
    if (Array.isArray(database.serviceCatalog)) {
      const catalogRef = doc(db, 'service_catalog', 'main_catalog');
      batch.set(catalogRef, {
        serviceCatalog: JSON.parse(JSON.stringify(database.serviceCatalog)),
        updatedAt: Date.now(),
      }, { merge: true });
      opCount++;
    }

    if (Array.isArray(database.whatsappRecipients)) {
      const waRef = doc(db, 'whatsapp_recipients', 'main_recipients');
      batch.set(waRef, {
        whatsappRecipients: JSON.parse(JSON.stringify(database.whatsappRecipients)),
        updatedAt: Date.now(),
      }, { merge: true });
      opCount++;
    }

    // 9. Admin Users & Activity Logs
    if (Array.isArray(database.adminUsers)) {
      for (const usr of database.adminUsers) {
        if (!usr || !usr.id) continue;
        const ref = doc(db, 'admin_users', usr.id);
        batch.set(ref, JSON.parse(JSON.stringify(usr)), { merge: true });
        opCount++;
      }
    }

    if (Array.isArray(database.activityLogs)) {
      for (const act of database.activityLogs.slice(0, 40)) {
        if (!act || !act.id) continue;
        const ref = doc(db, 'activity_logs', act.id);
        batch.set(ref, JSON.parse(JSON.stringify(act)), { merge: true });
        opCount++;
      }
    }

    if (opCount > 0) {
      await batch.commit();
      console.log(`[Firestore Cloud] Berhasil menyinkronkan ${opCount} entitas ke koleksi Google Cloud Firestore.`);
    }
  } catch (err) {
    console.warn('[Firestore Cloud] Peringatan sinkronisasi granular ke koleksi Firestore:', err);
  }
}

/**
 * Sync entire application database snapshot to Firestore document and granular collections.
 * This guarantees a single source of truth accessible by all devices instantly.
 */
export async function pushFullDatabaseToFirestore(
  database: PersistedDatabase
): Promise<void> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const sanitized = JSON.parse(JSON.stringify(database));
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    }, { merge: true });

    // Also trigger granular collection synchronization non-blockingly
    syncAllCollectionsToFirestore(database).catch((err) => {
      console.warn('[Firestore Cloud] Granular sync notice:', err);
    });
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
      console.log('[Firestore] Database Firestore kosong, melakukan initial seeding seluruh modul ke Cloud...');
      await pushFullDatabaseToFirestore(initialData);
    } else {
      // Ensure profile and granular collections are also synchronized
      syncAllCollectionsToFirestore(initialData).catch(() => {});
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
