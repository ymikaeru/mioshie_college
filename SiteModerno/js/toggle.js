
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Global Language Logic
  const urlParams = new URLSearchParams(window.location.search);
  let urlLang = urlParams.get('lang') || (urlParams.get('jp') !== null ? 'ja' : null);
  const savedLang = urlLang || localStorage.getItem('site_lang') || 'pt';
  if (typeof setLanguage === 'function') setLanguage(savedLang, false);

  // -------------------------------------------------------
  // Mobile Hamburger Menu — injected dynamically
  // -------------------------------------------------------
  _initMobileNav();
});


function _initMobileNav() {

  const header = document.querySelector('.header');
  if (!header) return;

  // --- 1. Create actions container ---
  const headerActions = document.createElement('div');
  headerActions.className = 'header__actions';

  // --- 2. Inject hamburger button ---
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'mobile-menu-btn';
  hamburgerBtn.setAttribute('aria-label', 'Menu de navegação');
  hamburgerBtn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;

  headerActions.appendChild(hamburgerBtn);
  header.appendChild(headerActions);

  // --- 2. Build nav links from existing desktop nav ---
  const desktopNav = header.querySelector('.header__nav');
  const navLinks = desktopNav ? Array.from(desktopNav.querySelectorAll('a')) : [];

  // Check if there's a topic select (index pages)
  const topicSelect = desktopNav ? desktopNav.querySelector('select') : null;
  const topicOptions = topicSelect
    ? Array.from(topicSelect.options).filter(o => o.value)
    : [];

  // Collect action buttons from desktop controls
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  const isReader = window.location.pathname.includes('reader.html');

  // --- 3. Build the mobile nav overlay HTML ---
  let linksHtml = navLinks.map(a => {
    const icon = a.href.includes('index.html') && a.textContent.trim().startsWith('⌂')
      ? `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
      : `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    return `<a href="${a.href}" class="mobile-nav-link">${icon}${a.textContent.trim()}</a>`;
  }).join('');

  let topicsHtml = '';
  if (topicOptions.length > 0) {
    topicsHtml = `
      <div class="mobile-nav-divider"></div>
      <div class="mobile-nav-section-label">Temas do Volume</div>
      ${topicOptions.map(o => `<a href="${o.value}" class="mobile-nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        ${o.text}
      </a>`).join('')}`;
  }

  const currentLang = localStorage.getItem('site_lang') || 'pt';
  const menuTexts = {
    pt: {
      title: 'Biblioteca Sagrada',
      close: 'Fechar menu',
      navigation: 'Navegação',
      actions: 'AÇÕES',
      history: 'Histórico',
      saved: 'Salvos',
      lang: '日本語',
      theme: 'Mudar Tema',
      fontSize: 'Tamanho da Fonte'
    },
    ja: {
      title: '御教え図書館',
      close: 'メニューを閉じる',
      navigation: 'ナビゲーション',
      actions: '操作',
      history: '履歴',
      saved: 'お気に入り',
      lang: 'Português',
      theme: 'テーマ切替',
      fontSize: 'フォントサイズ'
    }
  };
  const t = menuTexts[currentLang] || menuTexts.pt;

  const mobileNavOverlay = document.createElement('div');
  mobileNavOverlay.className = 'mobile-nav-overlay';
  mobileNavOverlay.id = 'mobileNavOverlay';
  mobileNavOverlay.innerHTML = `
    <div class="mobile-nav-backdrop" id="mobileNavBackdrop"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <span id="mobileMenuTitle">${t.title}</span>
        <button class="mobile-nav-close" id="mobileNavClose" aria-label="${t.close}">✕</button>
      </div>
      <div class="mobile-nav-body">

        <div class="mobile-nav-section-label" id="mobileNavLabelNav">${t.navigation}</div>
        <div id="mobileNavLinks">
          ${linksHtml}
        </div>

        <div id="mobileDynamicTopics"></div>

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label" id="mobileNavLabelActions">${t.actions}</div>
        
        <button class="mobile-nav-link" onclick="openHistory(); closeMobileNav();" id="mobileNavLinkHistory">
          <svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="link-text">${t.history}</span>
        </button>

        <button class="mobile-nav-link" onclick="openFavorites(); closeMobileNav();" id="mobileNavLinkFavorites">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span class="link-text">${t.saved}</span>
        </button>

        <button class="mobile-nav-link" onclick="toggleLanguage(); closeMobileNav();" id="mobileNavLinkLang">
          <svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span class="link-text">${t.lang}</span>
        </button>

        <button class="mobile-nav-link" onclick="toggleTheme(); closeMobileNav();" id="mobileNavLinkTheme">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <span class="link-text">${t.theme}</span>
        </button>

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label" id="mobileNavLabelFont">${t.fontSize}</div>
        <div class="mobile-font-row">
          <button class="mobile-font-btn" id="mobileFontDown" onclick="changeFontSize(-1)">A-</button>
          <button class="mobile-font-btn" id="mobileFontUp" onclick="changeFontSize(1)">A+</button>
        </div>

      </div>
    </div>`;

  document.body.appendChild(mobileNavOverlay);

  // --- 4. Event listeners ---
  hamburgerBtn.addEventListener('click', openMobileNav);
  document.getElementById('mobileNavClose').addEventListener('click', closeMobileNav);
  document.getElementById('mobileNavBackdrop').addEventListener('click', closeMobileNav);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // --- 5. Inject search button to the LEFT of the hamburger inside actions ---
  const searchBtn = document.createElement('button');
  searchBtn.className = 'mobile-search-btn';
  searchBtn.setAttribute('aria-label', 'Buscar');
  searchBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`;
  searchBtn.addEventListener('click', () => openSearch());
  headerActions.insertBefore(searchBtn, hamburgerBtn);

  // --- 6. Initialize context-aware topics in the mobile nav ---
  const headerNavSelect = desktopNav ? desktopNav.querySelector('select') : null;
  // Only auto-populate if it's an index page select (not readerTopicSelect)
  if (headerNavSelect && headerNavSelect.id !== 'readerTopicSelect') {
    const currentLang = localStorage.getItem('site_lang') || 'pt';
    const sectionLabel = currentLang === 'ja' ? '巻のテーマ' : 'Temas do Volume';
    if (opts.length > 0) {
      window._updateMobileNavTopics(sectionLabel, opts);
    }
  }
}

window.openMobileNav = function () {
  const overlay = document.getElementById('mobileNavOverlay');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeMobileNav = function () {
  const overlay = document.getElementById('mobileNavOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
};

// --- Update the Mobile Nav Topics Section Dynamically ---
window._updateMobileNavTopics = function (label, optionsList) {
  const container = document.getElementById('mobileDynamicTopics');
  if (!container) return;
  if (!optionsList || optionsList.length === 0) {
    container.innerHTML = '';
    return;
  }

  const currentLang = localStorage.getItem('site_lang') || 'pt';
  let label_to_use = label;
  if (!label_to_use) {
    label_to_use = currentLang === 'ja' ? '巻のテーマ' : 'Temas do Volume';
  } else {
    // Standard translate for labels
    if (label === 'Temas do Volume' || label === '巻のテーマ') {
      label_to_use = currentLang === 'ja' ? '巻のテーマ' : 'Temas do Volume';
    } else if (label === 'Publicações deste ensinamento' || label === '刊行物：テーマ') {
      label_to_use = currentLang === 'ja' ? '刊行物：テーマ' : 'Publicações deste ensinamento';
    }
  }

  let html = `
    <div class="mobile-nav-divider"></div>
    <div class="mobile-nav-section-label">${label_to_use}</div>
  `;
  optionsList.forEach(o => {
    let cleanText = o.text;
    // Special handling for the select options which might contain spans for translation
    // In this context, _updateMobileNavTopics receives o.text which might be already formatted or a raw string
    // Let's ensure we only show the text for the current language if it's a multi-lang string
    html += `<a href="${o.value}" class="mobile-nav-link" onclick="closeMobileNav()">
      <svg class="nav-icon" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      ${cleanText}
    </a>`;
  });
  container.innerHTML = html;
};


window._mobileSwitchLang = function (lang) {
  if (typeof setLanguage === 'function') setLanguage(lang);
  // Update button states in mobile drawer
  const ptBtn = document.getElementById('mobileLangPt');
  const jaBtn = document.getElementById('mobileLangJa');
  if (ptBtn) ptBtn.classList.toggle('active', lang === 'pt');
  if (jaBtn) jaBtn.classList.toggle('active', lang === 'ja');
};


async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

function setLanguage(lang, triggerRender = true) {
  localStorage.setItem('site_lang', lang);

  // Update URL parameter without reloading (standard behavior for language stability)
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url);

  // Update toggle button state
  const toggleBtn = document.getElementById('lang-toggle');
  if (toggleBtn) {
    if (lang === 'pt') {
      toggleBtn.innerText = '日本語';
      toggleBtn.title = 'Mudar para Japonês';
    } else {
      toggleBtn.innerText = 'Português';
      toggleBtn.title = 'Mudar para Português';
    }
  }

  // Update Header Title (Logo)
  const headerLogo = document.querySelector('.header__logo');
  if (headerLogo) {
    const ptTitle = 'Biblioteca Sagrada';
    const jaTitle = '御教え図書館';
    // Preserve the logo-circle if it exists
    const logoCircle = headerLogo.querySelector('.logo-circle');
    headerLogo.innerHTML = '';
    if (logoCircle) headerLogo.appendChild(logoCircle);
    headerLogo.appendChild(document.createTextNode(lang === 'ja' ? jaTitle : ptTitle));
  }

  // Refresh mobile nav if it's open or exists
  const mobileNav = document.getElementById('mobileNavOverlay');
  if (mobileNav) {
    const menuTexts = {
      pt: {
        title: 'Biblioteca Sagrada',
        close: 'Fechar menu',
        navigation: 'Navegação',
        actions: 'AÇÕES',
        history: 'Histórico',
        saved: 'Salvos',
        lang: '日本語',
        theme: 'Mudar Tema',
        fontSize: 'Tamanho da Fonte'
      },
      ja: {
        title: '御教え図書館',
        close: 'メニューを閉じる',
        navigation: 'ナビゲーション',
        actions: '操作',
        history: '履歴',
        saved: 'お気に入り',
        lang: 'Português',
        theme: 'テーマ切替',
        fontSize: 'フォントサイズ'
      }
    };
    const t = menuTexts[lang] || menuTexts.pt;

    const updateLabel = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const updateLink = (id, text) => {
      const el = document.getElementById(id);
      if (el) {
        const textSpan = el.querySelector('.link-text');
        if (textSpan) textSpan.textContent = text;
      }
    };

    updateLabel('mobileMenuTitle', t.title);
    updateLabel('mobileNavLabelNav', t.navigation);
    updateLabel('mobileNavLabelActions', t.actions);
    updateLabel('mobileNavLabelFont', t.fontSize);
    updateLink('mobileNavLinkHistory', t.history);
    updateLink('mobileNavLinkFavorites', t.saved);
    updateLink('mobileNavLinkLang', t.lang);
    updateLink('mobileNavLinkTheme', t.theme);

    const closeBtn = document.getElementById('mobileNavClose');
    if (closeBtn) closeBtn.setAttribute('aria-label', t.close);

    // Update Mobile Nav Links (translate them)
    const mobileLinksContainer = document.getElementById('mobileNavLinks');
    if (mobileLinksContainer) {
      const desktopNav = document.querySelector('.header__nav');
      const navLinks = desktopNav ? Array.from(desktopNav.querySelectorAll('a')) : [];
      const linksHtml = navLinks.map(a => {
        let text = a.textContent.trim();
        // Translate common nav terms
        if (lang === 'ja') {
          if (text.includes('Início') || text.includes('⌂')) text = 'トップ';
          else if (text.includes('Vol 1') || a.href.includes('shumeic1')) text = '巻 1';
          else if (text.includes('Vol 2') || a.href.includes('shumeic2')) text = '巻 2';
          else if (text.includes('Vol 3') || a.href.includes('shumeic3')) text = '巻 3';
          else if (text.includes('Vol 4') || a.href.includes('shumeic4')) text = '巻 4';
        }
        const icon = a.href.includes('index.html') && a.textContent.trim().startsWith('⌂')
          ? `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
          : `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
        return `<a href="${a.href}" class="mobile-nav-link">${icon}${text}</a>`;
      }).join('');
      mobileLinksContainer.innerHTML = linksHtml;
    }
  }

  // Toggle visibility of lang-specific elements
  document.querySelectorAll('.lang-pt').forEach(el => el.style.display = (lang === 'pt' ? 'inline' : 'none'));
  document.querySelectorAll('.lang-ja').forEach(el => el.style.display = (lang === 'ja' ? 'inline' : 'none'));

  // Update select options with data-pt/data-ja
  document.querySelectorAll('option[data-pt]').forEach(opt => {
    opt.textContent = lang === 'ja' ? (opt.getAttribute('data-ja') || opt.getAttribute('data-pt')) : opt.getAttribute('data-pt');
  });

  // Refresh mobile nav topics if select exists
  const desktopNav = document.querySelector('.header__nav');
  const headerNavSelect = desktopNav ? desktopNav.querySelector('select') : null;
  if (headerNavSelect && headerNavSelect.id !== 'readerTopicSelect') {
    const sectionLabel = lang === 'ja' ? '巻のテーマ' : 'Temas do Volume';
    const opts = Array.from(headerNavSelect.options).filter(o => o.value).map(o => {
      // Use data-pt or data-ja for the text to ensure it matches the language
      const text = lang === 'ja' ? (o.getAttribute('data-ja') || o.textContent) : (o.getAttribute('data-pt') || o.textContent);
      return {
        value: o.value,
        text: text
      };
    });
    if (opts.length > 0) {
      window._updateMobileNavTopics(sectionLabel, opts);
    }
  }

  // Translate Search Modal
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = lang === 'ja' ? '御教えから探す...' : 'Buscar nos ensinamentos...';
  }
  const filterLabels = document.querySelectorAll('.search-filters .filter-label');
  if (filterLabels.length >= 3) {
    const labels = lang === 'ja' ? ['すべて', 'タイトルのみ', '本文のみ'] : ['Tudo', 'Só Título', 'Só Conteúdo'];
    filterLabels.forEach((label, idx) => {
      const input = label.querySelector('input');
      label.innerHTML = '';
      if (input) label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + labels[idx]));
    });
  }

  // Trigger content re-rendering if the function exists
  if (triggerRender && typeof window.renderContent === 'function') {
    window.renderContent(lang);
  }
}

window.toggleLanguage = function () {
  const current = localStorage.getItem('site_lang') || 'pt';
  const next = current === 'pt' ? 'ja' : 'pt';
  setLanguage(next);
};

// --- Global Search Logic ---
let searchIndex = null;
let isFetchingIndex = false;
let searchTimeout = null;

async function getSearchIndex() {
  if (searchIndex) return searchIndex;
  if (isFetchingIndex) {
    while (isFetchingIndex) {
      await new Promise(r => setTimeout(r, 100));
    }
    return searchIndex;
  }

  isFetchingIndex = true;
  const resultsEl = document.getElementById('searchResults');
  const currentLang = localStorage.getItem('site_lang') || 'pt';
  const loadingMsg = currentLang === 'ja' ? '検索インデックスを読み込み中...' : 'Carregando índice de pesquisa...';
  if (resultsEl) resultsEl.innerHTML = `<li class="search-loading">${loadingMsg}</li>`;

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';

  try {
    const response = await fetch(`${basePath}site_data/search_index.json`);
    if (!response.ok) throw new Error('Falha ao carregar o índice');
    searchIndex = await response.json();
  } catch (err) {
    console.error(err);
    const errorMsg = currentLang === 'ja' ? 'インデックスの読み込みに失敗しました。' : 'Erro ao carregar o índice.';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-error">${errorMsg}</li>`;
  } finally {
    isFetchingIndex = false;
  }

  return searchIndex;
}

