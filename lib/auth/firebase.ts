// Real Firebase transport shared with the approved Gifty frontend.
import * as sdk from 'firebase/auth';
import { authFirebase } from '../firebase/client';
import { createFirebaseAuthCore } from './firebase-core.mjs';
import { CHIAVE_NOME_ACCESSO, CHIAVE_UID, leggiLocale, nomeDaEmail, scriviLocale, type Autenticazione, type Utente } from './tipi';

function daUtente(u:sdk.User):Utente {
 return {uid:u.uid,nome:u.isAnonymous?'':((leggiLocale('colletta.nomeAccessoUid')===u.uid?leggiLocale(CHIAVE_NOME_ACCESSO):null)??u.displayName??nomeDaEmail(u.email??'')),email:u.email,anonimo:u.isAnonymous};
}
export function creaAutenticazioneFirebase():Autenticazione {
 const core=createFirebaseAuthCore({sdk,auth:authFirebase(),origin:window.location.origin,read:leggiLocale,write:scriviLocale});
 return {
  osserva:cb=>core.observe(u=>cb(u&&!u.isAnonymous?daUtente(u):null)),
  async assicuraIdentita(){const u=await core.identity();if(u.isAnonymous)scriviLocale(CHIAVE_UID,u.uid);return daUtente(u);},
  inviaLinkEmail:(email,nome)=>core.sendEmail(email,nome),
  async completaLinkEmail(url){if(!core.isEmailLink(url))return null;const email=leggiLocale('colletta.emailAccesso')??window.prompt("Per completare l'accesso, riscrivi la tua email");if(!email)return null;const u=await core.completeEmail(url,email);return u?daUtente(u):null;},
  async accediConGoogle(nome){await core.google(nome);},
  esci:()=>core.signOut(),token:()=>core.token()
 };
}
