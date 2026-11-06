"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { FotoLastra, IconaTratto, Iniziali, Velo } from "@/components/ui";
import { FoglioCatalogo } from "@/components/wizard/Fogli";
import type { VoceCatalogo } from "@/components/wizard/tipi";
import { dataBreve, oraBreve } from "@/lib/dominio/date";
import { aperturaVoto, consegna, consegnato, iscritti, registro, ricevutoDopoPagamento, totali, type RigaRegistro } from "@/lib/dominio/gruppo";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { linkColletta, linkWhatsApp, messaggioChat } from "@/lib/dominio/messaggi";
import { ErroreDominio, type Operazione } from "@/lib/dominio/operazioni";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { conRegalo, regaloDaScegliere } from "@/lib/dominio/regali";
import { chiusuraVotazione, classifica, votazioneInCorso } from "@/lib/dominio/votazione";
import { etichettaOccasione } from "@/lib/regalo/dati";
import type { Colletta, ProdottoColletta, Proposta, Voto } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { useChiusuraVotazione } from "./useChiusuraVotazione";
import { useGestione } from "./useGestione";

/** Il biglietto del gruppo, se c'è: quello che serve al blocco «Biglietto» (lo legge il server). */
export interface BigliettoDelGruppo {
  id: string;
  stato: string;
  nFirme: number;
}

type Foglio = null | "quota" | "aggiungi" | { pagamento: RigaRegistro } | "scegli" | "voto";

const nomeBreve = (r: RigaRegistro) => r.riga.nome.trim().slice(0, 2).toUpperCase();

/**
 * La pagina di chi organizza il regalo di gruppo (Gifty UX v2, design.md §5 «Il tuo gruppo»; prototipi/gestisci.html,
 * stati aperto, voto, consegnato). Testata con le quattro cifre; Persone con il registro e una sola azione per riga
 * (decisione 7); a lato Il regalo (o la votazione), Biglietto, Consegna. Il «Promemoria» dopo la consegna (D-12) non c'è:
 * serve un servizio email che non esiste ancora, e un pulsante che non fa nulla non si mostra.
 */
