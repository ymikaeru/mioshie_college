"""Reverse script: updates monolithic bilingual JSON files from individual split topic files.

Use this after editing topic files directly in SiteModerno/site_data/shumeicN/.
It reads the current monolithic file (to preserve theme structure), then updates
each topic's content from the corresponding individual file.

Usage:
    python3 scripts/join_bilingual.py              # Update all volumes
    python3 scripts/join_bilingual.py shumeic1      # Update only volume 1
"""
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'Data')
SITE_DATA_DIR = os.path.join(BASE_DIR, 'SiteModerno', 'site_data')
VOLUMES = ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']

# Fields to update from split files back into the monolithic
CONTENT_FIELDS = [
    'title', 'title_ptbr', 'title_pt', 'title_ja',
    'content', 'content_ptbr', 'content_pt', 'content_ja',
    'date', 'publication_title_ptbr', 'publication_title_pt',
]


def load_split_topics(vol_id):
    """Load all topics from individual split files into a dict keyed by (filename, title)."""
    vol_dir = os.path.join(SITE_DATA_DIR, vol_id)
    if not os.path.isdir(vol_dir):
        print(f"Warning: {vol_dir} not found")
        return {}

    topics_by_file = {}  # filename -> list of topics (in order)

    nav_path = os.path.join(SITE_DATA_DIR, f"{vol_id}_nav.json")
    if os.path.exists(nav_path):
        with open(nav_path, 'r', encoding='utf-8') as f:
            nav_list = json.load(f)
    else:
        nav_list = [fn.replace('.json', '') for fn in sorted(os.listdir(vol_dir)) if fn.endswith('.json')]

    for filename in nav_list:
        json_filename = filename if filename.endswith('.json') else f"{filename}.json"
        topic_path = os.path.join(vol_dir, json_filename)
        if not os.path.exists(topic_path):
            continue

        with open(topic_path, 'r', encoding='utf-8') as f:
            try:
                file_data = json.load(f)
            except json.JSONDecodeError:
                print(f"Warning: Could not parse {topic_path}")
                continue

        file_topics = []
        for theme in file_data.get('themes', []):
            for topic in theme.get('topics', []):
                file_topics.append(topic)

        topics_by_file[filename] = file_topics

    return topics_by_file


def process_volume(vol_id):
    bilingual_path = os.path.join(DATA_DIR, f"{vol_id}_data_bilingual.json")
    if not os.path.exists(bilingual_path):
        print(f"Skipping {vol_id}: {bilingual_path} not found")
        return

    print(f"Loading {vol_id} monolithic file...")
    with open(bilingual_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    split_topics = load_split_topics(vol_id)
    if not split_topics:
        print(f"Skipping {vol_id}: no split files found")
        return

    updated_count = 0
    not_found_count = 0

    for theme in data.get('themes', []):
        for i, topic in enumerate(theme.get('topics', [])):
            src_file = topic.get('source_file') or topic.get('filename', '')
            filename = src_file.split('/')[-1] if src_file else ''
            if not filename:
                continue

            file_topics = split_topics.get(filename, [])
            if not file_topics:
                not_found_count += 1
                continue

            # Match by title (title_idx is a global theme index, not a list index)
            matched = None
            for ft in file_topics:
                if ft.get('title') == topic.get('title'):
                    matched = ft
                    break

            if matched:
                changed = False
                for field in CONTENT_FIELDS:
                    if field in matched and matched[field] != topic.get(field):
                        topic[field] = matched[field]
                        changed = True
                if changed:
                    updated_count += 1

    print(f"  {vol_id}: {updated_count} topics updated, {not_found_count} not matched in split files")

    if updated_count > 0:
        print(f"  Saving updated {bilingual_path}...")
        with open(bilingual_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  Done.")
    else:
        print(f"  No changes detected, file not modified.")


if __name__ == "__main__":
    target_volumes = sys.argv[1:] if len(sys.argv) > 1 else VOLUMES
    for vol in target_volumes:
        if vol not in VOLUMES:
            print(f"Unknown volume: {vol}. Valid: {VOLUMES}")
            continue
        process_volume(vol)
    print("Join complete.")
