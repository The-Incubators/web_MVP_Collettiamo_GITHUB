"use client";

import { useEffect, useState } from "react";

const mobile = "(max-width: 767px)";
const base = "/tutorial/regalo-di-gruppo";

export function VideoTutorial() {
  const [verticale, setVerticale] = useState(false);

  useEffect(() => {
    const schermo = window.matchMedia(mobile);
    const aggiorna = () => setVerticale(schermo.matches);
    aggiorna();
    schermo.addEventListener("change", aggiorna);
    return () => schermo.removeEventListener("change", aggiorna);
  }, []);

  return (
    <video
      className="video-tutorial"
      aria-label="Come funziona il regalo di gruppo"
      controls
      muted
      playsInline
      preload="metadata"
      poster={`${base}${verticale ? "-9x16" : ""}.webp`}
    >
      <source src={`${base}-9x16.mp4`} type="video/mp4" media={mobile} />
      <source src={`${base}-16x9.mp4`} type="video/mp4" />
      <track kind="captions" src={`${base}.vtt`} srcLang="it" label="Italiano" />
    </video>
  );
}
