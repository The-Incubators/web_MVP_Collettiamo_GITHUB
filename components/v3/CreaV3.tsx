"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icona } from "@/components/v3/Icona";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";

/**
 * La creazione di UX_V3: i tre passi dei layout stanno in una pagina sola.
 *
 * Qui si **prepara** la colletta — festeggiato, budget, partecipanti, metodi di pagamento — e si vede
 * l'anteprima del messaggio. A crearla davvero è il wizard (`/crea`), che riceve tutto già compilato:
 * è lui che fa l'accesso, lo slug, la scrittura su Firestore e la raccolta dei dati di pagamento (il
 * tuo nome su Satispay, l'IBAN…), che qui non ha senso chiedere. Rifarlo sarebbe duplicare la parte
 * più delicata del sito in un secondo posto.
 */

type Fonte = "link" | "catalogo" | "libera";

const METODI = [
  { id: "satispay", nome: "Satispay", sigla: "S", colore: "bg-[#f94c43] text-white" },
  { id: "paypal", nome: "PayPal.me", sigla: "P", colore: "bg-[#003087] text-white" },
  { id: "bonifico", nome: "Bonifico / IBAN", sigla: "IB", colore: "bg-primary-container text-on-primary" },
  { id: "contanti", nome: "A mano", sigla: "€", colore: "bg-gift-gold text-on-surface" },
] as const;

const SUGGERIMENTI = ["Compleanno di Marco", "Laurea di Sara", "Addio al nubilato"];

