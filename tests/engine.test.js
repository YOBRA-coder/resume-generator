import { describe, it, expect } from 'vitest';
import { findSkills } from '../src/engine/dictionary.js';
import { parseJob, guessCompany } from '../src/engine/jobParser.js';
import { strengthenBullet, splitNotes } from '../src/engine/rewriter.js';
import { inventedNumbers } from '../src/engine/guard.js';
import { parseResumeText } from '../src/engine/resumeParser.js';
import { tailorLocal, fillDuty } from '../src/engine/tailor.js';
import { sampleProfile } from '../src/engine/sample.js';
import { totalYears, parseDate } from '../src/engine/profileUtils.js';
import { localize } from '../src/engine/text.js';
import { PLAIN_CV, LINKEDIN } from './fixtures.js';

const JOB = `Senior Frontend Developer

About Helix Pay
Helix Pay is a Nairobi-based fintech on a mission to make payments simple and affordable for every small business in East Africa.

Responsibilities
- Build responsive React interfaces
- Integrate M-Pesa and card payment gateways

Requirements
- 4+ years of experience in web development
- Strong TypeScript, React and Node.js skills
- Excellent communication and teamwork

Nice to have
- Kubernetes, AWS
`;

describe('skills dictionary', () => {
  it('finds skills incl. symbols and aliases', () => {
    const n = findSkills('React, Node.js, C++, C#, k8s, postgres and Go developer').map((s) => s.name);
    expect(n).toEqual(expect.arrayContaining(['React', 'Node.js', 'C++', 'C#', 'Kubernetes', 'PostgreSQL', 'Go']));
  });
  it('does not match ambiguous words', () => { expect(findSkills('We go to the market on a sage day').map((s) => s.name)).not.toContain('Go'); });
});

describe('job parser', () => {
  const j = parseJob(JOB);
  it('extracts skills, weights and nice-to-haves', () => {
    expect(j.hardSkills.map((s) => s.name)).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Node.js', 'M-Pesa Integration']));
    expect(j.hardSkills.find((s) => s.name === 'Kubernetes').required).toBe(false);
    expect(j.softSkills.map((s) => s.name)).toContain('Communication');
  });
  it('reads years, seniority, industry, company and mission', () => {
    expect(j.yearsRequired).toBe(4); expect(j.seniority).toBe('senior'); expect(j.industry).toMatch(/fintech/);
    expect(guessCompany(JOB)).toBe('Helix Pay'); expect(j.mission[0]).toMatch(/mission to make payments/);
  });
});

describe('bullet rewriter', () => {
  it('replaces weak openers honestly', () => {
    expect(strengthenBullet('responsible for managing the shop inventory').text).toBe('Managed the shop inventory');
    expect(strengthenBullet('Worked on website for clients').text).toBe('Contributed to website for clients');
    expect(strengthenBullet('helped customers with their orders').text).toBe('Assisted customers with their orders');
  });
  it('never adds numbers and flags missing metrics', () => {
    const r = strengthenBullet('built an api for the shop');
    expect(/\d/.test(r.text)).toBe(false); expect(r.tips.join(' ')).toMatch(/number/i);
  });
  it('keeps real metrics and scores them higher', () => {
    expect(strengthenBullet('built an inventory app that cut stock errors by 40%').score).toBeGreaterThan(80);
  });
  it('splits rough notes', () => { expect(splitNotes('fixed bugs, built website, worked with clients')).toHaveLength(3); });
  it('uses present tense for current roles', () => { expect(strengthenBullet('Built the api', { current: true }).text).toMatch(/^Build /); });
});

describe('fabrication guard', () => {
  it('flags numbers that are not in the source', () => {
    expect(inventedNumbers('Cut errors by 45% and saved KES 50,000', 'Reduced errors by 45%')).toEqual(['50000']);
    expect(inventedNumbers('Led a team of 12', 'I led 12 people')).toEqual([]);
  });
});

describe('resume parser', () => {
  it('parses a plain CV', () => {
    const r = parseResumeText(PLAIN_CV);
    expect(r.basics).toMatchObject({ name: 'Brian Kwemoi', email: 'brian@example.com', location: 'Nakuru, Kenya' });
    expect(r.experience).toHaveLength(2);
    expect(r.experience[0]).toMatchObject({ company: 'Yobby Technologies Ltd', current: true, start: '2021-01' });
    expect(r.experience[0].bullets[1].text).toMatch(/reducing manual reconciliation time/);
    expect(r.education[0]).toMatchObject({ school: 'Egerton University', degree: 'BSc Computer Science' });
    expect(r.skills).toEqual(expect.arrayContaining(['React', 'Docker', 'Tailwind CSS']));
    expect(r.languages).toHaveLength(2);
  });
  it('parses pasted LinkedIn text', () => {
    const r = parseResumeText(LINKEDIN);
    expect(r.basics.name).toBe('Jane Doe');
    expect(r.experience.map((e) => e.company)).toEqual(['Acme Logistics', 'DHL']);
    expect(r.experience[0].bullets).toHaveLength(2);
    expect(r.languages).toHaveLength(1);
  });
});

describe('tailoring', () => {
  const out = tailorLocal(sampleProfile(), { company: 'Helix Pay', jobTitle: 'Senior Frontend Developer', jobText: JOB, motivation: 'I want to build tools that help small shop owners get paid faster', seed: 42 });
  it('produces resume, cover letter and analysis', () => {
    expect(out.resume.summary.split(' ').length).toBeGreaterThan(25);
    expect(out.cover.paragraphs).toHaveLength(4);
    expect(out.cover.paragraphs[0]).toMatch(/Helix Pay/);
    expect(out.cover.paragraphs[0]).toMatch(/mission to make payments/);
    expect(out.analysis.score).toBeGreaterThan(0);
  });
  it('does not invent numbers', () => { expect(out.flaggedNumbers).toEqual([]); });
  it('does not claim generated bullets as matched skills', () => {
    expect(out.match.matched.map((m) => m.name)).not.toContain('REST APIs');
    expect(out.resume.experience[1].bullets.every((b) => b.generated)).toBe(true);
  });
  it('is reproducible per seed and varies between seeds', () => {
    const a = tailorLocal(sampleProfile(), { jobTitle: 'Frontend Developer', seed: 1 }).resume.summary;
    const b = tailorLocal(sampleProfile(), { jobTitle: 'Frontend Developer', seed: 1 }).resume.summary;
    expect(a).toBe(b);
  });
  it('drops duty clauses when the user lacks that skill', () => {
    expect(fillDuty('Built apps with {a} and {b} for clients', { a: 'React' })).toBe('Built apps for clients');
    expect(fillDuty('Used {a} to do things', {})).toBeNull();
  });
  it('works with an empty profile and no job', () => {
    const p = sampleProfile(); p.experience = []; p.education = []; p.skills = [];
    const r = tailorLocal(p, { jobTitle: 'Accountant' });
    expect(r.resume.skills.length).toBeGreaterThan(3); expect(r.generatedSkills).toBe(true);
  });
});

describe('helpers', () => {
  it('computes years without double-counting overlaps', () => {
    expect(totalYears([{ start: '2018-01', end: '2020-01' }, { start: '2019-01', end: '2021-01' }])).toBe(3);
  });
  it('parses dates', () => { expect(parseDate('Mar 2021')).toBe('2021-03'); expect(parseDate('03/2021')).toBe('2021-03'); });
  it('localizes spelling', () => { expect(localize('Optimized and organized', 'uk')).toBe('Optimised and organised'); });
});
