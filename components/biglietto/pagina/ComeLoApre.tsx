"use client";

import Link from "next/link";
import { useState } from "react";
import { useGiro } from "../crea/TelefonoModo";

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

function Foglio({ voce, className = "", grande = false }: { voce: (typeof F)[number]; className?: string; grande?: boolean }) {
  const [c, f, t, n] = voce;
  return (
    <div className={`foglietto-firma ${c} ${grande ? "grande" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {f ? <img src={`${FOTO}${f}`} alt="" /> : null}
      {t}
      <span className="chi">{n}</span>
    </div>
  );
}

const MODI: Record<Modo, { nome: string; desc: string }> = {
  griglia: { nome: "Griglia", desc: "Tutti i messaggi insieme, come una parete di bigliettini." },
  storia: { nome: "Storia", desc: "Un messaggio alla volta: Marta va avanti con un tocco." },
  film: { nome: "Film", desc: "Parte da solo e finisce con i nomi di tutti." },
  scorrimento: { nome: "Scorrimento", desc: "I messaggi compaiono mentre Marta scorre." },
};

/** Il telefono in movimento, come quello dell'editor (TelefonoModo): ogni modo si vede come lo vede Marta (Cri, 6 nov). */
function Schermo({ modo }: { modo: Modo }) {
  const { n, fermo } = useGiro(modo);
  if (modo === "storia") {
    const i = n % F.length;
    return (
      <div className="storia-s">
        <span className="tacche-s">
          {F.map((_, k) => (
            <i key={k} className={k < i ? "ok" : k === i ? "ora" : ""} />
          ))}
        </span>
        <Foglio key={i} voce={F[i]} grande className="entra-s" />
        <span className="chi-s">
          {i + 1} di {F.length}
        </span>
      </div>
    );
  }
  if (modo === "film") {
    // il titolo, poi un messaggio alla volta, poi i nomi di tutti
    const scene = F.length + 2;
    const k = n % scene;
    return (
      <div className="film-s">
        <div key={k} className="entra-s grid justify-items-center gap-3">
          {k === 0 ? (
            <>
              <span className="mano">Marta</span>
              <p>Buon compleanno, Marta!</p>
            </>
          ) : k <= F.length ? (
            <Foglio voce={F[k - 1]} grande />
          ) : (
            <>
              <span className="mano">Marta</span>
              <p>
                Chiara, Paolo, Elena,
                <br />
                Marco, Luca e Sara
              </p>
            </>
          )}
        </div>
        <span className="barra-f">
          <i style={{ width: `${((k + 1) / scene) * 100}%` }} />
        </span>
      </div>
    );
  }
  if (modo === "scorrimento") {
    return (
      <>
        <p className="titolo-s">Buon compleanno, Marta!</p>
        <div className="scorre-s">
          <div className="nastro-s">
            {[...F, ...F].map((v, i) => (
              <Foglio key={i} voce={v} />
            ))}
          </div>
        </div>
      </>
    );
  }
  // griglia: i bigliettini arrivano uno dopo l'altro, poi restano tutti insieme
  const visibili = fermo ? F.length : Math.min(F.length, (n % (F.length + 3)) + 1);
  return (
    <>
      <p className="titolo-s">Buon compleanno, Marta!</p>
      <div className="fg">
        {F.map((v, i) => (
          <Foglio key={v[3]} voce={v} className={i < visibili ? "entra-s" : "nascosta-s"} />
        ))}
      </div>
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
        <Link className="btn btn-quieto" href="/biglietto/esempio">
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
