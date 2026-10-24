/** Catalog adapter for Stefano's imported source. No synthetic entries enter the public catalog. */
export const THEMES={arredamento:'Arredamento',tecnologia:'Tecnologia',viaggio:'Viaggio'};
export const AGES={bambino:'Bambino · 0–12 anni',adolescente:'Adolescente · 13–17 anni',ragazzo:'Ragazzo · 18–29 anni',adulto:'Adulto · 30+ anni'};
export const PRICE_BANDS=[];
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
export const categoryKey=v=>normalize(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f]/.test(v);
export function affiliateUrl(link,asin,tag){
 if(!/^[A-Z0-9]{10}$/.test(asin)||!/^[-a-zA-Z0-9]+-21$/.test(tag))throw Error('Invalid affiliate data');
 const u=new URL(link);
 if(u.protocol!=='https:'||!['amazon.it','www.amazon.it','m.amazon.it'].includes(u.hostname)||u.port||u.username||u.password||u.pathname!=='/dp/'+asin)throw Error('Invalid Amazon product URL');
 u.searchParams.set('tag',tag);return u.href;
}
export function mapCatalog(payload){
 if(!payload||payload.version!==1||!Array.isArray(payload.items)||!payload.items.length||payload.items.length>1000)throw Error('Invalid catalog');
 if(!Array.isArray(payload.priceBands)||!payload.priceBands.length||payload.priceBands.some(b=>!text(b.id,20)||!text(b.label,40)||!Number.isSafeInteger(b.min)||b.min<0||!(b.max===null||(Number.isSafeInteger(b.max)&&b.max>b.min))))throw Error('Invalid price bands');
 PRICE_BANDS.splice(0,PRICE_BANDS.length,...payload.priceBands.map(b=>({...b,max:b.max===null?Infinity:b.max})));
 const ids=new Set(),slugs=new Set();
 return payload.items.map(v=>{
  if(!/^PRD-\d{3}$/.test(v.id)||ids.has(v.id)||!text(v.slug,100)||!/^[a-z0-9-]+$/.test(v.slug)||slugs.has(v.slug)||!text(v.nome,120)||!text(v.descrizione,400)||!Number.isSafeInteger(v.prezzoCent)||v.prezzoCent<100||v.prezzoCent>100000||!/^\d{4}-\d{2}-\d{2}$/.test(v.rilevatoIl)||Number.isNaN(Date.parse(v.rilevatoIl))||new Date(v.rilevatoIl).toISOString().slice(0,10)!==v.rilevatoIl||!new RegExp('^/foto-prodotti/'+v.id+'\\.(jpg|jpeg|png|webp)$').test(v.foto))throw Error('Invalid product');
  ids.add(v.id);slugs.add(v.slug);
  if(!Array.isArray(v.temi)||v.temi.some(t=>!THEMES[t])||!Array.isArray(v.destinatari)||v.destinatari.some(t=>!['uomo','donna'].includes(t))||!Array.isArray(v.eta)||v.eta.some(t=>!AGES[t]))throw Error('Invalid product classification');
  return {id:v.id,slug:v.slug,name:v.nome,brand:String(v.marca||''),price:v.prezzoCent,image:v.foto,tag:v.temi.map(t=>THEMES[t]).join(' · '),themes:v.temi,recipients:v.destinatari,ages:v.eta,type:String(v.sottocategoria||''),description:v.descrizione,reason:String(v.perche||''),observedAt:v.rilevatoIl,url:affiliateUrl(v.urlEsterno,v.asin,payload.affiliateTag),position:Number.isSafeInteger(v.posizione)?v.posizione:Number.MAX_SAFE_INTEGER};
 }).sort((a,b)=>a.position-b.position||a.price-b.price||a.name.localeCompare(b.name,'it'));
}
export function filterCatalog(items,{theme='Tutti',recipient='',age='',band='',type='',query='',cap=Infinity}={}){
 const range=PRICE_BANDS.find(b=>b.id===band),needle=normalize(query.trim());
 return items.filter(p=>p.price<=cap&&(theme==='Tutti'||p.themes.includes(theme))&&(!recipient||p.recipients.includes(recipient))&&(!age||p.ages.includes(age))&&(!type||categoryKey(p.type)===type)&&(!range||p.price>range.min&&p.price<=range.max)&&(!needle||normalize([p.name,p.brand,p.description,p.type].join(' ')).includes(needle)));
}
export async function loadCatalog(fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetcher('/catalogo.json',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Catalog unavailable');const data=await response.json();return {products:mapCatalog(data),affiliateDisclosure:data.affiliateDisclosure,dates:[...new Set(data.items.map(p=>p.rilevatoIl))].sort(),error:false};}
 catch{return {products:[],dates:[],affiliateDisclosure:'',error:true};}finally{clearTimeout(timer);}
}
