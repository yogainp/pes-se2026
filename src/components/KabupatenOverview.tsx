import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Share2, 
  ChevronRight, 
  LayoutGrid, 
  Table as TableIcon, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Check,
  Filter,
  Camera,
  ChevronDown,
  Download,
  Copy,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { KabupatenSummary } from '../types';
import { exportElementToImage, copyElementToClipboard, generateElementDataUrl } from '../utils/imageExporter';
import { ImageExportModal } from './ImageExportModal';

interface KabupatenOverviewProps {
  summaries: KabupatenSummary[];
  selectedKabupaten: string;
  onSelectKabupaten: (kode: string) => void;
  onSelectStatus?: (status: string) => void;
  onShareKabupaten: (summary: KabupatenSummary) => void;
  currentDay: number;
  fieldDays?: number;
  totalDays?: number;
  includeDraft?: boolean;
  lastUpdated?: string;
}

type KabSortField = 
  | 'kode' 
  | 'nama' 
  | 'totalPetugas' 
  | 'totalAssigned' 
  | 'targetKumulatif' 
  | 'totalRealisasi' 
  | 'persenTotal' 
  | 'persenCapaian' 
  | 'avgRunRate' 
  | 'petugasZero' 
  | 'petugasKritis';

export interface KabupatenOverviewHandle {
  openPreview: () => void;
  downloadImage: (format?: 'png' | 'jpeg') => Promise<void>;
  copyImage: () => Promise<boolean>;
}

