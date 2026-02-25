/**
 * SHUMEI TEACHINGS — Search Engine (Study Mode)
 * Client-side full-text search across all loaded topics.
 */

class SearchEngine {
    constructor() {
        this.topics = [];
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');

        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
            this.searchInput.addEventListener('focus', this.handleSearch.bind(this));

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.closeResults();
                }
            });
        }
    }

    init(topics) {
        this.topics = topics || [];
    }

    handleSearch(e) {
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            this.closeResults();
            return;
        }

        const maxResults = 12;
        const results = [];

        for (const topic of this.topics) {
            if (results.length >= maxResults) break;

            const titleJA = topic.ja.title.toLowerCase();
            const contentJA = topic.ja.content.toLowerCase();
            const titlePT = topic.pt.title.toLowerCase();
            const contentPT = topic.pt.content.toLowerCase();

            let matchType = null;
            let matchedText = '';

            // Prioritize PT as requested by user
            if (titlePT.includes(query)) {
                matchType = 'Título PT';
                matchedText = topic.pt.title;
            } else if (titleJA.includes(query)) {
                matchType = 'Título JP';
                matchedText = topic.ja.title;
            } else if (contentPT.includes(query)) {
                matchType = 'Conteúdo PT';
                matchedText = this.getSnippet(topic.pt.content, query);
            } else if (contentJA.includes(query)) {
                matchType = 'Conteúdo JP';
                matchedText = this.getSnippet(topic.ja.content, query);
            }

            if (matchType) {
                results.push({
                    topic,
                    matchType,
                    snippet: this.highlight(matchedText, query)
                });
            }
        }

        this.renderResults(results, query);
    }

    getSnippet(text, query) {
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        const cleanTextLower = cleanText.toLowerCase();

        const idx = cleanTextLower.indexOf(query);
        if (idx === -1) return '';

        const start = Math.max(0, idx - 40);
        const end = Math.min(cleanText.length, idx + query.length + 40);

        let snippet = cleanText.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < cleanText.length) snippet = snippet + '...';

        return snippet;
    }

    highlight(text, query) {
        if (!text) return '';
        const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    renderResults(results, origQuery) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `<div class="search-results__empty">Nenhum resultado para "${origQuery}"</div>`;
            this.searchResults.classList.add('active');
            return;
        }

        const html = results.map(res => {
            const hash = `#${res.topic.volId}/t${res.topic.themeIdx}/p${res.topic.topicIdx}`;
            // Prioritize PT title for display
            const title = res.topic.pt.title || res.topic.ja.title;

            return `
          <a class="search-results__item" href="${hash}" onclick="window.searchEngine.closeResults()">
            <div class="search-results__item-title">${title}</div>
            <div class="search-results__item-meta">
              ${res.matchType}: ${res.snippet}
            </div>
          </a>
        `;
        }).join('');

        this.searchResults.innerHTML = html;
        this.searchResults.classList.add('active');
    }

    closeResults() {
        if (this.searchResults) {
            this.searchResults.classList.remove('active');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

window.searchEngine = new SearchEngine();
