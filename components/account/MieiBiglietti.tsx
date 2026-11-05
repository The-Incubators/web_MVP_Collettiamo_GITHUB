"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconaTratto } from "@/components/ui";
import { useApi } from "@/lib/biglietti/client";
import type { VoceBiglietto } from "@/lib/dominio/account";

function Riga({ v }: { v: VoceBiglietto }) {
  return (
    <Link className="riga" href={v.href}>
      <span className={`carta mini-b ${v.tema}`.trim()} aria-hidden="true">
        <span className="mano">{v.iniziale}</span>
      </span>
      <span className="t">{v.titolo}</span>
      <span className="sub">{v.supporto}</span>
      <span className="pillole">
        <span className={`stato${v.stato.tono === "aperto" ? "" : ` ${v.stato.tono}`}`}>{v.stato.testo}</span>
      </span>
      <span className="vai" aria-hidden="true">
        <IconaTratto nome="dx" />
      </span>
    </Link>
  );
}

/** I miei biglietti (design.md §10.2; prototipi/biglietti.html): creati da te e firmati da te. */
export function MieiBiglietti() {
  const api = useApi();
  const [dati, setDati] = useState<{ creati: VoceBiglietto[]; firmati: VoceBiglietto[] } | null>(null);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    let attivo = true;
    api<{ creati: VoceBiglietto[]; firmati: VoceBiglietto[] }>("/api/account/biglietti")
      .then((r) => attivo && setDati({ creati: r.creati, firmati: r.firmati }))
      .catch(() => attivo && setErrore(true));
    return () => {
      attivo = false;
    };
  }, [api]);

  const vuoto = dati !== null && dati.creati.length === 0 && dati.firmati.length === 0;
  return (
    <div className="pagina acc-colonna acc-pagina">
      <div className="acc-su">
        <h1 className="t-pagina">I miei biglietti</h1>
        {vuoto ? null : (
          <Link className="btn btn-primario" href="/biglietto/nuovo">
            Crea un biglietto
          </Link>
        )}
      </div>
      {errore ? (
        <p className="errore-testo" role="alert">
          Non siamo riusciti a caricare i biglietti. Riprova fra poco.
        </p>
      ) : dati === null ? (
        <p role="status" className="muted">
          Un momento…
        </p>
      ) : vuoto ? (
        <div className="acc-vuoto">
          <h2 className="t-sezione">Ancora nessun biglietto</h2>
          <Link className="btn btn-primario" href="/biglietto/nuovo">
            Crea un biglietto
          </Link>
        </div>
      ) : (
        <>
          {dati.creati.length ? (
            <section className="acc-gruppo" aria-labelledby="t-creati">
              <h2 id="t-creati" className="t-titolo">
                Creati da te
              </h2>
              <div className="elenco-acc">
                {dati.creati.map((v) => (
                  <Riga key={v.id} v={v} />
                ))}
              </div>
            </section>
          ) : null}
          {dati.firmati.length ? (
            <section className="acc-gruppo" aria-labelledby="t-firmati">
              <h2 id="t-firmati" className="t-titolo">
                Firmati da te
              </h2>
              <div className="elenco-acc">
                {dati.firmati.map((v) => (
                  <Riga key={v.id} v={v} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
