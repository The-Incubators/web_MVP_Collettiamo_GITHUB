import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { PreferitiProvider } from "@/components/PreferitiProvider";
import { Avviso, URL_FONT_ICONE } from "@/components/ui";
import { baseUrl, modalitaDati } from "@/lib/config";
import "./globals.css";

// UX_V5: un solo carattere, sans-serif pulito come quello di sistema; i titoli si distinguono per peso e misura.
const testo = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-testo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: "Gifty · Il regalo di gruppo, senza dover rincorrere tutti", template: "%s · Gifty" },
  description:
    "Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete. I soldi arrivano direttamente a te.",
  applicationName: "Gifty",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F0F2F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const modalita = modalitaDati();
  return (
    <html lang="it" className={testo.variable}>
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
