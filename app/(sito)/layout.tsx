import Link from "next/link";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { BarraListaRegali } from "@/components/BarraListaRegali";
import { MenuProfilo } from "@/components/MenuProfilo";
import { BarraNavigazione, NavigazioneOrizzontale } from "@/components/Navigazione";
import { Icona, Logo } from "@/components/ui";

/** `modale` è lo slot del popup della scheda prodotto: vuoto quasi sempre (vedi @modale/default.tsx). */
export default function LayoutSito({ children, modale }: { children: React.ReactNode; modale: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-stampa gutter sticky top-0 z-40 bg-field pt-safe">
        {/* sul telefono il logo sta al centro (lo spazio vuoto a sinistra pareggia il tondo del profilo), da tablet in su a sinistra */}
        <div className="mx-auto flex h-16 max-w-catalogo items-center justify-between gap-4">
          <span aria-hidden="true" className="w-11 md:hidden" />
          <Link href="/" className="inline-flex min-h-tocco items-center" aria-label="Gifty, vai alla home">
            <Logo priorita className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <NavigazioneOrizzontale />
            <MenuProfilo />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {modale}
      <footer className="no-stampa gutter pb-6 pt-8 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
          <p className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-4 py-1 text-xs font-bold text-accent shadow-carta">
            <Icona nome="verified_user" dimensione={18} />I soldi non passano mai da qui.
          </p>
          <p className="text-[11px] font-semibold leading-tight text-ink-soft">{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
        </div>
      </footer>
      <BarraListaRegali />
      <BarraNavigazione />
    </div>
  );
}
