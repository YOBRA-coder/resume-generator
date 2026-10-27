import { parseJob } from './jobParser.js';
import { detectRole } from './roles.js';
import { findSkills, canonicalSkill } from './dictionary.js';
import { strengthenBullet, splitNotes } from './rewriter.js';
import { retense } from './verbs.js';
import { scoreBullet, orderSkills, bulletBudget, matchJob, profileSkillSet } from './matcher.js';
import { buildSummary, headlineFor } from './summary.js';
import { buildCoverLetter } from './coverLetter.js';
import { analyzeResume } from './ats.js';
import { totalYears, uid, bulletText, formatDate } from './profileUtils.js';
import { localize, rng, uniq } from './text.js';
import { inventedNumbers } from './guard.js';

/** Fill {a}/{b}/{c} from the user's own skills; drop clauses whose slot is missing; skip duties that can't be made honest. */
export function fillDuty(tpl, slots) {
  let t = tpl.replace(/\s(?:with|using|in|through|via)\s\{[abc]\}(?:(?:,\s|\sand\s)\{[abc]\})*/g, (clause) => {
    const names = [...clause.matchAll(/\{([abc])\}/g)].map((m) => slots[m[1]]);
    if (names.some((n) => !n)) return '';
    return clause.replace(/\{([abc])\}/g, (_, k) => slots[k]);
  });
  if (/\{[abc]\}/.test(t)) return null;
  return t;
}

/** Bullets for a role: user's bullets → their rough notes → typical duties (flagged `generated`). */
export function roleBullets(exp, { role, userSkills, locale = 'uk', seed = 1 }) {
  const current = !!exp.current;
  const have = (exp.bullets || []).filter((b) => bulletText(b).trim());
  if (have.length) return have.map((b) => ({ id: b.id || uid(), text: strengthenBullet(bulletText(b), { current, locale }).text, generated: !!b.generated, source: b.generated ? 'generated' : 'user' }));
  const notes = splitNotes(exp.notes || '');
  if (notes.length) return notes.map((n) => ({ id: uid(), text: strengthenBullet(n, { current, locale }).text, source: 'notes' }));
  const roleSet = new Set(role.skills.map(canonicalSkill));
  const mine = userSkills.filter((s) => roleSet.has(canonicalSkill(s)) && !/^(communication|teamwork)$/i.test(s));
  const slots = { a: mine[0], b: mine[1], c: mine[2] };
  const r = rng(seed);
  const pool = r.shuffle(role.duties).map((d) => fillDuty(d, slots)).filter(Boolean);
  return pool.slice(0, 4).map((t) => ({ id: uid(), text: strengthenBullet(t, { current, locale }).text, generated: true, source: 'generated' }));
}

const ROLE_SECTIONS_SENIOR = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages', 'awards', 'referees'];
const ROLE_SECTIONS_JUNIOR = ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'languages', 'awards', 'referees'];

/**
 * Local (offline) tailoring. Pure function: master profile + job -> resume + cover letter + analysis.
 * opts: { company, jobTitle, jobText, motivation, recipient, tone, locale, pages, seed }
 */
