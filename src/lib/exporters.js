import { formatRange, formatDate, bulletText } from '../engine/profileUtils.js';
import { SECTION_LABELS, DEFAULT_ORDER } from '../components/doc/ResumeDoc.jsx';

export function download(filename, blob) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
export const safeName = (s) => (s || 'resume').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'resume';
export const fileBase = (app) => safeName([app.resume?.basics?.name, app.company || app.jobTitle].filter(Boolean).join(' '));

const sectionOrder = (r) => (r.sectionOrder?.length ? r.sectionOrder : DEFAULT_ORDER).filter((id) => !(r.hidden || []).includes(id));

/** Plain-text resume (what an ATS sees). */
export function resumeToText(app) {
  const r = app.resume, b = r.basics, L = [];
  L.push((b.name || '').toUpperCase()); if (b.headline) L.push(b.headline);
  L.push([b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean).join(' | '), '');
  for (const id of sectionOrder(r)) {
    const h = SECTION_LABELS[id].toUpperCase();
    if (id === 'summary' && r.summary) L.push(h, r.summary, '');
    if (id === 'skills' && r.skills?.length) L.push(h, r.skills.join(', '), '');
    if (id === 'experience' && r.experience?.some((e) => !e.hidden)) { L.push(h); for (const e of r.experience.filter((x) => !x.hidden)) { L.push(`${e.role}${e.company ? `, ${e.company}` : ''}${e.location ? `, ${e.location}` : ''} (${formatRange(e.start, e.end, e.current)})`); (e.bullets || []).forEach((x) => L.push(`- ${bulletText(x)}`)); L.push(''); } }
    if (id === 'projects' && r.projects?.some((p) => p.name)) { L.push(h); r.projects.filter((p) => p.name).forEach((p) => L.push(`${p.name}${p.tech ? ` (${p.tech})` : ''}${p.link ? ` - ${p.link}` : ''}`, p.description || '', '')); }
    if (id === 'education' && r.education?.length) { L.push(h); r.education.forEach((e) => L.push(`${[e.degree, e.field].filter(Boolean).join(' in ')}${e.school ? `, ${e.school}` : ''} (${[formatDate(e.start), formatDate(e.end)].filter(Boolean).join(' - ')})`)); L.push(''); }
    if (id === 'certifications' && r.certifications?.some((c) => c.name)) { L.push(h); r.certifications.filter((c) => c.name).forEach((c) => L.push([c.name, c.issuer, c.year].filter(Boolean).join(', '))); L.push(''); }
    if (id === 'languages' && r.languages?.some((l) => l.name)) L.push(h, r.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', '), '');
    if (id === 'awards' && r.awards?.length) L.push(h, ...r.awards, '');
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
export function coverToText(app) {
  const c = app.cover, b = app.resume.basics;
  return [b.name, [b.email, b.phone].filter(Boolean).join(' | '), '', c.date || '', [app.recipient, app.company].filter(Boolean).join('\n'), '', c.greeting, '', ...(c.paragraphs || []).flatMap((p) => [p, '']), c.signoff, b.name].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** ATS-safe DOCX: real headings, real bullets, no tables or text boxes. Library is lazy-loaded. */
export async function resumeToDocx(app) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, BorderStyle } = await import('docx');
  const r = app.resume, b = r.basics, accent = (app.design?.accent || '#0b7a68').replace('#', '');
  const font = app.design?.font === 'serif' || ['corporate', 'executive'].includes(app.design?.template) ? 'Georgia' : 'Calibri';
  const kids = [];
  const run = (text, o = {}) => new TextRun({ text, font, size: 21, ...o });
  kids.push(new Paragraph({ children: [run(b.name || '', { bold: true, size: 40, color: accent })], spacing: { after: 40 } }));
  if (b.headline) kids.push(new Paragraph({ children: [run(b.headline, { size: 24 })], spacing: { after: 40 } }));
  kids.push(new Paragraph({ children: [run([b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean).join('  |  '), { size: 19, color: '555555' })], spacing: { after: 160 } }));
  const H = (t) => new Paragraph({ children: [run(t, { bold: true, size: 23, color: accent })], spacing: { before: 200, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D0D8', space: 2 } }, keepNext: true });
  const bullet = (t) => new Paragraph({ children: [run(t)], bullet: { level: 0 }, spacing: { after: 30 } });
  for (const id of sectionOrder(r)) {
    if (id === 'summary' && r.summary) kids.push(H(SECTION_LABELS[id]), new Paragraph({ children: [run(r.summary)], spacing: { after: 80 } }));
    if (id === 'skills' && r.skills?.length) kids.push(H(SECTION_LABELS[id]), new Paragraph({ children: [run(r.skills.join('  •  '))], spacing: { after: 80 } }));
    if (id === 'experience' && r.experience?.some((e) => !e.hidden)) {
      kids.push(H('Experience'));
      for (const e of r.experience.filter((x) => !x.hidden)) {
        kids.push(new Paragraph({ children: [run(e.role || e.company, { bold: true }), ...(e.role && e.company ? [run(`  ${e.company}${e.location ? `, ${e.location}` : ''}`, { color: '555555' })] : []), run(`\t${formatRange(e.start, e.end, e.current)}`, { color: '555555' })], tabStops: [{ type: TabStopType.RIGHT, position: 10300 }], spacing: { before: 100, after: 30 }, keepNext: true }));
        (e.bullets || []).forEach((x) => kids.push(bullet(bulletText(x))));
      }
    }
    if (id === 'projects' && r.projects?.some((p) => p.name)) { kids.push(H('Projects')); r.projects.filter((p) => p.name).forEach((p) => kids.push(new Paragraph({ children: [run(p.name, { bold: true }), run(p.tech ? `  ${p.tech}` : '', { color: '555555' })], spacing: { before: 80, after: 20 }, keepNext: true }), new Paragraph({ children: [run(p.description || '')], spacing: { after: 60 } }))); }
    if (id === 'education' && r.education?.length) { kids.push(H('Education')); r.education.forEach((e) => kids.push(new Paragraph({ children: [run([e.degree, e.field].filter(Boolean).join(' in ') || e.school, { bold: true }), run(e.degree && e.school ? `  ${e.school}` : '', { color: '555555' }), run(`\t${[formatDate(e.start), formatDate(e.end)].filter(Boolean).join(' – ')}`, { color: '555555' })], tabStops: [{ type: TabStopType.RIGHT, position: 10300 }], spacing: { before: 60, after: 30 } }))); }
    if (id === 'certifications' && r.certifications?.some((c) => c.name)) { kids.push(H('Certifications')); r.certifications.filter((c) => c.name).forEach((c) => kids.push(bullet([c.name, c.issuer, c.year].filter(Boolean).join(', ')))); }
    if (id === 'languages' && r.languages?.some((l) => l.name)) kids.push(H('Languages'), new Paragraph({ children: [run(r.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', '))] }));
    if (id === 'awards' && r.awards?.length) { kids.push(H('Awards')); r.awards.forEach((a) => kids.push(bullet(a))); }
  }
  const paper = app.design?.paper === 'letter' ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
  const doc = new Document({ creator: b.name || 'Resume Generator Pro', title: `${b.name || ''} Resume`, sections: [{ properties: { page: { size: paper, margin: { top: 760, bottom: 760, left: 850, right: 850 } } }, children: kids }] });
  return Packer.toBlob(doc);
}
export async function coverToDocx(app) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const c = app.cover, b = app.resume.basics; const font = 'Calibri';
  const P = (t, o = {}, after = 160) => new Paragraph({ children: [new TextRun({ text: t, font, size: 22, ...o })], spacing: { after } });
  const kids = [P(b.name || '', { bold: true, size: 32 }, 40), P([b.email, b.phone, b.location].filter(Boolean).join('  |  '), { size: 19, color: '555555' }, 280), P(c.date ? new Date(c.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '', {}, 120)];
  [app.recipient, app.company].filter(Boolean).forEach((l) => kids.push(P(l, {}, 0)));
  kids.push(P('', {}, 120), P(c.greeting || 'Dear Hiring Manager,'), ...(c.paragraphs || []).map((p) => P(p)), P(c.signoff || 'Kind regards,', {}, 480), P(b.name || '', { bold: true }));
  return Packer.toBlob(new Document({ creator: b.name || 'Resume Generator Pro', sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } }, children: kids }] }));
}
