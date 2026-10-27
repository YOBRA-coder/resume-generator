import { uid, emptyProfile } from './profileUtils.js';
/** Demo profile used by "Try with sample data" so people can see the whole flow in one click. */
export function sampleProfile() {
  const p = emptyProfile();
  p.basics = { name: 'Amina Wanjiru', headline: '', email: 'amina.wanjiru@example.com', phone: '+254 712 000 111', location: 'Nairobi, Kenya', website: '', linkedin: 'linkedin.com/in/amina-wanjiru', github: 'github.com/aminaw', photo: null };
  p.targetRole = 'Frontend Developer';
  p.skills = ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Figma'];
  p.experience = [
    { id: uid(), company: 'Savannah Digital', role: 'Web Developer', location: 'Nairobi', start: '2022-02', end: '', current: true, notes: 'built websites for small business clients\nfixed bugs and sped up slow pages\nworked with designers on new layouts', bullets: [] },
    { id: uid(), company: 'Kilimo Hub', role: 'Junior Developer (Intern)', location: 'Nakuru', start: '2021-01', end: '2021-12', current: false, notes: '', bullets: [] },
  ];
  p.education = [{ id: uid(), school: 'Egerton University', degree: 'BSc', field: 'Computer Science', start: '2017', end: '2021', grade: '', notes: '' }];
  p.languages = [{ name: 'English', level: 'Fluent' }, { name: 'Swahili', level: 'Native' }];
  return p;
}
