import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.js';

const P = {
  plus: 'M12 5v14M5 12h14', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3', copy: 'M9 9h10v11H9zM5 15V4h10', pencil: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z', download: 'M12 4v11M7 11l5 5 5-5M5 20h14', upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  check: 'M5 12.5l4.5 4.5L19 7', x: 'M6 6l12 12M18 6L6 18', chevR: 'M9 6l6 6-6 6', chevD: 'M6 9l6 6 6-6', chevU: 'M6 15l6-6 6 6', arrowUp: 'M12 19V5M6 11l6-6 6 6', arrowDown: 'M12 5v14M6 13l6 6 6-6',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5', settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L5.5 8.5 3.5 8l-1 3 2 1v2l-2 1 1 3 2-.5 1.5 1.5-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  wifiOff: 'M3 3l18 18M5 12.5a10 10 0 015-2.7M9 16a5 5 0 016-1M12 20h.01M16.5 10.2A10 10 0 0119 12.5', image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z', eyeOff: 'M3 3l18 18M10.6 6.1A9 9 0 0112 6c6 0 10 6 10 6a17 17 0 01-3 3.7M6.6 6.7A16 16 0 002 12s4 6 10 6a9 9 0 004-1',
  refresh: 'M20 11a8 8 0 00-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0014.5 3.5L20 15M20 20v-5h-5', printer: 'M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z', briefcase: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18', cap: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6', target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01', mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  layout: 'M3 4h18v16H3zM3 9h18M9 9v11', list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01', alert: 'M12 3l10 18H2zM12 10v5M12 18h.01', info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01', wand: 'M4 20L16 8M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z',
  dots: 'M5 12h.01M12 12h.01M19 12h.01', save: 'M5 3h12l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7', cloud: 'M7 18a4 4 0 010-8 5 5 0 019.6-1A4.5 4.5 0 0117 18z', clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2', home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3', external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
};
export function Icon({ name, ...rest }) { return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" {...rest}><path d={P[name] || ''} /></svg>; }

export function Field({ label, hint, children, id }) {
  return <div className="field">{label && <label htmlFor={id}>{label}</label>}{children}{hint && <span className="hint">{hint}</span>}</div>;
}
export function TextInput({ label, hint, value, onChange, ...p }) {
  const id = useRef('f' + Math.random().toString(36).slice(2, 8)).current;
  return <Field label={label} hint={hint} id={id}><input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} /></Field>;
}
export function TextArea({ label, hint, value, onChange, rows, ...p }) {
  const id = useRef('f' + Math.random().toString(36).slice(2, 8)).current;
  return <Field label={label} hint={hint} id={id}><textarea id={id} className="textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} /></Field>;
}
export function Switch({ checked, onChange, label }) {
  return <label className="row" style={{ cursor: 'pointer' }}><span className="switch"><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} /><span /></span><span className="small">{label}</span></label>;
}
export function Seg({ value, onChange, options, label }) {
  return <div className="seg" role="group" aria-label={label}>{options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
export function Tabs({ value, onChange, tabs }) {
  return <div className="tabs" role="tablist">{tabs.map(([id, label, icon]) => <button key={id} className="tab" role="tab" aria-selected={value === id} onClick={() => onChange(id)}>{icon && <Icon name={icon} width="15" height="15" />}{label}</button>)}</div>;
}

/** Chip list with add-by-typing (Enter or comma). */
export function ChipInput({ items, onChange, placeholder = 'Type and press Enter', suggestions = [] }) {
  const [v, setV] = useState('');
  const add = (raw) => { const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (!parts.length) return; const have = new Set(items.map((s) => s.toLowerCase())); onChange([...items, ...parts.filter((p) => !have.has(p.toLowerCase()))]); setV(''); };
  const sugg = suggestions.filter((s) => !items.some((i) => i.toLowerCase() === s.toLowerCase())).slice(0, 12);
  return (
    <div className="stack-sm">
      <div className="chips">{items.map((s, i) => <span key={s + i} className="chip">{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="x" width="13" height="13" /></button></span>)}</div>
      <input className="input" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => add(v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(v); } else if (e.key === 'Backspace' && !v && items.length) onChange(items.slice(0, -1)); }} aria-label="Add skill" />
      {sugg.length > 0 && <div className="chips" aria-label="Suggestions">{sugg.map((s) => <button key={s} type="button" className="chip suggest" onClick={() => onChange([...items, s])}>+ {s}</button>)}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  const ref = useRef(null);
  useEffect(() => { const f = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); ref.current?.focus(); return () => window.removeEventListener('keydown', f); }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="row spread" style={{ marginBottom: 12 }}><h2>{title}</h2><button className="btn ghost icon-only" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        {children}
        {footer && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts); const dismiss = useStore((s) => s.dismissToast);
  return <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className="toast">{t.message}{t.action && <button onClick={() => { t.onAction?.(); dismiss(t.id); }}>{t.action}</button>}</div>)}</div>;
}
export function Busy({ text }) { return <div className="busy" role="alert" aria-live="assertive"><div className="box"><div className="spinner" /><b>{text}</b><p className="muted small" style={{ marginTop: 4 }}>This takes a few seconds.</p></div></div>; }

export function SaveIndicator() {
  const save = useStore((s) => s.save); const persistent = useStore((s) => s.persistent);
  if (!persistent) return <span className="save-ind err" title="Storage is blocked in this browser window. Export a backup to keep your work.">Not saved (private mode)</span>;
  if (save.state === 'saving') return <span className="save-ind">Saving…</span>;
  if (save.state === 'saved') return <span className="save-ind"><Icon name="check" width="14" height="14" /> Saved</span>;
  if (save.state === 'error') return <span className="save-ind err">Save failed</span>;
  return <span className="save-ind" />;
}
