import React, { useState } from 'react';
import { X, Download, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  isLoading: boolean;
  onDownloadPng: () => void;
  onDownloadJpeg: () => void;
  onCopyToClipboard: () => Promise<boolean>;
  title?: string;
  subtitle?: string;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  isOpen,
  onClose,
  imageDataUrl,
  isLoading,
  onDownloadPng,
  onDownloadJpeg,
  onCopyToClipboard,
  title = 'Pratinjau Ekspor Gambar Monitoring',
  subtitle = 'Gambar siap disimpan atau dibagikan ke WhatsApp / laporan',
}) => {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      const success = await onCopyToClipboard();
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Gagal menyalin gambar:', err);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#005596]/10 flex items-center justify-center text-[#005596]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Preview Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-100/70 flex flex-col items-center justify-center min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#005596]" />
              <p className="text-sm font-medium">Merender gambar resolusi tinggi...</p>
            </div>
          ) : imageDataUrl ? (
            <div className="w-full flex flex-col items-center">
              <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200 max-w-full overflow-auto max-h-[60vh]">
                <img
                  src={imageDataUrl}
                  alt="Pratinjau Monitoring Progres"
                  className="rounded object-contain mx-auto max-h-[55vh]"
                />
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Render Retina 2x resolusi tinggi • Teks & tabel tajam untuk WhatsApp
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Tidak ada gambar yang dimuat.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="text-xs text-slate-500 hidden sm:block">
            {copied ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" /> Gambar tersalin ke clipboard! Tekan Ctrl+V di WhatsApp
              </span>
            ) : (
              <span>Tip: Gunakan tombol Salin Gambar untuk langsung paste ke WhatsApp</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Tombol Salin ke WhatsApp (Clipboard) */}
            <button
              onClick={handleCopy}
              disabled={isLoading || !imageDataUrl || isCopying}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors gap-2 cursor-pointer disabled:opacity-50"
              title="Salin gambar ke clipboard agar bisa langsung di-paste di WhatsApp Web"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tersalin! Siap Ctrl+V</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>Salin ke WhatsApp</span>
                </>
              )}
            </button>

            {/* Tombol Unduh JPG */}
            <button
              onClick={onDownloadJpeg}
              disabled={isLoading || !imageDataUrl}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Unduh gambar dalam format JPG"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Unduh JPG</span>
            </button>

            {/* Tombol Unduh PNG (Primary) */}
            <button
              onClick={onDownloadPng}
              disabled={isLoading || !imageDataUrl}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#005596] hover:bg-[#004275] transition-colors gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Unduh gambar dalam format PNG resolusi tinggi"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
