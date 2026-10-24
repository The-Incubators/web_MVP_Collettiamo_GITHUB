# Gifty UX e design guidelines

Direttrice operativa del 24 ottobre 2026. Queste regole consolidano la direzione A approvata e le correzioni esplicite di Cri; non introducono un nuovo brand. Le decisioni funzionali restano in [Flussi e decisioni](Gifty-flussi-e-decisioni.md). La nuova sezione Come funziona usa questo stesso sistema.

## Riferimenti e autorità

- Tavola approvata: [Gifty UX, proposta raccomandata](Gifty-UX-proposta-raccomandata.png)
- Ricerca preliminare: [Analisi competitor](Gifty-analisi-competitor.md), con schermate e fonti ufficiali osservate
- Asset e licenze: [Asset della direzione A](Gifty-assets-direzione-A.md)
- Copy: [Copy interfaccia](Gifty-copy-interfaccia.md), integrato dalle correzioni testuali esplicite di Cri
- Implementazione corrente: `prototype/gifty/`; libreria visiva in `style.css`, storia della home in `home-section.css`

Un riferimento approvato prevale sulle preferenze di chi implementa. Non sostituire composizioni fotografiche con card CSS generiche, non cambiare logo, tipografia o impaginazione della hero per comodità tecnica. Ogni nuova direzione brand richiede prima ricerca dei competitor, di come mostrano il prodotto e di come ne spiegano il servizio, poi una proposta esplicita.

## Marchio e palette

Il marchio è Gifty verde con segno a nastro arancio. Utilizzare il segno locale `assets/gifty-ribbon.svg` e il wordmark previsto dall’intestazione. Non disegnare un logo alternativo nelle pagine operative. La favicon usa lo stesso nodino arancio in `assets/gifty-favicon.svg`, centrato su area quadrata trasparente.

| Token | Valore | Uso |
|---|---|---|
| `--green` | `#033922` | Titoli, azioni primarie, stato selezionato |
| `--ink` | `#142B20` | Testo principale |
| `--muted` | `#52665B` | Supporto e metadati |
| `--paper` | `#F5FAF6` | Fondo generale |
| `--white` | `#FFFFFF` | Campi e superfici |
| `--orange` | `#FD5D17` | Nastro, dettagli di gesto, focus |
| `--peach` | `#FFE9DE` | Consegna e accenti caldi |
| `--line` | `#D9E4DC` | Separazione e bordi |
| `--error` | `#B52525` | Errori concreti e azioni non riuscite |

I token condivisi si definiscono alla radice, non vengono ridefiniti dentro una pagina. Verde e arancio non vanno distribuiti indistintamente su tutti i controlli. Il nastro è un elemento che unisce persone, invito e regalo; non è una barra di denaro incassato.

## Tipografia e densità

Urbanist per titoli, Source Sans 3 per testo, etichette e controlli, Caveat solo per scritte dei biglietti. I font sono locali, con le rispettive licenze OFL nella cartella assets. Non utilizzare Caveat per etichette di campo, importi o informazioni di consenso.

La hero usa il titolo grande già approvato, con dimensione adattiva desktop 48–76 px e mobile 36 px. Le pagine operative mantengono titoli, sezioni e corpo con gerarchia distinta; non ingrandire ogni etichetta al livello di un titolo. Il corpo operativo resta normalmente a 16–18 px. Importi, conteggi e date confrontabili usano cifre tabulari. I campi brevi hanno larghezza coerente con il contenuto atteso.

Il raggio condiviso delle superfici è `--radius: 20px`, quello dei controlli `--control: 10px`. Le superfici fotografiche della narrazione possono usare cornici da biglietto e lievi rotazioni per seguire la tavola approvata; i moduli e le tabelle restano diritti e leggibili.

## Hero e home

