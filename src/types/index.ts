export type WarningStatus = 'ahead' | 'on_track' | 'warning' | 'critical' | 'zero';

export interface PetugasRecord {
  id: string;
  provinsi: string;
  kabupaten: string;
  kabupatenKode: string;
  kabupatenNama: string;
  pencacah: string;
  pengawas: string;
  semuaPengawas?: string[];
  slsList?: string[];
  assigned: number;
  open: number;
  draft: number;
  dicacah: number;
  submit: number;
  approve: number;
  complete: number;
  edit: number;
  revoke: number;
  reject: number;
  diolah: number;
  kontrolKeluarga?: number;
  kontrolUsaha?: number;
  keluargaAktifSE?: number;
  gapKontrolKeluarga?: number;
  coverageKeluargaSE?: number;
}

export interface PetugasAnalysis extends PetugasRecord {
  // Calculated fields
  targetHarian: number;
  targetKumulatif: number;
  realisasi: number; // dicacah or dicacah + draft
  persenCapaian: number; // (realisasi / targetKumulatif) * 100
  persenTotal: number; // (realisasi / assigned) * 100
  gap: number; // realisasi - targetKumulatif
  sisaTarget: number; // assigned - realisasi
  sisaHari: number; // sisa hari kerja lapangan (s.d. tgl 23 Nov)
  runRateRequired: number; // sisaTarget / sisaHari
  status: WarningStatus;
  statusLabel: string;
  isCleaningPhase: boolean;
  kontrolKeluarga?: number;
  kontrolUsaha?: number;
  keluargaAktifSE?: number;
  gapKontrolKeluarga?: number;
  coverageKeluargaSE?: number;
}

export interface KabupatenSummary {
  kode: string;
  nama: string;
  kabupaten: string;
  totalPetugas: number;
  totalAssigned: number;
  totalDicacah: number;
  totalRealisasi: number;
  totalDiolah: number;
  totalOpen: number;
  totalDraft: number;
  targetKumulatif: number;
  persenCapaian: number;
  persenTotal: number;
  petugasKritis: number;
  petugasWaspada: number;
  petugasOnTrack: number;
  petugasZero: number;
  avgRunRate: number;
  totalKontrolKeluarga?: number;
  coverageKeluargaSE?: number;
}

export interface DashboardState {
  currentDay: number;
  totalDays: number;
  includeDraft: boolean;
  selectedKabupaten: string; // 'all' or kode
  selectedPengawas: string; // 'all' or email
  selectedStatus: string; // 'all' or warning status
  searchQuery: string;
  lastUpdated: string;
  fileName: string;
}
