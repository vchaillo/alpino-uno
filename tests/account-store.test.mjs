import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountStore} from '../account-store.js';
import {cleanRace,nextCollectionEntry,mergeCollectionEntry,readLegacyData} from '../account-data.js';
const race={season:'2026',round:'1',date:'2026-03-08',time:'04:00:00Z',raceName:'Australian Grand Prix',Circuit:{circuitId:'albert_park',circuitName:'Albert Park',url:'https://example.com',Location:{locality:'Melbourne',country:'Australia',lat:'-37.85',long:'144.97'}}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function mockClient() {
  let authCallback;const profiles=[],collections=[],signins=[],writes=[];
  return {profiles,collections,signins,writes,observeAuth(callback){authCallback=callback;return()=>{};},async auth(user){return authCallback(user);},ensureProfile:async()=>{},recordSignIn:async()=>{},watchProfile(uid,next){profiles.push({uid,next});return()=>{};},watchCollection(uid,next){collections.push({uid,next});return()=>{};},watchSignIns(uid,next){signins.push({uid,next});return()=>{};},async toggle(uid,key,field,value){writes.push({uid,key,field,value});},async saveProfile(uid,patch){writes.push({uid,patch});},signIn:async()=>{},signOut:async()=>authCallback(null)};
}
test('collection states are exclusive and migrations preserve cloud favorites',()=>{
  const seen=nextCollectionEntry({watchlist:true},'watched',race);assert(seen.watched);assert.equal(seen.watchlist,false);
  const queued=nextCollectionEntry(seen,'watchlist',race);assert(queued.watchlist);assert.equal(queued.watched,false);
  const merged=mergeCollectionEntry({favorite:true,watched:true,race},{favorite:false,watchlist:true,race});assert(merged.favorite);assert(merged.watched);assert.equal(merged.watchlist,false);
  assert.throws(()=>cleanRace({...race,round:'../users/other'}));
});
test('switching accounts clears all state and ignores late callbacks from the previous UID',async()=>{
  const client=mockClient(),store=createAccountStore({loadClient:async()=>client});await store.start();
  await client.auth({uid:'alice',displayName:'Alice'});client.profiles[0].next({name:'Alice',theme:'light',layouts:{}},true);client.collections[0].next({'2026-1':{favorite:true,race}},true);assert(store.getState().ready);assert(store.getState().collection['2026-1']);
  await client.auth({uid:'bob',displayName:'Bob'});assert.deepEqual(store.getState().collection,{});assert.equal(store.getState().profile.name,'Bob');assert.equal(store.getState().ready,false);
  client.collections[0].next({'2026-1':{favorite:true,race}},true);client.profiles[0].next({name:'Alice'},true);assert.deepEqual(store.getState().collection,{});assert.equal(store.getState().profile.name,'Bob');
  client.profiles[1].next({name:'Bob',layouts:{}},true);client.collections[1].next({},true);await store.toggle('2026-1','favorite',race);assert.equal(client.writes.at(-1).uid,'bob');
  await store.signOut();assert.equal(store.getState().user,null);assert.deepEqual(store.getState().collection,{});store.dispose();
});
test('offline and unauthenticated writes fail without a local fallback',async()=>{
  const client=mockClient(),store=createAccountStore({loadClient:async()=>client,online:()=>false});await store.start();await assert.rejects(store.toggle('2026-1','favorite',race));assert.equal(client.writes.length,0);
  await client.auth({uid:'alice',displayName:'Alice'});client.profiles[0].next({name:'Alice'},true);client.collections[0].next({},true);await assert.rejects(store.toggle('2026-1','favorite',race));assert.equal(client.writes.length,0);store.dispose();
});
test('legacy data is read-only until explicit import and does not restore old sessions or email',()=>{
  const values=new Map([['formula-one:collection:v1',JSON.stringify({'2026-1':{favorite:true,race}})],['formula-one:profile:v1',JSON.stringify({name:'Old name',email:'someone@example.com',visits:[1]})],['calpino:demo-session','true']]);
  const legacy=readLegacyData({getItem:key=>values.get(key)||null});assert.equal(legacy.count,1);assert.equal(legacy.profile.name,'Old name');assert.equal(legacy.profile.email,undefined);assert.equal(legacy.profile.visits,undefined);assert.equal(values.get('calpino:demo-session'),'true');
});
test('guest layout and theme choices are in-memory only',async()=>{
  const store=createAccountStore({loadClient:async()=>mockClient()});await store.setPreference('theme','light');assert.equal(store.getState().profile.theme,'light');const fresh=createAccountStore();assert.equal(fresh.getState().profile.theme,'dark');store.dispose();fresh.dispose();
});
