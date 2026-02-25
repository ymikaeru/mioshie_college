import json
import os
import shutil
from bs4 import BeautifulSoup

# Configuration
DATA_DIR = './Data'
OUTPUT_DIR = './SiteNordico'
ORIGINAL_HTML_DIR = './Data/translated_indexes'
INDEX_FILES = [
    ('shumeic1/index.html', '../'),        # Main landing
    ('shumeic1/index2.html', '../'),       # Vol 1 Index
    ('shumeic2/index.html', '../'),        # Vol 2 Index
    ('shumeic3/index.html', '../'),        # Vol 3 Index
    ('shumeic4/index.html', '../'),        # Vol 4 Index
]

VOLUMES = [
    {'id': 'shumeic1', 'file': 'shumeic1_data_bilingual.json'},
    {'id': 'shumeic2', 'file': 'shumeic2_data_bilingual.json'},
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'}
]

CSS_CONTENT = """
/* ============================================
   SHUMEI TEACHINGS — Light Nordic Edition
   ============================================ */
:root {
  --bg-color: #F9F9F7;
  --surface: #FFFFFF;
  --text-main: #2C3539;
  --text-muted: #8A9A9D;
  --accent: #5B7A8C; 
  --accent-hover: #455D6B;
  --border: #E8ECEF;
  --shadow: 0 4px 20px rgba(44, 53, 57, 0.04);
  --shadow-sm: 0 2px 8px rgba(44, 53, 57, 0.03);
  --radius: 8px;
  --radius-lg: 12px;
  --font-ui: 'Inter', sans-serif;
  --font-serif: 'Noto Serif JP', serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: var(--font-ui); 
  background: var(--bg-color); 
  color: var(--text-main); 
  line-height: 1.8; 
  font-size: 16px; 
  -webkit-font-smoothing: antialiased;
}
.header { 
  position: sticky; 
  top: 0; 
  background: var(--surface); 
  border-bottom: 1px solid var(--border); 
  z-index: 100; 
  box-shadow: var(--shadow-sm); 
  padding: 12px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header__logo { 
  display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: var(--text-main); text-decoration: none;
}
.header__logo svg { color: var(--accent); }
.header__nav { display: flex; gap: 16px; align-items: center; }
.header__nav a { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: 0.2s; }
.header__nav a:hover { color: var(--accent); }
.btn-toggle { 
  background: var(--bg-color); border: 1px solid var(--border); border-radius: 20px; display: flex; cursor: pointer; padding: 2px; 
}
.btn-toggle span { padding: 4px 14px; font-size: 12px; font-weight: 500; color: var(--text-muted); border-radius: 16px; transition: 0.2s; }
.btn-toggle span.active { background: var(--surface); color: var(--text-main); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.main { padding: 48px 24px; display: flex; justify-content: center; min-height: calc(100vh - 70px); }
.reading-pane { 
  max-width: 800px; width: 100%; background: var(--surface); padding: 56px 72px; 
  border-radius: var(--radius-lg); box-shadow: var(--shadow); border: 1px solid var(--border); 
}

.topic-header { text-align: center; margin-bottom: 48px; }
.topic-title { font-family: var(--font-serif); font-size: 28px; color: var(--text-main); margin-bottom: 16px; line-height: 1.5; }
.topic-meta { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

.topic-content { font-family: var(--font-serif); font-size: 17.5px; line-height: 2.1; color: var(--text-main); }
.topic-content b { font-weight: 700; }
.topic-content font[size="+2"], .topic-content font[size="+1"] { font-weight: 700; }
.topic-content font[color] { /* font color attributes respected from HTML */ }
.topic-content hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
.topic-content img { max-width: 100%; border-radius: var(--radius); margin: 16px 0; }

/* Topic navigation dropdown */
.topic-nav-dropdown { display: flex; align-items: center; gap: 12px; margin: 0 0 28px 0; padding: 14px 18px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); flex-wrap: wrap; }
.topic-nav-dropdown label { font-family: var(--font-ui); font-size: 13px; font-weight: 600; color: var(--text-muted); white-space: nowrap; letter-spacing: 0.5px; }
.topic-nav-dropdown select { flex: 1; min-width: 200px; padding: 8px 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text-main); font-family: var(--font-serif); font-size: 14px; cursor: pointer; outline: none; transition: border-color 0.2s; }
.topic-nav-dropdown select:focus, .topic-nav-dropdown select:hover { border-color: var(--accent); }


.topic-nav { display: flex; justify-content: space-between; margin-top: 64px; padding-top: 40px; border-top: 1px solid var(--border); }
.btn-nav { display: inline-flex; align-items: center; gap: 8px; color: var(--accent); font-family: var(--font-ui); font-size: 14px; font-weight: 500; text-decoration: none; transition: 0.2s; }
.btn-nav:hover { color: var(--accent-hover); text-decoration: underline; }

.index-page { max-width: 800px; margin: 0 auto; width: 100%; font-family: var(--font-ui); background: var(--surface); padding: 40px; border-radius: var(--radius-lg); box-shadow: var(--shadow); border: 1px solid var(--border);  }
.index-page hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
.index-page font[color="#0000ff"] { display: block; font-size: 20px; color: var(--accent) !important; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.index-page font { color: inherit !important; font-family: inherit !important; font-size: inherit !important; }
.index-page a { color: var(--text-main); text-decoration: none; font-size: 15px; transition: 0.2s; display: inline-block; padding: 4px 0; }
.index-page a:hover { color: var(--accent); transform: translateX(4px); }
.index-page br { content: ""; margin: 4px; display: block; }
.index-page img { max-width: 100%; border-radius: var(--radius); margin: 24px 0; }

.fallback-box { background: #FFF9E6; color: #856404; padding: 12px 16px; border-radius: var(--radius); margin-bottom: 32px; border: 1px solid #FFEEBA; font-size: 13px; text-align: center; }
.lang-ja-content { display: none; }

@media (max-width: 768px) {
  .reading-pane { padding: 32px 24px; }
  .topic-title { font-size: 22px; }
}
"""

