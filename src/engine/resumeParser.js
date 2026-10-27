import { parseDate, uid } from './profileUtils.js';
import { canonicalSkill } from './dictionary.js';

const MON = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DPART = `(?:${MON}\\.?\\s+\\d{4}|\\d{1,2}[/.]\\d{4}|\\d{4})`;
const RANGE = new RegExp(`(${DPART})\\s*(?:-|–|—|to|until|till)\\s*(${DPART}|present|current|now|to date|date|ongoing)`, 'i');
const SINGLE_YEAR = /\b(19|20)\d{2}\b/;

const HEADINGS = {
  summary: /^(professional |career |personal |executive )?(summary|profile|objective|statement|about( me)?|career objective|personal statement|overview)$/i,
  experience: /^((professional|relevant|work|employment|career|industrial|internship) )?(experience|history|background|attachment)s?( history)?( and internships?)?$|^employment( history| record)?$|^internships?$|^work$|^volunteer(ing)?( experience)?$/i,
  education: /^(education(al)?( background| and (training|qualifications))?|academic( background| qualifications| history)?|qualifications|education & training)$/i,
  skills: /^(key |technical |core |professional |top |relevant )?(skills|competenc(ies|y)|expertise|strengths|skills (&|and) (tools|abilities|competencies)|technologies|tools( & technologies)?|tech stack)$/i,
  projects: /^(selected |personal |key |academic |notable )?projects?$|^portfolio$/i,
  certifications: /^(licen[cs]es? )?(and )?(certificat(ions?|es)|licen[cs]es?|courses|trainings?|professional (development|certifications?)|training( & certifications?)?)$/i,
  languages: /^languages?$/i,
  awards: /^(honou?rs?(-| & | and )?awards?|awards?( & honou?rs?)?|achievements?|accomplishments?|honou?rs?)$/i,
  referees: /^(referees?|references?)$/i,
  contact: /^(contact( info(rmation)?)?|personal (details|information|data))$/i,
  ignore: /^(interests?|hobbies( & interests)?|declaration|publications?|volunteer|extra[\s-]?curricular( activities)?|activities|memberships?|affiliations?|page \d+( of \d+)?)$/i,
};
const BULLET = /^\s*(?:[•·●▪■◦‣⁃▸►→*\-–—]|\d{1,2}[.)])\s+/;
const ROLE_WORDS = /\b(developer|engineer|manager|officer|analyst|designer|assistant|executive|specialist|coordinator|accountant|teacher|nurse|technician|consultant|administrator|director|lead|intern|trainee|associate|representative|supervisor|clerk|driver|chef|writer|scientist|architect|attendant|cashier|secretary|tutor|lecturer|founder|owner|freelance|programmer|agent|head|president|volunteer|auditor|surveyor|receptionist|operator|cook|waiter|supervisor)\b/i;
const SCHOOL_WORDS = /\b(university|college|school|institute|polytechnic|academy|campus|high school|secondary|technical)\b/i;
const DEGREE_WORDS = /\b(ph\.?d|doctorate|master'?s?|msc|m\.?sc|mba|m\.?a\b|bachelor'?s?|b\.?sc|bsc|b\.?a\b|b\.?com|b\.?ed|beng|b\.?eng|diploma|higher national|certificate|kcse|kcpe|a[\s-]?levels?|o[\s-]?levels?|associate|degree|cpa|acca|cfa)\b/i;

const clean = (s) => s.replace(/[​ ]/g, ' ').replace(/[ \t]+/g, ' ').trim();

