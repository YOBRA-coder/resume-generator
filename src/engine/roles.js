// Role knowledge base. Everything here is *typical for the role* — never presented as a user's fact without review.
// duties use {a}/{b}/{c} slots filled from the user's own matching skills (or role defaults) — they never contain invented numbers.
export const ROLES = [
  {
    id: 'frontend', label: 'Frontend Developer', titles: /front[\s-]?end|ui developer|web developer|react developer|javascript developer/i,
    skills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Responsive Design', 'REST APIs', 'Git', 'Accessibility', 'Performance Optimization', 'Unit Testing', 'Tailwind CSS'],
    soft: ['Collaboration', 'Attention to Detail', 'Problem Solving', 'Communication'],
    strengths: ['building fast, accessible, responsive interfaces', 'turning designs into polished production UI', 'writing clean, maintainable component code'],
    duties: [
      'Built responsive, accessible user interfaces with {a} and {b}, translating design mockups into production-ready components',
      'Integrated front-end applications with REST APIs and managed client-side state for a smooth user experience',
      'Optimised page load speed and rendering performance through code splitting, lazy loading and asset optimisation',
      'Wrote reusable component libraries that reduced duplicated code and kept the UI consistent across pages',
      'Collaborated with designers and backend engineers to scope, estimate and ship features each sprint',
      'Debugged cross-browser and device issues and fixed layout, accessibility and performance defects',
      'Followed code-review and version-control practices to keep the codebase maintainable and release changes safely',
    ],
  },
  {
    id: 'backend', label: 'Backend Developer', titles: /back[\s-]?end|api developer|node(\.js)? developer|python developer|java developer|php developer|server[\s-]?side/i,
    skills: ['Node.js', 'Python', 'REST APIs', 'PostgreSQL', 'SQL', 'Docker', 'Git', 'Microservices', 'API Integration', 'Unit Testing', 'CI/CD', 'Redis'],
    soft: ['Problem Solving', 'Analytical Thinking', 'Communication', 'Ownership'],
    strengths: ['designing reliable APIs and data models', 'building secure, scalable server-side systems', 'integrating third-party and payment services'],
    duties: [
      'Designed and built RESTful APIs with {a} and {b} that power web and mobile clients',
      'Modelled relational data and wrote optimised queries to keep application responses fast and consistent',
      'Implemented authentication, authorisation and input validation to protect user data',
      'Integrated third-party services such as payment gateways, messaging and email providers',
      'Containerised services and set up automated build and deployment pipelines using {c}',
      'Wrote automated tests and structured logging to catch regressions and speed up troubleshooting',
      'Documented endpoints and architecture decisions so teammates and clients could onboard quickly',
    ],
  },
  {
    id: 'fullstack', label: 'Full-Stack Developer', titles: /full[\s-]?stack|software (engineer|developer)|web (engineer|application)|application developer|programmer|developer/i,
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Git', 'Docker', 'HTML', 'CSS', 'CI/CD', 'Agile'],
    soft: ['Problem Solving', 'Ownership', 'Communication', 'Adaptability'],
    strengths: ['delivering complete features from database to interface', 'shipping production web applications end to end', 'translating business requirements into working software'],
    duties: [
      'Developed end-to-end web applications using {a}, {b} and {c}, from database design to user interface',
      'Translated client and business requirements into technical specifications and shipped working features iteratively',
      'Built and consumed REST APIs and integrated third-party services including payments and notifications',
      'Deployed and maintained applications on cloud platforms with automated builds and environment management',
      'Reviewed code, fixed bugs and refactored legacy modules to improve reliability and maintainability',
      'Worked directly with clients and stakeholders to gather feedback, prioritise work and deliver on agreed timelines',
      'Wrote documentation and handover guides so clients and teammates could operate and extend the systems',
    ],
  },
  {
    id: 'mobile', label: 'Mobile App Developer', titles: /mobile|android|ios|flutter|react native/i,
    skills: ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Firebase', 'REST APIs', 'Git', 'UI Design', 'M-Pesa Integration'],
    soft: ['Attention to Detail', 'Problem Solving', 'Collaboration'],
    strengths: ['shipping polished cross-platform mobile apps', 'building offline-friendly, performant mobile experiences'],
    duties: [
      'Built cross-platform mobile applications with {a} and {b} for Android and iOS',
      'Integrated REST APIs, push notifications and secure authentication into mobile clients',
      'Implemented local storage and offline-first behaviour so apps remain usable on unreliable connections',
      'Published and maintained app releases through the Google Play and Apple App Store processes',
      'Profiled and optimised app startup, memory use and screen rendering',
      'Collaborated with designers to deliver pixel-accurate screens that follow platform guidelines',
    ],
  },
  {
    id: 'data', label: 'Data Analyst', titles: /data analyst|business analyst|bi analyst|analytics|insights analyst|reporting analyst/i,
    skills: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Data Visualization', 'Statistics', 'Data Analysis', 'Reporting', 'ETL'],
    soft: ['Analytical Thinking', 'Communication', 'Attention to Detail', 'Curiosity'],
    strengths: ['turning raw data into clear decisions', 'building dashboards stakeholders actually use', 'translating business questions into rigorous analysis'],
    duties: [
      'Queried and cleaned large datasets with {a} and {b} to answer business questions',
      'Built interactive dashboards and recurring reports that gave stakeholders a single view of key performance indicators',
      'Identified trends, anomalies and root causes in operational data and presented recommendations to management',
      'Automated manual reporting tasks to reduce errors and free up time for deeper analysis',
      'Defined metrics and data-quality checks in partnership with business teams',
      'Presented findings to technical and non-technical audiences using clear visuals and plain language',
    ],
  },
  {
    id: 'datasci', label: 'Data Scientist / ML Engineer', titles: /data scien|machine learning|ml engineer|ai engineer|nlp|deep learning/i,
    skills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics', 'Data Visualization', 'LLMs'],
    soft: ['Analytical Thinking', 'Communication', 'Curiosity'],
    strengths: ['building and validating predictive models', 'moving models from notebook to production'],
    duties: [
      'Prepared and engineered features from raw data and trained models using {a} and {b}',
      'Evaluated models with appropriate validation techniques and metrics, and documented trade-offs',
      'Deployed models behind APIs and monitored their performance after release',
      'Explored datasets to uncover patterns and framed findings for decision-makers',
      'Collaborated with engineers and product owners to turn business problems into measurable modelling tasks',
    ],
  },
  {
    id: 'devops', label: 'DevOps / Cloud Engineer', titles: /devops|sre|site reliability|cloud engineer|infrastructure|platform engineer/i,
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Bash', 'GitHub Actions', 'Nginx', 'Cloud Computing'],
    soft: ['Problem Solving', 'Ownership', 'Communication'],
    strengths: ['automating build, test and release pipelines', 'keeping production systems reliable and observable'],
    duties: [
      'Built and maintained CI/CD pipelines with {a} to automate testing and deployment',
      'Provisioned and managed cloud infrastructure using {b} and infrastructure-as-code practices',
      'Containerised applications and managed their deployment, scaling and rollbacks',
      'Set up monitoring, logging and alerting to detect and resolve incidents quickly',
      'Hardened servers and access controls and documented runbooks for common operational tasks',
    ],
  },
  {
    id: 'qa', label: 'QA / Test Engineer', titles: /\bqa\b|quality assurance|test(er| engineer| analyst)|software testing/i,
    skills: ['Quality Assurance', 'Selenium', 'Cypress', 'Jest', 'Unit Testing', 'Jira', 'Agile', 'API Integration'],
    soft: ['Attention to Detail', 'Communication', 'Analytical Thinking'],
    strengths: ['finding defects early', 'building reliable automated test suites'],
    duties: [
      'Designed and executed test plans and test cases covering functional, regression and edge-case scenarios',
      'Automated repeatable tests with {a} and {b} to speed up releases',
      'Logged clear, reproducible bug reports and verified fixes with developers',
      'Participated in sprint planning and reviews to bring testability into requirements early',
    ],
  },
  {
    id: 'itsupport', label: 'IT Support / Network Administrator', titles: /it support|help ?desk|technical support|network|system admin|sysadmin|it officer|it technician|ict/i,
    skills: ['Technical Support', 'Network Administration', 'System Administration', 'Active Directory', 'Microsoft Office', 'Linux', 'Cybersecurity', 'Hardware Troubleshooting'],
    soft: ['Customer Focus', 'Patience', 'Communication', 'Problem Solving'],
    strengths: ['resolving technical issues quickly and courteously', 'keeping networks and end-user systems running reliably'],
    duties: [
      'Provided first- and second-line support for hardware, software and network issues, logging and tracking tickets to resolution',
      'Installed, configured and maintained workstations, printers and network equipment',
      'Managed user accounts, permissions and backups to keep systems secure and recoverable',
      'Documented fixes and created short guides that helped staff solve common problems on their own',
      'Monitored network performance and coordinated with providers to resolve outages',
    ],
  },
  {
    id: 'uiux', label: 'UI/UX Designer', titles: /ui\/?ux|ux|ui designer|product designer|user experience|interface design|web designer/i,
    skills: ['Figma', 'UI Design', 'UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems', 'Usability Testing', 'Typography', 'Accessibility'],
    soft: ['Creativity', 'Empathy', 'Communication', 'Collaboration'],
    strengths: ['designing clear, user-centred interfaces', 'bridging user needs and business goals'],
    duties: [
      'Designed wireframes, interactive prototypes and high-fidelity screens in {a} for web and mobile products',
      'Conducted user research and usability sessions and turned findings into design improvements',
      'Created and maintained a design system of components, typography and colour tokens for consistent delivery',
      'Collaborated with developers to hand off specifications and review implementation quality',
      'Iterated on designs from stakeholder and user feedback to improve clarity and usability',
    ],
  },
  {
    id: 'graphic', label: 'Graphic Designer / Creative', titles: /graphic|creative|video editor|brand designer|illustrator|animator|photographer|multimedia/i,
    skills: ['Adobe Photoshop', 'Adobe Illustrator', 'Canva', 'Branding', 'Typography', 'Video Editing', 'Adobe InDesign', 'Motion Graphics'],
    soft: ['Creativity', 'Time Management', 'Attention to Detail', 'Communication'],
    strengths: ['crafting visual identities that stand out', 'delivering creative work to tight deadlines'],
    duties: [
      'Designed logos, social media graphics, brochures and print collateral using {a} and {b}',
      'Translated client briefs into consistent visual identities and brand guidelines',
      'Edited and produced video and motion content for marketing and social channels',
      'Managed multiple creative projects concurrently and delivered to agreed deadlines',
      'Prepared print-ready and web-optimised files to the correct specifications',
    ],
  },
  {
    id: 'pm', label: 'Product Manager', titles: /product (manager|owner|lead)|product management/i,
    skills: ['Product Management', 'Agile', 'Scrum', 'Stakeholder Management', 'Market Research', 'Jira', 'Data Analysis', 'User Research', 'Strategic Planning'],
    soft: ['Leadership', 'Communication', 'Decision Making', 'Prioritisation'],
    strengths: ['prioritising ruthlessly around user and business value', 'aligning engineering, design and business teams'],
    duties: [
      'Defined product vision and roadmap based on user research, market analysis and business goals',
      'Wrote clear requirements and acceptance criteria and prioritised the backlog with engineering and design',
      'Used usage data and customer feedback to measure feature success and decide what to build next',
      'Aligned stakeholders across teams and communicated progress, risks and trade-offs',
      'Coordinated releases and launch activities with engineering, marketing and support',
    ],
  },
  {
    id: 'projectmgr', label: 'Project Manager', titles: /project (manager|coordinator|officer|lead)|programme manager|program manager|scrum master|operations manager/i,
    skills: ['Project Management', 'Stakeholder Management', 'Risk Management', 'Budgeting', 'Agile', 'Scrum', 'Reporting', 'Project Scheduling', 'Vendor Management'],
    soft: ['Leadership', 'Organisation', 'Communication', 'Negotiation'],
    strengths: ['delivering projects on time and within budget', 'keeping cross-functional teams aligned and accountable'],
    duties: [
      'Planned and delivered projects from initiation to closure, managing scope, schedule, budget and risk',
      'Coordinated cross-functional teams and vendors, running regular stand-ups, reviews and status reporting',
      'Tracked budgets and resources and flagged variances early to stakeholders',
      'Identified project risks and put mitigation and escalation plans in place',
      'Documented requirements, decisions and lessons learned to improve future delivery',
    ],
  },
  {
    id: 'marketing', label: 'Marketing / Content Specialist', titles: /market|content|social media|brand|seo|copywriter|communications|community manager|public relations|digital/i,
    skills: ['Digital Marketing', 'Social Media Marketing', 'Content Creation', 'SEO', 'Copywriting', 'Email Marketing', 'Google Analytics', 'Canva', 'Brand Management', 'Content Strategy'],
    soft: ['Creativity', 'Communication', 'Analytical Thinking', 'Adaptability'],
    strengths: ['growing audiences with consistent, high-quality content', 'connecting campaigns to measurable business results'],
    duties: [
      'Planned and published content across social and web channels using a consistent brand voice',
      'Ran digital campaigns and tracked performance in {a} to refine targeting and messaging',
      'Wrote website, email and social copy tailored to each audience and channel',
      'Researched keywords and audience behaviour to improve search visibility and engagement',
      'Coordinated with designers, sales and partners to launch campaigns and events on schedule',
      'Reported on campaign results and recommended improvements based on the data',
    ],
  },
  {
    id: 'sales', label: 'Sales / Business Development', titles: /sales|business development|account (manager|executive)|relationship manager|marketing executive|territory|retail/i,
    skills: ['Sales', 'Business Development', 'Account Management', 'CRM', 'Lead Generation', 'Negotiation', 'Customer Service', 'Market Research', 'B2B Sales'],
    soft: ['Communication', 'Persuasion', 'Resilience', 'Relationship Building'],
    strengths: ['building lasting client relationships', 'converting leads into loyal customers'],
    duties: [
      'Prospected and qualified leads, presented solutions and closed new business with customers',
      'Managed an assigned portfolio of accounts and maintained regular contact to grow repeat business',
      'Prepared quotations, proposals and presentations tailored to each client’s needs',
      'Tracked pipeline and customer interactions in {a} to forecast sales and plan follow-ups',
      'Researched markets and competitors to identify new opportunities and sharpen positioning',
    ],
  },
  {
    id: 'cs', label: 'Customer Service Representative', titles: /customer (service|support|care|success|experience)|call cent(er|re)|client service|front desk|receptionist|help ?line/i,
    skills: ['Customer Service', 'Communication', 'Conflict Resolution', 'CRM', 'Call Centre Operations', 'Data Entry', 'Microsoft Office', 'Cash Handling'],
    soft: ['Empathy', 'Patience', 'Active Listening', 'Resilience'],
    strengths: ['resolving customer issues on the first contact', 'staying calm, clear and courteous under pressure'],
    duties: [
      'Handled customer enquiries by phone, email and chat, resolving issues promptly and professionally',
      'Logged interactions and followed up on open cases in {a} to ensure nothing was missed',
      'De-escalated complaints and found solutions that protected customer relationships',
      'Explained products, services and policies clearly and accurately',
      'Shared recurring customer feedback with colleagues to help improve processes and service',
    ],
  },
  {
    id: 'accounting', label: 'Accountant / Finance Officer', titles: /account|financ|bookkeep|auditor|audit|tax|treasury|cashier|credit (control|analyst)|payroll|budget officer/i,
    skills: ['Financial Reporting', 'Bookkeeping', 'Reconciliation', 'Accounts Payable', 'Accounts Receivable', 'Tax Compliance', 'Excel', 'QuickBooks', 'IFRS', 'Budgeting', 'Auditing', 'Payroll'],
    soft: ['Attention to Detail', 'Integrity', 'Organisation', 'Time Management'],
    strengths: ['maintaining accurate, audit-ready records', 'supporting sound financial decisions with timely reporting'],
    duties: [
      'Maintained accurate books of account and prepared monthly management accounts and financial statements',
      'Processed payables and receivables and reconciled bank and ledger accounts promptly',
      'Prepared and filed statutory returns such as VAT, PAYE and withholding tax by their deadlines',
      'Supported budgeting and forecasting and highlighted variances to management',
      'Assisted external and internal auditors by preparing schedules and supporting documents',
      'Used {a} and {b} to automate recurring tasks and improve the accuracy of reports',
    ],
  },
  {
    id: 'hr', label: 'HR / Recruitment Officer', titles: /\bhr\b|human resource|recruit|talent|people (partner|operations)|personnel/i,
    skills: ['Human Resources', 'Recruitment', 'Onboarding', 'Payroll', 'Employee Relations', 'Performance Management', 'Training and Development', 'Compliance'],
    soft: ['Empathy', 'Confidentiality', 'Communication', 'Organisation'],
    strengths: ['finding and retaining the right people', 'handling sensitive matters with discretion and fairness'],
    duties: [
      'Managed the end-to-end recruitment process from sourcing and screening to interviews and offers',
      'Onboarded new hires and maintained accurate employee records and contracts',
      'Supported payroll, leave and benefits administration in line with labour regulations',
      'Advised managers and staff on policies and handled employee relations matters confidentially',
      'Coordinated training programmes and performance review cycles',
    ],
  },
  {
    id: 'admin', label: 'Administrative / Office Professional', titles: /admin|secretary|office (manager|assistant)|executive assistant|personal assistant|clerk|data entry|records/i,
    skills: ['Office Administration', 'Microsoft Office', 'Scheduling', 'Records Management', 'Data Entry', 'Communication', 'Customer Service', 'Google Workspace'],
    soft: ['Organisation', 'Discretion', 'Time Management', 'Reliability'],
    strengths: ['keeping offices and executives running smoothly', 'handling many priorities with accuracy and discretion'],
    duties: [
      'Managed calendars, travel and meetings for managers and ensured schedules ran on time',
      'Prepared correspondence, reports and presentations with accuracy and clear formatting',
      'Maintained organised physical and digital filing systems and up-to-date records',
      'Welcomed visitors, handled calls and directed enquiries to the right people',
      'Ordered office supplies and coordinated with vendors to keep operations running',
    ],
  },
  {
    id: 'teacher', label: 'Teacher / Trainer', titles: /teacher|tutor|lecturer|instructor|trainer|educator|facilitator|tutor/i,
    skills: ['Lesson Planning', 'Curriculum Development', 'Classroom Management', 'Student Assessment', 'Mentoring', 'Communication', 'E-Learning', 'Coaching'],
    soft: ['Patience', 'Communication', 'Empathy', 'Organisation'],
    strengths: ['making learning engaging and accessible', 'supporting learners of different abilities'],
    duties: [
      'Planned and delivered engaging lessons aligned to the curriculum and learners’ needs',
      'Assessed learner progress through assignments and exams and gave constructive feedback',
      'Managed classroom behaviour and created a safe, respectful learning environment',
      'Communicated regularly with parents and colleagues about learner progress',
      'Used digital tools and practical activities to make lessons interactive',
    ],
  },
  {
    id: 'nurse', label: 'Nurse / Clinical Officer', titles: /nurse|clinical|medical|doctor|physician|pharmac|lab(oratory)? tech|health (officer|worker)|midwi|dentist|public health/i,
    skills: ['Patient Care', 'Clinical Assessment', 'Medication Administration', 'Infection Control', 'Triage', 'Electronic Medical Records', 'First Aid', 'Health Education'],
    soft: ['Empathy', 'Composure', 'Communication', 'Teamwork'],
    strengths: ['delivering safe, compassionate patient care', 'working calmly in fast-moving clinical environments'],
    duties: [
      'Assessed, monitored and cared for patients in line with clinical protocols and infection-control standards',
      'Administered medication and treatments accurately and documented care in patient records',
      'Educated patients and families on treatment plans, prevention and healthy living',
      'Collaborated with doctors and multidisciplinary teams to coordinate patient care',
      'Responded to emergencies and triaged patients according to urgency',
    ],
  },
  {
    id: 'civil', label: 'Civil / Construction Engineer', titles: /civil|construction|site (engineer|supervisor|manager)|quantity surveyor|architect|structural|surveyor|foreman/i,
    skills: ['AutoCAD', 'Site Supervision', 'Quantity Surveying', 'Project Scheduling', 'Health and Safety', 'Structural Design', 'Budgeting', 'Revit'],
    soft: ['Leadership', 'Attention to Detail', 'Problem Solving', 'Communication'],
    strengths: ['delivering projects safely to specification', 'coordinating crews, contractors and clients on site'],
    duties: [
      'Supervised site activities to ensure work met drawings, specifications and safety requirements',
      'Prepared and reviewed drawings, bills of quantities and measurements using {a}',
      'Coordinated subcontractors and suppliers and tracked progress against the programme',
      'Enforced health and safety procedures and carried out routine site inspections',
      'Prepared progress reports and valuations for clients and project managers',
    ],
  },
  {
    id: 'engineer', label: 'Mechanical / Electrical Engineer or Technician', titles: /mechanical|electrical|electronic|technician|engineer|maintenance|mechanic|electrician|plumber|welder|fitter|artisan/i,
    skills: ['Preventive Maintenance', 'AutoCAD', 'SolidWorks', 'Quality Control', 'Health and Safety', 'Electrical Installation', 'Welding', 'Project Scheduling'],
    soft: ['Problem Solving', 'Attention to Detail', 'Teamwork', 'Safety Awareness'],
    strengths: ['diagnosing faults quickly and fixing them right', 'keeping equipment safe, efficient and compliant'],
    duties: [
      'Carried out preventive and corrective maintenance on equipment to minimise downtime',
      'Diagnosed mechanical and electrical faults and restored systems to safe working order',
      'Read technical drawings and manuals and followed safety and quality standards',
      'Maintained service records and reported on equipment condition and spare-part needs',
      'Installed and commissioned equipment and trained operators on safe use',
    ],
  },
  {
    id: 'logistics', label: 'Logistics / Supply Chain Officer', titles: /logistic|supply chain|procurement|warehouse|store(s)? (keeper|manager|officer)|inventory|driver|fleet|dispatch|transport|clearing|forwarding/i,
    skills: ['Logistics', 'Supply Chain Management', 'Procurement', 'Inventory Management', 'Warehouse Management', 'Fleet Management', 'Vendor Management', 'Excel', 'Reporting'],
    soft: ['Organisation', 'Negotiation', 'Reliability', 'Time Management'],
    strengths: ['keeping goods moving on time and on budget', 'tight control of stock and supplier performance'],
    duties: [
      'Coordinated the movement of goods, tracking shipments from dispatch to delivery',
      'Maintained accurate stock records, counts and reconciliations to prevent losses and shortages',
      'Sourced and negotiated with suppliers to secure quality goods at competitive prices',
      'Prepared purchase orders, delivery notes and documentation in line with procedures',
      'Reported on stock levels, deliveries and supplier performance to management',
    ],
  },
  {
    id: 'hospitality', label: 'Hospitality / Food Service Professional', titles: /hotel|hospitality|chef|cook|waiter|waitress|barista|bartender|restaurant|tour|travel|catering|housekeep|guest|front office|concierge/i,
    skills: ['Guest Relations', 'Food Safety', 'Customer Service', 'Front Desk Operations', 'Cash Handling', 'Menu Planning', 'Food Preparation', 'Event Planning'],
    soft: ['Friendliness', 'Teamwork', 'Composure', 'Time Management'],
    strengths: ['creating memorable guest experiences', 'staying composed and efficient during peak service'],
    duties: [
      'Welcomed guests and delivered friendly, efficient service that encouraged repeat visits',
      'Followed food-safety and hygiene standards in all preparation and service areas',
      'Handled reservations, orders, billing and cash accurately',
      'Worked with kitchen, bar and front-of-house colleagues to keep service running smoothly during peak periods',
      'Resolved guest concerns quickly and escalated issues when required',
    ],
  },
  {
    id: 'ngo', label: 'Programme / Community Development Officer', titles: /programme|program (officer|coordinator|manager|assistant)|community|ngo|development officer|monitoring|m&e|field officer|social worker|project officer|volunteer/i,
    skills: ['Monitoring and Evaluation', 'Proposal Writing', 'Stakeholder Management', 'Reporting', 'Community Health', 'Training and Development', 'Budgeting', 'Research'],
    soft: ['Cultural Awareness', 'Communication', 'Initiative', 'Teamwork'],
    strengths: ['delivering community programmes with measurable impact', 'working effectively with partners and beneficiaries'],
    duties: [
      'Implemented programme activities with communities and partners in line with work plans and budgets',
      'Collected, analysed and reported programme data to track progress against indicators',
      'Contributed to proposals, donor reports and learning documents',
      'Facilitated trainings and community meetings and mobilised participation',
      'Coordinated with local authorities and partners to resolve challenges and strengthen results',
    ],
  },
  {
    id: 'general', label: 'Professional', titles: /.*/,
    skills: ['Communication', 'Teamwork', 'Time Management', 'Problem Solving', 'Microsoft Office', 'Customer Service', 'Attention to Detail', 'Adaptability'],
    soft: ['Communication', 'Teamwork', 'Adaptability', 'Reliability'],
    strengths: ['learning quickly and taking ownership of results', 'working reliably as part of a team'],
    duties: [
      'Carried out day-to-day responsibilities accurately and on schedule',
      'Worked closely with colleagues and managers to meet team goals',
      'Communicated clearly with customers, colleagues and stakeholders',
      'Identified problems early and helped improve the way work was done',
      'Maintained accurate records and met quality and compliance standards',
    ],
  },
];

const bySpecificity = ROLES.filter((r) => r.id !== 'general' && r.id !== 'fullstack' && r.id !== 'engineer');
/** Pick the best role family for a job title (+ optional skills text). */
export function detectRole(title = '', extra = '') {
  const t = title.toLowerCase();
  let hit = bySpecificity.find((r) => r.titles.test(t));
  if (!hit) hit = ROLES.find((r) => r.id === 'fullstack').titles.test(t) ? ROLES.find((r) => r.id === 'fullstack') : null;
  if (!hit) hit = ROLES.find((r) => r.id === 'engineer').titles.test(t) ? ROLES.find((r) => r.id === 'engineer') : null;
  if (!hit && extra) {
    // fall back to skill overlap
    const lower = extra.toLowerCase();
    let best = null, bestN = 0;
    for (const r of ROLES) {
      if (r.id === 'general') continue;
      const n = r.skills.filter((s) => lower.includes(s.toLowerCase())).length;
      if (n > bestN) { best = r; bestN = n; }
    }
    if (bestN >= 2) hit = best;
  }
  return hit || ROLES.find((r) => r.id === 'general');
}
export const roleById = (id) => ROLES.find((r) => r.id === id) || ROLES[ROLES.length - 1];
