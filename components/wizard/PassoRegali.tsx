"use client";

import Link from "next/link";
import { useState } from "react";
import { CampoModulo, IconaTratto, Input, InputImporto } from "@/components/ui";
import { formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { CATALOGO_GRUPPO } from "@/lib/ux";
import { conRegaloAlVoto, conRegaloScelto, inVotazione, MAX_REGALI, senzaRegalo } from "@/lib/wizard/stato";
import type { ProdottoColletta } from "@/lib/tipi";
import { FotoRegalo } from "./Anteprima";
import type { PropsPasso } from "./tipi";

function urlValido(testo: string): boolean {
  try {
    const u = new URL(testo.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Passo 3B (prototipi/crea.html): il regalo scelto, o da 2 a 5 regali da votare. Il catalogo si apre a parte (G-02,
 * G-03): «Cambia» e «Aggiungi un altro regalo da votare» portano al catalogo del regalo di gruppo, dove la tessera ha
 * «Scegli questo regalo» e «Aggiungi al voto». «Incolla il link di un regalo» apre qui i tre campi del regalo.
 */
export function PassoRegali({ s, cambia }: PropsPasso) {
  const [link, setLink] = useState<{ aperto: boolean; url: string; nome: string; prezzo: string }>({ aperto: false, url: "", nome: "", prezzo: "" });
  const voto = inVotazione(s);
  const prezzoCent = leggiEuro(link.prezzo);
  const pronto = urlValido(link.url) && link.nome.trim().length > 0 && !!prezzoCent;

  function aggiungiDaLink() {
    if (!pronto || !prezzoCent) return;
    const regalo: ProdottoColletta = {
      prodottoId: null,
      nome: link.nome.trim().slice(0, 120),
      prezzoCent,
      consegnaGiorni: 3,
      urlEsterno: link.url.trim(),
      immagine: { seme: link.nome.trim().toLowerCase(), icona: "esperienze" },
    };
    const dopo = s.regali.length ? conRegaloAlVoto(s, regalo) : conRegaloScelto(s, regalo);
    cambia({ partenza: dopo.partenza, regali: dopo.regali });
    setLink({ aperto: false, url: "", nome: "", prezzo: "" });
  }

  return (
    <>
      <div className="elenco-regali">
        {s.regali.map((p, i) => (
          <div key={`${p.nome}-${i}`} className="regalo-scelto">
            <span className="lastra">
              <FotoRegalo p={p} />
            </span>
            <span className="n">
              {p.nome}
              <br />
              <span className="t-cifra">{formattaEuro(p.prezzoCent)}</span>
            </span>
            {voto ? (
              <button type="button" className="btn btn-quieto" onClick={() => cambia({ regali: senzaRegalo(s, i).regali })} aria-label={`Togli ${p.nome}`}>
                Togli
              </button>
            ) : (
              <Link className="btn btn-quieto" href={CATALOGO_GRUPPO} aria-label={`Cambia ${p.nome}`}>
                Cambia
              </Link>
            )}
          </div>
        ))}
        {s.regali.length < MAX_REGALI ? (
          <Link className="aggiungi-voto" href={CATALOGO_GRUPPO}>
            <IconaTratto nome="piu" />
            {s.regali.length ? "Aggiungi un altro regalo da votare" : "Scegli il regalo"}
          </Link>
        ) : null}
      </div>
      {link.aperto ? (
        <div className="da-link">
          <CampoModulo id="link-url" etichetta="Link del regalo">
            <Input id="link-url" type="url" inputMode="url" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </CampoModulo>
          <CampoModulo id="link-nome" etichetta="Nome del regalo">
            <Input id="link-nome" larghezza="nome" value={link.nome} onChange={(e) => setLink({ ...link, nome: e.target.value })} maxLength={120} />
          </CampoModulo>
          <CampoModulo id="link-prezzo" etichetta="Prezzo">
            <InputImporto id="link-prezzo" value={link.prezzo} onChange={(e) => setLink({ ...link, prezzo: e.target.value })} />
          </CampoModulo>
          <div className="riga">
            <button type="button" className="btn btn-quieto" disabled={!pronto} onClick={aggiungiDaLink}>
              <IconaTratto nome="piu" />
              Aggiungi
            </button>
          </div>
        </div>
      ) : s.regali.length < MAX_REGALI ? (
        <div className="riga">
          <button type="button" className="btn btn-quieto" onClick={() => setLink({ ...link, aperto: true })}>
            <IconaTratto nome="link" />
            Incolla il link di un regalo
          </button>
        </div>
      ) : null}
    </>
  );
}
