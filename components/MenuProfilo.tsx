"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inizialiDi } from "@/lib/dominio/partecipanti";
import { VOCI_ACCOUNT } from "@/lib/navigazione";
import { useApp } from "./AppProvider";
import { IconaTratto } from "./ui/IconaTratto";

/**
 * Le voci del menu utente (design.md §10.2; prototipi/comuni.js `menuUtente`): nome ed email, I miei regali, I miei
 * biglietti, Il mio account, poi Esci. Senza accesso solo «Accedi». Accedi ed Esci stanno solo qui (righe 5–9). Le usano
 * la tendina dell'intestazione (desktop) e il foglio della barra in basso (telefono).
 */
export function VociMenuUtente({ onScelta }: { onScelta?: () => void }) {
  const { utente, pronto, auth } = useApp();
  const router = useRouter();
  const percorso = usePathname();
  // chi partecipa senza account ha un'identità anonima: per il menu è come non averla
  const conAccount = pronto && utente && !utente.anonimo ? utente : null;

  if (!conAccount) {
    const ritorno = percorso && percorso !== "/" ? `?next=${encodeURIComponent(percorso)}` : "";
    return (
      <div className="menu-utente">
        <Link className="btn btn-primario" href={`/accedi${ritorno}`} onClick={onScelta}>
          Accedi
        </Link>
      </div>
    );
  }
  return (
    <div className="menu-utente">
      <div className="chi">
        <b>{conAccount.nome || conAccount.email}</b>
        {conAccount.email && conAccount.nome ? <span>{conAccount.email}</span> : null}
      </div>
      {VOCI_ACCOUNT.map((v) => (
        <Link key={v.href} href={v.href} aria-current={percorso === v.href ? "page" : undefined} onClick={onScelta}>
          <IconaTratto nome={v.icona} />
          {v.testo}
        </Link>
      ))}
      <span className="sep" aria-hidden="true" />
      <button
        type="button"
        className="voce"
        onClick={async () => {
          onScelta?.();
          await auth.esci();
          router.push("/");
        }}
      >
        <IconaTratto nome="esci" />
        Esci
      </button>
    </div>
  );
}

/** Il tondo dell'account nell'intestazione (da 768 px): iniziali di chi ha accesso, altrimenti l'omino; apre la tendina. */
export function MenuProfilo() {
  const { utente, pronto } = useApp();
  const percorso = usePathname();
  const [aperto, setAperto] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);
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

  const sezioneAccount = VOCI_ACCOUNT.some((v) => v.href === percorso) || percorso.startsWith("/account");
  return (
    <div ref={box} className="relative">
      <button
        ref={bottone}
        type="button"
        aria-haspopup="true"
        aria-expanded={aperto}
        aria-controls="tendina-account"
        aria-label={conAccount ? `Il tuo account, ${conAccount.nome || conAccount.email}` : "Account"}
        aria-current={sezioneAccount ? "page" : undefined}
        onClick={() => setAperto((a) => !a)}
        className={`tondo-account${conAccount ? "" : " ospite"}`}
      >
        {conAccount ? <span aria-hidden="true">{inizialiDi(conAccount.nome || conAccount.email || "?").slice(0, 1)}</span> : <IconaTratto nome="account" />}
      </button>
      {aperto ? (
        <div className="tendina" id="tendina-account">
          <VociMenuUtente onScelta={() => setAperto(false)} />
        </div>
      ) : null}
    </div>
  );
}
