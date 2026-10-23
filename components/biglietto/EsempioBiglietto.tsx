"use client";

import Link from "next/link";
import { BottoneLink, Icona } from "@/components/ui";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import type { DimensioneTesto, Firma } from "@/lib/tipi";
import { useLarghezza } from "./useLarghezza";
import { Visualizzatore } from "./Visualizzatore";

/**
 * Un biglietto di esempio, già firmato da cinque persone: per far vedere com'è prima di crearne uno.
 * Tutto è inventato e dichiarato come tale; nulla viene letto o salvato. Le «foto» sono illustrazioni
 * generate qui (sfumatura ed emoji), come nella pagina di prova interna: nessuna immagine di persone vere.
 * Sono larghe e basse (5:2), così i cinque messaggi stanno tutti nella pagina 2, su due colonne.
 */
function foto(tinta: number, emoji: string): string {
  const c1 = `hsl(${tinta} 70% 78%)`;
  const c2 = `hsl(${(tinta + 35) % 360} 65% 60%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='300' height='120' fill='url(#g)'/><text x='150' y='82' font-size='56' text-anchor='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ESEMPI: { daParteDi: string; ruolo: string; testo: string; font: string; colore: string; dimensione: DimensioneTesto; tinta: number; emoji: string }[] = [
  { daParteDi: "Marco", ruolo: "Collega", testo: "Tanti auguri Giulia! Grazie per le risate di ogni giorno. 🎉", font: "predefinito", colore: "#16241F", dimensione: "m", tinta: 20, emoji: "🍕" },
  { daParteDi: "Sara", ruolo: "Amicizia di sempre", testo: "<b>Buon compleanno!</b> Vent'anni di avventure insieme, e siamo solo all'inizio. ❤️", font: "indie-flower", colore: "#7A2E4A", dimensione: "m", tinta: 190, emoji: "🏖️" },
  { daParteDi: "Luca", ruolo: "Famiglia", testo: "Auguri sorellina! Stasera la torta la scelgo io. 🎂", font: "playfair-display", colore: "#1E3A66", dimensione: "m", tinta: 45, emoji: "🐶" },
  { daParteDi: "Elena", ruolo: "Dai tempi della scuola", testo: "Ti ricordi la gita in montagna? <i>Rifacciamola presto!</i>", font: "courier-prime", colore: "#0B5E4C", dimensione: "s", tinta: 140, emoji: "⛰️" },
  { daParteDi: "Paolo", ruolo: "Collega", testo: "Cento di questi giorni, Giulia! 🥂", font: "parisienne", colore: "#8A5A1A", dimensione: "l", tinta: 300, emoji: "🎈" },
];

const FIRME: Firma[] = ESEMPI.map((e, i) => ({
  id: `esempio-${i}`,
  uid: "",
  messaggioHtml: e.testo,
  stile: { font: e.font, colore: e.colore, dimensione: e.dimensione },
  immagine: { tipo: "caricata", url: foto(e.tinta, e.emoji), larghezza: 300, altezza: 120, attribuzione: null },
  daParteDi: e.daParteDi,
  ruolo: e.ruolo,
  nome: "",
  cognome: null,
  email: null,
  nascosta: false,
  creatoIl: i,
  aggiornatoIl: i,
}));

export function EsempioBiglietto() {
  const [rif, larghezza] = useLarghezza(420);
  const modello = modelloPerId("compleanno-palloncini") ?? MODELLI_BIGLIETTO[0];
  return (
    <div className="mx-auto flex w-full max-w-partecipante flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-field px-3 py-1 text-xs font-bold">
          <Icona nome="visibility" dimensione={16} />
          Esempio
        </span>
        <h1 className="font-display text-[28px] font-bold leading-tight text-accent-2">Un biglietto firmato da 5 amici</h1>
        <p className="text-sm text-ink-soft">Ognuno scrive il suo messaggio e aggiunge una foto. Sfoglialo con le frecce.</p>
      </div>

      <div ref={rif} className="h-0 w-full" />
      {/* si apre sulla pagina 2, quella con i messaggi; la copertina è una pagina indietro */}
      <Visualizzatore modello={modello} titolo="Buon compleanno Giulia!" firme={FIRME} colonne={2} larghezza={Math.min(larghezza, 420)} paginaIniziale={1} />

      <p className="text-center text-xs text-ink-soft">Nomi, messaggi e foto sono di esempio.</p>

      <div className="flex flex-col gap-2">
        <BottoneLink href="/biglietto/nuovo" variante="azione" pieno>
          <Icona nome="draw" dimensione={22} />
          Crea il tuo biglietto
        </BottoneLink>
        <Link href="/" className="inline-flex min-h-tocco items-center justify-center text-sm font-bold text-accent">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
