import { useRef, useState } from 'react';
import { useStore } from '../store.js';
import { Modal, Switch, Seg, Icon, TextInput } from './ui.jsx';
import { download } from '../lib/exporters.js';
import { TONES } from '../engine/summary.js';

export default function Settings({ onClose }) {
  const s = useStore((x) => x.settings); const set = useStore((x) => x.setSettings); const ai = useStore((x) => x.ai); const online = useStore((x) => x.online);
  const exportAll = useStore((x) => x.exportAll); const importAll = useStore((x) => x.importAll); const wipe = useStore((x) => x.wipeAll); const toast = useStore((x) => x.toast);
  const persistent = useStore((x) => x.persistent); const installEvent = useStore((x) => x.installEvent);
  const file = useRef(null); const [confirmWipe, setConfirmWipe] = useState(false);
  const aiState = !online ? ['warn', 'Offline. Using the built-in engine.'] : ai.ai ? ['ai', ai.needsCode && !s.accessCode ? 'AI available. Enter the access code.' : 'AI polish is available.'] : ['', 'No AI key on the server. The built-in engine does everything offline.'];
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="stack">
        <div className="field"><span className="label">Theme</span><Seg label="Theme" value={s.theme} onChange={(v) => set({ theme: v })} options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]} /></div>
        <div className="field"><span className="label">Spelling</span><Seg label="Spelling" value={s.locale} onChange={(v) => set({ locale: v })} options={[['uk', 'British (organise)'], ['us', 'American (organize)']]} /></div>
        <div className="field"><span className="label">Default tone</span><Seg label="Tone" value={s.tone} onChange={(v) => set({ tone: v })} options={Object.entries(TONES)} /></div>
        <div className="stack-sm" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <span className="label">AI engine</span>
          <Switch checked={s.ai} onChange={(v) => set({ ai: v })} label="Use AI polish when available" />
          <span className={`badge ${aiState[0]}`} style={{ alignSelf: 'flex-start' }}><i />{aiState[1]}</span>
          {ai.needsCode && <TextInput label="Access code" type="password" value={s.accessCode} onChange={(v) => set({ accessCode: v })} hint="Set by whoever hosts this app." />}
          <p className="hint">The offline engine always runs first. AI only rewrites wording, and anything containing numbers you didn’t provide is discarded.</p>
        </div>
        <div className="stack-sm" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <span className="label">Your data</span>
          <p className="hint">{persistent ? 'Saved in this browser on this device. Nothing is uploaded unless you use AI polish.' : 'Storage is blocked in this window, so nothing is being saved. Export a backup.'}</p>
          <div className="row wrap">
            <button className="btn" onClick={() => { download(`resume-pro-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([exportAll()], { type: 'application/json' })); }}><Icon name="download" />Export backup</button>
            <button className="btn" onClick={() => file.current?.click()}><Icon name="upload" />Import backup</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const n = await importAll(await f.text()); toast(`Restored profile and ${n} application${n === 1 ? '' : 's'}`); } catch (err) { toast(err.message || 'Could not read that backup'); } }} />
            {installEvent && <button className="btn" onClick={() => installEvent.prompt()}><Icon name="download" />Install app</button>}
          </div>
          {!confirmWipe ? <button className="btn danger" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmWipe(true)}><Icon name="trash" />Delete all my data</button>
            : <div className="alert bad"><Icon name="alert" /><div>This removes your profile and every application from this device.<div className="row" style={{ marginTop: 8 }}><button className="btn danger sm" onClick={async () => { await wipe(); setConfirmWipe(false); onClose(); location.hash = '#/'; }}>Yes, delete everything</button><button className="btn sm" onClick={() => setConfirmWipe(false)}>Cancel</button></div></div></div>}
        </div>
      </div>
    </Modal>
  );
}
