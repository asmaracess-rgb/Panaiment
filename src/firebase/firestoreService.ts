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
    console.log('[Firestore] Berhasil terhubung ke Firebase Firestore cloud database.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network connection.');
    }
    return false;
  }
}

// Global Document Identifiers
const PROFILE_DOC_ID = 'profile_main';
const APP_STORE_COLLECTION = 'panaikang_app_data';
const FULL_DB_DOC_ID = 'full_snapshot';

/**
 * Sync entire application database snapshot to Firestore document.
 * This guarantees a single source of truth accessible by all devices instantly.
 */
export async function pushFullDatabaseToFirestore(
  database: PersistedDatabase
): Promise<void> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    // Sanitize any undefined properties for clean Firestore payload
    const sanitized = JSON.parse(JSON.stringify(database));
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: Date.now(),
      syncedAt: new Date().toISOString(),
    }, { merge: true });
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
 * Seeds initial database to Firestore if not already seeded
 */
export async function seedInitialFirestoreIfEmpty(
  initialData: PersistedDatabase
): Promise<void> {
  const docRef = doc(db, APP_STORE_COLLECTION, FULL_DB_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.log('[Firestore] Database Firestore kosong, melakukan initial seeding...');
      await pushFullDatabaseToFirestore(initialData);
    }
  } catch (err) {
    console.warn('[Firestore] Seed check warning:', err);
  }
}
