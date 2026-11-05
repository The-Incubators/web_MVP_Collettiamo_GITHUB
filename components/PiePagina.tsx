import Link from "next/link";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { Logo } from "@/components/ui";

/**
 * Il piè di pagina di Gifty UX v2 (design.md §6, T-01; prototipi/comuni.js): un gruppo per servizio, poi la riga con il
 * marchio e «Privacy e dati». Sotto, la dichiarazione di affiliazione Amazon, che è obbligatoria.
 */
const GRUPPI: { titolo: string; voci: { href: string; testo: string }[] }[] = [
  {
    titolo: "Idee regalo",
    voci: [
      { href: "/regalo", testo: "Trova il regalo" },
      { href: "/catalogo", testo: "Catalogo" },
    ],
  },
  {
    titolo: "Regalo di gruppo",
    voci: [
      { href: "/crea", testo: "Organizza un regalo di gruppo" },
      { href: "/regalo-di-gruppo#come-funziona", testo: "Come funziona" },
    ],
  },
  {
    titolo: "Biglietto",
    voci: [
      { href: "/biglietto/nuovo", testo: "Crea un biglietto" },
      { href: "/biglietto/esempio", testo: "Biglietto di esempio" },
    ],
  },
  {
    titolo: "Account",
    voci: [
      { href: "/le-mie-collette", testo: "I miei regali di gruppo" },
      { href: "/reminder", testo: "Ricorrenze" },
      { href: "/preferiti", testo: "Preferiti" },
    ],
  },
];

export function PiePagina() {
  return (
    <footer className="piede no-stampa">
      <div className="pagina piede-in">
        {GRUPPI.map((g) => (
          <nav key={g.titolo} aria-label={g.titolo}>
            <h2>{g.titolo}</h2>
            {g.voci.map((v) => (
              <Link key={v.href} href={v.href}>
                {v.testo}
              </Link>
            ))}
          </nav>
        ))}
        <div className="piede-marchio">
          <Link href="/" className="marchio" aria-label="Gifty, vai alla home">
            <Logo className="h-7" />
          </Link>
          <Link href="/privacy">Privacy e dati</Link>
        </div>
        <p className="piede-affiliato">{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
      </div>
    </footer>
  );
}
