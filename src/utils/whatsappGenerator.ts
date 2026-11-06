import { PetugasAnalysis, KabupatenSummary } from '../types';

export function generateProvinceWhatsAppText(
  kabupatenSummaries: KabupatenSummary[],
  allPetugas: PetugasAnalysis[],
  currentDay: number,
  fieldDays: number = 23,
  totalDays: number = 30,
  includeDraft: boolean = false
): string {
  const totalAssigned = allPetugas.reduce((acc, cur) => acc + cur.assigned, 0);
  const totalDicacah = allPetugas.reduce((acc, cur) => acc + cur.dicacah, 0);
  const totalDraft = allPetugas.reduce((acc, cur) => acc + cur.draft, 0);
  const totalRealisasi = includeDraft ? totalDicacah + totalDraft : totalDicacah;
  const targetKumulatif = ((totalAssigned / fieldDays) * Math.min(currentDay, fieldDays)).toFixed(0);
  const pctProv = totalAssigned > 0 ? ((totalRealisasi / totalAssigned) * 100).toFixed(1) : '0';
  const idealPct = ((Math.min(currentDay, fieldDays) / fieldDays) * 100).toFixed(1);

  const zeroPetugas = allPetugas.filter((p) => p.status === 'zero');
  const criticalPetugas = allPetugas.filter((p) => p.status === 'critical');
  const sisaHariLapangan = Math.max(0, fieldDays - currentDay);

  let text = `*MONITORING HARIAN PES SE2026 KALIMANTAN BARAT*\n`;
  text += `Hari ke-${currentDay} dari ${totalDays} Hari | Target Lapangan: 1 - ${fieldDays} Nov 2026\n`;
  if (includeDraft) {
    text += `[Mode: Menghitung Draft Tersimpan]\n`;
  }
  text += `\n`;

  text += `*RINGKASAN PROVINSI:*\n`;
  text += `• Total Target: ${totalAssigned.toLocaleString()} sampel\n`;
  if (includeDraft) {
    text += `• Total Realisasi (+Draft): ${totalRealisasi.toLocaleString()} (${pctProv}% total) [${totalDicacah} dicacah + ${totalDraft} draft]\n`;
  } else {
    text += `• Realisasi Dicacah: ${totalDicacah.toLocaleString()} (${pctProv}%)\n`;
    text += `• Draft Tersimpan: ${totalDraft.toLocaleString()}\n`;
  }
  text += `• Target Ideal s.d. Hari Ini: ${targetKumulatif} (${idealPct}%)\n`;
  text += `• Sisa Waktu Lapangan: ${sisaHariLapangan} hari (Batas Akhir: ${fieldDays} Nov)\n`;
  text += `• Petugas Nol Progres (0%): ${zeroPetugas.length} orang\n`;
  text += `• Petugas Kritis (<70% target): ${criticalPetugas.length} orang\n\n`;

  text += `*PROGRES PER KABUPATEN/KOTA:*\n`;
  kabupatenSummaries.forEach((k) => {
    const statusNote = k.petugasZero > 0 ? `(${k.petugasZero} PPL 0%)` : `(Semua aktif)`;
    const kReal = includeDraft ? k.totalRealisasi : k.totalDicacah;
    text += `• ${k.nama}: ${k.persenCapaian}% target ideal (${kReal}/${k.totalAssigned}) - ${statusNote}\n`;
  });

  if (zeroPetugas.length > 0) {
    text += `\n*DAFTAR PETUGAS PERLU ASISTENSI (0%):*\n`;
    const groupedZero: { [kab: string]: string[] } = {};
    zeroPetugas.forEach((p) => {
      if (!groupedZero[p.kabupatenNama]) groupedZero[p.kabupatenNama] = [];
      groupedZero[p.kabupatenNama].push(p.pencacah);
    });

    Object.keys(groupedZero).forEach((kab) => {
      text += `[${kab}] (${groupedZero[kab].length} PPL):\n`;
      groupedZero[kab].forEach((email) => {
        text += `  - ${email}\n`;
      });
    });
  }

  text += `\nCatatan: Sisa 7 hari (24-30 Nov) difokuskan untuk verifikasi PML dan cleaning data. Mohon Bapak/Ibu Pimpinan BPS Kab/Kota dan PML untuk mengawal pencacahan agar rampung sebelum 23 November 2026. Terima kasih.`;

  return text;
}

