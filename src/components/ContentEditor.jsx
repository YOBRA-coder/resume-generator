import { useEffect, useRef, useState } from 'react';
import { Icon, TextInput, TextArea, ChipInput, Modal, Switch } from './ui.jsx';
import { uid, emptyExperience, emptyEducation, emptyProject, emptyCert, bulletText, formatRange } from '../engine/profileUtils.js';
import { strengthenBullet } from '../engine/rewriter.js';
import { roleBullets } from '../engine/tailor.js';
import { detectRole } from '../engine/roles.js';
import { loadImage, cropToDataURL } from '../lib/image.js';
import { SECTION_LABELS, DEFAULT_ORDER } from './doc/ResumeDoc.jsx';
import { useStore } from '../store.js';

const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a; };

/* ---------- photo ---------- */
export function PhotoField({ photo, onChange }) {
  const input = useRef(null); const toast = useStore((s) => s.toast);
  const [img, setImg] = useState(null);
  const [crop, setCrop] = useState({ zoom: 1, x: 0, y: 0 });
  const canvas = useRef(null);
  useEffect(() => { if (!img || !canvas.current) return; const c = canvas.current, g = c.getContext('2d'); const url = cropToDataURL(img, { ...crop, size: 240 }); const i = new Image(); i.onload = () => g.drawImage(i, 0, 0, 240, 240); i.src = url; }, [img, crop]);
  const pick = async (f) => { if (!f) return; try { setImg(await loadImage(f)); setCrop({ zoom: 1, x: 0, y: 0 }); } catch (e) { toast(e.message); } };
  return (
    <div className="row" style={{ alignItems: 'center', gap: 14 }}>
      <div className="photo-box">{photo ? <img src={photo} alt="Your photo" /> : <Icon name="user" width="30" height="30" />}</div>
      <div className="stack-sm">
        <div className="row wrap">
          <button type="button" className="btn sm" onClick={() => input.current?.click()}><Icon name="image" width="15" height="15" />{photo ? 'Change photo' : 'Add photo'}</button>
          {photo && <button type="button" className="btn sm ghost danger" onClick={() => onChange(null)}>Remove</button>}
        </div>
        <span className="hint">Optional. Many employers in Kenya, the Gulf and Europe expect one; US and UK portals usually don’t. Stored only on this device.</span>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      {img && (
        <Modal title="Crop your photo" onClose={() => setImg(null)} footer={<><button className="btn" onClick={() => setImg(null)}>Cancel</button><button className="btn primary" onClick={() => { onChange(cropToDataURL(img, { ...crop, size: 480 })); setImg(null); }}>Use photo</button></>}>
          <div className="stack">
            <canvas ref={canvas} width="240" height="240" style={{ width: 240, height: 240, borderRadius: 12, margin: '0 auto', background: '#eee' }} />
            <label className="field"><span className="label">Zoom</span><input type="range" min="1" max="3" step="0.05" value={crop.zoom} onChange={(e) => setCrop({ ...crop, zoom: +e.target.value })} /></label>
            <div className="grid2"><label className="field"><span className="label">Left / right</span><input type="range" min="-1" max="1" step="0.02" value={crop.x} onChange={(e) => setCrop({ ...crop, x: +e.target.value })} /></label><label className="field"><span className="label">Up / down</span><input type="range" min="-1" max="1" step="0.02" value={crop.y} onChange={(e) => setCrop({ ...crop, y: +e.target.value })} /></label></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- generic entry card ---------- */
function EntryCard({ title, sub, open, onMove, onDelete, onHide, hidden, children, badge }) {
  return (
    <details className="entry-card" open={open}>
      <summary>
        <Icon name="chevR" className="icon chev" />
        <div className="grow"><div style={{ fontWeight: 600, fontSize: 14 }}>{title || <span className="muted">Untitled</span>} {badge}</div>{sub && <div className="xs muted">{sub}</div>}</div>
        <span className="row" style={{ gap: 0 }} onClick={(e) => e.preventDefault()}>
          {onHide && <button type="button" className="btn ghost icon-only" title={hidden ? 'Show on resume' : 'Hide from resume'} aria-label={hidden ? 'Show on resume' : 'Hide from resume'} onClick={onHide}><Icon name={hidden ? 'eyeOff' : 'eye'} width="16" height="16" /></button>}
          <button type="button" className="btn ghost icon-only" aria-label="Move up" onClick={() => onMove(-1)}><Icon name="chevU" width="16" height="16" /></button>
          <button type="button" className="btn ghost icon-only" aria-label="Move down" onClick={() => onMove(1)}><Icon name="chevD" width="16" height="16" /></button>
          <button type="button" className="btn ghost icon-only danger" aria-label="Delete" onClick={onDelete}><Icon name="trash" width="16" height="16" /></button>
        </span>
      </summary>
      <div className="entry-body">{children}</div>
    </details>
  );
}

/* ---------- bullets ---------- */
function BulletRow({ b, current, locale, onChange, onMove, onDelete }) {
  const text = bulletText(b);
  const [tips, setTips] = useState(null);
  const improve = () => { const r = strengthenBullet(text, { current, locale }); onChange({ ...b, text: r.text, generated: false }); setTips(r); };
  return (
    <div className="stack-sm">
      <div className="bullet">
        <textarea className="textarea" rows={2} value={text} aria-label="Bullet point" onChange={(e) => { onChange({ ...b, text: e.target.value, generated: false }); setTips(null); }} />
        <div className="bullet-tools">
          <button type="button" className="btn ghost icon-only" title="Strengthen wording" aria-label="Strengthen wording" onClick={improve}><Icon name="wand" width="16" height="16" /></button>
          <button type="button" className="btn ghost icon-only" aria-label="Move up" onClick={() => onMove(-1)}><Icon name="arrowUp" width="15" height="15" /></button>
          <button type="button" className="btn ghost icon-only" aria-label="Move down" onClick={() => onMove(1)}><Icon name="arrowDown" width="15" height="15" /></button>
          <button type="button" className="btn ghost icon-only danger" aria-label="Delete bullet" onClick={onDelete}><Icon name="trash" width="15" height="15" /></button>
        </div>
      </div>
      {b.generated && <div><span className="gen-tag">Suggested from your job title. Edit it to match what you really did.</span></div>}
      {tips && (tips.tips.length > 0 || tips.changes.length > 0) && <div className="hint">{tips.changes.length > 0 && <span>✓ {tips.changes.join(', ')}. </span>}{tips.tips[0]}</div>}
    </div>
  );
}

function ExperienceEditor({ items, onChange, mode }) {
  const locale = useStore((s) => s.settings.locale);
  const upd = (id, patch) => onChange(items.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const gen = (e) => { const role = detectRole(e.role); const skills = []; const next = roleBullets({ ...e, bullets: [] }, { role, userSkills: skills, locale, seed: Date.now() % 100000 }); upd(e.id, { bullets: [...(e.bullets || []), ...next] }); };
  return (
    <div className="stack-sm">
      {items.map((e, i) => (
        <EntryCard key={e.id} open={!e.role && !e.company} title={e.role} sub={[e.company, formatRange(e.start, e.end, e.current)].filter(Boolean).join(' · ')} hidden={e.hidden}
          onHide={mode === 'app' ? () => upd(e.id, { hidden: !e.hidden }) : null}
          onMove={(d) => onChange(move(items, i, d))} onDelete={() => onChange(items.filter((x) => x.id !== e.id))}>
          <div className="grid2"><TextInput label="Job title" value={e.role} onChange={(v) => upd(e.id, { role: v })} placeholder="e.g. Web Developer" /><TextInput label="Company" value={e.company} onChange={(v) => upd(e.id, { company: v })} /></div>
          <div className="grid2">
            <TextInput label="Start" type="month" value={e.start} onChange={(v) => upd(e.id, { start: v })} />
            <TextInput label="End" type="month" value={e.current ? '' : e.end} disabled={e.current} onChange={(v) => upd(e.id, { end: v })} />
          </div>
          <div className="grid2"><TextInput label="Location (optional)" value={e.location} onChange={(v) => upd(e.id, { location: v })} /><div style={{ alignSelf: 'end', paddingBottom: 8 }}><Switch checked={e.current} onChange={(v) => upd(e.id, { current: v, end: v ? '' : e.end })} label="I still work here" /></div></div>
          {mode === 'master' && !(e.bullets || []).length && <TextArea label="Rough notes (optional)" rows={3} value={e.notes} onChange={(v) => upd(e.id, { notes: v })} placeholder={'Just jot what you did, one per line:\nbuilt websites for clients\nfixed bugs and sped up pages'} hint="We turn these into strong, result-focused bullet points. No numbers are ever added for you." />}
          <div className="stack-sm">
            <span className="label">Bullet points</span>
            {(e.bullets || []).map((b, bi) => <BulletRow key={b.id || bi} b={b} current={e.current} locale={locale} onChange={(nb) => upd(e.id, { bullets: e.bullets.map((x, j) => (j === bi ? { ...nb, id: nb.id || uid() } : x)) })} onMove={(d) => upd(e.id, { bullets: move(e.bullets, bi, d) })} onDelete={() => upd(e.id, { bullets: e.bullets.filter((_, j) => j !== bi) })} />)}
            <div className="row wrap">
              <button type="button" className="btn sm" onClick={() => upd(e.id, { bullets: [...(e.bullets || []), { id: uid(), text: '' }] })}><Icon name="plus" width="15" height="15" />Add bullet</button>
              <button type="button" className="btn sm" onClick={() => (e.notes?.trim() ? upd(e.id, { bullets: [...(e.bullets || []), ...roleBullets({ ...e, bullets: [] }, { role: detectRole(e.role), userSkills: [], locale, seed: 1, topUp: false })] }) : gen(e))}><Icon name="sparkles" width="15" height="15" />{e.notes?.trim() ? 'Turn notes into bullets' : 'Suggest bullets for this role'}</button>
              {(e.bullets || []).length > 0 && <button type="button" className="btn sm" onClick={() => upd(e.id, { bullets: e.bullets.map((b) => ({ ...b, text: strengthenBullet(bulletText(b), { current: e.current, locale }).text })) })}><Icon name="wand" width="15" height="15" />Strengthen all</button>}
            </div>
          </div>
        </EntryCard>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, emptyExperience()])}><Icon name="plus" />Add job</button>
    </div>
  );
}

function EducationEditor({ items, onChange }) {
  const upd = (id, p) => onChange(items.map((e) => (e.id === id ? { ...e, ...p } : e)));
  return (
    <div className="stack-sm">
      {items.map((e, i) => (
        <EntryCard key={e.id} open={!e.school && !e.degree} title={[e.degree, e.field].filter(Boolean).join(' in ')} sub={[e.school, e.end].filter(Boolean).join(' · ')} onMove={(d) => onChange(move(items, i, d))} onDelete={() => onChange(items.filter((x) => x.id !== e.id))}>
          <TextInput label="School or institution" value={e.school} onChange={(v) => upd(e.id, { school: v })} />
          <div className="grid2"><TextInput label="Qualification" value={e.degree} onChange={(v) => upd(e.id, { degree: v })} placeholder="BSc, Diploma, KCSE…" /><TextInput label="Field of study" value={e.field} onChange={(v) => upd(e.id, { field: v })} /></div>
          <div className="grid2"><TextInput label="Start year" value={e.start} onChange={(v) => upd(e.id, { start: v })} placeholder="2017" inputMode="numeric" /><TextInput label="End year" value={e.end} onChange={(v) => upd(e.id, { end: v })} placeholder="2021" inputMode="numeric" /></div>
          <TextInput label="Grade or honours (optional)" value={e.grade} onChange={(v) => upd(e.id, { grade: v })} placeholder="Second Class Upper" />
        </EntryCard>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, emptyEducation()])}><Icon name="plus" />Add education</button>
    </div>
  );
}

function ProjectsEditor({ items, onChange }) {
  const upd = (id, p) => onChange(items.map((e) => (e.id === id ? { ...e, ...p } : e)));
  return (
    <div className="stack-sm">
      {items.map((e, i) => (
        <EntryCard key={e.id} open={!e.name} title={e.name} sub={e.tech} onMove={(d) => onChange(move(items, i, d))} onDelete={() => onChange(items.filter((x) => x.id !== e.id))}>
          <TextInput label="Project name" value={e.name} onChange={(v) => upd(e.id, { name: v })} />
          <div className="grid2"><TextInput label="Link (optional)" value={e.link} onChange={(v) => upd(e.id, { link: v })} /><TextInput label="Tools used" value={e.tech} onChange={(v) => upd(e.id, { tech: v })} placeholder="React, Node.js" /></div>
          <TextArea label="What it does" rows={3} value={e.description} onChange={(v) => upd(e.id, { description: v })} />
        </EntryCard>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, emptyProject()])}><Icon name="plus" />Add project</button>
    </div>
  );
}

function CertsEditor({ items, onChange }) {
  const upd = (id, p) => onChange(items.map((e) => (e.id === id ? { ...e, ...p } : e)));
  return (
    <div className="stack-sm">
      {items.map((c) => (
        <div key={c.id} className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><TextInput label="Certificate" value={c.name} onChange={(v) => upd(c.id, { name: v })} /></div>
          <div style={{ width: 130 }}><TextInput label="Issuer" value={c.issuer} onChange={(v) => upd(c.id, { issuer: v })} /></div>
          <div style={{ width: 72 }}><TextInput label="Year" value={c.year} onChange={(v) => upd(c.id, { year: v })} inputMode="numeric" /></div>
          <button type="button" className="btn ghost icon-only danger" aria-label="Delete certificate" onClick={() => onChange(items.filter((x) => x.id !== c.id))}><Icon name="trash" /></button>
        </div>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, emptyCert()])}><Icon name="plus" />Add certificate</button>
    </div>
  );
}

function LanguagesEditor({ items, onChange }) {
  return (
    <div className="stack-sm">
      {items.map((l, i) => (
        <div key={i} className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><TextInput label={i === 0 ? 'Language' : undefined} value={l.name} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, name: v } : x)))} /></div>
          <div className="grow"><TextInput label={i === 0 ? 'Level' : undefined} value={l.level} placeholder="Fluent, Native…" onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, level: v } : x)))} /></div>
          <button type="button" className="btn ghost icon-only danger" aria-label="Delete language" onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="trash" /></button>
        </div>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, { name: '', level: '' }])}><Icon name="plus" />Add language</button>
    </div>
  );
}

