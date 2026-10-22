"use client";

import { Bottone } from "./ui";

export function BottoneStampa() {
  return (
    <Bottone onClick={() => window.print()} dimensione="piccolo">
      Stampa il biglietto
    </Bottone>
  );
}
