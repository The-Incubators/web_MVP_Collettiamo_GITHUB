// I modelli di copertina. Disegni nostri (gradiente + motivo), non illustrazioni esterne: niente marchi copiati.
// Nel prototipo vivono nel codice (come il catalogo); lo script di seed potrà scriverli su Firestore.

import type { ModelloBiglietto, SfondoModello, ZonaTitolo } from "../tipi";

function titolo(colore: string, dimensione = 58, maiuscolo = false): ZonaTitolo {
  return { x: 8, y: 52, w: 84, font: "var(--font-display)", colore, dimensione, maiuscolo, allineamento: "center", segnaposto: "Il tuo titolo qui" };
}

interface Voce {
  id: string;
  nome: string;
  occasioni: string[];
  sfondo: SfondoModello;
  testoFisso: string;
  coloreTitolo: string;
  tipo?: ModelloBiglietto["tipo"];
}

const VOCI: Voce[] = [
  { id: "compleanno-palloncini", nome: "Palloncini", occasioni: ["compleanno", "festa"], sfondo: { tipo: "gradiente", da: "#FDE1E4", a: "#FAC7D5", motivo: "🎈" }, testoFisso: "Buon compleanno", coloreTitolo: "#7A2E4A" },
  { id: "compleanno-torta", nome: "Torta e candeline", occasioni: ["compleanno"], sfondo: { tipo: "gradiente", da: "#FFF3C4", a: "#FBE19A", motivo: "🎂" }, testoFisso: "Tanti auguri", coloreTitolo: "#8A5A1A" },
  { id: "compleanno-coriandoli", nome: "Coriandoli", occasioni: ["compleanno", "festa", "ricorrenze"], sfondo: { tipo: "gradiente", da: "#E7E0FF", a: "#CDBFFF", motivo: "🎉" }, testoFisso: "Buon compleanno!", coloreTitolo: "#3E2E7A" },
  { id: "saluto-fortuna", nome: "In bocca al lupo", occasioni: ["saluto"], sfondo: { tipo: "gradiente", da: "#D7F0E3", a: "#BDE6D2", motivo: "👋" }, testoFisso: "Buona fortuna", coloreTitolo: "#164A33" },
  { id: "pensione-tramonto", nome: "Relax", occasioni: ["pensione"], sfondo: { tipo: "gradiente", da: "#DCEBFF", a: "#C0D8FF", motivo: "🌅" }, testoFisso: "Buona pensione", coloreTitolo: "#1E3A66" },
  { id: "laurea-tocco", nome: "Il tocco", occasioni: ["laurea"], sfondo: { tipo: "gradiente", da: "#1E2A52", a: "#32437F", motivo: "🎓" }, testoFisso: "Congratulazioni", coloreTitolo: "#FFFFFF" },
  { id: "nascita-benvenuto", nome: "Benvenuto", occasioni: ["nascita"], sfondo: { tipo: "gradiente", da: "#E3F3FF", a: "#C9E7FF", motivo: "👶" }, testoFisso: "Benvenuto/a", coloreTitolo: "#1E4A66" },
  { id: "matrimonio-fiori", nome: "Fiori", occasioni: ["matrimonio"], sfondo: { tipo: "gradiente", da: "#FBE9EF", a: "#F2D2DF", motivo: "💍" }, testoFisso: "Congratulazioni", coloreTitolo: "#6E2E48" },
  { id: "grazie-cuore", nome: "Grazie di cuore", occasioni: ["grazie", "insegnante", "allenatore"], sfondo: { tipo: "gradiente", da: "#E6F0E6", a: "#CDE3CD", motivo: "🙏" }, testoFisso: "Grazie di cuore", coloreTitolo: "#2A4A2A" },
  { id: "guarisci-fiore", nome: "Rimettiti presto", occasioni: ["guarisci"], sfondo: { tipo: "gradiente", da: "#FFF6D9", a: "#FFE7AC", motivo: "🌷" }, testoFisso: "Rimettiti presto", coloreTitolo: "#7A5A1A" },
  { id: "festa-coriandoli", nome: "Si festeggia", occasioni: ["festa", "ricorrenze", "anniversario-lavoro"], sfondo: { tipo: "gradiente", da: "#FFE6D9", a: "#FFCBB2", motivo: "🎊" }, testoFisso: "Si festeggia!", coloreTitolo: "#7A3A1A" },
  { id: "auguri-neutro", nome: "Auguri", occasioni: ["altro", "ricorrenze", "capo", "anniversario-lavoro", "condoglianze", "animale", "festa", "saluto", "pensione", "insegnante", "allenatore", "grazie"], sfondo: { tipo: "gradiente", da: "#EDF1EE", a: "#D7E6DE", motivo: "✍️" }, testoFisso: "Auguri!", coloreTitolo: "#16241F" },
];

export const MODELLI_BIGLIETTO: ModelloBiglietto[] = VOCI.map((v, i) => ({
  id: v.id,
  nome: v.nome,
  occasioni: v.occasioni,
  tipo: v.tipo ?? "illustrato",
  sfondo: v.sfondo,
  titolo: titolo(v.coloreTitolo),
  sottotitolo: null,
  testoFisso: v.testoFisso,
  ordine: i + 1,
  attivo: true,
}));

/**
 * Le caselle speciali della galleria (sempre in testa, per ogni occasione): l'immagine la mette chi organizza.
 * «Carica immagine»: immagine in alto e titolo sotto. «Foto a tutta pagina»: la foto riempie la copertina.
 */
export const MODELLI_SPECIALI: ModelloBiglietto[] = [
  {
    id: "carica-immagine",
    nome: "Carica immagine o GIF",
    occasioni: [],
    tipo: "carica-immagine",
    sfondo: { tipo: "tinta", colore: "#FFFFFF", motivo: "" },
    titolo: { x: 6, y: 74, w: 88, font: "var(--font-display)", colore: "#16241F", dimensione: 52, maiuscolo: true, allineamento: "center", segnaposto: "Il tuo titolo qui" },
    sottotitolo: null,
    testoFisso: null,
    ordine: 0,
    attivo: true,
  },
  {
    id: "foto-intera",
    nome: "Foto a tutta pagina",
    occasioni: [],
    tipo: "foto-intera",
    sfondo: { tipo: "tinta", colore: "#2B3833", motivo: "" },
    titolo: { x: 6, y: 80, w: 88, font: "var(--font-display)", colore: "#FFFFFF", dimensione: 54, maiuscolo: false, allineamento: "center", segnaposto: "Il tuo titolo qui" },
    sottotitolo: null,
    testoFisso: null,
    ordine: 0,
    attivo: true,
  },
];

export function modelloPerId(id: string): ModelloBiglietto | null {
  return MODELLI_BIGLIETTO.find((m) => m.id === id) ?? MODELLI_SPECIALI.find((m) => m.id === id) ?? null;
}

/** I modelli illustrati per un'occasione, nell'ordine; se l'occasione non ne ha, tutti. */
export function modelliPerOccasione(occasione: string): ModelloBiglietto[] {
  const filtrati = MODELLI_BIGLIETTO.filter((m) => m.attivo && m.occasioni.includes(occasione));
  return filtrati.length ? filtrati : MODELLI_BIGLIETTO.filter((m) => m.attivo);
}
