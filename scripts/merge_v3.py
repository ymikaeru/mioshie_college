import json
import glob
import os

BASE_DIR = "Data"
INPUT_JSON = os.path.join(BASE_DIR, "shumeic3_data.json")
TRANSLATED_DIR = os.path.join(BASE_DIR, "v3_translated_parts")
OUTPUT_JSON = os.path.join(BASE_DIR, "shumeic3_data_bilingual.json")

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

    # Organize translated topics by (theme_idx, source_filename)
    # This acts as a robust lookup to handle cases where Gemini skipped items
    translation_lookup = {}
    
    for t_file in translated_files:
        basename = os.path.basename(t_file)
        parts = basename.split('_')
        try:
            theme_idx = int(parts[1]) - 1 # 0-indexed
        except (IndexError, ValueError):
            print(f"Warning: Could not parse theme index from {basename}")
            continue
            
        with open(t_file, 'r', encoding='utf-8') as f:
            try:
                translated_topics = json.load(f)
                for item in translated_topics:
                    fname = item.get("source_file")
                    if fname:
                        # We use a list because multiple topics can share a filename (broken up)
                        key = (theme_idx, fname)
                        if key not in translation_lookup:
                            translation_lookup[key] = []
                        translation_lookup[key].append(item)
            except json.JSONDecodeError:
                print(f"Error reading JSON from {t_file}")
                
    # 3. Inject translated fields into original data using the lookup
    total_injected_fields = 0
    total_original_topics = 0
    missing_matches = 0
    
    for i, theme in enumerate(themes):
        original_topics = theme.get("topics", [])
        total_original_topics += len(original_topics)
        
        # Track which items we've already used from the lookup for this theme
        # (to handle multiple topics with same filename in order)
        used_counts = {} 
        
        for orig in original_topics:
            fname = orig.get("filename")
            if not fname:
                continue
                
            lookup_key = (i, fname)
            possible_translations = translation_lookup.get(lookup_key, [])
            
            idx = used_counts.get(fname, 0)
            if idx < len(possible_translations):
                trans = possible_translations[idx]
                # Inject translated fields
                for key in ["title_ptbr", "content_ptbr", "publication_title_ptbr"]:
                    if key in trans:
                        orig[key] = trans[key]
                        total_injected_fields += 1
                
                # Copy title_ja if available for convenience
                if "title_ja" in trans:
                    orig["title_ja"] = trans["title_ja"]
                elif "title" in trans and not orig.get("title_ja"):
                    # Fallback if title was stored as 'title' in translation part
                     orig["title_ja"] = trans["title"]

                used_counts[fname] = idx + 1
            else:
                missing_matches += 1

    print(f"\nMerge Summary:")
    print(f"Original Topics: {total_original_topics}")
    print(f"Topics successfully matched and updated: {total_original_topics - missing_matches}")
    print(f"Topics missing translation: {missing_matches}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"\nFinal bilingual JSON saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
