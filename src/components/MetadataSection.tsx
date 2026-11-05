import React from 'react';
import { BookOpen, Calendar, ShieldCheck, Database } from 'lucide-react';

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
              Akumulasi kuesioner selesai pendataan lapangan (<em className="text-slate-700">Submit</em> + <em className="text-slate-700">Approve</em> + <em className="text-slate-700">Complete</em>).
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
          </ul>
        </div>

      </div>

    </section>
  );
};
