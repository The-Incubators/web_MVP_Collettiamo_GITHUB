import { HOME_ATTIVA, PaginaHome } from "@/components/home/Home";

// Le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata.
export const dynamic = "force-dynamic";

/** La home attiva: quale delle due si decide in components/home/Home.tsx (`HOME_ATTIVA`). */
export default function Home() {
  return <PaginaHome versione={HOME_ATTIVA} />;
}
