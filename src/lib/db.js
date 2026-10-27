// Tiny IndexedDB wrapper (no dependency). Falls back to memory when storage is blocked (private windows etc.).
const DB_NAME = 'resume-generator-pro', VERSION = 1;
let dbp = null;
const mem = { kv: new Map(), apps: new Map() };
export let persistent = true;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => { const db = req.result; db.createObjectStore('kv'); db.createObjectStore('apps', { keyPath: 'id' }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked'));
    } catch (e) { reject(e); }
  }).catch(() => { persistent = false; return null; });
  return dbp;
}
const run = async (store, mode, fn) => {
  const db = await open();
  if (!db) return fn(null, true);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    const r = fn(os, false);
    tx.oncomplete = () => resolve(r?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};
export const kvGet = async (key) => { const db = await open(); if (!db) return mem.kv.get(key); return run('kv', 'readonly', (os) => os.get(key)); };
export const kvSet = async (key, value) => { const db = await open(); if (!db) { mem.kv.set(key, value); return; } return run('kv', 'readwrite', (os) => os.put(value, key)); };
export const appsAll = async () => { const db = await open(); if (!db) return [...mem.apps.values()]; return run('apps', 'readonly', (os) => os.getAll()); };
export const appPut = async (app) => { const db = await open(); if (!db) { mem.apps.set(app.id, structuredClone(app)); return; } return run('apps', 'readwrite', (os) => os.put(JSON.parse(JSON.stringify(app)))); };
export const appDelete = async (id) => { const db = await open(); if (!db) { mem.apps.delete(id); return; } return run('apps', 'readwrite', (os) => os.delete(id)); };
export const appsClear = async () => { const db = await open(); if (!db) { mem.apps.clear(); return; } return run('apps', 'readwrite', (os) => os.clear()); };
export const isPersistent = async () => { await open(); return persistent; };
export async function requestPersistence() { try { return await navigator.storage?.persist?.(); } catch { return false; } }
