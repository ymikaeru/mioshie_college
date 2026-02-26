import json
import os
import re

# Japanese Era to Year mapping
ERAS = {
    "明治": 1868,
    "大正": 1912,
    "昭和": 1926,
    "平成": 1989,
    "令和": 2019
}

MONTHS_PT = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

def normalize_ja_date(date_str):
    if not date_str or date_str == "Unknown":
        return None
    # Example: 昭和24年7月16日
    match = re.search(r'(明治|大正|昭和|平成|令和)(\d+|元)年(\d+)月(\d+)日', date_str)
    if match:
        era, year_str, month, day = match.groups()
        base_year = ERAS.get(era)
        year = 1 if year_str == "元" else int(year_str)
        abs_year = base_year + year - 1
        return f"{abs_year}-{int(month):02d}-{int(day):02d}"
    return None

def normalize_pt_date(content):
    if not content:
        return None
    # Example: Publicado em 15 de abril de 1950
    # Search in the first few hundred characters for performance
    search_text = content[:1000]
    match = re.search(r'(\d+)\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})', search_text, re.IGNORECASE)
    if match:
        day, month_name, year = match.groups()
        month = MONTHS_PT.get(month_name.lower())
        if month:
            return f"{year}-{month:02d}-{int(day):02d}"
    return None

def main():
    data_dir = "Data"
    ja_file = os.path.join(data_dir, "shumeic3_data.json")
    trans_dir = os.path.join(data_dir, "v3_translated_parts")
    output_file = os.path.join(data_dir, "shumeic3_data_bilingual.json")

    with open(ja_file, 'r', encoding='utf-8') as f:
        ja_data = json.load(f)

    # 1. Load all translations into a lookup
    # Key: (filename, normalized_date) -> list of translations (for same-date items)
    translation_lookup = {}
    
    parts_files = [f for f in os.listdir(trans_dir) if f.endswith('.json')]
    parts_files.sort()

    for part_file in parts_files:
        with open(os.path.join(trans_dir, part_file), 'r', encoding='utf-8') as f:
            translations = json.load(f)
            for t in translations:
                fname = t.get('source_file')
                if not fname: continue
                
                pt_date = normalize_pt_date(t.get('content_ptbr', ''))
                
                key = (fname, pt_date)
                if key not in translation_lookup:
                    translation_lookup[key] = []
                translation_lookup[key].append(t)

    # 2. Merge with original data
    total_topics = 0
    matched_topics = 0
    unmatched_topics = []

    # Track how many times each (filename, date) has been used from the lookup
    used_counts = {}

    for theme in ja_data.get('themes', []):
        for topic in theme.get('topics', []):
            total_topics += 1
            fname = topic.get('filename')
            ja_date = normalize_ja_date(topic.get('date'))
            
            key = (fname, ja_date)
            possible = translation_lookup.get(key, [])
            
            idx = used_counts.get(key, 0)
            if idx < len(possible):
                trans = possible[idx]
                topic['title_ptbr'] = trans.get('title_ptbr', '')
                topic['content_ptbr'] = trans.get('content_ptbr', '')
                topic['publication_title_ptbr'] = trans.get('publication_title_ptbr', '')
                matched_topics += 1
                used_counts[key] = idx + 1
            else:
                # Fallback: if we have "Unknown" date or just couldn't match, maybe we can match by sequence among the remaining ones?
                # But that's risky. Let's at least log it.
                topic['title_ptbr'] = ""
                topic['content_ptbr'] = ""
                topic['publication_title_ptbr'] = ""
                unmatched_topics.append(f"{topic.get('title')} ({fname}, {topic.get('date')})")

    print(f"Matched {matched_topics} out of {total_topics} topics.")
    
    if unmatched_topics:
        print(f"\nUnmatched Topics ({len(unmatched_topics)}):")
        for u in unmatched_topics[:20]:
            print(f"  - {u}")
        if len(unmatched_topics) > 20:
            print(f"  ... and {len(unmatched_topics) - 20} more.")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(ja_data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved merged data to {output_file}")

if __name__ == "__main__":
    main()
