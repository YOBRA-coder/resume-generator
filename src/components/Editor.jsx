import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useStore } from '../store.js';
import { go } from '../lib/router.js';
import Paged from './doc/Paged.jsx';
import { buildResumeUnits, buildCoverUnits } from './doc/ResumeDoc.jsx';
import { TEMPLATES, ACCENTS, MM, PAPERS } from './doc/templates.js';
import ContentEditor, { SectionsPanel, Block, PhotoField } from './ContentEditor.jsx';
import { Icon, Tabs, TextInput, TextArea, Seg, Switch, Modal, SaveIndicator, Busy } from './ui.jsx';
import { analyzeResume } from '../engine/ats.js';
import { parseJob } from '../engine/jobParser.js';
import { tailorLocal } from '../engine/tailor.js';
import { detectRole } from '../engine/roles.js';
import { TONES } from '../engine/summary.js';
import { generateApplication } from '../lib/generate.js';
import { resumeToDocx, coverToDocx, resumeToText, coverToText, download, fileBase } from '../lib/exporters.js';
import { canonicalSkill } from '../engine/dictionary.js';
import { wordCount } from '../engine/text.js';

const STATUS = [['draft', 'Draft'], ['applied', 'Applied'], ['interview', 'Interview'], ['offer', 'Offer'], ['rejected', 'Rejected']];

async function countPages(app, design, kind) {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-99999px;top:0;'; document.body.appendChild(host);
  const root = createRoot(host); let n = 1;
  try {
    flushSync(() => root.render(<Paged mode="print" kind={kind} design={design} units={kind === 'resume' ? buildResumeUnits(app.resume, design) : buildCoverUnits(app, design)} onLayout={(l) => { n = l.pages; }} />));
  } finally { root.unmount(); host.remove(); }
  return n;
}

/* ================= panels ================= */
function ContentPanel({ app, up }) {
  const master = useStore((s) => s.profile); const settings = useStore((s) => s.settings);
  const role = useMemo(() => detectRole(app.jobTitle, app.resume.skills.join(' ')), [app.jobTitle]);
  const missing = useMemo(() => analyzeResume(app.resume, app.job, app.design).match?.missing.map((m) => m.name) || [], [app.resume, app.job]);
  const suggestions = [...new Set([...missing, ...role.skills])];
  const rewriteSummary = () => { const r = tailorLocal(master, { company: app.company, jobTitle: app.jobTitle, jobText: app.jobText, tone: app.tone, locale: settings.locale, seed: Math.floor(Math.random() * 1e6) + 1 }); up((a) => ({ ...a, resume: { ...a.resume, summary: r.resume.summary } })); };
  return (
    <>
      {app.generatedSkills && <div className="alert warn" style={{ marginBottom: 16 }}><Icon name="alert" /><span>Your profile had few skills, so we added common ones for this role. Remove any you don’t have.</span></div>}
      {app.resume.experience.some((e) => e.bullets.some((b) => b.generated)) && <div className="alert ai" style={{ marginBottom: 16 }}><Icon name="sparkles" /><span>Some bullet points are suggestions for the job title (marked in gold). Edit them to match what you actually did, and add real numbers.</span></div>}
      <ContentEditor data={app.resume} onChange={(p) => up((a) => ({ ...a, resume: { ...a.resume, ...p } }))} mode="app" suggestions={suggestions}
        summaryAction={<button className="btn sm" onClick={rewriteSummary}><Icon name="refresh" width="15" height="15" />Rewrite</button>} />
      <Block title="Sections" icon="list"><SectionsPanel data={app.resume} onChange={(p) => up((a) => ({ ...a, resume: { ...a.resume, ...p } }))} /></Block>
    </>
  );
}

