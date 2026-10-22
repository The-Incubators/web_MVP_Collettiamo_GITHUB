"use client";

import { useEffect, useState } from "react";

/** Disegna un QR da un testo, con una libreria locale (nessuna chiamata a servizi esterni). */
export function CodiceQr({ testo, descrizione }: { testo: string; descrizione: string }) {
  const [moduli, setModuli] = useState<{ size: number; data: Uint8Array } | null>(null);

  useEffect(() => {
    let attivo = true;
    import("qrcode")
      .then((m) => {
        const qr = m.create(testo, { errorCorrectionLevel: "M" });
        if (attivo) setModuli({ size: qr.modules.size, data: qr.modules.data as unknown as Uint8Array });
      })
      .catch(() => attivo && setModuli(null));
    return () => {
      attivo = false;
    };
  }, [testo]);

  if (!moduli) return null;
  const quiet = 4;
  const lato = moduli.size + quiet * 2;
  let percorso = "";
  for (let y = 0; y < moduli.size; y++) {
    for (let x = 0; x < moduli.size; x++) {
      if (moduli.data[y * moduli.size + x]) percorso += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`0 0 ${lato} ${lato}`} role="img" aria-label={descrizione} className="h-auto w-48 max-w-full rounded-controllo bg-white" shapeRendering="crispEdges">
      <path d={percorso} fill="#000" />
    </svg>
  );
}
