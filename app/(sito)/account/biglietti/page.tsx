import type { Metadata } from "next";
import { MieiBiglietti } from "@/components/account/MieiBiglietti";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";

export const metadata: Metadata = { title: "I miei biglietti", robots: { index: false } };

export default function PaginaMieiBiglietti() {
  return (
    <SoloOrganizzatore>
      <MieiBiglietti />
    </SoloOrganizzatore>
  );
}
