import Link from "next/link";
import { BarraListaRegali } from "@/components/BarraListaRegali";
import { MenuProfilo } from "@/components/MenuProfilo";
import { BarraNavigazione, CuorePreferiti, NavigazioneOrizzontale } from "@/components/Navigazione";
import { Logo } from "@/components/ui";
import { PiePagina } from "@/components/PiePagina";
import { PiePaginaSeVisibile } from "@/components/CorniceSito";

/** `modale` è lo slot del popup della scheda prodotto: vuoto quasi sempre (vedi @modale/default.tsx). */
export default function LayoutSito({ children, modale }: { children: React.ReactNode; modale: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header data-cornice className="no-stampa gutter sticky top-0 z-40 bg-field/90 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-catalogo items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-tocco items-center" aria-label="Gifty, vai alla home">
            <Logo priorita className="h-9" />
          </Link>
          {/* vuoto; «Trova il regalo» ci mette i suoi passi (components/regalo/parti.tsx) */}
          <div id="intestazione-passi" className="flex min-w-0 flex-1 justify-center" />
          <div className="flex items-center gap-3">
            <NavigazioneOrizzontale />
            <CuorePreferiti />
            <MenuProfilo />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {modale}
      {/* data-cornice: le viste a tutto schermo la rendono inerte (components/CorniceSito.tsx) */}
      <div data-cornice>
        <PiePaginaSeVisibile>
          <PiePagina />
        </PiePaginaSeVisibile>
        <BarraListaRegali />
        <BarraNavigazione />
      </div>
    </div>
  );
}