function classifyHeading(line) {
  const t = clean(line).replace(/[:：\-–—_=*#|]+$/g, '').replace(/^[#*_\-=\s]+/, '').trim();
  if (!t || t.length > 45 || /[.@]/.test(t) || /\d{4}/.test(t)) return null;
  if (t.split(/\s+/).length > 5) return null;
  for (const [k, re] of Object.entries(HEADINGS)) if (re.test(t)) return k;
  return null;
}

function extractContacts(text) {
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
  const phones = [...text.matchAll(/(?<![\d/])(\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3}[\s.-]?\d{3,4}(?![\d/])/g)].map((m) => m[0].trim()).filter((p) => p.replace(/\D/g, '').length >= 9 && p.replace(/\D/g, '').length <= 14 && !new RegExp(`^${DPART}$`).test(p));
  const linkedin = (text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?/i) || [])[0] || '';
  const github = (text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i) || [])[0] || '';
  const web = [...text.matchAll(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|co\.ke|dev|io|me|net|org|app|ke|tech|xyz)(?:\/[^\s,;|]*)?/gi)].map((m) => m[0]).find((u) => !/linkedin|github|@/.test(u) && !u.includes(email.split('@')[1] || '\0') ) || '';
  return { email, phone: phones[0] || '', linkedin: linkedin.replace(/^https?:\/\//, ''), github: github.replace(/^https?:\/\//, ''), website: web.replace(/^https?:\/\//, '') };
}

function parseRangeLine(line) {
  const m = line.match(RANGE);
  if (!m) return null;
  const startRaw = m[1], endRaw = m[2];
  const cur = /present|current|now|to date|^date$|ongoing/i.test(endRaw);
  return { start: parseDate(startRaw.replace(/\./g, '/').replace(/^(\d{1,2})\/(\d{4})$/, '$1/$2')) || parseDate(startRaw), end: cur ? '' : parseDate(endRaw) || parseDate(endRaw.replace('.', '/')), current: cur, rest: clean(line.replace(RANGE, ' ').replace(/\([^)]*(?:year|month|yr|mo)[^)]*\)/gi, '').replace(/\(\s*\)/g, '').replace(/[|•·,–—-]+\s*$/g, '').replace(/^\s*[|•·,–—-]+/g, '').trim()) };
}

function splitCompanyRole(parts, linkedinStyle) {
  const ps = parts.map(clean).filter(Boolean);
  if (!ps.length) return { role: '', company: '' };
  if (ps.length === 1) {
    const one = ps[0];
    const at = one.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i); if (at) return { role: at[1], company: at[2] };
    const seps = one.split(/\s+[|•·–—-]\s+|,\s+(?=[A-Z])/); if (seps.length >= 2) return splitCompanyRole(seps, linkedinStyle);
    return ROLE_WORDS.test(one) ? { role: one, company: '' } : { role: '', company: one };
  }
  const [a, b] = ps;
  const ra = ROLE_WORDS.test(a), rb = ROLE_WORDS.test(b);
  if (ra && !rb) return { role: a, company: b };
  if (rb && !ra) return { role: b, company: a };
  return linkedinStyle ? { company: a, role: b } : { role: a, company: b };
}

function isLocationLine(l) { return /^[A-Z][A-Za-z .'-]+(?:,\s*[A-Z][A-Za-z .'-]+){1,2}$/.test(l) && l.length < 45 && !ROLE_WORDS.test(l); }

