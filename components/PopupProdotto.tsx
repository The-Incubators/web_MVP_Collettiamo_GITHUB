"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icona } from "./ui/Icona";

/**
 * Il popup che mostra la scheda di un prodotto sopra il catalogo, senza lasciare la pagina.
 *
 * Si usa il `<dialog>` del browser con `showModal()`: fuoco intrappolato dentro, Esc che chiude e resto
 * della pagina reso inerte li fa il browser, meglio di quanto li rifaremmo a mano.
 *
 * Chiudere vuol dire tornare indietro nella cronologia: sotto il popup il catalogo è rimasto montato e
 * allo stesso punto di scorrimento, quindi si riprende esattamente da dove si era. Anche il tasto
 * «indietro» del browser e la gesture del telefono chiudono il popup, come ci si aspetta.
 */
export function PopupProdotto({ children, titolo }: { children: React.ReactNode; titolo: string }) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const chiuso = useRef(false);

  const chiudi = () => {
    if (chiuso.current) return; // Esc + clic sulla X insieme non devono tornare indietro due volte
    chiuso.current = true;
    router.back();
  };

  useEffect(() => {
    const d = dialogo.current;
    if (!d || d.open) return;
    d.showModal();

    // Il documento non deve scorrere dietro al popup. Si compensa la barra di scorrimento che sparisce,
    // se no la pagina sotto fa un salto laterale. `overflow: hidden` non perde la posizione: al ripristino
    // il catalogo è dov'era.
    const radice = document.documentElement;
    const barra = window.innerWidth - radice.clientWidth;
    const overflowPrima = radice.style.overflow;
    const paddingPrima = radice.style.paddingRight;
    radice.style.overflow = "hidden";
    if (barra > 0) radice.style.paddingRight = `${barra}px`;

    return () => {
      radice.style.overflow = overflowPrima;
      radice.style.paddingRight = paddingPrima;
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-label={titolo}
      onCancel={(e) => {
        e.preventDefault(); // il browser chiuderebbe il dialogo lasciando l'indirizzo com'è
        chiudi();
      }}
      // Nessun clic «sullo sfondo»: il popup occupa tutto lo schermo, fuori non c'è niente da cliccare.
      // Si chiude con la X o con Esc.
      className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-velo"
      style={{ width: "100vw", height: "100dvh" }}
    >
      <div className="flex min-h-full w-full justify-center overflow-y-auto overscroll-contain bg-field p-0 sm:p-6">
        <div className="relative w-full max-w-catalogo">
          {/* La X resta in vista mentre si scorre la scheda. */}
          <div className="sticky top-0 z-10 flex justify-end bg-field px-4 py-3 sm:px-0">
            <button
              type="button"
              onClick={chiudi}
              aria-label="Chiudi e torna al catalogo"
              autoFocus
              className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-sollevata transition-colors hover:bg-accent-2"
            >
              <Icona nome="close" />
            </button>
          </div>
          <div className="px-4 pb-16 sm:px-0">{children}</div>
        </div>
      </div>
    </dialog>
  );
}