export function CreaV3({ prodottoIniziale }: { prodottoIniziale?: { slug: string; nome: string; prezzoCent: number } }) {
  const router = useRouter();
  const [festeggiato, setFesteggiato] = useState("");
  const [fonte, setFonte] = useState<Fonte>(prodottoIniziale ? "catalogo" : "link");
  const [url, setUrl] = useState("");
  const [euro, setEuro] = useState(prodottoIniziale ? String(Math.round(prodottoIniziale.prezzoCent / 100)) : "");
  const [amici, setAmici] = useState(12);
  const [metodi, setMetodi] = useState<string[]>(["satispay"]);
  const [copiato, setCopiato] = useState(false);

  const totaleCent = Math.max(0, Math.round((Number(euro.replace(",", ".")) || 0) * 100));
  const quota = quotaProposta(totaleCent, amici);
  const nome = festeggiato.trim();

  const messaggio = useMemo(
    () =>
      `Ciao! Facciamo un regalo di gruppo${nome ? ` per ${nome}` : ""}. ${formattaEuro(quota)} a testa. Qui c'è tutto, ci metti un minuto.`,
    [nome, quota],
  );

  function cambiaMetodo(id: string) {
    setMetodi((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(messaggio);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      setCopiato(false);
    }
  }

  function genera() {
    const q = new URLSearchParams({ persone: String(amici) });
    if (nome) q.set("festeggiato", nome);
    if (fonte === "catalogo" && prodottoIniziale) q.set("prodotto", prodottoIniziale.slug);
    if (fonte === "link" && url.trim()) q.set("link", url.trim());
    if (metodi.length) q.set("metodi", metodi.join(","));
    router.push(`/crea?${q.toString()}`);
  }

  const Passo = ({ n, titolo, sottotitolo, children }: { n: number; titolo: string; sottotitolo?: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-3 rounded-2xl border border-border-warm bg-surface-cream-card p-space-md shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-primary-container">
            <span className="h-2 w-2 rounded-full bg-secondary-container" />
            {titolo}
          </h2>
          {sottotitolo ? <p className="mt-0.5 font-body-sm text-body-sm text-text-muted">{sottotitolo}</p> : null}
        </div>
        <span className="flex-shrink-0 font-label-sm text-label-sm text-text-muted">
          Passo <span className="cifre">{n}</span>/3
        </span>
      </div>
      {children}
    </section>
  );

  return (
    <div className="flex flex-col gap-space-md">
      <Passo n={1} titolo="Per chi o cosa festeggiate?">
        <div className="relative flex items-center">
          <input
            value={festeggiato}
            onChange={(e) => setFesteggiato(e.target.value.slice(0, 60))}
            placeholder="Es. Compleanno di Marco 🎂"
            aria-label="Per chi o cosa festeggiate"
            className="h-12 w-full rounded-xl border border-border-warm bg-surface-container-lowest px-3 pr-10 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          {festeggiato ? (
            <button
              type="button"
              onClick={() => setFesteggiato("")}
              aria-label="Cancella"
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-forest-tint"
            >
              <Icona nome="cancel" dimensione={18} />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGERIMENTI.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFesteggiato(s)}
              className="rounded-full bg-surface-container-low px-3 py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-forest-tint"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-1" role="group" aria-label="Da dove arriva il regalo">
          {([
            { id: "link" as const, t: "Ho già il link" },
            { id: "catalogo" as const, t: "Dal catalogo" },
            { id: "libera" as const, t: "Quota libera" },
          ]).map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={fonte === f.id}
              onClick={() => setFonte(f.id)}
              className={`rounded-lg px-2 py-2 font-label-sm text-label-sm transition-colors ${
                fonte === f.id ? "bg-surface-cream-card text-primary-container shadow-sm" : "text-text-muted"
              }`}
            >
              {f.t}
            </button>
          ))}
        </div>

        {fonte === "link" ? (
          <div className="flex flex-col gap-1">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              placeholder="https://www.amazon.it/dp/…"
              aria-label="Link del regalo"
              className="h-12 w-full rounded-xl border border-border-warm bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
            <p className="font-body-sm text-[12px] text-text-muted">
              Il nome e il prezzo li confermi nel passo successivo: qui serve solo l&apos;indirizzo.
            </p>
          </div>
        ) : null}

        {fonte === "catalogo" ? (
          prodottoIniziale ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-tint text-primary-container">
                <Icona nome="redeem" dimensione={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-label-md text-label-md text-primary-container">{prodottoIniziale.nome}</span>
                <span className="cifre font-body-sm text-body-sm text-text-muted">{formattaEuro(prodottoIniziale.prezzoCent)}</span>
              </span>
              <Icona nome="check_circle" dimensione={18} piena className="text-primary-container" />
            </div>
          ) : (
            <Link
              href="/v3/catalogo"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-low font-label-md text-label-md text-primary-container"
            >
              <Icona nome="card_giftcard" dimensione={18} />
              <span>Scegli dal catalogo</span>
            </Link>
          )
        ) : null}

        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-primary-container">Budget e amici</span>
            <span className="rounded-full bg-surface-cream-card px-2 py-0.5 font-label-sm text-[11px] text-text-muted">Calcolo istantaneo</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-text-muted">
                {fonte === "libera" ? "Obiettivo (facoltativo)" : "Obiettivo totale"}
              </span>
              <span className="flex h-12 items-center rounded-xl border border-border-warm bg-surface-container-lowest px-3">
                <input
                  inputMode="decimal"
                  value={euro}
                  onChange={(e) => setEuro(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
                  placeholder="0"
                  className="cifre w-full bg-transparent text-lg font-bold text-on-surface focus:outline-none"
                />
                <span className="cifre text-text-muted">€</span>
              </span>
            </label>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-text-muted" id="v3-amici">
                Partecipanti stimati
              </span>
              <span className="flex h-12 items-center justify-between rounded-xl border border-border-warm bg-surface-container-lowest px-2">
                <button
                  type="button"
                  aria-label="Un partecipante in meno"
                  onClick={() => setAmici((n) => Math.max(2, n - 1))}
                  disabled={amici <= 2}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-container disabled:opacity-40"
                >
                  −
                </button>
                <output className="cifre text-lg font-bold" aria-labelledby="v3-amici">
                  {amici}
                </output>
                <button
                  type="button"
                  aria-label="Un partecipante in più"
                  onClick={() => setAmici((n) => Math.min(200, n + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-container"
                >
                  +
                </button>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-text-muted">
              Quota suggerita:{" "}
              <strong className="cifre text-[20px] text-secondary-container" aria-live="polite">
                {formattaEuro(quota)}
              </strong>{" "}
              a testa
            </span>
            <span className="flex items-center gap-1 font-label-sm text-[11px] text-primary-container">
              <Icona nome="check_circle" dimensione={14} piena />0 € trattenute
            </span>
          </div>
        </div>
      </Passo>

      <Passo n={2} titolo="Dove ricevi le quote?" sottotitolo="I soldi arrivano subito e direttamente a te">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Metodi di pagamento accettati">
          {METODI.map((m) => {
            const scelto = metodi.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={scelto}
                onClick={() => cambiaMetodo(m.id)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-colors ${
                  scelto ? "border-primary-container bg-forest-tint" : "border-border-warm bg-surface-container-lowest"
                }`}
              >
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold ${m.colore}`}>
                  {m.sigla}
                </span>
                <span className="min-w-0 flex-1 truncate font-label-md text-label-md text-on-surface">{m.nome}</span>
                <Icona
                  nome={scelto ? "check_circle" : "favorite_border"}
                  dimensione={18}
                  piena={scelto}
                  className={scelto ? "text-primary-container" : "text-transparent"}
                />
              </button>
            );
          })}
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm text-text-muted">
          <Icona nome="lock" dimensione={16} className="mt-0.5 flex-shrink-0 text-primary-container" />
          <span>
            <strong className="text-primary-container">Zero fondi bloccati:</strong> Regaloop non trattiene denaro. Gli invitati scelgono il
            loro metodo e pagano direttamente sul tuo account personale. I tuoi dati (nome su Satispay, IBAN…) li inserisci nel passo
            successivo.
          </span>
        </p>
      </Passo>

      <Passo n={3} titolo="Anteprima del messaggio">
        <div className="rounded-2xl bg-[#dcf8c6] p-3">
          <p className="font-body-md text-body-md leading-relaxed text-[#111b21]">{messaggio}</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/70 p-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container text-on-secondary">
              <Icona nome="redeem" dimensione={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-label-sm text-label-sm text-primary-container">Il link arriva dopo la creazione</span>
              <span className="block font-body-sm text-[11px] text-text-muted">Firma il biglietto online e versa la quota</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void copia()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low font-label-md text-label-md text-primary-container"
        >
          <Icona nome={copiato ? "check" : "content_copy"} dimensione={18} />
          <span aria-live="polite">{copiato ? "Testo copiato" : "Copia il testo"}</span>
        </button>
      </Passo>

      <button
        type="button"
        onClick={genera}
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-secondary-container font-label-lg text-label-lg font-bold text-on-secondary shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
      >
        <Icona nome="rocket_launch" dimensione={20} />
        <span>Genera il link e condividi</span>
      </button>
      <p className="text-center font-body-sm text-[12px] text-text-muted">
        Nell&apos;ultimo passo confermi i dettagli e accedi: serve solo per ritrovare la colletta e confermare le quote.
      </p>
    </div>
  );
}
