import { BarraListaRegali } from "@/components/BarraListaRegali";
import { MenuProfilo } from "@/components/MenuProfilo";
import { BarraNavigazione, Intestazione } from "@/components/Navigazione";
import { Logo } from "@/components/ui";
import { PiePagina } from "@/components/PiePagina";
import { PiePaginaSeVisibile } from "@/components/CorniceSito";

/**
 * La cornice del sito (Gifty UX v2, design.md §4): intestazione, contenuto, piè di pagina e barra in basso sul telefono.
 * La usano le pagine del sito e quella di chi riceve il link del regalo di gruppo (G-13: stessa intestazione).
 */
export function CorniceCompleta({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Intestazione logo={<Logo priorita className="h-7" />} account={<MenuProfilo />} />
      <main className="flex-1">{children}</main>
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