window.openSearch = function () {
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('searchInput');
  if (modal) {
    modal.classList.add('active');
    if (input) input.focus();
    getSearchIndex();
  }
}

window.closeSearch = function () {
  const modal = document.getElementById('searchModal');
  if (modal) modal.classList.remove('active');
}

function performSearch(query) {
  const resultsEl = document.getElementById('searchResults');
  const currentLang = localStorage.getItem('site_lang') || 'pt';
  if (!query || query.trim().length < 3) {
    const minCharsMsg = currentLang === 'ja' ? '3文字以上入力してください...' : 'Digite pelo menos 3 caracteres...';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-empty">${minCharsMsg}</li>`;
    return;
  }

  if (!searchIndex) return;

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
  for (let item of searchIndex) {
    let score = 0;
    let matchTitle = item.t.toLowerCase().includes(q);
    let matchContent = false;

    if (item.t.toLowerCase() === q) score += 100;
    else if (matchTitle) score += 50;

    const cLower = item.c.toLowerCase();
    const cIdx = cLower.indexOf(q);
    if (cIdx !== -1) {
      matchContent = true;
      score += 10;
      const start = Math.max(0, cIdx - 60);
      const end = Math.min(item.c.length, cIdx + query.length + 60);
      let snippet = item.c.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < item.c.length) snippet = snippet + '...';
      item.snippet = snippet;
    }

    if (filterMode === 'title' && !matchTitle) continue;
    if (filterMode === 'content' && !matchContent) continue;
    if (score === 0) continue;

    results.push({ ...item, score });
  }

  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, 50);

  if (results.length === 0) {
    const noResultsMsg = currentLang === 'ja' ? '結果が見つかりませんでした。' : 'Nenhum resultado.';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-empty">${noResultsMsg}</li>`;
    return;
  }

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  resultsEl.innerHTML = results.map(r => {
    const vNum = r.v.replace('shumeic', '');
    const fBase = r.f.replace('.html', '');
    // Using hash permalink: #v4/filename
    const href = `${basePath}reader.html${query ? '?s=' + encodeURIComponent(query) : ''}#v${vNum}/${fBase}`;
    // Escape query for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = (r.snippet || '').replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    return `<li><a href="${href}" class="search-result-item"><div class="search-result-title">${r.t} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${vNum})</span></div><div class="search-result-context">${highlight}</div></a></li>`;
  }).join('');
}

