import type { Metadata } from "next";
import { ElencoCollette } from "@/components/ElencoCollette";

export const metadata: Metadata = { title: "Le mie collette", robots: { index: false } };

export default function LeMieCollette() {
  return (
    <div className="gutter pb-16 pt-8">
      <ElencoCollette />
    </div>
  );
}
