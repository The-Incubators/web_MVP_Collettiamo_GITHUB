import type { Metadata } from "next";
import Link from "next/link";
import { BottoneLink, Icona } from "@/components/ui";

/**
 * Biglietto di auguri (Gifty-architettura-e-flussi.md §3, §4.4): un servizio con la sua voce di menu.
 * Da solo o collegato a un regalo di gruppo (D-03, D-19).
 */
export const metadata: Metadata = {
  title: "Biglietto di auguri",
  description: "Un biglietto di auguri che firmano tutti, con dediche e foto, da mandare con un link.",
  robots: { index: true, follow: true },
};

export default function PaginaBiglietto() {
  return (
    <div className="gutter pb-10 pt-4 sm:pt-10">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent">Biglietto di auguri</h1>
          <p className="text-ink-soft">Lo firmano tutti, con dediche e foto. Lo mandi con un link.</p>
        </header>
        <BottoneLink href="/biglietto/nuovo" variante="azione" pieno>
          <Icona nome="draw" dimensione={20} />
          Crea un biglietto
        </BottoneLink>
        <Link href="/biglietto/esempio" className="inline-flex min-h-tocco items-center justify-center gap-1.5 text-sm font-bold text-accent underline underline-offset-4">
          <Icona nome="visibility" dimensione={18} />
          Guarda un esempio
        </Link>
      </div>
    </div>
  );
}
