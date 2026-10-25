"use client";

import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { SoloOrganizzatore } from "./SoloOrganizzatore";
import { Avviso, Barra, Bottone, BottoneLink, Etichetta, Icona, ImmagineProdotto } from "./ui";
import { dataBreve } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { avanzamento } from "@/lib/dominio/partecipanti";
import type { Colletta } from "@/lib/tipi";

function Scheda({ c, onElimina }: { c: Colletta; onElimina: (slug: string) => Promise<void> }) {
  const [chiedo, setChiedo] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const a = avanzamento(c);
  const bozza = c.stato === "bozza";
  const titolo = c.festeggiato ? `Il regalo per ${c.festeggiato}` : "Bozza senza titolo";
  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
          <ImmagineProdotto prodotto={c.prodotto} className="aspect-square h-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-lg font-semibold text-accent-2">{titolo}</h2>
          <p className="truncate text-xs text-ink-soft">{c.prodotto.nome}</p>
        </div>
        <Etichetta stato={c.stato === "aperta" ? "daConfermare" : c.stato === "chiusa" ? "confermato" : "invitato"}>
          {c.stato === "aperta" ? (c.votazione && !c.votazione.chiusa ? "In votazione" : "Aperta") : c.stato === "chiusa" ? "Chiusa" : "Bozza"}
        </Etichetta>
      </div>
      {!bozza && !(c.votazione && !c.votazione.chiusa) ? (
        <>
          <Barra percento={a.percento} etichetta={`Avanzamento della raccolta per ${c.festeggiato}`} />
          <p className="text-sm">
            <span className="cifre font-bold">{formattaEuro(a.confermatoCent)}</span> su {formattaEuro(a.obiettivoCent)} · {c.nConfermati} {c.nConfermati === 1 ? "confermato" : "confermati"}
            {c.stato === "aperta" ? ` · scade il ${dataBreve(c.scadenza)}` : ""}
          </p>
        </>
      ) : bozza ? (
        <p className="text-sm text-ink-soft">Non l’hai ancora aperta: il link non funziona.</p>
      ) : (
        <p className="text-sm">Si vota fino al {dataBreve(c.votazione?.scade ?? c.scadenza)}.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {bozza ? (
          <>
            <BottoneLink variante="verde" href={`/crea?bozza=${c.slug}`} dimensione="piccolo">
              Riprendi
            </BottoneLink>
            {chiedo ? (
              <>
                <Bottone
                  variante="secondario"
                  dimensione="piccolo"
                  onClick={() => onElimina(c.slug).catch(() => setErrore("Non sono riuscito a eliminarla."))}
                >
                  Sì, elimina
                </Bottone>
                <Bottone variante="testuale" dimensione="piccolo" onClick={() => setChiedo(false)}>
                  Annulla
                </Bottone>
              </>
            ) : (
              <Bottone variante="secondario" dimensione="piccolo" onClick={() => setChiedo(true)}>
                Elimina
              </Bottone>
            )}
          </>
        ) : (
          <>
            <BottoneLink variante="verde" href={`/gestisci/${c.slug}`} dimensione="piccolo">
              Gestisci
            </BottoneLink>
            <BottoneLink href={`/c/${c.slug}`} variante="secondario" dimensione="piccolo">
              Pagina pubblica
            </BottoneLink>
          </>
        )}
      </div>
      {errore ? (
        <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
          {errore}
        </p>
      ) : null}
    </li>
  );
}

function Contenuto() {
  const { dati, utente } = useApp();
  const [collette, setCollette] = useState<Colletta[] | null>(null);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    if (!utente) return;
    let attivo = true;
    dati
      .elencaCollette(utente.uid)
      .then((c) => attivo && setCollette(c))
      .catch(() => attivo && setErrore(true));
    return () => {
      attivo = false;
    };
  }, [dati, utente]);

  async function elimina(slug: string) {
    await dati.eliminaBozza(slug);
    setCollette((prev) => prev?.filter((c) => c.slug !== slug) ?? prev);
  }

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Le mie collette</h1>
        <BottoneLink href="/catalogo" dimensione="piccolo">
          <Icona nome="add" dimensione={18} />
          Nuova
        </BottoneLink>
      </div>
      {errore ? <Avviso tono="attenzione">Non riesco a caricare le tue collette. Riprova fra poco.</Avviso> : null}
      {collette === null && !errore ? <p className="text-ink-soft">Carico le tue collette…</p> : null}
      {collette?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-carta">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ok-field text-accent">
            <Icona nome="featured_seasonal_and_gifts" dimensione={32} />
          </span>
          <p className="font-display text-xl font-semibold text-accent-2">Ancora nessuna colletta</p>
          <p className="text-sm text-ink-soft">Scegli un regalo e manda il link al gruppo.</p>
          <BottoneLink href="/catalogo" pieno className="mt-2">
            Organizza un regalo
          </BottoneLink>
        </div>
      ) : null}
      {collette && collette.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {collette.map((c) => (
            <Scheda key={c.slug} c={c} onElimina={elimina} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ElencoCollette() {
  return (
    <SoloOrganizzatore>
      <Contenuto />
    </SoloOrganizzatore>
  );
}
