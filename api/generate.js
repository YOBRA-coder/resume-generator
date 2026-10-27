// POST /api/generate — AI engine (Vercel serverless function, Node runtime).
// The browser always has the offline engine as a fallback, so every failure here is safe.
import { SYSTEM_PROMPT, buildUserMessage, extractJson, sanitizeOutput } from './_lib/prompt.js';

const MAX_BODY = 120_000;
const hits = new Map(); // best-effort per-instance rate limit
function limited(ip) {
  const now = Date.now(), win = 60_000, max = Number(process.env.RATE_LIMIT_PER_MIN || 8);
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > max;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'ai_not_configured', message: 'No ANTHROPIC_API_KEY is set on the server.' });
  const code = process.env.APP_ACCESS_CODE;
  if (code && req.headers['x-access-code'] !== code) return res.status(401).json({ error: 'access_code_required', message: 'Enter the access code in Settings to use AI.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Try again in a minute.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad_request' });
  if (JSON.stringify(body).length > MAX_BODY) return res.status(413).json({ error: 'too_large' });
  const { profile, job, options } = body;
  if (!profile || !Array.isArray(profile.experience)) return res.status(400).json({ error: 'bad_profile' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 4096, temperature: 0.6, system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage({ profile, job, options }) }],
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('anthropic_error', r.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'upstream_error', status: r.status });
    }
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const parsed = sanitizeOutput(extractJson(text), { profile, options });
    if (!parsed) return res.status(502).json({ error: 'bad_model_output' });
    return res.status(200).json({ ok: true, result: parsed, model: data.model });
  } catch (e) {
    const timeout = e?.name === 'AbortError';
    return res.status(timeout ? 504 : 500).json({ error: timeout ? 'timeout' : 'server_error' });
  } finally { clearTimeout(timer); }
}
