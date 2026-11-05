import Link from "next/link";
import { Logo } from "@/components/ui";
import { VOCI_ACCOUNT } from "@/lib/navigazione";

/**
 * Il piè di pagina di Gifty UX v2 (design.md §6, T-01; prototipi/comuni.js): quattro colonne larghe uguali, una per
 * servizio più l'account (le stesse voci del menu utente), poi la riga con il marchio, «Privacy e dati» e «Termini e
 * condizioni». La dichiarazione di affiliazione Amazon sta nei Termini (revisione di Cri, 5 novembre 2026).
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
  { titolo: "Account", voci: VOCI_ACCOUNT },
];

export function PiePagina() {
  return (
    <footer className="piede no-stampa">
      <div className="pagina piede-in">
        {GRUPPI.map((g) => (
          <nav key={g.titolo} aria-label={g.titolo}>
            <h2>{g.titolo}</h2>
            {g.voci.map((v) => (
              <Link key={v.testo} href={v.href}>
                {v.testo}
              </Link>
            ))}
          </nav>
        ))}
        <div className="piede-marchio">
          <Link href="/" className="marchio" aria-label="Gifty, vai alla home">
            <Logo className="h-7" />
          </Link>
          <div className="piede-legali">
            <Link href="/privacy">Privacy e dati</Link>
            <Link href="/termini">Termini e condizioni</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
