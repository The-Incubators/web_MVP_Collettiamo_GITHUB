// Facciata dell'autenticazione per il browser: carica lo SDK Firebase solo quando serve,
// così la prima schermata della pagina pubblica non aspetta nessun JavaScript pesante.

import type { Modalita } from "../config";
import { creaAutenticazioneMemoria, uidCorrenteMemoria } from "./memoria";
import type { Annulla, Autenticazione, Utente } from "./tipi";

export function creaAutenticazioneClient(modalita: Modalita): Autenticazione {
  if (modalita === "memoria") return creaAutenticazioneMemoria();

  let impl: Promise<Autenticazione> | null = null;
  const carica = () => (impl ??= import("./firebase").then((m) => m.creaAutenticazioneFirebase()));

  return {
    osserva(cb): Annulla {
      let annulla: Annulla | undefined;
      let chiuso = false;
      carica()
        .then((a) => {
          if (!chiuso) annulla = a.osserva(cb);
        })
        .catch(() => cb(null));
      return () => {
        chiuso = true;
        annulla?.();
      };
    },
    assicuraIdentita: () => carica().then((a) => a.assicuraIdentita()),
    inviaLinkEmail: (email, nome) => carica().then((a) => a.inviaLinkEmail(email, nome)),
    completaLinkEmail: (url) => carica().then((a) => a.completaLinkEmail(url)),
    accediConGoogle: (nome) => carica().then((a) => a.accediConGoogle(nome)),
    esci: () => carica().then((a) => a.esci()),
    token: () => carica().then((a) => a.token()),
  };
}

export { uidCorrenteMemoria };
export type { Utente };
