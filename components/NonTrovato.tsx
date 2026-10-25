import { BottoneLink, Icona, type NomeIcona } from "@/components/ui";

/** Le pagine «non trovata»: un'icona, una riga sola, un'azione. */
export function NonTrovato({ titolo, testo, icona = "search" }: { titolo: string; testo: string; icona?: NomeIcona }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-carta">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-field text-accent">
        <Icona nome={icona} dimensione={32} />
      </span>
      <h1 className="text-[26px] font-bold leading-tight text-accent-2">{titolo}</h1>
      <p className="text-sm text-ink-soft">{testo}</p>
      <BottoneLink href="/" pieno className="mt-2">
        Vai alla home
      </BottoneLink>
    </div>
  );
}
