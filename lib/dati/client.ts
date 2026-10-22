// Facciata dei dati per il browser: sceglie l'adattatore in base alla modalità decisa dal server
// e carica lo SDK Firestore solo alla prima chiamata.

import type { Modalita } from "../config";
import { uidCorrenteMemoria } from "../auth/memoria";
import { creaDatiMemoriaClient } from "./memoria-client";
import type { Annulla, Dati } from "./tipi";

type MetodoAsincrono = {
  [K in keyof Dati]: Dati[K] extends (...a: never[]) => Promise<unknown> ? K : never;
}[keyof Dati];

export function creaDatiClient(modalita: Modalita): Dati {
  if (modalita === "memoria") return creaDatiMemoriaClient(uidCorrenteMemoria);

  let impl: Promise<Dati> | null = null;
  const carica = () => (impl ??= import("./firestore").then((m) => m.creaDatiFirestore()));

  const asincrono =
    <K extends MetodoAsincrono>(nome: K) =>
    (...args: unknown[]) =>
      carica().then((d) => (d[nome] as (...a: unknown[]) => unknown)(...args));

  const osserva =
    (nome: "osservaColletta" | "osservaPartecipanti" | "osservaProposte" | "osservaVoti") =>
    (slug: string, cb: (v: never) => void, errore?: (e: Error) => void): Annulla => {
      let annulla: Annulla | undefined;
      let chiuso = false;
      carica()
        .then((d) => {
          if (!chiuso) annulla = (d[nome] as (...a: unknown[]) => Annulla)(slug, cb, errore);
        })
        .catch((e) => errore?.(e));
      return () => {
        chiuso = true;
        annulla?.();
      };
    };

  return {
    elencaProdotti: asincrono("elencaProdotti"),
    prodotto: asincrono("prodotto"),
    colletta: asincrono("colletta"),
    partecipanti: asincrono("partecipanti"),
    salvaUtente: asincrono("salvaUtente"),
    slugLibero: asincrono("slugLibero"),
    creaColletta: asincrono("creaColletta"),
    aggiornaColletta: asincrono("aggiornaColletta"),
    eliminaBozza: asincrono("eliminaBozza"),
    elencaCollette: asincrono("elencaCollette"),
    eventi: asincrono("eventi"),
    registraEvento: asincrono("registraEvento"),
    esegui: asincrono("esegui"),
    aggiungiInvitati: asincrono("aggiungiInvitati"),
    registraSolleciti: asincrono("registraSolleciti"),
    preferiti: asincrono("preferiti"),
    impostaPreferito: asincrono("impostaPreferito"),
    proposte: asincrono("proposte"),
    voti: asincrono("voti"),
    impostaProposteIniziali: asincrono("impostaProposteIniziali"),
    aggiungiProposta: asincrono("aggiungiProposta"),
    rimuoviProposta: asincrono("rimuoviProposta"),
    vota: asincrono("vota"),
    osservaProposte: osserva("osservaProposte") as Dati["osservaProposte"],
    osservaVoti: osserva("osservaVoti") as Dati["osservaVoti"],
    osservaColletta: osserva("osservaColletta") as Dati["osservaColletta"],
    osservaPartecipanti: osserva("osservaPartecipanti") as Dati["osservaPartecipanti"],
  } as Dati;
}
