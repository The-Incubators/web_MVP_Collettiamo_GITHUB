import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
const helper=source.split('\n').find(l=>l.startsWith('const validSavedProductId='));
const valid=source.slice(source.indexOf('function validState(candidate){'),source.indexOf('\ntry{const stored='));
const restore=source.split('\n').find(l=>l.startsWith('try{const stored='));
const favourites=source.split('\n').find(l=>l.startsWith('state.favourites=Array.isArray'));
const resolve=source.split('\n').find(l=>l.startsWith('const product=id=>'));
function fixture(gift='PRD-999'){
 const group={mode:'A',recipient:'Mauro',quota:1500,expected:8,members:[{id:'member-1',name:'Andrea',received:1500,declaration:1500}],gift,recipientChoice:null,cardMessage:'Auguri',invitations:[]};
 return {version:1,scenario:'A',role:'organiser',favourites:[gift,'PRD-016'],scenarios:{A:group,B:{...group,mode:'B',recipient:'Giulia',gift:null}}};
}
function restoreActual(stored){
 const current=[{id:'PRD-016',name:'Current product'}];
 const ctx=vm.createContext({allProductIds:new Set(current.map(p=>p.id)),products:current,legacyProducts:[],catalogSource:{error:false},state:{sentinel:true},localStorage:{getItem:()=>JSON.stringify(stored)},KEY:'test-key'});
 vm.runInContext(helper+'\n'+valid+'\n'+restore+'\n'+favourites+'\n'+resolve+"\nresolvedRemoved=product('PRD-999');",ctx);
 return ctx;
}
test('removed curated product remains a historical group/favourite reference after actual storage restoration',()=>{const ctx=restoreActual(fixture());assert.equal(ctx.state.sentinel,undefined);assert.equal(ctx.state.scenarios.A.recipient,'Mauro');assert.equal(ctx.state.scenarios.A.quota,1500);assert.equal(ctx.state.scenarios.A.members[0].received,1500);assert.equal(ctx.state.scenarios.A.gift,'PRD-999');assert.deepEqual(Array.from(ctx.state.favourites),['PRD-999','PRD-016']);assert.equal(ctx.resolvedRemoved,undefined);assert.deepEqual(Array.from(ctx.products,p=>p.id),['PRD-016']);});
test('historical preservation does not accept arbitrary malformed gift identifiers',()=>{const candidate=fixture('https://attacker.test/gift');const ctx=vm.createContext({allProductIds:new Set(['PRD-016']),catalogSource:{error:false},candidate});vm.runInContext(helper+'\n'+valid+'\nvalidResult=validState(candidate)',ctx);assert.equal(ctx.validResult,false);});

test('historical identifiers must remain strings rather than coercible arrays',()=>{const candidate=fixture(['PRD-999']);const ctx=vm.createContext({allProductIds:new Set(['PRD-016']),catalogSource:{error:false},candidate});vm.runInContext(helper+'\n'+valid+'\nvalidResult=validState(candidate)',ctx);assert.equal(ctx.validResult,false);});
