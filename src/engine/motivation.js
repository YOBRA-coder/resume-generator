import { rng, localize } from './text.js';
import { missionClause } from './coverLetter.js';
import { lowerFirst } from './verbs.js';

const short = (s = '', n = 14) => { const w = s.replace(/[.;:]+$/, '').split(/\s+/); return w.slice(0, n).join(' '); };

/**
 * A *draft* "why this company" the user can edit. Uses only the company text in the job ad and the user's own skills;
 * never states anything about the company that the ad doesn't say.
 */
export function suggestMotivation({ company, jobTitle, job, skills = [], seed = 1, locale = 'uk', previous = '' }) {
  const r = rng(seed);
  const C = (company || '').trim();
  const co = C || 'this team';
  const poss = C ? `${C}'s` : 'your';
  const title = jobTitle || 'this role';
  const [s1, s2] = skills.filter(Boolean).slice(0, 2);
  const mine = s1 ? `${s2 ? `${s1} and ${s2}` : s1} skills` : 'skills';
  const clause = missionClause(job?.mission || []);
  const resp = (job?.responsibilities || []).find((x) => x.split(/\s+/).length >= 4 && x.split(/\s+/).length <= 22);
  const opts = [];
  if (clause) {
    opts.push(`I want my ${mine} to support ${poss} ${clause}, and the ${title} role is where I can do that best.`);
    opts.push(`${poss[0].toUpperCase() + poss.slice(1)} ${clause} is the kind of work I want to be part of, and I would like to contribute with my ${mine}.`);
    opts.push(`I am drawn to ${poss} ${clause} and want to help deliver it as ${/^[aeiou]/i.test(title) ? 'an' : 'a'} ${title}.`);
  }
  if (resp) {
    opts.push(`Work like “${short(resp)}” is exactly what I enjoy doing with my ${mine}, and I would like to do it at ${co}.`);
    opts.push(`The responsibilities in the ${title} role, such as “${lowerFirst(short(resp))}”, match the work I want to grow in.`);
  }
  if (job?.industry) {
    opts.push(`I enjoy working in ${job.industry} and want to bring my ${mine} to ${co} as ${/^[aeiou]/i.test(title) ? 'an' : 'a'} ${title}.`);
    opts.push(`${job.industry[0].toUpperCase() + job.industry.slice(1)} is where I want to build my career, and ${co} is a place I would be glad to contribute with my ${mine}.`);
  }
  opts.push(`I am looking for a ${title} role where I can apply my ${mine} and keep growing, and ${co} is a strong match for that.`);
  opts.push(`I want to use my ${mine} on meaningful work, and the ${title} position at ${co} is exactly that kind of opportunity.`);
  const pool = opts.filter((o) => o !== previous);
  return localize(r.pick(pool.length ? pool : opts), locale);
}
