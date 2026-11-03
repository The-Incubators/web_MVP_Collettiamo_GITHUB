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
  // dalla playlist «Gifty - oggetti» (2 novembre 2026); i numeri mancanti sono prodotti esclusi dall'importazione
  "PRD-181": "ARD", "PRD-182": "RD", "PRD-184": "D", "PRD-185": "ARD", "PRD-186": "ARD", "PRD-188": "ARD",
  "PRD-189": "ARD", "PRD-190": "ARD", "PRD-191": "RD", "PRD-192": "ARD", "PRD-193": "ARD", "PRD-194": "ARD",
  "PRD-195": "ARD", "PRD-196": "ARD", "PRD-198": "ARD", "PRD-199": "RD", "PRD-200": "D", "PRD-201": "D",
  "PRD-202": "RD", "PRD-203": "RD", "PRD-204": "RD", "PRD-205": "RD", "PRD-206": "RD", "PRD-207": "RD",
  "PRD-208": "RD", "PRD-209": "RD", "PRD-210": "D", "PRD-211": "RD", "PRD-212": "RD", "PRD-213": "RD",
  "PRD-214": "RD", "PRD-215": "RD", "PRD-216": "RD", "PRD-217": "ARD", "PRD-218": "AR", "PRD-219": "D",
  "PRD-220": "RD", "PRD-221": "RD", "PRD-222": "ARD", "PRD-223": "RD", "PRD-224": "ARD", "PRD-226": "ARD",
  "PRD-228": "ARD", "PRD-229": "RD", "PRD-230": "RD", "PRD-231": "ARD", "PRD-232": "RD", "PRD-235": "ARD",
  "PRD-236": "RD", "PRD-237": "RD", "PRD-238": "RD", "PRD-239": "RD", "PRD-240": "RD", "PRD-241": "RD",
  "PRD-242": "RD", "PRD-243": "ARD", "PRD-245": "ARD", "PRD-246": "RD", "PRD-247": "AR", "PRD-248": "RD",
  "PRD-249": "RD", "PRD-250": "ARD", "PRD-251": "RD", "PRD-253": "ARD", "PRD-254": "AR", "PRD-255": "ARD",
  "PRD-256": "AR", "PRD-257": "AR", "PRD-258": "AR", "PRD-259": "RD", "PRD-260": "ARD", "PRD-261": "ARD",
  "PRD-262": "ARD", "PRD-263": "RD", "PRD-264": "ARD", "PRD-265": "AR", "PRD-267": "RD", "PRD-268": "RD",
  "PRD-269": "ARD", "PRD-270": "AR", "PRD-271": "ARD", "PRD-272": "RD", "PRD-273": "RD", "PRD-274": "ARD",
  "PRD-275": "RD", "PRD-276": "RD", "PRD-277": "D", "PRD-279": "RD", "PRD-280": "D", "PRD-281": "RD",
  "PRD-282": "RD", "PRD-283": "RD", "PRD-284": "ARD", "PRD-285": "ARD", "PRD-286": "D",
  // playlist «Gifty - categorie personas» (3 novembre 2026)
  "PRD-301": "BARD", "PRD-302": "BARD", "PRD-303": "ARD", "PRD-304": "ARD", "PRD-305": "ARD", "PRD-306": "BARD",
  "PRD-307": "RD", "PRD-308": "BARD", "PRD-309": "ARD", "PRD-310": "ARD", "PRD-311": "ARD", "PRD-312": "BARD",
  "PRD-313": "RD", "PRD-314": "BARD", "PRD-315": "BARD", "PRD-316": "BARD", "PRD-317": "ARD", "PRD-318": "ARD",
  "PRD-319": "ARD", "PRD-320": "BARD", "PRD-321": "ARD", "PRD-322": "BARD", "PRD-323": "ARD", "PRD-324": "ARD",
  "PRD-325": "ARD", "PRD-326": "AR", "PRD-327": "AR", "PRD-328": "AR", "PRD-329": "ARD", "PRD-330": "ARD",
  "PRD-331": "ARD", "PRD-332": "ARD", "PRD-333": "ARD", "PRD-334": "RD", "PRD-335": "RD", "PRD-336": "RD",
  "PRD-337": "BARD", "PRD-338": "BA", "PRD-339": "B", "PRD-340": "BARD", "PRD-341": "BARD", "PRD-342": "ARD",
  "PRD-343": "B", "PRD-344": "BA", "PRD-345": "BARD", "PRD-346": "B", "PRD-347": "ARD", "PRD-348": "BARD",
  "PRD-349": "BA", "PRD-350": "B", "PRD-351": "B", "PRD-352": "RD", "PRD-353": "RD", "PRD-354": "ARD",
  "PRD-355": "RD", "PRD-356": "B", "PRD-357": "BA", "PRD-358": "B", "PRD-359": "B", "PRD-360": "BARD",
  "PRD-361": "B", "PRD-362": "BA", "PRD-363": "B", "PRD-364": "B", "PRD-365": "B", "PRD-366": "B",
  "PRD-367": "B", "PRD-368": "B", "PRD-369": "BA", "PRD-370": "B", "PRD-371": "B", "PRD-372": "B",
  "PRD-373": "BARD", "PRD-374": "B", "PRD-375": "B", "PRD-376": "B", "PRD-377": "BA", "PRD-378": "B",
  "PRD-379": "ARD", "PRD-380": "B", "PRD-381": "B", "PRD-382": "B", "PRD-383": "ARD", "PRD-384": "B",
  "PRD-385": "B", "PRD-386": "B", "PRD-387": "B", "PRD-388": "B", "PRD-389": "B", "PRD-390": "B",
  "PRD-391": "BA", "PRD-392": "BA", "PRD-393": "BA", "PRD-394": "AR", "PRD-395": "B", "PRD-396": "B",
  "PRD-397": "BARD", "PRD-398": "B", "PRD-399": "B", "PRD-400": "RD", "PRD-401": "RD", "PRD-402": "R",
  "PRD-403": "R", "PRD-404": "R", "PRD-405": "R", "PRD-406": "AR", "PRD-407": "AR", "PRD-408": "RD",
  "PRD-409": "RD", "PRD-410": "RD", "PRD-411": "RD", "PRD-412": "RD", "PRD-413": "D", "PRD-414": "D",
  "PRD-415": "RD", "PRD-416": "RD", "PRD-417": "ARD", "PRD-418": "RD", "PRD-419": "RD", "PRD-420": "RD",
  "PRD-421": "RD", "PRD-422": "AR", "PRD-423": "R", "PRD-424": "RD", "PRD-425": "AR", "PRD-426": "RD",
  "PRD-427": "ARD", "PRD-428": "RD", "PRD-429": "AR", "PRD-430": "RD", "PRD-431": "AR", "PRD-432": "AR",
  "PRD-433": "AR", "PRD-434": "AR", "PRD-435": "RD", "PRD-436": "RD", "PRD-437": "RD", "PRD-438": "RD",
  "PRD-439": "AR", "PRD-440": "ARD", "PRD-441": "RD", "PRD-442": "RD", "PRD-443": "RD", "PRD-444": "RD",
  "PRD-445": "RD", "PRD-446": "RD", "PRD-447": "R", "PRD-448": "AR", "PRD-449": "RD", "PRD-450": "RD",
  "PRD-451": "D", "PRD-452": "RD", "PRD-453": "AR", "PRD-454": "RD", "PRD-455": "ARD", "PRD-456": "BARD",
  "PRD-457": "D", "PRD-458": "D", "PRD-459": "RD", "PRD-460": "D", "PRD-461": "D", "PRD-462": "RD",
  "PRD-463": "RD", "PRD-464": "RD", "PRD-465": "RD", "PRD-466": "RD", "PRD-467": "D", "PRD-468": "ARD",
  "PRD-469": "RD", "PRD-470": "RD", "PRD-471": "RD", "PRD-472": "ARD", "PRD-473": "AR", "PRD-474": "D",
  "PRD-475": "RD", "PRD-476": "RD", "PRD-477": "BA", "PRD-478": "ARD", "PRD-479": "ARD", "PRD-480": "RD",
  "PRD-481": "RD", "PRD-482": "RD", "PRD-483": "RD", "PRD-484": "ARD", "PRD-485": "RD", "PRD-486": "RD",
  "PRD-487": "RD", "PRD-488": "ARD", "PRD-489": "ARD", "PRD-490": "RD", "PRD-491": "D", "PRD-492": "D",
  "PRD-494": "D", "PRD-495": "D", "PRD-496": "AR", "PRD-497": "ARD", "PRD-498": "RD", "PRD-499": "R",
  "PRD-500": "AR", "PRD-501": "RD", "PRD-502": "D", "PRD-503": "RD", "PRD-504": "D", "PRD-505": "D",
  "PRD-506": "AR", "PRD-507": "RD", "PRD-508": "RD", "PRD-509": "D", "PRD-510": "D", "PRD-511": "D",
  "PRD-512": "D", "PRD-513": "RD", "PRD-514": "D", "PRD-515": "D", "PRD-516": "R", "PRD-517": "D",
  "PRD-518": "D", "PRD-519": "AR", "PRD-520": "R", "PRD-521": "RD", "PRD-522": "AR", "PRD-523": "AR",
  "PRD-525": "AR", "PRD-526": "RD", "PRD-527": "R", "PRD-528": "RD", "PRD-529": "RD", "PRD-530": "RD",
  "PRD-531": "RD", "PRD-532": "D", "PRD-533": "RD", "PRD-534": "RD", "PRD-535": "D", "PRD-536": "D",
  "PRD-537": "RD", "PRD-538": "D", "PRD-539": "RD", "PRD-540": "RD", "PRD-541": "D", "PRD-542": "RD",
  "PRD-543": "D", "PRD-544": "RD",
};

/** Le fasce d'età di un prodotto (vuoto se non è classificato, per esempio un regalo da link). */
export function fasceEta(p: Pick<Prodotto, "id">): FasciaEta[] {
  const codici = p.id ? (ETA_PRODOTTI[p.id] ?? "") : "";
  return FASCE_ETA.filter((f) => codici.includes(f.codice)).map((f) => f.id);
}
