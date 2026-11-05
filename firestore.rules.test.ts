/**
 * Firestore Security Rules Test Suite (Dirty Dozen Verification)
 * Run with Firebase Emulator Suite & @firebase/rules-unit-testing
 *
 * Example execution:
 *   npx firebase emulators:exec --only firestore "npx tsx firestore.rules.test.ts"
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  actor: { uid: string | null; email?: string; email_verified?: boolean };
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Payload 1: Self-Admin Escalation on Profile Create',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'create',
    path: 'user_profiles/user_123',
    payload: {
      uid: 'user_123',
      email: 'warga@panaikang.id',
      fullName: 'Budi Santoso',
      nik: '7371090000000001',
      phone: '081234567890',
      rw: 'RW 01',
      rt: 'RT 01',
      address: 'Jl. Urip Sumoharjo',
      role: 'admin',
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Payload 2: Self-Admin Escalation on Profile Update',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'update',
    path: 'user_profiles/user_123',
    payload: {
      role: 'admin',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Payload 3: Direct Write to /admins/{uid} by Non-Admin',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'create',
    path: 'admins/user_123',
    payload: {
      uid: 'user_123',
      email: 'warga@panaikang.id',
      fullName: 'Budi Santoso',
      nip: '199001012020121001',
      jabatan: 'Lurah Panaikang',
      roleLevel: 'master_admin',
      isActive: true,
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Payload 4: Cross-User PII Profile Read',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'get',
    path: 'user_profiles/user_456',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Payload 5: Cross-User Submission Read',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'get',
    path: 'citizen_submissions/sub_456',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Payload 6: Unfiltered List Scraping on /citizen_submissions',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'list',
    path: 'citizen_submissions',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Payload 7: Identity Spoofing on Submission Create',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'create',
    path: 'citizen_submissions/sub_999',
    payload: {
      id: 'sub_999',
      ownerId: 'user_456',
      ownerEmail: 'other@panaikang.id',
      ticketCode: 'SRT-2026-0099',
      submissionType: 'layanan_administrasi',
      serviceCategoryId: 'surat_keterangan',
      serviceName: 'Surat Keterangan Domisili',
      title: 'Permohonan Surat Keterangan Domisili',
      description: 'Untuk keperluan administrasi bank',
      applicantName: 'Budi Santoso',
      applicantNik: '7371090000000001',
      applicantPhone: '081234567890',
      rw: 'RW 01',
      rt: 'RT 01',
      address: 'Jl. Urip Sumoharjo',
      status: 'Menunggu Verifikasi',
      responseNote: '',
      letterRegisterNumber: '',
      createdAtDisplay: '04 Nov 2026, 14:00 WITA',
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Payload 8: Orphaned Submission Without User Profile',
    actor: { uid: 'user_no_profile', email: 'noprofile@panaikang.id', email_verified: true },
    operation: 'create',
    path: 'citizen_submissions/sub_100',
    payload: {
      id: 'sub_100',
      ownerId: 'user_no_profile',
      ownerEmail: 'noprofile@panaikang.id',
      ticketCode: 'SRT-2026-0100',
      submissionType: 'layanan_administrasi',
      serviceCategoryId: 'surat_keterangan',
      serviceName: 'Surat Keterangan Domisili',
      title: 'Permohonan Surat Keterangan Domisili',
      description: 'Pengajuan tanpa profil terdaftar',
      applicantName: 'Tanpa Profil',
      applicantNik: '7371090000000002',
      applicantPhone: '081234567891',
      rw: 'RW 01',
      rt: 'RT 01',
      address: 'Jl. Panaikang',
      status: 'Menunggu Verifikasi',
      responseNote: '',
      letterRegisterNumber: '',
      createdAtDisplay: '04 Nov 2026, 14:00 WITA',
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Payload 9: Citizen Self-Approving Submission Status',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'update',
    path: 'citizen_submissions/sub_123',
    payload: {
      status: 'Selesai',
      letterRegisterNumber: '470/001/KP/XI/2026',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Payload 10: Terminal State Update Bypass (Updating Completed Submission)',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'update',
    path: 'citizen_submissions/sub_completed',
    payload: {
      description: 'Mencoba mengubah isi pengajuan yang sudah selesai diverifikasi',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Payload 11: Shadow Field Injection on Submission Update',
    actor: { uid: 'user_123', email: 'warga@panaikang.id', email_verified: true },
    operation: 'update',
    path: 'citizen_submissions/sub_123',
    payload: {
      description: 'Perubahan deskripsi valid',
      isVerifiedByLurahGhostField: true,
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Payload 12: Email Spoofing Without Verified Email Token',
    actor: { uid: 'spoof_uid', email: 'AsmaraCess@gmail.com', email_verified: false },
    operation: 'update',
    path: 'kelurahan_profiles/main_profile',
    payload: {
      lurahName: 'Spoofed Name',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
