import type { Metadata } from "next";
import { PaginaAccount } from "@/components/account/PaginaAccount";

export const metadata: Metadata = { title: "Il tuo account", robots: { index: false } };

/** L'account (Gifty-spec-prodotto.md S-11). */
export default function Account() {
  return (
    <div className="gutter pb-10 pt-4 sm:pt-10">
      <PaginaAccount />
    </div>
  );
}
