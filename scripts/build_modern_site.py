import json
import os
import shutil
import re
from bs4 import BeautifulSoup, Comment
import time

CACHE_BUSTER = int(time.time())

# Configuration
DATA_DIR = './Data'
OUTPUT_DIR = 'SiteModerno'
DATA_OUTPUT_DIR = 'site_data'
ORIGINAL_HTML_DIR = './Data/translated_indexes'
INDEX_FILES = [
    ('shumeic1/index.html', '../', 'shumeic1'),
    ('shumeic1/index2.html', '../', 'shumeic1'),
    ('shumeic2/index.html', '../', 'shumeic2'),
    ('shumeic3/index.html', '../', 'shumeic3'),
    ('shumeic4/index.html', '../', 'shumeic4'),
    ('shumeic4/index2.html', '../', 'shumeic4'),]
# Track index titles parsed from the original HTML indexes to use them in the reader and search
GLOBAL_INDEX_TITLES = {
    'shumeic1': {},
    'shumeic2': {},
    'shumeic3': {},
    'shumeic4': {}
}

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
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.header__logo {
  grid-column: 1;
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
  grid-column: 2;
  display: flex; 
  gap: 32px; 
  align-items: center; 
  justify-content: center;
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
  grid-column: 3;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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

/* --- Search Modal UI --- */
.search-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 10vh;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.search-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.search-modal {
  background: var(--surface);
  width: 100%;
  max-width: 680px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-premium);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  transform: translateY(-20px);
  transition: transform 0.3s var(--ease);
}

.search-modal-overlay.active .search-modal {
  transform: translateY(0);
}

.search-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-filters {
  display: flex;
  gap: 16px;
  align-items: center;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  color: var(--text-muted);
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: color 0.2s;
}

.filter-label:hover {
  color: var(--text-main);
}

.filter-label input[type="radio"] {
  accent-color: var(--accent);
  cursor: pointer;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--text-main);
  outline: none;
  font-family: var(--font-ui);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
}

.search-result-item {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: block;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: rgba(184, 134, 11, 0.05); /* Accent tint */
}

.search-result-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}

.search-result-context {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-loading, .search-empty {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

/* --- Reader Highlight Styles --- */
mark.search-highlight {
  background-color: rgba(184, 134, 11, 0.3);
  color: inherit;
  padding: 2px 0;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(184, 134, 11, 0.2);
}
[data-theme="dark"] mark.search-highlight {
  background-color: rgba(212, 175, 55, 0.4);
}

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

  // Global Language Logic
  const savedLang = localStorage.getItem('site_lang') || 'pt';
  setLanguage(savedLang, false); // Initialize without re-rendering if on reader (reader handles its own init)
});

async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

function setLanguage(lang, triggerRender = true) {
  localStorage.setItem('site_lang', lang);
  
  // Update button states
  document.querySelectorAll('.btn-zen').forEach(b => {
    if (b.id === 'btn-pt') {
      lang === 'pt' ? b.classList.add('active') : b.classList.remove('active');
    } else if (b.id === 'btn-ja') {
      lang === 'ja' ? b.classList.add('active') : b.classList.remove('active');
    }
  });

  // Toggle visibility of lang-specific elements
  document.querySelectorAll('.lang-pt').forEach(el => el.style.display = (lang === 'pt' ? 'inline' : 'none'));
  document.querySelectorAll('.lang-ja').forEach(el => el.style.display = (lang === 'ja' ? 'inline' : 'none'));

  // Trigger content re-rendering if the function exists (used on the reader page)
  if (triggerRender && typeof window.renderContent === 'function') {
    window.renderContent(lang);
  }
}

// --- Global Search Logic ---
let searchIndex = null;
let isFetchingIndex = false;
let searchTimeout = null;

async function getSearchIndex() {
  if (searchIndex) return searchIndex;
  
  if (isFetchingIndex) {
    // Wait until it's done fetching
    while (isFetchingIndex) {
      await new Promise(r => setTimeout(r, 100));
    }
    return searchIndex;
  }
  
  isFetchingIndex = true;
  document.getElementById('searchResults').innerHTML = '<li class="search-loading">Carregando índice de pesquisa (isso pode levar alguns instantes na primeira vez)...</li>';
  
  // Determine relative path to data folder based on current URL
  const basePath = window.location.href.includes('/shumeic') ? '../' : './';
  
  try {
    const response = await fetch(`${basePath}Data/search_index.json`);
    if (!response.ok) throw new Error('Falha ao carregar o índice');
    searchIndex = await response.json();
  } catch (err) {
    console.error(err);
    document.getElementById('searchResults').innerHTML = '<li class="search-error">Erro ao carregar o índice de pesquisa. Verifique sua conexão.</li>';
  } finally {
    isFetchingIndex = false;
  }
  
  return searchIndex;
}

function openSearch() {
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('searchInput');
  if (modal) {
    modal.classList.add('active');
    input.focus();
    // Pre-fetch the index as soon as search is opened
    getSearchIndex();
  }
}

