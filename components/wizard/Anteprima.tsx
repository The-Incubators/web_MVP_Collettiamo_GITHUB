import { IconaTratto, ImmagineProdotto, type NomeIconaTratto } from "@/components/ui";
import type { ProdottoColletta } from "@/lib/tipi";

/** Una riga del biglietto: il testo deciso, oppure in grigio il nome di quello che manca. */
export type RigaCarta = { testo: string; vuota?: boolean };

export interface RigheAnteprima {
  festeggiato: string;
  /** "Compleanno, 14 dicembre" */
  quando: string;
  /** "10 persone nella chat", o vuota «Persone nella chat» */
  persone: RigaCarta;
  /** la quota, oppure le miniature del regalo o dei regali da votare */
  cosa: RigaCarta | ProdottoColletta[];
  /** "Rimborsi con PayPal", o vuota «Come ti rimborsano» */
  rimborsi: RigaCarta;
  /** il nome di chi organizza, se ha già un account */
  organizzatore: string | null;
}

/** La foto del regalo in `multiply` (il fondo bianco sparisce), o l'illustrazione per i regali incollati da un link. */
export function FotoRegalo({ p }: { p: ProdottoColletta }) {
  return p.immagine.foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.immagine.foto} alt="" />
  ) : (
    <ImmagineProdotto prodotto={p} alt="" className="aspect-square" />
  );
}

function Riga({ icona, r }: { icona: NomeIconaTratto; r: RigaCarta }) {
  return (
    <div>
      <dt>
        <IconaTratto nome={icona} />
      </dt>
      <dd className={r.vuota ? "vuota" : undefined}>{r.testo}</dd>
    </div>
  );
}

/**
 * Il biglietto che si scrive mentre rispondi (prototipi/crea.html, design.md §4 «Biglietto»): a destra da 900 px,
 * nascosto sul telefono. Le righe non ancora decise restano in grigio con il nome di quello che manca.
 */
export function Anteprima({ r }: { r: RigheAnteprima }) {
  return (
    <aside className="anteprima" aria-label="Anteprima del regalo di gruppo">
      <div className="carta">
        <p className="mano">Il regalo di gruppo per {r.festeggiato.trim() || "…"}</p>
        <dl>
          <Riga icona="calendario" r={{ testo: r.quando }} />
          <Riga icona="gruppo" r={r.persone} />
          {Array.isArray(r.cosa) ? (
            <div>
              <dt>
                <IconaTratto nome="regalo" />
              </dt>
              <dd className="miniature">
                {r.cosa.map((p, i) => (
                  <FotoRegalo key={`${p.nome}-${i}`} p={p} />
                ))}
              </dd>
            </div>
          ) : (
            <Riga icona="regalo" r={r.cosa} />
          )}
          <Riga icona="spunta" r={r.rimborsi} />
        </dl>
        {r.organizzatore ? <span className="esempio-etichetta firma-anteprima">organizzato da {r.organizzatore}</span> : null}
      </div>
    </aside>
  );
}
