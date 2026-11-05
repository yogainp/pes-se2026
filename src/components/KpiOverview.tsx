import React from 'react';
import { Target, CheckCircle, AlertTriangle, AlertOctagon, TrendingUp, Users } from 'lucide-react';
import { PetugasAnalysis } from '../types';

interface KpiOverviewProps {
  analyzedRecords: PetugasAnalysis[];
  currentDay: number;
  totalDays: number;
  includeDraft: boolean;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  analyzedRecords,
  currentDay,
  totalDays,
  includeDraft,
}) => {
  const totalPetugas = analyzedRecords.length;
  const totalAssigned = analyzedRecords.reduce((sum, p) => sum + p.assigned, 0);
  const totalDicacah = analyzedRecords.reduce((sum, p) => sum + p.dicacah, 0);
  const totalDiolah = analyzedRecords.reduce((sum, p) => sum + p.diolah, 0);
  const totalDraft = analyzedRecords.reduce((sum, p) => sum + p.draft, 0);
  const totalRealisasi = includeDraft ? totalDicacah + totalDraft : totalDicacah;

  const targetKumulatif = (totalAssigned / totalDays) * currentDay;
  const idealPct = (currentDay / totalDays) * 100;
  const actualPct = totalAssigned > 0 ? (totalRealisasi / totalAssigned) * 100 : 0;
  const vsTargetPct = targetKumulatif > 0 ? (totalRealisasi / targetKumulatif) * 100 : 0;

  const zeroPetugas = analyzedRecords.filter((p) => p.status === 'zero');
  const criticalPetugas = analyzedRecords.filter((p) => p.status === 'critical');

  const sisaHari = Math.max(1, totalDays - currentDay);
  const sisaTarget = Math.max(0, totalAssigned - totalRealisasi);
  const runRateRequired = (sisaTarget / sisaHari).toFixed(0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      
      {/* 1. Total Target Alokasi */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Target</span>
          <Target className="w-4 h-4 text-sky-600" />
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {totalAssigned.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{totalPetugas} Petugas PPL</span>
        </div>
      </div>

      {/* 2. Realisasi Dicacah */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Realisasi Dicacah</span>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-700">
          {totalRealisasi.toLocaleString()}
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-emerald-700">{actualPct.toFixed(1)}%</span>
            <span className="text-slate-400">total</span>
            {includeDraft && <span className="text-[10px] text-amber-600 font-medium">(+Draft)</span>}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Diolah: {totalDiolah.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Target Ideal Kumulatif Hari Ini */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Target Hari ke-{currentDay}</span>
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-slate-800">
          {Math.round(targetKumulatif).toLocaleString()}
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span className="text-slate-500">Target: {idealPct.toFixed(1)}%</span>
          <span className={`font-semibold ${vsTargetPct >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            ({vsTargetPct.toFixed(0)}% tercapai)
          </span>
        </div>
      </div>

      {/* 4. Petugas Belum Bergerak (0%) */}
      <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm relative overflow-hidden bg-rose-50/30">
        <div className="flex items-center justify-between text-rose-700 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Nol Progres (0%)</span>
          <AlertOctagon className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-bold text-rose-700">
          {zeroPetugas.length} <span className="text-sm font-normal text-rose-600">PPL</span>
        </div>
        <div className="mt-1.5 text-xs text-rose-600 font-medium">
          🚨 Perlu konfirmasi segera
        </div>
      </div>

      {/* 5. Petugas Kritis (<70%) */}
      <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm relative overflow-hidden bg-amber-50/30">
        <div className="flex items-center justify-between text-amber-700 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Petugas Kritis</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-amber-700">
          {criticalPetugas.length} <span className="text-sm font-normal text-amber-600">PPL</span>
        </div>
        <div className="mt-1.5 text-xs text-amber-600 font-medium">
          Di bawah 70% target
        </div>
      </div>

      {/* 6. Run-Rate Harian Yang Diperlukan */}
      <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm relative overflow-hidden bg-indigo-50/30">
        <div className="flex items-center justify-between text-indigo-700 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Beban Sisa Hari</span>
          <TrendingUp className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-bold text-indigo-800">
          {Number(runRateRequired).toLocaleString()}
          <span className="text-xs font-normal text-indigo-600 ml-1">/hari</span>
        </div>
        <div className="mt-1.5 text-xs text-indigo-600 font-medium">
          Dalam {sisaHari} hari tersisa
        </div>
      </div>

    </div>
  );
};
