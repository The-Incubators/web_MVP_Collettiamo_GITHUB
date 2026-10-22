import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SceltaUx } from "@/components/SceltaUx";
import { COOKIE_UX, varianteUx } from "@/lib/ux";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scegli UX",
  description: "Scegli con quale variante di navigazione usare il sito.",
  robots: { index: false, follow: false },
};

/** La variante attiva si legge dal cookie qui sul server: così la pagina nasce già con quella giusta. */
export default async function PaginaSceltaUx() {
  const attiva = varianteUx((await cookies()).get(COOKIE_UX)?.value);

  return (
    <div className="gutter pb-16 pt-6">
      <div className="mx-auto flex max-w-dashboard flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl">Scegli UX</h1>
          <p className="text-ink-soft">
            Stiamo provando modi diversi di far navigare il sito. Qui scegli quale usare: la scelta resta su questo dispositivo e si può
            cambiare quando vuoi. I tuoi dati — collette, preferiti, lista dei regali — sono gli stessi in tutte le varianti.
          </p>
        </header>
        <SceltaUx attiva={attiva.id} />
      </div>
    </div>
  );
}
