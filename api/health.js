// GET /api/health          → is AI configured? (never exposes the key)
// GET /api/health?probe=1  → makes a tiny real request so Settings can show the exact reason AI fails.
import { callModel, AIError } from './_lib/anthropic.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const ai = !!process.env.ANTHROPIC_API_KEY, needsCode = !!process.env.APP_ACCESS_CODE;
  const probe = /[?&]probe=1/.test(req.url || '');
  if (!probe) return res.status(200).json({ ok: true, ai, needsCode });
  if (!ai) return res.status(200).json({ ok: false, ai, needsCode, message: 'No ANTHROPIC_API_KEY is set on the server.' });
  if (needsCode && req.headers['x-access-code'] !== process.env.APP_ACCESS_CODE) return res.status(200).json({ ok: false, ai, needsCode, message: 'Enter the access code first.' });
  try {
    const r = await callModel({ system: 'Reply with the single word: ok', user: 'ping', maxTokens: 8 });
    return res.status(200).json({ ok: true, ai, needsCode, model: r.model, message: `Connected. Using ${r.model}.` });
  } catch (e) {
    return res.status(200).json({ ok: false, ai, needsCode, message: e instanceof AIError ? e.message : 'Could not reach the AI service.' });
  }
}
