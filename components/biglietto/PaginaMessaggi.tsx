import { GAP_COLONNE, GAP_RIQUADRI, PADDING_PAGINA, type PaginaImpaginata } from "@/lib/dominio/biglietto";
import type { Firma } from "@/lib/tipi";
import type { SfondoModello } from "@/lib/tipi";
import { sfondoCss } from "./Copertina";
import { RiquadroMessaggio } from "./RiquadroMessaggio";
import { Tela } from "./Tela";

/** Una pagina interna: fondo chiaro del modello e i riquadri disposti in colonne. */
export function PaginaMessaggi({
  pagina,
  firmePerId,
  larghezza,
  sfondo,
  className,
  ombra,
  evidenziaId,
}: {
  evidenziaId?: string | null;
  pagina: PaginaImpaginata;
  firmePerId: Map<string, Firma>;
  larghezza: number;
  sfondo?: SfondoModello;
  className?: string;
  ombra?: boolean;
}) {
  return (
    <Tela larghezza={larghezza} className={className} ombra={ombra}>
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }} />
      {sfondo ? <div style={{ position: "absolute", inset: 0, opacity: 0.25, ...sfondoCss(sfondo) }} /> : null}
      <div style={{ position: "absolute", top: PADDING_PAGINA, left: PADDING_PAGINA, right: PADDING_PAGINA, bottom: PADDING_PAGINA, display: "flex", gap: GAP_COLONNE }}>
        {pagina.colonne.map((col, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: GAP_RIQUADRI }}>
            {col.map((id) => {
              const f = firmePerId.get(id);
              return f ? <RiquadroMessaggio key={id} firma={f} evidenziato={id === evidenziaId} /> : null;
            })}
          </div>
        ))}
      </div>
    </Tela>
  );
}
