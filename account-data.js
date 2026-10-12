export const defaultProfile = name => ({ name:String(name || '').slice(0,80), favoriteTeam:'', theme:'dark', layouts:{}, migrationComplete:false });
export function cleanRace(input) {
  if (!input || !/^\d{4}$/.test(String(input.season)) || !/^[1-9]\d{0,2}$/.test(String(input.round)) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date || '') || !input.Circuit?.Location) throw Error('Course invalide.');
  const text=(value,max)=>String(value || '').slice(0,max);
  return {season:String(input.season),round:String(input.round),date:input.date,time:text(input.time,40),raceName:text(input.raceName,200),Circuit:{circuitId:text(input.Circuit.circuitId,80),circuitName:text(input.Circuit.circuitName,200),url:text(input.Circuit.url,2048),Location:{locality:text(input.Circuit.Location.locality,200),country:text(input.Circuit.Location.country,100),lat:text(input.Circuit.Location.lat,40),long:text(input.Circuit.Location.long,40)}}};
}
export function nextCollectionEntry(previous, field, race) {
  if(!['favorite','watched','watchlist'].includes(field))throw Error('Action invalide.');
  const value={favorite:!!previous?.favorite,watched:!!previous?.watched,watchlist:!!previous?.watchlist,race:cleanRace(race)};
  value[field]=!value[field];
  if(field==='watched' && value.watched)value.watchlist=false;
  if(field==='watchlist' && value.watchlist)value.watched=false;
  return value;
}
export function mergeCollectionEntry(previous, imported) {
  const watched=!!(previous?.watched || imported.watched);
  return {favorite:!!(previous?.favorite || imported.favorite),watched,watchlist:!watched && !!(previous?.watchlist || imported.watchlist),race:cleanRace(previous?.race || imported.race)};
}
export function readLegacyData(storage) {
  const read=key=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}};
  const raw=read('formula-one:collection:v1'),collection={};
  if(raw && typeof raw==='object' && !Array.isArray(raw))for(const value of Object.values(raw)) {
    try{if(!value || !(value.favorite || value.watched || value.watchlist))continue;const race=cleanRace(value.race);collection[`${race.season}-${race.round}`]=mergeCollectionEntry(null,{...value,race});}catch{}
  }
  const old=read('formula-one:profile:v1'),patch={};
  if(old && typeof old==='object') {if(typeof old.name==='string' && old.name.trim())patch.name=old.name.trim().slice(0,80);if(typeof old.favoriteTeam==='string')patch.favoriteTeam=old.favoriteTeam.slice(0,100);}
  try{const theme=storage.getItem('calpino:theme');if(['light','dark'].includes(theme))patch.theme=theme;}catch{}
  const layouts=read('calpino-uno:layouts:v1');if(layouts && typeof layouts==='object') {patch.layouts={};for(const key of ['races','circuits','collection'])if(['gallery','list'].includes(layouts[key]))patch.layouts[key]=layouts[key];}
  return {collection,profile:patch,count:Object.keys(collection).length,available:Object.keys(collection).length>0 || Object.keys(patch).length>0};
}
export function removeLegacyData(storage) {for(const key of ['formula-one:collection:v1','formula-one:profile:v1','calpino:theme','calpino-uno:layouts:v1','calpino:demo-session'])try{storage.removeItem(key);}catch{}}
