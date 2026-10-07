export type AppView =
  | 'beranda'
  | 'profil'
  | 'warga'
  | 'lurah'
  | 'peta'
  | 'sampah'
  | 'kerjabakti'
  | 'admin';

export type ReportStatus = 'Menunggu Verifikasi' | 'Sedang Ditangani' | 'Selesai';

export type ReportCategory =
  | 'Sampah Liar & TPS'
  | 'Drainase & Genangan'
  | 'Pohon & Ruang Hijau'
  | 'Ketertiban & Fasum';

export type ReportUrgency = 'Normal' | 'Tinggi' | 'Darurat';

export interface CitizenReport {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  status: ReportStatus;
  reporterName: string;
  reporterPhone: string;
  rw: string;
  rt: string;
  locationName: string;
  // Normalized map coordinates (0-100 % on Kelurahan Panaikang spatial map)
  mapX: number;
  mapY: number;
  coordinatesLabel: string;
  createdAt: string;
  updatedAt: string;
  assignedTeam: string;
  responseNote: string;
  upvotes: number;
  imageUrl: string;
}

export interface WasteBankUnit {
  id: string;
  rw: string;
  unitName: string;
  coordinator: string;
  locationLabel: string;
  mapX: number;
  mapY: number;
  organikKg: number;
  anorganikKg: number;
  residuKg: number;
  activeHouseholds: number;
  pickupSchedule: string;
  lastUpdated: string;
}

export interface WasteLogEntry {
  id: string;
  date: string;
  rw: string;
  unitName: string;
  organikKg: number;
  anorganikKg: number;
  residuKg: number;
  officerName: string;
  notes: string;
}

export interface CleanupEvent {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  rw: string;
  rtScope: string;
  locationName: string;
  mapX: number;
  mapY: number;
  coordinator: string;
  status: 'Terjadwal' | 'Sedang Berlangsung' | 'Tuntas';
  targetParticipants: number;
  registeredParticipants: number;
  collectedWasteKg: number;
  focusAreas: string[];
  equipmentNeeded: string[];
  imageUrl: string;
  documentationPhotos?: string[];
  summaryNote: string;
}

export interface MonthlyReportTrend {
  month: string;
  fullMonth: string;
  totalLaporan: number;
  selesai: number;
  proses: number;
  sampahLiar: number;
  drainase: number;
  pohonHijau: number;
  fasum: number;
  indeksKebersihan: number;
}

export interface KelurahanProfile {
  lurahName: string;
  lurahNip: string;
  lurahRank: string;
  lurahPeriod: string;
  lurahMessage: string;
  sekretarisName: string;
  kasiKebersihanName: string;
  kasiPemerintahanName: string;
  officeAddress: string;
  subDistrict: string;
  city: string;
  postalCode: string;
  serviceHours: string;
  phoneContact: string;
  emailContact: string;
  areaKm2: string;
  totalRw: number;
  totalRt: number;
  totalPopulation: string;
  visi: string;
  misi: string[];
  boundaries: {
    utara: string;
    selatan: string;
    timur: string;
    barat: string;
  };
}

export interface KelurahanInfoItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  instagramHandle?: string;
  instagramPostUrl?: string;
  instagramLikes?: number;
  instagramCommentsCount?: number;
  isInstagramSynced?: boolean;
  hashtags?: string[];
}
