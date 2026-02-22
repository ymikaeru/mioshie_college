import json
import os
import glob

INPUT_DIR = "Data/parts_for_translation"
MAX_TOPICS_PER_FILE = 5
THEME_PREFIXES = ["theme_01_", "theme_02_", "theme_03_", "theme_04_"]

def main():
    files_to_process = []
    for prefix in THEME_PREFIXES:
        pattern = os.path.join(INPUT_DIR, f"{prefix}*.json")
        # Exclude already sub-split files just in case
        all_files = glob.glob(pattern)
        files_to_process.extend([f for f in all_files if "_s0" not in f])
        
    if not files_to_process:
        print("No files found.")
        return

    print(f"Processing {len(files_to_process)} files...")
    
    total_new_files = 0
    total_deleted_files = 0

    for file_path in files_to_process:
        filename = os.path.basename(file_path)
        base_name, _ = os.path.splitext(filename)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        topics = data.get("topics", []) if isinstance(data, dict) else data
        
        # Only split if it has more than MAX_TOPICS_PER_FILE
        if len(topics) > MAX_TOPICS_PER_FILE:
            chunks = [topics[i:i + MAX_TOPICS_PER_FILE] for i in range(0, len(topics), MAX_TOPICS_PER_FILE)]
            
            for i, chunk in enumerate(chunks):
                chunk_data = {
                    "topics": chunk
                }
                
                new_filename = f"{base_name}_s{i+1:02d}.json"
                output_path = os.path.join(INPUT_DIR, new_filename)
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(chunk_data, f, ensure_ascii=False, indent=2)
                
                total_new_files += 1
                
            # Delete the original file
            os.remove(file_path)
            total_deleted_files += 1

    print(f"\nGranular split complete for Themes 1-4.")
    print(f"Original files deleted: {total_deleted_files}")
    print(f"New granular files created: {total_new_files}")

if __name__ == "__main__":
    main()
