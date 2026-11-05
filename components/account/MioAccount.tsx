"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { usePreferiti } from "@/components/PreferitiProvider";
import { FormReminder } from "@/components/reminder/FormReminder";
import { useReminder } from "@/components/reminder/useReminder";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { IconaTratto } from "@/components/ui";
import { oggiLocale, prossimaData, TIPI_RICORRENZA, type Reminder } from "@/lib/dominio/reminder";
import type { Prodotto } from "@/lib/tipi";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const SEZIONI = [
  { id: "dati", testo: "Dati personali" },
  { id: "ricorrenze", testo: "Ricorrenze" },
  { id: "preferiti", testo: "Preferiti" },
  { id: "cancella", testo: "Cancella l'account" },
] as const;

/**
 * Il mio account (design.md §10.2; prototipi/mio-account.html): Dati personali, Ricorrenze, Preferiti, Cancella
 * l'account; su desktop l'indice laterale. Niente «Esci»: sta nel menu utente (riga 9).
 */
export function MioAccount({ prodotti }: { prodotti: Prodotto[] }) {
  const [corrente, setCorrente] = useState<string>("dati");

  // l'indice segue la sezione che si sta leggendo
  useEffect(() => {
    const os = new IntersectionObserver(
      (voci) => {
        const vista = voci.filter((v) => v.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vista) setCorrente(vista.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const s of SEZIONI) {
      const el = document.getElementById(s.id);
      if (el) os.observe(el);
    }
    return () => os.disconnect();
  }, []);

  return (
    <div className="pagina acc-pagina">
      <div className="acc-su">
        <h1 className="t-pagina">Il mio account</h1>
      </div>
      <div className="acc-disposizione">
        <nav className="acc-indice" aria-label="Sezioni dell'account">
          {SEZIONI.map((s) => (
            <a key={s.id} href={`#${s.id}`} aria-current={corrente === s.id ? "true" : undefined}>
              {s.testo}
            </a>
          ))}
        </nav>
        <div>
          <DatiPersonali />
          <Ricorrenze />
          <Preferiti prodotti={prodotti} />
          <section className="acc-sez acc-via" id="cancella" aria-labelledby="t-via">
            <h2 id="t-via" className="t-sezione">
              Cancella l&apos;account
            </h2>
            <p>Cancelliamo i tuoi dati, i regali che organizzi e i biglietti che hai creato. Prima ti mostriamo che cosa sparisce.</p>
            <Link className="btn btn-quieto pericolo" href="/account/cancella">
              <IconaTratto nome="cestino" />
              Cancella l&apos;account
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function DatiPersonali() {
  const { dati, auth, utente } = useApp();
  const [nome, setNome] = useState(utente?.nome ?? "");
  const [newsletter, setNewsletter] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const uid = utente?.uid;

  useEffect(() => {
    if (!uid) return;
    dati
      .profilo(uid)
      .then((p) => {
        if (p) setNewsletter(p.newsletter);
      })
      .catch(() => {});
  }, [dati, uid]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    if (!nome.trim()) return setErrore("Scrivi il tuo nome.");
    setErrore(null);
    setOccupato(true);
    try {
      await dati.aggiornaProfilo(uid, { nome: nome.trim(), newsletter });
      await auth.cambiaNome(nome.trim());
    } catch {
      setErrore("Le modifiche non sono state salvate");
    } finally {
      setOccupato(false);
    }
  }

  return (
    <section className="acc-sez" id="dati" aria-labelledby="t-dati">
      <h2 id="t-dati" className="t-sezione">
        Dati personali
      </h2>
      <form className="acc-dati" onSubmit={(e) => void salva(e)} noValidate>
        <div className="campo">
          <label htmlFor="nm">Nome e cognome</label>
          <input id="nm" className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" aria-invalid={!!errore || undefined} />
        </div>
        <div className="campo">
          <span className="etichetta">Email</span>
          <span className="sola-lettura">{utente?.email ?? "–"}</span>
        </div>
        <div className="campo">
          <span className="etichetta">Accesso</span>
          <span className="sola-lettura">{utente?.accesso === "email" ? "Con il link via email" : "Con Google"}</span>
        </div>
        <label className="spunta-riga">
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} /> Voglio ricevere via email idee regalo e novità di Gifty
        </label>
        {errore ? (
          <p className="errore-testo" role="alert">
            {errore}
          </p>
        ) : null}
        <div>
          <button type="submit" className="btn btn-primario" disabled={occupato} aria-busy={occupato || undefined}>
            Salva le modifiche
          </button>
        </div>
      </form>
    </section>
  );
}

function Ricorrenze() {
  const { elenco, salva, elimina } = useReminder();
  const [modulo, setModulo] = useState<"nuova" | Reminder | null>(null);
  const oggi = oggiLocale();
  const ordinate = [...elenco].sort((a, b) => {
    const x = prossimaData(a, oggi);
    const y = prossimaData(b, oggi);
    return x.anno - y.anno || x.mese - y.mese || x.giorno - y.giorno;
  });
  const nomeTipo = (r: Reminder) => TIPI_RICORRENZA.find((t) => t.id === r.tipo)?.etichetta ?? "";

  return (
    <section className="acc-sez" id="ricorrenze" aria-labelledby="t-ric">
      <div className="testa-sezione" style={{ marginBottom: 0 }}>
        <h2 id="t-ric" className="t-sezione">
          Ricorrenze
        </h2>
        <button type="button" className="btn btn-contorno" onClick={() => setModulo("nuova")}>
          <IconaTratto nome="piu" />
          Aggiungi una ricorrenza
        </button>
      </div>
      {modulo ? (
        <FormReminder
          key={modulo === "nuova" ? "nuova" : modulo.id}
          iniziale={modulo === "nuova" ? undefined : modulo}
          meseProposto={oggi.mese}
          onSalva={async (r) => {
            await salva(r);
            setModulo(null);
          }}
          onElimina={
            modulo === "nuova"
              ? undefined
              : async () => {
                  await elimina(modulo.id);
                  setModulo(null);
                }
          }
          onChiudi={() => setModulo(null)}
        />
      ) : null}
      {ordinate.length ? (
        <div className="elenco-acc">
          {ordinate.map((r) => (
            <button key={r.id} type="button" className="riga" onClick={() => setModulo(r)} aria-label={`${r.nome}, ${nomeTipo(r)}, ${r.giorno} ${MESI[r.mese - 1]}: modifica`}>
              <span className="data">
                <b>{r.giorno}</b>
                <span>{MESI[r.mese - 1]}</span>
              </span>
              <span className="t">{r.nome}</span>
              <span className="sub">{nomeTipo(r)}</span>
              <span className="vai" aria-hidden="true">
                <IconaTratto nome="matita" />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Preferiti({ prodotti }: { prodotti: Prodotto[] }) {
  const { preferiti } = usePreferiti();
  const miei = prodotti.filter((p) => preferiti.has(p.slug));
  return (
    <section className="acc-sez" id="preferiti" aria-labelledby="t-pref">
      <h2 id="t-pref" className="t-sezione">
        Preferiti
      </h2>
      {miei.length ? (
        <div className="acc-pref">
          {miei.map((p) => (
            <TesseraProdotto key={p.slug} prodotto={p} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
