#!/usr/bin/env python3
"""
Importa il catalogo nell'app da una o più cartelle sorgente (ciascuna con un file Excel e una cartella immagini/).
Per aggiungere altri prodotti: mettere la nuova cartella in scripts/dati/, accanto alle altre, e aggiungerla a SORGENTI (o a SORGENTI_PLAYLIST, per i file nel formato «playlist»).

  python3 scripts/importa_catalogo.py

Legge solo con la libreria standard di Python (un .xlsx è uno zip di XML). Scrive:
  - lib/dati/catalogo-amazon.json   i prodotti, già validati e normalizzati
  - public/foto-prodotti/<ID>.<ext>  le foto (le stesse del pacchetto)
Poi `pnpm seed` porta il catalogo su Firestore.
I dati del file sono trattati come non fidati: si controllano link, prezzi, ID e percorsi delle immagini.
"""
import json
import re
import shutil
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from datetime import date, timedelta
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
# (cartella, file Excel). L'ordine conta solo per i duplicati: ID, ASIN e nomi devono essere univoci in tutto il catalogo.
SORGENTI = [
    ("catalogo_amazon_prototipo", "catalogo_prodotti_amazon.xlsx"),
    ("catalogo_amazon_150_300_50_prodotti", "catalogo_amazon_50_prodotti_150_300_euro.xlsx"),
    ("catalogo_amazon_arredamento", "catalogo_amazon_arredamento_design_50_prodotti.xlsx"),
    ("catalogo_amazon_evergreen", "catalogo_amazon_evergreen_viaggio_creator_50_prodotti.xlsx"),
]
# Pacchetti nel formato «playlist» (foglio «Prodotti», codici P001…, foto immagini/P001.jpg): colonne diverse,
# niente temi né destinatari. Le scelte editoriali per adattarli al catalogo stanno in un dizionario per pacchetto
# (PLAYLIST_OGGETTI, PLAYLIST_CATEGORIE), più sotto, dove c'è anche l'elenco SORGENTI_PLAYLIST.
M ="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"m": M}

COLONNE = {
    "ID prodotto": "id",
    "Nome prodotto": "nome",
    "Marca": "marca",
    "Descrizione breve": "descrizione",
    "Perché è interessante": "perche",
    "Uomo": "uomo",
    "Donna": "donna",
    "Viaggio": "viaggio",
    "Tecnologia": "tecnologia",
    "Arredamento": "arredamento",
    "Prezzo rilevato (EUR)": "prezzo",
    "ASIN": "asin",
    "Link Amazon": "link",
    "Immagine locale": "immagine",
    "Data rilevazione": "data",
}
# Colonne facoltative (presenti solo in alcuni pacchetti)
COLONNE_FACOLTATIVE = {"Sottocategoria": "sottocategoria"}

COLONNE_PLAYLIST = {
    "ID": "codice",
    "Prodotto": "nome",
    "Marca": "marca",
    "Categoria": "categoria",
    "Descrizione (nostra)": "descrizione",
    "Idea regalo per": "per",
    "ASIN": "asin",
    "Link Amazon": "link",
    "Corrispondenza": "corrispondenza",
}
COLONNA_PREZZO_PLAYLIST = "Prezzo indicativo (€)"  # l'intestazione continua con la data: «… al 2/11/2026»

# Playlist «Gifty - oggetti» (2 novembre 2026)
PLAYLIST_OGGETTI = {
    # P001 → PRD-181: il numero resta lo stesso anche se un prodotto escluso entra più avanti
    "base_id": 180,
    # fuori finché non si controllano: modello o variante incerti («Da verificare») e l'AirTag senza prezzo;
    # P072 costa più di 1.000 €, oltre il limite dei prezzi del catalogo
    "esclusi": {"P007", "P054", "P072", "P086", "P107"},
    # già nel catalogo: stesso ASIN (P045 = PRD-157, P053 = PRD-152, P064 = PRD-053) o stesso prodotto in un'altra
    # variante (P003 = PRD-132, P017 = PRD-149, P047 = PRD-156, P098 = PRD-049)
    "gia_in_catalogo": {"P003", "P017", "P045", "P047", "P053", "P064", "P098"},
    # dalla categoria del file ai nostri temi; i prodotti di cucina, pulizia, lettura e cura restano senza tema
    "temi_per_categoria": {
        "Audio": ["tecnologia"],
        "Tech e ricarica": ["tecnologia"],
        "Accessori smartphone": ["tecnologia"],
        "Foto e video": ["tecnologia"],
        "Ufficio e produttività": ["tecnologia"],
        "Viaggio": ["viaggio"],
    },
    # eccezioni, prodotto per prodotto
    "temi": {
        "P009": ["viaggio", "tecnologia"], "P010": ["viaggio", "tecnologia"], "P011": ["viaggio", "tecnologia"],
        "P041": ["viaggio", "tecnologia"], "P044": ["viaggio", "tecnologia"], "P048": ["viaggio", "tecnologia"],
        "P093": ["viaggio", "tecnologia"],
        "P013": [], "P016": [],
        "P012": ["arredamento"], "P096": ["arredamento"],
        "P055": ["tecnologia"], "P066": ["tecnologia"],
        "P071": ["tecnologia"], "P091": ["tecnologia"], "P095": ["tecnologia"], "P097": ["tecnologia"],
        "P099": ["tecnologia"], "P100": ["tecnologia"], "P102": ["tecnologia"],
        "P062": ["viaggio"], "P063": ["viaggio"], "P065": ["viaggio"],
    },
    "destinatari": {"P095": ["uomo"]},
}

