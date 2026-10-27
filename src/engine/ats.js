import { wordCount } from './text.js';
import { matchJob } from './matcher.js';
import { bulletText } from './profileUtils.js';

/** ATS + quality checks on a resume object (+ optional parsed job). Returns {score, checks[]}. */
export function analyzeResume(resume, job, design = {}) {
  const b = resume.basics || {};
  const bullets = (resume.experience || []).flatMap((e) => (e.bullets || []).map(bulletText)).filter(Boolean);
  const text = [resume.summary, ...bullets, ...(resume.skills || [])].join(' ');
  const words = wordCount(text) + wordCount(resume.summary);
  const withMetric = bullets.filter((t) => /\d/.test(t)).length;
  const checks = [
    { id: 'contact', label: 'Email and phone present', pass: !!b.email && !!b.phone, weight: 12, tip: 'Add both an email and a phone number so recruiters can reach you.' },
    { id: 'name', label: 'Name and headline present', pass: !!b.name && !!(b.headline || resume.title), weight: 8, tip: 'Add your name and a headline that matches the role.' },
    { id: 'summary', label: 'Summary of 25–80 words', pass: wordCount(resume.summary) >= 25 && wordCount(resume.summary) <= 80, weight: 10, tip: 'Keep the summary between 25 and 80 words.' },
    { id: 'experience', label: 'Experience or projects listed', pass: (resume.experience || []).some((e) => e.company || e.role) || (resume.projects || []).length > 0, weight: 14, tip: 'Add at least one job, internship or project.' },
    { id: 'verbs', label: 'Bullets start with action verbs', pass: bullets.length > 0 && bullets.filter((t) => /^[A-Z][a-z]+(ed|d|t|w|n)\b|^(Led|Ran|Built|Wrote|Taught|Oversaw|Managed|Drove)\b/.test(t)).length / bullets.length >= 0.7, weight: 10, tip: 'Start each bullet with a verb such as Built, Led or Reduced.' },
    { id: 'metrics', label: 'Some bullets include numbers', pass: withMetric >= Math.min(2, Math.max(1, Math.floor(bullets.length / 4))), weight: 10, tip: 'Add real numbers (people, money, time, volume) to a few bullets.' },
    { id: 'skills', label: '6 or more skills listed', pass: (resume.skills || []).length >= 6, weight: 8, tip: 'List at least six relevant skills.' },
    { id: 'education', label: 'Education present', pass: (resume.education || []).length > 0, weight: 6, tip: 'Add your highest qualification.' },
    { id: 'length', label: 'Length is 300–900 words', pass: words >= 250 && words <= 1000, weight: 6, tip: words < 250 ? 'Add detail to experience bullets.' : 'Trim to the most relevant content.' },
    { id: 'photo', label: design.showPhoto && b.photo ? 'Photo is on: some ATS and regions discourage it' : 'No photo (safest for ATS)', pass: !(design.showPhoto && b.photo), weight: 4, tip: 'Turn the photo off when applying through online portals in the US, UK or Canada.', soft: true },
  ];
  let match = null;
  if (job && (job.hardSkills.length || job.softSkills.length)) {
    match = matchJob(resume, job);
    checks.push({ id: 'match', label: `Covers ${match.matched.length} of ${match.matched.length + match.missing.length} keywords from the job ad`, pass: match.score >= 60, weight: 22, tip: 'Add the missing keywords you genuinely have to your skills or bullets.' });
  }
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + (c.pass ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks, match };
}