// --- History Logic ---
window.openHistory = function () {
  const modal = document.getElementById('historyModal');
  const resultsEl = document.getElementById('historyResults');
  if (modal && resultsEl) {
    modal.classList.add('active');
    renderHistory();
  }
}

window.closeHistory = function () {
  const modal = document.getElementById('historyModal');
  if (modal) modal.classList.remove('active');
}

function renderHistory() {
  const resultsEl = document.getElementById('historyResults');
  if (!resultsEl) return;

  const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';

  if (history.length === 0) {
    resultsEl.innerHTML = '<li class="search-empty">Nenhum histórico.</li>';
    return;
  }

  resultsEl.innerHTML = history.map(item => {
    const vNum = item.vol.replace('shumeic', '');
    const fBase = item.file.replace('.html', '');
    const href = `${basePath}reader.html#v${vNum}/${fBase}`;
    const date = new Date(item.time).toLocaleString();
    return `<li><a href="${href}" class="search-result-item" onclick="closeHistory()"><div class="search-result-title">${item.title || item.file} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${vNum})</span></div><div class="search-result-context">${date}</div></a></li>`;
  }).join('');
}

// --- Favorites Logic ---
window.openFavorites = function () {
  const modal = document.getElementById('favoritesModal');
  const resultsEl = document.getElementById('favoritesResults');
  if (modal && resultsEl) {
    modal.classList.add('active');
    renderFavorites();
  }
}

