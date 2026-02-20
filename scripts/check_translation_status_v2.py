import json
import os

JSON_FILE = "Data/shumeic2_data_bilingual.json"

def main():
    if not os.path.exists(JSON_FILE):
        print(f"Error: {JSON_FILE} not found.")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    themes = data if isinstance(data, list) else data.get("themes", [])
    total_topics = 0
    missing_count = 0
    
    print(f"Checking {len(themes)} themes for missing translations...\n")

    for t_idx, theme in enumerate(themes):
        # We need to extract the structure depending on how vol2 is formatted. 
        # Assume it's a list of dictionaries with "theme" and "topics" keys
        theme_title = theme.get("theme", f"Theme {t_idx+1}")
        # if the format is just a list of topics with 'theme' field, check that.
        # But typically: { "theme": "...", "topics": [...] }
        
        # Let's check structure dynamically
        topics = theme.get("topics", [])
        if not topics and "id" in theme:
            # Maybe it's not grouped by theme? We will just count everything.
            topics = [theme]
            
        theme_missing = 0
        
        for topic in topics:
            total_topics += 1
            title_pt = topic.get("title_ptbr", topic.get("title_pt", ""))
            content_pt = topic.get("content_ptbr", topic.get("content_pt", ""))
            
            if not title_pt or not content_pt:
                missing_count += 1
                theme_missing += 1

        if theme_missing > 0:
            print(f"{theme_title}")
            print(f"  - Missing {theme_missing}/{len(topics)} topics")
            
    print("-" * 30)
    print(f"Total Topics: {total_topics}")
    print(f"Total Missing Translations: {missing_count}")
    if total_topics > 0:
        print(f"Completion Rate: {((total_topics - missing_count) / total_topics) * 100:.2f}%")

if __name__ == "__main__":
    main()
