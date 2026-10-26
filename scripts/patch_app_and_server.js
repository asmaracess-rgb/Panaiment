import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// ============================================================================
// 1. PATCH server.ts
// ============================================================================
let serverContent = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');

// Replace loadDatabase implementation in server.ts
const loadDbRegex = /function loadDatabase\(\): DatabaseSchema \{[\s\S]*?return initialDb;\s*\}/;
const newLoadDb = `function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (parsed && parsed.profile) {
        const deletedSet = new Set<string>(
          Array.isArray(parsed.deletedItemIds) ? parsed.deletedItemIds : []
        );

        const hasOfficialRwData =
          Array.isArray(parsed.rwGroups) &&
          parsed.rwGroups.length === 7 &&
          parsed.rwGroups[0]?.ketuaRwName === 'EDWIN BURHANUDDIN';
        const resolvedRwGroups = hasOfficialRwData ? parsed.rwGroups! : INITIAL_RW_GROUPS;
        const resolvedProfile: KelurahanProfile = {
          ...parsed.profile,
          totalRw: resolvedRwGroups.length,
          totalRt: resolvedRwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
        };

        const filterDeleted = <T extends { id: string }>(arr: T[] | undefined, fallback: T[]): T[] => {
          const list = Array.isArray(arr) ? arr : fallback;
          return list.filter((item) => item && item.id && !deletedSet.has(item.id));
        };

        return {
          profile: resolvedProfile,
          rwGroups: resolvedRwGroups,
          reports: filterDeleted(parsed.reports, INITIAL_REPORTS),
          wasteUnits: filterDeleted(parsed.wasteUnits, INITIAL_WASTE_UNITS),
          wasteLogs: filterDeleted(parsed.wasteLogs, INITIAL_WASTE_LOGS),
          tebaSpots: filterDeleted(parsed.tebaSpots, INITIAL_TEBA_SPOTS),
          bioporiPoints: filterDeleted(parsed.bioporiPoints, INITIAL_BIOPORI_POINTS),
          cleanupEvents: filterDeleted(parsed.cleanupEvents, INITIAL_CLEANUP_EVENTS),
          kelurahanInfos: filterDeleted(parsed.kelurahanInfos, INITIAL_KELURAHAN_INFOS),
          whatsappRecipients: filterDeleted(parsed.whatsappRecipients, INITIAL_WHATSAPP_RECIPIENTS),
          serviceCatalog:
            Array.isArray(parsed.serviceCatalog) && parsed.serviceCatalog.length > 0
              ? parsed.serviceCatalog
              : SERVICE_CATEGORY_GROUPS,
          adminUsers: filterDeleted(parsed.adminUsers, INITIAL_ADMIN_USERS),
          activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : INITIAL_ACTIVITY_LOGS,
          urbanFarmingSpots: filterDeleted(parsed.urbanFarmingSpots, INITIAL_URBAN_FARMING_SPOTS),
          seedRequests: filterDeleted(parsed.seedRequests, INITIAL_SEED_REQUESTS),
          urbanFarmingLocations: Array.isArray(parsed.urbanFarmingLocations)
            ? parsed.urbanFarmingLocations
            : INITIAL_URBAN_FARMING_LOCATIONS,
          farmerGroups: Array.isArray(parsed.farmerGroups) ? parsed.farmerGroups : INITIAL_FARMER_GROUPS,
          crops: Array.isArray(parsed.crops) ? parsed.crops : INITIAL_CROPS,
          plantCareLogs: Array.isArray(parsed.plantCareLogs) ? parsed.plantCareLogs : INITIAL_PLANT_CARE_LOGS,
          harvestRecords: Array.isArray(parsed.harvestRecords) ? parsed.harvestRecords : INITIAL_HARVEST_RECORDS,
          farmingInventories: Array.isArray(parsed.farmingInventories)
            ? parsed.farmingInventories
            : INITIAL_FARMING_INVENTORIES,
          supplyRequests: Array.isArray(parsed.supplyRequests) ? parsed.supplyRequests : INITIAL_SUPPLY_REQUESTS,
          deletedItemIds: Array.from(deletedSet),
          lastModified: parsed.lastModified || new Date().toISOString(),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        };
      }
    }
  } catch (err) {
    console.error('Failed to read DB file, seeding initial data:', err);
  }

  const initialDb: DatabaseSchema = {
    profile: INITIAL_KELURAHAN_PROFILE,
    rwGroups: INITIAL_RW_GROUPS,
    reports: INITIAL_REPORTS,
    wasteUnits: INITIAL_WASTE_UNITS,
    wasteLogs: INITIAL_WASTE_LOGS,
    tebaSpots: INITIAL_TEBA_SPOTS,
    bioporiPoints: INITIAL_BIOPORI_POINTS,
    cleanupEvents: INITIAL_CLEANUP_EVENTS,
    kelurahanInfos: INITIAL_KELURAHAN_INFOS,
    whatsappRecipients: INITIAL_WHATSAPP_RECIPIENTS,
    serviceCatalog: SERVICE_CATEGORY_GROUPS,
    adminUsers: INITIAL_ADMIN_USERS,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    urbanFarmingSpots: INITIAL_URBAN_FARMING_SPOTS,
    seedRequests: INITIAL_SEED_REQUESTS,
    urbanFarmingLocations: INITIAL_URBAN_FARMING_LOCATIONS,
    farmerGroups: INITIAL_FARMER_GROUPS,
    crops: INITIAL_CROPS,
    plantCareLogs: INITIAL_PLANT_CARE_LOGS,
    harvestRecords: INITIAL_HARVEST_RECORDS,
    farmingInventories: INITIAL_FARMING_INVENTORIES,
    supplyRequests: INITIAL_SUPPLY_REQUESTS,
    deletedItemIds: [],
    lastModified: new Date().toISOString(),
    updatedAt: 0,
  };
  saveDatabase(initialDb, 0);
  return initialDb;
}`;

serverContent = serverContent.replace(loadDbRegex, newLoadDb);
fs.writeFileSync(path.join(rootDir, 'server.ts'), serverContent, 'utf8');
console.log('Updated server.ts loadDatabase successfully.');

// ============================================================================
// 2. UPDATE api/data.js
// ============================================================================
const apiDataJsContent = `import fs from 'fs';
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
`;

fs.writeFileSync(path.join(rootDir, 'api/data.js'), apiDataJsContent, 'utf8');
console.log('Updated api/data.js successfully.');

// ============================================================================
// 3. UPDATE data/panaikang_db.json
// ============================================================================
const repoDbPath = path.join(rootDir, 'data/panaikang_db.json');
if (fs.existsSync(repoDbPath)) {
  try {
    const raw = fs.readFileSync(repoDbPath, 'utf8');
    const db = JSON.parse(raw);
    db.deletedItemIds = Array.isArray(db.deletedItemIds) ? db.deletedItemIds : [];
    db.updatedAt = Date.now();
    fs.writeFileSync(repoDbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Updated data/panaikang_db.json successfully.');
  } catch (err) {
    console.error('Failed to update data/panaikang_db.json:', err);
  }
}
