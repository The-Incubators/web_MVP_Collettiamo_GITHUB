import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFirebaseAuthCore} from '../../../lib/auth/firebase-core.mjs';
const source=await readFile(new URL('../auth.js',import.meta.url),'utf8');
const {createGiftyAuthFacade}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const KEY='gifty.auth.pending.v1';
const user={uid:'uid-a',email:'andrea@example.test',displayName:'Andrea Rossi',isAnonymous:false,providerData:[{providerId:'google.com'}]};
const consent={firstName:'Andrea',lastName:'Rossi',email:user.email,privacy:true,marketing:false,context:{scenario:'B',role:'organiser',draftId:'draft-a'}};
function fixture(){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const docs=new Map(),calls={sends:0,completes:0,writes:0,popups:0};
 const observers=[];const auth={currentUser:null,async authStateReady(){}};
 const sdk={GoogleAuthProvider:class{},onAuthStateChanged:(_auth,cb)=>{observers.push(cb);return()=>{}},async signInAnonymously(){throw Error('must not use anonymous');},
  async sendSignInLinkToEmail(){calls.sends++;},isSignInWithEmailLink:(_,href)=>href.includes('oobCode='),
  async signInWithEmailLink(){calls.completes++;auth.currentUser=user;return{user};},
  async signInWithPopup(){calls.popups++;auth.currentUser=user;return{user};},async signInWithRedirect(){},async getRedirectResult(){return null;},async signOut(){auth.currentUser=null;}};
 const snap=ref=>({exists:()=>docs.has(ref),data:()=>docs.get(ref)});
 const firestore={doc:(_,collection,uid)=>`${collection}/${uid}`,getDoc:async ref=>snap(ref),serverTimestamp:()=>({server:true}),async runTransaction(_,fn){return fn({get:async ref=>snap(ref),set(ref,patch){calls.writes++;docs.set(ref,{...docs.get(ref),...patch});}});}};
 const location={origin:'http://localhost:4193',href:'http://localhost:4193/#access'};
 const core=createFirebaseAuthCore({sdk,auth,origin:location.origin,read:storage.getItem,write:(k,v)=>v===null?storage.removeItem(k):storage.setItem(k,v)});
 const history={calls:[],replaceState(_state,_title,url){this.calls.push(url);location.href=url;}};
 const make=()=>createGiftyAuthFacade({sdk,auth,db:{},firestore,core,storage,location,history});
 return {sdk,auth,storage,docs,calls,firestore,location,history,observers,make};
}
test('Google verifies user and persists consent before exposing identity and draft context',async()=>{
 const f=fixture(),api=f.make(),events=[];api.onChange(e=>events.push(e));
 const result=await api.google(consent);
 assert.equal(result.user.uid,user.uid);assert.equal(result.context.draftId,'draft-a');assert.equal(f.calls.writes,1);
 assert.equal(f.docs.get('utenti/uid-a').marketing.consenso,false);assert.ok(f.docs.get('utenti/uid-a').privacy.versione);assert.equal(api.current.uid,user.uid);assert.equal(f.storage.getItem(KEY),null);assert.equal(events.length,1);
});
test('cancelled Google popup creates neither profile nor local successful identity',async()=>{
 const f=fixture();f.sdk.signInWithPopup=async()=>{throw{code:'auth/popup-closed-by-user'};};
 const api=f.make();assert.deepEqual(await api.google(consent),{cancelled:true});assert.equal(api.current,null);assert.equal(f.calls.writes,0);assert.equal(f.storage.getItem(KEY),null);
});
test('blocked popup uses existing Firebase redirect fallback',async()=>{
 const f=fixture();let redirects=0;f.sdk.signInWithPopup=async()=>{throw{code:'auth/popup-blocked'};};f.sdk.signInWithRedirect=async()=>{redirects++;};
 assert.deepEqual(await f.make().google(consent),{redirecting:true});assert.equal(redirects,1);assert.equal(f.calls.writes,0);
});
test('profile failure does not report success and can recover bound pending draft after reload',async()=>{
 const f=fixture(),normal=f.firestore.runTransaction;f.firestore.runTransaction=async()=>{throw{code:'permission-denied'};};
 const api=f.make();await assert.rejects(api.google(consent),e=>e.code==='auth/profile-save-failed');assert.equal(api.current,null);assert.equal(JSON.parse(f.storage.getItem(KEY)).uid,user.uid);
 f.firestore.runTransaction=normal;const result=await f.make().ready();assert.equal(result.user.uid,user.uid);assert.equal(result.context.draftId,'draft-a');
});
test('email is sent only through SDK and callback completes the bound profile/draft',async()=>{
 const f=fixture(),api=f.make();assert.deepEqual(await api.sendEmail(consent),{sent:true});assert.equal(api.current,null);assert.equal(f.calls.sends,1);assert.equal(f.calls.writes,0);
 f.location.href='http://localhost:4193/accedi?oobCode=synthetic#access';
 const result=await f.make().ready();assert.equal(result.user.uid,user.uid);assert.equal(result.context.draftId,'draft-a');assert.equal(f.calls.completes,1);
});
test('mismatched callback email never invokes SDK and never assigns pending draft',async()=>{
 const f=fixture();await f.make().sendEmail(consent);f.location.href+='?oobCode=synthetic';
 await assert.rejects(f.make().completeEmail('someone@example.test'),e=>e.code==='auth/email-mismatch');assert.equal(f.calls.completes,0);assert.equal(f.calls.writes,0);
});
test('cross-device link asks for email, then consent without inventing missing draft ownership',async()=>{
 const f=fixture();f.location.href+='?oobCode=synthetic';const api=f.make();assert.deepEqual(await api.ready(),{user:null,needsEmail:true});
 assert.equal((await api.completeEmail(user.email)).needsConsent,true);assert.equal(api.current,null);assert.equal(f.calls.writes,0);
 const result=await api.finishProfile({...consent,context:null});assert.equal(result.user.uid,user.uid);assert.equal(result.context,null);
});
test('existing marketing preference survives ordinary login unchecked consent',async()=>{
 const f=fixture();f.docs.set('utenti/uid-a',{nome:'Andrea',privacy:{versione:'existing'},marketing:{consenso:true}});
 await f.make().google(consent);assert.equal(f.docs.get('utenti/uid-a').marketing.consenso,true);
});
test('privacy is required before Google or email request',async()=>{
 const f=fixture(),api=f.make();await assert.rejects(api.google({...consent,privacy:false}),e=>e.code==='auth/privacy-required');await assert.rejects(api.sendEmail({...consent,privacy:false}),e=>e.code==='auth/privacy-required');assert.equal(f.calls.popups,0);assert.equal(f.calls.sends,0);
});
test('restored session gets no unrelated pending draft context, and actual logout clears session',async()=>{
 const f=fixture();f.auth.currentUser=user;f.docs.set('utenti/uid-a',{nome:'Andrea',privacy:{versione:'existing'}});f.storage.setItem(KEY,JSON.stringify({...consent,uid:'other-uid'}));
 const api=f.make(),result=await api.ready();assert.equal(result.user.uid,user.uid);assert.equal(result.context,undefined);await api.signOut();assert.equal(f.auth.currentUser,null);assert.equal(api.current,null);
});
test('email SDK failure restores pending request instead of false sent confirmation',async()=>{
 const f=fixture();f.sdk.sendSignInLinkToEmail=async()=>{throw{code:'auth/operation-not-allowed'};};await assert.rejects(f.make().sendEmail(consent),e=>e.code==='auth/operation-not-allowed');assert.equal(f.storage.getItem(KEY),null);assert.equal(f.calls.writes,0);
});
test('shared email transport rejects external continue URLs before sending',async()=>{
 const f=fixture();const core=createFirebaseAuthCore({sdk:f.sdk,auth:f.auth,origin:f.location.origin,read:f.storage.getItem,write:()=>{}});
 await assert.rejects(core.sendEmail(user.email,'Andrea','//outside.example.test/callback'),e=>e.code==='auth/invalid-continue-uri');assert.equal(f.calls.sends,0);
});
test('anonymous Firebase identity is never promoted to registered account',async()=>{
 const f=fixture();f.sdk.signInWithPopup=async()=>({user:{...user,isAnonymous:true}});
 const api=f.make();await assert.rejects(api.google(consent),e=>e.code==='auth/user-not-found');assert.equal(api.current,null);assert.equal(f.calls.writes,0);
});
test('ready returns current verified session after Google rather than a stale boot result',async()=>{
 const f=fixture(),api=f.make();assert.equal((await api.ready()).user,null);await api.google(consent);assert.equal((await api.ready()).user.uid,user.uid);
});

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('successful SDK email callback removes one-time code before failed profile read and reload',async()=>{
 const f=fixture(),api=f.make();await api.sendEmail(consent);f.location.href=f.location.origin+'/accedi?oobCode=synthetic&mode=signIn#access';
 f.firestore.getDoc=async()=>{assert.equal(f.location.href,f.location.origin+'/#access');throw{code:'permission-denied'}};
 await assert.rejects(api.completeEmail(user.email),e=>e.code==='auth/profile-save-failed');assert.deepEqual(f.history.calls,[f.location.origin+'/#access']);assert.equal(f.location.href.includes('oobCode='),false);assert.equal(f.calls.completes,1);
 await assert.rejects(f.make().ready(),e=>e.code==='auth/profile-save-failed');assert.equal(f.calls.completes,1);
});
test('failed SDK callback leaves original URL available for explicit retry',async()=>{
 const f=fixture();f.location.href+='?oobCode=synthetic';const original=f.location.href;f.sdk.signInWithEmailLink=async()=>{throw{code:'auth/network-request-failed'}};
 await assert.rejects(f.make().completeEmail(user.email),e=>e.code==='auth/network-request-failed');assert.equal(f.location.href,original);assert.equal(f.history.calls.length,0);
});
test('late ready profile read cannot restore an identity after logout',async()=>{
 const f=fixture(),gate=deferred(),events=[];f.auth.currentUser=user;f.firestore.getDoc=()=>gate.promise;const api=f.make();api.onChange(e=>events.push(e));
 const ready=api.ready();await tick();await api.signOut();gate.resolve({exists:()=>true,data:()=>({nome:'Andrea',privacy:{versione:'v1'}})});
 await assert.rejects(ready,e=>e.code==='auth/stale-session');assert.equal(api.current,null);assert.equal(events.some(e=>e.user?.uid===user.uid),false);
});
test('late observer A cannot replace a later verified account B',async()=>{
 const f=fixture(),api=f.make(),gate=deferred();await api.ready();const other={...user,uid:'uid-b',email:'bea@example.test',displayName:'Bea'};f.docs.set('utenti/uid-b',{nome:'Bea',privacy:{versione:'v1'}});const normal=f.firestore.getDoc;f.firestore.getDoc=ref=>ref==='utenti/uid-a'?gate.promise:normal(ref);
 f.auth.currentUser=user;const first=f.observers[0](user);await tick();f.auth.currentUser=other;await f.observers[0](other);assert.equal(api.current.uid,'uid-b');gate.resolve({exists:()=>true,data:()=>({nome:'Andrea',privacy:{versione:'v1'}})});await first;assert.equal(api.current.uid,'uid-b');
});
test('Google profile finishing after an external account switch cannot expose prior account or context',async()=>{
 const f=fixture(),gate=deferred(),normal=f.firestore.runTransaction;f.firestore.runTransaction=async(...args)=>{const result=await normal(...args);await gate.promise;return result};const api=f.make(),events=[];api.onChange(e=>events.push(e));const login=api.google(consent);await tick();f.auth.currentUser={...user,uid:'uid-b'};gate.resolve();await assert.rejects(login,e=>e.code==='auth/stale-session');assert.equal(api.current,null);assert.equal(events.some(e=>e.user?.uid==='uid-a'),false);
});
test('explicit checked marketing opt-in updates an existing false preference',async()=>{
 const f=fixture();f.docs.set('utenti/uid-a',{nome:'Andrea',privacy:{versione:'v1'},marketing:{consenso:false}});await f.make().google({...consent,marketing:true,updateMarketing:true});assert.equal(f.docs.get('utenti/uid-a').marketing.consenso,true);
});
test('normalized backslash external continue URL is rejected before sending',async()=>{
 const f=fixture(),core=createFirebaseAuthCore({sdk:f.sdk,auth:f.auth,origin:f.location.origin,read:f.storage.getItem,write:()=>{}});await assert.rejects(core.sendEmail(user.email,'Andrea',String.raw`/\outside.example.test/callback`),e=>e.code==='auth/invalid-continue-uri');assert.equal(f.calls.sends,0);
});

