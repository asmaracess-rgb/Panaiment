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
