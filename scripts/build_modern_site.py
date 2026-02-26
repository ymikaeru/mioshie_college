import json
import os
import shutil
import re
from bs4 import BeautifulSoup, Comment

# Configuration
DATA_DIR = './Data'
OUTPUT_DIR = './SiteModerno'
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
    {'id': 'shumeic3', 'file': 'shumeic3_data_bilingual.json'},
    {'id': 'shumeic4', 'file': 'shumeic4_data_bilingual.json'}
]

CSS_CONTENT = """
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

:root {
  /* Color Palette - Sakura Zen (Light) */
  --bg-color: #F8F9F5;
  --surface: #FFFFFF;
  --surface-rgb: 255, 255, 255;
  --text-main: #1C1C1E;
  --text-muted: #6E6E73;
  --accent: #B8860B; /* Muted Zen Gold */
  --accent-soft: rgba(184, 134, 11, 0.1);
  --border: #E5E5E0;
  --shadow-premium: 0 20px 50px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.02);
  
  /* Typography */
  --font-ui: 'Outfit', -apple-system, sans-serif;
  --font-serif: 'Crimson Pro', serif;
  
  /* Layout */
  --max-width-content: 720px;
  --container-width: 1040px;
  --nav-height: 80px;
  --radius: 16px;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --bg-color: #0D0D12;
  --surface: #15151A;
  --surface-rgb: 21, 21, 26;
  --text-main: #E2E2E6;
  --text-muted: #8E8E93;
  --accent: #D4AF37;
  --border: #2C2C31;
}

*, *::before, *::after { 
  box-sizing: border-box; 
  margin: 0; 
  padding: 0; 
}

html { 
  scroll-behavior: smooth;
  scroll-padding-top: 100px;
}

body { 
  font-family: var(--font-ui); 
  background: var(--bg-color); 
  color: var(--text-main); 
  line-height: 1.6; 
  font-size: 17px; 
  -webkit-font-smoothing: antialiased;
  transition: background 0.5s var(--ease), color 0.5s var(--ease);
}

/* --- Premium Header --- */
.header { 
  position: sticky; 
  top: 0; 
  background: rgba(var(--surface-rgb), 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border); 
  z-index: 2000; 
  height: var(--nav-height);
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  text-decoration: none;
  color: var(--text-main);
}
.logo-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--accent);
}

.header__nav { 
  display: flex; 
  gap: 32px; 
  align-items: center; 
}
.header__nav a { 
  font-size: 13px; 
  font-weight: 500; 
  color: var(--text-muted); 
  text-decoration: none; 
  transition: all 0.3s var(--ease);
  letter-spacing: 0.5px;
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 100%;
}
.header__nav a span {
  position: relative;
  padding: 4px 0;
}
.header__nav a span::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1.5px;
  background: var(--accent);
  transition: width 0.3s var(--ease);
}
.header__nav a:hover { color: var(--text-main); }
.header__nav a:hover span::after { width: 100%; }

/* --- Main Layout --- */
.main { 
  padding: 60px 40px; 
  display: flex; 
  justify-content: center; 
  min-height: calc(100vh - var(--nav-height)); 
}

/* --- Index Page & Cards --- */
.content-wrapper {
  max-width: var(--container-width);
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}

.glass-pane { 
  background: var(--surface); 
  padding: 80px; 
  border-radius: var(--radius); 
  box-shadow: var(--shadow-premium); 
  border: 1px solid var(--border);
  animation: fadeIn 0.8s var(--ease);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Index Hierarchy */
.index-title {
  font-family: var(--font-serif);
  font-size: 48px;
  color: var(--text-main);
  margin-bottom: 56px;
  text-align: center;
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 24px;
  text-align: center;
}

/* Card-based Index */
.topic-list {
  display: grid;
  gap: 16px;
}

.topic-card {
  display: flex;
  align-items: center;
  padding: 24px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all 0.3s ease;
}

.topic-card:hover {
  border-color: var(--accent);
  transform: translateX(8px);
  box-shadow: var(--shadow-sm);
  background: var(--accent-soft);
}

.topic-card__icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
}

.topic-card__title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
}

/* --- Index Structure (Themes & Spacing) --- */
.section-header {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  margin: 40px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent-soft);
  display: block;
}

.plain-text {
  font-size: 15px;
  color: var(--text-muted);
  margin-top: 12px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.group-spacer {
  height: 32px;
  width: 100%;
}

/* --- Reader View --- */
.reader-container {
  max-width: var(--max-width-content);
  margin: 0 auto;
}

.breadcrumbs {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 48px;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  gap: 8px;
}
.breadcrumbs span { color: var(--border); }
.breadcrumbs a { color: inherit; text-decoration: none; transition: color 0.2s; }
.breadcrumbs a:hover { color: var(--accent); }

.topic-header { text-align: center; margin-bottom: 64px; }
.topic-header * { color: inherit !important; }
.topic-title-large { 
  font-family: var(--font-serif); 
  font-size: 42px; 
  font-weight: 700;
  color: var(--text-main) !important; 
  margin-bottom: 16px; 
  line-height: 1.2; 
}
.topic-meta { font-size: 14px; color: var(--text-muted); letter-spacing: 0.5px; }

.topic-content { 
  font-family: var(--font-serif); 
  font-size: 21px; 
  line-height: 2.1; 
  color: var(--text-main);
  font-weight: 400;
}
.topic-content * { color: inherit !important; }

.topic-content b { font-weight: 700; }
.topic-content p { margin-bottom: 32px; }

/* --- Controls --- */
.controls {
  display: flex;
  gap: 12px;
}

.btn-zen {
  padding: 8px 16px;
  border-radius: 24px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  text-align: center;
  display: flex; /* Added from original, assuming it was intended to be kept */
  align-items: center; /* Added from original, assuming it was intended to be kept */
  gap: 8px; /* Added from original, assuming it was intended to be kept */
}
.btn-zen:hover, .btn-zen:focus {
  border-color: var(--accent);
  background: rgba(184, 134, 11, 0.05);
}
.btn-zen option {
  background: var(--surface);
  color: var(--text-main);
}
.btn-zen.active { background: var(--text-main); color: var(--surface); border-color: var(--text-main); }

/* --- Mobile Fixes --- */
/* --- Tooltips --- */
[data-tooltip] {
  position: relative;
}
[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  background: #2c2c2c;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  width: max-content;
  max-width: 280px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 4px 25px rgba(0,0,0,0.4);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
}
[data-tooltip]:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(12px);
}
/* Tooltip Arrow */
[data-tooltip]:hover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #2c2c2c transparent;
  opacity: 1;
  visibility: visible;
  z-index: 9999;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
[data-tooltip]:hover::after {
  transform: translateX(-50%) translateY(0);
}
/* Reset for select which doesn't support pseudos well */
select[data-tooltip]::before, select[data-tooltip]::after {
  display: none !important;
}

@media (max-width: 768px) {
  .header { padding: 0 24px; }
  .glass-pane { padding: 48px 24px; }
  .topic-title-large { font-size: 32px; }
  .topic-content { font-size: 19px; }
}
"""

