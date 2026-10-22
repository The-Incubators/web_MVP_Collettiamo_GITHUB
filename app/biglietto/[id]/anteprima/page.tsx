import type { Metadata } from "next";
import { Passo4 } from "@/components/biglietto/pagine/Passo4";
import { librerieAttive } from "@/lib/biglietti/librerie";

export const metadata: Metadata = { title: "Anteprima del biglietto" };
export const dynamic = "force-dynamic";

export default async function PaginaAnteprima({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Passo4 id={id} librerie={librerieAttive()} />;
}
