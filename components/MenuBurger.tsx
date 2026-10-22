"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { usePreferiti } from "./PreferitiProvider";

/** Menu a panino nella barra in alto: raccoglie tutti i collegamenti del sito. */
export function MenuBurger() {
  const { utente, pronto, auth } = useApp();
  const { preferiti } = usePreferiti();
  const router = useRouter();
  const percorso = usePathname();
  const [aperto, setAperto] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);

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

  const voci: { href: string; testo: string; extra?: React.ReactNode }[] = [
    { href: "/", testo: "Home" },
    { href: "/catalogo", testo: "Catalogo" },
    { href: "/regalo", testo: "Trova il regalo" },
    { href: "/crea", testo: "Organizza una colletta" },
    { href: "/biglietto/nuovo", testo: "Biglietto di auguri" },
    {
      href: "/preferiti",
      testo: "Preferiti",
      extra:
        preferiti.size > 0 ? (
          <span className="cifre ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-on-accent">
            <span className="sr-only">: </span>
            {preferiti.size}
          </span>
        ) : null,
    },
    ...(pronto && utente ? [{ href: "/le-mie-collette", testo: "Le mie collette" }] : []),
    ...(pronto && !utente ? [{ href: "/accedi", testo: "Accedi" }] : []),
    { href: "/scegli-ux", testo: "Scegli UX" },
    { href: "/privacy", testo: "Come trattiamo i dati" },
  ];
  const classe = "flex min-h-12 w-full items-center rounded-controllo px-4 text-base font-medium hover:bg-surface-2";

  return (
    <div ref={box} className="relative">
      <button
        ref={bottone}
        type="button"
        aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
        aria-expanded={aperto}
        aria-controls="menu-principale"
        onClick={() => setAperto((a) => !a)}
        className="relative flex h-11 w-11 items-center justify-center rounded-controllo hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          {aperto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        {!aperto && preferiti.size > 0 ? <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" /> : null}
      </button>
      {aperto ? (
        <nav id="menu-principale" aria-label="Principale" className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-32px)] rounded-contenitore border border-line bg-surface p-2 shadow-xl">
          <ul className="flex flex-col">
            {voci.map((v) => (
              <li key={v.href}>
                <Link href={v.href} aria-current={percorso === v.href ? "page" : undefined} className={`${classe} ${percorso === v.href ? "bg-accent-field text-accent-2" : ""}`}>
                  {v.testo}
                  {v.extra}
                </Link>
              </li>
            ))}
            {pronto && utente ? (
              <li className="mt-1 border-t border-line pt-1">
                <button
                  type="button"
                  className={classe}
                  onClick={async () => {
                    await auth.esci();
                    router.push("/");
                  }}
                >
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
