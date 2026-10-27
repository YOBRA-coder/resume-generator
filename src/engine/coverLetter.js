import { rng, oxford, localize, clean } from './text.js';
import { lowerFirst as lf } from './verbs.js';
const lowerFirst = (t = '') => (/^I(\s|'|’)/.test(t) ? t : lf(t));
import { formatDate } from './profileUtils.js';

const EXTRACT = [
  [/\b(?:mission|goal|vision|purpose|aim)\s+(?:is\s+)?to\s+([^.;]{10,160})/i, (x) => `mission to ${x}`],
  [/\b(?:committed|dedicated)\s+to\s+([^.;]{8,140})/i, (x) => `commitment to ${x}`],
  [/\bpassionate\s+about\s+([^.;]{8,140})/i, (x) => `passion for ${x}`],
  [/\bwe\s+believe\s+(?:that\s+)?([^.;]{10,140})/i, (x) => `belief that ${x}`],
  [/\bwe\s+(?:help|empower|enable)\s+([^.;]{8,140})/i, (x) => `work to help ${x}`],
];
/** Pull a quotable clause from the company's own text. Returns '' if none (never invents one). */
export function missionClause(sentencesIn = []) {
  for (const s of sentencesIn) for (const [re, fmt] of EXTRACT) {
    const m = s.match(re);
    if (m) {
      let x = m[1].trim().replace(/[,\s]+$/, '');
      const w = x.split(/\s+/); if (w.length > 18) x = w.slice(0, 18).join(' ').replace(/[,\s]+(and|or|to|for|in|of|the|a)$/i, '');
      return fmt(x);
    }
  }
  return '';
}

const SIGN = { confident: 'Sincerely', professional: 'Kind regards', friendly: 'Warm regards', concise: 'Regards' };

/**
 * ctx: { name, company, jobTitle, recipient, tone, seed, locale, motivation, mission[], industry,
 *        job (parsed), evidence[{role, company, text}], matched[], soft[], years, education, headline }
 * Returns { greeting, paragraphs[4], closing, signoff } — facts only from ctx.
 */
export function buildCoverLetter(ctx) {
  const r = rng(ctx.seed || 7);
  const tone = ctx.tone || 'professional';
  const company = clean(ctx.company) || 'your organisation';
  const hasCompany = !!clean(ctx.company);
  const title = ctx.jobTitle || 'this role';
  const clause = missionClause(ctx.mission || []);
  const motive = clean(ctx.motivation || '').replace(/^[Bb]ecause\s+/, '').replace(/^I\s+(?:am|'m)\s+/i, 'I am ').replace(/[.\s]+$/, '');
  const years = ctx.years || 0;
  const matched = (ctx.matched || []).slice(0, 4);
  const soft = (ctx.soft || []).slice(0, 2);

  // 1 — opening: role + company + a real reason
  let p1;
  const roleLine = r.pick([`I am writing to apply for the ${title} position${hasCompany ? ` at ${company}` : ''}.`, `I'd like to be considered for the ${title} role${hasCompany ? ` at ${company}` : ''}.`, `Please accept my application for the ${title} position${hasCompany ? ` at ${company}` : ''}.`]);
  if (clause) {
    const hook = r.pick([
      `${hasCompany ? `${company}'s` : 'Your'} ${clause} is what first drew me to this opportunity.`,
      `What stands out to me about ${hasCompany ? company : 'your organisation'} is the ${clause}, and I would like to help deliver on it.`,
      `I was drawn to ${hasCompany ? `${company}'s` : 'your'} ${clause}, and it matches the kind of work I want to do.`,
    ]);
    p1 = `${roleLine} ${hook}`;
  } else if (motive) {
    p1 = `${roleLine} ${r.pick([`I am drawn to ${hasCompany ? company : 'the organisation'} because ${lowerFirst(motive)}.`, `What draws me to ${hasCompany ? company : 'this opportunity'}: ${lowerFirst(motive)}.`])}`;
  } else if (ctx.industry) {
    p1 = `${roleLine} I am excited by the chance to contribute to ${hasCompany ? `${company}'s` : 'your'} work in ${ctx.industry}.`;
  } else {
    p1 = `${roleLine} The responsibilities described match the work I do best, and I would value the chance to contribute to your team.`;
  }
  if (clause && motive) p1 = p1; // motivation is used in paragraph 3

  // 2 — evidence: link what they asked for to something the candidate actually did
  const ev = (ctx.evidence || []).slice(0, 2);
  let p2;
  const asks = matched.length ? oxford(matched.slice(0, 3).map((m) => m.name || m)) : '';
  if (ev.length) {
    const first = ev[0];
    const where = first.company ? `${first.current ? 'In my current role' : 'In my role'} ${first.role ? `as ${first.role} ` : ''}at ${first.company}` : 'In my recent work';
    const lead = asks ? r.pick([`Your posting highlights ${asks}, which ${matched.length > 1 ? 'are' : 'is'} central to my work. `, `You are looking for strength in ${asks}, and that is where I have spent most of my time. `]) : '';
    p2 = `${lead}${where}, I ${lowerFirst(first.text)}.`;
    if (ev[1]) p2 += ` ${r.pick(['I also', 'In addition, I', 'Alongside this, I'])} ${lowerFirst(ev[1].text)}.`;
  } else if (ctx.education) {
    p2 = `${asks ? `Your posting highlights ${asks}. ` : ''}My ${ctx.education} has given me a practical foundation, and I am ready to apply it in a hands-on role.`;
  } else {
    p2 = `${asks ? `Your posting highlights ${asks}, and I bring working experience in ${asks.includes(',') ? 'these areas' : 'this area'}. ` : ''}I am ready to apply what I know from day one.`;
  }

  // 3 — fit & motivation: soft skills + the user's own "why"
  const parts = [];
  if (soft.length) parts.push(`Beyond the technical side, I bring ${oxford(soft.map((s) => (s.name || s).toLowerCase()))}, which ${soft.length > 1 ? 'help' : 'helps'} me work well with colleagues and keep projects moving.`);
  if (clause && motive) parts.push(`On a personal level, ${lowerFirst(motive)}.`);
  if (years >= 1 && !parts.length) parts.push(`With ${years}+ year${years > 1 ? 's' : ''} of experience, I am used to learning quickly, taking ownership and delivering dependable work.`);
  if (!parts.length) parts.push('I learn quickly, take ownership of my work and communicate clearly, which I believe will serve your team well.');
  if (ctx.job?.workMode && tone === 'friendly') parts.push(`I am comfortable with the ${ctx.job.workMode} way of working described.`);
  const p3 = parts.join(' ');

  // 4 — close
  const closers = {
    confident: [`I would welcome the opportunity to discuss how I can help ${hasCompany ? company : 'your team'} reach its goals. Thank you for your time and consideration.`],
    professional: [`Thank you for considering my application. I would welcome the opportunity to discuss how my experience can contribute to ${hasCompany ? company : 'your team'}, and I am available for an interview at your convenience.`],
    friendly: [`Thank you for taking the time to read my application. I would love to chat about how I can contribute to ${hasCompany ? company : 'your team'}.`],
    concise: [`Thank you for your consideration. I would welcome the chance to discuss the role further.`],
  };
  const p4 = r.pick(closers[tone] || closers.professional);

  const paragraphs = [p1, p2, p3, p4].map((p) => localize(p.replace(/\s{2,}/g, ' ').replace(/\.\./g, '.'), ctx.locale || 'uk'));
  return {
    greeting: ctx.recipient ? `Dear ${ctx.recipient},` : 'Dear Hiring Manager,',
    paragraphs,
    signoff: `${SIGN[tone] || 'Kind regards'},`,
  };
}
export { formatDate };
