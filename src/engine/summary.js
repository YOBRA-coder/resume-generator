import { rng, oxford, localize } from './text.js';
import { lowerFirst } from './verbs.js';

export const TONES = {
  confident: 'Confident',
  professional: 'Professional',
  friendly: 'Friendly',
  concise: 'Concise',
};

const SENIOR_WORDS = /\b(senior|sr\.?|lead|principal|head of|chief|director|manager|staff)\b\s*/i;
/** Align the headline with the target role without claiming seniority the dates don't support. */
export function headlineFor(jobTitle, years) {
  let t = (jobTitle || '').replace(/\s*[(\[].*?[)\]]\s*/g, ' ').replace(/\s+[-–|@].*$/, '').trim();
  if (years < 5) t = t.replace(SENIOR_WORDS, '').trim();
  return t.replace(/\s{2,}/g, ' ');
}

/**
 * Build a 2–3 sentence professional summary from facts the user supplied.
 * ctx: { title, years, skills[], role, proofBullet, education, locale, tone, seed, isStudent }
 */
export function buildSummary(ctx) {
  const r = rng(ctx.seed || 1);
  const tone = ctx.tone || 'professional';
  const title = ctx.title || 'Professional';
  const skills = (ctx.skills || []).slice(0, 4);
  const sk = skills.length ? oxford(skills) : '';
  const strength = r.pick(ctx.role?.strengths || ['delivering reliable results']);
  const years = ctx.years || 0;
  const yrs = years >= 1 ? `${years}+ year${years > 1 ? 's' : ''}` : '';
  const a = /^[aeiou]/i.test(title) ? 'An' : 'A';
  const proof = ctx.proofBullet ? lowerFirst(ctx.proofBullet).replace(/\.$/, '') : '';
  const out = [];

  if (ctx.isStudent || (!years && !ctx.hasExperience)) {
    const opens = {
      confident: [`Motivated ${title} with a strong foundation in ${sk || 'core skills'} and a drive to deliver from day one.`],
      professional: [`${title} with a solid foundation in ${sk || 'core skills'}${ctx.education ? `, backed by ${ctx.education}` : ''}.`, `Recent graduate${ctx.education ? ` (${ctx.education})` : ''} building a career as a ${title}, with working knowledge of ${sk || 'core tools'}.`],
      friendly: [`Curious, hands-on ${title} who learns fast and enjoys turning ideas into results, with a foundation in ${sk || 'core skills'}.`],
      concise: [`${title}. Foundation in ${sk || 'core skills'}.`],
    };
    out.push(r.pick(opens[tone] || opens.professional));
    if (tone !== 'concise') out.push(r.pick([`Eager to apply a strong work ethic and ${strength} in a growing team.`, `Keen to contribute, grow and take ownership in a hands-on role.`]));
  } else {
    const opens = {
      confident: [`${a} ${title} with ${yrs || 'proven'} experience${sk ? ` in ${sk}` : ''}, known for ${strength}.`, `${title} who has spent ${yrs || 'years'} ${sk ? `working with ${sk}` : 'delivering results'}, with a track record of ${strength}.`],
      professional: [`${title} with ${yrs ? `${yrs} of` : 'hands-on'} experience${sk ? ` in ${sk}` : ''}.`, `Results-focused ${title} with ${yrs ? `${yrs} of` : 'practical'} experience${sk ? ` across ${sk}` : ''}.`],
      friendly: [`${title} with ${yrs ? `${yrs} of` : 'hands-on'} experience${sk ? ` in ${sk}` : ''}, ${/^[a-z]+ing\b/i.test(strength) ? `who enjoys ${strength}` : `with a knack for ${strength}`}.`],
      concise: [`${title}, ${yrs ? `${yrs} experience` : 'hands-on experience'}${sk ? `: ${sk}` : ''}.`],
    };
    out.push(r.pick(opens[tone] || opens.professional));
    if (tone !== 'concise') out.push(r.pick([`Strengths include ${strength}.`, `Brings a practical approach to ${strength}.`, `Focused on ${strength}.`]));
    if (proof && tone !== 'concise') out.push(`Recently, ${proof}.`);
  }
  // keep summaries in the 28–70 word band using only facts we hold
  const extra = [];
  if (ctx.education) extra.push(`Holds ${/^[aeiou]/i.test(ctx.education) ? 'an' : 'a'} ${ctx.education}${ctx.school ? ` from ${ctx.school}` : ''}.`);
  if (ctx.softSkills?.length) extra.push(`Works well with ${ctx.softSkills.length > 1 ? 'colleagues and clients' : 'teams'}, with strengths in ${oxford(ctx.softSkills.slice(0, 2).map((x) => x.toLowerCase()))}.`);
  extra.push(r.pick(['Committed to clean, dependable work and clear communication.', 'Takes ownership, communicates clearly and delivers on commitments.']));
  const count = () => out.join(' ').split(/\s+/).length;
  for (const e of extra) { if (tone === 'concise' || count() >= 30) break; out.push(e); }
  return localize(out.join(' ').replace(/\s{2,}/g, ' ').replace(/,\s*\./g, '.'), ctx.locale || 'uk');
}
