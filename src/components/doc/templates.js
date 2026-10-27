export const TEMPLATES = [
  { id: 'modern', name: 'Modern', note: 'Accent headings, clean sans', font: 'sans', accent: '#0b7a68' },
  { id: 'corporate', name: 'Corporate', note: 'Classic serif, centred header', font: 'serif', accent: '#1f2a44' },
  { id: 'minimal', name: 'Minimal', note: 'Quiet, spacious, no rules', font: 'sans', accent: '#374151' },
  { id: 'creative', name: 'Creative', note: 'Colour header band', font: 'display', accent: '#c2410c' },
  { id: 'executive', name: 'Executive', note: 'Serif with double rule', font: 'serif', accent: '#7a1f2b' },
  { id: 'compact', name: 'Compact', note: 'Dense, fits more on a page', font: 'sans', accent: '#2563eb' },
];
export const ACCENTS = ['#0b7a68', '#1f2a44', '#2563eb', '#6d28d9', '#c2410c', '#be123c', '#a16207', '#374151'];
export const FONTS = { sans: "'Geist Variable', 'Segoe UI', Arial, sans-serif", serif: "'Lora', Georgia, 'Times New Roman', serif", display: "'Bricolage Grotesque Variable', 'Geist Variable', Arial, sans-serif" };
export const PAPERS = { a4: { w: 210, h: 297, label: 'A4' }, letter: { w: 215.9, h: 279.4, label: 'US Letter' } };
export const MM = 96 / 25.4;
export const fontFor = (design) => FONTS[design.font === 'auto' || !design.font ? (TEMPLATES.find((t) => t.id === design.template)?.font || 'sans') : design.font];
