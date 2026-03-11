import json
import os
import re
from bs4 import BeautifulSoup

DATA_DIR = 'Data'
volumes = ['shumeic1_data_bilingual.json', 'shumeic2_data_bilingual.json', 'shumeic3_data_bilingual.json', 'shumeic4_data_bilingual.json']

def get_text(html):
    if not html: return ""
    soup = BeautifulSoup(html, "html.parser")
    for s in soup(['script', 'style']):
        s.decompose()
    return soup.get_text(separator=" ", strip=True)

findings = []

for vol_file in volumes:
    path = os.path.join(DATA_DIR, vol_file)
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for theme_idx, theme in enumerate(data.get('themes', [])):
        for topic_idx, topic in enumerate(theme.get('topics', [])):
            title_pt = topic.get('title_ptbr') or topic.get('title_pt') or topic.get('title')
            content_pt_html = topic.get('content_ptbr') or topic.get('content_pt') or ''
            content_ja_html = topic.get('content_ja') or topic.get('content') or ''
            
            if not content_pt_html or not content_ja_html:
                continue
                
            pt_text = get_text(content_pt_html)
            ja_text = get_text(content_ja_html)
            
            ends_with_ellipsis = pt_text.endswith('...') or pt_text.endswith('…')
            
            len_pt = len(pt_text)
            len_ja = len(ja_text)
            
            # Often Japanese translations to Portuguese result in PT having more characters than JA.
            # So if PT has significantly fewer characters than JA, it's very suspicious.
            if len_ja < 50:
                continue
                
            ratio = len_pt / len_ja if len_ja > 0 else 0
            
            # If PT is less than 50% of JA length, or ends with ... and is shorter than JA
            is_suspicious = False
            if pt_text == ja_text:
                continue # Untranslated
            
            if ratio < 0.5:
                is_suspicious = True
            elif ends_with_ellipsis and ratio < 1.0:
                is_suspicious = True
                
            if is_suspicious:
                file_name = topic.get('source_file') or topic.get('filename') or f"Theme{theme_idx}-Topic{topic_idx}"
                findings.append({
                    'volume': vol_file,
                    'file': file_name,
                    'title': title_pt,
                    'len_pt': len_pt,
                    'len_ja': len_ja,
                    'ratio': ratio,
                    'ends_with_ellipsis': ends_with_ellipsis,
                    'pt_snippet': pt_text[-80:] # last 80 chars
                })

print(f"Found {len(findings)} suspicious translations.")
for f in findings:
    print(f"Vol: {f['volume']} | File: {f['file']} | Title: {f['title']}")
    print(f"  Ratio: {f['ratio']:.2f} (PT: {f['len_pt']} chars, JA: {f['len_ja']} chars) | Ends with ... : {f['ends_with_ellipsis']}")
    print(f"  Ending: {f['pt_snippet']}")
    print("-" * 60)
