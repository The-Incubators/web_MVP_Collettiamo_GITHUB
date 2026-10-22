import { ImageResponse } from "next/og";
import { datiServer } from "@/lib/dati";
import { formattaEuro } from "@/lib/dominio/importi";
import { avanzamento } from "@/lib/dominio/partecipanti";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { votazioneInCorso } from "@/lib/dominio/votazione";
import { slugValido } from "@/lib/dominio/slug";
import { NOME_PROGETTO, iconaMarchioDataUri } from "@/lib/marchio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Anteprima della colletta";

// Colori del marchio (sezione 15). Nessun font esterno: si usa quello incorporato in ImageResponse.
const VERDE = "#0B5E4C";
const CHIARO = "#E6F2EE";
const BIANCO = "#FFFFFF";

export default async function Immagine({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = slugValido(slug) ? await datiServer().colletta(slug) : null;
  const visibile = c && c.stato !== "bozza" ? c : null;

  const inVoto = !!visibile && votazioneInCorso(visibile);
  const titolo = !visibile ? NOME_PROGETTO : inVoto ? "Scegliamo insieme il regalo" : visibile.sorpresa ? "Un regalo a sorpresa" : visibile.prodotto.nome;
  const sottotitolo = !visibile ? "" : inVoto ? (visibile.sorpresa ? "Un regalo a sorpresa" : `Per ${visibile.festeggiato}`) : visibile.sorpresa ? "" : `Il regalo per ${visibile.festeggiato}`;
  const quota = visibile && !inVoto ? formattaEuro(quotaEffettiva(visibile)) : "";
  const a = visibile && !inVoto ? avanzamento(visibile) : null;
  const testoAvanzamento = inVoto ? "" : visibile
    ? visibile.nConfermati > 0
      ? `${visibile.nConfermati} ${visibile.nConfermati === 1 ? "persona" : "persone"} su ${Math.max(visibile.previsti, visibile.nAttesi)} hanno già partecipato`
      : `${visibile.organizzatoreNome} organizza il regalo di gruppo`
    : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: VERDE, color: BIANCO, padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          {/* ImageResponse disegna solo <img>: next/image qui non esiste. */}
          <img src={iconaMarchioDataUri()} width={56} height={56} alt="" />
          {NOME_PROGETTO}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sottotitolo ? <div style={{ display: "flex", fontSize: 38, color: CHIARO }}>{sottotitolo}</div> : null}
          <div style={{ display: "flex", fontSize: titolo.length > 28 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{titolo}</div>
          {quota ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <div style={{ display: "flex", fontSize: 120, fontWeight: 700, lineHeight: 1 }}>{quota}</div>
              <div style={{ display: "flex", fontSize: 44, color: CHIARO }}>a testa</div>
            </div>
          ) : null}
        </div>

        {inVoto ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 56, color: BIANCO }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="68" height="68" viewBox="0 0 24 24">
                  <path d="M12 2.8l2.8 5.9 6.4.9-4.6 4.5 1.1 6.4L12 17.5l-5.7 3 1.1-6.4L2.8 9.6l6.4-.9z" fill={BIANCO} />
                </svg>
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 40, color: CHIARO }}>Vota il tuo preferito</div>
          </div>
        ) : null}

        {a ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", width: "100%", height: 20, borderRadius: 10, background: "rgba(255,255,255,0.25)" }}>
              <div style={{ display: "flex", width: `${Math.max(a.percento, 2)}%`, height: 20, borderRadius: 10, background: BIANCO }} />
            </div>
            <div style={{ display: "flex", fontSize: 32, color: CHIARO }}>{testoAvanzamento}</div>
          </div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
