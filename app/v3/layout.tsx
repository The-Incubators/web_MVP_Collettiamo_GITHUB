import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { BarraSotto } from "@/components/v3/BarraSotto";
import { Icona, ICONE_V3 } from "@/components/v3/Icona";

/**
 * UX_V3 — «Interactive Action».
 *
 * Stesso design system di UX_V2 («Expressive Warmth»: i due DESIGN.md sono identici), quindi stessi
 * token e stessa classe `.tema-warmth`. Cambia la UX: simulatore della quota in home, catalogo con due
 * modi di sfogliare, creazione tutta in una pagina. Vive sotto `/v3`; UX_V1 e UX_V2 restano com'erano.
 */

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-v2-testo", display: "swap" });

const FONT_ICONE = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICONE_V3.join(",")}&display=block`;

export const metadata: Metadata = {
  title: { default: "Regaloop", template: "%s · Regaloop" },
};

export default function LayoutV3({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tema-warmth ${jakarta.variable} flex min-h-dvh flex-col bg-surface font-body-md text-body-md text-on-surface`}>
      <link rel="stylesheet" href={FONT_ICONE} />
      <header className="fixed top-0 z-50 w-full bg-surface/90 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-margin">
          <Link href="/v3" className="flex items-center gap-space-sm" aria-label="Regaloop, vai alla home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/regaloop.png" alt="" width={400} height={105} className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-space-xs">
            <Link
              href="/le-mie-collette"
              aria-label="Le tue collette"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-primary-container transition-colors hover:bg-forest-tint"
            >
              <Icona nome="notifications" />
            </Link>
            <Link
              href="/v3/crea"
              aria-label="Crea una colletta"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95"
            >
              <Icona nome="bolt" dimensione={20} piena />
            </Link>
          </div>
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col bg-surface px-margin pb-28 pt-20">{children}</main>
      <BarraSotto />
    </div>
  );
}
