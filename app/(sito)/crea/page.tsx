import type { Metadata } from "next";
import { Suspense } from "react";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { Wizard } from "@/components/wizard/Wizard";

export const metadata: Metadata = { title: "Organizza un regalo", robots: { index: false } };

export default function Crea() {
  return (
    <div className="gutter pb-16 pt-6">
      <Suspense fallback={<p className="py-10 text-center text-ink-soft">Un momento…</p>}>
        <SoloOrganizzatore>
          <Wizard />
        </SoloOrganizzatore>
      </Suspense>
    </div>
  );
}
