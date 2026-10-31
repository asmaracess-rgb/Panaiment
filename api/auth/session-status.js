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

  const clientToken =
    (req.query?.token) ||
    (req.headers['x-admin-token']) ||
    '';

  const lockFile = path.join('/tmp', 'admin_session_lock.json');
  let activeLock = null;

  try {
    if (fs.existsSync(lockFile)) {
      const raw = fs.readFileSync(lockFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && (Date.now() - (parsed.lastHeartbeat || 0) < 40000)) {
        activeLock = parsed;
      } else {
        // Expired lock (>40s without heartbeat)
        try { fs.unlinkSync(lockFile); } catch {}
      }
    }
  } catch {}

  if (!activeLock) {
    res.status(200).json({
      ok: true,
      isLocked: false,
      activeAdmin: null,
      isCurrentTokenValid: false,
    });
    return;
  }

  const isSameToken = Boolean(clientToken && clientToken === activeLock.token);

  res.status(200).json({
    ok: true,
    isLocked: true,
    activeAdmin: {
      userId: activeLock.userId,
      username: activeLock.username,
      fullName: activeLock.fullName,
      role: activeLock.role,
      roleLevel: activeLock.roleLevel,
      loginAt: activeLock.loginAt,
    },
    isCurrentTokenValid: isSameToken,
  });
}
