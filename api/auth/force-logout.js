import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { masterPassword } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const cleanPass = (masterPassword || '').trim();

  if (cleanPass !== 'panaikang2026' && cleanPass !== 'admin123' && cleanPass !== 'makassar2026') {
    res.status(403).json({ ok: false, error: 'Kata sandi otoritas Master Lurah tidak sesuai.' });
    return;
  }

  const lockFile = path.join('/tmp', 'admin_session_lock.json');
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch {}

  res.status(200).json({ ok: true, message: 'Sesi admin sebelumnya telah diputus paksa.' });
}
