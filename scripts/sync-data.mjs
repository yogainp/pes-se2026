import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Directories to look for Fasih data
const dataDirs = [
  path.join(rootDir, 'data'),
  path.join(rootDir, 'data_awal'),
];

function findLatestExcelFile() {
  const files = [];

  for (const dir of dataDirs) {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.endsWith('.xlsx') && !item.startsWith('~$')) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);
          files.push({
            path: fullPath,
            name: item,
            mtime: stats.mtime,
          });
        }
      }
    }
  }

  if (files.length === 0) {
    throw new Error('Tidak ditemukan file .xlsx di folder data/ atau data_awal/.');
  }

  // Sort descending by filename or modification time
  files.sort((a, b) => b.name.localeCompare(a.name));
  return files[0];
}

function loadCsvMapping() {
  const pencacahSlsMap = new Map(); // email -> Set<sls>
  const slsPengawasMap = new Map(); // slsCode/slsName -> pengawasEmail
  const pencacahPengawasMap = new Map(); // email -> Set<pengawas>

  // Look for CSVs in data directories
  for (const dir of dataDirs) {
    if (!fs.existsSync(dir)) continue;
    const items = fs.readdirSync(dir);

    // 1. Pencacah CSV
    const pencacahFile = items.find((f) => f.includes('pencacah') && f.endsWith('.csv'));
    if (pencacahFile) {
      const content = fs.readFileSync(path.join(dir, pencacahFile), 'utf-8');
      const lines = content.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 5) {
          const email = parts[1]?.trim().toLowerCase();
          const regionName = parts[4]?.trim();
          if (email && regionName && regionName !== '-') {
            if (!pencacahSlsMap.has(email)) pencacahSlsMap.set(email, new Set());
            pencacahSlsMap.get(email).add(regionName);
          }
        }
      }
    }

    // 2. Pengawas CSV
    const pengawasFile = items.find((f) => f.includes('pengawas') && f.endsWith('.csv'));
    if (pengawasFile) {
      const content = fs.readFileSync(path.join(dir, pengawasFile), 'utf-8');
      const lines = content.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 5) {
          const pengawasEmail = parts[1]?.trim().toLowerCase();
          const regionCode = parts[3]?.trim();
          const regionName = parts[4]?.trim();
          if (pengawasEmail && regionName && regionName !== '-') {
            slsPengawasMap.set(regionName, pengawasEmail);
          }
          if (pengawasEmail && regionCode) {
            slsPengawasMap.set(regionCode, pengawasEmail);
          }
        }
      }
    }
  }

  // Cross map pencacah -> pengawas via SLS
  pencacahSlsMap.forEach((slsSet, pencacahEmail) => {
    const pengawasSet = new Set();
    slsSet.forEach((sls) => {
      const pml = slsPengawasMap.get(sls);
      if (pml) pengawasSet.add(pml);
    });
    if (pengawasSet.size > 0) {
      pencacahPengawasMap.set(pencacahEmail, Array.from(pengawasSet));
    }
  });

  return { pencacahSlsMap, pencacahPengawasMap };
}

function sync() {
  console.log('🔄 Memulai sinkronisasi data Fasih PES SE2026...');

  const latestExcel = findLatestExcelFile();
  console.log(`📂 Membaca file Excel: ${latestExcel.name} (${latestExcel.path})`);

  const { pencacahSlsMap, pencacahPengawasMap } = loadCsvMapping();
  console.log(`👥 Metadata petugas: ${pencacahSlsMap.size} pencacah termetakan dengan SLS.`);

  const workbook = XLSX.readFile(latestExcel.path);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const getVal = (row, ...keys) => {
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

  const records = [];

  jsonRows.forEach((row, idx) => {
    const pencacah = String(getVal(row, 'pencacah', 'email', 'nama pencacah') || '').trim();
    if (!pencacah || pencacah === '-' || pencacah.toLowerCase() === 'total') {
      return;
    }

    const kab = String(getVal(row, 'kabupaten', 'kab/kota', 'nama kabupaten') || '').trim();
    const kabParts = kab.split(' - ');
    const kabKode = kabParts.length > 1 ? kabParts[0].trim() : '';
    const kabNama = kabParts.length > 1 ? kabParts[1].trim() : kab;

    const emailKey = pencacah.toLowerCase();
    const slsList = pencacahSlsMap.has(emailKey) ? Array.from(pencacahSlsMap.get(emailKey)) : [];
    const pengawasArr = pencacahPengawasMap.get(emailKey) || [];
    const pengawas = pengawasArr.length > 0 ? pengawasArr[0] : '-';

    records.push({
      id: `PPL-${idx}`,
      provinsi: String(getVal(row, 'provinsi') || '61 - KALIMANTAN BARAT').trim(),
      kabupaten: kab,
      kabupatenKode: kabKode,
      kabupatenNama: kabNama,
      pencacah,
      pengawas,
      semuaPengawas: pengawasArr,
      slsList,
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

  // Detect day from filename (e.g. 20261105_084008.xlsx -> day 5)
  let defaultDay = 5;
  const match = latestExcel.name.match(/202611(\d{2})/);
  if (match && match[1]) {
    const d = parseInt(match[1], 10);
    if (d >= 1 && d <= 30) {
      defaultDay = d;
    }
  }

  // Format timestamp (e.g. 2026-11-05 08:40:08)
  let timestampStr = new Date().toLocaleString('id-ID');
  const tsMatch = latestExcel.name.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (tsMatch) {
    timestampStr = `${tsMatch[1]}-${tsMatch[2]}-${tsMatch[3]} ${tsMatch[4]}:${tsMatch[5]}:${tsMatch[6]}`;
  }

  const outputData = {
    timestamp: timestampStr,
    fileName: latestExcel.name,
    defaultDay,
    fieldDays: 23, // Target penyelesaian pencacahan lapangan
    cleaningDays: 7, // Periode pembersihan & rekonsiliasi data
    totalDays: 30, // Total hari November
    totalPetugas: records.length,
    records,
  };

  const outputPath = path.join(rootDir, 'src', 'data', 'initialData.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`✅ Sukses menyinkronkan ${records.length} data petugas ke: ${outputPath}`);
  console.log(`📅 Parameter: Hari ke-${defaultDay} | Target Lapangan: 23 Hari | Cleaning: 7 Hari`);
}

sync();

