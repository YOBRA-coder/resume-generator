import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store.js';
import { go } from '../lib/router.js';
import ContentEditor, { Block } from './ContentEditor.jsx';
import { Icon, TextInput, TextArea, Busy } from './ui.jsx';
import { extractText } from '../lib/extract.js';
import { parseResumeText } from '../engine/resumeParser.js';
import { sampleProfile } from '../engine/sample.js';
import { detectRole, ROLES } from '../engine/roles.js';
import { emptyProfile, profileCompleteness } from '../engine/profileUtils.js';

const STEPS = [['start', 'Start'], ['about', 'About you'], ['work', 'Experience'], ['edu', 'Education'], ['skills', 'Skills & extras']];

function Import({ onDone }) {
  const profile = useStore((s) => s.profile); const replace = useStore((s) => s.replaceProfile); const toast = useStore((s) => s.toast);
  const [text, setText] = useState(''); const [busy, setBusy] = useState(''); const [over, setOver] = useState(false); const [found, setFound] = useState(null); const [err, setErr] = useState('');
  const input = useRef(null);
  const hasData = profile.experience.length || profile.education.length || profile.basics.name;
  const [mode, setMode] = useState(hasData ? 'add' : 'replace');

  const readFile = async (f) => {
    if (!f) return; setErr(''); setBusy(`Reading ${f.name}`);
    try { const t = await extractText(f); setText(t); parse(t); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const parse = (t = text) => { setErr(''); if (t.trim().length < 40) { setErr('Paste more text first, or upload a file.'); return; } setFound(parseResumeText(t)); };
  const apply = () => {
    const f = found; const base = mode === 'replace' ? emptyProfile() : profile;
    const merged = { ...base,
      basics: { ...base.basics, ...Object.fromEntries(Object.entries(f.basics).filter(([k, v]) => v && (mode === 'replace' || !base.basics[k]))), photo: base.basics.photo },
      summary: base.summary || f.summary, targetRole: base.targetRole || f.basics.headline,
      experience: [...base.experience, ...f.experience], education: [...base.education, ...f.education],
      skills: [...new Set([...base.skills, ...f.skills])], projects: [...base.projects, ...f.projects], certifications: [...base.certifications, ...f.certifications],
      languages: [...base.languages, ...f.languages.filter((l) => !base.languages.some((x) => x.name === l.name))], awards: [...new Set([...base.awards, ...f.awards])],
    };
    replace(merged); toast('Imported. Please check each step.'); onDone();
  };
  return (
    <div className="stack">
      {busy && <Busy text={busy} />}
      <div className={`drop ${over ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files?.[0]); }}>
        <Icon name="upload" width="28" height="28" />
        <h3 style={{ fontSize: 18, margin: '8px 0 4px' }}>Upload your old resume</h3>
        <p className="muted small" style={{ marginBottom: 12 }}>PDF, DOCX or TXT. It is read on your device and never uploaded.</p>
        <button className="btn" onClick={() => input.current?.click()}>Choose a file</button>
        <input ref={input} type="file" hidden accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <TextArea label="Or paste your LinkedIn profile or resume text" rows={7} value={text} onChange={(v) => { setText(v); setFound(null); }} placeholder={'On LinkedIn: open your profile → More → Save to PDF, then upload that PDF above, or copy the text and paste it here.'} />
      {err && <div className="alert bad" role="alert"><Icon name="alert" />{err}</div>}
      {!found && <div className="row"><button className="btn primary" onClick={() => parse()} disabled={!text.trim()}><Icon name="wand" />Read this text</button></div>}
      {found && (
        <div className="stack">
          <div className="alert ok"><Icon name="check" /><div><b>Found:</b> {found.basics.name || 'no name'}, {found.stats.experience} job{found.stats.experience === 1 ? '' : 's'}, {found.stats.education} education entr{found.stats.education === 1 ? 'y' : 'ies'}, {found.stats.skills} skills.<br />You can fix anything in the next steps.</div></div>
          {found.warnings.map((w) => <div key={w} className="alert warn"><Icon name="info" />{w}</div>)}
          {hasData && <div className="row wrap"><span className="small">You already have details saved.</span><div className="seg"><button aria-pressed={mode === 'add'} onClick={() => setMode('add')}>Add to them</button><button aria-pressed={mode === 'replace'} onClick={() => setMode('replace')}>Replace them</button></div></div>}
          <div className="row"><button className="btn primary" onClick={apply}>Use this and continue</button><button className="btn ghost" onClick={() => setFound(null)}>Read again</button></div>
        </div>
      )}
    </div>
  );
}

export default function Profile({ onboarding }) {
  const profile = useStore((s) => s.profile); const hasProfile = useStore((s) => s.hasProfile); const setProfile = useStore((s) => s.setProfile); const replace = useStore((s) => s.replaceProfile);
  const [step, setStep] = useState(hasProfile && profile.basics.name ? 'about' : 'start');
  const idx = STEPS.findIndex(([id]) => id === step);
  const role = useMemo(() => detectRole(profile.targetRole || profile.basics.headline || '', profile.skills.join(' ')), [profile.targetRole, profile.basics.headline, profile.skills]);
  const suggestions = useMemo(() => [...role.skills, ...role.soft], [role]);
  const pct = profileCompleteness(profile);
  const next = () => (idx < STEPS.length - 1 ? setStep(STEPS[idx + 1][0]) : go('/new'));
  const patch = (p) => setProfile((prev) => ({ ...prev, ...p }));
  return (
    <div className="page-pad wizard">
      <div className="page-head"><div><h1>{onboarding ? 'Set up your master profile' : 'Master profile'}</h1><p>Enter your background once. Every resume and cover letter is built from it, so you only add the basics and the rest is written for you.</p></div><span className="badge ok"><i />{pct}% complete</span></div>
      <nav className="steps" aria-label="Steps">{STEPS.map(([id, label], i) => <button key={id} aria-current={id === step ? 'step' : undefined} className={i < idx ? 'done' : ''} onClick={() => setStep(id)}>{label}</button>)}</nav>
      <div className="card pad">
        {step === 'start' && (
          <div className="stack">
            <Import onDone={() => setStep('about')} />
            <div className="row wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <button className="btn" onClick={() => setStep('about')}>Start from scratch</button>
              <button className="btn" onClick={() => { replace(sampleProfile()); setStep('about'); }}><Icon name="sparkles" />Try with sample data</button>
            </div>
          </div>
        )}
        {step === 'about' && (
          <div className="stack">
            <div>
              <TextInput label="What job are you aiming for?" value={profile.targetRole} onChange={(v) => patch({ targetRole: v })} placeholder="e.g. Frontend Developer, Accountant, Nurse" list="roles" hint="This helps us suggest skills and write your bullet points. You can change it for each job later." />
              <datalist id="roles">{ROLES.filter((r) => r.id !== 'general').map((r) => <option key={r.id} value={r.label} />)}</datalist>
            </div>
            <ContentEditor mode="master" show={['basics']} data={profile} onChange={patch} />
          </div>
        )}
        {step === 'work' && <div className="stack"><p className="muted small">Add each job, internship or freelance work. Just a title, company and dates is enough. Add rough notes and we’ll write the bullets, or tap “Suggest bullets”.</p><ContentEditor mode="master" show={['experience']} data={profile} onChange={patch} /></div>}
        {step === 'edu' && <ContentEditor mode="master" show={['education']} data={profile} onChange={patch} />}
        {step === 'skills' && (
          <div className="stack">
            <div className="alert"><Icon name="info" /><span>Suggestions for <b>{role.label}</b>. Only add skills you genuinely have; employers will ask about them.</span></div>
            <ContentEditor mode="master" show={['skills', 'languages', 'certifications', 'projects', 'referees']} data={profile} onChange={patch} suggestions={suggestions} />
          </div>
        )}
      </div>
      {step !== 'start' && (
        <div className="row spread" style={{ marginTop: 18 }}>
          <button className="btn" onClick={() => setStep(STEPS[Math.max(0, idx - 1)][0])}>Back</button>
          <button className="btn primary lg" onClick={next}>{idx === STEPS.length - 1 ? 'Create my first application' : 'Continue'}</button>
        </div>
      )}
    </div>
  );
}
