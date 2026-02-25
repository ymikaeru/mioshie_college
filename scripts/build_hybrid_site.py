import json
import os
import shutil
from bs4 import BeautifulSoup

DATA_DIR = './Data'
OUTPUT_DIR = './SiteNordico'
ORIGINAL_HTML_DIR = './Data/translated_indexes'
INDEX_FILES = [
    ('shumeic1/index.html', '../', 'shumeic1'),
    ('shumeic1/index2.html', '../', 'shumeic1'),
    ('shumeic2/index.html', '../', 'shumeic2'),
    ('shumeic3/index.html', '../', 'shumeic3'),
    ('shumeic4/index.html', '../', 'shumeic4'),
]

VOLUMES = [
    {'id': 'shumeic1', 'file': 'shumeic1_data_bilingual.json'},
    {'id': 'shumeic2', 'file': 'shumeic2_data_bilingual.json'},
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'}
]

# We will reuse the same CSS
with open('scripts/build_static_site.py', 'r') as f:
    content = f.read()
    css_start = content.find('CSS_CONTENT = """') + 17
    css_end = content.find('"""', css_start)
    CSS_CONTENT = content[css_start:css_end].strip()

READER_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Leitor - Ensinamentos</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="header">
    <a href="shumeic1/index.html" class="header__logo">

      Ensinamentos
    </a>
    <div class="header__nav">
      <a href="#" id="backToIndexBtn">Voltar ao Índice</a>
      <button id="langToggle" class="btn-toggle" style="margin-left:16px;">
        <span class="lang-pt active">PT-BR</span>
        <span class="lang-ja">日本語</span>
      </button>
    </div>
  </header>

<main class="main">
  <article class="reading-pane" id="readerContainer">
    <div style="text-align:center; padding: 40px;">
        <h2 style="color:var(--text-muted); margin-bottom: 8px;">Carregando os dados do ensinamento...</h2>
    </div>
  </article>