# Playlist «Gifty - categorie personas» (3 novembre 2026): giochi, LEGO, profumi, beauty, orologi, elettrodomestici…
PLAYLIST_CATEGORIE = {
    # P001 → PRD-301: i codici della playlist precedente arrivano a PRD-287, si riparte da un numero tondo
    "base_id": 300,
    # il Casio CA-53WF non ha prezzo
    "esclusi": {"P224"},
    # il Kindle 16 GB è già nel catalogo in un'altra versione (PRD-148)
    "gia_in_catalogo": {"P193"},
    "temi_per_categoria": {"Tecnologia": ["tecnologia"]},
    "temi": {
        # giochi elettronici, robot e visori
        **{c: ["tecnologia"] for c in ("P056", "P057", "P062", "P077", "P079", "P082", "P084", "P093", "P094", "P098")},
        "P189": ["viaggio", "tecnologia"],
        # beauty case, kit da viaggio, cofanetti con tre giorni in Europa, orologio dual time
        **{c: ["viaggio"] for c in ("P126", "P149", "P162", "P164", "P217")},
        # LEGO da esporre, decorazioni, candele e lampade
        **{c: ["arredamento"] for c in ("P034", "P036", "P037", "P048", "P055", "P069", "P167", "P170", "P171", "P174", "P175", "P181", "P183")},
    },
    # profumi, accessori e orologi da uomo; profumi, trucco e accessori da donna. I giocattoli valgono per tutti.
    "destinatari": {
        **{c: ["uomo"] for c in (
            "P100", "P101", "P103", "P111", "P112", "P142", "P150", "P151", "P152", "P194", "P195", "P201", "P202", "P203",
            "P204", "P205", "P208", "P209", "P210", "P211", "P212", "P213", "P214", "P215", "P217", "P218", "P221", "P226", "P228",
        )},
        **{c: ["donna"] for c in (
            "P104", "P105", "P106", "P107", "P109", "P110", "P113", "P114", "P120", "P121", "P122", "P123", "P125", "P126",
            "P127", "P129", "P131", "P132", "P133", "P134", "P135", "P139", "P140", "P141", "P145", "P147", "P148", "P154", "P180",
        )},
    },
}

# (cartella, file Excel, data di rilevazione dei prezzi, scelte editoriali)
SORGENTI_PLAYLIST = [
    ("catalogo_amazon_playlist", "Gifty_database_prodotti_playlist_2Novembre_2026.xlsx", "2026-11-02", PLAYLIST_OGGETTI),
    ("catalogo_amazon_playlist_categorie", "Gifty_database_prodotti_playlist_categorie_3Novembre_2026.xlsx", "2026-11-03", PLAYLIST_CATEGORIE),
]

MAGIC = {".webp": lambda b: b[:4] == b"RIFF" and b[8:12] == b"WEBP", ".jpg": lambda b: b[:3] == b"\xff\xd8\xff", ".jpeg": lambda b: b[:3] == b"\xff\xd8\xff", ".png": lambda b: b[:8] == b"\x89PNG\r\n\x1a\n"}
MAX_FOTO_BYTE = 2 * 1024 * 1024


def pulisci(testo: str) -> str:
    """Testo da un file non fidato: niente caratteri di controllo, spazi singoli e il segno di diametro rotto dell'Excel (ⵁ → Ø)."""
    t = "".join(c for c in testo if c == "\n" or c >= " ")
    return re.sub(r"\s+", " ", t.replace("\u2d41", "Ø")).strip()


def data_excel(seriale: str) -> str:
    """Excel conta i giorni dal 30/12/1899; alcuni file hanno invece una data ISO ("2026-10-16T00:00:00.000Z")."""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}(T.*)?", seriale):
        try:
            return date.fromisoformat(seriale[:10]).isoformat()
        except ValueError:
            errore(f"data non valida: {seriale!r}")
    try:
        return (date(1899, 12, 30) + timedelta(days=int(float(seriale)))).isoformat()
    except ValueError:
        errore(f"data non valida: {seriale!r}")