JS_CONTENT = r"""
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});

async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
"""

READER_JS = r"""
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const volId = params.get('vol');
    const filename = params.get('file');
    const container = document.getElementById('readerContainer');
    
    if (!volId || !filename) {
        container.innerHTML = `<div class="error">Selecione um ensinamento no índice.</div>`;
        return;
    }

    try {
        const response = await fetch(`data/${volId}_data_bilingual.json`);
        const json = await response.json();
        let topicsFound = [];

        for (const theme of json.themes || []) {
            for (const topic of theme.topics || []) {
                const srcFile = topic.source_file || topic.filename || "";
                if (srcFile === filename || srcFile.endsWith('/' + filename)) {
                    topicsFound.push(topic);
                }
            }
        }

        if (topicsFound.length === 0) {
            container.innerHTML = `<div class="error">Tópico não encontrado.</div>`;
            return;
        }

        window.renderContent = (lang = 'pt') => {
            const isPt = lang === 'pt';
            
            let fullHtml = '';
            const select = document.getElementById('readerTopicSelect');
            if (select) {
                select.innerHTML = '<option value="">Navegação por Publicações</option>';
                select.style.display = topicsFound.length > 1 ? 'inline-block' : 'none';
            }
            
            topicsFound.forEach((topicData, index) => {
                const title = isPt ? (topicData.title_ptbr || topicData.title_pt || topicData.title) : topicData.title;
                const content = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content) : topicData.content;
                const topicId = `topic-${index}`;

                if (select) {
                    const opt = document.createElement('option');
                    opt.value = `#${topicId}`;
                    opt.textContent = title;
                    select.appendChild(opt);
                }
                
                // Clean up content: wrap double breaks in paragraphs if needed, or maintain HTML
                let formattedContent = content.replace(/\n\n/g, '</p><p>');

                // Fix image paths to point to assets/images/
                formattedContent = formattedContent.replace(/src=["']([^"']+)["']/g, (match, src) => {
                    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('assets/')) return match;
                    return `src="assets/images/${src}"`;
                });

                // NO separator line here to avoid double lines and follow user request
                // Strip legacy font colors that might cause "strange blue" headings
                let cleanedContent = formattedContent.replace(/color=["'][^"']+["']/g, '');
                cleanedContent = cleanedContent.replace(/style=["'][^"']*color:[^"']+["']/g, '');

                fullHtml += `
                    <div id="${topicId}" class="topic-header" style="margin-top: ${index > 0 ? '80px' : '0'}; border-top: ${index > 0 ? '1px solid var(--border)' : 'none'}; padding-top: ${index > 0 ? '40px' : '0'};">
                        <h1 class="topic-title-large">${title}</h1>
                        <div class="topic-meta">${topicData.date || 'Sem data'}</div>
                    </div>
                    <div class="topic-content">
                        ${cleanedContent}
                    </div>
                `;
            });

            container.innerHTML = `
                <nav class="breadcrumbs">
                    <a href="shumeic1/index.html">Início</a> <span>/</span> 
                    <a href="${volId}/index.html">Volume ${volId.slice(-1)}</a> <span>/</span>
                    <span style="color:var(--text-main)">Leitura</span>
                </nav>
                <div class="reader-container">
                    ${fullHtml}
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        renderContent('pt');

    } catch (err) {
        container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
    }
});

function setLanguage(lang) {
    document.querySelectorAll('.btn-zen').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
    if(window.renderContent) window.renderContent(lang);
}
"""

