import { IconaTratto, ImmagineProdotto, type NomeIconaTratto } from "@/components/ui";
import type { ProdottoColletta } from "@/lib/tipi";

export interface RigheAnteprima {
  festeggiato: string;
  /** "Compleanno, 14 dicembre" */
  quando: string;
  /** null finché non si arriva al passo 3 */
  regali: ProdottoColletta[] | null;
  /** "10 € a testa"; vuota = ancora da decidere */
  quota: string | null;
  /** "10 persone nella chat", null prima del passo 5 */
  persone: string | null;
  /** "Adesioni fino al 12 dicembre, 20:00" */
  limite: string | null;
  /** "Rimborsi con PayPal, Satispay, contanti", null prima del passo 6 */
  rimborsi: string | null;
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

function Riga({ icona, children, vuota = false }: { icona: NomeIconaTratto; children: React.ReactNode; vuota?: boolean }) {
  return (
    <div>
      <dt>
        <IconaTratto nome={icona} />
      </dt>
      <dd className={vuota ? "vuota" : undefined}>{children}</dd>
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
          <Riga icona="calendario">{r.quando}</Riga>
          {r.regali === null ? (
            <Riga icona="regalo" vuota>
              Regalo o quota
            </Riga>
          ) : (
            <>
              {r.regali.length ? (
                <div>
                  <dt>
                    <IconaTratto nome="regalo" />
                  </dt>
                  <dd className="miniature">
                    {r.regali.map((p, i) => (
                      <FotoRegalo key={`${p.nome}-${i}`} p={p} />
                    ))}
                  </dd>
                </div>
              ) : null}
              <Riga icona="gruppo">{r.quota ?? "Quota"}</Riga>
            </>
          )}
          {r.persone ? (
            <>
              <Riga icona="gruppo">{r.persone}</Riga>
              {r.limite ? <Riga icona="calendario">{r.limite}</Riga> : null}
            </>
          ) : (
            <Riga icona="gruppo" vuota>
              Persone nella chat
            </Riga>
          )}
          {r.rimborsi ? (
            <Riga icona="spunta">{r.rimborsi}</Riga>
          ) : (
            <Riga icona="spunta" vuota>
              Come ti rimborsano
            </Riga>
          )}
        </dl>
        {r.organizzatore ? <span className="esempio-etichetta firma-anteprima">organizzato da {r.organizzatore}</span> : null}
      </div>
    </aside>
  );
}
