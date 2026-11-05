import type { Metadata } from "next";
import { MieiRegali } from "@/components/account/MieiRegali";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";

export const metadata: Metadata = { title: "I miei regali", robots: { index: false } };

export default function PaginaMieiRegali() {
  return (
    <SoloOrganizzatore>
      <MieiRegali />
    </SoloOrganizzatore>
  );
}
