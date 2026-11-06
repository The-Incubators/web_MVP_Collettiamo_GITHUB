import type { Metadata } from "next";
import Link from "next/link";
import { IconaTratto, ImmagineProdotto } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fai un regalo",
  description: "Regalalo tu, oppure fallo insieme agli altri e dividete la spesa.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * «Fai un regalo» (revisione di Cri, 6 novembre 2026): il bivio fra il regalo personale e il regalo di gruppo.
 * Da una tessera o dalla scheda arriva con `?prodotto=`: il regalo resta in vista e porta le due strade già scelte
 * (Amazon per chi lo regala da solo, il wizard con il regalo per il gruppo). Niente biglietto qui: si sceglie solo se regalarlo da
 * soli o in gruppo (Cri, 6 nov). Senza prodotto, la strada personale porta alle idee regalo e quella di gruppo al wizard vuoto.
 */
export default async function PaginaFaiUnRegalo({ searchParams }: Props) {
  const v = (await searchParams).prodotto;
  const slug = typeof v === "string" ? v : undefined;
  const trovato = slug ? await datiServer().prodotto(slug) : null;
  const p = trovato && trovato.attivo ? trovato : null;
  const crea = p ? `/crea?prodotto=${encodeURIComponent(p.slug)}` : "/crea";

  return (
    <div className="fondo">
      <div className="pagina bivio">
        {p ? (
          <Link className="bivio-regalo" href={`/prodotto/${p.slug}`}>
            <span className="lastra">
              {p.immagine.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.immagine.foto} alt="" />
              ) : (
                <ImmagineProdotto prodotto={p} alt="" />
              )}
            </span>
            <span className="bivio-nome">{p.nome}</span>
            <span className="prezzo">{formattaEuro(p.prezzoCent)}</span>
          </Link>
        ) : null}

        <h1 className="t-pagina">Come lo vuoi regalare?</h1>

        <div className="bivio-strade">
          <article className="porta">
            <div className="segno" aria-hidden="true">
              <IconaTratto nome="regalo" />
            </div>
            <h2>Lo regalo io</h2>
            <p>
              {p
                ? "Lo compri su Amazon e arriva a casa tua o del festeggiato."
                : "Ti aiutiamo a trovare l'idea giusta: quattro domande o il nostro catalogo."}
            </p>
            {p ? (
              <a className="btn btn-primario" href={urlPerAcquisto(p.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO}>
                Compralo su Amazon
                <IconaTratto nome="esterno" />
                <span className="sr-only"> (si apre in una nuova scheda)</span>
              </a>
            ) : (
              <Link className="btn btn-primario" href="/idee">
                Trova un&apos;idea regalo
              </Link>
            )}
          </article>

          <article className="porta">
            <div className="segno" aria-hidden="true">
              <div className="mini-ini">
                <span style={{ background: "var(--c1)" }} />
                <span style={{ background: "var(--c3)" }} />
                <span style={{ background: "var(--c4)" }} />
                <span style={{ background: "var(--c2)" }} />
              </div>
            </div>
            <h2>Lo regaliamo in gruppo</h2>
            <p>Mandi il link nella chat, chi vuole aderisce e tu tieni il conto di chi ti ha dato la quota.</p>
            <Link className="btn btn-primario" href={crea}>
              Organizza un regalo di gruppo
            </Link>
          </article>
        </div>
      </div>
    </div>
  );
}
