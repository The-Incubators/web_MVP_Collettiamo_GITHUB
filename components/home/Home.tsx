import Link from "next/link";
import { SchedaProdottoGifty } from "@/components/SchedaProdottoGifty";
import { CaricaAltriRegali } from "@/components/home/CaricaAltriRegali";
import { CLASSI_RIQUADRO_REGALO, CLASSI_SECONDARIO, PRIMI_REGALI, SchedaRegaloAmato } from "@/components/home/SchedaRegaloAmato";
import { conLikesDimostrativi } from "@/components/Stelle";
import { BottoneLink, Icona } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { PRODOTTI_GIFTY } from "@/lib/dati/prodotti-gifty";
import { stelleDi } from "@/lib/dominio/ordineCatalogo";
import type { Prodotto } from "@/lib/tipi";

/**
 * L'unica home del sito (Gifty-spec-prodotto.md S-01): titolo e tre strade (trova un regalo, biglietto, regalo di
 * gruppo), la scena fotografica e i regali più amati (`RegaliPiuAmati`: prima i prodotti Gifty, poi quelli del
 * catalogo, con le stelle del backoffice e «Guarda su Amazon», e in fondo «Carica altri prodotti», 3 alla volta).
 * La «home classica» sul regalo di gruppo, che fino al 5 novembre 2026 era una variante di questa, ora è la pagina
 * /regalo-di-gruppo (components/regalo-di-gruppo/PaginaRegaloDiGruppo.tsx).
 */

/** Un separatore fra le tre strade della home nuova; da tablet in su le strade stanno in colonna e non serve. */
function Separatore() {
  return <hr className="mx-6 border-t-2 border-line-forte md:hidden" />;
}

function AperturaNuova() {
  return (
    <section className="flex flex-col gap-6 text-center md:gap-8 md:text-left">
      {/* direzione A: titolo grande in Urbanist verde, allineato a sinistra da tablet in su */}
      <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.035em] text-accent md:text-[56px]">
        Regalare qualcosa di originale,
        <br className="hidden md:inline" /> non è mai stato così facile…
      </h1>
      <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-start md:gap-6">
        <div className="flex flex-col gap-2">
          <BottoneLink href="/regalo" variante="azione" pieno className="px-4">
            Trova un regalo originale
          </BottoneLink>
          {/* la riga sotto dice quanto ci vuole; si può toccare anche lei, ma per tastiera e lettori di schermo il link è uno solo */}
          <Link href="/regalo" tabIndex={-1} aria-hidden="true" className={`${CLASSI_SECONDARIO} py-2 leading-tight`}>
            fatti aiutare dal nostro motore di ricerca (15 sec)
          </Link>
        </div>
        <Separatore />
        <div className="flex flex-col gap-2">
          <BottoneLink href="/biglietto/nuovo" variante="azione" pieno className="px-4">
            Invia un biglietto di Auguri
          </BottoneLink>
          <Link href="/biglietto/esempio" className={CLASSI_SECONDARIO}>
            <Icona nome="visibility" dimensione={18} />
            Guarda un esempio
          </Link>
        </div>
        <Separatore />
        <div className="flex flex-col gap-2">
          <BottoneLink href="/regalo-di-gruppo" variante="azione" pieno className="px-4">
            Organizza un regalo di gruppo <Icona nome="arrow_forward" dimensione={22} />
          </BottoneLink>
          <Link href={`/c/${SLUG_DEMO}`} className={CLASSI_SECONDARIO}>
            <Icona nome="visibility" dimensione={18} />
            Guarda cosa vedranno i partecipanti
          </Link>
          <Link href="/regalo-di-gruppo" className={CLASSI_SECONDARIO}>
            Come funziona il regalo di gruppo
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * I regali in evidenza della home nuova: titolo in corsivo al centro, il cuore dei preferiti sulla foto e
 * «Guarda su Amazon» al posto di «Regala in gruppo» e della quota a testa (per il gruppo c'è /regalo-di-gruppo).
 */
function RegaliPiuAmati({
  inEvidenza,
  stelle,
  conLikes,
  ciSonoAltri,
}: {
  inEvidenza: Prodotto[];
  stelle: Record<string, number>;
  conLikes: boolean;
  ciSonoAltri: boolean;
}) {
  if (!inEvidenza.length) return null;
  return (
    <section aria-labelledby="regali-amati" className="flex flex-col gap-6">
      <Separatore />
      <h2 id="regali-amati" className="text-center font-sans text-xl font-bold italic leading-snug text-ink">
        I Regali più amati dai nostri clienti…
      </h2>
      <CaricaAltriRegali ciSonoAltri={ciSonoAltri} conLikes={conLikes}>
        {/* per primi i prodotti fatti da Gifty (lib/dati/prodotti-gifty.ts) */}
        {PRODOTTI_GIFTY.map((p) => (
          <li key={p.slug}>
            <SchedaProdottoGifty prodotto={p} conLikes={conLikes} />
          </li>
        ))}
        {inEvidenza.map((p) => (
          <li key={p.slug} className={CLASSI_RIQUADRO_REGALO}>
            <SchedaRegaloAmato prodotto={p} stelle={stelleDi(stelle, p.slug)} conLikes={conLikes} />
          </li>
        ))}
      </CaricaAltriRegali>
    </section>
  );
}

/**
 * La scena fotografica della direzione A, a tutta larghezza: due biglietti uniti dal nastro arancio.
 * Due foto approvate, una per il telefono e una per lo schermo largo. È decorativa: il testo alternativo è vuoto.
 */
function ScenaHome() {
  return (
    <picture className="block w-full">
      <source media="(min-width: 768px)" srcSet="/home/scena-desktop.jpg" width={1774} height={887} />
      <img
        src="/home/scena-mobile.jpg"
        alt=""
        width={1374}
        height={1145}
        fetchPriority="high"
        decoding="async"
        className="block h-auto w-full"
      />
    </picture>
  );
}

/** La home; le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata. */
export async function PaginaHome() {
  const dati = datiServer();
  const [prodotti, impostazioni] = await Promise.all([dati.elencaProdotti(), dati.impostazioniCatalogo()]);
  const inEvidenza = prodotti.slice(0, PRIMI_REGALI);

  return (
    <>
      {/* direzione A: titolo e tre strade, poi la scena fotografica a tutta larghezza, poi i regali */}
      <div className="gutter pt-4 sm:pt-10">
        <div className="mx-auto max-w-lg md:max-w-catalogo">
          <AperturaNuova />
        </div>
      </div>
      <div className="mt-8">
        <ScenaHome />
      </div>
      <div className="gutter pb-10 pt-4 sm:pt-10">
        <div className="mx-auto flex max-w-lg flex-col gap-8">
          <RegaliPiuAmati
            inEvidenza={inEvidenza}
            stelle={impostazioni?.stelle ?? {}}
            conLikes={conLikesDimostrativi()}
            ciSonoAltri={prodotti.length > PRIMI_REGALI}
          />
        </div>
      </div>
    </>
  );
}
