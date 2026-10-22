import {
  KelurahanProfile,
  RwGroup,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  CleanupEvent,
  KelurahanInfoItem,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActivityLog,
  UrbanFarmingSpot,
  SeedRequestItem,
  UrbanFarmingLocation,
  FarmerGroup,
  CropItem,
  PlantCareLog,
  HarvestRecord,
  FarmingInventoryItem,
  SupplyRequestItem,
} from '../types';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_RW_GROUPS,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_TEBA_SPOTS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
  INITIAL_URBAN_FARMING_LOCATIONS,
  INITIAL_FARMER_GROUPS,
  INITIAL_CROPS,
  INITIAL_PLANT_CARE_LOGS,
  INITIAL_HARVEST_RECORDS,
  INITIAL_FARMING_INVENTORIES,
  INITIAL_SUPPLY_REQUESTS,
} from '../data/initialData';
import { SERVICE_CATEGORY_GROUPS, ServiceCategoryGroup } from '../data/wargaServiceCatalog';

export interface PersistedDatabase {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  tebaSpots?: TebaSpot[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  whatsappRecipients: WhatsAppRecipient[];
  serviceCatalog?: ServiceCategoryGroup[];
  adminUsers?: AdminUserAccount[];
  activityLogs?: AdminActivityLog[];
  urbanFarmingSpots?: UrbanFarmingSpot[];
  seedRequests?: SeedRequestItem[];
  urbanFarmingLocations?: UrbanFarmingLocation[];
  farmerGroups?: FarmerGroup[];
  crops?: CropItem[];
  plantCareLogs?: PlantCareLog[];
  harvestRecords?: HarvestRecord[];
  farmingInventories?: FarmingInventoryItem[];
  supplyRequests?: SupplyRequestItem[];
  updatedAt: number;
}

const STORAGE_KEY = 'pnk_smart_env_db_v3';

export function loadPersistedDatabase(): PersistedDatabase | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;
    if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
      return null;
    }
    const hasOfficialRwData =
      Array.isArray(parsed.rwGroups) &&
      parsed.rwGroups.length === 7 &&
      parsed.rwGroups[0]?.ketuaRwName === 'EDWIN BURHANUDDIN';

    const resolvedRwGroups = hasOfficialRwData ? parsed.rwGroups! : INITIAL_RW_GROUPS;
    const resolvedProfile = parsed.profile
      ? {
          ...parsed.profile,
          totalRw: resolvedRwGroups.length,
          totalRt: resolvedRwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0),
        }
      : INITIAL_KELURAHAN_PROFILE;

    return {
      profile: resolvedProfile,
      rwGroups: resolvedRwGroups,
      reports: Array.isArray(parsed.reports) ? parsed.reports : INITIAL_REPORTS,
      wasteUnits: Array.isArray(parsed.wasteUnits) ? parsed.wasteUnits : INITIAL_WASTE_UNITS,
      wasteLogs: Array.isArray(parsed.wasteLogs) ? parsed.wasteLogs : INITIAL_WASTE_LOGS,
      tebaSpots:
        Array.isArray(parsed.tebaSpots) && parsed.tebaSpots.length > 0
          ? parsed.tebaSpots
          : INITIAL_TEBA_SPOTS,
      cleanupEvents: Array.isArray(parsed.cleanupEvents)
        ? parsed.cleanupEvents
        : INITIAL_CLEANUP_EVENTS,
      kelurahanInfos: Array.isArray(parsed.kelurahanInfos)
        ? parsed.kelurahanInfos
        : INITIAL_KELURAHAN_INFOS,
      whatsappRecipients: Array.isArray(parsed.whatsappRecipients)
        ? parsed.whatsappRecipients
        : INITIAL_WHATSAPP_RECIPIENTS,
      serviceCatalog:
        Array.isArray(parsed.serviceCatalog) && parsed.serviceCatalog.length > 0
          ? parsed.serviceCatalog
          : SERVICE_CATEGORY_GROUPS,
      adminUsers:
        Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
          ? parsed.adminUsers
          : INITIAL_ADMIN_USERS,
      activityLogs:
        Array.isArray(parsed.activityLogs) && parsed.activityLogs.length > 0
          ? parsed.activityLogs
          : INITIAL_ACTIVITY_LOGS,
      urbanFarmingSpots:
        Array.isArray(parsed.urbanFarmingSpots) && parsed.urbanFarmingSpots.length > 0
          ? parsed.urbanFarmingSpots
          : INITIAL_URBAN_FARMING_SPOTS,
      seedRequests:
        Array.isArray(parsed.seedRequests) && parsed.seedRequests.length > 0
          ? parsed.seedRequests
          : INITIAL_SEED_REQUESTS,
      urbanFarmingLocations:
        Array.isArray(parsed.urbanFarmingLocations) && parsed.urbanFarmingLocations.length > 0
          ? parsed.urbanFarmingLocations
          : INITIAL_URBAN_FARMING_LOCATIONS,
      farmerGroups:
        Array.isArray(parsed.farmerGroups) && parsed.farmerGroups.length > 0
          ? parsed.farmerGroups
          : INITIAL_FARMER_GROUPS,
      crops:
        Array.isArray(parsed.crops) && parsed.crops.length > 0
          ? parsed.crops
          : INITIAL_CROPS,
      plantCareLogs:
        Array.isArray(parsed.plantCareLogs) && parsed.plantCareLogs.length > 0
          ? parsed.plantCareLogs
          : INITIAL_PLANT_CARE_LOGS,
      harvestRecords:
        Array.isArray(parsed.harvestRecords) && parsed.harvestRecords.length > 0
          ? parsed.harvestRecords
          : INITIAL_HARVEST_RECORDS,
      farmingInventories:
        Array.isArray(parsed.farmingInventories) && parsed.farmingInventories.length > 0
          ? parsed.farmingInventories
          : INITIAL_FARMING_INVENTORIES,
      supplyRequests:
        Array.isArray(parsed.supplyRequests) && parsed.supplyRequests.length > 0
          ? parsed.supplyRequests
          : INITIAL_SUPPLY_REQUESTS,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function savePersistedDatabase(db: PersistedDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('Could not save full state to localStorage:', err);
  }
}
