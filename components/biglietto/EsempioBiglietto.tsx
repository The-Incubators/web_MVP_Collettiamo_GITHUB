"use client";

import Link from "next/link";
import { Icona } from "@/components/ui";
import { COLORI_NOTA } from "@/lib/dominio/bacheca";
import type { BigliettoPubblico, DimensioneTesto, Firma } from "@/lib/tipi";
import { Rivelazione } from "./bacheca/Rivelazione";

/**
 * Un biglietto di esempio, già firmato da sei persone e consegnato: si vede la sorpresa come la vedrà
 * il festeggiato, con le quattro modalità. Solo l'anteprima: si chiude con la X in alto a destra.
 * Tutto è inventato; nulla viene letto o salvato.
 * Le «foto» sono illustrazioni generate qui (sfumatura ed emoji): nessuna immagine di persone vere.
 */
function foto(tinta: number, emoji: string): string {
  const c1 = `hsl(${tinta} 70% 78%)`;
  const c2 = `hsl(${(tinta + 35) % 360} 65% 60%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><text x='200' y='185' font-size='110' text-anchor='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ESEMPI: { daParteDi: string; ruolo: string; testo: string; font: string; colore: string; dimensione: DimensioneTesto; foto?: [number, string] }[] = [
  { daParteDi: "Marco", ruolo: "Collega", testo: "Tanti auguri Giulia! Grazie per le risate di ogni giorno. 🎉", font: "predefinito", colore: "#16241F", dimensione: "m", foto: [20, "🍕"] },
  { daParteDi: "Sara", ruolo: "Amicizia di sempre", testo: "<b>Buon compleanno!</b> Vent'anni di avventure insieme, e siamo solo all'inizio. ❤️", font: "indie-flower", colore: "#7A2E4A", dimensione: "m" },
  { daParteDi: "Luca", ruolo: "Famiglia", testo: "Auguri sorellina! Stasera la torta la scelgo io. 🎂", font: "playfair-display", colore: "#1E3A66", dimensione: "m", foto: [45, "🐶"] },
  { daParteDi: "Elena", ruolo: "Dai tempi della scuola", testo: "Ti ricordi la gita in montagna? <i>Rifacciamola presto!</i>", font: "courier-prime", colore: "#0B5E4C", dimensione: "m", foto: [140, "⛰️"] },
  { daParteDi: "Paolo", ruolo: "Collega", testo: "Cento di questi giorni, Giulia! 🥂", font: "parisienne", colore: "#8A5A1A", dimensione: "l" },
  { daParteDi: "Chiara", ruolo: "Vicina di casa", testo: "Che sia un anno pieno di cose belle, come te. 🌻", font: "predefinito", colore: "#16241F", dimensione: "m" },
];

const FIRME: Firma[] = ESEMPI.map((e, i) => ({
  id: `esempio-${i}`,
  uid: "",
  messaggioHtml: e.testo,
  stile: { font: e.font, colore: e.colore, dimensione: e.dimensione },
  immagine: e.foto ? { tipo: "caricata", url: foto(...e.foto), larghezza: 400, altezza: 300, attribuzione: null } : null,
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
