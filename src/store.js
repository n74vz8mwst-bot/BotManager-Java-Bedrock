const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const file = path.join(dataDir, 'servers.json');

function loadStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) {
    const initial = { servers: [] };
    fs.writeFileSync(file, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { servers: Array.isArray(parsed.servers) ? parsed.servers : [] };
  } catch {
    console.warn('servers.json could not be read. Starting with an empty server list.');
    return { servers: [] };
  }
}
function saveStore(store) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
}
module.exports = { loadStore, saveStore };
