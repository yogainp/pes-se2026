import React from 'react';
import { Share2, ChevronRight } from 'lucide-react';
import { KabupatenSummary } from '../types';

interface KabupatenOverviewProps {
  summaries: KabupatenSummary[];
  selectedKabupaten: string;
  onSelectKabupaten: (kode: string) => void;
  onShareKabupaten: (summary: KabupatenSummary) => void;
  currentDay: number;
  fieldDays?: number;
  totalDays?: number;
}

export const KabupatenOverview: React.FC<KabupatenOverviewProps> = ({
  summaries,
  selectedKabupaten,
  onSelectKabupaten,
  onShareKabupaten,
  currentDay,
  fieldDays = 23,
}) => {
  const idealPct = Math.min(100, (currentDay / fieldDays) * 100);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-6 shadow-2xs">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Monitoring Progres Wilayah (8 Kabupaten/Kota)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pemantauan pemenuhan target lapangan 23 hari kerja (Target Ideal Hari ke-{currentDay}: {idealPct.toFixed(1)}%).
          </p>
        </div>
        
        {/* Legend */}
        <div className="text-sm text-slate-600 flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Sesuai Target (≥100%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Waspada (70–99%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Kritis (&lt;70%)
          </span>
        </div>
      </div>

      {/* Grid of 8 Kabupaten/Kota */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {summaries.map((kab) => {
          const isSelected = selectedKabupaten === kab.kode;
          const isAhead = kab.persenCapaian >= 100;
          const isCritical = kab.persenCapaian < 70;

          return (
            <div
              key={kab.kode}
              onClick={() => onSelectKabupaten(isSelected ? 'all' : kab.kode)}
              className={`rounded-lg border p-4 transition-colors cursor-pointer relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Header Card */}
              <div className="flex items-start justify-between gap-1 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {kab.kode}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {kab.nama}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {kab.totalPetugas} Petugas PPL
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareKabupaten(kab);
                  }}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                  title={`Salin ringkasan WA untuk ${kab.nama}`}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar vs Target */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Capaian Target:</span>
                  <span
                    className={`font-bold ${
                      isAhead ? 'text-emerald-700' : isCritical ? 'text-rose-700' : 'text-amber-700'
                    }`}
                  >
                    {kab.persenCapaian}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isAhead ? 'bg-emerald-600' : isCritical ? 'bg-rose-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${Math.min(100, kab.persenCapaian)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Detail */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Realisasi / Alokasi</span>
                  <span className="font-bold text-slate-800">
                    {kab.totalDicacah.toLocaleString()} <span className="text-slate-400 font-normal text-xs">/ {kab.totalAssigned}</span>
                  </span>
                  {kab.totalKontrolKeluarga ? (
                    <span className="text-[11px] text-blue-600 block mt-0.5" title="Data Kontrol Keluarga dari Hasil Sensus Ekonomi 2026">
                      SE: {kab.totalKontrolKeluarga.toLocaleString()} Kel ({kab.coverageKeluargaSE}%)
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Beban Sisa</span>
                  <span className="font-bold text-slate-800">
                    {kab.avgRunRate} <span className="text-slate-400 font-normal text-xs">/hari</span>
                  </span>
                </div>
              </div>

              {/* Status Note & Selection Pill */}
              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
                {kab.petugasZero > 0 ? (
                  <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {kab.petugasZero} PPL Nol (0%)
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Semua Bergerak
                  </span>
                )}

                <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                  {isSelected ? 'Terpilih' : 'Filter'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
