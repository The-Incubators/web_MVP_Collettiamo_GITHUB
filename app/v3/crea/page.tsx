import type { Metadata } from "next";
import { Suspense } from "react";
import { CreaV3 } from "@/components/v3/CreaV3";
import { Icona } from "@/components/v3/Icona";
import { datiServer } from "@/lib/dati";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Lancia la colletta", robots: { index: false } };

const MOTIVI = [
  { ok: false, testo: "Niente fogli Excel disordinati o note perse" },
  { ok: false, testo: "Niente inseguimenti imbarazzanti «chi manca?»" },
  { ok: true, testo: "Un tap nel gruppo: tutti sanno cosa fare e quanto versare" },
];

export default async function CreaPaginaV3({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const slug = typeof sp.prodotto === "string" ? sp.prodotto : undefined;
  // Arrivando dal catalogo di UX_V3 il regalo è già scelto: lo si mostra invece di richiederlo.
  const p = slug ? await datiServer().prodotto(slug) : null;

  return (
    <div className="flex w-full flex-col gap-space-md">
      <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-tangerine-tint px-3 py-1.5 font-label-sm text-label-sm text-secondary">
        <Icona nome="flash_on" dimensione={15} piena />
        <span>Crea in 30 secondi • Senza registrazione</span>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight tracking-tight text-primary-container">
          Lancia la colletta. <span className="text-secondary-container">Zero sbatti.</span>
        </h1>
        <p className="font-body-md text-body-md text-text-muted">
          Prepara il regalo in tre tap, guarda l&apos;anteprima del messaggio e genera il link da mandare al gruppo.
        </p>
      </div>

      <Suspense fallback={<p className="py-10 text-center text-text-muted">Un momento…</p>}>
        <CreaV3 prodottoIniziale={p ? { slug: p.slug, nome: p.nome, prezzoCent: p.prezzoCent } : undefined} />
      </Suspense>

      <section className="flex flex-col gap-3 rounded-2xl border border-border-warm bg-surface-cream-card p-space-md shadow-sm">
        <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-primary-container">
          <Icona nome="verified" dimensione={18} className="text-secondary" />
          Perché organizzarla qui
        </h2>
        <ul className="flex flex-col gap-2">
          {MOTIVI.map((m) => (
            <li key={m.testo} className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3">
              <Icona
                nome={m.ok ? "check_circle" : "cancel"}
                dimensione={18}
                piena={m.ok}
                className={`mt-0.5 flex-shrink-0 ${m.ok ? "text-primary-container" : "text-error"}`}
              />
              <span className={`font-body-sm text-body-sm ${m.ok ? "font-semibold text-primary-container" : "text-text-muted"}`}>{m.testo}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
