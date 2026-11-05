import * as XLSX from 'xlsx';
import { PetugasAnalysis, KabupatenSummary } from '../types';

export function exportAnalysisToExcel(
  petugasList: PetugasAnalysis[],
  kabupatenSummaries: KabupatenSummary[],
  currentDay: number,
  totalDays: number = 30
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detail Petugas
  const petugasData = petugasList.map((p, idx) => ({
    'No': idx + 1,
    'Kabupaten': p.kabupaten,
    'Email / Petugas': p.pencacah,
    'Pengawas (PML)': p.pengawas,
    'Target Total (Assigned)': p.assigned,
    [`Target Kumulatif (Hari ke-${currentDay}/${totalDays})`]: p.targetKumulatif,
    'Realisasi Dicacah': p.dicacah,
    'Draft': p.draft,
    'Diolah': p.diolah,
    'Open': p.open,
    '% Capaian Target': `${p.persenCapaian}%`,
    '% Total Selesai': `${p.persenTotal}%`,
    'Gap / Deviasi': p.gap,
    'Sisa Beban Sampel': p.sisaTarget,
    'Target Harian Diperlukan (Sisa Hari)': p.runRateRequired,
    'Status Warning': p.statusLabel,
  }));

  const wsPetugas = XLSX.utils.json_to_sheet(petugasData);
  XLSX.utils.book_append_sheet(wb, wsPetugas, 'Evaluasi Petugas');

  // Sheet 2: Rekap Kabupaten
  const kabData = kabupatenSummaries.map((k, idx) => ({
    'Peringkat': idx + 1,
    'Kabupaten/Kota': k.nama,
    'Jumlah Petugas': k.totalPetugas,
    'Total Target': k.totalAssigned,
    'Target Kumulatif': k.targetKumulatif,
    'Total Dicacah': k.totalDicacah,
    'Total Diolah': k.totalDiolah,
    'Total Draft': k.totalDraft,
    '% Capaian Target': `${k.persenCapaian}%`,
    '% Total': `${k.persenTotal}%`,
    'Petugas Kritis (<70%)': k.petugasKritis,
    'Petugas Zero Progress (0%)': k.petugasZero,
    'Petugas Waspada (70-99%)': k.petugasWaspada,
    'Petugas On Track': k.petugasOnTrack,
    'Rekomendasi Run-rate (Sampel/Hari)': k.avgRunRate,
  }));

  const wsKab = XLSX.utils.json_to_sheet(kabData);
  XLSX.utils.book_append_sheet(wb, wsKab, 'Rekap Kabupaten');

  // Save file
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `Monitoring_PES_SE2026_Hari_${currentDay}_${dateStr}.xlsx`);
}
