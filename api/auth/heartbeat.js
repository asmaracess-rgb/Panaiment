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
  const clientToken = token || req.headers['x-admin-token'];

  const lockFile = path.join('/tmp', 'admin_session_lock.json');
  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (!clientToken || clientToken === parsed.token) {
          parsed.lastHeartbeat = Date.now();
          fs.writeFileSync(lockFile, JSON.stringify(parsed, null, 2), 'utf8');
          res.status(200).json({ ok: true, active: true });
          return;
        }
      }
    }
  } catch {}

  res.status(200).json({ ok: true, active: true });
}