export function PaginaGruppo({ slug, catalogo, biglietto }: { slug: string; catalogo: VoceCatalogo[]; biglietto: BigliettoDelGruppo | null }) {
  const { dati } = useApp();
  const g = useGestione(slug);
  const c = g.colletta;
  const [foglio, setFoglio] = useState<Foglio>(null);
  const [daVotare, setDaVotare] = useState<ProdottoColletta[]>([]);
  const [proposte, setProposte] = useState<Proposta[]>([]);
  const [voti, setVoti] = useState<Voto[]>([]);
  const [occupato, setOccupato] = useState(false);
  const inVoto = !!c && votazioneInCorso(c);

  useEffect(() => {
    if (!inVoto) return;
    const a = dati.osservaProposte(slug, setProposte);
    const b = dati.osservaVoti(slug, setVoti);
    return () => {
      a();
      b();
    };
  }, [dati, slug, inVoto]);
  useChiusuraVotazione(slug, inVoto && c?.votazione ? c.votazione.scade : null, () => {});

  // un indirizzo sbagliato o un regalo che non c'è più: si torna all'elenco dei regali
  const router = useRouter();
  useEffect(() => {
    if (g.carico === "assente") router.replace("/account/regali");
  }, [g.carico, router]);

  const reg = useMemo(() => (c ? registro(c, g.righe) : []), [c, g.righe]);
  const tot = useMemo(() => totali(reg), [reg]);

  if (g.carico !== "ok" || !c) {
    return (
      <p role="status" className="pagina py-16 text-center muted">
        Un momento…
      </p>
    );
  }

  const fatto = consegnato(c);
  const chiusa = c.stato === "chiusa";
  const attiva = !chiusa;
  const quota = quotaEffettiva(c);
  const url = linkColletta(typeof window === "undefined" ? "" : baseUrlClient(), slug);
  const occasione = c.occasione === "altro" ? "" : `${etichettaOccasione(c.occasione)}, `;
  const vuoti = Math.max(0, c.previsti - reg.length);
  const nSpesi = reg.length;

  async function esegui(pid: string, op: Operazione) {
    await g.azione(pid, op);
  }

  async function scrivi(patch: Partial<Colletta>) {
    setOccupato(true);
    const ok = await g.aggiorna(patch);
    setOccupato(false);
    return ok;
  }

  async function consegnaOra() {
    try {
      await scrivi(consegna(c!, g.righe, Date.now()));
    } catch (e) {
      g.setAvviso(e instanceof ErroreDominio ? e.message : "Adesso non si può fare.");
    }
  }

  async function chiudiVoto() {
    setOccupato(true);
    try {
      const [ps, vs] = await Promise.all([dati.proposte(slug), dati.voti(slug)]);
      const patch = chiusuraVotazione(c!, ps, vs, Date.now());
      if (patch) await g.aggiorna(patch);
    } catch {
      g.setAvviso("Non siamo riusciti a salvare e la modifica è stata annullata. Riprova fra poco.");
    } finally {
      setOccupato(false);
    }
  }

  async function apriVoto(candidati: ProdottoColletta[]) {
    setFoglio(null);
    if (candidati.length < 2) return;
    setOccupato(true);
    try {
      const patch = aperturaVoto(c!, candidati, Date.now());
      await dati.impostaProposteIniziali(slug, candidati);
      await g.aggiorna(patch);
      setDaVotare([]);
    } catch (e) {
      g.setAvviso(e instanceof ErroreDominio ? e.message : "Non siamo riusciti a salvare e la modifica è stata annullata. Riprova fra poco.");
    } finally {
      setOccupato(false);
    }
  }

  const azioneRiga = (r: RigaRegistro) => {
    // durante il voto non si paga (lib/dominio/operazioni.ts): nessuna azione sulle righe
    if (!attiva || inVoto || !r.azione) return null;
    if (r.azione.tipo === "ricevuto") {
      const cent = r.azione.cent;
      return (
        <button type="button" className="btn btn-contorno" onClick={() => void esegui(r.riga.id, { tipo: "conferma", importoCent: r.ricevutoCent + cent })}>
          Segna ricevuto {formattaEuro(cent)}
        </button>
      );
    }
    return (
      <button type="button" className="btn btn-quieto" onClick={() => setFoglio({ pagamento: r })}>
        Segna un pagamento
      </button>
    );
  };

  const statoTesta = fatto ? (
    <span className="stato caldo">
      <IconaTratto nome="spunta" />
      Regalo consegnato il {dataBreve(c.consegnatoIl!)}
    </span>
  ) : chiusa || !c.listaAperta ? (
    <span className="stato neutro">Le adesioni sono chiuse</span>
  ) : (
    <span className="stato">
      Adesioni aperte fino al {dataBreve(c.scadenza)}, {oraBreve(c.scadenza)}
    </span>
  );

  const classificati = inVoto ? classifica(proposte, voti) : [];

  return (
    <>
      <section className="g-intesta">
        <div className="pagina g-intesta-in">
          <div className="g-titolo">
            <h1 className="t-pagina">Il regalo di gruppo per {c.festeggiato}</h1>
            {statoTesta}
          </div>
          <p className="meta">
            {occasione}
            {dataBreve(c.dataRegalo)}. Organizzato da <b>{c.organizzatoreNome}</b>
          </p>
          <dl className="g-cifre">
            <div>
              <dt>Iscritti</dt>
              <dd>
                {iscritti(g.righe)} <small>su {c.previsti}</small>
              </dd>
            </div>
            <div>
              <dt>Quota a testa</dt>
              <dd>
                {formattaEuro(quota)}
                {attiva && !inVoto ? (
                  <button type="button" className="icona-btn" aria-label="Cambia la quota a testa" onClick={() => setFoglio("quota")}>
                    <IconaTratto nome="matita" />
                  </button>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Ricevuto</dt>
              <dd>{formattaEuro(tot.ricevutoCent)}</dd>
            </div>
            <div>
              <dt>Da ricevere</dt>
              <dd>{formattaEuro(tot.daRicevereCent)}</dd>
            </div>
          </dl>
          {g.avviso ? (
            <p className="errore-testo" role="alert">
              {g.avviso}
            </p>
          ) : null}
        </div>
      </section>

      <div className="pagina g-corpo">
        <div className="g-blocco">
          <div className="testa-sezione" style={{ marginBottom: 0 }}>
            <h2 className="t-sezione">Persone</h2>
            {attiva && !fatto ? (
              <a
                className="btn btn-primario"
                href={linkWhatsApp(messaggioChat({ festeggiato: c.festeggiato, quotaCent: inVoto || regaloDaScegliere(c.prodotto) ? null : quota, scadenza: c.scadenza, url, sorpresa: c.sorpresa }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconaTratto nome="whatsapp" />
                Manda il link nella chat
              </a>
            ) : null}
          </div>
          {!fatto ? (
            <div className="g-posti" aria-label={`${reg.length} persone su ${c.previsti}`}>
              {reg.map((r) => (
                <Iniziali key={r.riga.id} testo={nomeBreve(r)} />
              ))}
              {Array.from({ length: vuoti }, (_, i) => (
                <Iniziali key={`v${i}`} />
              ))}
            </div>
          ) : null}
          {reg.length ? (
            <>
              <table className="registro g-registro">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th className="num">Quota</th>
                    <th className="num">Dichiarato</th>
                    <th className="num">Ricevuto</th>
                    <th className="num">Saldo</th>
                    <th>
                      <span className="vh">Azione</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reg.map((r) => (
                    <tr key={r.riga.id}>
                      <td>
                        <span className="chi">
                          <Iniziali testo={nomeBreve(r)} />
                          <span>
                            {r.riga.nome}
                            {r.aMano ? <small>aggiunto da te</small> : null}
                          </span>
                        </span>
                      </td>
                      <td className="num">{formattaEuro(r.quotaCent)}</td>
                      <td className="num">{r.dichiaratoCent ? formattaEuro(r.dichiaratoCent) : "–"}</td>
                      <td className="num">{r.ricevutoCent ? formattaEuro(r.ricevutoCent) : "–"}</td>
                      <td className="num">
                        <b>{formattaEuro(r.saldoCent)}</b>
                      </td>
                      <td>{azioneRiga(r)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Totale</td>
                    <td className="num">{formattaEuro(tot.budgetCent)}</td>
                    <td className="num" />
                    <td className="num">{formattaEuro(tot.ricevutoCent)}</td>
                    <td className="num">{formattaEuro(tot.daRicevereCent)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              <div className="g-persone-tel">
                {reg.map((r) => {
                  const azione = azioneRiga(r);
                  return (
                    <div key={r.riga.id} className="g-persona">
                      <Iniziali testo={nomeBreve(r)} />
                      <span className="n">
                        {r.riga.nome}
                        {r.aMano ? (
                          <span className="muted" style={{ fontWeight: 400 }}>
                            {" "}
                            aggiunto da te
                          </span>
                        ) : null}
                      </span>
                      <span className="saldo">
                        <b>{formattaEuro(r.saldoCent)}</b>
                        <span>saldo</span>
                      </span>
                      <span className="sub">{r.stato}</span>
                      {azione ? <span className="azione">{azione}</span> : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
          {attiva && !fatto ? (
            <div>
              <button type="button" className="btn btn-contorno" onClick={() => setFoglio("aggiungi")}>
                <IconaTratto nome="piu" />
                Aggiungi una persona
              </button>
            </div>
          ) : null}
        </div>

        <aside className="g-lato">
          {inVoto ? (
            <div className="g-blocco">
              <h2 className="t-sezione">Votazione</h2>
              <div className="g-voti">
                {classificati.map((x) => (
                  <div key={x.proposta.id} className="g-voto">
                    <FotoLastra prodotto={x.proposta.prodotto} />
                    <span className="n">{x.proposta.prodotto.nome}</span>
                    <span className="barra">
                      {x.nVoti ? <i style={{ width: `${Math.min(x.nVoti * 48, 240)}px` }} /> : null}
                      <span>
                        {x.nVoti} {x.nVoti === 1 ? "voto" : "voti"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <button type="button" className="btn btn-primario" disabled={occupato} aria-busy={occupato || undefined} onClick={() => void chiudiVoto()}>
                  Chiudi la votazione
                </button>
              </div>
            </div>
          ) : regaloDaScegliere(c.prodotto) ? (
            attiva && !fatto ? (
              <div className="g-blocco">
                <h2 className="t-sezione">Il regalo</h2>
                <p>
                  Budget previsto <b className="t-cifra">{formattaEuro(tot.budgetCent)}</b> con le adesioni di oggi.
                </p>
                <div>
                  <button type="button" className="btn btn-primario" onClick={() => setFoglio("scegli")}>
                    Scegli il regalo
                  </button>
                </div>
                <div>
                  <button type="button" className="btn btn-quieto" onClick={() => setFoglio("voto")}>
                    <IconaTratto nome="voto" />
                    Metti ai voti più regali
                  </button>
                </div>
              </div>
            ) : null
          ) : (
            <div className="g-blocco">
              <h2 className="t-sezione">Il regalo</h2>
              <div className="g-regalo-riga">
                <FotoLastra prodotto={c.prodotto} />
                <div>
                  <p style={{ fontWeight: 700 }}>{c.prodotto.nome}</p>
                  <p className="t-piccolo muted">
                    {fatto && c.acquisto?.speseCent
                      ? `Comprato a ${formattaEuro(c.acquisto.speseCent)}, diviso fra ${nSpesi}`
                      : formattaEuro(c.prodotto.prezzoCent)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {biglietto ? (
            <div className="g-blocco">
              <h2 className="t-sezione">Biglietto</h2>
              {biglietto.nFirme > 0 || biglietto.stato === "consegnato" ? (
                <p>
                  Firmato da {biglietto.nFirme} {biglietto.nFirme === 1 ? "persona" : "persone"}
                  {biglietto.stato === "consegnato" ? `, mandato a ${c.festeggiato}` : ""}
                </p>
              ) : null}
              <div>
                <Link className="btn btn-contorno" href={`/biglietto/${biglietto.id}/gestisci`}>
                  Apri il biglietto
                </Link>
              </div>
            </div>
          ) : attiva ? (
            <div className="g-blocco">
              <h2 className="t-sezione">Biglietto</h2>
              <div>
                <Link className="btn btn-contorno" href={`/biglietto/nuovo?gruppo=${slug}`}>
                  Prepara il biglietto
                </Link>
              </div>
            </div>
          ) : null}

          {attiva && !fatto && !inVoto ? (
            <div className="g-blocco">
              <h2 className="t-sezione">Consegna</h2>
              <div>
                <button type="button" className="btn btn-contorno" disabled={occupato} onClick={() => void consegnaOra()}>
                  <IconaTratto nome="regalo" />
                  Regalo consegnato
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {foglio === "quota" ? (
        <FoglioImporto
          titolo="Cambia la quota a testa"
          etichetta="Quota a testa"
          iniziale={quota}
          bottone="Salva"
          onChiudi={() => setFoglio(null)}
          onSalva={async (cent) => {
            // la quota scritta a mano vale per tutti da qui in poi: il ricevuto resta, cambia il saldo (AC-12)
            if (await scrivi({ modoQuota: "fissa", quotaCent: cent, quotaCongelata: true })) setFoglio(null);
          }}
        />
      ) : null}
      {foglio && typeof foglio === "object" ? (
        <FoglioImporto
          titolo="Segna un pagamento"
          sotto={foglio.pagamento.riga.nome}
          etichetta="Importo ricevuto"
          iniziale={foglio.pagamento.saldoCent}
          bottone="Segna ricevuto"
          onChiudi={() => setFoglio(null)}
          onSalva={async (cent) => {
            const r = foglio.pagamento.riga;
            setFoglio(null);
            await esegui(r.id, { tipo: "conferma", importoCent: ricevutoDopoPagamento(r, cent) });
          }}
        />
      ) : null}
      {foglio === "aggiungi" ? <FoglioPersona onChiudi={() => setFoglio(null)} onAggiungi={async (nome) => (await g.aggiungiNome(nome)) && setFoglio(null)} /> : null}
      {foglio === "scegli" ? (
        <FoglioCatalogo
          modo="scelta"
          catalogo={catalogo}
          persone={Math.max(1, reg.length)}
          scelti={[]}
          onScegli={async (p) => {
            setFoglio(null);
            await scrivi({ prodotto: p });
          }}
          onAlterna={() => {}}
          onChiudi={() => setFoglio(null)}
        />
      ) : null}
      {foglio === "voto" ? (
        <FoglioCatalogo
          modo="voto"
          catalogo={catalogo}
          persone={Math.max(1, reg.length)}
          scelti={daVotare}
          onScegli={() => {}}
          onAlterna={(p) => setDaVotare((l) => (l.some((x) => x.prodottoId === p.prodottoId) ? l.filter((x) => x.prodottoId !== p.prodottoId) : conRegalo(l, p)))}
          onChiudi={() => void apriVoto(daVotare)}
        />
      ) : null}
    </>
  );
}

/** Un importo in euro in un foglio: la quota a testa o un pagamento ricevuto. */
function FoglioImporto({
  titolo,
  sotto,
  etichetta,
  iniziale,
  bottone,
  onChiudi,
  onSalva,
}: {
  titolo: string;
  sotto?: string;
  etichetta: string;
  iniziale: number;
  bottone: string;
  onChiudi: () => void;
  onSalva: (cent: number) => void | Promise<void>;
}) {
  const [testo, setTesto] = useState(iniziale > 0 ? euroPerCampo(iniziale) : "");
  const [errore, setErrore] = useState<string | null>(null);
  return (
    <Velo onChiudi={onChiudi} etichetta="t-importo">
      <form
        className="g-foglio"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const cent = leggiEuro(testo);
          if (!cent) return setErrore("Scrivi un importo valido.");
          setErrore(null);
          void onSalva(cent);
        }}
      >
        <div className="foglio-testa">
          <h2 id="t-importo" className="t-sezione" tabIndex={-1}>
            {titolo}
          </h2>
          <button type="button" className="icona-btn" onClick={onChiudi} aria-label="Chiudi">
            <IconaTratto nome="chiudi" />
          </button>
        </div>
        {sotto ? <p>{sotto}</p> : null}
        <div className="campo">
          <label htmlFor="importo">{etichetta}</label>
          <div className="campo-euro">
            <input id="importo" className="input" inputMode="decimal" autoComplete="off" value={testo} onChange={(e) => setTesto(e.target.value)} aria-invalid={!!errore || undefined} />
            <span aria-hidden="true">€</span>
          </div>
          {errore ? (
            <p className="errore-testo" role="alert">
              {errore}
            </p>
          ) : null}
        </div>
        <div className="avanti">
          <button type="submit" className="btn btn-primario">
            {bottone}
          </button>
        </div>
      </form>
    </Velo>
  );
}

/** «Aggiungi una persona»: chi è nella chat ma non si iscrive (D-07); la riga sarà «aggiunto da te». */
function FoglioPersona({ onChiudi, onAggiungi }: { onChiudi: () => void; onAggiungi: (nome: string) => unknown }) {
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  return (
    <Velo onChiudi={onChiudi} etichetta="t-persona">
      <form
        className="g-foglio"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return setErrore("Scrivi il nome.");
          setErrore(null);
          void onAggiungi(nome.trim());
        }}
      >
        <div className="foglio-testa">
          <h2 id="t-persona" className="t-sezione" tabIndex={-1}>
            Aggiungi una persona
          </h2>
          <button type="button" className="icona-btn" onClick={onChiudi} aria-label="Chiudi">
            <IconaTratto nome="chiudi" />
          </button>
        </div>
        <div className="campo">
          <label htmlFor="nome-persona">Nome</label>
          <input id="nome-persona" className="input" autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!errore || undefined} style={{ maxWidth: "22rem" }} />
          {errore ? (
            <p className="errore-testo" role="alert">
              {errore}
            </p>
          ) : null}
        </div>
        <div className="avanti">
          <button type="submit" className="btn btn-primario">
            Aggiungi
          </button>
        </div>
      </form>
    </Velo>
  );
}

