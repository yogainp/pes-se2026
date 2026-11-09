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

kabupaten_list = ['PONTIANAK', 'SAMBAS', 'BENGKAYANG', 'SANGGAU', 'KETAPANG', 'SINTANG', 'KAYONG UTARA', 'SINGKAWANG']

current_kab = None
current_pml = None
pml_data = {}

i = 0
while i < len(paragraphs):
    p = paragraphs[i]
    p_upper = p.upper()

    # Check if kabupaten heading
    if any(p_upper == k for k in kabupaten_list):
        current_kab = p_upper
        i += 1
        continue
    
    # Check if email
    if '@' in p:
        current_pml = p.lower()
        if current_pml not in pml_data:
            pml_data[current_pml] = {'kab': current_kab, 'sls': []}
        i += 1
        continue

    # Skip 'Wilayah Penugasan' or 'Level ...'
    if 'wilayah penugasan' in p.lower() or p.lower().startswith('level'):
        i += 1
        continue

    # Format 1: Text containing (16-digit code) e.g. "RT 16 RW 003 DUSUN PELAIK (6105070003000800)"
    match = re.search(r'\((\d{16})\)', p)
    if match and current_pml:
        code = match.group(1)
        name = p[:match.start()].strip()
        pml_data[current_pml]['sls'].append({'name': name, 'code': code})
        i += 1
        continue

    # Format 2: Next line is 16-digit code
    if i + 1 < len(paragraphs) and paragraphs[i+1].isdigit() and len(paragraphs[i+1]) == 16:
        name = p
        code = paragraphs[i+1]
        if current_pml:
            pml_data[current_pml]['sls'].append({'name': name, 'code': code})
        i += 2
        continue

    # Format 3: Current line is 16-digit code directly
    if p.isdigit() and len(p) == 16:
        code = p
        name = paragraphs[i-1] if (i > 0 and not paragraphs[i-1].lower().startswith('level') and '@' not in paragraphs[i-1]) else ''
        if current_pml:
            if not any(s['code'] == code for s in pml_data[current_pml]['sls']):
                pml_data[current_pml]['sls'].append({'name': name, 'code': code})
        i += 1
        continue

    i += 1

allocations = []
for pml_email, data in pml_data.items():
    for s in data['sls']:
        m = master_map.get(s['code'])
        allocations.append({
            'email': pml_email,
            'kabupaten': data['kab'],
            'slsCode': s['code'],
            'slsName': m['namaSls'] if m else s['name'],
            'isMaster': bool(m)
        })

output_data = {
    'updatedAt': datetime.now().isoformat(),
    'sourceFile': 'alokasi.docx',
    'totalAllocations': len(allocations),
    'masterAllocations': len([a for a in allocations if a['isMaster']]),
    'allocations': allocations
}

output_path = 'data_awal/alokasi_pengawas_manual.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

valid_count = len([a for a in allocations if a['isMaster']])
print(f"Berhasil mengekstrak {len(allocations)} entri alokasi ke {output_path}")
print(f"Total SLS Sampel Master tervalidasi: {valid_count} / {len(master)} ({(valid_count/len(master))*100:.1f}%)")
