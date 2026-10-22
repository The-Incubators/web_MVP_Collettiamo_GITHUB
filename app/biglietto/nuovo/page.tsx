import type { Metadata } from "next";
import { Passo1 } from "@/components/biglietto/pagine/Passo1";

export const metadata: Metadata = { title: "Crea un biglietto di gruppo" };

export default function PaginaNuovoBiglietto() {
  return <Passo1 />;
}
