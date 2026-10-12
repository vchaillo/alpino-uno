export const galleryIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/></svg>';
export const listIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h2m4 0h12M3 12h2m4 0h12M3 19h2m4 0h12"/></svg>';
const KEY = 'calpino-uno:layouts:v1';
export function createViewLayout() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  function get(view) { return saved[view] === 'list' ? 'list' : 'gallery'; }
  function set(view, layout) { if (!['list','gallery'].includes(layout)) return; saved[view] = layout; try { localStorage.setItem(KEY,JSON.stringify(saved)); } catch {} }
  function controls(view) {
    if (!['races','collection','circuits'].includes(view)) return '';
    return `<div class="view-layout" role="group" aria-label="Présentation"><button type="button" data-layout="gallery" aria-label="Vue galerie" title="Vue galerie" aria-pressed="${get(view)==='gallery'}">${galleryIcon}</button><button type="button" data-layout="list" aria-label="Vue liste" title="Vue liste" aria-pressed="${get(view)==='list'}">${listIcon}</button></div>`;
  }
  return { get,set,controls };
}
