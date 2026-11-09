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
        // Exclude temp files and master files
        if (item.endsWith('.xlsx') && !item.startsWith('~$') && !item.includes('master_kontrol')) {
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
    throw new Error('Tidak ditemukan file progres Fasih .xlsx di folder data/ atau data_awal/.');
  }

  // Sort descending by filename (YYYYMMDD_HHMMSS ensures newest timestamp is first)
  files.sort((a, b) => b.name.localeCompare(a.name));
  return files[0];
}

function loadSeMaster() {
  const seMasterPath = path.join(rootDir, 'data_awal', 'master_kontrol_se.json');
  if (!fs.existsSync(seMasterPath)) {
    console.warn('⚠️ File master_kontrol_se.json tidak ditemukan.');
    return { slsById: new Map(), slsByName: new Map(), allSls: [] };
  }

  const list = JSON.parse(fs.readFileSync(seMasterPath, 'utf-8'));
  const slsById = new Map();
  const slsByName = new Map();

  list.forEach((s) => {
    const cleanId = String(s.idSls16 || '').replace(/\s+/g, '').trim();
    const cleanName = String(s.namaSls || '').trim().toUpperCase();
    slsById.set(cleanId, s);
    if (cleanName) {
      slsByName.set(cleanName, s);
    }
  });

  return { slsById, slsByName, allSls: list };
}

function loadCsvMapping() {
  const pencacahSlsMap = new Map(); // email -> Set<slsName>
  const pencacahSlsCodeMap = new Map(); // email -> Set<slsCode>
  const slsToPplMap = new Map(); // slsName (uppercase) / slsCode -> email
  const slsPengawasMap = new Map(); // slsName/slsCode -> pengawasEmail
  const pencacahPengawasMap = new Map(); // email -> Set<pengawas>
  const pencacahKabMap = new Map(); // email -> { kabKode, kabNama, kabupaten }

  // Look for CSVs in data directories
  for (const dir of dataDirs) {
    if (!fs.existsSync(dir)) continue;
    const items = fs.readdirSync(dir);

    // 1. Pencacah CSV (pilih file terbaru berdasarkan nama file/timestamp)
    const pencacahFiles = items.filter((f) => f.includes('pencacah') && f.endsWith('.csv')).sort().reverse();
    if (pencacahFiles.length > 0) {
      const pencacahFile = pencacahFiles[0];
      const content = fs.readFileSync(path.join(dir, pencacahFile), 'utf-8');
      const lines = content.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 5) {
          const email = parts[1]?.trim().toLowerCase();
          const regionCode = parts[3]?.trim();
          const regionName = parts.slice(4).join(',').trim();
          if (email && regionName && regionName !== '-') {
            if (!pencacahSlsMap.has(email)) pencacahSlsMap.set(email, new Set());
            if (!pencacahSlsCodeMap.has(email)) pencacahSlsCodeMap.set(email, new Set());
            pencacahSlsMap.get(email).add(regionName);
            slsToPplMap.set(regionName.toUpperCase(), email);
            if (regionCode && regionCode.length === 16) {
              pencacahSlsCodeMap.get(email).add(regionCode);
              slsToPplMap.set(regionCode, email);
            }
          }
        }
      }
    }

    // 2. Pengawas CSV (pilih file terbaru berdasarkan nama file/timestamp)
    const pengawasFiles = items.filter((f) => f.includes('pengawas') && f.endsWith('.csv')).sort().reverse();
    if (pengawasFiles.length > 0) {
      const pengawasFile = pengawasFiles[0];
      const content = fs.readFileSync(path.join(dir, pengawasFile), 'utf-8');
      const lines = content.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 5) {
          const pengawasEmail = parts[1]?.trim().toLowerCase();
          const regionCode = parts[3]?.trim();
          const regionName = parts.slice(4).join(',').trim();
          if (pengawasEmail && regionName && regionName !== '-') {
            slsPengawasMap.set(regionName.toUpperCase(), pengawasEmail);
          }
          if (pengawasEmail && regionCode && regionCode.length === 16) {
            slsPengawasMap.set(regionCode, pengawasEmail);
          }
        }
      }
    }
  }

  // 3. Muat Alokasi Pengawas Manual (misal dari alokasi.docx / alokasi_pengawas_manual.json)
  const manualPmlPath = path.join(rootDir, 'data_awal', 'alokasi_pengawas_manual.json');
  if (fs.existsSync(manualPmlPath)) {
    try {
      const manualPml = JSON.parse(fs.readFileSync(manualPmlPath, 'utf-8'));
      if (Array.isArray(manualPml.allocations)) {
        manualPml.allocations.forEach((a) => {
          if (a.isMaster && a.slsCode && a.email) {
            slsPengawasMap.set(a.slsCode, a.email);
            if (a.slsName) {
              slsPengawasMap.set(a.slsName.toUpperCase(), a.email);
            }
          }
        });
        console.log(`📑 Memuat ${manualPml.allocations.length} alokasi manual PML dari: ${path.basename(manualPmlPath)}`);
      }
    } catch (e) {
      console.warn('⚠️ Gagal memuat alokasi pengawas manual:', e.message);
    }
  }

  // Khusus penyesuaian SLS Wonosobo Sintang (di file mapping berupa '-' pada akun mangkok5000@gmail.com)
  const wonosoboName = 'RT 006 RW 002 DUSUN WONOSOBO';
  const wonosoboCode = '6107130005000600';
  slsToPplMap.set(wonosoboName, 'mangkok5000@gmail.com');
  slsToPplMap.set(wonosoboCode, 'mangkok5000@gmail.com');
  if (pencacahSlsMap.has('mangkok5000@gmail.com')) {
    pencacahSlsMap.get('mangkok5000@gmail.com').add(wonosoboName);
  }
  if (pencacahSlsCodeMap.has('mangkok5000@gmail.com')) {
    pencacahSlsCodeMap.get('mangkok5000@gmail.com').add(wonosoboCode);
  }

  // Penyesuaian SLS Kapuas Kanan Hulu Sintang (RT 006 RW 002 kode 6107140006000602 di akun rezafauzan639@gmail.com)
  const kapuasKananCode = '6107140006000602';
  slsToPplMap.set(kapuasKananCode, 'rezafauzan639@gmail.com');
  if (pencacahSlsMap.has('rezafauzan639@gmail.com')) {
    pencacahSlsMap.get('rezafauzan639@gmail.com').add('RT 006 RW 002');
  }
  if (pencacahSlsCodeMap.has('rezafauzan639@gmail.com')) {
    pencacahSlsCodeMap.get('rezafauzan639@gmail.com').add(kapuasKananCode);
  }

  // Cross map pencacah -> pengawas via SLS nama & kode
  pencacahSlsMap.forEach((slsSet, pencacahEmail) => {
    const pengawasSet = new Set();
    slsSet.forEach((sls) => {
      const pml = slsPengawasMap.get(sls.toUpperCase());
      if (pml) pengawasSet.add(pml);
    });
    const codeSet = pencacahSlsCodeMap.get(pencacahEmail);
    if (codeSet) {
      codeSet.forEach((code) => {
        const pml = slsPengawasMap.get(code);
        if (pml) pengawasSet.add(pml);
      });
    }
    if (pengawasSet.size > 0) {
      pencacahPengawasMap.set(pencacahEmail, Array.from(pengawasSet));
    }
  });

  return { pencacahSlsMap, slsToPplMap, pencacahPengawasMap, slsPengawasMap };
}

