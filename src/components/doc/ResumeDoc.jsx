import { formatRange, formatDate, bulletText } from '../../engine/profileUtils.js';

export const SECTION_LABELS = { summary: 'Profile', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications', languages: 'Languages', awards: 'Awards', referees: 'Referees' };
export const DEFAULT_ORDER = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages', 'awards', 'referees'];

const link = (u) => (/^https?:/i.test(u) ? u : `https://${u}`);

export function Header({ basics, design, headline }) {
  const b = basics || {};
  const parts = [];
  if (b.email) parts.push(<a key="e" href={`mailto:${b.email}`}>{b.email}</a>);
  if (b.phone) parts.push(<span key="p">{b.phone}</span>);
  if (b.location) parts.push(<span key="l">{b.location}</span>);
  for (const [k, v] of [['w', b.website], ['li', b.linkedin], ['gh', b.github]]) if (v) parts.push(<a key={k} href={link(v)}>{v.replace(/^https?:\/\/(www\.)?/, '')}</a>);
  return (
    <header className="hd">
      <div className="hd-text">
        <h1>{b.name || 'Your Name'}</h1>
        {(headline ?? b.headline) && <p className="headline">{headline ?? b.headline}</p>}
        <p className="contact">{parts.map((p, i) => <span key={i}>{i > 0 && <span className="sep"> | </span>}{p}</span>)}</p>
      </div>
      {design?.showPhoto && b.photo && <img className={`photo ${design.photoShape || 'circle'}`} src={b.photo} alt={`Photo of ${b.name || 'candidate'}`} />}
    </header>
  );
}

const SH = ({ children }) => <h2 className="sh">{children}</h2>;
const Bullets = ({ items }) => <ul>{items.map((b) => <li key={b.id || bulletText(b)}>{bulletText(b)}</li>)}</ul>;
const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

/** Turn the resume object into paginatable units (heading + first entry stay together). */
export function buildResumeUnits(resume, design) {
  const units = [{ key: 'header', node: <Header basics={resume.basics} design={design} />, cls: 'u-header' }];
  const order = (resume.sectionOrder?.length ? resume.sectionOrder : DEFAULT_ORDER);
  const hidden = new Set(resume.hidden || []);
  const heading = (id, label) => units.push({ key: `h-${id}`, node: <SH>{label || SECTION_LABELS[id]}</SH>, glue: true, cls: 'u-sh' });

  for (const id of order) {
    if (hidden.has(id)) continue;
    if (id === 'summary' && hasText(resume.summary)) { heading(id); units.push({ key: 'summary', node: <p className="summary">{resume.summary}</p>, cls: 'u-last' }); }
    if (id === 'skills' && resume.skills?.length) { heading(id); units.push({ key: 'skills', node: <p className="skills">{resume.skills.map((s, i) => <span key={s + i}>{i > 0 && <span className="sep"> • </span>}{s}</span>)}</p>, cls: 'u-last' }); }
    if (id === 'experience') {
      const items = (resume.experience || []).filter((e) => !e.hidden && (e.company || e.role));
      if (items.length) heading(id);
      items.forEach((e, ei) => {
        const bl = (e.bullets || []).filter((b) => bulletText(b).trim());
        const head = (
          <article className="entry">
            <div className="eh">
              <div className="et"><h3>{e.role || e.company}</h3>{e.role && e.company && <span className="ec">{e.company}{e.location ? `, ${e.location}` : ''}</span>}</div>
              <span className="ed">{formatRange(e.start, e.end, e.current)}</span>
            </div>
            {bl.length > 0 && <Bullets items={bl.slice(0, 2)} />}
          </article>
        );
        units.push({ key: `e-${e.id}`, node: head, glue: bl.length > 2 ? false : false, cls: bl.length <= 2 ? 'u-last' : 'u-entry' });
        bl.slice(2).forEach((b, bi, arr) => units.push({ key: `e-${e.id}-b${b.id || bi}`, node: <ul className="cont"><li>{bulletText(b)}</li></ul>, cls: bi === arr.length - 1 ? 'u-last u-bullet' : 'u-bullet' }));
        void ei;
      });
    }
    if (id === 'projects') {
      const items = (resume.projects || []).filter((p) => p.name);
      if (items.length) heading(id);
      items.forEach((p) => units.push({ key: `p-${p.id}`, cls: 'u-last', node: (
        <article className="entry"><div className="eh"><div className="et"><h3>{p.name}</h3>{p.tech && <span className="ec">{p.tech}</span>}</div>{p.link && <span className="ed"><a href={link(p.link)}>{p.link.replace(/^https?:\/\/(www\.)?/, '')}</a></span>}</div>{p.description && <p>{p.description}</p>}</article>) }));
    }
    if (id === 'education') {
      const items = (resume.education || []).filter((e) => e.school || e.degree);
      if (items.length) heading(id);
      items.forEach((e) => units.push({ key: `ed-${e.id}`, cls: 'u-last', node: (
        <article className="entry"><div className="eh"><div className="et"><h3>{[e.degree, e.field].filter(Boolean).join(' in ') || e.school}</h3>{e.degree && e.school && <span className="ec">{e.school}</span>}</div><span className="ed">{[formatDate(e.start), formatDate(e.end)].filter(Boolean).join(' – ')}</span></div>{(e.grade || e.notes) && <p className="muted">{[e.grade, e.notes].filter(Boolean).join(' · ')}</p>}</article>) }));
    }
    if (id === 'certifications' && resume.certifications?.some((c) => c.name)) {
      heading(id);
      units.push({ key: 'certs', cls: 'u-last', node: <ul>{resume.certifications.filter((c) => c.name).map((c) => <li key={c.id}>{[c.name, c.issuer, c.year].filter(Boolean).join(', ')}</li>)}</ul> });
    }
    if (id === 'languages' && resume.languages?.some((l) => l.name)) {
      heading(id);
      units.push({ key: 'langs', cls: 'u-last', node: <p>{resume.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', ')}</p> });
    }
    if (id === 'awards' && resume.awards?.length) { heading(id); units.push({ key: 'awards', cls: 'u-last', node: <ul>{resume.awards.map((a, i) => <li key={i}>{a}</li>)}</ul> }); }
    if (id === 'referees' && resume.referees?.some((r) => r.name)) {
      heading(id);
      units.push({ key: 'refs', cls: 'u-last', node: <div className="refs">{resume.referees.filter((r) => r.name).map((r) => <p key={r.id}><strong>{r.name}</strong>{[r.title, r.company].filter(Boolean).length ? `, ${[r.title, r.company].filter(Boolean).join(', ')}` : ''}{[r.phone, r.email].filter(Boolean).length ? ` | ${[r.phone, r.email].filter(Boolean).join(' | ')}` : ''}</p>)}</div> });
    }
  }
  return units;
}

export function buildCoverUnits(app, design) {
  const c = app.cover || {}, b = app.resume?.basics || {};
  const date = c.date ? formatLong(c.date) : '';
  const units = [{ key: 'header', node: <Header basics={b} design={design} headline={app.resume?.basics?.headline} />, cls: 'u-header' }];
  const to = [app.recipient, app.company].filter(Boolean);
  units.push({ key: 'meta', cls: 'u-last u-meta', node: <div className="letter-meta">{date && <p>{date}</p>}{to.length > 0 && <p>{to.map((t, i) => <span key={i}>{t}<br /></span>)}</p>}</div> });
  units.push({ key: 'greet', node: <p className="greet">{c.greeting || 'Dear Hiring Manager,'}</p>, glue: true, cls: 'u-last' });
  (c.paragraphs || []).forEach((p, i) => p?.trim() && units.push({ key: `lp${i}`, node: <p className="lp">{p}</p>, cls: 'u-last u-lp' }));
  units.push({ key: 'sign', cls: 'u-sign', node: <div className="signoff"><p>{c.signoff || 'Kind regards,'}</p><p className="signame">{b.name}</p></div> });
  return units;
}
const formatLong = (iso) => { try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } };
