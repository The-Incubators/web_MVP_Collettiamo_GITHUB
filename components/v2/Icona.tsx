/**
 * Un'icona Material Symbols, come nei layout di UX_V2: il nome è una legatura del font.
 *
 * Il font si carica nel layout della variante con il **sottoinsieme** delle sole icone elencate qui
 * (parametro `icon_names` di Google Fonts): poche decine di kilobyte invece del font intero.
 * Perciò ogni icona nuova va aggiunta a `ICONE_V2`, se no al suo posto compare il nome scritto.
 */

export const ICONE_V2 = [
  "add_circle",
  "arrow_back_ios_new",
  "arrow_forward",
  "auto_awesome",
  "badge",
  "card_giftcard",
  "celebration",
  "check_circle",
  "chevron_right",
  "done_all",
  "draw",
  "help",
  "home",
  "info",
  "link",
  "notifications_active",
  "payments",
  "person",
  "person_off",
  "redeem",
  "security",
  "send",
  "share",
  "shield",
  "touch_app",
  "verified",
  "visibility",
  "volunteer_activism",
] as const;

export type NomeIconaV2 = (typeof ICONE_V2)[number];

export function Icona({
  nome,
  dimensione = 22,
  piena = false,
  className = "",
}: {
  nome: NomeIconaV2;
  dimensione?: number;
  piena?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: `${dimensione}px`, ...(piena ? { fontVariationSettings: "'FILL' 1" } : {}) }}
    >
      {nome}
    </span>
  );
}
