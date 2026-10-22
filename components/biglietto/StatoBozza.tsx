"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { classiBottone } from "@/components/ui/Bottone";

/** Cosa mostrare mentre la bozza si carica, o se questo browser non la possiede. */
export function StatoBozza({ stato }: { stato: "carica" | "assente" | "errore" }) {
  const { utente } = useApp();
  const percorso = usePathname();
  if (stato === "carica") return <p className="py-16 text-center text-ink-soft">Un momento…</p>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-accent-2">{stato === "assente" ? "Non trovo questo biglietto" : "Qualcosa non ha funzionato"}</h1>
      <p className="text-ink-soft">
        {stato === "assente"
          ? utente
            ? "Non è collegato al tuo account. Se l'hai creato da un altro dispositivo, aprilo da lì."
            : "Se l'hai già pubblicato, accedi con lo stesso account. Una bozza non pubblicata si apre solo dal dispositivo dove l'hai creata."
          : "Ricarica la pagina fra un momento."}
      </p>
      {stato === "assente" && !utente ? (
        <Link href={`/accedi?next=${encodeURIComponent(percorso)}`} className={classiBottone("primario")}>
          Accedi
        </Link>
      ) : null}
      <Link href="/biglietto/nuovo" className={classiBottone("secondario")}>
        Crea un nuovo biglietto
      </Link>
    </div>
  );
}
