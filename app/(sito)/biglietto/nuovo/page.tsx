import type { Metadata } from "next";
import { CreaBiglietto } from "@/components/biglietto/crea/CreaBiglietto";

export const metadata: Metadata = { title: "Crea un biglietto di gruppo" };

export default function PaginaNuovoBiglietto() {
  return <CreaBiglietto />;
}
