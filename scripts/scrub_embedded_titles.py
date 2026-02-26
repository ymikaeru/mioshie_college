import json, os, re

DATA_DIR = './Data'
VOLUMES = [
    'shumeic1_data_bilingual.json',
    'shumeic2_data_bilingual.json',
    'shumeic3_data_bilingual.json',
    'shumeic4_data_bilingual.json'
]

def scrub_html(html):
    if not html: return html
    
    # Volume 3 pattern: <font color="#0000ff" face="メイリオ" size="+2">...</font><br/></p>
    html = re.sub(r'<font color="#0000ff"[^>]*>.*?<font color="#0000ff"[^>]*>.*?</font>.*?</font>.*?<br/?>\s*</p>', '', html, flags=re.IGNORECASE | re.DOTALL)
    
    # Volume 1 pattern: <b><font size="+2">...</font></b> (Publicado em ...)
    html = re.sub(r'<b>\s*<font[^>]*>.*?</font>\s*</b>\s*\(Publicado em[^)]+\)', '', html, flags=re.IGNORECASE | re.DOTALL)
    
    return html.strip()

total_updates = 0
for vol in VOLUMES:
    path = os.path.join(DATA_DIR, vol)
    if not os.path.exists(path): continue
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    updated = 0
    for theme in data.get('themes', []):
        for topic in theme.get('topics', []):
            ptbr = topic.get('content_ptbr', '')
            if ptbr:
                scrubbed = scrub_html(ptbr)
                if scrubbed != ptbr:
                    topic['content_ptbr'] = scrubbed
                    updated += 1
                    
    if updated > 0:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[{vol}] Scrubbed {updated} embedded titles.")
        total_updates += updated
    else:
        print(f"[{vol}] No embedded titles found/scrubbed.")
        
print(f"\nTotal topics scrubbed: {total_updates}")
