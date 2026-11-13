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
        'sponsors',
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

        const deletedSet = new Set([
          ...(Array.isArray(existingDb.deletedItemIds) ? existingDb.deletedItemIds : []),
          ...(Array.isArray(dataToSave.deletedItemIds) ? dataToSave.deletedItemIds : []),
        ]);
        dataToSave.deletedItemIds = Array.from(deletedSet);

        // 2B. Merge citizenUsers by uid/email so registered citizen profiles are never overwritten
        if (Array.isArray(existingDb.citizenUsers) || Array.isArray(dataToSave.citizenUsers)) {
          const citizenMap = new Map();
          for (const c of existingDb.citizenUsers || []) {
            if (c && (c.uid || c.email) && (!c.uid || !deletedSet.has(c.uid))) {
              const key = (c.email ? String(c.email).trim().toLowerCase() : '') || c.uid;
              citizenMap.set(key, c);
            }
          }
          for (const inc of dataToSave.citizenUsers || []) {
            if (!inc || (!inc.uid && !inc.email) || (inc.uid && deletedSet.has(inc.uid))) continue;
            const key = (inc.email ? String(inc.email).trim().toLowerCase() : '') || inc.uid;
            const prev = citizenMap.get(key) || (inc.uid ? citizenMap.get(inc.uid) : null);
            citizenMap.set(key, prev ? { ...prev, ...inc } : inc);
          }
          dataToSave.citizenUsers = Array.from(citizenMap.values());
        }

        // 2C. Merge reports by id so new citizen complaints/letter requests are never overwritten
        if (Array.isArray(existingDb.reports) || Array.isArray(dataToSave.reports)) {
          const reportMap = new Map();
          for (const r of existingDb.reports || []) {
            if (r && r.id && !deletedSet.has(r.id)) {
              reportMap.set(r.id, r);
            }
          }
          for (const inc of dataToSave.reports || []) {
            if (!inc || !inc.id || deletedSet.has(inc.id)) continue;
            const prev = reportMap.get(inc.id);
            reportMap.set(inc.id, prev ? { ...prev, ...inc } : inc);
          }
          dataToSave.reports = Array.from(reportMap.values());
        }

        // 2D. Merge pengaduanRecords by ticketCode/id so online complaints are never overwritten
        if (Array.isArray(existingDb.pengaduanRecords) || Array.isArray(dataToSave.pengaduanRecords)) {
          const pgdMap = new Map();
          for (const p of existingDb.pengaduanRecords || []) {
            const key = p && (p.ticketCode || p.id);
            if (key && !deletedSet.has(p.id || key)) pgdMap.set(key, p);
          }
          for (const inc of dataToSave.pengaduanRecords || []) {
            const key = inc && (inc.ticketCode || inc.id);
            if (!key || deletedSet.has(inc.id || key)) continue;
            const prev = pgdMap.get(key);
            pgdMap.set(key, prev ? { ...prev, ...inc } : inc);
          }
          dataToSave.pengaduanRecords = Array.from(pgdMap.values());
        }

        // 2E. Merge praRegistrasiRecords by ticketCode/id so letter requests are never overwritten
        if (Array.isArray(existingDb.praRegistrasiRecords) || Array.isArray(dataToSave.praRegistrasiRecords)) {
          const praMap = new Map();
          for (const p of existingDb.praRegistrasiRecords || []) {
            const key = p && (p.ticketCode || p.id);
            if (key && !deletedSet.has(p.id || key)) praMap.set(key, p);
          }
          for (const inc of dataToSave.praRegistrasiRecords || []) {
            const key = inc && (inc.ticketCode || inc.id);
            if (!key || deletedSet.has(inc.id || key)) continue;
            const prev = praMap.get(key);
            praMap.set(key, prev ? { ...prev, ...inc } : inc);
          }
          dataToSave.praRegistrasiRecords = Array.from(praMap.values());
        }

        // 2F. Union-merge core master & environmental collections so an unhydrated client cannot blank them
        const unionMergeById = (key) => {
          if (!Array.isArray(existingDb[key]) && !Array.isArray(dataToSave[key])) return;
          const map = new Map();
          for (const item of existingDb[key] || []) {
            if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
          }
          for (const inc of dataToSave[key] || []) {
            if (!inc || !inc.id || deletedSet.has(inc.id)) continue;
            const prev = map.get(inc.id);
            map.set(inc.id, prev ? { ...prev, ...inc } : inc);
          }
          dataToSave[key] = Array.from(map.values());
        };
        [
          'wasteUnits',
          'wasteLogs',
          'tebaSpots',
          'bioporiPoints',
          'cleanupEvents',
          'kelurahanInfos',
          'whatsappRecipients',
          'seedRequests',
          'urbanFarmingSpots',
          'sponsors',
        ].forEach(unionMergeById);

        if (Array.isArray(existingDb.rwGroups) && existingDb.rwGroups.length > 0) {
          const rwKey = (rw) => String(rw?.rwCode || rw?.id || '').trim().toLowerCase().replace(/\s+/g, '');
          const rwMap = new Map();
          for (const r of existingDb.rwGroups) {
            const k = rwKey(r);
            if (k) rwMap.set(k, r);
          }
          for (const incRw of dataToSave.rwGroups || []) {
            const k = rwKey(incRw);
            if (!k) continue;
            const prevRw = rwMap.get(k);
            if (!prevRw) {
              rwMap.set(k, incRw);
            } else {
              const rtMap = new Map();
              for (const rt of prevRw.rtList || []) if (rt && rt.id) rtMap.set(rt.id, rt);
              for (const rt of incRw.rtList || []) if (rt && rt.id) rtMap.set(rt.id, rt);
              rwMap.set(k, {
                ...prevRw,
                ...incRw,
                ketuaRwName: (incRw.ketuaRwName && String(incRw.ketuaRwName).trim()) || prevRw.ketuaRwName || '',
                rwName: (incRw.rwName && String(incRw.rwName).trim()) || prevRw.rwName || incRw.rwCode,
                phone: (incRw.phone && String(incRw.phone).trim()) || prevRw.phone || '',
                areaDescription: (incRw.areaDescription && String(incRw.areaDescription).trim()) || prevRw.areaDescription || '',
                rtList: Array.from(rtMap.values()),
              });
            }
          }
          dataToSave.rwGroups = Array.from(rwMap.values());
        }

        if (
          Array.isArray(existingDb.siskamlingSchedules) &&
          existingDb.siskamlingSchedules.length > 0 &&
          (!Array.isArray(dataToSave.siskamlingSchedules) || dataToSave.siskamlingSchedules.length === 0)
        ) {
          dataToSave.siskamlingSchedules = existingDb.siskamlingSchedules.filter((s) => s && s.rw);
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
