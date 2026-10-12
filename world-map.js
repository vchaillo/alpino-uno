export function projectCoordinates(latitude, longitude) { return {x:(Number(longitude)+180)/360*1000,y:(90-Number(latitude))/360*1000}; }
export function clusterCircuits(records, zoom = 1) {
  const groups = [];
  for (const record of records) {
    if (record.latitude == null || record.longitude == null || !Number.isFinite(Number(record.latitude)) || !Number.isFinite(Number(record.longitude))) continue;
    const point = projectCoordinates(record.latitude,record.longitude);
    let group = groups.find(item=>Math.hypot(item.x-point.x,item.y-point.y)<18/zoom);
    if (!group) { group = {x:point.x,y:point.y,records:[]};groups.push(group); }
    group.records.push(record);
    group.x = group.records.reduce((sum,item)=>sum+projectCoordinates(item.latitude,item.longitude).x,0)/group.records.length;
    group.y = group.records.reduce((sum,item)=>sum+projectCoordinates(item.latitude,item.longitude).y,0)/group.records.length;
  }
  return groups;
}
export function createWorldMap({escapeHTML}) {
  let zoom = 1, center = {x:500,y:250}, records = [], selected = [];
  let root;
  function bounds() { return {x:Math.max(0,Math.min(1000-1000/zoom,center.x-500/zoom)),y:Math.max(0,Math.min(500-500/zoom,center.y-250/zoom)),width:1000/zoom,height:500/zoom}; }
  function render() {
    if (!root?.isConnected) return;
    const box = bounds(), groups = clusterCircuits(records,zoom);
    root.innerHTML = `<div class="world-map-heading"><div><p class="eyebrow">L’ARCHIVE AUTOUR DU MONDE</p><h3>Où se trouvent les circuits ?</h3></div><div class="map-controls"><button type="button" data-map-zoom="-1" aria-label="Dézoomer la carte" ${zoom<=1?'disabled':''}>−</button><button type="button" data-map-zoom="1" aria-label="Zoomer la carte" ${zoom>=16?'disabled':''}>+</button><button type="button" data-map-reset aria-label="Afficher le monde entier" title="Afficher le monde entier"><svg class="map-globe-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 6-6 12 0 18 6-6 6-12 0-18ZM5 6h14M5 18h14"/></svg></button></div></div><div class="map-viewport"><svg class="world-map" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" role="group" aria-label="Carte des circuits. Utilise les points pour ouvrir une fiche et les flèches du clavier pour déplacer la carte." tabindex="0"><image href="assets/world-land.svg" width="1000" height="500" aria-hidden="true"/>${groups.map((group,index)=>{
      const multiple = group.records.length>1, record = group.records[0], radius = (multiple?11:6)/zoom;
      const label = multiple ? `${group.records.length} circuits : ${group.records.map(item=>item.name).join(', ')}. Zoomer et explorer.` : `${record.fullName}, ${record.country}. Ouvrir la fiche.`;
      return `<g class="map-marker ${multiple?'map-cluster':''}" role="button" tabindex="0" aria-label="${escapeHTML(label)}" data-map-tip="${escapeHTML(label)}" ${multiple?`data-map-cluster="${index}"`:`data-circuit="${escapeHTML(record.id)}"`}><circle class="marker-hit" cx="${group.x}" cy="${group.y}" r="${22/zoom}"/><circle class="marker-halo" cx="${group.x}" cy="${group.y}" r="${radius+3/zoom}"/><circle class="marker-dot" cx="${group.x}" cy="${group.y}" r="${radius}"/>${multiple?`<text x="${group.x}" y="${group.y+3.3/zoom}" text-anchor="middle" style="font-size:${10/zoom}px">${group.records.length}</text>`:''}</g>`;
    }).join('')}</svg><div class="map-tooltip" role="tooltip" hidden></div></div><p class="map-help">${records.filter(record=>record.latitude!=null&&record.longitude!=null).length} circuits localisés · Clique sur un point pour ouvrir sa fiche. Un nombre regroupe les circuits proches. Molette pour zoomer · glisser ou flèches du clavier pour déplacer la carte.</p>${selected.length?`<div class="map-selection"><strong>Circuits de cette zone</strong><div>${selected.map(record=>`<button data-circuit="${escapeHTML(record.id)}">${escapeHTML(record.fullName)} <span>${escapeHTML(record.country)}</span></button>`).join('')}</div></div>`:''}<p class="map-attribution">Fond géographique : <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> · coordonnées F1DB · toutes les saisons</p>`;
  }
  function mount(element, nextRecords) {
    root = element; records = nextRecords; selected = selected.filter(record=>records.some(item=>item.id===record.id)); render();
    root.addEventListener('click',event=>{
      const cluster = event.target.closest('[data-map-cluster]');
      if (cluster) { const group = clusterCircuits(records,zoom)[Number(cluster.dataset.mapCluster)]; if(!group)return; selected=group.records;center={x:group.x,y:group.y};zoom=Math.min(16,zoom*2);render();root.querySelector('.world-map').focus({preventScroll:true});return; }
      const control = event.target.closest('[data-map-zoom],[data-map-reset]');if(!control)return;
      if (control.hasAttribute('data-map-reset')) {zoom=1;center={x:500,y:250};selected=[];} else zoom=Math.max(1,Math.min(16,zoom*(Number(control.dataset.mapZoom)>0?2:.5)));
      render();root.querySelector('.world-map').focus({preventScroll:true});
    });
    root.addEventListener('keydown',event=>{
      const marker=event.target.closest('.map-marker');if(marker && ['Enter',' '].includes(event.key)){event.preventDefault();marker.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
      if(event.target.matches('.world-map') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();center.x+=({'ArrowLeft':-60,'ArrowRight':60}[event.key]||0)/zoom;center.y+=({'ArrowUp':-30,'ArrowDown':30}[event.key]||0)/zoom;render();root.querySelector('.world-map').focus({preventScroll:true});}
    });
    let lastWheel = 0;
    root.addEventListener('wheel',event=>{
      const svg=event.target.closest('.world-map');if(!svg || event.ctrlKey)return;
      event.preventDefault();
      if(performance.now()-lastWheel<60)return;lastWheel=performance.now();
      const nextZoom=Math.max(1,Math.min(16,zoom*(event.deltaY<0?1.25:.8)));
      if(nextZoom===zoom)return;
      const box=bounds(), rect=svg.getBoundingClientRect();
      const rx=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),ry=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      center={x:box.x+box.width*rx+(0.5-rx)*1000/nextZoom,y:box.y+box.height*ry+(0.5-ry)*500/nextZoom};
      zoom=nextZoom;render();
    },{passive:false});
    function showTooltip(marker,event) {
      const tooltip=root.querySelector('.map-tooltip'),viewport=root.querySelector('.map-viewport');if(!tooltip||!marker)return;
      tooltip.textContent=marker.dataset.mapTip;tooltip.hidden=false;
      const parent=viewport.getBoundingClientRect(),box=marker.getBoundingClientRect();
      const x=event?.clientX || box.left+box.width/2,y=event?.clientY || box.top;
      tooltip.style.left=Math.max(8,Math.min(parent.width-tooltip.offsetWidth-8,x-parent.left+12))+'px';
      tooltip.style.top=Math.max(8,Math.min(parent.height-tooltip.offsetHeight-8,y-parent.top+12))+'px';
    }
    const hideTooltip=()=>{const tooltip=root.querySelector('.map-tooltip');if(tooltip)tooltip.hidden=true;};
    root.addEventListener('pointerover',event=>{const marker=event.target.closest('.map-marker');if(marker)showTooltip(marker,event);});
    root.addEventListener('pointerout',event=>{const marker=event.target.closest('.map-marker');if(marker && !marker.contains(event.relatedTarget))hideTooltip();});
    root.addEventListener('focusin',event=>showTooltip(event.target.closest('.map-marker')));
    root.addEventListener('focusout',hideTooltip);
    let drag;
    root.addEventListener('pointerdown',event=>{const svg=event.target.closest('.world-map');if(!svg || event.target.closest('.map-marker') || zoom===1)return;const box=bounds();drag={x:event.clientX,y:event.clientY,center:{x:box.x+box.width/2,y:box.y+box.height/2},width:svg.getBoundingClientRect().width,id:event.pointerId};svg.setPointerCapture(event.pointerId);});
    root.addEventListener('pointermove',event=>{if(!drag)return;center={x:drag.center.x-(event.clientX-drag.x)*1000/zoom/drag.width,y:drag.center.y-(event.clientY-drag.y)*1000/zoom/drag.width};const box=bounds();root.querySelector('.world-map').setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);});
    const finish=()=>{if(!drag)return;drag=null;render();};root.addEventListener('pointerup',finish);root.addEventListener('pointercancel',finish);
  }
  return {mount};
}
