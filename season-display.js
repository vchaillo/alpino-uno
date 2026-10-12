// Animate only the digits that change; interrupted updates settle before restarting.
export function createSeasonDisplay(element, initialYear) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let displayedYear = Number(initialYear);
  let animations = [];
  let generation = 0;
  const needle = element.closest('.year-gauge')?.querySelector('.gauge-needle');
  const slots = Array.from({ length: 4 }, (_, index) => {
    const slot = document.createElement('span');
    slot.className = `year-digit${index > 1 ? ' accent-digit' : ''}`;
    const track = document.createElement('span');
    track.className = 'digit-track';
    slot.append(track);
    return { slot, track };
  });
  element.replaceChildren(...slots.map(({ slot }) => slot));
  function settle(year) {
    String(year).padStart(4, '0').split('').forEach((digit, index) => {
      const cell = document.createElement('span');
      cell.className = 'digit-cell'; cell.textContent = digit;
      slots[index].track.replaceChildren(cell);
      slots[index].track.style.transform = '';
    });
  }
  function setNeedle(year, animate) {
    if (!needle) return;
    const angle = -65 + (Number(year) - 1950) / Math.max(1, new Date().getFullYear() - 1950) * 130;
    needle.style.transition = animate ? 'transform 650ms cubic-bezier(.22,.7,.3,1)' : 'none';
    needle.style.transform = `rotate(${angle}deg)`;
  }
  settle(displayedYear); setNeedle(displayedYear, false);
  element.parentElement.setAttribute('aria-label', `Saison ${displayedYear}`);
  return function update(year) {
    year = Number(year);
    if (!Number.isInteger(year) || year === displayedYear) return;
    const token = ++generation;
    animations.forEach((animation) => animation.cancel()); animations = [];
    settle(displayedYear);
    const oldDigits = String(displayedYear).padStart(4, '0');
    const nextDigits = String(year).padStart(4, '0');
    const direction = year > displayedYear ? 1 : -1;
    displayedYear = year;
    element.parentElement.setAttribute('aria-label', `Saison ${year}`);
    setNeedle(year, !reducedMotion.matches);
    if (reducedMotion.matches || !element.animate) { settle(year); return; }
    slots.forEach(({ slot, track }, index) => {
      const from = Number(oldDigits[index]), to = Number(nextDigits[index]);
      if (from === to) return;
      const sequence = [from];
      for (let digit = from; digit !== to;) {
        digit = (digit + direction + 10) % 10;
        sequence.push(digit);
      }
      if (direction < 0) sequence.reverse();
      track.replaceChildren(...sequence.map((digit) => {
        const cell = document.createElement('span'); cell.className = 'digit-cell'; cell.textContent = digit; return cell;
      }));
      const height = slot.getBoundingClientRect().height;
      const distance = (sequence.length - 1) * height;
      const start = direction > 0 ? 0 : -distance;
      const end = direction > 0 ? -distance : 0;
      track.style.transform = `translateY(${end}px)`;
      const animation = track.animate([{ transform: `translateY(${start}px)` }, { transform: `translateY(${end}px)` }], {
        duration: 640 + index * 45,
        easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'none'
      });
      animations.push(animation);
      animation.finished.then(() => {
        if (generation !== token) return;
        const cell = document.createElement('span'); cell.className = 'digit-cell'; cell.textContent = to;
        track.replaceChildren(cell); track.style.transform = '';
      }).catch(() => {});
    });
  };
}
