window.DATA_OUTPUT_DIR = 'site_data';
window._volDataCache = {}; // Global cache for volume JSON data

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('readerContainer');
    const genericRegex = /O Método do Johrei|Princípio do Johrei|Sobre a Verdade|Verdade \d|Ensinamento \d|Parte \d|JH\d|JH \d|Publicação \d|Agricultura Natural|Instrução Divina|Purificação Equilibrada|Coletânea de fragmentos/i;

    // Helper to get current params from URL or provided arguments
    function getParams(ovrVol, ovrFile) {
        const urlParams = new URLSearchParams(window.location.search);
        let volId = ovrVol || urlParams.get('vol') || urlParams.get('v');
        let filename = ovrFile || urlParams.get('file') || urlParams.get('f');

        // Allow hash-based navigation: #v4/filename
        if (!ovrVol && !ovrFile) {
            const hash = window.location.hash.substring(1).replace(/^#/, '');
            const hashMatch = hash.match(/^v(\d+)\/(.+)$/i);
            if (hashMatch) {
                volId = `shumeic${hashMatch[1]}`;
                filename = hashMatch[2];
            }
        }

        if (volId && !volId.startsWith('shumeic')) volId = `shumeic${volId}`;
        if (filename && !filename.endsWith('.html')) filename += '.html';

        return { volId, filename, searchQuery: urlParams.get('search') || urlParams.get('s') };
    }

    // Main render function
    function renderReader(volId, filename, json, searchQuery) {
        const lang = localStorage.getItem('site_lang') || 'pt';
        const isPt = lang === 'pt';
        window._usedNavTitles = new Set();

        // Find topics for this file
        let topicsFound = [];
        const allFiles = [];
        json.themes.forEach(theme => {
            theme.topics.forEach(topic => {
                const f = topic.source_file || topic.filename || "";
                if (f && !allFiles.includes(f)) allFiles.push(f);
                if (f === filename || f.endsWith('/' + filename)) {
                    topicsFound.push(topic);
                }
            });
        });

        if (topicsFound.length === 0) {
            container.innerHTML = `<div class="error">Tópico não encontrado.</div>`;
            return;
        }

        const currentIndex = allFiles.indexOf(filename);
        const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
        const nextFile = currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

        // Title Selection Logic
        let indexTitles = {};
        try { indexTitles = window.GLOBAL_INDEX_TITLES || {}; } catch (e) { }

        const indexTitlesForVol = indexTitles[volId] || {};
        let indexTitle = indexTitlesForVol[filename];
        if (!indexTitle && filename) {
            const baseFile = filename.split('/').pop().toLowerCase();
            const matchingKey = Object.keys(indexTitlesForVol).find(k => k.toLowerCase() === baseFile || k.toLowerCase() === filename.toLowerCase());
            if (matchingKey) indexTitle = indexTitlesForVol[matchingKey];
        }
        const jaSpecificTitle = topicsFound[0].title_ja || topicsFound[0].title;
        const ptSpecificTitle = topicsFound[0].title_ptbr || topicsFound[0].title_pt || topicsFound[0].title;

        let mainTitleToDisplay = indexTitle || (isPt ? ptSpecificTitle : jaSpecificTitle);

        // Language-specific title fallback
        if (!isPt && mainTitleToDisplay) {
            const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(mainTitleToDisplay);
            if (!hasJapanese && jaSpecificTitle && jaSpecificTitle !== mainTitleToDisplay) {
                mainTitleToDisplay = jaSpecificTitle;
            }
        }

        // Update document state
        const cleanTitle = mainTitleToDisplay.replace(/<br\s*\/?>/gi, ' ');
        document.title = `Meishu-Sama: ${cleanTitle} - Biblioteca Sagrada`;
        try {
            const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
            const filtered = history.filter(h => h.file !== filename || h.vol !== volId);
            filtered.unshift({ title: cleanTitle, vol: volId, file: filename, time: Date.now() });
            localStorage.setItem('readHistory', JSON.stringify(filtered.slice(0, 20)));
        } catch (e) { }

        // Update Back to Index button
        const backBtn = document.getElementById('backToIndexBtn');
        if (backBtn) {
            let indexUrl = 'index.html';
            if (volId === 'shumeic1') indexUrl = 'shumeic1/index.html';
            else if (volId === 'shumeic2') indexUrl = 'shumeic2/index.html';
            else if (volId === 'shumeic3') indexUrl = 'shumeic3/index.html';
            else if (volId === 'shumeic4') indexUrl = 'shumeic4/index.html';

            // Adjust path if needed (though reader.html is currently root-level)
            backBtn.href = indexUrl;
            backBtn.style.display = 'flex';
        }

        // Navigation Elements Footer
        const nl = { pt: { prev: '← Anterior', next: 'Próximo →' }, ja: { prev: '← 前へ', next: '次へ →' } }[lang] || { prev: '← Anterior', next: 'Próximo →' };
        const navFooter = `
            <div class="reader-nav-footer" style="display: flex; justify-content: space-between; margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--border);">
                ${prevFile ? `<a href="javascript:void(0)" onclick="navigateToReader('${volId}','${prevFile}')" class="btn-zen" style="text-decoration:none">${nl.prev}</a>` : '<span></span>'}
                ${nextFile ? `<a href="javascript:void(0)" onclick="navigateToReader('${volId}','${nextFile}')" class="btn-zen" style="text-decoration:none">${nl.next}</a>` : '<span></span>'}
            </div>
        `;

        // Toolbar HTML
        const fl = { pt: { saved: 'Salvo', save: 'Salvar', top: 'Topo' }, ja: { saved: '保存済み', save: '保存', top: 'トップ' } }[lang] || { saved: 'Salvo', save: 'Salvar', top: 'Topo' };
        const favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
        const isFavorited = favorites.some(f => f.vol === volId && f.file === filename);
        const favClass = isFavorited ? 'active' : '';
        const favIcon = isFavorited
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

        const toolbarHtml = `
            <div class="reader-toolbar">
                <button class="btn-zen ${favClass}" id="favoriteBtn" onclick="toggleFavorite()">
                    ${favIcon}
                    <span class="toolbar-tooltip">${isFavorited ? fl.saved : fl.save}</span>
                </button>
                <div class="toolbar-divider"></div>
                <button class="btn-zen" id="topBtn" onclick="window.scrollTo({top:0,behavior:'smooth'})">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                     <span class="toolbar-tooltip">${fl.top}</span>
                </button>
            </div>
        `;

        // Build main content innerHTML
        let contentHtml = "";
        topicsFound.forEach((topicData, index) => {
            const topicId = `topic-${index}`;
            let rawContent = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content || "") : (topicData.content || "");
            const activeTitle = isPt ? (topicData.title_ptbr || topicData.title_pt || topicData.publication_title_pt || "") : (topicData.title_ja || topicData.title || "");

            // Unified Title Injection
            const contentAlreadyHasTitle = /^\s*<b[\s>]/i.test(rawContent.trim());
            if (activeTitle && rawContent.trim() && !genericRegex.test(activeTitle) && !contentAlreadyHasTitle) {
                const cTitle = activeTitle.replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\W]/g, '').toLowerCase();
                const cStart = rawContent.substring(0, 500).replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\W]/g, '').toLowerCase();
                if (cTitle.length > 5 && !cStart.includes(cTitle)) {
                    const displayDate = topicData.date && topicData.date !== "Unknown" ? `<br/>\n(${topicData.date})` : "";
                    rawContent = `<b><font size="+2">${activeTitle}</font></b>${displayDate}<br/><br/>` + rawContent;
                }
            }

            // Norm & Format
            const DBLBR = '\x01DBLBR\x01';
            const SGLBR = '\x03SGLBR\x03';
            let norm = rawContent
                .replace(/<br\s*\/?>\n?<br\s*\/?>\n?<br\s*\/?>\n?/gi, DBLBR)
                .replace(/([）)][^<\n]*)(?:<br\s*\/?>\n?|\n){2,}/gi, '$1' + DBLBR)
                .replace(/(<\/b>|<\/strong>|\*\*|<\/font>)(?:\s|&nbsp;)*([（(])/gi, '$1' + SGLBR + '$2')
                // Ensure colon after Q&A labels
                .replace(/(Pergunta do fiel|Orientação de Meishu-Sama|Comentário do [Ff]iel|Resposta de Meishu-Sama|Ensinamento de Meishu-Sama)(?!\s*[:：])/gi, '$1:')
                .replace(/(Pergunta do fiel|Orientação de Meishu-Sama)/gi, DBLBR + '$1')
                .replace(/<br\s*\/?>\n?<br\s*\/?>\n?(?=\s*<(?:b>\s*)?<font\s+color)/gi, DBLBR)
                .replace(/<br\s*\/?>\n<br\s*\/?>\n/gi, ' ')
                .replace(/<br\s*\/?>\n/gi, ' ')
                .replace(/<br\s*\/?>/gi, ' ')
                .replace(/\n/g, ' ')
                // No line break after comma: merge word that follows a comma at end of line
                .replace(/,\s+/g, ', ')
                .replace(/\x01DBLBR\x01/g, '\n\n\x02DBLBR\x02\n\n')
                .replace(/\x03SGLBR\x03/g, '<br/>\n')
                .replace(/[ \t]{2,}/g, ' ').trim();

            let formatted;
            if (typeof marked !== 'undefined' && /(\*\*|__|###|# |\[|\*|_)/.test(norm)) {
                formatted = marked.parse(norm);
            } else {
                formatted = norm.split(/\n\n+/).filter(p => p.trim()).map(p => {
                    const t = p.trim();
                    return t === '\x02DBLBR\x02' ? '<br>' : `<p>${t}</p>`;
                }).join('\n');
            }
            formatted = formatted.replace(/<p>\s*\x02DBLBR\x02\s*<\/p>/g, '<br>').replace(/\x02DBLBR\x02/g, '<br>');
            // Merge paragraphs where previous <p> ends with comma (no line break after comma)
            // Pattern 1: </p><p> directly
            formatted = formatted.replace(/,\s*<\/p>\s*\n?\s*<p>/g, ', ');
            // Pattern 2: </p><br><p> — happens when DBLBR separator is placed after a comma
            formatted = formatted.replace(/,\s*<\/p>\s*\n?<br>\s*\n?<p>/g, ', ');
            formatted = formatted.replace(/\s(color|bgcolor|size)=["'][^"']*["']/gi, '').replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');

            let bCount = 0;
            formatted = formatted.replace(/<(b|strong)>(.*?)<\/\1>/gi, (match, tag, content) => {
                bCount++;
                const plain = content.replace(/<[^>]+>/g, '').trim();
                if (bCount === 1 || /Ensinamento|Orientação|Palestra|Pergunta|Resposta|Salmo/i.test(plain)) return match;
                return content;
            });

            formatted = formatted.replace(/style=["']([^"']+)["']/gi, (m, s) => {
                const c = s.replace(/color\s*:\s*[^;]+;?/gi, '').trim();
                return c ? `style="${c}"` : '';
            }).replace(/\sstyle=["']\s*["']/gi, '');
            formatted = formatted.replace(/\u3000+/g, (m) => ' '.repeat(Math.min(m.length, 4)));
            formatted = formatted.replace(/\*([^\*\s][^\*]*?)\*/g, '<i>$1</i>');
            formatted = formatted.replace(/src=["']([^"']+)["']/g, (m, s) => {
                if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('assets/')) return m;
                return `src="assets/images/${s}"`;
            });

            contentHtml += `<div id="${topicId}" class="topic-content" style="margin-top: ${index > 0 ? '40px' : '0'};">${formatted}</div>`;
        });

        const bl = { pt: { home: 'Início', volume: 'Volume' }, ja: { home: 'トップ', volume: '巻' } }[lang] || { home: 'Início', volume: 'Volume' };
        const volPath = `${volId}/index.html`;

        container.innerHTML = `
            <nav class="breadcrumbs">
                <a href="index.html">${bl.home}</a> <span>/</span> 
                <a href="${volPath}">${bl.volume} ${volId.slice(-1)}</a> <span>/</span>
                <span style="color:var(--text-main)">${cleanTitle}</span>
            </nav>
            <div class="reader-container">
                ${contentHtml}
                ${navFooter}
            </div>
            ${toolbarHtml}
        `;

        // Search Highlighting
        if (searchQuery) {
            const isCJK = (str) => /[\u3000-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/.test(str);

            // Separate query logic by language
            const queryParts = searchQuery.trim().split('&').map(p => p.trim()).filter(p => {
                if (isPt) {
                    // In PT mode, skip CJK search terms and require length >= 2
                    return !isCJK(p) && p.length >= 2;
                } else {
                    // In JA mode, allow single CJK characters, require 2 for Latin
                    return isCJK(p) ? p.length >= 1 : p.length >= 2;
                }
            });

            if (queryParts.length > 0) {
                // Use case-insensitive flag only for non-CJK queries
                const regexFlags = queryParts.some(isCJK) ? 'g' : 'gi';
                const highlightRegex = new RegExp(`(${queryParts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, regexFlags);

                container.querySelectorAll('.topic-content').forEach(block => {
                    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    const textNodes = [];
                    while (node = walker.nextNode()) textNodes.push(node);

                    textNodes.forEach(textNode => {
                        const val = textNode.nodeValue;
                        if (!val.trim()) return;

                        // Separate matching logic:
                        // In PT mode, only highlight if the text itself ISN'T Japanese
                        // In JA mode, only highlight if the text IS Japanese (unless we have a Latin query part)
                        const textIsCJK = isCJK(val);
                        if (isPt && textIsCJK) return;
                        if (!isPt && !textIsCJK && !queryParts.some(p => !isCJK(p))) return;

                        const matches = queryParts.some(part => {
                            if (isCJK(part)) return val.includes(part);
                            return val.toLowerCase().includes(part.toLowerCase());
                        });

                        if (matches) {
                            const span = document.createElement('span');
                            span.innerHTML = val.replace(highlightRegex, '<mark class="search-highlight">$1</mark>');
                            textNode.parentNode.replaceChild(span, textNode);
                        }
                    });
                });
                const first = container.querySelector('mark');
                if (first) setTimeout(() => first.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
            }
        }

        // Update mobile nav topics if multiple exist
        if (typeof window._updateMobileNavTopics === 'function') {
            if (topicsFound.length > 1) {
                const opts = topicsFound.map((t, i) => {
                    const tTitle = isPt ? (t.title_ptbr || t.title_pt || t.publication_title_pt) : t.title_ja;
                    const pTitle = tTitle || t.title || `Parte ${i + 1}`;

                    const cleanedTitle = pTitle.replace(/^(Ensinamento|Orientação|Palestra) de (Meishu-Sama|Moisés)\s*[-:]?\s*/i, '').replace(/^"(.*?)"$/, '$1').trim();
                    const sidebarText = `"${cleanedTitle}"`;
                    return { value: `#topic-${i}`, text: sidebarText };
                });
                const sectionLabel = lang === 'ja' ? '刊行物：テーマ' : 'Publicações deste ensinamento';
                window._updateMobileNavTopics(sectionLabel, opts);
            } else {
                window._updateMobileNavTopics('', []);
            }
        }
    }

    window.navigateToReader = async function (volId, filename) {
        const url = `reader.html?vol=${volId}&file=${filename}${window.location.search.includes('lang=ja') ? '&lang=ja' : ''}`;
        window.history.pushState({ volId, filename }, '', url);
        initReader(volId, filename);
        window.scrollTo(0, 0);
    };

    async function initReader(ovrVol, ovrFile) {
        const { volId, filename, searchQuery } = getParams(ovrVol, ovrFile);
        if (!volId || !filename) {
            container.innerHTML = `<div class="error">Selecione um ensinamento no índice.</div>`;
            return;
        }

        try {
            if (!window._volDataCache[volId]) {
                const response = await fetch(`./${window.DATA_OUTPUT_DIR}/${volId}_data_bilingual.json`);
                window._volDataCache[volId] = await response.json();
            }
            renderReader(volId, filename, window._volDataCache[volId], searchQuery);
        } catch (err) {
            container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
        }
    }

    window.toggleFavorite = function () {
        const { volId, filename } = getParams();
        let favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
        const isSaved = favorites.some(f => f.vol === volId && f.file === filename);
        const title = document.title.replace('Meishu-Sama: ', '').replace(' - Biblioteca Sagrada', '');

        if (isSaved) {
            favorites = favorites.filter(f => !(f.vol === volId && f.file === filename));
        } else {
            favorites.unshift({ title, vol: volId, file: filename, time: Date.now() });
        }
        localStorage.setItem('savedFavorites', JSON.stringify(favorites));

        const btn = document.getElementById('favoriteBtn');
        if (btn) {
            btn.classList.toggle('active');
            const svg = btn.querySelector('svg');
            const tooltip = btn.querySelector('.toolbar-tooltip');
            const lang = localStorage.getItem('site_lang') || 'pt';
            const fl = { pt: { saved: 'Salvo', save: 'Salvar' }, ja: { saved: '保存済み', save: '保存' } }[lang] || { saved: 'Salvo', save: 'Salvar' };

            if (btn.classList.contains('active')) {
                svg.setAttribute('fill', 'currentColor');
                tooltip.textContent = fl.saved;
            } else {
                svg.setAttribute('fill', 'none');
                tooltip.textContent = fl.save;
            }
        }
        if (typeof renderFavorites === 'function') renderFavorites();
    };

    window.renderContent = () => initReader();
    initReader();
    window.addEventListener('popstate', () => initReader());
});
