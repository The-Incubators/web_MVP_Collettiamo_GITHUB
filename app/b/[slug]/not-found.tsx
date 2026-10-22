import Link from "next/link";

export default function BigliettoNonTrovato() {
  return (
    <main className="gutter mx-auto flex max-w-partecipante flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-2xl">Non trovo questo biglietto</h1>
      <p className="text-ink-soft">Controlla il link che ti hanno mandato: forse manca un pezzo.</p>
      <Link href="/" className="font-semibold text-accent-2 underline underline-offset-4">
        Vai alla pagina iniziale
      </Link>
    </main>
  );
}
