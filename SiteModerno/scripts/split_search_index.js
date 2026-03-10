const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'site_data', 'search_index.json');
const outputDir = path.join(__dirname, '..', 'site_data');

console.log('Reading search_index.json...');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Loaded ${data.length} entries.`);

const volumes = {};

for (const entry of data) {
    const vol = entry.v;
    if (!volumes[vol]) {
        volumes[vol] = [];
    }
    volumes[vol].push(entry);
}

for (const [vol, entries] of Object.entries(volumes)) {
    const outputPath = path.join(outputDir, `search_index_${vol}.json`);
    console.log(`Writing ${outputPath} (${entries.length} entries)...`);
    fs.writeFileSync(outputPath, JSON.stringify(entries), 'utf8');
}

console.log('Done splitting!');
