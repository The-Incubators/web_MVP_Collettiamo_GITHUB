"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avviso, Bottone, BottoneLink, Campo, Icona } from "@/components/ui";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { votazioneInCorso } from "@/lib/dominio/votazione";
import type { Colletta, Metodo, Partecipante } from "@/lib/tipi";
import { PassoBiglietto } from "./PassoBiglietto";
import { PassoConferma } from "./PassoConferma";
import { PassoMetodo } from "./PassoMetodo";
import { PassoNome } from "./PassoNome";
import { NOMI_METODO } from "./PannelloPagamento";
import { Rendiconto } from "./Rendiconto";
import { RisultatoVotazione } from "./RisultatoVotazione";
import { VotazioneGruppo } from "./VotazioneGruppo";
import { Passi, RiquadroColletta, Testata } from "./Testata";
import { usePartecipazione } from "./usePartecipazione";

/**
 * Le schermate di chi partecipa. «metodo» contiene anche la dichiarazione («Hai pagato?»), come nel disegno
 * di UX_V4; «conferma» resta per chi torna sul link e dichiara dopo. Alla fine del percorso si arriva sempre
 * a «stato», la stessa schermata che vede chi riapre il link.
 */
type Vista = "home" | "nome" | "metodo" | "conferma" | "biglietto" | "stato" | "rinuncia" | "grazie";

