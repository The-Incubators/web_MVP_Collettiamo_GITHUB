import { formattaEuro } from "./importi";
import { dataBreve } from "./date";

export function linkColletta(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/c/${slug}`;
}

export function messaggioInvito(input: { festeggiato: string; quotaCent: number; scadenza: number; url: string }): string {
  return `Ciao! Facciamo un regalo di gruppo a ${input.festeggiato}. ${formattaEuro(input.quotaCent)} a testa, entro ${dataBreve(input.scadenza)}. Qui c'è tutto, ci metti un minuto: ${input.url}`;
}

export function linkWhatsApp(messaggio: string): string {
  return `https://wa.me/?text=${encodeURIComponent(messaggio)}`;
}

export function titoloPubblico(input: { festeggiato: string; quotaCent: number; sorpresa: boolean; votazione?: boolean }): string {
  if (input.votazione) return input.sorpresa ? "Scegliamo insieme un regalo a sorpresa" : `Scegliamo insieme il regalo per ${input.festeggiato}`;
  return input.sorpresa
    ? "Un regalo a sorpresa"
    : `Regalo per ${input.festeggiato} · ${formattaEuro(input.quotaCent)} a testa`;
}

export function descrizionePubblica(input: { prodottoNome: string; organizzatoreNome: string; sorpresa: boolean; votazione?: boolean }): string {
  if (input.votazione) return `${input.organizzatoreNome} ti chiede di votare il regalo di gruppo. Bastano pochi secondi.`;
  const base = `${input.organizzatoreNome} sta organizzando un regalo di gruppo. Ci metti un minuto.`;
  // In modalità sorpresa l'anteprima non rivela il regalo: il festeggiato potrebbe vederla per sbaglio.
  return input.sorpresa ? base : `${input.prodottoNome}. ${base}`;
}

/** L'invito a votare, al posto di quello a pagare. `scade` è il momento in cui la votazione si chiude. */
export function messaggioVotazione(input: { festeggiato: string; scade: number; url: string }): string {
  const fine = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(input.scade));
  return `Ciao! Stiamo scegliendo il regalo di gruppo per ${input.festeggiato}: vota il tuo preferito (ci metti un minuto) o proponi un'idea tua, entro ${fine}. ${input.url}`;
}

/** Dopo il voto: il messaggio per far tornare tutti a pagare. */
export function messaggioDopoVoto(input: { festeggiato: string; regalo: string; quotaCent: number; scadenza: number; url: string }): string {
  return `Il regalo per ${input.festeggiato} è deciso: ${input.regalo}. ${formattaEuro(input.quotaCent)} a testa, entro ${dataBreve(input.scadenza)}. Partecipa qui: ${input.url}`;
}
