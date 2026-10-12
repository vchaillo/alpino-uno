import { renderFlag } from './flags.js';
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function resolveCircuit(circuits, input) {
  if (typeof input === 'string') return circuits.find(circuit=>circuit.id === input);
  const aliases = { albert_park:'melbourne', americas:'austin', red_bull_ring:'spielberg', spa:'spa-francorchamps', yas_marina:'yas-marina', marina_bay:'marina-bay', rodriguez:'mexico-city', villeneuve:'montreal', sochi:'sirius', losail:'lusail', catalunya:'catalunya' };
  const identifier = aliases[input?.circuitId] || input?.circuitId;
  const direct = circuits.find(circuit=>circuit.id === identifier || normalize(circuit.fullName) === normalize(input?.circuitName));
  if (direct) return direct;
  const latitude = Number(input?.Location?.lat), longitude = Number(input?.Location?.long);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  // Match only nearby locations when the APIs use different circuit identifiers.
  const nearby = circuits.map(circuit=>({circuit,distance:Math.hypot((circuit.latitude-latitude)*111,(circuit.longitude-longitude)*111*Math.cos(latitude*Math.PI/180))})).sort((a,b)=>a.distance-b.distance);
  return nearby[0]?.distance < 5 ? nearby[0].circuit : null;
}
const OPENING_HISTORY = {
  silverstone:{year:1948,url:'https://www.silverstone.co.uk/about/our-history'},
  'spa-francorchamps':{year:1921,url:'https://www.spa-francorchamps.be/fr/le-plus-beau-circuit-du-monde'},
  monza:{year:1922,url:'https://www.monzanet.it/en/autodrome/'}
};
export function createCircuits({ $, escapeHTML, state }) {
  let snapshot, pending, profileGeneration = 0;
  const modal = $('#circuit-dialog');
  const flag = renderFlag;
  async function load() {
    if (snapshot) return snapshot;
    if (!pending) pending = fetch('./data/circuits.json.gz').then(response=>{if(!response.ok)throw Error('Les fiches circuits sont indisponibles.');return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();}).then(data=>{snapshot=data;return data;}).catch(error=>{pending=null;throw error;});
    return pending;
  }
  function circuit(input) { return snapshot ? resolveCircuit(snapshot.circuits,input) : null; }
  function layoutFor(record, race) {
    const event = race && record.events.find(event=>event.year === Number(race.season) && event.round === Number(race.round));
    return record.layouts.find(layout=>layout.id === event?.layoutId) || [...record.layouts].sort((a,b)=>b.lastYear-a.lastYear || b.firstYear-a.firstYear)[0];
  }
  function drawing(record, layout, className='') {
    if (!layout?.drawing) return '<span class="circuit-map-empty">Tracé indisponible</span>';
    const {viewBox,paths} = layout.drawing;
    return `<svg class="circuit-map ${className}" viewBox="${escapeHTML(viewBox)}" role="img" aria-label="Tracé de ${escapeHTML(record.fullName)}, configuration ${layout.firstYear}–${layout.lastYear}">${paths.map(path=>`<path d="${escapeHTML(path.d)}" transform="${escapeHTML(path.transform)}"/>`).join('')}</svg>`;
  }
  function raceCard(race) {
    const record = circuit(race.Circuit);
    if (!record) return `<p>${escapeHTML(race.Circuit.circuitName)}<br>${escapeHTML(race.Circuit.Location.locality)} · ${escapeHTML(race.Circuit.Location.country)}</p>`;
    const layout = layoutFor(record,race);
    return `<button class="circuit-card-link" data-circuit="${record.id}" data-circuit-season="${race.season}" data-circuit-round="${race.round}" aria-label="Fiche du circuit ${escapeHTML(record.fullName)}">${drawing(record,layout)}<span><strong>${escapeHTML(race.Circuit.circuitName)}</strong><small>${escapeHTML(race.Circuit.Location.locality)} · ${escapeHTML(race.Circuit.Location.country)}</small><span class="circuit-link-hint">Fiche circuit <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></span></span></button>`;
  }
  function detailLink(race) {
    const record = circuit(race.Circuit);
    return record ? `<button class="circuit-detail-link" data-circuit="${record.id}" data-circuit-season="${race.season}" data-circuit-round="${race.round}">Voir la fiche circuit</button>` : '';
  }
  function render(query='') {
    if (!snapshot) { $('#results').innerHTML = '<p class="empty">Chargement des circuits…</p>'; load().then(()=>{if(state.view==='circuits')render($('#search').value);}).catch(error=>{if(state.view==='circuits')$('#results').innerHTML=`<p class="empty">${escapeHTML(error.message)}</p>`;});return; }
    const records = snapshot.circuits.filter(record=>normalize(`${record.fullName} ${record.name} ${record.placeName} ${record.country}`).includes(normalize(query))).sort((a,b)=>b.raceCount-a.raceCount || a.name.localeCompare(b.name));
    $('#results').innerHTML = `<p class="statistics-source">${records.length} circuit${records.length > 1 ? 's' : ''} · statistiques jusqu’au ${new Date(snapshot.through+'T12:00:00Z').toLocaleDateString('fr-FR')} · les fiches couvrent toutes les saisons.</p><div class="grid circuit-grid">${records.map(record=>`<article class="race circuit-directory-card"><button class="circuit-open" data-circuit="${record.id}">${drawing(record,layoutFor(record))}<h3>${flag(record.countryCode)} ${escapeHTML(record.fullName)}</h3><p>${escapeHTML(record.placeName)} · ${escapeHTML(record.country)}</p><div class="circuit-card-stats"><span><strong>${record.raceCount}</strong><small>Grands Prix disputés</small></span><span><strong>${record.firstF1 || '—'}</strong><small>Première épreuve F1</small></span></div><span class="circuit-link-hint">Explorer le circuit <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></span></button></article>`).join('')}</div><p class="statistics-source">Données : <a href="https://github.com/f1db/f1db" target="_blank" rel="noopener">F1DB</a> · Tracés : <a href="https://github.com/f1db/f1-circuits-svg" target="_blank" rel="noopener">Jules Roy / F1DB</a>, CC BY 4.0, couleurs adaptées.</p>`;
  }
  async function open(input, race) {
    const token=++profileGeneration;
    $('#circuit-detail').innerHTML='<p class="empty">Chargement de la fiche circuit…</p>';
    if (!modal.open) modal.showModal();
    try {
      await load();if(token!==profileGeneration || !modal.open)return;
      const record=circuit(input);
      if(!record){$('#circuit-detail').innerHTML='<h2 id="circuit-title">Circuit non identifié</h2><p>La fiche de ce circuit n’est pas disponible.</p>';return;}
      const initial=layoutFor(record,race), history=OPENING_HISTORY[record.id];
      const winners=record.winners;
      const maxWins=Math.max(1,...winners.map(driver=>driver.wins));
      $('#circuit-detail').innerHTML=`<p class="eyebrow">FICHE CIRCUIT · DEPUIS 1950</p><h2 id="circuit-title">${flag(record.countryCode)} ${escapeHTML(record.fullName)}</h2><p class="detail-meta">${escapeHTML(record.placeName)} · ${escapeHTML(record.country)} · ${record.type==='STREET'?'Circuit urbain':'Circuit permanent'}</p><div class="circuit-profile-top"><div><div id="circuit-profile-map">${drawing(record,initial,'large-map')}</div><label class="layout-label" for="circuit-layout">Configuration du tracé</label><select id="circuit-layout">${[...record.layouts].sort((a,b)=>b.lastYear-a.lastYear).map(layout=>`<option value="${layout.id}" ${layout.id===initial?.id?'selected':''}>${layout.firstYear}–${layout.lastYear} · ${Number(layout.length).toLocaleString('fr-FR')} km</option>`).join('')}</select><p id="circuit-layout-note" class="statistics-source">${race ? `Tracé de la saison ${race.season} sélectionné.` : 'Configuration la plus récente affichée.'} Les statistiques regroupent toutes les configurations.</p></div><div class="profile-metrics circuit-metrics"><div class="profile-stat"><small>Grands Prix disputés</small><strong>${record.raceCount}</strong></div><div class="profile-stat"><small>Première épreuve du championnat F1</small><strong>${record.firstF1 || '—'}</strong></div><div class="profile-stat"><small>Dernière épreuve F1 disputée</small><strong>${record.lastF1 || '—'}</strong></div><div class="profile-stat"><small>Vainqueurs différents</small><strong>${winners.length}</strong></div><div class="profile-stat"><small>Longueur du tracé affiché</small><strong id="layout-length">${Number(initial?.length || record.length).toLocaleString('fr-FR')} km</strong></div><div class="profile-stat"><small>Virages du tracé affiché</small><strong id="layout-turns">${initial?.turns ?? '—'}</strong></div></div></div><p class="circuit-history">${history ? `Ouverture du circuit : <strong>${history.year}</strong> · <a href="${history.url}" target="_blank" rel="noopener">Histoire officielle du circuit</a>.` : 'La date d’ouverture du site n’est pas renseignée dans cette source.'} La première épreuve du championnat du monde F1 peut être postérieure à sa création.</p><h3>Les pilotes les plus victorieux</h3>${winners.length ? `<div class="table-wrap"><table><thead><tr><th>Rang</th><th>Pilote</th><th>Victoires en Grand Prix</th></tr></thead><tbody>${winners.map((driver,index)=>`<tr><td>${index>0 && driver.wins===winners[index-1].wins ? winners.findIndex(item=>item.wins===driver.wins)+1 : index+1}</td><td><button class="driver-link" data-driver-id="${escapeHTML(driver.id)}">${flag(driver.countryCode)}${escapeHTML(driver.name)}</button></td><td class="points"><strong>${driver.wins}</strong><span class="bar" style="width:${driver.wins/maxWins*100}%"></span></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Aucun Grand Prix disputé enregistré pour ce circuit.</p>'}<p class="statistics-source">Grands Prix du championnat depuis 1950, hors sprints et épreuves annulées. Un même Grand Prix peut avoir deux pilotes vainqueurs en cas de voiture partagée dans les anciennes saisons.<br>Données au ${new Date(snapshot.through+'T12:00:00Z').toLocaleDateString('fr-FR')} : <a href="https://github.com/f1db/f1db" target="_blank" rel="noopener">F1DB ${escapeHTML(snapshot.version)}</a> · Tracés : <a href="https://github.com/f1db/f1-circuits-svg" target="_blank" rel="noopener">Jules Roy / F1DB</a>, CC BY 4.0, couleurs adaptées.</p>`;
      $('#circuit-layout').addEventListener('change',event=>{const layout=record.layouts.find(item=>item.id===event.target.value);$('#circuit-profile-map').innerHTML=drawing(record,layout,'large-map');$('#layout-length').textContent=`${Number(layout.length).toLocaleString('fr-FR')} km`;$('#layout-turns').textContent=layout.turns ?? '—';$('#circuit-layout-note').textContent=`Configuration ${layout.firstYear}–${layout.lastYear} affichée. Les statistiques regroupent toutes les configurations.`;});
    }catch(error){if(token===profileGeneration)$('#circuit-detail').innerHTML=`<h2 id="circuit-title">Fiche indisponible</h2><p>${escapeHTML(error.message)}</p>`;}
  }
  document.addEventListener('click',event=>{const target=event.target.closest('[data-circuit]');if(target)open(target.dataset.circuit,target.dataset.circuitSeason ? {season:target.dataset.circuitSeason,round:target.dataset.circuitRound}:null);});
  modal.addEventListener('click',event=>{if(event.target.closest('[data-driver-id]'))modal.close();if(event.target===modal){const box=modal.getBoundingClientRect();if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom)modal.close();}});
  modal.addEventListener('close',()=>profileGeneration++);
  $('#close-circuit').addEventListener('click',()=>modal.close());
  return {load,render,raceCard,detailLink};
}
