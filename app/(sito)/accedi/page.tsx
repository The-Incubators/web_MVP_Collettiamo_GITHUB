import type { Metadata } from "next";
import { Suspense } from "react";
import { FormAccesso } from "@/components/FormAccesso";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

export default function Accedi() {
  return (
    <div className="gutter pb-10 pt-6">
      <Suspense fallback={<p className="text-center text-ink-soft">Un momento…</p>}>
        <FormAccesso />
      </Suspense>
    </div>
  );
}
