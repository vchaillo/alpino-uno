import { createSeasonDisplay } from './season-display.js?v=7';

const ICON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg>';
const ICON_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7"/></svg>';
const MODELS = [
  { id: 'outline', name: '01 · Cockpit épuré', label: 'Traits fins, volant ouvert', eyebrow: 'DRIVER VIEW / OUTLINE' },
  { id: 'racing', name: '02 · Volant racing', label: 'Poignées sculptées, écran intégré', eyebrow: 'DRIVER VIEW / RACING' },
  { id: 'telemetry', name: '03 · Console technique', label: 'Géométrie angulaire, repères techniques', eyebrow: 'DRIVER VIEW / TELEMETRY' }
];
function wheelDrawing(model) {
  const mechanical = model === 'telemetry';
  const racing = model === 'racing';
  const buttons = [[358,218],[358,258],[642,218],[642,258]].map(([x,y],index) => `<circle cx="${x}" cy="${y}" r="${racing ? 10 : 7}" class="wheel-control ${index === 0 || index === 3 ? 'red-control' : ''}"/>`).join('');
  const shiftLights = Array.from({length:13},(_,index)=>`<rect x="${421+index*12}" y="175" width="6" height="4" rx="1" class="shift-light ${index >= 9 ? 'red-light' : ''}"/>`).join('');
  const wheel = racing
    ? '<path class="wheel-body" d="M326 160 Q305 141 286 161 L267 205 Q257 225 267 258 L285 303 Q294 323 320 315 L369 285 H631 L680 315 Q706 323 715 303 L733 258 Q743 225 733 205 L714 161 Q695 141 674 160 L628 186 H372 Z"/><path class="grip-detail" d="M301 172 L284 208 Q276 231 286 259 L303 296 M699 172 L716 208 Q724 231 714 259 L697 296"/><path class="wheel-top" d="M326 160 L373 189 H627 L674 160"/>'
    : mechanical
    ? '<path class="wheel-body" d="M288 155 L334 153 L380 186 H620 L666 153 L712 155 L742 210 L734 268 L689 312 L636 286 H364 L311 312 L266 268 L258 210 Z"/><path class="grip-detail" d="M292 172 L278 215 L286 260 L316 289 M708 172 L722 215 L714 260 L684 289"/><path class="wheel-top" d="M336 167 L377 199 M664 167 L623 199"/>'
    : '<path class="wheel-body" d="M323 172 Q294 147 278 175 Q251 223 273 280 Q281 302 310 307 L362 278 H638 L690 307 Q719 302 727 280 Q749 223 722 175 Q706 147 677 172 L631 192 H369 Z"/><path class="grip-detail" d="M295 176 Q266 230 294 289 M705 176 Q734 230 706 289"/><path class="wheel-top" d="M323 172 L369 192 M677 172 L631 192"/>';
  return `<svg class="cockpit-drawing" viewBox="0 0 1000 420" fill="none" aria-hidden="true">
    <path class="cockpit-guide" d="M52 382 L142 147 Q166 98 240 85 M948 382 L858 147 Q834 98 760 85"/>
    <path class="cockpit-shell" d="M29 399 L117 174 Q142 90 235 56 Q356 15 500 20 Q644 15 765 56 Q858 90 883 174 L971 399"/>
    <path class="halo-outline" d="M151 156 Q162 71 257 52 Q377 26 500 28 Q623 26 743 52 Q838 71 849 156 M159 159 Q187 96 267 78 Q381 49 488 48 M512 48 Q619 49 733 78 Q813 96 841 159"/>
    <path class="halo-spine" d="M489 28 L481 153 Q500 170 519 153 L511 28"/>
    <path class="nose-guide" d="M482 151 L464 181 M518 151 L536 181"/>
    <path class="cockpit-edge" d="M63 365 L158 179 L264 204 M937 365 L842 179 L736 204"/>
    ${mechanical ? '<path class="technical-guide" d="M160 337 H840 M500 330 V379 M184 121 H240 M760 121 H816"/><circle class="technical-guide" cx="500" cy="238" r="174" stroke-dasharray="3 12"/>' : ''}
    <path class="paddle-outline" d="M253 192 L243 206 V264 L255 278 H277 V192 Z M747 192 L757 206 V264 L745 278 H723 V192 Z"/>
    ${wheel}<rect x="390" y="184" width="220" height="108" rx="${mechanical ? 3 : 10}" class="screen-outline"/>
    <rect x="399" y="193" width="202" height="90" rx="${mechanical ? 2 : 5}" class="screen-inner"/>
    ${shiftLights}${buttons}
    <circle cx="358" cy="299" r="${mechanical ? 14 : 12}" class="wheel-dial"/><circle cx="642" cy="299" r="${mechanical ? 14 : 12}" class="wheel-dial"/>
    <path class="dial-indicator" d="M358 290 V299 M642 290 V299"/>
    <path class="wheel-column" d="M467 293 L451 337 Q500 362 549 337 L533 293 M500 316 V339"/>
    <path class="cockpit-baseline" d="M145 377 H345 M655 377 H855"/>
    <text x="356" y="244" class="wheel-label" text-anchor="middle">N</text><text x="644" y="244" class="wheel-label" text-anchor="middle">P</text>
    ${mechanical ? '<text x="189" y="357" class="blueprint-label">ARCHIVE / 1950</text><text x="811" y="357" class="blueprint-label" text-anchor="end">SEASON CONTROL</text>' : ''}
  </svg>`;
}
export function createCockpits({ initialYear, onYearChange }) {
  const maximumYear = new Date().getFullYear();
  const root = document.querySelector('#cockpit-experiments');
  root.innerHTML = MODELS.map((model) => `<article class="cockpit-proposal cockpit-${model.id}" data-cockpit="${model.id}"><div class="cockpit-heading"><div><p class="eyebrow">${model.eyebrow}</p><h2>${model.name}</h2></div><span>${model.label}</span></div><div class="cockpit-stage">${wheelDrawing(model.id)}<button class="paddle paddle-left" data-step="-1" aria-label="${model.name} : saison précédente">${ICON_LEFT}<span>−</span></button><button class="wheel-screen" data-year-picker aria-label="${model.name} : choisir la saison ${initialYear}" aria-haspopup="dialog"><small>SAISON</small><span class="cockpit-year" aria-hidden="true">${initialYear}</span><span class="screen-hint">CHOISIR L’ANNÉE</span></button><button class="paddle paddle-right" data-step="1" aria-label="${model.name} : saison suivante">${ICON_RIGHT}<span>+</span></button></div><p class="cockpit-help">Palettes : −1 / +1 an <span>·</span> Écran : choisir une saison</p></article>`).join('');
  const displays = [...root.querySelectorAll('.cockpit-year')].map((element) => createSeasonDisplay(element, initialYear));
  const picker = document.querySelector('#season-dialog');
  const choices = document.querySelector('#season-choices');
  const search = document.querySelector('#season-search');
  let year = initialYear;
  function renderChoices() {
    const query = search.value.trim();
    choices.innerHTML = Array.from({length:maximumYear-1949},(_,index)=>maximumYear-index).filter(value=>String(value).includes(query)).map(value=>`<button type="button" data-pick-season="${value}" aria-pressed="${value === year}" class="${value === year ? 'selected-season' : ''}">${value}</button>`).join('') || '<p>Aucune saison trouvée.</p>';
  }
  function openPicker() { search.value = ''; renderChoices(); picker.showModal(); search.focus(); }
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-year-picker')) { openPicker(); return; }
    const step = Number(button.dataset.step);
    if (!step || year + step < 1950 || year + step > maximumYear) return;
    button.classList.remove('paddle-pressed');
    // A press can restart immediately after the preceding animation.
    void button.offsetWidth;
    button.classList.add('paddle-pressed');
    onYearChange(year + step);
  });
  search.addEventListener('input', renderChoices);
  choices.addEventListener('click', (event) => {
    const selected = event.target.closest('[data-pick-season]'); if (!selected) return;
    onYearChange(Number(selected.dataset.pickSeason)); picker.close();
  });
  document.querySelector('#close-season-picker').addEventListener('click', () => picker.close());
  picker.addEventListener('click', (event) => { if (event.target === picker) { const box = picker.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) picker.close(); } });
  function update(nextYear) {
    year = nextYear;
    displays.forEach(display=>display(year));
    root.querySelectorAll('[data-step]').forEach(button=>{ button.disabled = Number(button.dataset.step) < 0 ? year <= 1950 : year >= maximumYear; });
    root.querySelectorAll('[data-year-picker]').forEach(button=>button.setAttribute('aria-label', `${MODELS.find(model=>model.id === button.closest('[data-cockpit]').dataset.cockpit).name} : choisir la saison ${year}`));
  }
  update(initialYear);
  // Use the same navigation node in both layouts to preserve state and keyboard focus.
  const mobile = window.matchMedia('(max-width: 640px)');
  const tabs = document.querySelector('#tabs');
  function positionTabs() { (mobile.matches ? document.querySelector('#mobile-tabs-slot') : document.querySelector('.toolbar')).append(tabs); }
  positionTabs(); mobile.addEventListener('change', positionTabs);
  return { update };
}
