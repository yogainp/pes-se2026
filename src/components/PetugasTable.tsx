import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Camera, 
  Download, 
  Copy, 
  Loader2, 
  Image as ImageIcon, 
  Check 
} from 'lucide-react';
import { PetugasAnalysis, WarningStatus } from '../types';
import { exportElementToImage, copyElementToClipboard, generateElementDataUrl } from '../utils/imageExporter';
import { ImageExportModal } from './ImageExportModal';

export interface PetugasTableHandle {
  openPreview: () => void;
  downloadImage: (format?: 'png' | 'jpeg') => Promise<void>;
  copyImage: () => Promise<boolean>;
}

export interface PetugasTableProps {
  records: PetugasAnalysis[];
  selectedKabupaten: string;
  onSelectKabupaten: (kab: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  kabupatenList: { kode: string; nama: string }[];
  currentDay: number;
  fieldDays?: number;
  totalDays: number;
  includeDraft?: boolean;
  onSendPetugasAlert: (petugas: PetugasAnalysis) => void;
  lastUpdated?: string;
  fileName?: string;
}

type SortField = 'persenCapaian' | 'assigned' | 'realisasi' | 'dicacah' | 'gap' | 'runRateRequired' | 'pencacah';
type SortDirection = 'asc' | 'desc';

export const PetugasTable = forwardRef<PetugasTableHandle, PetugasTableProps>(({
  records,
  selectedKabupaten,
  onSelectKabupaten,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
  kabupatenList,
  currentDay,
  fieldDays = 23,
  totalDays = 30,
  includeDraft = false,
  onSendPetugasAlert,
  lastUpdated,
  fileName,
}, ref) => {
  const [search, setSearch] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState<string>('all');
  const statusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : internalStatusFilter;
  const setStatusFilter = onStatusFilterChange || setInternalStatusFilter;

  const [sortField, setSortField] = useState<SortField>('persenCapaian');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter & Search
  const filteredRecords = useMemo(() => {
    return records.filter((p) => {
      // Kab filter
      if (selectedKabupaten !== 'all' && p.kabupatenKode !== selectedKabupaten) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'zero' && p.status !== 'zero') return false;
        if (statusFilter === 'critical' && p.status !== 'critical') return false;
        if (statusFilter === 'warning' && p.status !== 'warning') return false;
        if (statusFilter === 'on_track' && p.status !== 'on_track' && p.status !== 'ahead') return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesPencacah = p.pencacah.toLowerCase().includes(q);
        const matchesKab = p.kabupatenNama.toLowerCase().includes(q);
        const matchesPengawas = (p.pengawas || '').toLowerCase().includes(q);
        const matchesSls = p.slsList?.some((sls) => sls.toLowerCase().includes(q));
        if (!matchesPencacah && !matchesKab && !matchesPengawas && !matchesSls) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedKabupaten, statusFilter, search]);

  // Sort
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'persenCapaian' ? 'asc' : 'desc');
    }
  };

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
    const kabName = selectedKabupaten === 'all' 
      ? 'Semua-Wilayah' 
      : (kabupatenList.find((k) => k.kode === selectedKabupaten)?.nama || selectedKabupaten).replace(/\s+/g, '-');
    return `Monitoring Petugas PES SE2026 - ${kabName} - ${dd}${mm}${yy}_${hour}${minute}`;
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg' = 'png') => {
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
      showToast(`Gambar tabel (${format.toUpperCase()}) berhasil diunduh!`);
    } catch (err) {
      console.error('Gagal mengunduh gambar tabel:', err);
      showToast('Gagal mengunduh gambar tabel. Silakan coba lagi.');
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
      console.error('Gagal menyalin gambar tabel:', err);
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
      console.error('Gagal memuat pratinjau tabel:', err);
      showToast('Gagal memuat pratinjau gambar tabel.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openPreview: handleOpenPreview,
    downloadImage: handleDownloadImage,
    copyImage: handleCopyImage,
  }));

  const idealPct = Math.min(100, (currentDay / fieldDays) * 100);

  const activeKabupatenName = useMemo(() => {
    if (selectedKabupaten === 'all') return 'Semua Wilayah (Provinsi Kalimantan Barat)';
    const found = kabupatenList.find((k) => k.kode === selectedKabupaten);
    return found ? `${found.nama} (${found.kode})` : selectedKabupaten;
  }, [selectedKabupaten, kabupatenList]);

  const activeStatusName = useMemo(() => {
    switch (statusFilter) {
      case 'zero': return 'Nol Progres (0%)';
      case 'critical': return 'Kritis (<70%)';
      case 'warning': return 'Waspada (70–99%)';
      case 'on_track': return 'Sesuai Target (≥100%)';
      default: return 'Semua Status';
    }
  }, [statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      zero: sortedRecords.filter((p) => p.status === 'zero').length,
      critical: sortedRecords.filter((p) => p.status === 'critical').length,
      warning: sortedRecords.filter((p) => p.status === 'warning').length,
      onTrack: sortedRecords.filter((p) => p.status === 'on_track' || p.status === 'ahead').length,
      totalAssigned: sortedRecords.reduce((sum, p) => sum + p.assigned, 0),
      totalRealisasi: sortedRecords.reduce((sum, p) => sum + (includeDraft ? p.realisasi : p.dicacah), 0),
      totalTargetKumulatif: sortedRecords.reduce((sum, p) => sum + p.targetKumulatif, 0),
    };
  }, [sortedRecords, includeDraft]);

  const exportTimestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusBadge = (status: WarningStatus) => {
    switch (status) {
      case 'zero':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Nol Progres (0%)
          </span>
        );
      case 'critical':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Kritis (&lt;70%)
          </span>
        );
      case 'warning':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Waspada (70–99%)
          </span>
        );
      case 'ahead':
        return (
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Melampaui Target
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Sesuai Target
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} id="petugas-table-section" className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6 shadow-2xs scroll-mt-20 relative">
      
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
                {selectedKabupaten !== 'all' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#005596] text-white shadow-xs">
                    {activeKabupatenName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi Kinerja & Target Harian Petugas Pencacah Lapangan (PPL) • Target Lapangan: 1 s.d. {fieldDays} Nov • Pembersihan s.d. {totalDays} Nov 2026
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
            {fileName && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                Sumber Data: <span className="font-semibold text-slate-700">{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scope and Mini KPI Breakdown Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span>Wilayah: <strong className="text-slate-900">{activeKabupatenName}</strong></span>
            <span>•</span>
            <span>Filter Status: <strong className="text-slate-900">{activeStatusName}</strong></span>
            <span>•</span>
            <span>Total Evaluasi: <strong className="text-blue-900">{sortedRecords.length} Petugas</strong></span>
            <span>•</span>
            <span>Alokasi: <strong className="text-slate-900">{statusCounts.totalAssigned}</strong></span>
            <span>•</span>
            <span>Realisasi: <strong className="text-emerald-700">{statusCounts.totalRealisasi}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            {statusCounts.critical > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                Kritis: {statusCounts.critical}
              </span>
            )}
            {statusCounts.warning > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                Waspada: {statusCounts.warning}
              </span>
            )}
            {statusCounts.onTrack > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Sesuai/Lebih: {statusCounts.onTrack}
              </span>
            )}
            {statusCounts.zero > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-medium">
                Nol Progres: {statusCounts.zero}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Header & Search Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 export-exclude">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Pemantauan Petugas Pencacah Lapangan (PPL)
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Evaluasi target harian ({sortedRecords.length} Petugas) berdasarkan tenggat waktu {fieldDays} November 2026.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari petugas, email, SLS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white w-52 sm:w-64"
              />
            </div>

            {/* Filter Kab/Kota */}
            <select
              value={selectedKabupaten}
              onChange={(e) => onSelectKabupaten(e.target.value)}
              className="text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="all">Semua Wilayah</option>
              {kabupatenList.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.nama} ({k.kode})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="zero">Nol Progres (0%)</option>
              <option value="critical">Kritis (&lt;70%)</option>
              <option value="warning">Waspada (70–99%)</option>
              <option value="on_track">Sesuai Target (≥100%)</option>
            </select>

            {/* Tombol Ekspor Gambar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                title="Ekspor tabel pemantauan petugas ini menjadi gambar (PNG/JPG)"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#005596]" />
                ) : (
                  <Camera className="w-4 h-4 text-slate-600" />
                )}
                <span>{isExporting ? 'Memproses...' : 'Ekspor Gambar'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-fade-in">
                  <div className="px-3 py-1 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Format Ekspor Tabel
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
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold select-none text-xs uppercase tracking-wider">
              <th className="py-3 px-3.5 w-12 text-center">No</th>
              
              <th 
                onClick={() => handleSort('pencacah')}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Petugas & Wilayah Penugasan
              </th>

              <th 
                onClick={() => handleSort('assigned')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                title="Total beban sampel yang dialokasikan kepada petugas"
              >
                Alokasi
              </th>

              <th 
                className="py-3 px-3 text-right"
                title={`Target kumulatif ideal s.d. hari ke-${currentDay} berbasis periode ${fieldDays} hari lapangan`}
              >
                Target H-{currentDay}/{fieldDays}
              </th>

              <th 
                onClick={() => handleSort(includeDraft ? 'realisasi' : 'dicacah')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                title={includeDraft ? "Total realisasi selesai dicacah (Submit + Approve + Complete) ditambah Draft tersimpan" : "Kuesioner yang selesai dicacah (Submit + Approve + Complete)"}
              >
                <div className="inline-flex items-center justify-end gap-1 w-full">
                  <span>Realisasi</span>
                  {includeDraft && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1 py-0.2 rounded border border-blue-200">
                      +Draft
                    </span>
                  )}
                </div>
              </th>

              <th 
                onClick={() => handleSort('persenCapaian')}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                title="Persentase capaian terhadap target kumulatif harian s.d. hari ini"
              >
                Capaian Target Kumulatif Harian
              </th>

              <th 
                onClick={() => handleSort('gap')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                title="Deviasi sampel (Realisasi dikurangi Target Kumulatif)"
              >
                Gap (+/-)
              </th>

              <th 
                onClick={() => handleSort('runRateRequired')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors text-right"
                title="Beban kuesioner per hari yang harus dicapai agar selesai pada 23 November 2026"
              >
                Beban Sisa
              </th>

              <th className="py-3 px-3.5 text-center">Status</th>
              <th className="py-3 px-3 text-center w-20 export-exclude">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                  Tidak ada data petugas yang cocok dengan kriteria filter.
                </td>
              </tr>
            ) : (
              sortedRecords.map((p, idx) => {
                const isExpanded = expandedId === p.id;

                return (
                  <React.Fragment key={p.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${p.status === 'zero' ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-3.5 text-center text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Petugas & Wilayah */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            className="mt-0.5 p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer export-exclude"
                            title="Tampilkan rincian SLS"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <span className="font-semibold text-slate-900 block text-sm">
                              {p.pencacah}
                            </span>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="font-medium text-slate-700">{p.kabupatenNama}</span>
                              {p.pengawas && p.pengawas !== '-' && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>PML: {p.pengawas}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Alokasi */}
                      <td className="py-3 px-3 text-right text-sm">
                        <span className="font-semibold text-slate-800 block">{p.assigned}</span>
                        {p.kontrolKeluarga !== undefined && p.kontrolKeluarga > 0 && (
                          <span className="text-[11px] text-blue-600 font-medium block" title="Data Kontrol Keluarga dari Hasil Sensus Ekonomi 2026">
                            SE: {p.kontrolKeluarga}
                          </span>
                        )}
                      </td>

                      {/* Target Harian */}
                      <td className="py-3 px-3 text-right text-slate-700 text-sm">
                        <span className="font-semibold text-slate-900">{p.targetKumulatif}</span>
                        <span className="text-xs text-slate-400 block">({p.targetHarian}/hr)</span>
                      </td>

                      {/* Realisasi Dicacah / Total */}
                      <td className="py-3 px-3 text-right text-sm">
                        {includeDraft ? (
                          <>
                            <span className="font-bold text-slate-900 block">{p.realisasi}</span>
                            {p.draft > 0 ? (
                              <span className="text-[11px] text-blue-700 font-medium block" title="Gabungan data dicacah dan draft">
                                ({p.dicacah} + {p.draft} draft)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-normal block">
                                (0 draft)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-900 block">{p.dicacah}</span>
                            {p.draft > 0 && (
                              <span className="text-xs text-amber-700 font-medium block" title="Draft tersimpan di perangkat lokal (belum dihitung ke realisasi)">
                                +{p.draft} draft
                              </span>
                            )}
                          </>
                        )}
                        {p.coverageKeluargaSE !== undefined && p.coverageKeluargaSE > 0 && (
                          <span className="text-[11px] text-emerald-600 font-medium block" title="Persentase cakupan terhadap baseline keluarga hasil SE">
                            {p.coverageKeluargaSE}% SE
                          </span>
                        )}
                      </td>

                      {/* Capaian dari Target Kumulatif Harian & Progres Pendataan */}
                      <td className="py-3 px-3.5">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800">{p.persenCapaian}%</span>
                            <span className="text-slate-500 font-medium text-[11px]" title="Progres Pendataan terhadap total alokasi">
                              {p.persenTotal}% data
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.status === 'ahead' || p.status === 'on_track'
                                  ? 'bg-emerald-600'
                                  : p.status === 'warning'
                                  ? 'bg-amber-600'
                                  : 'bg-rose-600'
                              }`}
                              style={{ width: `${Math.min(100, p.persenCapaian)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Gap */}
                      <td className="py-3 px-3 text-right text-sm">
                        <span
                          className={`font-semibold ${
                            p.gap >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {p.gap >= 0 ? `+${p.gap}` : p.gap}
                        </span>
                      </td>

                      {/* Beban Sisa */}
                      <td className="py-3 px-3 text-right text-sm">
                        <span className="font-semibold text-slate-800">{p.runRateRequired}</span>
                        <span className="text-xs text-slate-400 block">/hari</span>
                      </td>

                      {/* Status Warning */}
                      <td className="py-3 px-3.5 text-center">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center export-exclude">
                        <button
                          onClick={() => onSendPetugasAlert(p)}
                          className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title={`Kirim pesan pengingat WA untuk ${p.pencacah}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail SLS */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={10} className="py-3.5 px-8 text-sm text-slate-600 border-b border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-bold text-slate-800 block mb-1.5 text-sm">
                                Rincian SLS Penugasan ({p.slsList?.length || 0} SLS):
                              </span>
                              {p.slsList && p.slsList.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                                  {p.slsList.map((sls, sIdx) => (
                                    <li key={sIdx}>{sls}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400 italic text-sm">Data SLS belum termetakan</span>
                              )}
                            </div>

                            <div>
                              <span className="font-bold text-slate-800 block mb-1.5 text-sm">
                                Rincian Status Dokumen di Fasih:
                              </span>
                              <div className="grid grid-cols-3 gap-2.5 text-sm text-slate-700">
                                <div className="p-2 bg-white rounded border border-slate-200">Open: <strong className="text-slate-900">{p.open}</strong></div>
                                <div className="p-2 bg-white rounded border border-slate-200">Draft: <strong className="text-slate-900">{p.draft}</strong></div>
                                <div className="p-2 bg-white rounded border border-slate-200">Submit: <strong className="text-slate-900">{p.submit}</strong></div>
                                <div className="p-2 bg-white rounded border border-slate-200">Approve: <strong className="text-slate-900">{p.approve}</strong></div>
                                <div className="p-2 bg-white rounded border border-slate-200">Complete: <strong className="text-slate-900">{p.complete}</strong></div>
                                <div className="p-2 bg-white rounded border border-slate-200">Diolah: <strong className="text-slate-900">{p.diolah}</strong></div>
                              </div>

                              {/* Benchmark Kontrol SE */}
                              {p.kontrolKeluarga !== undefined && p.kontrolKeluarga > 0 && (
                                <div className="mt-3 p-2.5 bg-blue-50/70 rounded-lg border border-blue-200/80 text-xs">
                                  <span className="font-bold text-blue-900 block mb-1">
                                    Benchmark Kontrol Sensus Ekonomi (SE2026):
                                  </span>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
                                    <span>Total Assignment: <strong className="text-blue-950">{p.kontrolKeluarga}</strong></span>
                                    <span>
                                      Realisasi {includeDraft ? 'Total' : 'Dicacah'}:{' '}
                                      <strong className="text-emerald-700">{includeDraft ? p.realisasi : p.dicacah}</strong>
                                      {includeDraft && p.draft > 0 && (
                                        <span className="text-slate-500 font-normal ml-1">({p.dicacah} + {p.draft} draft)</span>
                                      )}
                                    </span>
                                    <span>Coverage SE: <strong className="text-blue-900">{p.coverageKeluargaSE}%</strong></span>
                                    <span>
                                      Deviasi Beban:{' '}
                                      <strong className={p.gapKontrolKeluarga && p.gapKontrolKeluarga > 0 ? 'text-amber-700' : 'text-slate-800'}>
                                        {p.gapKontrolKeluarga !== undefined && p.gapKontrolKeluarga > 0 ? `+${p.gapKontrolKeluarga}` : p.gapKontrolKeluarga}
                                      </strong>
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Export-Only Official Infographic Footer Watermark */}
      <div className="hidden export-only mt-5 pt-3 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Badan Pusat Statistik Provinsi Kalimantan Barat</span>
            <span>•</span>
            <span>Sistem Monitoring Lapangan PES SE2026</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Format: Tabel Pemantauan Petugas (PPL) • Diekspor pada: {exportTimestamp} WIB • Terintegrasi Fasih BPS RI
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
        title="Pratinjau Tabel Monitoring Petugas (PPL)"
        subtitle={`Posisi Hari ke-${currentDay} • Wilayah: ${activeKabupatenName} (${sortedRecords.length} Petugas)`}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in border border-slate-800 export-exclude">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
});

PetugasTable.displayName = 'PetugasTable';
