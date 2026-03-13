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

        const topicParam = urlParams.get('topic');
        return { volId, filename, searchQuery: urlParams.get('search') || urlParams.get('s'), topicIdx: topicParam !== null ? parseInt(topicParam, 10) : null };
    }

    // Detect which topic div is most visible in the viewport
    function getVisibleTopicIndex() {
        const topics = container.querySelectorAll('.topic-content');
        if (topics.length <= 1) return 0;
        let bestIdx = 0, bestDist = Infinity;
        const viewMid = window.innerHeight / 3; // bias toward top third
        topics.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            // distance from element top to the "sweet spot" in viewport
            const dist = Math.abs(rect.top - viewMid);
            if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        });
        return bestIdx;
    }

    // Main render function
    function renderReader(volId, filename, json, allFiles, searchQuery) {
        const lang = localStorage.getItem('site_lang') || 'pt';
        const isPt = lang === 'pt';
        window._usedNavTitles = new Set();

        // Extract topics for this file (split format flattens them into the first theme)
        let topicsFound = [];
        if (json && json.themes) {
            json.themes.forEach(theme => {
                if (theme.topics) {
                    theme.topics.forEach(topic => {
                        topicsFound.push(topic);
                    });
                }
            });
        }

        if (topicsFound.length === 0) {
            container.innerHTML = `<div class="error">Tópico não encontrado.</div>`;
            return;
        }

        const fnameOnly = filename.split('/').pop();
        const currentIndex = allFiles.indexOf(fnameOnly);
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

        // Store topic metadata for favorites & history
        window._currentTopics = topicsFound;
        window._currentTotalTopics = topicsFound.length;

        // Update document state
        const cleanTitle = mainTitleToDisplay.replace(/<br\s*\/?>/gi, ' ');
        document.title = `Meishu-Sama: ${cleanTitle} - Mioshie College`;
        try {
            const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
            const filtered = history.filter(h => h.file !== filename || h.vol !== volId);
            filtered.unshift({ title: cleanTitle, vol: volId, file: filename, time: Date.now(), topic: 0, totalTopics: topicsFound.length });
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


        // Build main content innerHTML
        let contentHtml = "";
        topicsFound.forEach((topicData, index) => {
            const topicId = `topic-${index}`;
            let rawContent = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content || "") : (topicData.content || "");
            const activeTitle = isPt ? (topicData.title_ptbr || topicData.title_pt || topicData.publication_title_pt || "") : (topicData.title_ja || topicData.title || "");

            let headerHTML = "";
            const headerMatch = rawContent.match(/^([\s\S]{0,350}?)\(([^)]*\d+[^)]*)\)/);
            if (headerMatch) {
                let preText = headerMatch[1];
                let dateText = headerMatch[2];
                let pureTitle = preText.replace(/<[^>]+>/g, '').trim();
                
                if (pureTitle.length > 3 && pureTitle.length < 250 && !pureTitle.includes('。') && !pureTitle.includes('. ')) {
                    const quoteMatch = pureTitle.match(/["”]([^"”]+)["”]/);
                    if (quoteMatch) {
                        const prefixMatch = pureTitle.match(/^([^:]+)/); // Match up to colon instead of - to avoid breaking Meishu-Sama
                        let prefix = prefixMatch ? prefixMatch[1].trim() : "";
                        // If there is a hyphen but no colon, and it's something like "Ensinamento de Meishu-Sama - Title"
                        if(!pureTitle.includes(':') && pureTitle.includes(' - ')) {
                            prefix = pureTitle.split(' - ')[0].trim();
                        }
                        
                        // Clean up markdown asterisks from prefix if any leaked
                        prefix = prefix.replace(/\*/g, '');

                        if (prefix && prefix.toLowerCase() !== quoteMatch[1].toLowerCase()) {
                            pureTitle = `${prefix}: ${quoteMatch[1]}`;
                        } else {
                            pureTitle = quoteMatch[1];
                        }
                    } else {
                        pureTitle = pureTitle.replace(/\s+-\s+/, ': ').replace(/\s+:/, ':');
                    }
                    
                    headerHTML = `<b><font size="+2">${pureTitle.replace(/^\*\*|\*\*$/g, '')}</font></b><br/>(${dateText})<br/><br/>`;
                    rawContent = rawContent.substring(headerMatch[0].length).replace(/^([\s\n]*<br\s*\/?>[\s\n]*)+/gi, '');
                }
            }

            if (!headerHTML) {
                const contentAlreadyHasTitle = /^\s*<b[\s>]/i.test(rawContent.trim()) || /^\s*<font[\s>]/i.test(rawContent.trim());
                if (activeTitle && rawContent.trim() && !genericRegex.test(activeTitle) && !contentAlreadyHasTitle) {
                    const cTitle = activeTitle.replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\W]/g, '').toLowerCase();
                    const cStart = rawContent.substring(0, 500).replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\W]/g, '').toLowerCase();
                    if (cTitle.length > 5 && !cStart.includes(cTitle)) {
                        let pureTitle = activeTitle;
                        const quoteMatch = pureTitle.match(/["”]([^"”]+)["”]/);
                        if (quoteMatch) {
                            const prefixMatch = pureTitle.match(/^([^:]+)/);
                            let prefix = prefixMatch ? prefixMatch[1].trim() : "";
                            if(!pureTitle.includes(':') && pureTitle.includes(' - ')) {
                                prefix = pureTitle.split(' - ')[0].trim();
                            }
                            prefix = prefix.replace(/\*/g, '');

                            if (prefix && prefix.toLowerCase() !== quoteMatch[1].toLowerCase()) {
                                pureTitle = `${prefix}: ${quoteMatch[1]}`;
                            } else {
                                pureTitle = quoteMatch[1];
                            }
                        } else {
                            pureTitle = pureTitle.replace(/\s+-\s+/, ': ').replace(/\s+:/, ':');
                        }

                        const displayDate = topicData.date && topicData.date !== "Unknown" ? `<br/>\n(${topicData.date})` : "";
                        headerHTML = `<b><font size="+2">${pureTitle.replace(/^\*\*|\*\*$/g, '')}</font></b>${displayDate}<br/><br/>`;
                    }
                }
            }

            // Norm & Format
            const DBLBR = '\x01DBLBR\x01';
            const SGLBR = '\x03SGLBR\x03';
            let norm = rawContent
                .replace(/<br\s*\/?>/gi, DBLBR)
                .replace(/^(\s*(?:<[^>]+>)*\s*[（(][^）)]*\d+[^）)]*[）)])(?:\s|&nbsp;)+([^（(\s<])/i, '$1' + DBLBR + '$2')
                .replace(/^(\s*(?:<\/b>|<\/strong>|\*\*|<\/font>))(?:\s|&nbsp;)*([（(])/i, '$1' + SGLBR + '$2')
                .replace(/^(\s*(?:<\/b>|<\/strong>|\*\*|<\/font>))(?:\s|&nbsp;)+([^（(\s<])/i, '$1' + DBLBR + '$2')
                // Ensure colon after Q&A labels
                .replace(/(Pergunta do? (?:um )?fiel|Orientação de Meishu-Sama|Comentário do [Ff]iel|Resposta de Meishu-Sama|Ensinamento de Meishu-Sama|Palavras de Meishu-Sama)(?!\s*[:：])/gi, '$1:')
                .replace(/(\*{0,2})(Pergunta do? (?:um )?fiel|Orientação de Meishu-Sama|Ensinamento de Meishu-Sama|Resposta de Meishu-Sama|Comentário do [Ff]iel|Palavras de Meishu-Sama)/gi, DBLBR + '$1$2')
                .replace(/<br\s*\/?>\n?<br\s*\/?>\n?(?=\s*<(?:b>\s*)?<font\s+color)/gi, DBLBR)
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
            // Consecutives handled by paragraph mapping
            // Merge paragraphs where previous <p> ends with comma (no line break after comma)
            // Pattern 1: </p><p> directly
            formatted = formatted.replace(/,\s*<\/p>\s*\n?\s*<p>/g, ', ');
            // Pattern 2: </p><br><p> — happens when DBLBR separator is placed after a comma
            formatted = formatted.replace(/,\s*<\/p>\s*\n?<br>\s*\n?<p>/g, ', ');
            formatted = formatted.replace(/\s(color|bgcolor|size)=["'][^"']*["']/gi, '').replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');
            // Remove empty tags left after font stripping (e.g. <p><b></b></p>, <b>\n<br>\n</b>)
            formatted = formatted.replace(/<(b|strong|em|i|p)>\s*(<br\s*\/?>|\s|\n)*<\/\1>/gi, '').replace(/<(b|strong|em|i|p)>\s*<\/\1>/gi, '');

            let bCount = 0;
            formatted = formatted.replace(/<(b|strong)>(.*?)<\/\1>/gi, (match, tag, content) => {
                bCount++;
                const plain = content.replace(/<[^>]+>/g, '').trim();
                if (bCount === 1 || /Ensinamento|Orientação|Palestra|Palavras|Pergunta|Resposta|Salmo/i.test(plain)) return match;
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

            contentHtml += `<div id="${topicId}" class="topic-content" style="margin-top: ${index > 0 ? '40px' : '0'};">\n${headerHTML}\n${formatted}\n</div>`;
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
        `;

        // Initialize header favorite button state (Desktop & Mobile)
        window.updateFavIndicators = function () {
            const favs = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
            const pageFavs = favs.filter(f => f.vol === volId && f.file === filename);
            const count = pageFavs.length;
            const hasFavs = count > 0;
            const favLang = { pt: { saved: 'Salvo', save: 'Salvar' }, ja: { saved: '保存済み', save: '保存' } }[lang] || { saved: 'Salvo', save: 'Salvar' };

            // Update buttons
            [document.getElementById('favoriteBtn'), document.getElementById('mobileFavoriteBtn')].forEach(btn => {
                if (!btn) return;
                btn.title = hasFavs ? favLang.saved : favLang.save;
                btn.classList.toggle('active', hasFavs);
                const svg = btn.querySelector('svg');
                if (svg) svg.setAttribute('fill', hasFavs ? 'currentColor' : 'none');
                // Badge
                let badge = btn.querySelector('.fav-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'fav-badge';
                    btn.appendChild(badge);
                }
                badge.textContent = count;
                badge.classList.toggle('visible', count > 1);
            });

            // Topic dots
            const savedSet = new Set(pageFavs.map(f => f.topic || 0));
            const totalTopics = window._currentTotalTopics || 1;
            for (let i = 0; i < totalTopics; i++) {
                const topicEl = document.getElementById(`topic-${i}`);
                if (!topicEl) continue;
                let dot = topicEl.querySelector('.saved-topic-dot');
                if (!dot) {
                    const titleEl = topicEl.querySelector('b');
                    if (titleEl) {
                        dot = document.createElement('span');
                        dot.className = 'saved-topic-dot';
                        titleEl.appendChild(dot);
                    }
                }
                if (dot) dot.classList.toggle('visible', savedSet.has(i));
            }
        };
        window.updateFavIndicators();

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
                    // Extract title from rendered HTML instead of JSON (JSON titles are often duplicated)
                    const topicEl = document.getElementById(`topic-${i}`);
                    let extractedTitle = '';
                    if (topicEl) {
                        // Strategy 1: Get the first <b> or <strong> text (usually the title line)
                        const boldEl = topicEl.querySelector('b, strong');
                        if (boldEl) {
                            const boldText = boldEl.textContent.trim();
                            // Extract text in quotes if present: 'Palestra de Meishu-Sama: "Title Here"'
                            const quoteMatch = boldText.match(/[「"＂"](.*?)[」"＂"]/);
                            if (quoteMatch) {
                                extractedTitle = quoteMatch[1].trim();
                            } else {
                                // Remove common prefixes to get the unique part
                                extractedTitle = boldText
                                    .replace(/^(Ensinamento|Orientação|Palestra|Relato de Experiência)\s*(?:de\s+)?(Meishu-Sama|Moisés)?\s*[-:：]?\s*/i, '')
                                    .trim();
                            }
                        }
                        // Strategy 2: If no bold, try the first text content
                        if (!extractedTitle) {
                            const firstText = topicEl.textContent.substring(0, 200).trim();
                            const quoteMatch = firstText.match(/[「"＂"](.*?)[」"＂"]/);
                            if (quoteMatch) {
                                extractedTitle = quoteMatch[1].trim();
                            }
                        }
                    }

                    // Fallback to JSON title if HTML extraction failed
                    if (!extractedTitle) {
                        const tTitle = isPt ? (t.title_ptbr || t.title_pt || t.publication_title_pt) : t.title_ja;
                        extractedTitle = (tTitle || t.title || `Parte ${i + 1}`)
                            .replace(/^(Ensinamento|Orientação|Palestra) de (Meishu-Sama|Moisés)\s*[-:]?\s*/i, '')
                            .replace(/^"(.*?)"$/, '$1').trim();
                    }

                    // Truncate if too long
                    if (extractedTitle.length > 60) extractedTitle = extractedTitle.substring(0, 57) + '…';

                    return { value: `#topic-${i}`, text: `"${extractedTitle}"` };
                });
                const sectionLabel = lang === 'ja' ? '刊行物：テーマ' : 'Publicações deste ensinamento';
                window._updateMobileNavTopics(sectionLabel, opts);
            } else {
                window._updateMobileNavTopics('', []);
            }
        }

        // Auto-scroll to topic if specified via URL param
        const { topicIdx } = getParams();
        if (topicIdx !== null && topicIdx > 0) {
            const targetEl = document.getElementById(`topic-${topicIdx}`);
            if (targetEl) {
                setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
            }
        }
    }

    window.navigateToReader = async function (volId, filename, searchQuery) {
        let url = `reader.html?vol=${volId}&file=${filename}`;
        if (window.location.search.includes('lang=ja')) url += '&lang=ja';
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
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
            // 1. Fetch Navigation Array (cached globally)
            if (!window._volNavCache) window._volNavCache = {};
            if (!window._volNavCache[volId]) {
                const navRes = await fetch(`./${window.DATA_OUTPUT_DIR}/${volId}_nav.json`);
                if (navRes.ok) {
                    window._volNavCache[volId] = await navRes.json();
                } else {
                    window._volNavCache[volId] = [];
                }
            }

            // 2. Fetch specific article JSON directly
            const fnameOnly = filename.split('/').pop();
            const articlePath = fnameOnly.endsWith('.json') ? fnameOnly : `${fnameOnly}.json`;
            const articleRes = await fetch(`./${window.DATA_OUTPUT_DIR}/${volId}/${articlePath}?t=${Date.now()}`);

            if (!articleRes.ok) throw new Error('Network response was not ok');

            // Show a simple loading indicator inside the container just in case
            const progressBar = document.getElementById('loadingProgressBar');
            if (progressBar) progressBar.style.width = `100%`;

            const articleJson = await articleRes.json();
            renderReader(volId, filename, articleJson, window._volNavCache[volId], searchQuery);

        } catch (err) {
            console.error("Reader Error:", err);
            container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
        }
    }

    window.toggleFavorite = function () {
        const { volId, filename } = getParams();
        let favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
        const topicIndex = getVisibleTopicIndex();
        const title = document.title.replace('Meishu-Sama: ', '').replace(' - Mioshie College', '');
        const totalTopics = window._currentTotalTopics || 1;

        // Extract topic-specific title and snippet
        let topicTitle = '';
        let snippet = '';
        const topics = window._currentTopics || [];
        if (topics[topicIndex]) {
            const lang = localStorage.getItem('site_lang') || 'pt';
            const isPt = lang === 'pt';
            topicTitle = isPt
                ? (topics[topicIndex].title_ptbr || topics[topicIndex].title_pt || topics[topicIndex].title || '')
                : (topics[topicIndex].title_ja || topics[topicIndex].title || '');
            topicTitle = topicTitle.replace(/<[^>]+>/g, '').trim();
            // Extract snippet from rendered topic div
            const topicEl = document.getElementById(`topic-${topicIndex}`);
            if (topicEl) {
                const rawText = topicEl.textContent || '';
                // Skip leading title text and get body content
                const bodyStart = rawText.indexOf(topicTitle) !== -1 ? rawText.indexOf(topicTitle) + topicTitle.length : 0;
                snippet = rawText.substring(bodyStart, bodyStart + 120).replace(/\s+/g, ' ').trim();
                if (snippet.length >= 118) snippet += '…';
            }
        }

        // Check if this exact topic is already saved
        const isSaved = favorites.some(f => f.vol === volId && f.file === filename && (f.topic || 0) === topicIndex);

        if (isSaved) {
            favorites = favorites.filter(f => !(f.vol === volId && f.file === filename && (f.topic || 0) === topicIndex));
        } else {
            favorites.unshift({
                title, vol: volId, file: filename, time: Date.now(),
                topic: topicIndex, topicTitle, snippet, totalTopics
            });
        }
        localStorage.setItem('savedFavorites', JSON.stringify(favorites));

        const lang = localStorage.getItem('site_lang') || 'pt';
        if (typeof window.updateFavIndicators === 'function') window.updateFavIndicators();
        if (typeof renderFavorites === 'function') renderFavorites();

        // Show save tooltip
        const tooltip = document.getElementById('saveTooltip');
        if (tooltip) {
            const tooltipTitle = document.getElementById('saveTooltipTitle');
            const tooltipStatus = document.getElementById('saveTooltipStatus');
            const statusText = { pt: { saved: 'salvo', removed: 'removido' }, ja: { saved: '保存済み', removed: '削除済み' } }[lang] || { saved: 'salvo', removed: 'removido' };
            const rawTitle = topicTitle || title;
            const cleanTitle = rawTitle.replace(/^(Ensinamento|Orientação|Palestra) de (Meishu-Sama|Moisés)\s*[-:]\s*/i, '').replace(/^["'](.*?)["']$/, '$1').trim();
            tooltipTitle.textContent = cleanTitle;
            tooltipStatus.textContent = isSaved ? statusText.removed : statusText.saved;
            tooltip.classList.add('show');
            clearTimeout(window._saveTooltipTimer);
            window._saveTooltipTimer = setTimeout(() => tooltip.classList.remove('show'), 1800);
        }
    };

    window.renderContent = () => initReader();
    initReader();
    window.addEventListener('popstate', () => initReader());

    // Save reading position when leaving the page
    function saveReadingPosition() {
        try {
            const { volId, filename } = getParams();
            if (!volId || !filename) return;
            const topicIndex = getVisibleTopicIndex();
            const totalTopics = window._currentTotalTopics || 1;
            const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
            const existing = history.find(h => h.file === filename && h.vol === volId);
            if (existing) {
                existing.topic = topicIndex;
                existing.totalTopics = totalTopics;
                localStorage.setItem('readHistory', JSON.stringify(history));
            }
        } catch (e) { }
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveReadingPosition();
    });
    window.addEventListener('beforeunload', saveReadingPosition);
});
