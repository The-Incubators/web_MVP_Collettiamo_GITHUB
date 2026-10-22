"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icona, type NomeIconaV3 } from "@/components/v3/Icona";

/** «Biglietto» porta alla pagina di UX_V1, che funziona: UX_V3 non ne ha ancora una sua. «Aiuto» scorre
 *  alla sezione «Come funziona» della home di UX_V3. Nessuna voce punta a una pagina inesistente. */
const VOCI: { href: string; testo: string; icona: NomeIconaV3 }[] = [
  { href: "/v3", testo: "Home", icona: "home" },
  { href: "/v3/catalogo", testo: "Idee", icona: "card_giftcard" },
  { href: "/biglietto/nuovo", testo: "Biglietto", icona: "draw" },
  { href: "/v3#come-funziona", testo: "Aiuto", icona: "help_outline" },
];

/** La barra in basso di UX_V3: quattro voci più il pulsante tondo «Crea», sporgente al centro. */
export function BarraSotto() {
  const percorso = usePathname();
  const attivaSu = (href: string) => {
    const pulito = href.split("#")[0];
    return pulito === "/v3" ? percorso === "/v3" : percorso.startsWith(pulito);
  };
  const voce = (v: (typeof VOCI)[number]) => {
    const attiva = attivaSu(v.href) && !v.href.includes("#");
    return (
      <Link
        key={v.href}
        href={v.href}
        aria-current={attiva ? "page" : undefined}
        className={`flex min-h-[44px] min-w-[56px] flex-col items-center justify-center py-1 transition-colors ${
          attiva ? "text-secondary-container" : "text-on-surface-variant hover:text-primary-container"
        }`}
      >
        <Icona nome={v.icona} dimensione={23} piena={attiva} />
        <span className={`mt-0.5 text-[11px] ${attiva ? "font-bold" : "font-medium"}`}>{v.testo}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Principale"
      className="fixed bottom-0 z-50 w-full border-t border-surface-container-high bg-surface/95 pb-safe shadow-[0_-4px_20px_rgba(0,37,28,0.06)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {VOCI.slice(0, 2).map(voce)}
        <Link href="/v3/crea" className="-mt-5 flex min-h-[50px] min-w-[50px] flex-col items-center justify-center" aria-label="Crea una colletta">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface bg-secondary-container text-white shadow-lg transition-all active:scale-95">
            <Icona nome="add" dimensione={24} />
          </span>
          <span className="mt-0.5 text-[10px] font-bold text-primary-container">Crea</span>
        </Link>
        {VOCI.slice(2).map(voce)}
      </div>
    </nav>
  );
}
