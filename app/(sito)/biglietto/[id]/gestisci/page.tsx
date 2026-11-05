import type { Metadata } from "next";
import { Gestione } from "@/components/biglietto/pagine/Gestione";

export const metadata: Metadata = { title: "Gestisci il biglietto" };

export default async function PaginaGestisci({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Gestione id={id} />;
}
