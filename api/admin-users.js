import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const tmpPath = path.join('/tmp', 'panaikang_db.json');
  const repoPath = path.join(process.cwd(), 'data', 'panaikang_db.json');

  const readDb = () => {
    try {
      if (fs.existsSync(tmpPath)) {
        return JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
      }
      if (fs.existsSync(repoPath)) {
        return JSON.parse(fs.readFileSync(repoPath, 'utf8'));
      }
    } catch {}
    return {};
  };

  const writeDb = (dbObj) => {
    dbObj.updatedAt = Date.now();
    dbObj.lastModified = new Date(dbObj.updatedAt).toISOString();
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(dbObj));
    } catch {}
    try {
      fs.writeFileSync(repoPath, JSON.stringify(dbObj, null, 2));
    } catch {}
  };

  const db = readDb();
  const currentUsers = Array.isArray(db.adminUsers) ? db.adminUsers : [];

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      adminUsers: currentUsers,
    });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const incoming = Array.isArray(body)
      ? body
      : Array.isArray(body.adminUsers)
      ? body.adminUsers
      : null;

    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Data daftar akun user admin tidak valid.'] });
      return;
    }

    const userMap = new Map();
    for (const u of currentUsers) {
      if (u && u.id) userMap.set(u.id, u);
    }
    for (const inc of incoming) {
      if (!inc || !inc.id) continue;
      const prev = userMap.get(inc.id);
      if (!prev) {
        userMap.set(inc.id, inc);
      } else {
        const incMs = Number(inc.updatedAtMs || 0);
        const prevMs = Number(prev.updatedAtMs || 0);
        const primary = incMs >= prevMs ? inc : prev;
        const secondary = incMs >= prevMs ? prev : inc;
        const explicitlyRevoked =
          primary.isGoogleVerified === false &&
          typeof primary.updatedAt === 'string' &&
          primary.updatedAt.toLowerCase().includes('dicabut');
        const resolvedEmail =
          primary.googleEmail && String(primary.googleEmail).trim()
            ? String(primary.googleEmail).trim().toLowerCase()
            : !explicitlyRevoked && secondary.googleEmail && String(secondary.googleEmail).trim()
            ? String(secondary.googleEmail).trim().toLowerCase()
            : undefined;
        userMap.set(inc.id, {
          ...secondary,
          ...primary,
          ...(resolvedEmail ? { googleEmail: resolvedEmail } : {}),
          isGoogleVerified: explicitlyRevoked
            ? false
            : Boolean(primary.isGoogleVerified || (!explicitlyRevoked && secondary.isGoogleVerified && resolvedEmail)),
          updatedAtMs: Math.max(incMs, prevMs, Date.now()),
        });
      }
    }

    db.adminUsers = Array.from(userMap.values());
    writeDb(db);
    res.status(200).json({ ok: true, adminUsers: db.adminUsers });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
