"use client";

import { useRouter } from "next/navigation";
import { Chip, Segmenti } from "@/components/ui";
import { FASCE_CATALOGO, hrefCatalogo, TEMI_CATALOGO, type FiltriCatalogo as Filtri } from "@/lib/dominio/catalogoIdee";

const TUTTI = "";
const PREZZI = [{ valore: TUTTI, etichetta: "Tutti i prezzi" }, ...FASCE_CATALOGO.map((f) => ({ valore: f.valore as string, etichetta: f.etichetta }))];

/**
 * I filtri del catalogo (Gifty UX v2, prototipi/catalogo.html): temi a chip (scelta singola, «Tutti» per primo) e fasce
 * di prezzo a segmenti. Lo stato vive nell'indirizzo, così la pagina filtrata si condivide; cambiando filtro si riparte
 * dalle prime idee.
 */
export function FiltriCatalogo({ attivi, modo }: { attivi: Filtri; modo?: string }) {
  const router = useRouter();
  const vai = (cambia: Filtri) => router.push(hrefCatalogo({ ...attivi, ...cambia, modo }), { scroll: false });
  return (
    <div className="filtri">
      <div className="chips-scorre" role="radiogroup" aria-label="Tema">
        <Chip modo="radio" scelto={!attivi.tema} onClick={() => vai({ tema: undefined })}>
          Tutti
        </Chip>
        {TEMI_CATALOGO.map((t) => (
          <Chip key={t.valore} modo="radio" scelto={attivi.tema === t.valore} onClick={() => vai({ tema: t.valore })}>
            {t.etichetta}
          </Chip>
        ))}
      </div>
      <Segmenti etichetta="Prezzo" opzioni={PREZZI} valore={attivi.fascia ?? TUTTI} onScegli={(v) => vai({ fascia: v || undefined })} />
    </div>
  );
}
