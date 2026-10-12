// Use the published race date rather than a timezone conversion for calendar placement.
export function calendarMonthDays(year, month) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({length:42}, (_, index) => index >= offset && index < offset + count ? index - offset + 1 : null);
}
export function renderAnnualCalendar({ year, races, escapeHTML, renderFlag }) {
  const byDate = new Map();
  for (const race of races) {
    const date = race.date;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(race);
  }
  const today = new Date().toLocaleDateString('sv-SE');
  return `<div class="calendar-caption"><span><i class="calendar-key" aria-hidden="true"></i>Jour de Grand Prix · clique pour voir les résultats</span><strong>${races.length} Grand${races.length > 1 ? 's' : ''} Prix</strong></div><div class="annual-calendar">${Array.from({length:12}, (_, month) => {
    const title = new Date(Date.UTC(year, month, 1)).toLocaleDateString('fr-FR', {month:'long',timeZone:'UTC'});
    const monthRaces = races.filter(race=>Number(race.date.slice(5,7)) === month+1);
    return `<section class="calendar-month" aria-label="${title} ${year}"><div class="month-heading"><h3>${title}</h3><span>${monthRaces.length ? `${monthRaces.length} GP` : '—'}</span></div><div class="month-weekdays" aria-hidden="true">${['L','Ma','Me','J','V','S','D'].map(day=>`<span>${day}</span>`).join('')}</div><div class="month-days">${calendarMonthDays(year,month).map(day=>{
      if (!day) return '<span class="calendar-blank" aria-hidden="true"></span>';
      const date = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const events = byDate.get(date) || [];
      const isToday = date === today;
      const readableDate = new Date(date+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
      return events.length ? `<button class="calendar-day race-day${isToday ? ' today' : ''}" data-calendar-date="${date}" aria-label="${escapeHTML(readableDate+' : '+events.map(race=>race.raceName).join(', '))}" title="${escapeHTML(events.map(race=>race.raceName).join(', '))}"><span>${day}</span><i aria-hidden="true"></i></button>` : `<span class="calendar-day${isToday ? ' today' : ''}"${isToday ? ' aria-label="Aujourd’hui"' : ''}>${day}</span>`;
    }).join('')}</div>${monthRaces.length ? `<div class="month-races">${monthRaces.map(race=>`<button data-detail="${race.season}-${race.round}"><span class="month-race-date">${Number(race.date.slice(8,10))}</span>${renderFlag(race.Circuit.Location.country)}<span>${escapeHTML(race.raceName.replace(/ Grand Prix$/, ''))}</span></button>`).join('')}</div>` : ''}</section>`;
  }).join('')}</div>`;
}