export function tailorLocal(master, opts = {}) {
  const locale = opts.locale || 'uk';
  const seed = opts.seed || Math.floor(Math.random() * 1e6) + 1;
  const jobTitle = opts.jobTitle || master.targetRole || master.basics.headline || '';
  const job = parseJob(opts.jobText || '', { title: jobTitle });
  const role = detectRole(jobTitle || job.titleGuess, [master.skills.join(' '), job.titleGuess].join(' '));
  const nonIntern = master.experience.filter((e) => !/\b(intern|internship|attach(e)?ment|trainee|volunteer)\b/i.test(e.role || ''));
  const years = totalYears(nonIntern.length ? nonIntern : master.experience);
  const pages = opts.pages || 1;

  // skills — user's own, job-matched first; role suggestions only if the user listed almost nothing
  let skills = uniq((master.skills || []).map((s) => canonicalSkill(typeof s === 'string' ? s : s.name)).filter(Boolean));
  const inferred = [...profileSkillSet({ ...master, skills }).entries()].filter(([, src]) => src === 'in-experience').map(([n]) => n);
  skills = uniq([...skills, ...inferred]);
  let generatedSkills = false;
  if (skills.length < 4) { skills = uniq([...skills, ...role.skills.slice(0, 8 - skills.length)]); generatedSkills = true; }
  skills = orderSkills(skills, job);
  const hard = skills.filter((s) => !role.soft.map(canonicalSkill).includes(s));

  // experience — strengthen, rank by relevance, budget by recency
  const sorted = [...master.experience].sort((a, b) => (b.current ? 1 : 0) - (a.current ? 1 : 0) || (b.start || '').localeCompare(a.start || ''));
  const experience = sorted.map((e, i) => {
    const all = roleBullets(e, { role, userSkills: skills, locale, seed: seed + i });
    const ranked = all.map((b, idx) => ({ b, idx, s: scoreBullet(b.text, job) })).sort((x, y) => y.s - x.s || x.idx - y.idx);
    const keep = ranked.slice(0, bulletBudget(i, sorted.length, pages)).map((x) => x.b);
    return { ...e, bullets: keep, _hiddenCount: all.length - keep.length };
  });

  const strongest = experience.flatMap((e) => e.bullets).filter((b) => /\d/.test(b.text) && b.source !== 'generated').sort((a, b) => scoreBullet(b.text, job) - scoreBullet(a.text, job))[0];
  const eduLine = master.education[0] ? [master.education[0].degree, master.education[0].field].filter(Boolean).join(' in ') : '';
  const title = headlineFor(jobTitle, years) || role.label;
  const summary = master.summary && opts.keepSummary ? master.summary : buildSummary({
    title, years, skills: hard.slice(0, 4), role, proofBullet: strongest ? retense(strongest.text, false) : undefined, education: eduLine, school: master.education[0]?.school, softSkills: skills.filter((k) => role.soft.map((x) => x.toLowerCase()).includes(k.toLowerCase())), locale, tone: opts.tone, seed,
    hasExperience: master.experience.length > 0, isStudent: !master.experience.length,
  });

  const resume = {
    basics: { ...master.basics, headline: title },
    summary,
    skills,
    experience,
    education: master.education,
    projects: master.projects,
    certifications: master.certifications,
    languages: master.languages,
    awards: master.awards,
    referees: master.referees,
    sectionOrder: years >= 3 ? ROLE_SECTIONS_SENIOR : ROLE_SECTIONS_JUNIOR,
    hidden: [],
  };

  const match = matchJob(resume, job);
  const evidence = experience.flatMap((e) => e.bullets.slice(0, 2).map((b) => ({ ...b, role: e.role, company: e.company, current: e.current, rank: scoreBullet(b.text, job) }))).filter((b) => b.source !== 'generated').sort((a, b) => b.rank - a.rank).slice(0, 2);
  const cover = buildCoverLetter({
    name: master.basics.name, company: opts.company, jobTitle, recipient: opts.recipient, tone: opts.tone, seed, locale,
    motivation: opts.motivation, mission: job.mission, industry: job.industry, job, evidence, matched: match.matched.filter((m) => m.kind === 'hard'),
    soft: match.matched.filter((m) => m.kind === 'soft').length ? match.matched.filter((m) => m.kind === 'soft') : (role.soft || []).filter((s) => skills.map((k) => k.toLowerCase()).includes(s.toLowerCase())),
    years, education: eduLine,
  });

  const analysis = analyzeResume(resume, job, {});
  const source = JSON.stringify([master, opts.motivation, years]);
  const flagged = inventedNumbers([resume.summary, ...experience.flatMap((e) => e.bullets.map((b) => b.text)), ...cover.paragraphs].join('\n'), source, [years]);
  return { job, role: { id: role.id, label: role.label }, resume, cover, match, analysis, generatedSkills, seed, engine: 'local', flaggedNumbers: flagged };
}
export { formatDate, findSkills };