function JobPanel({ app, up }) {
  const master = useStore((s) => s.profile); const settings = useStore((s) => s.settings); const toast = useStore((s) => s.toast);
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState('');
  const result = useMemo(() => analyzeResume(app.resume, app.job, app.design), [app.resume, app.job, app.design]);
  const m = result.match;
  const reanalyse = () => { const job = parseJob(app.jobText, { title: app.jobTitle }); up((a) => ({ ...a, job })); toast('Job description analysed'); };
  const retailor = async () => {
    setConfirm(false); setBusy('Re-tailoring your resume');
    try { const { app: fresh } = await generateApplication(master, { company: app.company, jobTitle: app.jobTitle, jobText: app.jobText, motivation: app.motivation, recipient: app.recipient, tone: app.tone }, settings, setBusy); up((a) => ({ ...a, job: fresh.job, resume: fresh.resume, cover: { ...fresh.cover, date: a.cover.date }, engine: fresh.engine, generatedSkills: fresh.generatedSkills })); toast('Re-tailored'); }
    finally { setBusy(''); }
  };
  const addSkill = (name) => { up((a) => ({ ...a, resume: { ...a.resume, skills: [...new Set([...a.resume.skills, name])] } })); toast(`Added “${name}” to your skills`); };
  const col = result.score >= 75 ? 'var(--ok)' : result.score >= 50 ? 'var(--warn)' : 'var(--danger)';
  return (
    <div className="stack">
      {busy && <Busy text={busy} />}
      <div className="card pad row" style={{ gap: 16 }}>
        <div className="ring" style={{ '--p': result.score, '--c': col }}><b>{result.score}</b></div>
        <div className="grow"><h3 style={{ fontSize: 17 }}>Resume strength</h3><p className="small muted">{m ? `Covers ${m.matched.length} of ${m.matched.length + m.missing.length} skills in the job ad (${m.score}%).` : 'Paste a job description to measure how well you match.'}</p></div>
      </div>
      <div className="grid2"><TextInput label="Company" value={app.company} onChange={(v) => up({ company: v })} /><TextInput label="Job title" value={app.jobTitle} onChange={(v) => up({ jobTitle: v })} /></div>
      <TextArea label="Job description" rows={8} value={app.jobText} onChange={(v) => up({ jobText: v })} />
      <div className="row wrap"><button className="btn" onClick={reanalyse}><Icon name="target" />Analyse job ad</button><button className="btn" onClick={() => setConfirm(true)}><Icon name="refresh" />Re-tailor resume</button></div>
      {m && (
        <>
          <div className="stack-sm"><span className="label">You have ({m.matched.length})</span><div className="chips">{m.matched.length ? m.matched.map((s) => <span key={s.name} className="chip have">{s.name}</span>) : <span className="hint">None yet.</span>}</div></div>
          <div className="stack-sm"><span className="label">Asked for but not on your resume ({m.missing.length})</span>
            <div className="chips">{m.missing.map((s) => <button key={s.name} className="chip miss" style={{ cursor: 'pointer', border: 0 }} title="Tap only if you truly have this skill" onClick={() => addSkill(s.name)}>+ {s.name}{!s.required && ' (nice to have)'}</button>)}{!m.missing.length && <span className="hint">Nothing missing.</span>}</div>
            <p className="hint">Tap a skill to add it, but only if it’s true. Adding keywords you don’t have backfires in interviews.</p></div>
        </>
      )}
      {(app.job.mission?.length > 0 || app.job.requirements?.length > 0) && (
        <details className="entry-card"><summary><Icon name="chevR" className="icon chev" /><span className="grow" style={{ fontWeight: 600, fontSize: 14 }}>What the ad says</span></summary>
          <div className="entry-body small">
            {app.job.yearsRequired && <p><b>Experience asked:</b> {app.job.yearsRequired}+ years{app.job.education ? ` · ${app.job.education}` : ''}</p>}
            {app.job.mission?.map((x, i) => <p key={i} className="muted">“{x}”</p>)}
            {app.job.requirements?.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{app.job.requirements.slice(0, 8).map((r, i) => <li key={i}>{r}</li>)}</ul>}
          </div></details>
      )}
      <div><span className="label">Checks</span>{result.checks.map((c) => <div key={c.id} className={`check ${c.pass ? 'pass' : 'fail'}`}><Icon name={c.pass ? 'check' : 'alert'} width="16" height="16" /><span>{c.label}{!c.pass && <span className="muted"> — {c.tip}</span>}</span></div>)}</div>
      {confirm && <Modal title="Re-tailor from your master profile?" onClose={() => setConfirm(false)} footer={<><button className="btn" onClick={() => setConfirm(false)}>Cancel</button><button className="btn primary" onClick={retailor}>Re-tailor</button></>}><p className="muted">This rewrites the resume content for this job from your master profile. Your edits to the resume text will be replaced (your design choices are kept).</p></Modal>}
    </div>
  );
}

