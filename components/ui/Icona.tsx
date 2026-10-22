/**
 * Icone di UX_V4: Material Symbols, come nei layout di Stitch. Il font si carica nel layout principale già
 * ridotto a questo elenco (parametro `icon_names` di Google Fonts), quindi **un'icona non elencata qui
 * compare come parola scritta**: per usarne una nuova, aggiungerla prima all'elenco.
 */
export const ICONE = [
  "account_circle",
  "arrow_back",
  "arrow_forward",
  "auto_awesome",
  "check",
  "check_circle",
  "close",
  "content_copy",
  "favorite",
  "grid_view",
  "home",
  "logout",
  "person",
  "redeem",
] as const;

export type NomeIcona = (typeof ICONE)[number];

export const URL_FONT_ICONE = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${[...ICONE].sort().join(",")}&display=block`;

export function Icona({
  nome,
  dimensione = 24,
  piena = false,
  className = "",
}: {
  nome: NomeIcona;
  dimensione?: number;
  piena?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined shrink-0 ${className}`}
      style={{ fontSize: `${dimensione}px`, ...(piena ? { fontVariationSettings: "'FILL' 1" } : {}) }}
    >
      {nome}
    </span>
  );
}
