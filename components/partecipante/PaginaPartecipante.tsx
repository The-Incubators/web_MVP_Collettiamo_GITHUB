"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avviso, Barra, Bottone, Campo, IconaIndietro } from "@/components/ui";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { avanzamento } from "@/lib/dominio/partecipanti";
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
import { Testata, testoPartecipazione } from "./Testata";
import { usePartecipazione } from "./usePartecipazione";

type Vista = "home" | "nome" | "metodo" | "conferma" | "biglietto" | "fine" | "stato" | "rinuncia" | "grazie";

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
    if (vista !== "home") titolo.current?.focus();
  }, [vista]);

  const importo = useMemo(() => (c.modoQuota === "libera" ? leggiEuro(importoLibero) : quotaEffettiva(c)), [c, importoLibero]);
  const a = avanzamento(c);

  const messaggioErrore = (e: unknown) =>
    e instanceof ErroreDominio ? e.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.";

  if (votazioneInCorso(c)) return <VotazioneGruppo p={p} />;

  if (c.stato === "chiusa") {
    return <Rendiconto colletta={c} righe={p.righe ?? righeIniziali ?? []} />;
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
    setVista("fine");
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

  const compatta = vista !== "home" && vista !== "stato" && vista !== "fine" && vista !== "grazie";
  const indietro: Vista | null = vista === "nome" ? "home" : vista === "metodo" ? "home" : vista === "rinuncia" ? "home" : null;

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
          <p>
            La raccolta è scaduta, ma puoi ancora partecipare finché {c.organizzatoreNome} non la chiude.
          </p>
        </Avviso>
      ) : null}

      {compatta ? (
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          {indietro ? (
            <Bottone variante="testuale" dimensione="piccolo" onClick={() => setVista(indietro)}>
              <IconaIndietro width={16} height={16} /> Indietro
            </Bottone>
          ) : (
            <span />
          )}
          <p className="min-w-0 truncate text-sm text-ink-soft">
            Regalo per {c.festeggiato} ·{" "}
            <span className="cifre font-bold text-ink">{importo ? formattaEuro(importo) : formattaEuro(c.quotaCent)}</span>
          </p>
        </div>
      ) : null}

      <div ref={titolo} tabIndex={-1} className="flex flex-col gap-5 outline-none">
        {vista === "home" ? (
          <>
            <RisultatoVotazione colletta={c} proposte={p.proposte} voti={p.voti} />
            <Testata colletta={c} scaduta={scaduta} />
            {riga?.stato === "rinunciato" ? (
              <Avviso>
                <p>Hai detto che non partecipi. Se hai cambiato idea, tocca «Partecipo».</p>
              </Avviso>
            ) : null}
            {problema ? <Avviso tono="attenzione" live><p>{problema}</p></Avviso> : null}
            <div className="flex flex-col items-center gap-1">
              <Bottone pieno onClick={() => void partecipo()} disabled={occupato}>
                Partecipo
              </Bottone>
              <Bottone variante="testuale" dimensione="piccolo" onClick={() => setVista("rinuncia")}>
                Non partecipo
              </Bottone>
            </div>
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
            onPagato={() => setVista("conferma")}
            onContanti={() => setVista("fine")}
          />
        ) : null}
        {vista === "metodo" && problema ? <Avviso tono="attenzione" live><p>{problema}</p></Avviso> : null}

        {vista === "conferma" ? (
          <PassoConferma p={p} importo={importo} importoLibero={importoLibero} onImportoLibero={setImportoLibero} onSi={dichiara} onNo={() => setVista("fine")} />
        ) : null}

        {vista === "biglietto" ? (
          <PassoBiglietto festeggiato={c.festeggiato} iniziale={riga?.messaggio ?? null} onSalva={salvaMessaggio} onSalta={() => setVista("fine")} />
        ) : null}

        {vista === "stato" && riga ? (
          <>
            <Testata colletta={c} scaduta={scaduta} />
            <VistaStato
              c={c}
              riga={riga}
              importo={importo}
              onHoPagato={() => setVista(metodo ? "conferma" : "metodo")}
              onRivedi={() => setVista("metodo")}
              onMessaggio={() => setVista("biglietto")}
              onRinuncia={() => setVista("rinuncia")}
            />
          </>
        ) : null}

        {vista === "fine" ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl leading-tight">Grazie{riga ? `, ${riga.nome}` : ""}!</h2>
            {riga?.stato === "dichiarato" ? (
              <p className="text-lg">Hai dichiarato il pagamento. {c.organizzatoreNome} lo confermerà appena lo vede arrivare.</p>
            ) : riga?.metodo === "contanti" ? (
              <p className="text-lg">{c.organizzatoreNome} segnerà i tuoi contanti quando li riceve.</p>
            ) : (
              <p className="text-lg">Quando hai pagato, torna su questo link e tocca «Ho pagato»: ci vuole un attimo.</p>
            )}
            <div className="flex flex-col gap-2 rounded-contenitore border border-line bg-surface p-4">
              <Barra percento={a.percento} etichetta="Avanzamento della raccolta" alta />
              <p className="text-sm">{testoPartecipazione(c)}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-contenitore border border-accent bg-accent-field p-4">
              <p className="font-semibold">Organizzi anche tu un regalo di gruppo?</p>
              <Link href="/catalogo" className="min-h-tocco font-semibold text-accent-2 underline underline-offset-4">
                Organizza la prossima colletta
              </Link>
            </div>
            {riga && riga.stato !== "confermato" ? (
              <Bottone variante="testuale" onClick={() => setVista("stato")}>
                Vedi il mio stato
              </Bottone>
            ) : null}
          </div>
        ) : null}

        {vista === "rinuncia" ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl">Va bene, nessun problema</h2>
            <p className="text-ink-soft">Se vuoi, lascia il tuo nome così {c.organizzatoreNome} non ti cerca. Non è obbligatorio.</p>
            {!riga ? <Campo etichetta="Il tuo nome (facoltativo)" value={nomeRinuncia} onChange={(e) => setNomeRinuncia(e.target.value)} autoComplete="given-name" /> : null}
            {problema ? <Avviso tono="attenzione" live><p>{problema}</p></Avviso> : null}
            <Bottone pieno onClick={() => void nonPartecipo()} disabled={occupato}>
              Confermo: non partecipo
            </Bottone>
            <Bottone pieno variante="testuale" onClick={() => setVista(riga ? "stato" : "home")}>
              Torna indietro
            </Bottone>
          </div>
        ) : null}

        {vista === "grazie" ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">Grazie di avercelo detto</h2>
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

function VistaStato({
  c,
  riga,
  importo,
  onHoPagato,
  onRivedi,
  onMessaggio,
  onRinuncia,
}: {
  c: Colletta;
  riga: Partecipante;
  importo: number | null;
  onHoPagato: () => void;
  onRivedi: () => void;
  onMessaggio: () => void;
  onRinuncia: () => void;
}) {
  const contanti = riga.metodo === "contanti";
  return (
    <div className="flex flex-col gap-4">
      {riga.stato === "confermato" ? (
        <Avviso tono="positivo" titolo="Il tuo pagamento è confermato" live>
          <p>Grazie, {riga.nome}! {c.organizzatoreNome} ha visto arrivare la tua quota.</p>
        </Avviso>
      ) : null}
      {riga.stato === "dichiarato" ? (
        <Avviso tono="neutro" titolo="Hai dichiarato il pagamento" live>
          <p>
            {riga.importoCent ? `${formattaEuro(riga.importoCent)}${riga.metodo ? ` con ${NOMI_METODO[riga.metodo]}` : ""}. ` : ""}
            {c.organizzatoreNome} lo confermerà appena lo vede arrivare.
          </p>
        </Avviso>
      ) : null}
      {riga.stato === "aderito" && riga.nota ? (
        <Avviso tono="attenzione" titolo={`${c.organizzatoreNome} non ha trovato il pagamento`} live>
          <p>Controlla di averlo fatto e dichiaralo di nuovo, oppure scegli un altro modo per pagare.</p>
        </Avviso>
      ) : null}

      {riga.stato === "aderito" ? (
        <div className="flex flex-col gap-3 rounded-contenitore border border-accent bg-accent-field p-4">
          {contanti ? (
            <>
              <p className="font-semibold">Hai scelto i contanti</p>
              <p>Darai {importo ? formattaEuro(importo) : "la tua quota"} a {c.organizzatoreNome} di persona: li segnerà lui.</p>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold">Hai già pagato?</p>
              <p>Tocca qui, così {c.organizzatoreNome} non deve chiedertelo.</p>
              <Bottone pieno onClick={onHoPagato}>
                Sì, ho pagato
              </Bottone>
            </>
          )}
          <Bottone pieno variante="secondario" onClick={onRivedi}>
            {contanti ? "Cambia modo di pagare" : "Rivedi come pagare"}
          </Bottone>
        </div>
      ) : null}

      {riga.stato === "dichiarato" || riga.stato === "confermato" ? (
        <Bottone pieno variante="secondario" onClick={onMessaggio}>
          {riga.messaggio ? "Modifica il tuo messaggio per il biglietto" : "Lascia due righe per il biglietto"}
        </Bottone>
      ) : null}

      {riga.stato !== "confermato" ? (
        <Bottone variante="testuale" dimensione="piccolo" onClick={onRinuncia}>
          Non partecipo più
        </Bottone>
      ) : null}
    </div>
  );
}

