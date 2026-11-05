// Dati statici del percorso «Trova il regalo»: nessuna logica, nessun DOM.
// Le tappe, i generi e le occasioni sono quelli del percorso di partenza. Gli interessi della terza tappa sono
// 8 macro-categorie con 34 micro-categorie (documento «Gifty · Nuove categorie per lo step 3», 3 novembre 2026,
// vedi DECISIONI.md): si sceglie 1 o 2 macro e poi, se si vuole, si restringe con le micro.
//
// Ogni prodotto del catalogo ha le sue micro in lib/dati/microcategorie-prodotti.ts. `parole` servono solo per i
// prodotti che lì non ci sono ancora: sono radici cercate dall'inizio della parola (vedi `normalizza`) nei testi
// del prodotto (nome, descrizione, perché, marca, sottocategoria). `temi` sono i nostri temi reali.

/** Le macro-categorie da scegliere (almeno una) e le micro facoltative per restringere. */
export const MIN_MACRO = 1;
export const MAX_MACRO = 2;
export const MAX_MICRO = 3;
/** Una micro (o una macro) si mostra solo se nel catalogo ha almeno questi prodotti: le altre restano nei dati, nascoste. */
export const SOGLIA_PRODOTTI = 6;

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

/**
 * L'elenco unico delle occasioni (Gifty UX v2, design.md §6 T-06 e decisione 3): lo stesso in domande, wizard ed editor.
 * `icona` è il nome di IconaTratto. Gli id valgono anche per `occasioni` dei prodotti (punteggio).
 */
export const OCCASIONI_REGALO = [
  { id: "compleanno", etichetta: "Compleanno", icona: "torta" },
  { id: "laurea", etichetta: "Laurea", icona: "calendario" },
  { id: "pensione", etichetta: "Pensione", icona: "calendario" },
  { id: "nascita", etichetta: "Nascita", icona: "calendario" },
  { id: "matrimonio", etichetta: "Matrimonio", icona: "calendario" },
  { id: "anniversario", etichetta: "Anniversario", icona: "calendario" },
  { id: "san-valentino", etichetta: "San Valentino", icona: "calendario" },
  { id: "natale", etichetta: "Natale", icona: "calendario" },
  { id: "saluto", etichetta: "Saluto", icona: "calendario" },
  { id: "altro", etichetta: "Altro", icona: "regalo" },
] as const;

