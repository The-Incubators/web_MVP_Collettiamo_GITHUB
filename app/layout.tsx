import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/components/AppProvider";
import { PreferitiProvider } from "@/components/PreferitiProvider";
import { Avviso, URL_FONT_ICONE } from "@/components/ui";
import { baseUrl, modalitaDati } from "@/lib/config";
import "./globals.css";

// Gifty UX v2 (docs/specs/gifty-ux-v2/design.md §3.2): tre famiglie con licenza OFL, servite dal sito (app/fonts, con
// le licenze accanto). Urbanist per titoli e cifre, Source Sans 3 per testo e controlli, Caveat solo dentro i biglietti.
const display = localFont({
  src: "./fonts/Urbanist.ttf",
  weight: "100 900",
  variable: "--font-display",
  display: "swap",
});

const testo = localFont({
  src: "./fonts/SourceSans3.ttf",
  weight: "200 900",
  variable: "--font-testo",
  display: "swap",
});

const mano = localFont({
  src: "./fonts/Caveat.ttf",
  weight: "400 700",
  variable: "--font-mano",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: "Gifty · Regali di gruppo, idee regalo e biglietti di auguri", template: "%s · Gifty" },
  description:
    "Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete. I soldi arrivano direttamente a te.",
  applicationName: "Gifty",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5FAF6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const modalita = modalitaDati();
  return (
    <html lang="it" className={`${display.variable} ${testo.variable} ${mano.variable}`}>
      <head>
        {/* font delle icone, ridotto all'elenco di components/ui/Icona.tsx */}
        <link rel="stylesheet" href={URL_FONT_ICONE} />
      </head>
      <body>
        {modalita === "memoria" ? (
          <div className="no-stampa gutter pt-2">
            <div className="mx-auto max-w-catalogo">
              <Avviso tono="attenzione">
                <p>Firebase non è configurato: i dati sono finti e non vengono salvati</p>
              </Avviso>
            </div>
          </div>
        ) : null}
        <AppProvider modalita={modalita}>
          <PreferitiProvider>{children}</PreferitiProvider>
        </AppProvider>
      </body>
    </html>
  );
}
