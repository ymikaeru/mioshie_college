import os
import glob
import json
import re
from collections import defaultdict

dir_path = "."

split_files = glob.glob(os.path.join(dir_path, "*_s[0-9]*.json"))

groups = defaultdict(list)
pattern = re.compile(r"(.*)_s\d+\.json$")
for f in split_files:
    basename_match = pattern.search(os.path.basename(f))
    if basename_match:
        base_name = basename_match.group(1)
        groups[base_name].append(f)

for base_name, files in groups.items():
    files.sort()
    
    merged_data = []
    for f in files:
        with open(f, "r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, list):
                merged_data.extend(data)
            else:
                merged_data.append(data)
                
    output_file = os.path.join(dir_path, f"{base_name}.json")
    with open(output_file, "w", encoding="utf-8") as out_file:
        json.dump(merged_data, out_file, ensure_ascii=False, indent=2)
    
    print(f"Merged {len(files)} files into {output_file}")
    
    for f in files:
        os.remove(f)
        
print("Merge complete.")
