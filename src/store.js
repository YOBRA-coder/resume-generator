import { create } from 'zustand';
import { kvGet, kvSet, appsAll, appPut, appDelete, appsClear, isPersistent, requestPersistence } from './lib/db.js';
import { emptyProfile, uid } from './engine/profileUtils.js';
import { checkAI } from './lib/ai.js';

const DEFAULT_SETTINGS = { theme: 'system', locale: 'uk', tone: 'professional', ai: true, accessCode: '', design: null };
const timers = new Map();
const debounce = (key, fn, ms = 500) => { clearTimeout(timers.get(key)); timers.set(key, setTimeout(fn, ms)); };
let toastId = 1;

export const useStore = create((set, get) => ({
  ready: false, persistent: true, profile: emptyProfile(), hasProfile: false, apps: [], settings: DEFAULT_SETTINGS,
  save: { state: 'idle', at: 0 }, toasts: [], online: typeof navigator === 'undefined' ? true : navigator.onLine, ai: { ai: false, needsCode: false },
  printJob: null, installEvent: null,

  async init() {
    const [profile, settings, apps] = await Promise.all([kvGet('profile'), kvGet('settings'), appsAll()]);
    set({
      profile: profile ? { ...emptyProfile(), ...profile } : emptyProfile(), hasProfile: !!profile,
      settings: { ...DEFAULT_SETTINGS, ...(settings || {}) }, apps: (apps || []).sort((a, b) => b.updatedAt - a.updatedAt),
      persistent: await isPersistent(), ready: true,
    });
    applyTheme(get().settings.theme);
    requestPersistence();
    window.addEventListener('online', () => { set({ online: true }); get().refreshAI(); });
    window.addEventListener('offline', () => set({ online: false }));
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); set({ installEvent: e }); });
    get().refreshAI();
  },
  async refreshAI(force) { set({ ai: await checkAI(force) }); },

  toast(message, opts = {}) {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, ...opts }] }));
    setTimeout(() => get().dismissToast(id), opts.ms || (opts.action ? 7000 : 3200));
  },
  dismissToast(id) { set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })); },

  markSaving() { set({ save: { state: 'saving', at: Date.now() } }); },
  markSaved() { set({ save: { state: 'saved', at: Date.now() } }); },
  markError() { set({ save: { state: 'error', at: Date.now() } }); },

  // ---- master profile
  setProfile(updater) {
    const prev = get().profile;
    const next = { ...(typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }), updatedAt: Date.now() };
    set({ profile: next, hasProfile: true }); get().markSaving();
    debounce('profile', async () => { try { await kvSet('profile', next); get().markSaved(); } catch { get().markError(); } });
  },
  replaceProfile(p) { get().setProfile(() => ({ ...emptyProfile(), ...p })); },

  // ---- settings
  setSettings(patch) {
    const next = { ...get().settings, ...patch }; set({ settings: next });
    kvSet('settings', next); if ('theme' in patch) applyTheme(next.theme); if ('accessCode' in patch || 'ai' in patch) get().refreshAI(true);
  },

  // ---- applications
  async addApp(app) { set((s) => ({ apps: [app, ...s.apps] })); try { await appPut(app); get().markSaved(); } catch { get().markError(); } },
  updateApp(id, updater) {
    let next;
    set((s) => ({ apps: s.apps.map((a) => (a.id === id ? (next = { ...(typeof updater === 'function' ? updater(a) : { ...a, ...updater }), updatedAt: Date.now() }) : a)) }));
    if (!next) return; get().markSaving();
    debounce(`app:${id}`, async () => { try { await appPut(get().apps.find((a) => a.id === id) || next); get().markSaved(); } catch { get().markError(); } }, 400);
  },
  async removeApp(id) {
    const app = get().apps.find((a) => a.id === id); if (!app) return;
    set((s) => ({ apps: s.apps.filter((a) => a.id !== id) })); await appDelete(id);
    get().toast(`Deleted “${app.company || app.jobTitle || 'application'}”`, { action: 'Undo', onAction: async () => { set((s) => ({ apps: [app, ...s.apps].sort((a, b) => b.updatedAt - a.updatedAt) })); await appPut(app); } });
  },
  async duplicateApp(id) {
    const a = get().apps.find((x) => x.id === id); if (!a) return null;
    const copy = { ...structuredClone(a), id: uid(), createdAt: Date.now(), updatedAt: Date.now(), status: 'draft', company: a.company ? `${a.company} (copy)` : '' };
    await get().addApp(copy); get().toast('Duplicated'); return copy.id;
  },

  // ---- backup / restore
  exportAll() { const { profile, apps, settings } = get(); return JSON.stringify({ app: 'resume-generator-pro', version: 2, exportedAt: new Date().toISOString(), profile, apps, settings: { ...settings, accessCode: '' } }, null, 2); },
  async importAll(json) {
    const d = typeof json === 'string' ? JSON.parse(json) : json;
    if (d?.app !== 'resume-generator-pro') throw new Error('This file is not a Resume Generator Pro backup.');
    if (d.profile) { await kvSet('profile', d.profile); set({ profile: { ...emptyProfile(), ...d.profile }, hasProfile: true }); }
    const existing = new Set(get().apps.map((a) => a.id));
    for (const a of d.apps || []) { if (!a?.id) continue; const x = existing.has(a.id) ? { ...a, id: uid() } : a; await appPut(x); set((s) => ({ apps: [x, ...s.apps] })); }
    return (d.apps || []).length;
  },
  async wipeAll() { await appsClear(); await kvSet('profile', null); set({ apps: [], profile: emptyProfile(), hasProfile: false }); },

  setPrintJob(job) { set({ printJob: job }); },
}));

export function applyTheme(theme) {
  const el = document.documentElement;
  if (theme === 'system') delete el.dataset.theme; else el.dataset.theme = theme;
  try { localStorage.setItem('rgp-theme', JSON.stringify(theme)); } catch { /* ignore */ }
}
