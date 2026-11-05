import { PetugasRecord, PetugasAnalysis, KabupatenSummary, WarningStatus } from '../types';

export function analyzePetugas(
  records: PetugasRecord[],
  currentDay: number,
  totalDays: number = 30,
  includeDraft: boolean = false
): PetugasAnalysis[] {
  return records.map((record) => {
    const assigned = record.assigned || 0;
    const targetHarian = assigned / totalDays;
    // Target kumulatif ideal s.d. hari ini
    const targetKumulatif = (assigned / totalDays) * currentDay;

    // Realisasi
    const realisasi = includeDraft ? (record.dicacah + record.draft) : record.dicacah;

    // % capaian terhadap target kumulatif hari ini
    const persenCapaian = targetKumulatif > 0 ? (realisasi / targetKumulatif) * 100 : 0;
    // % capaian terhadap total keseluruhan 1 bulan
    const persenTotal = assigned > 0 ? (realisasi / assigned) * 100 : 0;

    const gap = realisasi - targetKumulatif;
    const sisaTarget = Math.max(0, assigned - realisasi);
    const sisaHari = Math.max(1, totalDays - currentDay);
    const runRateRequired = Number((sisaTarget / sisaHari).toFixed(1));

    // Evaluasi Warning
    let status: WarningStatus = 'on_track';
    let statusLabel = 'Sesuai Target';

    if (realisasi === 0 && currentDay >= 2) {
      status = 'zero';
      statusLabel = 'Belum Ada Progres (0%)';
    } else if (persenCapaian < 70) {
      status = 'critical';
      statusLabel = 'Kritis (Tertinggal)';
    } else if (persenCapaian < 100) {
      status = 'warning';
      statusLabel = 'Waspada (Kurang)';
    } else if (persenCapaian <= 125) {
      status = 'on_track';
      statusLabel = 'Sesuai Target';
    } else {
      status = 'ahead';
      statusLabel = 'Melampaui Target';
    }

    return {
      ...record,
      targetHarian: Number(targetHarian.toFixed(1)),
      targetKumulatif: Number(targetKumulatif.toFixed(1)),
      realisasi,
      persenCapaian: Number(persenCapaian.toFixed(1)),
      persenTotal: Number(persenTotal.toFixed(1)),
      gap: Number(gap.toFixed(1)),
      sisaTarget,
      sisaHari,
      runRateRequired,
      status,
      statusLabel,
    };
  });
}

export function calculateKabupatenSummary(analyzedRecords: PetugasAnalysis[]): KabupatenSummary[] {
  const groups: { [kab: string]: PetugasAnalysis[] } = {};

  analyzedRecords.forEach((item) => {
    const key = item.kabupaten;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  const summaries: KabupatenSummary[] = Object.keys(groups).map((key) => {
    const list = groups[key];
    const totalAssigned = list.reduce((sum, item) => sum + item.assigned, 0);
    const totalDicacah = list.reduce((sum, item) => sum + item.dicacah, 0);
    const totalDiolah = list.reduce((sum, item) => sum + item.diolah, 0);
    const totalOpen = list.reduce((sum, item) => sum + item.open, 0);
    const totalDraft = list.reduce((sum, item) => sum + item.draft, 0);
    const targetKumulatif = list.reduce((sum, item) => sum + item.targetKumulatif, 0);
    const totalRealisasi = list.reduce((sum, item) => sum + item.realisasi, 0);

    const persenCapaian = targetKumulatif > 0 ? (totalRealisasi / targetKumulatif) * 100 : 0;
    const persenTotal = totalAssigned > 0 ? (totalRealisasi / totalAssigned) * 100 : 0;

    const petugasKritis = list.filter((p) => p.status === 'critical').length;
    const petugasWaspada = list.filter((p) => p.status === 'warning').length;
    const petugasOnTrack = list.filter((p) => p.status === 'on_track' || p.status === 'ahead').length;
    const petugasZero = list.filter((p) => p.status === 'zero').length;

    const totalSisaTarget = list.reduce((sum, item) => sum + item.sisaTarget, 0);
    const sisaHari = list[0]?.sisaHari || 25;
    const avgRunRate = Number((totalSisaTarget / sisaHari).toFixed(1));

    return {
      kode: list[0]?.kabupatenKode || '',
      nama: list[0]?.kabupatenNama || key,
      kabupaten: key,
      totalPetugas: list.length,
      totalAssigned,
      totalDicacah,
      totalDiolah,
      totalOpen,
      totalDraft,
      targetKumulatif: Number(targetKumulatif.toFixed(1)),
      persenCapaian: Number(persenCapaian.toFixed(1)),
      persenTotal: Number(persenTotal.toFixed(1)),
      petugasKritis,
      petugasWaspada,
      petugasOnTrack,
      petugasZero,
      avgRunRate,
    };
  });

  // Sort by persenCapaian descending
  return summaries.sort((a, b) => b.persenCapaian - a.persenCapaian);
}
