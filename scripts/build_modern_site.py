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

VOLUMES = ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']
SITE_DATA_DIR = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR)


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
    """Generates a minimized JSON search index from individual split topic files in site_data/.

    Reads directly from site_data/shumeicN/*.html.json (the same files the frontend uses),
    so edits to individual topic files are automatically reflected without needing the
    monolithic bilingual JSON files.
    """
    print("Building global search index from individual topic files...")

    # Write the GLOBAL_INDEX_TITLES to a dedicated JS file
    os.makedirs(os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR), exist_ok=True)
    global_titles_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'global_index_titles.js')
    injection = f"window.GLOBAL_INDEX_TITLES = {json.dumps(GLOBAL_INDEX_TITLES, ensure_ascii=False)};\nwindow.DATA_OUTPUT_DIR = '{DATA_OUTPUT_DIR}';\n"
    with open(global_titles_path, 'w', encoding='utf-8') as f:
        f.write(injection)

    search_data = []

    for vol_id in VOLUMES:
        vol_dir = os.path.join(SITE_DATA_DIR, vol_id)
        if not os.path.isdir(vol_dir):
            print(f"Warning: {vol_dir} not found, skipping.")
            continue

        # Read nav to preserve ordering
        nav_path = os.path.join(SITE_DATA_DIR, f"{vol_id}_nav.json")
        if os.path.exists(nav_path):
            with open(nav_path, 'r', encoding='utf-8') as f:
                nav_list = json.load(f)
        else:
            # Fallback: list all json files in the directory
            nav_list = [fn.replace('.json', '') for fn in sorted(os.listdir(vol_dir)) if fn.endswith('.json')]

        for filename in nav_list:
            json_filename = filename if filename.endswith('.json') else f"{filename}.json"
            topic_path = os.path.join(vol_dir, json_filename)
            if not os.path.exists(topic_path):
                continue

            with open(topic_path, 'r', encoding='utf-8') as f:
                try:
                    file_data = json.load(f)
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse {topic_path}")
                    continue

            for theme in file_data.get('themes', []):
                for topic in theme.get('topics', []):
                    # Prefer PT title/content, fallback to original
                    title = topic.get('title_ptbr') or topic.get('title_pt') or topic.get('title', '')
                    content_raw = topic.get('content_ptbr') or topic.get('content_pt') or topic.get('content', '')

                    # Japanese fields
                    title_ja = topic.get('title_ja') or ''
                    content_ja_raw = topic.get('content_ja') or topic.get('content', '')

                    # Strip HTML from content for a clean search index
                    soup = BeautifulSoup(content_raw, "html.parser")
                    for s in soup(['script', 'style']):
                        s.decompose()
                    clean_text = soup.get_text(separator=" ", strip=True)
                    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

                    # Strip HTML from Japanese content
                    soup_ja = BeautifulSoup(content_ja_raw, "html.parser")
                    for s in soup_ja(['script', 'style']):
                        s.decompose()
                    clean_text_ja = soup_ja.get_text(separator=" ", strip=True)
                    clean_text_ja = re.sub(r'\s+', ' ', clean_text_ja).strip()

                    # Clean asterisks from Markdown-style formatting
                    clean_text = clean_text.replace('*', '')
                    clean_text_ja = clean_text_ja.replace('*', '')

                    # Only store JA content if it's actually Japanese (not just a copy of PT)
                    if clean_text_ja == clean_text:
                        clean_text_ja = ''

                    if clean_text:
                        src_file = topic.get('source_file') or topic.get('filename') or ''
                        fname = os.path.basename(src_file) if src_file else filename
                        index_title = GLOBAL_INDEX_TITLES.get(vol_id, {}).get(fname, '')

                        MAX_CONTENT_LEN = 300
                        truncated_text = clean_text[:MAX_CONTENT_LEN]
                        truncated_ja = clean_text_ja[:MAX_CONTENT_LEN] if clean_text_ja else ''

                        entry = {
                            'v': vol_id,
                            'f': fname,
                            't': (index_title if index_title else title).strip(),
                            'c': truncated_text
                        }
                        if title_ja and title_ja.strip() != entry['t']:
                            entry['tj'] = title_ja.strip()
                        if truncated_ja:
                            entry['cj'] = truncated_ja

                        search_data.append(entry)

    index_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'search_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(search_data, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = os.path.getsize(index_path) / (1024 * 1024)
    print(f"Search index generated at {index_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_dirs()
    # The search index is now built from individual split files in site_data/.
    # To edit content, modify files directly in SiteModerno/site_data/shumeicN/filename.html.json
    # then re-run this script to update the search index.
    copy_assets()
    collect_index_titles()
    build_search_index()
    
    # Split the aggregated search index into per-volume files
    aggregated_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'search_index.json')
    if os.path.exists(aggregated_path):
        print("Splitting search index by volume...")
        with open(aggregated_path, 'r', encoding='utf-8') as f:
            all_entries = json.load(f)
        
        volumes_data = {}
        for entry in all_entries:
            vol = entry.get('v')
            if not vol:
                continue
            if vol not in volumes_data:
                volumes_data[vol] = []
            volumes_data[vol].append(entry)
        
        for vol, entries in volumes_data.items():
            split_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, f'search_index_{vol}.json')
            with open(split_path, 'w', encoding='utf-8') as f:
                json.dump(entries, f, ensure_ascii=False, separators=(',', ':'))
            split_size = os.path.getsize(split_path) / (1024 * 1024)
            print(f"  {vol}: {len(entries)} entries ({split_size:.2f} MB)")
        
        # Remove the aggregated file (only splits are used by frontend)
        os.remove(aggregated_path)
        print(f"Removed aggregated index.")
    
    # Write cache buster version file for reference
    version_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'build_version.txt')
    with open(version_path, 'w') as f:
        f.write(str(CACHE_BUSTER))
    print(f"Cache buster version: {CACHE_BUSTER}")
    
    print("Modern Site Data generated in " + OUTPUT_DIR)
