// Skill dictionary: "Canonical|alias|alias". Used for job-ad parsing, profile matching and suggestions.
// `kind` tells the engine whether a term is a hard skill (tool/tech/discipline) or a soft skill.
const RAW = {
  tech: [
    'JavaScript|js|javascript|ecmascript|es6', 'TypeScript|ts|typescript', 'Python|python3', 'Java|java', 'C#|c#|csharp', 'C++|c++|cpp', 'C|c language', 'Go|golang', 'Rust|rust', 'PHP|php', 'Ruby|ruby', 'Kotlin|kotlin', 'Swift|swift', 'Dart|dart', 'SQL|sql', 'R|r language|rstudio', 'Bash|bash|shell scripting',
    'React|react|reactjs|react.js', 'React Native|react native', 'Next.js|next.js|nextjs', 'Vue.js|vue|vuejs|vue.js', 'Angular|angular|angularjs', 'Svelte|svelte', 'Redux|redux', 'Tailwind CSS|tailwind|tailwindcss', 'HTML|html|html5', 'CSS|css|css3', 'Sass|sass|scss', 'Bootstrap|bootstrap', 'Vite|vite', 'Webpack|webpack',
    'Node.js|node|nodejs|node.js', 'Express|express|expressjs|express.js', 'NestJS|nestjs|nest.js', 'Django|django', 'Flask|flask', 'FastAPI|fastapi', 'Spring Boot|spring boot|spring', 'Laravel|laravel', '.NET|.net|dotnet|asp.net', 'Ruby on Rails|rails|ruby on rails', 'Flutter|flutter', 'Android|android', 'iOS|ios',
    'REST APIs|rest|restful|rest api|rest apis|restful api', 'GraphQL|graphql', 'WebSockets|websocket|websockets', 'Microservices|microservices|microservice', 'gRPC|grpc',
    'PostgreSQL|postgres|postgresql', 'MySQL|mysql', 'MongoDB|mongodb|mongo', 'Redis|redis', 'SQLite|sqlite', 'Prisma|prisma', 'Firebase|firebase', 'Supabase|supabase', 'Elasticsearch|elasticsearch', 'DynamoDB|dynamodb',
    'AWS|aws|amazon web services', 'Azure|azure', 'Google Cloud|gcp|google cloud', 'Docker|docker', 'Kubernetes|kubernetes|k8s', 'Terraform|terraform', 'CI/CD|ci/cd|cicd|continuous integration|continuous delivery', 'GitHub Actions|github actions', 'Jenkins|jenkins', 'Linux|linux', 'Nginx|nginx', 'Vercel|vercel', 'Railway|railway',
    'Git|git', 'GitHub|github', 'GitLab|gitlab', 'Jira|jira', 'Agile|agile', 'Scrum|scrum', 'Kanban|kanban', 'Test-Driven Development|tdd|test driven development', 'Unit Testing|unit testing|unit tests', 'Jest|jest', 'Cypress|cypress', 'Playwright|playwright', 'Selenium|selenium',
    'Machine Learning|machine learning|ml', 'Deep Learning|deep learning', 'Data Analysis|data analysis|data analytics|analytics', 'Data Visualization|data visualization|data visualisation', 'Pandas|pandas', 'NumPy|numpy', 'TensorFlow|tensorflow', 'PyTorch|pytorch', 'Scikit-learn|scikit-learn|sklearn', 'NLP|nlp|natural language processing', 'LLMs|llm|llms|large language models|generative ai', 'Power BI|power bi|powerbi', 'Tableau|tableau', 'Excel|excel|microsoft excel|ms excel', 'Google Sheets|google sheets', 'ETL|etl', 'Data Warehousing|data warehouse|data warehousing', 'Apache Spark|spark|apache spark', 'Airflow|airflow', 'Statistics|statistics|statistical analysis',
    'Cybersecurity|cybersecurity|cyber security|information security|infosec', 'Network Administration|network administration|networking|tcp/ip', 'Technical Support|technical support|it support|helpdesk|help desk', 'System Administration|system administration|sysadmin', 'Active Directory|active directory', 'Cloud Computing|cloud computing', 'API Integration|api integration|api integrations', 'M-Pesa Integration|m-pesa|mpesa|daraja', 'Payment Integration|payment integration|payment gateway|payment gateways', 'Web Development|web development', 'Mobile Development|mobile development|mobile app development', 'Software Architecture|software architecture|system design', 'Code Review|code review|code reviews', 'Performance Optimization|performance optimization|performance optimisation',
  ],
  design: [
    'Figma|figma', 'Adobe XD|adobe xd|xd', 'Sketch|sketch app', 'Adobe Photoshop|photoshop', 'Adobe Illustrator|illustrator', 'Adobe InDesign|indesign', 'Adobe Premiere Pro|premiere pro|premiere', 'After Effects|after effects', 'Canva|canva', 'CorelDRAW|coreldraw', 'Blender|blender',
    'UI Design|ui design|user interface design|ui', 'UX Design|ux design|user experience|ux', 'User Research|user research', 'Wireframing|wireframing|wireframes', 'Prototyping|prototyping|prototypes', 'Design Systems|design systems|design system', 'Typography|typography', 'Branding|branding|brand identity', 'Motion Graphics|motion graphics', 'Video Editing|video editing', 'Photography|photography', 'Usability Testing|usability testing', 'Accessibility|accessibility|wcag', 'Responsive Design|responsive design',
  ],
  business: [
    'Project Management|project management', 'Product Management|product management', 'Stakeholder Management|stakeholder management|stakeholder engagement', 'Strategic Planning|strategic planning|strategy', 'Business Development|business development', 'Market Research|market research', 'Competitive Analysis|competitive analysis', 'Budgeting|budgeting|budget management', 'Forecasting|forecasting', 'Risk Management|risk management', 'Process Improvement|process improvement|continuous improvement|lean|six sigma', 'Change Management|change management', 'Operations Management|operations management', 'Vendor Management|vendor management|supplier management', 'Contract Negotiation|negotiation|contract negotiation', 'Reporting|reporting|report writing', 'Monitoring and Evaluation|monitoring and evaluation|m&e', 'Proposal Writing|proposal writing|grant writing|proposals', 'Policy Development|policy development', 'Compliance|compliance|regulatory compliance', 'Quality Assurance|quality assurance|qa', 'Procurement|procurement|purchasing', 'Supply Chain Management|supply chain|supply chain management', 'Logistics|logistics', 'Inventory Management|inventory management|stock control|inventory control', 'Warehouse Management|warehouse management|warehousing', 'Fleet Management|fleet management',
    'Digital Marketing|digital marketing', 'SEO|seo|search engine optimization|search engine optimisation', 'SEM|sem|google ads|ppc', 'Social Media Marketing|social media marketing|social media management|social media', 'Content Marketing|content marketing|content strategy', 'Email Marketing|email marketing', 'Copywriting|copywriting', 'Content Creation|content creation', 'Brand Management|brand management', 'Public Relations|public relations|pr', 'Event Planning|event planning|event management', 'Google Analytics|google analytics', 'HubSpot|hubspot', 'Salesforce|salesforce', 'CRM|crm|customer relationship management', 'Lead Generation|lead generation', 'Sales|sales|selling', 'Account Management|account management|key account management', 'B2B Sales|b2b sales|b2b', 'Cold Calling|cold calling', 'Customer Service|customer service|customer support|customer care', 'Customer Success|customer success', 'Call Centre Operations|call centre|call center',
    'Human Resources|human resources|hr', 'Recruitment|recruitment|recruiting|talent acquisition', 'Onboarding|onboarding', 'Payroll|payroll', 'Employee Relations|employee relations', 'Performance Management|performance management', 'Training and Development|training and development|learning and development', 'Office Administration|office administration|administration|administrative support', 'Records Management|records management|record keeping|filing', 'Scheduling|scheduling|calendar management', 'Data Entry|data entry', 'Microsoft Office|microsoft office|ms office|office suite', 'Microsoft Word|microsoft word|ms word', 'PowerPoint|powerpoint|ms powerpoint', 'Google Workspace|google workspace|g suite',
    'Public Speaking|public speaking|presentation skills|presentations', 'Translation|translation', 'Research|research',
  ],
  finance: [
    'Financial Reporting|financial reporting', 'Financial Analysis|financial analysis', 'Financial Modelling|financial modelling|financial modeling', 'Bookkeeping|bookkeeping', 'Accounts Payable|accounts payable', 'Accounts Receivable|accounts receivable', 'Reconciliation|reconciliation|reconciliations|bank reconciliation', 'Auditing|audit|auditing|internal audit', 'Tax Compliance|tax compliance|taxation|tax', 'VAT|vat', 'IFRS|ifrs', 'GAAP|gaap', 'QuickBooks|quickbooks', 'Sage|sage', 'Xero|xero', 'SAP|sap', 'Oracle|oracle', 'Tally|tally', 'Cash Flow Management|cash flow|cash flow management', 'Credit Control|credit control', 'Treasury|treasury', 'Investment Analysis|investment analysis', 'Cost Accounting|cost accounting|costing', 'Variance Analysis|variance analysis', 'Month-End Close|month-end close|month end close|month-end', 'Revenue Recognition|revenue recognition', 'Loan Processing|loan processing|credit analysis', 'Microfinance|microfinance', 'KYC|kyc|know your customer', 'Anti-Money Laundering|aml|anti-money laundering',
  ],
  health: [
    'Patient Care|patient care', 'Clinical Assessment|clinical assessment', 'Triage|triage', 'Medication Administration|medication administration', 'Infection Control|infection control', 'Electronic Medical Records|emr|electronic medical records|ehr', 'Public Health|public health', 'Community Health|community health', 'Health Education|health education', 'First Aid|first aid|bls|basic life support', 'Pharmacy Practice|pharmacy practice|dispensing', 'Laboratory Techniques|laboratory techniques|lab techniques', 'Maternal and Child Health|maternal and child health|mch', 'Counselling|counselling|counseling',
  ],
  education: [
    'Lesson Planning|lesson planning', 'Curriculum Development|curriculum development', 'Classroom Management|classroom management', 'Student Assessment|student assessment|assessment', 'Differentiated Instruction|differentiated instruction', 'CBC Curriculum|cbc|competency based curriculum', 'Tutoring|tutoring', 'E-Learning|e-learning|elearning|online teaching', 'Moodle|moodle', 'Mentoring|mentoring|mentorship', 'Coaching|coaching',
  ],
  trades: [
    'AutoCAD|autocad', 'Revit|revit', 'SolidWorks|solidworks', 'Project Scheduling|project scheduling|ms project|microsoft project', 'Site Supervision|site supervision', 'Quantity Surveying|quantity surveying|bills of quantities|boq', 'Structural Design|structural design', 'Health and Safety|health and safety|hse|ohs|safety management', 'Preventive Maintenance|preventive maintenance|maintenance', 'Electrical Installation|electrical installation', 'Plumbing|plumbing', 'Welding|welding', 'Machine Operation|machine operation', 'Quality Control|quality control|qc', 'Driving|driving|valid driving licence|driving license',
    'Food Safety|food safety|haccp', 'Menu Planning|menu planning', 'Food Preparation|food preparation|cooking', 'Front Desk Operations|front desk|front office|reception', 'Guest Relations|guest relations|guest services', 'Cash Handling|cash handling|point of sale|pos', 'Merchandising|merchandising|visual merchandising', 'Security Operations|security operations|security',
  ],
  soft: [
    'Communication|communication|communication skills|verbal communication|written communication', 'Leadership|leadership', 'Teamwork|teamwork|team player|collaboration|collaborative', 'Problem Solving|problem solving|problem-solving', 'Critical Thinking|critical thinking|analytical thinking|analytical skills', 'Time Management|time management|prioritization|prioritisation', 'Adaptability|adaptability|flexible|flexibility', 'Attention to Detail|attention to detail|detail-oriented|detail oriented', 'Creativity|creativity|creative thinking', 'Initiative|self-motivated|self-starter|initiative|proactive', 'Decision Making|decision making|decision-making', 'Conflict Resolution|conflict resolution', 'Emotional Intelligence|emotional intelligence', 'Interpersonal Skills|interpersonal skills', 'Customer Focus|customer focus|customer-focused|customer centric', 'Work Ethic|work ethic', 'Integrity|integrity', 'Multitasking|multitasking', 'Organisation|organizational skills|organisational skills|organized|organised', 'Ownership|ownership|accountability', 'Resilience|resilience|work under pressure|under pressure', 'Cross-functional Collaboration|cross-functional|cross functional', 'Team Leadership|team leadership|people management|managing teams|line management', 'Presentation Skills|presentation skills',
  ],
};

