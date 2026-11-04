"use server";

import { datiServer } from "@/lib/dati";
import { stelleDi } from "@/lib/dominio/ordineCatalogo";
import type { Prodotto } from "@/lib/tipi";
import { ALTRI_REGALI_PER_VOLTA } from "./SchedaRegaloAmato";

export interface AltriRegali {
  regali: { prodotto: Prodotto; stelle: number }[];
  /** ci sono ancora prodotti dopo questi */
  altri: boolean;
}

/** I prodotti della home dalla posizione `da` in poi, nello stesso ordine della home, con le stelle del backoffice. */
export async function altriRegali(da: number): Promise<AltriRegali> {
  if (!Number.isInteger(da) || da < 0) return { regali: [], altri: false };
  const dati = datiServer();
  const [prodotti, impostazioni] = await Promise.all([dati.elencaProdotti(), dati.impostazioniCatalogo()]);
  const stelle = impostazioni?.stelle ?? {};
  return {
    regali: prodotti.slice(da, da + ALTRI_REGALI_PER_VOLTA).map((prodotto) => ({ prodotto, stelle: stelleDi(stelle, prodotto.slug) })),
    altri: prodotti.length > da + ALTRI_REGALI_PER_VOLTA,
  };
}