function CoverPanel({ app, up }) {
  const master = useStore((s) => s.profile); const settings = useStore((s) => s.settings); const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState('');
  const c = app.cover; const total = wordCount((c.paragraphs || []).join(' '));
  const setPara = (i, v) => up((a) => ({ ...a, cover: { ...a.cover, paragraphs: a.cover.paragraphs.map((p, j) => (j === i ? v : p)) } }));
  const regen = async () => {
    setBusy('Writing a new draft');
    try { const { app: fresh, aiNote } = await generateApplication(master, { company: app.company, jobTitle: app.jobTitle, jobText: app.jobText, motivation: app.motivation, recipient: app.recipient, tone: app.tone }, settings, setBusy); up((a) => ({ ...a, cover: { ...fresh.cover, date: a.cover.date, greeting: a.recipient ? `Dear ${a.recipient},` : fresh.cover.greeting } })); toast(aiNote || 'New draft ready'); }
    finally { setBusy(''); }
  };
  const labels = ['Opening', 'Evidence', 'Fit and motivation', 'Closing'];
  return (
    <div className="stack">
      {busy && <Busy text={busy} />}
      <TextArea label="Why this company?" rows={3} value={app.motivation} onChange={(v) => up({ motivation: v })} hint="One or two honest lines. We weave it into the letter. Then tap “Write new draft”." />
      <div className="grid2"><TextInput label="Hiring manager" value={app.recipient} placeholder="Optional" onChange={(v) => up((a) => ({ ...a, recipient: v, cover: { ...a.cover, greeting: v ? `Dear ${v},` : 'Dear Hiring Manager,' } }))} /><TextInput label="Date" type="date" value={c.date} onChange={(v) => up((a) => ({ ...a, cover: { ...a.cover, date: v } }))} /></div>
      <div className="field"><span className="label">Tone</span><Seg label="Tone" value={app.tone} onChange={(v) => up({ tone: v })} options={Object.entries(TONES)} /></div>
      <button className="btn ai" onClick={regen}><Icon name="sparkles" />Write new draft</button>
      <TextInput label="Greeting" value={c.greeting} onChange={(v) => up((a) => ({ ...a, cover: { ...a.cover, greeting: v } }))} />
      {(c.paragraphs || []).map((p, i) => <TextArea key={i} label={`${i + 1}. ${labels[i] || 'Paragraph'}`} rows={i === 1 ? 6 : 5} value={p} onChange={(v) => setPara(i, v)} />)}
      <TextInput label="Sign-off" value={c.signoff} onChange={(v) => up((a) => ({ ...a, cover: { ...a.cover, signoff: v } }))} />
      <p className="hint">{total} words · 180–300 reads best on one page{total > 330 ? '. This is long; trim it.' : ''}</p>
    </div>
  );
}

