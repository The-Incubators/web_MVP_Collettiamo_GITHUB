import { CorniceCompleta } from "@/components/CorniceCompleta";

/** La cornice del sito (Gifty UX v2, design.md §4). */
export default function LayoutSito({ children }: { children: React.ReactNode }) {
  return <CorniceCompleta>{children}</CorniceCompleta>;
}
