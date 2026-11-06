"use client";

import Link from "next/link";
import { useState } from "react";

const FOTO = "/biglietto-esempio/";

type Modo = "griglia" | "storia" | "film" | "scorrimento";

/** I messaggi d'esempio del telefono (prototipi/biglietto.html): tinta, foto, testo, nome. */
const F: [string, string, string, string][] = [
  ["c3", "chiara.jpg", "Ti pensiamo tutti, oggi più che mai.", "Chiara"],
  ["c8", "", "Un abbraccio grande da tutto l'ufficio!", "Paolo"],
  ["c4", "", "Sei una persona speciale. Grazie di esserci.", "Elena"],
  ["c2", "marco.jpg", "La torta la porto io.", "Marco"],
  ["c1", "", "Cento di questi giorni, e di queste pause caffè.", "Luca"],
  ["c7", "sara.jpg", "Stasera si festeggia!", "Sara"],
];

function Foglietti({ voci }: { voci: typeof F }) {
  return (
    <>
      {voci.map(([c, f, t, n]) => (
        <div key={n} className={`foglietto-firma ${c}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {f ? <img src={`${FOTO}${f}`} alt="" /> : null}
          {t}
          <span className="chi">{n}</span>
        </div>
      ))}
    </>
  );
}

const MODI: Record<Modo, { nome: string; desc: string }> = {
  griglia: { nome: "Griglia", desc: "Tutti i messaggi insieme, come una parete di bigliettini." },
  storia: { nome: "Storia", desc: "Un messaggio alla volta: Marta va avanti con un tocco." },
  film: { nome: "Film", desc: "Parte da solo e finisce con i nomi di tutti." },
  scorrimento: { nome: "Scorrimento", desc: "I messaggi compaiono mentre Marta scorre." },
};

function Schermo({ modo }: { modo: Modo }) {
  if (modo === "storia") {
    return (
      <div className="storia-s">
        <span className="tacche-s">
          {F.map((_, i) => (
            <i key={i} className={i < 2 ? "ok" : ""} />
          ))}
        </span>
        <div className="foglietto-firma c2 grande">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${FOTO}marco.jpg`} alt="" />
          La torta la porto io. E anche le candeline, stavolta.<span className="chi">Marco</span>
        </div>
        <span className="chi-s">2 di 6</span>
      </div>
    );
  }
  if (modo === "film") {
    return (
      <div className="film-s">
        <span className="mano">Marta</span>
        <p>
          Chiara, Paolo, Elena,
          <br />
          Marco, Luca e Sara
        </p>
        <span className="barra-f">
          <i />
        </span>
      </div>
    );
  }
  return (
    <>
      <p className="titolo-s">Buon compleanno, Marta!</p>
      {modo === "griglia" ? (
        <div className="fg">
          <Foglietti voci={F} />
        </div>
      ) : (
        <div className="scorre-s">
          <Foglietti voci={F.slice(0, 4)} />
        </div>
      )}
    </>
  );
}

/** «Come lo apre Marta» (design.md §10.4): i segmenti dei quattro modi e il telefono che mostra quello scelto. */
export function ComeLoApre() {
  const [modo, setModo] = useState<Modo>("griglia");
  return (
    <div className="pagina apre-in">
      <div className="apre-testo">
        <h2 id="t-apre" className="t-sezione">
          Come lo apre Marta
        </h2>
        <div className="segmenti" role="radiogroup" aria-label="Come si apre il biglietto">
          {(Object.keys(MODI) as Modo[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === modo} onClick={() => setModo(k)}>
              {MODI[k].nome}
            </button>
          ))}
        </div>
        <p className="desc" aria-live="polite">
          {MODI[modo].desc}
        </p>
        <Link className="btn btn-quieto" href="/biglietto/esempio?apri=1">
          Apri il biglietto di esempio
        </Link>
      </div>
      <div className="vetrina">
        <div className="telefono">
          <div className="schermo" aria-hidden="true">
            <Schermo modo={modo} />
          </div>
        </div>
      </div>
    </div>
  );
}
