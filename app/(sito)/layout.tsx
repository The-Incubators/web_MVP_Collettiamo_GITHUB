import Link from "next/link";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { BarraListaRegali } from "@/components/BarraListaRegali";
import { MenuProfilo } from "@/components/MenuProfilo";
import { BarraNavigazione, NavigazioneOrizzontale } from "@/components/Navigazione";
import { Logo } from "@/components/ui";

/** `modale` è lo slot del popup della scheda prodotto: vuoto quasi sempre (vedi @modale/default.tsx). */
export default function LayoutSito({ children, modale }: { children: React.ReactNode; modale: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-stampa gutter sticky top-0 z-40 bg-field/90 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-catalogo items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-tocco items-center" aria-label="Regaloop, vai alla home">
            <Logo priorita className="h-7" />
          </Link>
          <div className="flex items-center gap-3">
            <NavigazioneOrizzontale />
            <MenuProfilo />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {modale}
      <footer className="no-stampa gutter py-8 text-center text-xs text-ink-soft">
        <div className="mx-auto flex max-w-catalogo flex-col gap-1">
          <p className="font-semibold text-ink">I soldi non passano mai da qui.</p>
          <p>{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
        </div>
      </footer>
      <BarraListaRegali />
      <BarraNavigazione />
    </div>
  );
}
