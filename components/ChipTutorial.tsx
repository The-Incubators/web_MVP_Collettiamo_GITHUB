import Link from "next/link";
import { Icona } from "@/components/ui";

/**
 * Il tutorial «Guarda come si fa» (decisioni di Cri, 5 novembre 2026): una pastiglia dentro la scheda, mai un'azione
 * principale né un link di testo. Il ▶ indica un video, quindi compare solo con `video`, quando il link apre il video
 * del tutorial; fino ad allora la pastiglia porta all'esempio, senza icona.
 */
export function ChipTutorial({ href, video = false, className = "" }: { href: string; video?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-tocco shrink-0 items-center gap-1.5 rounded-full border border-line bg-field px-3 py-1 text-xs font-bold text-ink-soft transition-colors hover:border-accent hover:text-accent ${video ? "pl-1.5" : ""} ${className}`}
    >
      {video ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-field text-accent">
          <Icona nome="play_arrow" dimensione={16} piena />
        </span>
      ) : null}
      Guarda come si fa
    </Link>
  );
}
