import { uid } from '../engine/profileUtils.js';

let cache = { at: 0, value: null };
/** Asks the serverless function whether AI is configured. Offline / no server → { ai:false }. */
export async function checkAI(force = false) {
  if (!force && cache.value && Date.now() - cache.at < 60_000) return cache.value;
  let value = { ai: false, needsCode: false };
  try {
    if (navigator.onLine !== false) {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch('/api/health', { signal: ctrl.signal, cache: 'no-store' }); clearTimeout(t);
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) { const j = await r.json(); value = { ai: !!j.ai, needsCode: !!j.needsCode }; }
    }
  } catch { /* offline or no functions deployed */ }
  cache = { at: Date.now(), value };
  return value;
}

const FRIENDLY = { rate_limited: 'AI is busy, try again in a minute.', timeout: 'AI took too long to answer.', ai_not_configured: 'AI key is not set on the server (add ANTHROPIC_API_KEY and redeploy).', unauthorized: 'This server needs the access code from Settings.' };
const headers = (accessCode) => ({ 'content-type': 'application/json', ...(accessCode ? { 'x-access-code': accessCode } : {}) });

/** Calls /api/generate. task: 'full' | 'summary' | 'motivation'. Returns the sanitized result or throws an Error whose message is the real reason. */
export async function callAI({ profile, job, options, task = 'full' }, accessCode) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 58_000);
  try {
    let r;
    try {
      r = await fetch('/api/generate', { method: 'POST', signal: ctrl.signal, headers: headers(accessCode), body: JSON.stringify({ task, profile, job, options }) });
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? FRIENDLY.timeout : 'Could not reach the AI service (offline, or /api is not deployed).');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || FRIENDLY[j.error] || `AI request failed (${r.status}).`);
    return j.result;
  } finally { clearTimeout(t); }
}

/** Makes one tiny real request so Settings can show the exact reason the key does or doesn't work. */
export async function probeAI(accessCode) {
  try {
    const r = await fetch('/api/health?probe=1', { headers: headers(accessCode), cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    return { ok: !!j.ok, model: j.model, message: j.message || (r.ok ? '' : `Server answered ${r.status}.`) };
  } catch { return { ok: false, message: 'Could not reach /api/health. Offline, or the functions are not deployed.' }; }
}

/** Merge a sanitized AI result into the local (offline) result. Anything missing/invalid keeps the local version. */
export function mergeAI(local, ai) {
  if (!ai) return local;
  const resume = { ...local.resume };
  if (ai.summary) resume.summary = ai.summary;
  if (ai.skills?.length >= 4) resume.skills = ai.skills;
  if (ai.experience?.length) {
    resume.experience = resume.experience.map((e) => {
      const m = ai.experience.find((x) => x.id === e.id);
      if (!m || !m.bullets.length) return e;
      return { ...e, bullets: m.bullets.map((text) => ({ id: uid(), text, generated: !!m.generated, source: 'ai' })) };
    });
  }
  const cover = ai.cover_letter ? { ...local.cover, paragraphs: ai.cover_letter.paragraphs } : local.cover;
  return { ...local, resume, cover, engine: 'ai', aiFlagged: ai.flagged || [] };
}
