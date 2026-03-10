import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_DATA_DIR = os.path.join(BASE_DIR, 'site_data')
VOLUMES = ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']

def process_volume(vol_id):
    original_file = os.path.join(SITE_DATA_DIR, f"{vol_id}_data_bilingual.json")
    if not os.path.exists(original_file):
        print(f"Skipping {vol_id}: File not found ({original_file})")
        return

    print(f"Loading {vol_id}...")
    with open(original_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Extract Navigation List
    # We want a clean ordered list of filenames for prev/next
    nav_list = []
    
    # 2. Extract Individual Topics
    # We'll save each topic into site_data/vol_id/filename.json
    output_dir = os.path.join(SITE_DATA_DIR, vol_id)
    os.makedirs(output_dir, exist_ok=True)
    
    file_topics = {} # filename -> list of topics

    for theme in data.get('themes', []):
        for topic in theme.get('topics', []):
            filename_path = topic.get('source_file') or topic.get('filename')
            if not filename_path:
                print(f"Warning: Topic missing filename in {vol_id}: {topic.get('title')}")
                continue
                
            fname = filename_path.split('/')[-1]
            if fname not in nav_list:
                nav_list.append(fname)
            
            if fname not in file_topics:
                file_topics[fname] = []
            file_topics[fname].append(topic)
            
    # Save nav list
    nav_file = os.path.join(SITE_DATA_DIR, f"{vol_id}_nav.json")
    with open(nav_file, 'w', encoding='utf-8') as f:
        json.dump(nav_list, f, ensure_ascii=False)
        
    # Save individual topics
    for fname, topics in file_topics.items():
        # Cleanly recreate the structure but only for this file
        file_data = {
            "volume_title": data.get("volume_title", ""),
            "themes": [{"topics": topics}] # We flatten themes for the individual file for simplicity
        }
        
        # If it doesn't end with .json, append it. For standard names it'll be .html.json
        out_fname = fname if fname.endswith('.json') else f"{fname}.json"
        topic_file = os.path.join(output_dir, out_fname)
        
        with open(topic_file, 'w', encoding='utf-8') as f:
            json.dump(file_data, f, ensure_ascii=False, separators=(',', ':'))

    print(f"Successfully split {vol_id}: {len(nav_list)} files extracted.")

if __name__ == "__main__":
    for vol in VOLUMES:
        process_volume(vol)
    print("All volumes processed.")
