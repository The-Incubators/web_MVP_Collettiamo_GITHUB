import type { CSSProperties, ReactNode } from "react";
import { ALTEZZA_CARTA, LARGHEZZA_CARTA, RAPPORTO_CARTA } from "@/lib/dominio/biglietto";

/**
 * La "tela" del biglietto: un riquadro nel rapporto 1 : 1,414 che rende i figli a una dimensione logica fissa
 * (700 × 990) e li scala alla larghezza richiesta. Così ogni misura in px (testo, margini) è identica ovunque:
 * miniatura, schermo, PDF.
 */
export function Tela({
  larghezza,
  children,
  className = "",
  ombra = true,
  style,
}: {
  larghezza: number;
  children: ReactNode;
  className?: string;
  ombra?: boolean;
  style?: CSSProperties;
}) {
  const scala = larghezza / LARGHEZZA_CARTA;
  return (
    <div
      className={`relative overflow-hidden rounded-[3px] ${ombra ? "shadow-xl" : ""} ${className}`}
      style={{ width: larghezza, height: Math.round(larghezza * RAPPORTO_CARTA), ...style }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: LARGHEZZA_CARTA, height: ALTEZZA_CARTA, transform: `scale(${scala})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
