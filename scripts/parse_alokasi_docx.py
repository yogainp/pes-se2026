import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re
from datetime import datetime

with open('data_awal/master_kontrol_se.json', 'r', encoding='utf-8') as f:
    master = json.load(f)

master_map = {str(m['idSls16']).strip(): m for m in master}

docx_path = 'data_awal/alokasi.docx'
if not os.path.exists(docx_path):
    print(f"File {docx_path} tidak ditemukan.")
    exit(1)

with zipfile.ZipFile(docx_path, 'r') as z:
    xml_content = z.read('word/document.xml')
    root = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = [ ''.join([node.text for node in p.findall('.//w:t', ns) if node.text]).strip() for p in root.findall('.//w:p', ns) ]
    paragraphs = [p for p in paragraphs if p]

# Split into PML paragraphs and PPL paragraphs
pml_paragraphs = []
ppl_paragraphs = []
is_ppl_section = False

for p in paragraphs:
    if 'alokasi ppl' in p.lower():
        is_ppl_section = True
        continue
    if is_ppl_section:
        ppl_paragraphs.append(p)
    else:
        pml_paragraphs.append(p)

print(f"Total paragraphs: {len(paragraphs)}")
print(f"PML section paragraphs: {len(pml_paragraphs)}")
print(f"PPL section paragraphs: {len(ppl_paragraphs)}")

kabupaten_list = ['PONTIANAK', 'SAMBAS', 'BENGKAYANG', 'SANGGAU', 'KETAPANG', 'SINTANG', 'KAYONG UTARA', 'SINGKAWANG']

def parse_section(p_list, is_pml=True):
    current_kab = None
    current_email = None
    data = {}
    i = 0
    while i < len(p_list):
        p = p_list[i]
        p_upper = p.upper()

        if any(p_upper == k for k in kabupaten_list):
            current_kab = p_upper
            i += 1
            continue
        
        if '@' in p:
            current_email = p.lower()
            if current_email not in data:
                data[current_email] = {'kab': current_kab, 'sls': []}
            i += 1
            continue

        if 'wilayah penugasan' in p.lower() or p.lower().startswith('level') or p.lower() == 'pencacah':
            i += 1
            continue

        # Format 1: Text containing (16-digit code)
        match = re.search(r'\((\d{16})\)', p)
        if match and current_email:
            code = match.group(1)
            name = p[:match.start()].strip()
            data[current_email]['sls'].append({'name': name, 'code': code})
            i += 1
            continue

        # Format 2: Next line is 16-digit code
        if i + 1 < len(p_list) and p_list[i+1].isdigit() and len(p_list[i+1]) == 16:
            name = p
            code = p_list[i+1]
            if current_email:
                data[current_email]['sls'].append({'name': name, 'code': code})
            i += 2
            continue

        # Format 3: Current line is 16-digit code
        if p.isdigit() and len(p) == 16:
            code = p
            name = p_list[i-1] if (i > 0 and not p_list[i-1].lower().startswith('level') and '@' not in p_list[i-1]) else ''
            if current_email:
                if not any(s['code'] == code for s in data[current_email]['sls']):
                    data[current_email]['sls'].append({'name': name, 'code': code})
            i += 1
            continue

        i += 1
    return data

pml_parsed = parse_section(pml_paragraphs, is_pml=True)
ppl_parsed = parse_section(ppl_paragraphs, is_pml=False)

# 1. Output PML
pml_allocations = []
for email, d in pml_parsed.items():
    for s in d['sls']:
        m = master_map.get(s['code'])
        pml_allocations.append({
            'email': email,
            'kabupaten': d['kab'],
            'slsCode': s['code'],
            'slsName': m['namaSls'] if m else s['name'],
            'isMaster': bool(m)
        })

pml_output = {
    'updatedAt': datetime.now().isoformat(),
    'sourceFile': 'alokasi.docx',
    'totalAllocations': len(pml_allocations),
    'masterAllocations': len([a for a in pml_allocations if a['isMaster']]),
    'allocations': pml_allocations
}

with open('data_awal/alokasi_pengawas_manual.json', 'w', encoding='utf-8') as f:
    json.dump(pml_output, f, indent=2, ensure_ascii=False)

valid_pml = len([a for a in pml_allocations if a['isMaster']])
print(f"\n[PML] Berhasil mengekstrak {len(pml_allocations)} entri ke data_awal/alokasi_pengawas_manual.json")
print(f"[PML] Total SLS Sampel Master tervalidasi: {valid_pml} / {len(master)} ({(valid_pml/len(master))*100:.1f}%)")

# 2. Output PPL Sintang
ppl_allocations = []
for email, d in ppl_parsed.items():
    for s in d['sls']:
        m = master_map.get(s['code'])
        ppl_allocations.append({
            'email': email,
            'kabupaten': 'SINTANG',
            'slsCode': s['code'],
            'slsName': m['namaSls'] if m else s['name'],
            'isMaster': bool(m)
        })

ppl_output = {
    'updatedAt': datetime.now().isoformat(),
    'sourceFile': 'alokasi.docx',
    'totalAllocations': len(ppl_allocations),
    'masterAllocations': len([a for a in ppl_allocations if a['isMaster']]),
    'allocations': ppl_allocations
}

with open('data_awal/alokasi_pencacah_manual.json', 'w', encoding='utf-8') as f:
    json.dump(ppl_output, f, indent=2, ensure_ascii=False)

valid_ppl = len([a for a in ppl_allocations if a['isMaster']])
print(f"\n[PPL] Berhasil mengekstrak {len(ppl_allocations)} entri ke data_awal/alokasi_pencacah_manual.json")
print(f"[PPL] Total SLS Sampel Master tervalidasi: {valid_ppl}")

print("\n--- Detail Alokasi PPL Sintang dari Docx ---")
for email, d in ppl_parsed.items():
    valid = [s for s in d['sls'] if s['code'] in master_map]
    print(f"{email}: {len(valid)} SLS Master")
    for s in valid:
        m = master_map[s['code']]
        print(f"  - {s['code']} : {m['namaSls']}")