window.closeFavorites = function () {
  const modal = document.getElementById('favoritesModal');
  if (modal) modal.classList.remove('active');
}

function renderFavorites() {
  const resultsEl = document.getElementById('favoritesResults');
  if (!resultsEl) return;

  const favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';

  if (favorites.length === 0) {
    resultsEl.innerHTML = '<li class="search-empty">Nenhum ensinamento salvo.</li>';
    return;
  }

  // Sort by newest first
  favorites.sort((a, b) => b.time - a.time);

  resultsEl.innerHTML = favorites.map(item => {
    const vNum = item.vol.replace('shumeic', '');
    const fBase = item.file.replace('.html', '');
    const href = `${basePath}reader.html#v${vNum}/${fBase}`;
    const date = new Date(item.time).toLocaleString();
    return `<li>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 24px; border-bottom: 1px solid var(--border);">
        <a href="${href}" class="search-result-item" onclick="closeFavorites()" style="flex: 1; border-bottom: none;"><div class="search-result-title">${item.title || item.file} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${vNum})</span></div><div class="search-result-context">Salvo em ${date}</div></a>
        <button onclick="removeFavoriteFromModal('${item.vol}', '${item.file}')" style="background:none; border:none;  cursor:pointer; padding:8px; display:flex; align-items:center; justify-content:center; border-radius:8px; color:var(--accent);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
      </div>
    </li>`;
  }).join('');
}