function DesignPanel({ app, up, fit, pagesNow }) {
  const d = app.design; const setD = (p) => up((a) => ({ ...a, design: { ...a.design, ...p } }));
  const settings = useStore((s) => s.settings); const setSettings = useStore((s) => s.setSettings); const toast = useStore((s) => s.toast);
  const [custom, setCustom] = useState(false);
  return (
    <div className="stack">
      <Block title="Style">
        <div className="tpl-grid">{TEMPLATES.map((t) => (
          <button key={t.id} className="tpl" aria-pressed={d.template === t.id} onClick={() => setD({ template: t.id, accent: t.accent })} style={{ '--tc': t.accent }}>
            <div className={`tpl-prev ${t.id === 'creative' ? 'band' : ''}`}><i className="b" style={{ marginInline: t.id === 'corporate' ? 'auto' : 0 }} /><i style={{ width: '70%', marginInline: t.id === 'corporate' ? 'auto' : 0 }} /><i className="a" style={{ width: '35%', marginTop: 5 }} /><i /><i style={{ width: '88%' }} /><i className="a" style={{ width: '30%', marginTop: 5 }} /><i /><i style={{ width: '75%' }} /></div>
            <b>{t.name}</b><span>{t.note}</span>
          </button>))}</div>
      </Block>
      <Block title="Colour">
        <div className="swatches">{ACCENTS.map((c) => <button key={c} className="swatch" aria-label={`Colour ${c}`} aria-pressed={d.accent === c} style={{ background: c }} onClick={() => setD({ accent: c })} />)}
          <label className="swatch" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)', display: 'block', position: 'relative' }} title="Custom colour"><input type="color" value={d.accent} onChange={(e) => setD({ accent: e.target.value })} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} aria-label="Custom colour" /></label></div>
      </Block>
      <Block title="Type and spacing">
        <div className="stack">
          <div className="field"><span className="label">Font</span><Seg label="Font" value={d.font || 'auto'} onChange={(v) => setD({ font: v })} options={[['auto', 'Template'], ['sans', 'Sans'], ['serif', 'Serif'], ['display', 'Display']]} /></div>
          <label className="field"><span className="label">Text size · {Math.round((d.scale ?? 1) * 100)}%</span><input type="range" min="0.8" max="1.15" step="0.01" value={d.scale ?? 1} onChange={(e) => setD({ scale: +e.target.value })} /></label>
          <label className="field"><span className="label">Page margin · {d.margin ?? 15} mm</span><input type="range" min="8" max="24" step="1" value={d.margin ?? 15} onChange={(e) => setD({ margin: +e.target.value })} /></label>
          <div className="field"><span className="label">Paper</span><Seg label="Paper" value={d.paper} onChange={(v) => setD({ paper: v })} options={Object.entries(PAPERS).map(([k, v]) => [k, v.label])} /></div>
        </div>
      </Block>
      <Block title="Page budget">
        <div className="stack">
          <div className="field"><span className="label">Target length</span><Seg label="Target length" value={String(d.pages ?? 'auto')} onChange={(v) => setD({ pages: v === 'auto' ? 'auto' : +v })} options={[['auto', 'Any'], ['1', '1 page'], ['2', '2 pages']]} /></div>
          <div className="row wrap"><span className={`badge ${d.pages !== 'auto' && pagesNow > d.pages ? 'warn' : 'ok'}`}><i />Now {pagesNow} page{pagesNow === 1 ? '' : 's'}</span><button className="btn sm" onClick={fit} disabled={d.pages === 'auto'}><Icon name="wand" width="15" height="15" />Auto-fit</button></div>
          <p className="hint">Auto-fit gently shrinks text and margins until the resume fits. Entries and bullets are never split mid-line.</p>
        </div>
      </Block>
      <Block title="Photo">
        <div className="stack">
          <PhotoField photo={app.resume.basics.photo} onChange={(photo) => { up((a) => ({ ...a, resume: { ...a.resume, basics: { ...a.resume.basics, photo } }, design: { ...a.design, showPhoto: !!photo } })); }} />
          {app.resume.basics.photo && <><Switch checked={d.showPhoto} onChange={(v) => setD({ showPhoto: v })} label="Show photo on resume" /><div className="field"><span className="label">Shape</span><Seg label="Photo shape" value={d.photoShape || 'circle'} onChange={(v) => setD({ photoShape: v })} options={[['circle', 'Circle'], ['rounded', 'Rounded'], ['square', 'Square']]} /></div></>}
        </div>
      </Block>
      <button className="btn" onClick={() => { setSettings({ design: { ...d, showPhoto: false } }); toast('Saved as the default style for new applications'); }}>Use this style for new applications</button>
    </div>
  );
}

