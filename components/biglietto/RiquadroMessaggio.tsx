import { PX_DIMENSIONE } from "@/lib/dominio/biglietto";
import { fontPerId } from "@/lib/dominio/biglietti";
import type { Firma } from "@/lib/tipi";

/**
 * Un messaggio firmato: immagine (se c'è), testo con lo stile scelto, nome in grassetto.
 * `messaggioHtml` è ripulito lato server (solo <b><i><u><br>): qui si limita a renderlo.
 */
export function RiquadroMessaggio({ firma, evidenziato }: { firma: Firma; evidenziato?: boolean }) {
  const px = PX_DIMENSIONE[firma.stile.dimensione] ?? PX_DIMENSIONE.m;
  return (
    <figure style={{ breakInside: "avoid", borderRadius: 14, background: "rgba(22,36,31,0.05)", padding: 16, overflow: "hidden", margin: 0, ...(evidenziato ? { boxShadow: "0 0 0 4px #FD5D17" } : {}) }}>
      {firma.immagine ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={firma.immagine.url} alt="" style={{ width: "100%", borderRadius: 10, display: "block", marginBottom: 10 }} />
          {firma.immagine.attribuzione ? <p style={{ margin: "0 0 8px", fontSize: 13, color: "#5B6D66" }}>{firma.immagine.attribuzione}</p> : null}
        </>
      ) : null}
      <div
        style={{ fontFamily: fontPerId(firma.stile.font).css, color: firma.stile.colore || "var(--ink)", fontSize: px, lineHeight: 1.35, wordBreak: "break-word" }}
        dangerouslySetInnerHTML={{ __html: firma.messaggioHtml }}
      />
      <figcaption style={{ marginTop: 10, fontWeight: 700, fontSize: Math.max(15, Math.round(px * 0.7)), color: "#16241F" }}>
        — {firma.daParteDi}
        {firma.ruolo ? <span style={{ display: "block", marginTop: 2, fontWeight: 500, fontSize: 13, color: "#5B6D66" }}>{firma.ruolo}</span> : null}
      </figcaption>
    </figure>
  );
}