JS_CONTENT = """
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('langToggle');
  if (!toggleBtn) return;
  
  let currentLang = 'pt';
  const ptTitles = document.querySelectorAll('.lang-pt-title');
  const jaTitles = document.querySelectorAll('.lang-ja-title');
  const ptContents = document.querySelectorAll('.lang-pt-content');
  const jaContents = document.querySelectorAll('.lang-ja-content');
  
  const spanPt = toggleBtn.querySelector('.lang-pt');
  const spanJa = toggleBtn.querySelector('.lang-ja');

  toggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'pt' ? 'ja' : 'pt';
    
    if (currentLang === 'pt') {
      spanPt.classList.add('active');
      spanJa.classList.remove('active');
      ptTitles.forEach(el => el.style.display = 'block');
      ptContents.forEach(el => el.style.display = 'block');
      jaTitles.forEach(el => el.style.display = 'none');
      jaContents.forEach(el => el.style.display = 'none');
    } else {
      spanJa.classList.add('active');
      spanPt.classList.remove('active');
      jaTitles.forEach(el => el.style.display = 'block');
      jaContents.forEach(el => el.style.display = 'block');
      ptTitles.forEach(el => el.style.display = 'none');
      ptContents.forEach(el => el.style.display = 'none');
    }
  });
});
"""

def create_dirs():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(f"{OUTPUT_DIR}/css")
    os.makedirs(f"{OUTPUT_DIR}/js")
    for vol in ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4', 'shumeic5']:
        os.makedirs(f"{OUTPUT_DIR}/{vol}", exist_ok=True)

    with open(f"{OUTPUT_DIR}/css/styles.css", "w", encoding="utf-8") as f:
        f.write(CSS_CONTENT)
    with open(f"{OUTPUT_DIR}/js/toggle.js", "w", encoding="utf-8") as f:
        f.write(JS_CONTENT)

