import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const appTsxPath = path.join(rootDir, 'src/App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// 1. Replace state initializations (around lines 80 to 142)
const stateInitRegex = /const \[activeView, setActiveView\] = useState<AppView>\('beranda'\);[\s\S]*?const \[toasts, setToasts\] = useState<ToastNotification\[\]>\(\[\]\);/;

const newStateInit = `const [activeView, setActiveView] = useState<AppView>('beranda');
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('dashboard_lurah');
  const [kelurahanProfile, setKelurahanProfile] = useState<KelurahanProfile>(
    initialPersisted?.profile ?? INITIAL_KELURAHAN_PROFILE
  );

  const [reports, setReports] = useState<CitizenReport[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.reports)
      ? initialPersisted.reports
      : INITIAL_REPORTS;
    return source.filter((r) => r && r.id && !deleted.has(r.id));
  });

  const [wasteUnits, setWasteUnits] = useState<WasteBankUnit[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.wasteUnits)
      ? initialPersisted.wasteUnits
      : INITIAL_WASTE_UNITS;
    return source.filter((u) => u && u.id && !deleted.has(u.id));
  });

  const [wasteLogs, setWasteLogs] = useState<WasteLogEntry[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.wasteLogs)
      ? initialPersisted.wasteLogs
      : INITIAL_WASTE_LOGS;
    return source.filter((l) => l && l.id && !deleted.has(l.id));
  });

  const [cleanupEvents, setCleanupEvents] = useState<CleanupEvent[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.cleanupEvents)
      ? initialPersisted.cleanupEvents
      : INITIAL_CLEANUP_EVENTS;
    return source.filter((e) => e && e.id && !deleted.has(e.id));
  });

  const [kelurahanInfos, setKelurahanInfos] = useState<KelurahanInfoItem[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.kelurahanInfos)
      ? initialPersisted.kelurahanInfos
      : INITIAL_KELURAHAN_INFOS;
    return source.filter((i) => i && i.id && !deleted.has(i.id));
  });

  const [rwGroups, setRwGroups] = useState<RwGroup[]>(
    initialPersisted?.rwGroups ?? INITIAL_RW_GROUPS
  );

  const [whatsappRecipients, setWhatsappRecipients] = useState<WhatsAppRecipient[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.whatsappRecipients)
      ? initialPersisted.whatsappRecipients
      : INITIAL_WHATSAPP_RECIPIENTS;
    return source.filter((w) => w && w.id && !deleted.has(w.id));
  });

  const [serviceCatalog, setServiceCatalog] = useState<ServiceCategoryGroup[]>(
    Array.isArray(initialPersisted?.serviceCatalog) && initialPersisted.serviceCatalog.length > 0
      ? initialPersisted.serviceCatalog
      : SERVICE_CATEGORY_GROUPS
  );

  const [adminUsers, setAdminUsers] = useState<AdminUserAccount[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.adminUsers)
      ? initialPersisted.adminUsers
      : INITIAL_ADMIN_USERS;
    return source.filter((u) => u && u.id && !deleted.has(u.id));
  });

  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(
    Array.isArray(initialPersisted?.activityLogs)
      ? initialPersisted.activityLogs
      : INITIAL_ACTIVITY_LOGS
  );

  const [urbanFarmingSpots, setUrbanFarmingSpots] = useState<UrbanFarmingSpot[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.urbanFarmingSpots)
      ? initialPersisted.urbanFarmingSpots
      : INITIAL_URBAN_FARMING_SPOTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [seedRequests, setSeedRequests] = useState<SeedRequestItem[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.seedRequests)
      ? initialPersisted.seedRequests
      : INITIAL_SEED_REQUESTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [tebaSpots, setTebaSpots] = useState<TebaSpot[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.tebaSpots)
      ? initialPersisted.tebaSpots
      : INITIAL_TEBA_SPOTS;
    return source.filter((s) => s && s.id && !deleted.has(s.id));
  });

  const [bioporiPoints, setBioporiPoints] = useState<BioporiPoint[]>(() => {
    const deleted = getDeletedItemIds();
    const source = Array.isArray(initialPersisted?.bioporiPoints)
      ? initialPersisted.bioporiPoints
      : INITIAL_BIOPORI_POINTS;
    return source.filter((b) => b && b.id && !deleted.has(b.id));
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);`;

appContent = appContent.replace(stateInitRegex, newStateInit);

// 2. Replace commitPersistence (around line 198)
const commitPersistenceRegex = /const commitPersistence = useCallback\([\s\S]*?\[\]\s*\);/;

const newCommitPersistence = `const commitPersistence = useCallback(
    (partial: Partial<Omit<PersistedDatabase, 'updatedAt'>>, syncServer = true) => {
      const deletedSet = getDeletedItemIds();
      const nextDeletedArray = Array.from(
        new Set([
          ...deletedSet,
          ...(Array.isArray(partial.deletedItemIds) ? partial.deletedItemIds : []),
        ])
      );

      const nextSnapshot: PersistedDatabase = {
        profile: partial.profile ?? stateRef.current.profile,
        rwGroups: partial.rwGroups ?? stateRef.current.rwGroups,
        reports: (partial.reports ?? stateRef.current.reports).filter((r) => r && r.id && !deletedSet.has(r.id)),
        wasteUnits: (partial.wasteUnits ?? stateRef.current.wasteUnits).filter((u) => u && u.id && !deletedSet.has(u.id)),
        wasteLogs: (partial.wasteLogs ?? stateRef.current.wasteLogs).filter((l) => l && l.id && !deletedSet.has(l.id)),
        tebaSpots: (partial.tebaSpots ?? stateRef.current.tebaSpots).filter((s) => s && s.id && !deletedSet.has(s.id)),
        bioporiPoints: (partial.bioporiPoints ?? stateRef.current.bioporiPoints).filter((b) => b && b.id && !deletedSet.has(b.id)),
        cleanupEvents: (partial.cleanupEvents ?? stateRef.current.cleanupEvents).filter((e) => e && e.id && !deletedSet.has(e.id)),
        kelurahanInfos: (partial.kelurahanInfos ?? stateRef.current.kelurahanInfos).filter((i) => i && i.id && !deletedSet.has(i.id)),
        whatsappRecipients: (partial.whatsappRecipients ?? stateRef.current.whatsappRecipients).filter((w) => w && w.id && !deletedSet.has(w.id)),
        serviceCatalog: partial.serviceCatalog ?? stateRef.current.serviceCatalog,
        adminUsers: (partial.adminUsers ?? stateRef.current.adminUsers).filter((u) => u && u.id && !deletedSet.has(u.id)),
        activityLogs: partial.activityLogs ?? stateRef.current.activityLogs,
        urbanFarmingSpots: (partial.urbanFarmingSpots ?? stateRef.current.urbanFarmingSpots).filter((s) => s && s.id && !deletedSet.has(s.id)),
        seedRequests: (partial.seedRequests ?? stateRef.current.seedRequests).filter((s) => s && s.id && !deletedSet.has(s.id)),
        deletedItemIds: nextDeletedArray,
        updatedAt: Date.now(),
      };

      stateRef.current = {
        profile: nextSnapshot.profile,
        rwGroups: nextSnapshot.rwGroups,
        reports: nextSnapshot.reports,
        wasteUnits: nextSnapshot.wasteUnits,
        wasteLogs: nextSnapshot.wasteLogs,
        tebaSpots: nextSnapshot.tebaSpots ?? [],
        bioporiPoints: nextSnapshot.bioporiPoints ?? [],
        cleanupEvents: nextSnapshot.cleanupEvents,
        kelurahanInfos: nextSnapshot.kelurahanInfos,
        whatsappRecipients: nextSnapshot.whatsappRecipients,
        serviceCatalog: nextSnapshot.serviceCatalog ?? SERVICE_CATEGORY_GROUPS,
        adminUsers: nextSnapshot.adminUsers ?? [],
        activityLogs: nextSnapshot.activityLogs ?? [],
        urbanFarmingSpots: nextSnapshot.urbanFarmingSpots ?? [],
        seedRequests: nextSnapshot.seedRequests ?? [],
      };

      savePersistedDatabase(nextSnapshot);

      if (syncServer) {
        fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextSnapshot),
        }).catch(() => {});
      }
    },
    []
  );`;

appContent = appContent.replace(commitPersistenceRegex, newCommitPersistence);

// 3. Replace tebaSpots and bioporiPoints CRUD handlers in App.tsx
const tebaBioporiCrudRegex = /\/\/ 3B\. Teba Spots CRUD[\s\S]*?\/\/ 4\. Cleanup Events \(Kerja Bakti\) CRUD/;

const newTebaBioporiCrud = `// 3B. Teba Spots CRUD
  const handleAdminCreateTebaSpot = async (
    spot: Partial<TebaSpot>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const rwClean = spot.rw || 'RW 01';
    const newSpot: TebaSpot = {
      id: 'teba-' + Date.now(),
      name: spot.name || 'Titik Teba Komunal',
      code:
        spot.code ||
        'TEBA-' + rwClean.replace(/\\s+/g, '') + '-' + Date.now().toString().slice(-3),
      rw: rwClean,
      rt: spot.rt || 'RT 01',
      address: spot.address || 'Kelurahan Panaikang',
      locationTag: spot.locationTag || 'Patokan Titik Teba',
      mapUrl: spot.mapUrl || '',
      imageUrl: spot.imageUrl || '',
      documentationPhotos: spot.documentationPhotos || [spot.imageUrl || ''],
      capacityKg: Number(spot.capacityKg) || 300,
      currentLoadKg: Number(spot.currentLoadKg) || 0,
      wasteTypeProcessed: spot.wasteTypeProcessed || 'Sisa sayur dapur & dedaunan',
      coordinatorName: spot.coordinatorName || 'Kader Lingkungan',
      coordinatorPhone: spot.coordinatorPhone || '',
      status: spot.status || 'Aktif Beroperasi',
      description:
        spot.description || 'Fasilitas teba komunal biopori resapan organik mandiri.',
      lastHarvestDate: spot.lastHarvestDate || 'Belum ada panen',
      createdAt: new Date().toLocaleDateString('id-ID'),
    };
    const next = [newSpot, ...stateRef.current.tebaSpots.filter((s) => s.id !== newSpot.id)];
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpot),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminUpdateTebaSpot = async (
    id: string,
    spot: Partial<TebaSpot>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const next = stateRef.current.tebaSpots.map((s) =>
      s.id === id ? { ...s, ...spot, updatedAt: new Date().toLocaleDateString('id-ID') } : s
    );
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spot),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminDeleteTebaSpot = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const next = stateRef.current.tebaSpots.filter((s) => s.id !== id);
    setTebaSpots(next);
    commitPersistence({ tebaSpots: next }, true);

    fetch('/api/teba-spots/' + id, {
      method: 'DELETE',
    }).catch(() => {});

    return { ok: true };
  };

  // 3C. Biopori Points CRUD
  const handleAdminCreateBioporiPoint = async (
    point: Partial<BioporiPoint>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const rwClean = point.rw || 'RW 01';
    const newPoint: BioporiPoint = {
      id: 'bio-' + Date.now(),
      name: point.name || 'Zona Lubang Biopori Komunal',
      code:
        point.code ||
        'BIO-' + rwClean.replace(/\\s+/g, '') + '-' + Date.now().toString().slice(-3),
      rw: rwClean,
      rt: point.rt || 'RT 01',
      address: point.address || 'Kelurahan Panaikang',
      locationTag: point.locationTag || 'Patokan Titik Biopori',
      totalHoles: Number(point.totalHoles) || 12,
      diameterCm: Number(point.diameterCm) || 10,
      depthCm: Number(point.depthCm) || 100,
      organicTypes:
        point.organicTypes || 'Sisa sayuran dapur rumah tangga, dedaunan kering, kulit buah',
      status: point.status || 'Aktif Digunakan',
      coordinatorName: point.coordinatorName || 'Kader Lingkungan',
      coordinatorPhone: point.coordinatorPhone || '',
      mapUrl: point.mapUrl || '',
      imageUrl: point.imageUrl || '',
      documentationPhotos: point.documentationPhotos || [point.imageUrl || ''],
      harvestHistory: point.harvestHistory || 'Belum ada catatan panen',
      installationDate: point.installationDate || new Date().toLocaleDateString('id-ID'),
      notes: point.notes || 'Pipa biopori resapan air & pengomposan organik mandiri.',
      updatedAt: new Date().toLocaleDateString('id-ID'),
    };
    const next = [newPoint, ...stateRef.current.bioporiPoints.filter((b) => b.id !== newPoint.id)];
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPoint),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminUpdateBioporiPoint = async (
    id: string,
    point: Partial<BioporiPoint>
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    const next = stateRef.current.bioporiPoints.map((b) =>
      b.id === id ? { ...b, ...point, updatedAt: new Date().toLocaleDateString('id-ID') } : s
    );
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(point),
    }).catch(() => {});

    return { ok: true };
  };

  const handleAdminDeleteBioporiPoint = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const next = stateRef.current.bioporiPoints.filter((b) => b.id !== id);
    setBioporiPoints(next);
    commitPersistence({ bioporiPoints: next }, true);

    fetch('/api/biopori-points/' + id, {
      method: 'DELETE',
    }).catch(() => {});

    return { ok: true };
  };

  // 4. Cleanup Events (Kerja Bakti) CRUD`;

// Fix typo: in handleAdminUpdateBioporiPoint replace ": s" with ": b"
const fixedTebaBioporiCrud = newTebaBioporiCrud.replace(': s\n    );', ': b\n    );');

appContent = appContent.replace(tebaBioporiCrudRegex, fixedTebaBioporiCrud);

// 4. Update delete handlers for wasteUnit and wasteLog
appContent = appContent.replace(
  /const handleAdminDeleteWasteUnit = async \([\s\S]*?return \{ ok: true \};\s*\};/,
  `const handleAdminDeleteWasteUnit = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextUnits = stateRef.current.wasteUnits.filter((u) => u.id !== id);
    setWasteUnits(nextUnits);
    commitPersistence({ wasteUnits: nextUnits }, true);
    fetch('/api/waste-units/' + id, { method: 'DELETE' }).catch(() => {});
    return { ok: true };
  };`
);

appContent = appContent.replace(
  /const handleAdminDeleteWasteLog = async \([\s\S]*?return \{ ok: true \};\s*\};/,
  `const handleAdminDeleteWasteLog = async (
    id: string
  ): Promise<{ ok: boolean; errors?: string[] }> => {
    recordDeletedItemId(id);
    const nextLogs = stateRef.current.wasteLogs.filter((l) => l.id !== id);
    setWasteLogs(nextLogs);
    commitPersistence({ wasteLogs: nextLogs }, true);
    fetch('/api/waste-logs/' + id, { method: 'DELETE' }).catch(() => {});
    return { ok: true };
  };`
);

// 5. In initial useEffect on mount (fetch /api/data): ensure PUT /api/data is called with merged
appContent = appContent.replace(
  /\/\/ If local had user inputs not yet present on server, sync up to server[\s\S]*?\}\)\s*\.catch\(\(\) => \{/,
  `savePersistedDatabase(merged);

        // Synchronize merged state up to the server
        fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        }).catch(() => {});
      })
      .catch(() => {`
);

fs.writeFileSync(appTsxPath, appContent, 'utf8');
console.log('Updated src/App.tsx successfully.');
