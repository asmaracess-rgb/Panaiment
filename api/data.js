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

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      // Check /tmp first for latest runtime modifications on serverless
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf8');
        return res.status(200).json({ ok: true, data: JSON.parse(raw) });
      }

      // Fallback to static repo db
      if (fs.existsSync(repoPath)) {
        const raw = fs.readFileSync(repoPath, 'utf8');
        return res.status(200).json({ ok: true, data: JSON.parse(raw) });
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

      // Prune any entities matching deletedItemIds
      const deletedSet = new Set(Array.isArray(dataToSave.deletedItemIds) ? dataToSave.deletedItemIds : []);
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
          if (Array.isArray(dataToSave[k])) {
            dataToSave[k] = dataToSave[k].filter((item) => item && item.id && !deletedSet.has(item.id));
          }
        }
      }

      // In serverless, write to /tmp for subsequent reads within the lambda container
      try {
        fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2));
      } catch {
        // Read-only /tmp fallback
      }

      // Also try writing to data/ directory if writable in local environment
      try {
        fs.writeFileSync(repoPath, JSON.stringify(dataToSave, null, 2));
      } catch {
        // Read-only filesystem on Vercel is expected
      }

      return res.status(200).json({ ok: true, data: dataToSave });
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
