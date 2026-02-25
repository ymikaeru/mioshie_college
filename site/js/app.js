/**
 * SHUMEI TEACHINGS — Main APP router (Study Mode)
 * Handles cascading dropdowns, rendering views, and state management.
 */

class App {
  constructor() {
    this.dataLoader = window.shumeiData;
    this.searchEngine = window.searchEngine;

    // Selects
    this.volSelect = document.getElementById('volSelect');
    this.themeSelect = document.getElementById('themeSelect');
    this.topicSelect = document.getElementById('topicSelect');

    // UI Elements
    this.readingPane = document.getElementById('readingPane');
    this.langToggle = document.getElementById('langToggle');
    this.backToTop = document.getElementById('backToTop');

    // State
    this.currentLang = 'pt';
  }

  async init() {
    const success = await this.dataLoader.init();

    if (!success) {
      this.readingPane.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <h2 style="color:red; margin-bottom: 8px;">Erro ao carregar dados</h2>
          <p style="color:var(--text-muted)">Verifique a pasta site/data/</p>
        </div>
      `;
      return;
    }

    if (this.searchEngine) {
      this.searchEngine.init(this.dataLoader.getAllTopics());
    }

    this.populateVolumes();
    this.bindEvents();
    this.handleRoute();
  }

  bindEvents() {
    // Dropdown change handlers
    this.volSelect.addEventListener('change', () => {
      this.populateThemes(this.volSelect.value);
      this.themeSelect.value = "";
      this.topicSelect.innerHTML = '<option value="" disabled selected>3. Escolha o Tópico</option>';
      this.topicSelect.disabled = true;
      this.updateHash(this.volSelect.value);
    });

    this.themeSelect.addEventListener('change', () => {
      this.populateTopics(this.volSelect.value, this.themeSelect.value);
      this.topicSelect.value = "";
      this.updateHash(this.volSelect.value, this.themeSelect.value);
    });

    this.topicSelect.addEventListener('change', () => {
      this.updateHash(this.volSelect.value, this.themeSelect.value, this.topicSelect.value);
      this.renderTopic();
    });

    // Language Toggle
    this.langToggle.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'pt' ? 'ja' : 'pt';

      const ptSpan = this.langToggle.querySelector('.lang-pt');
      const jaSpan = this.langToggle.querySelector('.lang-ja');

      if (this.currentLang === 'pt') {
        ptSpan.classList.add('active');
        jaSpan.classList.remove('active');
      } else {
        jaSpan.classList.add('active');
        ptSpan.classList.remove('active');
      }

      // Re-populate topics to translate titles in dropdown
      if (this.themeSelect.value !== "" && !this.themeSelect.disabled) {
        this.populateTopics(this.volSelect.value, this.themeSelect.value, true);
      }

      // Re-render current topic if reading
      if (this.topicSelect.value !== "" && !this.topicSelect.disabled) {
        this.renderTopic(false); // don't scroll on lang change
      }
    });

    // Hash routing
    window.addEventListener('hashchange', () => this.handleRoute());

    // Back to top
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        this.backToTop.classList.add('visible');
      } else {
        this.backToTop.classList.remove('visible');
      }
    });

    this.backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- POPULATORS ---

  populateVolumes(selectedVol = "") {
    const vols = this.dataLoader.getVolumes();
    let html = '<option value="" disabled selected>1. Escolha o Volume</option>';

    vols.forEach(v => {
      const shortName = v.meta.name.split(':')[0]; // e.g. "Volume 1"
      html += `<option value="${v.meta.id}">${shortName}</option>`;
    });

    this.volSelect.innerHTML = html;
    if (selectedVol) this.volSelect.value = selectedVol;
  }

  populateThemes(volId, selectedTheme = "") {
    if (!volId) return;
    const vol = this.dataLoader.getVolume(volId);
    if (!vol) return;

    let html = '<option value="" disabled selected>2. Escolha o Tema</option>';
    vol.themes.forEach((t, i) => {
      html += `<option value="${i}">${i + 1}. ${t.title}</option>`;
    });

    this.themeSelect.innerHTML = html;
    this.themeSelect.disabled = false;

    if (selectedTheme !== "") {
      this.themeSelect.value = selectedTheme;
    }
  }

  populateTopics(volId, themeIdx, retainSelection = false) {
    if (themeIdx === "" || themeIdx == null) return;
    const vol = this.dataLoader.getVolume(volId);
    if (!vol) return;

    const theme = vol.themes[themeIdx];
    if (!theme) return;

    let currentVal = this.topicSelect.value;

    let html = '<option value="" disabled selected>3. Escolha o Tópico</option>';
    theme.topics.forEach((t, i) => {
      const title = this.currentLang === 'pt' && t.pt.title ? t.pt.title : t.ja.title;
      html += `<option value="${i}">${i + 1}. ${title}</option>`;
    });

    this.topicSelect.innerHTML = html;
    this.topicSelect.disabled = false;

    if (retainSelection && currentVal !== "") {
      this.topicSelect.value = currentVal;
    }
  }

  // --- ROUTING / RENDER ---

  updateHash(v, t = "", p = "") {
    let hash = `#${v}`;
    if (t !== "") hash += `/t${t}`;
    if (p !== "") hash += `/p${p}`;

    // Only push if different to avoid infinite loops
    if (window.location.hash !== hash) {
      window.history.pushState(null, null, hash);
    }
  }

  handleRoute() {
    const hash = window.location.hash.slice(1);

    if (!hash) {
      this.resetToLanding();
      return;
    }

    const parts = hash.split('/');
    const volId = parts[0];
    const themeIdx = parts[1] ? parts[1].replace('t', '') : "";
    const topicIdx = parts[2] ? parts[2].replace('p', '') : "";

    // Set selectors (wait for data loader to have initialized)
    if (volId !== this.volSelect.value) {
      this.volSelect.value = volId;
      this.populateThemes(volId, themeIdx);
    } else if (themeIdx !== this.themeSelect.value) {
      this.populateThemes(volId, themeIdx);
    }

    if (themeIdx !== "") {
      this.populateTopics(volId, themeIdx, true);
    }

    if (topicIdx !== "") {
      this.topicSelect.value = topicIdx;
      this.renderTopic(true);
    } else {
      this.resetToLanding(true);
    }
  }

  resetToLanding(keepDropdowns = false) {
    if (!keepDropdowns) {
      this.volSelect.value = "";
      this.themeSelect.innerHTML = '<option value="" disabled selected>2. Escolha o Tema</option>';
      this.themeSelect.disabled = true;
      this.topicSelect.innerHTML = '<option value="" disabled selected>3. Escolha o Tópico</option>';
      this.topicSelect.disabled = true;
    }

    this.readingPane.innerHTML = `
      <div class="welcome-msg">
        <svg fill="currentColor" width="48" height="48" viewBox="0 0 24 24" style="color:var(--text-muted);margin-bottom:16px;opacity:0.3"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        <h2>Sistema de Estudo dos Ensinamentos</h2>
        <p>Selecione um Volume, Tema e Tópico no menu acima para iniciar a leitura.<br>Os tópicos fluirão automaticamente em uma interface limpa e focada.</p>
      </div>
    `;
  }

  renderTopic(doScroll = true) {
    const volId = this.volSelect.value;
    const themeIdx = this.themeSelect.value;
    const topicIdxStr = this.topicSelect.value;

    if (!volId || themeIdx === "" || topicIdxStr === "") return;

    const topicIdx = parseInt(topicIdxStr, 10);
    const topic = this.dataLoader.getTopic(volId, themeIdx, topicIdx);
    if (!topic) return;

    const vol = this.dataLoader.getVolume(volId);
    const theme = vol.themes[themeIdx];

    let showTitle = topic.pt.title;
    let showContent = topic.pt.content;
    let warning = '';

    // Language fallback
    if (this.currentLang === 'ja' || (!topic.hasTranslation)) {
      showTitle = topic.ja.title;
      showContent = topic.ja.content;

      if (this.currentLang === 'pt' && !topic.hasTranslation) {
        warning = `<div class="fallback-box">Este tópico ainda não possui tradução para o português. Exibindo o original.</div>`;
      }
    }

    const prevIdx = topicIdx - 1;
    const nextIdx = topicIdx + 1;
    const hasPrev = prevIdx >= 0;
    const hasNext = nextIdx < theme.topics.length;

    const html = `
      ${warning}
      <div class="topic-header">
        <h1 class="topic-title">${showTitle}</h1>
        <div class="topic-meta">
          ${topic.ja.date || 'Sem data'} 
          <span class="topic-meta-divider">/</span> 
          Tópico ${topicIdx + 1} de ${theme.topics.length}
        </div>
      </div>
      
      <div class="topic-content">
        ${showContent}
      </div>

      <div class="topic-nav">
        ${hasPrev
        ? `<button class="btn-nav" onclick="app.navigateOffset(-1)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> Anterior</button>`
        : '<div></div>'}
          
        ${hasNext
        ? `<button class="btn-nav" onclick="app.navigateOffset(1)">Próximo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>`
        : '<div></div>'}
      </div>
    `;

    this.readingPane.innerHTML = html;

    // Auto Scroll to Top of Reading Pane
    if (doScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Called by Prev/Next buttons
  navigateOffset(offset) {
    const currentIdx = parseInt(this.topicSelect.value, 10);
    const newIdx = currentIdx + offset;

    const max = this.topicSelect.options.length - 1; // subtract 1 for the disabled placeholder
    if (newIdx < 0 || newIdx >= max) return;

    this.topicSelect.value = newIdx;

    // Trigger change event to update hash and render
    this.topicSelect.dispatchEvent(new Event('change'));
  }
}

// Global exposure
window.app = new App();
document.addEventListener('DOMContentLoaded', () => window.app.init());
