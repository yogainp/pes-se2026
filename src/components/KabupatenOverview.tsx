import React from 'react';
import { Trophy, AlertOctagon, Share2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { KabupatenSummary } from '../types';

interface KabupatenOverviewProps {
  summaries: KabupatenSummary[];
  selectedKabupaten: string;
  onSelectKabupaten: (kode: string) => void;
  onShareKabupaten: (summary: KabupatenSummary) => void;
  currentDay: number;
  totalDays: number;
}

export const KabupatenOverview: React.FC<KabupatenOverviewProps> = ({
  summaries,
  selectedKabupaten,
  onSelectKabupaten,
  onShareKabupaten,
  currentDay,
  totalDays,
}) => {
  const idealPct = (currentDay / totalDays) * 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Klasemen Capaian Target Harian per Kabupaten/Kota
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Diurutkan berdasarkan % pemenuhan target kumulatif hari ke-{currentDay} (Target Ideal: {idealPct.toFixed(1)}%)
          </p>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> On Track (≥100%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Waspada (70-99%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Kritis (&lt;70%)
          </span>
        </div>
      </div>

      {/* Grid Cards of 8 Kab/Kota */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {summaries.map((kab, idx) => {
          const isSelected = selectedKabupaten === kab.kode;
          const isAhead = kab.persenCapaian >= 100;
          const isCritical = kab.persenCapaian < 70;

          const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

          return (
            <div
              key={kab.kode}
              onClick={() => onSelectKabupaten(isSelected ? 'all' : kab.kode)}
              className={`rounded-xl border p-4 transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40 shadow-sm'
                  : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Header Card */}
              <div className="flex items-start justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400 font-mono w-6">
                    {medalEmoji}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {kab.nama}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {kab.kode} • {kab.totalPetugas} PPL
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareKabupaten(kab);
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title={`Salin ringkasan WA untuk ${kab.nama}`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar vs Target */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Capaian Target:</span>
                  <span
                    className={`font-bold ${
                      isAhead ? 'text-emerald-600' : isCritical ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {kab.persenCapaian}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAhead ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, kab.persenCapaian)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Detail */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Realisasi</span>
                  <span className="font-semibold text-slate-800">
                    {kab.totalDicacah.toLocaleString()} <span className="text-slate-400 font-normal">/ {kab.totalAssigned}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Beban Sisa</span>
                  <span className="font-semibold text-indigo-700">
                    {kab.avgRunRate} <span className="text-slate-400 font-normal">/hari</span>
                  </span>
                </div>
              </div>

              {/* Alerts & Footer */}
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                {kab.petugasZero > 0 ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-md">
                    <AlertOctagon className="w-3 h-3 text-rose-500" />
                    {kab.petugasZero} PPL Nol (0%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Semua Bergerak
                  </span>
                )}

                <span className="text-sky-600 font-medium flex items-center gap-0.5">
                  {isSelected ? 'Aktif' : 'Lihat'} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
