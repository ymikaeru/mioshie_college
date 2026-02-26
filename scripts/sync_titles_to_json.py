import os
import json
from bs4 import BeautifulSoup

DATA_DIR = './Data'
TRANSLATED_INDEXES_DIR = os.path.join(DATA_DIR, 'translated_indexes')

VOLUMES = [
    {'id': 'shumeic1', 'file': 'shumeic1_data_bilingual.json'},
    {'id': 'shumeic2', 'file': 'shumeic2_data_bilingual.json'},
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'},
    {'id': 'shumeic4', 'file': 'shumeic4_data_bilingual.json'}
]

def load_translated_titles_from_html(vol_id):
    """Parses the HTML index for a specific volume and returns a dict mapping filename -> pt_title"""
    idx_path = os.path.join(TRANSLATED_INDEXES_DIR, vol_id, 'index.html')
    pt_titles = {}
    
    if not os.path.exists(idx_path):
        print(f"Warning: Index not found at {idx_path}")
        return pt_titles

    try:
        with open(idx_path, 'r', encoding='shift_jis') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(idx_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
            
    soup = BeautifulSoup(html, 'html.parser')
    for a in soup.find_all('a'):
        href = a.get('href')
        if href and href.endswith('.html') and not href.startswith('http') and 'index' not in href:
            filename = href.split('/')[-1]
            title_pt = a.text.replace('・', '').strip()
            pt_titles[filename] = title_pt
            
    return pt_titles

def sync_titles_to_json():
    total_updated = 0
    
    for vol in VOLUMES:
        vol_id = vol['id']
        json_file = vol['file']
        json_path = os.path.join(DATA_DIR, json_file)
        
        if not os.path.exists(json_path):
            print(f"JSON file not found for {vol_id}: {json_path}")
            continue

        pt_titles = load_translated_titles_from_html(vol_id)
        if not pt_titles:
            continue
            
        print(f"Loaded {len(pt_titles)} reference titles from {vol_id} HTML.")

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
                    
                if filename in pt_titles:
                    official_pt_title = pt_titles[filename]
                    
                    # Store existing titles for comparison
                    existing_ptbr = topic.get('title_ptbr', '')
                    existing_pt = topic.get('title_pt', '')
                    
                    if existing_ptbr != official_pt_title:
                        topic['title_ptbr'] = official_pt_title
                        # Optional: Sync title_pt as well to prevent any fallback issues
                        topic['title_pt'] = official_pt_title
                        updated_count += 1
                        
        if updated_count > 0:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {updated_count} titles in {json_file}")
            total_updated += updated_count
        else:
            print(f"No titles needed updating in {json_file}")
            
    print(f"\nTotal topics updated across all JSON files: {total_updated}")

if __name__ == '__main__':
    sync_titles_to_json()
