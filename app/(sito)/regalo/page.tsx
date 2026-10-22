// Secondo punto d'ingresso al catalogo: il percorso a domande «Trova il regalo».
// La home (/) non cambia; questa pagina vive accanto, dentro lo stesso layout del sito (intestazione, menu,
// barra della lista regali, piè di pagina con la dichiarazione di affiliazione).
//
// Aspetto e percorso sono ripresi da globe-tube-dev.web.app/regalo.html; i prodotti sono i nostri.

import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { TrovaRegalo } from "@/components/regalo/TrovaRegalo";
import { datiServer } from "@/lib/dati";
import "./regalo.css";

// I caratteri del percorso di partenza, caricati solo per questa pagina.
const testoRegalo = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--gf-font", display: "swap" });
const displayRegalo = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--gf-display", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trova il regalo perfetto",
  description:
    "Rispondi a poche domande su chi riceve il regalo, l’occasione e gli interessi: ti mostriamo le idee più adatte, da regalare in gruppo.",
};

export default async function PaginaRegalo() {
  const prodotti = await datiServer().elencaProdotti();

  return (
    <div className={`gf-page gutter ${testoRegalo.variable} ${displayRegalo.variable}`}>
      <div className="mx-auto max-w-catalogo">
        <div className="gf-hero">
          <div className="gf-main">
            <h1 className="gf-title">Trova il regalo perfetto</h1>
            <p className="gf-intro">
              Tre domande, pochi click: ti aiutiamo a scegliere il <strong>regalo ideale</strong> per ogni persona ed occasione.
            </p>
            <TrovaRegalo prodotti={prodotti} />
            <noscript>
              <p>
                Per usare il percorso serve JavaScript. Puoi sempre sfogliare <a href="/catalogo">il catalogo</a>.
              </p>
            </noscript>
          </div>
          <aside className="gf-art" aria-hidden="true">
            <svg viewBox="0 0 320 360" role="presentation" focusable="false">
              <defs>
                <linearGradient id="gf-art-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#215747" />
                  <stop offset=".55" stopColor="#1b6a80" />
                  <stop offset="1" stopColor="#b3441c" />
                </linearGradient>
              </defs>
              <circle cx="160" cy="190" r="140" fill="url(#gf-art-grad)" opacity=".14" />
              <g fill="none" stroke="#172d2a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="70" y="150" width="180" height="50" rx="8" fill="#e3f294" />
                <path d="M85 200v100a10 10 0 0010 10h130a10 10 0 0010-10V200" fill="#fff" />
                <path d="M160 150v160" />
                <path d="M160 150c-10-45-60-60-70-30s30 30 70 30zM160 150c10-45 60-60 70-30s-30 30-70 30z" fill="#fff" />
              </g>
              <g fill="#1b6a80">
                <circle cx="60" cy="90" r="6" />
                <circle cx="270" cy="70" r="5" fill="#b3441c" />
                <circle cx="285" cy="250" r="7" fill="#215747" />
              </g>
            </svg>
          </aside>
        </div>
      </div>
    </div>
  );
}
