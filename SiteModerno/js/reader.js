window.DATA_OUTPUT_DIR = 'site_data';

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
            window._usedNavTitles = new Set();

            let currentTopics = topicsFound;
            if (isPt) {
                currentTopics = topicsFound.filter(t => (t.content_ptbr && t.content_ptbr.trim() !== "") || (t.content_pt && t.content_pt.trim() !== ""));
                if (currentTopics.length === 0) currentTopics = topicsFound;
            }

            let indexTitles = {};
            try {
                indexTitles = window.GLOBAL_INDEX_TITLES || {};
            } catch (e) { }

            const indexTitle = (indexTitles[volId] && indexTitles[volId][filename]) ? indexTitles[volId][filename] : null;
            const fallbackTitle = isPt ? (currentTopics[0].title_ptbr || currentTopics[0].title_pt || currentTopics[0].title) : currentTopics[0].title;
            let mainTitleToDisplay = (isPt && indexTitle) ? indexTitle : fallbackTitle;

            // If title is generic or missing, peek into topics for a better one
            const genericRegex = /O Método do Johrei|Princípio do Johrei|Sobre a Verdade|Verdade \d|Ensinamento \d|Parte \d|JH\d|JH \d|Publicação \d|Agricultura Natural|Instrução Divina|Purificação Equilibrada|Coletânea de fragmentos/i;
            let isGeneric = !mainTitleToDisplay || genericRegex.test(mainTitleToDisplay);
            if (isGeneric) {
                for (let t of currentTopics) {
                    const raw = isPt ? (t.content_ptbr || t.content_pt || t.content) : t.content;
                    if (!raw || raw.length < 20) continue;
                    const doc = new DOMParser().parseFromString(raw, 'text/html');
                    const span = doc.querySelector('span, b, font');
                    if (span) {
                        let text = span.textContent.trim();
                        let quoteMatch = text.match(/[“"']([^”"']+)[”"']/);
                        let extracted = quoteMatch ? quoteMatch[1] : text.replace(/Ensinamento de Meishu-Sama:\s*|Orientação de Meishu-Sama:\s*|Palestra de Meishu-Sama:\s*|明主様御垂示\s*|明主様御講話\s*/gi, '');
                        if (extracted.length > 5 && extracted.length < 150) {
                            mainTitleToDisplay = extracted;
                            isGeneric = false; // Successfully promoted a real title
                            break;
                        }
                    }
                }
            }

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
            } catch (e) { }

            // --- Navigation / Toolbar State ---
            window.toggleFavorite = function () {
                let favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
                const isSaved = favorites.some(f => f.vol === volId && f.file === filename);

                if (isSaved) {
                    favorites = favorites.filter(f => !(f.vol === volId && f.file === filename));
                } else {
                    favorites.unshift({
                        title: mainTitleToDisplay.replace(/<br\s*\/?>/gi, ' '),
                        vol: volId,
                        file: filename,
                        time: Date.now()
                    });
                }
                localStorage.setItem('savedFavorites', JSON.stringify(favorites));

                // Update Button State
                const btn = document.getElementById('favoriteBtn');
                if (btn) {
                    if (!isSaved) {
                        btn.classList.add('active');
                        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                         <span class="toolbar-tooltip">Salvo</span>`;
                    } else {
                        btn.classList.remove('active');
                        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                         <span class="toolbar-tooltip">Salvar</span>`;
                    }
                }
                // If favorites modal is open, re-render it
                if (typeof renderFavorites === 'function') renderFavorites();
            };

            const firstDate = topicsFound[0].date && topicsFound[0].date !== "Unknown" ? topicsFound[0].date : "";
            let fullHtml = "";


            const navSelect = document.getElementById('readerTopicSelect');
            if (navSelect) {
                navSelect.innerHTML = '<option value="">Publicações</option>';
                navSelect.style.display = 'none';

                // Robust scroll listener
                navSelect.onchange = (e) => {
                    const targetId = e.target.value;
                    if (!targetId) return;
                    const element = document.querySelector(targetId);
                    if (element) {
                        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                        const offset = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                        window.scrollTo({ top: offset, behavior: 'smooth' });
                    }
                };
            }

            currentTopics.forEach((topicData, index) => {
                const topicId = `topic-${index}`;

                // Content cleanup and Markdown conversion
                let rawContent = "";
                if (isPt) {
                    rawContent = topicData.content_ptbr || topicData.content_pt || topicData.content || "";

                    // Conditional Title Injection for Portuguese
                    const ptTitle = topicData.title_ptbr || topicData.title_pt || topicData.publication_title_pt || "";
                    // Skip injection if content already starts with <b> — the HTML source itself
                    // already has an embedded title (e.g. "Ensinamento de Meishu-Sama: '...'").
                    // Injecting the generic JSON title (e.g. "Causa Fundamental da Doença 1")
                    // on top of it would create a duplicate/wrong title.
                    const contentAlreadyHasTitle = /^\s*<b[\s>]/i.test(rawContent.trim());
                    if (ptTitle && rawContent.trim() && !genericRegex.test(ptTitle) && !contentAlreadyHasTitle) {
                        // Check if title is already there (ignoring HTML and whitespace)
                        const cleanTitle = ptTitle.replace(/<[^>]+>/g, '').replace(/[\s\d\W]/g, '').toLowerCase();
                        const contentStartClean = rawContent.substring(0, 500).replace(/<[^>]+>/g, '').replace(/[\s\d\W]/g, '').toLowerCase();

                        if (cleanTitle.length > 5 && !contentStartClean.includes(cleanTitle)) {
                            const displayDate = topicData.date && topicData.date !== "Unknown" ? `<br/>\n(${topicData.date})` : "";
                            const header = `<b><font size="+2">${ptTitle}</font></b>${displayDate}<br/>\n<br/>\n`;
                            rawContent = header + rawContent;
                        }
                    }
                } else {
                    rawContent = topicData.content || "";
                }

                // Normalize <br/>\n patterns from the JSON source:
                //   <br/>\n<br/>\n<br/>               → <br><br>  (triple = explicit double break)
                //   <br/>\n<br/>\n after date ）      → <br><br>  (date header context)
                //   <br/>\n<br/>\n before Q&A label  → <br><br>  (Q&A context)
                //   <br/>\n<br/>\n                   → new paragraph
                //   <br/>\n                          → space
                const DBLBR = '\x01DBLBR\x01';
                let normalizedContent = rawContent;

                // Step 1: Triple break → DBLBR (must run before double)
                // Maps to exactly two <br> later
                normalizedContent = normalizedContent.replace(/<br\s*\/?>\n?<br\s*\/?>\n?<br\s*\/?>\n?/gi, DBLBR);

                // Step 2: Double break after Japanese date closing paren → DBLBR
                normalizedContent = normalizedContent.replace(/([）)][^<\n]*)<br\s*\/?>\n?<br\s*\/?>\n?/gi, '$1' + DBLBR);

                // Step 2.5: Ensure line break before specific Portuguese headers
                normalizedContent = normalizedContent.replace(/(Pergunta do fiel|Orientação de Meishu-Sama)/gi, DBLBR + '$1');

                // Step 3: Double break immediately before colored font Q&A label → DBLBR
                normalizedContent = normalizedContent.replace(/<br\s*\/?>\n?<br\s*\/?>\n?(?=\s*<(?:b>\s*)?<font\s+color)/gi, DBLBR);

                // Step 4: Remaining double break → space (merging content)
                normalizedContent = normalizedContent.replace(/<br\s*\/?>\n<br\s*\/?>\n/gi, ' ');

                // Step 5: Single <br/>\n → space; remaining lone <br/> → space
                normalizedContent = normalizedContent.replace(/<br\s*\/?>\n/gi, ' ');
                normalizedContent = normalizedContent.replace(/<br\s*\/?>/gi, ' ');

                // Step 6: Remaining literal newlines → space
                normalizedContent = normalizedContent.replace(/\n/g, ' ');

                // Step 7: Expand placeholders into split-friendly markers
                normalizedContent = normalizedContent.replace(/\x01DBLBR\x01/g, '\n\n\x02DBLBR\x02\n\n');

                // Step 8: Clean extra spaces (but preserve \n\n markers)
                normalizedContent = normalizedContent.replace(/[ \t]{2,}/g, ' ').trim();

                // Step 9: Build HTML
                let formattedContent;
                const triggerRegex = /(\*\*|__|###|# |\[|\*|_)/;
                if (typeof marked !== 'undefined' && triggerRegex.test(normalizedContent)) {
                    formattedContent = marked.parse(normalizedContent);
                } else if (normalizedContent.includes('\n\n')) {
                    formattedContent = normalizedContent.split(/\n\n+/)
                        .filter(p => p.trim())
                        .map(p => {
                            const trimmed = p.trim();
                            if (trimmed === '\x02DBLBR\x02') return '<br>';
                            return `<p>${trimmed}</p>`;
                        })
                        .join('\n');
                } else {
                    formattedContent = `<p>${normalizedContent.trim()}</p>`;
                }

                // Step 10: Final safety — resolve any leftover DBLBR markers
                // (e.g. when marked.parse() was used above)
                formattedContent = formattedContent.replace(/<p>\s*\x02DBLBR\x02\s*<\/p>/g, '<br>');
                formattedContent = formattedContent.replace(/\x02DBLBR\x02/g, '<br>');

                // Aggressive strip of all color-related and size-related attributes and styles
                formattedContent = formattedContent.replace(/\s(color|bgcolor|size)=["'][^"']*["']/gi, '');

                // 1. Strip font tags but keep content (attributes already gone)
                formattedContent = formattedContent.replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');

                // 2. Selectively strip <b>/<strong> tags from body while protecting titles/labels
                let boldCount = 0;
                formattedContent = formattedContent.replace(/<(b|strong)>(.*?)<\/\1>/gi, (match, tag, content) => {
                    boldCount++;
                    const plain = content.replace(/<[^>]+>/g, '').trim();
                    // 1. Keep if it's the FIRST bold element (usually the title)
                    if (boldCount === 1) return match;
                    // 2. Keep if it contains protected religious labels
                    const protectedBoldRegex = /Ensinamento|Orientação|Palestra|Pergunta|Resposta|Salmo/i;
                    if (protectedBoldRegex.test(plain)) return match;
                    // Otherwise strip bold from general highlights/emphasis
                    return content;
                });
                // Also clean up color in style attributes (handles both single and double quotes)
                formattedContent = formattedContent.replace(/style=["']([^"']+)["']/gi, (match, styleBody) => {
                    const cleanedStyle = styleBody.replace(/color\s*:\s*[^;]+;?/gi, '').trim();
                    return cleanedStyle ? `style="${cleanedStyle}"` : '';
                });
                // Remove empty style markers
                formattedContent = formattedContent.replace(/\sstyle=["']\s*["']/gi, '');

                // Sanitize Japanese ideographic spaces (U+3000) that cause horizontal overflow
                // on mobile — each U+3000 is ~1 em wide and causes long lines in diagram sections
                formattedContent = formattedContent.replace(/\u3000+/g, (m) => ' '.repeat(Math.min(m.length, 4)));

                // Convert *text* to <i>text</i> (basic Markdown italics fallback)
                formattedContent = formattedContent.replace(/\*([^\*\s][^\*]*?)\*/g, '<i>$1</i>');

                formattedContent = formattedContent.replace(/src=["']([^"']+)["']/g, (match, src) => {
                    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('assets/')) return match;
                    return `src="assets/images/${src}"`;
                });


                // DOM-based: remove leading element ONLY if its stripped text is an exact match
                // to the main title (prevents removing teaching titles that just share a word)
                cleanedContent = formattedContent;
                const _tmp = document.createElement('div');
                _tmp.innerHTML = cleanedContent;

                // Enhanced title stripping to fix duplicate titles
                // ONLY strip in Japanese mode: Japanese uses specificTitle h2 injection (lines below)
                // so stripping the duplicate from content body is safe.
                // In Portuguese there is NO separate h2 title element — the <b> in content IS
                // the only title display. Stripping it would erase the title entirely.
                if (!isGeneric && !isPt) {
                    const firstBlocks = _tmp.querySelectorAll('p, div, h1, h2, h3, blockquote');
                    const titlePlain = mainTitleToDisplay.replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\u30FB\u00B7\.\"\u300c\u300d]/g, '').toLowerCase();

                    for (let i = 0; i < Math.min(firstBlocks.length, 3); i++) {
                        const block = firstBlocks[i];
                        if (block.querySelector('img, table, ul, ol')) continue;

                        const blockTextHtml = block.innerHTML;
                        const blockTextContent = block.textContent;

                        // CRITICAL: Never strip the publication title/date
                        if (blockTextContent.includes("Publicado em") || blockTextContent.includes("発行）") || blockTextContent.includes("（昭和")) continue;

                        const blockTextClean = blockTextContent.replace(/[\u3000\s\d\u30FB\u00B7\.\"\u300c\u300d]/g, '').toLowerCase();

                        if (blockTextClean.length > 0 && blockTextClean.length < 150) {
                            // Only strip if it's an exact match or very close to the title we promoted
                            if (blockTextClean === titlePlain || (titlePlain.length > 10 && blockTextClean.includes(titlePlain))) {
                                block.remove();
                                break;
                            }
                        }
                    }
                }
                cleanedContent = _tmp.innerHTML;

                // Filter "Unknown" dates
                let displayDate = topicData.date;
                if (displayDate === "Unknown") displayDate = "";

                // Add topic to navigation select if multiple topics
                if (navSelect && currentTopics.length > 1) {
                    let pTitle = isPt ? (topicData.publication_title_pt || topicData.title_ptbr || topicData.title_pt) : (topicData.title_ja);
                    pTitle = pTitle || topicData.title || `Parte ${index + 1}`;

                    // ALWAYS try to extract quoted title from first <b> in content (before date)
                    // This handles cases like "Causa Fundamental da Doença 1/2/3" that are
                    // repeated-but-not-in-genericRegex, by extracting the real title from content
                    const rawForNav = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content) : topicData.content;
                    if (rawForNav && rawForNav.length > 20) {
                        const docNav = new DOMParser().parseFromString(rawForNav, 'text/html');
                        const firstB = docNav.querySelector('b');
                        if (firstB) {
                            const bText = firstB.textContent.trim();
                            const quoteMatch = bText.match(/["“«‘]([^"”»’]+)["”»’]/);
                            if (quoteMatch && quoteMatch[1].length > 5 && quoteMatch[1].length < 150) {
                                pTitle = quoteMatch[1];
                            }
                        }
                    }

                    // REFINEMENT: If still generic, try broader span/font extraction
                    const genericRegex = /O Método do Johrei|Princípio do Johrei|Sobre a Verdade|Verdade \d|Ensinamento \d|Parte \d|JH\d|JH \d|Publicação \d|Agricultura Natural|Instrução Divina|Purificação Equilibrada|Coletânea de fragmentos/i;
                    if (genericRegex.test(pTitle)) {
                        const raw = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content) : topicData.content;
                        if (raw && raw.length > 20) {
                            const doc = new DOMParser().parseFromString(raw, 'text/html');
                            const span = doc.querySelector('span, b, font');
                            if (span) {
                                let text = span.textContent.trim();
                                let quoteMatch = text.match(/["\"']([^"\"']+)["\"']/);
                                let extracted = quoteMatch ? quoteMatch[1] : text.replace(/Ensinamento de Meishu-Sama:\s*|Orientação de Meishu-Sama:\s*|Palestra de Meishu-Sama:\s*|明主様御垂示\s*|明主様御講話\s*/gi, '');
                                if (extracted.length > 5 && extracted.length < 150) {
                                    pTitle = extracted;
                                }
                            }
                        }
                    }

                    // Clean up prefixes if they are too long or generic
                    let finalTitle = pTitle.replace(/^(Ensinamento|Orientação|Palestra) de Meishu-Sama\s*[-:]?\s*/i, '').trim();
                    finalTitle = finalTitle.replace(/^"(.*?)"$/, '$1'); // Strip surrounding quotes
                    finalTitle = finalTitle.replace(/\\"/g, '').trim();

                    if (!window._usedNavTitles) window._usedNavTitles = new Set();
                    if (window._usedNavTitles.has(finalTitle)) {
                        finalTitle = `${finalTitle} (${index + 1})`;
                    }
                    window._usedNavTitles.add(finalTitle);

                    const op = document.createElement('option');
                    op.value = `#${topicId}`;
                    op.textContent = finalTitle;
                    navSelect.appendChild(op);
                }

                // Check if the topic needs its title injected (if it's missing from the translation)
                let injectedTitleHtml = "";
                let specificTitle = isPt ? null : (topicData.title_ja || topicData.title || null);

                if (specificTitle && specificTitle !== mainTitleToDisplay) {
                    let plainContent = cleanedContent.replace(/<[^>]+>/g, '').replace(/[\u3000\s\d\u30FB\u00B7\.\"\"\''\u300c\u300d\-]/g, '').toLowerCase();
                    let plainSearchTitle = specificTitle
                        .replace(/Ensinamento de Meishu-Sama:\s*|Orientação de Meishu-Sama:\s*/gi, '')
                        .replace(/<[^>]+>/g, '')
                        .replace(/[\u3000\s\d\u30FB\u00B7\.\"\"\''\u300c\u300d\-]/g, '')
                        .toLowerCase();
                    if (plainSearchTitle.length > 5 && !plainContent.includes(plainSearchTitle)) {
                        // For first topic: use h2 only if main header title is different (multi-part files)
                        // For subsequent topics: always inject
                        const shouldInject = index > 0 || specificTitle;
                        if (shouldInject) {
                            injectedTitleHtml = `<h2 class="injected-topic-title" style="margin-bottom: 24px; color: var(--text-main); font-size: 21px; font-weight: 700; text-align: center;">${specificTitle}</h2>`;
                        }
                    }
                }

                fullHtml += `
                    <div id="${topicId}" class="topic-content" style="margin-top: ${index > 0 ? '40px' : '0'};">
                        ${injectedTitleHtml}
                        ${cleanedContent}
                    </div>
                `;
            });

            // Show select only if multiple topics (use already-declared outer variable)
            if (navSelect) {
                navSelect.style.display = currentTopics.length > 1 ? 'inline-block' : 'none';

                // Update mobile hamburger nav with these topics if the function exists
                if (typeof window._updateMobileNavTopics === 'function') {
                    const opts = Array.from(navSelect.options)
                        .filter(o => o.value)
                        .map(o => ({ value: o.value, text: o.textContent }));
                    if (opts.length > 0) {
                        window._updateMobileNavTopics('Publicações deste ensinamento', opts);
                    } else {
                        window._updateMobileNavTopics('', []);
                    }
                }
            }

            // Navigation Footer
            const navFooter = `
                <div class="reader-nav-footer" style="display: flex; justify-content: space-between; margin-top: 64px; padding-top: 32px; border-top: 1px solid var(--border);">
                    ${prevFile ? `<a href="?vol=${volId}&file=${prevFile}" class="btn-zen" style="text-decoration:none">← Anterior</a>` : '<span></span>'}
                    ${nextFile ? `<a href="?vol=${volId}&file=${nextFile}" class="btn-zen" style="text-decoration:none">Próximo →</a>` : '<span></span>'}
                </div>
            `;

            const volPath = volId === 'shumeic1' ? 'index2.html' : `${volId}/index.html`;

            // Check if current is favorited
            const favorites = JSON.parse(localStorage.getItem('savedFavorites') || '[]');
            const isFavorited = favorites.some(f => f.vol === volId && f.file === filename);
            const favClass = isFavorited ? 'active' : '';
            const favIcon = isFavorited
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
            const favText = isFavorited ? 'Salvo' : 'Salvar';

            const toolbarHtml = `
                <div class="reader-toolbar">
                    <button class="btn-zen ${favClass}" id="favoriteBtn" onclick="toggleFavorite()">
                        ${favIcon}
                        <span class="toolbar-tooltip">${favText}</span>
                    </button>
                    <div class="toolbar-divider"></div>
                    <button class="btn-zen" id="topBtn" onclick="window.scrollTo({top:0,behavior:'smooth'})">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                         <span class="toolbar-tooltip">Topo</span>
                    </button>
                </div>
            `;

            container.innerHTML = `
                <nav class="breadcrumbs">
                    <a href="index.html">Início</a> <span>/</span> 
                    <a href="${volPath}">Volume ${volId.slice(-1)}</a> <span>/</span>
                    <span style="color:var(--text-main)">Leitura</span>
                </nav>
                <div class="reader-container">
                    ${fullHtml}
                    ${navFooter}
                </div>
                ${toolbarHtml}
            `;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                // Escape regex special chars (e.g. hyphens in "7-5-3")
                const escapedQ = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const contentBlocks = container.querySelectorAll('.topic-content, .topic-title-large');
                let firstMatch = null;

                contentBlocks.forEach(block => {
                    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    const textNodes = [];
                    while (node = walker.nextNode()) textNodes.push(node);

                    textNodes.forEach(textNode => {
                        if (textNode.parentNode && textNode.parentNode.nodeName === 'MARK') return;
                        const val = textNode.nodeValue;
                        if (val.toLowerCase().includes(q) && val.trim().length > 0) {
                            const regex = new RegExp(`(${escapedQ})`, 'gi');
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
                        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 400);
                }
            }
        };

        const savedLang = localStorage.getItem('site_lang') || 'pt';
        renderContent(savedLang);

    } catch (err) {
        container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
    }
});

// setLanguage is now defined globally in toggle.js
