import { useEffect, useState } from 'react';
// Hash routing keeps the app host-agnostic (works on any static host and offline).
const parse = () => {
  const h = (location.hash || '#/').slice(1);
  const [path, query = ''] = h.split('?');
  return { path: path || '/', parts: path.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(query)) };
};
export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => { const f = () => setR(parse()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}
export const go = (path) => { location.hash = path.startsWith('#') ? path : `#${path}`; };
