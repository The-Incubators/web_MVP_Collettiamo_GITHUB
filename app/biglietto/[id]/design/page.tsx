import type { Metadata } from "next";
import { Suspense } from "react";
import { Passo3 } from "@/components/biglietto/pagine/Passo3";
import { librerieAttive } from "@/lib/biglietti/librerie";

export const metadata: Metadata = { title: "Scegli la copertina" };
export const dynamic = "force-dynamic";

export default async function PaginaDesign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <Passo3 id={id} librerie={librerieAttive()} />
    </Suspense>
  );
}