READER_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ensinamentos de Meishu-Sama - Leitura</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="header">
    <a href="shumeic1/index.html" class="header__logo">
      <div class="logo-circle">
        <div class="logo-dot"></div>
      </div>
      Biblioteca Sagrada
    </a>
    <div class="header__nav">
       <a href="shumeic1/index.html" data-tooltip="Mundo Espiritual・Espírito Precede a Matéria・Transição da Noite para o Dia・Culto aos Antepassados"><span>Vol 1</span></a>
       <a href="shumeic2/index.html" data-tooltip="Johrei・Método Divino de Saúde・Agricultura Natural"><span>Vol 2</span></a>
       <a href="shumeic3/index.html" data-tooltip="Seção da Fé"><span>Vol 3</span></a>
       <a href="shumeic4/index.html" data-tooltip="Outros Ensinamentos"><span>Vol 4</span></a>
       <select id="readerTopicSelect" class="btn-zen" onchange="location.hash=this.value" style="max-width:250px; display:none;">
            <option value="">Navegação por Publicações</option>
       </select>
    </div>
    <div class="controls">
      <button class="btn-zen active" id="btn-pt" onclick="setLanguage('pt')">PT-BR</button>
      <button class="btn-zen" id="btn-ja" onclick="setLanguage('ja')">日本語</button>
      <button class="btn-zen" onclick="toggleTheme()" title="Mudar Tema">☯</button>
    </div>
  </header>
  <main class="main">
    <div class="glass-pane" id="readerContainer">
        <div style="text-align:center; color:var(--text-muted)">Preparando leitura...</div>
    </div>
  </main>
  <script src="js/toggle.js"></script>
  <script src="js/reader.js"></script>
