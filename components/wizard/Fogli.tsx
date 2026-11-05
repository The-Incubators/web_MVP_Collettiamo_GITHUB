"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Chip, IconaTratto, ImmagineProdotto } from "@/components/ui";
import { NOTA_PREZZI } from "@/lib/dominio/amazon";
import { TEMI_CATALOGO } from "@/lib/dominio/catalogoIdee";
import { formattaEuro } from "@/lib/dominio/importi";
import { contiene } from "@/lib/dominio/regali";
import type { ProdottoColletta } from "@/lib/tipi";
import { divisa, MAX_REGALI } from "@/lib/wizard/stato";
import { daVoce, type VoceCatalogo } from "./tipi";

/**
 * Il velo con il foglio: dal basso sul telefono, al centro su desktop. Il focus va nel foglio e torna dove era; Esc e
 * un tocco sul velo chiudono; la pagina sotto non scorre.
 */
function Velo({ alto = false, onChiudi, etichetta, children }: { alto?: boolean; onChiudi: () => void; etichetta: string; children: ReactNode }) {
  const foglio = useRef<HTMLDivElement>(null);
  const chiudi = useRef(onChiudi);
  chiudi.current = onChiudi;
  useEffect(() => {
    const prima = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    foglio.current?.querySelector<HTMLElement>("h2")?.focus();
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") chiudi.current();
    };
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("keydown", tasto);
      document.body.style.overflow = overflow;
      prima?.focus?.();
    };
  }, []);
  return (
    <div className={`velo${alto ? " alto" : ""}`} onClick={(e) => e.target === e.currentTarget && onChiudi()}>
      <div ref={foglio} className={alto ? "foglio-grande" : "foglio"} role="dialog" aria-modal="true" aria-labelledby={etichetta}>
        {children}
      </div>
    </div>
  );
}

/** «Vuoi uscire?» (design.md §10.1, decisione 2): la bozza resta, o si cancella. */
export function FoglioEsci({ festeggiato, onResta, onEsci, onCancella }: { festeggiato: string; onResta: () => void; onEsci: () => void; onCancella: () => void }) {
  return (
    <Velo onChiudi={onResta} etichetta="t-esci">
      <div className="esci-foglio">
        <div className="foglio-testa">
          <h2 id="t-esci" className="t-sezione" tabIndex={-1}>
            Vuoi uscire?
          </h2>
          <button type="button" className="icona-btn" onClick={onResta} aria-label="Resta qui">
            <IconaTratto nome="chiudi" />
          </button>
        </div>
        <p>La bozza del regalo per {festeggiato.trim()} resta su questo dispositivo.</p>
        <div className="avanti">
          <button type="button" className="btn btn-primario" onClick={onEsci}>
            Esci
          </button>
          <button type="button" className="btn btn-quieto pericolo" onClick={onCancella}>
            <IconaTratto nome="cestino" />
            Cancella la bozza
          </button>
        </div>
      </div>
    </Velo>
  );
}

const PER_PAGINA = 24;

/**
 * Il catalogo dentro la procedura (design.md §10.1, decisione 5): temi a chip, tessere con la quota a testa e un solo
 * gesto. «scelta»: «Scegli questo regalo», che sceglie e va avanti. «voto»: «Aggiungi al regalo», che diventa
 * «Aggiunto» (si toglie con un altro tocco), e in basso «N regali da votare» con «Fatto». Niente cuore né scheda.
 */
export function FoglioCatalogo({
  modo,
  catalogo,
  persone,
  scelti,
  onScegli,
  onAlterna,
  onChiudi,
}: {
  modo: "scelta" | "voto";
  catalogo: VoceCatalogo[];
  /** fra quante persone si divide, per la quota a testa di ogni tessera */
  persone: number;
  /** i regali già nella lista da votare */
  scelti: ProdottoColletta[];
  onScegli: (p: ProdottoColletta) => void;
  onAlterna: (p: ProdottoColletta) => void;
  onChiudi: () => void;
}) {
  const [tema, setTema] = useState<string | null>(null);
  const [mostra, setMostra] = useState(PER_PAGINA);
  const corpo = useRef<HTMLDivElement>(null);
  const filtrati = useMemo(() => (tema ? catalogo.filter((v) => v.temi.includes(tema)) : catalogo), [catalogo, tema]);
  const visibili = filtrati.slice(0, mostra);
  const resto = filtrati.length - visibili.length;
  const voto = modo === "voto";
  const pieno = scelti.length >= MAX_REGALI;

  function scegliTema(t: string | null) {
    setTema(t);
    setMostra(PER_PAGINA);
    corpo.current?.scrollTo({ top: 0 });
  }

  return (
    <Velo alto onChiudi={onChiudi} etichetta="t-cat">
      <div className="fg-testa">
        <span className="maniglia" aria-hidden="true" />
        <div className="fg-riga">
          <h2 id="t-cat" className="t-sezione" tabIndex={-1}>
            {voto ? "Aggiungi i regali da votare" : "Scegli il regalo"}
          </h2>
          <button type="button" className="icona-btn" onClick={onChiudi} aria-label="Chiudi il catalogo">
            <IconaTratto nome="chiudi" />
          </button>
        </div>
        <div className="chips-scorre" role="radiogroup" aria-label="Temi">
          <Chip modo="radio" scelto={!tema} onClick={() => scegliTema(null)}>
            Tutti
          </Chip>
          {TEMI_CATALOGO.map((t) => (
            <Chip key={t.valore} modo="radio" scelto={tema === t.valore} onClick={() => scegliTema(t.valore)}>
              {t.etichetta}
            </Chip>
          ))}
        </div>
      </div>
      <div className="fg-corpo" ref={corpo}>
        <div className="griglia-prodotti">
          {visibili.map((v) => {
            const p = daVoce(v);
            const dentro = voto && contiene(scelti, p);
            return (
              <article key={v.slug} className="tessera">
                <span className="lastra">
                  {v.immagine.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.immagine.foto} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <ImmagineProdotto prodotto={v} alt="" />
                  )}
                </span>
                <span className="nome">{v.nome}</span>
                <div className="riga-prezzo">
                  <span className="prezzo">{formattaEuro(v.prezzoCent)}</span>
                  <span className="quota-testa">{formattaEuro(divisa(v.prezzoCent, persone))} a testa</span>
                </div>
                <div className="azioni">
                  {voto ? (
                    <button
                      type="button"
                      className={`btn ${dentro ? "btn-scelto" : "btn-contorno"}`}
                      aria-pressed={dentro}
                      disabled={!dentro && pieno}
                      onClick={() => onAlterna(p)}
                    >
                      <IconaTratto nome={dentro ? "spunta" : "piu"} />
                      {dentro ? "Aggiunto" : "Aggiungi al regalo"}
                      <span className="sr-only">: {v.nome}</span>
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primario" onClick={() => onScegli(p)}>
                      Scegli questo regalo<span className="sr-only">: {v.nome}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {resto > 0 ? (
          <div className="altre-idee">
            <button type="button" className="btn btn-quieto" onClick={() => setMostra((m) => m + PER_PAGINA)}>
              Mostra altre {Math.min(PER_PAGINA, resto)} idee
            </button>
          </div>
        ) : null}
        <p className="nota-prezzi">{NOTA_PREZZI}</p>
      </div>
      {voto ? (
        <div className="fg-piede">
          <span aria-live="polite">
            <b>{scelti.length}</b> {scelti.length === 1 ? "regalo" : "regali"} da votare
          </span>
          <button type="button" className="btn btn-primario" onClick={onChiudi}>
            Fatto
          </button>
        </div>
      ) : null}
    </Velo>
  );
}
