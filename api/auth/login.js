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

  const { username, password, clientToken, forceTakeover } = typeof req.body === 'string'
    ? JSON.parse(req.body || '{}')
    : (req.body || {});

  const cleanUser = (username || '').trim().toLowerCase();
  const cleanNip = cleanUser.replace(/\s+/g, '');
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    res.status(400).json({ ok: false, error: 'Username/NIP dan kata sandi wajib diisi.' });
    return;
  }

  // Check lock in /tmp/admin_session_lock.json
  const lockFile = path.join('/tmp', 'admin_session_lock.json');
  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const lockData = JSON.parse(raw);
      const now = Date.now();
      const age = now - (lockData.lastHeartbeat || 0);
      if (age < 30000 && (!clientToken || clientToken !== lockData.token) && !forceTakeover) {
        res.status(409).json({
          ok: false,
          isLocked: true,
          activeAdmin: {
            username: lockData.username,
            fullName: lockData.fullName,
            role: lockData.role,
            roleLevel: lockData.roleLevel,
            loginAt: lockData.loginAt,
          },
          error: `Akses ditolak: Administrator "${lockData.fullName}" (@${lockData.username}) sedang aktif di perangkat lain. Hanya 1 admin yang dapat online dalam waktu bersamaan.`,
        });
        return;
      }
    }
  } catch {}

  // Master Lurah & default admin accounts
  const isMaster = ['admin', 'lurah', 'lurah.panaikang'].includes(cleanUser);
  const validPass = cleanPass === 'panaikang2026' || cleanPass === 'admin123' || cleanPass === 'makassar2026';

  if (!validPass && !isMaster) {
    res.status(401).json({ ok: false, error: 'Username/NIP atau kata sandi tidak terdaftar.' });
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

  const sessionToken = `pnk-adm-lurah-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const sessionData = {
    token: sessionToken,
    userId: 'usr-lurah-master',
    username: cleanUser,
    fullName: 'Muthmainnah, SE, MM',
    nip: '19880412 201010 1 002',
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
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: true,
      canManageWhatsApp: true,
      canExportPrintPdf: true,
    },
    loginAt: timeStr,
    lastHeartbeat: Date.now(),
  };

  try {
    fs.writeFileSync(lockFile, JSON.stringify(sessionData, null, 2));
  } catch {}

  res.status(200).json({ ok: true, session: sessionData });
}
