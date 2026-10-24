import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
const helpers=['beginCatalogDraft','proposeCatalogGift','cancelNewGroup','confirmNewGroup'].map(name=>source.split('\n').find(l=>l.startsWith('function '+name+'('))).join('\n');
const actualSubmit=source.split('\n').find(l=>l.startsWith("document.addEventListener('submit'"));
function harness(patch={},editable=true){
 const group={mode:'A',recipient:'',occasion:'Compleanno',date:'',members:[],invitations:[],published:false,organiserUid:null,expected:8,quota:1000,gift:null,...patch};
 const state={scenario:'A',role:'organiser',scenarios:{A:group}},routes=[],toasts=[];
 const dialog={open:false,showModal(){this.open=true},close(){this.open=false}};
 const p={id:'PRD-016',price:6000,url:'https://www.amazon.it/dp/B012345678?tag=example-21'};
 const fields={recipient:'Giulia',occasion:'Compleanno',date:'2026-12-01',mode:'B'};
 let submit;
 const ctx=vm.createContext({state,pendingCatalogGift:null,selectedProduct:p.id,s:()=>state.scenarios[state.scenario],product:id=>id===p.id?p:null,mayEditDraft:()=>editable,pendingInvitations:()=>group.invitations,$:()=>dialog,save:()=>true,go:r=>routes.push(r),toast:t=>toasts.push(t),document:{addEventListener:(event,fn)=>{if(event==='submit')submit=fn}},FormData:class{get(k){return fields[k]}has(k){return k in fields}},crypto:{randomUUID:()=> 'new-draft'},catalogContext:'organiser'});
 vm.runInContext(helpers+'\n'+actualSubmit,ctx);
 return{ctx,state,group,routes,toasts,dialog,fields,submit:()=>submit({target:{id:'start-form',reportValidity:()=>true},preventDefault(){}})};
}
test('fresh home catalog selection starts gift-first wizard without inventing a recipient or mutating the current group',()=>{const h=harness();const before=structuredClone(h.group);h.ctx.proposeCatalogGift();assert.deepEqual(h.routes,['start']);assert.equal(h.state.catalogDraftGift,'PRD-016');assert.equal(h.state.newDraft,true);assert.deepEqual(h.group,before);});
test('catalog gift survives actual wizard submit and opens quote page with new recipient and selected gift',async()=>{const h=harness();h.ctx.proposeCatalogGift();await h.submit();assert.equal(h.group.mode,'B');assert.equal(h.group.recipient,'Giulia');assert.equal(h.group.gift,'PRD-016');assert.equal(h.group.expected,10);assert.equal(h.group.organiserUid,null);assert.equal(h.state.catalogDraftGift,undefined);assert.equal(h.routes.at(-1),'setup');});
test('unowned published group is unchanged before replacement confirmation and cancellation preserves it',()=>{const h=harness({published:true,organiserUid:'someone-else',recipient:'Mauro',members:[{id:'old',name:'Old'}],gift:'old-gift'},false);const before=structuredClone(h.state);h.ctx.proposeCatalogGift();assert.equal(h.dialog.open,true);assert.equal(h.ctx.pendingCatalogGift,'PRD-016');assert.deepEqual(h.state,before);h.ctx.cancelNewGroup();assert.equal(h.dialog.open,false);assert.equal(h.ctx.pendingCatalogGift,null);assert.deepEqual(h.state,before);assert.deepEqual(h.routes,[]);});
test('confirmed replacement stages chosen gift and replaces old group only on explicit wizard submission',async()=>{const h=harness({published:true,organiserUid:'someone-else',recipient:'Mauro',members:[{id:'old',name:'Old'}],gift:'old-gift'},false);h.ctx.proposeCatalogGift();h.ctx.confirmNewGroup();assert.equal(h.group.recipient,'Mauro');assert.equal(h.group.organiserUid,'someone-else');assert.equal(h.group.gift,'old-gift');await h.submit();assert.equal(h.group.recipient,'Giulia');assert.equal(h.group.organiserUid,null);assert.equal(h.group.gift,'PRD-016');assert.equal(h.group.members.length,0);assert.equal(h.group.published,false);assert.equal(h.routes.at(-1),'setup');});
test('owned published group keeps recipient and mode while changing actual gift and quota',()=>{const h=harness({mode:'B',recipient:'Mauro',published:true,organiserUid:'verified',members:[{id:'1'},{id:'2'},{id:'3'},{id:'4'}]},true);h.ctx.proposeCatalogGift();assert.equal(h.group.gift,'PRD-016');assert.equal(h.group.quota,1500);assert.equal(h.group.recipient,'Mauro');assert.equal(h.group.mode,'B');assert.equal(h.state.newDraft,undefined);assert.deepEqual(h.routes,['group']);});
test('already started adhesions-first draft keeps its mode and proposed quota',()=>{const h=harness({recipient:'Mauro',mode:'A',quota:1200},true);h.ctx.proposeCatalogGift();assert.equal(h.group.mode,'A');assert.equal(h.group.quota,1200);assert.equal(h.group.gift,'PRD-016');assert.deepEqual(h.routes,['setup']);});
test('choosing adhesions first in the wizard drops preselected gift instead of forcing gift-first flow',async()=>{const h=harness();h.ctx.proposeCatalogGift();h.fields.mode='A';await h.submit();assert.equal(h.group.mode,'A');assert.equal(h.group.gift,null);assert.equal(h.routes.at(-1),'setup');});
