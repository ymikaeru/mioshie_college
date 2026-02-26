import json, os, glob, re
from bs4 import BeautifulSoup

DATA_DIR = './Data'
ORIG_DIR = './OrigianlHTML'
OUTPUT_BATCH_DIR = os.path.join(DATA_DIR, 'parts_for_translation')

VOLUMES = [
    ('shumeic1', 'shumeic1_data_bilingual.json'),
    ('shumeic2', 'shumeic2_data_bilingual.json'),
    ('shumeic3', 'shumeic3_data_bilingual.json'),
    ('shumeic4', 'shumeic4_data_bilingual.json')
]

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def parse_orig_html(file_path):
    if not os.path.exists(file_path): return None
    
    try:
        with open(file_path, 'r', encoding='shift_jis') as f:
            html = f.read()
    except:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                html = f.read()
        except:
            return None
            
    soup = BeautifulSoup(html, 'html.parser')
    
    # Remove navigation links to prevent translating buttons
    for a in soup.find_all('a', href=True):
        if a['href'] in ['index.html', 'index2.html', 'mokuzi.html', '#']:
            a.decompose()
            
    title = ""
    if soup.title:
        title = clean_text(soup.title.get_text())
    
    # Heuristic: if title is too long or generic, look for first font size +2
    header = soup.find('font', size='+2')
    if header:
        title_from_font = clean_text(header.get_text())
        if title_from_font:
            title = title_from_font

    body = soup.find('body')
    content = str(body) if body else str(soup)
    
    return {
        "title": title,
        "content": content,
        "filename": os.path.basename(file_path)
    }

def run():
    if not os.path.exists(OUTPUT_BATCH_DIR):
        os.makedirs(OUTPUT_BATCH_DIR)
        
    all_missing_topics = []
    
    for vol_id, json_file in VOLUMES:
        orig_path = os.path.join(ORIG_DIR, vol_id)
        if not os.path.exists(orig_path): continue
        
        orig_files_set = set(os.path.basename(f) for f in glob.glob(os.path.join(orig_path, '*.html')))
        orig_files_set -= {'index.html', 'index2.html', 'link.html', 'mokuzi.html'}
        
        json_path = os.path.join(DATA_DIR, json_file)
        present_files = set()
        blanks = []
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for theme in data.get('themes', []):
                    for topic in theme.get('topics', []):
                        fname = topic.get('source_file') or topic.get('filename')
                        if fname:
                            fname = os.path.basename(fname)
                            present_files.add(fname)
                            pt_text = topic.get('content_ptbr') or topic.get('content_pt') or ''
                            if len(pt_text.strip()) < 10:
                                blanks.append(fname)
        
        missing = sorted(list(orig_files_set - present_files))
        needs_translation = missing + blanks
        
        print(f"[{vol_id}] Found {len(needs_translation)} to extract ({len(missing)} missing, {len(blanks)} blank).")
        
        for fname in needs_translation:
            fpath = os.path.join(orig_path, fname)
            topic_data = parse_orig_html(fpath)
            if topic_data:
                all_missing_topics.append(topic_data)

    # Split into batches of 5 topics to avoid context window / token limits / timeouts
    batch_size = 5
    for i in range(0, len(all_missing_topics), batch_size):
        batch = all_missing_topics[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        output_file = os.path.join(OUTPUT_BATCH_DIR, f"missing_batch_{batch_num:02d}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({"topics": batch}, f, ensure_ascii=False, indent=2)
        print(f"Created batch {batch_num}: {len(batch)} topics -> {output_file}")

if __name__ == "__main__":
    run()