export const SKILLS = [];
for (const [category, rows] of Object.entries(RAW)) {
  for (const row of rows) {
    const [name, ...aliases] = row.split('|');
    SKILLS.push({ name, category, kind: category === 'soft' ? 'soft' : 'hard', aliases: [...new Set([name.toLowerCase(), ...aliases.map((a) => a.toLowerCase())])] });
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const index = SKILLS.map((s) => ({
  skill: s,
  // single-letter / ambiguous aliases only match in specific forms to avoid false hits ("c", "r", "go", "sage", "sketch")
  re: new RegExp(`(?<![a-z0-9+#.])(?:${s.aliases.filter(okAlias).map(esc).join('|')})(?![a-z0-9+#]|\\.[a-z])`, 'i'),
})).filter((e) => e.re.source.includes('(?:)') === false);

function okAlias(a) {
  return !['c', 'r', 'go', 'ts', 'js', 'ml', 'qa', 'pr', 'hr', 'ui', 'ux', 'xd', 'sem', 'tax', 'sap', 'oracle', 'sage', 'tally', 'lean', 'pos', 'audit', 'sketch app', 'research', 'sales', 'security', 'maintenance', 'assessment', 'strategy', 'analytics', 'initiative', 'tdd'].includes(a) || ['c language'].includes(a);
}
// Ambiguous short aliases handled separately: exact, case-sensitive, context-aware.
const CASE_SENSITIVE = [
  ['JavaScript', /\bJS\b/], ['TypeScript', /\bTS\b/], ['Machine Learning', /\bML\b/], ['Quality Assurance', /\bQA\b/], ['Human Resources', /\bHR\b/],
  ['UI Design', /\bUI\b/], ['UX Design', /\bUX\b/], ['Go', /\bGo(lang)?\b(?=[,;)\s]*(?:and|,|\/|developer|programming|services|backend))/], ['R', /\bR\b(?=\s*(?:,|\/|programming|language|studio|and|&))/],
  ['SAP', /\bSAP\b/], ['Oracle', /\bOracle\b/], ['Sage', /\bSage\b/], ['Tally', /\bTally\b/], ['Lean', /\bLean\b(?=\s+(?:methodolog|six|manufactur|principle))/], ['Auditing', /\b[Aa]udit(ing|s)?\b/],
  ['Research', /\b[Rr]esearch\b/], ['Sales', /\b[Ss]ales\b/], ['Security Operations', /\b[Ss]ecurity\b/], ['Preventive Maintenance', /\b[Mm]aintenance\b/], ['Strategic Planning', /\b[Ss]trategy\b/], ['Data Analysis', /\b[Aa]nalytics\b/], ['Cash Handling', /\bPOS\b/],
  ['Initiative', /\b[Ii]nitiative\b/], ['Student Assessment', /\b[Aa]ssessment\b/], ['Test-Driven Development', /\bTDD\b/], ['Public Relations', /\bPR\b/], ['Tax Compliance', /\b[Tt]ax(ation)?\b/], ['Adobe XD', /\bAdobe XD\b|\bXD\b/], ['SEM', /\bSEM\b/],
];
const byName = Object.fromEntries(SKILLS.map((s) => [s.name, s]));

/** Find all dictionary skills mentioned in `text`. Returns [{name, kind, category, count, firstIndex}] */
export function findSkills(text = '') {
  const found = new Map();
  const add = (skill, idx, count = 1) => {
    const cur = found.get(skill.name);
    if (cur) { cur.count += count; cur.firstIndex = Math.min(cur.firstIndex, idx); } else found.set(skill.name, { name: skill.name, kind: skill.kind, category: skill.category, count, firstIndex: idx });
  };
  for (const { skill, re } of index) {
    const g = new RegExp(re.source, 'gi');
    let m, n = 0, first = -1;
    while ((m = g.exec(text))) { n++; if (first < 0) first = m.index; if (n > 50) break; }
    if (n) add(skill, first, n);
  }
  for (const [name, re] of CASE_SENSITIVE) {
    const g = new RegExp(re.source, 'g');
    const m = g.exec(text);
    if (m && byName[name]) add(byName[name], m.index);
  }
  return [...found.values()];
}

export function canonicalSkill(term = '') {
  const t = term.trim().toLowerCase();
  if (!t) return '';
  const hit = SKILLS.find((s) => s.aliases.includes(t));
  return hit ? hit.name : term.trim();
}
export const skillKind = (name) => byName[canonicalSkill(name)]?.kind || 'hard';