export function PaginaPartecipante({
  iniziale,
  righeIniziali,
  simulato,
}: {
  iniziale: Colletta;
  righeIniziali: Partecipante[] | null;
  simulato: boolean;
}) {
  const p = usePartecipazione(iniziale, righeIniziali, simulato);
  const c = p.colletta;
  const [vista, setVista] = useState<Vista>("home");
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [importoLibero, setImportoLibero] = useState(() => euroPerCampo(iniziale.quotaCent));
  const [problema, setProblema] = useState<string | null>(null);
  const [scaduta, setScaduta] = useState(false);
  const [nomeRinuncia, setNomeRinuncia] = useState("");
  const [occupato, setOccupato] = useState(false);
  const ripreso = useRef(false);
  const titolo = useRef<HTMLDivElement>(null);

  useEffect(() => setScaduta(Date.now() > iniziale.scadenza), [iniziale.scadenza]);

  const riga = p.miaRiga;
  const pid = riga?.id ?? p.uid ?? "";
  const righe = p.righe ?? righeIniziali;

  // Chi torna sul link vede il proprio stato, non il flusso da capo.
  useEffect(() => {
    if (ripreso.current || p.righe === null || !p.uid) return;
    ripreso.current = true;
    if (!riga) return;
    if (riga.metodo) setMetodo(riga.metodo);
    if (riga.importoCent && c.modoQuota === "libera") setImportoLibero(euroPerCampo(riga.importoCent));
    setVista((v) => {
      if (v !== "home") return v;
      if (riga.stato === "dichiarato" || riga.stato === "confermato") return "stato";
      if (riga.stato === "aderito") return riga.metodo ? "stato" : "metodo";
      return v;
    });
  }, [p.righe, p.uid, riga, c.modoQuota]);

  // Dopo ogni cambio di vista l'attenzione va sul nuovo contenuto.
  useEffect(() => {
    if (vista !== "home") {
      titolo.current?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [vista]);

  const importo = useMemo(() => (c.modoQuota === "libera" ? leggiEuro(importoLibero) : quotaEffettiva(c)), [c, importoLibero]);

  const messaggioErrore = (e: unknown) =>
    e instanceof ErroreDominio ? e.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.";

  if (votazioneInCorso(c)) return <VotazioneGruppo p={p} />;

  if (c.stato === "chiusa") {
    return <Rendiconto colletta={c} righe={righe ?? []} />;
  }

  async function partecipo() {
    setProblema(null);
    if (riga && riga.stato === "rinunciato") {
      setOccupato(true);
      try {
        await p.esegui(riga.id, { tipo: "aderisci", nome: riga.nome });
        setVista("metodo");
      } catch (e) {
        setProblema(messaggioErrore(e));
      } finally {
        setOccupato(false);
      }
      return;
    }
    setVista("nome");
  }

  function scegliMetodo(m: Metodo) {
    setMetodo(m);
    setProblema(null);
    p.esegui(pid, { tipo: "sceglieMetodo", metodo: m }).catch((e) => setProblema(messaggioErrore(e)));
  }

  async function dichiara() {
    if (!metodo) return;
    await p.esegui(pid, { tipo: "dichiara", metodo, importoCent: importo ?? undefined });
    setVista("biglietto");
  }

  async function salvaMessaggio(testo: string) {
    await p.esegui(pid, { tipo: "messaggio", testo });
    setVista("stato");
  }

  async function nonPartecipo() {
    setOccupato(true);
    setProblema(null);
    try {
      await p.aspettaIdentita();
      await p.esegui(pid, { tipo: "rinuncia", nome: nomeRinuncia });
      setVista("grazie");
    } catch (e) {
      setProblema(messaggioErrore(e));
    } finally {
      setOccupato(false);
    }
  }

  const passo: { n: 1 | 2 | 3; etichetta: string; indietro: Vista | null } | null =
    vista === "nome"
      ? { n: 1, etichetta: "Il tuo nome", indietro: "home" }
      : vista === "metodo"
        ? { n: 2, etichetta: "La tua quota", indietro: riga?.stato === "aderito" && riga.metodo ? "stato" : "home" }
        : vista === "conferma"
          ? { n: 2, etichetta: "La tua quota", indietro: "stato" }
          : vista === "biglietto"
            ? { n: 3, etichetta: "Biglietto", indietro: null }
            : null;

  return (
    <div className="flex flex-col gap-5">
      {simulato ? (
        <Avviso tono="neutro">
          <p>
            <strong>Colletta dimostrativa.</strong> Provala pure: non viene salvato nulla.
          </p>
        </Avviso>
      ) : null}
      {p.offline ? (
        <Avviso tono="attenzione" live>
          <p>Non riesco a collegarmi: riprovo da solo. Puoi continuare.</p>
        </Avviso>
      ) : null}
      {scaduta && c.stato === "aperta" && vista === "home" ? (
        <Avviso tono="attenzione">
          <p>La raccolta è scaduta, ma puoi ancora partecipare finché {c.organizzatoreNome} non la chiude.</p>
        </Avviso>
      ) : null}

      {passo ? (
        <div className="flex items-start gap-2">
          {passo.indietro ? (
            <button
              type="button"
              onClick={() => setVista(passo.indietro!)}
              aria-label="Indietro"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <Icona nome="arrow_back" />
            </button>
          ) : null}
          <Passi corrente={passo.n} etichetta={passo.etichetta} />
        </div>
      ) : null}

      <div ref={titolo} tabIndex={-1} className="flex flex-col gap-5 outline-none">
        {vista === "home" ? (
          <>
            <RisultatoVotazione colletta={c} proposte={p.proposte} voti={p.voti} />
            <Testata colletta={c} righe={righe} scaduta={scaduta} />
            {riga?.stato === "rinunciato" ? (
              <Avviso>
                <p>Hai detto che non partecipi. Se hai cambiato idea, tocca «Partecipo».</p>
              </Avviso>
            ) : null}
            <p className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
              <Icona nome="bolt" dimensione={20} className="text-cta-2" />
              Nessuna registrazione: basta il tuo nome.
            </p>
            {problema ? (
              <Avviso tono="attenzione" live>
                <p>{problema}</p>
              </Avviso>
            ) : null}
            <div className="flex flex-col items-center gap-1">
              <Bottone variante="azione" pieno onClick={() => void partecipo()} disabled={occupato}>
                Partecipo alla colletta <Icona nome="arrow_forward" dimensione={22} />
              </Bottone>
              <Bottone variante="testuale" onClick={() => setVista("rinuncia")} className="text-ink-soft">
                Non posso partecipare
              </Bottone>
            </div>
            <p className="px-4 text-center text-xs font-semibold leading-relaxed text-ink-soft">
              I soldi vanno direttamente a {c.organizzatoreNome}. Regaloop non li tocca.
            </p>
          </>
        ) : null}

        {vista === "nome" ? <PassoNome p={p} onFatto={() => setVista("metodo")} /> : null}

        {vista === "metodo" ? (
          <PassoMetodo
            p={p}
            riga={riga}
            metodo={metodo}
            onScegli={scegliMetodo}
            importo={importo}
            importoLibero={importoLibero}
            onImportoLibero={setImportoLibero}
            erroreImporto={c.modoQuota === "libera" && !importo ? "Scrivi un importo, per esempio 10 o 12,50." : null}
            onDichiara={dichiara}
            onDopo={() => setVista("stato")}
            problema={problema}
          />
        ) : null}

        {vista === "conferma" ? (
          <PassoConferma
            p={p}
            importo={importo}
            importoLibero={importoLibero}
            onImportoLibero={setImportoLibero}
            chiediImporto={c.modoQuota === "libera"}
            onSi={dichiara}
            onNo={() => setVista("stato")}
          />
        ) : null}

        {vista === "biglietto" ? (
          <PassoBiglietto
            festeggiato={c.festeggiato}
            nome={riga?.nome ?? ""}
            dichiarato={riga?.stato === "dichiarato"}
            importo={importo}
            iniziale={riga?.messaggio ?? null}
            onSalva={salvaMessaggio}
            onSalta={() => setVista("stato")}
          />
        ) : null}

        {vista === "stato" ? (
          <VistaStato
            c={c}
            riga={riga}
            righe={righe}
            scaduta={scaduta}
            importo={importo}
            onHoPagato={() => setVista(metodo ? "conferma" : "metodo")}
            onRivedi={() => setVista("metodo")}
            onMessaggio={() => setVista("biglietto")}
            onRinuncia={() => setVista("rinuncia")}
          />
        ) : null}

        {vista === "rinuncia" ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-[28px] font-bold leading-tight text-accent-2">Va bene, nessun problema</h2>
            <p className="text-ink-soft">Se vuoi, lascia il tuo nome così {c.organizzatoreNome} non ti cerca. Non è obbligatorio.</p>
            {!riga ? <Campo etichetta="Il tuo nome (facoltativo)" value={nomeRinuncia} onChange={(e) => setNomeRinuncia(e.target.value)} autoComplete="given-name" /> : null}
            {problema ? (
              <Avviso tono="attenzione" live>
                <p>{problema}</p>
              </Avviso>
            ) : null}
            <Bottone pieno onClick={() => void nonPartecipo()} disabled={occupato}>
              Confermo: non partecipo
            </Bottone>
            <Bottone pieno variante="testuale" onClick={() => setVista(riga && riga.stato !== "rinunciato" ? "stato" : "home")}>
              Torna indietro
            </Bottone>
          </div>
        ) : null}

        {vista === "grazie" ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-6 text-center shadow-carta">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent">
              <Icona nome="favorite" dimensione={28} piena />
            </span>
            <h2 className="text-2xl font-bold text-accent-2">Grazie di avercelo detto</h2>
            <p className="text-ink-soft">{c.organizzatoreNome} saprà che non ci sei. Se cambi idea, questo link resta qui.</p>
            <Bottone pieno variante="secondario" onClick={() => setVista("home")}>
              Ho cambiato idea
            </Bottone>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Chi ha partecipato (o torna sul link): il proprio stato, la raccolta, il messaggio per il biglietto. */
function VistaStato({
  c,
  riga,
  righe,
  scaduta,
  importo,
  onHoPagato,
  onRivedi,
  onMessaggio,
  onRinuncia,
}: {
  c: Colletta;
  riga: Partecipante | null;
  righe: Partecipante[] | null;
  scaduta: boolean;
  importo: number | null;
  onHoPagato: () => void;
  onRivedi: () => void;
  onMessaggio: () => void;
  onRinuncia: () => void;
}) {
  const org = c.organizzatoreNome;
  const contanti = riga?.metodo === "contanti";
  const pagamento = riga?.importoCent
    ? `${formattaEuro(riga.importoCent)}${riga.metodo ? ` con ${NOMI_METODO[riga.metodo]}` : ""}`
    : riga?.metodo
      ? NOMI_METODO[riga.metodo]
      : null;
  const puoScrivere = riga?.stato === "dichiarato" || riga?.stato === "confermato";

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="inline-flex items-center gap-1 self-start rounded-full bg-ok-field px-3 py-1 text-xs font-bold text-ok">
              <Icona nome="verified" dimensione={16} />
              Partecipazione registrata
            </p>
            <h1 className="text-[28px] font-bold leading-tight text-accent-2">
              {riga ? `Ciao ${riga.nome.split(" ")[0]}! Sei a bordo.` : "Grazie!"}
            </h1>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ok-field text-accent">
            <Icona nome="check_circle" dimensione={30} />
          </span>
        </div>

        {riga?.stato === "confermato" ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-4" role="status">
            <p className="flex items-center gap-2 font-bold">
              <Icona nome="task_alt" dimensione={20} className="text-ok" />
              Pagamento confermato{pagamento ? ` (${pagamento})` : ""}
            </p>
            <p className="pl-7 text-sm text-ink-soft">{org} ha visto arrivare la tua quota.</p>
          </div>
        ) : null}

        {riga?.stato === "dichiarato" ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-4" role="status">
            <p className="flex items-center gap-2 font-bold">
              <Icona nome="task_alt" dimensione={20} className="text-ok" />
              Pagamento dichiarato{pagamento ? ` (${pagamento})` : ""}
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Icona nome="hourglass_top" dimensione={20} />
              In attesa della conferma di {org}
            </p>
          </div>
        ) : null}

        {riga?.stato === "aderito" && riga.nota ? (
          <Avviso tono="attenzione" titolo={`${org} non ha trovato il pagamento`} live>
            <p>Controlla di averlo fatto e dichiaralo di nuovo, oppure scegli un altro modo per pagare.</p>
          </Avviso>
        ) : null}

        {riga?.stato === "aderito" && contanti ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-gold-field p-4">
            <p className="flex items-center gap-2 font-bold">
              <Icona nome="handshake" dimensione={20} />
              Hai scelto i contanti
            </p>
            <p className="pl-7 text-sm">
              Darai {importo ? formattaEuro(importo) : "la tua quota"} a {org} di persona: li segnerà quando li riceve.
            </p>
          </div>
        ) : null}

        {riga?.stato === "aderito" && !contanti ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-accent-field p-4">
            <p className="font-display text-xl font-bold text-accent-2">Hai già pagato?</p>
            <p className="text-sm">Tocca qui, così {org} non deve chiedertelo.</p>
            <Bottone pieno onClick={onHoPagato}>
              <Icona nome="check_circle" dimensione={20} />
              Sì, ho pagato
            </Bottone>
          </div>
        ) : null}

        {riga && riga.stato !== "confermato" ? (
          <button type="button" onClick={onRivedi} className="flex min-h-tocco items-center justify-center gap-1 text-sm font-bold text-cta-2">
            {riga.stato === "aderito" && !contanti ? "Rivedi come pagare" : "Hai sbagliato metodo? Cambia come pagare"}
            <Icona nome="chevron_right" dimensione={18} />
          </button>
        ) : null}
      </section>

      <RiquadroColletta colletta={c} righe={righe} scaduta={scaduta} />

      {puoScrivere ? (
        <section aria-labelledby="mio-biglietto" className="flex flex-col gap-4 rounded-3xl bg-surface-2 p-5">
          <h2 id="mio-biglietto" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
            <Icona nome="draw" className="text-cta-2" />
            Il tuo biglietto di auguri
          </h2>
          {riga?.messaggio ? (
            <blockquote className="rounded-2xl bg-surface p-4 shadow-carta">
              <p className="text-xs font-bold text-ink-soft">La tua firma: {riga.nome}</p>
              <p className="mt-2 whitespace-pre-wrap border-l-4 border-cta-field pl-3 italic">«{riga.messaggio}»</p>
            </blockquote>
          ) : (
            <p className="text-sm text-ink-soft">Lascia due righe per {c.festeggiato}: finiranno sul biglietto firmato da tutto il gruppo.</p>
          )}
          <Bottone variante="secondario" onClick={onMessaggio} className="self-end">
            <Icona nome="edit" dimensione={20} />
            {riga?.messaggio ? "Modifica dedica" : "Scrivi la dedica"}
          </Bottone>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-3xl bg-accent p-6 text-on-accent">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80">
          <Icona nome="celebration" dimensione={18} />
          Facile e senza stress
        </p>
        <h2 className="text-2xl font-bold">Stai pensando a un altro regalo di gruppo?</h2>
        <p className="text-sm opacity-90">Organizza una colletta in due minuti, senza inseguire nessuno.</p>
        <BottoneLink href="/catalogo" variante="azione" pieno className="mt-1">
          Organizza una colletta <Icona nome="arrow_forward" dimensione={22} />
        </BottoneLink>
      </section>

      {riga && riga.stato !== "confermato" ? (
        <Bottone variante="testuale" dimensione="piccolo" onClick={onRinuncia} className="self-center text-ink-soft">
          Non partecipo più
        </Bottone>
      ) : null}
      {/* la propria riga arriva dal database: se ancora non c'è, ricaricare la fa comparire */}
      {!riga ? (
        <Bottone variante="testuale" dimensione="piccolo" onClick={() => window.location.reload()} className="self-center">
          Aggiorna la pagina
        </Bottone>
      ) : null}
    </div>
  );
}
