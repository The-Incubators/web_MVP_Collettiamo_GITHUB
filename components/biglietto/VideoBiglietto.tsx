"use client";

import { useEffect, useState } from "react";

const mobile = "(max-width: 767px)";
const base = "/tutorial/biglietto";

export function VideoBiglietto() {
  const [verticale, setVerticale] = useState(false);

  useEffect(() => {
    setVerticale(window.matchMedia(mobile).matches);
  }, []);

  return (
    <video
      className="video-biglietto"
      aria-label="Come si crea, si firma e si apre il biglietto"
      controls
      playsInline
      preload="metadata"
      poster={`${base}-${verticale ? "9x16" : "16x9"}.webp`}
    >
      <source src={`${base}-9x16.mp4`} type="video/mp4" media={mobile} />
      <source src={`${base}-16x9.mp4`} type="video/mp4" />
      <track kind="captions" src={`${base}-it.vtt`} srcLang="it" label="Italiano" />
    </video>
  );
}