function RefereesEditor({ items, onChange }) {
  const upd = (id, p) => onChange(items.map((e) => (e.id === id ? { ...e, ...p } : e)));
  return (
    <div className="stack-sm">
      <p className="hint">Common on Kenyan CVs. Leave empty to omit, or write “Available on request” in awards.</p>
      {items.map((r, i) => (
        <EntryCard key={r.id} open={!r.name} title={r.name} sub={[r.title, r.company].filter(Boolean).join(', ')} onMove={(d) => onChange(move(items, i, d))} onDelete={() => onChange(items.filter((x) => x.id !== r.id))}>
          <div className="grid2"><TextInput label="Name" value={r.name} onChange={(v) => upd(r.id, { name: v })} /><TextInput label="Job title" value={r.title} onChange={(v) => upd(r.id, { title: v })} /></div>
          <div className="grid2"><TextInput label="Organisation" value={r.company} onChange={(v) => upd(r.id, { company: v })} /><TextInput label="Phone" value={r.phone} onChange={(v) => upd(r.id, { phone: v })} /></div>
          <TextInput label="Email" value={r.email} onChange={(v) => upd(r.id, { email: v })} />
        </EntryCard>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, { id: uid(), name: '', title: '', company: '', phone: '', email: '' }])}><Icon name="plus" />Add referee</button>
    </div>
  );
}

