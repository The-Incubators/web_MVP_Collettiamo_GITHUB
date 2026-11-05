import Link from "next/link";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { Icona, Logo } from "@/components/ui";

/**
 * Il piè di pagina: marchio, un gruppo di collegamenti per servizio (Gifty-architettura-e-flussi.md §2), poi la riga in
 * fondo con «Privacy e dati». Restano la garanzia «I soldi non passano mai da qui» e la dichiarazione di affiliazione
 * Amazon, obbligatoria.
 */
const GRUPPI: { titolo: string; voci: { href: string; testo: string }[] }[] = [
  {
    titolo: "Idee regalo",
    voci: [
      { href: "/regalo", testo: "Trova un regalo" },
      { href: "/catalogo", testo: "Catalogo" },
    ],
  },
  {
    titolo: "Regalo di gruppo",
    voci: [
      { href: "/crea", testo: "Organizza un regalo" },
      { href: "/regalo-di-gruppo#come-funziona", testo: "Come si fa" },
    ],
  },
  {
    titolo: "Biglietto",
    voci: [
      { href: "/biglietto/nuovo", testo: "Crea un biglietto" },
      { href: "/biglietto/esempio", testo: "Come si fa" },
    ],
  },
  {
    titolo: "Account",
    voci: [
      { href: "/account", testo: "Il tuo account" },
      { href: "/preferiti", testo: "Preferiti" },
      { href: "/reminder", testo: "Ricorrenze" },
    ],
  },
];

export function PiePagina() {
  return (
    <footer className="no-stampa gutter mt-8 border-t border-line bg-surface pb-6 pt-10">
      <div className="mx-auto flex max-w-catalogo flex-col gap-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="inline-flex min-h-tocco items-center" aria-label="Gifty, vai alla home">
              <Logo className="h-8" />
            </Link>
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
              <Icona nome="verified_user" dimensione={18} />I soldi non passano mai da qui.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-12">
            {GRUPPI.map((g) => (
              <nav key={g.titolo} aria-label={g.titolo} className="flex flex-col">
                <h2 className="mb-1 text-base font-extrabold text-accent">{g.titolo}</h2>
                {g.voci.map((v) => (
                  <Link key={v.href} href={v.href} className="inline-flex min-h-tocco items-center text-ink-soft hover:text-accent">
                    {v.testo}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span>© 2026 Gifty</span>
            <Link
              href="/privacy"
              className="inline-flex min-h-tocco items-center font-semibold text-accent underline-offset-4 hover:underline"
            >
              Privacy e dati
            </Link>
          </div>
          <p className="text-xs leading-tight">{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
        </div>
      </div>
    </footer>
  );
}
