import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, 
  AlertOctagon, AlertTriangle, CheckCircle, Sparkles, MessageCircle, 
  MapPin, UserCheck 
} from 'lucide-react';
import { PetugasAnalysis, WarningStatus } from '../types';

interface PetugasTableProps {
  records: PetugasAnalysis[];
  selectedKabupaten: string;
  onSelectKabupaten: (kab: string) => void;
  kabupatenList: { kode: string; nama: string }[];
  currentDay: number;
  totalDays: number;
  onSendPetugasAlert: (petugas: PetugasAnalysis) => void;
}

type SortField = 'persenCapaian' | 'assigned' | 'dicacah' | 'gap' | 'runRateRequired' | 'pencacah';
type SortDirection = 'asc' | 'desc';

export const PetugasTable: React.FC<PetugasTableProps> = ({
  records,
  selectedKabupaten,
  onSelectKabupaten,
  kabupatenList,
  currentDay,
  totalDays,
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
      // For percentages and run rates, default to ascending (prioritize worst first)
      setSortDirection(field === 'persenCapaian' ? 'asc' : 'desc');
    }
  };

  const getStatusBadge = (status: WarningStatus) => {
    switch (status) {
      case 'zero':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            0% Belum Ada Progres
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Kritis (&lt;70%)
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Waspada (70-99%)
          </span>
        );
      case 'ahead':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            Melampaui Target
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Sesuai Target
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monitoring Detail Petugas Lapangan ({sortedRecords.length} Petugas)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kepatuhan target harian petugas (Hari ke-{currentDay} dari {totalDays} Hari), identifikasi kendala lapangan, dan kirim pesan japri.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari email, kab, atau SLS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white w-48 sm:w-60"
              />
            </div>

            {/* Filter Kab/Kota */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedKabupaten}
                onChange={(e) => onSelectKabupaten(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="all">Semua Kab/Kota</option>
                {kabupatenList.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.nama} ({k.kode})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="zero">🚨 0% Belum Bergerak</option>
              <option value="critical">🔴 Kritis (&lt;70%)</option>
              <option value="warning">🟡 Waspada (70-99%)</option>
              <option value="on_track">🟢 On Track (≥100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-4 w-12 text-center">No</th>
              
              <th 
                onClick={() => handleSort('pencacah')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Petugas & Wilayah</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('assigned')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Target Total</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3 text-right">
                Target Harian (H-{currentDay})
              </th>

              <th 
                onClick={() => handleSort('dicacah')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Realisasi Dicacah</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('persenCapaian')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Capaian Target</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('gap')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Gap (+/-)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('runRateRequired')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Beban Sisa</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-4 text-center">Status Warning</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Tidak ada data petugas yang cocok dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              sortedRecords.map((p, idx) => {
                const isExpanded = expandedId === p.id;
                const isCriticalRow = p.status === 'zero' || p.status === 'critical';

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        p.status === 'zero' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Petugas & Wilayah */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            className="mt-0.5 p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Tampilkan detail SLS tugas"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div>
                            <span className="font-semibold text-slate-900 block font-mono text-xs">
                              {p.pencacah}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-medium text-slate-700">{p.kabupatenNama}</span>
                              {p.pengawas && p.pengawas !== '-' && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-slate-500">
                                    <UserCheck className="w-3 h-3 text-slate-400" />
                                    PML: {p.pengawas}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Total */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">
                        {p.assigned}
                      </td>

                      {/* Target Harian (Kumulatif) */}
                      <td className="py-3 px-3 text-right text-slate-600">
                        <span className="font-medium text-slate-900">{p.targetKumulatif}</span>
                        <span className="text-[10px] text-slate-400 block">({p.targetHarian}/hr)</span>
                      </td>

                      {/* Realisasi Dicacah */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-slate-900">{p.dicacah}</span>
                        {p.draft > 0 && (
                          <span className="text-[10px] text-amber-600 block">+{p.draft} draft</span>
                        )}
                      </td>

                      {/* Capaian Target */}
                      <td className="py-3 px-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-800">{p.persenCapaian}%</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.persenTotal}% tot
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.status === 'ahead' || p.status === 'on_track'
                                  ? 'bg-emerald-500'
                                  : p.status === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, p.persenCapaian)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Gap */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            p.gap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {p.gap >= 0 ? `+${p.gap}` : p.gap}
                        </span>
                      </td>

                      {/* Beban Sisa */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-indigo-700">{p.runRateRequired}</span>
                        <span className="text-[10px] text-slate-400 block">/hari</span>
                      </td>

                      {/* Status Warning */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Aksi Japri WA */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSendPetugasAlert(p)}
                          className={`p-1.5 rounded-lg border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            isCriticalRow
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                          title={`Kirim pesan pengingat WA ke ${p.pencacah}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable row: SLS List */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={10} className="py-3 px-6 text-xs text-slate-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-800">Wilayah SLS Penugasan:</strong>
                              {p.slsList && p.slsList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {p.slsList.map((sls, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px]"
                                    >
                                      {sls}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 italic text-[11px] mt-0.5">
                                  Informasi SLS tidak tertera di data ekspor.
                                </p>
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
