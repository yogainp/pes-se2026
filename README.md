# Dashboard Monitoring Harian Petugas PES SE2026 Kalimantan Barat

Portal pemantauan operasional lapangan kegiatan **Post Enumeration Survey (PES) Sensus Ekonomi 2026 (SE2026)** untuk BPS Provinsi Kalimantan Barat dan 8 Satuan Kerja BPS Kabupaten/Kota.

Didesain khusus untuk di-hosting di **Vercel**, 100% **Single Source of Truth** berbasis commit Git, cepat, responsif, dan tanpa ketergantungan database eksternal.

---

## 📌 Ringkasan Konsep & Metodologi

1. **Target Waktu Lapangan 23 Hari (1 s.d. 23 November 2026)**:
   - Target penyelesaian pencacahan lapangan dirancang selesai dalam **23 hari efektif**.
   - Target harian ideal: $\text{Target} = \text{Assigned} / 23$.
   - Target kumulatif hari ke-$N$: $(\text{Assigned} / 23) \times \min(N, 23)$.
   - Beban sisa harian (*Required Run-rate*): $(\text{Target} - \text{Realisasi}) / \max(1, 23 - N)$.

2. **Fase Cleaning & Validasi Data (24 s.d. 30 November 2026)**:
   - 7 hari terakhir dialokasikan penuh untuk pemeriksaan pengawas (PML), cleaning data anomali, penanganan penolakan/revisi (*revoke/reject*), dan konfirmasi kelengkapan sebelum penutupan kegiatan.

3. **Monitoring Progres Wilayah (8 Satker)**:
   - Pemantauan kepatuhan target per Kabupaten/Kota: Kab. Sambas (6101), Kab. Bengkayang (6102), Kab. Sanggau (6103), Kab. Ketapang (6104), Kab. Sintang (6105), Kab. Kayong Utara (6111), Kota Pontianak (6171), Kota Singkawang (6172).
   - Menghilangkan tropes kompetisi/klasemen; fokus pada akuntabilitas dan asistensi lapangan.

4. **Kriteria Evaluasi & Pengawasan Lapangan**:
   - **Sesuai Target ($\ge 100\%$)**: Petugas berada pada ritme kerja yang tepat untuk selesai tepat waktu.
   - **Waspada ($70\% - 99\%$)**: Petugas sedikit di bawah target ideal, memerlukan pengingat ritme.
   - **Kritis ($< 70\%$)**: Keterlambatan signifikan, memerlukan asistensi langsung pengawas (PML).
   - **Nol Progres ($0\%$)**: Petugas belum mengirimkan data sama sekali s.d. hari pemantauan.

5. **Metadata Operasional & Catatan Teknis Terintegrasi**:
   - Dilengkapi glosarium variabel Fasih (*Assigned*, *Open*, *Draft*, *Dicacah*, *Diolah*), formula run-rate, dan catatan metodologi di bagian bawah dashboard serta *informative tooltips*.

---

## 🔄 Alur Pembaruan Data (GitOps Sync)

Karena sistem dikelola oleh admin tunggal, tidak diperlukan form upload pada antarmuka web. Pembaruan data dilakukan langsung melalui commit file Excel:

1. Unduh file progres harian terbaru dari **Fasih Dashboard BPS RI** (format: `202611xx_xxxxxx.xlsx`).
2. Masukkan file ke dalam folder `data_awal/` atau `data/` di repositori.
3. Jalankan sinkronisasi lokal (opsional):
   ```bash
   npm run sync
   ```
4. Commit dan push ke repository GitHub:
   ```bash
   git add .
   git commit -m "data: update progres Fasih per [tanggal]"
   git push origin main
   ```
5. **Vercel otomatis menjalankan build & deploy**. Seluruh pimpinan dan pengawas langsung melihat angka terbaru tanpa perlu login atau upload ulang.

---

## 🛠️ Menjalankan di Lokal (Local Development)

```bash
# Masuk ke direktori
cd C:\Dev\pes-se2026

# Install dependencies (jika belum)
npm install

# Sinkronkan data dari file Excel terbaru
npm run sync

# Jalankan server pengembangan
npm run dev
```

Buka browser di `http://localhost:5173` (atau port default Vite yang ditampilkan).

---

## 📂 Struktur Proyek

- `data_awal/`: Arsip file Excel unduhan Fasih dan master data pengawas/pencacah.
- `scripts/sync-data.mjs`: Script Node.js otomatis pembaca Excel terbaru dan pemeta SLS/PML ke JSON.
- `src/data/initialData.json`: Data resmi yang disinkronisasi untuk aplikasi web.
- `src/utils/calculations.ts`: Formula kalkulasi target 23 hari lapangan, gap, dan status evaluasi.
- `src/utils/whatsappGenerator.ts`: Generator template pesan koordinasi WhatsApp resmi.
- `src/utils/excelExporter.ts`: Generator unduhan file evaluasi Excel lengkap dengan sheet metadata.
- `src/components/MetadataSection.tsx`: Komponen catatan teknis dan metadata operasional.
