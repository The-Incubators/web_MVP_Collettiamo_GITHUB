"use client";

import { Bottone } from "./ui";

export function BottoneStampa() {
  return (
    <Bottone variante="verde" onClick={() => window.print()} dimensione="piccolo">
      Stampa il biglietto
    </Bottone>
  );
}