def errore(msg: str):
    print(f"ERRORE: {msg}", file=sys.stderr)
    sys.exit(1)


def leggi_foglio(file: Path, foglio: "str | None" = None) -> list[dict]:
    """Le righe del primo foglio (o di quello col nome dato) come dizionari intestazione → valore."""
    z = zipfile.ZipFile(file)
    percorso = "xl/worksheets/sheet1.xml"
    if foglio:
        R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        rel = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
        fogli = {f.get("name"): rel[f.get(R)] for f in ET.fromstring(z.read("xl/workbook.xml")).iter(f"{{{M}}}sheet")}
        if foglio not in fogli:
            errore(f"{file.name}: manca il foglio {foglio!r}")
        percorso = "xl/" + fogli[foglio].lstrip("/").removeprefix("xl/")
    condivise = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            condivise.append("".join(t.text or "" for t in si.iter(f"{{{M}}}t")))
    righe = []
    for r in ET.fromstring(z.read(percorso)).iter(f"{{{M}}}row"):
        riga = {}
        for c in r.findall("m:c", NS):
            col = re.match(r"[A-Z]+", c.get("r")).group()
            v = c.find("m:v", NS)
            if c.get("t") == "inlineStr":
                val = "".join(t.text or "" for t in c.iter(f"{{{M}}}t"))
            elif c.get("t") == "s" and v is not None:
                val = condivise[int(v.text)]
            else:
                val = v.text if v is not None else None
            riga[col] = val
        righe.append(riga)
    intest = righe[0]
    return [{intest[k]: v for k, v in r.items() if k in intest} for r in righe[1:]]


def slugify(testo: str) -> str:
    t = unicodedata.normalize("NFD", testo).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60]


def si(v) -> bool:
    return (v or "").strip().lower() in ("sì", "si", "yes", "true", "1")


def perche_da_destinatario(per: str) -> str:
    """«Chi lavora al computer fino a tardi» → «Per chi lavora al computer fino a tardi.»; «Pensierino pratico» resta così."""
    if not per:
        return ""
    if re.match(r"(Pensierino|Regalo|Da abbinare)\b", per):
        frase = per
    else:
        frase = "Per " + per[0].lower() + per[1:]
    return frase if frase.endswith((".", "!", "?")) else frase + "."


def righe_playlist(sorgente: Path, nome_file: str, rilevato: str, PLAYLIST: dict) -> list[dict]:
    """Un pacchetto «playlist» nel formato dei pacchetti classici: ID PRD-nnn, temi, destinatari, prezzo, immagine."""
    righe = leggi_foglio(sorgente / nome_file, "Prodotti")
    colonna_prezzo = next((k for k in righe[0] if k and k.startswith(COLONNA_PREZZO_PLAYLIST)), None)
    mancanti = [c for c in COLONNE_PLAYLIST if c not in righe[0]] + ([] if colonna_prezzo else [COLONNA_PREZZO_PLAYLIST])
    if mancanti:
        errore(f"{sorgente.name}: colonne mancanti nel file: {mancanti}")
    uscita = []
    for r in righe:
        d = {v: pulisci(r.get(k) or "") for k, v in COLONNE_PLAYLIST.items()}
        if not d["codice"]:
            continue
        if not re.fullmatch(r"P\d{3}", d["codice"]):
            errore(f"{sorgente.name}: codice non valido {d['codice']!r}")
        if d["codice"] in PLAYLIST["esclusi"] | PLAYLIST["gia_in_catalogo"]:
            continue
        if d["corrispondenza"].startswith("Da verificare"):
            errore(f"{d['codice']}: è «Da verificare» ma non è tra gli esclusi: controllalo e poi decidi")
        codice = d["codice"]
        temi = PLAYLIST["temi"].get(codice, PLAYLIST["temi_per_categoria"].get(d["categoria"], []))
        destinatari = PLAYLIST["destinatari"].get(codice, ["uomo", "donna"])
        uscita.append(
            {
                "id": f"PRD-{PLAYLIST['base_id'] + int(codice[1:]):03d}",
                "nome": d["nome"],
                "marca": d["marca"],
                "descrizione": d["descrizione"],
                "perche": perche_da_destinatario(d["per"]),
                "uomo": "sì" if "uomo" in destinatari else "",
                "donna": "sì" if "donna" in destinatari else "",
                **{t: ("sì" if t in temi else "") for t in ("viaggio", "tecnologia", "arredamento")},
                "prezzo": pulisci(r.get(colonna_prezzo) or ""),
                "asin": d["asin"],
                "link": d["link"],
                "immagine": f"immagini/{codice}.jpg",
                "data": rilevato,
                "sottocategoria": "",
            }
        )
    return uscita


