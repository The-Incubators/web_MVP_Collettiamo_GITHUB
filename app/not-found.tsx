import { NonTrovato } from "@/components/NonTrovato";

export default function NonTrovata() {
  return (
    <main className="gutter flex min-h-dvh items-center py-16">
      <NonTrovato titolo="Pagina non trovata" testo="Il link potrebbe essere incompleto, oppure la pagina è stata spostata." />
    </main>
  );
}
