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

  const mergeRequests = (existingList, incomingList) => {
    const reqMap = new Map();
    const upsert = (r) => {
      if (!r || !r.email) return;
      const cleanEmail = String(r.email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) return;
      const prev = reqMap.get(cleanEmail);
      const rTs = Number(r.updatedAtMs || r.requestedAtMs || 0);
      const prevTs = prev ? Number(prev.updatedAtMs || prev.requestedAtMs || 0) : -1;
      if (!prev || rTs >= prevTs) {
        reqMap.set(cleanEmail, {
          ...prev,
          ...r,
          email: cleanEmail,
          status: r.status || prev?.status || 'Menunggu Persetujuan',
          updatedAtMs: Math.max(rTs, prevTs, Date.now()),
        });
      }
    };
    if (Array.isArray(existingList)) existingList.forEach(upsert);
    if (Array.isArray(incomingList)) incomingList.forEach(upsert);
    return Array.from(reqMap.values()).sort(
      (a, b) => Number(b.requestedAtMs || 0) - Number(a.requestedAtMs || 0)
    );
  };

  const db = readDb();
  const currentList = Array.isArray(db.googleAdminVerificationRequests)
    ? db.googleAdminVerificationRequests
    : [];

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      data: currentList,
    });
    return;
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const cleanEmail = String(body.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ ok: false, errors: ['Alamat email Google tidak valid.'] });
      return;
    }
    const nowMs = Date.now();
    const newItem = {
      id: body.id && !String(body.id).startsWith('req-portal-')
        ? body.id
        : `req-admin-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      displayName: body.displayName || cleanEmail.split('@')[0],
      ...(body.photoUrl ? { photoUrl: body.photoUrl } : {}),
      requestedAt: body.requestedAt || new Date().toLocaleString('id-ID'),
      requestedAtMs: body.requestedAtMs || nowMs,
      updatedAtMs: nowMs,
      status: body.status || 'Menunggu Persetujuan',
      notes: body.notes || 'Mengajukan permohonan verifikasi akses Admin Google',
    };
    db.googleAdminVerificationRequests = mergeRequests(currentList, [newItem]);
    writeDb(db);
    res.status(201).json({ ok: true, data: db.googleAdminVerificationRequests });
    return;
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const incoming = Array.isArray(body)
      ? body
      : Array.isArray(body.requests)
      ? body.requests
      : Array.isArray(body.googleAdminVerificationRequests)
      ? body.googleAdminVerificationRequests
      : null;

    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar permohonan verifikasi tidak valid.'] });
      return;
    }
    db.googleAdminVerificationRequests = mergeRequests(currentList, incoming);
    writeDb(db);
    res.status(200).json({ ok: true, data: db.googleAdminVerificationRequests });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
