// A ZIP ships this immutable sprite bank beside game.html. The 1.1.0
// single-file updater can fetch the same bytes once and use its offline cache.
(async function loadTownMotionBank96() {
  const filename = 'town-motion-1.25.96.js';
  const digest = '__BANK_HASH__';
  const prefix = 'globalThis.MBTownMotion96=';
  const official = 'https://lion000097.github.io/monster-biyori/releases/1.25.96/' + filename;
  const valid = bank => bank && Object.keys(bank).length === 127 && SPECIES.every(s =>
    Object.hasOwn(bank, s.id) && typeof bank[s.id].pixels === 'string' &&
    Array.isArray(bank[s.id].normal) && bank[s.id].normal.length === bank[s.id].shiny?.length);
  function install(bank) {
    if (!valid(bank)) return false;
    for (const [id, asset] of Object.entries(bank)) townMotionSpecies.set(id, asset);
    return true;
  }
  async function cache(value) {
    return new Promise(resolve => {
      let request;
      try { request = indexedDB.open('monster_biyori_town_art', 1); }
      catch { resolve(null); return; }
      request.onupgradeneeded = () => request.result.createObjectStore('banks');
      request.onerror = request.onblocked = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction('banks', value ? 'readwrite' : 'readonly');
          const store = tx.objectStore('banks');
          const op = value ? store.put(value, digest) : store.get(digest);
          tx.oncomplete = () => { db.close(); resolve(op.result); };
          tx.onerror = tx.onabort = () => { db.close(); resolve(null); };
        } catch { db.close(); resolve(null); }
      };
    });
  }
  async function fetchBank(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { credentials: 'omit', signal: controller.signal });
      if (!response.ok) return null;
      const bytes = await response.arrayBuffer();
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      if (Array.from(hash, b => b.toString(16).padStart(2, '0')).join('') !== digest) return null;
      const code = new TextDecoder().decode(bytes);
      if (!code.startsWith(prefix) || !code.endsWith(';\n')) return null;
      return JSON.parse(code.slice(prefix.length, -2));
    } catch { return null; }
    finally { clearTimeout(timeout); }
  }
  function localFile() {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.onload = script.onerror = () => {
        script.remove();
        const bank = globalThis.MBTownMotion96;
        delete globalThis.MBTownMotion96;
        resolve(bank);
      };
      script.src = filename;
      document.head.appendChild(script);
    });
  }
  if (install(await cache())) return;
  const sibling = new URL(filename, location.href).href;
  let bank = location.protocol === 'file:' ? await localFile() : await fetchBank(sibling);
  if (!valid(bank) && sibling !== official) bank = await fetchBank(official);
  if (install(bank)) await cache(bank);
})().catch(() => {});
