import json
import os

MAIN_JSON = "Data/shumeic1_data_translated.json"

def main():
    if not os.path.exists(MAIN_JSON):
        print(f"Error: {MAIN_JSON} not found.")
        return

    with open(MAIN_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    themes = data.get("themes", [])
    
    missing_pt = 0
    total_topics = 0
    
    for t_idx, theme in enumerate(themes):
        topics = theme.get("topics", [])
        for i, topic in enumerate(topics):
            total_topics += 1
            # Check for portuguese content.
            pt_content = topic.get("content_pt", "") or topic.get("content_ptbr", "")
            
            if not pt_content or pt_content.strip() == "":
                missing_pt += 1
                theme_title = theme.get("theme_title", "")
                ja_title = topic.get("title_ja", "") or topic.get("title", "")
                
                print(f"Missing translation: Theme {t_idx+1}: {theme_title} | Topic: {ja_title}")

    print("--------------------------------------------------")
    print(f"Total topics checked: {total_topics}")
    print(f"Topics completely untranslated: {missing_pt}")
    print(f"Translation Completion Rate: {((total_topics - missing_pt) / total_topics) * 100:.2f}%")

if __name__ == "__main__":
    main()
