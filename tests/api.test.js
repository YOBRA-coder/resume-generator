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
    process.env.ANTHROPIC_API_KEY = 'sk-secret'; const r = mkRes(); health({ url: '/api/health', headers: {} }, r);
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
  it('explains upstream failures (bad key) instead of a generic message', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { type: 'authentication_error', message: 'invalid x-api-key' } }) });
    const r = mkRes(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' }, body: { profile } }, r);
    expect(r.code).toBe(401); expect(r.body.message).toMatch(/API key was rejected/);
  });
  it('falls back to another model when one is not available', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    const f = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: { type: 'not_found_error', message: 'model: nope' } }) })
      .mockResolvedValue({ ok: true, json: async () => ({ model: 'm2', content: [{ type: 'text', text: JSON.stringify(good) }] }) });
    const r = mkRes(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '3.3.3.3' }, body: { profile } }, r);
    expect(r.code).toBe(200); expect(f.mock.calls.length).toBe(2);
    expect(JSON.parse(f.mock.calls[0][1].body).model).not.toBe(JSON.parse(f.mock.calls[1][1].body).model);
  });
  it('summary task returns a validated 28-75 word summary', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    const sum = 'Frontend developer who builds fast, accessible interfaces in React and JavaScript for small business clients. Known for turning designs into polished pages and fixing slow ones. Holds a BSc in Computer Science and enjoys close work with designers.';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ model: 'm', content: [{ type: 'text', text: JSON.stringify({ summary: sum }) }] }) });
    const r = mkRes(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '4.4.4.4' }, body: { task: 'summary', profile, options: {} } }, r);
    expect(r.code).toBe(200); expect(r.body.result.summary).toBe(sum);
  });
  it('probe endpoint reports the exact reason', async () => {
    process.env.ANTHROPIC_API_KEY = 'k';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 402, json: async () => ({ error: { type: 'billing', message: 'Your credit balance is too low' } }) });
    const r = mkRes(); await health({ url: '/api/health?probe=1', headers: {} }, r);
    expect(r.body.ok).toBe(false); expect(r.body.message).toMatch(/no credit/);
  });
});
