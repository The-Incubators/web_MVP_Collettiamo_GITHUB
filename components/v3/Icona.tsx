/**
 * Icone di UX_V3: Material Symbols, come nei layout. Il font si carica nel layout della variante già
 * ridotto a questo elenco (parametro `icon_names` di Google Fonts), quindi **un'icona non elencata qui
 * compare come parola scritta**. L'elenco è quello ricavato dai quattro layout di Pagine_UX_V3.
 */
export const ICONE_V3 = [
  "account_balance_wallet",
  "add",
  "add_link",
  "arrow_back",
  "arrow_forward",
  "auto_awesome",
  "bolt",
  "calculate",
  "cancel",
  "card_giftcard",
  "check",
  "check_circle",
  "chevron_right",
  "close",
  "content_copy",
  "draw",
  "favorite",
  "favorite_border",
  "filter_alt",
  "flash_on",
  "grid_view",
  "group",
  "groups",
  "help_outline",
  "home",
  "link",
  "local_fire_department",
  "lock",
  "notifications",
  "person",
  "redeem",
  "refresh",
  "rocket_launch",
  "search",
  "shopping_bag",
  "star",
  "thumb_up",
  "tune",
  "verified",
  "view_agenda",
  "visibility",
  "volunteer_activism",
] as const;

export type NomeIconaV3 = (typeof ICONE_V3)[number];

export function Icona({
  nome,
  dimensione = 22,
  piena = false,
  className = "",
}: {
  nome: NomeIconaV3;
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
