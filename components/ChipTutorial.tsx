import Link from "next/link";
import { IconaTratto } from "@/components/ui/IconaTratto";

/**
 * La pillola «Guarda come si fa» (design.md §4; revisione di Cri, 5 novembre 2026): piccola, tinta di verde, senza filo,
 * accanto al titolo del blocco o sotto il pulsante principale (regalo di gruppo, Cri 6 nov), mai sulla sua riga;
 * mai un link di testo. Il ▶ in un tondo verde indica un video, quindi compare solo con `video`, quando il link apre il
 * video del tutorial; fino ad allora la pillola porta all'esempio, senza icona.
 */
export function ChipTutorial({ href, video = false, className = "" }: { href: string; video?: boolean; className?: string }) {
  return (
    <Link href={href} className={`pillola ${className}`.trim()}>
      {video ? (
        <span className="play">
          <IconaTratto nome="play" />
        </span>
      ) : null}
      Guarda come si fa
    </Link>
  );
}
