import json
import os
from bs4 import BeautifulSoup

def analyze_all_files():
    with open('Data/shumeic1_data_bilingual.json', 'r') as f:
        data = json.load(f)

    for theme in data.get('themes', []):
        for topic in theme.get('topics', []):
            source_file = topic.get('source_file') or topic.get('filename')
            if not source_file: continue
            
            filepath = os.path.join('OrigianlHTML', 'shumeic1', source_file.split('/')[-1])
            if not os.path.exists(filepath): continue
            
            try:
                with open(filepath, 'r', encoding='shift_jis') as f:
                    html = f.read()
            except UnicodeDecodeError:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    html = f.read()
                    
            soup = BeautifulSoup(html, 'html.parser')
            for a in soup.find_all('a'):
                a.decompose()
                
            blocks = soup.find_all('blockquote')
            if len(blocks) >= 3:
                extracted = "".join(str(c) for c in blocks[2].contents).strip()
                if len(extracted) > len(topic.get('content', '')) + 500:
                    print(f"File {source_file} truncated! Extracted: {len(extracted)}, JSON: {len(topic.get('content', ''))}")

analyze_all_files()
