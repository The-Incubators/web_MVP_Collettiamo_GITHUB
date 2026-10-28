import { ImageResponse } from "next/og";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { bigliettoPubblico } from "@/lib/biglietti/server";
import { testoSu } from "@/lib/dominio/bacheca";
import { NOME_PROGETTO, iconaMarchioDataUri } from "@/lib/marchio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Il biglietto di gruppo";

/** L'anteprima del link: la copertina (sfondo e testi del modello) accanto al nome del biglietto. */
export default async function Immagine({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  const m = (dati && modelloPerId(dati.b.copertina.modelloId)) || MODELLI_BIGLIETTO[0];
  // i biglietti a bacheca hanno i loro colori; quelli di prima, i colori del modello
  const colori = dati?.b.copertina.colori;
  const sfondo = colori ? `linear-gradient(140deg, ${colori.sfondo1}, ${colori.sfondo2})` : m.sfondo.tipo === "gradiente" ? `linear-gradient(140deg, ${m.sfondo.da}, ${m.sfondo.a})` : m.sfondo.colore;
  const coloreTitolo = colori ? testoSu(colori.sfondo1) : m.titolo.colore;
  const titolo = dati?.b.copertina.titolo || dati?.b.festeggiato || "";
  const nome = dati?.b.nome ?? "Un biglietto di gruppo";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0B5E4C", padding: 56, gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 366, height: 518, background: sfondo, borderRadius: 6, boxShadow: "0 20px 40px rgba(0,0,0,.35)", padding: 28, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: coloreTitolo, textAlign: "center" }}>{colori ? "" : (m.testoFisso ?? "")}</div>
          <div style={{ display: "flex", fontSize: titolo.length > 14 ? 34 : 46, fontWeight: 700, color: coloreTitolo, textAlign: "center", textTransform: !colori && m.titolo.maiuscolo ? "uppercase" : "none" }}>{titolo}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24, color: "#FFFFFF" }}>
          <div style={{ display: "flex", fontSize: 30, color: "#E6F2EE" }}>Firma il biglietto di gruppo</div>
          <div style={{ display: "flex", fontSize: nome.length > 30 ? 52 : 66, fontWeight: 700, lineHeight: 1.1 }}>{nome}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: "#E6F2EE" }}>
            {/* ImageResponse disegna solo <img>: next/image qui non esiste. */}
            <img src={iconaMarchioDataUri()} width={40} height={40} alt="" />
            {NOME_PROGETTO}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