</body>
</html>
"""

def create_dirs():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(f"{OUTPUT_DIR}/css", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/js", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/data", exist_ok=True)
    for vol in ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']:
        os.makedirs(f"{OUTPUT_DIR}/{vol}", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/assets/images", exist_ok=True)

    with open(f"{OUTPUT_DIR}/css/styles.css", "w", encoding="utf-8") as f:
        f.write(CSS_CONTENT)
    with open(f"{OUTPUT_DIR}/reader.html", "w", encoding="utf-8") as f:
        f.write(READER_HTML)
    with open(f"{OUTPUT_DIR}/js/reader.js", "w", encoding="utf-8") as f:
        f.write(READER_JS)
    with open(f"{OUTPUT_DIR}/js/toggle.js", "w", encoding="utf-8") as f:
        f.write(JS_CONTENT)

def process_indexes():
    """Processes the original HTML indexes to maintain themes, spacing, and hierarchy."""
    for rel_path, level_up, vol_id in INDEX_FILES:
        src = os.path.join(ORIGINAL_HTML_DIR, rel_path)
        dest = os.path.join(OUTPUT_DIR, rel_path)
        
        if not os.path.exists(src): 
            print(f"Warning: {src} not found.")
            continue
            
        with open(src, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Basic cleanup of old hosting artifacts
            content = re.sub(r'<!-- geoguide start -->.*?<!-- geoguide end -->', '', content, flags=re.DOTALL)
            content = re.sub(r'<!-- text below generated by geocities\.jp -->.*$', '', content, flags=re.DOTALL)
            soup = BeautifulSoup(content, 'html.parser')
            
        # Target the main content area (usually inside blockquotes)
        main_content = soup.find('body')
        if not main_content: continue

        # We want to traverse elements and maintain order/grouping
        processed_elements = []
        topic_count = 1

        def clean_text(text):
            if not text: return ""
            # Fix known broken words from original formatting
            text = text.replace('Verda　de', 'Verdade')
            text = text.replace('Supersti　ção', 'Superstição')
            text = text.replace('Budis　mo', 'Budismo')
            text = text.replace('Fan　tasma', 'Fantasma')
            text = text.replace('Espí　rito', 'Espírito')
            
            # Replace remaining full-width spaces with regular space
            text = text.replace('　', ' ')
            # Collapse multiple spaces and strip
            return re.sub(r'\s+', ' ', text).strip()

        section_headers = []
        def traverse_and_convert(element):
            nonlocal topic_count
            html_parts = []
            last_was_topic = False
            last_was_br = False
            
            for child in element.children:
                # Ignore comments and scripts
                if child.name == 'script' or isinstance(child, (Comment)):
                    continue
                    
                if child.name == 'a':
                    href = child.get('href', '')
                    # Navigation / Index links are handled specially
                    if not href or 'index' in href or href.startswith('http') or href.startswith('#'):
                        continue
                    
                    filename = href.split('/')[-1]
                    title = clean_text(child.get_text().replace('・', ''))
                    html_parts.append(f"""
                    <a href="{level_up}reader.html?vol={vol_id}&file={filename}" class="topic-card">
                        <div class="topic-card__icon">{topic_count}</div>
                        <div class="topic-card__title">{title}</div>
                    </a>""")
                    topic_count += 1
                    last_was_topic = True
                    last_was_br = False
                
                elif child.name == 'br':
                    # If it follows a topic, it's just a line break (standard gap)
                    # If it follows another BR, it's an intentional group gap
                    if last_was_br:
                        html_parts.append('<div class="group-spacer"></div>')
                    elif not last_was_topic:
                        # BR at start or after other text
                        html_parts.append('<div style="height: 12px;"></div>')
                    
                    last_was_br = True
                    last_was_topic = False
                
                elif child.name == 'hr':
                    # Skip HR if it follows a section header to keep it clean
                    if html_parts and '<div class="section-header">' in html_parts[-1]:
                        continue
                    html_parts.append('<hr style="border:none; border-top:1px solid var(--border); margin: 32px 0; opacity: 0.5;">')
                    last_was_topic = False
                    last_was_br = False
                
                elif child.name in ['font', 'p', 'div', 'blockquote']:
                    # Recursive call to handle nested structures
                    text = clean_text(child.get_text())
                    if not child.find('a') and text:
                        # Skip boilerplate but allow titles
                        skip_list = [
                            "editada por membros da Shinji Shumeikai",
                            "Operado por um indivíduo e sem relação",
                            "Coletânea de Ensinamentos de Meishu-sama",
                            "por membros da Shinji Shumeikai",
                            "Mestre Mokichi Okada"
                        ]
                        if any(x in text for x in skip_list):
                            continue
                        
                        # Clean up "Curso por Correspondência" from headers
                        title_clean = text.replace("Curso por Correspondência", "").strip()
                        if title_clean == "Outros":
                            continue
                        # Strip "Volume X: " prefixes for dropdown
                        dropdown_title = re.sub(r'^Volume\s+\d+[:\-]?\s*', '', title_clean, flags=re.IGNORECASE)
                        
                        # Special handling for thematic summary list (contains bullets/dots and multiple themes)
                        is_thematic_list = ('・' in title_clean or ' • ' in title_clean) and len(title_clean) > 20
                        
                        if is_thematic_list:
                            # Skip rendering it in the body since it's now in the header
                            last_was_topic = False
                            last_was_br = False
                            continue

                        header_id = f"section-{len(section_headers)}"
                        section_headers.append({'id': header_id, 'title': dropdown_title})
                        html_parts.append(f'<{child.name} id="{header_id}" class="section-header">{title_clean}</{child.name}>')
                        last_was_topic = False
                        last_was_br = False
                    else:
                        inner = traverse_and_convert(child)
                        if inner:
                            html_parts.append(inner)
                            last_was_topic = False
                            last_was_br = False
                
                elif isinstance(child, str):
                    text = clean_text(child)
                    if text and len(text) > 1:
                        # Categorize as header if short and no link
                        if len(text) < 50:
                            if text == "Outros":
                                continue
                            # Strip "Volume X: " prefixes for dropdown
                            dropdown_title = re.sub(r'^Volume\s+\d+[:\-]?\s*', '', text, flags=re.IGNORECASE)
                            
                            is_thematic_list = ('・' in text or ' • ' in text) and len(text) > 20
                            if is_thematic_list:
                                # Skip rendering it in the body since it's now in the header
                                last_was_topic = False
                                last_was_br = False
                                continue

                            header_id = f"section-{len(section_headers)}"
                            section_headers.append({'id': header_id, 'title': dropdown_title})
                            html_parts.append(f'<div id="{header_id}" class="section-header">{text}</div>')
                        else:
                            html_parts.append(f'<div class="plain-text">{text}</div>')
                        last_was_topic = False
                        last_was_br = False
            
            return "".join(html_parts)

        # Build custom content for shumeic1/index.html (Home)
        if 'shumeic1/index.html' == rel_path:
            content_html = f"""
            <div class="home-hero">
                
                <h1 class="index-title" style="margin-bottom:16px">Ensinamentos de Meishu-Sama</h1>
                <p style="text-align:center; color:var(--text-muted); margin-bottom:48px; max-width:600px; margin-inline:auto;">
                    Tradução em português das obras de Meishu-Sama, organizadas em volumes temáticos para estudo e reflexão.
                </p>
                <div class="topic-list" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                    <a href="index2.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 1</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">Mundo Espiritual</div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">Primazia do Espírito, Transição da Noite para o Dia e Culto aos Antepassados.</div>
                    </a>
                    <a href="../shumeic2/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 2</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">Johrei</div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">Método de Saúde Divino e Agricultura Natural (Salvação pelo Belo e pelo Alimento).</div>
                    </a>
                    <a href="../shumeic3/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 3</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">Seção da Fé</div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">A essência da verdadeira fé e o caminho para o paraíso terrestre.</div>
                    </a>
                    <a href="../shumeic4/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 4</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">Outros Ensinamentos</div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">Coletânea de teses diversas e sermões complementares.</div>
                    </a>
                </div>
            </div>
            """
        else:
            vol_label = ""
            main_title = "Índice de Ensinamentos"
            
            if 'shumeic1' in rel_path: 
                vol_label = "COLETÂNEA OFICIAL • VOLUME 1"
                main_title = "Mundo Espiritual<br>Espírito Precede a Matéria<br>Transição da Noite para o Dia<br>Culto aos Antepassados"
            elif 'shumeic2' in rel_path: 
                vol_label = "COLETÂNEA OFICIAL • VOLUME 2"
                main_title = "Johrei • Método Divino de Saúde • Agricultura Natural"
            elif 'shumeic3' in rel_path: 
                vol_label = "COLETÂNEA OFICIAL • VOLUME 3"
                main_title = "Seção da Fé"
            elif 'shumeic4' in rel_path: 
                vol_label = "COLETÂNEA OFICIAL • VOLUME 4"
                main_title = "Outros Ensinamentos"
            
            main_elements_html = traverse_and_convert(main_content)
            content_html = f"""
            <div class="index-header" style="text-align:center; margin-bottom: 64px;">
                <span class="section-label" style="color: var(--accent); font-weight: 600; letter-spacing: 2px;">{vol_label}</span>
                <h1 class="index-title" style="margin-top: 16px; font-size: 2.2rem; line-height: 1.4;">{main_title}</h1>
            </div>
            <div class="topic-list">
                {main_elements_html}
            </div>
            """

        new_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>{display_title if 'display_title' in locals() else 'Ensinamentos'} - Biblioteca Sagrada</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="{level_up}css/styles.css">
</head>
<body>
  <header class="header">
    <a href="{level_up}shumeic1/index.html" class="header__logo">
      <div class="logo-circle">
        <div class="logo-dot"></div>
      </div>
      Biblioteca Sagrada
    </a>
    <div class="header__nav">
       <a href="{level_up}shumeic1/index.html" data-tooltip="Mundo Espiritual・Espírito Precede a Matéria・Transição da Noite para o Dia・Culto aos Antepassados"><span>Vol 1</span></a>
       <a href="{level_up}shumeic2/index.html" data-tooltip="Johrei・Método Divino de Saúde・Agricultura Natural"><span>Vol 2</span></a>
       <a href="{level_up}shumeic3/index.html" data-tooltip="Seção da Fé"><span>Vol 3</span></a>
       <a href="{level_up}shumeic4/index.html" data-tooltip="Outros Ensinamentos"><span>Vol 4</span></a>
       {f'''<select class="btn-zen" onchange="location.hash=this.value" style="max-width:250px">
            <option value="">Navegação por Temas</option>
            {''.join([f'<option value="#{h["id"]}">{h["title"]}</option>' for h in section_headers])}
       </select>''' if section_headers else ''}
    </div>
    <div class="controls">
       <button class="btn-zen active" id="btn-pt">PT-BR</button>
       <button class="btn-zen" id="btn-ja">日本語</button>
       <button class="btn-zen" onclick="toggleTheme()" title="Mudar Tema">☯</button>
    </div>
  </header>
  <main class="main">
    <div class="content-wrapper">
        <div class="glass-pane">
            {content_html}
        </div>
    </div>
  </main>
  <script src="{level_up}js/toggle.js"></script>
</body>
</html>"""
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(new_html)

def copy_assets():
    """Finds and copies all image assets from OrigianlHTML to the modern site."""
    print("Copying image assets...")
    count = 0
    extensions = ('.jpg', '.png', '.gif', '.jpeg', '.GIF', '.JPG', '.PNG')
    for root, dirs, files in os.walk('./OrigianlHTML'):
        for file in files:
            if file.endswith(extensions):
                src = os.path.join(root, file)
                dest = os.path.join(OUTPUT_DIR, 'assets/images', file)
                # Avoid overwriting if same filename exists (original structure might have duplicates)
                if not os.path.exists(dest):
                    shutil.copy2(src, dest)
                    count += 1
    print(f"Copied {count} new image assets to assets/images/")

if __name__ == "__main__":
    create_dirs()
    # Copy data
    for vol in VOLUMES:
        src = os.path.join(DATA_DIR, vol['file'])
        if os.path.exists(src):
            shutil.copy2(src, f"{OUTPUT_DIR}/data/{vol['file']}")
    copy_assets()
    process_indexes()
    print("Modern Site (Sakura Zen) generated in " + OUTPUT_DIR)
