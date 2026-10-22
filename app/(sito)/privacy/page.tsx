import type { Metadata } from "next";
import { Icona, type NomeIcona } from "@/components/ui";

export const metadata: Metadata = { title: "Come trattiamo i dati" };

// Testo informativo del prototipo: descrive ciò che l'applicazione conserva davvero. Da far rivedere prima del lancio.
const BLOCCHI: { titolo: string; icona: NomeIcona; tinta: string; testi: string[] }[] = [
  {
    titolo: "Chi firma un biglietto",
    icona: "draw",
    tinta: "bg-cta-field text-cta-2",
    testi: [
      "Conserviamo il messaggio, l’eventuale immagine, la firma, il ruolo se lo scrivi e il tuo nome; cognome ed email solo se li lasci. Nome, cognome ed email li vede solo chi organizza: il festeggiato e gli altri vedono messaggio, firma e ruolo.",
      "Il tuo dispositivo tiene una chiave casuale che ci permette di riconoscere la tua firma e di fartela modificare: non è legata alla tua identità.",
    ],
  },
  {
    titolo: "Chi organizza",
    icona: "person",
    tinta: "bg-ok-field text-accent",
    testi: ["Per pubblicare un biglietto o una colletta accedi con Google: conserviamo nome, email e i dati che inserisci (destinatario, data di consegna, messaggi)."],
  },
  {
    titolo: "Soldi",
    icona: "verified_user",
    tinta: "bg-gold-field text-gold",
    testi: ["Non passano mai da noi e non conserviamo dati di pagamento."],
  },
];

export default function Privacy() {
  return (
    <div className="gutter pb-10 pt-4">
      <article className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Come trattiamo i dati</h1>
          <p className="text-ink-soft">Questo è un prototipo: ecco, in breve, cosa conserviamo e perché.</p>
        </div>
        {BLOCCHI.map((b) => (
          <section key={b.titolo} className="flex gap-4 rounded-3xl bg-surface p-5 shadow-carta">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${b.tinta}`}>
              <Icona nome={b.icona} />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-xl font-semibold text-accent-2">{b.titolo}</h2>
              {b.testi.map((t) => (
                <p key={t} className="text-sm">
                  {t}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
