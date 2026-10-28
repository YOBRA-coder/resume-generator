import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Paged from '../components/doc/Paged.jsx';
import { buildResumeUnits, buildCoverUnits } from '../components/doc/ResumeDoc.jsx';

/** Lays a document out off-screen. Returns { pages, fill } where fill is total content height in page units. */
export async function measure(app, design, kind = 'resume') {
  if (typeof document === 'undefined') return { pages: 1, fill: 1 };
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-99999px;top:0;'; document.body.appendChild(host);
  const root = createRoot(host); let out = { pages: 1, fill: 1 };
  try {
    flushSync(() => root.render(createElement(Paged, { mode: 'print', kind, design, units: kind === 'resume' ? buildResumeUnits(app.resume, design) : buildCoverUnits(app, design), onLayout: (l) => { out = l; } })));
  } finally { root.unmount(); host.remove(); }
  return out;
}
export const countPages = async (app, design, kind) => (await measure(app, design, kind)).pages;

const STEPS = [[1, 15], [0.96, 14], [0.92, 13], [0.88, 12], [0.85, 11], [0.82, 10], [0.8, 9]];

/** Squeeze to `target` pages with gentle scale/margin steps. Returns the design that fits, or null. */
export async function fitTo(app, design, target) {
  for (const [scale, margin] of STEPS) if ((await countPages(app, { ...design, scale, margin }, 'resume')) <= target) return { ...design, scale, margin };
  return null;
}

/**
 * Pick a sensible page count: a spill of a few lines onto page 2 is squeezed back to one page; a genuinely
 * fuller resume keeps two pages (never a nearly-empty second page).
 */
export async function settleLayout(app) {
  const m = await measure(app, app.design, 'resume');
  if (m.pages === 1) return { design: app.design, pages: 1 };
  if (m.fill <= 1.18) { const d = await fitTo(app, app.design, 1); if (d) return { design: d, pages: 1 }; }
  if (m.pages === 2 && m.fill < 1.3) { /* thin second page: still try the tightest single-page fit */ const d = await fitTo(app, app.design, 1); if (d) return { design: d, pages: 1 }; }
  if (m.pages > 2) { const d = await fitTo(app, app.design, 2); if (d) return { design: d, pages: 2 }; }
  return { design: app.design, pages: m.pages };
}
