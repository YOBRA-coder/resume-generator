// Action verbs by intent, weak-phrase rewrites and tiny morphology helpers.
export const VERBS = {
  build: ['Built', 'Developed', 'Engineered', 'Designed', 'Implemented', 'Launched', 'Created', 'Architected', 'Delivered', 'Shipped'],
  improve: ['Improved', 'Optimised', 'Streamlined', 'Reduced', 'Increased', 'Strengthened', 'Accelerated', 'Modernised', 'Refined', 'Automated'],
  lead: ['Led', 'Managed', 'Coordinated', 'Supervised', 'Directed', 'Mentored', 'Oversaw', 'Guided', 'Organised', 'Spearheaded'],
  analyse: ['Analysed', 'Evaluated', 'Assessed', 'Investigated', 'Identified', 'Forecasted', 'Audited', 'Measured', 'Researched', 'Reviewed'],
  communicate: ['Presented', 'Communicated', 'Negotiated', 'Advised', 'Trained', 'Facilitated', 'Collaborated', 'Documented', 'Represented', 'Liaised', 'Contributed', 'Assisted'],
  support: ['Supported', 'Resolved', 'Maintained', 'Served', 'Handled', 'Processed', 'Assisted', 'Responded', 'Administered', 'Ensured'],
  finance: ['Reconciled', 'Budgeted', 'Prepared', 'Filed', 'Tracked', 'Secured', 'Allocated', 'Reported', 'Verified', 'Closed'],
};
const ALL = new Set(Object.values(VERBS).flat().map((v) => v.toLowerCase()));
export const isStrongVerb = (w = '') => ALL.has(w.toLowerCase());

const INTENT_HINTS = [
  ['build', /\b(build|built|develop|creat|design|implement|launch|code|program|write|wrote|set up|setup|deploy|integrat|install|produc|craft|draw)/i],
  ['lead', /\b(lead|led|manag|supervis|coordinat|mentor|train|organi[sz]|head|oversee|direct|chair)/i],
  ['improve', /\b(improv|optimi[sz]|reduc|increas|speed|fix|automat|streamlin|upgrad|enhanc|grow|boost)/i],
  ['analyse', /\b(analy[sz]|research|investigat|review|evaluat|assess|track|monitor|audit|forecast|measure|report)/i],
  ['finance', /\b(budget|reconcil|invoice|payroll|tax|account|ledger|financ|bank|payment|audit)/i],
  ['communicate', /\b(present|negotiat|advis|communicat|liais|client|stakeholder|customer|meeting|collaborat|document)/i],
];
export function intentOf(text = '') {
  for (const [k, re] of INTENT_HINTS) if (re.test(text)) return k;
  return 'support';
}

// Weak openers -> removed; the remaining phrase gets a strong verb.
export const WEAK_OPENERS = [
  /^(was|were|am|is)?\s*(primarily |mainly |mostly |also |partly )?(responsible|in charge|accountable) for\s+/i,
  /^(my )?(main |key |core )?(duties|responsibilities|tasks|role)( (included|include|were|was|involved|involve|is|are|:))?\s*[:\-–]?\s*/i,
  /^(was |were )?(tasked|assigned|required|expected) (with|to)\s+/i,
  /^(was |were )?(involved|participated|took part) in\s+/i,
  /^(helped|helping|assisted|assisting)( (with|in|to))?\s+/i,
  /^(worked|working) (on|with|to|as part of)\s+/i,
  /^(did|doing)\s+/i,
  /^(i )?(have |had )?(experience (in|with|of)|knowledge of)\s+/i,
  /^(i )/i,
];

