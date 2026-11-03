import { SiskamlingRwSchedule, SiskamlingDay } from '../types';

export const SISKAMLING_DAYS: SiskamlingDay[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

/**
 * Data Resmi Jadwal Posko Siskamling RT/RW Kelurahan Panaikang Tahun 2026
 * Diambil langsung dari format dan daftar petugas pada matriks SK Kelurahan Panaikang.
 */
export const INITIAL_SISKAMLING_SCHEDULES: SiskamlingRwSchedule[] = [
  {
    rw: 'RW 1',
    rwName: 'Kawasan Nipah Mall & Racing Centre',
    poskoLocation: 'Posko Terpadu RW 01 (Jl. Racing Centre)',
    schedules: {
      Senin: ['EDWIN BURHANUDDIN', 'SYAMSUL BAHRI', 'IVAN RUDI', 'SYARIFUDDIN'],
      Selasa: ['AKBP PURN ISHAK IFA', 'DANIEL SUWANDI', 'SUGIANTO', 'YUNE PALLOAN'],
      Rabu: ['EDWIN BURHANUDDIN', 'HASIA T', 'BARLIANTA', 'AKBAR'],
      Kamis: ['EDWIN BURHANUDDIN', 'SYAMSUL BAHRI', 'IVAN RUDI', 'SYARIFUDDIN'],
      Jumat: ['AKBP PURN ISHAK IFA', 'DANIEL SUWANDI', 'SUGIANTO', 'YUNE PALLOAN'],
      Sabtu: ['EDWIN BURHANUDDIN', 'HASIA T', 'BARLIANTA', 'AKBAR'],
      Minggu: ['SELURUH RT/RW 001'],
    },
    notes: 'Patroli berkala kawasan poros dan pusat perbelanjaan Nipah Mall.',
  },
  {
    rw: 'RW 2',
    rwName: 'Koridor Poros Jl. Urip Sumoharjo',
    poskoLocation: 'Posko Keamanan RW 02 (Poros Urip Sumoharjo)',
    schedules: {
      Senin: ['MARKUS PAPI', 'SENTOSA SUCIPTO', 'DESY ARLIN NUSU', 'NASRUDDIN'],
      Selasa: ['GATOT SUBROTO', 'BESSE IRAWATY', 'MUHAMMAD NAWIR', 'RESTI YULIANTI BONGGA'],
      Rabu: ['MARKUS PAPI', 'ROBERTUS JAYA', 'HADIANI', 'FITRI SRI WAHYUNI'],
      Kamis: ['MARKUS PAPI', 'GATOT SUBROTO', 'DESY ARLIN NUSU', 'NASRUDDIN'],
      Jumat: ['GATOT SUBROTO', 'BESSE IRAWATY', 'MUHAMMAD NAWIR', 'RESTI YULIANTI BONGGA'],
      Sabtu: ['MARKUS PAPI', 'ROBERTUS JAYA', 'HADIANI', 'FITRI SRI WAHYUNI'],
      Minggu: ['SELURUH RT/RW 002'],
    },
    notes: 'Pemantauan ketertiban jalan arteri dan pertokoan.',
  },
  {
    rw: 'RW 3',
    rwName: 'Kawasan Kampus UMI & Lorong 2',
    poskoLocation: 'Posko Kamtibmas RW 03 (Samping Kampus UMI)',
    schedules: {
      Senin: ['MUH. YUSUF R', 'SUDIRMAN', 'MATIUS RAMDAN PASEDA', 'SERTU BAHARUDDIN'],
      Selasa: ['MUHAMMAD AMIR', 'SRIMATI A', 'GANDING', 'MARTHEN SONDA'],
      Rabu: ['JONI SANDA', 'ANDI JAYA ALIM JAHJA', 'IWAN M', 'SATNAL'],
      Kamis: ['MUH. YUSUF R', 'SUDIRMAN', 'MATIUS RAMDAN PASEDA', 'SERTU BAHARUDDIN'],
      Jumat: ['MUHAMMAD AMIR', 'SRIMATI A', 'GANDING', 'MARTHEN SONDA'],
      Sabtu: ['JONI SANDA', 'ANDI JAYA ALIM JAHJA', 'IWAN M', 'SATNAL'],
      Minggu: ['SELURUH RT/RW 003'],
    },
    notes: 'Pengamanan lingkungan rumah kost mahasiswa dan akses lorong kampus.',
  },
  {
    rw: 'RW 4',
    rwName: 'Kawasan Jl. Sukaria Raya Lorong 1–5',
    poskoLocation: 'Posko Siskamling RW 04 (Jl. Sukaria Raya)',
    schedules: {
      Senin: ['RUDY KARODO', 'AGUSTINA MAGA', 'M. ARIL SYAHRIL', 'HARLINA'],
      Selasa: ['MARTHEN SONDA', 'WAHYU', 'MUHAMMAD NATSIR', 'MIZWAR MANSYUR'],
      Rabu: ['RUDY KARODO', 'AGUSTINA MAGA', 'M. ARIL SYAHRIL', 'HARLINA'],
      Kamis: ['RUDY KARODO', 'AGUSTINA MAGA', 'M. ARIL SYAHRIL', 'HARLINA'],
      Jumat: ['MARTHEN SONDA', 'WAHYU', 'MUHAMMAD NATSIR', 'MIZWAR MANSYUR'],
      Sabtu: ['MARTHEN SONDA', 'WAHYU', 'MUHAMMAD NATSIR', 'MIZWAR MANSYUR'],
      Minggu: ['SELURUH RT/RW 004'],
    },
    notes: 'Ronda malam terpadu lorong perumahan padat penduduk Sukaria.',
  },
  {
    rw: 'RW 5',
    rwName: 'Kawasan Kompleks Kejaksaan & Adhyaksa',
    poskoLocation: 'Pos Ronda RW 05 (Kompleks Kejaksaan)',
    schedules: {
      Senin: ['HAERUDDIN TAIRAS', 'GITA OKTRIAT', 'FATMAWATI', 'SURAINI'],
      Selasa: ['HAERUDDIN TAIRAS', 'SYAMSIAH', 'SOPYAN', 'TAMRIN'],
      Rabu: ['HAERUDDIN TAIRAS', 'NURHAENI', 'SUHARTONO', 'NURWAHIDA'],
      Kamis: ['HAERUDDIN TAIRAS', 'GITA OKTRIAT', 'FATMAWATI', 'SURAINI'],
      Jumat: ['HAERUDDIN TAIRAS', 'SYAMSIAH', 'SOPYAN', 'TAMRIN'],
      Sabtu: ['HAERUDDIN TAIRAS', 'NURHAENI', 'SUHARTONO', 'NURWAHIDA'],
      Minggu: ['SELURUH RT/RW 005'],
    },
    notes: 'Pengawasan portal kompleks malam hari dan ketertiban lingkungan.',
  },
  {
    rw: 'RW 6',
    rwName: 'Kawasan Bantaran Kanal Pampang - Panaikang',
    poskoLocation: 'Posko Siaga Bencana & Ronda RW 06 (Tepi Kanal)',
    schedules: {
      Senin: ['HIDAYAT MIHARJA', 'HASMIANTI', 'M. IRSANDI NURLAN', 'ANNA MARIANA'],
      Selasa: ['HIDAYAT MIHARJA', 'MUH. RIDWAN', 'ANDI HAMRIAN', 'SAMAD'],
      Rabu: ['HIDAYAT MIHARJA', 'HASMIANTI', 'M. IRSANDI NURLAN', 'ANNA MARIANA'],
      Kamis: ['HIDAYAT MIHARJA', 'MUH. RIDWAN', 'ANDI HAMRIAN', 'MARTHEN TINRI'],
      Jumat: ['HIDAYAT MIHARJA', 'HASMIANTI', 'M. IRSANDI NURLAN', 'ANNA MARIANA'],
      Sabtu: ['HIDAYAT MIHARJA', 'MUH. RIDWAN', 'ANDI HAMRIAN', 'SAMAD'],
      Minggu: ['SELURUH RT/RW 006'],
    },
    notes: 'Monitoring keamanan dermaga kanal dan pintu air lingkungan.',
  },
  {
    rw: 'RW 7',
    rwName: 'Kawasan Flamboyan & Sukaria Timur',
    poskoLocation: 'Pos Ronda RW 07 (Jl. Flamboyan)',
    schedules: {
      Senin: ['ANNA MARIANA', 'FUAD HASAN', 'MARTHEN TINRI', 'SUDARMIN'],
      Selasa: ['SAMAD', 'ASPIR', 'ACHMAD SUNTARI', 'RUSLAN'],
      Rabu: ['ANNA MARIANA', 'FUAD HASAN', 'SAMAD', 'ASPIR'],
      Kamis: ['MARTHEN TINRI', 'SUDARMIN', 'ACHMAD SUNTARI', 'RUSLAN'],
      Jumat: ['ANNA MARIANA', 'FUAD HASAN', 'MARTHEN TINRI', 'SUDARMIN'],
      Sabtu: ['SAMAD', 'MARTHEN TINRI', 'SUDARMIN', 'ASPIR'],
      Minggu: ['SELURUH RT/RW 007'],
    },
    notes: 'Patroli lingkungan pemukiman warga Sukaria Timur.',
  },
];

export const POSKO_SISKAMLING_COORDINATES: Record<string, { lat: number; lng: number; address: string }> = {
  'RW 1': { lat: -5.1368, lng: 119.4412, address: 'Jl. Racing Centre / Kompleks Bisnis RW 01' },
  'RW 2': { lat: -5.1375, lng: 119.4470, address: 'Jl. Poros Urip Sumoharjo RW 02' },
  'RW 3': { lat: -5.1340, lng: 119.4485, address: 'Jl. Urip Sumoharjo Lorong 2 / Samping UMI RW 03' },
  'RW 4': { lat: -5.1415, lng: 119.4435, address: 'Jl. Sukaria Raya Lorong 1 RW 04' },
  'RW 5': { lat: -5.1428, lng: 119.4505, address: 'Kompleks Kejaksaan / Adhyaksa RW 05' },
  'RW 6': { lat: -5.1345, lng: 119.4538, address: 'Bantaran Kanal Pampang RW 06' },
  'RW 7': { lat: -5.1398, lng: 119.4545, address: 'Jl. Flamboyan / Sukaria Timur RW 07' },
};

/**
 * Returns the current day of the week in Indonesian Siskamling format
 */
export function getTodaySiskamlingDay(): SiskamlingDay {
  const dayIndex = new Date().getDay(); // 0 is Sunday
  const mapping: SiskamlingDay[] = [
    'Minggu', // 0
    'Senin',  // 1
    'Selasa', // 2
    'Rabu',   // 3
    'Kamis',  // 4
    'Jumat',  // 5
    'Sabtu',  // 6
  ];
  return mapping[dayIndex] || 'Senin';
}
