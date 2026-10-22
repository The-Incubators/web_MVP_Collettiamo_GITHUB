import type { Errori, StatoWizard } from "./stato";

export interface PropsPasso {
  s: StatoWizard;
  cambia: (patch: Partial<StatoWizard>) => void;
  errori: Errori;
  /** istante fissato all'apertura del wizard, per calcoli di data coerenti */
  adesso: number;
}
