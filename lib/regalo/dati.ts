// Dati statici del percorso «Trova il regalo»: nessuna logica, nessun DOM.
// Le tappe, i generi, le occasioni e i 36 interessi sono quelli del percorso di partenza.
// Adattati al nostro catalogo: `parole` sono cercate nei testi dei prodotti (nome, descrizione, perché, marca,
// sottocategoria) e `temi` sono i nostri temi reali (viaggio, tecnologia, arredamento), non le categorie dell'altro sito.
//
// Le radici si cercano dall'inizio della parola (vedi `normalizza`), quindi vanno scelte lunghe e specifiche:
// radici corte o comuni pescano prodotti sbagliati. Tolte per questo "spa" (prendeva «Spacey, tavolino oro»),
// "eco" (prendeva «economico»), "auto" (prendeva «automatico») e "design", che compare nel 22% del catalogo,
// marche comprese («Peak Design», «Kare Design»), ed è troppo generica per dire qualcosa.

export const MIN_INTERESSI = 3;
export const MAX_INTERESSI = 5;

export const TAPPE = [
  { id: 1, etichetta: "Destinatario", icona: "users" },
  { id: 2, etichetta: "Occasione", icona: "calendar" },
  { id: 3, etichetta: "Interessi", icona: "music" },
  { id: 4, etichetta: "Trovato!", icona: "gift" },
] as const;

/** I valori corrispondono ai nostri `destinatari` ("donna", "uomo"). */
export const GENERI = [
  { id: "donna", etichetta: "Donna", icona: "venus" },
  { id: "uomo", etichetta: "Uomo", icona: "mars" },
] as const;

export type Genere = (typeof GENERI)[number]["id"];

// La domanda sulla relazione (Fidanzata, Mamma, Sorella…) è stata tolta dalla prima tappa: vedi DECISIONI.md,
// sezione 21. Non pesava sui risultati, quindi toglierla non cambia la graduatoria, solo il numero di domande.

export const OCCASIONI_REGALO = [
  { id: "anniversario", etichetta: "Anniversario", icona: "rings" },
  { id: "san-valentino", etichetta: "San Valentino", icona: "heart" },
  { id: "natale", etichetta: "Natale", icona: "tree" },
  { id: "laurea", etichetta: "Laurea", icona: "cap" },
  { id: "compleanno", etichetta: "Compleanno", icona: "cake" },
  { id: "altro", etichetta: "Altro", icona: "gift" }, // "sparkles" ha il disegno in un riquadro 24×24 e non si vede
] as const;

export const CATEGORIE_INTERESSI = [
  { id: "cultura", etichetta: "Cultura" },
  { id: "sport", etichetta: "Sport" },
  { id: "food", etichetta: "Food&Drink" },
  { id: "avventura", etichetta: "Adventure" },
  { id: "societa", etichetta: "Società" },
  { id: "altre", etichetta: "Altre passioni" },
] as const;

export interface Interesse {
  id: string;
  categoria: string;
  etichetta: string;
  icona: string;
  /** radici di parola (senza accenti) cercate nei testi del prodotto */
  parole: string[];
  /** i nostri temi affini */
  temi: string[];
}

const i = (id: string, categoria: string, etichetta: string, icona: string, parole: string[], temi: string[] = []): Interesse => ({
  id,
  categoria,
  etichetta,
  icona,
  parole,
  temi,
});

