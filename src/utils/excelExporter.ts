import * as XLSX from 'xlsx';
import { PetugasAnalysis, KabupatenSummary } from '../types';

export function exportAnalysisToExcel(
  petugasList: PetugasAnalysis[],
  kabupatenSummaries: KabupatenSummary[],
  currentDay: number,
  fieldDays: number = 23,
  _totalDays: number = 30
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detail Petugas
  const petugasData = petugasList.map((p, idx) => ({
    'No': idx + 1,
    'Kode Satker': p.kabupatenKode,
    'Kabupaten / Kota': p.kabupatenNama,
    'Petugas Pencacah (PPL)': p.pencacah,
    'Pengawas (PML)': p.pengawas,
    'Total Beban (Assigned)': p.assigned,
    [`Target Kumulatif (H-${currentDay}/${fieldDays})`]: p.targetKumulatif,
    'Realisasi Dicacah': p.dicacah,
    'Draft': p.draft,
    'Diolah': p.diolah,
    'Open': p.open,
    '% Capaian Target Ideal': `${p.persenCapaian}%`,
    '% Realisasi Total': `${p.persenTotal}%`,
    'Deviasi (Gap)': p.gap,
    'Sisa Beban Sampel': p.sisaTarget,
    [`Beban Harian Diperlukan (s.d. ${fieldDays} Nov)`]: p.runRateRequired,
    'Status Pengawasan': p.statusLabel,
  }));

  const wsPetugas = XLSX.utils.json_to_sheet(petugasData);
  XLSX.utils.book_append_sheet(wb, wsPetugas, 'Evaluasi PPL');

  // Sheet 2: Rekap Wilayah
  const kabData = kabupatenSummaries.map((k, idx) => ({
    'No': idx + 1,
    'Kode Satker': k.kode,
    'Kabupaten / Kota': k.nama,
    'Jumlah PPL': k.totalPetugas,
    'Total Target Alokasi': k.totalAssigned,
    [`Target Kumulatif (H-${currentDay}/${fieldDays})`]: k.targetKumulatif,
    'Total Dicacah': k.totalDicacah,
    'Total Diolah': k.totalDiolah,
    'Total Draft': k.totalDraft,
    '% Capaian Target': `${k.persenCapaian}%`,
    '% Realisasi Total': `${k.persenTotal}%`,
    'PPL Nol Progres (0%)': k.petugasZero,
    'PPL Kritis (<70%)': k.petugasKritis,
    'PPL Waspada (70-99%)': k.petugasWaspada,
    'PPL Sesuai Target': k.petugasOnTrack,
    'Rata-rata Run-rate (Sampel/Hari)': k.avgRunRate,
  }));

  const wsKab = XLSX.utils.json_to_sheet(kabData);
  XLSX.utils.book_append_sheet(wb, wsKab, 'Rekap Wilayah');

  // Sheet 3: Metadata & Definisi
  const metadataRows = [
    { 'Parameter / Istilah': 'Periode Pencacahan Lapangan', 'Deskripsi': '1 s.d. 23 November 2026 (23 hari kerja efektif)' },
    { 'Parameter / Istilah': 'Periode Cleaning Data', 'Deskripsi': '24 s.d. 30 November 2026 (7 hari verifikasi & rekonsiliasi anomali)' },
    { 'Parameter / Istilah': 'Formula Target Harian', 'Deskripsi': 'Alokasi Assigned / 23 hari' },
    { 'Parameter / Istilah': 'Formula Target Kumulatif', 'Deskripsi': '(Alokasi Assigned / 23) x Hari Pemantauan' },
    { 'Parameter / Istilah': 'Realisasi Dicacah', 'Deskripsi': 'Kuesioner yang telah diselesaikan di Fasih (Submit + Approve + Complete)' },
    { 'Parameter / Istilah': 'Beban Sisa (Run-Rate)', 'Deskripsi': 'Sisa target kuesioner dibagi sisa hari kerja s.d. 23 November 2026' },
    { 'Parameter / Istilah': 'Sumber Data', 'Deskripsi': 'Fasih Dashboard PES SE2026 - BPS RI' },
  ];
  const wsMeta = XLSX.utils.json_to_sheet(metadataRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata & Catatan');

  // Save file
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `Monitoring_PES_SE2026_H${currentDay}_${dateStr}.xlsx`);
}
