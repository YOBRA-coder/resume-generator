// Client-side text extraction (works offline). Parsers are lazy-loaded so the first paint stays fast.
const MAX = 8 * 1024 * 1024;

export async function extractText(file) {
  if (file.size > MAX) throw new Error('That file is larger than 8 MB. Try a smaller export of your resume.');
  const name = file.name.toLowerCase();
  if (/\.pdf$/.test(name) || file.type === 'application/pdf') return extractPdf(file);
  if (/\.docx$/.test(name)) return extractDocx(file);
  if (/\.(txt|md|text)$/.test(name) || file.type.startsWith('text/')) return file.text();
  if (/\.doc$/.test(name)) throw new Error('Old .doc files are not supported. Save it as .docx or PDF and try again.');
  throw new Error('Upload a PDF, DOCX or TXT file.');
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let p = 1; p <= Math.min(doc.numPages, 12); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = [];
    for (const it of content.items) {
      if (!('str' in it)) continue;
      const y = Math.round(it.transform[5] / 3) * 3, x = it.transform[4];
      let row = rows.find((r) => Math.abs(r.y - y) <= 3);
      if (!row) { row = { y, parts: [] }; rows.push(row); }
      row.parts.push({ x, s: it.str, w: it.width || 0 });
    }
    rows.sort((a, b) => b.y - a.y);
    pages.push(rows.map((r) => {
      r.parts.sort((a, b) => a.x - b.x);
      let line = '', end = null;
      for (const part of r.parts) { if (end != null && part.x - end > 14) line += '  '; else if (end != null && part.x - end > 1.5 && !/\s$/.test(line) && !/^\s/.test(part.s)) line += ' '; line += part.s; end = part.x + part.w; }
      return line.trimEnd();
    }).filter((l, i, arr) => l.trim() || (arr[i - 1] || '').trim()).join('\n'));
  }
  const text = pages.join('\n\n').trim();
  if (text.replace(/\s/g, '').length < 40) throw new Error('This PDF has no selectable text (it may be a scan). Paste the text instead, or export a text-based PDF.');
  return text;
}

async function extractDocx(file) {
  const mammoth = (await import('mammoth')).default || (await import('mammoth'));
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const text = html.replace(/<li[^>]*>/gi, '\n• ').replace(/<\/(p|li|h\d|tr)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<\/td>/gi, '  ').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 40) throw new Error('Could not read any text from this DOCX.');
  return text;
}
