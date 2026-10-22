import Link from "next/link";

export default function ColletteNonTrovata() {
  return (
    <div className="flex flex-col gap-4 py-10">
      <h1 className="text-3xl">Questa colletta non esiste o è stata chiusa</h1>
      <p className="text-ink-soft">Controlla di aver copiato tutto il link, oppure chiedi a chi te l’ha mandato di rimandartelo.</p>
      <Link href="/" className="min-h-tocco font-semibold text-accent-2 underline underline-offset-4">
        Vai alla pagina iniziale
      </Link>
    </div>
  );
}
