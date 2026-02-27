
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

// --- Mobile Hamburger Menu ---
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.header__nav');
  if (!nav) return;

  // Create hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'Menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';

  // Insert before nav in header
  const header = document.querySelector('.header');
  if (header) {
    // Insert between logo and nav
    const logo = header.querySelector('.header__logo');
    if (logo && logo.nextSibling) {
      header.insertBefore(hamburger, logo.nextSibling);
    }
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });

  // Close nav when clicking a link
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    }
  });
});

// --- Back to Top Button ---
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
});

// --- Reading Progress Bar ---
document.addEventListener('DOMContentLoaded', () => {
  // Only show on reader pages (has topic-content)
  const content = document.querySelector('.topic-content');
  if (!content) return;

  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    bar.style.width = Math.min(100, scrolled) + '%';
  }, { passive: true });
});
