import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './firestoreService';
import {
  AuthenticatedUserProfile,
  AdminRoleRecord,
  CitizenSubmission,
  UserRole,
  GoogleAdminVerificationRequest,
} from '../types';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';

export const EMAIL_FOR_SIGN_IN_STORAGE_KEY = 'panaikang_email_for_signin';
export const PENDING_REG_PROFILE_STORAGE_KEY = 'panaikang_pending_registration_profile';
export const SIGN_IN_TARGET_VIEW_STORAGE_KEY = 'panaikang_signin_target_view';

export interface PendingCitizenRegistration {
  fullName: string;
  nik: string;
  phone: string;
  rw: string;
  rt: string;
  address: string;
}

/**
 * Schema boundary constants synchronized with firebase-blueprint.json & firestore.rules
 */
export const AUTH_SCHEMA_LIMITS = {
  UID_MAX: 128,
  EMAIL_MIN: 3,
  EMAIL_MAX: 160,
  NAME_MIN: 2,
  NAME_MAX: 120,
  NIK_MAX: 32,
  PHONE_MAX: 32,
  RW_MIN: 2,
  RW_MAX: 16,
  RT_MIN: 2,
  RT_MAX: 16,
  ADDRESS_MAX: 300,
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  DESC_MIN: 3,
  DESC_MAX: 2000,
  NOTE_MAX: 1000,
  LETTER_NUM_MAX: 120,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
};

/**
 * Translates Firebase Authentication error codes into clear Indonesian messages
 */
export function translateFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const message = error instanceof Error ? error.message : String(error || '');

  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Jendela pemilihan akun Google ditutup sebelum selesai. Silakan klik kembali tombol Masuk dengan Google.';
    case 'auth/popup-blocked':
      return 'Jendela pop-up pemilihan akun Google diblokir oleh browser perangkat Anda. Mohon izinkan pop-up untuk situs ini di pengaturan browser lalu coba kembali.';
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'smartpanaikang.vercel.app';
      const projId = (firebaseConfig as { projectId?: string })?.projectId || 'panaikang-smart-environment';
      return `Domain halaman live ini (${host}) belum didaftarkan pada Firebase Authentication. Solusi: Buka Firebase Console (Project ID: ${projId}) → Authentication → Settings → Authorized domains → klik Add domain → ketik "${host}" lalu simpan. Sementara itu, untuk halaman Admin Anda juga dapat langsung masuk melalui tab "Username / NIP Pejabat" di sebelahnya.`;
    }
    case 'auth/operation-not-supported-in-this-environment':
      return 'Lingkungan browser ini membatasi pop-up standar. Silakan buka di browser Chrome/Safari atau gunakan tab Username / NIP Pejabat.';
    case 'auth/account-exists-with-different-credential':
      return 'Alamat email ini sudah terdaftar pada sistem. Silakan gunakan akun yang sesuai.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan oleh Administrator Kelurahan.';
    case 'auth/quota-exceeded':
      return 'Kuota layanan harian telah tercapai. Silakan coba lagi beberapa saat kemudian.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan tunggu beberapa menit sebelum mencoba lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server. Periksa koneksi internet perangkat Anda.';
    default:
      if (message.includes('popup-closed-by-user')) {
        return 'Jendela pemilihan akun Google ditutup sebelum selesai. Silakan coba lagi.';
      }
      if (message.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'smartpanaikang.vercel.app';
        const projId = (firebaseConfig as { projectId?: string })?.projectId || 'panaikang-smart-environment';
        return `Domain "${host}" belum didaftarkan di Firebase Console (Project: ${projId}) → Authentication → Settings → Authorized domains.`;
      }
      return `Kendala saat membuka pemilihan akun Google (${code || message || 'error'}). Silakan coba kembali.`;
  }
}

function sanitizeString(value: string | undefined | null, maxLen: number, fallback = ''): string {
  const clean = (value || '').trim();
  if (!clean) return fallback;
  return clean.slice(0, maxLen);
}

