import Link from "next/link";
import { Logo } from "@/components/ui";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { MenuBurger } from "@/components/MenuBurger";
import { BarraListaRegali } from "@/components/BarraListaRegali";

/** `modale` è lo slot del popup della scheda prodotto: vuoto quasi sempre (vedi @modale/default.tsx). */
export default function LayoutSito({ children, modale }: { children: React.ReactNode; modale: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-stampa gutter border-b border-line bg-surface">
        <div className="mx-auto flex max-w-catalogo flex-wrap items-center justify-between gap-x-4">
          <Link href="/" className="inline-flex min-h-tocco items-center" aria-label="Regaloop, vai alla home">
            <Logo priorita />
          </Link>
          <MenuBurger />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {modale}
      <BarraListaRegali />
      <footer className="no-stampa gutter border-t border-line py-6 text-sm text-ink-soft">
        <div className="mx-auto flex max-w-catalogo flex-col gap-1">
          <p>Regaloop è un prototipo del progetto Cosa Gli Regaliamo.</p>
          <p>I soldi non passano mai da qui: si pagano direttamente a chi organizza.</p>
          <p>{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
        </div>
      </footer>
    </div>
  );
}