La fotografia della hero occupa tutta la larghezza della finestra e costruisce un’unica scena. Titolo e azioni sono sovrapposti alla fotografia; non vanno collocati in un blocco separato sopra la foto. Non introdurre un pannello fotografico con bordo, angoli o margini laterali. Conservare la continuità fra fondo chiaro, tavolo, biglietti, piante e nastro. Il logo e la navigazione rimangono presenti.

La fotografia desktop e quella mobile sono due asset approvati distinti. Il titolo e le azioni devono restare leggibili e raggiungibili, senza tagliare biglietti e soggetti essenziali con un semplice ritaglio automatico. Non modificare l’asset fotografico per farci entrare più testo.

La sezione Come funziona termina direttamente sul footer, senza una fascia vuota del colore di fondo: sulla home non si sommano padding inferiore del main e margine superiore del footer.

Il catalogo segue la hero come nella tavola di riferimento. Catalogo e proposte acquistabili usano prodotti reali della fonte esistente, inclusi PRD-011, PRD-016 e PRD-038; non presentano fotografie generate come prodotti in vendita. Le fotografie generate approvate restano illustrazioni decorative della home. La sezione Come funziona può seguirlo: una scena narrativa navigabile, non cinque card di testo. Usa le foto già approvate, biglietti, iniziali e nastro; ogni passo ha un titolo, un supporto breve quando necessario e una scena. L’azione Organizza un regalo di gruppo compare soltanto nel primo passaggio, senza ripeterla nei successivi quattro. Non inventa importi, quote ricevute o un gruppo reale. Le illustrazioni sono decorative; le azioni effettive sono distinguibili e funzionanti.

## Navigazione e azioni

Mantenere Home, Catalogo, Trova regalo, Preferiti, Collette e menu profilo. Il menu profilo espone un’uscita reale quando la sessione è autenticata. Le pagine del festeggiato possono usare l’intestazione ridotta prevista. Su mobile, il menu e la navigazione in basso non devono coprire i pulsanti dei percorsi guidati.

Una pagina mostra l’oggetto e le sue azioni. Un link che opera sul contenuto corrente non deve far perdere quel contesto: Condividi il link apre una modale con copia del link e chiusura, senza cambiare pagina. Una sola azione primaria per fase; azioni secondarie vicine all’oggetto su cui agiscono. Cambia regalo appartiene al riepilogo del prodotto, non alla riga dei partecipanti.

## Moduli e quote

Usare etichette visibili collegate ai campi. I testi approvati sono Nome festeggiato/a, Data celebrazione, Raccolgo adesioni prima e Scelgo il regalo prima. Nel riepilogo della quota, Partecipanti e relativo numero stanno sulla stessa riga. Il regalo scelto mostra una miniatura, nome e prezzo. La previsione si aggiorna quando cambia il numero dei partecipanti.

Nei menu a discesa la freccia ha spazio dal bordo: posizionamento a 18 px e padding destro di 52 px nell’implementazione corrente. Non affidarsi alla freccia nativa quando il suo allineamento contraddice il controllo approvato.

La quota si modifica direttamente nella tabella. Il simbolo euro e il numero restano sulla stessa riga, in un contenitore flex senza ritorni a capo; verificare la resa reale, non soltanto la presenza della regola CSS. La modifica della quota conserva ricevuti e dichiarazioni precedenti. Non confondere adesioni, budget previsto, ricevuto confermato e importi da ricevere.

## Partecipanti e suggerimenti

Mostrare persone aderenti e lista Da invitare nella pagina del gruppo, con aggiunta di email. Gli indirizzi in attesa non aumentano aderenti o budget. Non aggiungere un testo introduttivo per spiegare che una lista vuota si popolerà: usare lo stato vuoto e il relativo controllo.

Trova il regalo per {nome} mostra fino a due regali entro il budget effettivo e il link al catalogo. Non completare una griglia con prodotti fuori budget. A budget zero non inventare suggerimenti finanziabili. Nessuna fotografia di prodotto sostituita con un’icona generica quando l’asset è disponibile.

