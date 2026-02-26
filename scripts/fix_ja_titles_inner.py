import json
import os
import re
from bs4 import BeautifulSoup

DATA_DIR = './Data'
VOLUMES = [
    'shumeic1_data_bilingual.json',
    'shumeic2_data_bilingual.json',
    'shumeic3_data_bilingual.json',
    'shumeic4_data_bilingual.json'
]

def extract_ja_title_from_html(html_content):
    if not html_content:
        return None
        
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Common pattern 1: <b><font size="+2">Title</font></b>
    font_tags = soup.find_all('font', attrs={'size': '+2'})
    for font in font_tags:
        if font.parent and font.parent.name == 'b':
            return font.text.strip()
            
    # Common pattern 2: Just <b>Title</b> or similar
    b_tags = soup.find_all('b')
    for b in b_tags:
        text = b.text.strip()
        if text and len(text) > 5: # reasonable title length
            return text
            
    # Fallback: Just the first reasonable chunk of text
    text = soup.get_text(separator='\n').strip()
    if text:
        first_line = text.split('\n')[0].strip()
        if first_line:
            return first_line
            
    return None

def fix_ja_titles():
    total_updated = 0
    
    for vol_file in VOLUMES:
        json_path = os.path.join(DATA_DIR, vol_file)
        if not os.path.exists(json_path):
            continue
            
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        updated = 0
        for theme in data.get('themes', []):
            for topic in theme.get('topics', []):
                # The raw Japanese HTML is in 'content'
                ja_content = topic.get('content', '')
                if not ja_content:
                    continue
                    
                extracted_title = extract_ja_title_from_html(ja_content)
                if extracted_title:
                    topic['title_ja'] = extracted_title
                    updated += 1
                    
        if updated > 0:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {updated} Japanese titles in {vol_file}")
            total_updated += updated
            
    print(f"Total updated: {total_updated}")

if __name__ == '__main__':
    fix_ja_titles()
