
// --- Shared Translation Strings ---
const MENU_TEXTS = {
  pt: {
    title: 'Mioshie College',
    close: 'Fechar menu',
    navigation: 'Navegação',
    actions: 'AÇÕES',
    history: 'Histórico',
    saved: 'Salvos',
    lang: '日本語',
    theme: 'Mudar Tema',
    fontSize: 'Tamanho da Fonte',
    customize: 'Personalizar',
    accessibility: 'Acessibilidade & Layout',
    lightMode: 'Claro',
    darkMode: 'Noturno',
    lineSpacing: 'ESPAÇAMENTO DE LINHAS',
    charSpacing: 'ESPAÇAMENTO DE CARACTERES',
    wordSpacing: 'ESPAÇAMENTO DE PALAVRAS',
    margins: 'MARGENS',
    justify: 'Justificar Texto',
    boldText: 'Texto em Negrito'
  },
  ja: {
    title: '御教えカレッジ',
    close: 'メニューを閉じる',
    navigation: 'ナビゲーション',
    actions: '操作',
    history: '履歴',
    saved: 'お気に入り',
    lang: 'Português',
    theme: 'テーマ切替',
    fontSize: 'フォントサイズ',
    customize: 'カスタマイズ',
    accessibility: 'アクセシビリティ＆レイアウト',
    lightMode: 'ライト',
    darkMode: 'ダーク',
    lineSpacing: '行間隔',
    charSpacing: '文字間隔',
    wordSpacing: '単語間隔',
    margins: '余白',
    justify: 'テキストを両端揃え',
    boldText: '太字テキスト'
  }
};

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
  const t = MENU_TEXTS[currentLang] || MENU_TEXTS.pt;

  const mobileNavOverlay = document.createElement('div');
  mobileNavOverlay.className = 'mobile-nav-overlay';
  mobileNavOverlay.id = 'mobileNavOverlay';
  mobileNavOverlay.innerHTML = `
    <div class="mobile-nav-backdrop" id="mobileNavBackdrop"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <span id="mobileMenuTitle">${t.title}</span>
      </div>
      <div class="mobile-nav-body">

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

        <button class="mobile-nav-link" onclick="saveAllOffline()" id="mobileNavLinkOffline" style="display:${'serviceWorker' in navigator ? 'flex' : 'none'}">
          <svg class="nav-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span class="link-text" id="offlineSaveLabel">${localStorage.getItem('offline_saved_all') === 'true' ? (currentLang === 'ja' ? '✓ オフライン保存済み' : '✓ Salvo offline') : (currentLang === 'ja' ? 'オフライン保存' : 'Salvar offline')}</span>
        </button>

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label" id="mobileNavLabelFont">${t.fontSize}</div>
        <div class="mobile-font-row">
          <button class="mobile-font-btn" id="mobileFontDown" onclick="changeFontSize(-1)">A-</button>
          <button class="mobile-font-btn" id="mobileFontUp" onclick="changeFontSize(1)">A+</button>
        </div>

        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section-label" id="mobileNavLabelNav">${t.navigation}</div>
        <div id="mobileNavLinks">
          ${linksHtml}
        </div>

        <div id="mobileDynamicTopics"></div>

      </div>
    </div>`;

  document.body.appendChild(mobileNavOverlay);

  // --- 4. Event listeners ---
  hamburgerBtn.addEventListener('click', () => {
    const titleEl = document.getElementById('mobileMenuTitle');
    if (titleEl) {
      const lang = localStorage.getItem('site_lang') || 'pt';
      const fallback = (MENU_TEXTS[lang] || MENU_TEXTS.pt).title;
      const docTitle = document.title;
      const match = docTitle.match(/^Meishu-Sama:\s*(.+?)\s*-\s*Mioshie College$/);
      titleEl.textContent = match ? match[1] : fallback;
    }
    openMobileNav();
  });
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

  // --- 5b. Inject favorites button to the RIGHT of search button ---
  const favBtn = document.createElement('button');
  favBtn.className = 'mobile-fav-btn';
  favBtn.id = 'mobileFavoriteBtn';
  favBtn.setAttribute('aria-label', 'Favoritar');
  favBtn.style.display = window.location.pathname.includes('reader.html') ? 'flex' : 'none';
  favBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>`;
  favBtn.addEventListener('click', () => {
    if (typeof toggleFavorite === 'function') toggleFavorite();
  });
  headerActions.insertBefore(favBtn, hamburgerBtn);

  // --- 6. Initialize context-aware topics in the mobile nav ---
  const headerNavSelect = desktopNav ? desktopNav.querySelector('select') : null;
  // Only auto-populate if it's an index page select (not readerTopicSelect)
  if (headerNavSelect && headerNavSelect.id !== 'readerTopicSelect') {
    const currentLang = localStorage.getItem('site_lang') || 'pt';
    const sectionLabel = currentLang === 'ja' ? '巻のテーマ' : 'Temas do Volume';
    const opts = Array.from(headerNavSelect.options).filter(o => o.value).map(o => ({
      value: o.value,
      text: o.getAttribute('data-ja') && currentLang === 'ja' ? o.getAttribute('data-ja') : (o.getAttribute('data-pt') || o.textContent)
    }));
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
  openThemeModal();
}

function openThemeModal() {
  let modal = document.getElementById('themeModal');
  let justCreated = false;
  if (!modal) {
    _createThemeModal();
    modal = document.getElementById('themeModal');
    justCreated = true;
  }

  const currentLang = localStorage.getItem('site_lang') || 'pt';
  const titleEl = document.getElementById('themeModalTitle');
  if (titleEl) {
    titleEl.textContent = currentLang === 'ja' ? 'テーマと設定' : 'Themes & Settings';
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-val') === currentTheme);
  });

  // Set mode button active states
  const currentMode = document.documentElement.getAttribute('data-mode') || 'light';
  const lightBtn = document.getElementById('modeLightBtn');
  const darkBtn = document.getElementById('modeDarkBtn');
  if (lightBtn) lightBtn.classList.toggle('active', currentMode === 'light');
  if (darkBtn) darkBtn.classList.toggle('active', currentMode === 'dark');

  // Update theme card colors based on current mode
  _updateThemeCardColors(currentMode);

  // Initialize sliders/toggles with saved values
  if (typeof initLineHeight === 'function') initLineHeight();
  if (typeof initAdvancedOptions === 'function') initAdvancedOptions();

  modal.classList.add('active');
}

function closeThemeModal() {
  const modal = document.getElementById('themeModal');
  if (modal) modal.classList.remove('active');
}

window.setAppTheme = function(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('theme', theme); } catch (e) { }

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
  });
};

// Light / Dark mode (day / night)
window.setAppMode = function(mode) {
  document.documentElement.setAttribute('data-mode', mode);
  try { localStorage.setItem('site_mode', mode); } catch (e) { }

  // Update mode button active states
  const lightBtn = document.getElementById('modeLightBtn');
  const darkBtn = document.getElementById('modeDarkBtn');
  if (lightBtn) lightBtn.classList.toggle('active', mode === 'light');
  if (darkBtn) darkBtn.classList.toggle('active', mode === 'dark');

  // Update theme button card colors based on mode
  _updateThemeCardColors(mode);
};

function _updateThemeCardColors(mode) {
  const isDark = mode === 'dark';
  const cardColors = {
    light:  isDark ? { bg: '#1A1A1A', fg: '#D4D4D4' } : { bg: '#FFFFFF', fg: '#1C1C1E' },
    quiet:  isDark ? { bg: '#38383A', fg: '#C8C8C8' } : { bg: '#5E5E60', fg: '#E5E5E5' },
    paper:  isDark ? { bg: '#36332E', fg: '#C0B9A8' } : { bg: '#F4EEDF', fg: '#3C3B37' },
    bold:   isDark ? { bg: '#151515', fg: '#FFFFFF' } : { bg: '#FFFFFF', fg: '#000000' },
    calm:   isDark ? { bg: '#4A4032', fg: '#D4C4B0' } : { bg: '#EADDC8', fg: '#4A3A2A' },
    focus:  isDark ? { bg: '#000000', fg: '#8A8A8C' } : { bg: '#FFFFFF', fg: '#000000' },
  };

  document.querySelectorAll('.theme-btn').forEach(btn => {
    const val = btn.getAttribute('data-theme-val');
    const colors = cardColors[val];
    if (!colors) return;
    btn.style.background = colors.bg;
    btn.style.color = colors.fg;
    // Update border for light themes that blend into modal bg
    if ((val === 'light' || val === 'bold' || val === 'focus') && !isDark) {
      btn.style.borderColor = '#E5E5E0';
    } else if ((val === 'light' || val === 'bold' || val === 'focus') && isDark) {
      btn.style.borderColor = '#444';
    } else {
      btn.style.borderColor = 'transparent';
    }
    // Update inner text color
    const previewText = btn.querySelector('.theme-btn-preview-text');
    const labelText = btn.querySelector('.theme-btn-label');
    if (previewText) previewText.style.color = colors.fg;
    if (labelText) labelText.style.color = colors.fg;
  });
}

function _createThemeModal() {
  const overlay = document.createElement('div');
  overlay.className = 'theme-modal-overlay';
  overlay.id = 'themeModal';
  
  // Inline SVG for icons
  const iconDecrease = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>+`;
  
  const t = MENU_TEXTS[document.documentElement.lang === 'ja' ? 'ja' : 'pt'];

  // Icons used
  const iconSettings = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
  const iconBack = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
  const iconSun = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const iconMoon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const iconCharSpacing = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v18"></path><path d="M16 3v18"></path><path d="M4 12h16"></path></svg>`;
  const iconWordSpacing = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16"></path><path d="M4 15h16"></path></svg>`;
  const iconMargins = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>`;
  
  // Icons
  const iconLineHeight = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4h6"/><path d="M11 12h6"/><path d="M11 20h6"/><path d="M3 8l3-4 3 4"/><path d="M3 16l3 4 3-4"/></svg>`;
  const iconCharSpacingSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20l-4-4 4-4"/><path d="M17 20l4-4-4-4"/><path d="M3 16h18"/><path d="M10 4l2 8 2-8"/></svg>`;
  const iconWordSpacingSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20l-4-4 4-4"/><path d="M17 20l4-4-4-4"/><path d="M3 16h18"/><path d="M8 4h2"/><path d="M14 4h2"/></svg>`;
  const iconMarginsSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;

  overlay.innerHTML = `
    <div class="theme-modal" id="themeModalCard">
      <div class="theme-modal-header">
        <h3 class="theme-modal-title" id="themeModalTitle">Themes & Settings</h3>
        <button class="search-close" onclick="closeThemeModal()" aria-label="Fechar" style="position:static;">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="theme-modal-content">

        <div class="theme-mode-switcher">
          <button class="theme-mode-btn" id="modeLightBtn" onclick="setAppMode('light')">
            ${iconSun} <span style="margin-left:8px; font-weight:500" class="tr-lightmode">${t.lightMode}</span>
          </button>
          <button class="theme-mode-btn" id="modeDarkBtn" onclick="setAppMode('dark')">
            ${iconMoon} <span style="margin-left:8px; font-weight:500" class="tr-darkmode">${t.darkMode}</span>
          </button>
        </div>

        <div class="theme-grid">
          <div class="theme-btn" data-theme-val="light" onclick="setAppTheme('light')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Original</div>
          </div>
          <div class="theme-btn" data-theme-val="quiet" onclick="setAppTheme('quiet')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Quiet</div>
          </div>
          <div class="theme-btn" data-theme-val="paper" onclick="setAppTheme('paper')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Paper</div>
          </div>
          <div class="theme-btn" data-theme-val="bold" onclick="setAppTheme('bold')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Bold</div>
          </div>
          <div class="theme-btn" data-theme-val="calm" onclick="setAppTheme('calm')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Calm</div>
          </div>
          <div class="theme-btn" data-theme-val="focus" onclick="setAppTheme('focus')">
            <div class="theme-btn-preview-text">Aa</div>
            <div class="theme-btn-label">Focus</div>
          </div>
        </div>

        <div class="theme-custom-row" id="customizeRow" style="margin-top:8px;">
          <span class="theme-custom-row-title">${t.customize}</span>
          <label class="theme-toggle">
            <input type="checkbox" id="themeCustomizeToggle" onchange="toggleCustomize(this.checked)">
            <span class="theme-toggle-slider"></span>
          </label>
        </div>

        <div class="theme-sliders-group" id="themeSlidersGroup" style="display:none;">
          <div class="theme-slider-item">
            <span class="theme-slider-label">${t.lineSpacing}</span>
            <div class="theme-slider-row">
              <div class="theme-slider-icon">${iconLineHeight}</div>
              <input type="range" min="1.2" max="2.4" step="0.1" class="theme-slider" id="themeLineHeightSlider" oninput="changeLineHeight(this.value)">
              <span class="theme-slider-value" id="lineHeightValue">1.6</span>
            </div>
          </div>
          <div class="theme-slider-item">
            <span class="theme-slider-label">${t.charSpacing}</span>
            <div class="theme-slider-row">
              <div class="theme-slider-icon">${iconCharSpacingSvg}</div>
              <input type="range" min="-0.05" max="0.15" step="0.01" value="0" class="theme-slider" id="themeLetterSpacingSlider" oninput="changeLetterSpacing(this.value)">
              <span class="theme-slider-value" id="letterSpacingValue">0%</span>
            </div>
          </div>
          <div class="theme-slider-item">
            <span class="theme-slider-label">${t.wordSpacing}</span>
            <div class="theme-slider-row">
              <div class="theme-slider-icon">${iconWordSpacingSvg}</div>
              <input type="range" min="-0.05" max="0.2" step="0.01" value="0" class="theme-slider" id="themeWordSpacingSlider" oninput="changeWordSpacing(this.value)">
              <span class="theme-slider-value" id="wordSpacingValue">0%</span>
            </div>
          </div>
          <div class="theme-slider-item">
            <span class="theme-slider-label">${t.margins}</span>
            <div class="theme-slider-row">
              <div class="theme-slider-icon">${iconMarginsSvg}</div>
              <input type="range" min="0" max="100" step="5" value="0" class="theme-slider" id="themeMarginsSlider" oninput="changeMargins(this.value)">
              <span class="theme-slider-value" id="marginsValue">0%</span>
            </div>
          </div>
          <div class="theme-slider-item">
            <div class="theme-slider-row" style="justify-content:space-between;">
              <span class="theme-custom-row-title tr-justify">${t.justify}</span>
              <label class="theme-toggle">
                <input type="checkbox" id="themeJustifyToggle" onchange="toggleJustify(this.checked)">
                <span class="theme-toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="theme-slider-item">
            <div class="theme-slider-row" style="justify-content:space-between;">
              <span class="theme-custom-row-title tr-boldtext">${t.boldText}</span>
              <label class="theme-toggle">
                <input type="checkbox" id="themeBoldToggle" onchange="toggleBoldText(this.checked)">
                <span class="theme-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', (e) => {
    if (e.target.id === 'themeModal') closeThemeModal();
  });
  
  document.body.appendChild(overlay);
}

function setLanguage(lang, triggerRender = true) {
  try { localStorage.setItem('site_lang', lang); } catch (e) { }

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
    const ptTitle = 'Mioshie College';
    const jaTitle = '御教えカレッジ';
    // Preserve the logo-circle if it exists
    const logoCircle = headerLogo.querySelector('.logo-circle');
    headerLogo.innerHTML = '';
    if (logoCircle) headerLogo.appendChild(logoCircle);
    headerLogo.appendChild(document.createTextNode(lang === 'ja' ? jaTitle : ptTitle));
  }

  // Refresh mobile nav if it's open or exists
  const mobileNav = document.getElementById('mobileNavOverlay');
  if (mobileNav) {
    const t = MENU_TEXTS[lang] || MENU_TEXTS.pt;

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

  const searchClearText = document.getElementById('searchClearText');
  if (searchClearText) {
    searchClearText.textContent = lang === 'ja' ? '削除' : 'Apagar';
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
  if (searchIndex && searchIndex.length > 0 && !isFetchingIndex) return searchIndex;
  
  if (isFetchingIndex) {
    while (isFetchingIndex) {
      await new Promise(r => setTimeout(r, 200));
    }
    return searchIndex;
  }

  isFetchingIndex = true;
  const resultsEl = document.getElementById('searchResults');
  const currentLang = localStorage.getItem('site_lang') || 'pt';
  
  const updateLoadingMsg = (msg) => {
    if (resultsEl) resultsEl.innerHTML = `<li class="search-loading">${msg}</li>`;
  };

  const loadingMsg = currentLang === 'ja' ? '検索インデックスを読み込み中...' : 'Carregando índice de pesquisa...';
  updateLoadingMsg(loadingMsg);

  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  const allVolumes = ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4'];
  
  // Detect current volume to load it first (lazy loading)
  const pathMatch = window.location.pathname.match(/shumeic(\d)/);
  const urlParams = new URLSearchParams(window.location.search);
  const volParam = urlParams.get('vol') || urlParams.get('v');
  let currentVol = pathMatch ? `shumeic${pathMatch[1]}` : (volParam || null);
  
  // Prioritize current volume first, then load the rest
  const prioritized = currentVol 
    ? [currentVol, ...allVolumes.filter(v => v !== currentVol)]
    : allVolumes;

  try {
    searchIndex = [];
    for (let i = 0; i < prioritized.length; i++) {
      const vol = prioritized[i];
      try {
        const res = await fetch(`${basePath}site_data/search_index_${vol}.json`);
        if (!res.ok) throw new Error(`Falha ao carregar ${vol}`);
        const json = await res.json();
        searchIndex = searchIndex.concat(json);
        
        const progressMsg = currentLang === 'ja' 
          ? `インデックス読み込み中 (${i + 1}/${prioritized.length})...`
          : `Carregando índice (${i + 1}/${prioritized.length})...`;
        updateLoadingMsg(progressMsg);
        
        // After loading the first volume, allow search to start
        if (i === 0) {
          isFetchingIndex = false;
        }
      } catch (e) {
        console.warn(`Search index ${vol} failed:`, e);
      }
    }
    
    if (searchIndex.length === 0) {
      throw new Error("Nenhum dado de pesquisa encontrado.");
    }
  } catch (err) {
    console.error('Search index error:', err);
    const errorMsg = currentLang === 'ja' ? 'インデックスの読み込みに失敗しました。' : 'Erro ao carregar o índice. Verifique sua conexão.';
    if (resultsEl) resultsEl.innerHTML = `<li class="search-error">${errorMsg}</li>`;
  } finally {
    isFetchingIndex = false;
  }

  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  if (searchInput && clearBtn) {
    clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
  }

  return searchIndex;
}

window.clearSearch = function () {
  const input = document.getElementById('searchInput');
  const resultsEl = document.getElementById('searchResults');
  const clearBtn = document.getElementById('searchClear');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (resultsEl) resultsEl.innerHTML = '';
  if (clearBtn) clearBtn.style.display = 'none';
  sessionStorage.removeItem('searchQuery');
  sessionStorage.removeItem('searchResultsHtml');
}

window.openSearch = function () {
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('searchInput');
  if (modal) {
    modal.classList.add('active');
    if (input) {
      input.focus();
      const clearBtn = document.getElementById('searchClear');
      if (clearBtn) clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
      
      // If we have a query but no rendered results (e.g., after page reload),
      // re-trigger the search to generate results with correct onclick handlers
      const resultsEl = document.getElementById('searchResults');
      if (input.value.trim() && resultsEl && !resultsEl.querySelector('.search-result-item')) {
        getSearchIndex().then(() => {
          if (typeof performSearch === 'function') performSearch(input.value);
        });
        return;
      }
    }
    getSearchIndex();
  }
}

window.closeSearch = function () {
  const modal = document.getElementById('searchModal');
  if (modal) modal.classList.remove('active');
}

// performSearch is defined below (bilingual version with JP support)

window.openHistory = function () {
  const modal = document.getElementById('historyModal');
  const resultsEl = document.getElementById('historyResults');
  if (modal && resultsEl) {
    modal.classList.add('active');
    renderHistory();
    const clearAllBtn = document.getElementById('historyClearAll');
    const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
    if (clearAllBtn) clearAllBtn.style.display = history.length > 0 ? 'block' : 'none';
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
  const currentLang = localStorage.getItem('site_lang') || 'pt';

  if (history.length === 0) {
    const emptyMsg = currentLang === 'ja' ? '履歴なし。' : 'Nenhum histórico.';
    resultsEl.innerHTML = `<li class="search-empty">${emptyMsg}</li>`;
    const clearAllBtn = document.getElementById('historyClearAll');
    if (clearAllBtn) clearAllBtn.style.display = 'none';
    return;
  }

  resultsEl.innerHTML = history.map(item => {
    const vNum = item.vol.replace('shumeic', '');
    const fBase = item.file.replace('.html', '');
    let href = `${basePath}reader.html#v${vNum}/${fBase}`;
    // If we have a saved topic position, add it as a param
    if (item.topic && item.topic > 0) {
      href = `${basePath}reader.html?vol=${item.vol}&file=${item.file}&topic=${item.topic}`;
    }
    const date = new Date(item.time).toLocaleString();

    // Progress indicator for multi-topic pages
    let progressHtml = '';
    if (item.totalTopics && item.totalTopics > 1) {
      const topicNum = (item.topic || 0) + 1;
      const pct = Math.round((topicNum / item.totalTopics) * 100);
      const progressLabel = currentLang === 'ja'
        ? `トピック ${topicNum}/${item.totalTopics}`
        : `Tópico ${topicNum}/${item.totalTopics}`;
      progressHtml = `<div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
        <div style="flex:1; height:4px; background:var(--border); border-radius:2px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:var(--accent); border-radius:2px; transition:width 0.3s;"></div>
        </div>
        <span style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">${progressLabel}</span>
      </div>`;
    }

    return `<li><a href="${href}" class="search-result-item" onclick="closeHistory()"><div class="search-result-title">${item.title || item.file} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${vNum})</span></div><div class="search-result-context">${date}</div>${progressHtml}</a></li>`;
  }).join('');
}

