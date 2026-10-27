export const STOP = new Set(`a about above across after again against all almost also although always am among an and any are as at be because been before being below between both but by can could did do does doing down during each either else etc few for from further had has have having he her here hers him his how however i if in into is it its just may me might more most must my no nor not of off on once only or other our ours out over own per same she should so some such than that the their theirs them then there these they this those through to too under until up upon us use used using very was we were what when where whether which while who whom whose why will with within without would yet you your yours able ability strong strongly excellent good great looking seeking required requirement requirements preferred plus including include includes experience experienced work working works team teams role roles job position candidate candidates ideal proven demonstrated years year least minimum responsible responsibilities responsibility knowledge understanding skills skill etc new well ensure support help join across various related relevant like need needs needed based high highly make making take taking day days one two three four five company apply application please must should will can able per via etc eg ie degree qualification qualifications opportunity opportunities environment fast paced time full part contract permanent salary benefits competitive`.split(/\s+/));

export const words = (t = '') => (t.toLowerCase().match(/[a-z0-9+#.]+(?:[-'][a-z0-9]+)*/g) || []).map((w) => w.replace(/^\.+|\.+$/g, '')).filter(Boolean);
export const sentences = (t = '') => t.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z"'(])/).map((s) => s.trim()).filter(Boolean);
export const uniq = (a) => [...new Set(a)];
export const wordCount = (t = '') => (t.trim() ? t.trim().split(/\s+/).length : 0);
export const clean = (t = '') => t.replace(/[​ ]/g, ' ').replace(/[ \t]+/g, ' ').trim();
export const oxford = (items) => (items.length <= 1 ? items.join('') : items.length === 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`);

/** Small deterministic PRNG so "Regenerate" gives different-but-reproducible variants. */
export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const next = () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5) >>> 0), (s ^ (s >>> 13)) / 4294967296 + 0.5);
  return {
    next,
    pick: (arr) => arr[Math.floor(next() * arr.length) % arr.length],
    shuffle: (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
}

const UK = ['optimi', 'organi', 'analy', 'standardi', 'modernis', 'containeri', 'prioriti', 'utili', 'recogni', 'speciali', 'minimi', 'maximi', 'summari', 'finali', 'customi', 'visuali', 'emphasi', 'realis', 'authori', 'categori', 'digiti', 'monetis', 'personali', 'centrali', 'mobili', 'harmoni', 'capitali'];
/** Apply UK/US spelling to -ise/-ize families (Kenyan CVs are overwhelmingly UK English). */
export function localize(text = '', locale = 'uk') {
  let out = text;
  for (const stem of UK) {
    const root = stem.replace(/[sz]$/, '').replace(/i$/, '');
    const re = new RegExp(`\\b(${root}[a-z]*?)(i)([sz])(e|ed|es|ing|ation|ations|er|ers)\\b`, 'gi');
    out = out.replace(re, (m, a, i, z, end) => {
      const target = locale === 'uk' ? 's' : 'z';
      const rep = a + i + (z === z.toUpperCase() ? target.toUpperCase() : target) + end;
      return m[0] === m[0].toUpperCase() ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep;
    });
  }
  if (locale === 'uk') out = out.replace(/\banalyz/g, 'analys').replace(/\bAnalyz/g, 'Analys').replace(/\bAnalyse(d|s)?\b/g, 'Analyse$1');
  else out = out.replace(/\banalys(e|ed|es|ing)\b/g, 'analyz$1').replace(/\bAnalys(e|ed|es|ing)\b/g, 'Analyz$1');
  return out;
}
