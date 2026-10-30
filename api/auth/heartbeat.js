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

  const { token } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const reqToken = token || req.headers['x-admin-token'];
  const lockFile = path.join('/tmp', 'admin_session_lock.json');

  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const lockData = JSON.parse(raw);
      if (reqToken && lockData.token === reqToken) {
        lockData.lastHeartbeat = Date.now();
        fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
        return res.status(200).json({ ok: true, active: true });
      }
    }
  } catch {}

  res.status(401).json({ ok: false, error: 'Sesi admin kedaluwarsa.' });
}
