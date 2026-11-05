import { redirect } from "next/navigation";

/** Il vecchio indirizzo dei regali organizzati: ora sono in «I miei regali». */
export default function LeMieCollette() {
  redirect("/account/regali");
}
