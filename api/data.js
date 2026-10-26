import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      // 1. Check /tmp first for latest runtime modifications on serverless
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf8');
        const parsed = JSON.parse(raw);
        return res.status(200).json({ ok: true, data: sanitizeData(parsed) });
      }

      // 2. Fallback to static repo db
      if (fs.existsSync(repoPath)) {
        const raw = fs.readFileSync(repoPath, 'utf8');
        const parsed = JSON.parse(raw);
        return res.status(200).json({ ok: true, data: sanitizeData(parsed) });
      }

      return res.status(200).json({ ok: true, data: null });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const body = req.body;
      const dataToSave = typeof body === 'string' ? JSON.parse(body) : (body || {});
      dataToSave.updatedAt = Date.now();

      sanitizeData(dataToSave);

      // In serverless, write to /tmp for subsequent reads within the lambda container
      try {
        fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2));
      } catch {}

      // Also try writing to data/ directory if writable in local environment
      try {
        fs.writeFileSync(repoPath, JSON.stringify(dataToSave, null, 2));
      } catch {}

      return res.status(200).json({ ok: true, data: dataToSave });
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
