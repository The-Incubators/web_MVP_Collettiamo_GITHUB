import type { Metadata } from "next";
import { CatalogoV3 } from "@/components/v3/CatalogoV3";
import { Icona } from "@/components/v3/Icona";
import { datiServer } from "@/lib/dati";
import { chiaveSottocategoria, testoRilevazioneCatalogo } from "@/lib/dominio/regali";
import { TEMI } from "@/lib/tipi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogo",
  description: "Idee regalo da dividere in gruppo: filtra per budget, destinatario e tema, e lancia la colletta in un tocco.",
};

export default async function CatalogoPaginaV3() {
  const prodotti = await datiServer().elencaProdotti();
  // Le sottocategorie vere del catalogo (lampade, vasi, specchi…), come in UX_V1.
  const tipi = [...new Map(prodotti.filter((p) => p.sottocategoria).map((p) => [chiaveSottocategoria(p.sottocategoria as string), p.sottocategoria as string])).entries()]
    .map(([valore, etichetta]) => ({ valore, etichetta }))
    .sort((a, b) => a.etichetta.localeCompare(b.etichetta, "it"));
  const temi = TEMI.filter((t) => prodotti.some((p) => (p.temi ?? []).includes(t)));

  return (
    <div className="flex w-full flex-col gap-space-md">
      <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-tangerine-tint px-3 py-1.5 font-label-sm text-label-sm text-secondary">
        <Icona nome="redeem" dimensione={15} />
        <span>
          <span className="cifre">{prodotti.length}</span> idee regalo testate • Zero sbatti
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight tracking-tight text-primary-container">
          Idee che spaccano. <span className="text-secondary-container">Scegli e fai colletta in un tap.</span>
        </h1>
        <p className="font-body-md text-body-md text-text-muted">
          Filtra per budget, destinatario o tema: la quota a testa si aggiorna mentre scegli.
        </p>
      </div>

      <CatalogoV3 prodotti={prodotti} temi={[...temi]} tipi={tipi} />

      <p className="pb-2 text-center font-body-sm text-[12px] text-text-muted">
        Nessun acquisto qui: scegli, imposta la quota e manda il link al gruppo; compri tu, su Amazon.it. Prezzi rilevati il{" "}
        {testoRilevazioneCatalogo(prodotti) || "14 ottobre 2026"}: possono essere cambiati.
      </p>
    </div>
  );
}
