import type { Metadata } from "next";
import { PaginaReminder } from "@/components/reminder/PaginaReminder";

export const metadata: Metadata = { title: "Ricorrenze", robots: { index: false } };

/** I compleanni e le ricorrenze da non dimenticare: stanno nel browser o nell'account, si leggono lì. */
export default function Reminder() {
  return (
    <div className="gutter pb-10 pt-4">
      <PaginaReminder />
    </div>
  );
}
