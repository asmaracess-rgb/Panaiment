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

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      data: db.profile || null,
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const incoming = body.profile || body;

    const prevPhoto = db.profile?.lurahPhotoUrl || '';
    const nextPhoto =
      incoming.lurahPhotoUrl && String(incoming.lurahPhotoUrl).trim()
        ? String(incoming.lurahPhotoUrl).trim()
        : prevPhoto;

    db.profile = {
      ...(db.profile || {}),
      ...incoming,
      lurahPhotoUrl: nextPhoto,
    };

    writeDb(db);
    return res.status(200).json({
      ok: true,
      data: db.profile,
    });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'POST', 'OPTIONS']);
  return res.status(405).json({ ok: false, error: `Method ${req.method} tidak didukung.` });
}
