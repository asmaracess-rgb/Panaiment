import type { CitizenReport, ReportCategory } from '../types.ts';

export type SeksiKelurahanType =
  | 'Seksi Pemerintahan'
  | 'Seksi Perekonomian & Pembangunan'
  | 'Seksi Pemberdayaan Masyarakat'
  | 'Lurah';

export interface LayananSeksiInfo {
  seksiName: SeksiKelurahanType;
  assignedTeam: string;
  processingUnit: string;
  category: ReportCategory;
  serviceCategoryId: string;
  serviceCategoryTitle: string;
  approverRole: string;
  canonicalCode: string;
  officialServiceName: string;
}

/**
 * 13 Official Administrative Letters of Kelurahan Panaikang
 * Mapped to their authentic municipal structural sections (Seksi)
 */
export const OFFICIAL_13_LAYANAN_SEKSI_MAP: Record<string, LayananSeksiInfo> = {
  // 1. Pindah Masuk
  'PM-01': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Kependudukan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'administrasi_kependudukan',
    serviceCategoryTitle: 'Administrasi Kependudukan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'PM-01',
    officialServiceName: 'Permohonan Pindah Masuk Penduduk',
  },
  // 2. Pindah Keluar
  'PK-02': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Kependudukan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'administrasi_kependudukan',
    serviceCategoryTitle: 'Administrasi Kependudukan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'PK-02',
    officialServiceName: 'Permohonan Pindah Keluar Penduduk',
  },
  // 3. Surat Kelahiran
  'SK-03': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Kependudukan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'administrasi_kependudukan',
    serviceCategoryTitle: 'Administrasi Kependudukan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SK-03',
    officialServiceName: 'Permohonan Surat Kelahiran',
  },
  // 4. Surat Kematian
  'SK-04': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Pelayanan Umum',
    category: 'Surat Keterangan',
    serviceCategoryId: 'administrasi_kependudukan',
    serviceCategoryTitle: 'Administrasi Kependudukan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SK-04',
    officialServiceName: 'Permohonan Surat Kematian',
  },
  // 5. Domisili Sementara
  'DS-05': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Pelayanan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'DS-05',
    officialServiceName: 'Surat Keterangan Domisili Sementara',
  },
  'DK-05': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Pelayanan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'DS-05',
    officialServiceName: 'Surat Keterangan Domisili Sementara',
  },
  // 6. Pengantar SKCK
  'SKCK-06': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Trantib Kelurahan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SKCK-06',
    officialServiceName: 'Surat Keterangan Catatan Kepolisian (SKCK)',
  },
  'SK-06': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Trantib Kelurahan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SKCK-06',
    officialServiceName: 'Surat Keterangan Catatan Kepolisian (SKCK)',
  },
  // 7. Domisili Usaha
  'DU-07': {
    seksiName: 'Seksi Perekonomian & Pembangunan',
    assignedTeam: 'Seksi Perekonomian & Pembangunan Kelurahan Panaikang',
    processingUnit: 'Seksi Perekonomian, Pembangunan & UMKM',
    category: 'Surat Keterangan',
    serviceCategoryId: 'pelayanan_usaha',
    serviceCategoryTitle: 'Pelayanan Usaha & Ekonomi',
    approverRole: 'Kasi Perekonomian & Pembangunan',
    canonicalCode: 'DU-07',
    officialServiceName: 'Surat Keterangan Domisili Usaha',
  },
  // 8. Surat Keterangan Usaha (SKU)
  'SKU-08': {
    seksiName: 'Seksi Perekonomian & Pembangunan',
    assignedTeam: 'Seksi Perekonomian & Pembangunan Kelurahan Panaikang',
    processingUnit: 'Seksi Perekonomian, Pembangunan & UMKM',
    category: 'Surat Keterangan',
    serviceCategoryId: 'pelayanan_usaha',
    serviceCategoryTitle: 'Pelayanan Usaha & Ekonomi',
    approverRole: 'Kasi Perekonomian & Pembangunan',
    canonicalCode: 'SKU-08',
    officialServiceName: 'Surat Keterangan Usaha (SKU)',
  },
  'SU-08': {
    seksiName: 'Seksi Perekonomian & Pembangunan',
    assignedTeam: 'Seksi Perekonomian & Pembangunan Kelurahan Panaikang',
    processingUnit: 'Seksi Perekonomian, Pembangunan & UMKM',
    category: 'Surat Keterangan',
    serviceCategoryId: 'pelayanan_usaha',
    serviceCategoryTitle: 'Pelayanan Usaha & Ekonomi',
    approverRole: 'Kasi Perekonomian & Pembangunan',
    canonicalCode: 'SKU-08',
    officialServiceName: 'Surat Keterangan Usaha (SKU)',
  },
  // 9. Surat Keterangan Usaha Tambahan
  'SKUT-09': {
    seksiName: 'Seksi Perekonomian & Pembangunan',
    assignedTeam: 'Seksi Perekonomian & Pembangunan Kelurahan Panaikang',
    processingUnit: 'Seksi Perekonomian & Pembangunan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'pelayanan_usaha',
    serviceCategoryTitle: 'Pelayanan Usaha & Ekonomi',
    approverRole: 'Kasi Perekonomian & Pembangunan',
    canonicalCode: 'SKUT-09',
    officialServiceName: 'Surat Keterangan Usaha Tambahan',
  },
  'SU-09': {
    seksiName: 'Seksi Perekonomian & Pembangunan',
    assignedTeam: 'Seksi Perekonomian & Pembangunan Kelurahan Panaikang',
    processingUnit: 'Seksi Perekonomian & Pembangunan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'pelayanan_usaha',
    serviceCategoryTitle: 'Pelayanan Usaha & Ekonomi',
    approverRole: 'Kasi Perekonomian & Pembangunan',
    canonicalCode: 'SKUT-09',
    officialServiceName: 'Surat Keterangan Usaha Tambahan',
  },
  // 10. Surat Keterangan Belum Menikah
  'SBM-10': {
    seksiName: 'Seksi Pemberdayaan Masyarakat',
    assignedTeam: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
    processingUnit: 'Seksi Pemberdayaan Masyarakat & Kesejahteraan Sosial (Kesra)',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Kesejahteraan Sosial',
    approverRole: 'Kasi Pemberdayaan Masyarakat',
    canonicalCode: 'SBM-10',
    officialServiceName: 'Surat Keterangan Belum Menikah',
  },
  'BM-10': {
    seksiName: 'Seksi Pemberdayaan Masyarakat',
    assignedTeam: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
    processingUnit: 'Seksi Pemberdayaan Masyarakat & Kesejahteraan Sosial (Kesra)',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Kesejahteraan Sosial',
    approverRole: 'Kasi Pemberdayaan Masyarakat',
    canonicalCode: 'SBM-10',
    officialServiceName: 'Surat Keterangan Belum Menikah',
  },
  // 11. Surat Pengantar Nikah (N1-N4)
  'SPN-11': {
    seksiName: 'Seksi Pemberdayaan Masyarakat',
    assignedTeam: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
    processingUnit: 'Seksi Pemberdayaan Masyarakat & Kesejahteraan Sosial (Kesra)',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Kesejahteraan Sosial',
    approverRole: 'Kasi Pemberdayaan Masyarakat',
    canonicalCode: 'SPN-11',
    officialServiceName: 'Surat Pengantar Nikah (Formulir N1 - N4)',
  },
  'PN-11': {
    seksiName: 'Seksi Pemberdayaan Masyarakat',
    assignedTeam: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
    processingUnit: 'Seksi Pemberdayaan Masyarakat & Kesejahteraan Sosial (Kesra)',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Kesejahteraan Sosial',
    approverRole: 'Kasi Pemberdayaan Masyarakat',
    canonicalCode: 'SPN-11',
    officialServiceName: 'Surat Pengantar Nikah (Formulir N1 - N4)',
  },
  // 12. Surat Keterangan Ahli Waris
  'AW-12': {
    seksiName: 'Lurah',
    assignedTeam: 'Kantor Lurah & Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Kantor Lurah & Seksi Pemerintahan (Penetapan Ahli Waris)',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan Ahli Waris',
    approverRole: 'Lurah',
    canonicalCode: 'AW-12',
    officialServiceName: 'Surat Keterangan Ahli Waris',
  },
  // 13. Surat Keterangan Lainnya
  'SKL-13': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Pelayanan Umum',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan Umum',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SKL-13',
    officialServiceName: 'Surat Keterangan Lainnya',
  },
  'SL-13': {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Seksi Pemerintahan & Loket Pelayanan Umum',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Keterangan Umum',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SKL-13',
    officialServiceName: 'Surat Keterangan Lainnya',
  },
};

