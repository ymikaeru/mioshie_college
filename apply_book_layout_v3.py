import json
import re

path = '/Users/michael/Documents/Ensinamentos/Sites/BR/mioshie_college/SiteModerno/site_data/shumeic1_data_bilingual.json'

# Minimum character count to start a new paragraph when grouping
MIN_PARA_CHARS = 450


def clean_text(text):
    if not text:
        return text

    # 1. Labels premium CSS
    text = re.sub(
        r'(<font[^>]*color=["\']?#990000["\']?[^>]*>|(?:<b>)?)<font[^>]*>Pergunta do [Ff]iel</font>(?:</b>)?'
        r'|(?:<b>)?<font[^>]*color=["\']?#990000["\']?[^>]*>Pergunta do [Ff]iel</font>(?:</b>)?'
        r'|<b><font[^>]*>Pergunta do [Ff]iel</font></b>',
        '<span class="teaching-label-q">Pergunta do fiel</span>',
        text
    )
    text = re.sub(
        r'<b><font[^>]*color=["\']?#0000ff["\']?[^>]*>(Orientação|Resposta|Ensinamento) de Meishu-Sama</font></b>'
        r'|<font[^>]*color=["\']?#0000ff["\']?[^>]*><b>(Orientação|Resposta|Ensinamento) de Meishu-Sama</b></font>',
        '<span class="teaching-label-a">Orientação de Meishu-Sama</span>',
        text
    )

    # 2. Italic → Markdown
    text = text.replace('<i>', '*').replace('</i>', '*')

    # 3. Mark hard paragraph breaks (triple breaks: <br/>\n appearing 3+ times consecutively)
    text = re.sub(r'(<br/>\n){3,}', 'PARA_HARD', text)

    # 4. Split on ALL double line breaks — these are the raw sentence breaks
    sentences = re.split(r'(?:<br/>\n){2}', text)

    # 5. Group sentences into paragraphs
    paragraphs = []
    current = ''

    for seg in sentences:
        seg = seg.strip()
        # Replace remaining single <br/> with space
        seg = seg.replace('<br/>\n', ' ').replace('<br/>', ' ')
        seg = seg.strip()
        if not seg:
            continue

        if 'PARA_HARD' in seg:
            # Split this segment on hard breaks
            parts = seg.split('PARA_HARD')
            for i, part in enumerate(parts):
                part = part.strip()
                if i == 0:
                    # Append to current
                    if part:
                        current = (current + ' ' + part).strip() if current else part
                else:
                    # Hard break: flush current paragraph, start new
                    if current:
                        paragraphs.append(current)
                    current = part
        else:
            # Does the segment start with a label? Always start new paragraph
            if seg.startswith('<span class="teaching-label'):
                if current:
                    paragraphs.append(current)
                current = seg
            # Is the current paragraph already large enough?
            elif current and len(current) >= MIN_PARA_CHARS:
                paragraphs.append(current)
                current = seg
            else:
                # Merge into current paragraph
                current = (current + ' ' + seg).strip() if current else seg

    if current:
        paragraphs.append(current)

    # 6. Reassemble
    text = '\n\n'.join(p for p in paragraphs if p.strip())

    # 7. Cleanup
    text = re.sub(r'  +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.replace('tempoo', 'tempo')
    text = re.sub(r'\(Jinsai\)', '<p class="teaching-signature">(Jinsai)</p>', text)

    return text.strip()


def run():
    print("Carregando JSON...")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Processando tópicos...")
    count = 0
    for theme in data.get('themes', []):
        for topic in theme.get('topics', []):
            if 'content_ptbr' in topic and topic['content_ptbr']:
                topic['content_ptbr'] = clean_text(topic['content_ptbr'])
                count += 1

    print(f"Processados {count} tópicos. Salvando...")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Concluído!")


if __name__ == "__main__":
    run()
