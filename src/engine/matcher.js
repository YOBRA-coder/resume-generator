import { findSkills, canonicalSkill } from './dictionary.js';
import { words, STOP, uniq } from './text.js';
import { bulletText } from './profileUtils.js';

const lc = (s) => (s || '').toLowerCase();

/** All skills the person demonstrably has: listed skills + dictionary hits in their own experience text. */
export function profileSkillSet(resume) {
  const set = new Map(); // canonical -> source
  for (const s of resume.skills || []) { const n = typeof s === 'string' ? s : s.name; if (n) set.set(canonicalSkill(n), 'listed'); }
  const text = [...(resume.experience || []).flatMap((e) => [e.role, ...(e.bullets || []).filter((b) => !b.generated).map(bulletText)]), ...(resume.projects || []).flatMap((p) => [p.tech, p.description]), ...(resume.certifications || []).map((c) => c.name)].join('\n');
  for (const f of findSkills(text)) if (!set.has(f.name)) set.set(f.name, 'in-experience');
  return set;
}

export function matchJob(resume, job) {
  const have = profileSkillSet(resume);
  const corpus = lc(JSON.stringify([resume.summary, (resume.experience || []).map((e) => ({ ...e, bullets: (e.bullets || []).filter((b) => !b.generated) })), resume.projects, resume.skills]));
  const rows = [...job.hardSkills, ...job.softSkills].map((s) => ({ ...s, matched: have.has(s.name) }));
  const total = rows.reduce((a, r) => a + r.weight, 0) || 1;
  const hit = rows.filter((r) => r.matched).reduce((a, r) => a + r.weight, 0);
  const kw = job.keywords.map((k) => ({ ...k, matched: corpus.includes(k.term) }));
  const kwScore = kw.length ? kw.filter((k) => k.matched).length / kw.length : 0;
  const hasSkills = rows.length > 0;
  const score = hasSkills ? Math.round(Math.min(100, (hit / total) * 88 + kwScore * 12)) : null;
  return {
    score,
    matched: rows.filter((r) => r.matched),
    missing: rows.filter((r) => !r.matched).sort((a, b) => Number(b.required) - Number(a.required) || b.weight - a.weight),
    keywords: kw,
  };
}

/** Relevance of one bullet to the job: skill hits (weighted), keyword hits, quantified result. */
export function scoreBullet(text, job) {
  const t = lc(text);
  let s = 0;
  const found = new Set(findSkills(text).map((f) => f.name));
  for (const sk of [...job.hardSkills, ...job.softSkills]) if (found.has(sk.name)) s += sk.weight * (sk.required ? 1 : 0.5);
  for (const k of job.keywords) if (t.includes(k.term)) s += 1.5;
  const toks = new Set(words(text).filter((w) => !STOP.has(w)));
  for (const r of job.responsibilities.slice(0, 12)) {
    const rt = words(r).filter((w) => w.length > 3 && !STOP.has(w));
    const overlap = rt.filter((w) => toks.has(w)).length;
    if (overlap >= 2) s += overlap * 0.6;
  }
  if (/\d/.test(text)) s += 2;
  return s;
}

/** Sort skills: job-matched first (by weight), then the rest in the user's order. */
export function orderSkills(skills, job) {
  const weight = new Map([...job.hardSkills, ...job.softSkills].map((s) => [s.name, s.weight]));
  const idx = new Map(skills.map((s, i) => [s, i]));
  return [...skills].sort((a, b) => (weight.get(canonicalSkill(b)) || 0) - (weight.get(canonicalSkill(a)) || 0) || idx.get(a) - idx.get(b));
}

/** Per-role bullet budget: recent roles get more space. */
export const bulletBudget = (index, total, pages = 1) => {
  const base = pages === 1 ? [5, 4, 3, 2] : [7, 5, 4, 3];
  return base[Math.min(index, base.length - 1)] + (total === 1 ? 1 : 0);
};
export { uniq };