function closeSearch() {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function performSearch(query) {
  const resultsEl = document.getElementById('searchResults');
  if (!query || query.trim().length < 3) {
    resultsEl.innerHTML = '<li class="search-empty">Digite pelo menos 3 caracteres para buscar.</li>';
    return;
  }
  
  if (!searchIndex) return; // Still loading, getSearchIndex will handle it
  
  const q = query.toLowerCase().trim();
  const filterNodes = document.querySelectorAll('input[name="searchFilter"]');
  let filterMode = 'all';
  for (const node of filterNodes) {
    if (node.checked) {
      filterMode = node.value;
      break;
    }
  }

  let results = [];
  
  // Search through index
  for (let item of searchIndex) {
    let score = 0;
    let matchTitle = false;
    let matchContent = false;
    
    // Exactly Title
    if (item.t.toLowerCase() === q) {
      matchTitle = true;
      score += 100;
    }
    // Sub-title match
    else if (item.t.toLowerCase().includes(q)) {
      matchTitle = true;
      score += 50;
    }
    
    // Content match
    const cLower = item.c.toLowerCase();
    const cIdx = cLower.indexOf(q);
    if (cIdx !== -1) {
      matchContent = true;
      score += 10;
      // Extract a snippet of content around the match for context
      const start = Math.max(0, cIdx - 60);
      const end = Math.min(item.c.length, cIdx + query.length + 60);
      let snippet = item.c.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < item.c.length) snippet = snippet + '...';
      
      item.snippet = snippet;
    }

    // Apply Filters
    if (filterMode === 'title' && !matchTitle) continue;
    if (filterMode === 'content' && !matchContent) continue;
    if (score === 0) continue;
    
    // Add to results
    results.push({ ...item, score });
  }
  
  // Sort by score (best match first), then take top 50 to avoid DOM lag
  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, 50);
  
  if (results.length === 0) {
    resultsEl.innerHTML = '<li class="search-empty">Nenhum resultado encontrado.</li>';
    return;
  }
  
  // Render results
  const basePath = window.location.href.includes('/shumeic') ? '../' : './';
  
  resultsEl.innerHTML = results.map(r => {
    const fileBase = r.f.replace('.json', '.html').replace('.txt', '.html');
    const href = `${basePath}reader.html?vol=${r.v}&file=${r.f}&search=${encodeURIComponent(query)}`;
    
    const highlightedSnippet = (r.snippet || '').replace(new RegExp(`(${query})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    
    return `
      <li>
        <a href="${href}" class="search-result-item">
          <div class="search-result-title">${r.t} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(Vol ${r.v.slice(-1)})</span></div>
          <div class="search-result-context">${highlightedSnippet}</div>
        </a>
      </li>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('searchClose');
  const modalBtn = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');
  
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  if (modalBtn) modalBtn.addEventListener('click', (e) => {
    if (e.target.id === 'searchModal') closeSearch();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    // Ctrl+K or Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });
  
  const triggerSearch = () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value;
    
    const resultsEl = document.getElementById('searchResults');
    resultsEl.innerHTML = '<li class="search-loading">Buscando...</li>';
    
    searchTimeout = setTimeout(async () => {
      await getSearchIndex();
      performSearch(query);
    }, 400); // 400ms debounce
  };

  if (searchInput) {
    searchInput.addEventListener('input', triggerSearch);
  }

  // Also trigger search when changing filters if there's text
  const filterNodes = document.querySelectorAll('input[name="searchFilter"]');
  filterNodes.forEach(node => {
     node.addEventListener('change', () => {
         if (searchInput.value.trim().length >= 3) {
             triggerSearch();
         }
     });
  });

  // Add history events
  const historyModalBtn = document.getElementById('historyModal');
  if (historyModalBtn) historyModalBtn.addEventListener('click', (e) => {
    if (e.target.id === 'historyModal') closeHistory();
  });
});

// --- Navigation History Logic ---
function openHistory() {
  const modal = document.getElementById('historyModal');
  const resultsEl = document.getElementById('historyResults');
  if (modal && resultsEl) {
    modal.classList.add('active');
    
    const basePath = window.location.href.includes('/shumeic') ? '../' : './';
    const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
    
    if (history.length === 0) {
      resultsEl.innerHTML = '<li class="search-empty">Nenhum histórico recente.</li>';
      return;
    }
    
    resultsEl.innerHTML = history.map(r => {
      const href = `${basePath}reader.html?vol=${r.vol}&file=${r.file}`;
      const date = new Date(r.time);
      const timeStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
      
      return `
        <li>
          <a href="${href}" class="search-result-item">
            <div class="search-result-title">${r.title} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(Vol ${r.vol.slice(-1)})</span></div>
            <div class="search-result-context">Visualizado em ${timeStr}</div>
          </a>
        </li>
      `;
    }).join('');
  }
}

function closeHistory() {
  const modal = document.getElementById('historyModal');
  if (modal) {
    modal.classList.remove('active');
  }
}
"""

READER_JS = r"""
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const volId = params.get('vol');
    const filename = params.get('file');
    const searchQuery = params.get('search');
    const container = document.getElementById('readerContainer');
    const basePath = './';
    
    if (!volId || !filename) {
        container.innerHTML = `<div class="error">Selecione um ensinamento no índice.</div>`;
        return;
    }

    try {
        const response = await fetch(`${basePath}${window.DATA_OUTPUT_DIR || 'site_data'}/${volId}_data_bilingual.json`);
        const json = await response.json();
        let topicsFound = [];

        // Flatten all unique files for navigation
        const allFiles = [];
        json.themes.forEach(theme => {
            theme.topics.forEach(topic => {
                const f = topic.source_file || topic.filename || "";
                if (f && !allFiles.includes(f)) allFiles.push(f);
            });
        });

        const currentIndex = allFiles.indexOf(filename);
        const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
        const nextFile = currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

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
            
            let indexTitles = {};
            try {
                indexTitles = window.GLOBAL_INDEX_TITLES || {};
            } catch (e) {}
            
            const indexTitle = (indexTitles[volId] && indexTitles[volId][filename]) ? indexTitles[volId][filename] : null;
            const fallbackTitle = isPt ? (topicsFound[0].title_ptbr || topicsFound[0].title_pt || topicsFound[0].title) : topicsFound[0].title;
            const mainTitleToDisplay = (isPt && indexTitle) ? indexTitle : fallbackTitle;

            // --- History Saving Logic ---
            try {
                const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
                const newEntry = {
                    title: mainTitleToDisplay.replace(/<br\s*\/?>/gi, ' '),
                    vol: volId,
                    file: filename,
                    time: Date.now()
                };
                const filtered = history.filter(h => h.file !== filename || h.vol !== volId);
                filtered.unshift(newEntry);
                localStorage.setItem('readHistory', JSON.stringify(filtered.slice(0, 20)));
            } catch (e) {}

            let fullHtml = `
                <div class="topic-header" style="margin-bottom: 40px; text-align: center;">
                    <h1 class="topic-title-large" style="font-size: 2.2rem; margin-bottom: 16px;">${mainTitleToDisplay}</h1>
                </div>
            `;

            const navSelect = document.getElementById('readerTopicSelect');
            if (navSelect) {
                navSelect.innerHTML = '<option value="">Navegação por Publicações</option>';
                navSelect.style.display = 'none';
            }
            
            topicsFound.forEach((topicData, index) => {
                const topicId = `topic-${index}`;
                
                // Content cleanup and Markdown conversion
                let rawContent = "";
                if (isPt) {
                    rawContent = topicData.content_ptbr || topicData.content_pt || topicData.content || "";
                } else {
                    rawContent = topicData.content || "";
                }

                // If content looks like Markdown (contains ** or # or [), use marked
                let formattedContent = rawContent;
                if (typeof marked !== 'undefined' && (/(\*\*|__|###|# |\[)/.test(rawContent))) {
                    formattedContent = marked.parse(rawContent);
                }

                // Strip all <font> inline-style attributes except color
                formattedContent = formattedContent.replace(/<font(\s[^>]*)>/gi, (m, attrs) => {
                    return '<span>';
                }).replace(/<\/font>/gi, '</span>');

                formattedContent = formattedContent.replace(/\\n\\n/g, '</p><p>');

                formattedContent = formattedContent.replace(/src=["']([^"']+)["']/g, (match, src) => {
                    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('assets/')) return match;
                    return `src="assets/images/${src}"`;
                });

                let cleanedContent = formattedContent.replace(/color=["'][^"']+["']/g, '');
                cleanedContent = cleanedContent.replace(/style=["'][^"']*color:[^"']+["']/g, '');

                // DOM-based: remove leading element ONLY if its stripped text is an exact match
                // to the main title (prevents removing teaching titles that just share a word)
                let cleanedContent = formattedContent;
                const _tmp = document.createElement('div');
                _tmp.innerHTML = cleanedContent;
                
                // Enhanced title stripping to fix duplicate titles
                // Check the first few blocks for title match
                const firstBlocks = _tmp.querySelectorAll('p, div, h1, h2, h3, blockquote');
                const titlePlain = mainTitleToDisplay.replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\u30FB\u00B7\.\"\u300c\u300d]/g, '').toLowerCase();
                
                for (let i = 0; i < Math.min(firstBlocks.length, 3); i++) {
                    const block = firstBlocks[i];
                    // Don't strip if it contains substantial content or sub-elements
                    if (block.querySelector('img, table, ul, ol')) continue;
                    
                    const blockText = block.textContent.replace(/[\u3000\s\d\u30FB\u00B7\.\"\u300c\u300d]/g, '').toLowerCase();
                    if (blockText.length > 0 && blockText.length < 150 && (blockText === titlePlain || titlePlain.includes(blockText) || blockText.includes(titlePlain))) {
                        block.remove();
                        break; // Only remove the first matching block
                    }
                }
                cleanedContent = _tmp.innerHTML;

                // Filter "Unknown" dates
                let displayDate = topicData.date;
                if (displayDate === "Unknown") displayDate = "";

                // Add topic to navigation select if multiple topics
                if (navSelect && topicsFound.length > 1) {
                    const topicTitle = (isPt ? (topicData.title_ptbr || topicData.title_pt || topicData.title) : topicData.title) || `Publicação ${index + 1}`;
                    const op = document.createElement('option');
                    op.value = `#${topicId}`;
                    op.textContent = topicTitle.replace(/<[^>]+>/g, '');
                    navSelect.appendChild(op);
                }

                fullHtml += `
                    <div id="${topicId}" class="topic-content" style="margin-top: ${index > 0 ? '40px' : '0'};">
                        ${displayDate ? `<div class="topic-meta" style="margin-bottom: 16px;">${displayDate}</div>` : ''}
                        ${cleanedContent}
                    </div>
                `;
            });

            // Show select only if multiple topics (use already-declared outer variable)
            if (navSelect) navSelect.style.display = topicsFound.length > 1 ? 'inline-block' : 'none';

            // Navigation Footer
            const navFooter = `
                <div class="reader-nav-footer" style="display: flex; justify-content: space-between; margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--border);">
                    ${prevFile ? `<a href="?vol=${volId}&file=${prevFile}" class="btn-zen" style="text-decoration:none">← Anterior</a>` : '<span></span>'}
                    ${nextFile ? `<a href="?vol=${volId}&file=${nextFile}" class="btn-zen" style="text-decoration:none">Próximo →</a>` : '<span></span>'}
                </div>
            `;

            container.innerHTML = `
                <nav class="breadcrumbs">
                    <a href="index.html">Início</a> <span>/</span> 
                    <a href="${volId}/index.html">Volume ${volId.slice(-1)}</a> <span>/</span>
                    <span style="color:var(--text-main)">Leitura</span>
                </nav>
                <div class="reader-container">
                    ${fullHtml}
                    ${navFooter}
                </div>
            `;
            
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const contentBlocks = container.querySelectorAll('.topic-content, .topic-title-large');
                let firstMatch = null;
                
                contentBlocks.forEach(block => {
                    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    const textNodes = [];
                    while(node = walker.nextNode()) textNodes.push(node);
                    
                    textNodes.forEach(textNode => {
                        if (textNode.parentNode && textNode.parentNode.nodeName === 'MARK') return;
                        const val = textNode.nodeValue;
                        if (val.toLowerCase().includes(q) && val.trim().length > 0) {
                            const regex = new RegExp(`(${searchQuery})`, 'gi');
                            const fragment = document.createDocumentFragment();
                            const div = document.createElement('div');
                            div.innerHTML = val.replace(regex, '<mark class="search-highlight">$1</mark>');
                            while (div.firstChild) fragment.appendChild(div.firstChild);
                            
                            if (!firstMatch) {
                                firstMatch = fragment.querySelector('mark');
                            }
                            textNode.parentNode.replaceChild(fragment, textNode);
                        }
                    });
                });
                
                if (firstMatch) {
                    setTimeout(() => {
                        window.scrollTo({
                             top: firstMatch.getBoundingClientRect().top + window.scrollY - 100,
                             behavior: 'smooth'
                        });
                    }, 500);
                }
            }
        };

        renderContent('pt');

    } catch (err) {
        container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
    }
});

// setLanguage is now defined globally in toggle.js
"""

READER_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ensinamentos de Meishu-Sama - Leitura</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <header class="header">
    <a href="index.html" class="header__logo">
      <div class="logo-circle">
        <div class="logo-dot"></div>
      </div>
      Biblioteca Sagrada
    </a>
    <div class="header__nav">
       <a href="index.html" style="font-weight:600; opacity:0.7;"><span>⌂ Início</span></a>
       <a href="index.html" data-tooltip="Mundo Espiritual・Espírito Precede a Matéria・Transição da Noite para o Dia・Culto aos Antepassados"><span>Vol 1</span></a>
       <a href="shumeic2/index.html" data-tooltip="Método Divino de Saúde・Agricultura Natural"><span>Vol 2</span></a>
       <a href="shumeic3/index.html" data-tooltip="A Verdadeira Fé"><span>Vol 3</span></a>
       <a href="shumeic4/index.html" data-tooltip="Ensinamentos Complementares"><span>Vol 4</span></a>
       <select id="readerTopicSelect" class="btn-zen" onchange="location.hash=this.value" style="max-width:250px; display:none;">
            <option value="">Navegação por Publicações</option>
       </select>
    </div>
    <div class="controls">
      <button class="btn-zen" onclick="openHistory()" title="Histórico de Navegação">🕒</button>
      <button class="btn-zen" onclick="openSearch()" title="Buscar">🔍</button>
      <button class="btn-zen active" id="btn-pt" onclick="if(typeof setLanguage === 'function') setLanguage('pt'); else { location.href='../index.html'; }">PT-BR</button>
      <button class="btn-zen" id="btn-ja" onclick="if(typeof setLanguage === 'function') setLanguage('ja'); else { location.href='../index2.html'; }">日本語</button>
      <button class="btn-zen" onclick="toggleTheme()" title="Mudar Tema">☯</button>
    </div>
  </header>
  <main class="main">
    <div class="glass-pane" id="readerContainer">
        <div style="text-align:center; color:var(--text-muted)">Preparando leitura...</div>
    </div>
  </main>

  <div class="search-modal-overlay" id="searchModal">
    <div class="search-modal">
      <div class="search-header">
        <div class="search-input-row">
          <input type="text" class="search-input" id="searchInput" placeholder="Buscar nos ensinamentos..." autocomplete="off">
          <button class="search-close" id="searchClose">&times;</button>
        </div>
        <div class="search-filters">
          <label class="filter-label"><input type="radio" name="searchFilter" value="all" checked> Tudo</label>
          <label class="filter-label"><input type="radio" name="searchFilter" value="title"> Só Título</label>
          <label class="filter-label"><input type="radio" name="searchFilter" value="content"> Só Conteúdo</label>
        </div>
      </div>
      <ul class="search-results" id="searchResults"></ul>
    </div>
  </div>

  <div class="search-modal-overlay" id="historyModal">
    <div class="search-modal">
      <div class="search-header">
        <h2 style="font-size: 1.2rem; margin:0; color: var(--accent);">Histórico de Navegação</h2>
        <button class="search-close" onclick="closeHistory()">&times;</button>
      </div>
      <ul class="search-results" id="historyResults"></ul>
    </div>
  </div>

  <script src="js/toggle.js?v={CACHE_BUSTER}"></script>
  <script src="js/reader.js?v={CACHE_BUSTER}"></script>
</body>
</html>
"""

def create_dirs():
    """Create necessary directories and clean up old output files."""
    # List of directories we manage and can safely clear/create
    managed_dirs = ['css', 'js', DATA_OUTPUT_DIR, 'assets', 'shumeic1', 'shumeic2', 'shumeic3', 'shumeic4']
    
    for d in managed_dirs:
        dir_path = os.path.join(OUTPUT_DIR, d)
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
        os.makedirs(dir_path, exist_ok=True)
    
    # We also manage specifically named root files
    managed_files = ['index.html', 'index2.html']
    for f in managed_files:
        file_path = os.path.join(OUTPUT_DIR, f)
        if os.path.exists(file_path):
            os.remove(file_path)

    # Assets subdirs
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
    for rel_path, level_path, vol_id in INDEX_FILES:
        src = os.path.join(ORIGINAL_HTML_DIR, rel_path)
        
        # Determine destination filename
        if rel_path.endswith('index.html') and vol_id == 'shumeic1':
            dest_filename = 'index.html'
            dest = os.path.join(OUTPUT_DIR, dest_filename)
            level_up = '' # Root items don't need level_up
        elif rel_path.endswith('index2.html') and vol_id == 'shumeic1':
            dest_filename = 'index2.html'
            dest = os.path.join(OUTPUT_DIR, dest_filename)
            level_up = ''
        else:
            # For other volumes, keep them in their subdirectories
            dest = os.path.join(OUTPUT_DIR, rel_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            level_up = '../'
        
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
            text = text.replace('Verda\u3000de', 'Verdade')
            text = text.replace('Supersti\u3000\u00e7\u00e3o', 'Superstição')
            text = text.replace('Budis\u3000mo', 'Budismo')
            text = text.replace('Fan\u3000tasma', 'Fantasma')
            text = text.replace('Esp\u00ed\u3000rito', 'Espírito')
            
            # Normalize full-width digits to ASCII digits to avoid serif rendering issues
            full_width_digits = '\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19'
            for i, fw in enumerate(full_width_digits):
                text = text.replace(fw, str(i))
            
            # Replace remaining full-width spaces with regular space
            text = text.replace('\u3000', ' ')
            # Collapse multiple spaces and strip
            return re.sub(r'\s+', ' ', text).strip()

        section_headers = []
        def traverse_and_convert(element, vol_data_lookup=None, theme_lookup=None, original_ja_index_lookup=None):
            nonlocal topic_count
            html_parts = []
            last_was_topic = False
            last_was_br = False
            
            theme_lookup = theme_lookup or {}
            original_ja_index_lookup = original_ja_index_lookup or {}
            
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
                    title_pt = clean_text(child.get_text().replace('・', ''))
                    
                    # Lookup bilingual title
                    title_ja = title_pt
                    if original_ja_index_lookup and filename in original_ja_index_lookup:
                        title_ja = original_ja_index_lookup[filename]
                    elif vol_data_lookup:
                        lookup_key = title_pt.strip()
                        if lookup_key in vol_data_lookup:
                            title_ja = vol_data_lookup[lookup_key].get('title_ja', title_pt)
                        elif filename in vol_data_lookup:
                            title_ja = vol_data_lookup[filename].get('title_ja', title_pt)
                    
                    if not title_ja:
                        title_ja = title_pt

                    if vol_id in GLOBAL_INDEX_TITLES:
                        GLOBAL_INDEX_TITLES[vol_id][filename] = title_pt

                    html_parts.append(f"""
                    <a href="{level_up}reader.html?vol={vol_id}&file={filename}" class="topic-card">
                        <div class="topic-card__icon">{topic_count}</div>
                        <div class="topic-card__title">
                            <span class="lang-pt">{title_pt}</span>
                            <span class="lang-ja" style="display:none">{title_ja}</span>
                        </div>
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
                            "Mestre Mokichi Okada",
                            "Seção da Fé",
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
                        # Map header to Japanese if possible
                        ja_header = theme_lookup.get(title_clean, 
                                     theme_lookup.get(title_clean.lower(), title_clean))
                        
                        section_headers.append({'id': header_id, 'title': dropdown_title})
                        html_parts.append(f"""
                        <{child.name} id="{header_id}" class="section-header">
                            <span class="lang-pt">{title_clean}</span>
                            <span class="lang-ja" style="display:none">{ja_header}</span>
                        </{child.name}>""")
                        last_was_topic = False
                        last_was_br = False
                    else:
                        inner = traverse_and_convert(child, vol_data_lookup, theme_lookup, original_ja_index_lookup)
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
                            # Map header to Japanese if possible
                            ja_header = theme_lookup.get(text, 
                                         theme_lookup.get(text.lower(), text))
                            
                            section_headers.append({'id': header_id, 'title': dropdown_title})
                            html_parts.append(f"""
                            <div id="{header_id}" class="section-header">
                                <span class="lang-pt">{text}</span>
                                <span class="lang-ja" style="display:none">{ja_header}</span>
                            </div>""")
                        else:
                            html_parts.append(f'<div class="plain-text">{text}</div>')
                        last_was_topic = False
                        last_was_br = False
            
            return "".join(html_parts)

        # Default Japanese button action (overridden per volume below)
        has_ja_index = vol_id in ('shumeic1', 'shumeic4')
        ja_btn_onclick = "if(typeof setLanguage === 'function') setLanguage('ja'); else window.location.href='index2.html';" if has_ja_index else "if(typeof setLanguage === 'function') setLanguage('ja');"

        # Build custom content for shumeic1/index.html (Home)
        if 'shumeic1/index.html' == rel_path:
            content_html = f"""
            <div class="home-hero">
                <h1 class="index-title" style="margin-bottom:16px">
                    <span class="lang-pt">Ensinamentos de Meishu-Sama</span>
                    <span class="lang-ja" style="display:none">明主様御教え</span>
                </h1>
                <p style="text-align:center; color:var(--text-muted); margin-bottom:48px; max-width:600px; margin-inline:auto;">
                    <span class="lang-pt">Tradução em português das obras de Meishu-Sama, organizadas em volumes temáticos para estudo e reflexão.</span>
                    <span class="lang-ja" style="display:none">明主様の御教えをテーマ別にまとめた日本語とポルトガル語の聖書図書館です。</span>
                </p>
                <div class="topic-list" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                    <a href="index2.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 1</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">
                            <span class="lang-pt">Mundo Espiritual</span>
                            <span class="lang-ja" style="display:none">霊界編</span>
                        </div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">
                            <span class="lang-pt">Ensinamentos sobre o mundo espiritual e princípios fundamentais.</span>
                            <span class="lang-ja" style="display:none">霊界と根本義に関する御教え集。</span>
                        </div>
                    </a>
                    <a href="shumeic2/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 2</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">
                            <span class="lang-pt">Método Divino de Saúde</span>
                            <span class="lang-ja" style="display:none">浄霊・自然農法</span>
                        </div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">
                            <span class="lang-pt">Método Divino de Saúde e Agricultura Natural em harmonia com a natureza.</span>
                            <span class="lang-ja" style="display:none">浄霊、健康法、自然農法の御教え。</span>
                        </div>
                    </a>
                    <a href="shumeic3/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 3</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">
                            <span class="lang-pt">A Verdadeira Fé</span>
                            <span class="lang-ja" style="display:none">信仰編</span>
                        </div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">
                            <span class="lang-pt">Volume 3 - Ensinamentos sobre a prática e o aprimoramento da fé.</span>
                            <span class="lang-ja" style="display:none">第三巻：信仰の実践 e 向上に関する御教え集。</span>
                        </div>
                    </a>
                    <a href="shumeic4/index.html" class="topic-card" style="flex-direction:column; align-items:flex-start; height:100%; padding: 32px;">
                        <span class="section-label" style="text-align:left; margin-bottom:12px;">Volume 4</span>
                        <div class="topic-card__title" style="font-size:22px; margin-bottom:8px">
                            <span class="lang-pt">Ensinamentos Complementares</span>
                            <span class="lang-ja" style="display:none">補足編</span>
                        </div>
                        <div style="font-size:14px; color:var(--text-muted); line-height:1.5">
                            <span class="lang-pt">Ensinamentos complementares e temas diversos da obra divina.</span>
                            <span class="lang-ja" style="display:none">第四巻：補足の御教えと様々なテーマ。</span>
                        </div>
                    </a>
                </div>
            </div>
            """
        else:
            vol_label = ""
            main_title = "Índice de Ensinamentos"
            
            if 'shumeic1' in rel_path: 
                vol_label = "VOLUME 1"
                main_title = "Mundo Espiritual"
                main_title_ja = "霊界編"
            elif 'shumeic2' in rel_path: 
                vol_label = "VOLUME 2"
                main_title = "Método Divino de Saúde ・ Agricultura Natural"
                main_title_ja = "浄霊・自然農法"
            elif 'shumeic3' in rel_path: 
                vol_label = "VOLUME 3"
                main_title = "A Verdadeira Fé"
                main_title_ja = "信仰編"
            elif 'shumeic4' in rel_path: 
                vol_label = "VOLUME 4"
                main_title = "Ensinamentos Complementares"
                main_title_ja = "補足編"
            
            # Load bilingual data to get Japanese titles for the index cards
            data_file = f"{vol_id}_data_bilingual.json"
            data_path = os.path.join(DATA_DIR, data_file)
            vol_data_lookup = {}
            theme_lookup = {}
            
            # Extract true Japanese chapter titles from the original HTML index
            original_ja_index_lookup = {}
            index_filename = 'index2.html' if vol_id == 'shumeic1' else 'index.html'
            original_idx_path = os.path.join('OrigianlHTML', vol_id, index_filename)
            if os.path.exists(original_idx_path):
                try:
                    with open(original_idx_path, 'r', encoding='shift_jis') as f:
                        html_content = f.read()
                except UnicodeDecodeError:
                    with open(original_idx_path, 'r', encoding='utf-8', errors='ignore') as f:
                        html_content = f.read()
                ja_soup = BeautifulSoup(html_content, 'html.parser')
                for a_tag in ja_soup.find_all('a'):
                    href = a_tag.get('href', '')
                    if href and not href.startswith('http') and not href.startswith('#'):
                        fname = href.split('/')[-1]
                        if fname:
                            original_ja_index_lookup[fname] = clean_text(a_tag.get_text().replace('・', ''))
                            
            if os.path.exists(data_path):
                with open(data_path, 'r', encoding='utf-8') as f:
                    v_data = json.load(f)
                    for theme in v_data.get('themes', []):
                        pt_t = theme.get('theme_title_pt', theme.get('theme_title', ''))
                        ja_t = theme.get('theme_title', '')
                        theme_lookup[pt_t] = ja_t
                        theme_lookup[pt_t.lower()] = ja_t
                        
                        for topic in theme.get('topics', []):
                            fname = topic.get('source_file', topic.get('filename', '')).split('/')[-1]
                            if fname:
                                pt_title_key = topic.get('title_ptbr', topic.get('title_pt', ''))
                                ja_title = topic.get('title_ja') or topic.get('title', '')
                                
                                if pt_title_key:
                                    vol_data_lookup[pt_title_key.strip()] = {
                                        'title_ja': ja_title,
                                        'title_pt': pt_title_key
                                    }
                                    
                                # Fallback by filename just in case
                                if fname not in vol_data_lookup:
                                    vol_data_lookup[fname] = {
                                        'title_ja': ja_title,
                                        'title_pt': pt_title_key
                                    }

            main_elements_html = traverse_and_convert(main_content, vol_data_lookup, theme_lookup, original_ja_index_lookup)
            content_html = f"""
            <div class="index-header" style="text-align:center; margin-bottom: 64px;">
                <span class="section-label" style="color: var(--accent); font-weight: 600; letter-spacing: 2px;">{vol_label}</span>
                <h1 class="index-title" style="margin-top: 16px; font-size: 2.2rem; line-height: 1.4;">
                    <span class="lang-pt">{main_title}</span>
                    <span class="lang-ja" style="display:none">{main_title_ja if 'main_title_ja' in locals() else main_title}</span>
                </h1>
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
  <script src="{level_up}js/toggle.js?v={CACHE_BUSTER}"></script>
  <script>
    // Reader handles its own initialization that differs from Home/Index
    if (!window.location.href.includes('reader.html')) {{
        document.addEventListener('DOMContentLoaded', () => {{
            const savedLang = localStorage.getItem('site_lang') || 'pt';
            if (typeof setLanguage === 'function') setLanguage(savedLang);
        }});
    }}
  </script>
</head>
<body>
  <header class="header">
    <a href="{level_up}index.html" class="header__logo">
      <div class="logo-circle">
        <div class="logo-dot"></div>
      </div>
      Biblioteca Sagrada
    </a>
    <div class="header__nav">
       <a href="{level_up}index.html" style="font-weight:600; opacity:0.7;"><span>⌂ Início</span></a>
       <a href="{level_up}index2.html" data-tooltip="Mundo Espiritual・Espírito Precede a Matéria・Transição da Noite para o Dia・Culto aos Antepassados"><span>Vol 1</span></a>
       <a href="{level_up}shumeic2/index.html" data-tooltip="Método Divino de Saúde・Agricultura Natural"><span>Vol 2</span></a>
       <a href="{level_up}shumeic3/index.html" data-tooltip="A Verdadeira Fé"><span>Vol 3</span></a>
       <a href="{level_up}shumeic4/index.html" data-tooltip="Ensinamentos Complementares"><span>Vol 4</span></a>
        {f'''<select class="btn-zen" onchange="location.hash=this.value" style="max-width:250px">
            <option value="">Navegação por Temas</option>
            {''.join([f'<option value="#{h["id"]}">{h["title"]}</option>' for h in section_headers])}
       </select>''' if section_headers else ''}
    </div>
    <div class="controls">
       <button class="btn-zen" onclick="openHistory()" title="Histórico de Navegação">🕒</button>
       <button class="btn-zen" onclick="openSearch()" title="Buscar">🔍</button>
       <button class="btn-zen active" id="btn-pt" onclick="if(typeof setLanguage === 'function') setLanguage('pt');">PT-BR</button>
       <button class="btn-zen" id="btn-ja" onclick="{ja_btn_onclick}">日本語</button>
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

  <div class="search-modal-overlay" id="searchModal">
    <div class="search-modal">
      <div class="search-header">
        <div class="search-input-row">
          <input type="text" class="search-input" id="searchInput" placeholder="Buscar nos ensinamentos..." autocomplete="off">
          <button class="search-close" id="searchClose">&times;</button>
        </div>
        <div class="search-filters">
          <label class="filter-label"><input type="radio" name="searchFilter" value="all" checked> Tudo</label>
          <label class="filter-label"><input type="radio" name="searchFilter" value="title"> Só Título</label>
          <label class="filter-label"><input type="radio" name="searchFilter" value="content"> Só Conteúdo</label>
        </div>
      </div>
      <ul class="search-results" id="searchResults"></ul>
    </div>
  </div>

  <div class="search-modal-overlay" id="historyModal">
    <div class="search-modal">
      <div class="search-header">
        <h2 style="font-size: 1.2rem; margin:0; color: var(--accent);">Histórico de Navegação</h2>
        <button class="search-close" onclick="closeHistory()">&times;</button>
      </div>
      <ul class="search-results" id="historyResults"></ul>
    </div>
  </div>

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

def build_search_index():
    """Generates a minimized JSON search index from all translation data."""
    print("Building global search index...")
    
    # Write the GLOBAL_INDEX_TITLES into reader.js so it can use them
    reader_js_path = os.path.join(OUTPUT_DIR, 'js', 'reader.js')
    if os.path.exists(reader_js_path):
        with open(reader_js_path, 'r', encoding='utf-8') as f:
            reader_js_content = f.read()
        injection = f"window.GLOBAL_INDEX_TITLES = {json.dumps(GLOBAL_INDEX_TITLES, ensure_ascii=False)};\nwindow.DATA_OUTPUT_DIR = '{DATA_OUTPUT_DIR}';\n"
        if "window.GLOBAL_INDEX_TITLES =" not in reader_js_content:
            with open(reader_js_path, 'w', encoding='utf-8') as f:
                f.write(injection + reader_js_content)

    search_data = []
    
    for vol in VOLUMES:
        vol_id = vol['id']
        src = os.path.join(DATA_DIR, vol['file'])
        if not os.path.exists(src): continue
        
        with open(src, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                continue
                
        for theme in data.get('themes', []):
            for topic in theme.get('topics', []):
                # Prefer PT title/content, fallback to original
                title = topic.get('title_ptbr') or topic.get('title_pt') or topic.get('title', '')
                content = topic.get('content_ptbr') or topic.get('content_pt') or topic.get('content', '')
                
                # Strip HTML from content for a clean search index
                soup = BeautifulSoup(content, "html.parser")
                clean_text = soup.get_text(separator=" ", strip=True)
                
                if clean_text:
                    src_file = topic.get('source_file') or topic.get('filename') or ''
                    filename = os.path.basename(src_file) if src_file else ''
                    index_title = GLOBAL_INDEX_TITLES.get(vol_id, {}).get(filename, '')
                    
                    # Store only essential fields to keep size small
                    search_data.append({
                        'v': vol_id,
                        'f': filename,
                        't': index_title if index_title else title.strip(),
                        'c': clean_text
                    })
                    
    index_path = os.path.join(OUTPUT_DIR, DATA_OUTPUT_DIR, 'search_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        # Saving without indentation to save space
        json.dump(search_data, f, ensure_ascii=False, separators=(',', ':'))
    
    size_mb = os.path.getsize(index_path) / (1024 * 1024)
    print(f"Search index generated at {index_path} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_dirs()
    # Copy data
    for vol in VOLUMES:
        src = os.path.join(DATA_DIR, vol['file'])
        if os.path.exists(src):
            shutil.copy2(src, f"{OUTPUT_DIR}/{DATA_OUTPUT_DIR}/{vol['file']}")
    copy_assets()
    process_indexes()
    build_search_index()
    print("Modern Site (Biblioteca Sagrada) generated in " + OUTPUT_DIR)
