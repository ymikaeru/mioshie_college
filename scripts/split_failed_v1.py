import os
import glob
import json

PARTS_DIR = "Data/v1_parts_for_translation"
OUT_DIR = "Data/v1_translated_parts"
BACKUPS_DIR = "Data/v1_parts_for_translation_backups"

MAX_CHARS_PER_FILE = 6000

def get_file_size_estimate(data):
    return len(json.dumps(data, ensure_ascii=False))

def split_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return

    topics = data.get("topics", [])
    if not topics:
        return

    base_name = os.path.basename(file_path)
    print(f"Splitting {base_name} ({len(topics)} topics)...")

    chunks = []
    current_chunk = []
    current_chunk_size = 0

    base_structure = {k: v for k, v in data.items() if k != "topics"}

    for topic in topics:
        topic_size = get_file_size_estimate(topic)
        
        if current_chunk and (current_chunk_size + topic_size > MAX_CHARS_PER_FILE):
            chunks.append(current_chunk)
            current_chunk = []
            current_chunk_size = 0
            
        current_chunk.append(topic)
        current_chunk_size += topic_size

    if current_chunk:
        chunks.append(current_chunk)

    if len(chunks) <= 1:
        print(f"  - No split needed for {base_name} (Size: {get_file_size_estimate(data)} chars)")
        return

    print(f"  - Splitting {base_name} into {len(chunks)} files.")

    original_filename_no_ext = os.path.splitext(base_name)[0]
    
    for i, chunk in enumerate(chunks):
        new_data = base_structure.copy()
        new_data["topics"] = chunk
        
        suffix = f"_s{i+1:02d}"
        new_filename = f"{original_filename_no_ext}{suffix}.json"
        new_file_path = os.path.join(PARTS_DIR, new_filename)
        
        try:
            with open(new_file_path, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"    Error writing {new_filename}: {e}")

    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR)
        
    backup_path = os.path.join(BACKUPS_DIR, base_name)
    try:
        os.rename(file_path, backup_path)
        print(f"    Moved original to {backup_path}")
    except Exception as e:
        print(f"    Error moving original: {e}")

def main():
    parts_files = set(os.path.basename(p) for p in glob.glob(os.path.join(PARTS_DIR, "*.json")))
    translated_files = set(os.path.basename(p) for p in glob.glob(os.path.join(OUT_DIR, "*.json")))
    
    missing_files = parts_files - translated_files
    print(f"Found {len(missing_files)} missing files to process.")
    
    for filename in missing_files:
        file_path = os.path.join(PARTS_DIR, filename)
        split_file(file_path)

if __name__ == "__main__":
    main()
