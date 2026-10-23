import type { Prodotto } from "@/lib/tipi";

/**
 * Le fasce d'età per il filtro del catalogo. Il catalogo (i file Excel) non ha l'età: la classificazione è
 * editoriale, fatta leggendo nome e descrizione di ogni prodotto (vedi DECISIONI.md, sezione 32), e sta qui
 * perché le importazioni dall'Excel non la cancellino. Un prodotto può stare in più fasce.
 */
export const FASCE_ETA = [
  { id: "bambino", etichetta: "Bambino", anni: "0–12", codice: "B" },
  { id: "adolescente", etichetta: "Adolescente", anni: "13–17", codice: "A" },
  { id: "ragazzo", etichetta: "Ragazzo", anni: "18–29", codice: "R" },
  { id: "adulto", etichetta: "Adulto", anni: "30+", codice: "D" },
] as const;

export type FasciaEta = (typeof FASCE_ETA)[number]["id"];

/**
 * Per ogni prodotto (codice PRD-nnn, stabile anche se cambia il nome) le lettere delle sue fasce:
 * B bambino, A adolescente, R ragazzo, D adulto. Un prodotto nuovo va aggiunto qui: il test
 * `eta-prodotti.test.ts` fallisce se nel catalogo ce n'è uno senza età.
 */
export const ETA_PRODOTTI: Record<string, string> = {
  "PRD-001": "RD", "PRD-002": "BARD", "PRD-003": "ARD", "PRD-004": "ARD", "PRD-005": "RD", "PRD-006": "BAR",
  "PRD-007": "ARD", "PRD-008": "ARD", "PRD-009": "RD", "PRD-010": "ARD", "PRD-011": "AR", "PRD-012": "AR",
  "PRD-013": "RD", "PRD-014": "ARD", "PRD-015": "BAR", "PRD-016": "AR", "PRD-017": "ARD", "PRD-018": "RD",
  "PRD-019": "AR", "PRD-020": "RD", "PRD-021": "ARD", "PRD-022": "RD", "PRD-023": "RD", "PRD-024": "R",
  "PRD-025": "AR", "PRD-026": "RD", "PRD-027": "ARD", "PRD-028": "RD", "PRD-029": "RD", "PRD-030": "ARD",
  "PRD-031": "RD", "PRD-032": "RD", "PRD-033": "RD", "PRD-034": "RD", "PRD-035": "RD", "PRD-036": "RD",
  "PRD-037": "RD", "PRD-038": "RD", "PRD-039": "RD", "PRD-040": "RD", "PRD-041": "ARD", "PRD-042": "AR",
  "PRD-043": "AR", "PRD-044": "AR", "PRD-045": "RD", "PRD-046": "AR", "PRD-047": "AR", "PRD-048": "AR",
  "PRD-049": "AR", "PRD-050": "RD", "PRD-051": "AR", "PRD-052": "RD", "PRD-053": "RD", "PRD-054": "RD",
  "PRD-055": "RD", "PRD-056": "RD", "PRD-057": "RD", "PRD-058": "RD", "PRD-059": "RD", "PRD-060": "RD",
  "PRD-061": "RD", "PRD-062": "RD", "PRD-063": "D", "PRD-064": "ARD", "PRD-065": "RD", "PRD-066": "RD",
  "PRD-067": "RD", "PRD-068": "RD", "PRD-069": "AR", "PRD-070": "RD", "PRD-071": "RD", "PRD-072": "RD",
  "PRD-073": "RD", "PRD-074": "RD", "PRD-075": "D", "PRD-076": "D", "PRD-077": "AR", "PRD-078": "RD",
  "PRD-079": "AR", "PRD-080": "RD", "PRD-081": "RD", "PRD-082": "D", "PRD-083": "RD", "PRD-084": "RD",
  "PRD-085": "RD", "PRD-086": "D", "PRD-087": "RD", "PRD-088": "BAR", "PRD-089": "RD", "PRD-090": "D",
  "PRD-091": "D", "PRD-092": "D", "PRD-093": "D", "PRD-094": "D", "PRD-095": "D", "PRD-096": "D",
  "PRD-097": "RD", "PRD-098": "RD", "PRD-099": "RD", "PRD-100": "RD", "PRD-101": "RD", "PRD-102": "AR",
  "PRD-103": "RD", "PRD-104": "D", "PRD-105": "AR", "PRD-106": "AR", "PRD-107": "BA", "PRD-108": "D",
  "PRD-109": "RD", "PRD-110": "D", "PRD-111": "D", "PRD-112": "D", "PRD-113": "D", "PRD-114": "RD",
  "PRD-115": "RD", "PRD-116": "RD", "PRD-117": "D", "PRD-118": "D", "PRD-119": "AR", "PRD-120": "RD",
  "PRD-121": "D", "PRD-122": "RD", "PRD-123": "RD", "PRD-124": "RD", "PRD-125": "D", "PRD-126": "D",
  "PRD-127": "BAR", "PRD-128": "D", "PRD-129": "ARD", "PRD-130": "ARD", "PRD-131": "ARD", "PRD-132": "ARD",
  "PRD-133": "ARD", "PRD-134": "ARD", "PRD-135": "RD", "PRD-136": "RD", "PRD-137": "RD", "PRD-138": "ARD",
  "PRD-139": "ARD", "PRD-140": "BAR", "PRD-141": "ARD", "PRD-142": "ARD", "PRD-143": "ARD", "PRD-144": "RD",
  "PRD-145": "RD", "PRD-146": "RD", "PRD-147": "RD", "PRD-148": "ARD", "PRD-149": "ARD", "PRD-150": "ARD",
  "PRD-151": "RD", "PRD-152": "RD", "PRD-153": "RD", "PRD-154": "RD", "PRD-155": "RD", "PRD-156": "RD",
  "PRD-157": "RD", "PRD-158": "RD", "PRD-159": "RD", "PRD-160": "RD", "PRD-161": "RD", "PRD-162": "AR",
  "PRD-163": "ARD", "PRD-164": "RD", "PRD-165": "AR", "PRD-166": "AR", "PRD-167": "AR", "PRD-168": "AR",
  "PRD-169": "ARD", "PRD-170": "AR", "PRD-171": "AR", "PRD-172": "ARD", "PRD-173": "RD", "PRD-174": "AR",
  "PRD-175": "RD", "PRD-176": "RD", "PRD-177": "RD", "PRD-178": "RD", "PRD-179": "RD", "PRD-180": "RD",
};

/** Le fasce d'età di un prodotto (vuoto se non è classificato, per esempio un regalo da link). */
export function fasceEta(p: Pick<Prodotto, "id">): FasciaEta[] {
  const codici = p.id ? (ETA_PRODOTTI[p.id] ?? "") : "";
  return FASCE_ETA.filter((f) => codici.includes(f.codice)).map((f) => f.id);
}
