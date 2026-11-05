import { useState, useMemo } from 'react';
import initialData from './data/initialData.json';
import { PetugasRecord, PetugasAnalysis, KabupatenSummary } from './types';
import { analyzePetugas, calculateKabupatenSummary, FIELD_TARGET_DAYS, TOTAL_MONTH_DAYS } from './utils/calculations';
import { exportAnalysisToExcel } from './utils/excelExporter';

import { Header } from './components/Header';
import { KpiOverview } from './components/KpiOverview';
import { KabupatenOverview } from './components/KabupatenOverview';
import { PetugasTable } from './components/PetugasTable';
import { MetadataSection } from './components/MetadataSection';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';

export default function App() {
  const records = initialData.records as PetugasRecord[];
  const fileName = initialData.fileName;
  const lastUpdated = initialData.timestamp;

  const fieldDays = initialData.fieldDays || FIELD_TARGET_DAYS;
  const totalDays = initialData.totalDays || TOTAL_MONTH_DAYS;

  const [currentDay, setCurrentDay] = useState<number>(() => {
    return initialData.defaultDay || 5;
  });

  const [includeDraft, setIncludeDraft] = useState<boolean>(false);
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('all');

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareKabupatenKode, setShareKabupatenKode] = useState<string>('all');
  const [sharePetugas, setSharePetugas] = useState<PetugasAnalysis | null>(null);

  // Analysis calculations
  const analyzedRecords: PetugasAnalysis[] = useMemo(() => {
    return analyzePetugas(records, currentDay, fieldDays, totalDays, includeDraft);
  }, [records, currentDay, fieldDays, totalDays, includeDraft]);

  const kabupatenSummaries: KabupatenSummary[] = useMemo(() => {
    return calculateKabupatenSummary(analyzedRecords);
  }, [analyzedRecords]);

  // Unique Kab List for filter dropdown
  const kabupatenList = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.kabupatenKode && r.kabupatenNama) {
        map.set(r.kabupatenKode, r.kabupatenNama);
      }
    });
    return Array.from(map.entries())
      .map(([kode, nama]) => ({ kode, nama }))
      .sort((a, b) => a.kode.localeCompare(b.kode));
  }, [records]);

  // Export Excel
  const handleExportExcel = () => {
    exportAnalysisToExcel(analyzedRecords, kabupatenSummaries, currentDay, fieldDays, totalDays);
  };

  // Open WA Modal for specific Kabupaten
  const handleShareKabupaten = (kab: KabupatenSummary) => {
    setShareKabupatenKode(kab.kode);
    setSharePetugas(null);
    setIsShareModalOpen(true);
  };

  // Open WA Modal for specific Petugas
  const handleSendPetugasAlert = (petugas: PetugasAnalysis) => {
    setSharePetugas(petugas);
    setShareKabupatenKode(petugas.kabupatenKode);
    setIsShareModalOpen(true);
  };

  // Open WA Modal from Header (Provinsi general)
  const handleOpenGeneralShare = () => {
    setShareKabupatenKode('all');
    setSharePetugas(null);
    setIsShareModalOpen(true);
  };

  const handleScrollToMetadata = () => {
    const el = document.getElementById('metadata-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Header */}
      <Header
        currentDay={currentDay}
        fieldDays={fieldDays}
        totalDays={totalDays}
        onDayChange={setCurrentDay}
        includeDraft={includeDraft}
        onIncludeDraftChange={setIncludeDraft}
        fileName={fileName}
        lastUpdated={lastUpdated}
        onOpenShareModal={handleOpenGeneralShare}
        onExportExcel={handleExportExcel}
        onScrollToMetadata={handleScrollToMetadata}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Overview Cards */}
        <KpiOverview
          analyzedRecords={analyzedRecords}
          currentDay={currentDay}
          fieldDays={fieldDays}
          totalDays={totalDays}
          includeDraft={includeDraft}
        />

        {/* Monitoring per Wilayah (8 Kabupaten/Kota) */}
        <KabupatenOverview
          summaries={kabupatenSummaries}
          selectedKabupaten={selectedKabupaten}
          onSelectKabupaten={setSelectedKabupaten}
          onShareKabupaten={handleShareKabupaten}
          currentDay={currentDay}
          fieldDays={fieldDays}
          totalDays={totalDays}
        />

        {/* Tabel Monitoring Detail Petugas (PPL) */}
        <PetugasTable
          records={analyzedRecords}
          selectedKabupaten={selectedKabupaten}
          onSelectKabupaten={setSelectedKabupaten}
          kabupatenList={kabupatenList}
          currentDay={currentDay}
          fieldDays={fieldDays}
          totalDays={totalDays}
          onSendPetugasAlert={handleSendPetugasAlert}
        />

        {/* Metadata Operasional & Catatan Teknis */}
        <MetadataSection />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-800">
            Sistem Monitoring Harian Lapangan • Post Enumeration Survey (PES) SE2026
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Badan Pusat Statistik Provinsi Kalimantan Barat • Terintegrasi dengan Fasih Dashboard BPS RI
          </p>
        </div>
      </footer>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        kabupatenSummaries={kabupatenSummaries}
        allPetugas={analyzedRecords}
        currentDay={currentDay}
        fieldDays={fieldDays}
        totalDays={totalDays}
        initialKabupaten={shareKabupatenKode}
        initialPetugas={sharePetugas}
      />

    </div>
  );
}
