// GET /api/health — lets the app know whether the AI engine is available (never exposes the key).
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, ai: !!process.env.ANTHROPIC_API_KEY, needsCode: !!process.env.APP_ACCESS_CODE });
}
