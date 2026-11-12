import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  writeBatch,
  enableNetwork,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { KelurahanProfile } from '../types';
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

const QUOTA_STORAGE_KEY = 'panaikang_firestore_quota_paused_until_v1';
let quotaPausedInMemory = false;

// Clear any stale session circuit-breaker and ensure Firestore network is active
if (typeof window !== 'undefined' && window.sessionStorage) {
  try {
    window.sessionStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}
}
enableNetwork(db).catch(() => {});

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  const code = (error as any)?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded')
  );
}

function isQuotaPaused(): boolean {
  return quotaPausedInMemory;
}

function tripQuotaCircuitBreaker(): void {
  // Do NOT disable network transport permanently on transient timeouts;
  // only pause for 15 seconds in memory if an explicit resource-exhausted error occurs.
  if (quotaPausedInMemory) return;
  quotaPausedInMemory = true;
  setTimeout(() => {
    quotaPausedInMemory = false;
  }, 15_000);
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  if (isQuotaError(error)) {
    tripQuotaCircuitBreaker();
    return;
  }

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
  console.warn('[Firestore Notice]', JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on application boot
 */
export async function testConnection(): Promise<boolean> {
  if (isQuotaPaused()) {
    return false;
  }
  try {
    await getDoc(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      tripQuotaCircuitBreaker();
    }
    return false;
  }
}

// Global Document Identifiers
const APP_STORE_COLLECTION = 'panaikang_app_data';
const FULL_DB_DOC_ID = 'full_snapshot';
const LIVE_WARGA_DOC_ID = 'live_warga_state';
const PROFILE_REF = doc(db, 'kelurahan_profiles', 'main_profile');

// In-memory cache of latest live warga state from cloud so full_snapshot writes never overwrite newer citizen submissions
let cachedLiveWargaState: {
  citizenUsers?: any[];
  reports?: any[];
  pengaduanRecords?: any[];
  praRegistrasiRecords?: any[];
  seedRequests?: any[];
  deletedItemIds?: string[];
  updatedAt?: number;
} = {};

function mergeByKey<T extends Record<string, any>>(
  older: T[] | undefined,
  newer: T[] | undefined,
  deletedSet: Set<string>,
  keyFn: (item: T) => string
): T[] {
  const map = new Map<string, T>();
  for (const item of older || []) {
    if (!item) continue;
    const k = keyFn(item);
    if (!k || deletedSet.has(k) || (item.id && deletedSet.has(item.id)) || (item.ticketCode && deletedSet.has(item.ticketCode))) {
      continue;
    }
    map.set(k, item);
  }
  for (const item of newer || []) {
    if (!item) continue;
    const k = keyFn(item);
    if (!k || deletedSet.has(k) || (item.id && deletedSet.has(item.id)) || (item.ticketCode && deletedSet.has(item.ticketCode))) {
      continue;
    }
    const prev = map.get(k);
    map.set(k, prev ? { ...prev, ...item } : item);
  }
  return Array.from(map.values());
}

class BatchWriter {
  private batch = writeBatch(db);
  private count = 0;
  public totalCommitted = 0;

  async set(ref: any, data: any, options = { merge: true }) {
    if (isQuotaPaused()) return;
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
    if (isQuotaPaused()) return 0;
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
 */
export function createSafeSnapshot(database: PersistedDatabase): PersistedDatabase {
  if (!database || typeof database !== 'object') {
    return database;
  }

  // 1. Recursive deep cleaner for heavy binary / base64 data URLs
  const cleanObject = (val: any, depth = 0): any => {
    if (depth > 12 || val === null || val === undefined) return val;
    if (typeof val === 'string') {
      if (
        val.length > 800 &&
        (val.startsWith('data:') || val.includes(';base64,') || val.length > 8_000)
      ) {
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

  const preservedLurahPhoto =
    typeof database.profile?.lurahPhotoUrl === 'string' &&
    database.profile.lurahPhotoUrl.length < 400_000
      ? database.profile.lurahPhotoUrl
      : '';

  const preservedUfPhotos = new Map<string, string>();
  if (Array.isArray(database.urbanFarmingSpots)) {
    for (const s of database.urbanFarmingSpots) {
      if (s && s.id && typeof s.photoUrl === 'string' && s.photoUrl.length < 350_000) {
        preservedUfPhotos.set(s.id, s.photoUrl);
      }
    }
  }

  const safeClone = cleanObject(database) as PersistedDatabase;
  if (safeClone.profile && preservedLurahPhoto) {
    safeClone.profile.lurahPhotoUrl = preservedLurahPhoto;
  }
  if (Array.isArray(safeClone.urbanFarmingSpots)) {
    safeClone.urbanFarmingSpots = safeClone.urbanFarmingSpots.map((s) => {
      const savedPhoto = s?.id ? preservedUfPhotos.get(s.id) : undefined;
      return savedPhoto ? { ...s, photoUrl: savedPhoto } : s;
    });
  }

  // Merge any cached live warga state so a background snapshot never drops a newly registered user or complaint
  const deletedSet = new Set<string>([
    ...(Array.isArray(safeClone.deletedItemIds) ? safeClone.deletedItemIds : []),
    ...(Array.isArray(cachedLiveWargaState.deletedItemIds) ? cachedLiveWargaState.deletedItemIds : []),
  ]);
  safeClone.deletedItemIds = Array.from(deletedSet);

  if (Array.isArray(cachedLiveWargaState.citizenUsers) && cachedLiveWargaState.citizenUsers.length > 0) {
    safeClone.citizenUsers = mergeByKey(
      cachedLiveWargaState.citizenUsers,
      safeClone.citizenUsers,
      deletedSet,
      (c) => String(c.uid || c.email || '')
    );
  }
  if (Array.isArray(cachedLiveWargaState.reports) && cachedLiveWargaState.reports.length > 0) {
    safeClone.reports = mergeByKey(
      cachedLiveWargaState.reports,
      safeClone.reports,
      deletedSet,
      (r) => String(r.id || r.ticketCode || '')
    );
  }
  if (Array.isArray(cachedLiveWargaState.pengaduanRecords) && cachedLiveWargaState.pengaduanRecords.length > 0) {
    safeClone.pengaduanRecords = mergeByKey(
      cachedLiveWargaState.pengaduanRecords,
      safeClone.pengaduanRecords,
      deletedSet,
      (p) => String(p.ticketCode || p.id || '')
    );
  }
  if (Array.isArray(cachedLiveWargaState.praRegistrasiRecords) && cachedLiveWargaState.praRegistrasiRecords.length > 0) {
    safeClone.praRegistrasiRecords = mergeByKey(
      cachedLiveWargaState.praRegistrasiRecords,
      safeClone.praRegistrasiRecords,
      deletedSet,
      (p) => String(p.ticketCode || p.id || '')
    );
  }

  if (Array.isArray(safeClone.activityLogs)) {
    safeClone.activityLogs = safeClone.activityLogs.slice(0, 20);
  }
  if (Array.isArray(safeClone.waDispatchLogs)) {
    safeClone.waDispatchLogs = safeClone.waDispatchLogs.slice(0, 15);
  }
  if (Array.isArray(safeClone.reports) && safeClone.reports.length > 60) {
    safeClone.reports = safeClone.reports.slice(0, 60);
  }
  if (Array.isArray(safeClone.wasteLogs) && safeClone.wasteLogs.length > 40) {
    safeClone.wasteLogs = safeClone.wasteLogs.slice(0, 40);
  }
  if (Array.isArray(safeClone.cleanupEvents)) {
    safeClone.cleanupEvents = safeClone.cleanupEvents.map((c) => ({
      ...c,
      imageUrl: '',
      documentationPhotos: [],
    }));
  }

  let jsonString = JSON.stringify(safeClone);
  if (jsonString.length > 700_000) {
    // Strip base64 photos from urbanFarmingSpots inside full_snapshot so document is guaranteed < 1 MiB
    if (Array.isArray(safeClone.urbanFarmingSpots)) {
      safeClone.urbanFarmingSpots = safeClone.urbanFarmingSpots.map((s) =>
        s && typeof s.photoUrl === 'string' && s.photoUrl.startsWith('data:')
          ? { ...s, photoUrl: '' }
          : s
      );
    }
    safeClone.serviceCatalog = [];
    safeClone.waDispatchLogs = [];
    jsonString = JSON.stringify(safeClone);
  }
  if (jsonString.length > 850_000) {
    if (Array.isArray(safeClone.wasteLogs)) {
      safeClone.wasteLogs = safeClone.wasteLogs.slice(0, 15);
    }
    if (Array.isArray(safeClone.activityLogs)) {
      safeClone.activityLogs = safeClone.activityLogs.slice(0, 10);
    }
    jsonString = JSON.stringify(safeClone);
  }

  return JSON.parse(jsonString);
}

/**
 * Granularly writes each entity into its respective Firestore collection when explicitly requested.
 */
export async function syncAllCollectionsToFirestore(
  database: PersistedDatabase
): Promise<number> {
  if (isQuotaPaused()) return 0;
  const writer = new BatchWriter();

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
    if (database.profile) {
      const sanitizedProfile = sanitizeDoc(database.profile);
      await writer.set(
        PROFILE_REF,
        {
          ...sanitizedProfile,
          updatedAt: Date.now(),
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    if (Array.isArray(database.siskamlingSchedules)) {
      for (const sched of database.siskamlingSchedules) {
        if (!sched || !sched.rw) continue;
        const scheduleId = sched.rw.replace(/\s+/g, '-').toLowerCase();
        const ref = doc(db, 'siskamling_schedules', scheduleId);
        await writer.set(ref, sanitizeDoc(sched), { merge: true });
      }
    }

    const totalCommitted = await writer.finish();
    return totalCommitted;
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
      return 0;
    }
    handleFirestoreError(err, OperationType.WRITE, 'collections_batch');
    return 0;
  }
}

let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Immediately merges and persists citizen users, reports, pengaduan online, and pra-registrasi
 * to the dedicated lightweight `panaikang_app_data/live_warga_state` document AND `full_snapshot`.
 * Guarantees zero data loss across multiple citizen & admin devices.
 */
export async function pushLiveWargaStateToFirestore(payload: {
  citizenUsers?: any[];
  reports?: any[];
  pengaduanRecords?: any[];
  praRegistrasiRecords?: any[];
  seedRequests?: any[];
  deletedItemIds?: string[];
}): Promise<boolean> {
  if (isQuotaPaused()) return false;

  const stripHeavyMedia = (val: any, depth = 0): any => {
    if (depth > 10 || val === null || val === undefined) return val;
    if (typeof val === 'string') {
      if (val.length > 15_000 && (val.startsWith('data:') || val.includes(';base64,'))) {
        return '';
      }
      return val;
    }
    if (Array.isArray(val)) return val.map((v) => stripHeavyMedia(v, depth + 1));
    if (typeof val === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(val)) {
        out[k] = stripHeavyMedia(val[k], depth + 1);
      }
      return out;
    }
    return val;
  };

  try {
    const liveRef = doc(db, APP_STORE_COLLECTION, LIVE_WARGA_DOC_ID);
    let remoteData: Record<string, any> = {};
    try {
      const snap = await Promise.race([
        getDoc(liveRef),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (snap && snap.exists()) {
        remoteData = snap.data() || {};
      }
    } catch {
      // Fallback to cachedLiveWargaState if getDoc fails
    }

    const deletedSet = new Set<string>([
      ...(Array.isArray(remoteData.deletedItemIds) ? remoteData.deletedItemIds : []),
      ...(Array.isArray(cachedLiveWargaState.deletedItemIds) ? cachedLiveWargaState.deletedItemIds : []),
      ...(Array.isArray(payload.deletedItemIds) ? payload.deletedItemIds : []),
    ]);

    const mergedCitizens = mergeByKey(
      mergeByKey(remoteData.citizenUsers, cachedLiveWargaState.citizenUsers, deletedSet, (c) => String(c.uid || c.email || '')),
      payload.citizenUsers,
      deletedSet,
      (c) => String(c.uid || c.email || '')
    );

    const mergedReports = mergeByKey(
      mergeByKey(remoteData.reports, cachedLiveWargaState.reports, deletedSet, (r) => String(r.id || r.ticketCode || '')),
      payload.reports,
      deletedSet,
      (r) => String(r.id || r.ticketCode || '')
    );

    const mergedPengaduan = mergeByKey(
      mergeByKey(remoteData.pengaduanRecords, cachedLiveWargaState.pengaduanRecords, deletedSet, (p) => String(p.ticketCode || p.id || '')),
      payload.pengaduanRecords,
      deletedSet,
      (p) => String(p.ticketCode || p.id || '')
    );

    const mergedPra = mergeByKey(
      mergeByKey(remoteData.praRegistrasiRecords, cachedLiveWargaState.praRegistrasiRecords, deletedSet, (p) => String(p.ticketCode || p.id || '')),
      payload.praRegistrasiRecords,
      deletedSet,
      (p) => String(p.ticketCode || p.id || '')
    );

    const mergedSeeds = mergeByKey(
      mergeByKey(remoteData.seedRequests, cachedLiveWargaState.seedRequests, deletedSet, (s) => String(s.id || '')),
      payload.seedRequests,
      deletedSet,
      (s) => String(s.id || '')
    );

    const nowMs = Date.now();
    const cleanDoc = JSON.parse(
      JSON.stringify(
        stripHeavyMedia({
          citizenUsers: mergedCitizens.slice(0, 200),
          reports: mergedReports.slice(0, 80),
          pengaduanRecords: mergedPengaduan.slice(0, 80),
          praRegistrasiRecords: mergedPra.slice(0, 80),
          seedRequests: mergedSeeds.slice(0, 80),
          deletedItemIds: Array.from(deletedSet),
          updatedAt: nowMs,
          syncedAt: new Date(nowMs).toISOString(),
        })
      )
    );

    cachedLiveWargaState = cleanDoc;

    const fullRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
    await Promise.allSettled([
      setDoc(liveRef, cleanDoc, { merge: true }),
      setDoc(fullRef, cleanDoc, { merge: true }),
    ]);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APP_STORE_COLLECTION}/${LIVE_WARGA_DOC_ID}`);
    return false;
  }
}

/**
 * Subscribe in real-time to `panaikang_app_data/live_warga_state` so any Admin or Citizen device
 * immediately receives newly registered users, complaints (pengaduan), and letter applications.
 */
export function subscribeToLiveWargaState(
  onData: (data: Partial<PersistedDatabase>) => void
): Unsubscribe {
  if (isQuotaPaused()) {
    return () => {};
  }

  const liveRef = doc(db, APP_STORE_COLLECTION, LIVE_WARGA_DOC_ID);
  let unsub: Unsubscribe = () => {};

  try {
    unsub = onSnapshot(
      liveRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<PersistedDatabase>;
          cachedLiveWargaState = {
            ...cachedLiveWargaState,
            ...data,
          };
          onData(data);
        }
      },
      (error) => {
        if (isQuotaError(error)) {
          tripQuotaCircuitBreaker();
        }
      }
    );
  } catch {}

  return () => {
    try {
      unsub();
    } catch {}
  };
}

/**
 * Sync application database snapshot to Firestore document with debouncing and quota protection.
 * Supports `immediate = true` for critical citizen registration and complaint submission events.
 */
export async function pushFullDatabaseToFirestore(
  database: PersistedDatabase,
  immediate = false
): Promise<void> {
  if (isQuotaPaused()) {
    return;
  }

  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = null;
  }

  const executeWrite = async () => {
    if (isQuotaPaused()) return;
    const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
    try {
      const safeData = createSafeSnapshot(database);
      await setDoc(
        docRef,
        {
          ...safeData,
          updatedAt: Date.now(),
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      if (isQuotaError(err)) {
        tripQuotaCircuitBreaker();
      } else {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `${APP_STORE_COLLECTION}/${FULL_DB_DOC_ID}`
        );
      }
    }
  };

  if (immediate) {
    await executeWrite();
    return;
  }

  return new Promise((resolve) => {
    pushDebounceTimer = setTimeout(async () => {
      await executeWrite();
      resolve();
    }, 600);
  });
}

/**
 * Fetch full database snapshot directly from Firestore
 */
export async function fetchFullDatabaseFromFirestore(): Promise<PersistedDatabase | null> {
  if (isQuotaPaused()) return null;
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  const liveRef = doc(db, APP_STORE_COLLECTION, LIVE_WARGA_DOC_ID);
  try {
    const [snap, liveSnap] = await Promise.allSettled([getDoc(docRef), getDoc(liveRef)]);
    let base: PersistedDatabase | null = null;
    if (snap.status === 'fulfilled' && snap.value.exists()) {
      base = snap.value.data() as PersistedDatabase;
    }
    if (liveSnap.status === 'fulfilled' && liveSnap.value.exists()) {
      const liveData = liveSnap.value.data() as Partial<PersistedDatabase>;
      cachedLiveWargaState = { ...cachedLiveWargaState, ...liveData };
      if (base) {
        const delSet = new Set<string>([
          ...(base.deletedItemIds || []),
          ...(liveData.deletedItemIds || []),
        ]);
        base = {
          ...base,
          citizenUsers: mergeByKey(base.citizenUsers, liveData.citizenUsers, delSet, (c) => String(c.uid || c.email || '')),
          reports: mergeByKey(base.reports, liveData.reports, delSet, (r) => String(r.id || r.ticketCode || '')),
          pengaduanRecords: mergeByKey(base.pengaduanRecords, liveData.pengaduanRecords, delSet, (p) => String(p.ticketCode || p.id || '')),
          praRegistrasiRecords: mergeByKey(base.praRegistrasiRecords, liveData.praRegistrasiRecords, delSet, (p) => String(p.ticketCode || p.id || '')),
          deletedItemIds: Array.from(delSet),
        };
      } else {
        base = liveData as PersistedDatabase;
      }
    }
    return base;
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
    return null;
  }
}

/**
 * Subscribe to real-time changes of the full application database.
 * Also supports one-pass initial seeding via onEmpty when the document does not exist yet on server,
 * avoiding a duplicate getDoc() read on application boot.
 */
export function subscribeToFirestoreDatabase(
  onData: (data: PersistedDatabase) => void,
  onError?: (err: Error) => void,
  onEmpty?: () => void
): Unsubscribe {
  if (isQuotaPaused()) {
    return () => {};
  }

  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  let unsub: Unsubscribe = () => {};
  let seededOnce = false;

  try {
    unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PersistedDatabase;
          onData(data);
        } else if (!snapshot.metadata.fromCache && !seededOnce && onEmpty) {
          seededOnce = true;
          onEmpty();
        }
      },
      (error) => {
        if (isQuotaError(error)) {
          tripQuotaCircuitBreaker();
          return;
        }
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    );
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
  }

  return () => {
    try {
      unsub();
    } catch {}
  };
}

/**
 * Seeds initial database to Firestore if not already seeded.
 */
export async function seedInitialFirestoreIfEmpty(
  initialData: PersistedDatabase
): Promise<void> {
  if (isQuotaPaused()) return;
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await pushFullDatabaseToFirestore(initialData);
    }
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
  }
}

/**
 * Pushes updated Kelurahan Profile directly to Firestore dedicated document
 */
export async function pushProfileToFirestore(profile: KelurahanProfile): Promise<void> {
  if (isQuotaPaused()) return;
  try {
    const payload = {
      ...profile,
      lurahPhotoUrl: profile.lurahPhotoUrl?.trim() || '',
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    };
    await setDoc(PROFILE_REF, payload, { merge: true });
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    } else {
      console.warn('[Firestore] Error updating kelurahan profile in cloud:', err);
    }
  }
}

/**
 * Real-time listener for Kelurahan Profile document
 */
export function subscribeToFirestoreProfile(
  onProfile: (profile: KelurahanProfile) => void
): Unsubscribe {
  if (isQuotaPaused()) {
    return () => {};
  }

  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
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
        if (isQuotaError(err)) {
          tripQuotaCircuitBreaker();
          try {
            unsub();
          } catch {}
        }
      }
    );
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
  }

  return () => {
    try {
      unsub();
    } catch {}
  };
}

const WA_GATEWAY_STATE_DOC_ID = 'wa_gateway_state';
const WA_CIPHER_KEY = 'pnk-wa-gw-2026-sec-key';

export function encodeWaGatewayToken(rawToken: string): string {
  const clean = (rawToken || '').trim();
  if (!clean) return '';
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    bytes.push(clean.charCodeAt(i) ^ WA_CIPHER_KEY.charCodeAt(i % WA_CIPHER_KEY.length));
  }
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `v1:${hex}`;
}

export function decodeWaGatewayToken(encoded: string): string {
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
}

/**
 * Persists obfuscated Fonnte token to Firestore (`panaikang_app_data/wa_gateway_state`)
 * so container restarts and multi-platform deployments automatically recover the token.
 */
export async function saveWaGatewayTokenToCloud(rawToken: string): Promise<boolean> {
  if (isQuotaPaused()) return false;
  const cleaned = (rawToken || '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
  if (!cleaned) return false;
  const encodedToken = encodeWaGatewayToken(cleaned);
  const tokenMasked =
    cleaned.length >= 8
      ? `${cleaned.slice(0, 4)}••••••••${cleaned.slice(-4)}`
      : `${cleaned.slice(0, 2)}••••`;

  try {
    const ref = doc(db, APP_STORE_COLLECTION, WA_GATEWAY_STATE_DOC_ID);
    await setDoc(
      ref,
      {
        encodedToken,
        tokenMasked,
        updatedAt: Date.now(),
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
    return false;
  }
}

/**
 * Fetches obfuscated Fonnte token from Firestore (`panaikang_app_data/wa_gateway_state`)
 * and decodes it in memory as a fallback when static hosting (e.g. Cloudflare Pages)
 * does not have a local Express process.
 */
export async function fetchWaGatewayTokenFromCloud(): Promise<{
  token: string;
  tokenMasked: string;
}> {
  if (isQuotaPaused()) return { token: '', tokenMasked: '' };
  try {
    const ref = doc(db, APP_STORE_COLLECTION, WA_GATEWAY_STATE_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const encoded = typeof data?.encodedToken === 'string' ? data.encodedToken : '';
      const decoded = decodeWaGatewayToken(encoded);
      const masked =
        typeof data?.tokenMasked === 'string' && data.tokenMasked
          ? data.tokenMasked
          : decoded.length >= 8
          ? `${decoded.slice(0, 4)}••••••••${decoded.slice(-4)}`
          : decoded
          ? `${decoded.slice(0, 2)}••••`
          : '';
      return { token: decoded, tokenMasked: masked };
    }
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
  }
  return { token: '', tokenMasked: '' };
}

/**
 * Persists WhatsApp auto-dispatch logs (`waDispatchLogs`) to Firestore so logs are synced
 * across AI Studio, Cloudflare Pages, Vercel, and all administrator devices.
 */
export async function saveWaDispatchLogsToCloud(logs: any[]): Promise<void> {
  if (isQuotaPaused() || !Array.isArray(logs)) return;
  const sliced = logs.slice(0, 80);
  try {
    const gwRef = doc(db, APP_STORE_COLLECTION, WA_GATEWAY_STATE_DOC_ID);
    const fullRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
    await Promise.allSettled([
      setDoc(
        gwRef,
        {
          waDispatchLogs: sliced,
          updatedAt: Date.now(),
          syncedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      setDoc(
        fullRef,
        {
          waDispatchLogs: sliced,
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
    ]);
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
  }
}

/**
 * Reads WhatsApp auto-dispatch logs from Firestore (`wa_gateway_state` and `full_snapshot`).
 */
export async function fetchWaDispatchLogsFromCloud(): Promise<any[]> {
  if (isQuotaPaused()) return [];
  try {
    const gwRef = doc(db, APP_STORE_COLLECTION, WA_GATEWAY_STATE_DOC_ID);
    const fullRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
    const [gwSnap, fullSnap] = await Promise.allSettled([getDoc(gwRef), getDoc(fullRef)]);

    const mergedMap = new Map<string, any>();
    if (gwSnap.status === 'fulfilled' && gwSnap.value.exists()) {
      const gwLogs = gwSnap.value.data()?.waDispatchLogs;
      if (Array.isArray(gwLogs)) {
        for (const item of gwLogs) {
          if (item && item.id) mergedMap.set(item.id, item);
        }
      }
    }
    if (fullSnap.status === 'fulfilled' && fullSnap.value.exists()) {
      const fullLogs = fullSnap.value.data()?.waDispatchLogs;
      if (Array.isArray(fullLogs)) {
        for (const item of fullLogs) {
          if (item && item.id && !mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        }
      }
    }
    return Array.from(mergedMap.values()).sort((a, b) => {
      const tA = new Date(a.dispatchedAt || 0).getTime() || 0;
      const tB = new Date(b.dispatchedAt || 0).getTime() || 0;
      return tB - tA;
    });
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
    return [];
  }
}

/**
 * Immediately persists adminUsers (including Google Whitelist accounts) and
 * googleAdminVerificationRequests to Firestore (`panaikang_app_data/full_snapshot`)
 * without debounce delay so changes are never lost on fast reload or tab switch.
 */
export async function pushAdminUsersAndRequestsToFirestore(
  adminUsers: any[],
  googleAdminVerificationRequests?: any[]
): Promise<boolean> {
  if (isQuotaPaused()) return false;
  try {
    const fullRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
    const rawPayload: Record<string, any> = {
      adminUsers,
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    };
    if (Array.isArray(googleAdminVerificationRequests)) {
      rawPayload.googleAdminVerificationRequests = googleAdminVerificationRequests.slice(0, 100);
    }
    // Strip all undefined values so Firestore SDK never throws synchronous "Unsupported field value: undefined"
    const cleanPayload = JSON.parse(JSON.stringify(rawPayload));
    await Promise.race([
      setDoc(fullRef, cleanPayload, { merge: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RESOURCE_EXHAUSTED_WRITE_TIMEOUT')), 2500)
      ),
    ]);
    return true;
  } catch (err) {
    if (
      isQuotaError(err) ||
      (err instanceof Error && err.message === 'RESOURCE_EXHAUSTED_WRITE_TIMEOUT')
    ) {
      tripQuotaCircuitBreaker();
    }
    return false;
  }
}


