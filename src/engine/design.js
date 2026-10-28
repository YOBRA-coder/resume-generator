/**
 * Decide a design from the job: template, accent, paper and fonts, with plain-language reasons.
 * Pure and deterministic given (role, industry, years, seed); `seed` > 0 shuffles between equally good options.
 */
import { rng } from './text.js';

const BY_ROLE = {
  creative: { roles: ['uiux', 'graphic'], templates: ['creative', 'bold', 'modern'], accents: ['#6d28d9', '#c2410c', '#be123c'], why: 'a creative role, so the design shows some personality' },
  tech: { roles: ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'datasci', 'devops', 'qa', 'itsupport', 'pm'], templates: ['modern', 'timeline', 'compact', 'minimal'], accents: ['#0b7a68', '#2563eb', '#374151'], why: 'a technical role, so the layout is clean and scannable' },
  formal: { roles: ['accounting', 'hr', 'admin', 'legal', 'projectmgr', 'logistics'], templates: ['corporate', 'classic', 'executive'], accents: ['#1f2a44', '#374151', '#2563eb'], why: 'a formal, process-driven role, so the design is conservative' },
  people: { roles: ['teacher', 'nurse', 'ngo', 'cs', 'hospitality', 'sales', 'marketing'], templates: ['modern', 'timeline', 'bold', 'classic'], accents: ['#0b7a68', '#2563eb', '#a16207', '#be123c'], why: 'a people-facing role, so the design feels warm and clear' },
  trades: { roles: ['civil', 'engineer'], templates: ['compact', 'classic', 'corporate'], accents: ['#1f2a44', '#374151', '#2563eb'], why: 'a technical trade, so the design is dense and practical' },
};
const INDUSTRY_ACCENT = [[/financ|bank|insur|legal|law|audit/i, '#1f2a44'], [/health|medic|pharma|clinic/i, '#0b7a68'], [/educat|school|universit/i, '#2563eb'], [/fashion|media|creative|design|advert/i, '#be123c'], [/energy|construction|mining|manufact/i, '#a16207']];

export function decideDesign({ roleId, industry = '', years = 0, seniority = '', jobTitle = '', locale = 'uk', seed = 0, wantsCompact = false }) {
  const r = rng((seed || 1) * 31 + 7);
  const group = Object.values(BY_ROLE).find((g) => g.roles.includes(roleId));
  const reasons = [];
  let templates = group ? [...group.templates] : ['modern', 'classic', 'corporate'];
  let accents = group ? [...group.accents] : ['#0b7a68', '#1f2a44', '#374151'];
  reasons.push(group ? `${group.why}` : 'a general role, so a balanced layout is used');
  if (years >= 10 || /director|head|chief|vp|executive|principal/i.test(`${seniority} ${jobTitle}`)) { templates = ['executive', 'corporate', ...templates.filter((t) => !['creative', 'bold'].includes(t))]; reasons.push('senior experience, so a restrained, serif layout is preferred'); }
  else if (years < 2) { templates = templates.filter((t) => t !== 'compact'); reasons.push('early career, so the layout gives each section room'); }
  const ia = INDUSTRY_ACCENT.find(([re]) => re.test(industry));
  if (ia) { accents = [ia[1], ...accents.filter((a) => a !== ia[1])]; reasons.push(`the ${industry} industry tends to suit this colour`); }
  const template = seed ? r.pick(templates.slice(0, 3)) : templates[0];
  const accent = seed ? r.pick(accents) : accents[0];
  return { template: wantsCompact ? 'compact' : template, accent, font: 'auto', paper: locale === 'us' ? 'letter' : 'a4', reasons, shortReason: reasons[0] };
}