const IRREGULAR_PAST = { run: 'Ran', lead: 'Led', build: 'Built', write: 'Wrote', make: 'Made', set: 'Set', teach: 'Taught', win: 'Won', sell: 'Sold', hold: 'Held', give: 'Gave', speak: 'Spoke', spend: 'Spent', drive: 'Drove', undertake: 'Undertook', oversee: 'Oversaw', begin: 'Began', choose: 'Chose', keep: 'Kept', meet: 'Met' };
const NO_DOUBLE = /(?:[^aeiou][aeiou][wxy]|er|en|on|it|el|al|or|ct|sh|ch)$/;
/** gerund/base/3rd-person -> simple past, capitalised ("managing" -> "Managed", "builds" -> "Built"). */
export function toPast(word = '') {
  const w = word.toLowerCase();
  if (!w) return '';
  if (ALL.has(w)) return cap(w);
  let base = w;
  if (/ing$/.test(w) && w.length > 5) {
    base = w.slice(0, -3);
    if (/(.)\1$/.test(base) && !/(ll|ss|zz)$/.test(base)) base = base.slice(0, -1); // running -> run
    else if (/(^|[^aeiou])[aeiou][^aeiouwxy]$/.test(base) && base.length <= 4) base += 'e'; // making->mak -> make
    else if (/(at|iz|is|ag|ur|rv|us|ac|ov|ot|ul|ud|uc|yz|ib|ut|iv|id)$/.test(base) && !/(?:ct|st)$/.test(base)) base += 'e';
  } else if (/s$/.test(w) && !/ss$/.test(w) && w.length > 3) base = w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.endsWith('es') && /(sh|ch|x|z|ss)es$/.test(w) ? w.slice(0, -2) : w.slice(0, -1);
  if (IRREGULAR_PAST[base]) return IRREGULAR_PAST[base];
  if (/ed$/.test(base) && base.length > 4) return cap(base);
  if (/e$/.test(base)) return cap(base + 'd');
  if (/[^aeiou]y$/.test(base)) return cap(base.slice(0, -1) + 'ied');
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(base) && base.length <= 4) return cap(base + base.slice(-1) + 'ed');
  return cap(base + 'ed');
}
/** Explicit past -> present map (regular morphology is error-prone, so we only convert verbs we know). */
const PRESENT = { Built: 'Build', Developed: 'Develop', Engineered: 'Engineer', Designed: 'Design', Implemented: 'Implement', Launched: 'Launch', Created: 'Create', Architected: 'Architect', Delivered: 'Deliver', Shipped: 'Ship', Improved: 'Improve', Optimised: 'Optimise', Optimized: 'Optimize', Streamlined: 'Streamline', Reduced: 'Reduce', Increased: 'Increase', Strengthened: 'Strengthen', Accelerated: 'Accelerate', Modernised: 'Modernise', Refined: 'Refine', Automated: 'Automate', Led: 'Lead', Managed: 'Manage', Coordinated: 'Coordinate', Supervised: 'Supervise', Directed: 'Direct', Mentored: 'Mentor', Oversaw: 'Oversee', Guided: 'Guide', Organised: 'Organise', Spearheaded: 'Spearhead', Analysed: 'Analyse', Analyzed: 'Analyze', Evaluated: 'Evaluate', Assessed: 'Assess', Investigated: 'Investigate', Identified: 'Identify', Forecasted: 'Forecast', Audited: 'Audit', Measured: 'Measure', Researched: 'Research', Reviewed: 'Review', Presented: 'Present', Communicated: 'Communicate', Negotiated: 'Negotiate', Advised: 'Advise', Trained: 'Train', Facilitated: 'Facilitate', Collaborated: 'Collaborate', Documented: 'Document', Represented: 'Represent', Liaised: 'Liaise', Supported: 'Support', Resolved: 'Resolve', Maintained: 'Maintain', Served: 'Serve', Handled: 'Handle', Processed: 'Process', Assisted: 'Assist', Responded: 'Respond', Administered: 'Administer', Ensured: 'Ensure', Reconciled: 'Reconcile', Budgeted: 'Budget', Prepared: 'Prepare', Filed: 'File', Tracked: 'Track', Secured: 'Secure', Allocated: 'Allocate', Reported: 'Report', Verified: 'Verify', Closed: 'Close', Ran: 'Run', Wrote: 'Write', Taught: 'Teach', Sold: 'Sell', Planned: 'Plan', Produced: 'Produce', Installed: 'Install', Integrated: 'Integrate', Deployed: 'Deploy', Configured: 'Configure', Operated: 'Operate', Monitored: 'Monitor', Performed: 'Perform', Carried: 'Carry', Used: 'Use', Welcomed: 'Welcome', Worked: 'Work', Wrote_: 'Write', Debugged: 'Debug', Collected: 'Collect', Conducted: 'Conduct', Defined: 'Define', Sourced: 'Source', Contributed: 'Contribute', Educated: 'Educate', Wrote2: 'Write', Published: 'Publish', Profiled: 'Profile', Modelled: 'Model', Containerised: 'Containerise', Containerized: 'Containerize', Provisioned: 'Provision', Hardened: 'Harden', Set: 'Set', Applied: 'Apply', Drove: 'Drive', Won: 'Win', Raised: 'Raise', Grew: 'Grow', Generated: 'Generate', Cut: 'Cut', Boosted: 'Boost', Expanded: 'Expand', Established: 'Establish', Initiated: 'Initiate', Executed: 'Execute', Owned: 'Own', Mapped: 'Map', Tested: 'Test', Wrote3: 'Write', Fixed: 'Fix', Upgraded: 'Upgrade', Migrated: 'Migrate', Enhanced: 'Enhance', Simplified: 'Simplify', Standardised: 'Standardise', Standardized: 'Standardize', Onboarded: 'Onboard', Recruited: 'Recruit', Screened: 'Screen', Scheduled: 'Schedule', Welcomed2: 'Welcome', Answered: 'Answer', Logged: 'Log', Escalated: 'Escalate', Operated2: 'Operate', Cooked: 'Cook', Served2: 'Serve', Taught2: 'Teach', Marked: 'Mark', Counselled: 'Counsel', Inspected: 'Inspect', Enforced: 'Enforce', Valued: 'Value', Followed: 'Follow', Sped: 'Speed', Explained: 'Explain', Participated: 'Participate', Wrote_: 'Write', Responded2: 'Respond', Updated: 'Update', Cleaned: 'Clean', Checked: 'Check', Opened: 'Open', Turned: 'Turn', Posted: 'Post', Edited: 'Edit', Designed2: 'Design', Raised2: 'Raise', Delegated: 'Delegate', Negotiated2: 'Negotiate', Welcomed3: 'Welcome', Resolved2: 'Resolve', Programmed: 'Program', Launched2: 'Launch', Redesigned: 'Redesign', Rebuilt: 'Rebuild', Refactored: 'Refactor', Customised: 'Customise', Customized: 'Customize', Sourced2: 'Source', Compiled: 'Compile', Drafted: 'Draft', Ordered: 'Order', Coached: 'Coach', Advised2: 'Advise' };
const PAST_OF = Object.fromEntries(Object.entries(PRESENT).map(([p, b]) => [b, p]));
/** For a current role: "Managed" -> "Manage". Unknown verbs are returned unchanged. */
export function toPresent(word = '') {
  const w = cap(word);
  return PRESENT[w] || word;
}
/** Convert an already-formed bullet's first word between tenses (only for verbs we know). */
export function retense(bullet = '', current = false) {
  const m = bullet.match(/^([A-Za-z]+)(\s[\s\S]*)?$/);
  if (!m) return bullet;
  const first = cap(m[1]);
  let rest = m[2] || '';
  if (current) {
    if (!PRESENT[first]) return bullet;
    // convert parallel verbs ("... and sped up ...", ", reduced ..."); give up if one isn't known, to avoid mixed tense
    let ok = true;
    rest = rest.replace(/(,\s+(?:and\s+)?|\s+and\s+)([a-z]+(?:ed|t|w))\b/g, (all, sep, w) => (PRESENT[cap(w)] ? `${sep}${PRESENT[cap(w)].toLowerCase()}` : /ed$/.test(w) && w.length > 4 ? ((ok = false), all) : all));
    return ok ? PRESENT[first] + rest : bullet;
  }
  return PAST_OF[first] ? PAST_OF[first] + rest : bullet;
}
export const isKnownPast = (w = '') => !!PRESENT[cap(w)];
export const isKnownBase = (w = '') => !!PAST_OF[cap(w)];
export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
export const lowerFirst = (s = '') => s.charAt(0).toLowerCase() + s.slice(1);