export const KabupatenOverview = forwardRef<KabupatenOverviewHandle, KabupatenOverviewProps>(({
  summaries,
  selectedKabupaten,
  onSelectKabupaten,
  onSelectStatus,
  onShareKabupaten,
  currentDay,
  fieldDays = 23,
  includeDraft = false,
  lastUpdated,
}, ref) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortField, setSortField] = useState<KabSortField>('kode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Export & Preview State
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getExportFilename = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `Monitoring Progres Pendataan PES SE2026 ${dd}${mm}${yy}_${hour}${minute}`;
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    if (!containerRef.current) return;
    setIsExportDropdownOpen(false);
    setIsExporting(true);
    try {
      const filename = getExportFilename();
      await exportElementToImage({
        element: containerRef.current,
        filename,
        format,
        pixelRatio: 2,
      });
      showToast(`Gambar ${format.toUpperCase()} berhasil diunduh!`);
    } catch (err) {
      console.error('Gagal mengunduh gambar:', err);
      showToast('Gagal mengunduh gambar. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!containerRef.current) return false;
    setIsExportDropdownOpen(false);
    setIsExporting(true);
    try {
      await copyElementToClipboard({
        element: containerRef.current,
        pixelRatio: 2,
      });
      showToast('Gambar berhasil disalin ke clipboard! Siap di-paste (Ctrl+V) ke WhatsApp.');
      return true;
    } catch (err: any) {
      console.error('Gagal menyalin gambar:', err);
      showToast('Clipboard diblokir browser. Mengunduh file PNG sebagai gantinya...');
      await exportElementToImage({
        element: containerRef.current,
        filename: getExportFilename(),
        format: 'png',
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!containerRef.current) return;
    setIsExportDropdownOpen(false);
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    try {
      const url = await generateElementDataUrl({
        element: containerRef.current,
        format: 'png',
        pixelRatio: 2,
      });
      setPreviewDataUrl(url);
    } catch (err) {
      console.error('Gagal memuat pratinjau:', err);
      showToast('Gagal memuat pratinjau gambar.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openPreview: handleOpenPreview,
    downloadImage: async (format = 'png') => {
      await handleDownloadImage(format);
    },
    copyImage: async () => {
      return await handleCopyImage();
    },
  }));

  const idealPct = Math.min(100, (currentDay / fieldDays) * 100);

  // Sorting for Table View
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'totalRealisasi') {
        valA = includeDraft ? a.totalRealisasi : a.totalDicacah;
        valB = includeDraft ? b.totalRealisasi : b.totalDicacah;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [summaries, sortField, sortDirection, includeDraft]);

  const handleSort = (field: KabSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'persenTotal' || field === 'persenCapaian' ? 'desc' : 'asc');
    }
  };

  // Province Totals for Table Footer
  const provinceTotals = useMemo(() => {
    const totalPetugas = summaries.reduce((s, k) => s + k.totalPetugas, 0);
    const totalAssigned = summaries.reduce((s, k) => s + k.totalAssigned, 0);
    const totalDicacah = summaries.reduce((s, k) => s + k.totalDicacah, 0);
    const totalDraft = summaries.reduce((s, k) => s + k.totalDraft, 0);
    const totalRealisasi = includeDraft ? totalDicacah + totalDraft : totalDicacah;
    const targetKumulatif = summaries.reduce((s, k) => s + k.targetKumulatif, 0);
    const petugasZero = summaries.reduce((s, k) => s + k.petugasZero, 0);
    const petugasKritis = summaries.reduce((s, k) => s + k.petugasKritis, 0);
    const petugasWaspada = summaries.reduce((s, k) => s + k.petugasWaspada, 0);
    const petugasOnTrack = summaries.reduce((s, k) => s + k.petugasOnTrack, 0);
    const avgRunRate = Number(summaries.reduce((s, k) => s + k.avgRunRate, 0).toFixed(1));

    const persenTotal = totalAssigned > 0 ? Number(((totalRealisasi / totalAssigned) * 100).toFixed(1)) : 0;
    const persenCapaian = targetKumulatif > 0 ? Number(((totalRealisasi / targetKumulatif) * 100).toFixed(1)) : 0;

    return {
      totalPetugas,
      totalAssigned,
      totalDicacah,
      totalDraft,
      totalRealisasi,
      targetKumulatif: Number(targetKumulatif.toFixed(1)),
      persenTotal,
      persenCapaian,
      petugasZero,
      petugasKritis,
      petugasWaspada,
      petugasOnTrack,
      avgRunRate,
    };
  }, [summaries, includeDraft]);

  const handlePillClick = (e: React.MouseEvent, kode: string, status: string) => {
    e.stopPropagation();
    onSelectKabupaten(kode);
    if (onSelectStatus) {
      onSelectStatus(status);
    }
    const tableEl = document.getElementById('petugas-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} id="kabupaten-overview-card" className="bg-white rounded-lg border border-slate-200 p-5 mb-6 shadow-2xs relative">
      
      {/* Export-Only Official Infographic Header Banner */}
      <div className="hidden export-only mb-5 pb-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#005596] flex items-center justify-center text-white font-bold text-lg tracking-wider shrink-0 shadow-xs">
              BPS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Monitoring Harian Petugas PES SE2026
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  Provinsi Kalimantan Barat
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring Evaluasi Progres Lapangan Wilayah (8 Kabupaten/Kota) • Target Lapangan: 1 s.d. {fieldDays} November 2026
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
              <span>Hari ke-{currentDay} ({currentDay} Nov)</span>
              <span>•</span>
              <span>Target Ideal: {idealPct.toFixed(1)}%</span>
              {includeDraft && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 font-medium">+Hitung Draft</span>
                </>
              )}
            </div>
            {lastUpdated && (
              <div className="text-[11px] text-slate-500 mt-1">
                Data Fasih: <span className="font-semibold text-slate-700">{lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Monitoring Progres Wilayah (8 Kabupaten/Kota)
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Target Ideal H-{currentDay}: {idealPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluasi <span className="font-semibold text-slate-700">Progres Pendataan</span> terhadap total alokasi dan <span className="font-semibold text-slate-700">Capaian dari Target Kumulatif Harian</span>.
          </p>
        </div>
        
        {/* View Switcher, Legend & Image Exporter */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {/* Toggle Button Kartu vs Tabel */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs export-exclude">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan dalam bentuk kartu wilayah"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan ringkasan komparasi dalam bentuk tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Ringkasan</span>
            </button>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Capaian Harian:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Sesuai (≥100%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> Waspada (70–99%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Kritis (&lt;70%)
            </span>
          </div>

          {/* Tombol Ekspor Gambar Dropdown */}
          <div className="relative export-exclude" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
              title="Ekspor tampilan monitoring progres ini menjadi gambar (PNG/JPG)"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#005596]" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>{isExporting ? 'Memproses...' : 'Ekspor Gambar'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-fade-in">
                <div className="px-3 py-1 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Format Ekspor
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadImage('png')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="p-1 rounded bg-blue-50 text-blue-700 mt-0.5 group-hover:bg-blue-100">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Unduh PNG (.png)</div>
                    <div className="text-[11px] text-slate-500">Resolusi tinggi retina & teks tajam</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadImage('jpeg')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="p-1 rounded bg-slate-100 text-slate-700 mt-0.5 group-hover:bg-slate-200">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Unduh JPG (.jpg)</div>
                    <div className="text-[11px] text-slate-500">Format ringkas terkompresi</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50/60 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="p-1 rounded bg-emerald-50 text-emerald-700 mt-0.5 group-hover:bg-emerald-100">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900">Salin ke WhatsApp</div>
                    <div className="text-[11px] text-slate-500">Bisa langsung Ctrl+V di chat WA</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2.5 text-slate-600 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <span>Pratinjau Gambar (Preview)...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TAMPILAN KARTU (CARD VIEW)                             */}
      {/* ========================================================= */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 export-grid-4">
          {summaries.map((kab) => {
            const isSelected = selectedKabupaten === kab.kode;
            const isAhead = kab.persenCapaian >= 100;
            const isCritical = kab.persenCapaian < 70;
            const gapPct = Number((kab.persenTotal - idealPct).toFixed(1));

            return (
              <div
                key={kab.kode}
                onClick={() => onSelectKabupaten(isSelected ? 'all' : kab.kode)}
                className={`rounded-lg border p-4 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Header Card */}
                <div>
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
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer export-exclude"
                      title={`Salin ringkasan WA untuk ${kab.nama}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. METRIK: Progres Pendataan vs Target Ideal */}
                  <div className="mt-2.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Progres Pendataan:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          {kab.persenTotal}%
                        </span>
                        <span className={`text-[11px] ml-1 font-semibold ${gapPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ({gapPct >= 0 ? `+${gapPct}` : gapPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Dual Progress Bar with Target Ideal Pin */}
                    <div className="relative w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-1">
                      {/* Actual Progress Fill */}
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          kab.persenTotal >= idealPct 
                            ? 'bg-emerald-600' 
                            : kab.persenTotal >= idealPct * 0.7 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, kab.persenTotal)}%` }}
                      />
                      {/* Target Ideal Marker Line */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                        style={{ left: `${Math.min(100, idealPct)}%` }}
                        title={`Target Ideal H-${currentDay}: ${idealPct.toFixed(1)}%`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span>Total Alokasi</span>
                      <span className="font-medium text-slate-700">
                        Target Ideal H-{currentDay}: <strong className="text-slate-800">{idealPct.toFixed(1)}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* 2. METRIK: Capaian dari Target Kumulatif Harian */}
                  <div className="mt-3 px-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Capaian Target Kumulatif:</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                          isAhead 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : isCritical 
                            ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {kab.persenCapaian}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isAhead ? 'bg-emerald-600' : isCritical ? 'bg-rose-600' : 'bg-amber-600'
                        }`}
                        style={{ width: `${Math.min(100, kab.persenCapaian)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Detail (Realisasi / Alokasi & Beban Sisa) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Realisasi / Alokasi</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {includeDraft ? kab.totalRealisasi.toLocaleString() : kab.totalDicacah.toLocaleString()}{' '}
                        <span className="text-slate-400 font-normal text-[11px]">/ {kab.totalAssigned.toLocaleString()}</span>
                      </span>
                      {includeDraft && kab.totalDraft > 0 && (
                        <span className="text-[10px] text-blue-700 font-medium block">
                          ({kab.totalDicacah} + {kab.totalDraft} draft)
                        </span>
                      )}
                      {kab.totalKontrolKeluarga ? (
                        <span className="text-[10px] text-blue-600 block mt-0.5" title="Data Kontrol Total Assignment dari Hasil Sensus Ekonomi 2026">
                          SE: {kab.totalKontrolKeluarga.toLocaleString()} ({kab.coverageKeluargaSE}%)
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Beban Sisa</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {kab.avgRunRate} <span className="text-slate-400 font-normal text-[11px]">/hari</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Note & Selection Pill (DYNAMIC SEVERITY BADGE) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
                  {/* Dynamic Status Pill */}
                  {kab.petugasZero > 0 && kab.petugasKritis > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handlePillClick(e, kab.kode, 'zero')}
                      className="text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Klik untuk memfilter petugas nol & kritis di tabel"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <span>{kab.petugasZero} Nol • {kab.petugasKritis} Kritis</span>
                    </button>
                  ) : kab.petugasZero > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handlePillClick(e, kab.kode, 'zero')}
                      className="text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Klik untuk memfilter petugas nol progres di tabel"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <span>{kab.petugasZero} PPL Nol (0%)</span>
                    </button>
                  ) : kab.petugasKritis > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handlePillClick(e, kab.kode, 'critical')}
                      className="text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Klik untuk memfilter petugas kritis di tabel"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{kab.petugasKritis} PPL Kritis (&lt;70%)</span>
                    </button>
                  ) : kab.petugasWaspada > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handlePillClick(e, kab.kode, 'warning')}
                      className="text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Klik untuk memfilter petugas waspada di tabel"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{kab.petugasWaspada} PPL Waspada</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Semua On-Track</span>
                    </span>
                  )}

                  <span className="text-blue-700 font-semibold flex items-center gap-0.5 ml-1 export-exclude">
                    {isSelected ? 'Terpilih' : 'Filter'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAMPILAN TABEL RINGKASAN (TABLE VIEW)                  */}
      {/* ========================================================= */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold select-none text-xs uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('kode')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-center w-14"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Kode</span>
                    {sortField === 'kode' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('nama')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Kabupaten / Kota</span>
                    {sortField === 'nama' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('totalPetugas')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-center"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Petugas & Status</span>
                    {sortField === 'totalPetugas' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('totalAssigned')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                  title="Total beban sampel alokasi seluruh survei"
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Alokasi</span>
                    {sortField === 'totalAssigned' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('targetKumulatif')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                  title={`Target kumulatif ideal s.d. hari ke-${currentDay} berbasis 23 hari lapangan`}
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Target H-{currentDay}</span>
                    {sortField === 'targetKumulatif' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('totalRealisasi')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                  title={includeDraft ? "Total realisasi selesai ditambah kuesioner draft" : "Total realisasi selesai dicacah"}
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Realisasi</span>
                    {includeDraft && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                        +Draft
                      </span>
                    )}
                    {sortField === 'totalRealisasi' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('persenTotal')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-left"
                  title={`Persentase realisasi terhadap total alokasi (dibandingkan Target Ideal ${idealPct.toFixed(1)}%)`}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Progres Pendataan</span>
                    {sortField === 'persenTotal' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('persenCapaian')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors text-left"
                  title="Persentase capaian terhadap target kumulatif harian s.d. hari ini"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Capaian Target Kumulatif Harian</span>
                    {sortField === 'persenCapaian' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('avgRunRate')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                  title="Rata-rata sampel yang harus diselesaikan per hari sebelum 23 Nov"
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Beban Sisa</span>
                    {sortField === 'avgRunRate' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </th>

                <th className="py-3 px-3 text-center w-24 export-exclude">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedSummaries.map((kab) => {
                const isSelected = selectedKabupaten === kab.kode;
                const isAhead = kab.persenCapaian >= 100;
                const isCritical = kab.persenCapaian < 70;
                const realisasiVal = includeDraft ? kab.totalRealisasi : kab.totalDicacah;
                const gapPct = Number((kab.persenTotal - idealPct).toFixed(1));

                return (
                  <tr
                    key={kab.kode}
                    onClick={() => onSelectKabupaten(isSelected ? 'all' : kab.kode)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/50 font-medium' : ''
                    }`}
                  >
                    {/* Kode */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {kab.kode}
                      </span>
                    </td>

                    {/* Nama Kab */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">
                        {kab.nama}
                      </span>
                      {kab.totalKontrolKeluarga ? (
                        <span className="text-[11px] text-blue-600 font-normal">
                          SE: {kab.totalKontrolKeluarga.toLocaleString()} ({kab.coverageKeluargaSE}%)
                        </span>
                      ) : null}
                    </td>

                    {/* Petugas & Dynamic Severity Alert */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-slate-800">
                          {kab.totalPetugas} PPL
                        </span>
                        {kab.petugasZero > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => handlePillClick(e, kab.kode, 'zero')}
                            className="text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200 cursor-pointer"
                          >
                            {kab.petugasZero} Nol
                          </button>
                        ) : kab.petugasKritis > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => handlePillClick(e, kab.kode, 'critical')}
                            className="text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200 cursor-pointer"
                          >
                            {kab.petugasKritis} Kritis
                          </button>
                        ) : kab.petugasWaspada > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => handlePillClick(e, kab.kode, 'warning')}
                            className="text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 cursor-pointer"
                          >
                            {kab.petugasWaspada} Waspada
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            On-Track
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alokasi */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {kab.totalAssigned.toLocaleString()}
                    </td>

                    {/* Target Kumulatif */}
                    <td className="py-3 px-3 text-right text-slate-700">
                      <span className="font-semibold text-slate-900">{kab.targetKumulatif.toLocaleString()}</span>
                    </td>

                    {/* Realisasi */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-900 block">
                        {realisasiVal.toLocaleString()}
                      </span>
                      {includeDraft && kab.totalDraft > 0 && (
                        <span className="text-[10px] text-blue-700 block">
                          +{kab.totalDraft} draft
                        </span>
                      )}
                    </td>

                    {/* Progres Pendataan (vs Target Ideal) */}
                    <td className="py-3 px-3">
                      <div className="w-28 sm:w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{kab.persenTotal}%</span>
                          <span className={`text-[11px] font-semibold ${gapPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {gapPct >= 0 ? `+${gapPct}` : gapPct}%
                          </span>
                        </div>
                        <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              kab.persenTotal >= idealPct 
                                ? 'bg-emerald-600' 
                                : kab.persenTotal >= idealPct * 0.7 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, kab.persenTotal)}%` }}
                          />
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                            style={{ left: `${Math.min(100, idealPct)}%` }}
                            title={`Target Ideal: ${idealPct.toFixed(1)}%`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Capaian dari Target Kumulatif Harian */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded border ${
                            isAhead
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isCritical
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {kab.persenCapaian}%
                        </span>
                        <span className="text-xs text-slate-500 hidden xl:inline">
                          {isAhead ? 'Sesuai' : isCritical ? 'Kritis' : 'Waspada'}
                        </span>
                      </div>
                    </td>

                    {/* Beban Sisa */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-800">
                        {kab.avgRunRate}
                      </span>
                      <span className="text-[11px] text-slate-400 block">/hari</span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center export-exclude" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectKabupaten(isSelected ? 'all' : kab.kode)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                          title={isSelected ? "Batalkan filter wilayah" : "Filter data petugas di bawah"}
                        >
                          <Filter className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onShareKabupaten(kab)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title={`Salin ringkasan WA untuk ${kab.nama}`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row (Provinsi Kalimantan Barat) */}
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs sm:text-sm">
                <td className="py-3 px-3 text-center font-mono">
                  PROV
                </td>
                <td className="py-3 px-3">
                  TOTAL PROVINSI KALIMANTAN BARAT
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{provinceTotals.totalPetugas} PPL</span>
                    {provinceTotals.petugasZero > 0 ? (
                      <span className="text-[10px] text-rose-700 font-semibold bg-rose-100/70 px-1 py-0.2 rounded">
                        {provinceTotals.petugasZero} Nol
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  {provinceTotals.totalAssigned.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  {provinceTotals.targetKumulatif.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right text-blue-900">
                  {provinceTotals.totalRealisasi.toLocaleString()}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-900 font-bold">{provinceTotals.persenTotal}%</span>
                    <span className="text-slate-500 text-[11px]">(Ideal: {idealPct.toFixed(1)}%)</span>
                  </div>
                </td>
                <td className="py-3 px-3.5">
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded border ${
                      provinceTotals.persenCapaian >= 100
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : provinceTotals.persenCapaian >= 70
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {provinceTotals.persenCapaian}%
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {provinceTotals.avgRunRate}
                  <span className="text-[11px] text-slate-500 block font-normal">/hari</span>
                </td>
                <td className="py-3 px-3 text-center text-xs text-slate-400 export-exclude">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Export-Only Official Infographic Footer Watermark */}
      <div className="hidden export-only mt-5 pt-3 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Badan Pusat Statistik Provinsi Kalimantan Barat</span>
            <span>•</span>
            <span>Sistem Monitoring Lapangan PES SE2026</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Format: {viewMode === 'card' ? 'Kartu Ringkasan Wilayah' : 'Tabel Komparasi Wilayah'} • Digenerate otomatis
          </div>
        </div>
      </div>

      {/* Modal Pratinjau Gambar */}
      <ImageExportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageDataUrl={previewDataUrl}
        isLoading={isPreviewLoading}
        onDownloadPng={() => handleDownloadImage('png')}
        onDownloadJpeg={() => handleDownloadImage('jpeg')}
        onCopyToClipboard={handleCopyImage}
        title="Pratinjau Monitoring Progres Wilayah"
        subtitle={`Posisi Hari ke-${currentDay} • Mode: ${viewMode === 'card' ? 'Kartu Wilayah' : 'Tabel Ringkasan'}`}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in border border-slate-800">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
});

KabupatenOverview.displayName = 'KabupatenOverview';
