import type { Metadata } from "next";
import { CancellaAccount } from "@/components/account/CancellaAccount";

export const metadata: Metadata = { title: "Cancella l'account", robots: { index: false, follow: false } };

/** Cancella l'account (design.md §10.3). La pagina controlla da sola l'accesso: dopo la cancellazione resta visibile. */
export default function PaginaCancellaAccount() {
  return <CancellaAccount />;
}
