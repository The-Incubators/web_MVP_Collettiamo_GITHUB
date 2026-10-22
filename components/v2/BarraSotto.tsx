"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icona, type NomeIconaV2 } from "@/components/v2/Icona";

/**
 * Finché il catalogo e il biglietto non hanno un layout di UX_V2, quelle due voci portano alle pagine
 * di UX_V1, che funzionano: meglio un cambio d'aspetto a metà strada che un 404 nella barra principale.
 * «Come funziona» punta alla sezione che sta già nella home di UX_V2.
 */
const VOCI: { href: string; testo: string; icona: NomeIconaV2 }[] = [
  { href: "/v2", testo: "Home", icona: "home" },
  { href: "/catalogo", testo: "Catalogo", icona: "card_giftcard" },
  { href: "/biglietto/nuovo", testo: "Biglietto", icona: "draw" },
  { href: "/v2#come-funziona", testo: "Come funziona", icona: "help" },
];

/** La barra di navigazione in basso, fissa, come nei layout di UX_V2. */
export function BarraSotto() {
  const percorso = usePathname();
  return (
    <nav
      aria-label="Principale"
      className="fixed bottom-0 z-50 w-full bg-surface/90 pb-safe shadow-[0_-6px_24px_-4px_rgba(10,60,48,0.08)] backdrop-blur-xl"
    >
      <div className="flex h-16 items-center justify-around px-space-xs">
        {VOCI.map((v) => {
          const attiva = v.href.startsWith("/v2") ? percorso === "/v2" && v.href === "/v2" : percorso.startsWith(v.href);
          return (
            <Link
              key={v.href}
              href={v.href}
              aria-current={attiva ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center px-2 py-1 transition-colors ${
                attiva ? "text-secondary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icona nome={v.icona} piena={attiva} />
              <span className="mt-0.5 font-label-sm text-label-sm">{v.testo}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
