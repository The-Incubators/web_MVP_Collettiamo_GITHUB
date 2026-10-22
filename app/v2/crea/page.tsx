import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ModuloInizioColletta } from "@/components/v2/ModuloInizioColletta";
import { Icona } from "@/components/v2/Icona";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";

export const metadata: Metadata = { title: "Crea la tua colletta", robots: { index: false } };

const PASSI = [
  { numero: 1, etichetta: "Tuo Profilo" },
  { numero: 2, etichetta: "Dettagli Regalo" },
  { numero: 3, etichetta: "Condividi Link" },
];

const DOPO = [
  {
    icona: "redeem" as const,
    sfondo: "bg-forest-tint text-primary-container",
    titolo: "1. Imposti l'obiettivo o quota libera",
    testo: "Decidi l'importo totale del regalo oppure lascia a ciascun partecipante la libertà di mettere quanto vuole.",
  },
  {
    icona: "share" as const,
    sfondo: "bg-tangerine-tint text-secondary-container",
    titolo: "2. Condividi con un tap su WhatsApp",
    testo: "Ricevi subito un link accattivante e formattato, perfetto da mandare nella chat con amici e colleghi.",
  },
  {
    icona: "payments" as const,
    sfondo: "bg-gold-tint text-gift-gold",
    titolo: "3. Ricevi i soldi direttamente a te",
    testo: "Ti pagano su Satispay, PayPal, bonifico o contanti. Nessun saldo bloccato: noi teniamo il conto con un tocco.",
  },
];

export default function CreaV2() {
  return (
    <div className="flex w-full flex-col pb-10">
      <div className="my-3 flex items-center justify-center">
        <Link
          href="/v2"
          className="inline-flex items-center gap-2 rounded-full bg-gold-tint px-3 py-1.5 text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
        >
          <Icona nome="arrow_back_ios_new" dimensione={18} piena className="text-gift-gold" />
          <span className="font-label-sm text-label-sm font-bold tracking-wide">Crea in 60 secondi • Nessuna app richiesta</span>
        </Link>
      </div>

      <div className="mb-4 rounded-xl bg-surface-cream-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1 font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-secondary-container" />
            Step 1 di 3: Chi organizza
          </span>
          <span className="font-label-sm text-label-sm text-text-muted">33% completato</span>
        </div>
        <div
          className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-container"
          role="progressbar"
          aria-valuenow={33}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avanzamento della creazione"
        >
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-secondary to-secondary-container transition-all duration-500" />
        </div>
        <ol className="grid grid-cols-3 gap-2 pt-1 text-center">
          {PASSI.map((p) => {
            const attivo = p.numero === 1;
            return (
              <li key={p.numero} className={`flex flex-col items-center ${attivo ? "" : "opacity-60"}`}>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-label-sm text-[11px] font-bold ${
                    attivo ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant"
                  }`}
                  aria-current={attivo ? "step" : undefined}
                >
                  {p.numero}
                </span>
                <span className={`mt-1 font-label-sm text-[11px] ${attivo ? "font-bold text-primary-container" : "font-medium text-on-surface-variant"}`}>
                  {p.etichetta}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mb-5 px-1 text-center">
        <h1 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary-container">Inizia la tua colletta regalo</h1>
        <p className="mx-auto max-w-sm font-body-md text-body-md text-text-muted">
          Meno fogli Excel, zero ansia da anticipo. Bastano il tuo nome e un click per far partecipare tutti.
        </p>
      </div>

      <Suspense fallback={<p className="py-10 text-center text-text-muted">Un momento…</p>}>
        <ModuloInizioColletta />
      </Suspense>

      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Icona nome="verified" className="text-secondary" />
          <h2 className="font-headline-md text-[19px] font-bold text-primary-container">Cosa succede dopo? (Zero ansia)</h2>
        </div>
        <div className="flex flex-col gap-3">
          {DOPO.map((v) => (
            <div key={v.titolo} className="flex items-start gap-3.5 rounded-xl bg-surface-cream-card p-3.5 shadow-sm">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-inner ${v.sfondo}`}>
                <Icona nome={v.icona} piena />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-label-md text-label-md font-bold text-primary-container">{v.titolo}</h3>
                <p className="mt-0.5 font-body-sm text-body-sm text-text-muted">{v.testo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-forest-tint p-4 shadow-sm">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary-container shadow-sm">
          <Icona nome="shield" dimensione={20} piena />
        </div>
        <div className="flex-1 text-primary-container">
          <p className="mb-0.5 font-label-md text-label-md font-bold">Zero commissioni nascoste</p>
          <p className="font-body-sm text-body-sm leading-relaxed text-text-muted">
            I soldi non passano per conti terzi o banche straniere. I tuoi invitati pagano direttamente te attraverso i canali preferiti.
          </p>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-1 rounded-xl bg-surface-container-low p-4 text-center">
        <p className="font-label-md text-label-md font-bold text-primary-container">Regaloop è un progetto Cosa Gli Regaliamo</p>
        <p className="font-body-sm text-[11px] text-text-muted">{DICHIARAZIONE_AFFILIATO_AMAZON} Nessun costo extra per gli utenti.</p>
      </footer>
    </div>
  );
}
