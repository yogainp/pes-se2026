import * as XLSX from 'xlsx';
import { PetugasRecord } from '../types';

export interface ParseResult {
  success: boolean;
  records: PetugasRecord[];
  timestamp: string;
  fileName: string;
  detectedDay?: number;
  error?: string;
}

export async function parseFasihExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          resolve({
            success: false,
            records: [],
            timestamp: new Date().toLocaleString('id-ID'),
            fileName: file.name,
            error: 'File Excel kosong atau tidak terbaca.',
          });
          return;
        }

        // Helper to find column value by case-insensitive key
        const getVal = (row: any, ...keys: string[]) => {
          for (const k of Object.keys(row)) {
            const cleanK = k.trim().toLowerCase();
            for (const target of keys) {
              if (cleanK === target.toLowerCase()) {
                return row[k];
              }
            }
          }
          return undefined;
        };

        const records: PetugasRecord[] = [];

        jsonRows.forEach((row, idx) => {
          const pencacah = String(getVal(row, 'pencacah', 'email', 'nama pencacah') || '').trim();
          // Skip empty or header-like rows or "-"
          if (!pencacah || pencacah === '-' || pencacah.toLowerCase() === 'total') {
            return;
          }

          const kab = String(getVal(row, 'kabupaten', 'kab/kota', 'nama kabupaten') || '').trim();
          const kabParts = kab.split(' - ');
          const kabKode = kabParts.length > 1 ? kabParts[0].trim() : '';
          const kabNama = kabParts.length > 1 ? kabParts[1].trim() : kab;

          records.push({
            id: `PPL-${idx}-${pencacah}`,
            provinsi: String(getVal(row, 'provinsi') || '61 - KALIMANTAN BARAT').trim(),
            kabupaten: kab,
            kabupatenKode: kabKode,
            kabupatenNama: kabNama,
            pencacah,
            pengawas: '-', // default, can be enriched
            assigned: Number(getVal(row, 'assigned', 'target', 'alokasi')) || 0,
            open: Number(getVal(row, 'open')) || 0,
            draft: Number(getVal(row, 'draft')) || 0,
            dicacah: Number(getVal(row, 'dicacah')) || 0,
            submit: Number(getVal(row, 'submit', 'submitted')) || 0,
            approve: Number(getVal(row, 'approve', 'approved')) || 0,
            complete: Number(getVal(row, 'complete', 'completed')) || 0,
            edit: Number(getVal(row, 'edit', 'edited')) || 0,
            revoke: Number(getVal(row, 'revoke', 'revoked')) || 0,
            reject: Number(getVal(row, 'reject', 'rejected')) || 0,
            diolah: Number(getVal(row, 'diolah')) || 0,
          });
        });

        if (records.length === 0) {
          resolve({
            success: false,
            records: [],
            timestamp: new Date().toLocaleString('id-ID'),
            fileName: file.name,
            error: 'Tidak ditemukan kolom petugas pencacah yang valid (PENCACAH, ASSIGNED, DICACAH). Pastikan format unduhan berasal dari Fasih Dashboard.',
          });
          return;
        }

        // Try to detect day of month from filename (e.g. 20261105_084008.xlsx -> day 5)
        let detectedDay: number | undefined;
        const match = file.name.match(/202611(\d{2})/);
        if (match && match[1]) {
          const dayNum = parseInt(match[1], 10);
          if (dayNum >= 1 && dayNum <= 30) {
            detectedDay = dayNum;
          }
        }

        resolve({
          success: true,
          records,
          timestamp: new Date().toLocaleString('id-ID'),
          fileName: file.name,
          detectedDay,
        });
      } catch (err: any) {
        resolve({
          success: false,
          records: [],
          timestamp: new Date().toLocaleString('id-ID'),
          fileName: file.name,
          error: err?.message || 'Gagal membaca format file Excel.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        records: [],
        timestamp: new Date().toLocaleString('id-ID'),
        fileName: file.name,
        error: 'Terjadi kesalahan saat membaca file.',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
