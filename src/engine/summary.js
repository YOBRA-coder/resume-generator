import { rng, oxford, localize, wordCount } from './text.js';
import { lowerFirst } from './verbs.js';

export const TONES = { confident: 'Confident', professional: 'Professional', friendly: 'Friendly', concise: 'Concise' };

const SENIOR_WORDS = /\b(senior|sr\.?|lead|principal|head of|chief|director|manager|staff)\b\s*/i;
/** Align the headline with the target role without claiming seniority the dates don't support. */
export function headlineFor(jobTitle, years) {
  let t = (jobTitle || '').replace(/\s*[(\[].*?[)\]]\s*/g, ' ').replace(/\s+[-–|@].*$/, '').trim();
  if (years < 5) t = t.replace(SENIOR_WORDS, '').trim();
  return t.replace(/\s{2,}/g, ' ');
}

const gerund = (s = '') => (/^[a-z]+ing\b/i.test(s) ? s : '');
const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

/**
 * Build a 35–60 word professional summary from facts the user supplied. Different seeds give genuinely different
 * sentence choices and orders. ctx: { title, jobTitle, years, skills[], moreSkills[], softSkills[], role, proofBullet,
 * education, school, industry, locale, tone, seed, hasExperience, isStudent }
 */
export function buildSummary(ctx) {
  const r = rng(ctx.seed || 1);
  const tone = ctx.tone || 'professional';
  const title = ctx.title || 'Professional';
  const sk = oxford((ctx.skills || []).slice(0, 3));
  const more = (ctx.moreSkills || []).slice(0, 3);
  const soft = (ctx.softSkills || []).slice(0, 2).map((s) => s.toLowerCase());
  const strengths = r.shuffle(ctx.role?.strengths || ['delivering reliable results']);
  const s1 = strengths[0], s2 = strengths[1];
  const years = ctx.years || 0;
  const yrs = years >= 1 ? `${years}+ year${years > 1 ? 's' : ''}` : '';
  const proof = ctx.proofBullet ? lowerFirst(ctx.proofBullet).replace(/\.$/, '') : '';
  const A = article(title);
  const student = ctx.isStudent || (!years && !ctx.hasExperience);

  /* sentence 1: who you are */
  const open = student ? {
    confident: [`Motivated ${title} with a strong foundation in ${sk || 'core skills'} and the drive to deliver from day one.`, `Ambitious ${title} combining solid training in ${sk || 'core skills'} with a hands-on approach to learning.`],
    professional: [`${title} with a solid foundation in ${sk || 'core skills'}${ctx.education ? `, backed by ${ctx.education}` : ''}.`, `Early-career ${title} trained in ${sk || 'core skills'}, ready to contribute in a hands-on role.`],
    friendly: [`Curious, hands-on ${title} who learns fast and enjoys turning ideas into results, with a foundation in ${sk || 'core skills'}.`],
    concise: [`${title} with a foundation in ${sk || 'core skills'}.`],
  } : {
    confident: [`${A[0].toUpperCase() + A.slice(1)} ${title} with ${yrs || 'proven'} experience${sk ? ` in ${sk}` : ''}, known for ${s1}.`, `${title} with a track record of ${s1}, built over ${yrs || 'years'} ${sk ? `working with ${sk}` : 'delivering results'}.`, `Results-driven ${title} who has spent ${yrs || 'years'} ${sk ? `working across ${sk}` : 'delivering for teams and clients'}.`],
    professional: [`${title} with ${yrs ? `${yrs} of` : 'hands-on'} experience${sk ? ` in ${sk}` : ''}.`, `Dependable ${title} with ${yrs ? `${yrs} of` : 'practical'} professional experience${sk ? ` across ${sk}` : ''}.`, `${title} experienced in ${sk || 'core responsibilities'}${yrs ? `, with ${yrs} in the field` : ''}.`],
    friendly: [`${title} with ${yrs ? `${yrs} of` : 'hands-on'} experience${sk ? ` in ${sk}` : ''}, ${gerund(s1) ? `who enjoys ${s1}` : `with a knack for ${s1}`}.`, `Practical, collaborative ${title}${yrs ? ` with ${yrs} of experience` : ''}${sk ? ` in ${sk}` : ''}.`],
    concise: [`${title}${yrs ? `, ${yrs} experience` : ''}${sk ? `: ${sk}` : ''}.`],
  };
  const first = r.pick(open[tone] || open.professional);

  /* optional sentences, shuffled */
  const pool = [];
  pool.push(r.pick([`Known for ${s1}${s2 ? ` and ${s2}` : ''}.`, `Strengths include ${s1}${s2 ? ` and ${s2}` : ''}.`, `Brings a practical approach to ${s1}${s2 ? `, with an eye for ${s2}` : ''}.`, `Focused on ${s1}${s2 ? ` while ${gerund(s2) || 'also '}${gerund(s2) ? '' : s2}` : ''}.`.replace(/while also?\s*\./, '.')]));
  if (proof) pool.push(r.pick([`Recently, ${proof}.`, `Recent work includes having ${proof}.`.replace('having ', ''), `Most recently, ${proof}.`]));
  if (more.length) pool.push(r.pick([`Comfortable working with ${oxford(more)}.`, `Also hands-on with ${oxford(more)}.`]));
  if (ctx.education) pool.push(`Holds ${article(ctx.education)} ${ctx.education}${ctx.school ? ` from ${ctx.school}` : ''}.`);
  if (soft.length) pool.push(r.pick([`Works well with colleagues and clients, with strengths in ${oxford(soft)}.`, `Combines technical skill with ${oxford(soft)}.`]));
  if (ctx.jobTitle) pool.push(r.pick([`Now seeking a ${ctx.jobTitle} role${ctx.industry ? ` in ${ctx.industry}` : ''} to apply this experience.`, `Looking to contribute as a ${ctx.jobTitle}${ctx.industry ? ` in the ${ctx.industry} space` : ''}.`]));
  pool.push(r.pick(['Committed to clean, dependable work and clear communication.', 'Takes ownership, communicates clearly and delivers on commitments.', 'Learns quickly and keeps improving how the work gets done.']));

  const target = tone === 'concise' ? [20, 38] : [37, 58];
  const picked = [first];
  let words = wordCount(first);
  for (const s of r.shuffle(pool)) {
    const w = wordCount(s);
    if (words >= target[0]) break;
    if (words + w <= target[1]) { picked.push(s); words += w; }
  }
  // still short? top up from the remaining sentences, shortest first
  if (words < target[0]) for (const s of pool.filter((x) => !picked.includes(x)).sort((a, b) => wordCount(a) - wordCount(b))) { if (words + wordCount(s) <= target[1]) { picked.push(s); words += wordCount(s); } if (words >= target[0]) break; }
  return localize(picked.join(' ').replace(/\s{2,}/g, ' ').replace(/,\s*\./g, '.').replace(/\.\./g, '.'), ctx.locale || 'uk');
}

/** Rebuild a summary from the same facts with a fresh seed, retrying until it differs from `current`. */
export function rewriteSummary(ctx, current = '') {
  let seed = ctx.seed || 1, out = '';
  for (let i = 0; i < 8; i++) {
    out = buildSummary({ ...ctx, seed: seed + i * 7919 });
    if (out.trim() !== (current || '').trim()) break;
  }
  return { text: out, seed };
}
