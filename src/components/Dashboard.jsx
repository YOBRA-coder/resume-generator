import { useMemo, useState } from 'react';
import { useStore } from '../store.js';
import { go } from '../lib/router.js';
import { Icon } from './ui.jsx';
import { buildResumeUnits } from './doc/ResumeDoc.jsx';
import { PAPERS, MM, fontFor } from './doc/templates.js';
import { sampleProfile } from '../engine/sample.js';
import { profileCompleteness } from '../engine/profileUtils.js';

const STATUS = { draft: 'Draft', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' };
const STATUS_COLOR = { draft: 'var(--muted)', applied: '#2563eb', interview: 'var(--gold)', offer: 'var(--ok)', rejected: 'var(--danger)' };

/** Static first-page thumbnail (no pagination work) so the grid stays fast with many applications. */
function Thumb({ app }) {
  const d = app.design; const paper = PAPERS[d.paper] || PAPERS.a4; const m = d.margin ?? 15;
  const w = paper.w * MM, h = paper.h * MM; const s = 0.27;
  const units = useMemo(() => buildResumeUnits(app.resume, d), [app.resume, d]);
  return (
    <a className="app-thumb" href={`#/app/${app.id}`} aria-label={`Open ${app.company || app.jobTitle}`} tabIndex={-1}>
      <div className="thumb-inner" style={{ width: w, height: h, transform: `translateX(${-w * s / 2}px) scale(${s})` }}>
        <div className="page" style={{ width: '100%', height: '100%', padding: `${m}mm ${m + 1}mm`, boxShadow: '0 1px 8px rgba(0,0,0,.15)' }}>
          <div className={`doc t-${d.template}`} style={{ '--accent': d.accent, '--ff': fontFor(d), '--scale': d.scale ?? 1 }}>{units.slice(0, 22).map((u) => <div key={u.key} className={`u ${u.cls || ''}`}>{u.node}</div>)}</div>
        </div>
      </div>
    </a>
  );
}

const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return d < 30 ? `${d} day${d > 1 ? 's' : ''} ago` : new Date(t).toLocaleDateString(); };

export default function Dashboard() {
  const apps = useStore((s) => s.apps); const profile = useStore((s) => s.profile); const hasProfile = useStore((s) => s.hasProfile);
  const remove = useStore((s) => s.removeApp); const dup = useStore((s) => s.duplicateApp); const updateApp = useStore((s) => s.updateApp); const replace = useStore((s) => s.replaceProfile);
  const [q, setQ] = useState(''); const [f, setF] = useState('all');
  const list = apps.filter((a) => (f === 'all' || a.status === f) && `${a.company} ${a.jobTitle}`.toLowerCase().includes(q.toLowerCase()));
  const pct = profileCompleteness(profile);

  if (!apps.length && !hasProfile) return (
    <div className="page-pad"><div className="empty" style={{ paddingTop: 72 }}>
      <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', maxWidth: '16ch', margin: '0 auto 12px' }}>A resume and cover letter for every job, in minutes</h2>
      <p>Add your background once. Paste a job ad and get a tailored, ATS-friendly resume and a letter that speaks to the company. It works offline and your data stays on this device.</p>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <a className="btn primary lg" href="#/welcome">Set up my profile</a>
        <button className="btn lg" onClick={() => { replace(sampleProfile()); go('/new'); }}><Icon name="sparkles" />Try with sample data</button>
      </div>
    </div></div>
  );
  return (
    <div className="page-pad">
      <div className="page-head">
        <div><h1>Applications</h1><p>{apps.length ? `${apps.length} saved on this device. Open one to edit, or start a new one.` : 'Nothing here yet. Your first application takes about a minute.'}</p></div>
        <div className="row wrap">
          {pct < 100 && <a className="btn" href="#/profile"><span className="score" style={{ '--p': pct, width: 24, height: 24 }}><b style={{ fontSize: 0 }}>{pct}</b></span>Profile {pct}%</a>}
          <a className="btn primary" href="#/new"><Icon name="plus" />New application</a>
        </div>
      </div>
      {apps.length > 3 && (
        <div className="row wrap" style={{ marginBottom: 18 }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search company or job" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" />
          <div className="seg">{[['all', 'All'], ...Object.entries(STATUS)].map(([k, l]) => <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
        </div>
      )}
      <div className="app-grid">
        <a className="new-card" href="#/new"><div><div className="plus"><Icon name="plus" /></div><b style={{ color: 'var(--ink)' }}>New application</b><p className="small" style={{ marginTop: 4 }}>Paste a job ad, get a tailored resume and letter</p></div></a>
        {list.map((a) => (
          <article key={a.id} className="card app-card">
            <Thumb app={a} />
            <div className="app-body">
              <div className="row spread" style={{ alignItems: 'flex-start' }}><div style={{ minWidth: 0 }}><h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company || a.jobTitle || 'Untitled'}</h3><p className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company ? a.jobTitle : 'No company added'}</p></div>
                {a.score != null && <span className="score" style={{ '--p': a.score }} title={`Resume strength ${a.score}`}><b>{a.score}</b></span>}</div>
              <div className="app-meta">
                <select className="status-select" value={a.status} aria-label="Status" style={{ color: STATUS_COLOR[a.status] }} onChange={(e) => updateApp(a.id, { status: e.target.value })}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <span className="xs muted">{ago(a.updatedAt)}</span>{a.engine === 'ai' && <span className="badge ai" title="Polished with AI"><i />AI</span>}
              </div>
            </div>
            <div className="app-actions">
              <a className="btn sm ghost" href={`#/app/${a.id}`}><Icon name="pencil" width="15" height="15" />Edit</a>
              <button className="btn sm ghost" onClick={async () => { const id = await dup(a.id); if (id) go(`/app/${id}`); }}><Icon name="copy" width="15" height="15" />Duplicate</button>
              <span className="grow" />
              <button className="btn sm ghost danger" aria-label={`Delete ${a.company || a.jobTitle}`} onClick={() => remove(a.id)}><Icon name="trash" width="15" height="15" /></button>
            </div>
          </article>
        ))}
      </div>
      {apps.length > 0 && !list.length && <p className="muted" style={{ marginTop: 20 }}>No applications match.</p>}
    </div>
  );
}