export function generateKabupatenWhatsAppText(
  kabupaten: KabupatenSummary,
  petugasList: PetugasAnalysis[],
  currentDay: number,
  fieldDays: number = 23,
  _totalDays: number = 30,
  includeDraft: boolean = false
): string {
  const idealPct = ((Math.min(currentDay, fieldDays) / fieldDays) * 100).toFixed(1);
  const sisaHari = Math.max(0, fieldDays - currentDay);
  const realisasiVal = includeDraft ? (kabupaten.totalRealisasi || kabupaten.totalDicacah) : kabupaten.totalDicacah;

  let text = `*MONITORING HARIAN PES SE2026 - ${kabupaten.nama.toUpperCase()}*\n`;
  text += `Hari ke-${currentDay} | Sisa Waktu Lapangan: ${sisaHari} hari (Deadline: ${fieldDays} Nov)\n\n`;

  text += `*RINGKASAN SATKER:*\n`;
  text += `• Total Target: ${kabupaten.totalAssigned.toLocaleString()} sampel (${kabupaten.totalPetugas} PPL)\n`;
  if (includeDraft && kabupaten.totalDraft > 0) {
    text += `• Realisasi (+Draft): ${realisasiVal.toLocaleString()} (${kabupaten.persenTotal}% total) [${kabupaten.totalDicacah} dicacah + ${kabupaten.totalDraft} draft]\n`;
  } else {
    text += `• Realisasi Dicacah: ${kabupaten.totalDicacah.toLocaleString()} (${kabupaten.persenTotal}% total)\n`;
  }
  text += `• Capaian vs Target Ideal: ${kabupaten.persenCapaian}% (Ideal: ${idealPct}%)\n`;
  text += `• Rata-rata Beban Sisa: ${kabupaten.avgRunRate} sampel/hari\n\n`;

  text += `*STATUS PETUGAS (${kabupaten.totalPetugas} PPL):*\n`;
  petugasList.forEach((p) => {
    const pReal = includeDraft ? p.realisasi : p.dicacah;
    const draftNote = includeDraft && p.draft > 0 ? ` (${p.dicacah}+${p.draft} draft)` : '';
    text += `• ${p.pencacah}\n`;
    text += `  Realisasi: ${pReal}/${p.assigned}${draftNote} (${p.persenCapaian}% target ideal) [Status: ${p.statusLabel}]\n`;
    text += `  Beban sisa: ${p.runRateRequired} sampel/hari\n`;
  });

  const zeroOrCrit = petugasList.filter((p) => p.status === 'zero' || p.status === 'critical');
  if (zeroOrCrit.length > 0) {
    text += `\n*Perhatian Khusus:* Terdapat ${zeroOrCrit.length} petugas yang membutuhkan supervisi langsung dari Pengawas (PML).`;
  }

  text += `\n\nMari kita tuntaskan pencacahan sebelum tanggal ${fieldDays} November 2026 agar proses cleaning berjalan optimal. Terima kasih.`;

  return text;
}

export function generatePersonalPetugasWhatsAppText(
  p: PetugasAnalysis,
  currentDay: number,
  fieldDays: number = 23,
  _totalDays: number = 30,
  includeDraft: boolean = false
): string {
  const sisaHari = Math.max(0, fieldDays - currentDay);

  let text = `Yth. Rekan ${p.pencacah},\n\n`;
  text += `Berikut perkembangan kegiatan PES SE2026 per Hari ke-${currentDay} (${p.kabupatenNama}):\n`;
  text += `• Alokasi Beban: ${p.assigned} sampel\n`;
  if (includeDraft && p.draft > 0) {
    text += `• Realisasi Selesai: ${p.realisasi} sampel (${p.dicacah} terkirim + ${p.draft} draft di HP)\n`;
  } else {
    text += `• Selesai Dicacah: ${p.dicacah} sampel\n`;
    if (p.draft > 0) {
      text += `• Draft Tersimpan di HP: ${p.draft} sampel\n`;
    }
  }
  text += `• Target Kumulatif Ideal: ${p.targetKumulatif} sampel\n`;
  text += `• Sisa Beban Belum Selesai: ${p.sisaTarget} sampel\n`;
  text += `• Beban Harian Rekomendasi: ${p.runRateRequired} sampel/hari (sisa ${sisaHari} hari s.d. 23 Nov)\n\n`;

  if (p.status === 'zero') {
    text += `Catatan: Belum ada pengiriman data ke sistem. Mohon konfirmasi kendala lapangan kepada Pengawas (PML).\n`;
  } else if (p.status === 'critical' || p.status === 'warning') {
    text += `Catatan: Progres berada di bawah target ideal (${Math.abs(p.gap)} sampel tertinggal). Mohon lakukan percepatan pendataan.\n`;
  } else {
    text += `Catatan: Progres berada pada jalur yang tepat. Pertahankan ritme kerja hingga selesai sebelum 23 November 2026.\n`;
  }

  text += `\nTetap semangat dan jaga kualitas data. Terima kasih.`;
  return text;
}
