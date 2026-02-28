
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Global Language Logic
  const savedLang = localStorage.getItem('site_lang') || 'pt';
  setLanguage(savedLang, false);

  // -------------------------------------------------------
  // Mobile Hamburger Menu — injected dynamically
  // -------------------------------------------------------
  _initMobileNav();
});


function _initMobileNav() {

  const header = document.querySelector('.header');
  if (!header) return;

  // --- 1. Inject hamburger button into header ---
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
  header.appendChild(hamburgerBtn);

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

  const mobileNavOverlay = document.createElement('div');
  mobileNavOverlay.className = 'mobile-nav-overlay';
  mobileNavOverlay.id = 'mobileNavOverlay';
  mobileNavOverlay.innerHTML = `
    <div class="mobile-nav-backdrop" id="mobileNavBackdrop"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <span>Biblioteca Sagrada</span>
        <button class="mobile-nav-close" id="mobileNavClose" aria-label="Fechar menu">✕</button>
      </div>
      <div class="mobile-nav-body">

        <div class="mobile-nav-section-label">Navegação</div>
        ${linksHtml}

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label">Ações</div>
        <button class="mobile-nav-link" onclick="openHistory(); closeMobileNav();">
          <svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Histórico
        </button>
        <button class="mobile-nav-link" onclick="openBookmarksList(); closeMobileNav();">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Favoritos
        </button>
        <button class="mobile-nav-link" onclick="toggleTheme(); closeMobileNav();">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Mudar Tema
        </button>

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label">Idioma</div>
        <div class="mobile-lang-row">
          <button class="mobile-lang-btn${currentLang === 'pt' ? ' active' : ''}" id="mobileLangPt"
            onclick="_mobileSwitchLang('pt')">PT-BR</button>
          <button class="mobile-lang-btn${currentLang === 'ja' ? ' active' : ''}" id="mobileLangJa"
            onclick="_mobileSwitchLang('ja')">日本語</button>
        </div>

        <div id="mobileDynamicTopics"></div>

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

  // --- 5. Inject search button to the LEFT of the hamburger ---
  const searchBtn = document.createElement('button');
  searchBtn.className = 'mobile-search-btn';
  searchBtn.setAttribute('aria-label', 'Buscar');
  searchBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`;
  searchBtn.addEventListener('click', () => openSearch());
  header.insertBefore(searchBtn, hamburgerBtn);

  // --- 6. Initialize context-aware topics in the mobile nav ---
  const headerNavSelect = desktopNav ? desktopNav.querySelector('select') : null;
  // Only auto-populate if it's an index page select (not readerTopicSelect)
  if (headerNavSelect && headerNavSelect.id !== 'readerTopicSelect') {
    const opts = Array.from(headerNavSelect.options).filter(o => o.value).map(o => ({ value: o.value, text: o.textContent }));
    if (opts.length > 0) {
      window._updateMobileNavTopics('Temas do Volume', opts);
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
  let html = `
    <div class="mobile-nav-divider"></div>
    <div class="mobile-nav-section-label">${label}</div>
  `;
  optionsList.forEach(o => {
    html += `<a href="${o.value}" class="mobile-nav-link" onclick="closeMobileNav()">
      <svg class="nav-icon" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      ${o.text}
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

  // Update toggle button state
  const toggleBtn = document.getElementById('lang-toggle');
  if (toggleBtn) {
    if (lang === 'pt') {
      toggleBtn.innerText = '日本語';
      toggleBtn.title = 'Mudar para Japonês';
    } else {
      toggleBtn.innerText = 'PT';
      toggleBtn.title = 'Mudar para Português';
    }
  }

  // Toggle visibility of lang-specific elements
  document.querySelectorAll('.lang-pt').forEach(el => el.style.display = (lang === 'pt' ? 'inline' : 'none'));
  document.querySelectorAll('.lang-ja').forEach(el => el.style.display = (lang === 'ja' ? 'inline' : 'none'));

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
  if (resultsEl) resultsEl.innerHTML = '<li class="search-loading">Carregando índice de pesquisa...</li>';

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';

  try {
    const response = await fetch(`${basePath}site_data/search_index.json`);
    if (!response.ok) throw new Error('Falha ao carregar o índice');
    searchIndex = await response.json();
  } catch (err) {
    console.error(err);
    if (resultsEl) resultsEl.innerHTML = '<li class="search-error">Erro ao carregar o índice.</li>';
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
  if (!query || query.trim().length < 3) {
    if (resultsEl) resultsEl.innerHTML = '<li class="search-empty">Digite pelo menos 3 caracteres...</li>';
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
    if (resultsEl) resultsEl.innerHTML = '<li class="search-empty">Nenhum resultado.</li>';
    return;
  }

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  resultsEl.innerHTML = results.map(r => {
    const href = `${basePath}reader.html?vol=${r.v}&file=${r.f}&search=${encodeURIComponent(query)}`;
    // Escape query for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = (r.snippet || '').replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    return `<li><a href="${href}" class="search-result-item"><div class="search-result-title">${r.t} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${r.v.slice(-1)})</span></div><div class="search-result-context">${highlight}</div></a></li>`;
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
    const href = `${basePath}reader.html?vol=${item.vol}&file=${item.file}`;
    const date = new Date(item.time).toLocaleString();
    return `<li><a href="${href}" class="search-result-item"><div class="search-result-title">${item.title || item.file} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${item.vol.slice(-1)})</span></div><div class="search-result-context">${date}</div></a></li>`;
  }).join('');
}

// --- Bookmarks Logic ---
window.openBookmarksList = function () {
  const modal = document.getElementById('bookmarksModal');
  const resultsEl = document.getElementById('bookmarksResults');
  if (modal && resultsEl) {
    modal.classList.add('active');
    updateBookmarksList();
  }
}

window.closeBookmarksList = function () {
  const modal = document.getElementById('bookmarksModal');
  if (modal) modal.classList.remove('active');
}

function updateBookmarksList() {
  const resultsEl = document.getElementById('bookmarksResults');
  if (!resultsEl) return;

  const bookmarks = JSON.parse(localStorage.getItem('shumei_bookmarks') || '[]');
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';

  if (bookmarks.length === 0) {
    resultsEl.innerHTML = '<li class="search-empty">Nenhum favorito.</li>';
    return;
  }

  resultsEl.innerHTML = bookmarks.map((b, idx) => {
    const href = `${basePath}reader.html?vol=${b.vol}&file=${b.file}`;
    return `
      <li style="position:relative">
        <a href="${href}" class="search-result-item">
          <div class="search-result-title">${b.title} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${b.vol.slice(-1)})</span></div>
          <div class="search-result-context">${b.vol} / ${b.file}</div>
        </a>
        <button onclick="removeBookmarkByIndex(${idx})" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.2rem; padding:10px;">&times;</button>
      </li>
    `;
  }).join('');
}

window.removeBookmarkByIndex = function (idx) {
  const bookmarks = JSON.parse(localStorage.getItem('shumei_bookmarks') || '[]');
  bookmarks.splice(idx, 1);
  localStorage.setItem('shumei_bookmarks', JSON.stringify(bookmarks));
  updateBookmarksList();
  if (typeof window.checkBookmarkState === 'function') window.checkBookmarkState();
};

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

  const bookmarksModal = document.getElementById('bookmarksModal');
  if (bookmarksModal) bookmarksModal.addEventListener('click', (e) => {
    if (e.target.id === 'bookmarksModal') closeBookmarksList();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch();
      closeHistory();
      closeBookmarksList();
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
    if (resultsEl) resultsEl.innerHTML = '<li class="search-loading">Buscando...</li>';
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
    const toolbar = document.querySelector('.reader-toolbar');
    if (!header && !toolbar) return;

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
  if (!query || query.trim().length < 2) {
    if (resultsEl) resultsEl.innerHTML = '<li class="search-empty">Digite pelo menos 2 caracteres...</li>';
    return;
  }

  if (!searchIndex) return;

  const q = query.trim();
  const qLower = q.toLowerCase();
  const activeLang = localStorage.getItem('site_lang') || 'pt';

  const filterNodes = document.querySelectorAll('input[name="searchFilter"]');
  let filterMode = 'all';
  for (const node of filterNodes) {
    if (node.checked) { filterMode = node.value; break; }
  }

  let results = [];
  for (let item of searchIndex) {
    let score = 0;

    // PT fields (always available)
    const tPt = (item.t || '').toLowerCase();
    const cPt = (item.c || '').toLowerCase();
    // JA fields (optional — added by updated build script)
    const tJa = (item.tj || '').toLowerCase();
    const cJa = (item.cj || '').toLowerCase();

    // Choose primary fields based on active language
    const titleSearch = activeLang === 'ja' ? (tJa || tPt) : tPt;
    const contentSearch = activeLang === 'ja' ? (cJa || cPt) : cPt;
    // Always search both languages for cross-language discoverability
    const titleAlt = activeLang === 'ja' ? tPt : tJa;
    const contentAlt = activeLang === 'ja' ? cPt : cJa;

    let matchTitle = titleSearch.includes(qLower) || titleAlt.includes(qLower);
    let matchContent = contentSearch.includes(qLower) || contentAlt.includes(qLower);

    if (titleSearch === qLower || titleAlt === qLower) score += 100;
    else if (matchTitle) score += 50;

    if (matchContent) {
      score += 10;
      // Build snippet from whichever content matched
      const raw = activeLang === 'ja' ? (item.cj || item.c || '') : (item.c || '');
      const rawLower = raw.toLowerCase();
      const idx = rawLower.indexOf(qLower);
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(raw.length, idx + q.length + 60);
        let snippet = raw.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < raw.length) snippet += '...';
        item.snippet = snippet;
      }
    }

    if (filterMode === 'title' && !matchTitle) continue;
    if (filterMode === 'content' && !matchContent) continue;
    if (score === 0) continue;

    results.push({ ...item, score });
  }

  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, 50);

  if (results.length === 0) {
    if (resultsEl) resultsEl.innerHTML = '<li class="search-empty">Nenhum resultado.</li>';
    return;
  }

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  resultsEl.innerHTML = results.map(r => {
    const href = `${basePath}reader.html?vol=${r.v}&file=${r.f}&search=${encodeURIComponent(q)}`;
    const displayTitle = (activeLang === 'ja' && r.tj) ? r.tj : r.t;
    const highlight = (r.snippet || '')
      .replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    return `<li><a href="${href}" class="search-result-item">
      <div class="search-result-title">${displayTitle} <span style="font-size:0.8rem;color:var(--text-muted)">(Vol ${r.v.slice(-1)})</span></div>
      <div class="search-result-context">${highlight}</div>
    </a></li>`;
  }).join('');
}
