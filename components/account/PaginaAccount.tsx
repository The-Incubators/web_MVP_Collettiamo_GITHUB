"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { usePreferiti } from "@/components/PreferitiProvider";
import { BottoneLink, Icona, type NomeIcona } from "@/components/ui";

/**
 * L'account (Gifty-spec-prodotto.md S-11, §6): raccoglie i regali di gruppo, i biglietti, le ricorrenze, i preferiti
 * e il profilo. Fase 1: è il punto d'ingresso, e porta alle pagine che esistono già (/le-mie-collette, /reminder,
 * /preferiti). L'elenco dei biglietti avviati arriva con la fase 4; il metodo di accesso e la newsletter con la fase 3.
 * Preferiti e ricorrenze funzionano anche senza account (stanno nel browser), quindi la pagina non obbliga ad accedere.
 */

type Voce = { href: string; titolo: string; testo: string; icona: NomeIcona; tinta: string; serveAccount?: boolean };

function Riga({ v, conteggio }: { v: Voce; conteggio?: number }) {
  return (
    <li>
      <Link href={v.href} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-carta transition-colors hover:bg-surface-2">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${v.tinta}`}>
          <Icona nome={v.icona} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold text-accent-2">
            {v.titolo}
            {conteggio ? <span className="cifre ml-1.5 text-ink-soft">({conteggio})</span> : null}
          </span>
          <span className="text-sm text-ink-soft">{v.testo}</span>
        </span>
        <Icona nome="chevron_right" className="text-ink-soft" />
      </Link>
    </li>
  );
}

const VOCI: Voce[] = [
  {
    href: "/le-mie-collette",
    titolo: "I miei regali di gruppo",
    testo: "Quelli che hai organizzato, anche le bozze",
    icona: "groups",
    tinta: "bg-ok-field text-accent",
    serveAccount: true,
  },
  {
    href: "/biglietto/nuovo",
    titolo: "Biglietti di auguri",
    testo: "Crea un biglietto da firmare insieme",
    icona: "draw",
    tinta: "bg-gold-field text-gold",
  },
  {
    href: "/reminder",
    titolo: "Ricorrenze",
    testo: "Compleanni e occasioni speciali dei tuoi amici",
    icona: "cake",
    tinta: "bg-cta-field text-cta-2",
  },
  {
    href: "/preferiti",
    titolo: "Preferiti",
    testo: "Le idee che hai salvato con il cuore",
    icona: "favorite",
    tinta: "bg-cta-field text-cta-2",
  },
];

export function PaginaAccount() {
  const { utente, pronto, auth } = useApp();
  const { preferiti } = usePreferiti();
  const router = useRouter();
  // chi partecipa a una colletta ha un'identità anonima: non è un account (come in MenuProfilo)
  const conAccount = pronto && utente && !utente.anonimo ? utente : null;
  const voci = VOCI.filter((v) => !v.serveAccount || conAccount);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent">Il tuo account</h1>
        {conAccount ? (
          <p className="text-ink-soft">
            {conAccount.nome ? <strong className="text-ink">{conAccount.nome}</strong> : null}
            {conAccount.nome && conAccount.email ? " · " : null}
            {conAccount.email}
          </p>
        ) : pronto ? (
          <p className="text-ink-soft">Accedi per ritrovare i regali di gruppo che organizzi, da qualsiasi dispositivo.</p>
        ) : null}
      </header>

      {pronto && !conAccount ? (
        <BottoneLink href="/accedi?next=%2Faccount" variante="azione" pieno>
          Accedi
        </BottoneLink>
      ) : null}

      <ul className="flex flex-col gap-3">
        {voci.map((v) => (
          <Riga key={v.href} v={v} conteggio={v.href === "/preferiti" ? preferiti.size : undefined} />
        ))}
      </ul>

      {conAccount ? (
        <button
          type="button"
          onClick={async () => {
            await auth.esci();
            router.push("/");
          }}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-2"
        >
          <Icona nome="logout" dimensione={20} />
          Esci
        </button>
      ) : null}
    </div>
  );
}
