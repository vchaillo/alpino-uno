import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initializeFirestore, memoryLocalCache, doc, collection, onSnapshot, runTransaction, serverTimestamp, Timestamp, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { defaultProfile, nextCollectionEntry, mergeCollectionEntry } from './account-data.js?v=22';
// Firebase web configuration identifies the project; authorization is enforced by Firestore rules.
export const firebaseConfig = {apiKey:'AIzaSyDnuB7fvEkw9P_zk9GKgDDM-y08Sf40KQc',authDomain:'calpino-uno.firebaseapp.com',projectId:'calpino-uno',storageBucket:'calpino-uno.firebasestorage.app',messagingSenderId:'85095264544',appId:'1:85095264544:web:acd89716907f0bb3a7e745'};
export function createFirebaseClient() {
  const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:memoryLocalCache()});
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  const profileRef=uid=>doc(db,'users',uid);
  const entryRef=(uid,key)=>doc(db,'users',uid,'collection',key);
  return {
    getUser:()=>auth.currentUser,
    observeAuth:(next,error)=>onAuthStateChanged(auth,next,error),
    signIn:()=>signInWithPopup(auth,provider),
    signOut:()=>signOut(auth),
    async ensureProfile(user) {
      const ref=profileRef(user.uid);
      await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);if(!snapshot.exists())transaction.set(ref,{...defaultProfile(user.displayName),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});
    },
    watchProfile:(uid,next,error)=>onSnapshot(profileRef(uid),{includeMetadataChanges:true},snapshot=>next(snapshot.data() || defaultProfile(''),!snapshot.metadata.fromCache),error),
    watchCollection:(uid,next,error)=>onSnapshot(collection(db,'users',uid,'collection'),{includeMetadataChanges:true},snapshot=>next(Object.fromEntries(snapshot.docs.map(row=>[row.id,row.data()])),!snapshot.metadata.fromCache),error),
    watchSignIns:(uid,next,error)=>onSnapshot(query(collection(db,'users',uid,'signins'),orderBy('signedInAt','desc'),limit(5)),snapshot=>next(snapshot.docs.map(row=>({id:row.id,...row.data(),date:row.data().signedInAt?.toDate().toISOString()}))),error),
    async recordSignIn(user,browser,device) {
      const time=Date.parse(user.metadata?.lastSignInTime || '');if(!Number.isFinite(time))return;
      const ref=doc(db,'users',user.uid,'signins',String(time));
      await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);if(!snapshot.exists())transaction.set(ref,{signedInAt:Timestamp.fromMillis(time),createdAt:serverTimestamp(),browser,device});});
    },
    async saveProfile(uid,patch) {
      const ref=profileRef(uid);
      await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);if(!snapshot.exists())throw Error('Profil introuvable.');const updates={...patch,updatedAt:serverTimestamp()};if(patch.layouts)updates.layouts={...(snapshot.data().layouts || {}),...patch.layouts};transaction.update(ref,updates);});
    },
    async toggle(uid,key,field,race) {
      const ref=entryRef(uid,key);
      await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);const next=nextCollectionEntry(snapshot.data(),field,race);if(next.favorite || next.watched || next.watchlist)transaction.set(ref,{...next,updatedAt:serverTimestamp()});else if(snapshot.exists())transaction.delete(ref);});
    },
    async importEntry(uid,key,value) {
      const ref=entryRef(uid,key);
      await runTransaction(db,async transaction=>{const snapshot=await transaction.get(ref);transaction.set(ref,{...mergeCollectionEntry(snapshot.data(),value),updatedAt:serverTimestamp()});});
    }
  };
}