def get_header_html(level_up=""):
    return f"""
  <header class="header">
    <a href="{level_up}shumeic1/index.html" class="header__logo">

      Ensinamentos
    </a>
    <div class="header__nav">
      <a href="{level_up}shumeic1/index.html">Início</a>
      <a href="{level_up}shumeic1/index2.html">Vol 1</a>
      <a href="{level_up}shumeic2/index.html">Vol 2</a>
      <a href="{level_up}shumeic3/index.html">Vol 3</a>
      <a href="{level_up}shumeic4/index.html">Vol 4</a>
    </div>
  </header>
"""

# Store all translated titles globally
ALL_TOPICS = {} # filename -> {'pt_title': '...', 'ja_title': '...'}
ALL_FLAT_TOPICS = []

def load_all_json_data():
    global ALL_TOPICS, ALL_FLAT_TOPICS
    for vol in VOLUMES:
        filepath = os.path.join(DATA_DIR, vol['file'])
        if not os.path.exists(filepath):
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
            for theme in data.get("themes", []):
                for topic in theme.get("topics", []):
                    pt_title = topic.get("title_ptbr") or topic.get("title_pt") or topic.get("title_pt_br") or ""
                    ja_title = topic.get("title", "")
                    
                    filename = topic.get("source_file") or topic.get("filename", "")
                    if "/" in filename:
                        filename = filename.split("/")[-1]
                    
                    if filename:
                        ALL_TOPICS[filename] = {
                            "pt_title": pt_title,
                            "ja_title": ja_title
                        }
                    
                    # Also keep flat topics for generating individual pages
                    ALL_FLAT_TOPICS.append({
                        "vol_id": vol['id'],
                        "topic": topic
                    })



def process_original_indexes():
    """Reads the OriginalHTML index files, injects Portuguese titles, and applies Nordic CSS"""
    for rel_path, level_up in INDEX_FILES:
        original_idx_path = os.path.join(ORIGINAL_HTML_DIR, rel_path)
        output_idx_path = os.path.join(OUTPUT_DIR, rel_path)
        
        if not os.path.exists(original_idx_path):
            print(f"Warning: Original index file {original_idx_path} not found.")
            continue
            
        # Many Japanese HTML files are encoded in shift_jis or euc_jp/utf-8
        try:
            with open(original_idx_path, 'r', encoding='shift_jis') as f:
                html = f.read()
        except UnicodeDecodeError:
            with open(original_idx_path, 'r', encoding='utf-8', errors='ignore') as f:
                html = f.read()
                
        soup = BeautifulSoup(html, 'html.parser')
        
        # We need to extract the actual content. Usually it's nestled in BODY > BLOCKQUOTE
        # Try to find the inner content wrapper to drop the yellow background and weird tables
        body = soup.find('body')
        inner_content = ""
        if body:
            # We just take all children of body
            inner_content = "".join(str(child) for child in body.children)
            
        # For shumeic1/index.html, there's a specific title text we can translate:
        inner_content = inner_content.replace('Curso por Correspondência é um site para memorizar os ensinamentos de Meishu-Sama.', 'Este sistema replica a arquitetura estática original, atualizada com as traduções em português.')
        
        # Exact main index links translation
        inner_content = inner_content.replace('1.Compilação Plano Divino・Primazia do Espírito・Transição da Noite para o Dia・Culto aos Antepassados', '1. Volume 1')
        inner_content = inner_content.replace('2.Compilação Johrei・Método de Saúde Divino・Agricultura Natural', '2. Volume 2')
        inner_content = inner_content.replace('3.Compilação da Fé', '3. Volume 3')
        inner_content = inner_content.replace('4.Outros', '4. Volume 4')
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
{get_header_html(level_up)}
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


