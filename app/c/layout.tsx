import { Icona, Logo } from "@/components/ui";

// La pagina del partecipante ha un solo compito: niente menu, niente profilo, niente catalogo. Solo il marchio.
export default function LayoutPartecipante({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-partecipante flex-col">
      <header className="no-stampa gutter flex h-16 items-center justify-between pt-safe">
        <Logo priorita className="h-7" />
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-soft">
          <Icona nome="lock" dimensione={14} />
          Link privato
        </span>
      </header>
      <main className="gutter flex-1 pb-8 pt-2">{children}</main>
    </div>
  );
}