window.removeFavoriteFromModal = function (volId, filename) {
  let favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
  favorites = favorites.filter(f => !(f.vol === volId && f.file === filename));
  localStorage.setItem('savedFavorites', JSON.stringify(favorites));
  renderFavorites(); // re-render the list

  // Check if we are currently on the reader page for this item, and update the button if so
  if (window.location.pathname.includes('reader.html')) {
    const params = new URLSearchParams(window.location.search);
    const currentVol = params.get('vol');
    const currentFile = params.get('file');
    if (currentVol === volId && currentFile === filename) {
      const btn = document.getElementById('favoriteBtn');
      if (btn) btn.classList.remove('active');
    }
  }
}

// --- Font Size Control ---
const FONT_SIZES = [14, 16, 18, 21, 24, 28, 32];
let _currentFontSizeIdx = null;

window.initFontSize = function () {
  const saved = parseInt(localStorage.getItem('reader_font_size') || '21');
  const idx = FONT_SIZES.indexOf(saved);
  _currentFontSizeIdx = idx >= 0 ? idx : 3; // 21 is default
  _applyFontSize();
};

window.changeFontSize = function (delta) {
  if (_currentFontSizeIdx === null) _currentFontSizeIdx = 1;
  _currentFontSizeIdx = Math.max(0, Math.min(FONT_SIZES.length - 1, _currentFontSizeIdx + delta));
  _applyFontSize();
  localStorage.setItem('reader_font_size', FONT_SIZES[_currentFontSizeIdx]);
};

