import { CorniceCompleta } from "@/components/CorniceCompleta";

/** La pagina di chi riceve il link ha la stessa intestazione del sito (design.md §6, G-13; prototipi/invito.html). */
export default function LayoutInvito({ children }: { children: React.ReactNode }) {
  return <CorniceCompleta>{children}</CorniceCompleta>;
}
