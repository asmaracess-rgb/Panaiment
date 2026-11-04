import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  writeBatch,
  disableNetwork,
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

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  const code = (error as any)?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded')
  );
}

function isQuotaPaused(): boolean {
  if (quotaPausedInMemory) return true;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(QUOTA_STORAGE_KEY);
      if (raw) {
        const until = Number(raw);
        if (!Number.isNaN(until) && Date.now() < until) {
          quotaPausedInMemory = true;
          return true;
        }
        window.sessionStorage.removeItem(QUOTA_STORAGE_KEY);
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return false;
}

function tripQuotaCircuitBreaker(): void {
  if (quotaPausedInMemory) return;
  quotaPausedInMemory = true;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      // Pause Firestore writes for 60 minutes in this session so SDK does not loop retries
      window.sessionStorage.setItem(
        QUOTA_STORAGE_KEY,
        String(Date.now() + 60 * 60 * 1000)
      );
    } catch {
      // Ignore storage errors
    }
  }
  // Immediately disable Firestore network transport so queued SDK retries stop
  disableNetwork(db).catch(() => {});
}

// Check on module load if quota was already paused in this session
if (isQuotaPaused()) {
  disableNetwork(db).catch(() => {});
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
const PROFILE_REF = doc(db, 'kelurahan_profiles', 'main_profile');

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
    database.profile.lurahPhotoUrl.length < 350_000
      ? database.profile.lurahPhotoUrl
      : '';

  const safeClone = cleanObject(database) as PersistedDatabase;
  if (safeClone.profile && preservedLurahPhoto) {
    safeClone.profile.lurahPhotoUrl = preservedLurahPhoto;
  }

  if (Array.isArray(safeClone.activityLogs)) {
    safeClone.activityLogs = safeClone.activityLogs.slice(0, 25);
  }
  if (Array.isArray(safeClone.reports) && safeClone.reports.length > 50) {
    safeClone.reports = safeClone.reports.slice(0, 50);
  }
  if (Array.isArray(safeClone.wasteLogs) && safeClone.wasteLogs.length > 50) {
    safeClone.wasteLogs = safeClone.wasteLogs.slice(0, 50);
  }
  if (Array.isArray(safeClone.cleanupEvents)) {
    safeClone.cleanupEvents = safeClone.cleanupEvents.map((c) => ({
      ...c,
      imageUrl: '',
      documentationPhotos: [],
    }));
  }

  let jsonString = JSON.stringify(safeClone);
  if (jsonString.length > 600_000) {
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
 * Sync application database snapshot to Firestore document with debouncing and quota protection.
 * Uses a single document write per debounce window to preserve free-tier daily write quota.
 */
export async function pushFullDatabaseToFirestore(
  database: PersistedDatabase
): Promise<void> {
  if (isQuotaPaused()) {
    return;
  }

  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
  }

  return new Promise((resolve) => {
    pushDebounceTimer = setTimeout(async () => {
      if (isQuotaPaused()) {
        resolve();
        return;
      }

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
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `${APP_STORE_COLLECTION}/${FULL_DB_DOC_ID}`
        );
      }
      resolve();
    }, 1500);
  });
}

/**
 * Fetch full database snapshot directly from Firestore
 */
export async function fetchFullDatabaseFromFirestore(): Promise<PersistedDatabase | null> {
  if (isQuotaPaused()) return null;
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PersistedDatabase;
    }
    return null;
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
    }
    return null;
  }
}

/**
 * Subscribe to real-time changes of the full application database.
 */
export function subscribeToFirestoreDatabase(
  onData: (data: PersistedDatabase) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (isQuotaPaused()) {
    return () => {};
  }

  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  let unsub: Unsubscribe = () => {};

  try {
    unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PersistedDatabase;
          onData(data);
        }
      },
      (error) => {
        if (isQuotaError(error)) {
          tripQuotaCircuitBreaker();
          try {
            unsub();
          } catch {}
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
    const cleanProfile = createSafeSnapshot({ profile } as any).profile || profile;
    await setDoc(
      PROFILE_REF,
      {
        ...cleanProfile,
        updatedAt: Date.now(),
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    if (isQuotaError(err)) {
      tripQuotaCircuitBreaker();
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
