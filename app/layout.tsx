import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Urbanist } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { PreferitiProvider } from "@/components/PreferitiProvider";
import { Avviso, URL_FONT_ICONE } from "@/components/ui";
import { baseUrl, modalitaDati } from "@/lib/config";
import "./globals.css";

// Direzione A (docs/product/gifty/Gifty-UX-design-guidelines.md): Urbanist per i titoli, Source Sans 3 per il testo.
const display = Urbanist({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const testo = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-testo",
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
    <html lang="it" className={`${display.variable} ${testo.variable}`}>
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