## Copy e contenuti

- Nessun punto fermo alla fine di titoli, hero, titoli di card e titoli spezzati su più righe
- Tutto il copy proposto passa da `find-ai-slop` in qualsiasi lingua, compreso testo nelle immagini e ogni revisione successiva
- Scrivere italiano naturale, con parole dell’utente e azioni concrete; evitare calchi, slogan generici e spiegazioni ripetute
- Guidare prima con controlli, ordine, gerarchia, illustrazioni e stati, non con paragrafi che descrivono azioni già intuitive
- Conservare il testo necessario per prezzi, consenso e conseguenze; la sintesi non deve nascondere informazioni essenziali
- Non mostrare diciture provvisorie come prototipo o demo nelle pagine del prodotto
- Non promettere invii, account, salvataggi, raccolte automatiche o pagamenti che il codice non ha eseguito

La sequenza Come funziona segue la correzione esplicita di Cri: 1 Crea il gruppo o scegli il regalo; 2 Proponi le opzioni o raccogli le adesioni; 3 Prepara il biglietto; 4 Consegna il regalo; 5 Tieni il conto dei rimborsi. Le due partenze rimangono alternative; la ricerca nel catalogo non è un passaggio iniziale obbligatorio separato. Il biglietto precede la consegna e il recupero dei soldi segue la consegna in questa narrazione. Questa sintesi della home non modifica le decisioni funzionali dettagliate sul festeggiato e sull’acquisto. Il supporto del quarto passaggio è Consegna il regalo o manda un’anteprima, senza aggiungere invii automatici o CTA. Il supporto del quinto passaggio è Fatti rimborsare con PayPal, Satispay o bonifico: strumenti per rimborsare direttamente l’organizzatore, senza promettere rilevazioni bancarie automatiche o incassi della piattaforma.

## Accesso, profilo e privacy

Nome locale e vecchi flag del browser non sono una sessione autenticata. La sessione è Firebase reale, seguita da profilo e presa visione salvati. Durante il ripristino mostrare soltanto uno stato di verifica, senza far lampeggiare la registrazione. Un account già autenticato apre il profilo; non si registra di nuovo.

Il profilo permette di modificare nome e cognome, mostra email verificata in sola lettura e metodo di accesso dal provider effettivo, conserva la scelta commerciale e rende Esci visibile. Errori e caricamento non cancellano i campi né mostrano successi fittizi. I gruppi locali precedenti non vengono assegnati automaticamente al nuovo account.

La presa visione della privacy è separata dal consenso commerciale. La scelta commerciale è facoltativa e non preselezionata nella registrazione; nel profilo mostra il valore realmente salvato. La preferenza non attiva invii di newsletter. I dati del gruppo restano locali; autenticazione e profilo usano Firebase. La pagina Privacy e dati non sostituisce la definizione di titolare, fornitori, conservazione e diritti prima del rilascio pubblico.

## Accessibilità e verifica

Tutti i controlli funzionano con tastiera, hanno etichette e focus visibile; l’area utile è almeno 44 px. Il significato di uno stato non dipende solo dal colore. Le illustrazioni decorative sono nascoste alle tecnologie assistive; le informazioni operative sono testo accessibile.

La narrazione della home usa tab e pannelli associati, frecce, Home ed End da tastiera, stato selezionato e controlli precedente/successivo. Su mobile mantiene testo leggibile e scene intere senza scorrimento orizzontale della pagina. Nessuna riproduzione automatica; movimento disattivato con prefers-reduced-motion.

Verificare su desktop e mobile, almeno a 390 px, con contenuto lungo, prezzi reali, campi e menu aperti. Confrontare screenshot della pagina effettiva con la tavola approvata. Un salvataggio è verificato dopo ricaricamento; un’integrazione è dichiarata reale soltanto dopo prove coerenti con ciò che è stato effettivamente eseguito. Separare implementazione locale, test isolati e verifica con servizi reali.
