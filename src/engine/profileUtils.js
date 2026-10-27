export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Parse "2021-03", "Mar 2021", "March 2021", "03/2021", "2021" -> "YYYY-MM" (or "YYYY"). Returns '' if unknown. */
export function parseDate(s = '') {
  const t = String(s).trim().toLowerCase();
  if (!t || /^(present|current|now|to date|ongoing|till date|date)$/.test(t)) return '';
  let m = t.match(/^(\d{4})-(\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;
  m = t.match(/^(\d{1,2})[/.-](\d{4})$/); if (m) return `${m[2]}-${m[1].padStart(2, '0')}`;
  m = t.match(/^([a-z]{3,9})\.?,?\s+(\d{4})$/); if (m) { const i = MONTHS.indexOf(m[1].slice(0, 3)); if (i >= 0) return `${m[2]}-${String(i + 1).padStart(2, '0')}`; }
  m = t.match(/^(\d{4})$/); if (m) return m[1];
  return '';
}
export function formatDate(v = '', style = 'short') {
  if (!v) return '';
  const m = v.match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!m) return v;
  if (!m[2]) return m[1];
  const i = +m[2] - 1;
  return style === 'long' ? `${MONTH_LONG[i]} ${m[1]}` : `${MONTH_LONG[i].slice(0, 3)} ${m[1]}`;
}
export const formatRange = (start, end, current) => {
  const a = formatDate(start), b = current ? 'Present' : formatDate(end);
  return a && b ? `${a} – ${b}` : a || b || '';
};
const toMonths = (v, fallbackNow = false) => {
  if (!v) return fallbackNow ? new Date().getFullYear() * 12 + new Date().getMonth() : null;
  const m = v.match(/^(\d{4})(?:-(\d{2}))?$/); if (!m) return null;
  return +m[1] * 12 + (m[2] ? +m[2] - 1 : 0);
};
/** Total years of experience with overlapping roles merged (floor to whole years). */
export function totalYears(experience = []) {
  const ranges = experience.map((e) => [toMonths(e.start), e.current || !e.end ? toMonths('', true) : toMonths(e.end)]).filter(([a, b]) => a != null && b != null && b >= a).sort((x, y) => x[0] - y[0]);
  let total = 0, curEnd = -1, curStart = -1;
  for (const [a, b] of ranges) {
    if (curStart < 0) { curStart = a; curEnd = b; } else if (a <= curEnd) curEnd = Math.max(curEnd, b); else { total += curEnd - curStart; curStart = a; curEnd = b; }
  }
  if (curStart >= 0) total += curEnd - curStart;
  return Math.floor(total / 12);
}

export const emptyProfile = () => ({
  id: 'master',
  basics: { name: '', headline: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', photo: null },
  targetRole: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  referees: [],
  updatedAt: Date.now(),
});
export const emptyExperience = () => ({ id: uid(), company: '', role: '', location: '', start: '', end: '', current: false, notes: '', bullets: [] });
export const emptyEducation = () => ({ id: uid(), school: '', degree: '', field: '', start: '', end: '', grade: '', notes: '' });
export const emptyProject = () => ({ id: uid(), name: '', link: '', tech: '', description: '' });
export const emptyCert = () => ({ id: uid(), name: '', issuer: '', year: '' });

export const profileCompleteness = (p) => {
  const checks = [!!p.basics.name, !!p.basics.email, !!p.basics.phone, !!p.targetRole || !!p.basics.headline, p.experience.length > 0 || p.projects.length > 0, p.education.length > 0, p.skills.length >= 4];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
export const bulletText = (b) => (typeof b === 'string' ? b : b?.text || '');