/* ---------- section order / visibility (application mode) ---------- */
export function SectionsPanel({ data, onChange }) {
  const order = data.sectionOrder?.length ? data.sectionOrder : DEFAULT_ORDER; const hidden = new Set(data.hidden || []);
  return (
    <div className="stack-sm">
      {order.map((id, i) => (
        <div key={id} className="row" style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '4px 6px 4px 12px' }}>
          <span className="grow small" style={{ opacity: hidden.has(id) ? 0.5 : 1 }}>{SECTION_LABELS[id]}</span>
          <button type="button" className="btn ghost icon-only" aria-label={`Move ${SECTION_LABELS[id]} up`} onClick={() => onChange({ sectionOrder: move(order, i, -1) })}><Icon name="chevU" width="16" height="16" /></button>
          <button type="button" className="btn ghost icon-only" aria-label={`Move ${SECTION_LABELS[id]} down`} onClick={() => onChange({ sectionOrder: move(order, i, 1) })}><Icon name="chevD" width="16" height="16" /></button>
          <button type="button" className="btn ghost icon-only" aria-label={hidden.has(id) ? `Show ${SECTION_LABELS[id]}` : `Hide ${SECTION_LABELS[id]}`} onClick={() => onChange({ hidden: hidden.has(id) ? [...hidden].filter((x) => x !== id) : [...hidden, id], sectionOrder: order })}><Icon name={hidden.has(id) ? 'eyeOff' : 'eye'} width="16" height="16" /></button>
        </div>
      ))}
    </div>
  );
}

