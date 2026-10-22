import Link from "next/link";

export default function NonTrovata() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 gutter py-16">
      <h1 className="text-3xl">Questa pagina non esiste</h1>
      <p className="text-ink-soft">Il link potrebbe essere incompleto, oppure la pagina è stata spostata.</p>
      <Link href="/" className="min-h-tocco font-semibold text-accent-2 underline underline-offset-4">
        Vai alla pagina iniziale
      </Link>
    </main>
  );
}
