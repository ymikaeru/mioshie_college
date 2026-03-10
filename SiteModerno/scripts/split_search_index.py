import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_path = os.path.join(base_dir, 'site_data', 'search_index.json')
output_dir = os.path.join(base_dir, 'site_data')

print(f"Reading {input_path}...")
with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Loaded {len(data)} entries.")

volumes = {}
for entry in data:
    vol = entry.get('v')
    if not vol:
        continue
    if vol not in volumes:
        volumes[vol] = []
    volumes[vol].append(entry)

for vol, entries in volumes.items():
    output_path = os.path.join(output_dir, f'search_index_{vol}.json')
    print(f"Writing {output_path} ({len(entries)} entries)...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False)

print("Done splitting!")
