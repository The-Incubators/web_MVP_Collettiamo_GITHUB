import type { Colletta, Partecipante } from "../tipi";

const ORDINE_STATO = { dichiarato: 0, aderito: 1, invitato: 2, confermato: 3, rinunciato: 4 } as const;

/** Da confermare: hanno dichiarato di aver pagato (esclusi i contanti, che hanno la loro coda). */
export function daConfermare(righe: Partecipante[]): Partecipante[] {
  return righe.filter((p) => p.stato === "dichiarato");
}

/** Contanti da ricevere: hanno scelto i contanti e non risultano ancora confermati. */
export function contantiDaRicevere(righe: Partecipante[]): Partecipante[] {
  return righe.filter((p) => p.metodo === "contanti" && (p.stato === "aderito" || p.stato === "dichiarato"));
}

export function ordinaPartecipanti(righe: Partecipante[]): Partecipante[] {
  return [...righe].sort(
    (a, b) => ORDINE_STATO[a.stato] - ORDINE_STATO[b.stato] || a.nome.localeCompare(b.nome, "it"),
  );
}

/** Obiettivo, confermato e percentuale (0-100) per la barra. */
export function avanzamento(c: Pick<Colletta, "prodotto" | "totaleConfermatoCent">) {
  const obiettivoCent = c.prodotto.prezzoCent;
  const percento = obiettivoCent > 0 ? Math.min(100, Math.round((c.totaleConfermatoCent / obiettivoCent) * 100)) : 0;
  return { obiettivoCent, confermatoCent: c.totaleConfermatoCent, percento };
}

export function inizialiDi(nome: string): string {
  const parole = nome.trim().split(/\s+/).filter(Boolean);
  return ((parole[0]?.[0] ?? "?") + (parole.length > 1 ? (parole[parole.length - 1]?.[0] ?? "") : "")).toUpperCase();
}
