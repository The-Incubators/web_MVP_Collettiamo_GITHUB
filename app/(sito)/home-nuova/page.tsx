import type { Metadata } from "next";
import { PaginaHome } from "@/components/home/Home";

export const dynamic = "force-dynamic";

/** La home in prova, sempre visibile qui per confrontarla con quella attiva (vedi `HOME_ATTIVA`). */
export const metadata: Metadata = {
  title: "Home nuova",
  robots: { index: false, follow: false },
};

export default function PaginaHomeNuova() {
  return <PaginaHome versione="nuova" />;
}