function _applyFontSize() {
  const size = FONT_SIZES[_currentFontSizeIdx];
  document.documentElement.style.setProperty('--reader-font-size', size + 'px');

  // Update button states
  const btnMinus = document.getElementById('fontDecrease');
  const btnPlus = document.getElementById('fontIncrease');
  const mBtnMinus = document.getElementById('mobileFontDown');
  const mBtnPlus = document.getElementById('mobileFontUp');

  if (btnMinus) btnMinus.disabled = (_currentFontSizeIdx === 0);
  if (btnPlus) btnPlus.disabled = (_currentFontSizeIdx === FONT_SIZES.length - 1);
  if (mBtnMinus) mBtnMinus.disabled = (_currentFontSizeIdx === 0);
  if (mBtnPlus) mBtnPlus.disabled = (_currentFontSizeIdx === FONT_SIZES.length - 1);
}

// --- DOM Initialization and Shared Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  const closeSearchBtn = document.getElementById('searchClose');
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');

  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  if (searchModal) searchModal.addEventListener('click', (e) => {
    if (e.target.id === 'searchModal') closeSearch();
  });

  const historyModal = document.getElementById('historyModal');
  if (historyModal) historyModal.addEventListener('click', (e) => {
    if (e.target.id === 'historyModal') closeHistory();
  });

  const favoritesModal = document.getElementById('favoritesModal');
  if (favoritesModal) favoritesModal.addEventListener('click', (e) => {
    if (e.target.id === 'favoritesModal') closeFavorites();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch();
      closeHistory();
      closeFavorites();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  const triggerSearch = () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value;
    const resultsEl = document.getElementById('searchResults');
    const currentLang = localStorage.getItem('site_lang') || 'pt';
    const searchingMsg = currentLang === 'ja' ? '検索中...' : 'Buscando...';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-loading">${searchingMsg}</li>`;
    searchTimeout = setTimeout(async () => {
      await getSearchIndex();
      performSearch(query);
    }, 400);
  };

  if (searchInput) searchInput.addEventListener('input', triggerSearch);

  document.querySelectorAll('input[name="searchFilter"]').forEach(node => {
    node.addEventListener('change', () => {
      if (searchInput && searchInput.value.trim().length >= 3) triggerSearch();
    });
  });
});

