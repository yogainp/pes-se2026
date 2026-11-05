# Dashboard Monitoring Harian Petugas PES SE2026 Kalimantan Barat

Dashboard pemantauan lapangan kegiatan **Post Enumeration Survey (PES) Sensus Ekonomi 2026 (SE2026)** untuk BPS Provinsi Kalimantan Barat dan 8 BPS Kabupaten/Kota.

Didesain khusus untuk di-hosting di **Vercel** secara gratis, 100% **Client-Side Data Processing** tanpa memerlukan database backend.

---

## 🚀 Fitur Unggulan

1. **Monitoring Target Harian (30 Hari November 2026)**:
   - Menghitung otomatis target harian ideal (\( \text{Assigned} / 30 \)) dan target kumulatif hari ke-\( N \).
   - Menghitung deviasi (Gap +/-) dan beban sisa harian (*Required Run-rate*) yang harus dicapai agar selesai tepat waktu pada 30 November.
   - Slider interaktif hari ke-1 s.d. 30 untuk simulasi tanggal pengawasan.

2. **Sistem Peringatan Dini (Warning System)**:
   - 🚨 **0% Belum Ada Progres**: Alert khusus untuk petugas yang belum pernah submit data.
   - 🔴 **Kritis (<70%)**: Petugas yang tertinggal jauh dari target kumulatif hari ini.
   - 🟡 **Waspada (70–99%)**: Petugas yang sedikit di bawah target ideal.
   - 🟢 **Sesuai Target (≥100%)**: Petugas yang berada pada jalur yang tepat (*On Track*).
   - 🌟 **Melampaui Target (>125%)**: Petugas berkinerja tinggi.

3. **Multi-level Overview & Klasemen Kab/Kota**:
   - Leaderboard 8 Kabupaten/Kota (Sambas, Bengkayang, Sanggau, Ketapang, Sintang, Kayong Utara, Kota Pontianak, Kota Singkawang).
   - Pemetaan pengawas (PML) dan daftar SLS penugasan per petugas.

4. **Zero-Database & Fleksibilitas Pembaruan Data**:
   - **Data Default Bawaan**: Langsung memuat snapshot terbaru saat web dibuka pertama kali.
   - **Upload Excel Instan**: Drag-and-drop file Excel unduhan dari Fasih Dashboard (`202611xx_xxxxxx.xlsx`). Diproses instan di browser dan disimpan di `localStorage`.
   - **Update via Git**: Commit file excel baru atau update kode ke repository GitHub, Vercel otomatis deploy versi terbaru.

5. **Fitur Koordinasi WhatsApp & Ekspor Laporan**:
   - **Template WhatsApp 1-Klik**: Format ringkasan siap blast untuk tingkat Provinsi, per Kabupaten/Kota, maupun pesan japri personal ke petugas terkait.
   - **Ekspor Excel**: Download tabel evaluasi lengkap dengan kolom target harian, run-rate, dan status warning.

---

## 🛠️ Menjalankan di Lokal (Local Development)

```bash
# Masuk ke direktori
cd C:\Dev\pes-se2026

# Install dependencies (jika belum)
npm install

# Jalankan server lokal
npm run dev
```

Buka browser di `http://localhost:3000`.

---

## 🌐 Panduan Hosting di Vercel

### Opsi 1: Hubungkan Repository GitHub (Sangat Direkomendasikan)
1. Inisialisasi git dan buat repository di GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release dashboard PES SE2026 Kalbar"
   git remote add origin https://github.com/USERNAME/pes-se2026.git
   git branch -M main
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com).
3. Klik **Add New...** -> **Project** -> Pilih repository `pes-se2026`.
4. Framework Preset akan otomatis terdeteksi sebagai **Vite**.
5. Klik **Deploy**. Selesai dalam hitungan detik!
6. Setiap kali Anda melakukan `git push` dengan fitur baru atau data baru, Vercel otomatis membangun dan memperbarui web.

### Opsi 2: Menggunakan Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📂 Struktur Data

- `src/data/initialData.json`: Data default baseline petugas dan wilayah Kalbar per 5 November 2026.
- `src/utils/calculations.ts`: Formula kalkulasi target harian, kumulatif, run-rate, dan status warning.
- `src/utils/excelParser.ts`: Engine pembaca file Excel Fasih langsung di browser.
- `src/utils/whatsappGenerator.ts`: Generator template pesan WhatsApp.
- `src/utils/excelExporter.ts`: Generator unduhan file Excel laporan evaluasi.