def main():
    prodotti, visti_id, visti_asin, visti_slug = [], set(), set(), set()
    destinazione = RADICE / "public" / "foto-prodotti"
    destinazione.mkdir(parents=True, exist_ok=True)
    for f in destinazione.glob("*"):
        f.unlink()

    pacchetti = [(c, f, None, None) for c, f in SORGENTI] + SORGENTI_PLAYLIST
    for cartella, nome_file, rilevato, scelte in pacchetti:
        sorgente = RADICE / "scripts" / "dati" / cartella
        if rilevato:
            # già nella forma interna (chiavi = valori di COLONNE)
            righe = righe_playlist(sorgente, nome_file, rilevato, scelte)
        else:
            grezze = leggi_foglio(sorgente / nome_file)
            mancanti = [c for c in COLONNE if c not in grezze[0]]
            if mancanti:
                errore(f"{cartella}: colonne mancanti nel file: {mancanti}")
            righe = [
                {**{COLONNE[k]: pulisci(r.get(k) or "") for k in COLONNE}, **{v: pulisci(r.get(k) or "") for k, v in COLONNE_FACOLTATIVE.items()}}
                for r in grezze
            ]
        for d in righe:
            if not re.fullmatch(r"PRD-\d{3}", d["id"]):
                errore(f"ID non valido: {d['id']!r}")
            if d["id"] in visti_id or d["asin"] in visti_asin:
                errore(f"ID o ASIN duplicato: {d['id']} / {d['asin']}")
            visti_id.add(d["id"])
            visti_asin.add(d["asin"])
            if not re.fullmatch(r"[A-Z0-9]{10}", d["asin"]):
                errore(f"{d['id']}: ASIN non valido")
            if not d["link"].startswith("https://www.amazon.it/dp/" + d["asin"]):
                errore(f"{d['id']}: il link non punta ad Amazon.it con lo stesso ASIN: {d['link']!r}")
            try:
                prezzo_cent = round(float(d["prezzo"]) * 100)
            except ValueError:
                errore(f"{d['id']}: prezzo non valido {d['prezzo']!r}")
            if not 100 <= prezzo_cent <= 100000:
                errore(f"{d['id']}: prezzo fuori scala {prezzo_cent}")
            if not d["nome"] or not d["descrizione"]:
                errore(f"{d['id']}: nome o descrizione vuoti")
            if len(d["nome"]) > 120 or len(d["descrizione"]) > 400 or len(d["sottocategoria"]) > 60:
                errore(f"{d['id']}: testo troppo lungo")
            img = Path(d["immagine"])
            estensione = img.suffix.lower()
            if img.parts[:1] != ("immagini",) or len(img.parts) != 2 or estensione not in MAGIC:
                errore(f"{d['id']}: percorso immagine non valido {d['immagine']!r}")
            origine = sorgente / img
            if not origine.is_file():
                errore(f"{d['id']}: immagine mancante {origine}")
            contenuto = origine.read_bytes()
            if len(contenuto) > MAX_FOTO_BYTE or not MAGIC[estensione](contenuto):
                errore(f"{d['id']}: il file non è un'immagine {estensione} valida o è troppo grande")
            (destinazione / f"{d['id']}{estensione}").write_bytes(contenuto)

            slug = slugify(d["nome"])
            if slug in visti_slug:
                slug = f"{slug}-{d['id'].lower()}"
            visti_slug.add(slug)
            destinatari = [x for x in ("uomo", "donna") if si(d[x])]
            temi = [x for x in ("viaggio", "tecnologia", "arredamento") if si(d[x])]
            prodotti.append(
                {
                    "id": d["id"],
                    "slug": slug,
                    "nome": d["nome"],
                    "marca": d["marca"] or "Generico",
                    "prezzoCent": prezzo_cent,
                    "descrizione": d["descrizione"],
                    "perche": d["perche"],
                    "destinatari": destinatari,
                    "temi": temi,
                    "asin": d["asin"],
                    "urlEsterno": d["link"],
                    **({"sottocategoria": d["sottocategoria"]} if d["sottocategoria"] else {}),
                    "foto": f"/foto-prodotti/{d['id']}{estensione}",
                    "rilevatoIl": data_excel(d["data"]),
                }
            )
        print(f"  {cartella}: {len(righe)} prodotti")

    prodotti.sort(key=lambda p: p["id"])
    uscita = RADICE / "lib" / "dati" / "catalogo-amazon.json"
    uscita.write_text(json.dumps(prodotti, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Importati {len(prodotti)} prodotti → {uscita.relative_to(RADICE)}; foto in public/foto-prodotti/")


if __name__ == "__main__":
    main()
