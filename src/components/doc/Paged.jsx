import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PAPERS, MM, fontFor } from './templates.js';

/**
 * Paged document: units are measured off-screen, then packed into real pages, so the preview matches
 * the printed/PDF output exactly (no text cut across page edges, headings never orphaned).
 */
export function pack(heights, glue, pageH) {
  // group units that must stay together (glue = keep with next)
  const groups = []; let g = [];
  heights.forEach((h, i) => { g.push(i); if (!glue[i]) { groups.push(g); g = []; } });
  if (g.length) groups.push(g);
  const pages = [[]]; let used = 0;
  const sum = (idx) => idx.reduce((a, i) => a + heights[i], 0);
  for (const grp of groups) {
    const gh = sum(grp);
    if (used + gh <= pageH + 0.5) { pages[pages.length - 1].push(...grp); used += gh; continue; }
    if (gh <= pageH && pages[pages.length - 1].length) { pages.push([...grp]); used = gh; continue; }
    for (const i of grp) { // group taller than a page: break it up
      if (used + heights[i] > pageH + 0.5 && pages[pages.length - 1].length) { pages.push([]); used = 0; }
      pages[pages.length - 1].push(i); used += heights[i];
    }
  }
  return pages.filter((p) => p.length);
}

export default function Paged({ units, design, kind = 'resume', scale = 1, mode = 'preview', onLayout }) {
  const paper = PAPERS[design.paper] || PAPERS.a4;
  const m = design.margin ?? 15;
  const marginX = m + 1, marginY = m;
  const contentW = (paper.w - 2 * marginX) * MM, contentH = (paper.h - 0.6 - 2 * marginY) * MM;
  const measureRef = useRef(null);
  const [pages, setPages] = useState([units.map((_, i) => i)]);
  const [fontTick, setFontTick] = useState(0);
  const style = useMemo(() => ({ '--accent': design.accent, '--ff': fontFor(design), '--scale': design.scale ?? 1 }), [design.accent, design.font, design.template, design.scale]);

  useLayoutEffect(() => {
    let alive = true;
    const bump = () => alive && setFontTick((t) => t + 1);
    document.fonts?.ready?.then(bump);
    document.fonts?.addEventListener?.('loadingdone', bump);
    return () => { alive = false; document.fonts?.removeEventListener?.('loadingdone', bump); };
  }, []);

  useLayoutEffect(() => {
    const root = measureRef.current; if (!root) return;
    const els = [...root.querySelectorAll(':scope > [data-u]')];
    const heights = els.map((e) => e.getBoundingClientRect().height);
    const glue = units.map((u) => !!u.glue);
    const next = pack(heights, glue, contentH);
    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    onLayout?.({ pages: next.length, fill: heights.reduce((a, b) => a + b, 0) / contentH });
  }, [units, contentW, contentH, fontTick, design.scale, design.template, design.font, design.accent]);

  const pageStyle = { width: `${paper.w}mm`, height: `${paper.h - 0.6}mm`, padding: `${marginY}mm ${marginX}mm` };
  const wrapW = paper.w * MM * scale;
  const total = pages.length;
  return (
    <div className={`paged paged-${mode}`} style={{ width: mode === 'preview' ? wrapW : undefined }}>
      <div ref={measureRef} className={`doc t-${design.template} measure`} style={{ ...style, width: contentW }} aria-hidden="true">
        {units.map((u, i) => <div key={u.key} data-u={i} className={`u ${u.cls || ''}`}>{u.node}</div>)}
      </div>
      <div className="pages" style={mode === 'preview' ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: paper.w * MM, height: 'max-content' } : undefined}>
        {pages.map((idxs, pi) => (
          <div key={pi} className="page-wrap">
            <div className="page" data-kind={kind} style={pageStyle}>
              <div className={`doc t-${design.template}`} style={style}>
                {idxs.map((i) => <div key={units[i].key} className={`u ${units[i].cls || ''}`}>{units[i].node}</div>)}
              </div>
            </div>
            {mode === 'preview' && <div className="page-tag">Page {pi + 1} of {total}</div>}
          </div>
        ))}
      </div>
      {mode === 'preview' && <div style={{ height: 0 }} />}
    </div>
  );
}
