"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconaTratto, Velo, type NomeIconaTratto } from "@/components/ui";
import { LogoGoogle } from "@/components/wizard/PassoAccesso";
import { dataLunga, oraBreve } from "@/lib/dominio/date";
import type { VoceRiepilogo } from "@/lib/dominio/cancellazione";

type Fase = "riepilogo" | "riaccedi" | "link" | "incorso" | "errore" | "fatto";
const RITORNO = "/account/cancella?riaccesso=1";
const ERRORE_ACCESSO = "L'account non è stato cancellato: l'accesso non è riuscito.";

/** "il 5 novembre 2026", "l'8 novembre 2026" (audit G-15) */
function ilGiornoLungo(ms: number): string {
  const g = dataLunga(ms);
  return /^(8|11) /.test(g) ? `l'${g}` : `il ${g}`;
}

function Voci({ voci, classe }: { voci: VoceRiepilogo[]; classe?: string }) {
  return (
    <ul className={`canc-voci ${classe ?? ""}`.trim()}>
      {voci.map((v, i) => (
        <li key={i}>
          <IconaTratto nome={v.icona as NomeIconaTratto} />
          <span>
            <b>{v.testo}</b>
            {v.supporto ? <span className="s">{v.supporto}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Cancella l'account (design.md §10.3; prototipi/cancella-account.html, stati riepilogo, riaccedi, in corso, errore,
 * fatto). Prima che cosa sparisce e che cosa resta, con i nomi veri; poi un nuovo accesso, che Firebase chiede e vale
 * come verifica dell'identità; la cancellazione avviene subito sul server (/api/account/cancella). Conferma solo a
 * schermo: il servizio email (D-18) non c'è ancora.
 */
export function CancellaAccount() {
  const { auth, utente, pronto, modalita } = useApp();
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("riepilogo");
  const [riepilogo, setRiepilogo] = useState<{ cancelliamo: VoceRiepilogo[]; resta: VoceRiepilogo[] } | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [fatto, setFatto] = useState<{ quando: number; nome: string } | null>(null);
  const conAccount = pronto && utente && !utente.anonimo ? utente : null;
  const ripreso = useRef(false);

  const intestazioni = useCallback(
    async (forza = false): Promise<Record<string, string>> => {
      if (!utente) return {};
      if (modalita === "memoria") return { "x-uid-prova": utente.uid, "x-accesso-prova": utente.accesso ?? "google" };
      const t = await auth.token(forza);
      return t ? { authorization: `Bearer ${t}` } : {};
    },
    [auth, utente, modalita],
  );

  // senza account (e non appena cancellato) si accede e si torna qui
  useEffect(() => {
    if (pronto && !utente && fase !== "fatto") router.replace(`/accedi?next=${encodeURIComponent("/account/cancella")}`);
  }, [pronto, utente, fase, router]);

  useEffect(() => {
    if (!conAccount || riepilogo) return;
    let attivo = true;
    void (async () => {
      try {
        const r = await fetch("/api/account/cancella", { headers: await intestazioni(), cache: "no-store" });
        const d = (await r.json()) as { ok: boolean; riepilogo?: typeof riepilogo };
        if (attivo && d.ok && d.riepilogo) setRiepilogo(d.riepilogo);
      } catch {
        /* il riepilogo resta in caricamento: la pagina si può ricaricare */
      }
    })();
    return () => {
      attivo = false;
    };
  }, [conAccount, riepilogo, intestazioni]);

  const cancella = useCallback(async () => {
    setFase("incorso");
    setErrore(null);
    const nome = (utente?.nome ?? "").split(" ")[0] ?? "";
    try {
      const r = await fetch("/api/account/cancella", { method: "POST", headers: await intestazioni(true), cache: "no-store" });
      const d = (await r.json()) as { ok: boolean; cancellatoIl?: number; motivo?: string };
      if (!d.ok) {
        setErrore(d.motivo === "accesso" ? ERRORE_ACCESSO : "L'account non è stato cancellato.");
        setFase("errore");
        return;
      }
      setFatto({ quando: d.cancellatoIl ?? Date.now(), nome });
      setFase("fatto");
      await auth.esci().catch(() => {});
    } catch {
      setErrore("L'account non è stato cancellato.");
      setFase("errore");
    }
  }, [auth, intestazioni, utente]);

  // ritorno dal link via email per confermare (chi accede con l'email)
  useEffect(() => {
    if (!conAccount || ripreso.current || !window.location.search.includes("riaccesso=1")) return;
    ripreso.current = true;
    void (async () => {
      const ok = await auth.completaRiaccesso(window.location.href).catch(() => false);
      window.history.replaceState(null, "", "/account/cancella");
      if (ok) await cancella();
      else {
        setErrore(ERRORE_ACCESSO);
        setFase("errore");
      }
    })();
  }, [conAccount, auth, cancella]);

  async function riaccedi() {
    try {
      const esito = await auth.riaccedi(RITORNO);
      if (esito === "link") return setFase("link");
      await cancella();
    } catch {
      setErrore(ERRORE_ACCESSO);
      setFase("errore");
    }
  }

  if (fase === "fatto" && fatto) {
    return (
      <div className="pagina canc">
        <div className="canc-fatto">
          <div className="carta" aria-hidden="true">
            {fatto.nome ? <p className="mano">Ciao {fatto.nome}</p> : null}
            <p className="t-piccolo muted">
              {dataLunga(fatto.quando)}, {oraBreve(fatto.quando)}
            </p>
          </div>
          <h1 className="t-pagina" style={{ margin: 0 }}>
            Il tuo account è cancellato
          </h1>
          <p>
            Abbiamo cancellato i tuoi dati {ilGiornoLungo(fatto.quando)} alle {oraBreve(fatto.quando)}. Puoi tornare quando vuoi con un account nuovo.
          </p>
          <Link className="btn btn-primario" href="/">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  if (!conAccount) {
    return (
      <p role="status" className="pagina py-16 text-center muted">
        Un momento…
      </p>
    );
  }

  return (
    <div className="pagina canc">
      <Link className="btn btn-quieto" href="/account" style={{ marginLeft: -4 }}>
        <IconaTratto nome="sx" />
        Il mio account
      </Link>
      <h1 className="t-pagina">Cancella il tuo account</h1>
      {riepilogo ? (
        <>
          <section className="canc-blocco" aria-labelledby="t-via">
            <h2 id="t-via" className="t-titolo">
              Che cosa cancelliamo
            </h2>
            <Voci voci={riepilogo.cancelliamo} />
          </section>
          {riepilogo.resta.length ? (
            <section className="canc-blocco" aria-labelledby="t-resta">
              <h2 id="t-resta" className="t-titolo">
                Che cosa resta
              </h2>
              <Voci voci={riepilogo.resta} classe="canc-resta" />
            </section>
          ) : null}
        </>
      ) : (
        <p role="status" className="muted">
          Un momento…
        </p>
      )}
      <div className="canc-conferma">
        <p>Lo cancelliamo subito e non si può annullare.</p>
        {fase === "errore" && errore ? (
          <p className="errore-box" role="alert">
            <IconaTratto nome="chiudi" />
            {errore}
          </p>
        ) : null}
        <div className="canc-avanti">
          {fase === "incorso" ? (
            <button type="button" className="btn btn-pericolo" aria-busy="true" disabled>
              <span className="rotella" aria-hidden="true" />
              Cancellazione in corso
            </button>
          ) : (
            <button type="button" className="btn btn-pericolo" disabled={!riepilogo} onClick={() => setFase("riaccedi")}>
              {fase === "errore" ? "Riprova" : "Cancella l'account"}
            </button>
          )}
          <Link className="btn btn-quieto" href="/account">
            Annulla
          </Link>
        </div>
      </div>

      {fase === "riaccedi" || fase === "link" ? (
        <Velo onChiudi={() => setFase("riepilogo")} etichetta="t-ri">
          <div className="riaccedi">
            <div className="foglio-testa">
              <h2 id="t-ri" className="t-sezione" tabIndex={-1}>
                Accedi di nuovo per confermare
              </h2>
              <button type="button" className="icona-btn" onClick={() => setFase("riepilogo")} aria-label="Chiudi">
                <IconaTratto nome="chiudi" />
              </button>
            </div>
            <p>Lo chiediamo per essere sicuri che sia tu.</p>
            <div className="scelte">
              {fase === "link" ? (
                <span className="stato" role="status" style={{ justifySelf: "start" }}>
                  <IconaTratto nome="email" />
                  Link mandato
                </span>
              ) : conAccount.accesso === "email" ? (
                <button type="button" className="btn btn-contorno" onClick={() => void riaccedi()}>
                  Mandami il link per accedere
                </button>
              ) : (
                <button type="button" className="btn btn-google" onClick={() => void riaccedi()}>
                  <LogoGoogle />
                  Accedi con Google e cancella
                </button>
              )}
            </div>
          </div>
        </Velo>
      ) : null}
    </div>
  );
}
