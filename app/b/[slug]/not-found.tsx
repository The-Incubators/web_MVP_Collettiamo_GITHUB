import { NonTrovato } from "@/components/NonTrovato";

export default function BigliettoNonTrovato() {
  return (
    <main className="gutter flex min-h-dvh items-center py-16">
      <NonTrovato icona="mail" titolo="Non trovo questo biglietto" testo="Controlla il link che ti hanno mandato: forse manca un pezzo." />
    </main>
  );
}
