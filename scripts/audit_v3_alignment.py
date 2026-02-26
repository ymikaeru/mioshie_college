
import json
import os
import glob

INPUT_DIR = "Data/v3_parts_for_translation"
TRANS_DIR = "Data/v3_translated_parts"

def main():
    input_files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.json")))
    
    mismatches = []
    
    for in_file in input_files:
        basename = os.path.basename(in_file)
        out_file = os.path.join(TRANS_DIR, basename)
        
        if not os.path.exists(out_file):
            print(f"Skipping {basename} - no translation found.")
            continue
            
        with open(in_file, 'r', encoding='utf-8') as f:
            in_data = json.load(f)
        
        with open(out_file, 'r', encoding='utf-8') as f:
            out_data = json.load(f)
            
        if len(in_data) != len(out_data):
            mismatches.append({
                "file": basename,
                "expected": len(in_data),
                "actual": len(out_data)
            })

    if not mismatches:
        print("No length mismatches found! Everything should be aligned.")
    else:
        print(f"Found {len(mismatches)} files with length mismatches:")
        for m in mismatches:
            print(f"  {m['file']}: Expected {m['expected']}, Actual {m['actual']}")

if __name__ == "__main__":
    main()
