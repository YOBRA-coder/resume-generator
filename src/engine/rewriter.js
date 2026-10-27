import { WEAK_OPENERS, VERBS, intentOf, isStrongVerb, toPast, retense, cap, isKnownPast } from './verbs.js';
import { hasMetric } from './guard.js';
import { localize, wordCount, clean } from './text.js';

const NOUN_LEAD = { build: 'Delivered', lead: 'Led', improve: 'Drove', analyse: 'Conducted', finance: 'Handled', communicate: 'Handled', support: 'Handled' };
const OUTCOME = /\b(so that|resulting in|which (?:led|helped|reduced|increased|improved)|reducing|increasing|improving|saving|enabling|helping|ensuring|allowing|leading to|to (?:reduce|increase|improve|speed|ensure|enable|support|meet))\b/i;

/**
 * Turn a rough note ("worked on website for clients") into a resume-ready bullet.
 * Never adds facts or numbers; only restructures wording and flags what is still missing.
 */
export function strengthenBullet(raw = '', { current = false, locale = 'uk' } = {}) {
  let t = clean(raw).replace(/^[\s•·●▪■◦\-–—*>\d.)]+\s*/, '');
  const original = t;
  if (!t) return { text: '', score: 0, tips: [], changed: false };
  const changes = [];

  // 1. weak openers with a sensible honest replacement ("worked on" != "built"), else strip them
  let lead = '';
  const special = [
    [/^(?:i\s+)?(?:helped|assisted|helping|assisting)\s+(?:in|with|to)\s+/i, 'Assisted with '],
    [/^(?:i\s+)?(?:helped|assisted|helping|assisting)\s+(?!with\b|in\b|to\b)/i, 'Assisted '],
    [/^(?:i\s+)?(?:worked|working)\s+on\s+/i, 'Contributed to '],
    [/^(?:i\s+)?(?:worked|working)\s+(?:with|alongside|as part of)\s+/i, 'Collaborated with '],
    [/^(?:i\s+)?(?:was\s+)?(?:involved|participated|participating|took part)\s+in\s+/i, 'Contributed to '],
  ];
  for (const [re, verb] of special) if (re.test(t)) { t = t.replace(re, ''); lead = verb; changes.push('Replaced a weak opener'); break; }
  // 1b. remove other weak openers
  for (let i = 0; i < 2; i++) {
    const before = t;
    for (const re of WEAK_OPENERS) t = t.replace(re, '');
    if (t === before) break;
    changes.push('Removed weak opener');
  }
  t = t.replace(/\b(very|really|basically|actually|various|numerous|etc\.?|and so on)\b\s*/gi, (m) => (/etc|and so on/i.test(m) ? '' : '')).replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
  if (!t) t = original;

  if (lead) {
    t = lead + t.charAt(0).toLowerCase() + t.slice(1);
    return finish(t, original, changes, current, locale);
  }
  // 2. start with a strong verb
  const m = t.match(/^([A-Za-z]+)\b/);
  const first = m ? m[1] : '';
  const lower = first.toLowerCase();
  if (first && (isStrongVerb(first) || isKnownPast(first))) {
    t = cap(t);
  } else if (/(ing)$/.test(lower) && lower.length > 5) {
    t = toPast(first) + t.slice(first.length); changes.push('Started with an action verb');
  } else if (/(ed)$/.test(lower) && lower.length > 4) {
    t = cap(t);
  } else if (/^(manage|build|develop|design|create|lead|run|handle|support|maintain|prepare|coordinate|write|test|deploy|plan|process|train|teach|supervise|monitor|install|analyse|analyze|organise|organize|serve|sell|fix|oversee|deliver|implement|produce|operate|assist|perform|conduct|reconcile|track|report|review|resolve)$/.test(lower)) {
    t = toPast(first) + t.slice(first.length); changes.push('Started with an action verb');
  } else if (/^(my|the|a|an|our)$/i.test(first)) {
    t = cap(t.replace(/^(my|the|a|an|our)\s+/i, ''));
  } else {
    t = `${NOUN_LEAD[intentOf(t)]} ${t.charAt(0).toLowerCase() + t.slice(1)}`;
    changes.push('Added an action verb');
  }
  return finish(t, original, changes, current, locale);
}

function finish(t, original, changes, current, locale) {
  // 3. tense, spelling, tidy
  t = t.replace(/(,\s+(?:and\s+)?|\s+and\s+)([A-Za-z]{5,}ing)\b/g, (m, sep, w) => (isKnownPast(toPast(w)) ? `${sep}${toPast(w).toLowerCase()}` : m));
  t = retense(t, current);
  t = localize(t, locale).replace(/\s+([,.;:])/g, '$1').replace(/[.;,\s]+$/, '').replace(/\s{2,}/g, ' ');
  t = cap(t);

  const words = wordCount(t);
  const strongStart = isStrongVerb(t.split(' ')[0]) || isStrongVerb(toPast(t.split(' ')[0]));
  const metric = hasMetric(t);
  const outcome = OUTCOME.test(t) || metric;
  const tips = [];
  if (!metric) tips.push('Add a number if you have one (how many, how much, how often, how fast).');
  if (!outcome) tips.push('Say what changed because of it (time saved, errors reduced, revenue, satisfaction).');
  if (words < 6) tips.push('Add detail: what tool, who for, or what scale.');
  if (words > 32) tips.push('Shorten to one or two lines.');
  const score = Math.min(100, (strongStart ? 30 : 0) + (metric ? 30 : 0) + (outcome ? 20 : 0) + (words >= 8 && words <= 28 ? 20 : words >= 6 ? 10 : 0));
  return { text: t, score, tips, hasMetric: metric, changed: t !== original, changes: [...new Set(changes)] };
}

/** Split free-form notes (lines, bullets, ';', short comma lists) into raw bullet candidates. */
export function splitNotes(notes = '') {
  const lines = notes.split(/\r?\n+/).map((l) => l.replace(/^[\s•·●▪■◦\-–—*]+/, '').trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    let parts = line.split(/;\s+/);
    if (parts.length === 1 && wordCount(line) > 40) parts = line.split(/(?<=[.!?])\s+/);
    if (parts.length === 1) {
      const commas = line.split(/,\s+(?:and\s+)?/);
      const looksList = commas.length >= 3 && commas.every((c) => wordCount(c) <= 7);
      if (looksList) parts = commas;
    }
    out.push(...parts.map((p) => p.replace(/[.\s]+$/, '')).filter((p) => p.length > 2));
  }
  return out;
}
export { VERBS };