// ============================================================
// IMMERSION MODE — auto-hide header & toolbar after inactivity
// Only active on reader pages
// ============================================================
(function () {
  // Only run on reader.html
  if (!window.location.pathname.includes('reader.html')) return;

  const HIDE_DELAY = 4000; // ms of inactivity before hiding
  const FADE_MS = 400;  // CSS transition duration

  // Add transition style to header and toolbar once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');

    // Inject transition CSS once
    const style = document.createElement('style');
    style.textContent = `
      .header, .reader-toolbar {
        transition: opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease !important;
      }
      .header.immersed {
        opacity: 0;
        pointer-events: none;
        transform: translateY(-8px);
      }
      .reader-toolbar.immersed {
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, 12px);
      }
    `;
    document.head.appendChild(style);

    let hideTimer = null;

    function showChrome() {
      const toolbar = document.querySelector('.reader-toolbar');
      if (header) header.classList.remove('immersed');
      if (toolbar) toolbar.classList.remove('immersed');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideChrome, HIDE_DELAY);
    }

    function hideChrome() {
      // Don't hide if any modal/drawer is open
      const anyOpen = document.querySelector(
        '.search-modal-overlay.active, .drawer-overlay.active, .mobile-nav-overlay.open'
      );
      if (anyOpen) {
        showChrome();
        return;
      }
      const toolbar = document.querySelector('.reader-toolbar');
      if (header) header.classList.add('immersed');
      if (toolbar) toolbar.classList.add('immersed');
    }

    // Events that reveal chrome
    const wakeEvents = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'keydown', 'click'];
    wakeEvents.forEach(evt => document.addEventListener(evt, showChrome, { passive: true }));

    // Start the timer
    showChrome();
  });
})();

