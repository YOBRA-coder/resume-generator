import { tailorLocal } from '../engine/tailor.js';
import { suggestMotivation } from '../engine/motivation.js';
import { wordCount } from '../engine/text.js';
import { checkAI, callAI } from './ai.js';

const seedNow = () => Math.floor(Math.random() * 1e6) + 1;

async function tryAI(task, payload, settings) {
  if (!settings.ai) return { value: null, note: '' };
  const st = await checkAI(true);
  if (!st.ai) return { value: null, note: st.needsCode === undefined ? '' : 'AI key not found on the server, used the offline writer.' };
  try { return { value: await callAI({ task, ...payload }, settings.accessCode), note: '' }; }
  catch (e) { return { value: null, note: `${e.message} Used the offline writer.` }; }
}

/** New 35–60 word summary. AI first (if enabled), otherwise the offline engine; always different from the current text. */
export async function rewriteSummaryFor(app, master, settings) {
  let text = '', note = '', via = 'offline';
  const variation = seedNow();
  const ai = await tryAI('summary', {
    profile: { ...master, experience: app.resume.experience.map((e) => ({ ...e, bullets: e.bullets.filter((b) => !b.generated) })), skills: app.resume.skills },
    job: { title: app.jobTitle, company: app.company, text: app.jobText },
    options: { tone: app.tone, locale: settings.locale, currentSummary: app.resume.summary, variation, allowedNumbers: [app.resume.experience.length] },
  }, settings);
  note = ai.note;
  if (ai.value?.summary && ai.value.summary.trim() !== (app.resume.summary || '').trim()) { text = ai.value.summary; via = 'ai'; }
  if (!text) {
    for (let i = 0; i < 6 && (!text || text.trim() === (app.resume.summary || '').trim()); i++) {
      text = tailorLocal(master, { company: app.company, jobTitle: app.jobTitle, jobText: app.jobText, tone: app.tone, locale: settings.locale, seed: variation + i * 101, pages: 1 }).resume.summary;
    }
  }
  return { text, via, note, words: wordCount(text) };
}

/** A draft "why this company" line. AI first (if enabled), otherwise built from the ad's own text and your skills. */
export async function suggestMotivationFor({ company, jobTitle, jobText, job, skills = [], previous = '', tone }, master, settings) {
  const variation = seedNow();
  const ai = await tryAI('motivation', {
    profile: { ...master, skills: skills.length ? skills : master.skills },
    job: { title: jobTitle, company, text: jobText },
    options: { tone, locale: settings.locale, variation, motivation: previous },
  }, settings);
  if (ai.value?.motivation) return { text: ai.value.motivation, via: 'ai', note: ai.note };
  return { text: suggestMotivation({ company, jobTitle, job, skills, seed: variation, locale: settings.locale, previous }), via: 'offline', note: ai.note };
}
