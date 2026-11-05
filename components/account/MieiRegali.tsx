"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconaTratto, Iniziali } from "@/components/ui";
import { voceRegalo, type VoceRegalo } from "@/lib/dominio/account";

function Riga({ v }: { v: VoceRegalo }) {
  return (
    <Link className="riga" href={v.href}>
      <span className="data">
        <b>{v.giorno}</b>
        <span>{v.mese}</span>
      </span>
      <span className="t">{v.titolo}</span>
      <span className="sub">{v.supporto}</span>
      <span className="pillole">
        <span className="tag-gruppo">
          <IconaTratto nome="gruppo" />
          Di gruppo
        </span>
        <span className={`stato${v.stato.tono === "aperto" ? "" : ` ${v.stato.tono}`}`}>{v.stato.testo}</span>
      </span>
      <span className="vai" aria-hidden="true">
        <IconaTratto nome="dx" />
      </span>
    </Link>
  );
}

/**
 * I miei regali (design.md §10.2; prototipi/regali.html): tutti i regali di gruppo, organizzati o a cui si partecipa,
 * in corso e consegnati, con la pillola «Di gruppo» e uno stato con il testo.
 */
export function MieiRegali() {
  const { dati, utente } = useApp();
  const [voci, setVoci] = useState<VoceRegalo[] | null>(null);
  const [errore, setErrore] = useState(false);
  const uid = utente?.uid;

  useEffect(() => {
    if (!uid) return;
    let attivo = true;
    dati
      .mieiRegali(uid)
      .then((r) => attivo && setVoci(r.map((x) => voceRegalo(x.colletta, x.righe, uid))))
      .catch(() => attivo && setErrore(true));
    return () => {
      attivo = false;
    };
  }, [dati, uid]);

  const inCorso = voci?.filter((v) => !v.concluso) ?? [];
  const consegnati = voci?.filter((v) => v.concluso).reverse() ?? [];
  const vuoto = voci !== null && voci.length === 0;

  return (
    <div className="pagina acc-colonna acc-pagina">
      <div className="acc-su">
        <h1 className="t-pagina">I miei regali</h1>
        {vuoto ? null : (
          <Link className="btn btn-primario" href="/crea">
            Organizza un regalo di gruppo
          </Link>
        )}
      </div>
      {errore ? (
        <p className="errore-testo" role="alert">
          Non sono riuscito a caricare i regali. Riprova fra poco.
        </p>
      ) : voci === null ? (
        <p role="status" className="muted">
          Un momento…
        </p>
      ) : vuoto ? (
        <div className="acc-vuoto">
          <div className="carta" aria-hidden="true">
            <p className="mano">Il regalo di gruppo per…</p>
            <div className="fila-iniziali">
              <Iniziali />
              <Iniziali />
              <Iniziali />
            </div>
          </div>
          <h2 className="t-sezione">Ancora nessun regalo</h2>
          <Link className="btn btn-primario" href="/crea">
            Organizza un regalo di gruppo
          </Link>
        </div>
      ) : (
        <>
          {inCorso.length ? (
            <section className="acc-gruppo" aria-labelledby="t-corso">
              <h2 id="t-corso" className="t-titolo">
                In corso
              </h2>
              <div className="elenco-acc">
                {inCorso.map((v) => (
                  <Riga key={v.slug} v={v} />
                ))}
              </div>
            </section>
          ) : null}
          {consegnati.length ? (
            <section className="acc-gruppo" aria-labelledby="t-chiusi">
              <h2 id="t-chiusi" className="t-titolo">
                Consegnati
              </h2>
              <div className="elenco-acc">
                {consegnati.map((v) => (
                  <Riga key={v.slug} v={v} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
