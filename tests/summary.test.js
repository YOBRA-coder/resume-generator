import { describe, it, expect } from 'vitest';
import { buildSummary, suggestMotivation } from '../src/engine/index.js';
import { ROLES } from '../src/engine/roles.js';
import { wordCount } from '../src/engine/text.js';

const base = { title: 'Frontend Developer', years: 4, skills: ['React', 'TypeScript', 'CSS'], moreSkills: ['Git', 'Jest'], role: ROLES[0], education: 'BSc in Computer Science', school: 'JKUAT', softSkills: ['Communication'], jobTitle: 'Frontend Developer', hasExperience: true };
describe('summary', () => {
  it('is 35-60 words for every tone and many seeds, and varies', () => {
    const seen = new Set();
    for (const tone of ['confident', 'professional', 'friendly']) for (let seed = 1; seed <= 40; seed++) {
      const t = buildSummary({ ...base, tone, seed }); const n = wordCount(t);
      expect(n, t).toBeGreaterThanOrEqual(35); expect(n, t).toBeLessThanOrEqual(60); seen.add(t);
    }
    expect(seen.size).toBeGreaterThan(30);
  });
  it('student with no experience still gets 35+ words', () => {
    for (let seed = 1; seed <= 20; seed++) { const t = buildSummary({ ...base, years: 0, hasExperience: false, isStudent: true, moreSkills: [], tone: 'professional', seed }); expect(wordCount(t), t).toBeGreaterThanOrEqual(35); }
  });
});
describe('motivation', () => {
  it('never invents a mission and varies', () => {
    const a = suggestMotivation({ company: 'Acme', jobTitle: 'Developer', job: {}, skills: ['React'], seed: 1 });
    const b = suggestMotivation({ company: 'Acme', jobTitle: 'Developer', job: { mission: ['Our mission is to make payments simple for small shops.'] }, skills: ['React'], seed: 2 });
    expect(a).toContain('Acme'); expect(a).not.toMatch(/mission/i); expect(b).toBeTruthy();
  });
});