export function getSavedEmailForSignIn(): string {
  try {
    return (window.localStorage.getItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function getSavedPendingRegistration(): PendingCitizenRegistration | undefined {
  try {
    const raw = window.localStorage.getItem(PENDING_REG_PROFILE_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<PendingCitizenRegistration>;
    if (!parsed || typeof parsed !== 'object') return undefined;
    return {
      fullName: String(parsed.fullName || '').trim(),
      nik: String(parsed.nik || '').replace(/\D/g, '').trim(),
      phone: String(parsed.phone || '').trim(),
      rw: String(parsed.rw || 'RW 01').trim(),
      rt: String(parsed.rt || 'RT 01').trim(),
      address: String(parsed.address || '').trim(),
    };
  } catch {
    return undefined;
  }
}

export function getSavedSignInTargetView(): 'dashboard_warga' | 'admin' {
  try {
    const raw = window.localStorage.getItem(SIGN_IN_TARGET_VIEW_STORAGE_KEY);
    return raw === 'admin' ? 'admin' : 'dashboard_warga';
  } catch {
    return 'dashboard_warga';
  }
}

export function clearSavedSignInLinkData(): void {
  try {
    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY);
    window.localStorage.removeItem(PENDING_REG_PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(SIGN_IN_TARGET_VIEW_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reads the user's trusted role and profile from protected Firestore collections:
 * 1) Checks `/admins/{uid}` (strictly protected; only existing admins or Firebase Console can create documents here)
 * 2) Reads `/user_profiles/{uid}` (PII-isolated to owner or admin)
 *
 * Never trusts URL parameters, localStorage overrides, or client-selected roles.
 */
export async function resolveTrustedUserRoleAndProfile(
  firebaseUser: User,
  registrationDefaults?: {
    fullName?: string;
    nik?: string;
    phone?: string;
    rw?: string;
    rt?: string;
    address?: string;
  }
): Promise<AuthenticatedUserProfile> {
  const uid = firebaseUser.uid;
  const email = sanitizeString(
    firebaseUser.email,
    AUTH_SCHEMA_LIMITS.EMAIL_MAX,
    'warga@panaikang.id'
  );

  // Merge any pending citizen registration draft saved before clicking the email validation link
  const savedPending = getSavedPendingRegistration();
  const effectiveDefaults = registrationDefaults || savedPending;

  let isTrustedAdmin = false;
  let adminDetails: AuthenticatedUserProfile['adminDetails'] = undefined;

  // 1. Check trusted /admins/{uid} collection in Firestore (or bootstrapped verified project owner matching firestore.rules)
  try {
    const adminDocRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      const adminData = adminSnap.data() as AdminRoleRecord;
      if (adminData && adminData.isActive !== false) {
        isTrustedAdmin = true;
        adminDetails = {
          nip: adminData.nip || '-',
          jabatan: adminData.jabatan || 'Administrator Kelurahan Panaikang',
          unitBidang: adminData.unitBidang || 'Pemerintah Kelurahan Panaikang',
          roleLevel: adminData.roleLevel || 'admin_bidang',
          isActive: true,
        };
      }
    } else if (
      firebaseUser.emailVerified &&
      (firebaseUser.email || '').toLowerCase() === 'asmaracess@gmail.com'
    ) {
      isTrustedAdmin = true;
      adminDetails = {
        nip: '198607092015042001',
        jabatan: 'Administrator Utama Kelurahan Panaikang',
        unitBidang: 'Pemerintah Kelurahan Panaikang',
        roleLevel: 'master_admin',
        isActive: true,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `admins/${uid}`);
  }

  // 2. Read /user_profiles/{uid}
  const profileRef = doc(db, 'user_profiles', uid);
  try {
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data() as Record<string, unknown>;
      const trustedRole: UserRole = isTrustedAdmin ? 'admin' : 'warga';

      const hasExplicitReg = Boolean(effectiveDefaults && effectiveDefaults.fullName && effectiveDefaults.fullName.trim().length >= 2);
      const resolvedFullName = sanitizeString(
        String(
          (hasExplicitReg ? effectiveDefaults?.fullName : '') ||
          data.fullName ||
          effectiveDefaults?.fullName ||
          firebaseUser.displayName ||
          'Warga Panaikang'
        ),
        AUTH_SCHEMA_LIMITS.NAME_MAX,
        'Warga Panaikang'
      );
      const resolvedNik = sanitizeString(
        String((hasExplicitReg && effectiveDefaults?.nik ? effectiveDefaults.nik : data.nik) || effectiveDefaults?.nik || ''),
        AUTH_SCHEMA_LIMITS.NIK_MAX,
        ''
      );
      const resolvedPhone = sanitizeString(
        String((hasExplicitReg && effectiveDefaults?.phone ? effectiveDefaults.phone : data.phone) || effectiveDefaults?.phone || ''),
        AUTH_SCHEMA_LIMITS.PHONE_MAX,
        ''
      );
      const resolvedRw = sanitizeString(
        String((hasExplicitReg && effectiveDefaults?.rw ? effectiveDefaults.rw : data.rw) || effectiveDefaults?.rw || 'RW 01'),
        AUTH_SCHEMA_LIMITS.RW_MAX,
        'RW 01'
      );
      const resolvedRt = sanitizeString(
        String((hasExplicitReg && effectiveDefaults?.rt ? effectiveDefaults.rt : data.rt) || effectiveDefaults?.rt || 'RT 01'),
        AUTH_SCHEMA_LIMITS.RT_MAX,
        'RT 01'
      );
      const resolvedAddress = sanitizeString(
        String((hasExplicitReg && effectiveDefaults?.address ? effectiveDefaults.address : data.address) || effectiveDefaults?.address || ''),
        AUTH_SCHEMA_LIMITS.ADDRESS_MAX,
        ''
      );

      if (hasExplicitReg) {
        updateDoc(profileRef, {
          fullName: resolvedFullName,
          nik: resolvedNik,
          phone: resolvedPhone,
          rw: resolvedRw,
          rt: resolvedRt,
          address: resolvedAddress,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      return {
        uid,
        email: sanitizeString(String(data.email || email), AUTH_SCHEMA_LIMITS.EMAIL_MAX, email),
        fullName: resolvedFullName,
        nik: resolvedNik,
        phone: resolvedPhone,
        rw: resolvedRw,
        rt: resolvedRt,
        address: resolvedAddress,
        role: trustedRole,
        adminDetails,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `user_profiles/${uid}`);
  }

  // 3. If profile does not exist yet in Firestore, initialize a citizen profile document
  // Store role as 'warga' in /user_profiles so Firestore rules always accept citizen registration
  // and the account is always listed in User Warga Terdaftar.
  const initialRole: UserRole = isTrustedAdmin ? 'admin' : 'warga';
  const defaultProfile: AuthenticatedUserProfile = {
    uid,
    email,
    fullName: sanitizeString(
      effectiveDefaults?.fullName || firebaseUser.displayName || email.split('@')[0],
      AUTH_SCHEMA_LIMITS.NAME_MAX,
      'Warga Kelurahan Panaikang'
    ),
    nik: sanitizeString(effectiveDefaults?.nik, AUTH_SCHEMA_LIMITS.NIK_MAX, ''),
    phone: sanitizeString(effectiveDefaults?.phone, AUTH_SCHEMA_LIMITS.PHONE_MAX, ''),
    rw: sanitizeString(effectiveDefaults?.rw, AUTH_SCHEMA_LIMITS.RW_MAX, 'RW 01'),
    rt: sanitizeString(effectiveDefaults?.rt, AUTH_SCHEMA_LIMITS.RT_MAX, 'RT 01'),
    address: sanitizeString(
      effectiveDefaults?.address,
      AUTH_SCHEMA_LIMITS.ADDRESS_MAX,
      'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar'
    ),
    role: initialRole,
    adminDetails,
  };

  try {
    await setDoc(profileRef, {
      uid: defaultProfile.uid,
      email: defaultProfile.email,
      fullName: defaultProfile.fullName,
      nik: defaultProfile.nik,
      phone: defaultProfile.phone,
      rw: defaultProfile.rw,
      rt: defaultProfile.rt,
      address: defaultProfile.address,
      role: 'warga',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `user_profiles/${uid}`);
  }

  return defaultProfile;
}

/**
 * Signs in or registers a citizen/admin using a Google ID Token returned directly
 * from Google Identity Services (GIS) native button or One Tap account chooser.
 * Works reliably on live domains, mobile browsers, and iframe environments where
 * cross-origin popups may be blocked.
 */
export async function signInWithGoogleIdToken(
  idToken: string,
  registrationDefaults?: PendingCitizenRegistration
): Promise<{
  ok: boolean;
  profile?: AuthenticatedUserProfile;
  error?: string;
}> {
  if (!idToken) {
    return {
      ok: false,
      error: 'Token autentikasi Google tidak ditemukan. Silakan pilih akun Google kembali.',
    };
  }

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);

    if (registrationDefaults?.fullName) {
      try {
        await updateProfile(cred.user, {
          displayName: sanitizeString(registrationDefaults.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX),
        });
      } catch {
        // Non-fatal
      }
    }

    const profile = await resolveTrustedUserRoleAndProfile(cred.user, registrationDefaults);
    clearSavedSignInLinkData();
    return { ok: true, profile };
  } catch (err) {
    return {
      ok: false,
      error: translateFirebaseAuthError(err),
    };
  }
}

export function getGoogleOAuthClientId(): string {
  return (firebaseConfig as { oAuthClientId?: string })?.oAuthClientId || '';
}

/**
 * Signs in or registers a citizen/admin using Google Sign-In (`signInWithPopup`).
 * CRITICAL: Calls `signInWithPopup` synchronously on the first tick of the user click
 * so mobile & live browsers never block the Google Account Chooser popup!
 */
export async function signInWithGoogleAccount(
  registrationDefaults?: PendingCitizenRegistration,
  options?: {
    loginHint?: string;
    forceAccountSelection?: boolean;
  }
): Promise<{
  ok: boolean;
  profile?: AuthenticatedUserProfile;
  error?: string;
}> {
  if (registrationDefaults) {
    const cleanName = registrationDefaults.fullName.trim();
    if (cleanName.length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
      return {
        ok: false,
        error: 'Nama lengkap sesuai KTP wajib diisi (minimal 2 karakter).',
      };
    }
    try {
      window.localStorage.setItem(
        PENDING_REG_PROFILE_STORAGE_KEY,
        JSON.stringify({
          fullName: cleanName,
          nik: (registrationDefaults.nik || '').replace(/\D/g, '').trim(),
          phone: (registrationDefaults.phone || '').trim(),
          rw: registrationDefaults.rw || 'RW 01',
          rt: registrationDefaults.rt || 'RT 01',
          address:
            (registrationDefaults.address || '').trim() ||
            'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const customParams: Record<string, string> = {
      prompt: 'select_account',
    };
    if (options?.loginHint && options.loginHint.trim().includes('@')) {
      customParams.login_hint = options.loginHint.trim().toLowerCase();
    }
    provider.setCustomParameters(customParams);

    // Must be the VERY FIRST await inside the click handler so browser popup blockers allow the chooser window
    const cred = await signInWithPopup(auth, provider);

    if (registrationDefaults?.fullName) {
      try {
        await updateProfile(cred.user, {
          displayName: sanitizeString(registrationDefaults.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX),
        });
      } catch {
        // Non-fatal
      }
    }

    const profile = await resolveTrustedUserRoleAndProfile(cred.user, registrationDefaults);

    if (registrationDefaults && registrationDefaults.fullName) {
      await updateCitizenProfileInFirestore(cred.user.uid, {
        fullName: registrationDefaults.fullName,
        nik: registrationDefaults.nik || profile.nik,
        phone: registrationDefaults.phone || profile.phone,
        rw: registrationDefaults.rw || profile.rw,
        rt: registrationDefaults.rt || profile.rt,
        address:
          registrationDefaults.address ||
          profile.address ||
          'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
      }).catch(() => {});

      profile.fullName = sanitizeString(
        registrationDefaults.fullName,
        AUTH_SCHEMA_LIMITS.NAME_MAX,
        profile.fullName
      );
      profile.nik = sanitizeString(
        registrationDefaults.nik,
        AUTH_SCHEMA_LIMITS.NIK_MAX,
        profile.nik
      );
      profile.phone = sanitizeString(
        registrationDefaults.phone,
        AUTH_SCHEMA_LIMITS.PHONE_MAX,
        profile.phone
      );
      profile.rw = sanitizeString(
        registrationDefaults.rw,
        AUTH_SCHEMA_LIMITS.RW_MAX,
        profile.rw
      );
      profile.rt = sanitizeString(
        registrationDefaults.rt,
        AUTH_SCHEMA_LIMITS.RT_MAX,
        profile.rt
      );
      profile.address = sanitizeString(
        registrationDefaults.address,
        AUTH_SCHEMA_LIMITS.ADDRESS_MAX,
        profile.address
      );
    }

    clearSavedSignInLinkData();
    return { ok: true, profile };
  } catch (err) {
    return {
      ok: false,
      error: translateFirebaseAuthError(err),
    };
  }
}

/**
 * Checks whether the current browser URL is a Firebase Passwordless Email Sign-In Link
 */
export function checkIsIncomingEmailSignInLink(url?: string): boolean {
  try {
    const targetUrl = url || window.location.href;
    return isSignInWithEmailLink(auth, targetUrl);
  } catch {
    return false;
  }
}

/**
 * Sends a Passwordless Email Sign-In & Activation Link via Firebase Authentication (`sendSignInLinkToEmail`).
 * Supports both Citizen Registration (saving citizen profile draft locally until link is clicked)
 * and direct Passwordless Login (email only).
 */
export async function sendPasswordlessSignInLink(params: {
  email: string;
  pendingRegistration?: PendingCitizenRegistration;
  targetView?: 'dashboard_warga' | 'admin';
}): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail) {
    return { ok: false, error: 'Mohon masukkan alamat email aktif Anda.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Format alamat email tidak valid (contoh: warga@email.com).' };
  }

  if (params.pendingRegistration) {
    const cleanName = params.pendingRegistration.fullName.trim();
    if (cleanName.length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
      return {
        ok: false,
        error: 'Nama lengkap sesuai KTP wajib diisi (minimal 2 karakter).',
      };
    }
  }

  const continueUrl = `${window.location.origin}${window.location.pathname}`;
  const actionCodeSettings = {
    url: continueUrl,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);

    try {
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_STORAGE_KEY, cleanEmail);
      window.localStorage.setItem(
        SIGN_IN_TARGET_VIEW_STORAGE_KEY,
        params.targetView || 'dashboard_warga'
      );
      if (params.pendingRegistration) {
        window.localStorage.setItem(
          PENDING_REG_PROFILE_STORAGE_KEY,
          JSON.stringify({
            fullName: params.pendingRegistration.fullName.trim(),
            nik: params.pendingRegistration.nik.replace(/\D/g, '').trim(),
            phone: params.pendingRegistration.phone.trim(),
            rw: params.pendingRegistration.rw || 'RW 01',
            rt: params.pendingRegistration.rt || 'RT 01',
            address:
              params.pendingRegistration.address.trim() ||
              'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
          })
        );
      } else {
        window.localStorage.removeItem(PENDING_REG_PROFILE_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage quota/privacy errors
    }

    return {
      ok: true,
      message: params.pendingRegistration
        ? `Tautan validasi pendaftaran & aktivasi akun telah dikirim ke ${cleanEmail}. Silakan buka kotak masuk (atau folder Spam) email Anda dan klik tautan tersebut untuk mengaktifkan akun dan langsung masuk ke Dashboard Warga.`
        : `Tautan masuk tanpa kata sandi telah dikirim ke ${cleanEmail}. Silakan buka kotak masuk (atau folder Spam) email Anda dan klik tautan validasi tersebut untuk langsung aktif dan masuk.`,
    };
  } catch (err) {
    return {
      ok: false,
      error: translateFirebaseAuthError(err),
    };
  }
}

/**
 * Completes the Passwordless Email Link validation when the user clicks the link from their email.
 * Verifies the link via `signInWithEmailLink`, activates the account, creates/updates `/user_profiles/{uid}`
 * if a pending registration draft exists, resolves the trusted role from Firestore, and cleans the URL.
 */
export async function completePasswordlessEmailSignIn(
  emailInput?: string,
  url?: string
): Promise<{
  ok: boolean;
  needsEmailConfirmation?: boolean;
  profile?: AuthenticatedUserProfile;
  targetView?: 'dashboard_warga' | 'admin';
  error?: string;
}> {
  const targetUrl = url || window.location.href;
  if (!checkIsIncomingEmailSignInLink(targetUrl)) {
    return {
      ok: false,
      error: 'Tautan ini bukan tautan validasi login email yang aktif.',
    };
  }

  const resolvedEmail = (emailInput || getSavedEmailForSignIn() || '').trim().toLowerCase();
  if (!resolvedEmail) {
    return {
      ok: false,
      needsEmailConfirmation: true,
      error:
        'Anda membuka tautan validasi pada perangkat atau browser yang berbeda. Mohon ketik kembali alamat email Anda untuk menyelesaikan aktivasi akun.',
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
    return {
      ok: false,
      needsEmailConfirmation: true,
      error: 'Format alamat email konfirmasi tidak valid.',
    };
  }

  const pendingReg = getSavedPendingRegistration();
  const targetView = getSavedSignInTargetView();

  try {
    const cred = await signInWithEmailLink(auth, resolvedEmail, targetUrl);

    if (pendingReg?.fullName) {
      try {
        await updateProfile(cred.user, {
          displayName: sanitizeString(pendingReg.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX),
        });
      } catch {
        // Non-fatal
      }
    }

    const profile = await resolveTrustedUserRoleAndProfile(cred.user, pendingReg);

    // If the user already had a profile document created moments earlier by onAuthStateChanged
    // before pendingReg was applied, ensure pendingReg fields are persisted to Firestore
    if (pendingReg && pendingReg.fullName) {
      await updateCitizenProfileInFirestore(cred.user.uid, {
        fullName: pendingReg.fullName,
        nik: pendingReg.nik || profile.nik,
        phone: pendingReg.phone || profile.phone,
        rw: pendingReg.rw || profile.rw,
        rt: pendingReg.rt || profile.rt,
        address: pendingReg.address || profile.address,
      }).catch(() => {});
      profile.fullName = sanitizeString(pendingReg.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX, profile.fullName);
      profile.nik = sanitizeString(pendingReg.nik, AUTH_SCHEMA_LIMITS.NIK_MAX, profile.nik);
      profile.phone = sanitizeString(pendingReg.phone, AUTH_SCHEMA_LIMITS.PHONE_MAX, profile.phone);
      profile.rw = sanitizeString(pendingReg.rw, AUTH_SCHEMA_LIMITS.RW_MAX, profile.rw);
      profile.rt = sanitizeString(pendingReg.rt, AUTH_SCHEMA_LIMITS.RT_MAX, profile.rt);
      profile.address = sanitizeString(pendingReg.address, AUTH_SCHEMA_LIMITS.ADDRESS_MAX, profile.address);
    }

    clearSavedSignInLinkData();

    // Clean Firebase oobCode/mode/apiKey query parameters from the address bar
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      // Ignore history API errors
    }

    return {
      ok: true,
      profile,
      targetView,
    };
  } catch (err) {
    return {
      ok: false,
      error: translateFirebaseAuthError(err),
    };
  }
}

/**
 * Legacy helper retained for backward compatibility if needed
 */
export async function loginWithEmailPassword(
  emailInput: string,
  passwordInput: string
): Promise<{
  ok: boolean;
  profile?: AuthenticatedUserProfile;
  error?: string;
}> {
  const cleanEmail = emailInput.trim();
  if (!cleanEmail) {
    return { ok: false, error: 'Alamat email wajib diisi.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Format alamat email tidak valid.' };
  }
  if (!passwordInput || passwordInput.length < 6) {
    return { ok: false, error: 'Kata sandi wajib diisi (minimal 6 karakter).' };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
    const profile = await resolveTrustedUserRoleAndProfile(cred.user);
    return { ok: true, profile };
  } catch (err) {
    return { ok: false, error: translateFirebaseAuthError(err) };
  }
}

/**
 * Legacy helper retained for backward compatibility if needed
 */
export async function registerCitizenWithEmailPassword(params: {
  email: string;
  password: string;
  fullName: string;
  nik: string;
  phone: string;
  rw: string;
  rt: string;
  address: string;
}): Promise<{
  ok: boolean;
  profile?: AuthenticatedUserProfile;
  error?: string;
}> {
  const cleanEmail = params.email.trim();
  const cleanName = params.fullName.trim();
  const cleanNik = params.nik.replace(/\D/g, '').trim();
  const cleanPhone = params.phone.trim();
  const cleanAddress = params.address.trim();

  if (cleanName.length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
    return { ok: false, error: 'Nama lengkap sesuai KTP wajib diisi (minimal 2 karakter).' };
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Mohon masukkan alamat email aktif yang valid.' };
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: 'Kata sandi minimal harus terdiri dari 6 karakter.' };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    try {
      await updateProfile(cred.user, {
        displayName: sanitizeString(cleanName, AUTH_SCHEMA_LIMITS.NAME_MAX),
      });
    } catch {
      // Non-fatal if displayName update fails
    }

    const profile = await resolveTrustedUserRoleAndProfile(cred.user, {
      fullName: cleanName,
      nik: cleanNik,
      phone: cleanPhone,
      rw: params.rw || 'RW 01',
      rt: params.rt || 'RT 01',
      address: cleanAddress || 'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
    });

    return { ok: true, profile };
  } catch (err) {
    return { ok: false, error: translateFirebaseAuthError(err) };
  }
}

/**
 * Sends a password reset email via Firebase Authentication
 */
export async function sendResetPasswordEmail(
  emailInput: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const cleanEmail = emailInput.trim();
  if (!cleanEmail) {
    return { ok: false, error: 'Mohon masukkan alamat email akun Anda.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Format alamat email tidak valid.' };
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      ok: true,
      message: `Tautan pengaturan ulang kata sandi telah dikirim ke ${cleanEmail}. Silakan periksa kotak masuk atau folder spam email Anda.`,
    };
  } catch (err) {
    return { ok: false, error: translateFirebaseAuthError(err) };
  }
}

/**
 * Signs out the currently authenticated Firebase user
 */
export async function logoutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Firebase Auth] Gagal melakukan sign out:', err);
  }
}

/**
 * Updates allowed citizen profile fields in `/user_profiles/{uid}`
 * Respects Firestore Security Rules `affectedKeys().hasOnly(['fullName', 'nik', 'phone', 'rw', 'rt', 'address', 'updatedAt'])`
 */
export async function updateCitizenProfileInFirestore(
  uid: string,
  updates: {
    fullName: string;
    nik: string;
    phone: string;
    rw: string;
    rt: string;
    address: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = sanitizeString(updates.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX);
  if (cleanName.length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
    return { ok: false, error: 'Nama lengkap minimal 2 karakter.' };
  }

  const profileRef = doc(db, 'user_profiles', uid);
  try {
    await updateDoc(profileRef, {
      fullName: cleanName,
      nik: sanitizeString(updates.nik.replace(/\D/g, ''), AUTH_SCHEMA_LIMITS.NIK_MAX, ''),
      phone: sanitizeString(updates.phone, AUTH_SCHEMA_LIMITS.PHONE_MAX, ''),
      rw: sanitizeString(updates.rw, AUTH_SCHEMA_LIMITS.RW_MAX, 'RW 01'),
      rt: sanitizeString(updates.rt, AUTH_SCHEMA_LIMITS.RT_MAX, 'RT 01'),
      address: sanitizeString(updates.address, AUTH_SCHEMA_LIMITS.ADDRESS_MAX, ''),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `user_profiles/${uid}`);
    return { ok: false, error: 'Gagal memperbarui profil warga di Firestore.' };
  }
}

/**
 * Creates a protected citizen submission document in `/citizen_submissions/{id}`
 * Bound to `request.auth.uid` so only the citizen owner and verified admins can access it.
 */
export async function createCitizenSubmissionInFirestore(params: {
  id?: string;
  ticketCode: string;
  submissionType: 'layanan_administrasi' | 'pengaduan_lingkungan';
  serviceCategoryId: string;
  serviceName: string;
  title: string;
  description: string;
  applicantName: string;
  applicantNik: string;
  applicantPhone: string;
  rw: string;
  rt: string;
  address: string;
}): Promise<{ ok: boolean; submission?: CitizenSubmission; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      ok: false,
      error: 'Sesi autentikasi tidak ditemukan. Silakan masuk kembali untuk mengirim pengajuan.',
    };
  }

  const rawId = params.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, AUTH_SCHEMA_LIMITS.UID_MAX);
  const nowDisplay = getRealtimeDateTimeString(new Date());

  const submissionData: Omit<CitizenSubmission, 'createdAt' | 'updatedAt'> = {
    id: cleanId,
    ownerId: currentUser.uid,
    ownerEmail: sanitizeString(currentUser.email, AUTH_SCHEMA_LIMITS.EMAIL_MAX, 'warga@panaikang.id'),
    ticketCode: sanitizeString(params.ticketCode, 64, `SRT-2026-${Date.now().toString().slice(-4)}`),
    submissionType: params.submissionType,
    serviceCategoryId: sanitizeString(params.serviceCategoryId, 80, 'umum'),
    serviceName: sanitizeString(params.serviceName, 160, 'Pelayanan Kelurahan'),
    title: sanitizeString(params.title, AUTH_SCHEMA_LIMITS.TITLE_MAX, 'Permohonan Layanan Warga'),
    description: sanitizeString(
      params.description,
      AUTH_SCHEMA_LIMITS.DESC_MAX,
      'Permohonan diajukan melalui Portal Layanan Warga Kelurahan Panaikang.'
    ),
    applicantName: sanitizeString(params.applicantName, AUTH_SCHEMA_LIMITS.NAME_MAX, 'Warga Panaikang'),
    applicantNik: sanitizeString(params.applicantNik, AUTH_SCHEMA_LIMITS.NIK_MAX, ''),
    applicantPhone: sanitizeString(params.applicantPhone, AUTH_SCHEMA_LIMITS.PHONE_MAX, ''),
    rw: sanitizeString(params.rw, AUTH_SCHEMA_LIMITS.RW_MAX, 'RW 01'),
    rt: sanitizeString(params.rt, AUTH_SCHEMA_LIMITS.RT_MAX, 'RT 01'),
    address: sanitizeString(
      params.address,
      AUTH_SCHEMA_LIMITS.ADDRESS_MAX,
      'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar'
    ),
    status: 'Menunggu Verifikasi',
    responseNote: '',
    letterRegisterNumber: '',
    createdAtDisplay: sanitizeString(nowDisplay, 80, nowDisplay),
  };

  try {
    // Ensure the citizen's /user_profiles/{uid} document exists before creating submission
    // (Required by Firestore Master Gate rule `exists(/databases/.../user_profiles/$(request.auth.uid))`)
    const profileRef = doc(db, 'user_profiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await resolveTrustedUserRoleAndProfile(currentUser, {
        fullName: submissionData.applicantName,
        nik: submissionData.applicantNik,
        phone: submissionData.applicantPhone,
        rw: submissionData.rw,
        rt: submissionData.rt,
        address: submissionData.address,
      });
    }

    const subRef = doc(db, 'citizen_submissions', cleanId);
    await setDoc(subRef, {
      ...submissionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ok: true, submission: submissionData };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `citizen_submissions/${cleanId}`);
    return {
      ok: false,
      error: 'Gagal menyimpan pengajuan ke basis data terproteksi. Pastikan Anda sudah login.',
    };
  }
}