window.clearAllHistory = function () {
  const currentLang = localStorage.getItem('site_lang') || 'pt';
  const confirmMsg = currentLang === 'ja' ? '履歴をすべて消去しますか？' : 'Tem certeza que deseja limpar todo o histórico?';
  if (confirm(confirmMsg)) {
    localStorage.removeItem('readHistory');
    renderHistory();
  }
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
  const currentLang = localStorage.getItem('site_lang') || 'pt';

  if (favorites.length === 0) {
    const emptyMsg = currentLang === 'ja' ? '保存された教えはありません。' : 'Nenhum ensinamento salvo.';
    resultsEl.innerHTML = `<li class="search-empty">${emptyMsg}</li>`;
    return;
  }

  // Sort by newest first
  favorites.sort((a, b) => b.time - a.time);

  resultsEl.innerHTML = favorites.map(item => {
    const vNum = item.vol.replace('shumeic', '');
    const fBase = item.file.replace('.html', '');
    const topicIdx = item.topic || 0;
    // Build link with topic param for auto-scroll
    let href;
    if (topicIdx > 0) {
      href = `${basePath}reader.html?vol=${item.vol}&file=${item.file}&topic=${topicIdx}`;
    } else {
      href = `${basePath}reader.html#v${vNum}/${fBase}`;
    }
    const date = new Date(item.time).toLocaleString();
    const savedLabel = currentLang === 'ja' ? '保存日' : 'Salvo em';

    // Topic badge for multi-topic pages
    let topicBadge = '';
    if (item.totalTopics && item.totalTopics > 1) {
      const topicLabel = currentLang === 'ja'
        ? `トピック ${topicIdx + 1}/${item.totalTopics}`
        : `Tópico ${topicIdx + 1}/${item.totalTopics}`;
      topicBadge = `<span style="display:inline-block; font-size:0.7rem; background:var(--accent); color:#fff; padding:1px 7px; border-radius:10px; margin-left:6px; vertical-align:middle;">${topicLabel}</span>`;
    }

    // Topic title and snippet
    let topicInfo = '';
    if (item.topicTitle && item.totalTopics > 1) {
      const cleanedTitle = item.topicTitle.replace(/^(Ensinamento|Orienta\u00e7\u00e3o|Palestra) de (Meishu-Sama|Mois\u00e9s)\s*[-:]?\s*/i, '').replace(/^["'](.*?)["']$/, '$1').trim();
      topicInfo += `<div style="font-size:0.85rem; color:var(--text-main); margin-top:3px; font-style:italic;">\u201c${cleanedTitle}\u201d</div>`;
    }
    if (item.snippet) {
      topicInfo += `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px; line-height:1.4; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${item.snippet}</div>`;
    }

    return `<li>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 24px; border-bottom: 1px solid var(--border);">
        <a href="${href}" class="search-result-item" onclick="closeFavorites()" style="flex: 1; border-bottom: none;"><div class="search-result-title">${item.title || item.file} <span style="font-size:0.8rem; color:var(--text-muted);">(Vol ${vNum})</span>${topicBadge}</div>${topicInfo}<div class="search-result-context">${savedLabel} ${date}</div></a>
        <button onclick="removeFavoriteFromModal('${item.vol}', '${item.file}', ${topicIdx})" style="background:none; border:none;  cursor:pointer; padding:8px; display:flex; align-items:center; justify-content:center; border-radius:8px; color:var(--accent);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
      </div>
    </li>`;
  }).join('');
}

window.removeFavoriteFromModal = function (volId, filename, topicIdx) {
  let favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
  // Support both legacy (no topic) and new (with topic) formats
  if (topicIdx !== undefined && topicIdx !== null) {
    favorites = favorites.filter(f => !(f.vol === volId && f.file === filename && (f.topic || 0) === topicIdx));
  } else {
    favorites = favorites.filter(f => !(f.vol === volId && f.file === filename));
  }
  try { localStorage.setItem('savedFavorites', JSON.stringify(favorites)); } catch (e) { }
  renderFavorites(); // re-render the list

  // Check if we are currently on the reader page for this item, and update the button if so
  if (window.location.pathname.includes('reader.html')) {
    const params = new URLSearchParams(window.location.search);
    const currentVol = params.get('vol');
    const currentFile = params.get('file');
    if (currentVol === volId && currentFile === filename) {
      // Only update button if no more favorites exist for this file
      const remaining = favorites.filter(f => f.vol === volId && f.file === filename);
      if (remaining.length === 0) {
        const btn = document.getElementById('favoriteBtn');
        if (btn) {
          btn.classList.remove('active');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
        }
      }
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
  try { localStorage.setItem('reader_font_size', FONT_SIZES[_currentFontSizeIdx]); } catch (e) { }
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

// --- Line Height Control ---
window.initLineHeight = function () {
  const saved = parseFloat(localStorage.getItem('reader_line_height') || '1.6');
  _applyLineHeight(saved);
  const slider = document.getElementById('themeLineHeightSlider');
  if (slider) slider.value = saved;
  const el = document.getElementById('lineHeightValue');
  if (el) el.textContent = saved.toFixed(1);
};

window.changeLineHeight = function (val) {
  const num = parseFloat(val);
  _applyLineHeight(num);
  try { localStorage.setItem('reader_line_height', num); } catch (e) { }
  const el = document.getElementById('lineHeightValue');
  if (el) el.textContent = num.toFixed(1);
};

function _applyLineHeight(val) {
  document.documentElement.style.setProperty('--reader-line-height', val);
}

// --- Advanced Customization Options ---
window.initAdvancedOptions = function () {
  // Letter Spacing
  const savedLetterSpacing = localStorage.getItem('reader_letter_spacing') || '0';
  _applyLetterSpacing(savedLetterSpacing);
  const letterSlider = document.getElementById('themeLetterSpacingSlider');
  if (letterSlider) letterSlider.value = savedLetterSpacing;
  const lsVal = document.getElementById('letterSpacingValue');
  if (lsVal) lsVal.textContent = Math.round(parseFloat(savedLetterSpacing) * 100) + '%';

  // Word Spacing
  const savedWordSpacing = localStorage.getItem('reader_word_spacing') || '0';
  _applyWordSpacing(savedWordSpacing);
  const wordSlider = document.getElementById('themeWordSpacingSlider');
  if (wordSlider) wordSlider.value = savedWordSpacing;
  const wsVal = document.getElementById('wordSpacingValue');
  if (wsVal) wsVal.textContent = Math.round(parseFloat(savedWordSpacing) * 100) + '%';

  // Margins
  const savedMargins = localStorage.getItem('reader_margins') || '0';
  _applyMargins(savedMargins);
  const marginsSlider = document.getElementById('themeMarginsSlider');
  if (marginsSlider) marginsSlider.value = savedMargins;
  const mVal = document.getElementById('marginsValue');
  if (mVal) mVal.textContent = Math.round(parseFloat(savedMargins)) + '%';

  // Justify Text
  const savedJustify = localStorage.getItem('reader_justify') === 'true';
  _applyJustify(savedJustify);
  const justifyToggle = document.getElementById('themeJustifyToggle');
  if (justifyToggle) justifyToggle.checked = savedJustify;

  // Bold Text Override
  const savedBold = localStorage.getItem('reader_bold') === 'true';
  _applyBoldText(savedBold);
  const boldToggle = document.getElementById('themeBoldToggle');
  if (boldToggle) boldToggle.checked = savedBold;

  // Customize toggle (show/hide sliders)
  const savedCustomize = localStorage.getItem('reader_customize') === 'true';
  const customizeToggle = document.getElementById('themeCustomizeToggle');
  const slidersGroup = document.getElementById('themeSlidersGroup');
  if (customizeToggle) customizeToggle.checked = savedCustomize;
  if (slidersGroup) slidersGroup.style.display = savedCustomize ? '' : 'none';
};

// Functions mapped to HTML Inputs
window.changeLetterSpacing = function (val) {
  _applyLetterSpacing(val);
  try { localStorage.setItem('reader_letter_spacing', val); } catch (e) { }
  const el = document.getElementById('letterSpacingValue');
  if (el) el.textContent = Math.round(parseFloat(val) * 100) + '%';
};

window.changeWordSpacing = function (val) {
  _applyWordSpacing(val);
  try { localStorage.setItem('reader_word_spacing', val); } catch (e) { }
  const el = document.getElementById('wordSpacingValue');
  if (el) el.textContent = Math.round(parseFloat(val) * 100) + '%';
};

window.changeMargins = function (val) {
  _applyMargins(val);
  try { localStorage.setItem('reader_margins', val); } catch (e) { }
  const el = document.getElementById('marginsValue');
  if (el) el.textContent = Math.round(parseFloat(val)) + '%';
};

window.toggleJustify = function (isChecked) {
  _applyJustify(isChecked);
  try { localStorage.setItem('reader_justify', isChecked); } catch (e) { }
};

window.toggleBoldText = function (isChecked) {
  _applyBoldText(isChecked);
  try { localStorage.setItem('reader_bold', isChecked); } catch (e) { }
};

window.toggleCustomize = function (isChecked) {
  const group = document.getElementById('themeSlidersGroup');
  if (!group) return;
  if (isChecked) {
    group.style.display = '';
    group.style.maxHeight = '0';
    group.style.opacity = '0';
    group.offsetHeight; // force reflow
    group.style.maxHeight = group.scrollHeight + 'px';
    group.style.opacity = '1';
    setTimeout(() => {
      group.style.maxHeight = '';
      const row = document.getElementById('customizeRow');
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 310);
  } else {
    group.style.maxHeight = group.scrollHeight + 'px';
    group.offsetHeight;
    group.style.maxHeight = '0';
    group.style.opacity = '0';
    setTimeout(() => { group.style.display = 'none'; group.style.maxHeight = ''; }, 300);
  }
  try { localStorage.setItem('reader_customize', isChecked); } catch (e) { }
};

// Internal Appliers
function _applyLetterSpacing(val) {
  const v = parseFloat(val);
  const computed = v === 0 ? 'normal' : v + 'em';
  document.documentElement.style.setProperty('--reader-letter-spacing', computed);
}

function _applyWordSpacing(val) {
  const v = parseFloat(val);
  const computed = v === 0 ? 'normal' : v + 'em';
  document.documentElement.style.setProperty('--reader-word-spacing', computed);
}

function _applyMargins(val) {
  const computed = val + 'px';
  document.documentElement.style.setProperty('--reader-margins', computed);
}

function _applyJustify(isChecked) {
  document.documentElement.style.setProperty('--reader-text-align', isChecked ? 'justify' : 'left');
}

function _applyBoldText(isChecked) {
  // Use a string representation 'bold' vs 'inherit' (to use standard theme weight)
  document.documentElement.style.setProperty('--reader-font-weight-override', isChecked ? '700' : 'inherit');
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
  // Load mode 
  const savedMode = localStorage.getItem('site_mode') || 'light';
  document.documentElement.setAttribute('data-mode', savedMode);

  // Initialize sliders
  if (typeof initLineHeight === 'function') initLineHeight();
  if (typeof initAdvancedOptions === 'function') initAdvancedOptions();
});

// --- DOM Initialization and Shared Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');

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

  // Restore search query from sessionStorage (will re-search on open for correct handlers)
  const savedQuery = sessionStorage.getItem('searchQuery');
  if (savedQuery && searchInput) {
    searchInput.value = savedQuery;
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = 'flex';
  }

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
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = query.trim() ? 'flex' : 'none';

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

// ============================================================
// SEARCH — bilingual search with Japanese (tj/cj) field support
// ============================================================
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
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('searchResultsHtml');
    return;
  }

  const isReaderPage = window.location.pathname.includes('reader.html');
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  const escapedParts = queryParts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const highlightRegex = new RegExp(`(${escapedParts.join('|')})`, 'gi');

  const resultsHtml = results.map(r => {
    const href = `${basePath}reader.html?vol=${r.v}&file=${r.f}&search=${encodeURIComponent(q)}`;
    const displayTitle = (activeLang === 'ja' && r.tj) ? r.tj : r.t;
    const highlight = (r.snippet || '')
      .replace(highlightRegex, '<mark class="search-highlight">$1</mark>');

    const escapedQ = q.replace(/'/g, "\\'");
    const navAttr = isReaderPage ? `onclick="if(typeof navigateToReader==='function'){ navigateToReader('${r.v}','${r.f}','${escapedQ}'); closeSearch(); return false; }"` : `onclick="closeSearch()"`;

    return `<li><a href="${href.replace(/\s+/g, '')}" class="search-result-item" ${navAttr}>
        <div class="search-result-title">${displayTitle} <span style="font-size:0.8rem;color:var(--text-muted)">(Vol ${r.v.slice(-1)})</span></div>
        <div class="search-result-context">${highlight}</div>
      </a></li>`;
  }).join('');

  resultsEl.innerHTML = resultsHtml;

  // Persist search state
  sessionStorage.setItem('searchQuery', query);
  sessionStorage.setItem('searchResultsHtml', resultsHtml);
}

// Smart Header functionality is unified with Immersion Mode above

// ============================================================
// SCROLL-TO-TOP BUTTON — injected dynamically on all pages
// ============================================================
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Don't add on reader page (reader has its own progress bar)
    if (window.location.pathname.includes('reader.html')) return;

    const btn = document.createElement('button');
    btn.id = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          btn.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  });
})();

