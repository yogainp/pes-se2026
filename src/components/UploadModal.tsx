import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { parseFasihExcel, ParseResult } from '../utils/excelParser';
import { PetugasRecord } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: PetugasRecord[], fileName: string, detectedDay?: number) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseResult({
        success: false,
        records: [],
        timestamp: new Date().toLocaleString(),
        fileName: file.name,
        error: 'Format file tidak didukung. Mohon unggah file Excel (.xlsx atau .xls).',
      });
      return;
    }

    setIsLoading(true);
    setParseResult(null);

    const result = await parseFasihExcel(file);
    setIsLoading(false);
    setParseResult(result);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parseResult && parseResult.success) {
      onDataLoaded(parseResult.records, parseResult.fileName, parseResult.detectedDay);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upload Excel Progres Terbaru</h3>
              <p className="text-xs text-slate-500">Mendukung format unduhan langsung dari Fasih Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-50/50'
                : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Klik untuk pilih file atau seret file ke sini
            </p>
            <p className="text-xs text-slate-500 mt-1">
              File Excel (.xlsx) dari menu Fasih Dashboard (misal: <code>20261105_084008.xlsx</code>)
            </p>
          </div>

          {/* Loading status */}
          {isLoading && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 flex items-center gap-3 text-xs text-slate-600">
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <span>Sedang memproses dan memvalidasi file Excel...</span>
            </div>
          )}

          {/* Result Feedback */}
          {parseResult && (
            <div className="mt-4">
              {parseResult.success ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>File Berhasil Diproses!</span>
                  </div>
                  <p>
                    Ditemukan <strong>{parseResult.records.length} data petugas</strong> dari file{' '}
                    <code>{parseResult.fileName}</code>.
                  </p>
                  {parseResult.detectedDay && (
                    <p className="mt-1 text-emerald-700">
                      📅 Terdeteksi otomatis sebagai data <strong>Hari ke-{parseResult.detectedDay}</strong>.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Gagal Memproses File</span>
                  </div>
                  <p>{parseResult.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Tips info */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Catatan Sistem:</span>
            <p>• Data diproses 100% di browser tanpa diunggah ke server database eksternal.</p>
            <p>• Sesi data ini akan disimpan di browser Anda (LocalStorage) selama tidak di-reset.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            disabled={!parseResult || !parseResult.success}
            onClick={handleApply}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Terapkan Data Baru</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