</main>
<script src="js/reader.js"></script>
</body>
</html>
"""

READER_JS = r"""document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const volId = params.get('vol');
    const filename = params.get('file');

    const container = document.getElementById('readerContainer');
    const backBtn = document.getElementById('backToIndexBtn');
    const langToggle = document.getElementById('langToggle');

    if (volId) {
        backBtn.href = `${volId}/index2.html`;
    }

    if (!volId || !filename) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:red;">Erro: Volume ou Arquivo não especificado.</div>`;
        return;
    }

    let isPortuguese = true;
    let partsPT = [];
    let partsJA = [];
    let mainTitlePT = "";
    let mainTitleJA = "";
    let dateJA = "";

    try {
        const response = await fetch(`data/${volId}_data_bilingual.json`);
        if (!response.ok) throw new Error("JSON não encontrado");
        const json = await response.json();

        for (const theme of json.themes || []) {
            for (const topic of theme.topics || []) {
                const srcFile = topic.source_file || topic.filename || "";
                if (srcFile.endsWith(filename)) {
                    let ptT = topic.title_ptbr || topic.title_pt || topic.title_pt_br || "";
                    let ptC = topic.content_ptbr || topic.content_pt || topic.content_pt_br || "";
                    let jaT = topic.title || "";
                    let jaC = topic.content || "";
                    
                    if (!mainTitlePT && ptT) mainTitlePT = ptT;
                    if (!mainTitleJA && jaT) mainTitleJA = jaT;
                    if (!dateJA && topic.date) dateJA = topic.date;

                    partsPT.push(ptC);
                    partsJA.push(jaC);
                }
            }
        }

        if (partsPT.length === 0 && partsJA.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 40px;">Tópico não encontrado.</div>`;
            return;
        }

        const render = () => {
            const showTitle = isPortuguese && mainTitlePT ? mainTitlePT : mainTitleJA;
            let contentArray = isPortuguese && partsPT.length && partsPT.some(p => p.trim()) ? partsPT : partsJA;
            
            if (isPortuguese) {
                contentArray = contentArray.map((html, i) => {
                    if (!html) return "";
                    let processed = html;

                    // 0. Convert any remaining **markdown bold** to <b> tags
                    // (Some older translations used markdown instead of HTML)
                    processed = processed.replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>');
                    processed = processed.replace(/\*(.+?)\*/gs, '<i>$1</i>');

                    // 1. Join mid-sentence line breaks (Japanese formatting artifact)
                    // Only joins if there's a lowercase letter on both sides (never near tags).
                    processed = processed.replace(/([a-záéíóúãõç,])\s*<br\s*\/?>\s*([a-záéíóúãõç])/gi, '$1 $2');

                    // 2. Collapse ALL sequences of 2+ <br> to 1 (clean slate)
                    processed = processed.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br>');

                    // 3. Add double <br> before BLOCK-LEVEL colored <font> or standalone <b> tags
                    // These are tags that appear right after a <br> (i.e., at start of a block)
                    // We distinguish block tags: <b> or <font color=...> directly after <br>
                    processed = processed.replace(/<br>\s*(<(?:b|font\s+[^>]*color)[^>]*>)/gi, '<br><br>$1');

                    // 4. Add double <br> after closing </b> or </font> when followed by <br>
                    processed = processed.replace(/(<\/(?:b|font)>)\s*<br>/gi, '$1<br><br>');

                    // 5. Collapse any triple+ sequences that formed to double
                    processed = processed.replace(/(?:<br>\s*){3,}/gi, '<br><br>');

                    // 6. Final whitespace cleanup
                    return processed.replace(/[ ]{2,}/g, ' ').trim();
                });
            }

            // Fix relative image paths — prepend volume folder so images load correctly
            contentArray = contentArray.map(html => {
                if (!html) return "";
                // Only rewrite src values that don't start with http, /, or data:
                return html.replace(/(<img[^>]+src=")(?!https?:\/\/|\/|data:)([^"]+)"/gi, `$1${volId}/$2"`);
            });

            // Extract a plain-text label for each part (for the dropdown)
            const partTitles = contentArray.map((html, idx) => {
                if (!html) return `Parte ${idx + 1}`;
                // Try <font size="+2">...</font> or <b>...</b> for title
                const m = html.match(/<font[^>]*size="[^"]*"\s*>[^<]*<\/font>|<b[^>]*>(.*?)<\/b>/i);
                if (m) {
                    // Strip remaining tags and trim
                    const raw = (m[1] || m[0]).replace(/<[^>]+>/g, '').trim();
                    if (raw.length > 0) return raw.length > 80 ? raw.substring(0, 80) + '…' : raw;
                }
                return `Parte ${idx + 1}`;
            });

            // Wrap each part with an anchor div
            const anchoredParts = contentArray.map((html, idx) =>
                `<div id="topic-section-${idx}">${html}</div>`
            );
            const showContent = anchoredParts.join('<hr style="border:none; border-top:1px dashed #ccc; margin:30px 0;">');

            const warning = isPortuguese && !partsPT.some(p => p.trim())
                ? '<div class="fallback-box">Este tópico ainda não possui tradução. Exibindo o original.</div>'
                : '';

            // Build the dropdown only if there are 2+ parts
            const dropdown = partTitles.length > 1 ? `
                <div class="topic-nav-dropdown">
                    <label for="topicSelect">&#9776; Navegar para:</label>
                    <select id="topicSelect" onchange="
                        const el = document.getElementById('topic-section-' + this.value);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        this.value = '';
                    ">
                        <option value="">— Selecione um tópico —</option>
                        ${partTitles.map((t, idx) => `<option value="${idx}">${idx + 1}. ${t}</option>`).join('')}
                    </select>
                </div>` : '';

            container.innerHTML = `
                ${warning}
                <div class="topic-header">
                    <h1 class="topic-title">${showTitle}</h1>
                    <div class="topic-meta">${dateJA || 'Sem data'}</div>
                </div>
                ${dropdown}
                <div class="topic-content" style="white-space: pre-wrap; word-break: break-word; line-height: 1.8;">
                    ${showContent}
                </div>
            `;
        };
        render();

        langToggle.addEventListener('click', () => {
            isPortuguese = !isPortuguese;
            langToggle.querySelector('.lang-pt').classList.toggle('active', isPortuguese);
            langToggle.querySelector('.lang-ja').classList.toggle('active', !isPortuguese);
            render();
        });

    } catch (err) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:red;">Erro ao carregar dados.</div>`;
    }
});
"""

def create_dirs():
    if os.path.exists(OUTPUT_DIR):
        # We only remove specific subfolders or the whole thing? 
        # Typically we want a clean build of HTMLs.
        shutil.rmtree(OUTPUT_DIR)
    
    os.makedirs(f"{OUTPUT_DIR}/css", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/js", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/data", exist_ok=True)
    
    for vol in ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4', 'shumeic5']:
        os.makedirs(f"{OUTPUT_DIR}/{vol}", exist_ok=True)
        # Copy images from the original source to the volume folder
        src_img_dir = os.path.join('OrigianlHTML', vol)
        if os.path.exists(src_img_dir):
            for f in os.listdir(src_img_dir):
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
                    shutil.copy2(os.path.join(src_img_dir, f), f"{OUTPUT_DIR}/{vol}/{f}")
        
    # Copy JSON data to public data folder so JS can fetch it
    for vol in VOLUMES:
        src = os.path.join(DATA_DIR, vol['file'])
        if os.path.exists(src):
            shutil.copy2(src, f"{OUTPUT_DIR}/data/{vol['file']}")

    # Write asset files
    with open(f"{OUTPUT_DIR}/css/styles.css", "w", encoding="utf-8") as f:
        f.write(CSS_CONTENT)
    with open(f"{OUTPUT_DIR}/reader.html", "w", encoding="utf-8") as f:
        f.write(READER_HTML)
    with open(f"{OUTPUT_DIR}/js/reader.js", "w", encoding="utf-8") as f:
        f.write(READER_JS)

def process_indexes():
    """Reads the Gemini translated index files and rewrites links to use reader.html"""
    for rel_path, level_up, vol_id in INDEX_FILES:
        original_idx_path = os.path.join(ORIGINAL_HTML_DIR, rel_path)
        output_idx_path = os.path.join(OUTPUT_DIR, rel_path)
        
        if not os.path.exists(original_idx_path):
            print(f"Warning: Translated index file {original_idx_path} not found.")
            continue
            
        with open(original_idx_path, 'r', encoding='utf-8') as f:
            html = f.read()
                
        soup = BeautifulSoup(html, 'html.parser')
        
        # Rewrite links to point to reader.html.
        for a in soup.find_all('a'):
            href = a.get('href')
            if not href: continue
            
            # If it's another index, let it be (just ensure it resolves correctly)
            if 'index' in href or href.startswith('http') or href.startswith('#'): 
                continue
                
            # If it links to another volume (like ../shumeic2/index.html), let it be
            if '../' in href and 'index' in href:
                continue
                
            # Otherwise, it's a content page (like sinra1.html)
            filename = href.split('/')[-1]
            a['href'] = f"{level_up}reader.html?vol={vol_id}&file={filename}"
            
        body = soup.find('body')
        inner_content = "".join(str(child) for child in body.children) if body else ""
        
        # Clean Nordic header — no star icon, plain logotype
        # Minimal header — logo only, no nav links
        header = f"""
        <header class="header" style="justify-content:flex-start;">
            <a href="{level_up}shumeic1/index.html" class="header__logo" style="gap:0;letter-spacing:0.5px;">
            Ensinamentos
            </a>
        </header>
        """

        # Strip placeholder text from inner_content (used in sub-indexes)
        inner_content = inner_content.replace('Curso por Correspondência é um site para memorizar os ensinamentos de Meishu-Sama.', '')

        # ── HOME PAGE ──────────────────────────────────────────────────────────
        if rel_path == 'shumeic1/index.html':
            volumes = [
                {
                    'label': 'Volume 1',
                    'subtitle': 'Compilação Plano Divino · Primazia do Espírito · Transição da Noite para o Dia · Culto aos Antepassados',
                    'href': f'{level_up}shumeic1/index2.html'
                },
                {
                    'label': 'Volume 2',
                    'subtitle': 'Compilação Johrei · Método de Saúde Divino · Agricultura Natural',
                    'href': f'{level_up}shumeic2/index.html'
                },
                {
                    'label': 'Volume 3',
                    'subtitle': 'Compilação da Fé',
                    'href': f'{level_up}shumeic3/index.html'
                },
                {
                    'label': 'Volume 4',
                    'subtitle': 'Outros',
                    'href': f'{level_up}shumeic4/index.html'
                },
            ]
            vol_cards = ''.join(f"""
                <a href="{v['href']}" class="vol-card">
                    <span class="vol-card__label">{v['label']}</span>
                    <span class="vol-card__subtitle">{v['subtitle']}</span>
                    <span class="vol-card__arrow">&#8599;</span>
                </a>""" for v in volumes)

            home_body = f"""
                <section class="home-hero">
                    <p class="home-hero__kicker">Ensinamentos de Meishu-Sama</p>
                    <h1 class="home-hero__title">Coletânea de<br>Ensinamentos</h1>
                    <p class="home-hero__desc">Tradução em português das obras de Mokichi Okada,<br>organizadas em quatro volumes temáticos.</p>
                </section>
                <section class="vol-list">
                    {vol_cards}
                </section>"""

            new_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ensinamentos de Meishu-Sama</title>
  <meta name="description" content="Coletânea de Ensinamentos de Meishu-Sama em português — quatro volumes temáticos.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="{level_up}css/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet">
  <style>
    .home-hero {{ padding: 80px 0 48px; }}
    .home-hero__kicker {{ font-family: var(--font-ui); font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }}
    .home-hero__title {{ font-family: var(--font-serif); font-size: clamp(36px, 6vw, 64px); font-weight: 700; color: var(--text-main); line-height: 1.15; margin-bottom: 20px; }}
    .home-hero__desc {{ font-family: var(--font-ui); font-size: 16px; color: var(--text-muted); line-height: 1.7; }}
    .vol-list {{ display: flex; flex-direction: column; gap: 12px; margin-top: 48px; }}
    .vol-card {{ display: flex; flex-direction: column; gap: 8px; padding: 28px 24px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); text-decoration: none; transition: border-color 0.2s, box-shadow 0.2s; position: relative; }}
    .vol-card:hover {{ border-color: var(--accent); box-shadow: 0 4px 20px rgba(0,0,0,.08); }}
    .vol-card__label {{ font-family: var(--font-ui); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); }}
    .vol-card__subtitle {{ font-family: var(--font-serif); font-size: 15px; color: var(--text-main); line-height: 1.5; flex: 1; }}
    .vol-card__arrow {{ font-size: 18px; color: var(--text-muted); align-self: flex-end; transition: transform 0.2s; }}
    .vol-card:hover .vol-card__arrow {{ transform: translate(3px,-3px); color: var(--accent); }}
  </style>
</head>
<body>
{header}
<main class="main">
  <div class="index-page">
{home_body}
  </div>
</main>
</body>
</html>
"""
        else:
            new_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Índice - Ensinamentos</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="{level_up}css/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
{header}
<main class="main">
  <div class="index-page">
    {inner_content}
  </div>
</main>
</body>
</html>
"""
        with open(output_idx_path, 'w', encoding='utf-8') as f:
            f.write(new_html)

create_dirs()
process_indexes()
