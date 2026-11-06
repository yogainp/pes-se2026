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
  fieldDays?: number;
  totalDays: number;
  includeDraft?: boolean;
  initialKabupaten?: string; // kode
  initialPetugas?: PetugasAnalysis | null;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  kabupatenSummaries,
  allPetugas,
  currentDay,
  fieldDays = 23,
  totalDays,
  includeDraft = false,
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
      setMessage(generateProvinceWhatsAppText(kabupatenSummaries, allPetugas, currentDay, fieldDays, totalDays, includeDraft));
    } else if (targetType === 'kabupaten') {
      const kab = kabupatenSummaries.find((k) => k.kode === selectedKabKode) || kabupatenSummaries[0];
      if (kab) {
        const pList = allPetugas.filter((p) => p.kabupatenKode === kab.kode);
        setMessage(generateKabupatenWhatsAppText(kab, pList, currentDay, fieldDays, totalDays, includeDraft));
      }
    } else if (targetType === 'petugas') {
      const p = allPetugas.find((item) => item.id === selectedPetugasId) || allPetugas[0];
      if (p) {
        setMessage(generatePersonalPetugasWhatsAppText(p, currentDay, fieldDays, totalDays, includeDraft));
      }
    }
    setCopied(false);
  }, [isOpen, targetType, selectedKabKode, selectedPetugasId, kabupatenSummaries, allPetugas, currentDay, fieldDays, totalDays, includeDraft]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bagikan Ringkasan WhatsApp</h3>
              <p className="text-sm text-slate-500">Format pesan koordinasi pemantauan target lapangan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Switcher */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2 text-sm bg-slate-50">
          <button
            onClick={() => setTargetType('provinsi')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              targetType === 'provinsi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tingkat Provinsi
          </button>

          <button
            onClick={() => {
              setTargetType('kabupaten');
              if (!selectedKabKode && kabupatenSummaries.length > 0) {
                setSelectedKabKode(kabupatenSummaries[0].kode);
              }
            }}
            className={`px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              targetType === 'kabupaten'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Per Kabupaten/Kota
          </button>

          <button
            onClick={() => {
              setTargetType('petugas');
              if (!selectedPetugasId && allPetugas.length > 0) {
                setSelectedPetugasId(allPetugas[0].id);
              }
            }}
            className={`px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              targetType === 'petugas'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Pesan Pribadi Petugas
          </button>
        </div>

        {/* Sub-selector */}
        {targetType === 'kabupaten' && (
          <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2.5 text-sm">
            <span className="text-slate-600 font-medium">Pilih Satker:</span>
            <select
              value={selectedKabKode}
              onChange={(e) => setSelectedKabKode(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 text-sm"
            >
              {kabupatenSummaries.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.nama} ({includeDraft ? k.totalRealisasi : k.totalDicacah}/{k.totalAssigned})
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'petugas' && (
          <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2.5 text-sm">
            <span className="text-slate-600 font-medium">Pilih Petugas PPL:</span>
            <select
              value={selectedPetugasId}
              onChange={(e) => setSelectedPetugasId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 text-sm max-w-sm truncate"
            >
              {allPetugas.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.kabupatenNama}] {p.pencacah} ({includeDraft ? p.realisasi : p.dicacah}/{p.assigned})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message Preview */}
        <div className="p-5 flex-1 overflow-y-auto">
          <label className="text-sm font-bold text-slate-800 block mb-2">
            Teks Pesan WhatsApp:
          </label>
          <textarea
            readOnly
            value={message}
            rows={12}
            className="w-full text-sm font-mono p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none resize-none select-all leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleOpenWaWeb}
            className="px-3.5 py-2 text-sm font-medium text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/50 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Buka WhatsApp Web</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs ${
                copied ? 'bg-emerald-800' : 'bg-emerald-700 hover:bg-emerald-800'
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
                  <span>Salin Teks WA</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
