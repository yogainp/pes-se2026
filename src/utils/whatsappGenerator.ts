import { PetugasAnalysis, KabupatenSummary } from '../types';

export function generateProvinceWhatsAppText(
  kabupatenSummaries: KabupatenSummary[],
  allPetugas: PetugasAnalysis[],
  currentDay: number,
  totalDays: number = 30
): string {
  const totalAssigned = allPetugas.reduce((acc, cur) => acc + cur.assigned, 0);
  const totalDicacah = allPetugas.reduce((acc, cur) => acc + cur.dicacah, 0);
  const totalDraft = allPetugas.reduce((acc, cur) => acc + cur.draft, 0);
  const targetKumulatif = ((totalAssigned / totalDays) * currentDay).toFixed(0);
  const pctProv = totalAssigned > 0 ? ((totalDicacah / totalAssigned) * 100).toFixed(1) : '0';
  const idealPct = ((currentDay / totalDays) * 100).toFixed(1);

  const zeroPetugas = allPetugas.filter((p) => p.status === 'zero');
  const criticalPetugas = allPetugas.filter((p) => p.status === 'critical');

  let text = `📢 *MONITORING HARIAN PES SE2026 KALIMANTAN BARAT*\n`;
  text += `📅 *Hari ke-${currentDay} dari ${totalDays} Hari* (Periode 1-30 Nov 2026)\n\n`;

  text += `📊 *RINGKASAN PROVINSI:*\n`;
  text += `• Total Target: *${totalAssigned.toLocaleString()}* sampel\n`;
  text += `• Realisasi Dicacah: *${totalDicacah.toLocaleString()}* (${pctProv}%)\n`;
  text += `• Draft Tersimpan: *${totalDraft.toLocaleString()}*\n`;
  text += `• Target Kumulatif Ideal: *${targetKumulatif}* (${idealPct}%)\n`;
  text += `• Petugas Belum Bergerak (0%): *${zeroPetugas.length} orang*\n`;
  text += `• Petugas Kritis (<70% target harian): *${criticalPetugas.length} orang*\n\n`;

  text += `🏆 *KLASEMEN CAPAIAN KABUPATEN/KOTA:*\n`;
  kabupatenSummaries.forEach((k, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    const warningIcon = k.petugasZero > 0 ? `⚠️ (${k.petugasZero} PPL 0%)` : '✅';
    text += `${medal} *${k.nama}*: ${k.persenCapaian}% target (${k.totalDicacah}/${k.totalAssigned}) ${warningIcon}\n`;
  });

  if (zeroPetugas.length > 0) {
    text += `\n🚨 *ATENSI KHUSUS PETUGAS BELUM ADA PROGRES (0%):*\n`;
    const groupedZero: { [kab: string]: string[] } = {};
    zeroPetugas.forEach((p) => {
      if (!groupedZero[p.kabupatenNama]) groupedZero[p.kabupatenNama] = [];
      groupedZero[p.kabupatenNama].push(p.pencacah);
    });

    Object.keys(groupedZero).forEach((kab) => {
      text += `📍 *${kab}* (${groupedZero[kab].length} PPL):\n`;
      groupedZero[kab].forEach((email) => {
        text += `   - ${email}\n`;
      });
    });
  }

  text += `\n💪 Mohon Bapak/Ibu Pimpinan BPS Kab/Kota dan PML untuk terus mendorong PPL agar mengejar target harian sebelum batas akhir 30 November. Terima kasih! 🙏`;

  return text;
}

export function generateKabupatenWhatsAppText(
  kabupaten: KabupatenSummary,
  petugasList: PetugasAnalysis[],
  currentDay: number,
  totalDays: number = 30
): string {
  const idealPct = ((currentDay / totalDays) * 100).toFixed(1);
  const sisaHari = totalDays - currentDay;

  let text = `📢 *MONITORING HARIAN PES SE2026 - ${kabupaten.nama.toUpperCase()}*\n`;
  text += `📅 *Hari ke-${currentDay} dari ${totalDays} Hari* (Sisa waktu: ${sisaHari} hari)\n\n`;

  text += `📊 *STATUS KABUPATEN:*\n`;
  text += `• Total Target: *${kabupaten.totalAssigned.toLocaleString()}* sampel (${kabupaten.totalPetugas} Petugas)\n`;
  text += `• Realisasi Dicacah: *${kabupaten.totalDicacah.toLocaleString()}* (${kabupaten.persenTotal}%)\n`;
  text += `• Capaian vs Target Ideal: *${kabupaten.persenCapaian}%* (Target Ideal: ${idealPct}%)\n`;
  text += `• Target Harian Dibutuhkan: *${kabupaten.avgRunRate} sampel/hari*\n\n`;

  text += `👥 *DETAIL STATUS PETUGAS (${kabupaten.totalPetugas} PPL):*\n`;
  petugasList.forEach((p) => {
    let icon = '🟢';
    if (p.status === 'zero') icon = '🚨 0%';
    else if (p.status === 'critical') icon = '🔴 Kritis';
    else if (p.status === 'warning') icon = '🟡 Waspada';
    else if (p.status === 'ahead') icon = '🌟 Unggul';

    text += `• ${p.pencacah}\n`;
    text += `  └ Capaian: ${p.dicacah}/${p.assigned} (${p.persenCapaian}% target) [${icon}]\n`;
    text += `  └ Beban sisa: ${p.runRateRequired} sampel/hari\n`;
  });

  const zeroOrCrit = petugasList.filter((p) => p.status === 'zero' || p.status === 'critical');
  if (zeroOrCrit.length > 0) {
    text += `\n⚠️ *Perhatian Khusus:* Terdapat ${zeroOrCrit.length} petugas di bawah target yang memerlukan pendampingan intensif dari Pengawas (PML).`;
  }

  text += `\n\nTetap semangat rekan-rekan ${kabupaten.nama}! Mari selesaikan pendataan tepat waktu dan berkualitas. 🙏`;

  return text;
}

export function generatePersonalPetugasWhatsAppText(
  p: PetugasAnalysis,
  currentDay: number,
  totalDays: number = 30
): string {
  const sisaHari = totalDays - currentDay;

  let text = `Halo rekan *${p.pencacah}*,\n\n`;
  text += `Pengingat Progres Kegiatan *PES SE2026* per Hari ke-${currentDay} (${p.kabupatenNama}):\n`;
  text += `• Target Total: *${p.assigned}* sampel\n`;
  text += `• Realisasi Dicacah: *${p.dicacah}* sampel\n`;
  text += `• Sisa Beban: *${p.sisaTarget}* sampel\n`;
  text += `• Target Kumulatif Hari Ini: *${p.targetKumulatif}* sampel\n`;
  text += `• Target Harian Rekomendasi: *${p.runRateRequired}* sampel/hari (dalam ${sisaHari} hari ke depan)\n\n`;

  if (p.status === 'zero') {
    text += `🚨 *Status:* Belum ada data yang dikirim (0%). Mohon segera konfirmasi ke Pengawas (PML) mengenai kendala di lapangan.\n`;
  } else if (p.status === 'critical' || p.status === 'warning') {
    text += `⚠️ *Status:* Masih di bawah target harian (${p.gap} sampel tertinggal). Mohon ditingkatkan kecepatannya hari ini ya.\n`;
  } else {
    text += `👏 *Status:* Sangat baik! Pertahankan performa kerja Anda hingga seluruh target selesai.\n`;
  }

  text += `\nSemangat dan jaga kesehatan selalu! 🙏`;
  return text;
}
