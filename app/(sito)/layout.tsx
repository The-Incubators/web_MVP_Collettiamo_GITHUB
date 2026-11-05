import { BarraListaRegali } from "@/components/BarraListaRegali";
import { MenuProfilo } from "@/components/MenuProfilo";
import { BarraNavigazione, Intestazione } from "@/components/Navigazione";
import { Logo } from "@/components/ui";
import { PiePagina } from "@/components/PiePagina";
import { PiePaginaSeVisibile } from "@/components/CorniceSito";
import { ID_POSTO_PASSI } from "@/components/regalo/parti";

/**
 * La cornice del sito (Gifty UX v2, design.md §4): intestazione, contenuto, piè di pagina e barra in basso sul telefono.
 * `modale` è lo slot del popup della scheda prodotto: vuoto quasi sempre (vedi @modale/default.tsx).
 */
export default function LayoutSito({ children, modale }: { children: React.ReactNode; modale: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Intestazione
        logo={<Logo priorita className="h-7" />}
        // vuoto; «Trova il regalo» ci mette i suoi passi (components/regalo/parti.tsx)
        passi={<div id={ID_POSTO_PASSI} className="testa-passi" />}
        account={<MenuProfilo />}
      />
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
