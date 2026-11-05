import type { Metadata } from "next";
import { Passo2 } from "@/components/biglietto/pagine/Passo2";

export const metadata: Metadata = { title: "Le basi del biglietto" };

export default async function PaginaDettagli({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Passo2 id={id} />;
}
