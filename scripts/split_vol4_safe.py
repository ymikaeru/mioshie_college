import json
import os
import math

BASE_DIR = "Data"
INPUT_JSON = os.path.join(BASE_DIR, "shumeic4_data.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "v4_parts_for_translation")

MAX_CHARS_PER_FILE = 6000

def chunk_content(topics, max_chars):
    """
    Sub-divides a list of topics. If a single topic is huge, it will be the only item in its chunk.
    If multiple topics fit within max_chars, they are grouped together.
    """
    chunks = []
    current_chunk = []
    current_length = 0
    
    for topic in topics:
        topic_len = len(json.dumps(topic, ensure_ascii=False))
        
        # If this single topic is larger than MAX_CHARS and we already have items,
        # flush the current chunk first.
        if current_length + topic_len > max_chars and current_chunk:
            chunks.append(current_chunk)
            current_chunk = []
            current_length = 0
            
        current_chunk.append(topic)
        current_length += topic_len
        
        # If the chunk is now full (or overfull because of a giant single topic)
        if current_length >= max_chars:
            chunks.append(current_chunk)
            current_chunk = []
            current_length = 0
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

def extract_title_for_filename(node):
    if "theme_title" in node:
        return node["theme_title"]
    elif "title" in node:
        return node["title"]
    elif "title_ja" in node:
         return node["title_ja"]
    return "Unknown"

def sanitize_filename(name):
    keepcharacters = (' ', '.', '_', '-')
    sanitized = "".join(c for c in name if c.isalnum() or c in keepcharacters).rstrip()
    sanitized = sanitized.replace("　", "_").replace(" ", "_")
    return sanitized[:50] # Limit length

def main():
    if not os.path.exists(INPUT_JSON):
        print(f"Error: {INPUT_JSON} not found.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
         data = json.load(f)
         
    themes = data.get("themes", [])
    
    total_parts_created = 0
    
    for i, theme in enumerate(themes):
        # We process each theme individually
        theme_title = sanitize_filename(extract_title_for_filename(theme))
        topics = theme.get("topics", [])
        
        if not topics:
            continue
            
        # Break topics into chunks of roughly 6000 characters
        # so Gemini API doesn't timeout
        chunks = chunk_content(topics, MAX_CHARS_PER_FILE)
        
        for chunk_idx, chunk in enumerate(chunks):
             part_num = chunk_idx + 1
             filename = f"theme_{i+1:02d}_{theme_title}_part_{part_num:03d}.json"
             filepath = os.path.join(OUTPUT_DIR, filename)
             
             with open(filepath, 'w', encoding='utf-8') as f:
                 json.dump(chunk, f, ensure_ascii=False, indent=2)
                 
             total_parts_created += 1

    print(f"Volume 4 split into {total_parts_created} safe parts in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
