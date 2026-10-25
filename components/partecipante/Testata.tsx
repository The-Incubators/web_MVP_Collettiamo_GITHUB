import { Barra, Icona, ImmagineProdotto } from "@/components/ui";
import { dataBreve } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { avanzamento, inizialiDi } from "@/lib/dominio/partecipanti";
import { quotaEffettiva } from "@/lib/dominio/quota";
import type { Colletta, Partecipante } from "@/lib/tipi";

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function testoPartecipazione(c: Colletta): string {
  const n = c.nConfermati;
  const m = Math.max(c.previsti, c.nAttesi);
  if (n === 0) return c.nAderenti > 0 ? "Le prime quote sono in arrivo" : "Nessuno ha ancora partecipato";
  return `${n} ${n === 1 ? "persona" : "persone"} su ${m} ${n === 1 ? "ha" : "hanno"} già partecipato`;
}

function testoModoQuota(c: Colletta): string {
  if (c.modoQuota === "libera") return `Metti quello che vuoi: ${formattaEuro(quotaEffettiva(c))} suggeriti`;
  if (c.modoQuota === "divisa") return "Il prezzo diviso tra chi partecipa";
  return `Quota fissa, uguale per tutti`;
}

const TINTE = ["bg-ok-field text-accent-2", "bg-accent-field text-accent", "bg-gold-field text-gold", "bg-surface-2 text-ink"];

/** Le iniziali di chi ha già pagato (solo i confermati: chi manca non si mostra mai). */
function Confermati({ righe }: { righe: Partecipante[] | null }) {
  const confermati = (righe ?? []).filter((r) => r.stato === "confermato");
  if (confermati.length === 0) return null;
  const visibili = confermati.slice(0, 4);
  const altri = confermati.length - visibili.length;
  const nomi = confermati.map((r) => r.nome.split(" ")[0]);
  return (
    <div className="flex items-center justify-between gap-3">
      <div aria-hidden="true" className="flex -space-x-2">
        {visibili.map((r, i) => (
          <span key={r.id} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ring-surface ${TINTE[i % TINTE.length]}`}>
            {inizialiDi(r.nome).slice(0, 1)}
          </span>
        ))}
        {altri > 0 ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent ring-2 ring-surface">+{altri}</span>
        ) : null}
      </div>
      <p className="min-w-0 truncate text-xs font-semibold text-ink-soft">
        <span className="sr-only">Hanno pagato: </span>
        {nomi.slice(0, 4).join(", ")}
        {nomi.length > 4 ? "…" : ""}
      </p>
    </div>
  );
}

/** Avanzamento: «8 persone su 12», percentuale, barra, iniziali di chi ha pagato. */
function Avanzamento({ colletta: c, righe }: { colletta: Colletta; righe: Partecipante[] | null }) {
  const a = avanzamento(c);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <p className="flex items-center gap-2" aria-live="polite">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-verde-medio" />
          {testoPartecipazione(c)}
        </p>
        <span className="cifre">{a.percento}%</span>
      </div>
      <Barra percento={a.percento} etichetta="Avanzamento della raccolta" />
      <Confermati righe={righe} />
    </div>
  );
}

/** La prima schermata: chi organizza, titolo, occasione e data, regalo, quota in grande, avanzamento. */
export function Testata({ colletta: c, righe, scaduta }: { colletta: Colletta; righe: Partecipante[] | null; scaduta: boolean }) {
  const quota = quotaEffettiva(c);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-carta">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xl font-bold text-on-accent">
          {inizialiDi(c.organizzatoreNome).slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <p className="text-sm font-bold">{c.organizzatoreNome} organizza</p>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold">
            {maiuscola(c.occasione)} · {dataBreve(c.dataRegalo)}
          </span>
        </div>
      </div>

      <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Il regalo per {c.festeggiato}</h1>

      <div className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-carta">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white">
          <ImmagineProdotto prodotto={c.prodotto} className="aspect-square h-full" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="line-clamp-2 font-display text-lg font-semibold leading-snug">{c.prodotto.nome}</p>
          <p className="cifre font-bold">{formattaEuro(c.prodotto.prezzoCent)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-soft">
            <Icona nome="payments" dimensione={18} />
            {c.modoQuota === "libera" ? "Quota suggerita" : "La tua quota"}
          </p>
          <p className="cifre text-6xl font-extrabold tracking-tight text-accent-2">{formattaEuro(quota)}</p>
          <p className="text-sm text-ink-soft">{testoModoQuota(c)}</p>
        </div>
        <Avanzamento colletta={c} righe={righe} />
        {c.stato === "aperta" ? (
          <p className="text-center text-xs font-semibold text-ink-soft">
            {scaduta ? "La raccolta è scaduta" : `La raccolta si chiude il ${dataBreve(c.scadenza)} alle 20:00`}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Il riepilogo compatto della raccolta, per chi torna sul link dopo aver partecipato. */
export function RiquadroColletta({ colletta: c, righe, scaduta }: { colletta: Colletta; righe: Partecipante[] | null; scaduta: boolean }) {
  const a = avanzamento(c);
  return (
    <section aria-label="La raccolta" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Colletta di gruppo</p>
          <p className="font-display text-xl font-semibold">Regalo per {c.festeggiato}</p>
        </div>
        {c.stato === "aperta" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-field px-3 py-1 text-xs font-bold text-ink">
            <Icona nome="schedule" dimensione={16} />
            {scaduta ? "Scaduta" : `Fino al ${dataBreve(c.scadenza)}`}
          </span>
        ) : null}
      </div>
      <p className="flex items-baseline gap-2">
        <span className="cifre text-4xl font-extrabold">{formattaEuro(a.confermatoCent)}</span>
        <span className="cifre text-sm text-ink-soft">su {formattaEuro(a.obiettivoCent)}</span>
      </p>
      <Avanzamento colletta={c} righe={righe} />
    </section>
  );
}

/** I tre passi di chi partecipa: nome, pagamento, biglietto. */
export function Passi({ corrente, etichetta }: { corrente: 1 | 2 | 3; etichetta: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-2 px-3 py-1 text-xs font-bold">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-verde-medio" />
        Passo {corrente} di 3 · {etichetta}
      </p>
      <div aria-hidden="true" className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n < corrente ? "bg-accent" : n === corrente ? "bg-verde-medio" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
