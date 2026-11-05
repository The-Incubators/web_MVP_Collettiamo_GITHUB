import type { Errori, StatoWizard } from "@/lib/wizard/stato";

export interface PropsPasso {
  s: StatoWizard;
  cambia: (patch: Partial<StatoWizard>) => void;
  errori: Errori;
  /** istante fissato all'apertura del wizard, per calcoli di data coerenti */
  adesso: number;
}
