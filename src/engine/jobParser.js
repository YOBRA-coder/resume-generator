import { findSkills } from './dictionary.js';
import { STOP, words, sentences, uniq, clean } from './text.js';
import { detectRole } from './roles.js';

const SECTION_RULES = [
  ['nice', /^(nice[\s-]to[\s-]have|preferred|bonus|desirable|good to have|advantageous|an advantage|it'?s a plus|extra credit|pluses)\b/i],
  ['req', /^(key )?(requirements?|qualifications?|what (we'?re|we are) looking for|who you are|you have|you will have|you bring|what you('ll| will)? (need|bring|have)|must[\s-]haves?|minimum|essential|skills( and| &)? (experience|qualifications)|required|about you|your profile|candidate profile|person specification|education and experience)/i],
  ['resp', /^(key )?(responsibilit(y|ies)|duties|what you('ll| will) do|the role|your role|role overview|job (summary|description|purpose)|what you'll be doing|day[\s-]to[\s-]day|main tasks|accountabilities|scope)/i],
  ['about', /^(about (us|the company|the team|the organi[sz]ation|[A-Z][\w&.\- ]{1,30})|who we are|our (mission|story|vision|values|purpose)|company (overview|profile|description)|why join|why work)/i],
  ['skip', /^(benefits|we offer|what we offer|perks|compensation|salary|how to apply|application (process|instructions)|equal opportunity|apply (now|today)|closing date|deadline|about the job)/i],
];
const MISSION_RE = /\b(mission|vision|we believe|our purpose|committed to|passionate about|dedicated to|our goal|we help|we are on a|we['’]re on a|empower|transform|making|improv(e|ing) the lives|impact|our values|sustainab|innovat|community|customers? first|world-class|leading)\b/i;
const INDUSTRIES = [
  ['fintech and financial services', /\b(fintech|bank|banking|microfinance|insurance|payments?|m-pesa|mobile money|lending|sacco|investment)\b/i],
  ['healthcare', /\b(hospital|clinic|health(care)?|medical|patients?|pharma)/i],
  ['education', /\b(school|university|college|education|learners?|students?|curriculum|training institute)\b/i],
  ['technology', /\b(software|saas|platform|cloud|startup|tech(nology)?|digital|app|ai)\b/i],
  ['non-profit and development', /\b(ngo|non-?profit|donor|humanitarian|development|foundation|community|charity)\b/i],
  ['logistics and supply chain', /\b(logistics|supply chain|freight|shipping|warehouse|distribution)\b/i],
  ['retail and e-commerce', /\b(retail|e-?commerce|store|merchandis|fmcg|supermarket)\b/i],
  ['hospitality and tourism', /\b(hotel|hospitality|tourism|safari|restaurant|travel|lodge)\b/i],
  ['construction and engineering', /\b(construction|engineering|infrastructure|contractor|real estate|property)\b/i],
  ['media and creative', /\b(media|agency|creative|broadcast|advertis|branding|marketing)\b/i],
  ['agriculture and energy', /\b(agri|farm|energy|solar|renewable|fisher|climate)\b/i],
];
const GENERIC = new Set(`build design review integrate mentor create write test deploy lead join looking seeking team member members colleagues clients customers stakeholders business teams organisation organization department ensure provide providing manage managing develop developing perform performing maintain maintaining deliver delivering responsible report reports reporting tasks task activities process processes projects project services service solutions solution products product systems system data information quality standards standard policies procedures practices practice level levels range wide variety areas area key skills etc candidate successful role position job vacancy hiring recruit recruiting submit send cv resume letter email application applications days hours week month monthly daily weekly approach approaches goal goals objectives within across`.split(/\s+/));

export function guessCompany(text = '') {
  const pats = [
    /\b(?:company|employer|organi[sz]ation)\s*[:\-]\s*([A-Z][\w&.\-' ]{1,40})/,
    /\b[Aa]bout\s+((?:[A-Z][\w&\-]*)(?: [A-Z][\w&\-]*){0,3})(?=\s*[:\n])/,
    /\b[Jj]oin\s+(?:the\s+)?((?:[A-Z][\w&\-]*)(?: [A-Z][\w&\-]*){0,3})/,
    /\bat\s+((?:[A-Z][\w&\-]*)(?: [A-Z][\w&\-]*){0,3})(?=[,.\n!])/,
    /^((?:[A-Z][\w&.\-]*)(?: [A-Z][\w&.\-]*){0,3}) (?:is|are) (?:a|an|the|looking|seeking|hiring)/m,
  ];
  const bad = /^(Us|The|This|Our|We|You|Your|Role|Team|Company|Position|Job|It|Apply|Kenya|Nairobi|Remote)$/;
  for (const re of pats) { const m = text.match(re); const c = m && m[1].trim().replace(/[.,:;]+$/, ''); if (c && !bad.test(c) && !findSkills(c).length) return c; }
  return '';
}

export function parseJob(text = '', { title = '' } = {}) {
  const raw = text.replace(/\r/g, '');
  const lines = raw.split('\n').map((l) => l.trim());
  const sections = { req: [], resp: [], nice: [], about: [], other: [] };
  let cur = 'other';
  for (const line of lines) {
    if (!line) continue;
    const headLike = line.length < 70 && (/[:：]$/.test(line) || (!/[.!?]$/.test(line) && line.split(/\s+/).length <= 7));
    const head = line.replace(/[:：\s]+$/, '').replace(/^[#*_\-\s]+|[*_]+$/g, '');
    if (headLike) {
      const rule = SECTION_RULES.find(([, re]) => re.test(head));
      if (rule) { cur = rule[0] === 'skip' ? 'skip' : rule[0]; continue; }
    }
    // inline "Requirements: …" lines
    const inline = line.match(/^(requirements?|qualifications?|responsibilit(?:y|ies)|nice to have|preferred)\s*[:\-]\s*(.+)$/i);
    if (inline) { const k = /nice|preferred/i.test(inline[1]) ? 'nice' : /resp/i.test(inline[1]) ? 'resp' : 'req'; sections[k].push(inline[2]); continue; }
    if (cur !== 'skip') sections[cur].push(line.replace(/^(?:[•·●▪■◦\-–—*>]|\d{1,2}[.)])\s+/, ''));
  }
  const reqText = sections.req.join('\n'), respText = sections.resp.join('\n'), niceText = sections.nice.join('\n');

  // Skills & weights
  const all = findSkills(raw);
  const inReq = new Set(findSkills(reqText).map((s) => s.name));
  const inResp = new Set(findSkills(respText).map((s) => s.name));
  const inNice = new Set(findSkills(niceText).map((s) => s.name));
  const titleSkills = new Set(findSkills(`${title}\n${lines[0] || ''}`).map((s) => s.name));
  const scored = all.map((s) => {
    const nice = inNice.has(s.name) && !inReq.has(s.name) && !inResp.has(s.name);
    const weight = Math.min(10, s.count + (inReq.has(s.name) ? 3 : 0) + (inResp.has(s.name) ? 1 : 0) + (titleSkills.has(s.name) ? 3 : 0) + (s.firstIndex < raw.length * 0.35 ? 1 : 0) - (nice ? 1 : 0));
    return { ...s, weight: Math.max(1, weight), required: !nice };
  }).sort((a, b) => b.weight - a.weight);
  const hardSkills = scored.filter((s) => s.kind === 'hard');
  const softSkills = scored.filter((s) => s.kind === 'soft');

  // Extra keywords (non-dictionary), by frequency of unigrams/bigrams
  const known = new Set(all.flatMap((s) => s.name.toLowerCase().split(/\s+/)));
  const toks = words(raw).filter((w) => w.length > 2 && !STOP.has(w) && !GENERIC.has(w) && !/^\d+$/.test(w));
  const freq = new Map();
  for (const w of toks) if (!known.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  const seq = words(raw);
  for (let i = 0; i < seq.length - 1; i++) {
    const [a, b] = [seq[i], seq[i + 1]];
    if (STOP.has(a) || STOP.has(b) || GENERIC.has(a) || GENERIC.has(b) || a.length < 3 || b.length < 3 || known.has(a) || known.has(b)) continue;
    const k = `${a} ${b}`; freq.set(k, (freq.get(k) || 0) + 1);
  }
  const keywords = [...freq.entries()].filter(([, c]) => c >= (raw.length < 1800 ? 2 : 3)).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([term, count]) => ({ term, count }));

  // Meta
  const yrs = [...raw.matchAll(/(\d{1,2})\s*(?:\+|-\s*\d{1,2}|to\s*\d{1,2})?\s*(?:\+\s*)?(?:years?|yrs)\b(?:['’]?\s*(?:of\s+)?(?:relevant\s+|proven\s+|professional\s+|hands[\s-]on\s+|working\s+)*experience)?/gi)].map((m) => +m[1]).filter((n) => n > 0 && n < 30);
  const yearsRequired = yrs.length ? Math.min(...yrs) : null;
  const seniority = /\b(chief|head of|director|vp|vice president)\b/i.test(raw.slice(0, 300)) ? 'executive'
    : /\b(lead|principal|staff|senior|sr\.?|manager)\b/i.test(title || lines[0] || '') ? 'senior'
    : /\b(junior|jr\.?|entry[\s-]level|graduate|intern(ship)?|trainee|attach[eé]ment|assistant)\b/i.test(`${title} ${lines[0] || ''} ${raw.slice(0, 400)}`) ? 'junior'
    : yearsRequired >= 5 ? 'senior' : yearsRequired >= 2 ? 'mid' : yearsRequired === null ? null : 'junior';
  const education = (raw.match(/\b(ph\.?d|doctorate|master'?s|msc|mba|bachelor'?s?|b\.?sc|bsc|b\.?com|degree|diploma|certificate|kcse|a-levels?|cpa(?:\s?\(k\))?|acca|cfa)\b[^.\n]{0,60}/i) || [])[0] || null;
  const workMode = /\bhybrid\b/i.test(raw) ? 'hybrid' : /\bremote\b/i.test(raw) ? 'remote' : /\b(on[\s-]?site|in[\s-]?office)\b/i.test(raw) ? 'on-site' : null;
  const industry = (INDUSTRIES.find(([, re]) => re.test(raw)) || [])[0] || null;

  // Mission / values sentences — only quoted from the ad
  const aboutPool = sections.about.length ? sections.about.join(' ') : raw.slice(0, Math.max(600, raw.length * 0.4));
  const mission = uniq(sentences(clean(aboutPool)).filter((s) => MISSION_RE.test(s) && s.length > 30 && s.length < 260)).slice(0, 3);

  const resp = (sections.resp.length ? sections.resp : []).filter((l) => l.length > 12).slice(0, 12);
  const req = sections.req.filter((l) => l.length > 8).slice(0, 14);
  const titleGuess = (lines.find((l) => l && l.length < 70 && /\b(developer|engineer|manager|officer|analyst|designer|assistant|executive|specialist|coordinator|accountant|teacher|nurse|technician|consultant|administrator|director|lead|intern|associate|representative|supervisor|clerk|driver|chef|writer|marketer|scientist|architect)\b/i.test(l)) || '').replace(/^[#*\s]+|[*\s]+$/g, '');
  const role = detectRole(title || titleGuess, raw);

  return {
    titleGuess, companyGuess: guessCompany(raw), roleId: role.id, roleLabel: role.label,
    seniority, yearsRequired, education, workMode, industry,
    hardSkills, softSkills, keywords,
    responsibilities: resp, requirements: req, mission,
    wordCount: raw.trim() ? raw.trim().split(/\s+/).length : 0,
  };
}
