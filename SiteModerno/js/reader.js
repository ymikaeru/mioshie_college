
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const volId = params.get('vol');
    const filename = params.get('file');
    const container = document.getElementById('readerContainer');
    
    if (!volId || !filename) {
        container.innerHTML = `<div class="error">Selecione um ensinamento no índice.</div>`;
        return;
    }

    try {
        const response = await fetch(`data/${volId}_data_bilingual.json`);
        const json = await response.json();
        let topicsFound = [];

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
            
            let fullHtml = '';
            const select = document.getElementById('readerTopicSelect');
            if (select) {
                select.innerHTML = '<option value="">Navegação por Publicações</option>';
                select.style.display = topicsFound.length > 1 ? 'inline-block' : 'none';
            }
            
            topicsFound.forEach((topicData, index) => {
                const title = isPt ? (topicData.title_ptbr || topicData.title_pt || topicData.title) : topicData.title;
                const content = isPt ? (topicData.content_ptbr || topicData.content_pt || topicData.content) : topicData.content;
                const topicId = `topic-${index}`;

                if (select) {
                    const opt = document.createElement('option');
                    opt.value = `#${topicId}`;
                    opt.textContent = title;
                    select.appendChild(opt);
                }
                
                // Clean up content: wrap double breaks in paragraphs if needed, or maintain HTML
                let formattedContent = content.replace(/\n\n/g, '</p><p>');

                // Fix image paths to point to assets/images/
                formattedContent = formattedContent.replace(/src=["']([^"']+)["']/g, (match, src) => {
                    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('assets/')) return match;
                    return `src="assets/images/${src}"`;
                });

                // NO separator line here to avoid double lines and follow user request
                // Strip legacy font colors that might cause "strange blue" headings
                let cleanedContent = formattedContent.replace(/color=["'][^"']+["']/g, '');
                cleanedContent = cleanedContent.replace(/style=["'][^"']*color:[^"']+["']/g, '');

                fullHtml += `
                    <div id="${topicId}" class="topic-header" style="margin-top: ${index > 0 ? '80px' : '0'}; border-top: ${index > 0 ? '1px solid var(--border)' : 'none'}; padding-top: ${index > 0 ? '40px' : '0'};">
                        <h1 class="topic-title-large">${title}</h1>
                        <div class="topic-meta">${topicData.date || 'Sem data'}</div>
                    </div>
                    <div class="topic-content">
                        ${cleanedContent}
                    </div>
                `;
            });

            container.innerHTML = `
                <nav class="breadcrumbs">
                    <a href="shumeic1/index.html">Início</a> <span>/</span> 
                    <a href="${volId}/index.html">Volume ${volId.slice(-1)}</a> <span>/</span>
                    <span style="color:var(--text-main)">Leitura</span>
                </nav>
                <div class="reader-container">
                    ${fullHtml}
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        renderContent('pt');

    } catch (err) {
        container.innerHTML = `<div class="error">Erro ao carregar o ensinamento.</div>`;
    }
});

function setLanguage(lang) {
    document.querySelectorAll('.btn-zen').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
    if(window.renderContent) window.renderContent(lang);
}
