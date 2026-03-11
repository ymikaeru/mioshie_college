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
    
    # 2. Gather all translated parts and index them by source_file
    translated_map = {} # filename -> translated_data
    translated_files = sorted(glob.glob(os.path.join(TRANSLATED_DIR, "*.json")))
    print(f"Found {len(translated_files)} translated parts.")

    for t_file in translated_files:
        with open(t_file, 'r', encoding='utf-8') as f:
            try:
                translated_topics = json.load(f)
                if not isinstance(translated_topics, list):
                    continue
                
                for item in translated_topics:
                    src_file = item.get("source_file")
                    if src_file:
                        translated_map[src_file] = item
            except json.JSONDecodeError:
                print(f"Error reading JSON from {t_file}")
                
    # 3. Inject translated fields into original data using filename matching
    total_original_topics = 0
    total_translated_injected = 0
    
    for theme in themes:
        original_topics = theme.get("topics", [])
        total_original_topics += len(original_topics)
        
        for orig in original_topics:
            filename = orig.get("filename")
            if filename in translated_map:
                trans = translated_map[filename]
                # Inject fields
                for key in ["title_ptbr", "content_ptbr", "publication_title_ptbr"]:
                    if key in trans:
                        orig[key] = trans[key]
                total_translated_injected += 1

    print(f"\nMerge Summary:")
    print(f"Original Topics: {total_original_topics}")
    print(f"Translated Topics Injected: {total_translated_injected}")

    # 4. Save the final bilingual JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"\nFinal bilingual JSON saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