// ============================================================
// OFFLINE SAVE — pre-cache ALL volumes for offline reading
// ============================================================
window.saveAllOffline = async function () {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  // Use a constant for consistency with sw.js
  const CACHE_NAME = 'shumei-pwa-v13';
  
  if (localStorage.getItem('offline_saved_all') === 'true') {
     // Optional: allow re-sync or just return
     // return; 
  }

  const label = document.getElementById('offlineSaveLabel');
  const currentLang = localStorage.getItem('site_lang') || 'pt';
  const basePath = window.location.pathname.includes('/shumeic') ? '../' : './';
  const volumes = ['shumeic1', 'shumeic2', 'shumeic3', 'shumeic4'];

  try {
    const cache = await caches.open(CACHE_NAME);
    let totalCached = 0;

    // Core app resources: Must match exactly what HTML files request
    const coreUrls = [
      `${basePath}`,
      `${basePath}index.html`,
      `${basePath}reader.html`,
      `${basePath}css/styles.min.css`, // Minified is preferred now
      `${basePath}js/toggle.min.js`,
      `${basePath}js/reader.min.js`,
      `${basePath}js/marked.min.js`,
      `${basePath}js/login.js`,
      `${basePath}site_data/global_index_titles.js`,
      `${basePath}favicon.svg`,
      `${basePath}icon-192.png`,
      `${basePath}manifest.json`,
    ];

    // Build the full list of URLs to cache
    let allUrls = [...coreUrls];
    
    // Add volume indexes and navigation JSONs
    for (const vol of volumes) {
      allUrls.push(`${basePath}site_data/${vol}_nav.json`);
      allUrls.push(`${basePath}${vol}/index.html`);
    }

    // Update label to "Preparing..."
    if (label) label.textContent = currentLang === 'ja' ? '準備中...' : 'Preparando...';

    // Step 1: Fetch navigation JSONs to discover all topic files
    const topicFiles = [];
    for (const vol of volumes) {
      try {
        const navRes = await fetch(`${basePath}site_data/${vol}_nav.json`);
        if (navRes.ok) {
           const navData = await navRes.json();
           const files = Array.isArray(navData) ? navData : (navData.topics || []);
           files.forEach(f => topicFiles.push(`${basePath}site_data/${vol}/${f}.json`));
        }
        // Also cache the search index
        topicFiles.push(`${basePath}site_data/search_index_${vol}.json`);
      } catch (e) {
        console.warn(`Error discovery topics for ${vol}:`, e);
      }
    }
    
    allUrls = allUrls.concat(topicFiles);
    // Remove duplicates
    allUrls = [...new Set(allUrls)];

    const totalFiles = allUrls.length;
    if (label) label.textContent = currentLang === 'ja' ? `保存中 (0/${totalFiles})...` : `Salvando (0/${totalFiles})...`;

    // Collect image URLs from topic JSON content
    const imageUrls = new Set();

    // Process in batches to avoid overwhelming the browser/network
    const batchSize = 10;
    for (let i = 0; i < allUrls.length; i += batchSize) {
      const batch = allUrls.slice(i, i + batchSize);
      await Promise.all(batch.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            // Clone before consuming body — needed to parse JSON for images
            const clone = response.clone();
            await cache.put(url, response);

            // Parse topic JSON files to discover image references
            if (url.endsWith('.json') && /\/shumeic\d\//.test(url)) {
              try {
                const data = await clone.json();
                const themes = data.themes || [];
                for (const theme of themes) {
                  for (const topic of (theme.topics || [])) {
                    const allContent = (topic.content || '') + (topic.content_ptbr || '');
                    const imgRe = /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp|svg))["']/gi;
                    let m;
                    while ((m = imgRe.exec(allContent)) !== null) {
                      const src = m[1];
                      if (src.startsWith('http') || src.startsWith('data:')) continue;
                      const imgPath = src.startsWith('assets/') ? src : `assets/images/${src}`;
                      imageUrls.add(`${basePath}${imgPath}`);
                    }
                  }
                }
              } catch (e) { /* not a parseable topic JSON, skip */ }
            }
          }
        } catch (e) {
          console.warn(`Failed to cache ${url}:`, e);
        }
        totalCached++;
      }));

      if (label) {
        label.textContent = currentLang === 'ja'
          ? `保存中 (${Math.min(totalCached, totalFiles)}/${totalFiles})...`
          : `Salvando (${Math.min(totalCached, totalFiles)}/${totalFiles})...`;
      }
    }

    // Cache discovered images
    if (imageUrls.size > 0) {
      const imgArray = [...imageUrls];
      const imgTotal = imgArray.length;
      let imgCached = 0;
      if (label) label.textContent = currentLang === 'ja'
        ? `画像保存中 (0/${imgTotal})...`
        : `Salvando imagens (0/${imgTotal})...`;

      for (let i = 0; i < imgArray.length; i += batchSize) {
        const batch = imgArray.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response);
          } catch (e) { console.warn(`Failed to cache image ${url}:`, e); }
          imgCached++;
        }));
        if (label) label.textContent = currentLang === 'ja'
          ? `画像保存中 (${Math.min(imgCached, imgTotal)}/${imgTotal})...`
          : `Salvando imagens (${Math.min(imgCached, imgTotal)}/${imgTotal})...`;
      }
    }

    localStorage.setItem('offline_saved_all', 'true');
    if (label) label.textContent = currentLang === 'ja' ? '✓ オフライン保存済み' : '✓ Salvo offline';
    
    // Refresh the page or notify SW?
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
       navigator.serviceWorker.controller.postMessage({ type: 'OFFLINE_READY' });
    }

  } catch (e) {
    console.error('Offline save error:', e);
    if (label) label.textContent = currentLang === 'ja' ? 'エラー' : 'Erro ao salvar';
    setTimeout(() => {
      if (label) label.textContent = currentLang === 'ja' ? 'オフライン保存' : 'Salvar offline';
    }, 3000);
  }
};
