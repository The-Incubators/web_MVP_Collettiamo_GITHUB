import type { Metadata } from "next";
import Link from "next/link";
import { EsempioBiglietto } from "@/components/biglietto/EsempioBiglietto";
import { VideoBiglietto } from "@/components/biglietto/VideoBiglietto";
import { IconaTratto } from "@/components/ui";

export const metadata: Metadata = { title: "Esempio di biglietto", robots: { index: false, follow: false } };

export default async function PaginaEsempio({ searchParams }: { searchParams: Promise<{ apri?: string }> }) {
  if ((await searchParams).apri === "1") return <EsempioBiglietto />;

  return (
    <main className="pagina tutorial-biglietto" aria-labelledby="titolo-tutorial">
      <Link href="/biglietto" className="btn btn-quieto">
        <IconaTratto nome="sx" />
        Biglietto
      </Link>
      <h1 id="titolo-tutorial" className="t-pagina">Come si fa il biglietto</h1>
      <VideoBiglietto />
      <Link href="/biglietto/esempio?apri=1" className="btn btn-contorno">
        Apri il biglietto di esempio
      </Link>
    </main>
  );
}
