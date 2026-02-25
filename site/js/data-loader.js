/**
 * SHUMEI TEACHINGS — Data Loader
 * Fetches and normalizes the bilingual JSON files.
 */

class DataLoader {
    constructor() {
      // We will copy/link the JSONs into site/data/
      this.sources = [
        { id: 'vol1', path: 'data/shumeic1_data_bilingual.json', name: 'Volume 1: 経綸・霊主...' },
        { id: 'vol2', path: 'data/shumeic2_data_bilingual.json', name: 'Volume 2: 浄霊・健康...' },
        { id: 'vol3', path: 'data/shumeic3_data_bilingual.json', name: 'Volume 3: 信仰編' }
        // Volume 4 can be added here later once translated
      ];
      this.data = new Map(); // volId -> volumeData
      this.allTopics = []; // Flattened array for search
    }
  
    async init() {
      console.log('Fetching Shumei data...');
      try {
        const fetchPromises = this.sources.map(src => this.fetchVolume(src));
        await Promise.all(fetchPromises);
        console.log('All data loaded successfully!');
        return true;
      } catch (err) {
        console.error('Failed to load data:', err);
        return false;
      }
    }
  
    async fetchVolume(source) {
      try {
        const response = await fetch(source.path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        
        const normalized = this.normalizeVolume(json, source.id);
        
        this.data.set(source.id, {
          meta: source,
          themes: normalized
        });
      } catch (err) {
        console.warn(`Could not load ${source.path} - skipping. Error:`, err);
      }
    }
  
    /**
     * Normalizes the data structure.
     * Vol 1 & 3 use: title_ptbr, content_ptbr
     * Vol 2 uses: title_pt, content_pt
     */
    normalizeVolume(json, volId) {
      const themes = json.themes || [];
      
      return themes.map((theme, themeIdx) => {
        const topics = theme.topics || [];
        
        const normalizedTopics = topics.map((topic, topicIdx) => {
          // Normalize Japanese (always present)
          const titleJA = topic.title || 'Sem título';
          const contentJA = topic.content || '';
          const dateJA = topic.date || '';
          
          // Normalize Portuguese (keys vary by volume)
          const titlePT = topic.title_ptbr || topic.title_pt || topic.title_pt_br || '';
          const contentPT = topic.content_ptbr || topic.content_pt || topic.content_pt_br || '';
          
          const normalized = {
            id: `${volId}-t${themeIdx}-p${topicIdx}`,
            volId,
            themeIdx,
            topicIdx,
            ja: { title: titleJA, content: contentJA, date: dateJA },
            pt: { title: titlePT, content: contentPT, date: dateJA },
            hasTranslation: !!contentPT
          };
          
          this.allTopics.push(normalized);
          return normalized;
        });
        
        return {
          title: theme.theme_title || `Tema ${themeIdx + 1}`,
          topics: normalizedTopics
        };
      });
    }
  
    getVolumes() {
      return Array.from(this.data.values());
    }
  
    getVolume(volId) {
      return this.data.get(volId);
    }
  
    getTopic(volId, themeIdx, topicIdx) {
      const vol = this.data.get(volId);
      if (!vol) return null;
      const theme = vol.themes[themeIdx];
      if (!theme) return null;
      return theme.topics[topicIdx] || null;
    }
  
    getAllTopics() {
      return this.allTopics;
    }
  }
  
  // Export singleton
  window.shumeiData = new DataLoader();
