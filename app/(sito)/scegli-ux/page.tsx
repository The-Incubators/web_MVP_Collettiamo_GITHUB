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
    <div className="gutter pb-10 pt-4">
      <div className="mx-auto flex max-w-dashboard flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Scegli UX</h1>
          <p className="text-ink-soft">Varianti di interfaccia in prova. I tuoi dati sono gli stessi in tutte.</p>
        </header>
        <SceltaUx attiva={attiva.id} />
      </div>
    </div>
  );
}
