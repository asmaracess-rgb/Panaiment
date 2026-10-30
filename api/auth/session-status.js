import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const clientToken = (req.query?.token || req.headers['x-admin-token'] || '');
  const lockFile = path.join('/tmp', 'admin_session_lock.json');

  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const lockData = JSON.parse(raw);
      const now = Date.now();
      const age = now - (lockData.lastHeartbeat || 0);

      if (age < 30000) {
        return res.status(200).json({
          ok: true,
          isLocked: true,
          activeAdmin: {
            userId: lockData.userId,
            username: lockData.username,
            fullName: lockData.fullName,
            role: lockData.role,
            roleLevel: lockData.roleLevel,
            loginAt: lockData.loginAt,
          },
          isCurrentTokenValid: Boolean(clientToken && lockData.token === clientToken),
        });
      }
    }
  } catch {}

  res.status(200).json({
    ok: true,
    isLocked: false,
    activeAdmin: null,
    isCurrentTokenValid: false,
  });
}
