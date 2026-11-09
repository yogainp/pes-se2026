import React from 'react';
import { Share2, Download, Calendar, Info, Camera } from 'lucide-react';

interface HeaderProps {
  currentDay: number;
  fieldDays?: number;
  totalDays: number;
  onDayChange: (day: number) => void;
  includeDraft: boolean;
  onIncludeDraftChange: (include: boolean) => void;
  fileName: string;
  lastUpdated: string;
  onOpenShareModal: () => void;
  onExportExcel: () => void;
  onScrollToMetadata: () => void;
  onExportImage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDay,
  fieldDays = 23,
  totalDays = 30,
  onDayChange,
  includeDraft,
  onIncludeDraftChange,
  fileName,
  lastUpdated,
  onOpenShareModal,
  onExportExcel,
  onScrollToMetadata,
  onExportImage,
}) => {
  const isCleaningPhase = currentDay > fieldDays;
  const idealPct = Math.min(100, (currentDay / fieldDays) * 100);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Institutional Title & Branding */}
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-lg bg-[#005596] flex items-center justify-center text-white font-bold text-base tracking-wider shrink-0 shadow-xs">
              BPS
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Monitoring Harian Petugas PES SE2026
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Provinsi Kalimantan Barat
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Target Lapangan 1 s.d. {fieldDays} November • Pembersihan Data 24 s.d. {totalDays} November 2026
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onScrollToMetadata}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors gap-2 cursor-pointer"
              title="Lihat Metadata Operasional & Catatan Teknis"
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>Metadata & Catatan</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors gap-2 cursor-pointer"
              title="Salin ringkasan koordinasi ke WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Ringkasan WA</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors gap-2 cursor-pointer shadow-xs"
              title="Unduh rekapitulasi evaluasi dalam format Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor Excel</span>
            </button>

            {onExportImage && (
              <button
                onClick={onExportImage}
                className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors gap-2 cursor-pointer shadow-xs"
                title="Ekspor tampilan monitoring wilayah ke format gambar (PNG/JPG)"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Ekspor Gambar</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Bar & Interactive Timeline Slider */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-sm">
          
          {/* Data Source & Git Sync Info */}
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="text-slate-400">Sumber:</span>
            <code className="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-700 font-mono border border-slate-200 font-medium">
              {fileName}
            </code>
            <span className="text-slate-300">•</span>
            <span>Update: <strong className="text-slate-800 font-semibold">{lastUpdated}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Sinkronisasi Otomatis Git
            </span>
          </div>

          {/* Timeline & Phase Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            {/* Draft toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none" title="Sertakan kuesioner berstatus Draft di Fasih sebagai progres pendataan">
              <input
                type="checkbox"
                checked={includeDraft}
                onChange={(e) => onIncludeDraftChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-sm font-medium">Hitung Draft</span>
            </label>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            {/* Day slider with Phase Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-900 text-sm">
                  Hari ke-{currentDay} <span className="font-normal text-slate-500 text-xs">({currentDay} Nov)</span>
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={totalDays}
                value={currentDay}
                onChange={(e) => onDayChange(Number(e.target.value))}
                className="w-28 sm:w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#005596]"
              />

              <div className="text-xs">
                {isCleaningPhase ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                    Fase Cleaning Data
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    Target Ideal: {idealPct.toFixed(1)}% <span className="text-slate-400 font-normal">({currentDay}/{fieldDays} hr)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