/**
 * Updates a citizen's own submission while it is still in 'Menunggu Verifikasi' status.
 * Complies with `affectedKeys().hasOnly(['title', 'description', 'applicantPhone', 'address', 'updatedAt'])`.
 */
export async function updateMyCitizenSubmissionInFirestore(
  submissionId: string,
  updates: {
    title: string;
    description: string;
    applicantPhone: string;
    address: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const cleanTitle = sanitizeString(updates.title, AUTH_SCHEMA_LIMITS.TITLE_MAX);
  const cleanDesc = sanitizeString(updates.description, AUTH_SCHEMA_LIMITS.DESC_MAX);
  const cleanAddr = sanitizeString(updates.address, AUTH_SCHEMA_LIMITS.ADDRESS_MAX);

  if (cleanTitle.length < AUTH_SCHEMA_LIMITS.TITLE_MIN) {
    return { ok: false, error: 'Judul pengajuan minimal 3 karakter.' };
  }
  if (cleanDesc.length < AUTH_SCHEMA_LIMITS.DESC_MIN) {
    return { ok: false, error: 'Keterangan pengajuan minimal 3 karakter.' };
  }
  if (cleanAddr.length < 2) {
    return { ok: false, error: 'Alamat domisili wajib diisi.' };
  }

  try {
    const subRef = doc(db, 'citizen_submissions', submissionId);
    await updateDoc(subRef, {
      title: cleanTitle,
      description: cleanDesc,
      applicantPhone: sanitizeString(updates.applicantPhone, AUTH_SCHEMA_LIMITS.PHONE_MAX, ''),
      address: cleanAddr,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `citizen_submissions/${submissionId}`);
    return {
      ok: false,
      error: 'Pengajuan tidak dapat diubah (hanya pengajuan berstatus Menunggu Verifikasi milik Anda sendiri yang dapat diedit).',
    };
  }
}

/**
 * Deletes/cancels a citizen's own submission while it is still in 'Menunggu Verifikasi' status.
 */
export async function deleteMyCitizenSubmissionInFirestore(
  submissionId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const subRef = doc(db, 'citizen_submissions', submissionId);
    await deleteDoc(subRef);
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `citizen_submissions/${submissionId}`);
    return {
      ok: false,
      error: 'Gagal membatalkan pengajuan. Pengajuan yang sedang diproses atau selesai tidak dapat dihapus.',
    };
  }
}

