import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { PreferitiProvider } from "@/components/PreferitiProvider";
import { Avviso } from "@/components/ui";
import { baseUrl, modalitaDati } from "@/lib/config";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const testo = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-testo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: "Regaloop · Il regalo di gruppo, senza dover rincorrere tutti", template: "%s · Regaloop" },
  description:
    "Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete. I soldi arrivano direttamente a te.",
  applicationName: "Regaloop",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDF1EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1613" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const modalita = modalitaDati();
  return (
    <html lang="it" className={`${display.variable} ${testo.variable}`}>
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
