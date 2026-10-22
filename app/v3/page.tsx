import Link from "next/link";
import { ImmagineProdotto } from "@/components/ui";
import { Icona } from "@/components/v3/Icona";
import { SimulatoreQuota } from "@/components/v3/SimulatoreQuota";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";

export const dynamic = "force-dynamic";

const AMICI_ESEMPIO = 10;

const PASSI = [
  {
    n: "01",
    etichetta: "Regalo",
    titolo: "Scegli o incolla il link",
    testo: "Dal nostro catalogo o da qualunque store online (Amazon, Decathlon, Apple). Fissa l'importo.",
  },
  {
    n: "02",
    etichetta: "Link",
    titolo: "Incolla il link nel gruppo",
    testo: "Chi lo apre vede il regalo e la sua quota. Nessuna registrazione, nessuna app da installare.",
  },
  {
    n: "03",
    etichetta: "Quote",
    titolo: "Segui chi ha versato",
    testo: "Ogni quota dichiarata ti arriva qui. Confermi con un tocco e ai ritardatari ricordiamo noi.",
  },
];

export default async function HomeV3() {
  const dati = datiServer();
  const [prodotti, colletta] = await Promise.all([dati.elencaProdotti(), dati.colletta(SLUG_DEMO)]);
  // Le «idee pronte» del simulatore e i regali in evidenza sono prodotti veri, nell'ordine del sito.
  const idee = prodotti.slice(0, 2).map((p) => ({ slug: p.slug, nome: p.nome.split(",")[0].slice(0, 28), prezzoCent: p.prezzoCent }));
  const inEvidenza = prodotti.slice(0, 2);

  return (
    <div className="flex w-full flex-col gap-space-xl">
      {/* Hero + simulatore */}
      <section className="flex flex-col gap-space-md">
        <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-tangerine-tint px-3 py-1.5 font-label-sm text-label-sm text-secondary">
          <Icona nome="bolt" dimensione={15} piena />
          <span>Colletta istantanea • Zero IBAN persi</span>
        </div>
        <h1 className="font-display-mobile text-display-mobile leading-tight tracking-tight text-primary-container">
          Chi organizza il regalo?{" "}
          <span className="block text-secondary-container">Ci pensa Regaloop.</span>
        </h1>
        <p className="font-body-md text-body-md text-text-muted">
          Basta anticipare per tutti e sollecitare su WhatsApp. Simula la quota, copia il link e riscuoti col sorriso.
        </p>

        <SimulatoreQuota idee={idee} />

        <Link href={`/c/${SLUG_DEMO}`} className="flex items-center justify-center gap-2 font-label-md text-label-md text-primary-container underline-offset-4 hover:underline">
          <Icona nome="visibility" dimensione={18} />
          <span>Vedi esempio reale da invitato</span>
        </Link>

        {colletta ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border-warm bg-surface-cream-card p-3 shadow-sm">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest-tint text-primary-container">
              <Icona nome="check_circle" dimensione={18} piena />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-md text-label-md text-primary-container">
                Una quota confermata nella colletta per {colletta.festeggiato}
              </p>
              <p className="font-body-sm text-[12px] text-text-muted">Esempio dal vivo · aprila e guarda com&apos;è fatta</p>
            </div>
            <Icona nome="thumb_up" dimensione={18} className="text-secondary-container" />
          </div>
        ) : null}
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="flex scroll-mt-24 flex-col gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary-container">Flusso ultra fluido</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">Come funziona? 3 tap e sei in festa.</h2>
        </div>
        {/* Si scorre in orizzontale, come nel layout: le tre carte restano una riga sola. */}
        <ul className="-mx-margin flex snap-x snap-mandatory gap-3 overflow-x-auto px-margin pb-2">
          {PASSI.map((p) => (
            <li
              key={p.n}
              className="flex w-[78%] flex-shrink-0 snap-start flex-col gap-2 rounded-2xl border border-border-warm bg-surface-cream-card p-space-md shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="cifre font-display text-[20px] font-bold text-secondary-container">{p.n}</span>
                <span className="rounded-full bg-forest-tint px-2.5 py-0.5 font-label-sm text-[11px] text-primary-container">{p.etichetta}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary-container">{p.titolo}</h3>
              <p className="font-body-sm text-body-sm text-text-muted">{p.testo}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Prima / dopo */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Perché zero stress</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">La fine dei drammi nelle chat di gruppo</h2>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-error-field bg-error-field p-space-md">
          <Icona nome="cancel" dimensione={20} className="mt-0.5 flex-shrink-0 text-error" />
          <div>
            <p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-error">Il solito incubo</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Excel improvvisati, IBAN dispersi tra 400 messaggi, «chi mi manda 12 euro?», imbarazzo a chiedere i soldi agli amici.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-border-warm bg-surface-cream-card p-space-md shadow-sm">
          <Icona nome="check_circle" dimensione={20} piena className="mt-0.5 flex-shrink-0 text-primary-container" />
          <div>
            <p className="flex items-center gap-2 font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary-container">
              Con Regaloop
              <span className="rounded-full bg-tangerine-tint px-2 py-0.5 text-[10px] text-secondary">1 tap</span>
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Un link solo con il contatore in tempo reale. Ognuno paga via Satispay, PayPal o bonifico diretto. Zero percentuali
              trattenute.
            </p>
          </div>
        </div>
      </section>

      {/* Biglietto */}
      <section className="flex flex-col gap-space-md rounded-3xl border border-border-warm bg-surface-cream-card p-space-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-gold-tint px-3 py-1 font-label-sm text-label-sm text-gift-gold">Incluso a 100% Gratis</span>
          <span className="flex items-center gap-1 font-label-sm text-label-sm font-bold text-secondary-container">
            <Icona nome="draw" dimensione={15} /> Biglietto Collettivo
          </span>
        </div>
        <h2 className="font-headline-md text-headline-md leading-tight text-primary-container">Bacheca di auguri firmata da tutti</h2>
        <p className="font-body-md text-body-md text-text-muted">
          Tutti lasciano una dedica con foto, GIF e sticker. Il festeggiato riceve una sorpresa animata via link alla mezzanotte.
        </p>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low p-3" aria-hidden="true">
          <div className="absolute left-2 top-4 w-44 -rotate-3 rounded-xl bg-gold-tint p-2.5 shadow-md">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-fixed text-[10px] font-bold text-on-secondary-fixed">S</span>
              <span className="font-label-sm text-[11px] text-secondary">Sara</span>
            </div>
            <p className="font-body-sm text-[12px] leading-tight text-tertiary">Tanti auguri compare! Pronti per la festa 🎉</p>
          </div>
          <div className="absolute bottom-4 right-2 w-40 rotate-2 rounded-xl bg-surface-cream-card p-2.5 shadow-md">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed">M</span>
              <span className="font-label-sm text-[11px] text-primary-container">Matteo</span>
            </div>
            <p className="font-body-sm text-[12px] leading-tight text-on-surface">«Sei il n°1!»</p>
          </div>
          <span className="absolute bottom-2 left-1/4 flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 font-label-sm text-[11px] text-on-primary shadow-lg">
            <Icona nome="auto_awesome" dimensione={13} className="text-secondary-fixed" />
            Apertura animata con coriandoli
          </span>
        </div>
        <Link
          href="/biglietto/nuovo"
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-forest-tint font-label-lg text-label-lg text-primary-container transition-colors hover:bg-surface-variant"
        >
          <Icona nome="draw" dimensione={18} />
          <span>Crea un biglietto di gruppo</span>
        </Link>
      </section>

      {/* Idee dal catalogo vero */}
      {inEvidenza.length > 0 ? (
        <section className="flex flex-col gap-space-md">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Idee che spaccano</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">I regali più scelti</h2>
            </div>
            <Link href="/v3/catalogo" className="flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-secondary-container">
              <span>Vedi tutti</span>
              <Icona nome="chevron_right" dimensione={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inEvidenza.map((p, i) => (
              <Link
                key={p.slug}
                href={`/prodotto/${p.slug}`}
                className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-border-warm bg-surface-cream-card shadow-sm"
              >
                <div className="relative h-28 w-full overflow-hidden bg-surface-container">
                  <ImmagineProdotto prodotto={p} className="h-full w-full" />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase text-on-secondary">
                    <Icona nome="local_fire_department" dimensione={12} />
                    {i === 0 ? "Trending" : "Top regalo"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 pt-0">
                  <h3 className="line-clamp-2 font-headline-sm text-[14px] leading-tight text-primary-container">{p.nome}</h3>
                  <span className="cifre font-label-lg text-label-lg text-primary-container">{formattaEuro(p.prezzoCent)}</span>
                  <span className="font-body-sm text-[12px] text-secondary">
                    ~{formattaEuro(quotaProposta(p.prezzoCent, AMICI_ESEMPIO))} a testa in {AMICI_ESEMPIO}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="flex flex-col items-center gap-space-sm pb-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-tint text-primary-container">
          <Icona nome="volunteer_activism" dimensione={20} />
        </span>
        <p className="font-headline-sm text-headline-sm text-primary-container">Regalo pronto, zero ansia e zero commissioni.</p>
        <p className="max-w-xs font-body-sm text-[12px] text-text-muted">
          Regaloop è un prototipo del progetto <strong className="font-semibold text-primary-container">Cosa Gli Regaliamo</strong>. I
          pagamenti avvengono direttamente tra organizzatore e partecipanti: noi non tocchiamo i soldi.
        </p>
        <span className="font-body-sm text-[11px] text-outline">{DICHIARAZIONE_AFFILIATO_AMAZON}</span>
      </footer>
    </div>
  );
}
