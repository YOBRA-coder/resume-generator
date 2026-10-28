# Resume Generator Pro

Tailored, ATS-friendly resumes and cover letters. Add your background once, paste a job ad, get both documents.
React + Vite PWA with serverless functions, hosted on one Vercel project. **Works fully offline**; AI polish is optional.

## What it does

| Area | How |
|---|---|
| **Master profile** | Guided setup (basics, jobs, education, skills). Add rough notes per job and bullets are written for you. Stored in IndexedDB on the device. |
| **Smart ingestion** | Upload an old resume (PDF / DOCX / TXT) or paste LinkedIn text. Parsed on-device (`pdfjs-dist`, `mammoth`), then shown for review. |
| **Job ad parser** | Extracts hard and soft skills (about 450 terms with aliases), weights them by where they appear, separates must-haves from nice-to-haves, reads years, education, seniority and industry, and quotes the company's mission lines. |
| **Resume tailor** | Ranks each bullet by relevance to the job, budgets bullets by recency, orders skills by job weight, rewrites weak phrases ("responsible for...") into action verbs, writes the summary. |
| **Cover letter engine** | Four paragraphs: opening tied to the company's *own* mission text or your "why" line, evidence from your most relevant real achievements, fit, close. Four tones; regenerate for new wording. |
| **Editor** | Split screen: edit on the left, true paged preview on the right (preview = PDF, page for page). Hide or reorder sections, move bullets, strengthen wording per bullet. |
| **Design** | Six single-column ATS-safe templates, 8 accents plus custom colour, fonts, size, margins, A4/Letter, optional photo (crop, shape), 1/2-page budget with **Auto-fit**. |
| **Export** | PDF via print (real selectable text, exact page size), DOCX (real headings and bullets, no tables), plain text, JSON backup. |
| **Saved work** | Autosave, applications dashboard with thumbnails, status tracking, search, duplicate, delete with undo, backup and restore. |
| **Offline** | A service worker precaches the app, fonts and the PDF/DOCX parsers. |

## Honesty rules (anti-hallucination)

* The offline engine never adds numbers, employers, titles or certifications. Missing metrics are flagged, not invented.
* Bullets suggested from a job title (no input from you) are marked **generated** and are *not* counted as evidence when matching skills or writing the cover letter.
* `src/engine/guard.js` rejects any number in generated text that isn't in your own data. It runs on offline output and on AI output (client and server).
* The AI system prompt (`api/_lib/prompt.js`) forbids fabrication and treats the job ad as untrusted data (prompt-injection guard).
* "Missing skills" chips are only added when *you* tap them.

## Run locally

```bash
npm install
npm run dev        # app + /api functions on http://localhost:5173
npm test           # 35 tests: engine, summary length, parser, guard, API handler
npm run build
```

Optional AI: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`, then **restart `npm run dev`** (the key is read at start). Without it everything still works.

**AI says unavailable?** Open Settings and press **Test AI connection**. It shows the exact reason (key rejected, no credit, model not available, rate limit). On Vercel the variable must be set for the *Production* environment and the project redeployed. `ANTHROPIC_MODEL` can override the model; the server falls back through several models automatically.

## New in v3

* **Rewrite summary** always gives 35–60 varied words (AI when available, otherwise offline).
* **Suggest why this company** on New application and the Cover tab.
* **Auto design**: template, colour and paper chosen from the role, industry and seniority; pages settled automatically.
* Roles are topped up to 5/4/3 bullets (suggestions are flagged and never count as evidence).
* **Fix buttons** on every failing Job-match check, plus **Fix what I can**.
* Nine templates (added Classic, Bold, Timeline).

## Deploy (one platform: Vercel)

```bash
npm i -g vercel
vercel                                # first deploy, accept defaults (framework: Vite)
vercel env add ANTHROPIC_API_KEY      # optional
vercel env add APP_ACCESS_CODE        # recommended on a public URL
vercel --prod
```

`/api/generate.js` and `/api/health.js` deploy as serverless functions automatically. Static files and functions live in the same project, so nothing else needs hosting.

**Protect your API credit:** set `APP_ACCESS_CODE`. Users enter it in Settings and the function rejects requests without it. A per-IP rate limit (`RATE_LIMIT_PER_MIN`, default 8) is also applied (best effort per instance; add Vercel KV or Upstash for strict limits).

## Project layout

```
api/                 serverless functions (generate, health) + prompt and validation
src/engine/          pure JS: dictionary, role knowledge base, job parser, rewriter, matcher,
                     summary, cover letter, resume parser, ATS checks, guard
src/components/      React UI; doc/ = paged renderer + templates
src/lib/             IndexedDB, AI client, file extraction, exporters
tests/               vitest
```

## Notes and limits

* **Local-first, no accounts.** Data lives in the browser (IndexedDB). Use Settings, Export backup to move devices. Cloud sync or login would need a database (for example Supabase or Vercel Postgres); `src/store.js` is the single place to add it.
* **PDF** uses the browser's print dialog ("Save as PDF"), which keeps text selectable for ATS. On phones, use the DOCX export if the share sheet is awkward.
* Scanned (image-only) PDFs can't be read; paste the text instead.
* The offline writer is template-driven: reliable and honest, but plainer than AI polish. Add an API key for more natural phrasing.
* Role knowledge covers about 25 job families (software, data, design, marketing, sales, finance, HR, admin, teaching, nursing, engineering, logistics, hospitality, NGO) plus a general fallback. Extend `src/engine/roles.js` and `dictionary.js`.