/** Il nome dell'occasione da mostrare; gli id di prima (o sconosciuti) con l'iniziale maiuscola. */
export function etichettaOccasione(id: string): string {
  const o = OCCASIONI_REGALO.find((x) => x.id === id);
  if (o) return o.etichetta;
  const t = id.replace(/-/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// L'ordine viene dalla priorità del file catalogo (domanda × adatta alla colletta × affiliabile).
export const CATEGORIE_INTERESSI = [
  { id: "giochi", etichetta: "Giochi e passatempi", icona: "dice" },
  { id: "bellezza", etichetta: "Bellezza e benessere", icona: "leaf" },
  { id: "gusto", etichetta: "Cucina e buon gusto", icona: "chef" },
  { id: "tecnologia", etichetta: "Tecnologia", icona: "laptop" },
  { id: "stile", etichetta: "Stile e accessori", icona: "gem" },
  { id: "casa", etichetta: "Casa e design", icona: "home" },
  { id: "viaggi", etichetta: "Viaggi", icona: "plane" },
  { id: "cultura", etichetta: "Libri, musica e creatività", icona: "book" },
] as const;

/** L'ordine in cui le passioni si mostrano nella domanda (prototipi/domande.html). */
export const ORDINE_PASSIONI = ["casa", "tecnologia", "viaggi", "cultura", "gusto", "stile", "bellezza", "giochi"] as const;

/** Una micro-categoria; `categoria` è l'id della sua macro. */
export interface Interesse {
  id: string;
  categoria: string;
  etichetta: string;
  icona: string;
  /** radici di parola (senza accenti) cercate nei testi dei prodotti che non hanno ancora le micro */
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
  i("giochi-tavolo", "giochi", "Giochi da tavolo e di carte", "dice", ["gioco da tavolo", "giochi da tavolo", "carte da gioco", "gioco di carte", "scacchi", "puzzle"]),
  i("giochi-lego", "giochi", "LEGO e set da costruire", "wrench", ["lego", "costruzion", "mattoncin"]),
  i("giochi-bambini", "giochi", "Giocattoli per bambini", "gift", ["bambin", "giocattol", "telecomandat", "peluche"], ["tecnologia"]),
  i("giochi-gaming", "giochi", "Videogiochi e realtà virtuale", "gamepad", ["videogioch", "gaming", "console", "controller per smartphone", "realta virtuale", "meta quest", "stream deck", "tastiera ace"], ["tecnologia"]),

  i("bellezza-profumi", "bellezza", "Profumi", "sparkles", ["profum", "eau de", "parfum", "colonia", "fragranz"]),
  i("bellezza-skincare", "bellezza", "Make-up e skincare", "heart", ["make up", "makeup", "trucco", "rossetto", "labbra", "blush", "ombrett", "eyeliner", "siero", "skincare", "crema viso", "pennelli", "correttore"]),
  i("bellezza-styler", "bellezza", "Capelli, barba e cura personale", "leaf", ["asciugacapell", "styler", "airwrap", "piastra", "rasoio", "regolabarba", "barba", "capell", "cuoio capelluto", "tagliaunghie"]),
  i("bellezza-relax", "bellezza", "Relax, sonno e massaggi", "lotus", ["massagg", "relax", "sonno", "dormire", "mascherina", "antistress", "yoga", "foam roller", "aromaterap"]), // senza "spa": prendeva «Spacey, tavolino oro»
  i("bellezza-sport", "bellezza", "Sport e fitness", "dumbbell", ["fitness", "palestra", "allenament", "corsa", "running", "smartwatch", "watch fit", "borraccia", "shaker", "ring air", "oura"]),

  i("gusto-caffe", "gusto", "Caffè e tè", "coffee", ["caffe", "espresso", "macinacaffe", "nanopresso", "aeropress", "moka", "tisan", "filtri"]),
  i("gusto-cucinare", "gusto", "Per chi ama cucinare", "chef", ["friggitrice", "air fryer", "airfryer", "planetaria", "pentol", "tagliere", "forno", "biscott", "cucina"]),
  i("gusto-specialita", "gusto", "Cesti, dolci e specialità", "cookie", ["cesto", "gastronom", "sapori", "cioccolat", "panettone", "dolci", "tartufo", "olio"]),
  i("gusto-vini", "gusto", "Vini, distillati e degustazioni", "wine", ["vino", "vini", "bollicin", "champagne", "spumante", "whisky", "distillat", "grappa", "degustazion", "cocktail", "calice"]),

  i("tech-audio", "tecnologia", "Cuffie, auricolari e speaker", "music", ["cuffie", "auricolar", "speaker", "cassa bluetooth", "airpods", "altoparlant", "dac", "beoplay"], ["tecnologia"]),
  i("tech-foto", "tecnologia", "Foto, video e creator", "camera", ["fotocamera", "instax", "polaroid", "stampante fotografica", "selphy", "sprocket", "mini shot", "gimbal", "osmo", "insta360", "microfon", "podmic", "lark", "treppiede", "tripod", "key light", "videocamera", "luce led", "montaggio video"], ["tecnologia"]),
  i("tech-smartphone", "tecnologia", "Smartphone, ricarica e gadget", "laptop", ["power bank", "caricator", "cavo", "magsafe", "airtag", "localizzator", "tracker", "cover", "custodia magsafe", "portacarte magnetico", "mouse", "registrator", "flipper", "traduttor"], ["tecnologia"]),
  i("tech-smarthome", "tecnologia", "Smart home, luci e TV", "film", ["proiettor", "fire tv", "echo dot", "alexa", "nanoleaf", "govee", "smart home", "robot aspirapolvere", "monitor ambientale", "telecamera"], ["tecnologia"]),

  i("stile-orologi", "stile", "Orologi", "timer", ["orologio da polso", "orologi", "casio", "g shock", "seiko", "citizen", "timex", "swatch", "bulova", "cronografo"]),
  i("stile-gioielli", "stile", "Gioielli", "gem", ["gioiell", "collana", "bracciale", "orecchin", "anello", "charm", "ciondol"]),
  i("stile-pelletteria", "stile", "Borse, pelletteria e occhiali", "shirt", ["portafogl", "portacarte", "cintura", "borsa", "borsetta", "in pelle", "occhiali", "specchietto"]),
  i("stile-abbigliamento", "stile", "Abbigliamento e accessori caldi", "snowflake", ["calzini", "sciarpa", "guanti", "maglion", "cashmere", "pigiama", "vestaglia", "pantofole", "cappello"]),

  i("casa-luci", "casa", "Lampade e luci d’atmosfera", "home", ["lampad", "piantana", "luce led", "candel", "luce notturna"], ["arredamento"]),
  i("casa-arredo", "casa", "Arredi e oggetti di design", "landmark", ["vaso", "vasi", "scultur", "specchio", "sedia", "sgabell", "tavolino", "appendiabiti", "centrotavola", "orologio", "pouf", "fermalibri", "portalibri", "decorazion", "placca", "svuotatasche", "cestino", "contenitore", "scrivania", "collezion"], ["arredamento"]),
  i("casa-atmosfera", "casa", "Candele, tazze e decorazioni", "tree", ["candel", "yankee", "woodwick", "tazza", "mug", "thun", "natal", "addobbo"], ["arredamento"]),
  i("casa-pratica", "casa", "Idee pratiche e personalizzate", "sprout", ["saldator", "personalizzat", "scovolin", "spazzola", "dispenser", "ganci a ventosa", "aspirabriciole", "aspirapolvere", "sveglia", "supporto per portatile", "calco", "lavatrice", "polvere", "spesa", "carta regalo"]),

  i("viaggi-valigie", "viaggi", "Valigie e zaini", "plane", ["valigia", "trolley", "zaino", "bagaglio", "borsa accessori"], ["viaggio"]),
  i("viaggi-tech", "viaggi", "Tecnologia per chi viaggia", "laptop", ["adattatore", "power bank", "airtag", "localizzator", "airfly", "tech pouch", "tech kit", "viaggio"], ["viaggio", "tecnologia"]),
  i("viaggi-comfort", "viaggi", "Comfort e organizzazione in viaggio", "tent", ["cuscino da viaggio", "travel pillow", "packing cube", "wash pouch", "pouch", "borraccia", "hydro flask", "tappi per orecchie", "beauty case", "passaporto", "portasapone", "kit da viaggio", "organizer"], ["viaggio"]),
  i("viaggi-ricordi", "viaggi", "Libri, mappe e diari di viaggio", "compass", ["mappa", "mappamondo", "diario di viaggio", "archive box", "bacheca", "guida", "world map"], ["viaggio"]),
  i("viaggi-esperienze", "viaggi", "Weekend e fughe da regalare", "mountain", ["smartbox", "wonderbox", "soggiorn", "giorni in", "weekend", "fuga"], ["viaggio"]),

  i("cultura-libri", "cultura", "Libri ed e-reader", "book", ["libro", "libri", "kindle", "e reader", "ebook", "lettura"]),
  i("cultura-musica", "cultura", "Musica e vinili", "music", ["giradisch", "vinile", "midi", "karaoke", "centro musicale"]),
  i("cultura-creativita", "cultura", "Disegno, scrittura e cartoleria", "palette", ["taccuin", "penna", "pennarell", "da colorare", "disegn", "acquerell", "calligraf", "proiettore per disegno", "cartoleria"]),
  i("cultura-eventi", "cultura", "Concerti, teatro e mostre", "landmark", ["concert", "teatro", "mostra", "museo", "biglietto", "cinema"]),
];
