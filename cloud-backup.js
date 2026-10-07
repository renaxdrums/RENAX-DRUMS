import * as core from './sync-core.js';
import {firebaseConfig,providers,appCheckSiteKey,emulator} from './firebase-config.js';
const storage=window.RENAX_STORAGE,api=window.RENAX_SONGS;
await storage.ready;
let account=null,remote=null,sdk=null,auth=null,db=null,unsubscribe=null,generation=0,running=false,retry=0,timer=null,deferred=false,message='Sauvegardé dans ce navigateur',failure='',confirmed=false;
const deviceKey='renax-index2-device';
let device;try{device=localStorage.getItem(deviceKey);}catch{}
if(!device){device=crypto.randomUUID();try{localStorage.setItem(deviceKey,device);}catch{/* Keep the recovery interface usable when local storage is full. */}}
const blank=()=>({version:1,activeProfile:'default',profiles:[{id:'default',name:'Mon profil',songs:[]}]});
const say=(state,error='')=>{message=state;failure=error;renderPanel();};
const queue=()=>{confirmed=false;if(!account)return;clearTimeout(timer);say(navigator.onLine?'Modifications locales en attente':'Hors connexion');timer=setTimeout(sync,900);};
function validatedLibrary(state){const value=core.materialize(core.visibleRecords(state),state.library);api.validateLibrary(value);return value;}
// Audio variables are lexical globals; do not enqueue anything into the scheduler.
function playing(){try{return isPlaying;}catch{return false;}}
function deferApply(state){state.library=validatedLibrary(state);storage.update(state);if(playing()){deferred=true;return;}if(core.canonical(api.library)!==core.canonical(state.library))storage.reconcile();deferred=false;}
function decode(document){const value=document.data();if(value.schema!==1||!Number.isSafeInteger(value.revision)||value.revision<1||typeof value.deleted!=='boolean'||typeof value.payload!=='string'||typeof value.operationId!=='string')throw Error('Données distantes incompatibles. Aucune bibliothèque remplacée.');if(!value.deleted)JSON.parse(value.payload);return {revision:value.revision,payload:value.deleted?null:value.payload,deleted:value.deleted,operationId:value.operationId,device:value.device,updatedAt:value.updatedAt?.toMillis?.()??null};}
function recordRef(uid,id){return sdk.firestore.doc(db,'users',uid,'records',id);}
async function writeAtomic(uid,id,pending){
  return sdk.firestore.runTransaction(db,async transaction=>{
    const ref=recordRef(uid,id),snapshot=await transaction.get(ref),current=snapshot.exists()?decode(snapshot):null;
    if(current?.operationId===pending.operationId)return {record:current};
    if((current?.revision??0)!==pending.expected)return {conflict:current??{revision:0,payload:null,deleted:true,operationId:'',device:'',updatedAt:null}};
    const revision=(current?.revision??0)+1;
    const data={schema:1,revision,payload:pending.payload??'',deleted:pending.deleted,operationId:pending.operationId,device,updatedAt:sdk.firestore.serverTimestamp()};
    transaction.set(ref,data);
    // Immutable revision snapshots. No history purge without a retention decision.
    transaction.set(sdk.firestore.doc(ref,'history',String(revision)),data);
    return {record:{...data,payload:pending.payload,updatedAt:null}};
  });
}
async function sync(){
  if(!account||!sdk||!storage.healthy||running)return;
  if(playing()){confirmed=false;clearTimeout(timer);timer=setTimeout(sync,1500);say('Modifications locales en attente','La synchronisation reprendra à l’arrêt de la lecture.');return;}
  if(!navigator.onLine){say('Hors connexion');return;}
  const uid=account.uid,token=generation;running=true;say('Synchronisation en cours');
  try{
    const snapshot=await sdk.firestore.getDocsFromServer(sdk.firestore.collection(db,'users',uid,'records'));
    if(token!==generation)return;
    if(playing()){timer=setTimeout(sync,1500);return;}
    const records={};snapshot.forEach(doc=>records[doc.id]=decode(doc));
    deferApply(core.mergeRemote(storage.state,records));
    for(const id of Object.keys(storage.state.pending)){
      if(token!==generation)return;
      const pending=storage.state.pending[id];if(!pending)continue;
      const result=await writeAtomic(uid,id,pending);if(token!==generation)return;
      let next=storage.state;
      if(result.conflict){next.conflicts[id]={local:{payload:pending.payload,deleted:pending.deleted},remote:result.conflict};delete next.pending[id];}
      else{
        // A newer local edit during the write is rebased on the confirmed revision.
        next.base[id]=result.record;
        if(next.pending[id]?.operationId===pending.operationId)delete next.pending[id];
        else if(next.pending[id])next.pending[id].expected=result.record.revision;
      }
      if(playing())storage.update(next);else deferApply(next);
    }
    retry=0;confirmed=!Object.keys(storage.state.conflicts).length&&!Object.keys(storage.state.pending).length;
    if(Object.keys(storage.state.conflicts).length)say('Conflit à résoudre');
    else if(Object.keys(storage.state.pending).length)queue();
    else say('Synchronisé');
  }catch(error){if(token!==generation)return;confirmed=false;say(navigator.onLine?'Modifications locales en attente':'Hors connexion',friendly(error));clearTimeout(timer);timer=setTimeout(sync,Math.min(60000,1500*2**Math.min(retry++,6)));}
  finally{running=false;}
}
function friendly(error){const code=error.code||'';if(code.includes('popup-closed')||code.includes('cancelled-popup'))return 'Connexion annulée. Les morceaux locaux sont conservés.';if(code.includes('account-exists-with-different-credential'))return 'Cette adresse utilise déjà une autre méthode. Connectez-vous avec cette méthode, puis utilisez « Lier une méthode ».';if(code.includes('credential-already-in-use'))return 'Cette méthode est liée à un autre compte. Aucune fusion automatique effectuée.';if(code.includes('resource-exhausted'))return 'Quota Firebase atteint. Données locales conservées ; réessayez plus tard.';if(code.includes('permission-denied'))return 'Accès refusé par les règles Firebase. Données locales conservées.';if(code.includes('network')||code.includes('unavailable'))return 'Service indisponible. Le travail local reste disponible.';if(code.includes('requires-recent-login'))return 'Reconnectez-vous avant de lier cette méthode.';if(code.includes('operation-not-allowed'))return 'Cette méthode de connexion n’est pas activée dans Firebase.';return error.message||'Opération impossible.';}
async function ensureFirebase(){
  if(sdk)return;
  if(!firebaseConfig)throw Error('Firebase n’est pas configuré. Aucun morceau n’a été transmis.');
  const version='12.16.0',base='https://www.gstatic.com/firebasejs/'+version+'/';
  const [app,authModule,firestore]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  sdk={app,auth:authModule,firestore};const instance=app.initializeApp(firebaseConfig,'renax-index2');
  auth=authModule.initializeAuth(instance,{persistence:authModule.browserSessionPersistence,popupRedirectResolver:authModule.browserPopupRedirectResolver});
  // Memory cache plus persistent business outbox: no cross-account disk cache.
  db=firestore.initializeFirestore(instance,{localCache:firestore.memoryLocalCache()});
  if(emulator){if(!['localhost','127.0.0.1'].includes(location.hostname))throw Error('Émulateurs interdits sur le site public.');authModule.connectAuthEmulator(auth,'http://'+emulator.host+':'+emulator.authPort,{disableWarnings:true});firestore.connectFirestoreEmulator(db,emulator.host,emulator.firestorePort);}
  if(appCheckSiteKey&&!emulator){const check=await import(base+'firebase-app-check.js');check.initializeAppCheck(instance,{provider:new check.ReCaptchaEnterpriseProvider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});}
  authModule.onAuthStateChanged(auth,async user=>{
    const token=++generation;unsubscribe?.();unsubscribe=null;remote=null;confirmed=false;clearTimeout(timer);account=user;
    try{
      // Preserve the anonymous library before switching to the account scope.
      // A song created before sign-in must follow the user into the account automatically.
      const guestBeforeSignIn=user?storage.guestLibrary():null;
      await storage.switchScope(user?'user:'+user.uid:'guest',blank());
      if(token!==generation)return;
      if(!user){say('Sauvegardé dans ce navigateur');return;}
      if(guestBeforeSignIn){
        api.validateLibrary(guestBeforeSignIn);
        const signature=({id,...song})=>core.canonical({...song,sections:song.sections.map(({id,...section})=>section)});
        const next=core.copy(api.library),known=new Set(next.profiles.flatMap(p=>p.songs.map(signature)));
        for(const guestProfile of guestBeforeSignIn.profiles){
          const songs=guestProfile.songs.filter(song=>!known.has(signature(song))).map(core.copy);
          if(!songs.length)continue;
          let target=next.profiles.find(profile=>profile.name===guestProfile.name)||next.profiles[0];
          for(const song of songs){
            if(next.profiles.some(profile=>profile.songs.some(existing=>existing.id===song.id&&core.canonical(existing)!==core.canonical(song))))song.id=crypto.randomUUID();
            target.songs.push(song);known.add(signature(song));
          }
        }
        api.validateLibrary(next);
        storage.write(next);
        storage.reconcile();
      }
      const uid=user.uid;
      // A new empty account waits for server data; it never uploads a default
      // catalog over an existing remote library at the first connection.
      unsubscribe=firestore.onSnapshot(firestore.collection(db,'users',uid,'records'),{includeMetadataChanges:true},snapshot=>{
        if(token!==generation||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
        remote=snapshot;queue();
      },error=>{confirmed=false;say('Modifications locales en attente',friendly(error));});
      queue();renderPanel();
    }catch(error){say('Sauvegarde locale indisponible',friendly(error));}
  });
}
async function authenticate(method,creating=false){
  const email=document.getElementById('backupEmail')?.value.trim(),password=document.getElementById('backupPassword')?.value;
  try{await ensureFirebase();sessionStorage.setItem('renax-index2-auth-enabled','1');
    if(method==='email'){const result=await (creating?sdk.auth.createUserWithEmailAndPassword:sdk.auth.signInWithEmailAndPassword)(auth,email,password);if(creating)await sdk.auth.sendEmailVerification(result.user);}
    else if(method==='google'){const provider=new sdk.auth.GoogleAuthProvider();if(account)await sdk.auth.linkWithPopup(account,provider);else await sdk.auth.signInWithPopup(auth,provider);}
  }catch(error){say(message,friendly(error));}
}
function putSong(library,payload){const next=core.copy(library);let profile=next.profiles.find(p=>p.id===payload.profileId);if(!profile){profile={id:payload.profileId,name:'Profil restauré',songs:[]};next.profiles.push(profile);}const index=profile.songs.findIndex(s=>s.id===payload.song.id);if(index<0)profile.songs.push(core.copy(payload.song));else profile.songs[index]=core.copy(payload.song);return next;}
async function resolve(id,choice){try{const conflict=storage.state.conflicts[id];let next=core.resolveConflict(storage.state,id,choice,()=>crypto.randomUUID());
  if(choice==='local'&&!conflict.local.deleted){const payload=JSON.parse(conflict.local.payload);if(payload.type==='song'){next.library=putSong(next.library,payload);next=core.stage(next,next.library,()=>crypto.randomUUID());}}
  deferApply(next);queue();}catch(error){say('Conflit à résoudre',friendly(error));}}
function element(tag,text,parent){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(parent)parent.append(node);return node;}
function button(text,parent,action,disabled=false){const node=element('button',text,parent);node.type='button';node.className='btn';node.disabled=disabled;node.onclick=async()=>{node.disabled=true;try{await action();}catch(error){say(message,friendly(error));}finally{if(node.isConnected)node.disabled=disabled;}};return node;}
async function importGuest(){
  const guest=storage.guestLibrary();if(!guest)return;api.validateLibrary(guest);
  // Preview and confirmation are required before copying anonymous data to an account.
  if(!confirm('Importer les '+guest.profiles.reduce((n,p)=>n+p.songs.length,0)+' morceaux sans compte dans '+account.email+' ? Aucun morceau existant ne sera remplacé.'))return;
  const signature=({id,...song})=>core.canonical({...song,sections:song.sections.map(({id,...section})=>section)});
  const next=core.copy(api.library),known=new Set(next.profiles.flatMap(p=>p.songs.map(signature))),mapping=core.copy(storage.state.importDecisions.guestProfiles||{});
  for(const p of guest.profiles){const songs=p.songs.filter(s=>!known.has(signature(s))).map(core.copy);for(const song of songs){if(next.profiles.some(profile=>profile.songs.some(existing=>existing.id===song.id&&core.canonical(existing)!==core.canonical(song)))){
      if(!confirm('« '+song.name+' » utilise un identifiant déjà présent avec une autre version. Importer explicitement comme copie séparée, sans remplacer l’autre version ?'))throw Error('Import annulé : aucune donnée modifiée.');song.id=crypto.randomUUID();
    }}
    let profile=next.profiles.find(existing=>existing.id===mapping[p.id]);
    if(!profile){profile=core.copy(p);if(next.profiles.some(existing=>existing.id===profile.id))profile.id=crypto.randomUUID();profile.songs=[];next.profiles.push(profile);mapping[p.id]=profile.id;}
    profile.songs.push(...core.copy(songs));songs.forEach(s=>known.add(signature(s)));
  }
  api.validateLibrary(next);storage.write(next);const receipt=storage.state;receipt.importDecisions.guestProfiles=mapping;storage.update(receipt);storage.reconcile();queue();
}
async function history(){
  if(!account)return;const dialog=element('dialog',undefined,document.body);dialog.className='backup-dialog';element('h2','Historique et restauration',dialog);
  element('p','Les 20 dernières révisions de chaque élément sont affichées. Aucune version distante n’est purgée automatiquement.',dialog);
  button('Fermer',dialog,()=>{dialog.close();dialog.remove();});dialog.showModal();
  try{const uid=account.uid,token=generation;
    for(const [id,base] of Object.entries(storage.state.base)){
      const ref=recordRef(uid,id),query=sdk.firestore.query(sdk.firestore.collection(ref,'history'),sdk.firestore.orderBy('revision','desc'),sdk.firestore.limit(20));const snapshot=await sdk.firestore.getDocsFromServer(query);if(token!==generation){dialog.close();dialog.remove();return;}
      snapshot.forEach(doc=>{const record=decode(doc);if(record.deleted)return;let payload;try{payload=JSON.parse(record.payload);}catch{return;}if(payload.type!=='song')return;
        const row=element('div',undefined,dialog);element('p',payload.song.name+' · version '+record.revision+' · '+(record.updatedAt?new Date(record.updatedAt).toLocaleString():'date inconnue'),row);
        button('Restaurer cette version',row,()=>{if(!confirm('Restaurer cette version de « '+payload.song.name+' » ? La version actuelle reste dans l’historique.'))return;const next=putSong(api.library,payload);api.validateLibrary(next);storage.write(next);storage.reconcile();queue();dialog.close();dialog.remove();});
      });
    }
  }catch(error){element('p',friendly(error),dialog);}
}
function renderPanel(){
  const pane=document.getElementById('profilePane');if(!pane)return;
  let root=document.getElementById('backupAccount');if(!root){root=element('section');root.id='backupAccount';const back=pane.querySelector('.song-back');if(back)back.after(root);else pane.prepend(root);}
  const optionsOpen=root.querySelector('details')?.open||false;
  // Preserve existing controls and listeners before rebuilding account presentation.
  const json=pane.querySelector('.backup-json');if(json)pane.append(json);
  root.replaceChildren();element('h3','Sauvegarde',root);
  const state=element('p',storage.healthy?message:'Sauvegarde locale impossible : exportez une copie JSON.',root);state.className='backup-status';state.classList.toggle('is-confirmed',confirmed);state.setAttribute('role','status');state.setAttribute('aria-live','polite');
  if(failure)element('p',failure,root).className='backup-error';
  if(!storage.healthy)button('Exporter la source locale préservée',root,()=>{const raw=storage.recoverSource();if(!raw)throw Error('Aucune source trouvée.');const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=element('a');link.href=url;link.download='renax-source-preservee.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  if(!account){
    element('p','Copie locale automatique. Connectez-vous pour retrouver vos morceaux sur vos appareils.',root).className='backup-hint';
    if(!firebaseConfig)element('p','Connexion en ligne indisponible : projet Firebase non configuré.',root);
    const form=element('div',undefined,root);form.className='backup-auth';
    const emailLabel=element('label','E-mail',form),email=element('input',undefined,emailLabel);email.type='email';email.id='backupEmail';email.autocomplete='email';
    const passwordLabel=element('label','Mot de passe',form),password=element('input',undefined,passwordLabel);password.type='password';password.id='backupPassword';password.autocomplete='current-password';password.minLength=6;
    button('Se connecter',form,()=>authenticate('email'),!firebaseConfig||!providers.email);
    button('Créer un compte',form,()=>authenticate('email',true),!firebaseConfig||!providers.email);
    button('Mot de passe oublié',form,async()=>{await ensureFirebase();await sdk.auth.sendPasswordResetEmail(auth,email.value.trim());say(message,'Si cette adresse dispose d’un compte, un message de réinitialisation lui sera envoyé.');},!firebaseConfig||!providers.email);
    button('Continuer avec Google',form,()=>authenticate('google'),!firebaseConfig||!providers.google);
    if(!providers.google)element('small','Google non configuré.',form);
  }else{
    element('p',account.email||account.uid,root).className='backup-identity';
    if(!account.emailVerified&&account.email)button('Vérifier mon adresse',root,()=>sdk.auth.sendEmailVerification(account));
    const options=element('details',undefined,root);options.className='backup-options';options.open=optionsOpen;element('summary','Options du compte',options);
    const optionActions=element('div',undefined,options);optionActions.className='backup-option-actions';
    const syncButton=button(failure?'Réessayer la synchronisation':'Actualiser la synchronisation',optionActions,sync);syncButton.setAttribute('aria-label','Réessayer la synchronisation');
    const importButton=button('Importer les morceaux locaux',optionActions,importGuest);importButton.setAttribute('aria-label','Importer les morceaux sans compte');
    button('Lier Google à ce compte',optionActions,()=>authenticate('google'),!providers.google);
    button('Se déconnecter',optionActions,async()=>{await sdk.auth.signOut(auth);sessionStorage.removeItem('renax-index2-auth-enabled');}).classList.add('backup-signout');
    if(json)options.append(json);
    for(const [id,conflict] of Object.entries(storage.state?.conflicts||{})){
      const row=element('div',undefined,root);row.className='backup-conflict';let name=id;try{name=JSON.parse(conflict.local.payload??conflict.remote.payload)?.song?.name||id;}catch{}
      element('p','Conflit : '+name+' · en ligne : '+(conflict.remote.updatedAt?new Date(conflict.remote.updatedAt).toLocaleString():'date non disponible')+' · appareil '+conflict.remote.device, row);
      element('p',conflict.remote.deleted?'La version en ligne a été supprimée.':'Les deux versions sont conservées jusqu’à votre choix.',row);
      button('Conserver cet appareil',row,()=>resolve(id,'local'));button('Conserver en ligne',row,()=>resolve(id,'remote'));
    }
  }
}
// Install account UI after songs.js rebuilds its panes; keep local profiles/import/export.
new MutationObserver(()=>{if(!document.getElementById('backupAccount'))renderPanel();}).observe(document.getElementById('profilePane'),{childList:true});
window.addEventListener('renax-storage',()=>{renderPanel();});
window.addEventListener('renax-other-tab',()=>say('Conflit local à résoudre','Un autre onglet a modifié cette bibliothèque. Exportez votre copie puis rechargez pour récupérer l’autre version.'));
window.addEventListener('online',queue);window.addEventListener('offline',()=>{if(account)say('Hors connexion');});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&account)queue();});
setInterval(()=>{if(deferred&&!playing()){storage.reconcile();deferred=false;}},1500);
window.addEventListener('renax-library-edited',queue);
renderPanel();
if(firebaseConfig&&sessionStorage.getItem('renax-index2-auth-enabled')==='1')ensureFirebase().catch(error=>say('Sauvegardé dans ce navigateur',friendly(error)));
window.RENAX_BACKUP={sync,resolve,importGuest,get status(){return {message,failure,account:account?.uid??null,confirmed};}};
