"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IndicatorePassi } from "@/components/ui";
import { leggiLocale, scriviLocale } from "@/lib/auth/tipi";
import { alGiorno, dataBreve, giornoDaIso, istanteRoma } from "@/lib/dominio/date";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { daProdotto } from "@/lib/dominio/regali";
import { generaSlugLibero } from "@/lib/dominio/slug";
import { leggiLista, svuotaRegali } from "@/lib/listaRegali";
import { etichettaOccasione } from "@/lib/regalo/dati";
import { CATALOGO_GRUPPO } from "@/lib/ux";
import {
  aperturaDaStato,
  campiDaStato,
  CHIAVE_WIZARD,
  conRegaloAlVoto,
  conRegaloScelto,
  erroriPasso,
  inVotazione,
  leggiStato,
  limitePredefinito,
  nuovaColletta,
  occasioneValida,
  primoPassoConErrori,
  scadenzaDaStato,
  statoDaColletta,
  statoIniziale,
  testoMetodi,
  testoQuota,
  TOTALE_PASSI,
  type Errori,
  type Passo,
  type StatoWizard,
} from "@/lib/wizard/stato";
import { Anteprima, type RigheAnteprima } from "./Anteprima";
import { PassoAccesso } from "./PassoAccesso";
import { CHIAVE_CHAT_CREATO, PassoCondividi } from "./PassoCondividi";
import { PassoChat, PassoPartenza, PassoPerChi, PassoQuota, PassoRimborsi } from "./PassiDati";
import { PassoRegali } from "./PassoRegali";

const ora = (ms: number) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms));

function titoloPasso(s: StatoWizard): string {
  switch (s.passo) {
    case 1:
      return "Per chi è il regalo?";
    case 2:
      return "Da dove vuoi iniziare?";
    case 3:
      return s.partenza === "adesioni" ? "Quanto chiedi a testa?" : inVotazione(s) ? "I regali da votare" : "Il regalo";
    case 4:
      return "Chi c'è nella chat?";
    case 5:
      return "Come ti rimborsano?";
    default:
      return "Accedi per creare il regalo di gruppo";
  }
}

/** Le righe del biglietto dell'anteprima: si scrivono passo dopo passo, come nel prototipo. */
function righe(s: StatoWizard, organizzatore: string | null): RigheAnteprima {
  const giorno = giornoDaIso(s.dataRegalo);
  const occasione = etichettaOccasione(s.occasione);
  const scadenza = scadenzaDaStato(s);
  const voto = inVotazione(s);
  return {
    festeggiato: s.festeggiato,
    quando: giorno ? `${occasione}, ${dataBreve(istanteRoma(giorno, 12))}` : occasione,
    regali: s.passo >= 3 ? (s.partenza === "regalo" ? s.regali : []) : null,
    quota: s.passo >= 4 || s.partenza !== "regalo" ? (voto ? "Quota secondo il regalo votato" : testoQuota(s)) : null,
    persone: s.passo >= 5 ? `${s.chat} persone nella chat` : null,
    limite: s.passo >= 5 && scadenza !== null ? `Adesioni fino ${alGiorno(scadenza)}, ${ora(scadenza)}` : null,
    rimborsi: s.passo >= 6 && testoMetodi(s) ? `Rimborsi con ${testoMetodi(s)}` : null,
    organizzatore,
  };
}

/** /crea: il wizard, oppure (con `?creato=`) il passo per mandare il link nella chat. */
export function Crea() {
  const creato = useSearchParams().get("creato");
  return creato ? <PassoCondividi slug={creato} /> : <Wizard />;
}

