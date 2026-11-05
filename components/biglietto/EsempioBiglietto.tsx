"use client";

import Link from "next/link";
import { useCorniceInerte } from "@/components/CorniceSito";
import { Icona } from "@/components/ui";
import { COLORI_NOTA } from "@/lib/dominio/bacheca";
import type { BigliettoPubblico, DimensioneTesto, Firma } from "@/lib/tipi";
import { Rivelazione } from "./bacheca/Rivelazione";

/**
 * Un biglietto di esempio, già firmato da sei persone e consegnato: si vede la sorpresa come la vedrà
 * il festeggiato, con le quattro modalità. Solo l'anteprima: si chiude con la X in alto a destra.
 * Tutto è inventato; nulla viene letto o salvato.
 * Le foto vengono da Pexels (licenza libera, senza obbligo di citarle): originali in Foto_Biglietto_Anteprima/,
 * ridotte a 900 px di larghezza in public/biglietto-esempio/. I testi sono scritti per stare con la foto.
 */
const ESEMPI: { daParteDi: string; ruolo: string; testo: string; font: string; colore: string; dimensione: DimensioneTesto; foto: [string, number, number] }[] = [
  { daParteDi: "Marco", ruolo: "Collega", testo: "Tanti auguri Giulia! Grazie per le risate di ogni giorno. 🎉", font: "predefinito", colore: "#16241F", dimensione: "m", foto: ["marco", 900, 600] },
  { daParteDi: "Sara", ruolo: "Amicizia di sempre", testo: "<b>Buon compleanno!</b> Ti ricordi questa foto? Vent'anni di avventure insieme, e siamo solo all'inizio. ❤️", font: "indie-flower", colore: "#7A2E4A", dimensione: "m", foto: ["sara", 900, 1137] },
  { daParteDi: "Luca", ruolo: "Famiglia", testo: "Auguri sorellina! Stasera la torta la porto io, e le candeline le spegni tu. 🎂", font: "playfair-display", colore: "#1E3A66", dimensione: "m", foto: ["luca", 900, 506] },
  { daParteDi: "Elena", ruolo: "Dai tempi della scuola", testo: "Ti ricordi l'estate al mare? <i>Rifacciamola presto!</i> 🎈", font: "courier-prime", colore: "#0B5E4C", dimensione: "m", foto: ["elena", 900, 1353] },
  { daParteDi: "Paolo", ruolo: "Collega", testo: "Cento di questi giorni, Giulia! Stasera si brinda tutti insieme. 🥂", font: "parisienne", colore: "#8A5A1A", dimensione: "l", foto: ["paolo", 900, 600] },
  { daParteDi: "Chiara", ruolo: "Vicina di casa", testo: "Che sia un anno leggero come un palloncino e pieno di cose belle, come te. 🌸", font: "predefinito", colore: "#16241F", dimensione: "m", foto: ["chiara", 900, 1350] },
];

const FIRME: Firma[] = ESEMPI.map((e, i) => ({
  id: `esempio-${i}`,
  uid: "",
  messaggioHtml: e.testo,
  stile: { font: e.font, colore: e.colore, dimensione: e.dimensione },
  immagine: { tipo: "caricata", url: `/biglietto-esempio/${e.foto[0]}.jpg`, larghezza: e.foto[1], altezza: e.foto[2], attribuzione: null },
  daParteDi: e.daParteDi,
  ruolo: e.ruolo,
  coloreNota: COLORI_NOTA[i % COLORI_NOTA.length],
  nome: "",
  cognome: null,
  email: null,
  nascosta: false,
  creatoIl: i,
  aggiornatoIl: i,
}));

const BIGLIETTO: BigliettoPubblico = {
  id: "esempio",
  slug: "esempio",
  organizzatoreNome: null,
  occasione: "compleanno",
  festeggiato: "Giulia",
  messaggioGruppo: "",
  nome: "Buon compleanno, Giulia!",
  copertina: { modelloId: "compleanno-palloncini", variante: 0, titolo: "Buon compleanno, Giulia!", sottotitolo: null, immagineUrl: null },
  colonne: 2,
  ordineFirme: null,
  stato: "consegnato",
  nFirme: FIRME.length,
  rivelazione: "storie",
  musica: null,
};

export function EsempioBiglietto() {
  useCorniceInerte();
  return (
    <Rivelazione
      b={BIGLIETTO}
      firme={FIRME}
      chiudi={
        <Link href="/" className="flex flex-col items-center gap-1 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#16241F] shadow-sollevata hover:bg-white">
            <Icona nome="close" dimensione={24} />
          </span>
          <span className="whitespace-nowrap rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold leading-none backdrop-blur">Chiudi anteprima</span>
        </Link>
      }
    />
  );
}
