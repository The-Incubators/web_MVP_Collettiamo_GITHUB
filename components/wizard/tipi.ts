import type { ProdottoColletta } from "@/lib/tipi";
import type { Errori, StatoWizard } from "@/lib/wizard/stato";

export interface PropsPasso {
  s: StatoWizard;
  cambia: (patch: Partial<StatoWizard>) => void;
  errori: Errori;
  /** istante fissato all'apertura della procedura, per calcoli di data coerenti */
  adesso: number;
}

/** Un prodotto del catalogo nel foglio della procedura: quello che serve alla tessera, più i temi per i chip. */
export interface VoceCatalogo extends ProdottoColletta {
  slug: string;
  temi: string[];
}

export function daVoce(v: VoceCatalogo): ProdottoColletta {
  return { prodottoId: v.slug, nome: v.nome, prezzoCent: v.prezzoCent, consegnaGiorni: v.consegnaGiorni, urlEsterno: v.urlEsterno, immagine: v.immagine };
}
