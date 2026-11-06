"use client";

import { useEffect } from "react";
import { segnaVisto } from "@/lib/vistiDiRecente";

/** Messo nella scheda prodotto: la fa entrare nei «Visti di recente» della home. Non disegna nulla. */
export function SegnaVisto({ slug }: { slug: string }) {
  useEffect(() => segnaVisto(slug), [slug]);
  return null;
}
