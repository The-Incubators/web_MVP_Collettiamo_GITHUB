"use client";

// I passi della procedura (design.md §10.1, prototipi/crea.html): 1 per chi è, 2 le persone nella chat, 3 da dove vuoi
// iniziare, 4 la quota, il regalo o i regali da votare, 5 i rimborsi. Il riepilogo con l'accesso sta in PassoRiepilogo.

import { useState, type ReactNode } from "react";
import { CampoModulo, Chip, IconaTratto, Input, InputImporto, SceltaGrande, SpuntaRiga } from "@/components/ui";
import { aggiungiGiorni, giornoInIso, giornoRoma } from "@/lib/dominio/date";
import { formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { OCCASIONI_REGALO } from "@/lib/regalo/dati";
import type { ProdottoColletta } from "@/lib/tipi";
import { budgetPrevisto, fineVoto, MAX_PERSONE, MAX_REGALI, MIN_PERSONE, personeDivisione, quotaDaStato, senzaRegalo, type Partenza } from "@/lib/wizard/stato";
import { FotoRegalo } from "./Anteprima";
import type { PropsPasso } from "./tipi";

/** Il testo dell'errore accanto al campo; `id` lo collega al campo con aria-describedby. */
export function Errore({ id, testo }: { id: string; testo?: string }) {
  return testo ? (
    <p className="errore-testo" id={id} role="alert">
      {testo}
    </p>
  ) : null;
}

/** Il regalo con la foto, il nome, il prezzo e un'azione a destra («Cambia», «Togli»). */
export function RigaRegalo({ p, children }: { p: ProdottoColletta; children: ReactNode }) {
  return (
    <div className="regalo-scelto">
      <span className="lastra">
        <FotoRegalo p={p} />
      </span>
      <span className="n">
        {p.nome}
        <br />
        <span className="t-cifra">{formattaEuro(p.prezzoCent)}</span>
      </span>
      {children}
    </div>
  );
}

export function PassoPerChi({ s, cambia, errori, adesso }: PropsPasso) {
  return (
    <>
      <CampoModulo id="nome" etichetta="Nome" errore={errori.festeggiato}>
        <Input
          id="nome"
          larghezza="nome"
          value={s.festeggiato}
          onChange={(e) => cambia({ festeggiato: e.target.value })}
          errore={!!errori.festeggiato}
          aria-describedby={errori.festeggiato ? "nome-errore" : undefined}
          autoComplete="off"
          maxLength={60}
        />
      </CampoModulo>
      <div className="campo">
        <span className="etichetta" id="l-occ">
          Occasione
        </span>
        <div className="chips" role="radiogroup" aria-labelledby="l-occ">
          {OCCASIONI_REGALO.map((o) => (
            <Chip key={o.id} modo="radio" scelto={s.occasione === o.id} onClick={() => cambia({ occasione: o.id })}>
              {o.etichetta}
            </Chip>
          ))}
        </div>
      </div>
      <CampoModulo id="data" etichetta="Quando festeggiate" errore={errori.dataRegalo}>
        <Input
          id="data"
          type="date"
          larghezza="data"
          min={giornoInIso(aggiungiGiorni(giornoRoma(adesso), 1))}
          value={s.dataRegalo}
          onChange={(e) => cambia({ dataRegalo: e.target.value })}
          errore={!!errori.dataRegalo}
          aria-describedby={errori.dataRegalo ? "data-errore" : undefined}
        />
      </CampoModulo>
    </>
  );
}

/** Passo 2: il contatore con il numero scrivibile, «Partecipo anch'io» (D-16) e, dal prodotto, il regalo con la quota. */
export function PassoPersone({ s, cambia, errori, idTitolo, onCambiaRegalo }: PropsPasso & { idTitolo: string; onCambiaRegalo: () => void }) {
  const [testo, setTesto] = useState(String(s.chat));
  const imposta = (n: number) => {
    setTesto(String(n));
    cambia({ chat: n });
  };
  const regalo = s.daProdotto ? s.regali[0] : null;
  const quota = quotaDaStato(s);
  return (
    <>
      {regalo ? (
        <div>
          <RigaRegalo p={regalo}>
            <button type="button" className="btn btn-quieto" onClick={onCambiaRegalo}>
              Cambia<span className="sr-only"> il regalo</span>
            </button>
          </RigaRegalo>
        </div>
      ) : null}
      <div className="campo">
        <span className="contatore" role="group" aria-labelledby={idTitolo}>
          <button type="button" aria-label="Una persona in meno" disabled={s.chat <= MIN_PERSONE} onClick={() => imposta(Math.max(MIN_PERSONE, s.chat - 1))}>
            <IconaTratto nome="meno" />
          </button>
          <input
            inputMode="numeric"
            value={testo}
            aria-label="Persone nella chat"
            aria-invalid={errori.chat ? true : undefined}
            aria-describedby={errori.chat ? "chat-errore" : undefined}
            onChange={(e) => {
              const t = e.target.value.replace(/\D/g, "").slice(0, 3);
              setTesto(t);
              cambia({ chat: t ? Number(t) : 0 });
            }}
          />
          <button type="button" aria-label="Una persona in più" disabled={s.chat >= MAX_PERSONE} onClick={() => imposta(Math.min(MAX_PERSONE, s.chat + 1))}>
            <IconaTratto nome="piu" />
          </button>
        </span>
        <Errore id="chat-errore" testo={errori.chat} />
      </div>
      <SpuntaRiga checked={s.partecipo} onChange={(e) => cambia({ partecipo: e.target.checked })}>
        Partecipo anch&apos;io alla divisione
      </SpuntaRiga>
      {regalo && quota ? (
        <div className="calcolo" aria-live="polite">
          <span>Quota a testa, se aderite in {personeDivisione(s)}</span>
          <span className="t-cifra">{formattaEuro(quota)}</span>
        </div>
      ) : null}
    </>
  );
}

/** Passo 3: le tre partenze; un tocco sceglie e va avanti (design.md §10.1, decisione 4). */
export function PassoPartenza({ s, idTitolo, onPartenza }: { s: PropsPasso["s"]; idTitolo: string; onPartenza: (p: Partenza) => void }) {
  return (
    <div role="radiogroup" aria-labelledby={idTitolo} className="scelte">
      <SceltaGrande scelto={s.partenza === "adesioni"} nome="Prima le adesioni" onScegli={() => onPartenza("adesioni")}>
        Proponi una quota a testa. Il regalo lo scegliete dopo.
      </SceltaGrande>
      <SceltaGrande scelto={s.partenza === "regalo"} nome="Ho scelto il regalo" onScegli={() => onPartenza("regalo")}>
        Dal catalogo o da un link.
      </SceltaGrande>
      <SceltaGrande scelto={s.partenza === "voto"} nome="Votiamo il regalo" onScegli={() => onPartenza("voto")}>
        Da due a cinque regali: votano tutti quelli che aderiscono.
      </SceltaGrande>
    </div>
  );
}

/** Passo 4, prima le adesioni: la quota (10 € proposti) e il budget previsto (decisione 8). */
export function PassoQuota({ s, cambia, errori }: PropsPasso) {
  const budget = budgetPrevisto(s);
  return (
    <>
      <div className="campo">
        <InputImporto
          id="quota"
          value={s.quotaEuro}
          onChange={(e) => cambia({ quotaEuro: e.target.value })}
          className={`input w-importo${errori.quotaEuro ? " errore" : ""}`}
          aria-invalid={errori.quotaEuro ? true : undefined}
          aria-describedby={errori.quotaEuro ? "quota-errore" : undefined}
        />
        <Errore id="quota-errore" testo={errori.quotaEuro} />
      </div>
      <div className="calcolo" aria-live="polite">
        <span>Budget previsto, se aderite in {personeDivisione(s)}</span>
        <span className="t-cifra">{budget ? formattaEuro(budget) : "–"}</span>
      </div>
    </>
  );
}

function urlValido(testo: string): boolean {
  try {
    const u = new URL(testo.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** «Incolla un link»: link, nome e prezzo del regalo (il disegno del campo con l'anteprima non c'è ancora, §10.7). */
function DaLink({ onAggiungi }: { onAggiungi: (p: ProdottoColletta) => void }) {
  const [aperto, setAperto] = useState(false);
  const [l, setL] = useState({ url: "", nome: "", prezzo: "" });
  const prezzoCent = leggiEuro(l.prezzo);
  const pronto = urlValido(l.url) && l.nome.trim().length > 0 && !!prezzoCent;
  if (!aperto) {
    return (
      <button type="button" className="btn btn-quieto" onClick={() => setAperto(true)}>
        <IconaTratto nome="link" />
        Incolla un link
      </button>
    );
  }
  return (
    <div className="da-link">
      <CampoModulo id="link-url" etichetta="Link del regalo">
        <Input id="link-url" type="url" inputMode="url" value={l.url} onChange={(e) => setL({ ...l, url: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </CampoModulo>
      <CampoModulo id="link-nome" etichetta="Nome del regalo">
        <Input id="link-nome" larghezza="nome" value={l.nome} onChange={(e) => setL({ ...l, nome: e.target.value })} maxLength={120} />
      </CampoModulo>
      <CampoModulo id="link-prezzo" etichetta="Prezzo">
        <InputImporto id="link-prezzo" value={l.prezzo} onChange={(e) => setL({ ...l, prezzo: e.target.value })} />
      </CampoModulo>
      <div>
        <button
          type="button"
          className="btn btn-quieto"
          disabled={!pronto}
          onClick={() => {
            if (!pronto || !prezzoCent) return;
            onAggiungi({
              prodottoId: null,
              nome: l.nome.trim().slice(0, 120),
              prezzoCent,
              consegnaGiorni: 3,
              urlEsterno: l.url.trim(),
              immagine: { seme: l.nome.trim().toLowerCase(), icona: "esperienze" },
            });
            setL({ url: "", nome: "", prezzo: "" });
            setAperto(false);
          }}
        >
          <IconaTratto nome="piu" />
          Aggiungi
        </button>
      </div>
    </div>
  );
}

/** Passo 4, ho scelto il regalo: «Apri il catalogo» (il foglio si apre da solo la prima volta) o «Incolla un link». */
export function PassoRegalo({ s, errori, onApriCatalogo, onDaLink }: PropsPasso & { onApriCatalogo: () => void; onDaLink: (p: ProdottoColletta) => void }) {
  const regalo = s.regali[0];
  if (regalo) {
    return (
      <div>
        <RigaRegalo p={regalo}>
          <button type="button" className="btn btn-quieto" onClick={onApriCatalogo}>
            Cambia<span className="sr-only"> il regalo</span>
          </button>
        </RigaRegalo>
      </div>
    );
  }
  return (
    <>
      <div className="avanti">
        <button type="button" className="btn btn-primario" onClick={onApriCatalogo}>
          <IconaTratto nome="cerca" />
          Apri il catalogo
        </button>
        <DaLink onAggiungi={onDaLink} />
      </div>
      <Errore id="regali-errore" testo={errori.regali} />
    </>
  );
}

/** Passo 4, votiamo il regalo: la lista (vuota con il testo di Cri), «Aggiungi un altro regalo», «Si vota fino al». */
export function PassoVoto({ s, cambia, errori, adesso, onApriCatalogo, onDaLink }: PropsPasso & { onApriCatalogo: () => void; onDaLink: (p: ProdottoColletta) => void }) {
  const fine = fineVoto(s, adesso);
  if (s.regali.length === 0) {
    return (
      <>
        <p className="vuoto-voto">Ancora nessuna: scegli almeno due prodotti dal catalogo e clicca su &quot;Aggiungi al regalo&quot;</p>
        <div className="avanti">
          <button type="button" className="btn btn-primario" onClick={onApriCatalogo}>
            <IconaTratto nome="cerca" />
            Apri il catalogo
          </button>
          <DaLink onAggiungi={onDaLink} />
        </div>
      </>
    );
  }
  return (
    <>
      <div>
        {s.regali.map((p, i) => (
          <RigaRegalo key={`${p.nome}-${i}`} p={p}>
            <button type="button" className="btn btn-quieto" onClick={() => cambia({ regali: senzaRegalo(s, i).regali })}>
              Togli<span className="sr-only"> {p.nome}</span>
            </button>
          </RigaRegalo>
        ))}
        <Errore id="regali-errore" testo={errori.regali} />
      </div>
      {s.regali.length < MAX_REGALI ? (
        <button type="button" className="aggiungi-voto" onClick={onApriCatalogo}>
          <IconaTratto nome="piu" />
          Aggiungi un altro regalo
        </button>
      ) : null}
      <div className="campo">
        <span className="etichetta" id="l-fine">
          Si vota fino al
        </span>
        <div className="riga" role="group" aria-labelledby="l-fine">
          <Input
            type="date"
            larghezza="data"
            aria-label="Data di fine della votazione"
            min={giornoInIso(giornoRoma(adesso))}
            value={fine.data}
            onChange={(e) => cambia({ fineVotoData: e.target.value, fineVotoOra: fine.ora })}
            errore={!!errori.fineVoto}
            aria-describedby={errori.fineVoto ? "fine-errore" : undefined}
          />
          <Input
            type="time"
            larghezza="ora"
            aria-label="Ora di fine della votazione"
            value={fine.ora}
            onChange={(e) => cambia({ fineVotoData: fine.data, fineVotoOra: e.target.value })}
            errore={!!errori.fineVoto}
            aria-describedby={errori.fineVoto ? "fine-errore" : undefined}
          />
        </div>
        <Errore id="fine-errore" testo={errori.fineVoto} />
      </div>
    </>
  );
}

export function PassoRimborsi({ s, cambia, errori }: PropsPasso) {
  return (
    <div>
      <div className="metodo">
        <SpuntaRiga checked={s.paypalAttivo} onChange={(e) => cambia({ paypalAttivo: e.target.checked })}>
          PayPal
        </SpuntaRiga>
        {s.paypalAttivo ? (
          <>
            <Input
              aria-label="Il tuo link PayPal"
              value={s.paypal}
              onChange={(e) => cambia({ paypal: e.target.value })}
              errore={!!errori.paypal}
              aria-describedby={errori.paypal ? "paypal-errore" : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <Errore id="paypal-errore" testo={errori.paypal} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.satispayAttivo} onChange={(e) => cambia({ satispayAttivo: e.target.checked })}>
          Satispay
        </SpuntaRiga>
        {s.satispayAttivo ? (
          <>
            <Input
              type="tel"
              inputMode="tel"
              aria-label="Numero di telefono Satispay"
              value={s.satispay}
              onChange={(e) => cambia({ satispay: e.target.value })}
              errore={!!errori.satispay}
              aria-describedby={errori.satispay ? "satispay-errore" : undefined}
              autoComplete="tel"
            />
            <Errore id="satispay-errore" testo={errori.satispay} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.bonificoAttivo} onChange={(e) => cambia({ bonificoAttivo: e.target.checked })}>
          Bonifico
        </SpuntaRiga>
        {s.bonificoAttivo ? (
          <>
            <Input
              aria-label="IBAN"
              value={s.iban}
              onChange={(e) => cambia({ iban: e.target.value.toUpperCase() })}
              errore={!!errori.iban}
              aria-describedby={errori.iban ? "iban-errore" : undefined}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <Errore id="iban-errore" testo={errori.iban} />
            <Input
              aria-label="Intestatario del conto"
              value={s.intestatario}
              onChange={(e) => cambia({ intestatario: e.target.value })}
              errore={!!errori.intestatario}
              aria-describedby={errori.intestatario ? "intestatario-errore" : undefined}
              autoComplete="name"
            />
            <Errore id="intestatario-errore" testo={errori.intestatario} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.contantiAttivo} onChange={(e) => cambia({ contantiAttivo: e.target.checked })}>
          Contanti
        </SpuntaRiga>
      </div>
      <Errore id="metodi-errore" testo={errori.metodi} />
    </div>
  );
}
