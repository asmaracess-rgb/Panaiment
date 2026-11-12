import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, If-None-Match'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const tmpPath = path.join('/tmp', 'panaikang_db.json');
  const repoPath = path.join(process.cwd(), 'data', 'panaikang_db.json');

  const sanitizeData = (rawObj) => {
    if (!rawObj || typeof rawObj !== 'object') return rawObj;
    const deletedSet = new Set(Array.isArray(rawObj.deletedItemIds) ? rawObj.deletedItemIds : []);
    if (deletedSet.size > 0) {
      const arrayKeys = [
        'reports',
        'wasteUnits',
        'wasteLogs',
        'tebaSpots',
        'bioporiPoints',
        'cleanupEvents',
        'kelurahanInfos',
        'whatsappRecipients',
        'adminUsers',
        'activityLogs',
        'urbanFarmingSpots',
        'seedRequests',
        'crops',
        'farmerGroups',
      ];
      for (const k of arrayKeys) {
        if (Array.isArray(rawObj[k])) {
          rawObj[k] = rawObj[k].filter((item) => item && item.id && !deletedSet.has(item.id));
        }
      }
    }
    rawObj.deletedItemIds = Array.from(deletedSet);
    return rawObj;
  };

  if (req.method === 'GET') {
    // Private cache only (never public-cache citizen/admin database payloads)
    res.setHeader('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    try {
      let parsed = null;

      // 1. Check /tmp first for latest runtime modifications on serverless
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf8');
        parsed = JSON.parse(raw);
      } else if (fs.existsSync(repoPath)) {
        // 2. Fallback to static repo db
        const raw = fs.readFileSync(repoPath, 'utf8');
        parsed = JSON.parse(raw);
      }

      if (!parsed) {
        return res.status(200).json({ ok: true, data: null });
      }

      const sanitized = sanitizeData(parsed);
      const etag = `W/"pnk-db-${sanitized.updatedAt || sanitized.lastModified || 0}"`;
      res.setHeader('ETag', etag);

      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      return res.status(200).json({ ok: true, data: sanitized });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    try {
      const body = req.body;
      const dataToSave = typeof body === 'string' ? JSON.parse(body) : (body || {});
      const nowMs = Date.now();

      // Read existing DB so we never lose newly submitted googleAdminVerificationRequests or whitelisted adminUsers
      let existingDb = null;
      try {
        if (fs.existsSync(tmpPath)) {
          existingDb = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
        } else if (fs.existsSync(repoPath)) {
          existingDb = JSON.parse(fs.readFileSync(repoPath, 'utf8'));
        }
      } catch {}

      if (existingDb && typeof existingDb === 'object') {
        // 1. Merge googleAdminVerificationRequests by email
        const reqMap = new Map();
        const upsertReq = (r) => {
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
              updatedAtMs: Math.max(rTs, prevTs, 1),
            });
          }
        };
        if (Array.isArray(existingDb.googleAdminVerificationRequests)) {
          existingDb.googleAdminVerificationRequests.forEach(upsertReq);
        }
        if (Array.isArray(dataToSave.googleAdminVerificationRequests)) {
          dataToSave.googleAdminVerificationRequests.forEach(upsertReq);
        }
        dataToSave.googleAdminVerificationRequests = Array.from(reqMap.values()).sort(
          (a, b) => Number(b.requestedAtMs || 0) - Number(a.requestedAtMs || 0)
        );

        // 2. Merge adminUsers by id so whitelisted accounts are never lost
        if (Array.isArray(existingDb.adminUsers) || Array.isArray(dataToSave.adminUsers)) {
          const userMap = new Map();
          for (const u of existingDb.adminUsers || []) {
            if (u && u.id) userMap.set(u.id, u);
          }
          for (const inc of dataToSave.adminUsers || []) {
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
                  : Boolean(
                      primary.isGoogleVerified ||
                        (!explicitlyRevoked && secondary.isGoogleVerified && resolvedEmail)
                    ),
                updatedAtMs: Math.max(incMs, prevMs),
              });
            }
          }
          dataToSave.adminUsers = Array.from(userMap.values());
        }

        // 3. Preserve profile and lurahPhotoUrl if client sends an empty photo
        if (existingDb && existingDb.profile) {
          if (!dataToSave.profile) {
            dataToSave.profile = existingDb.profile;
          } else if (!dataToSave.profile.lurahPhotoUrl || !String(dataToSave.profile.lurahPhotoUrl).trim()) {
            dataToSave.profile.lurahPhotoUrl =
              existingDb.profile.lurahPhotoUrl || '/images/lurah_muthmainnah_panaikang_1791548085422.jpg';
          }
        }
        if (dataToSave.profile && (!dataToSave.profile.lurahPhotoUrl || !String(dataToSave.profile.lurahPhotoUrl).trim())) {
          dataToSave.profile.lurahPhotoUrl = '/images/lurah_muthmainnah_panaikang_1791548085422.jpg';
        }
      }

      dataToSave.updatedAt = nowMs;
      dataToSave.lastModified = new Date(nowMs).toISOString();

      sanitizeData(dataToSave);

      // In serverless, write to /tmp for subsequent reads within the lambda container
      try {
        fs.writeFileSync(tmpPath, JSON.stringify(dataToSave));
      } catch {}

      // Also try writing to data/ directory if writable in local environment
      try {
        fs.writeFileSync(repoPath, JSON.stringify(dataToSave, null, 2));
      } catch {}

      // Minimal response payload to eliminate redundant Fast Origin Transfer (FOT)
      return res.status(200).json({
        ok: true,
        updatedAt: dataToSave.updatedAt,
        lastModified: dataToSave.lastModified,
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
