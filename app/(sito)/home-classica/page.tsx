import type { Metadata } from "next";
import { PaginaHome } from "@/components/home/Home";

export const dynamic = "force-dynamic";

/** La home di prima, sempre visibile qui per confrontarla con quella attiva (vedi `HOME_ATTIVA`). */
export const metadata: Metadata = {
  title: "Home classica",
  robots: { index: false, follow: false },
};

export default function PaginaHomeClassica() {
  return <PaginaHome versione="classica" />;
}
