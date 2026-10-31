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

  const { username, password } = typeof req.body === 'string'
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
  }) || ADMIN_ACCOUNTS[0]; // Fallback to master admin structure

  const validPasswords = ['panaikang2026', 'admin123', 'makassar2026'];
  if (!validPasswords.includes(cleanPass)) {
    res.status(401).json({ ok: false, error: 'Kata sandi tidak sesuai. Silakan coba kembali.' });
    return;
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

  res.status(200).json({ ok: true, session: sessionData });
}
