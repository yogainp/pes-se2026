import React from 'react';
import { UploadCloud, Share2, Download, RotateCcw, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  currentDay: number;
  totalDays: number;
  onDayChange: (day: number) => void;
  includeDraft: boolean;
  onIncludeDraftChange: (include: boolean) => void;
  fileName: string;
  lastUpdated: string;
  isCustomData: boolean;
  onOpenUpload: () => void;
  onOpenShareModal: () => void;
  onExportExcel: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDay,
  totalDays,
  onDayChange,
  includeDraft,
  onIncludeDraftChange,
  fileName,
  lastUpdated,
  isCustomData,
  onOpenUpload,
  onOpenShareModal,
  onExportExcel,
  onResetData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <span className="font-bold tracking-wider text-sm">PES</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Monitoring Harian Petugas PES SE2026
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  BPS Prov. Kalbar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan Target Harian Lapangan • 1 s.d. 30 November 2026
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm gap-1.5 cursor-pointer"
              title="Upload file excel hasil download dari Fasih Dashboard"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Excel Progres</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors gap-1.5 cursor-pointer"
              title="Salin pesan ringkasan siap blast ke grup WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Ringkasan WA</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors gap-1.5 cursor-pointer"
              title="Download evaluasi dan status warning ke file Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Excel</span>
            </button>

            {isCustomData && (
              <button
                onClick={onResetData}
                className="inline-flex items-center px-2.5 py-2 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors gap-1 cursor-pointer"
                title="Kembalikan ke data default awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status bar & Interactive Controls */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          
          {/* File info */}
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="font-medium text-slate-500">File Aktif:</span>
            <code className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700 border border-slate-200">
              {fileName}
            </code>
            <span className="text-slate-400">•</span>
            <span>Update: <strong className="text-slate-700">{lastUpdated}</strong></span>
            {isCustomData ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                <AlertCircle className="w-3 h-3" /> Data Hasil Upload User
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Data Default Baseline
              </span>
            )}
          </div>

          {/* Day & Target Slider Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
            {/* Draft toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeDraft}
                onChange={(e) => onIncludeDraftChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span>Hitung Draft</span>
            </label>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Day slider */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-semibold text-slate-900">
                  Hari ke-{currentDay} <span className="font-normal text-slate-500 text-[11px]">({currentDay} Nov)</span>
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={totalDays}
                value={currentDay}
                onChange={(e) => onDayChange(Number(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <span className="text-[11px] text-slate-500 font-medium">
                Ideal: {((currentDay / totalDays) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