function getVal(row, ...keys) {
  for (const k of Object.keys(row)) {
    const cleanK = k.trim().toLowerCase();
    for (const target of keys) {
      if (cleanK === target.toLowerCase()) {
        return row[k];
      }
    }
  }
  return undefined;
}

function sync() {
  console.log('🔄 Memulai sinkronisasi data Fasih PES SE2026...');

  const latestExcel = findLatestExcelFile();
  console.log(`📂 Membaca file Excel: ${latestExcel.name} (${latestExcel.path})`);

  const { pencacahSlsMap, slsToPplMap, pencacahPengawasMap, slsPengawasMap } = loadCsvMapping();
  console.log(`👥 Metadata petugas: ${pencacahSlsMap.size} pencacah termetakan dengan SLS.`);

  const { slsById, slsByName, allSls } = loadSeMaster();
  console.log(`📊 Master Kontrol SE: ${allSls.length} SLS sampel siap diintegrasikan.`);

  const workbook = XLSX.readFile(latestExcel.path);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (jsonRows.length === 0) {
    throw new Error('File Excel kosong atau tidak memiliki data.');
  }

  // Deteksi Format File Excel Fasih:
  // Format A: Level SSLS (ada kolom SSLS dan Status Assignment, misal 20261106_100438.xlsx)
  // Format B: Level Pencacah (ada kolom PENCACAH/email, misal 20261105_084008.xlsx)
  const isSlsFormat = jsonRows.some((r) => getVal(r, 'ssls', 'status assignment') !== undefined);

  const records = [];

  if (isSlsFormat) {
    console.log('📐 Mendeteksi Format: Level Satuan Lingkungan Setempat (SSLS). Melakukan pivot dan integrasi kontrol SE...');

    // Inisialisasi agregat untuk semua PPL yang ada di mapping
    const pplAgg = new Map();

    pencacahSlsMap.forEach((slsSet, email) => {
      pplAgg.set(email, {
        pencacah: email,
        provinsi: '61 - KALIMANTAN BARAT',
        kabupaten: '',
        kabupatenKode: '',
        kabupatenNama: '',
        assigned: 0,
        open: 0,
        draft: 0,
        dicacah: 0,
        submit: 0,
        approve: 0,
        complete: 0,
        edit: 0,
        revoke: 0,
        reject: 0,
        diolah: 0,
        kontrolKeluarga: 0,
        kontrolUsaha: 0,
        keluargaAktifSE: 0,
        slsProcessed: new Set(),
      });
    });

    jsonRows.forEach((row) => {
      const rawSls = String(getVal(row, 'ssls') || '').replace(/\s+/g, '').trim();
      const status = String(getVal(row, 'status assignment', 'status') || '').toUpperCase().trim();
      const count = Number(getVal(row, 'jumlah assignment', 'jumlah', 'assigned') || 0);
      const kab = String(getVal(row, 'kabupaten', 'kab/kota') || '').trim();

      const slsInfo = slsById.get(rawSls);
      const slsName = slsInfo ? slsInfo.namaSls.trim().toUpperCase() : '';
      const pplEmail = (slsToPplMap.get(rawSls) || slsToPplMap.get(slsName) || '').toLowerCase();

      if (!pplEmail) {
        return; // Lewati jika tidak teridentifikasi
      }

      if (!pplAgg.has(pplEmail)) {
        pplAgg.set(pplEmail, {
          pencacah: pplEmail,
          provinsi: '61 - KALIMANTAN BARAT',
          kabupaten: kab,
          kabupatenKode: '',
          kabupatenNama: '',
          assigned: 0,
          open: 0,
          draft: 0,
          dicacah: 0,
          submit: 0,
          approve: 0,
          complete: 0,
          edit: 0,
          revoke: 0,
          reject: 0,
          diolah: 0,
          kontrolKeluarga: 0,
          kontrolUsaha: 0,
          keluargaAktifSE: 0,
          slsProcessed: new Set(),
        });
      }

      const p = pplAgg.get(pplEmail);
      if (kab && (!p.kabupaten || p.kabupaten === '-')) {
        p.kabupaten = kab;
      }

      p.assigned += count;

      if (status.includes('OPEN')) p.open += count;
      else if (status.includes('DRAFT')) p.draft += count;
      else if (status.includes('SUBMIT')) p.submit += count;
      else if (status.includes('APPROVE')) p.approve += count;
      else if (status.includes('COMPLETE')) p.complete += count;
      else if (status.includes('REJECT')) p.reject += count;
      else if (status.includes('EDIT')) p.edit += count;
      else if (status.includes('REVOKE')) p.revoke += count;

      // Akumulasikan data kontrol SE sekali saja per ID SLS unik
      if (slsInfo && !p.slsProcessed.has(slsInfo.idSls16)) {
        p.slsProcessed.add(slsInfo.idSls16);
        p.kontrolKeluarga += slsInfo.kontrolKeluarga;
        p.kontrolUsaha += slsInfo.kontrolUsaha;
        p.keluargaAktifSE += slsInfo.keluargaAktifSE;
      }
    });

    let idx = 0;
    pplAgg.forEach((item, email) => {
      // Lengkapi data wilayah jika belum ada dari file
      if (!item.kabupaten && item.slsProcessed.size > 0) {
        const firstSlsId = Array.from(item.slsProcessed)[0];
        const sInfo = slsById.get(firstSlsId);
        if (sInfo) {
          item.kabupaten = `${sInfo.kdKab} - ${sInfo.kabupaten}`;
        }
      }

      const kabParts = item.kabupaten.split(' - ');
      const kabKode = kabParts.length > 1 ? kabParts[0].trim() : '';
      const kabNama = kabParts.length > 1 ? kabParts[1].trim() : item.kabupaten;

      const pengawasArr = pencacahPengawasMap.get(email) || [];
      const pengawas = pengawasArr.length > 0 ? pengawasArr[0] : '-';
      const slsList = pencacahSlsMap.has(email) ? Array.from(pencacahSlsMap.get(email)) : [];

      // Standar Fasih: Dicacah = Submit + Approve + Complete
      item.dicacah = item.submit + item.approve + item.complete;
      item.diolah = item.complete;

      const gapKontrolKeluarga = item.assigned - item.kontrolKeluarga;
      const coverageKeluargaSE = item.kontrolKeluarga > 0
        ? Number(((item.dicacah / item.kontrolKeluarga) * 100).toFixed(1))
        : 0;

      records.push({
        id: `PPL-${idx++}`,
        provinsi: item.provinsi,
        kabupaten: item.kabupaten || '6100 - KALIMANTAN BARAT',
        kabupatenKode: kabKode,
        kabupatenNama: kabNama,
        pencacah: email,
        pengawas,
        semuaPengawas: pengawasArr,
        slsList,
        assigned: item.assigned,
        open: item.open,
        draft: item.draft,
        dicacah: item.dicacah,
        submit: item.submit,
        approve: item.approve,
        complete: item.complete,
        edit: item.edit,
        revoke: item.revoke,
        reject: item.reject,
        diolah: item.diolah,
        kontrolKeluarga: item.kontrolKeluarga,
        kontrolUsaha: item.kontrolUsaha,
        keluargaAktifSE: item.keluargaAktifSE,
        gapKontrolKeluarga,
        coverageKeluargaSE,
      });
    });

  } else {
    console.log('📐 Mendeteksi Format: Level Petugas (Pencacah). Memproses dan mengawinkan dengan kontrol SE...');

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

      // Hitung Kontrol SE dari daftar SLS yang dipegang PPL
      let kontrolKeluarga = 0;
      let kontrolUsaha = 0;
      let keluargaAktifSE = 0;

      slsList.forEach((slsName) => {
        const sInfo = slsByName.get(slsName.trim().toUpperCase());
        if (sInfo) {
          kontrolKeluarga += sInfo.kontrolKeluarga;
          kontrolUsaha += sInfo.kontrolUsaha;
          keluargaAktifSE += sInfo.keluargaAktifSE;
        }
      });

      const assigned = Number(getVal(row, 'assigned', 'target', 'alokasi')) || 0;
      const dicacah = Number(getVal(row, 'dicacah')) || 0;
      const gapKontrolKeluarga = assigned - kontrolKeluarga;
      const coverageKeluargaSE = kontrolKeluarga > 0
        ? Number(((dicacah / kontrolKeluarga) * 100).toFixed(1))
        : 0;

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
        assigned,
        open: Number(getVal(row, 'open')) || 0,
        draft: Number(getVal(row, 'draft')) || 0,
        dicacah,
        submit: Number(getVal(row, 'submit', 'submitted')) || 0,
        approve: Number(getVal(row, 'approve', 'approved')) || 0,
        complete: Number(getVal(row, 'complete', 'completed')) || 0,
        edit: Number(getVal(row, 'edit', 'edited')) || 0,
        revoke: Number(getVal(row, 'revoke', 'revoked')) || 0,
        reject: Number(getVal(row, 'reject', 'rejected')) || 0,
        diolah: Number(getVal(row, 'diolah')) || 0,
        kontrolKeluarga,
        kontrolUsaha,
        keluargaAktifSE,
        gapKontrolKeluarga,
        coverageKeluargaSE,
      });
    });
  }

  // Detect day from filename (misal 20261106_100438.xlsx -> day 6)
  let defaultDay = 6;
  const match = latestExcel.name.match(/202611(\d{2})/);
  if (match && match[1]) {
    const d = parseInt(match[1], 10);
    if (d >= 1 && d <= 30) {
      defaultDay = d;
    }
  }

  // Format timestamp (misal 2026-11-06 10:04:38)
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
  console.log(`📅 Parameter: Hari ke-${defaultDay} | File: ${latestExcel.name}`);
  const totalAssigned = records.reduce((s, r) => s + r.assigned, 0);
  const totalDicacah = records.reduce((s, r) => s + r.dicacah, 0);
  const totalKontrol = records.reduce((s, r) => s + (r.kontrolKeluarga || 0), 0);
  console.log(`📈 Ringkasan: Assigned=${totalAssigned} | Dicacah=${totalDicacah} | Kontrol Keluarga SE=${totalKontrol}`);
}

sync();
