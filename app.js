import { enableTableSorting } from './table-sort.js';
import { trophyIcon } from './icons.js';
import { renderFlag } from './flags.js?v=12';
import { renderAnnualCalendar } from './calendar.js';
import { createCircuits } from './circuits.js?v=12';
import { createCockpits } from './cockpit.js?v=14';
import { createProfile } from './profile.js?v=14';
import { createStatistics } from './statistics.js?v=12';
import { teamColor } from './branding.js';
const API = 'https://api.jolpi.ca/ergast/f1/';
const CURRENT_YEAR = new Date().getFullYear();
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escapeHTML(url.href.replace(/^http:/, 'https:')) : '#'; } catch { return '#'; } };
const dateLabel = (race) => new Date(`${race.date}T${race.time || '12:00:00Z'}`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fullName = (driver) => `${driver?.givenName || ''} ${driver?.familyName || ''}`.trim();
const flag = renderFlag;
function teamIdentity(team, season) {
  return `<span class="identity" style="--team-color:${teamColor(team, season)}"><span class="team-dot" aria-hidden="true"></span><span>${escapeHTML(team?.name || '—')}</span></span>`;
}
function driverIdentity(driver, team, season, showFlag = true) {
  return `<span class="identity" style="--team-color:${teamColor(team, season)}"><span class="team-dot" aria-hidden="true"></span>${showFlag ? flag(driver?.nationality) : ''}<button class="driver-link" data-driver-name="${escapeHTML(fullName(driver))}">${escapeHTML(fullName(driver))}<span class="profile-arrow" aria-hidden="true">↗</span></button></span>`;
}
const storageKey = 'formula-one:collection:v1';
let collection = {};
try { const stored = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (stored && typeof stored === 'object' && !Array.isArray(stored)) collection = stored; } catch {}
const state = { year: CURRENT_YEAR, view: 'races', races: [], drivers: [], constructors: [], winners: [], generation: 0, detailGeneration: 0 };
const requestCache = new Map();
// Keep persistence behind a small adapter for a future Firebase implementation.
const preferences = {
  get(key) { const value = collection[key]; return value && typeof value === 'object' ? value : {}; },
  toggle(key, field, race) {
    const value = preferences.get(key);
    collection[key] = { ...value, [field]: !value[field], race };
    if (field === 'watched' && collection[key].watched) collection[key].watchlist = false;
    if (field === 'watchlist' && collection[key].watchlist) collection[key].watched = false;
    try { localStorage.setItem(storageKey, JSON.stringify(collection)); } catch { $('#notice').textContent = 'La sauvegarde locale est indisponible dans ce navigateur.'; }
  }
};
async function request(path) {
  const key = `formula-one:api:${path}`;
  if (requestCache.has(key)) return requestCache.get(key);
  let cached;
  try { cached = JSON.parse(sessionStorage.getItem(key)); } catch {}
  if (cached && Date.now() - cached.saved < 600000) return cached.data;
  const pending = (async () => {
    const response = await fetch(`${API}${path}${path.includes('?') ? '&' : '?'}limit=100`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(response.status === 429 ? 'La source reçoit trop de demandes. Réessaie dans une minute.' : `La source ne répond pas (${response.status}).`);
    const body = await response.json();
    if (!body.MRData) throw new Error('La source a renvoyé des données inattendues.');
    try { sessionStorage.setItem(key, JSON.stringify({ saved: Date.now(), data: body.MRData })); } catch {}
    return body.MRData;
  })();
  requestCache.set(key, pending);
  try { return await pending; } catch (error) { requestCache.delete(key); throw error; }
}
function raceKey(race) { return `${race.season}-${race.round}`; }
function isUpcoming(race) { return new Date(`${race.date}T${race.time || '23:59:59Z'}`) > new Date(); }
function matches(race) {
  const search = $('#search').value.toLowerCase();
  const winner = state.winners.find((item) => item.round === race.round)?.Results?.[0];
  const text = `${race.raceName} ${race.Circuit.circuitName} ${race.Circuit.Location.locality} ${race.Circuit.Location.country} ${fullName(winner?.Driver)} ${race.season}`.toLowerCase();
  const filter = $('#filter').value;
  return text.includes(search) && (filter === 'all' || (filter === 'upcoming' ? isUpcoming(race) : filter === 'finished' ? !isUpcoming(race) : preferences.get(raceKey(race))[filter]));
}
function actions(race) {
  const saved = preferences.get(raceKey(race));
  return `<div class="card-actions"><button class="detail" data-detail="${raceKey(race)}">Explorer <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button>${[['favorite', '☆', 'Favori'], ['watched', '✓', 'Vue'], ['watchlist', '+', 'À voir']].map(([field, icon, label]) => `<button data-key="${raceKey(race)}" data-field="${field}" class="${saved[field] ? 'active' : ''}" aria-pressed="${Boolean(saved[field])}" aria-label="${label} : ${escapeHTML(race.raceName)}">${icon} ${label}</button>`).join('')}</div>`;
}
function renderRaces() {
  const races = state.view === 'collection' ? Object.values(collection).filter((item) => item.race && (item.favorite || item.watched || item.watchlist)).map((item) => item.race).sort((a,b) => b.date.localeCompare(a.date)).filter(matches) : state.races.filter(matches);
  $('#results').innerHTML = races.length ? `<div class="grid">${races.map((race) => {
    const winner = state.view === 'collection' ? null : state.winners.find((item) => item.round === race.round)?.Results?.[0];
    return `<article class="race ${isUpcoming(race) ? 'upcoming' : ''}"><div class="card-top"><span class="round">ROUND ${String(race.round).padStart(2, '0')} · ${race.season}</span><span>${escapeHTML(dateLabel(race))}</span></div><h3>${flag(race.Circuit.Location.country)}${escapeHTML(race.raceName)}</h3>${circuits.raceCard(race)}<div class="winner"><small>${isUpcoming(race) ? 'PROCHAIN RENDEZ-VOUS' : winner ? 'VAINQUEUR' : 'RÉSULTATS'}</small>${winner ? trophyIcon + driverIdentity(winner.Driver, winner.Constructor, race.season) : isUpcoming(race) ? 'À venir' : 'Consulter le détail de la course'}</div>${actions(race)}</article>`;
  }).join('')}</div>` : '<p class="empty">Aucune course ici. Change les filtres ou ajoute des courses à ta collection.</p>';
}
function standingsTable(items, constructors = false) {
  const query = $('#search').value.toLowerCase();
  const max = Math.max(1, ...items.map((item) => Number(item.points)));
  const filtered = items.filter((item) => `${constructors ? item.Constructor.name : fullName(item.Driver)} ${item.Constructors?.map((team) => team.name).join(' ') || ''}`.toLowerCase().includes(query));
  if (!filtered.length) return '<p class="empty">Aucun classement disponible pour cette sélection.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>Pos.</th><th>${constructors ? 'Écurie' : 'Pilote'}</th>${constructors ? '<th>Nationalité</th>' : '<th>Nationalité</th><th>Écurie</th>'}<th>Victoires</th><th>Points</th></tr></thead><tbody>${filtered.map((item) => `<tr style="--team-color:${teamColor(constructors ? item.Constructor : item.Constructors?.[0], state.year)}"><td>${Number(item.position) === 1 && state.year < CURRENT_YEAR ? trophyIcon : ''}${escapeHTML(item.position)}</td><td><strong>${constructors ? teamIdentity(item.Constructor, state.year) : driverIdentity(item.Driver, item.Constructors?.[0], state.year, false)}</strong></td>${constructors ? '' : `<td>${flag(item.Driver.nationality)}</td>`}<td>${constructors ? `${flag(item.Constructor.nationality)} ${escapeHTML(item.Constructor.nationality)}` : `<span class="team-list">${(item.Constructors || []).map((team) => teamIdentity(team, state.year)).join('')}</span>`}</td><td>${escapeHTML(item.wins)}</td><td class="points"><strong>${escapeHTML(item.points)}</strong><span class="bar" style="width:${Number(item.points) / max * 100}%"></span></td></tr>`).join('')}</tbody></table></div>`;
}
function render() {
  const titles = { races: ['LE CALENDRIER', 'Les Grands Prix'], drivers: ['LE CHAMPIONNAT', 'Classement des pilotes'], constructors: ['LE CHAMPIONNAT', 'Classement des écuries'], calendar: ['LA SAISON EN UN COUP D’ŒIL', `Calendrier ${state.year}`], circuits: ['LES TRACÉS DE LA FORMULE 1', 'Circuits & records'], profile: ['TON ESPACE PERSONNEL', 'Mon profil'], statistics: ['LES RECORDS DE LA FORMULE 1', 'Statistiques & carrières'], collection: ['TON HISTOIRE AVEC LA F1', 'Ma collection · toutes les saisons'] };
  $('#section-label').textContent = titles[state.view][0]; $('#section-title').textContent = titles[state.view][1];
  document.body.classList.toggle('profile-view', state.view === 'profile');
  $('.profile-nav').setAttribute('aria-current', state.view === 'profile' ? 'page' : 'false');
  $('.filters').hidden = state.view === 'profile';
  $('#filter').hidden = !['races', 'collection', 'calendar'].includes(state.view);
  $('#tabs').querySelectorAll('button').forEach((button) => { if (button.dataset.view === state.view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (state.view === 'calendar') $('#results').innerHTML = renderAnnualCalendar({year:state.year,races:state.races.filter(matches),escapeHTML,renderFlag}); else if (state.view === 'circuits') circuits.render($('#search').value); else if (state.view === 'profile') profile.render(); else if (state.view === 'statistics') statistics.render($('#search').value); else if (['races', 'collection'].includes(state.view)) renderRaces(); else $('#results').innerHTML = standingsTable(state[state.view], state.view === 'constructors');
  $('#results').setAttribute('aria-busy', 'false');
}
async function loadSeason() {
  const generation = ++state.generation;
  cockpits.update(state.year); $('#season').value = state.year;
  $('#previous').disabled = state.year <= 1950; $('#next').disabled = state.year >= CURRENT_YEAR;
  $('#notice').textContent = 'Chargement de la saison…'; $('#results').setAttribute('aria-busy', 'true');
  state.races = []; state.winners = []; state.drivers = []; state.constructors = []; $('#stats').innerHTML = ''; render(); $('#results').setAttribute('aria-busy', 'true');
  const outcomes = await Promise.allSettled([request(`${state.year}/`), request(`${state.year}/driverstandings/`), request(`${state.year}/constructorstandings/`), request(`${state.year}/results/1/`), circuits.load()]);
  if (generation !== state.generation) return;
  const data = outcomes.map((result) => result.status === 'fulfilled' ? result.value : null);
  state.races = data[0]?.RaceTable?.Races || []; state.drivers = data[1]?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []; state.constructors = data[2]?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []; state.winners = data[3]?.RaceTable?.Races || [];
  const completed = state.winners.length;
  $('#stats').innerHTML = [['GRANDS PRIX', state.races.length || '—'], ['RÉSULTATS PUBLIÉS', completed], [state.year === CURRENT_YEAR ? 'LEADER PILOTES' : 'CHAMPION PILOTES', fullName(state.drivers[0]?.Driver) || '—'], ['LEADER ÉCURIES', state.constructors[0]?.Constructor?.name || '—']].map(([label, value]) => `<div class="stat"><small>${label}</small><strong>${escapeHTML(value)}</strong></div>`).join('');
  const failure = outcomes.find((result) => result.status === 'rejected');
  $('#notice').innerHTML = failure ? `${escapeHTML(failure.reason.message)} <button id="retry">Réessayer</button>` : `Saison ${state.year} · dates affichées dans ton fuseau horaire · données Jolpica F1`;
  $('#retry')?.addEventListener('click', loadSeason); render();
}
const dialog = $('#race-dialog');
const statistics = createStatistics({ $, escapeHTML, dialog, driverIdentity, state });
const profile = createProfile({ $, escapeHTML });
const circuits = createCircuits({ $, escapeHTML, state });
const cockpits = createCockpits({ initialYear: CURRENT_YEAR, onYearChange(year) { state.year = year; loadSeason(); } });
async function showSession(race, session, token) {
  $('#session-results').innerHTML = '<p class="empty">Chargement…</p>';
  try {
    const data = await request(`${race.season}/${race.round}/${session}/`);
    if (token !== state.detailGeneration) return;
    const record = data.RaceTable?.Races?.[0];
    const rows = record?.[session === 'qualifying' ? 'QualifyingResults' : session === 'sprint' ? 'SprintResults' : 'Results'] || [];
    $('#session-results').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Pos.</th><th>Pilote</th><th>Écurie</th>${session === 'qualifying' ? '<th>Q1</th><th>Q2</th><th>Q3</th>' : '<th>Grille</th><th>Tours</th><th>Temps / statut</th><th>Points</th>'}</tr></thead><tbody>${rows.map((row) => `<tr><td>${Number(row.position) === 1 && session !== 'qualifying' ? trophyIcon : ''}${escapeHTML(row.position)}</td><td>${driverIdentity(row.Driver, row.Constructor, race.season)}</td><td>${teamIdentity(row.Constructor, race.season)}</td>${session === 'qualifying' ? ['Q1','Q2','Q3'].map((key) => `<td>${escapeHTML(row[key] || '—')}</td>`).join('') : `<td>${escapeHTML(row.grid)}</td><td>${escapeHTML(row.laps)}</td><td>${escapeHTML(row.Time?.time || row.status)}</td><td>${escapeHTML(row.points)}</td>`}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">Aucune donnée publiée pour cette session. Les archives anciennes ne couvrent pas toutes les qualifications.</p>';
  } catch (error) { if (token === state.detailGeneration) $('#session-results').innerHTML = `<p class="empty">${escapeHTML(error.message)} <button data-session="${session}">Réessayer</button></p>`; }
}
let selectedRace;
function openRace(race) {
  selectedRace = race; const token = ++state.detailGeneration;
  $('#race-detail').innerHTML = `<p class="eyebrow">SAISON ${race.season} · ROUND ${race.round}</p><h2 id="race-title">${flag(race.Circuit.Location.country)}${escapeHTML(race.raceName)}</h2><p class="detail-meta">${escapeHTML(race.Circuit.circuitName)} · ${escapeHTML(race.Circuit.Location.locality)}, ${escapeHTML(race.Circuit.Location.country)}<br>${escapeHTML(dateLabel(race))}${race.time ? ` · ${escapeHTML(new Date(`${race.date}T${race.time}`).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}))}` : ''}<br><a href="${safeURL(race.Circuit.url)}" target="_blank" rel="noopener noreferrer">Découvrir le circuit ↗</a> · <a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(race.Circuit.Location.lat)}&mlon=${encodeURIComponent(race.Circuit.Location.long)}#map=14/${encodeURIComponent(race.Circuit.Location.lat)}/${encodeURIComponent(race.Circuit.Location.long)}" target="_blank" rel="noopener noreferrer">Localiser ↗</a></p>${circuits.detailLink(race)}<div class="session-tabs"><button class="active" data-session="results">Course</button><button data-session="qualifying">Qualifications</button><button data-session="sprint" disabled title="Vérification des données Sprint…">Sprint</button></div><div id="session-results"></div>`;
  if (!dialog.open) dialog.showModal(); showSession(race, 'results', token);
  const sprintButton = $('#race-detail [data-session="sprint"]');
  if (Number(race.season) < 2021) { sprintButton.title = 'Pas de Sprint pour ce Grand Prix'; return; }
  request(`${race.season}/${race.round}/sprint/`).then(data => {
    if (selectedRace !== race || !sprintButton.isConnected) return;
    const available = Boolean(data.RaceTable?.Races?.[0]?.SprintResults?.length);
    sprintButton.disabled = !available;
    sprintButton.title = available ? 'Résultats du Sprint' : 'Aucune donnée Sprint publiée pour ce Grand Prix';
  }).catch(() => { if (sprintButton.isConnected) sprintButton.title = 'Données Sprint indisponibles'; });
}
$('#season').innerHTML = Array.from({ length: CURRENT_YEAR - 1949 }, (_, index) => `<option>${CURRENT_YEAR - index}</option>`).join('');
$('#season').addEventListener('change', (event) => { state.year = Number(event.target.value); loadSeason(); });
$('#previous').addEventListener('click', () => { if (state.year > 1950) { state.year--; loadSeason(); } });
$('#next').addEventListener('click', () => { if (state.year < CURRENT_YEAR) { state.year++; loadSeason(); } });
$('#tabs').addEventListener('click', (event) => { const view = event.target.closest('[data-view]')?.dataset.view; if (view) { state.view = view; render(); } });
$('#search').addEventListener('input', render); $('#filter').addEventListener('change', render);
$('#results').addEventListener('click', (event) => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.calendarDate) { const race = state.races.find(item=>item.date === button.dataset.calendarDate); if (race) openRace(race); return; }
  const key = button.dataset.detail || button.dataset.key;
  const race = state.races.find((item) => raceKey(item) === key) || preferences.get(key).race;
  if (!race) return;
  if (button.dataset.detail) openRace(race); else { preferences.toggle(key, button.dataset.field, race); render(); }
});
$('#race-detail').addEventListener('click', (event) => {
  const target = event.target.closest('[data-session]'); const session = target?.dataset.session; if (!session || target.disabled) return;
  $('#race-detail').querySelectorAll('.session-tabs button').forEach((button) => button.classList.toggle('active', button.dataset.session === session));
  showSession(selectedRace, session, ++state.detailGeneration);
});
$('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { state.detailGeneration++; });
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
enableTableSorting();
loadSeason();

function navigateProfile() { if (location.hash === '#profil') { state.view = 'profile'; render(); window.scrollTo({top:0,behavior:'instant'}); } else if (state.view === 'profile') { state.view = 'races'; render(); } }
window.addEventListener('hashchange', navigateProfile);
navigateProfile();
