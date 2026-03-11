import json
from bs4 import BeautifulSoup
def get_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

with open('Data/shumeic4_data_bilingual.json', 'r') as f:
    data = json.load(f)
    for theme in data['themes']:
        for topic in theme['topics']:
            if topic.get('filename') == 'shokubutu.html':
                pt = get_text(topic.get('content_ptbr', ''))
                ja = get_text(topic.get('content_ja', ''))
                print(f"Title: {topic.get('title_ptbr')}")
                print(f"Len PT: {len(pt)}, Len JA: {len(ja)}")