/**
 * Subscribes in real-time to ONLY the authenticated citizen's own submissions
 * using `where('ownerId', '==', uid)` to satisfy Firestore's Query Enforcer rule.
 */
export function subscribeToMyCitizenSubmissions(
  uid: string,
  onData: (submissions: CitizenSubmission[]) => void
): Unsubscribe {
  if (!uid) return () => {};
  const q = query(collection(db, 'citizen_submissions'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CitizenSubmission[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CitizenSubmission);
      });
      items.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'citizen_submissions');
    }
  );
}

/**
 * Admin-only: Registers or updates a trusted Administrator UID in `/admins/{targetUid}`.
 * Firestore rules strictly enforce `isAdmin()` on this path.
 */
export async function registerTrustedAdminInFirestore(params: {
  uid: string;
  email: string;
  fullName: string;
  nip: string;
  jabatan: string;
  unitBidang: string;
  roleLevel: AdminRoleRecord['roleLevel'];
  isActive: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanUid = params.uid.trim();
  if (!cleanUid || !AUTH_SCHEMA_LIMITS.ID_PATTERN.test(cleanUid)) {
    return { ok: false, error: 'UID Firebase tidak valid.' };
  }

  try {
    const adminRef = doc(db, 'admins', cleanUid);
    const existingSnap = await getDoc(adminRef);
    const payload = {
      uid: cleanUid,
      email: sanitizeString(params.email, AUTH_SCHEMA_LIMITS.EMAIL_MAX, 'admin@panaikang.id'),
      fullName: sanitizeString(params.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX, 'Pejabat Kelurahan'),
      nip: sanitizeString(params.nip, 40, '-'),
      jabatan: sanitizeString(params.jabatan, 120, 'Administrator Kelurahan'),
      unitBidang: sanitizeString(params.unitBidang, 120, 'Pemerintah Kelurahan Panaikang'),
      roleLevel: params.roleLevel || 'admin_bidang',
      isActive: params.isActive !== false,
      updatedAt: serverTimestamp(),
    };

    if (existingSnap.exists()) {
      await updateDoc(adminRef, payload);
    } else {
      await setDoc(adminRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${cleanUid}`);
    return {
      ok: false,
      error: 'Akses ditolak oleh Firestore Security Rules: Hanya akun dengan peran Admin tepercaya yang dapat menetapkan UID Admin baru.',
    };
  }
}

/**
 * Subscribes to all registered citizen user profiles from Firestore (/user_profiles).
 * Accessible by authenticated administrators (enforced by firestore.rules allow list: if isAdmin()).
 */
export function subscribeToAllCitizenProfiles(
  onData: (citizens: AuthenticatedUserProfile[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, 'user_profiles');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AuthenticatedUserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        if (d && (d.uid || docSnap.id)) {
          items.push({
            uid: String(d.uid || docSnap.id),
            email: String(d.email || ''),
            fullName: String(d.fullName || 'Warga Panaikang'),
            nik: String(d.nik || ''),
            phone: String(d.phone || ''),
            rw: String(d.rw || 'RW 01'),
            rt: String(d.rt || 'RT 01'),
            address: String(d.address || ''),
            role: 'warga',
            createdAt: d.createdAtDisplay ? String(d.createdAtDisplay) : undefined,
            updatedAt: d.updatedAtDisplay ? String(d.updatedAtDisplay) : undefined,
          });
        }
      });
      items.sort((a, b) => a.fullName.localeCompare(b.fullName));
      onData(items);
    },
    (error) => {
      console.warn('[Firestore] subscribeToAllCitizenProfiles warning/error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'user_profiles');
    }
  );
}

/**
 * Updates a citizen profile in Firestore by Admin (e.g. updating verified NIK or contact details)
 */
export async function updateCitizenProfileByAdmin(
  uid: string,
  updates: Partial<AuthenticatedUserProfile>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profileRef = doc(db, 'user_profiles', uid);
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.fullName) {
      cleanUpdates.fullName = sanitizeString(updates.fullName, AUTH_SCHEMA_LIMITS.NAME_MAX);
    }
    if (updates.nik !== undefined) {
      cleanUpdates.nik = sanitizeString(updates.nik.replace(/\D/g, ''), AUTH_SCHEMA_LIMITS.NIK_MAX, '');
    }
    if (updates.phone !== undefined) {
      cleanUpdates.phone = sanitizeString(updates.phone, AUTH_SCHEMA_LIMITS.PHONE_MAX, '');
    }
    if (updates.rw) {
      cleanUpdates.rw = sanitizeString(updates.rw, AUTH_SCHEMA_LIMITS.RW_MAX, 'RW 01');
    }
    if (updates.rt) {
      cleanUpdates.rt = sanitizeString(updates.rt, AUTH_SCHEMA_LIMITS.RT_MAX, 'RT 01');
    }
    if (updates.address) {
      cleanUpdates.address = sanitizeString(updates.address, AUTH_SCHEMA_LIMITS.ADDRESS_MAX, '');
    }

    await updateDoc(profileRef, cleanUpdates);
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `user_profiles/${uid}`);
    return { ok: false, error: 'Gagal memperbarui profil warga di basis data.' };
  }
}

/**
 * Deletes a citizen profile from Firestore by Admin
 */
export async function deleteCitizenProfileByAdmin(
  uid: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profileRef = doc(db, 'user_profiles', uid);
    await deleteDoc(profileRef);
    return { ok: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `user_profiles/${uid}`);
    return { ok: false, error: 'Gagal menghapus profil warga dari basis data.' };
  }
}

export const GOOGLE_ADMIN_REQUESTS_KEY = 'pnk_google_admin_requests_v1';

export function loadGoogleAdminVerificationRequests(): GoogleAdminVerificationRequest[] {
  try {
    const raw = localStorage.getItem(GOOGLE_ADMIN_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGoogleAdminVerificationRequests(
  requests: GoogleAdminVerificationRequest[]
): void {
  try {
    localStorage.setItem(GOOGLE_ADMIN_REQUESTS_KEY, JSON.stringify(requests));
  } catch {
    // Ignore quota errors
  }
}

export function submitGoogleAdminVerificationRequest(params: {
  email: string;
  displayName?: string;
  photoUrl?: string;
}): { ok: boolean; message: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const existing = loadGoogleAdminVerificationRequests();
  const foundIndex = existing.findIndex((r) => r.email.toLowerCase() === cleanEmail);

  const nowDisplay = getRealtimeDateTimeString(new Date());
  if (foundIndex >= 0) {
    existing[foundIndex] = {
      ...existing[foundIndex],
      status: 'Menunggu Persetujuan',
      requestedAt: nowDisplay,
      requestedAtMs: Date.now(),
      displayName: params.displayName || existing[foundIndex].displayName || cleanEmail.split('@')[0],
      photoUrl: params.photoUrl || existing[foundIndex].photoUrl,
    };
  } else {
    existing.unshift({
      id: `req-admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      displayName: params.displayName || cleanEmail.split('@')[0],
      photoUrl: params.photoUrl,
      requestedAt: nowDisplay,
      requestedAtMs: Date.now(),
      status: 'Menunggu Persetujuan',
    });
  }

  saveGoogleAdminVerificationRequests(existing);
  return {
    ok: true,
    message: `Permohonan verifikasi untuk ${cleanEmail} telah terkirim ke Master Admin Lurah. Silakan tunggu persetujuan Master Admin.`,
  };
}

export { onAuthStateChanged };
export type { User as FirebaseUser };

