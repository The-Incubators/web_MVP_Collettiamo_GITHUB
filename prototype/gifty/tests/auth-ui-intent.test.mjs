import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const functions=['readAuthFields','rememberAuthIntent','authDetails','applyAuthResult','submitAccess','restorePendingAccess','invitationUrl','access'].map(name=>{const line=source.split('\n').find(line=>line.startsWith(`function ${name}(`)||line.startsWith(`async function ${name}(`));assert.ok(line,`Missing actual app function ${name}`);return line;}).join('\n');
function harness({intent=null,context=null,pendingEmail='',sabotage=false}={}){
 const fields={name:'Andrea',surname:'Rossi',email:'andrea@example.test',privacy:'on'};
 const form={};const errors=[];const routes=[];let emailCalls=0;
 const group={mode:'A',draftId:'draft-A',organiserUid:null,organiserName:'',published:false,members:[],deliveryAt:null,expected:10,quota:1000};
 const state={scenario:'A',role:'organiser',scenarios:{A:group}};if(intent)state.authIntent=intent;
 const ctx=vm.createContext({state,FormData:class{get(k){return fields[k]??null}has(k){return k in fields}},$:(selector)=>selector==='#access-form'?form:selector==='#access-error'?{hidden:false}:null,save:()=>true,go:route=>routes.push(route),render:()=>{},account:()=>'<verified-profile>',gift:()=>null,setAccessBusy:value=>{ctx.authBusy=value},showAccessError:e=>errors.push(e),window:{giftyAuth:{google:async()=>({user:{uid:'verified-uid',nome:'Andrea Rossi',email:'andrea@example.test'},context}),completeEmail:async()=>({user:{uid:'verified-uid',nome:'Andrea Rossi',email:'andrea@example.test'},context}),sendEmail:async()=>{emailCalls++;return{sent:true}}}},accessContext:'organiser',location:{origin:'http://localhost:4196',href:'http://localhost:4196/accedi?oobCode=sensitive-token&mode=signIn#access'},authReady:true,authBusy:false,authMarketingDirty:false,authMode:'normal',authUser:null,authContext:null,authPendingEmail:pendingEmail,authFields:{firstName:'',lastName:'',email:'',privacy:false,marketing:false},s:()=>state.scenarios[state.scenario]});
 vm.runInContext(sabotage?functions.replace('readAuthFields();const error=', 'readAuthFields();rememberAuthIntent();const error='):functions,ctx);
 return{ctx,state,group,errors,routes,get emailCalls(){return emailCalls}};
}
test('generic Google profile login does not create or publish a group',async()=>{const h=harness();await h.ctx.submitAccess('google');assert.equal(h.state.authIntent,undefined);assert.equal(h.group.published,false);assert.equal(h.group.organiserUid,null);assert.equal(h.routes.at(-1),'account');});
test('explicit setup intent resumes only matching draft after verified auth',async()=>{const intent={scenario:'A',role:'organiser',draftId:'draft-A'};const h=harness({intent,context:{...intent}});await h.ctx.submitAccess('google');assert.equal(h.group.organiserUid,'verified-uid');assert.equal(h.group.published,true);assert.equal(h.routes.at(-1),'share');});
test('cross-device completion does not replace another local draft intent',async()=>{const intent={scenario:'A',role:'organiser',draftId:'draft-A'};const h=harness({intent,context:{scenario:'B',role:'organiser',draftId:'other-draft'}});h.ctx.authMode='needs-email';await h.ctx.submitAccess('complete');assert.equal(h.group.organiserUid,null);assert.equal(h.group.published,false);assert.deepEqual(h.state.authIntent,intent);});
test('pending email restore shows sent state without sending or creating intent',()=>{const h=harness();h.ctx.restorePendingAccess({pendingEmail:'andrea@example.test',user:null});assert.equal(h.ctx.authMode,'sent');assert.equal(h.ctx.authFields.email,'andrea@example.test');assert.equal(h.ctx.authFields.privacy,false);assert.equal(h.ctx.authFields.marketing,false);assert.equal(h.state.authIntent,undefined);assert.equal(h.emailCalls,0);});
test('regression assertion rejects automatic intent creation sabotage',async()=>{const h=harness({sabotage:true});await h.ctx.submitAccess('google');assert.throws(()=>assert.equal(h.state.authIntent,undefined),assert.AssertionError);});

test('invitation URL excludes email callback token, query and callback path',()=>{const h=harness();assert.equal(h.ctx.invitationUrl(),'http://localhost:4196/#invite');});

test('verified login with no callback context cannot claim a pending local draft',async()=>{const h=harness({intent:{scenario:'A',role:'organiser',draftId:'draft-A'},context:null});await h.ctx.submitAccess('google');assert.equal(h.group.organiserUid,null);assert.equal(h.group.published,false);assert.equal(h.routes.at(-1),'account');});
test('callback context without exact draft ID cannot claim a pending draft',async()=>{const h=harness({intent:{scenario:'A',role:'organiser',draftId:'draft-A'},context:{scenario:'A',role:'organiser'}});await h.ctx.submitAccess('google');assert.equal(h.group.organiserUid,null);assert.equal(h.group.published,false);});

test('ordinary login preserves stored marketing choice; only an explicit change requests update',()=>{const h=harness();h.ctx.authFields.marketing=false;assert.equal(h.ctx.authDetails().updateMarketing,false);h.ctx.authMarketingDirty=true;h.ctx.authFields.marketing=true;assert.equal(h.ctx.authDetails().updateMarketing,true);assert.equal(h.ctx.authDetails().marketing,true);h.ctx.authFields.marketing=false;assert.equal(h.ctx.authDetails().updateMarketing,true);assert.equal(h.ctx.authDetails().marketing,false);});

test('authenticated access screen renders profile instead of registration',()=>{const h=harness();h.ctx.authUser={uid:'verified-uid',nome:'Andrea'};assert.equal(h.ctx.access(),'<verified-profile>');});
test('unresolved session renders only session check without registration fields',()=>{const h=harness();h.ctx.authReady=false;const html=h.ctx.access();assert.equal(html.includes('auth-session-check'),true);assert.equal(html.includes('access-form'),false);});
