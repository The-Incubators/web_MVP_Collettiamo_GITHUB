"use client";

import { useMemo, useState } from "react";
import { MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import type { DimensioneTesto, Firma } from "@/lib/tipi";
import { Bottone } from "@/components/ui";
import { useLarghezza } from "./useLarghezza";
import { Copertina } from "./Copertina";
import { Visualizzatore } from "./Visualizzatore";

const FONT = ["predefinito", "playfair-display", "indie-flower", "courier-prime", "parisienne"];
const COLORI = ["#16241F", "#0B5E4C", "#7A2E4A", "#1E3A66", "#8A5A1A"];
const DIM: DimensioneTesto[] = ["s", "m", "m", "l", "m", "s", "xl", "m"];
const TESTI = [
  "Tantissimi auguri! Che questo anno ti porti tutto quello che desideri. 🎉",
  "Buon compleanno dal tuo team: sei un collega stupendo e lo sai.",
  "Auguri!!! 🥳",
  "Non potevo mancare: ti auguro una giornata piena di sorrisi, di torta e di persone che ti vogliono bene. Te lo meriti tutto.",
  "In bocca al lupo per i tuoi 30: il meglio deve ancora arrivare. Un abbraccio grande grande.",
  "Buon compleanno capo! Grazie per tutto quello che fai per noi ogni giorno.",
  "🎂🎈🎁",
  "Che dire… sei la persona più generosa che conosca. Buon compleanno, con affetto da tutti noi del marketing.",
  "Auguri di cuore! Ci vediamo presto per festeggiare come si deve.",
  "Tanti auguri! Spero che questo nuovo anno sia pieno di avventure e di belle sorprese.",
  "Buon compleanno! Un pensiero speciale da parte mia e di tutta la squadra.",
  "Sei una forza della natura. Auguri per questo giorno speciale! 💪",
  "Congratulazioni e auguri! Festeggia alla grande.",
  "Ai migliori 30 anni della tua vita! 🥂",
  "Buon compleanno, amico mio. Che sia un anno indimenticabile.",
];

function foto(seme: number): string {
  const c1 = `hsl(${(seme * 57) % 360} 60% 70%)`;
  const c2 = `hsl(${(seme * 57 + 40) % 360} 60% 55%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='300' height='200' fill='url(%23g)'/><text x='150' y='115' font-size='60' text-anchor='middle'>🎂</text></svg>`;
  return `data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}`;
}

function firmeFinte(): Firma[] {
  return TESTI.map((t, i) => ({
    id: `f${i}`,
    uid: `u${i}`,
    messaggioHtml: i % 4 === 0 ? `<b>${t}</b>` : t,
    stile: { font: FONT[i % FONT.length], colore: COLORI[i % COLORI.length], dimensione: DIM[i % DIM.length] },
    immagine: i % 3 === 0 ? { tipo: "caricata", url: foto(i + 1), larghezza: 300, altezza: 200, attribuzione: null } : null,
    daParteDi: ["Anna", "Luca", "Sara", "Paolo", "Marco", "Elena", "Davide", "Chiara", "Franco", "Irene", "Marta", "Giorgio", "Lucia", "Enzo", "Vera"][i],
    nome: "x",
    cognome: null,
    email: null,
    nascosta: false,
    creatoIl: 1000 + i,
    aggiornatoIl: 1000 + i,
  }));
}

export function ProvaBiglietto() {
  const [colonne, setColonne] = useState<1 | 2 | 3>(2);
  const [idModello, setIdModello] = useState(MODELLI_BIGLIETTO[0].id);
  const modello = MODELLI_BIGLIETTO.find((m) => m.id === idModello) ?? MODELLI_BIGLIETTO[0];
  const firme = useMemo(() => firmeFinte(), []);
  const [refCop, larCop] = useLarghezza(300);
  const [refVis, larVis] = useLarghezza(380);

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-accent-2">Prova del biglietto</h1>
        <p className="text-sm text-ink-soft">Fase 1: copertina e impaginazione automatica con 15 messaggi finti. Pagina interna, non pubblica.</p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div role="group" aria-label="Colonne" className="flex items-center gap-2">
          <span className="text-sm font-semibold">Colonne:</span>
          {[1, 2, 3].map((n) => (
            <Bottone key={n} dimensione="piccolo" variante={colonne === n ? "verde" : "secondario"} onClick={() => setColonne(n as 1 | 2 | 3)}>
              {n}
            </Bottone>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Modello:</span>
          <select value={idModello} onChange={(e) => setIdModello(e.target.value)} className="min-h-tocco rounded-controllo border border-line bg-surface px-2">
            {MODELLI_BIGLIETTO.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-2">
          <div ref={refCop} className="h-0 w-full" />
          <p className="text-sm font-semibold text-ink-soft">Copertina</p>
          <Copertina modello={modello} titolo="Giulia" larghezza={larCop} />
          <p className="text-sm font-semibold text-ink-soft">Miniatura 150 px</p>
          <Copertina modello={modello} titolo="Giulia" larghezza={150} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div ref={refVis} className="h-0 w-full" />
          <p className="text-sm font-semibold text-ink-soft">Sfoglia (copertina + pagine dei messaggi)</p>
          <Visualizzatore modello={modello} titolo="Giulia" firme={firme} colonne={colonne} larghezza={larVis} />
        </div>
      </div>
    </div>
  );
}
