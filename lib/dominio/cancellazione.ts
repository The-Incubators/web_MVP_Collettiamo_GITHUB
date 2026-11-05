// La cancellazione dell'account (Gifty UX v2, design.md §10.3; GDPR art. 17): che cosa sparisce e che cosa resta.
// Funzione pura: riceve tutto quello che è legato all'account e restituisce il piano (le scritture da fare) e il
// riepilogo che la pagina mostra prima della conferma. Lo eseguono due adattatori, memoria e Firestore (Admin SDK).
//
// Le regole, dal disegno approvato:
// - si cancellano nome, email e accesso; preferiti e ricorrenze; i biglietti creati (il link non si apre più); le firme
//   sui biglietti altrui; il voto e il messaggio nei regali di altri;
// - i regali organizzati si chiudono: chi ha aderito li vede chiusi nel proprio account. Del gruppo restano il
//   festeggiato, il regalo e le righe degli altri; spariscono nome e metodi di rimborso di chi organizzava (IBAN,
//   PayPal, Satispay sono dati suoi) e la sua riga. Le bozze, che nessun altro vede, si eliminano;
// - nei regali organizzati da altri restano il nome e la quota, perché chi organizza possa chiudere il conto dei
//   rimborsi: la riga diventa come una persona aggiunta a mano, senza collegamento all'account. Anche l'id del
//   documento (che era l'uid) cambia. Una rinuncia, che non muove soldi, si elimina.

import type { Colletta, Metodi, Partecipante, Proposta, Voto } from "../tipi";
import { aggiornaTotali } from "./operazioni";

export interface GruppoDaCancellare {
  colletta: Colletta;
  righe: Partecipante[];
  voti: Voto[];
  proposte: Proposta[];
}

export interface BigliettoDaCancellare {
  id: string;
  festeggiato: string;
  /** "bozza" non è mai stato mandato: niente link da spegnere */
  stato: string;
}

export interface FirmaDaCancellare {
  bigliettoId: string;
  firmaId: string;
  festeggiato: string;
}

export interface DatiAccount {
  uid: string;
  accesso: "google" | "email";
  preferiti: number;
  ricorrenze: number;
  /** i regali di gruppo che l'account organizza */
  organizzati: GruppoDaCancellare[];
  /** i regali di gruppo di altri in cui l'account ha una riga, un voto o una proposta */
  altrui: GruppoDaCancellare[];
  bigliettiCreati: BigliettoDaCancellare[];
  /** le firme dell'account sui biglietti creati da altri */
  firme: FirmaDaCancellare[];
}

export interface VoceRiepilogo {
  icona: "account" | "cuore" | "regalo" | "biglietto" | "voto" | "gruppo";
  testo: string;
  supporto: string;
}

export interface PianoCancellazione {
  riepilogo: { cancelliamo: VoceRiepilogo[]; resta: VoceRiepilogo[] };
  /** regali organizzati da chiudere, con il patch (stato, organizzatore tolto, metodi vuoti, totali) */
  chiudi: { slug: string; patch: Partial<Colletta> }[];
  /** bozze di regali organizzati: si eliminano con tutto quello che contengono */
  eliminaBozze: string[];
  /** righe da eliminare: quella di chi organizzava nei suoi regali, le rinunce nei regali altrui */
  eliminaRighe: { slug: string; pid: string }[];
  /** righe dei regali altrui che restano senza account: si riscrivono con un id nuovo */
  scollegaRighe: { slug: string; vecchioId: string; riga: Partecipante }[];
  eliminaVoti: { slug: string; votoId: string }[];
  /** proposte scritte dall'account: restano (sono regali del gruppo) senza autore */
  anonimizzaProposte: { slug: string; propostaId: string }[];
  /** eventi: nei regali organizzati tutti (li leggeva solo chi organizzava), negli altri quelli dell'account */
  eliminaEventi: { slug: string; tutti: boolean }[];
  eliminaBiglietti: string[];
  eliminaFirme: { bigliettoId: string; firmaId: string }[];
}

export const METODI_VUOTI: Metodi = {
  paypal: { attivo: false, valore: "" },
  satispay: { attivo: false, valore: "" },
  bonifico: { attivo: false, valore: "", intestatario: "" },
  contanti: { attivo: false },
};

/** "Luca", "Luca e Sara", "Luca, Sara e Davide" */
export function elencoNomi(nomi: string[]): string {
  const n = nomi.map((x) => x.trim()).filter(Boolean);
  if (n.length <= 1) return n[0] ?? "";
  return `${n.slice(0, -1).join(", ")} e ${n[n.length - 1]}`;
}

