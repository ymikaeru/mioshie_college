document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('file-upload');
    const navTree = document.getElementById('nav-tree');
    const contentDisplay = document.getElementById('content-display');
    const searchInput = document.getElementById('search-input');

    let globalData = [];
    let organizedData = {}; // { source_file: { title: [topic_1, topic_2...] } }

    // --- File Reading and Processing ---
    fileUpload.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        globalData = []; // Clear previous data
        navTree.innerHTML = '<div class="empty-state-nav">Processando arquivos...</div>';

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const text = await readFileAsync(file);
                try {
                    const json = JSON.parse(text);
                    if (Array.isArray(json)) {
                        // Tag each item with its origin filename if not present
                        json.forEach(item => {
                            if (!item.source_file) item.source_file = file.name;
                            globalData.push(item);
                        });
                    } else if (json.topics && Array.isArray(json.topics)) {
                        json.topics.forEach(item => {
                            if (!item.source_file) item.source_file = file.name;
                            globalData.push(item);
                        });
                    }
                } catch (e) {
                    console.error(`Erro ao parsear o arquivo ${file.name}:`, e);
                }
            }

            organizeData();
            renderNavigation();

        } catch (error) {
            console.error("Erro geral no processamento:", error);
            navTree.innerHTML = '<div class="empty-state-nav" style="color:#ff6b6b">Erro ao ler os arquivos.</div>';
        }
    });

    function readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file, "UTF-8");
        });
    }

    // --- Data Organization ---
    function organizeData() {
        organizedData = {};

        globalData.forEach((item, index) => {
            // Determine grouping keys
            const sourceGroup = item.source_file || item.filename || 'Desconhecido';
            const titleGroup = item.original_title || item.title || 'Sem Título';

            if (!organizedData[sourceGroup]) {
                organizedData[sourceGroup] = {};
            }
            if (!organizedData[sourceGroup][titleGroup]) {
                organizedData[sourceGroup][titleGroup] = [];
            }

            // Generate a display name for the topic
            const textPreview = item.content_ptbr ? item.content_ptbr.replace(/<[^>]*>?/gm, '').substring(0, 30) + '...' : 'Tópico ' + (organizedData[sourceGroup][titleGroup].length + 1);

            // Store reference to original dataset
            organizedData[sourceGroup][titleGroup].push({
                index: index,
                preview: textPreview,
                item: item
            });
        });
    }

    // --- Navigation Rendering ---
    function renderNavigation(filterText = '') {
        navTree.innerHTML = '';

        if (Object.keys(organizedData).length === 0) {
            navTree.innerHTML = '<div class="empty-state-nav">Nenhum dado válido encontrado nos arquivos JSON.</div>';
            return;
        }

        const searchTerm = filterText.toLowerCase();

        // Sort source files alphabetically
        const sortedSources = Object.keys(organizedData).sort();

        sortedSources.forEach(source => {
            const sourceDiv = document.createElement('div');
            sourceDiv.className = 'nav-file';

            const sourceHeader = document.createElement('div');
            sourceHeader.className = 'file-header';
            sourceHeader.textContent = source;
            sourceDiv.appendChild(sourceHeader);

            let hasVisibleItems = false;

            const sortedTitles = Object.keys(organizedData[source]).sort();

            sortedTitles.forEach(title => {
                const topics = organizedData[source][title];

                topics.forEach(topicObj => {
                    const itemData = topicObj.item;
                    const searchableText = `${source} ${title} ${itemData.content_ptbr || ''} ${itemData.content || ''}`.toLowerCase();

                    if (!searchTerm || searchableText.includes(searchTerm)) {
                        hasVisibleItems = true;

                        const navItem = document.createElement('div');
                        navItem.className = 'nav-item';

                        // We use the Portuguese title as the label if available, otherwise original
                        let displayLabel = itemData.title_ptbr || title;
                        // Strip html from title if any for the tiny navbar
                        displayLabel = displayLabel.replace(/<[^>]*>?/gm, '');

                        // If there are multiple topics with same title, append a number
                        if (topics.length > 1) {
                            const topicIndex = topics.indexOf(topicObj) + 1;
                            displayLabel = `${displayLabel} (Pt. ${topicIndex})`;
                        }

                        navItem.textContent = displayLabel;
                        navItem.title = displayLabel; // Tooltip full text

                        navItem.addEventListener('click', () => {
                            // Update active state
                            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                            navItem.classList.add('active');

                            // Render content
                            renderContent(itemData);
                        });

                        sourceDiv.appendChild(navItem);
                    }
                });
            });

            if (hasVisibleItems) {
                navTree.appendChild(sourceDiv);
            }
        });

        if (navTree.innerHTML === '') {
            navTree.innerHTML = '<div class="empty-state-nav">Nenhum resultado para a busca.</div>';
        }
    }

    // --- Search Functionality ---
    searchInput.addEventListener('input', (e) => {
        renderNavigation(e.target.value);
    });

    // --- Main Content Rendering ---
    function renderContent(item) {
        contentDisplay.classList.remove('empty');

        const ptbrContent = item.content_ptbr || "<em>Tradução não disponível para este bloco.</em>";
        // Convert old japanese '\u3000' ideological space to standard html spaces to avoid yellow boxes
        const jpnContent = (item.content || "<em>Original não disponível.</em>").replace(/\u3000/g, '&emsp;');

        const titlePt = item.title_ptbr || item.original_title || "Sem Título";
        const titleJp = item.original_title || item.title || "無題";
        const sourceName = item.source_file || item.filename || "Fonte desconhecida";

        contentDisplay.innerHTML = `
            <div class="topic-meta">
                <span class="topic-source">${sourceName}</span>
                <h1 class="topic-title">${titlePt}</h1>
                <h2 class="topic-original-title">${titleJp}</h2>
            </div>
            
            <div class="translation-grid">
                <div class="translation-column ptbr-column">
                    <h3>Tradução (Português)</h3>
                    <div class="content-text ptbr">
                        ${ptbrContent}
                    </div>
                </div>
                
                <div class="translation-column jpn-column">
                    <h3>Original (Japonês)</h3>
                    <div class="content-text jp">
                        ${jpnContent}
                    </div>
                </div>
            </div>
        `;

        // Scroll to top
        document.querySelector('.main-content').scrollTop = 0;
    }
});
