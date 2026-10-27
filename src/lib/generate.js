import { tailorLocal } from '../engine/tailor.js';
import { uid } from '../engine/profileUtils.js';
import { checkAI, callAI, mergeAI } from './ai.js';

export const DEFAULT_DESIGN = { template: 'modern', accent: '#0b7a68', font: 'auto', scale: 1, margin: 15, paper: 'a4', showPhoto: false, photoShape: 'circle', pages: 'auto' };

/** Build a full application (resume + cover letter) from the master profile. AI is optional and always falls back. */
export async function generateApplication(profile, opts, settings, onStatus = () => {}) {
  const base = { ...opts, locale: settings.locale, tone: opts.tone || settings.tone, pages: opts.pages || 1 };
  onStatus('Analysing the job and your background');
  let result = tailorLocal(profile, base);
  let aiNote = '';
  if (settings.ai) {
    const status = await checkAI();
    if (status.ai) {
      try {
        onStatus('Polishing with AI');
        const years = result.resume.experience.length;
        const ai = await callAI({
          profile: { ...profile, skills: result.resume.skills, experience: result.resume.experience },
          job: { title: opts.jobTitle, company: opts.company, text: opts.jobText },
          options: { tone: base.tone, locale: base.locale, motivation: opts.motivation, recipient: opts.recipient, maxBullets: 5, allowedNumbers: [years] },
        }, settings.accessCode);
        result = mergeAI(result, ai);
      } catch (e) { aiNote = `${e.message} Used the offline engine instead.`; }
    }
  }
  const id = uid();
  const now = Date.now();
  const app = {
    id, createdAt: now, updatedAt: now, status: 'draft',
    company: opts.company || '', jobTitle: opts.jobTitle || result.role.label, jobText: opts.jobText || '', recipient: opts.recipient || '', motivation: opts.motivation || '',
    tone: base.tone, seed: result.seed, roleId: result.role.id, engine: result.engine, generatedSkills: result.generatedSkills,
    job: result.job, resume: result.resume,
    cover: { ...result.cover, date: new Date().toISOString().slice(0, 10) },
    design: { ...DEFAULT_DESIGN, ...(settings.design || {}), showPhoto: !!profile.basics.photo && settings.design?.showPhoto },
    score: result.analysis.score, match: result.match.score,
  };
  return { app, aiNote };
}