function parseExperience(lines, linkedinStyle) {
  const entries = [];
  let cur = null, pending = [];
  const flushBullet = () => {};
  const startEntry = (range, headerParts) => {
    const { role, company } = splitCompanyRole(headerParts, linkedinStyle);
    let loc = '', comp = company;
    const cm = comp.match(/^(.*?),\s*((?:Nairobi|Mombasa|Kisumu|Nakuru|Eldoret|Thika|Nyeri|Kampala|Dar es Salaam|Kigali|Lagos|Accra|London|Remote|[A-Z][a-z]+, Kenya|Kenya))$/);
    if (cm) { comp = cm[1]; loc = cm[2]; }
    cur = { id: uid(), company: comp, role, location: loc, start: range.start, end: range.end, current: range.current, notes: '', bullets: [] };
    entries.push(cur); pending = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const range = parseRangeLine(line);
    if (range) {
      const headerParts = [...pending.filter((p) => !BULLET.test(p)).slice(-2), ...(range.rest ? [range.rest] : [])];
      // when the rest of the date line is itself "Company, City" style, keep it as a header part
      startEntry(range, headerParts.length ? headerParts : (cur ? [] : []));
      continue;
    }
    if (BULLET.test(line)) {
      const text = line.replace(BULLET, '').trim();
      if (cur) cur.bullets.push({ id: uid(), text }); else pending.push(line);
      continue;
    }
    // continuation of a wrapped bullet
    if (cur && cur.bullets.length) {
      const last = cur.bullets[cur.bullets.length - 1];
      const next = lines[i + 1] || '';
      const nextIsDate = RANGE.test(next);
      const looksHeader = line.length < 60 && !/[.!?]$/.test(line) && (nextIsDate || ROLE_WORDS.test(line)) && /^[A-Z0-9]/.test(line);
      if (!looksHeader && (/^[a-z(]/.test(line) || !/[.!?]$/.test(last.text)) && !nextIsDate) { last.text += ' ' + line; continue; }
    }
    if (cur && !cur.bullets.length && isLocationLine(line) && !cur.location) { cur.location = line; continue; }
    if (cur && !cur.bullets.length && !RANGE.test(lines[i + 1] || '') && line.length > 40) { cur.bullets.push({ id: uid(), text: line }); continue; }
    pending.push(line);
    if (cur && RANGE.test(lines[i + 1] || '')) { /* next line starts a new entry; pending is its header */ }
    else if (cur && !cur.bullets.length && line.length <= 40 && !pending.slice(0, -1).length && false) pending = [];
    // plain description sentences after an entry
    if (cur && !RANGE.test(lines[i + 1] || '') && line.length > 30) { cur.bullets.push({ id: uid(), text: line }); pending = pending.filter((p) => p !== line); }
  }
  return entries.map((e) => ({ ...e, bullets: e.bullets.map((b) => ({ ...b, text: clean(b.text).replace(/[.]$/, '') })).filter((b) => b.text.length > 3) })).filter((e) => e.company || e.role);
}

function parseEducation(lines) {
  const out = [];
  let cur = null;
  const push = () => { if (cur && (cur.school || cur.degree)) out.push(cur); cur = null; };
  const fresh = () => ({ id: uid(), school: '', degree: '', field: '', start: '', end: '', grade: '', notes: '' });
  for (const raw of lines) {
    const line = raw.replace(BULLET, '').trim();
    if (!line) continue;
    const range = parseRangeLine(line);
    const yearOnly = !range && line.match(/\b((?:19|20)\d{2})\b/);
    const body = range ? range.rest : yearOnly ? clean(line.replace(/\(?\b(?:19|20)\d{2}\b\)?/g, '')).replace(/[|,–—-]+\s*$/, '') : line;
    const isGrade = /^(first class|second class|upper second|lower second|distinction|merit|credit|pass|gpa|grade|mean grade|class\b)/i.test(body) || /^[A-D][+-]?$/.test(body);
    if (isGrade && cur) { cur.grade = cur.grade || body.replace(/^(grade|gpa)\s*[:\-]\s*/i, ''); continue; }
    const cleanBody = body.replace(/[·•]\s*$/, '').replace(/\s*[·•]\s*$/, '').trim();
    const isSchool = SCHOOL_WORDS.test(cleanBody), isDegree = DEGREE_WORDS.test(cleanBody);
    if ((isSchool && cur?.school && !isDegree) || (isDegree && cur?.degree) || (isSchool && isDegree && (cur?.school || cur?.degree))) push();
    if (!cur) cur = fresh();
    if (isDegree || isSchool) {
      const parts = cleanBody.split(/\s*[,–—|·]\s+|\s+[-]\s+/).map((x) => x.trim()).filter(Boolean);
      for (const part of parts) {
        if (SCHOOL_WORDS.test(part) && !DEGREE_WORDS.test(part)) cur.school ||= part;
        else if (DEGREE_WORDS.test(part) && !cur.degree) {
          const mm = part.match(/^(.+?)\s+in\s+(.+)$/i);
          if (mm && /^(bachelor|master|bsc|msc|ba\b|ma\b|ph|diploma|certificate|higher|associate|b\.)/i.test(mm[1])) { cur.degree = mm[1].trim(); cur.field = mm[2].trim(); } else cur.degree = part;
        } else if (cur.degree && !cur.field && !SCHOOL_WORDS.test(part)) cur.field = part;
        else if (!cur.school) cur.school = part;
      }
      const g = cleanBody.match(/\b(first class|second class(?: upper| lower)?|upper second|lower second|distinction|merit|credit|gpa:?\s*[\d.]+(?:\/[\d.]+)?|mean grade:?\s*[A-D][+-]?)/i); if (g) cur.grade = cur.grade || g[0];
    } else if (!cur.school && cleanBody.length < 70 && /^[A-Z]/.test(cleanBody)) cur.school = cleanBody;
    if (range) { cur.start = range.start; cur.end = range.end; if (range.current) cur.end = ''; }
    else if (yearOnly && !cur.end) cur.end = yearOnly[1];
  }
  push();
  return out;
}

function parseSkills(lines) {
  const items = [];
  for (const l of lines) {
    const t = l.replace(BULLET, '').replace(/^[A-Za-z &/]{3,28}:\s*/, '');
    for (const part of t.split(/[,;|•·●▪]|\s{2,}|\s[-–]\s/)) {
      const s = part.replace(/\(.*?\)/g, '').replace(/^[\s\-–—:]+|[\s.:]+$/g, '').trim();
      if (s && s.length <= 36 && s.split(/\s+/).length <= 4) items.push(canonicalSkill(s));
    }
  }
  return [...new Set(items)].slice(0, 40);
}

function parseCerts(lines) {
  return lines.map((l) => l.replace(BULLET, '').trim()).filter((l) => l.length > 3).map((l) => {
    const year = (l.match(/\b(?:19|20)\d{2}\b/) || [''])[0];
    const body = l.replace(/\(?\b(?:19|20)\d{2}\b\)?/g, '').replace(/[|,–—-]+\s*$/g, '').trim();
    const parts = body.split(/\s+(?:[–—|-]|by|from|-)\s+|,\s+/);
    return { id: uid(), name: (parts[0] || body).trim(), issuer: parts.slice(1).join(', ').trim(), year };
  }).slice(0, 15);
}

function parseLanguages(lines) {
  const out = [];
  for (const l of lines) for (const part of l.replace(BULLET, '').split(/[,;|•·]/)) {
    const m = part.trim().match(/^([A-Za-z]{3,20})\s*(?:[-–:(]\s*)?([A-Za-z ]{0,30})\)?$/);
    if (m && !/^(languages?)$/i.test(m[1])) out.push({ name: m[1][0].toUpperCase() + m[1].slice(1), level: (m[2] || '').trim() });
  }
  return out.slice(0, 8);
}

function parseProjects(lines) {
  const out = []; let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!BULLET.test(line) && line.length < 80 && !/[.!?]$/.test(line) && (!cur || cur.description)) { cur = { id: uid(), name: line.replace(/\s*[|–—-]\s*(https?:\S+|[a-z0-9.-]+\.[a-z]{2,}\S*)$/i, ''), link: (line.match(/https?:\/\/\S+/) || [''])[0], tech: '', description: '' }; out.push(cur); continue; }
    if (cur) cur.description = (cur.description ? cur.description + ' ' : '') + line.replace(BULLET, '');
  }
  return out.slice(0, 8);
}

