import { useMemo, useState } from 'react';
import { useStore } from '../store.js';
import { go } from '../lib/router.js';
import { generateApplication } from '../lib/generate.js';
import { parseJob } from '../engine/jobParser.js';
import { TextInput, TextArea, Icon, Busy, Seg } from './ui.jsx';
import { TONES } from '../engine/summary.js';

export default function NewApplication() {
  const profile = useStore((s) => s.profile); const settings = useStore((s) => s.settings); const ai = useStore((s) => s.ai); const online = useStore((s) => s.online);
  const addApp = useStore((s) => s.addApp); const toast = useStore((s) => s.toast);
  const [f, setF] = useState({ company: '', jobTitle: profile.targetRole || '', jobText: '', motivation: '', recipient: '', tone: settings.tone });
  const [busy, setBusy] = useState(''); const [more, setMore] = useState(false);
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const parsed = useMemo(() => (f.jobText.trim().length > 60 ? parseJob(f.jobText, { title: f.jobTitle }) : null), [f.jobText, f.jobTitle]);
  const useAI = settings.ai && ai.ai && online;
  const noProfile = !profile.basics.name;

  const create = async () => {
    setBusy('Analysing the job and your background');
    try {
      const opts = { ...f, company: f.company.trim() || parsed?.companyGuess || '', jobTitle: f.jobTitle.trim() || parsed?.titleGuess || profile.targetRole || '' };
      const { app, aiNote } = await generateApplication(profile, opts, settings, setBusy);
      await addApp(app); if (aiNote) toast(aiNote, { ms: 6000 });
      go(`/app/${app.id}`);
    } catch (e) { console.error(e); toast('Something went wrong while generating. Please try again.'); setBusy(''); }
  };
  return (
    <div className="page-pad wizard">
      {busy && <Busy text={busy} />}
      <div className="page-head"><div><h1>New application</h1><p>Tell us where you’re applying. We’ll tailor your resume and write a matching cover letter.</p></div>
        <span className={`badge ${useAI ? 'ai' : 'ok'}`}><i />{useAI ? 'AI polish on' : 'Offline engine'}</span></div>
      {noProfile && <div className="alert warn" style={{ marginBottom: 16 }}><Icon name="alert" /><span>Your master profile is empty. <a href="#/profile">Add your background first</a>, or generate anyway to see what the engine writes.</span></div>}
      <div className="card pad stack">
        <div className="grid2"><TextInput label="Company" value={f.company} onChange={(v) => set({ company: v })} placeholder={parsed?.companyGuess || 'e.g. Safaricom'} /><TextInput label="Job title" value={f.jobTitle} onChange={(v) => set({ jobTitle: v })} placeholder={parsed?.titleGuess || 'e.g. Frontend Developer'} /></div>
        <TextArea label="Job description" rows={10} value={f.jobText} onChange={(v) => set({ jobText: v })} placeholder="Paste the full job ad here. We pull out the skills and keywords it asks for and match them to your background." hint="Optional but recommended. Without it you get a good general resume for the job title." />
        {parsed && (
          <div className="alert ok"><Icon name="target" /><div><b>Found in the ad:</b> {[...parsed.hardSkills, ...parsed.softSkills].slice(0, 10).map((s) => s.name).join(', ') || 'no skills detected'}{parsed.yearsRequired ? ` · ${parsed.yearsRequired}+ years asked` : ''}{parsed.mission.length ? ' · company mission detected' : ''}</div></div>
        )}
        <TextArea label="Why this company? (one or two lines)" rows={3} value={f.motivation} onChange={(v) => set({ motivation: v })} placeholder="e.g. I use their app daily and want to help small shops get paid faster." hint="This is what makes the cover letter personal. We never invent a reason for you." />
        <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)}><Icon name={more ? 'chevU' : 'chevD'} width="15" height="15" />{more ? 'Fewer options' : 'More options'}</button>
        {more && <div className="stack"><TextInput label="Hiring manager (optional)" value={f.recipient} onChange={(v) => set({ recipient: v })} placeholder="e.g. Ms. Njeri Kamau" /><div className="field"><span className="label">Tone</span><Seg label="Tone" value={f.tone} onChange={(v) => set({ tone: v })} options={Object.entries(TONES)} /></div></div>}
        <div className="row spread" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <span className="hint">{useAI ? 'Your details are sent to the AI service only to write this application.' : 'Everything is generated on your device.'}</span>
          <button className="btn primary lg" onClick={create}><Icon name="sparkles" />Generate resume and cover letter</button>
        </div>
      </div>
    </div>
  );
}
