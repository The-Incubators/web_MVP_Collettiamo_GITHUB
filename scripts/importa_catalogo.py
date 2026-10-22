#!/usr/bin/env python3
"""
Importa il catalogo nell'app da una o più cartelle sorgente (ciascuna con un file Excel e una cartella immagini/).
Per aggiungere altri prodotti: mettere la nuova cartella accanto alle altre e aggiungerla a SORGENTI.

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
M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
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


def leggi_foglio(file: Path) -> list[dict]:
    z = zipfile.ZipFile(file)
    condivise = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            condivise.append("".join(t.text or "" for t in si.iter(f"{{{M}}}t")))
    righe = []
    for r in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(f"{{{M}}}row"):
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


def main():
    prodotti, visti_id, visti_asin, visti_slug = [], set(), set(), set()
    destinazione = RADICE / "public" / "foto-prodotti"
    destinazione.mkdir(parents=True, exist_ok=True)
    for f in destinazione.glob("*"):
        f.unlink()

    for cartella, nome_file in SORGENTI:
        sorgente = RADICE / cartella
        righe = leggi_foglio(sorgente / nome_file)
        mancanti = [c for c in COLONNE if c not in righe[0]]
        if mancanti:
            errore(f"{cartella}: colonne mancanti nel file: {mancanti}")
        for r in righe:
            d = {COLONNE[k]: pulisci(r.get(k) or "") for k in COLONNE}
            d.update({v: pulisci(r.get(k) or "") for k, v in COLONNE_FACOLTATIVE.items()})
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
