const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
export function sortValue(text) {
  const value = text.trim().replace(/\s+/g, ' ');
  if (!value || value === '—') return null;
  const numeric = value.replace(/\s/g, '');
  if (/^[+-]?\d+(?:[.,]\d+)?%?$/.test(numeric)) return Number(numeric.replace(',', '.').replace('%', ''));
  const time = value.match(/^(\d+):([0-5]\d)(?:\.(\d+))?$/);
  if (time) return Number(time[1]) * 60 + Number(time[2]) + Number(`0.${time[3] || 0}`);
  return value;
}
export function compareValues(left, right, descending = false) {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  return (typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right))) * (descending ? -1 : 1);
}
function cellValue(cell) {
  return sortValue(cell.dataset.sortValue ?? (cell.textContent.trim() || [...cell.querySelectorAll('img[alt]')].map(image => image.alt).join(' ')));
}
export function enableTableSorting(root = document.body) {
  function enhance() {
    root.querySelectorAll('table:not([data-sortable])').forEach(table => {
      table.dataset.sortable = 'true';
      table.querySelectorAll('thead th').forEach((header, index) => {
        const label = header.textContent.trim();
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'column-sort';
        button.textContent = label; button.setAttribute('aria-label', `Trier par ${label}`);
        const indicator = document.createElement('span'); indicator.className = 'sort-indicator'; indicator.textContent = '↕'; indicator.setAttribute('aria-hidden', 'true'); button.append(indicator);
        header.textContent = ''; header.append(button); header.setAttribute('aria-sort', 'none');
        button.addEventListener('click', () => {
          const descending = header.getAttribute('aria-sort') === 'ascending';
          table.querySelectorAll('thead th').forEach(other => { other.setAttribute('aria-sort', 'none'); other.querySelector('.sort-indicator').textContent = '↕'; });
          header.setAttribute('aria-sort', descending ? 'descending' : 'ascending'); indicator.textContent = descending ? '↓' : '↑';
          const body = table.tBodies[0];
          [...body.rows].map((row, order) => ({ row, order, value: cellValue(row.cells[index]) })).sort((a,b) => compareValues(a.value,b.value,descending) || a.order-b.order).forEach(item => body.append(item.row));
        });
      });
    });
  }
  enhance(); new MutationObserver(enhance).observe(root, {childList:true,subtree:true});
}
