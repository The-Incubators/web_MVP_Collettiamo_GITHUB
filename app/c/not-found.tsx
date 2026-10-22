import { NonTrovato } from "@/components/NonTrovato";

export default function ColletteNonTrovata() {
  return (
    <div className="py-10">
      <NonTrovato icona="redeem" titolo="Questa colletta non esiste" testo="Controlla di aver copiato tutto il link, o chiedi a chi te l’ha mandato di rimandartelo." />
    </div>
  );
}
