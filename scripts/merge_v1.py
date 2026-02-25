import json
import os
import glob
import re

BASE_DIR = "Data"
MAIN_JSON = os.path.join(BASE_DIR, "shumeic1_data.json")
TRANS_DIR = os.path.join(BASE_DIR, "v1_translated_parts")
OUTPUT_JSON = os.path.join(BASE_DIR, "shumeic1_data_translated.json")

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', s)]

def main():
    if not os.path.exists(MAIN_JSON):
        print(f"Error: {MAIN_JSON} not found.")
        return

    print("Loading original Volume 1 data...")
    with open(MAIN_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Reconstruct the topics from the translated parts
    # We'll build a map from theme index -> list of translated topics
    print("Reading translated parts...")
    translated_parts = glob.glob(os.path.join(TRANS_DIR, "*.json"))
    translated_parts.sort(key=natural_sort_key)
    
    theme_topics_map = {}
    
    for filepath in translated_parts:
        filename = os.path.basename(filepath)
        # Parse theme index from filename: theme_01_...
        match = re.match(r"theme_(\d+)_", filename)
        if match:
            theme_idx = int(match.group(1)) - 1 # 0-indexed in array
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    part_data = json.load(f)
                    
                # The data could be a list (from our split-retranslation output) or a dict with "topics"
                if isinstance(part_data, list):
                    topics = part_data
                elif isinstance(part_data, dict):
                    topics = part_data.get("topics", [])
                else:
                    topics = []
                    
                if theme_idx not in theme_topics_map:
                    theme_topics_map[theme_idx] = []
                    
                theme_topics_map[theme_idx].extend(topics)
            except Exception as e:
                print(f"Error reading {filename}: {e}")

    # Now merge these back into the original structure
    print("Merging translations into main document...")
    themes = data.get("themes", [])
    
    total_original_topics = 0
    total_translated_topics = 0
    
    for i, theme in enumerate(themes):
        original_topics = theme.get("topics", [])
        total_original_topics += len(original_topics)
        
        translated_topics = theme_topics_map.get(i, [])
        total_translated_topics += len(translated_topics)
        
        # We replace the original topics entirely with our translated ones
        # since we maintained the order through numbering
        if translated_topics:
            theme["topics"] = translated_topics
        else:
            print(f"Warning: No translations found for Theme {i+1}: {theme.get('theme_title')}")

    print(f"Total topics originally: {total_original_topics}")
    print(f"Total topics merged: {total_translated_topics}")
    
    if total_original_topics != total_translated_topics:
        print("Warning: The number of merged topics doesn't perfectly match the original count.")

    print(f"Saving merged data to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    main()