export const INTERESSI: Interesse[] = [
  i("musei", "cultura", "Musei & Arte", "landmark", ["arte", "quadro", "scultur", "museo", "cornice"], ["arredamento"]),
  i("cinema", "cultura", "Cinema & Serie TV", "film", ["proiettor", "tv", "cinema", "film", "serie"], ["tecnologia"]),
  i("foto", "cultura", "Foto & Video", "camera", ["foto", "fotocamera", "video", "gimbal", "obiettiv"], ["tecnologia"]),
  i("musica", "cultura", "Musica", "music", ["musica", "audio", "cuffie", "auricolar", "altoparlante", "speaker", "microfono"], ["tecnologia"]),
  i("disegno", "cultura", "Disegno & Pittura", "palette", ["disegn", "colore", "penna", "scrittur", "taccuin"], []),
  i("lettura", "cultura", "Lettura & Scrittura", "book", ["lettura", "libro", "ebook", "kindle", "segnalibro"], []),

  i("fitness", "sport", "Fitness", "dumbbell", ["fitness", "palestra", "allenamento", "shaker"], []),
  i("corsa", "sport", "Corsa", "timer", ["corsa", "running", "borraccia", "cardio"], []),
  i("calcio", "sport", "Calcio", "ball", ["calcio", "sport", "squadra"], []),
  i("ciclismo", "sport", "Ciclismo", "bike", ["bici", "ciclismo", "borraccia"], ["viaggio"]),
  i("yoga", "sport", "Yoga", "lotus", ["yoga", "relax", "benessere", "sonno", "respir"], []),
  i("nuoto", "sport", "Nuoto", "waves", ["nuoto", "piscina", "mare", "impermeabil", "acqua"], ["viaggio"]),

  i("cucina", "food", "Cucina", "chef", ["cucina", "ricetta", "tazza", "pentol", "tagliere"], []),
  i("caffe", "food", "Caffè", "coffee", ["caffe", "espresso", "caffettiera", "aeropress", "moka"], []),
  i("vino", "food", "Vino", "wine", ["vino", "cantina", "calice", "cavatappi"], []),
  i("dolci", "food", "Pasticceria", "cookie", ["dolci", "pasticceri", "torta", "forno"], []),
  i("cocktail", "food", "Cocktail", "cocktail", ["cocktail", "drink", "aperitivo", "shaker", "bicchier"], []),
  i("birra", "food", "Birra", "beer", ["birra", "spillator", "boccale"], []),

  i("viaggi", "avventura", "Viaggi", "plane", ["viaggio", "viaggi", "bagaglio", "trolley", "valigia", "aereo"], ["viaggio"]),
  i("campeggio", "avventura", "Campeggio", "tent", ["campeggio", "outdoor", "portatile", "tenda"], ["viaggio"]),
  i("trekking", "avventura", "Trekking", "mountain", ["trekking", "montagna", "escursion", "zaino"], ["viaggio"]),
  i("mare", "avventura", "Mare", "beach", ["mare", "spiaggia", "estate", "impermeabil"], ["viaggio"]),
  i("esplorazione", "avventura", "Esplorazione", "compass", ["esplora", "mappa", "avventura", "bussola", "localizza"], ["viaggio"]),
  i("sci", "avventura", "Sci & Neve", "snowflake", ["sci", "neve", "inverno", "termic"], ["viaggio"]),

  i("tecnologia", "societa", "Tecnologia", "laptop", ["tecnologia", "gadget", "usb", "ricarica", "wireless", "bluetooth"], ["tecnologia"]),
  i("videogiochi", "societa", "Videogiochi", "gamepad", ["videogioch", "gaming", "console", "stream"], ["tecnologia"]),
  i("moda", "societa", "Moda", "shirt", ["moda", "stile", "accessori", "portafogli"], []),
  i("animali", "societa", "Animali", "paw", ["animal", "cane", "gatto"], []),
  i("giardinaggio", "societa", "Giardinaggio", "sprout", ["pianta", "giardino", "vaso", "fiori"], ["arredamento"]),
  i("volontariato", "societa", "Volontariato", "volunteer", ["sostenibil", "riciclat", "ecologic", "solidal"], []),

  i("fai-da-te", "altre", "Fai da te", "wrench", ["attrezz", "riparare", "utensil", "kit"], []),
  i("collezionismo", "altre", "Collezionismo", "gem", ["collezion", "vintage", "edizione", "retro"], []),
  i("benessere", "altre", "Benessere", "leaf", ["benessere", "relax", "sonno", "massagg", "profum", "aromaterap"], []),
  i("motori", "altre", "Auto & moto", "car", ["automobil", "motori", "motocicl"], ["tecnologia"]),
  i("casa", "altre", "Casa & design", "home", ["casa", "arredo", "lampad", "luce", "specchio", "cuscin"], ["arredamento"]),
  i("giochi-tavolo", "altre", "Giochi da tavolo", "dice", ["gioco", "giochi", "puzzle", "carte"], []),
];
