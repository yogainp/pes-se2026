import React from 'react';
import { PetugasAnalysis } from '../types';

interface KpiOverviewProps {
  analyzedRecords: PetugasAnalysis[];
  currentDay: number;
  fieldDays?: number;
  totalDays?: number;
  includeDraft: boolean;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  analyzedRecords,
  currentDay,
  fieldDays = 23,
  includeDraft,
}) => {
  const totalPetugas = analyzedRecords.length;
  const totalAssigned = analyzedRecords.reduce((sum, p) => sum + p.assigned, 0);
  const totalDicacah = analyzedRecords.reduce((sum, p) => sum + p.dicacah, 0);
  const totalDiolah = analyzedRecords.reduce((sum, p) => sum + p.diolah, 0);
  const totalDraft = analyzedRecords.reduce((sum, p) => sum + p.draft, 0);
  const totalRealisasi = includeDraft ? totalDicacah + totalDraft : totalDicacah;

  const isCleaningPhase = currentDay > fieldDays;
  const targetKumulatif = isCleaningPhase
    ? totalAssigned
    : (totalAssigned / fieldDays) * currentDay;

  const idealPct = Math.min(100, (currentDay / fieldDays) * 100);
  const actualPct = totalAssigned > 0 ? (totalRealisasi / totalAssigned) * 100 : 0;
  const vsTargetPct = targetKumulatif > 0 ? (totalRealisasi / targetKumulatif) * 100 : 0;

  const zeroPetugas = analyzedRecords.filter((p) => p.status === 'zero');
  const criticalPetugas = analyzedRecords.filter((p) => p.status === 'critical');

  const sisaHariLapangan = isCleaningPhase ? 0 : Math.max(1, fieldDays - currentDay);
  const sisaTarget = Math.max(0, totalAssigned - totalRealisasi);
  const runRateRequired = sisaHariLapangan > 0
    ? (sisaTarget / sisaHariLapangan).toFixed(0)
    : sisaTarget.toString();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      
      {/* 1. Total Target Alokasi */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title="Total beban sampel survei yang dialokasikan kepada seluruh petugas di 8 Satker BPS Kab/Kota"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Total Alokasi
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {totalAssigned.toLocaleString()}
        </div>
        <div className="mt-1.5 text-sm text-slate-500">
          {totalPetugas} Petugas PPL
        </div>
      </div>

      {/* 2. Realisasi Dicacah */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title="Kuesioner yang telah selesai pendataan (Submit + Approve + Complete)"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Realisasi Selesai
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {totalRealisasi.toLocaleString()}
        </div>
        <div className="mt-1.5 text-sm text-slate-600 flex items-center justify-between">
          <span className="font-semibold text-slate-800">{actualPct.toFixed(1)}% total</span>
          <span className="text-slate-400 text-xs">Diolah: {totalDiolah.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Target Kumulatif Lapangan */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title={`Target kumulatif dihitung berbasis alokasi dibagi ${fieldDays} hari lapangan (1-${fieldDays} Nov)`}
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Target H-{currentDay} ({fieldDays} Hari)
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {Math.round(targetKumulatif).toLocaleString()}
        </div>
        <div className="mt-1.5 text-sm text-slate-600 flex items-center justify-between">
          <span>Ideal: {idealPct.toFixed(1)}%</span>
          <span className={`font-semibold ${vsTargetPct >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {vsTargetPct.toFixed(0)}% tercapai
          </span>
        </div>
      </div>

      {/* 4. Petugas Nol Progres */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title="Petugas yang belum mengirimkan kuesioner sama sekali s.d. hari pemantauan"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Nol Progres (0%)
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${zeroPetugas.length > 0 ? 'text-rose-700' : 'text-slate-900'} tracking-tight`}>
          {zeroPetugas.length} <span className="text-sm font-normal text-slate-500">PPL</span>
        </div>
        <div className="mt-1.5 text-sm text-slate-500">
          {zeroPetugas.length > 0 ? 'Perlu konfirmasi kendala' : 'Semua sudah bergerak'}
        </div>
      </div>

      {/* 5. Petugas Kritis */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title="Petugas yang capaiannya di bawah 70% dari target kumulatif ideal hari ini"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Kritis (&lt;70%)
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${criticalPetugas.length > 0 ? 'text-amber-700' : 'text-slate-900'} tracking-tight`}>
          {criticalPetugas.length} <span className="text-sm font-normal text-slate-500">PPL</span>
        </div>
        <div className="mt-1.5 text-sm text-slate-500">
          Perlu akselerasi kerja
        </div>
      </div>

      {/* 6. Beban Sisa Harian */}
      <div 
        className="bg-white rounded-lg p-4 border border-slate-200 shadow-2xs"
        title={`Rata-rata kuesioner harian yang harus diselesaikan sebelum deadline ${fieldDays} November`}
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Beban Sisa / Hari
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {Number(runRateRequired).toLocaleString()}
          <span className="text-sm font-normal text-slate-500 ml-1">sampel</span>
        </div>
        <div className="mt-1.5 text-sm text-slate-500">
          {isCleaningPhase ? 'Fase cleaning berjalan' : `Sisa ${sisaHariLapangan} hari s.d. 23 Nov`}
        </div>
      </div>

    </div>
  );
};
