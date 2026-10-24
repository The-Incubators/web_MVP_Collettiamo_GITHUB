/* Real Firebase auth. This module never falls back to a local identity. */
const PENDING='gifty.auth.pending.v1';
const PRIVACY_VERSION='2026-10-24';
const SDK_VERSION='12.19.0';
const failure=code=>Object.assign(new Error(code),{code});
const bounded=(promise,ms=15000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(failure('auth/network-request-failed')),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});

export function createGiftyAuthFacade({sdk,auth,db,firestore,core,storage,location,history}) {
 let verified=null,boot=null,busy=false,observing=false,epoch=0,activeUid=null;
 const listeners=new Set();
 const readPending=()=>{try{const raw=JSON.parse(storage.getItem(PENDING));return raw&&typeof raw==='object'?raw:null;}catch{return null;}};
 const writePending=value=>{try{value?storage.setItem(PENDING,JSON.stringify(value)):storage.removeItem(PENDING);}catch{throw failure('auth/web-storage-unsupported');}};
 const emit=result=>{verified=result.user||null;listeners.forEach(cb=>cb(result));return result;};
 const view=(u,p)=>{const lastName=typeof p.cognome==='string'?p.cognome:'',combined=typeof p.nome==='string'?p.nome:u.displayName||'',firstName=p.primoNome||(lastName&&combined.endsWith(' '+lastName)?combined.slice(0,-lastName.length-1):combined);const providers=u.providerData||[];const stamp=p.privacy?.lettaIl;let privacyReadAt=null;try{const date=typeof stamp?.toDate==='function'?stamp.toDate():typeof stamp==='string'?new Date(stamp):null;if(date&&!Number.isNaN(date.getTime()))privacyReadAt=date.toISOString();}catch{}return {uid:u.uid,nome:combined,email:u.email,firstName,lastName,provider:providers.some(v=>v.providerId==='google.com')?'Google':providers.some(v=>v.providerId==='password')?'Email':null,marketing:p.marketing?.consenso===true,privacyVersion:p.privacy?.versione||null,privacyReadAt};};
 const validUser=u=>u&&!u.isAnonymous;
 const uidOf=u=>validUser(u)?u.uid:null;
 function capture(u){if(!validUser(u)||uidOf(auth.currentUser)!==u.uid)throw failure('auth/stale-session');if(activeUid!==u.uid){activeUid=u.uid;epoch++;if(verified&&verified.uid!==u.uid)emit({user:null});}return epoch;}
 function guard(u,ticket){if(ticket!==epoch||!validUser(u)||uidOf(auth.currentUser)!==u.uid)throw failure('auth/stale-session');}
 function cleanCallback(){const clean=location.origin+'/#access';if(history?.replaceState)history.replaceState(null,'',clean);else if(location.replace)location.replace(clean);}
 const contextOf=p=>p?.context&&['A','B'].includes(p.context.scenario)&&['organiser','participant'].includes(p.context.role)?p.context:null;
 function detailsRecord(details,method){
  if(details?.privacy!==true)throw failure('auth/privacy-required');
  return {method,email:String(details.email||'').trim().toLowerCase(),firstName:String(details.firstName||'').trim().slice(0,40),lastName:String(details.lastName||'').trim().slice(0,60),privacy:true,marketing:details.marketing===true,updateMarketing:details.updateMarketing===true,context:contextOf(details),createdAt:Date.now()};
 }
 async function readProfile(u,details,ticket){
  guard(u,ticket);
  if(!validUser(u))throw failure('auth/user-not-found');
  const ref=firestore.doc(db,'utenti',u.uid);
  const snap=await bounded(firestore.getDoc(ref));
  guard(u,ticket);
  const existing=snap.exists()?snap.data():null;
  if(!details?.privacy){
   if(!existing?.privacy?.versione)return {user:null,needsConsent:true,context:null};
   return {user:view(u,existing)};
  }
  // A transaction avoids overwriting an existing marketing choice during an ordinary login.
  const saved=await bounded(firestore.runTransaction(db,async tx=>{
   const latest=await tx.get(ref),old=latest.exists()?latest.data():{};
   guard(u,ticket);
   const patch={email:u.email,aggiornatoIl:firestore.serverTimestamp()};
   if(!latest.exists())patch.creatoIl=firestore.serverTimestamp();
   if(details.firstName){patch.primoNome=details.firstName;patch.nome=[details.firstName,details.lastName].filter(Boolean).join(' ');}
   else if(!old.nome)patch.nome=u.displayName||u.email?.split('@')[0]||'';
   if(details.firstName)patch.cognome=details.lastName;
   if(!old.privacy?.versione)patch.privacy={versione:PRIVACY_VERSION,lettaIl:firestore.serverTimestamp()};
   if(!old.marketing||details.updateMarketing||details.marketing===true)patch.marketing={consenso:details.marketing===true,versione:PRIVACY_VERSION,aggiornatoIl:firestore.serverTimestamp()};
   tx.set(ref,patch,{merge:true});return {...old,...patch};
  }));
  guard(u,ticket);
  return {user:view(u,saved)};
 }
 async function profile(u,details,ticket=capture(u)){
  try{return await readProfile(u,details,ticket);}
  catch(error){if(['auth/user-not-found','auth/stale-session'].includes(error.code))throw error;throw failure('auth/profile-save-failed');}
 }
 async function finish(u,p){
  const ticket=capture(u);
  const result=await profile(u,p,ticket);
  guard(u,ticket);
  if(result.needsConsent)return emit({...result,context:contextOf(p)});
  const context=contextOf(p);
  writePending(null);
  return emit({...result,context});
 }
 function observe(){
  if(observing)return;observing=true;
  core.observe(async u=>{
   const uid=uidOf(u);if(uid!==activeUid){activeUid=uid;epoch++;if(verified&&verified.uid!==uid)emit({user:null});}
   if(!uid){if(verified)emit({user:null});return;}
   if(busy||verified?.uid===uid)return;
   const ticket=epoch;
   try{const result=await profile(u,null,ticket);guard(u,ticket);emit(result);}catch(error){if(error.code!=='auth/stale-session'&&ticket===epoch&&uidOf(auth.currentUser)===uid)emit({user:null,error:'auth/profile-unavailable'});}
  });
 }

 const api={
  ready(){
   if(boot)return boot;
   boot=(async()=>{
    busy=true;
    try{
     const pending=readPending();
     if(core.isEmailLink(location.href)){
      if(!pending?.email)return {user:null,needsEmail:true};
      return await api.completeEmail(pending.email);
     }
     const redirect=await core.redirect();
     const u=redirect||await core.current();
     if(!validUser(u))return {user:null,pendingEmail:pending?.method==='email'?pending.email:undefined};
     // Pending context belongs only to the exact verified account, or this Google redirect result.
     const bound=pending?.uid===u.uid||(redirect&&pending?.method==='google');
     if(bound){writePending({...pending,uid:u.uid});return await finish(u,pending);}
     const ticket=capture(u),result=await profile(u,null,ticket);guard(u,ticket);return emit(result);
    }finally{busy=false;observe();}
   })().finally(()=>{boot=null;});
   return boot;
  },
  async sendEmail(details){
   const p=detailsRecord(details,'email');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw failure('auth/invalid-email');
   const previous=readPending();writePending(p);
   try{await core.sendEmail(p.email,[p.firstName,p.lastName].filter(Boolean).join(' '),'/accedi#access');return {sent:true};}
   catch(error){writePending(previous);throw error;}
  },
  async google(details){
   const p=detailsRecord(details,'google');writePending(p);busy=true;
   try{
    const result=await core.google([p.firstName,p.lastName].filter(Boolean).join(' '));
    if(result.cancelled){writePending(null);return {cancelled:true};}
    if(result.redirecting)return {redirecting:true};
    if(!validUser(result.user))throw failure('auth/user-not-found');
    const bound={...p,uid:result.user.uid};writePending(bound);
    return await finish(result.user,bound);
   }finally{busy=false;}
  },
  async completeEmail(email,details){
   if(!core.isEmailLink(location.href))throw failure('auth/invalid-action-code');
   const supplied=String(email||'').trim().toLowerCase(),p=readPending();
   if(p?.email&&p.email!==supplied)throw failure('auth/email-mismatch');
   busy=true;
   try{
    const u=await core.completeEmail(location.href,supplied);
    cleanCallback();
    if(!validUser(u)||u.email?.toLowerCase()!==supplied)throw failure('auth/email-mismatch');
    const bound=p?.method==='email'?{...p,uid:u.uid}:details?{...detailsRecord(details,'email'),uid:u.uid}:null;
    if(bound)writePending(bound);
    return await finish(u,bound);
   }finally{busy=false;}
  },
  async finishProfile(details){
   const u=await core.current(),previous=readPending();
   if(!validUser(u))throw failure('auth/user-not-found');
   const p={...detailsRecord(details,'profile'),uid:u.uid,context:previous?.uid===u.uid?contextOf(previous):null};
   writePending(p);busy=true;
   try{return await finish(u,p);}finally{busy=false;}
  },
  async updateProfile(details){const u=await core.current();if(!validUser(u)||verified?.uid!==u.uid)throw failure('auth/user-not-found');const ticket=capture(u),p=detailsRecord({...details,privacy:!!verified.privacyVersion||details.privacy===true,context:null},'profile');busy=true;try{const result=await profile(u,p,ticket);guard(u,ticket);return emit({...result,context:null});}finally{busy=false;}},
  async signOut(){epoch++;activeUid=null;busy=true;try{await core.signOut();writePending(null);boot=null;emit({user:null});}finally{busy=false;}},
  onChange(cb){listeners.add(cb);return ()=>listeners.delete(cb);},
  get current(){return verified;}
 };
 return api;
}

