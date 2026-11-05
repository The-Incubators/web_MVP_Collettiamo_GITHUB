"use client";

import Link from "next/link";
import { IconaTratto } from "@/components/ui";
import { COLORI_NOTA, STILI_CARTA } from "@/lib/dominio/bacheca";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { Rivelazione } from "./bacheca/Rivelazione";

/**
 * Il biglietto di esempio (prototipi/biglietto-apertura.html): già firmato e consegnato, si apre come lo aprirà Marta,
 * dalla busta ai foglietti. Si chiude con la X in alto a destra. Tutto è inventato; nulla viene letto o salvato.
 * Le foto vengono da Pexels (licenza libera, senza obbligo di citarle), ridotte in public/biglietto-esempio/.
 */
const ESEMPI: { daParteDi: string; testo: string; foto: [string, number, number] | null }[] = [
  { daParteDi: "Chiara", testo: "Ti pensiamo tutti, oggi più che mai.", foto: ["chiara", 900, 1350] },
  { daParteDi: "Paolo", testo: "Un abbraccio grande da tutto l'ufficio!", foto: null },
  { daParteDi: "Elena", testo: "Sei una persona speciale. Grazie di esserci.", foto: null },
  { daParteDi: "Cri", testo: "Buon compleanno da chi ti ruba sempre la penna.", foto: null },
  { daParteDi: "Marco", testo: "La torta la porto io.", foto: ["marco", 900, 600] },
  { daParteDi: "Luca", testo: "Cento di questi giorni, e di queste pause caffè.", foto: null },
];

const FIRME: Firma[] = ESEMPI.map((e, i) => ({
  id: `esempio-${i}`,
  uid: "",
  messaggioHtml: e.testo.replace(/&/g, "&amp;").replace(/</g, "&lt;"),
  stile: { font: "predefinito", colore: "#16241F", dimensione: "m" },
  immagine: e.foto ? { tipo: "caricata", url: `/biglietto-esempio/${e.foto[0]}.jpg`, larghezza: e.foto[1], altezza: e.foto[2], attribuzione: null } : null,
  daParteDi: e.daParteDi,
  ruolo: null,
  coloreNota: COLORI_NOTA[i % COLORI_NOTA.length],
  nome: "",
  cognome: null,
  email: null,
  nascosta: false,
  creatoIl: i,
  aggiornatoIl: i,
}));

const STILE = STILI_CARTA[2];

const BIGLIETTO: BigliettoPubblico = {
  id: "esempio",
  slug: "esempio",
  organizzatoreNome: null,
  occasione: "compleanno",
  festeggiato: "Marta",
  messaggioGruppo: "",
  nome: "Buon compleanno, Marta!",
  copertina: { modelloId: STILE.id, variante: 1, titolo: "Buon compleanno, Marta!", sottotitolo: null, immagineUrl: null, colori: { ...STILE.colori } },
  colonne: 2,
  ordineFirme: null,
  stato: "consegnato",
  nFirme: FIRME.length,
  rivelazione: "griglia",
  musica: null,
};

export function EsempioBiglietto() {
  return (
    <Rivelazione
      b={BIGLIETTO}
      firme={FIRME}
      chiudi={
        <Link href="/biglietto" className="tondo-r" aria-label="Chiudi anteprima">
          <IconaTratto nome="chiudi" />
        </Link>
      }
    />
  );
}
