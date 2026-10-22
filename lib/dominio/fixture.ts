// Dati di prova condivisi dai test (non usato dall'applicazione).
import type { Colletta, Partecipante } from "../tipi";

export function collettaDiProva(extra: Partial<Colletta> = {}): Colletta {
  return {
    slug: "abcdefghjk",
    organizzatoreUid: "org",
    organizzatoreNome: "Marco",
    festeggiato: "Giulia",
    occasione: "compleanno",
    dataRegalo: Date.UTC(2026, 10, 20, 11),
    scadenza: Date.UTC(2026, 10, 15, 19),
    sorpresa: true,
    prodotto: {
      prodottoId: "cuffie-silenzio-pro",
      nome: "Cuffie over-ear",
      prezzoCent: 11600,
      consegnaGiorni: 3,
      urlEsterno: "https://negozio-esempio.it/p/cuffie-silenzio-pro",
      immagine: { seme: "cuffie-silenzio-pro", icona: "audio" },
    },
    modoQuota: "fissa",
    quotaCent: 1000,
    quotaCongelata: false,
    previsti: 12,
    metodi: {
      paypal: { attivo: true, valore: "marco" },
      satispay: { attivo: true, valore: "3331234567" },
      bonifico: { attivo: true, valore: "IT60X0542811101000000123456", intestatario: "Marco Rossi" },
      contanti: { attivo: true },
    },
    listaAperta: true,
    stato: "aperta",
    totaleConfermatoCent: 0,
    nConfermati: 0,
    nAttesi: 0,
    nAderenti: 0,
    acquisto: null,
    votazione: null,
    creatoIl: Date.UTC(2026, 9, 1),
    aggiornatoIl: Date.UTC(2026, 9, 1),
    ...extra,
  };
}

export function rigaDiProva(extra: Partial<Partecipante> = {}): Partecipante {
  return {
    id: "u1",
    nome: "Anna",
    uidAnonimo: "u1",
    stato: "aderito",
    metodo: null,
    importoCent: null,
    causale: "GIULIA-ANNA",
    messaggio: null,
    nota: null,
    creatoIl: Date.UTC(2026, 9, 2),
    dichiaratoIl: null,
    confermatoIl: null,
    solleciti: 0,
    ...extra,
  };
}