if(typeof window!=='undefined'){
 let instance=null,loading=null;
 async function load(){
  if(instance)return instance;
  if(loading)return loading;
  loading=(async()=>{
   const response=await bounded(fetch('/auth-config.json',{cache:'no-store'}));
   if(!response.ok)throw failure('auth/configuration-not-found');
   const config=await response.json();if(!config.configured)throw failure('auth/configuration-not-found');
   const [app,sdk,firestore,shared]=await bounded(Promise.all([
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),
    import('/shared-auth.mjs')
   ]));
   const firebaseApp=app.getApps().length?app.getApp():app.initializeApp(config.firebase);
   const auth=sdk.getAuth(firebaseApp),db=firestore.getFirestore(firebaseApp,config.databaseId);
   const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
   const write=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{throw failure('auth/web-storage-unsupported');}};
   const core=shared.createFirebaseAuthCore({sdk,auth,origin:location.origin,read,write});
   instance=createGiftyAuthFacade({sdk,auth,db,firestore,core,storage:localStorage,location,history:window.history});
   subscriptions.forEach(cb=>instance.onChange(cb));return instance;
  })().catch(error=>{loading=null;throw error;});
  return loading;
 }
 const subscriptions=new Set();
 window.giftyAuth={
  ready:async()=> (await load()).ready(),
  google:async details=>(await load()).google(details),
  sendEmail:async details=>(await load()).sendEmail(details),
  completeEmail:async(email,details)=>(await load()).completeEmail(email,details),
  finishProfile:async details=>(await load()).finishProfile(details),
  updateProfile:async details=>(await load()).updateProfile(details),
  signOut:async()=> (await load()).signOut(),
  onChange(cb){subscriptions.add(cb);const stop=instance?.onChange(cb);return ()=>{subscriptions.delete(cb);stop?.();};},
  get current(){return instance?.current||null;}
 };
}
