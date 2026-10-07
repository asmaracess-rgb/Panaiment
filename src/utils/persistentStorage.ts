import {
  KelurahanProfile,
  RwGroup,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  CleanupEvent,
  KelurahanInfoItem,
} from '../types';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_RW_GROUPS,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_INFOS,
} from '../data/initialData';

export interface PersistedDatabase {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
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
    return {
      profile: parsed.profile || INITIAL_KELURAHAN_PROFILE,
      rwGroups: Array.isArray(parsed.rwGroups) ? parsed.rwGroups : INITIAL_RW_GROUPS,
      reports: Array.isArray(parsed.reports) ? parsed.reports : INITIAL_REPORTS,
      wasteUnits: Array.isArray(parsed.wasteUnits) ? parsed.wasteUnits : INITIAL_WASTE_UNITS,
      wasteLogs: Array.isArray(parsed.wasteLogs) ? parsed.wasteLogs : INITIAL_WASTE_LOGS,
      cleanupEvents: Array.isArray(parsed.cleanupEvents)
        ? parsed.cleanupEvents
        : INITIAL_CLEANUP_EVENTS,
      kelurahanInfos: Array.isArray(parsed.kelurahanInfos)
        ? parsed.kelurahanInfos
        : INITIAL_KELURAHAN_INFOS,
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