def generate_all_topic_pages():
    for current_index, item in enumerate(ALL_FLAT_TOPICS):
        vol_id = item["vol_id"]
        topic = item["topic"]
        
        # Handle language keys
        pt_title = topic.get("title_ptbr") or topic.get("title_pt") or topic.get("title_pt_br") or ""
        pt_content = topic.get("content_ptbr") or topic.get("content_pt") or topic.get("content_pt_br") or ""
        ja_title = topic.get("title", "")
        ja_content = topic.get("content", "")
        date = topic.get("date", "")
        
        # Filename
        filename = topic.get("source_file") or topic.get("filename", "")
        if "/" in filename:
            filename = filename.split("/")[-1]
        if not filename:
            continue

        # Prev/Next links
        prev_link = ""
        next_link = ""
        
        # For simplicity, we create navigation links bounding exactly within ALL_FLAT_TOPICS
        if current_index > 0:
            prev_item = ALL_FLAT_TOPICS[current_index - 1]
            prev_f = prev_item["topic"].get("source_file") or prev_item["topic"].get("filename", "")
            if "/" in prev_f: prev_f = prev_f.split("/")[-1]
            
            # If changing volumes, need to back out of directory
            href = prev_f if prev_item["vol_id"] == vol_id else f"../{prev_item['vol_id']}/{prev_f}"
            
            prev_link = f'<a href="{href}" class="btn-nav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> Anterior</a>'
        else:
            prev_link = '<div></div>'
            
        if current_index < len(ALL_FLAT_TOPICS) - 1:
            next_item = ALL_FLAT_TOPICS[current_index + 1]
            next_f = next_item["topic"].get("source_file") or next_item["topic"].get("filename", "")
            if "/" in next_f: next_f = next_f.split("/")[-1]
            
            href = next_f if next_item["vol_id"] == vol_id else f"../{next_item['vol_id']}/{next_f}"
            
            next_link = f'<a href="{href}" class="btn-nav">Próximo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></a>'
        else:
            next_link = '<div></div>'

        # Fallback system if PT doesn't exist
        has_pt = bool(pt_content.strip())
        
        warning = ""
        if not has_pt:
            pt_title = ja_title
            pt_content = ja_content
            warning = '<div class="fallback-box">Este tópico ainda não possui tradução para o português. Exibindo o original.</div>'

        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>{pt_title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../css/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="header">
    <a href="../shumeic1/index.html" class="header__logo">

      Ensinamentos
    </a>
    <div class="header__nav">
      <a href="index.html">Índice do Volume</a>
      <button id="langToggle" class="btn-toggle" style="margin-left:16px;">
        <span class="lang-pt active">PT-BR</span>
        <span class="lang-ja">日本語</span>
      </button>
    </div>
  </header>

<main class="main">
  <article class="reading-pane">
    {warning}
    <div class="topic-header">
      <h1 class="topic-title lang-pt-title">{pt_title}</h1>
      <h1 class="topic-title lang-ja-title" style="display:none">{ja_title}</h1>
      <div class="topic-meta">
        {date}
      </div>
    </div>
    
    <div class="topic-content lang-pt-content">
      {pt_content}
    </div>
    <div class="topic-content lang-ja-content" style="display:none">
      {ja_content}
    </div>

    <div class="topic-nav">
      {prev_link}
      {next_link}
    </div>
  </article>
</main>
<script src="../js/toggle.js"></script>
</body>
</html>
"""
        filepath = f"{OUTPUT_DIR}/{vol_id}/{filename}"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)


if __name__ == "__main__":
    print(f"Starting Static Site Generation in {OUTPUT_DIR}...")
    create_dirs()
    print("Loading JSON data...")
    load_all_json_data()
    print("Processing original index files...")
    process_original_indexes()
    print("Generating individual topic pages...")
    generate_all_topic_pages()
    print("Generation complete!")