const conta = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`;

export function pianoCancellazione(d: DatiAccount, nuovoId: () => string, ora: number): PianoCancellazione {
  const piano: PianoCancellazione = {
    riepilogo: { cancelliamo: [], resta: [] },
    chiudi: [],
    eliminaBozze: [],
    eliminaRighe: [],
    scollegaRighe: [],
    eliminaVoti: [],
    anonimizzaProposte: [],
    eliminaEventi: [],
    eliminaBiglietti: [],
    eliminaFirme: [],
  };
  const { cancelliamo, resta } = piano.riepilogo;

  cancelliamo.push({ icona: "account", testo: `Nome, email e accesso con ${d.accesso === "google" ? "Google" : "email"}`, supporto: "" });
  const pr = [d.preferiti ? conta(d.preferiti, "preferito", "preferiti") : "", d.ricorrenze ? conta(d.ricorrenze, "ricorrenza", "ricorrenze") : ""].filter(Boolean);
  if (pr.length) cancelliamo.push({ icona: "cuore", testo: pr.join(" e "), supporto: "" });

  for (const g of d.organizzati) {
    const c = g.colletta;
    if (c.organizzatoreUid !== d.uid) continue;
    if (c.stato === "bozza") {
      piano.eliminaBozze.push(c.slug);
      continue;
    }
    let patch: Partial<Colletta> = {
      stato: "chiusa",
      organizzatoreUid: "",
      organizzatoreNome: "",
      metodi: METODI_VUOTI,
      listaAperta: false,
      aggiornatoIl: ora,
    };
    let totali = { nAttesi: c.nAttesi, nAderenti: c.nAderenti, nConfermati: c.nConfermati, totaleConfermatoCent: c.totaleConfermatoCent };
    for (const r of g.righe) {
      if (r.uidAnonimo !== d.uid) continue;
      piano.eliminaRighe.push({ slug: c.slug, pid: r.id });
      totali = aggiornaTotali(totali, r, null);
    }
    patch = { ...patch, ...totali };
    piano.chiudi.push({ slug: c.slug, patch });
    for (const v of g.voti) if (v.uid === d.uid) piano.eliminaVoti.push({ slug: c.slug, votoId: v.id });
    for (const p of g.proposte) if (p.autoreUid === d.uid) piano.anonimizzaProposte.push({ slug: c.slug, propostaId: p.id });
    piano.eliminaEventi.push({ slug: c.slug, tutti: true });
    const altri = g.righe.filter((r) => r.uidAnonimo && r.uidAnonimo !== d.uid && r.stato !== "rinunciato").map((r) => r.nome);
    const supporto =
      altri.length === 0
        ? "Si chiude"
        : `Si chiude: ${elencoNomi(altri)} ${altri.length === 1 ? "lo vede chiuso nel suo account" : "lo vedono chiuso nel loro account"}`;
    cancelliamo.push({ icona: "regalo", testo: `Il regalo per ${c.festeggiato}, che organizzi`, supporto });
  }

  for (const b of d.bigliettiCreati) {
    piano.eliminaBiglietti.push(b.id);
    cancelliamo.push({
      icona: "biglietto",
      testo: `Il biglietto per ${b.festeggiato || "…"}`,
      supporto: b.stato === "bozza" ? "" : "Il link che hai mandato non si apre più",
    });
  }

  for (const f of d.firme) {
    piano.eliminaFirme.push({ bigliettoId: f.bigliettoId, firmaId: f.firmaId });
    cancelliamo.push({ icona: "biglietto", testo: `La tua firma sul biglietto per ${f.festeggiato}`, supporto: "" });
  }

  for (const g of d.altrui) {
    const c = g.colletta;
    if (c.organizzatoreUid === d.uid) continue;
    const voti = g.voti.filter((v) => v.uid === d.uid);
    for (const v of voti) piano.eliminaVoti.push({ slug: c.slug, votoId: v.id });
    for (const p of g.proposte) if (p.autoreUid === d.uid) piano.anonimizzaProposte.push({ slug: c.slug, propostaId: p.id });
    piano.eliminaEventi.push({ slug: c.slug, tutti: false });
    let messaggio = false;
    let rimane = false;
    for (const r of g.righe) {
      if (r.uidAnonimo !== d.uid) continue;
      if (r.messaggio) messaggio = true;
      if (r.stato === "rinunciato") {
        piano.eliminaRighe.push({ slug: c.slug, pid: r.id });
        continue;
      }
      rimane = true;
      piano.scollegaRighe.push({ slug: c.slug, vecchioId: r.id, riga: { ...r, id: nuovoId(), uidAnonimo: null, messaggio: null } });
    }
    const cosa = [voti.length ? "il tuo voto" : "", messaggio ? "il tuo messaggio" : ""].filter(Boolean).join(" e ");
    if (cosa) cancelliamo.push({ icona: "voto", testo: `${cosa.charAt(0).toUpperCase()}${cosa.slice(1)} nel regalo per ${c.festeggiato}`, supporto: "" });
    if (rimane) {
      resta.push({
        icona: "gruppo",
        testo: `Il tuo nome e la quota nel regalo per ${c.festeggiato}`,
        supporto: c.organizzatoreNome ? `${c.organizzatoreNome} li vede ancora, per chiudere il conto dei rimborsi` : "",
      });
    }
  }

  return piano;
}
