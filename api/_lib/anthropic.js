// Thin Anthropic Messages client with model fallback, retry on overload and *readable* errors.
const DEFAULT_CHAIN = ['claude-sonnet-5-5', 'claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-3-5-haiku-latest'];
let workingModel = null;

export class AIError extends Error {
  constructor(code, message, status) { super(message); this.code = code; this.status = status; }
}
const chain = () => [...new Set([workingModel, process.env.ANTHROPIC_MODEL, ...DEFAULT_CHAIN].filter(Boolean))];

function explain(status, type, msg = '') {
  const m = String(msg).slice(0, 220);
  if (status === 401) return 'The API key was rejected (invalid x-api-key). Check ANTHROPIC_API_KEY, then redeploy or restart.';
  if (status === 403) return `The API key is not allowed to do this: ${m}`;
  if (status === 402 || /credit balance|billing/i.test(m)) return 'The Anthropic account has no credit left. Add credit in the Anthropic console.';
  if (status === 404) return `Model not available for this key: ${m}`;
  if (status === 429) return 'Anthropic rate limit reached. Try again in a minute.';
  if (status === 529 || status === 503) return 'Anthropic is overloaded right now. Try again shortly.';
  if (status === 413) return 'The request was too large.';
  return `Anthropic error ${status}${type ? ` (${type})` : ''}: ${m}`;
}

/** Returns { text, model, stop }. Throws AIError with a message safe to show to the user (never contains the key). */
export async function callModel({ system, user, maxTokens = 3000, signal }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError('ai_not_configured', 'No ANTHROPIC_API_KEY is set on the server.', 503);
  let last = null;
  for (const model of chain()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let r;
      try {
        r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal,
          headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
        });
      } catch (e) {
        if (e?.name === 'AbortError') throw new AIError('timeout', 'The AI took too long to answer.', 504);
        throw new AIError('network', `Could not reach Anthropic: ${e?.message || 'network error'}`, 502);
      }
      if (r.ok) {
        const data = await r.json();
        workingModel = model;
        return { text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''), model: data.model || model, stop: data.stop_reason };
      }
      let body = {}; try { body = await r.json(); } catch { /* ignore */ }
      const type = body?.error?.type, msg = body?.error?.message || '';
      last = new AIError('upstream_error', explain(r.status, type, msg), r.status);
      console.error('anthropic_error', model, r.status, type, String(msg).slice(0, 200));
      if (r.status === 429 || r.status === 529 || r.status === 503) { if (attempt === 0) { await new Promise((res) => setTimeout(res, 1200)); continue; } break; }
      // wrong/unavailable model → try the next one; anything else (auth, billing, bad request) will not improve
      if (r.status === 404 || (r.status === 400 && /model/i.test(msg))) break;
      throw last;
    }
  }
  throw last || new AIError('upstream_error', 'The AI service did not respond.', 502);
}
