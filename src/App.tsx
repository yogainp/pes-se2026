import { useState, useMemo } from 'react';
import initialData from './data/initialData.json';
import { PetugasRecord, PetugasAnalysis, KabupatenSummary } from './types';
import { analyzePetugas, calculateKabupatenSummary } from './utils/calculations';
import { exportAnalysisToExcel } from './utils/excelExporter';

import { Header } from './components/Header';
import { KpiOverview } from './components/KpiOverview';
import { KabupatenOverview } from './components/KabupatenOverview';
import { PetugasTable } from './components/PetugasTable';
import { UploadModal } from './components/UploadModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';

const LOCAL_STORAGE_KEY = 'pes_se2026_dashboard_custom_data';

export default function App() {
  const [records, setRecords] = useState<PetugasRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.records && Array.isArray(parsed.records)) {
          return parsed.records;
        }
      }
    } catch {
      // fallback
    }
    return initialData.records as PetugasRecord[];
  });

  const [fileName, setFileName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fileName) return parsed.fileName;
      }
    } catch {}
    return initialData.fileName;
  });

  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastUpdated) return parsed.lastUpdated;
      }
    } catch {}
    return initialData.timestamp;
  });

  const [isCustomData, setIsCustomData] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
  });

  const [currentDay, setCurrentDay] = useState<number>(() => {
    return initialData.defaultDay || 5;
  });

  const [totalDays] = useState<number>(30);
  const [includeDraft, setIncludeDraft] = useState<boolean>(false);
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('all');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareKabupatenKode, setShareKabupatenKode] = useState<string>('all');
  const [sharePetugas, setSharePetugas] = useState<PetugasAnalysis | null>(null);

  // Analysis calculations
  const analyzedRecords: PetugasAnalysis[] = useMemo(() => {
    return analyzePetugas(records, currentDay, totalDays, includeDraft);
  }, [records, currentDay, totalDays, includeDraft]);

  const kabupatenSummaries: KabupatenSummary[] = useMemo(() => {
    return calculateKabupatenSummary(analyzedRecords);
  }, [analyzedRecords]);

  // Unique Kab List for filter
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

  // Handle uploaded data
  const handleDataLoaded = (newRecords: PetugasRecord[], newFileName: string, detectedDay?: number) => {
    const updatedTime = new Date().toLocaleString('id-ID');
    setRecords(newRecords);
    setFileName(newFileName);
    setLastUpdated(updatedTime);
    setIsCustomData(true);
    if (detectedDay) {
      setCurrentDay(detectedDay);
    }

    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          records: newRecords,
          fileName: newFileName,
          lastUpdated: updatedTime,
        })
      );
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Reset to default
  const handleResetData = () => {
    if (window.confirm('Kembalikan data ke data baseline awal (20261105_084008.xlsx)?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setRecords(initialData.records as PetugasRecord[]);
      setFileName(initialData.fileName);
      setLastUpdated(initialData.timestamp);
      setIsCustomData(false);
      setCurrentDay(initialData.defaultDay || 5);
      setSelectedKabupaten('all');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    exportAnalysisToExcel(analyzedRecords, kabupatenSummaries, currentDay, totalDays);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Header */}
      <Header
        currentDay={currentDay}
        totalDays={totalDays}
        onDayChange={setCurrentDay}
        includeDraft={includeDraft}
        onIncludeDraftChange={setIncludeDraft}
        fileName={fileName}
        lastUpdated={lastUpdated}
        isCustomData={isCustomData}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenShareModal={handleOpenGeneralShare}
        onExportExcel={handleExportExcel}
        onResetData={handleResetData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Cards */}
        <KpiOverview
          analyzedRecords={analyzedRecords}
          currentDay={currentDay}
          totalDays={totalDays}
          includeDraft={includeDraft}
        />

        {/* Klasemen Kabupaten */}
        <KabupatenOverview
          summaries={kabupatenSummaries}
          selectedKabupaten={selectedKabupaten}
          onSelectKabupaten={setSelectedKabupaten}
          onShareKabupaten={handleShareKabupaten}
          currentDay={currentDay}
          totalDays={totalDays}
        />

        {/* Tabel Monitoring Detail Petugas */}
        <PetugasTable
          records={analyzedRecords}
          selectedKabupaten={selectedKabupaten}
          onSelectKabupaten={setSelectedKabupaten}
          kabupatenList={kabupatenList}
          currentDay={currentDay}
          totalDays={totalDays}
          onSendPetugasAlert={handleSendPetugasAlert}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Sistem Monitoring Harian Lapangan • Post Enumeration Survey (PES) SE2026
          </p>
          <p className="mt-1 text-slate-400">
            Badan Pusat Statistik Provinsi Kalimantan Barat • Dirancang untuk Vercel (100% Client-Side Processing Tanpa Database)
          </p>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoaded}
      />

      <WhatsAppShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        kabupatenSummaries={kabupatenSummaries}
        allPetugas={analyzedRecords}
        currentDay={currentDay}
        totalDays={totalDays}
        initialKabupaten={shareKabupatenKode}
        initialPetugas={sharePetugas}
      />

    </div>
  );
}
