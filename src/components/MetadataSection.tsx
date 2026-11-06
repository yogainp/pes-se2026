import React from 'react';
import { BookOpen, Calendar, ShieldCheck, Database, Calculator } from 'lucide-react';

export const MetadataSection: React.FC = () => {
  return (
    <section id="metadata-section" className="bg-white rounded-lg border border-slate-200 p-6 sm:p-7 mb-8 scroll-mt-24 shadow-2xs">
      
      {/* Section Header */}
      <div className="pb-4 mb-6 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">
          Metadata Operasional & Catatan Teknis Kegiatan
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Panduan metodologi, definisi variabel Fasih, formula beban kerja, dan klasifikasi pengawasan lapangan PES SE2026.
        </p>
      </div>

      {/* 4 Grid Columns of Technical Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-slate-600">
        
        {/* 1. Definisi Variabel Fasih */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2.5 text-base">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Definisi Variabel Fasih</span>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <strong className="text-slate-800 block font-semibold">Assigned (Alokasi):</strong>
              Total sampel usaha yang dialokasikan kepada Petugas Pencacah Lapangan (PPL).
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Open:</strong>
              Sampel alokasi yang belum disentuh atau belum dibuka pada aplikasi Fasih.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Draft:</strong>
              Kuesioner yang sedang dikerjakan dan tersimpan lokal di perangkat PPL (belum diunggah ke server).
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Dicacah (Realisasi):</strong>
              Kuesioner yang telah selesai didata di lapangan (<em className="text-slate-700">Submit</em> + <em className="text-slate-700">Approve</em> + <em className="text-slate-700">Complete</em>). Setiap kuesioner hanya dihitung sekali sesuai posisi statusnya saat ini di Fasih (bukan hitung ganda). Bila opsi toggle <em>Hitung Draft</em> diaktifkan, kuesioner draft juga disertakan ke dalam realisasi.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Diolah:</strong>
              Kuesioner yang telah diverifikasi dan disetujui pengawas (<em className="text-slate-700">Approve</em> + <em className="text-slate-700">Complete</em>).
            </li>
          </ul>
        </div>

        {/* 2. Target 23 Hari & Cleaning */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2.5 text-base">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Target & Periode Kerja</span>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <strong className="text-slate-800 block font-semibold">Fase Pencacahan (1–23 Nov 2026):</strong>
              Target penyelesaian pendataan lapangan ditetapkan 23 hari efektif agar ada ruang pembersihan data.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Fase Cleaning Data (24–30 Nov 2026):</strong>
              Alokasi 7 hari penuh untuk pemeriksaan pengawas PML, konfirmasi anomali/outlier, tindak lanjut penolakan (<em className="text-slate-700">revoke/reject</em>), dan validasi akhir.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Target Harian Ideal:</strong>
              Dirumuskan: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 font-semibold">Assigned / 23</code> sampel/hari.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Target Kumulatif H-n:</strong>
              Dirumuskan: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 font-semibold">(Assigned / 23) × Hari ke-n</code> (atau 100% pada fase cleaning).
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Beban Sisa (Run-Rate):</strong>
              Rata-rata kuesioner yang wajib diselesaikan per hari: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 font-semibold">(Assigned - Realisasi) / Sisa Hari s.d. 23 Nov</code>.
            </li>
          </ul>
        </div>

        {/* 3. Klasifikasi Pengawasan */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2.5 text-base">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Kriteria Evaluasi Kinerja</span>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <strong className="text-emerald-800 block font-semibold">Sesuai Target (≥100%):</strong>
              PPL berada pada ritme kerja yang tepat dan diproyeksikan tuntas sebelum 23 November.
            </li>
            <li>
              <strong className="text-amber-800 block font-semibold">Waspada (70% – 99%):</strong>
              PPL berada sedikit di bawah target kumulatif ideal, memerlukan pengingat ritme kerja dari PML.
            </li>
            <li>
              <strong className="text-red-700 block font-semibold">Kritis (&lt;70%):</strong>
              Keterlambatan progres signifikan, memerlukan pendampingan lapangan langsung dari Pengawas.
            </li>
            <li>
              <strong className="text-rose-800 block font-semibold">Nol Progres (0%):</strong>
              PPL belum pernah mengirimkan data sama sekali s.d. tanggal pemantauan, prioritas konfirmasi kendala.
            </li>
          </ul>
        </div>

        {/* 4. Wilayah Tugas & Tata Kelola Data */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2.5 text-base">
            <Database className="w-4 h-4 text-slate-500" />
            <span>Cakupan & Tata Kelola Data</span>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <strong className="text-slate-800 block font-semibold">Cakupan Wilayah:</strong>
              8 Satuan Kerja BPS Kabupaten/Kota di Provinsi Kalimantan Barat (Sambas 6101, Bengkayang 6102, Sanggau 6103, Ketapang 6104, Sintang 6105, Kayong Utara 6111, Kota Pontianak 6171, Kota Singkawang 6172).
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Sumber Data:</strong>
              Ekstraksi berkala Dashboard Fasih PES SE2026 BPS RI.
            </li>
            <li>
              <strong className="text-slate-800 block font-semibold">Mekanisme Sinkronisasi:</strong>
              Terenkapsulasi dalam repositori Git (<em className="text-slate-700">Single Source of Truth</em>). Setiap pembaruan file Excel di Git otomatis memperbarui data pada portal monitoring.
            </li>
            <li>
              <strong className="text-blue-900 block font-semibold">Data Kontrol Sensus Ekonomi (SE2026):</strong>
              Angka <em className="text-slate-700">Total Prelist & Hasil Keluarga</em> pada 129 SLS Sampel PES hasil SE2026 diintegrasikan sebagai patokan kontrol beban mandiri untuk mengevaluasi kelayakan penugasan Fasih dan memantau persentase cakupan (<em className="text-slate-700">coverage</em>) riil di lapangan.
            </li>
          </ul>
        </div>

      </div>

      {/* Formula Matematis & Logika Komputasi Capaian */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-700" />
          <h4 className="text-base font-bold text-slate-900">
            Formula Matematis & Logika Komputasi Capaian Target
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          {/* Card 1: % Capaian Target */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                1. % Capaian Target (Ritme Lapangan)
              </span>
              <div className="bg-white border border-slate-200 rounded p-2.5 font-mono text-xs text-blue-900 font-semibold mb-2.5 shadow-2xs">
                % Capaian = (Realisasi / Target Kumulatif) × 100%
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Menjadi angka utama dan warna bar evaluasi kinerja. Mengukur kepatuhan petugas terhadap ritme kerja ideal s.d. hari ini:
              </p>
              <ul className="mt-1.5 space-y-1 text-slate-600 text-xs list-disc list-inside">
                <li><code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[11px] font-semibold">Target Kumulatif = (Alokasi / 23) × Hari Pemantauan</code></li>
                <li><code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[11px] font-semibold">Gap Deviasi = Realisasi - Target Kumulatif</code></li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500">
              Kategori: Kritis (&lt;70%), Waspada (70–99%), Sesuai Target (≥100%).
            </div>
          </div>

          {/* Card 2: % Realisasi Total */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                2. % Realisasi Total & Beban Sisa
              </span>
              <div className="bg-white border border-slate-200 rounded p-2.5 font-mono text-xs text-blue-900 font-semibold mb-2.5 shadow-2xs">
                % Total = (Realisasi / Total Alokasi Assigned) × 100%
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Ditampilkan dengan label abu-abu kecil <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[11px] font-semibold">% tot</code> di samping % Capaian. Mengukur akumulasi volume penyelesaian keseluruhan beban penugasan selama bulan November.
              </p>
              <div className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700 block mb-0.5">Beban Sisa Harian (Run-Rate):</span>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold block text-slate-800">
                  (Alokasi - Realisasi) / Sisa Hari s.d. 23 Nov
                </code>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500">
              Menunjukkan ritme sampel per hari yang wajib dipenuhi agar selesai tepat waktu.
            </div>
          </div>

          {/* Card 3: Logika Komponen Realisasi */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                3. Komponen Realisasi & Opsi Hitung Draft
              </span>
              <div className="bg-white border border-slate-200 rounded p-2.5 font-mono text-xs text-blue-900 font-semibold mb-2.5 shadow-2xs">
                Realisasi = Submit + Approve + Complete (+ Draft*)
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Setiap dokumen fisik hanya dihitung <strong>1 kali</strong> sesuai snapshot status mutakhirnya di Fasih (bukan log akumulasi).
              </p>
              <ul className="mt-1.5 space-y-1 text-slate-600 text-xs list-disc list-inside">
                <li><strong>Default:</strong> Hanya kuesioner yang sudah diserahkan PPL (Submit, Approve, Complete).</li>
                <li><strong>Opsi Hitung Draft:</strong> Kuesioner draft di perangkat lokal diikutsertakan ke dalam Realisasi dan evaluasi ritme harian.</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500">
              Status draft dapat diaktifkan/dinonaktifkan melalui toggle di bilah atas.
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