/* ---------- the editor ---------- */
export function Block({ title, icon, children, action }) {
  return <section className="sec-block"><div className="row spread" style={{ marginBottom: 12 }}><h3 className="section-title">{icon && <Icon name={icon} />}{title}</h3>{action}</div>{children}</section>;
}

/**
 * data: resume-like object. mode 'master' (profile) | 'app' (tailored resume).
 * Only the sections the caller passes in `show` are rendered.
 */
export default function ContentEditor({ data, onChange, mode = 'app', show, suggestions = [], summaryAction, headlineLabel = 'Headline' }) {
  const has = (k) => !show || show.includes(k);
  const b = data.basics;
  const setB = (p) => onChange({ basics: { ...b, ...p } });
  return (
    <>
      {has('basics') && (
        <Block title="About you" icon="user">
          <div className="stack">
            <PhotoField photo={b.photo} onChange={(photo) => setB({ photo })} />
            <TextInput label="Full name" value={b.name} onChange={(v) => setB({ name: v })} autoComplete="name" />
            {mode === 'master' ? null : <TextInput label={headlineLabel} value={b.headline} onChange={(v) => setB({ headline: v })} />}
            <div className="grid2"><TextInput label="Email" type="email" value={b.email} onChange={(v) => setB({ email: v })} autoComplete="email" /><TextInput label="Phone" type="tel" value={b.phone} onChange={(v) => setB({ phone: v })} autoComplete="tel" /></div>
            <TextInput label="Location" value={b.location} onChange={(v) => setB({ location: v })} placeholder="Nairobi, Kenya" />
            <div className="grid2"><TextInput label="LinkedIn" value={b.linkedin} onChange={(v) => setB({ linkedin: v })} placeholder="linkedin.com/in/you" /><TextInput label="GitHub or portfolio" value={b.github} onChange={(v) => setB({ github: v })} /></div>
            <TextInput label="Website" value={b.website} onChange={(v) => setB({ website: v })} />
          </div>
        </Block>
      )}
      {has('summary') && (
        <Block title="Profile summary" icon="file" action={summaryAction}>
          <TextArea rows={5} value={data.summary} onChange={(v) => onChange({ summary: v })} aria-label="Profile summary" placeholder="Leave empty and we’ll write one from your skills and experience." />
          <p className="hint" style={{ marginTop: 6 }}>{(data.summary || '').trim() ? `${(data.summary || '').trim().split(/\s+/).length} words · aim for 35–60` : ' '}</p>
        </Block>
      )}
      {has('experience') && <Block title="Experience" icon="briefcase"><ExperienceEditor mode={mode} items={data.experience || []} onChange={(experience) => onChange({ experience })} /></Block>}
      {has('skills') && <Block title="Skills" icon="target"><ChipInput items={data.skills || []} onChange={(skills) => onChange({ skills })} suggestions={suggestions} placeholder="Add a skill, press Enter" /></Block>}
      {has('education') && <Block title="Education" icon="cap"><EducationEditor items={data.education || []} onChange={(education) => onChange({ education })} /></Block>}
      {has('projects') && <Block title="Projects" icon="layout"><ProjectsEditor items={data.projects || []} onChange={(projects) => onChange({ projects })} /></Block>}
      {has('certifications') && <Block title="Certifications" icon="check"><CertsEditor items={data.certifications || []} onChange={(certifications) => onChange({ certifications })} /></Block>}
      {has('languages') && <Block title="Languages" icon="user"><LanguagesEditor items={data.languages || []} onChange={(languages) => onChange({ languages })} /></Block>}
      {has('awards') && <Block title="Awards and achievements" icon="sparkles"><ChipInput items={data.awards || []} onChange={(awards) => onChange({ awards })} placeholder="Add an award, press Enter" /></Block>}
      {has('referees') && <Block title="Referees" icon="mail"><RefereesEditor items={data.referees || []} onChange={(referees) => onChange({ referees })} /></Block>}
    </>
  );
}