function ExportPanel({ app, up, onPrint }) {
  const remove = useStore((s) => s.removeApp); const toast = useStore((s) => s.toast); const dup = useStore((s) => s.duplicateApp);
  const [busy, setBusy] = useState('');
  const base = fileBase(app);
  const run = async (label, fn) => { setBusy(label); try { await fn(); } catch (e) { console.error(e); toast('Export failed. Try again.'); } finally { setBusy(''); } };
  return (
    <div className="stack">
      {busy && <Busy text={busy} />}
      <div className="alert"><Icon name="info" /><span>Choose <b>Save as PDF</b> in the print window. The PDF has real, selectable text, so applicant tracking systems can read it.</span></div>
      <Block title="PDF">
        <div className="stack-sm">
          <button className="btn primary" onClick={() => onPrint('resume')}><Icon name="printer" />Resume PDF</button>
          <button className="btn" onClick={() => onPrint('cover')}><Icon name="printer" />Cover letter PDF</button>
          <button className="btn" onClick={() => onPrint('both')}><Icon name="printer" />Both in one PDF</button>
        </div>
      </Block>
      <Block title="Word and text">
        <div className="stack-sm">
          <button className="btn" onClick={() => run('Building DOCX', async () => download(`${base}-resume.docx`, await resumeToDocx(app)))}><Icon name="download" />Resume (.docx)</button>
          <button className="btn" onClick={() => run('Building DOCX', async () => download(`${base}-cover-letter.docx`, await coverToDocx(app)))}><Icon name="download" />Cover letter (.docx)</button>
          <button className="btn" onClick={() => download(`${base}-resume.txt`, new Blob([resumeToText(app)], { type: 'text/plain' }))}><Icon name="file" />Resume as plain text</button>
          <button className="btn" onClick={async () => { await navigator.clipboard?.writeText(coverToText(app)); toast('Cover letter copied'); }}><Icon name="clipboard" />Copy cover letter</button>
        </div>
      </Block>
      <Block title="This application">
        <div className="stack-sm">
          <div className="field"><span className="label">Status</span><Seg label="Status" value={app.status} onChange={(v) => up({ status: v })} options={STATUS} /></div>
          <div className="row wrap"><button className="btn" onClick={async () => { const id = await dup(app.id); if (id) go(`/app/${id}`); }}><Icon name="copy" />Duplicate</button><button className="btn danger" onClick={() => { remove(app.id); go('/'); }}><Icon name="trash" />Delete</button></div>
        </div>
      </Block>
    </div>
  );
}

