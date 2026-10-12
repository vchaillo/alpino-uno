import { defaultProfile, cleanRace } from './account-data.js?v=22';
export function accountError(error) {
  const messages={
    'auth/unauthorized-domain':'Ce domaine doit être autorisé dans Firebase Authentication.',
    'auth/operation-not-allowed':'La connexion Google doit être activée dans Firebase Authentication.',
    'auth/configuration-not-found':'Firebase Authentication doit être activé pour ce projet.',
    'auth/popup-blocked':'La fenêtre Google a été bloquée. Autorise les popups pour ce site puis réessaie.',
    'auth/popup-closed-by-user':'La connexion Google a été annulée.',
    'auth/network-request-failed':'La connexion à Google est indisponible. Vérifie ta connexion Internet.',
    'permission-denied':'Firestore refuse l’accès. Vérifie que les règles fournies sont publiées dans la base (default).',
    'failed-precondition':'Crée la base Cloud Firestore (default), puis réessaie.',
    'unavailable':'La synchronisation est indisponible. Vérifie ta connexion Internet et réessaie.'
  };
  return messages[String(error?.code || '').replace(/^firestore\//,'')] || error?.message || 'Une erreur de synchronisation est survenue.';
}
export function createAccountStore({loadClient=()=>import('./firebase-client.js?v=22').then(module=>module.createFirebaseClient()),online=()=>globalThis.navigator?.onLine!==false}={}) {
  let client,starting,generation=0,stops=[],authStop;
  const listeners=new Set();
  let state={user:null,authReady:false,ready:false,profile:defaultProfile(''),collection:{},signins:[],error:'',saving:0};
  function emit(reason){for(const listener of listeners)listener(state,reason);}
  function report(error){state={...state,error:accountError(error)};emit('status');}
  function clearListeners(){stops.forEach(stop=>stop());stops=[];}
  async function acceptUser(user) {
    const token=++generation;clearListeners();
    state={user:user || null,authReady:true,ready:false,profile:defaultProfile(user?.displayName),collection:{},signins:[],error:'',saving:0};emit('auth');
    if(!user)return;
    const current=()=>token===generation && state.user?.uid===user.uid;
    let failed=false;
    const fail=error=>{if(current()){failed=true;state={...state,ready:false};report(error);}};
    try {
      await client.ensureProfile(user);if(!current())return;
      let profileReady=false,collectionReady=false;
      stops.push(client.watchProfile(user.uid,(profile,server)=>{if(!current() || failed)return;profileReady ||= server;state={...state,profile:{...defaultProfile(user.displayName),...profile},ready:profileReady&&collectionReady,error:''};emit('profile');},fail));
      stops.push(client.watchCollection(user.uid,(collection,server)=>{if(!current() || failed)return;collectionReady ||= server;state={...state,collection,ready:profileReady&&collectionReady,error:''};emit('collection');},fail));
      stops.push(client.watchSignIns(user.uid,signins=>{if(current()){state={...state,signins};emit('signins');}},error=>{if(current())report(error);}));
      const agent=globalThis.navigator?.userAgent || '';
      const browser=/Firefox/.test(agent)?'Firefox':/Edg/.test(agent)?'Edge':/Chrome|CriOS/.test(agent)?'Chrome':/Safari/.test(agent)?'Safari':'Navigateur web';
      const device=/iPhone|iPad/.test(agent)?'iPhone / iPad':/Android/.test(agent)?'Android':'Ordinateur';
      client.recordSignIn(user,browser,device).catch(error=>{if(current())report(error);});
    } catch(error){fail(error);}
  }
  async function start() {
    if(starting)return starting;
    starting=(async()=>{try{client=await loadClient();authStop=client.observeAuth(acceptUser,error=>{state={...state,authReady:true};report(error);});}catch(error){state={...state,authReady:true};report(error);starting=null;}})();return starting;
  }
  function requireAccount(){if(!state.user)throw Error('Connecte-toi pour enregistrer tes données.');if(!state.ready)throw Error(state.error || 'Attends la fin de la synchronisation du compte.');if(!online())throw Error('Une connexion Internet est nécessaire pour enregistrer.');return {uid:state.user.uid,token:generation};}
  async function write(task) {
    let context;try{context=requireAccount();}catch(error){report(error);throw error;}state={...state,saving:state.saving+1,error:''};emit('status');
    try{await task(context.uid);if(context.token!==generation)throw Error('Le compte a changé pendant l’enregistrement.');}
    catch(error){if(context.token===generation)report(error);throw error;}
    finally{if(context.token===generation){state={...state,saving:Math.max(0,state.saving-1)};emit('status');}}
  }
  return {
    getState:()=>state,
    subscribe(listener){listeners.add(listener);listener(state,'initial');return()=>listeners.delete(listener);},
    start,
    async signIn(){if(!client){await start();throw Error('La connexion se prépare. Réessaie dans un instant.');}try{return await client.signIn();}catch(error){report(error);throw Error(accountError(error));}},
    async signOut(){const previousUser=state.user;generation++;clearListeners();state={user:null,authReady:true,ready:false,profile:defaultProfile(''),collection:{},signins:[],error:'',saving:0};emit('auth');try{await client?.signOut();}catch(error){report(error);await acceptUser(client?.getUser?.() || previousUser);throw error;}},
    retry(){if(client && state.user)return acceptUser(state.user);starting=null;return start();},
    saveProfile(patch){const allowed={};for(const key of ['name','favoriteTeam','theme','layouts','migrationComplete'])if(key in patch)allowed[key]=patch[key];return write(uid=>client.saveProfile(uid,allowed));},
    setPreference(key,value){if(!['theme','layouts'].includes(key))return Promise.reject(Error('Préférence invalide.'));if(!state.user){state={...state,profile:{...state.profile,[key]:key==='layouts'?{...state.profile.layouts,...value}:value}};emit('profile');return Promise.resolve();}return write(uid=>client.saveProfile(uid,{[key]:value}));},
    toggle(key,field,race){const cleaned=cleanRace(race);if(key!==`${cleaned.season}-${cleaned.round}`)return Promise.reject(Error('Identifiant de course invalide.'));return write(uid=>client.toggle(uid,key,field,cleaned));},
    async importLegacy(legacy){
      const context=requireAccount();const entries=Object.entries(legacy.collection);
      for(let index=0;index<entries.length;index+=5){if(context.token!==generation)throw Error('Le compte a changé.');await Promise.all(entries.slice(index,index+5).map(([key,value])=>write(uid=>client.importEntry(uid,key,value))));}
      if(context.token!==generation)throw Error('Le compte a changé.');
      await write(uid=>client.saveProfile(uid,{...legacy.profile,migrationComplete:true}));
    },
    dispose(){generation++;clearListeners();authStop?.();listeners.clear();}
  };
}
