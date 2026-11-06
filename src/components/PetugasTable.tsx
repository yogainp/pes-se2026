import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { PetugasAnalysis, WarningStatus } from '../types';

interface PetugasTableProps {
  records: PetugasAnalysis[];
  selectedKabupaten: string;
  onSelectKabupaten: (kab: string) => void;
  kabupatenList: { kode: string; nama: string }[];
  currentDay: number;
  fieldDays?: number;
  totalDays: number;
  includeDraft?: boolean;
  onSendPetugasAlert: (petugas: PetugasAnalysis) => void;
}

type SortField = 'persenCapaian' | 'assigned' | 'realisasi' | 'dicacah' | 'gap' | 'runRateRequired' | 'pencacah';
type SortDirection = 'asc' | 'desc';

export const PetugasTable: React.FC<PetugasTableProps> = ({
  records,
  selectedKabupaten,
  onSelectKabupaten,
  kabupatenList,
  currentDay,
  fieldDays = 23,
  includeDraft = false,
  onSendPetugasAlert,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6 shadow-2xs">
      
      {/* Table Header & Search Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
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
                title="Persentase pemenuhan terhadap target kumulatif hari ini"
              >
                Capaian Target
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
              <th className="py-3 px-3 text-center w-20">Aksi</th>
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
                            className="mt-0.5 p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
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

                      {/* Capaian Target */}
                      <td className="py-3 px-3.5">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800">{p.persenCapaian}%</span>
                            <span className="text-slate-400 text-xs">
                              {p.persenTotal}% tot
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
                      <td className="py-3 px-3 text-center">
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

    </div>
  );
};