/** Parse plain text from an old CV or a pasted LinkedIn profile into a Master Profile draft. */
export function parseResumeText(input = '') {
  const text = input.replace(/\r/g, '').replace(/\f/g, '\n');
  const linkedinStyle = /Top Skills|linkedin\.com\/in\/|\(\d+ (?:year|month)s?/i.test(text) && /\n\s*Experience\s*\n/.test(text);
  const lines = text.split('\n').map((l) => clean(l)).filter((l) => !/^page \d+( of \d+)?$/i.test(l) && !/^\d+$/.test(l));
  const warnings = [];

  // split into sections
  const sections = { top: [] }; let cur = 'top'; const order = [];
  for (const line of lines) {
    if (!line) continue;
    const h = classifyHeading(line);
    if (h && h !== 'ignore') { cur = h; if (!sections[cur]) sections[cur] = []; order.push(cur); continue; }
    if (h === 'ignore') { cur = 'ignore'; sections.ignore = sections.ignore || []; continue; }
    (sections[cur] ||= []).push(line);
  }

  const contacts = extractContacts([...(sections.top || []), ...(sections.contact || [])].join('\n') || text.slice(0, 800));
  // name
  let name = '', headline = '', location = '';
  const topLines = sections.top || [];
  const candidate = (l) => l && /^[A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+){1,3}$/.test(l) && !/\d|@/.test(l) && !classifyHeading(l) && !ROLE_WORDS.test(l);
  if (linkedinStyle) {
    // LinkedIn PDFs: left-column blocks first, then "Name / Headline / Location" right before Summary/Experience
    const iMain = lines.findIndex((l, i) => /^(Summary|Experience)$/i.test(l) && i > 3);
    const cap = lines.slice(0, iMain > 0 ? iMain : 40);
    for (let i = cap.length - 1; i >= 2; i--) if (isLocationLine(cap[i]) || /\b(Kenya|Uganda|Tanzania|Nigeria|Ghana|United|Area|Remote)\b/i.test(cap[i])) { location = cap[i]; headline = cap[i - 1]; name = cap[i - 2]; break; }
    if (!candidate(name)) name = cap.find(candidate) || name;
  } else {
    name = topLines.find(candidate) || '';
    const ni = topLines.indexOf(name);
    const after = topLines.slice(ni + 1, ni + 4).filter((l) => !/@|\+?\d{3}|linkedin|github|http/i.test(l));
    headline = after.find((l) => ROLE_WORDS.test(l) && l.length < 70) || '';
    location = after.find(isLocationLine) || (topLines.find((l) => /\b(Nairobi|Mombasa|Kisumu|Nakuru|Eldoret|Kenya|Kampala|Dar es Salaam|Lagos|Accra|London|New York)\b/i.test(l) && l.length < 60 && !/@|\d{4}/.test(l)) || '').replace(/^.*?:\s*/, '');
  }
  if (name && name === name.toUpperCase()) name = name.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  if (!location) for (const l of [...topLines, ...(sections.contact || [])]) for (const part of l.split(/\s[|•·]\s|\s{2,}/)) if (isLocationLine(part.trim())) { location = part.trim(); break; }
  if (linkedinStyle) { const drop = new Set([name, headline, location].filter(Boolean)); for (const k of Object.keys(sections)) if (k !== 'experience' && k !== 'education') sections[k] = sections[k].filter((l) => !drop.has(l)); }
  if (!name) warnings.push('Could not find your name. Please add it.');

  let summaryLines = sections.summary || [];
  const summary = summaryLines.join(' ').replace(BULLET, '').slice(0, 700);
  const experience = parseExperience(sections.experience || [], linkedinStyle);
  const education = parseEducation(sections.education || []);
  const skills = parseSkills(sections.skills || []);
  const certifications = parseCerts(sections.certifications || []);
  const languages = parseLanguages(sections.languages || []);
  const projects = parseProjects(sections.projects || []);
  const awards = (sections.awards || []).map((l) => l.replace(BULLET, '')).filter((l) => l.length > 3).slice(0, 8);
  const referees = [];

  if (!experience.length && !(sections.experience || []).length) warnings.push('No work experience section found. You can add jobs manually.');
  if (!education.length) warnings.push('No education found. Please check that part.');
  if (!skills.length) warnings.push('No skills section found. Add skills or use the suggestions.');

  return {
    basics: { name, headline, location, email: contacts.email, phone: contacts.phone, website: contacts.website, linkedin: contacts.linkedin, github: contacts.github, photo: null },
    summary, experience, education, skills, projects, certifications, languages, awards, referees, warnings,
    stats: { experience: experience.length, education: education.length, skills: skills.length },
  };
}
