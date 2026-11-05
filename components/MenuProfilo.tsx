"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inizialiDi } from "@/lib/dominio/partecipanti";
import { VOCI_ACCOUNT } from "@/lib/navigazione";
import { useApp } from "./AppProvider";
import { Icona } from "./ui/Icona";

/**
 * Il tondo dell'account: iniziali di chi ha accesso, altrimenti l'omino. Apre I miei regali, I miei biglietti, Il mio
 * account, poi Accedi o Esci (revisione di Cri, 5 novembre 2026): «Esci» sta solo qui. Da tablet in su è
 * nell'intestazione; sul telefono, dove l'intestazione non lo mostra, lo stesso menu è nella pagina dell'account.
 */
export function MenuProfilo() {
  const { utente, pronto, auth } = useApp();
  const router = useRouter();
  const percorso = usePathname();
  const [aperto, setAperto] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);
  // chi partecipa a una colletta ha un'identità anonima: non è un account, e per il menu è come non averlo
  const conAccount = pronto && utente && !utente.anonimo ? utente : null;

  useEffect(() => setAperto(false), [percorso]);
  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setAperto(false);
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAperto(false);
        bottone.current?.focus();
      }
    };
    document.addEventListener("pointerdown", fuori);
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("pointerdown", fuori);
      document.removeEventListener("keydown", tasto);
    };
  }, [aperto]);

  const voci = [...VOCI_ACCOUNT, ...(pronto && !conAccount ? [{ href: "/accedi", testo: "Accedi" }] : [])];
  // finché «I miei biglietti» porta all'account, su /account è accesa solo «Il mio account»
  const corrente = [...voci].reverse().find((v) => v.href === percorso)?.testo;
  const classe = "flex min-h-12 w-full items-center gap-3 rounded-controllo px-4 text-base font-semibold hover:bg-surface-2";

  return (
    <div ref={box} className="relative">
      <button
        ref={bottone}
        type="button"
        aria-label={aperto ? "Chiudi il menu" : conAccount ? `Menu di ${conAccount.nome}` : "Apri il menu"}
        aria-expanded={aperto}
        aria-controls="menu-profilo"
        onClick={() => setAperto((a) => !a)}
        className="tondo-account transition-transform active:scale-95"
      >
        {aperto ? (
          <Icona nome="close" dimensione={22} />
        ) : conAccount ? (
          <span aria-hidden="true">
            {inizialiDi(conAccount.nome || conAccount.email || "?")}
          </span>
        ) : (
          <Icona nome="person" dimensione={22} />
        )}
      </button>
      {aperto ? (
        <nav
          id="menu-profilo"
          aria-label="Altre pagine"
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-32px)] rounded-contenitore border border-line bg-surface p-2 shadow-sollevata"
        >
          {conAccount ? (
            <p className="truncate px-4 pb-2 pt-3 text-sm text-ink-soft">
              Ciao, <strong className="text-ink">{conAccount.nome || conAccount.email}</strong>
            </p>
          ) : null}
          <ul className="flex flex-col">
            {voci.map((v) => (
              <li key={v.testo}>
                <Link
                  href={v.href}
                  aria-current={v.testo === corrente ? "page" : undefined}
                  className={`${classe} ${v.testo === corrente ? "bg-accent-field text-accent" : ""}`}
                >
                  {v.testo}
                </Link>
              </li>
            ))}
            {conAccount ? (
              <li className="mt-1 border-t border-line pt-1">
                <button
                  type="button"
                  className={classe}
                  onClick={async () => {
                    await auth.esci();
                    router.push("/");
                  }}
                >
                  <Icona nome="logout" dimensione={20} className="text-ink-soft" />
                  Esci
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