/**
 * Returns exact Seksi information for any of the 13 layanan surat administrasi
 */
export function getLayananSeksiInfo(codeOrId?: string, fallbackTitle?: string): LayananSeksiInfo {
  const raw = (codeOrId || '').trim().toUpperCase();

  // Direct lookup
  if (OFFICIAL_13_LAYANAN_SEKSI_MAP[raw]) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP[raw];
  }

  // Check prefix or partial match
  for (const [key, info] of Object.entries(OFFICIAL_13_LAYANAN_SEKSI_MAP)) {
    if (raw.startsWith(key) || raw.includes(key)) {
      return info;
    }
  }

  // Check by service title / id keywords
  const title = (fallbackTitle || codeOrId || '').toLowerCase();
  if (title.includes('pindah masuk')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['PM-01'];
  if (title.includes('pindah keluar')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['PK-02'];
  if (title.includes('kelahiran')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['SK-03'];
  if (title.includes('kematian')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['SK-04'];
  if (title.includes('domisili sementara') || title.includes('tinggal sementara')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['DS-05'];
  }
  if (title.includes('skck') || title.includes('kepolisian')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['SKCK-06'];
  }
  if (title.includes('domisili usaha')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['DU-07'];
  if (title.includes('usaha tambahan')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['SKUT-09'];
  if (title.includes('usaha') || title.includes('sku')) return OFFICIAL_13_LAYANAN_SEKSI_MAP['SKU-08'];
  if (title.includes('belum menikah') || title.includes('belum pernah menikah')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['SBM-10'];
  }
  if (title.includes('pengantar nikah') || title.includes('n1')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['SPN-11'];
  }
  if (title.includes('ahli waris') || title.includes('waris')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['AW-12'];
  }
  if (title.includes('keterangan lainnya') || title.includes('suket')) {
    return OFFICIAL_13_LAYANAN_SEKSI_MAP['SKL-13'];
  }

  // Default fallback
  return {
    seksiName: 'Seksi Pemerintahan',
    assignedTeam: 'Seksi Pemerintahan Kelurahan Panaikang',
    processingUnit: 'Loket Pelayanan Administrasi Kelurahan',
    category: 'Surat Keterangan',
    serviceCategoryId: 'surat_keterangan',
    serviceCategoryTitle: 'Pelayanan Surat Administrasi',
    approverRole: 'Kasi Pemerintahan',
    canonicalCode: 'SKL-13',
    officialServiceName: 'Surat Keterangan Pelayanan',
  };
}

/**
 * Authoritative check to determine if a record is an Administrative Letter (Surat Administrasi)
 * or a public complaint / report (Pengaduan Lingkungan).
 * MUST return TRUE for all 13 official letters & pre-registrations (REG-2026-xxxx, SRT-, PLY-, etc.)
 * and FALSE for public complaints (PGD-2026-xxxx, ADU-, etc.).
 */
export function isSuratAdministrasi(r?: Partial<CitizenReport> | null): boolean {
  if (!r) return false;

  const tc = String(r.ticketCode || '').toUpperCase().trim();

  // If ticket explicitly marks an Aduan/Pengaduan, it is NOT surat
  if (tc.startsWith('PGD-') || tc.startsWith('ADU-')) {
    return false;
  }

  // 1. Direct ticket code prefixes for surat
  if (
    tc.startsWith('REG-') ||
    tc.startsWith('SRT-') ||
    tc.startsWith('PLY-') ||
    tc.startsWith('PM-01') ||
    tc.startsWith('PK-02') ||
    tc.startsWith('SK-03') ||
    tc.startsWith('SK-04') ||
    tc.startsWith('DS-05') ||
    tc.startsWith('DK-05') ||
    tc.startsWith('SKCK-06') ||
    tc.startsWith('DU-07') ||
    tc.startsWith('SKU-08') ||
    tc.startsWith('SU-08') ||
    tc.startsWith('SKUT-09') ||
    tc.startsWith('SU-09') ||
    tc.startsWith('SBM-10') ||
    tc.startsWith('BM-10') ||
    tc.startsWith('SPN-11') ||
    tc.startsWith('PN-11') ||
    tc.startsWith('AW-12') ||
    tc.startsWith('SKL-13') ||
    tc.startsWith('SL-13')
  ) {
    return true;
  }

  // 2. Document Code match
  const docCode = String(r.documentCode || '').toUpperCase().trim();
  if (
    docCode.startsWith('PM-') ||
    docCode.startsWith('PK-') ||
    docCode.startsWith('SK-') ||
    docCode.startsWith('DS-') ||
    docCode.startsWith('DK-') ||
    docCode.startsWith('SKCK-') ||
    docCode.startsWith('DU-') ||
    docCode.startsWith('SKU-') ||
    docCode.startsWith('SU-') ||
    docCode.startsWith('SBM-') ||
    docCode.startsWith('BM-') ||
    docCode.startsWith('SPN-') ||
    docCode.startsWith('PN-') ||
    docCode.startsWith('AW-') ||
    docCode.startsWith('SKL-') ||
    docCode.startsWith('SL-') ||
    docCode.includes('/ ADM-') ||
    docCode.includes('/ SKU /') ||
    docCode.includes('/ SKTM /') ||
    docCode.includes('/ SKD /') ||
    docCode.includes('/ SKAW /') ||
    docCode.includes('/ N1-N4 /')
  ) {
    return true;
  }

  // 3. Service Sub Item ID match
  const subId = String(r.serviceSubItemId || '').toUpperCase().trim();
  if (
    subId.startsWith('PM-') ||
    subId.startsWith('PK-') ||
    subId.startsWith('SK-') ||
    subId.startsWith('DS-') ||
    subId.startsWith('DK-') ||
    subId.startsWith('SKCK-') ||
    subId.startsWith('DU-') ||
    subId.startsWith('SKU-') ||
    subId.startsWith('SU-') ||
    subId.startsWith('SBM-') ||
    subId.startsWith('BM-') ||
    subId.startsWith('SPN-') ||
    subId.startsWith('PN-') ||
    subId.startsWith('AW-') ||
    subId.startsWith('SKL-') ||
    subId.startsWith('SL-') ||
    subId.includes('ADM-') ||
    subId.includes('SUKET')
  ) {
    return true;
  }

  // 4. Service Category ID
  const catId = String(r.serviceCategoryId || '').toLowerCase().trim();
  if (
    catId === 'surat_keterangan' ||
    catId === 'administrasi_kependudukan' ||
    catId === 'pelayanan_usaha' ||
    catId === 'pelayanan_administrasi' ||
    catId === 'layanan_administrasi' ||
    catId === 'buat_surat' ||
    catId === 'adminduk'
  ) {
    return true;
  }

  // 5. Category field is explicitly Surat Keterangan
  if (r.category === 'Surat Keterangan') {
    return true;
  }

  // 6. Assigned team is Seksi (and not Satgas aduan)
  const assigned = String(r.assignedTeam || '');
  if (
    (assigned.includes('Seksi Pemerintahan') ||
      assigned.includes('Seksi Perekonomian') ||
      assigned.includes('Seksi Pemberdayaan Masyarakat') ||
      assigned.includes('Loket Pelayanan') ||
      assigned.includes('Loket Kependudukan')) &&
    !assigned.includes('Satgas') &&
    !assigned.includes('Reaksi Cepat')
  ) {
    return true;
  }

  // 7. Letter register number exists
  if (r.letterRegisterNumber && r.letterRegisterNumber.trim().length > 0) {
    return true;
  }

  return false;
}
