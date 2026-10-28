// POST /api/generate — AI engine (Vercel serverless function, Node runtime).
// tasks: "full" (resume + cover letter, default), "summary", "motivation".
// The browser always has the offline engine as a fallback, so every failure here is safe and explained.
import { SYSTEM_PROMPT, SUMMARY_PROMPT, MOTIVATION_PROMPT, buildUserMessage, extractJson, sanitizeOutput, sanitizeSummary, sanitizeMotivation } from './_lib/prompt.js';
import { callModel, AIError } from './_lib/anthropic.js';

const MAX_BODY = 120_000;
const hits = new Map(); // best-effort per-instance rate limit
function limited(ip) {
  const now = Date.now(), win = 60_000, max = Number(process.env.RATE_LIMIT_PER_MIN || 20);
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > max;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured', message: 'No ANTHROPIC_API_KEY is set on the server. Add it in your host’s environment variables and redeploy (or restart `npm run dev`).' });
  const code = process.env.APP_ACCESS_CODE;
  if (code && req.headers['x-access-code'] !== code) return res.status(401).json({ error: 'access_code_required', message: 'Enter the access code in Settings to use AI.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Try again in a minute.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad_request', message: 'Invalid request.' });
  if (JSON.stringify(body).length > MAX_BODY) return res.status(413).json({ error: 'too_large', message: 'The request was too large.' });
  const { profile, job, options } = body; const task = body.task || 'full';
  if (!profile || !Array.isArray(profile.experience)) return res.status(400).json({ error: 'bad_profile', message: 'Missing profile.' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const system = task === 'summary' ? SUMMARY_PROMPT : task === 'motivation' ? MOTIVATION_PROMPT : SYSTEM_PROMPT;
    const { text, model, stop } = await callModel({ system, user: buildUserMessage({ profile, job, options }), maxTokens: task === 'full' ? 6000 : 700, signal: ctrl.signal });
    const json = extractJson(text);
    const result = task === 'summary' ? sanitizeSummary(json, { profile, options }) : task === 'motivation' ? sanitizeMotivation(json, { profile, job, options }) : sanitizeOutput(json, { profile, options });
    if (!result) return res.status(502).json({ error: 'bad_model_output', message: stop === 'max_tokens' ? 'The AI answer was cut off. Try again.' : 'The AI answer did not pass the no-invented-facts check. Try again.' });
    return res.status(200).json({ ok: true, task, result, model });
  } catch (e) {
    if (e instanceof AIError) return res.status(e.status && e.status >= 400 && e.status < 600 ? e.status : 502).json({ error: e.code, message: e.message });
    console.error('generate_error', e);
    return res.status(500).json({ error: 'server_error', message: 'Unexpected server error.' });
  } finally { clearTimeout(timer); }
}