/* ================= editor shell ================= */
export default function Editor({ id }) {
  const app = useStore((s) => s.apps.find((a) => a.id === id)); const updateApp = useStore((s) => s.updateApp); const setPrintJob = useStore((s) => s.setPrintJob); const toast = useStore((s) => s.toast);
  const [tab, setTab] = useState('content'); const [view, setView] = useState('resume'); const [pane, setPane] = useState('edit'); const [zoom, setZoom] = useState('fit');
  const [layout, setLayout] = useState({ resume: 1, cover: 1 }); const [scale, setScale] = useState(0.8);
  const canvas = useRef(null);
  const up = useCallback((u) => updateApp(id, u), [id, updateApp]);

  useEffect(() => {
    const el = canvas.current; if (!el || !app) return;
    const calc = () => { const pw = (PAPERS[app.design.paper] || PAPERS.a4).w * MM; const avail = el.clientWidth - (window.innerWidth < 900 ? 16 : 40); setScale(zoom === 'fit' ? Math.max(0.3, Math.min(1.25, avail / pw)) : Math.min(1.25, zoom)); };
    calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, [zoom, app?.design.paper, pane]);

  const units = useMemo(() => (app ? (view === 'resume' ? buildResumeUnits(app.resume, app.design) : buildCoverUnits(app, app.design)) : []), [app?.resume, app?.cover, app?.design, app?.company, app?.recipient, view]);
  // keep the dashboard score fresh
  useEffect(() => { if (!app) return; const t = setTimeout(() => { const s = analyzeResume(app.resume, app.job, app.design).score; if (s !== app.score) updateApp(id, (a) => ({ ...a, score: s, updatedAt: a.updatedAt })); }, 900); return () => clearTimeout(t); }, [app?.resume, app?.design]);

  if (!app) return <div className="page-pad"><div className="empty"><h2>Application not found</h2><p>It may have been deleted on this device.</p><a className="btn primary" href="#/">Back to applications</a></div></div>;

  const fit = async () => {
    const target = app.design.pages; if (target === 'auto') return;
    const base = app.design;
    for (const [scale, margin] of [[1, 15], [0.96, 14], [0.92, 13], [0.88, 12], [0.85, 11], [0.82, 10], [0.8, 9]]) {
      if ((await countPages(app, { ...base, scale, margin }, 'resume')) <= target) { up((a) => ({ ...a, design: { ...a.design, scale, margin } })); toast(`Fitted to ${target} page${target > 1 ? 's' : ''}`); return; }
    }
    toast(`Couldn’t fit ${target} page${target > 1 ? 's' : ''}. Trim some bullets or hide a section.`);
  };
  const over = app.design.pages !== 'auto' && layout.resume > app.design.pages;

  return (
    <div className="editor" data-pane={pane}>
      <div className="ed-left">
        <div className="ed-left-head">
          <div className="row"><a className="btn ghost icon-only" href="#/" aria-label="Back to applications"><Icon name="chevR" style={{ transform: 'rotate(180deg)' }} /></a>
            <div className="grow" style={{ minWidth: 0 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company || app.jobTitle || 'Untitled'}{app.company && <span className="muted" style={{ fontWeight: 500 }}> · {app.jobTitle || 'No title'}</span>}</div></div>
            <SaveIndicator /></div>
          <Tabs value={tab} onChange={setTab} tabs={[['content', 'Content'], ['job', 'Job match'], ['cover', 'Cover'], ['design', 'Design'], ['export', 'Export']]} />
        </div>
        <div className="ed-left-body">
          {tab === 'content' && <ContentPanel app={app} up={up} />}
          {tab === 'job' && <JobPanel app={app} up={up} />}
          {tab === 'cover' && <CoverPanel app={app} up={up} />}
          {tab === 'design' && <DesignPanel app={app} up={up} fit={fit} pagesNow={layout.resume} />}
          {tab === 'export' && <ExportPanel app={app} up={up} onPrint={(kind) => setPrintJob({ appId: app.id, kind })} />}
        </div>
      </div>
      <div className="ed-right">
        <div className="ed-toolbar">
          <Seg label="Document" value={view} onChange={(v) => { setView(v); if (v === 'cover' && tab === 'content') setTab('cover'); if (v === 'resume' && tab === 'cover') setTab('content'); }} options={[['resume', 'Resume'], ['cover', 'Cover letter']]} />
          <span className={`badge ${over ? 'warn' : ''}`}><i />{layout[view]} page{layout[view] === 1 ? '' : 's'}{over ? ` · target ${app.design.pages}` : ''}</span>
          {over && <button className="btn sm" onClick={fit}><Icon name="wand" width="15" height="15" />Auto-fit</button>}
          <span className="grow" />
          <Seg label="Zoom" value={zoom === 'fit' ? 'fit' : 'one'} onChange={(v) => setZoom(v === 'fit' ? 'fit' : 1)} options={[['fit', 'Fit'], ['one', '100%']]} />
          <button className="btn primary sm" onClick={() => setPrintJob({ appId: app.id, kind: view })}><Icon name="download" width="15" height="15" />Download PDF</button>
        </div>
        <div className="ed-canvas" ref={canvas}>
          <Paged key={view} units={units} design={app.design} kind={view} scale={scale} mode="preview" onLayout={(l) => setLayout((s) => (s[view] === l.pages ? s : { ...s, [view]: l.pages }))} />
        </div>
      </div>
      <div className="mobile-switch" role="group" aria-label="Switch between editing and preview">
        <button aria-pressed={pane === 'edit'} onClick={() => setPane('edit')}>Edit</button><button aria-pressed={pane === 'preview'} onClick={() => setPane('preview')}>Preview</button>
      </div>
    </div>
  );
}
