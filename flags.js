import { countryCode } from './branding.js';
const escapeAttribute = value => String(value || '').replace(/[&<>"']/g, character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
// Local SVGs make flags independent of the operating system's emoji font.
export function renderFlag(countryOrCode, label = countryOrCode) {
  const code = /^[A-Z]{2}$/.test(countryOrCode || '') ? countryOrCode : countryCode(countryOrCode);
  if (!code) return '';
  return `<img class="flag" src="assets/flags/${code.toLowerCase()}.svg" alt="${escapeAttribute(label)}" title="${escapeAttribute(label)}" width="24" height="18" loading="lazy" decoding="async">`;
}