test('cross-device consent completion cannot inherit an unrelated local draft context',async()=>{const f=fixture();f.location.href+='?oobCode=synthetic';const api=f.make();await api.completeEmail(user.email);const result=await api.finishProfile(consent);assert.equal(result.user.uid,user.uid);assert.equal(result.context,null);});

test('profile exposes saved fields and provider; profile edit persists without changing authenticated email',async()=>{
 const f=fixture(),api=f.make();let result=await api.google(consent);assert.equal(result.user.firstName,'Andrea');assert.equal(result.user.lastName,'Rossi');assert.equal(result.user.provider,'Google');assert.equal(result.user.marketing,false);assert.ok(result.user.privacyVersion);
 result=await api.updateProfile({firstName:'Andrea Maria',lastName:'Verdi',email:'cannot-change@example.test',marketing:true,updateMarketing:true});assert.equal(result.user.nome,'Andrea Maria Verdi');assert.equal(result.user.email,user.email);assert.equal(result.user.marketing,true);assert.equal(result.context,null);
 const reloaded=await f.make().ready();assert.equal(reloaded.user.firstName,'Andrea Maria');assert.equal(reloaded.user.lastName,'Verdi');assert.equal(reloaded.user.email,user.email);assert.equal(reloaded.user.marketing,true);
});
test('profile write failure preserves prior verified profile rather than false save success',async()=>{
 const f=fixture(),api=f.make();await api.google(consent);f.firestore.runTransaction=async()=>{throw{code:'permission-denied'}};await assert.rejects(api.updateProfile({firstName:'Not saved',lastName:'Rossi'}),e=>e.code==='auth/profile-save-failed');assert.equal(api.current.nome,'Andrea Rossi');
});
test('profile editing requires a current verified account and cannot create a session',async()=>{
 const f=fixture(),api=f.make();await assert.rejects(api.updateProfile({firstName:'Andrea',privacy:true}),e=>e.code==='auth/user-not-found');assert.equal(f.calls.writes,0);assert.equal(api.current,null);
});
