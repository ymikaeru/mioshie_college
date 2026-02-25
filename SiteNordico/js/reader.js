document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const volId = params.get('vol');
    const filename = params.get('file');

    const container = document.getElementById('readerContainer');
    const backBtn = document.getElementById('backToIndexBtn');
    const langToggle = document.getElementById('langToggle');

    if (volId) {
        backBtn.href = `${volId}/index2.html`;
    }

    if (!volId || !filename) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:red;">Erro: Volume ou Arquivo não especificado.</div>`;
        return;
    }

    let isPortuguese = true;
    let partsPT = [];
    let partsJA = [];
    let mainTitlePT = "";
    let mainTitleJA = "";
    let dateJA = "";

    try {
        const response = await fetch(`data/${volId}_data_bilingual.json`);
        if (!response.ok) throw new Error("JSON não encontrado");
        const json = await response.json();

        for (const theme of json.themes || []) {
            for (const topic of theme.topics || []) {
                const srcFile = topic.source_file || topic.filename || "";
                if (srcFile.endsWith(filename)) {
                    let ptT = topic.title_ptbr || topic.title_pt || topic.title_pt_br || "";
                    let ptC = topic.content_ptbr || topic.content_pt || topic.content_pt_br || "";
                    let jaT = topic.title || "";
                    let jaC = topic.content || "";
                    
                    if (!mainTitlePT && ptT) mainTitlePT = ptT;
                    if (!mainTitleJA && jaT) mainTitleJA = jaT;
                    if (!dateJA && topic.date) dateJA = topic.date;

                    partsPT.push(ptC);
                    partsJA.push(jaC);
                }
            }
        }

        if (partsPT.length === 0 && partsJA.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 40px;">Tópico não encontrado.</div>`;
            return;
        }

        const render = () => {
            const showTitle = isPortuguese && mainTitlePT ? mainTitlePT : mainTitleJA;
            let contentArray = isPortuguese && partsPT.length && partsPT.some(p => p.trim()) ? partsPT : partsJA;
            
            if (isPortuguese) {
                contentArray = contentArray.map((html, i) => {
                    if (!html) return "";
                    let processed = html;

                    // 0. Convert any remaining **markdown bold** to <b> tags
                    // (Some older translations used markdown instead of HTML)
                    processed = processed.replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>');
                    processed = processed.replace(/\*(.+?)\*/gs, '<i>$1</i>');

                    // 1. Join mid-sentence line breaks (Japanese formatting artifact)
                    // Only joins if there's a lowercase letter on both sides (never near tags).
                    processed = processed.replace(/([a-záéíóúãõç,])\s*<br\s*\/?>\s*([a-záéíóúãõç])/gi, '$1 $2');

                    // 2. Collapse ALL sequences of 2+ <br> to 1 (clean slate)
                    processed = processed.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br>');

                    // 3. Add double <br> before BLOCK-LEVEL colored <font> or standalone <b> tags
                    // These are tags that appear right after a <br> (i.e., at start of a block)
                    // We distinguish block tags: <b> or <font color=...> directly after <br>
                    processed = processed.replace(/<br>\s*(<(?:b|font\s+[^>]*color)[^>]*>)/gi, '<br><br>$1');

                    // 4. Add double <br> after closing </b> or </font> when followed by <br>
                    processed = processed.replace(/(<\/(?:b|font)>)\s*<br>/gi, '$1<br><br>');

                    // 5. Collapse any triple+ sequences that formed to double
                    processed = processed.replace(/(?:<br>\s*){3,}/gi, '<br><br>');

                    // 6. Final whitespace cleanup
                    return processed.replace(/[ ]{2,}/g, ' ').trim();
                });
            }

            // Fix relative image paths — prepend volume folder so images load correctly
            contentArray = contentArray.map(html => {
                if (!html) return "";
                // Only rewrite src values that don't start with http, /, or data:
                return html.replace(/(<img[^>]+src=")(?!https?:\/\/|\/|data:)([^"]+)"/gi, `$1${volId}/$2"`);
            });

            // Extract a plain-text label for each part (for the dropdown)
            const partTitles = contentArray.map((html, idx) => {
                if (!html) return `Parte ${idx + 1}`;
                // Try <font size="+2">...</font> or <b>...</b> for title
                const m = html.match(/<font[^>]*size="[^"]*"\s*>[^<]*<\/font>|<b[^>]*>(.*?)<\/b>/i);
                if (m) {
                    // Strip remaining tags and trim
                    const raw = (m[1] || m[0]).replace(/<[^>]+>/g, '').trim();
                    if (raw.length > 0) return raw.length > 80 ? raw.substring(0, 80) + '…' : raw;
                }
                return `Parte ${idx + 1}`;
            });

            // Wrap each part with an anchor div
            const anchoredParts = contentArray.map((html, idx) =>
                `<div id="topic-section-${idx}">${html}</div>`
            );
            const showContent = anchoredParts.join('<hr style="border:none; border-top:1px dashed #ccc; margin:30px 0;">');

            const warning = isPortuguese && !partsPT.some(p => p.trim())
                ? '<div class="fallback-box">Este tópico ainda não possui tradução. Exibindo o original.</div>'
                : '';

            // Build the dropdown only if there are 2+ parts
            const dropdown = partTitles.length > 1 ? `
                <div class="topic-nav-dropdown">
                    <label for="topicSelect">&#9776; Navegar para:</label>
                    <select id="topicSelect" onchange="
                        const el = document.getElementById('topic-section-' + this.value);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        this.value = '';
                    ">
                        <option value="">— Selecione um tópico —</option>
                        ${partTitles.map((t, idx) => `<option value="${idx}">${idx + 1}. ${t}</option>`).join('')}
                    </select>
                </div>` : '';

            container.innerHTML = `
                ${warning}
                <div class="topic-header">
                    <h1 class="topic-title">${showTitle}</h1>
                    <div class="topic-meta">${dateJA || 'Sem data'}</div>
                </div>
                ${dropdown}
                <div class="topic-content" style="white-space: pre-wrap; word-break: break-word; line-height: 1.8;">
                    ${showContent}
                </div>
            `;
        };
        render();

        langToggle.addEventListener('click', () => {
            isPortuguese = !isPortuguese;
            langToggle.querySelector('.lang-pt').classList.toggle('active', isPortuguese);
            langToggle.querySelector('.lang-ja').classList.toggle('active', !isPortuguese);
            render();
        });

    } catch (err) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:red;">Erro ao carregar dados.</div>`;
    }
});
