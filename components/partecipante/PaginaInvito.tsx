"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { FotoLastra, IconaTratto, Iniziali, Velo } from "@/components/ui";
import { FoglioCatalogo } from "@/components/wizard/Fogli";
import { LogoGoogle } from "@/components/wizard/PassoAccesso";
import type { VoceCatalogo } from "@/components/wizard/tipi";
import { CHIAVE_DOPO_ACCESSO, nomeDaEmail, scriviLocale } from "@/lib/auth/tipi";
import { dataBreve } from "@/lib/dominio/date";
import { consegnato, iscritti } from "@/lib/dominio/gruppo";
import { formattaIban } from "@/lib/dominio/iban";
import { formattaEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { linkPaypal } from "@/lib/dominio/paypal";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { regaloDaScegliere } from "@/lib/dominio/regali";
import { MAX_PROPOSTE_PER_PERSONA, proposteDi, votazioneInCorso } from "@/lib/dominio/votazione";
import { etichettaOccasione } from "@/lib/regalo/dati";
import type { Colletta, Metodo, Partecipante } from "@/lib/tipi";
import { usePartecipazione } from "./usePartecipazione";
import { VideoTutorial } from "./VideoTutorial";

/** Il biglietto del gruppo da firmare, se chi organizza l'ha preparato e non l'ha ancora mandato. */
export interface BigliettoDaFirmare {
  slug: string;
}

/** «Partecipo» toccato prima dell'accesso: dopo l'accesso (anche dal link via email) l'adesione si salva da sola (AC-03). */
const CHIAVE_PARTECIPO = "gifty.partecipo";

function leggiIntento(): string | null {
  try {
    return window.sessionStorage.getItem(CHIAVE_PARTECIPO) ?? window.localStorage.getItem(CHIAVE_PARTECIPO);
  } catch {
    return null;
  }
}
function scriviIntento(slug: string | null) {
  try {
    for (const s of [window.sessionStorage, window.localStorage]) {
      if (slug) s.setItem(CHIAVE_PARTECIPO, slug);
      else s.removeItem(CHIAVE_PARTECIPO);
    }
  } catch {
    /* ignorato */
  }
}

const dentro = (r: Partecipante | null): boolean => !!r && r.stato !== "rinunciato";

/**
 * La pagina di chi riceve il link (Gifty UX v2, design.md §5; prototipi/invito.html, stati anteprima, accesso,
 * aderito-voto, da-pagare, ho-pagato, chiuso; spec §7.3, D-06, D-14). Prima di aderire si vedono festeggiato, chi
 * organizza e il regalo o lo scopo, mai quota né iscritti. «Partecipo» chiede l'accesso e torna qui con l'adesione salvata.
 */
export function PaginaInvito({
  iniziale,
  righeIniziali,
  biglietto,
  catalogo,
  simulato = false,
}: {
  iniziale: Colletta;
  righeIniziali: Partecipante[] | null;
  biglietto: BigliettoDaFirmare | null;
  catalogo: VoceCatalogo[];
  /** il regalo di gruppo di esempio («Guarda come si fa»): si prova tutto, non si salva nulla */
  simulato?: boolean;
}) {
  const { utente, pronto } = useApp();
  const p = usePartecipazione(iniziale, righeIniziali, simulato);
  const c = p.colletta;
  const righe = p.righe ?? righeIniziali ?? [];
  const riga = p.miaRiga;
  const org = c.organizzatoreNome.trim();
  const [accesso, setAccesso] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [suggerisci, setSuggerisci] = useState(false);
  const inCorso = useRef(false);

  const conAccount = pronto && utente && !utente.anonimo ? utente : null;
  const aperto = c.stato === "aperta" && !consegnato(c) && c.listaAperta;
  const voto = votazioneInCorso(c) && c.stato === "aperta";

  const messaggio = (e: unknown) => (e instanceof ErroreDominio ? e.message : "Non siamo riusciti a salvare. Controlla la connessione e riprova.");

  async function aderisci() {
    if (!conAccount || inCorso.current) return;
    inCorso.current = true;
    setOccupato(true);
    setErrore(null);
    try {
      const uid = await p.aspettaIdentita();
      if (uid !== conAccount.uid && !simulato) throw new Error("identità");
      const nome = conAccount.nome || nomeDaEmail(conAccount.email ?? "");
      await p.esegui(riga?.id ?? uid, { tipo: "aderisci", nome });
      scriviIntento(null);
    } catch (e) {
      setErrore(messaggio(e));
    } finally {
      inCorso.current = false;
      setOccupato(false);
    }
  }

  // Dopo l'accesso: se «Partecipo» era stato toccato qui, l'adesione si salva senza un altro tocco.
  useEffect(() => {
    if (!conAccount || (p.uid !== conAccount.uid && !simulato) || p.righe === null) return;
    if (leggiIntento() !== c.slug) return;
    setAccesso(false);
    if (dentro(riga)) return scriviIntento(null);
    void aderisci();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conAccount?.uid, p.uid, p.righe, riga, c.slug]);

  function partecipo() {
    setErrore(null);
    if (conAccount) return void aderisci();
    scriviIntento(c.slug);
    scriviLocale(CHIAVE_DOPO_ACCESSO, `/c/${c.slug}`);
    setAccesso(true);
  }

  async function nonPartecipo() {
    setOccupato(true);
    setErrore(null);
    try {
      const uid = await p.aspettaIdentita();
      await p.esegui(riga?.id ?? uid, { tipo: "rinuncia" });
      scriviIntento(null);
    } catch (e) {
      setErrore(messaggio(e));
    } finally {
      setOccupato(false);
    }
  }

  const occasione = c.occasione === "altro" ? "" : `${etichettaOccasione(c.occasione)}, `;
  const deciso = !voto && !regaloDaScegliere(c.prodotto);
  const dentroOra = dentro(riga);
  const nIscritti = iscritti(righe);
  const iscrittiRighe = righe.filter((r) => r.uidAnonimo && (r.stato === "aderito" || r.stato === "dichiarato" || r.stato === "confermato"));

  return (
    <>
      <section className="i-scena">
        <div className="pagina">
          <div className={simulato ? "carta carta-tutorial" : "carta"}>
            {simulato ? <VideoTutorial /> : null}
            <p className="mano">Il regalo di gruppo per {c.festeggiato}</p>
            <p className="chi">
              {occasione}
              {dataBreve(c.dataRegalo)}.{org ? (
                <>
                  {" "}
                  Organizzato da <b>{org}</b>
                </>
              ) : null}
            </p>
            {dentroOra ? (
              <>
                <div className="fila-iniziali" aria-label={`${nIscritti} su ${c.previsti} hanno aderito`} style={{ marginTop: 8 }}>
                  {iscrittiRighe.map((r) => (
                    <Iniziali key={r.id} testo={r.nome.trim().slice(0, 2).toUpperCase()} />
                  ))}
                </div>
                <p className="t-piccolo muted">
                  {nIscritti} su {c.previsti} hanno aderito
                </p>
              </>
            ) : voto ? (
              <p style={{ marginTop: 8 }}>Il regalo lo scegliamo insieme, votando fra le proposte di {org}.</p>
            ) : null}
            {/* nell'esempio niente riga del prodotto (Cri, 6 nov) */}
            {deciso && !simulato ? (
              <div className="regalo">
                <FotoLastra prodotto={c.prodotto} />
                <span>
                  <b>{c.prodotto.nome}</b>
                  {c.votazione?.chiusa ? (
                    <>
                      <br />
                      <span className="t-piccolo muted">Ha vinto la votazione</span>
                    </>
                  ) : null}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="pagina">
        <div className="i-colonna">
          {errore ? (
            <p className="errore-testo" role="alert" style={{ paddingTop: 16 }}>
              {errore}
            </p>
          ) : null}

          {/* nell'esempio niente «Le adesioni sono chiuse» (Cri, 6 nov) */}
          {!simulato && !aperto && (!dentroOra || c.stato === "chiusa") ? (
            <div className="i-blocco i-sopra">
              <span className="stato neutro">Le adesioni sono chiuse</span>
              {consegnato(c) ? <p>Il regalo è stato consegnato.</p> : null}
            </div>
          ) : null}

          {!dentroOra && aperto ? (
            <>
              <div className="i-scelta">
                <button type="button" className="btn btn-primario" disabled={occupato} aria-busy={occupato || undefined} onClick={partecipo}>
                  Partecipo
                </button>
                <button type="button" className="btn btn-contorno" disabled={occupato} onClick={() => void nonPartecipo()}>
                  Non partecipo
                </button>
              </div>
              {riga?.stato === "rinunciato" ? (
                <div className="i-blocco">
                  <p>Hai detto che non partecipi. Se hai cambiato idea, tocca «Partecipo».</p>
                </div>
              ) : null}
            </>
          ) : null}

          {dentroOra && c.stato !== "chiusa" ? (
            <>
              <div className="i-blocco" style={{ paddingBottom: 0 }}>
                <span className="stato">
                  <IconaTratto nome="spunta" />
                  Partecipi al regalo per {c.festeggiato}
                </span>
              </div>
              {voto ? (
                <>
                  <div className="i-blocco">
                    <h2 className="t-sezione">La tua quota</h2>
                    <p>La quota si conosce quando {org} chiude la votazione.</p>
                  </div>
                  <BloccoVoto p={p} onSuggerisci={() => setSuggerisci(true)} />
                </>
              ) : (
                <BloccoQuota c={c} riga={riga!} org={org} p={p} onErrore={setErrore} />
              )}
              {biglietto ? (
                <div className="i-blocco">
                  <h2 className="t-sezione">Il biglietto per {c.festeggiato}</h2>
                  <div>
                    <Link className="btn btn-contorno" href={`/b/${biglietto.slug}`}>
                      <IconaTratto nome="matita" />
                      Firma il biglietto
                    </Link>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {accesso && !conAccount ? <FoglioAccesso slug={c.slug} onChiudi={() => setAccesso(false)} /> : null}
      {suggerisci ? (
        <FoglioCatalogo
          modo="scelta"
          catalogo={catalogo}
          persone={Math.max(1, c.previsti)}
          scelti={[]}
          onScegli={async (prodotto) => {
            setSuggerisci(false);
            try {
              await p.proponi({ prodotto, autoreNome: riga?.nome ?? conAccount?.nome ?? "" });
            } catch (e) {
              setErrore(messaggio(e));
            }
          }}
          onAlterna={() => {}}
          onChiudi={() => setSuggerisci(false)}
        />
      ) : null}
    </>
  );
}

type P = ReturnType<typeof usePartecipazione>;

/** «Quale regalo?»: un voto a scelta unica fra le proposte (prototipi/invito.html, stato aderito con il voto aperto). */
function BloccoVoto({ p, onSuggerisci }: { p: P; onSuggerisci: () => void }) {
  const c = p.colletta;
  const [scelta, setScelta] = useState<string | null>(null);
  const mia = scelta ?? p.proposte.find((x) => p.mioVoto(x.id) > 0)?.id ?? null;
  const puoSuggerire = !!c.votazione?.consentiProposte && !!p.uid && proposteDi(p.proposte, p.uid) < MAX_PROPOSTE_PER_PERSONA;
  const proposte = [...p.proposte].sort((a, b) => a.creatoIl - b.creatoIl);

  async function vota(id: string) {
    const prima = mia;
    setScelta(id);
    try {
      await p.scegli(id);
    } catch {
      setScelta(prima);
    }
  }

  return (
    <div className="i-blocco">
      <h2 className="t-sezione">Quale regalo?</h2>
      <div role="radiogroup" aria-label="Il tuo voto" style={{ display: "grid", gap: 12 }}>
        {proposte.map((x) => (
          <button key={x.id} type="button" className="scelta i-opzione" role="radio" aria-checked={mia === x.id} onClick={() => void vota(x.id)}>
            <span className="radio" />
            <FotoLastra prodotto={x.prodotto} />
            <span>
              <span className="n">{x.prodotto.nome}</span>
              <br />
              <span className="t-cifra muted">{formattaEuro(x.prodotto.prezzoCent)}</span>
            </span>
          </button>
        ))}
      </div>
      {puoSuggerire ? (
        <div>
          <button type="button" className="btn btn-quieto" onClick={onSuggerisci}>
            <IconaTratto nome="piu" />
            Suggerisci un regalo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function copia(testo: string) {
  void navigator.clipboard?.writeText(testo).catch(() => {});
}

/** «La tua quota», con i modi di rimborso di chi organizza e «Ho pagato» (stati da pagare e ho pagato). */
function BloccoQuota({ c, riga, org, p, onErrore }: { c: Colletta; riga: Partecipante; org: string; p: P; onErrore: (e: string | null) => void }) {
  const [occupato, setOccupato] = useState(false);
  const quota = quotaEffettiva(c);
  const ricevuto = riga.stato === "confermato" ? (riga.importoCent ?? 0) : 0;
  const dichiarato = riga.stato === "dichiarato";
  const importo = dichiarato ? (riga.importoCent ?? quota) : Math.max(0, quota - ricevuto);
  const saldato = !dichiarato && importo === 0;
  const m = c.metodi;
  const metodoDichiarabile: Metodo | null =
    riga.metodo && riga.metodo !== "contanti" && m[riga.metodo].attivo ? riga.metodo : (["paypal", "satispay", "bonifico"] as const).find((x) => m[x].attivo) ?? null;
  const pp = m.paypal.attivo ? linkPaypal(m.paypal.valore, importo || null) : null;
  const a = org;

  async function hoPagato() {
    if (!metodoDichiarabile) return;
    setOccupato(true);
    onErrore(null);
    try {
      await p.esegui(riga.id, { tipo: "dichiara", metodo: metodoDichiarabile, importoCent: importo || undefined });
    } catch (e) {
      onErrore(e instanceof ErroreDominio ? e.message : "Non siamo riusciti a salvare. Controlla la connessione e riprova.");
    } finally {
      setOccupato(false);
    }
  }

  if (dichiarato || saldato) {
    return (
      <div className="i-blocco">
        <h2 className="t-sezione">La tua quota</h2>
        <div className="i-quota">
          <span className="t-cifra">{formattaEuro(dichiarato ? importo : ricevuto)}</span>
          <span className="muted">a {a}</span>
        </div>
        <span className="stato neutro">{dichiarato ? `In attesa della conferma di ${a}` : "Pagamento confermato"}</span>
      </div>
    );
  }

  return (
    <div className="i-blocco">
      <h2 className="t-sezione">La tua quota</h2>
      <div className="i-quota">
        <span className="t-cifra">{formattaEuro(importo)}</span>
        <span className="muted">a {a}, fuori da Gifty</span>
      </div>
      <div className="i-metodi">
        {pp ? (
          <div>
            PayPal
            <a className="btn btn-quieto" href={pp.conImporto ?? pp.profilo} target="_blank" rel="noopener noreferrer">
              Apri PayPal <IconaTratto nome="esterno" />
            </a>
          </div>
        ) : null}
        {m.satispay.attivo && m.satispay.valore ? (
          <div>
            Satispay<span className="v">{m.satispay.valore}</span>
            <button type="button" className="icona-btn" aria-label="Copia il numero Satispay" onClick={() => copia(m.satispay.valore)}>
              <IconaTratto nome="copia" />
            </button>
          </div>
        ) : null}
        {m.bonifico.attivo && m.bonifico.valore ? (
          <div>
            Bonifico<span className="v">{formattaIban(m.bonifico.valore)}</span>
            <button type="button" className="icona-btn" aria-label="Copia l'IBAN" onClick={() => copia(m.bonifico.valore)}>
              <IconaTratto nome="copia" />
            </button>
          </div>
        ) : null}
        {m.contanti.attivo ? <div>Contanti</div> : null}
      </div>
      {metodoDichiarabile ? (
        <div>
          <button type="button" className="btn btn-primario" disabled={occupato} aria-busy={occupato || undefined} onClick={() => void hoPagato()}>
            Ho pagato
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** «Accedi per partecipare» (prototipi/invito.html, stato accesso): Google, oppure il link via email (D-13). */
function FoglioAccesso({ slug, onChiudi }: { slug: string; onChiudi: () => void }) {
  const { auth } = useApp();
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inviata, setInviata] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);

  async function google() {
    setErrore(null);
    setOccupato(true);
    try {
      await auth.accediConGoogle();
    } catch {
      setErrore("Accesso con Google non riuscito. Riprova.");
    } finally {
      setOccupato(false);
    }
  }

  async function manda() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErrore("Controlla l'indirizzo email.");
    setErrore(null);
    setOccupato(true);
    scriviLocale(CHIAVE_DOPO_ACCESSO, `/c/${slug}`);
    try {
      const { accessoImmediato } = await auth.inviaLinkEmail(email, "");
      if (!accessoImmediato) setInviata(email.trim());
    } catch {
      setErrore("Non siamo riusciti a mandare il link. Riprova fra poco.");
    } finally {
      setOccupato(false);
    }
  }

  return (
    <Velo onChiudi={onChiudi} etichetta="t-acc">
      <div className="foglio-testa">
        <h2 id="t-acc" className="t-sezione" tabIndex={-1}>
          Accedi per partecipare
        </h2>
        <button type="button" className="icona-btn" onClick={onChiudi} aria-label="Chiudi">
          <IconaTratto nome="chiudi" />
        </button>
      </div>
      {inviata ? (
        <div style={{ display: "grid", gap: 16 }} role="status">
          <span className="stato" style={{ justifySelf: "start" }}>
            <IconaTratto nome="email" />
            Link mandato
          </span>
          <p>Apri il link che hai ricevuto a {inviata}</p>
        </div>
      ) : (
        <form
          style={{ display: "grid", gap: 16 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void manda();
          }}
        >
          <button type="button" className="btn btn-google" onClick={() => void google()} disabled={occupato}>
            <LogoGoogle />
            Accedi con Google
          </button>
          <div className="campo">
            <label htmlFor="em">Oppure con la tua email</label>
            <input id="em" type="email" className="input" placeholder="nome@esempio.it" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-contorno" disabled={occupato}>
            Mandami il link per accedere
          </button>
          {errore ? (
            <p className="errore-testo" role="alert">
              {errore}
            </p>
          ) : null}
          <p className="t-piccolo muted">
            Accedendo accetti l&apos;<Link href="/privacy">informativa privacy</Link>.
          </p>
        </form>
      )}
    </Velo>
  );
}
