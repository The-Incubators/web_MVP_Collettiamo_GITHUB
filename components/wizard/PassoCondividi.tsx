"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconaTratto, SpuntaRiga } from "@/components/ui";
import { dataBreve } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { linkColletta, linkWhatsApp, messaggioChat } from "@/lib/dominio/messaggi";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { regaloDaScegliere } from "@/lib/dominio/regali";
import { etichettaOccasione } from "@/lib/regalo/dati";
import type { Colletta, Metodi, Proposta } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { Anteprima } from "./Anteprima";
import { BarraProcedura } from "./BarraProcedura";

/** Il numero di persone della chat scritto al passo 2 (la colletta tiene quelle della divisione). */
export const CHIAVE_CHAT_CREATO = "gifty.wizard.creato";

function chatScritta(slug: string): number | null {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(CHIAVE_CHAT_CREATO) ?? "null") as { slug?: string; chat?: number } | null;
    return v && v.slug === slug && typeof v.chat === "number" ? v.chat : null;
  } catch {
    return null;
  }
}

function testoMetodi(m: Metodi): string {
  return [m.paypal.attivo ? "PayPal" : null, m.satispay.attivo ? "Satispay" : null, m.bonifico.attivo ? "bonifico" : null, m.contanti.attivo ? "contanti" : null]
    .filter(Boolean)
    .join(", ");
}

/**
 * «Condividi», dopo la creazione (prototipi/crea.html, passo 7): il gruppo è già creato e aperto (G-09). Il messaggio per la chat cambia subito con
 * «È una sorpresa» (G-08), che si salva sulla colletta; «Condividi su WhatsApp», «Copia il link», «Vai al regalo di gruppo».
 */
export function PassoCondividi({ slug }: { slug: string }) {
  const { dati, utente, pronto } = useApp();
  const router = useRouter();
  const [c, setC] = useState<Colletta | null>(null);
  const [candidati, setCandidati] = useState<Proposta[]>([]);
  const [copiato, setCopiato] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!pronto) return;
    if (!utente) {
      router.replace(`/accedi?next=${encodeURIComponent(`/crea?creato=${slug}`)}`);
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const x = await dati.colletta(slug);
        if (!vivo) return;
        if (!x || x.organizzatoreUid !== utente.uid) return router.replace("/crea");
        setC(x);
        if (x.votazione) setCandidati((await dati.proposte(slug)).filter((p) => p.daOrganizzatore).sort((a, b) => a.creatoIl - b.creatoIl));
      } catch {
        if (vivo) setProblema("Le modifiche non sono state salvate");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [pronto, utente, dati, slug, router]);

  useEffect(() => {
    if (c) titolo.current?.focus();
    // solo al primo caricamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!c]);

  if (!c) {
    return (
      <>
        <BarraProcedura creato hrefChiudi={`/gestisci/${slug}`} />
        <main className="pagina wizard">
          <p role="status" className="muted attesa">
            {problema ?? "Un momento…"}
          </p>
        </main>
      </>
    );
  }

  const colletta = c;
  const url = linkColletta(baseUrlClient(), slug);
  const quota = colletta.votazione ? null : quotaEffettiva(colletta);
  const messaggio = messaggioChat({ festeggiato: colletta.festeggiato, quotaCent: quota, scadenza: colletta.scadenza, url, sorpresa: colletta.sorpresa });
  const testoSenzaLink = messaggio.slice(0, messaggio.length - url.length);

  async function cambiaSorpresa(sorpresa: boolean) {
    setC({ ...colletta, sorpresa });
    setProblema(null);
    try {
      await dati.aggiornaColletta(slug, { sorpresa });
    } catch {
      setC({ ...colletta, sorpresa: !sorpresa });
      setProblema("Le modifiche non sono state salvate");
    }
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiato(true);
      window.setTimeout(() => setCopiato(false), 2500);
    } catch {
      /* senza appunti il link resta scritto nel messaggio */
    }
  }

  const chat = chatScritta(slug) ?? colletta.previsti;
  const regali = colletta.votazione ? candidati.map((p) => p.prodotto) : regaloDaScegliere(colletta.prodotto) ? [] : [colletta.prodotto];

  return (
    <>
    <BarraProcedura creato hrefChiudi={`/gestisci/${slug}`} />
    <main className="pagina wizard">
      <div className="modulo pronto">
        <span className="stato">
          <IconaTratto nome="spunta" />
          Regalo di gruppo creato
        </span>
        <h1 ref={titolo} tabIndex={-1} className="t-pagina">
          Manda il link nella chat
        </h1>
        <SpuntaRiga checked={colletta.sorpresa} onChange={(e) => void cambiaSorpresa(e.target.checked)}>
          È una sorpresa: il messaggio non fa il nome di {colletta.festeggiato}
        </SpuntaRiga>
        <div className="chat">
          <p className="fumetto-wa" aria-live="polite">
            {testoSenzaLink}
            <b>{url.replace(/^https?:\/\//, "")}</b>
          </p>
        </div>
        <div className="azioni">
          <a className="btn btn-primario" href={linkWhatsApp(messaggio)} target="_blank" rel="noopener noreferrer">
            <IconaTratto nome="whatsapp" />
            Condividi su WhatsApp<span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
          <button type="button" className="btn btn-quieto" onClick={() => void copia()} aria-live="polite">
            <IconaTratto nome="copia" />
            {copiato ? "Link copiato" : "Copia il link"}
          </button>
          <Link className="btn btn-quieto" href={`/gestisci/${slug}`}>
            Vai al regalo di gruppo
          </Link>
        </div>
        {problema ? (
          <p className="errore-testo" role="alert">
            {problema}
          </p>
        ) : null}
      </div>
      <Anteprima
        r={{
          festeggiato: colletta.festeggiato,
          quando: `${etichettaOccasione(colletta.occasione)}, ${dataBreve(colletta.dataRegalo)}`,
          persone: { testo: `${chat} persone nella chat` },
          cosa: regali.length ? regali : { testo: quota ? `${formattaEuro(quota)} a testa` : "Quota a testa", vuota: !quota },
          rimborsi: { testo: `Rimborsi con ${testoMetodi(colletta.metodi)}` },
          organizzatore: colletta.organizzatoreNome || null,
        }}
      />
    </main>
    </>
  );
}
