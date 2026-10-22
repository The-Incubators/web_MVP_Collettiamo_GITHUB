import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { BarraSotto } from "@/components/v2/BarraSotto";
import { Icona, ICONE_V2 } from "@/components/v2/Icona";

/**
 * UX_V2 — «Regaloop Expressive Warmth».
 *
 * Vive tutta qui sotto, in `/v2`: UX_V1 resta esattamente com'è (vedi DECISIONI.md, sezione 25).
 * I colori stanno nella classe `.tema-warmth` di globals.css, i nomi dei token in tailwind.config.ts.
 */

// Il carattere dell'interfaccia di questa variante; i titoli usano il Bricolage Grotesque già caricato.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-v2-testo", display: "swap" });

// Solo le icone che usiamo davvero: il font arriva già ridotto a queste.
const FONT_ICONE = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICONE_V2.join(",")}&display=block`;

export const metadata: Metadata = {
  title: { default: "Regaloop", template: "%s · Regaloop" },
};

export default function LayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tema-warmth ${jakarta.variable} flex min-h-dvh flex-col bg-surface font-body-md text-body-md text-on-surface`}>
      <link rel="stylesheet" href={FONT_ICONE} />
      <header className="fixed top-0 z-50 w-full bg-surface/85 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-margin">
          <Link href="/v2" className="flex items-center gap-space-sm" aria-label="Regaloop, vai alla home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/regaloop-icona.png" alt="" width={32} height={36} className="h-8 w-auto object-contain" />
            <span className="font-display text-headline-sm tracking-tight text-primary-container">Regaloop</span>
          </Link>
          <div className="flex items-center gap-space-xs">
            <Link
              href="/catalogo"
              aria-label="Catalogo dei regali"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-primary-container transition-colors hover:bg-forest-tint"
            >
              <Icona nome="redeem" />
            </Link>
            <Link
              href="/accedi"
              aria-label="Il tuo profilo"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary"
            >
              <Icona nome="person" dimensione={18} />
            </Link>
          </div>
        </div>
      </header>
      <main className="relative flex w-full flex-1 flex-col bg-surface px-margin pb-24 pt-16">{children}</main>
      <BarraSotto />
    </div>
  );
}
