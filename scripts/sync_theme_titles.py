import json, os, re
from bs4 import BeautifulSoup, Comment

DATA_DIR = './Data'
def clean_text(text):
    text = text.replace('\xa0', ' ')
    text = text.replace('　', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

for vol_id in ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']:
    idx_path = os.path.join(DATA_DIR, 'translated_indexes', vol_id, 'index.html')
    if not os.path.exists(idx_path): continue
        
    try:
        with open(idx_path, 'r', encoding='shift_jis') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(idx_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
            
    soup = BeautifulSoup(html, 'html.parser')
    
    pt_headers = []
    def traverse(element):
        for child in element.children:
            if child.name in ['script'] or isinstance(child, Comment): continue
            
            if child.name == 'a': continue
            
            if child.name in ['font', 'p', 'div', 'blockquote', 'b', 'strong', 'h1', 'h2', 'h3']:
                text = clean_text(child.get_text())
                if not child.find('a') and text:
                    skip_list = ["editada por membros", "Operado por um indivíduo", "Coletânea de Ensinamentos", "por membros da Shinji Shumeikai", "Mestre Mokichi Okada", "Seção da Fé"]
                    if any(x in text for x in skip_list): continue
                    
                    title_clean = text.replace("Curso por Correspondência", "").strip()
                    if title_clean == "Outros": continue
                    
                    is_thematic = ('・' in title_clean or ' • ' in title_clean) and len(title_clean) > 20
                    if is_thematic: continue
                    
                    if len(title_clean) < 50:
                        pt_headers.append(re.sub(r'^Volume\s+\d+[:\-]?\s*', '', title_clean, flags=re.IGNORECASE))
                else:
                    traverse(child)
            elif isinstance(child, str):
                text = clean_text(child)
                if text and len(text) > 1 and len(text) < 50 and text != "Outros":
                    is_thematic = ('・' in text or ' • ' in text) and len(text) > 20
                    if not is_thematic:
                        pt_headers.append(re.sub(r'^Volume\s+\d+[:\-]?\s*', '', text, flags=re.IGNORECASE))
    
    body = soup.find('body')
    if body: traverse(body)
    
    # remove duplicates and empty, preserving order
    pt_headers = list(dict.fromkeys([h for h in pt_headers if h]))
    
    # Load JSON
    json_path = os.path.join(DATA_DIR, f"{vol_id}_data_bilingual.json")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    themes = data.get('themes', [])
    updated = False
    
    # Volume 3 HTML has 9 headers, but JSON has 9 themes. 
    # Mappings are sequential!
    if len(pt_headers) == len(themes):
        for i, theme in enumerate(themes):
            off_title = pt_headers[i]
            if theme.get('theme_title_pt') != off_title:
                theme['theme_title_pt'] = off_title
                updated = True
                print(f"[{vol_id}] Updated Theme {i+1}: -> {off_title}")
    else:
        print(f"[{vol_id}] Cannot sync automatically: {len(pt_headers)} HTML Headers vs {len(themes)} JSON Themes.")
        
    if updated:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