// ============================================================
// JAPANESE SEARCH — update performSearch to use tj / cj fields
// ============================================================
// Override performSearch to also check Japanese title (tj) and content (cj)
const _originalPerformSearch = performSearch;
// Wrap performSearch to add Japanese field support
function performSearch(query) {
  const resultsEl = document.getElementById('searchResults');
  const activeLang = localStorage.getItem('site_lang') || 'pt';
  if (!query || query.trim().length < 2) {
    const minCharsMsg = activeLang === 'ja' ? '2文字以上入力してください...' : 'Digite pelo menos 2 caracteres...';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-empty">${minCharsMsg}</li>`;
    return;
  }

  if (!searchIndex) return;

  const q = query.trim();
  const qLower = q.toLowerCase();

  // Support for multiple search terms with & (AND logic)
  const queryParts = qLower.split('&').map(p => p.trim()).filter(p => p.length >= 2);
  if (queryParts.length === 0) {
    const invalidQueryMsg = activeLang === 'ja' ? '有効な検索ワードを入力してください...' : 'Digite termos de busca válidos...';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-empty">${invalidQueryMsg}</li>`;
    return;
  }

  const filterNodes = document.querySelectorAll('input[name="searchFilter"]');
  let filterMode = 'all';
  for (const node of filterNodes) {
    if (node.checked) { filterMode = node.value; break; }
  }

  let results = [];
  for (let item of searchIndex) {
    // PT fields (always available)
    const tPt = (item.t || '').toLowerCase();
    const cPt = (item.c || '').toLowerCase();
    // JA fields (optional)
    const tJa = (item.tj || '').toLowerCase();
    const cJa = (item.cj || '').toLowerCase();

    // Choose primary fields based on active language
    const titleSearch = activeLang === 'ja' ? (tJa || tPt) : tPt;
    const contentSearch = activeLang === 'ja' ? (cJa || cPt) : cPt;
    // Always search both languages for cross-language discoverability
    const titleAlt = activeLang === 'ja' ? tPt : tJa;
    const contentAlt = activeLang === 'ja' ? cPt : cJa;

    let allMatched = true;
    let score = 0;
    let matchedTitleOnce = false;
    let matchedContentOnce = false;

    for (const part of queryParts) {
      const matchTitlePart = titleSearch.includes(part) || titleAlt.includes(part);
      const matchContentPart = contentSearch.includes(part) || contentAlt.includes(part);

      if (!matchTitlePart && !matchContentPart) {
        allMatched = false;
        break;
      }

      if (titleSearch === part || titleAlt === part) score += 100;
      else if (matchTitlePart) score += 50;

      if (matchContentPart) score += 10;

      if (matchTitlePart) matchedTitleOnce = true;
      if (matchContentPart) matchedContentOnce = true;
    }

    if (!allMatched) continue;
    if (filterMode === 'title' && !matchedTitleOnce) continue;
    if (filterMode === 'content' && !matchedContentOnce) continue;

    if (matchedContentOnce) {
      // Build snippet from whichever content matched first part for simplicity, 
      // or the part that yields the first match.
      const raw = activeLang === 'ja' ? (item.cj || item.c || '') : (item.c || '');
      const rawLower = raw.toLowerCase();

      let bestPart = queryParts[0];
      let bestIdx = -1;
      for (const part of queryParts) {
        let idx = rawLower.indexOf(part);
        if (idx !== -1) {
          bestPart = part;
          bestIdx = idx;
          break;
        }
      }

      if (bestIdx !== -1) {
        const start = Math.max(0, bestIdx - 60);
        const end = Math.min(raw.length, bestIdx + bestPart.length + 60);
        let snippet = raw.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < raw.length) snippet += '...';
        item.snippet = snippet;
      }
    }

    results.push({ ...item, score });
  }

  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, 50);

  if (results.length === 0) {
    const noResultsMsg = activeLang === 'ja' ? '結果が見つかりませんでした。' : 'Nenhum resultado.';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-empty">${noResultsMsg}</li>`;
    return;
  }

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  // Escape all parts for regex
  const escapedParts = queryParts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const highlightRegex = new RegExp(`(${escapedParts.join('|')})`, 'gi');

  resultsEl.innerHTML = results.map(r => {
    const href = `${basePath}reader.html?vol=${r.v}&file=${r.f}&search=${encodeURIComponent(q)}`;
    const displayTitle = (activeLang === 'ja' && r.tj) ? r.tj : r.t;
    const highlight = (r.snippet || '')
      .replace(highlightRegex, '<mark class="search-highlight">$1</mark>');
    return `<li><a href="${href}" class="search-result-item" onclick="closeSearch()">
      <div class="search-result-title">${displayTitle} <span style="font-size:0.8rem;color:var(--text-muted)">(Vol ${r.v.slice(-1)})</span></div>
      <div class="search-result-context">${highlight}</div>
    </a></li>`;
  }).join('');
}

// ============================================================
// SMART HEADER — Hide on scroll down, show on scroll up/idle
// ============================================================
(function () {
  let lastScrollY = window.pageYOffset;
  let hideTimer = null;
  const HIDE_DELAY = 4500; // 4.5 seconds of inactivity
  const SCROLL_THRESHOLD = 10; // min scroll before hiding

  function initSmartHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    function showHeader() {
      header.classList.remove('header--hidden');
      resetTimer();
    }

    function hideHeader() {
      // Don't hide if at the very top or if any menu is open
      const isAtTop = window.pageYOffset < 50;
      const anyOpen = document.querySelector(
        '.search-modal-overlay.active, .history-modal-overlay.active, .favorites-modal-overlay.active, .mobile-nav-overlay.open'
      );

      if (!isAtTop && !anyOpen) {
        header.classList.add('header--hidden');
      }
    }

    function resetTimer() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideHeader, HIDE_DELAY);
    }

    window.addEventListener('scroll', () => {
      const currentScrollY = window.pageYOffset;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) > SCROLL_THRESHOLD) {
        if (delta > 0 && currentScrollY > 100) {
          // Scrolling down
          hideHeader();
        } else {
          // Scrolling up
          showHeader();
        }
      }
      lastScrollY = currentScrollY;
    }, { passive: true });

    // Interactions that reveal the header
    const wakeEvents = ['mousedown', 'touchstart', 'keydown', 'click'];
    wakeEvents.forEach(evt => {
      document.addEventListener(evt, showHeader, { passive: true });
    });

    // Initial timer
    resetTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartHeader);
  } else {
    initSmartHeader();
  }
})();
