import { PaginaHome } from "@/components/home/Home";
import { HOME_ATTIVA } from "@/lib/ux";

// Le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata.
export const dynamic = "force-dynamic";

/** La home attiva: quale delle due si decide in lib/ux.ts (`HOME_ATTIVA`). */
export default function Home() {
  return <PaginaHome versione={HOME_ATTIVA} />;
}
