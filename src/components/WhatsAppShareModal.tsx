import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';
import { PetugasAnalysis, KabupatenSummary } from '../types';
import { 
  generateProvinceWhatsAppText, 
  generateKabupatenWhatsAppText, 
  generatePersonalPetugasWhatsAppText 
} from '../utils/whatsappGenerator';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  kabupatenSummaries: KabupatenSummary[];
  allPetugas: PetugasAnalysis[];
  currentDay: number;
  totalDays: number;
  initialKabupaten?: string; // kode
  initialPetugas?: PetugasAnalysis | null;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  kabupatenSummaries,
  allPetugas,
  currentDay,
  totalDays,
  initialKabupaten,
  initialPetugas,
}) => {
  const [targetType, setTargetType] = useState<'provinsi' | 'kabupaten' | 'petugas'>('provinsi');
  const [selectedKabKode, setSelectedKabKode] = useState<string>('');
  const [selectedPetugasId, setSelectedPetugasId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  // Set initial target when modal opens
  useEffect(() => {
    if (initialPetugas) {
      setTargetType('petugas');
      setSelectedPetugasId(initialPetugas.id);
    } else if (initialKabupaten && initialKabupaten !== 'all') {
      setTargetType('kabupaten');
      setSelectedKabKode(initialKabupaten);
    } else {
      setTargetType('provinsi');
      if (kabupatenSummaries.length > 0 && !selectedKabKode) {
        setSelectedKabKode(kabupatenSummaries[0].kode);
      }
    }
  }, [isOpen, initialKabupaten, initialPetugas, kabupatenSummaries]);

  // Generate message dynamically
  useEffect(() => {
    if (!isOpen) return;

    if (targetType === 'provinsi') {
      setMessage(generateProvinceWhatsAppText(kabupatenSummaries, allPetugas, currentDay, totalDays));
    } else if (targetType === 'kabupaten') {
      const kab = kabupatenSummaries.find((k) => k.kode === selectedKabKode) || kabupatenSummaries[0];
      if (kab) {
        const pList = allPetugas.filter((p) => p.kabupatenKode === kab.kode);
        setMessage(generateKabupatenWhatsAppText(kab, pList, currentDay, totalDays));
      }
    } else if (targetType === 'petugas') {
      const p = allPetugas.find((item) => item.id === selectedPetugasId) || allPetugas[0];
      if (p) {
        setMessage(generatePersonalPetugasWhatsAppText(p, currentDay, totalDays));
      }
    }
    setCopied(false);
  }, [isOpen, targetType, selectedKabKode, selectedPetugasId, kabupatenSummaries, allPetugas, currentDay, totalDays]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWaWeb = () => {
    const encoded = encodeURIComponent(message);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bagikan Ringkasan WhatsApp</h3>
              <p className="text-xs text-slate-500">Format rapi siap kirim ke grup koordinasi BPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Switcher */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setTargetType('provinsi')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              targetType === 'provinsi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏛️ Seluruh Provinsi
          </button>

          <button
            onClick={() => {
              setTargetType('kabupaten');
              if (!selectedKabKode && kabupatenSummaries.length > 0) {
                setSelectedKabKode(kabupatenSummaries[0].kode);
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              targetType === 'kabupaten'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📍 Per Kabupaten/Kota
          </button>

          <button
            onClick={() => {
              setTargetType('petugas');
              if (!selectedPetugasId && allPetugas.length > 0) {
                setSelectedPetugasId(allPetugas[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              targetType === 'petugas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            👤 Japri Petugas
          </button>
        </div>

        {/* Sub-selector */}
        {targetType === 'kabupaten' && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Pilih Kabupaten:</span>
            <select
              value={selectedKabKode}
              onChange={(e) => setSelectedKabKode(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
            >
              {kabupatenSummaries.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.nama} ({k.totalDicacah}/{k.totalAssigned})
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'petugas' && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">Pilih Petugas:</span>
            <select
              value={selectedPetugasId}
              onChange={(e) => setSelectedPetugasId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 max-w-xs truncate"
            >
              {allPetugas.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.kabupatenNama}] {p.pencacah} ({p.dicacah}/{p.assigned})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message Preview */}
        <div className="p-5 flex-1 overflow-y-auto">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Preview Pesan WhatsApp:
          </label>
          <textarea
            readOnly
            value={message}
            rows={12}
            className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none select-all"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={handleOpenWaWeb}
            className="px-3.5 py-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buka di WA Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer ${
                copied ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Pesan WA</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
