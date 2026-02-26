import json, os, glob

DATA_DIR = './Data'
ORIG_DIR = './OrigianlHTML'

VOLUMES = [
    ('shumeic1', 'shumeic1_data_bilingual.json'),
    ('shumeic2', 'shumeic2_data_bilingual.json'),
    ('shumeic3', 'shumeic3_data_bilingual.json'),
    ('shumeic4', 'shumeic4_data_bilingual.json')
]

for vol_id, json_file in VOLUMES:
    orig_path = os.path.join(ORIG_DIR, vol_id)
    if not os.path.exists(orig_path): continue
    
    orig_files = set(os.path.basename(f) for f in glob.glob(os.path.join(orig_path, '*.html')))
    orig_files -= {'index.html', 'index2.html', 'link.html', 'mokuzi.html'}
    
    json_path = os.path.join(DATA_DIR, json_file)
    json_files = set()
    untranslated = set()
    
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for theme in data.get('themes', []):
                for topic in theme.get('topics', []):
                    fname = topic.get('source_file') or topic.get('filename')
                    if fname:
                        fname = os.path.basename(fname)
                        json_files.add(fname)
                        if not topic.get('content_ptbr') or len(topic.get('content_ptbr', '').strip()) < 10:
                            untranslated.add(fname)
    
    missing_files = orig_files - json_files
    
    print(f"[{vol_id}] Source HTMLs: {len(orig_files)} | In JSON: {len(json_files)} | Missing: {len(missing_files)} | Blank/Untranslated: {len(untranslated)}")

