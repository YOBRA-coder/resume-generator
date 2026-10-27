import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/generate.js';
import health from '../api/health.js';
import { sanitizeOutput, extractJson } from '../api/_lib/prompt.js';
import { sampleProfile } from '../src/engine/sample.js';

const mkRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
const profile = sampleProfile();
const good = { summary: 'Frontend developer with hands-on React experience building client websites.', skills: ['React', 'Rust', 'CSS'], experience: [{ id: profile.experience[0].id, bullets: ['Built websites for small business clients', 'Cut load time by 90%'], generated: false }, { id: 'nope', bullets: ['x'] }], cover_letter: { paragraphs: ['One.', 'Two.', 'Three.', 'Four.'] } };

describe('api/_lib/prompt', () => {
  it('extracts JSON from fenced output', () => { expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }); expect(extractJson('Sure! {"a":2} done')).toEqual({ a: 2 }); });
  it('drops invented numbers, unknown skills and unknown roles', () => {
    const r = sanitizeOutput(good, { profile, options: {} });
    expect(r.skills).toEqual(['React', 'CSS']);
    expect(r.experience).toHaveLength(1);
    expect(r.experience[0].bullets).toEqual(['Built websites for small business clients']);
    expect(r.flagged.some((f) => f.startsWith('bullet:'))).toBe(true);
    expect(r.cover_letter.paragraphs).toHaveLength(4);
  });
  it('rejects a cover letter containing made-up figures', () => {
    const r = sanitizeOutput({ ...good, cover_letter: { paragraphs: ['a', 'b', 'I grew revenue by 300%', 'd'] } }, { profile, options: {} });
    expect(r.cover_letter).toBeNull();
  });
});

describe('api handlers', () => {
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; delete process.env.APP_ACCESS_CODE; vi.restoreAllMocks(); });
  it('health reports AI availability without leaking the key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-secret'; const r = mkRes(); health({}, r);
    expect(r.body).toEqual({ ok: true, ai: true, needsCode: false }); expect(JSON.stringify(r.body)).not.toMatch(/secret/);
  });
  it('503 when no key is configured', async () => { const r = mkRes(); await handler({ method: 'POST', headers: {}, body: { profile } }, r); expect(r.code).toBe(503); });
  it('405 for GET and 401 without the access code', async () => {
    process.env.ANTHROPIC_API_KEY = 'k'; process.env.APP_ACCESS_CODE = 'abc';
    let r = mkRes(); await handler({ method: 'GET', headers: {} }, r); expect(r.code).toBe(405);
    r = mkRes(); await handler({ method: 'POST', headers: {}, body: { profile } }, r); expect(r.code).toBe(401);
  });
  it('calls the model and returns sanitized output', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ model: 'm', content: [{ type: 'text', text: JSON.stringify(good) }] }) });
    const r = mkRes(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body: { profile, job: { title: 'Dev', text: 'React' }, options: {} } }, r);
    expect(r.code).toBe(200); expect(r.body.result.experience[0].bullets).toHaveLength(1);
    const sent = JSON.parse(f.mock.calls[0][1].body); expect(sent.system).toMatch(/Never invent|Use ONLY facts/); expect(f.mock.calls[0][1].headers['x-api-key']).toBe('k');
  });
  it('502 on upstream failure', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const r = mkRes(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' }, body: { profile } }, r); expect(r.code).toBe(502);
  });
});
