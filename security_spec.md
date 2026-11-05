# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **Trusted Admin Role Verification (`isAdmin`)**:
   - Admin status is never granted from client-supplied parameters, URL query strings, or self-assigned profile fields.
   - A user is an administrator in Firestore rules if and only if:
     - `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`, OR
     - Bootstrapped verified project owner: `request.auth.token.email_verified == true && request.auth.token.email == 'AsmaraCess@gmail.com'`.
3. **User Profile PII Isolation & Anti-Privilege Escalation (`/user_profiles/{userId}`)**:
   - `get` is strictly restricted to the profile owner (`request.auth.uid == userId`) or `isAdmin()`. Blanket `isSignedIn()` reads are forbidden.
   - `list` is restricted to `isAdmin()`.
   - During `create`, `incoming().uid == request.auth.uid`, `incoming().createdAt == request.time`, `incoming().updatedAt == request.time`, and `incoming().role == 'warga'` (unless `isAdmin()`).
   - During `update`, non-admin owners cannot modify `role`, `uid`, `email`, or `createdAt`.
4. **Citizen Submission Isolation (`/citizen_submissions/{submissionId}`)**:
   - Citizens can only `get` or `list` documents where `resource.data.ownerId == request.auth.uid`.
   - Citizens can only `create` a submission if `incoming().ownerId == request.auth.uid`, `incoming().status == 'Menunggu Verifikasi'`, `incoming().letterRegisterNumber == ''`, `incoming().createdAt == request.time`, and `exists(/databases/$(database)/documents/user_profiles/$(request.auth.uid))`.
   - Citizens can only `update` their own submission while `existing().status == 'Menunggu Verifikasi'` (Terminal State Locking) and can only modify `['title', 'description', 'applicantPhone', 'address', 'updatedAt']`.
   - Only `isAdmin()` can transition `status` (`'Sedang Ditangani'`, `'Selesai'`, `'Ditolak'`), edit `responseNote`, or issue `letterRegisterNumber`.
5. **Path Variable & Volumetric Hardening**:
   - All single-document operations validate `isValidId(id)` (`id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
   - Every string field has explicit `.size()` bounds.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Self-Admin Escalation on Profile Create)**:
   - Path: `/user_profiles/user_123` (as `user_123`)
   - Payload: `{ uid: "user_123", email: "warga@example.com", fullName: "Budi", nik: "7371090000000001", phone: "08123456789", rw: "RW 01", rt: "RT 01", address: "Jl. Panaikang", role: "admin", createdAt: SERVER_TIME, updatedAt: SERVER_TIME }`
   - Expected: `PERMISSION_DENIED` (citizen cannot self-assign `role: "admin"`).
2. **Payload 2 (Self-Admin Escalation on Profile Update)**:
   - Path: `/user_profiles/user_123` (as `user_123`)
   - Payload: `{ ...existingProfile, role: "admin", updatedAt: SERVER_TIME }`
   - Expected: `PERMISSION_DENIED` (`role` is immutable for non-admins and excluded from `affectedKeys().hasOnly(...)`).
3. **Payload 3 (Direct Write to `/admins/{uid}` by Non-Admin)**:
   - Path: `/admins/user_123` (as `user_123`)
   - Payload: `{ uid: "user_123", email: "warga@example.com", fullName: "Budi", nip: "19900101", jabatan: "Lurah", roleLevel: "master_admin", isActive: true, createdAt: SERVER_TIME, updatedAt: SERVER_TIME }`
   - Expected: `PERMISSION_DENIED` (only existing admins can write to `/admins`).
4. **Payload 4 (Cross-User PII Profile Read)**:
   - Path: `get /user_profiles/user_456` (as `user_123`)
   - Expected: `PERMISSION_DENIED` (PII isolation prevents reading another citizen's profile).
5. **Payload 5 (Cross-User Submission Read)**:
   - Path: `get /citizen_submissions/sub_456` where `ownerId == "user_456"` (as `user_123`)
   - Expected: `PERMISSION_DENIED` (citizens can only read their own submissions).
6. **Payload 6 (Unfiltered List Scraping on `/citizen_submissions`)**:
   - Path: `list /citizen_submissions` without `where('ownerId', '==', 'user_123')` (as `user_123`)
   - Expected: `PERMISSION_DENIED` (Query Enforcer rejects reading documents where `resource.data.ownerId != request.auth.uid`).
7. **Payload 7 (Identity Spoofing on Submission Create)**:
   - Path: `create /citizen_submissions/sub_999` (as `user_123`)
   - Payload: `{ id: "sub_999", ownerId: "user_456", ... }`
   - Expected: `PERMISSION_DENIED` (`incoming().ownerId` must equal `request.auth.uid`).
8. **Payload 8 (Orphaned Submission Without User Profile)**:
   - Path: `create /citizen_submissions/sub_100` (as `user_no_profile` who has no `/user_profiles/user_no_profile` doc)
   - Expected: `PERMISSION_DENIED` (`exists(/databases/$(database)/documents/user_profiles/$(request.auth.uid))` fails).
9. **Payload 9 (Citizen Self-Approving Submission Status)**:
   - Path: `update /citizen_submissions/sub_123` (as owner `user_123`)
   - Payload: `{ ...existingSubmission, status: "Selesai", letterRegisterNumber: "470/001/KP/2026", updatedAt: SERVER_TIME }`
   - Expected: `PERMISSION_DENIED` (citizens cannot modify `status` or `letterRegisterNumber`).
10. **Payload 10 (Terminal State Update Bypass)**:
    - Path: `update /citizen_submissions/sub_completed` where `existing().status == "Selesai"` (as owner `user_123`)
    - Payload: `{ ...existingSubmission, description: "Mengubah isi setelah selesai", updatedAt: SERVER_TIME }`
    - Expected: `PERMISSION_DENIED` (locked once status leaves `'Menunggu Verifikasi'`).
11. **Payload 11 (Shadow Field Injection on Submission Update)**:
    - Path: `update /citizen_submissions/sub_123` (as owner `user_123`)
    - Payload: `{ ...existingSubmission, description: "Update valid", isVerifiedGhost: true, updatedAt: SERVER_TIME }`
    - Expected: `PERMISSION_DENIED` (`hasOnly` and `affectedKeys().hasOnly` block ghost fields).
12. **Payload 12 (Email Spoofing Without Verified Token)**:
    - Path: `create /kelurahan_profiles/main_profile` (as user with `email: "AsmaraCess@gmail.com"` but `email_verified: false` and no `/admins/{uid}` doc)
    - Expected: `PERMISSION_DENIED` (`isAdmin()` requires `email_verified == true` or existence in `/admins/{uid}`).
