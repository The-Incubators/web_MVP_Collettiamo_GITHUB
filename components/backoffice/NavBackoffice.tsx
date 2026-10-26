"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/backoffice/catalogo", testo: "Ordine del catalogo" },
  { href: "/backoffice/importa", testo: "Importa prodotti" },
  { href: "/backoffice/revisione", testo: "Revisione" },
] as const;

/** Le pagine dell'area riservata, in alto. Non c'è un link dal sito pubblico verso qui. */
export function NavBackoffice() {
  const percorso = usePathname();
  return (
    <nav aria-label="Area riservata" className="-mx-4 mb-6 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {VOCI.map((v) => {
          const corrente = percorso === v.href;
          return (
            <li key={v.href}>
              <Link
                href={v.href}
                aria-current={corrente ? "page" : undefined}
                className={`inline-flex min-h-tocco items-center whitespace-nowrap rounded-full px-4 text-sm font-bold ${
                  corrente ? "bg-accent text-on-accent" : "bg-surface-2 text-ink hover:bg-line"
                }`}
              >
                {v.testo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
