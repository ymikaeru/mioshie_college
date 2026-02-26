import os
import json
from bs4 import BeautifulSoup

DATA_DIR = './Data'
ORIGINAL_HTML_DIR = './OrigianlHTML'
PT_HTML_DIR = './Data/translated_indexes'

VOLUMES = [
    {'id': 'shumeic1', 'file': 'shumeic1_data_bilingual.json'},
    {'id': 'shumeic2', 'file': 'shumeic2_data_bilingual.json'},
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'},
    {'id': 'shumeic4', 'file': 'shumeic4_data_bilingual.json'}
]

def load_titles_from_html(vol_id, base_dir):
    """Parses the HTML index for a specific volume and returns a dict mapping filename -> title"""
    idx_filename = 'index2.html' if vol_id == 'shumeic1' else 'index.html'
    idx_path = os.path.join(base_dir, vol_id, idx_filename)
    titles = {}
    
    if not os.path.exists(idx_path):
        print(f"Warning: Index not found at {idx_path}")
        return titles

    try:
        with open(idx_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(idx_path, 'r', encoding='shift_jis', errors='ignore') as f:
            html = f.read()
            
    soup = BeautifulSoup(html, 'html.parser')
    for a in soup.find_all('a'):
        href = a.get('href')
        if href and href.endswith('.html') and not href.startswith('http') and 'index' not in href:
            filename = href.split('/')[-1]
            title = a.text.replace('・', '').strip()
            titles[filename] = title
            
    return titles

def sync_titles_to_json():
    total_updated = 0
    
    for vol in VOLUMES:
        vol_id = vol['id']
        json_file = vol['file']
        json_path = os.path.join(DATA_DIR, json_file)
        
        if not os.path.exists(json_path):
            continue

        ja_titles = load_titles_from_html(vol_id, ORIGINAL_HTML_DIR)
        pt_titles = load_titles_from_html(vol_id, PT_HTML_DIR)
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        updated_count = 0
        
        for theme in data.get('themes', []):
            for topic in theme.get('topics', []):
                filename = topic.get('source_file') or topic.get('filename', '')
                if '/' in filename:
                    filename = filename.split('/')[-1]
                
                if not filename:
                    continue
                
                changed = False
                if filename in ja_titles:
                    official_ja = ja_titles[filename]
                    if topic.get('title') != official_ja:
                        topic['title'] = official_ja
                        changed = True
                        
                if filename in pt_titles:
                    official_pt = pt_titles[filename]
                    if topic.get('title_ptbr') != official_pt:
                        topic['title_ptbr'] = official_pt
                        changed = True
                        
                if changed:
                    updated_count += 1
                        
        if updated_count > 0:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {updated_count} titles in {json_file}")
            total_updated += updated_count
        else:
            print(f"No titles needed updating in {json_file}")
            
    print(f"\\nTotal topics updated across all JSON files: {total_updated}")

if __name__ == '__main__':
    sync_titles_to_json()

