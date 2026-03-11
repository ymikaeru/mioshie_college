import json
import os
import shutil
import re
from bs4 import BeautifulSoup, Comment
import time

CACHE_BUSTER = int(time.time())

# Configuration
DATA_DIR = './Data'
OUTPUT_DIR = 'SiteModerno'
DATA_OUTPUT_DIR = 'site_data'
ORIGINAL_HTML_DIR = './Data/translated_indexes'
INDEX_FILES = [
    ('shumeic1/index.html', '../', 'shumeic1'),
    ('shumeic1/index2.html', '../', 'shumeic1'),
    ('shumeic2/index.html', '../', 'shumeic2'),
    ('shumeic3/index.html', '../', 'shumeic3'),
    ('shumeic4/index.html', '../', 'shumeic4'),
    ('shumeic4/index2.html', '../', 'shumeic4'),]
# Track index titles parsed from the original HTML indexes to use them in the reader and search
GLOBAL_INDEX_TITLES = {
    'shumeic1': {},
    'shumeic2': {},
    'shumeic3': {},
    'shumeic4': {}
}

VOLUMES = [
    {'id': 'shumeic1', 'file': 'shumeic1_data_bilingual.json'},
    {'id': 'shumeic2', 'file': 'shumeic2_data_bilingual.json'},
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'},
    {'id': 'shumeic4', 'file': 'shumeic4_data_bilingual.json'}
]


def create_dirs():
    """Create necessary directories."""
    # List of directories we manage for DATA ONLY
    managed_dirs = [DATA_OUTPUT_DIR]
    
    for d in managed_dirs:
        dir_path = os.path.join(OUTPUT_DIR, d)
        # We don't rmtree anymore to avoid accidental loss, just ensure it exists
        os.makedirs(dir_path, exist_ok=True)
    
    # Assets subdirs
    os.makedirs(f"{OUTPUT_DIR}/assets/images", exist_ok=True)


def collect_index_titles():
    """Parses original HTML indexes just to collect titles for the search index and reader."""
    for rel_path, level_path, vol_id in INDEX_FILES:
        src = os.path.join(ORIGINAL_HTML_DIR, rel_path)
        if not os.path.exists(src): continue
            
        with open(src, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
        main_content = soup.find('body')
        if not main_content: continue

        for child in main_content.find_all('a'):
            href = child.get('href', '')
            if not href or 'index' in href or href.startswith('http') or href.startswith('#'):
                continue
            
            filename = href.split('/')[-1]
            title_pt = child.get_text().replace('・', '').strip()
            # Collapse spaces
            title_pt = re.sub(r'\s+', ' ', title_pt).strip()

            if filename and title_pt:
                if vol_id not in GLOBAL_INDEX_TITLES:
                    GLOBAL_INDEX_TITLES[vol_id] = {}
                GLOBAL_INDEX_TITLES[vol_id][filename] = title_pt


def copy_assets():
    """Finds and copies all image assets from OrigianlHTML to the modern site."""
    print("Copying image assets...")
    count = 0
    extensions = ('.jpg', '.png', '.gif', '.jpeg', '.GIF', '.JPG', '.PNG')
    for root, dirs, files in os.walk('./OrigianlHTML'):
        for file in files:
            if file.endswith(extensions):
                src = os.path.join(root, file)
                dest = os.path.join(OUTPUT_DIR, 'assets/images', file)
                # Avoid overwriting if same filename exists (original structure might have duplicates)
                if not os.path.exists(dest):
                    shutil.copy2(src, dest)
                    count += 1
    print(f"Copied {count} new image assets to assets/images/")

def build_search_index():
    """Generates a minimized JSON search index from all translation data."""
    print("Building global search index...")
    
    # Write the GLOBAL_INDEX_TITLES to a dedicated JS file
    os.makedirs(os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR), exist_ok=True)
    global_titles_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'global_index_titles.js')
    injection = f"window.GLOBAL_INDEX_TITLES = {json.dumps(GLOBAL_INDEX_TITLES, ensure_ascii=False)};\nwindow.DATA_OUTPUT_DIR = '{DATA_OUTPUT_DIR}';\n"
    with open(global_titles_path, 'w', encoding='utf-8') as f:
        f.write(injection)

    search_data = []
    
    for vol in VOLUMES:
        vol_id = vol['id']
        src = os.path.join(DATA_DIR, vol['file'])
        if not os.path.exists(src): continue
        
        with open(src, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                continue
                
        for theme in data.get('themes', []):
            for topic in theme.get('topics', []):
                # Prefer PT title/content, fallback to original
                title = topic.get('title_ptbr') or topic.get('title_pt') or topic.get('title', '')
                content_raw = topic.get('content_ptbr') or topic.get('content_pt') or topic.get('content', '')
                
                # Japanese fields
                title_ja = topic.get('title_ja') or ''
                content_ja_raw = topic.get('content_ja') or topic.get('content', '')
                
                # Strip HTML from content for a clean search index
                soup = BeautifulSoup(content_raw, "html.parser")
                # Remove script and style elements
                for s in soup(['script', 'style']):
                    s.decompose()
                clean_text = soup.get_text(separator=" ", strip=True)
                # Collapse all whitespace and newlines to single space
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                
                # Strip HTML from Japanese content
                soup_ja = BeautifulSoup(content_ja_raw, "html.parser")
                for s in soup_ja(['script', 'style']):
                    s.decompose()
                clean_text_ja = soup_ja.get_text(separator=" ", strip=True)
                clean_text_ja = re.sub(r'\s+', ' ', clean_text_ja).strip()
                
                # Only store JA content if it's actually Japanese (not just a copy of PT)
                if clean_text_ja == clean_text:
                    clean_text_ja = ''
                
                if clean_text:
                    src_file = topic.get('source_file') or topic.get('filename') or ''
                    filename = os.path.basename(src_file) if src_file else ''
                    index_title = GLOBAL_INDEX_TITLES.get(vol_id, {}).get(filename, '')
                    
                    entry = {
                        'v': vol_id,
                        'f': filename,
                        't': (index_title if index_title else title).strip(),
                        'c': clean_text
                    }
                    # Only add Japanese fields if they have unique content (saves file size)
                    if title_ja and title_ja.strip() != entry['t']:
                        entry['tj'] = title_ja.strip()
                    if clean_text_ja:
                        entry['cj'] = clean_text_ja
                    
                    search_data.append(entry)
                    
    index_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'search_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        # Saving without indentation to save space
        json.dump(search_data, f, ensure_ascii=False, separators=(',', ':'))
    
    size_mb = os.path.getsize(index_path) / (1024 * 1024)
    print(f"Search index generated at {index_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_dirs()
    # Copy data
    for vol in VOLUMES:
        src = os.path.join(DATA_DIR, vol['file'])
        if os.path.exists(src):
            shutil.copy2(src, f"{OUTPUT_DIR}/{DATA_OUTPUT_DIR}/{vol['file']}")
    copy_assets()
    collect_index_titles()
    build_search_index()
    print("Modern Site Data generated in " + OUTPUT_DIR)
