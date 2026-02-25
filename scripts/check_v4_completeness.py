import json
import os

filepath = "/Users/michael/Documents/Ensinamentos/Sites/BR/Shumei_Vol02/Data/shumeic4_data_bilingual.json"

def main():
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found!")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_topics = 0
    translated_topics = 0

    for theme in data.get("themes", []):
        for topic in theme.get("topics", []):
            total_topics += 1
            if 'content_ptbr' in topic and 'title_ptbr' in topic:
                translated_topics += 1
            else:
                print(f"Missing translation in theme '{theme.get('theme_title')}': {topic.get('title', topic.get('title_ja'))}")

    if total_topics == 0:
        print("No topics found in the file.")
        return

    completion_rate = (translated_topics / total_topics) * 100
    print(f"\n--- Volume 4 Verification ---")
    print(f"Total Topics Expected: {total_topics}")
    print(f"Topics Successfully Translated: {translated_topics}")
    print(f"Completion Rate: {completion_rate:.2f}%")

if __name__ == "__main__":
    main()
