import json
import os
import glob
import re

# Configuration
BASE_DIR = "/Users/michael/Documents/Ensinamentos/Sites/BR/Shumei_Vol02/Data"
ORIGINAL_JSON = os.path.join(BASE_DIR, "shumeic2_data.json")
TRANSLATED_DIR = os.path.join(BASE_DIR, "translated_parts")
OUTPUT_JSON = os.path.join(BASE_DIR, "shumeic2_data_bilingual.json")

# Hardcoded Portuguese Theme Titles mapping for Volume 2
THEME_TITLES_PT = {
    "浄霊の原理": "Princípio do Jorei",
    "浄霊の方法": "Método do Jorei",
    "浄化作用": "Ação Purificadora",
    "三 毒": "Os Três Venenos",
    "病気の体的分析": "Análise Física da Doença",
    "病気の霊的分析": "Análise Espiritual da Doença",
    "現代医学批判": "Crítica à Medicina Moderna",
    "神示の健康法": "Método de Saúde por Revelação Divina",
    "自然農法": "Agricultura Natural"
}

def clean_text(text):
    """Clean text by removing extra whitespace."""
    if not text:
        return ""
    return " ".join(text.split())

def main():
    if not os.path.exists(ORIGINAL_JSON):
        print(f"Error: Original file not found at {ORIGINAL_JSON}")
        return

    if not os.path.exists(TRANSLATED_DIR):
        print(f"Error: Translated directory not found at {TRANSLATED_DIR}")
        return

    print("Loading original JSON...")
    with open(ORIGINAL_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    themes = data.get("themes", [])
    print(f"Loaded {len(themes)} themes.")

    # Load "Missing Parts" translations into a map of lists (to handle duplicates)
    missing_parts_map = {}
    MISSING_PARTS_DIR = os.path.join(BASE_DIR, "missing_parts_for_translation")
    
    if os.path.exists(MISSING_PARTS_DIR):
        print(f"Loading missing parts from {MISSING_PARTS_DIR}...")
        all_missing_files = sorted(glob.glob(os.path.join(MISSING_PARTS_DIR, "missing_part_*.json")))
        
        # Filter: prioritize 'copy.json' files
        files_to_load = []
        for f in all_missing_files:
            if " copy.json" in f:
                files_to_load.append(f)
                orig = f.replace(" copy.json", ".json")
                if orig in files_to_load:
                    files_to_load.remove(orig)
            else:
                copy_v = f.replace(".json", " copy.json")
                if copy_v not in all_missing_files:
                    files_to_load.append(f)
        
        for m_file in sorted(files_to_load):
            try:
                with open(m_file, 'r', encoding='utf-8') as f:
                    m_data = json.load(f)
                    if isinstance(m_data, list):
                        for item in m_data:
                            src = item.get("source_file")
                            if src:
                                if src not in missing_parts_map:
                                    missing_parts_map[src] = []
                                missing_parts_map[src].append(item)
                    else:
                        print(f"  Warning: {m_file} is not a list. Skipping.")
            except Exception as e:
                print(f"  Error loading {m_file}: {e}")
        total_m = sum(len(l) for l in missing_parts_map.values())
        print(f"Loaded {total_m} items from missing parts ({len(missing_parts_map)} unique files).")
    else:
        print(f"Warning: Missing parts directory not found at {MISSING_PARTS_DIR}")

    # Process each theme
    for t_idx, theme in enumerate(themes):
        original_theme_title = theme.get("theme_title", "")
        clean_theme_title = clean_text(original_theme_title)
        print(f"\nProcessing Theme {t_idx + 1}: {original_theme_title}")
        
        # Add Portuguese Theme Title
        if clean_theme_title in THEME_TITLES_PT:
            theme["theme_title_pt"] = THEME_TITLES_PT[clean_theme_title]
            print(f"  Mapped Theme Title PT: {theme['theme_title_pt']}")
        else:
            theme["theme_title_pt"] = ""
            print(f"  Warning: No Portuguese translation found for theme title '{original_theme_title}'")
            
        # Initialize Volume Title PT
        theme["volume_title_pt"] = "Shumei Volume 2" 

        # Get the translated files for this theme
        theme_num = t_idx + 1
        pattern = os.path.join(TRANSLATED_DIR, f"theme_{theme_num:02d}_*_part_*.json")
        print(f"  Debug: Pattern = {pattern}")
        translated_files = sorted(glob.glob(pattern))
        print(f"  Debug: Found {len(translated_files)} files")
        
        # Sequential matching cursor for Translated Parts
        topic_cursor = 0
        merged_count = 0
        topics = theme.get("topics", [])
        total_topics = len(topics)

        if translated_files:
            print(f"  Found {len(translated_files)} translated parts.")
            for file_path in translated_files:
                basename = os.path.basename(file_path)
                orig_part_path = os.path.join(BASE_DIR, "parts_for_translation", basename)
                if not os.path.exists(orig_part_path):
                    print(f"    Warning: Original part file not found {orig_part_path}")
                    continue
                    
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        translated_data = json.load(f)
                    with open(orig_part_path, 'r', encoding='utf-8') as f:
                        orig_part_data = json.load(f)
                        
                    # Extract lists
                    t_items = translated_data if isinstance(translated_data, list) else translated_data.get("topics", [])
                    o_items = orig_part_data if isinstance(orig_part_data, list) else orig_part_data.get("topics", [])
                    
                    if len(t_items) != len(o_items):
                        # Some files might have failed or mismatched. Skip or try best effort.
                        print(f"    Warning: Mismatch in item count for {basename} ({len(t_items)} translated vs {len(o_items)} original)")
                        # Best effort: use the minimum length
                        min_len = min(len(t_items), len(o_items))
                        t_items = t_items[:min_len]
                        o_items = o_items[:min_len]

                    for o_item, t_item in zip(o_items, t_items):
                        orig_title = o_item.get("title", "")
                        title_pt = t_item.get("title_ptbr", t_item.get("title_pt", ""))
                        content_pt = t_item.get("content_ptbr", t_item.get("content_pt", ""))
                        pub_title_pt = t_item.get("publication_title_ptbr", "")

                        if not orig_title or not content_pt:
                            continue

                        # Find matching topic in the main original theme by title
                        match_found = False
                        for i, topic in enumerate(topics):
                            if topic.get("title") == orig_title:
                                topic["title_pt"] = title_pt
                                topic["content_pt"] = content_pt
                                topic["publication_title_pt"] = pub_title_pt
                                match_found = True
                                merged_count += 1
                                if merged_count <= 5:
                                    print(f"    Merged (Translated Part): {title_pt[:30]}... -> Topic {i}")
                                elif merged_count == 6:
                                    print(f"    ... and more topics merged ...")
                                break
                                
                        if not match_found:
                            # Try matching by content length or content substring as fallback if title was somehow tweaked
                            pass

                except Exception as e:
                    print(f"    Error processing file {file_path}: {e}")
        else:
             print(f"  No translated parts found in directory for Theme {theme_num}")

        # After processing translated parts, check for any remaining items in Missing Parts
        for i, topic in enumerate(topics):
            # If already translated, skip
            if topic.get("title_pt"):
                continue
            
            original_filename = os.path.basename(topic.get("filename", ""))
            
            if original_filename in missing_parts_map:
                items_list = missing_parts_map[original_filename]
                if items_list:
                    m_item = items_list.pop(0) # Get the NEXT sequential match for this filename
                    topic["title_pt"] = m_item.get("title_ptbr", "")
                    topic["content_pt"] = m_item.get("content_ptbr", "")
                    topic["publication_title_pt"] = m_item.get("publication_title_ptbr", "")
                    
                    if merged_count <= 5:
                        print(f"    Merged (Missing Part): {topic['title_pt'][:30]}... -> Topic {i} ({original_filename})")
                    elif merged_count == 6:
                        print(f"    ... and more topics merged ...")
                    
                    merged_count += 1

        print(f"  Summary: Merged {merged_count} out of {total_topics} topics for theme '{original_theme_title}'")


    print(f"\nSaving merged bilingual JSON to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Done.")

if __name__ == "__main__":
    main()
