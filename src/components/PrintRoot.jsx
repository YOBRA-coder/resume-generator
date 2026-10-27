import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store.js';
import Paged from './doc/Paged.jsx';
import { buildResumeUnits, buildCoverUnits } from './doc/ResumeDoc.jsx';
import { PAPERS } from './doc/templates.js';
import { fileBase } from '../lib/exporters.js';

/** Renders real, exact-size pages into #print-root and opens the print dialog ("Save as PDF" gives selectable text). */
export default function PrintRoot() {
  const job = useStore((s) => s.printJob); const apps = useStore((s) => s.apps); const setJob = useStore((s) => s.setPrintJob);
  const app = job && apps.find((a) => a.id === job.appId);
  const [ready, setReady] = useState({});
  const fired = useRef(false);
  const host = document.getElementById('print-root');
  const kinds = job ? (job.kind === 'both' ? ['resume', 'cover'] : [job.kind]) : [];

  useEffect(() => { setReady({}); fired.current = false; }, [job]);
  useEffect(() => {
    host.classList.toggle('on', !!app);
    if (!app) return;
    const paper = PAPERS[app.design.paper] || PAPERS.a4;
    let st = document.getElementById('page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); }
    st.textContent = `@media print { @page { size: ${paper.w}mm ${paper.h}mm; margin: 0 } }`;
  }, [app, host]);
  useEffect(() => {
    if (!app || fired.current || !kinds.every((k) => ready[k])) return;
    fired.current = true;
    const title = document.title; document.title = `${fileBase(app)}${job.kind === 'cover' ? '-cover-letter' : job.kind === 'both' ? '' : '-resume'}`;
    const done = () => { document.title = title; window.removeEventListener('afterprint', done); setJob(null); };
    window.addEventListener('afterprint', done);
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => window.print(), 120)));
    setTimeout(() => { if (fired.current) { /* some browsers never fire afterprint */ } }, 60000);
  }, [ready, app]);

  if (!app) return null;
  return createPortal(<>{kinds.map((k) => (
    <Paged key={k} kind={k} mode="print" design={app.design} units={k === 'resume' ? buildResumeUnits(app.resume, app.design) : buildCoverUnits(app, app.design)} onLayout={() => setReady((r) => (r[k] ? r : { ...r, [k]: true }))} />
  ))}</>, host);
}