function Wizard() {
  const { dati, utente, pronto } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [adesso] = useState(() => Date.now());
  const [s, setS] = useState<StatoWizard | null>(null);
  const [errori, setErrori] = useState<Errori>({});
  const [occupato, setOccupato] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const avviato = useRef(false);
  const creando = useRef(false);

  // Avvio: il lavoro salvato nel browser, più quello che arriva dall'indirizzo (un regalo dal catalogo o dalla scheda,
  // la lista del vecchio catalogo, una bozza, l'occasione dal biglietto, le persone). Poi l'indirizzo torna /crea.
  useEffect(() => {
    if (!pronto || avviato.current) return;
    avviato.current = true;
    const uid = utente?.uid ?? null;
    const salvato = leggiStato(leggiLocale(CHIAVE_WIZARD), uid);
    const bozza = params.get("bozza");
    const scegli = params.get("scegli");
    const vota = params.get("vota");
    const prodotto = params.get("prodotto");
    const lista = params.get("lista") === "1";

    (async () => {
      let st = salvato ?? statoIniziale(uid);
      try {
        if (bozza) {
          // Le bozze del wizard di prima: si riaprono solo con l'account di chi le ha create.
          if (!utente) {
            router.replace(`/accedi?next=${encodeURIComponent(`/crea?bozza=${bozza}`)}`);
            return;
          }
          const c = await dati.colletta(bozza);
          if (c && c.organizzatoreUid === utente.uid && c.stato === "bozza") {
            const candidati = c.votazione
              ? (await dati.proposte(bozza))
                  .filter((p) => p.daOrganizzatore)
                  .sort((x, y) => x.creatoIl - y.creatoIl)
                  .map((p) => p.prodotto)
              : [];
            st = statoDaColletta(c, utente.uid, candidati);
          }
        } else if (lista) {
          const l = leggiLista();
          if (l.length) {
            st = l.reduce(conRegaloAlVoto, { ...st, regali: [] });
            svuotaRegali();
            st = { ...st, passo: primoPassoConErrori(st, 2, adesso) ?? 3 };
          }
        } else if (scegli || vota || prodotto) {
          const p = await dati.prodotto((scegli ?? vota ?? prodotto) as string);
          if (p) {
            const regalo = daProdotto(p);
            if (vota) st = conRegaloAlVoto(st, regalo);
            else st = conRegaloScelto(st, regalo);
            // Dal catalogo del wizard si torna ai regali; dalla scheda o dalle idee si parte da «Per chi è il regalo?»
            // e il passo 2 mostra il regalo già scelto (I-08).
            st = { ...st, passo: scegli || vota ? (primoPassoConErrori(st, 2, adesso) ?? 3) : (primoPassoConErrori(st, 1, adesso) ?? 2) };
          }
        }
      } catch {
        /* si riparte dal lavoro salvato o da zero */
      }
      if (!salvato) {
        const occasione = occasioneValida(params.get("occasione"));
        const persone = Math.round(Number(params.get("persone")));
        if (occasione) st = { ...st, occasione };
        if (Number.isFinite(persone) && persone >= 2) st = { ...st, chat: Math.min(200, persone) };
      }
      setS(st);
      if ([...params.keys()].length) router.replace("/crea", { scroll: false });
    })();
  }, [pronto, utente, params, dati, adesso, router]);

  useEffect(() => {
    if (s) scriviLocale(CHIAVE_WIZARD, JSON.stringify(s));
  }, [s]);

  // Chi accede a metà strada diventa il proprietario del lavoro salvato.
  useEffect(() => {
    if (utente && s && s.uid !== utente.uid) setS({ ...s, uid: utente.uid });
  }, [utente, s]);

  // A ogni cambio di passo il titolo prende il focus: tastiera e lettori di schermo sanno dove sono.
  const passo = s?.passo;
  const primo = useRef(true);
  useEffect(() => {
    if (!passo) return;
    if (primo.current) {
      primo.current = false;
      return;
    }
    titolo.current?.focus();
  }, [passo]);

  const cambia = useCallback((patch: Partial<StatoWizard>) => {
    setS((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const crea = useCallback(
    async (corrente: StatoWizard) => {
      if (!utente) return;
      const istante = Date.now();
      const daCorreggere = primoPassoConErrori(corrente, 5, istante);
      if (daCorreggere) {
        setErrori(erroriPasso(corrente, daCorreggere, istante));
        setS({ ...corrente, passo: daCorreggere });
        creando.current = false;
        return;
      }
      setOccupato(true);
      setProblema(null);
      try {
        let slug = corrente.slug;
        if (slug) {
          await dati.aggiornaColletta(slug, campiDaStato(corrente, utente.nome, istante));
        } else {
          slug = await generaSlugLibero(async (x) => !(await dati.slugLibero(x)));
          await dati.creaColletta(nuovaColletta(corrente, { slug, uid: utente.uid, organizzatoreNome: utente.nome, adesso: istante }));
        }
        if (inVotazione(corrente) || corrente.slug) await dati.impostaProposteIniziali(slug, inVotazione(corrente) ? corrente.regali : []);
        await dati.aggiornaColletta(slug, aperturaDaStato(corrente, istante));
        scriviLocale(CHIAVE_WIZARD, null);
        try {
          window.sessionStorage.setItem(CHIAVE_CHAT_CREATO, JSON.stringify({ slug, chat: corrente.chat }));
        } catch {
          /* il numero della chat è solo per il biglietto dell'anteprima */
        }
        router.replace(`/crea?creato=${slug}`);
      } catch (err) {
        setProblema(err instanceof ErroreDominio ? err.message : "Le modifiche non sono state salvate");
        setOccupato(false);
        creando.current = false;
      }
    },
    [utente, dati, router],
  );

  // Al passo 6, appena c'è l'account (Google, o il collegamento via email che riporta qui), il gruppo si crea da solo.
  useEffect(() => {
    if (s?.passo === 6 && utente && !creando.current && !problema) {
      creando.current = true;
      void crea(s);
    }
  }, [s, utente, crea, problema]);

  if (!s) {
    return (
      <div className="pagina wizard">
        <p role="status" className="muted attesa">
          Un momento…
        </p>
      </div>
    );
  }

  const stato = s;

  function avanti() {
    const e = erroriPasso(stato, stato.passo, adesso);
    setErrori(e);
    setProblema(null);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('.modulo [aria-invalid="true"]');
        el?.focus();
      });
      return;
    }
    if (stato.passo === 2 && stato.partenza === "regalo" && stato.regali.length === 0) {
      // Nessun regalo ancora: si sceglie dal catalogo, che riporta al passo 3 con «Scegli questo regalo».
      setS({ ...stato, passo: 3 });
      router.push(CATALOGO_GRUPPO);
      return;
    }
    if (stato.passo === 3) {
      setS({ ...stato, passo: 4, limiteData: stato.limiteToccato && stato.limiteData ? stato.limiteData : limitePredefinito(stato, adesso) });
      return;
    }
    if (stato.passo === 5) {
      if (utente) void crea(stato);
      else setS({ ...stato, passo: 6 });
      return;
    }
    setS({ ...stato, passo: (stato.passo + 1) as Passo });
  }

  function indietro() {
    setErrori({});
    setProblema(null);
    creando.current = false;
    setS({ ...stato, passo: (stato.passo - 1) as Passo });
  }

  const props = { s: stato, cambia, errori, adesso };
  const bloccato = (stato.passo === 2 && !stato.partenza) || (stato.passo === 3 && stato.partenza === "regalo" && stato.regali.length === 0);

  return (
    <div className="pagina wizard">
      <div className="modulo">
        <IndicatorePassi
          passo={stato.passo}
          totale={TOTALE_PASSI}
          indietroHref={stato.passo === 1 ? "/regalo-di-gruppo" : undefined}
          onIndietro={stato.passo > 1 ? indietro : undefined}
          etichettaIndietro="Torna al passo precedente"
        />
        <h1 ref={titolo} tabIndex={-1} className="t-pagina">
          {titoloPasso(stato)}
        </h1>
        {stato.passo === 6 ? (
          utente ? (
            <div className="accesso">
              {problema ? (
                <>
                  <p className="errore-testo" role="alert">
                    {problema}
                  </p>
                  <div className="avanti">
                    <button
                      type="button"
                      className="btn btn-primario"
                      onClick={() => {
                        creando.current = true;
                        void crea(stato);
                      }}
                    >
                      Riprova
                    </button>
                  </div>
                </>
              ) : (
                <p role="status" className="muted" aria-busy="true">
                  Un momento…
                </p>
              )}
            </div>
          ) : (
            <PassoAccesso />
          )
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              avanti();
            }}
          >
            {stato.passo === 1 ? <PassoPerChi {...props} /> : null}
            {stato.passo === 2 ? <PassoPartenza {...props} /> : null}
            {stato.passo === 3 && stato.partenza === "adesioni" ? <PassoQuota {...props} /> : null}
            {stato.passo === 3 && stato.partenza !== "adesioni" ? <PassoRegali {...props} /> : null}
            {stato.passo === 4 ? <PassoChat {...props} /> : null}
            {stato.passo === 5 ? <PassoRimborsi {...props} /> : null}
            <div className="avanti">
              <button type="submit" className="btn btn-primario" disabled={bloccato || occupato} aria-busy={occupato || undefined}>
                Continua
              </button>
            </div>
            {problema ? (
              <p className="errore-testo" role="alert">
                {problema}
              </p>
            ) : null}
          </form>
        )}
      </div>
      <Anteprima r={righe(stato, utente?.nome || null)} />
    </div>
  );
}
