const METRICS = {
  totalChampionshipWins: ['Titres mondiaux', 'Championnats pilotes remportés. La saison en cours compte uniquement si le titre a déjà été attribué par la source.'],
  totalRaceWins: ['Victoires en Grand Prix', 'Victoires en course principale, hors sprints.'],
  totalPolePositions: ['Pole positions', 'Poles attribuées par la source : elles peuvent différer de la première place sur la grille après une pénalité.'],
  totalSprintRaceWins: ['Victoires en sprint', 'Victoires dans les courses sprint, organisées depuis 2021.'],
  totalPodiums: ['Podiums', 'Top 3 des Grands Prix, hors sprints.'],
  totalFastestLaps: ['Meilleurs tours', 'Meilleurs tours en course, qu’ils aient rapporté un point ou non.'],
  totalRaceStarts: ['Départs en Grand Prix', 'Courses principales effectivement démarrées, hors sprints.'],
  totalRaceLaps: ['Tours parcourus', 'Tours parcourus en Grand Prix. Ce chiffre ne correspond pas aux tours menés.'],
  totalGrandSlams: ['Grands chelems', 'Pole, victoire, meilleur tour et chaque tour mené lors du même Grand Prix.'],
  winRate: ['Taux de victoire', 'Victoires divisées par les départs en Grand Prix. Au moins 20 départs pour ce classement.']
};
const number = (value) => Number(value || 0).toLocaleString('fr-FR', {maximumFractionDigits:1});
const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function createStatistics({ $, escapeHTML, dialog, driverIdentity, state }) {
  let snapshot, pending, generation = 0;
  let metric = 'totalChampionshipWins', period = 'all', showAll = false;
  const countryFlag = (driver) => `<span class="flag" role="img" aria-label="${escapeHTML(driver.country)}">${String.fromCodePoint(...[...driver.countryCode].map((letter) => 127397 + letter.charCodeAt(0)))}</span>`;
  const driverLink = (driver) => `<button class="driver-link" data-driver-id="${escapeHTML(driver.id)}">${countryFlag(driver)}<span>${escapeHTML(driver.name)}</span><span class="profile-arrow" aria-hidden="true">↗</span></button>`;
  async function load() {
    if (snapshot) return snapshot;
    if (!pending) pending = fetch('./data/statistics.json.gz').then((response) => { if (!response.ok) throw Error('Les statistiques sont indisponibles.'); return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json(); }).then((data) => { if (!Array.isArray(data.drivers)) throw Error('Données de statistiques invalides.'); snapshot = data; return data; }).catch((error) => { pending = null; throw error; });
    return pending;
  }
  const sourceNote = () => `<p class="statistics-source">Données au ${new Date(snapshot.through + 'T12:00:00Z').toLocaleDateString('fr-FR')} · <a href="https://github.com/f1db/f1db" target="_blank" rel="noopener">F1DB ${escapeHTML(snapshot.version)} ↗</a> · CC BY 4.0. Les statistiques peuvent être mises à jour après le calendrier.</p>`;
  function values(driver) {
    const result = period === 'all' ? driver : driver.seasons.find((season) => String(season.year) === period);
    return result ? { ...driver, ...result, winRate: result.totalRaceStarts ? result.totalRaceWins / result.totalRaceStarts * 100 : 0 } : null;
  }
  const formatMetric = (value) => `${number(value)}${metric === 'winRate' ? ' %' : ''}`;
  async function render(query = '') {
    const token = ++generation;
    $('#results').innerHTML = '<p class="empty">Chargement des records…</p>';
    try {
      await load();
      if (token !== generation || state.view !== 'statistics') return;
      if (period !== 'all' && metric === 'totalChampionshipWins') metric = 'totalRaceWins';
      const all = snapshot.drivers.map(values).filter(Boolean).filter((driver) => Number(driver[metric]) > 0 && (metric !== 'winRate' || driver.totalRaceStarts >= 20)).sort((a,b) => b[metric] - a[metric] || a.name.localeCompare(b.name));
      let rank = 0, lastValue;
      const ranked = all.map((driver,index) => { if (driver[metric] !== lastValue) rank = index + 1; lastValue = driver[metric]; return {driver,rank}; });
      const filtered = ranked.filter(({driver}) => normalize(driver.name + driver.country).includes(normalize(query)));
      const visible = showAll || query ? filtered : filtered.slice(0,20);
      const maximum = all[0]?.[metric] || 1;
      const directory = snapshot.drivers.filter((driver) => normalize(driver.name + driver.country).includes(normalize(query))).sort((a,b) => b.totalRaceStarts - a.totalRaceStarts);
      $('#results').innerHTML = `<section class="statistics-controls"><label>Record<select id="record-metric">${Object.entries(METRICS).filter(([key]) => period === 'all' || key !== 'totalChampionshipWins').map(([key,[label]]) => `<option value="${key}" ${key === metric ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Période<select id="record-period"><option value="all">Toute la carrière</option>${Array.from({length:new Date().getFullYear()-1949},(_,i) => new Date().getFullYear()-i).map((year) => `<option ${String(year) === period ? 'selected' : ''}>${year}</option>`).join('')}</select></label></section><div class="record-summary"><p class="eyebrow">${period === 'all' ? 'DEPUIS 1950' : 'SAISON ' + period}</p><h3>${METRICS[metric][0]}</h3><p>${METRICS[metric][1]}</p>${all.length ? `<div class="record-leader">${driverLink(all[0])}<strong>${formatMetric(all[0][metric])}</strong></div>` : ''}</div>${visible.length ? `<div class="table-wrap"><table><thead><tr><th>Rang</th><th>Pilote · ouvrir la fiche</th><th>${METRICS[metric][0]}</th></tr></thead><tbody>${visible.map(({driver,rank}) => `<tr><td>${rank}</td><td>${driverLink(driver)}</td><td class="points"><strong>${formatMetric(driver[metric])}</strong><span class="bar" style="width:${driver[metric]/maximum*100}%"></span></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Aucun résultat pour cette sélection.</p>'}${!query && filtered.length > 20 ? `<button id="records-expand" class="records-expand">${showAll ? 'Afficher le top 20' : `Afficher les ${filtered.length} pilotes`}</button>` : ''}${sourceNote()}<section class="driver-directory"><p class="eyebrow">LES PILOTES</p><h3>Explorer les carrières</h3><p>Recherche un nom en haut de la page pour retrouver sa fiche, même s’il ne figure pas dans le record sélectionné.</p><div class="driver-grid">${directory.slice(0,query ? 100 : 24).map(driverLink).join('')}</div>${query && directory.length > 100 ? '<p>Plus de 100 pilotes correspondent. Précise ta recherche.</p>' : ''}</section>`;
      $('#record-metric').addEventListener('change', (event) => { metric = event.target.value; render($('#search').value); });
      $('#record-period').addEventListener('change', (event) => { period = event.target.value; render($('#search').value); });
      $('#records-expand')?.addEventListener('click', () => { showAll = !showAll; render($('#search').value); });
    } catch (error) { if (state.view === 'statistics' && token === generation) { $('#results').innerHTML = `<p class="empty">${escapeHTML(error.message)} <button id="retry-statistics">Réessayer</button></p>`; $('#retry-statistics').addEventListener('click', () => render(query)); } }
  }
  async function openProfile({id, name}, team) {
    const token = ++generation;
    state.detailGeneration++;
    $('#race-detail').innerHTML = '<p class="empty">Chargement de la fiche pilote…</p>';
    if (!dialog.open) dialog.showModal();
    try {
      await load();
      if (token !== generation || !dialog.open) return;
      const exact = snapshot.drivers.find((driver) => id ? driver.id === id : normalize(driver.name) === normalize(name));
      const candidates = snapshot.drivers.filter((driver) => name && normalize(name).endsWith(normalize(driver.lastName.replace(/\s+Jr\.?$/i, ''))) && normalize(name).includes(normalize(driver.firstName.split(' ')[0])));
      const driver = exact || (candidates.length === 1 ? candidates[0] : null);
      if (!driver) { $('#race-detail').innerHTML = '<h2 id="race-title">Fiche indisponible</h2><p>Ce pilote n’a pas encore été identifié dans les archives de statistiques.</p>'; return; }
      const seasons = [...driver.seasons].sort((a,b) => b.year-a.year);
      const ageDate = driver.birthDate ? new Date(driver.birthDate + 'T12:00:00Z').toLocaleDateString('fr-FR') : '—';
      $('#race-detail').innerHTML = `<p class="eyebrow">FICHE PILOTE · STATISTIQUES DE CARRIÈRE</p><h2 id="race-title">${countryFlag(driver)} ${escapeHTML(driver.name)}</h2><p class="detail-meta">${escapeHTML(driver.country)} · Né le ${ageDate}<br>${seasons.length ? `Saisons : ${Math.min(...seasons.map(row=>row.year))} — ${Math.max(...seasons.map(row=>row.year))} · ${seasons.length} saisons disputées` : ''}</p><div class="profile-metrics">${Object.entries(METRICS).map(([key,[label,description]]) => `<div class="profile-stat" title="${escapeHTML(description)}"><small>${label}</small><strong>${key === 'winRate' ? number(driver.totalRaceStarts ? driver.totalRaceWins / driver.totalRaceStarts *100 : 0) + ' %' : number(driver[key])}</strong></div>`).join('')}<div class="profile-stat"><small>Meilleur classement mondial</small><strong>${driver.bestChampionshipPosition || '—'}</strong></div><div class="profile-stat unavailable"><small>Tours menés</small><strong>Non disponible</strong></div></div><p class="statistics-source">Les tours menés ne sont pas fournis par cette source ; ils ne sont pas déduits des tours parcourus. Les points bruts ne sont pas comparables entre époques, car les barèmes ont changé.</p><h3>La carrière, saison par saison</h3><div class="table-wrap"><table><thead><tr><th>Saison</th><th>Classement</th><th>Départs</th><th>Victoires</th><th>Podiums</th><th>Poles</th><th>Sprints gagnés</th><th>Points</th></tr></thead><tbody>${seasons.map((row) => `<tr><td>${row.year}</td><td>${row.position || '—'}${row.year === new Date().getFullYear() ? ' · en cours' : ''}</td><td>${number(row.totalRaceStarts)}</td><td>${number(row.totalRaceWins)}</td><td>${number(row.totalPodiums)}</td><td>${number(row.totalPolePositions)}</td><td>${number(row.totalSprintRaceWins)}</td><td>${number(row.totalPoints)}</td></tr>`).join('')}</tbody></table></div>${sourceNote()}`;
    } catch (error) { if (token === generation) $('#race-detail').innerHTML = `<h2 id="race-title">Fiche indisponible</h2><p>${escapeHTML(error.message)}</p><button id="retry-profile">Réessayer</button>`; $('#retry-profile')?.addEventListener('click', () => openProfile({id,name},team)); }
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-driver-id],[data-driver-name]');
    if (button) openProfile({ id: button.dataset.driverId, name: button.dataset.driverName });
  });
  dialog.addEventListener('close', () => generation++);
  return { render, openProfile };
}
