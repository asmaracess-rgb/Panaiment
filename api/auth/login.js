import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  const {
    username,
    password,
    clientToken,
    forceTakeover,
    masterPassphrase,
  } = typeof req.body === 'string'
    ? JSON.parse(req.body || '{}')
    : (req.body || {});

  const cleanUser = (username || '').trim().toLowerCase();
  const cleanNip = cleanUser.replace(/\s+/g, '');
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    res.status(400).json({ ok: false, error: 'Username/NIP dan kata sandi wajib diisi.' });
    return;
  }

  const ADMIN_ACCOUNTS = [
    {
      id: 'usr-lurah-master',
      username: 'lurah',
      nip: '19880412 201010 1 002',
      fullName: 'Muthmainnah, SE, MM',
      role: 'Lurah Panaikang · Pemerintahan & Wilayah',
      roleLevel: 'master_admin',
      isMasterLurah: true,
      allowedAdminTabs: [
        'dashboard_lurah',
        'pengurusan_warga',
        'profil',
        'info',
        'laporan',
        'sampah',
        'kerjabakti',
        'urban_farming',
        'rtrw',
        'traffic',
        'parameter_user',
        'log_aktivitas',
      ],
      allowedServiceCategories: ['kependudukan', 'izin_kegiatan', 'keamanan_lingkungan', 'bantuan_sosial'],
      actionPermissions: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canVerifyAndIssueLetter: true,
        canConfigureCatalog: true,
        canManageWhatsApp: true,
        canExportPrintPdf: true,
      },
    },
    {
      id: 'usr-sekretaris-01',
      username: 'sekretaris',
      nip: '19850615 200804 1 003',
      fullName: 'Drs. Syarifuddin, M.Si',
      role: 'Sekretaris Lurah · Administrasi & Verifikasi Layanan',
      roleLevel: 'sekretaris',
      isMasterLurah: false,
      allowedAdminTabs: ['pengurusan_warga', 'profil', 'info', 'laporan', 'rtrw', 'log_aktivitas'],
      allowedServiceCategories: ['kependudukan', 'izin_kegiatan', 'bantuan_sosial'],
      actionPermissions: {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: true,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
    },
    {
      id: 'usr-kasi-pem-01',
      username: 'kasi.pemerintahan',
      nip: '19900210 201402 1 005',
      fullName: 'Andi Nurhaliza, S.STP',
      role: 'Kepala Seksi Ketentraman, Ketertiban & Pemerintahan',
      roleLevel: 'kasi',
      isMasterLurah: false,
      allowedAdminTabs: ['pengurusan_warga', 'laporan', 'profil', 'rtrw'],
      allowedServiceCategories: ['kependudukan', 'keamanan_lingkungan', 'izin_kegiatan'],
      actionPermissions: {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: true,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
    },
    {
      id: 'usr-kasi-kebersihan-01',
      username: 'kasi.kebersihan',
      nip: '19920824 201601 1 004',
      fullName: 'Hasbullah, S.Sos',
      role: 'Kepala Seksi Kebersihan & Pengelolaan Lingkungan Hidup',
      roleLevel: 'admin_bidang',
      isMasterLurah: false,
      allowedAdminTabs: ['sampah', 'kerjabakti', 'urban_farming', 'laporan'],
      allowedServiceCategories: ['keamanan_lingkungan'],
      actionPermissions: {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: false,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
    },
  ];

  const matched = ADMIN_ACCOUNTS.find((a) => {
    const isMasterAlias =
      a.isMasterLurah && ['admin', 'lurah', 'lurah.panaikang'].includes(cleanUser);
    const uName = a.username.toLowerCase();
    const uNip = (a.nip || '').replace(/\s+/g, '').toLowerCase();
    return uName === cleanUser || uNip === cleanNip || isMasterAlias;
  }) || ADMIN_ACCOUNTS[0];

  const validPasswords = ['panaikang2026', 'admin123', 'makassar2026'];
  if (!validPasswords.includes(cleanPass)) {
    res.status(401).json({ ok: false, error: 'Kata sandi tidak sesuai. Silakan coba kembali.' });
    return;
  }

  // STRICT SINGLE-ADMIN OCCUPANCY LOCK CHECK
  const lockFile = path.join('/tmp', 'admin_session_lock.json');
  let currentLock = null;

  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && (Date.now() - (parsed.lastHeartbeat || 0) < 40000)) {
        currentLock = parsed;
      } else {
        try { fs.unlinkSync(lockFile); } catch {}
      }
    }
  } catch {}

  if (currentLock) {
    const isSameToken = Boolean(clientToken && clientToken === currentLock.token);
    if (!isSameToken) {
      const isMaster = Boolean(matched.isMasterLurah || matched.roleLevel === 'master_admin');
      const canForce =
        Boolean(forceTakeover) &&
        (isMaster ||
          cleanPass === 'panaikang2026' ||
          (masterPassphrase && ['panaikang2026', 'admin123'].includes(masterPassphrase.trim())));

      if (!canForce) {
        res.status(409).json({
          ok: false,
          isLocked: true,
          activeAdmin: {
            userId: currentLock.userId,
            username: currentLock.username,
            fullName: currentLock.fullName,
            role: currentLock.role,
            roleLevel: currentLock.roleLevel,
            loginAt: currentLock.loginAt,
          },
          error: `Saat ini akun Administrator "${currentLock.fullName}" (@${currentLock.username}) sedang aktif di perangkat lain sejak ${currentLock.loginAt}. Demi keamanan dan konsistensi data Satu Data Panaikang, hanya 1 admin yang dapat online dalam waktu bersamaan. Admin tersebut harus melakukan Logout terlebih dahulu sebelum admin lain dapat masuk.`,
        });
        return;
      }
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' · ' + now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WITA';

  const sessionToken = `pnk-adm-${matched.username}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const sessionData = {
    token: sessionToken,
    userId: matched.id,
    username: matched.username,
    fullName: matched.fullName,
    nip: matched.nip,
    role: matched.role,
    roleLevel: matched.roleLevel,
    isMasterLurah: matched.isMasterLurah,
    allowedAdminTabs: matched.allowedAdminTabs,
    allowedServiceCategories: matched.allowedServiceCategories,
    actionPermissions: matched.actionPermissions,
    loginAt: timeStr,
    lastHeartbeat: Date.now(),
  };

  try {
    fs.writeFileSync(lockFile, JSON.stringify(sessionData, null, 2), 'utf8');
  } catch {}

  res.status(200).json({ ok: true, session: sessionData });
}
