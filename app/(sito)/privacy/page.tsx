import type { Metadata } from "next";

export const metadata: Metadata = { title: "Come trattiamo i dati" };

// Testo informativo del prototipo: descrive ciò che l'applicazione conserva davvero. Da far rivedere prima del lancio.
export default function Privacy() {
  return (
    <div className="gutter pb-16 pt-10">
      <article className="mx-auto flex max-w-2xl flex-col gap-5">
        <h1 className="text-3xl">Come trattiamo i dati</h1>
        <p className="text-ink-soft">Questo è un prototipo. Qui trovi, in breve, quali dati conserviamo e perché.</p>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Chi firma un biglietto</h2>
          <p>Conserviamo il messaggio, l’eventuale immagine, la firma e il nome che scrivi; cognome ed email solo se li lasci. Li vede chi organizza il biglietto; il festeggiato e gli altri vedono solo il messaggio e la firma.</p>
          <p>Il tuo dispositivo tiene una chiave casuale che ci permette di riconoscere la tua firma e di fartela modificare: non è legata alla tua identità.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Chi organizza</h2>
          <p>Per pubblicare un biglietto o una colletta accedi con Google: conserviamo nome, email e i dati che inserisci (destinatario, data di consegna, messaggi).</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Soldi</h2>
          <p>Non passano mai da noi e non conserviamo dati di pagamento.</p>
        </section>
      </article>
    </div>
  );
}
