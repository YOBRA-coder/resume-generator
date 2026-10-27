// Anti-fabrication guard: any number in generated text must already exist in the user's own data.
const NUM = /(?:(?:KES|KSH|KSHS|USD|US\$|\$|€|£)\s?)?\d[\d,]*(?:\.\d+)?\s?(?:%|\+|x|k|m|bn|million|billion|thousand)?/gi;
const norm = (s) => s.toLowerCase().replace(/[\s,]/g, '').replace(/^(kes|ksh|kshs|usd|us\$|\$|€|£)/, '').replace(/(million|m)$/, 'm').replace(/(thousand|k)$/, 'k');

export function numbersIn(text = '') {
  return [...new Set((text.match(NUM) || []).map(norm).filter((n) => n && /\d/.test(n)))];
}
/** Numbers present in `output` that appear nowhere in `source` (string or array of strings). */
export function inventedNumbers(output = '', source = '', allowed = []) {
  const src = new Set([...numbersIn(Array.isArray(source) ? source.join('\n') : source), ...allowed.map((a) => norm(String(a)))]);
  const srcBare = new Set([...src].map((n) => n.replace(/[%+xkm]$/, '')));
  return numbersIn(output).filter((n) => !src.has(n) && !srcBare.has(n.replace(/[%+xkm]$/, '')));
}
export const hasMetric = (text = '') => /\d/.test(text) || /\b(dozens|hundreds|thousands|millions)\b/i.test(text);
