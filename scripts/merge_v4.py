import json
import glob
import os

BASE_DIR = "Data"
INPUT_JSON = os.path.join(BASE_DIR, "shumeic4_data.json")
TRANSLATED_DIR = os.path.join(BASE_DIR, "v4_translated_parts")
OUTPUT_JSON = os.path.join(BASE_DIR, "shumeic4_data_bilingual.json")

def main():
    if not os.path.exists(INPUT_JSON):
        print(f"Error: {INPUT_JSON} not found!")
        return

    # 1. Load the original Japanese data
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    themes = data.get("themes", [])
    
    # 2. Gather all translated parts
    translated_files = sorted(glob.glob(os.path.join(TRANSLATED_DIR, "*.json")))
    print(f"Found {len(translated_files)} translated parts.")

    # We will organize translated topics by theme index to easily inject them back
    # filenames are like: theme_01_Title_part_001.json
    theme_topics_map = {}
    
    for t_file in translated_files:
        basename = os.path.basename(t_file)
        # Parse theme index from filename
        parts = basename.split('_')
        try:
            theme_idx = int(parts[1]) - 1 # 0-indexed
        except (IndexError, ValueError):
            print(f"Warning: Could not parse theme index from {basename}")
            continue
            
        with open(t_file, 'r', encoding='utf-8') as f:
            try:
                translated_topics = json.load(f)
                if theme_idx not in theme_topics_map:
                    theme_topics_map[theme_idx] = []
                theme_topics_map[theme_idx].extend(translated_topics)
            except json.JSONDecodeError:
                print(f"Error reading JSON from {t_file}")
                
    # 3. Inject translated fields into original data
    total_translated_topics = 0
    total_original_topics = 0
    
    for i, theme in enumerate(themes):
        original_topics = theme.get("topics", [])
        total_original_topics += len(original_topics)
        
        translated_topics = theme_topics_map.get(i, [])
        total_translated_topics += len(translated_topics)
        
        if translated_topics:
            if len(original_topics) != len(translated_topics):
                print(f"Warning: Count mismatch in Theme {i+1}: Original={len(original_topics)}, Translated={len(translated_topics)}")
            
            # Key-by-key injection so we keep JA and PT side-by-side
            for orig, trans in zip(original_topics, translated_topics):
                for key, value in trans.items():
                    orig[key] = value
        else:
            print(f"Warning: No translations found for Theme {i+1}: {theme.get('theme_title')}")

    print(f"\nMerge Summary:")
    print(f"Original Topics: {total_original_topics}")
    print(f"Translated Topics Injected: {total_translated_topics}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"\nFinal bilingual JSON saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
