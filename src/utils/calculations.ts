import { PetugasRecord, PetugasAnalysis, KabupatenSummary, WarningStatus } from '../types';

export const FIELD_TARGET_DAYS = 23; // Target penyelesaian pencacahan lapangan (1-23 Nov)
export const TOTAL_MONTH_DAYS = 30; // Total periode kegiatan November

export function analyzePetugas(
  records: PetugasRecord[],
  currentDay: number,
  fieldDays: number = FIELD_TARGET_DAYS,
  _totalDays: number = TOTAL_MONTH_DAYS,
  includeDraft: boolean = false
): PetugasAnalysis[] {
  const isCleaningPhase = currentDay > fieldDays;

  return records.map((record) => {
    const assigned = record.assigned || 0;
    // Target harian dihitung berbasis hari kerja efektif lapangan (23 hari)
    const targetHarian = assigned / fieldDays;

    // Target kumulatif ideal s.d. hari pemantauan
    const targetKumulatif = isCleaningPhase
      ? assigned
      : (assigned / fieldDays) * currentDay;

    // Realisasi dicacah (Submit + Approve + Complete) atau ditambah Draft jika diaktifkan
    const realisasi = includeDraft ? (record.dicacah + record.draft) : record.dicacah;

    // % capaian terhadap target kumulatif hari ini
    const persenCapaian = targetKumulatif > 0 ? (realisasi / targetKumulatif) * 100 : 0;
    // % capaian terhadap total keseluruhan alokasi
    const persenTotal = assigned > 0 ? (realisasi / assigned) * 100 : 0;

    const gap = realisasi - targetKumulatif;
    const sisaTarget = Math.max(0, assigned - realisasi);

    // Sisa hari lapangan untuk menyelesaikan target (tgl 1-23 Nov)
    const sisaHariLapangan = isCleaningPhase ? 0 : Math.max(1, fieldDays - currentDay);
    const runRateRequired = sisaHariLapangan > 0
      ? Number((sisaTarget / sisaHariLapangan).toFixed(1))
      : sisaTarget;

    // Evaluasi Status Pengawasan (Formal)
    let status: WarningStatus = 'on_track';
    let statusLabel = 'Sesuai Target';

    if (realisasi === 0 && currentDay >= 2) {
      status = 'zero';
      statusLabel = 'Nol Progres';
    } else if (persenCapaian < 70) {
      status = 'critical';
      statusLabel = 'Kritis';
    } else if (persenCapaian < 100) {
      status = 'warning';
      statusLabel = 'Waspada';
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
      sisaHari: sisaHariLapangan,
      runRateRequired,
      status,
      statusLabel,
      isCleaningPhase,
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
    const sisaHari = list[0]?.sisaHari ?? 1;
    const avgRunRate = sisaHari > 0
      ? Number((totalSisaTarget / sisaHari).toFixed(1))
      : totalSisaTarget;

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

  // Urutkan default berdasarkan kode satker kabupaten (6101..6172) agar rapi secara hirarki administrasi
  return summaries.sort((a, b) => a.kode.localeCompare(b.kode));
}
