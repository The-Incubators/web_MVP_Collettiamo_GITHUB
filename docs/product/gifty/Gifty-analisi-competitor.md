# Gifty: analisi dei competitor per UX e design

Ricerca del 24 ottobre 2026. Il riferimento di prodotto è [Gifty: flussi e decisioni](Gifty-flussi-e-decisioni.md). Questo documento confronta le soluzioni che una persona può usare per scegliere un regalo, organizzare il gruppo, raccogliere quote o consegnare un biglietto. Le indicazioni per Gifty sono proposte progettuali, non risultati di test con utenti.

## Perimetro e qualità dell’evidenza

La ricerca comprende tre servizi rivolti al mercato italiano e due riferimenti internazionali. Non sono concorrenti equivalenti: Satispay risolve soprattutto il trasferimento di denaro, Troppotogo la scelta e l’acquisto, Growish la raccolta; GroupTogether e Thankbox collegano biglietto e regalo. Il confronto serve a capire quali parti del percorso rendono immediate e quali responsabilità assumono.

Sono state lette pagine ufficiali e parti dei fogli di stile. Per Satispay, Growish, GroupTogether e Thankbox sono state inoltre aperte e ispezionate le pagine renderizzate a 1280 pixel di larghezza su desktop e 390 × 844 pixel su telefono. I riferimenti alle schermate documentano quella visita, non ogni possibile stato del sito. Il caso Troppotogo rimane limitato ai contenuti indicizzati: il browser ha mostrato una verifica di sicurezza, che non è stata aggirata.

Le evidenze hanno tre livelli distinti:

- **Osservato:** disposizione degli elementi e visibilità della prima azione nelle otto schermate salvate
- **Dichiarato:** capacità che il fornitore descrive sulle pagine pubbliche, senza verifica mediante account o transazioni
- **Proposto:** ciò che conviene adattare a Gifty in base ai flussi decisi da Cri

Non sono stati creati account, versati contributi o completati ordini. Non sono state misurate conversioni, soddisfazione o disponibilità delle funzioni internazionali per utenti italiani. Numeri di clienti, recensioni, prezzi e promesse dei concorrenti non diventano prove a favore di Gifty.

## Chi sostituisce quale parte del percorso

| Servizio | Esigenza per cui entra nel confronto | Prima azione e comunicazione | Modello pubblicato | Differenza rilevante per Gifty |
|---|---|---|---|---|
| [Satispay](https://www.satispay.com/it-it/privati/pagare/) | Inviare, chiedere e raccogliere quote | La pagina invita a usare o scaricare l’app; presenta azioni quotidiane e casi d’uso | Servizi di pagamento forniti dall’entità indicata nel footer; collette e gift card nell’app | Gifty coordina regalo e persone, mentre il pagamento va all’organizzatore tramite il metodo scelto |
| [Growish](https://growish.com/home) | Aprire una raccolta attorno a un obiettivo | Creazione della colletta, con desideri personali come contenuto dell’hero | Contributi online e successiva destinazione del denaro raccolto | Il budget di adesioni di Gifty non è un saldo custodito dalla piattaforma |
| [Troppotogo](https://www.troppotogo.it/) | Trovare un regalo concreto | Ricerca, occasioni, destinatari, prodotti personalizzabili e prezzo | Negozio che vende il proprio catalogo | In Gifty il catalogo è al servizio di un’iniziativa di gruppo e l’organizzatore acquista dal rivenditore |
| [GroupTogether](https://www.grouptogether.com/us/) | Preparare un biglietto e un regalo collettivo | Avvio e dimostrazione del prodotto, con anteprima del risultato | Biglietti, raccolte e gift card; offerta localizzata per paese | È utile studiare come mostra il risultato; non trasferire il suo modello di fondi o le condizioni locali a Gifty |
| [Thankbox](https://www.thankbox.com/) | Consegnare messaggi e un regalo da più persone | Creazione del biglietto, esempi e raccolta come possibile aggiunta | Biglietto o bacheca, contributi e scelta del destinatario | Il momento della consegna è importante anche in Gifty, ma la chiusura delle adesioni segue la regola di Cri |

## Satispay: una scena riconoscibile e un’azione finanziaria

Nella [pagina esaminata](https://www.satispay.com/it-it/privati/pagare/), la fotografia mostra un pagamento in negozio. Il servizio viene collocato in una situazione comprensibile prima di raccontare tutte le funzioni. La pagina pubblica descrive anche invio e richiesta di denaro, collette e gift card; non è stata verificata qui la sequenza interna per crearle.

Su desktop l’hero affianca una grande headline e la fotografia, con fondo avorio, testo molto scuro e arancio. L’H1 rilevato usa Bricolage Grotesque a 88 px, peso 800; il CSS include anche DM Sans e Inter. Le superfici dei controlli sono chiare, separate dallo sfondo, e le azioni di accesso e iscrizione hanno un posto stabile nell’intestazione. [Schermata desktop](ricerca-competitor/satispay-desktop.jpg)

Su telefono la fotografia precede il titolo. L’H1 scende a 48 px, ma immagine, titolo e descrizione occupano la prima schermata e l’azione principale di download resta più in basso. Il pulsante di iscrizione è invece visibile nell’intestazione. Questo è un costo di composizione osservabile, non una prova che la pagina converta male. [Schermata mobile](ricerca-competitor/satispay-mobile.jpg)

**Adattamento proposto:** usare una scena specifica del regalo di gruppo, con destinatario, adesioni e quota. Il valore della scena è far riconoscere l’attività, non decorare il testo. Per Gifty manterrei l’azione di organizzazione prima di una grande immagine sul telefono: chi arriva dalla chat deve poter entrare nel proprio compito senza attraversare una presentazione commerciale.

Gifty usa già Bricolage e arancio. La somiglianza di alcuni ingredienti con Satispay non impone un cambio di font, ma impedisce di considerare quel solo abbinamento una scelta distintiva. Servono un diverso modo di mostrare il gruppo e una gerarchia legata al regalo, evitando di sembrare un’altra app di pagamento.

## Growish: il desiderio della persona guida la raccolta

La [home Growish](https://growish.com/home) lega la colletta a desideri concreti. La fotografia a tutta larghezza cambia con il carosello; titolo, breve descrizione e pulsante arancio sono sovrapposti all’immagine. La navigazione usa il blu e le occasioni compaiono subito dopo l’hero. [Schermata desktop](ricerca-competitor/growish-desktop.jpg)

Il [CSS applicativo](https://growish.com/_/css/styles.min.css?v=96) assegna Lato al corpo e Roboto ai titoli, con blu `#3784cc` come colore primario e arancio `#ef6233` per la CTA. Questi valori sono stati verificati nel foglio del sito, non dedotti dai colori generici della libreria grafica. La pagina presenta contributi e impiego del raccolto; il relativo percorso finanziario non è stato eseguito.

Su telefono il ritaglio della fotografia continua a occupare quasi tutta la prima schermata, ma il pulsante di creazione rimane visibile al suo interno. Le categorie iniziano subito sotto. Il carosello desktop e quello mobile mostrano fotogrammi diversi: sono stati confrontati la struttura e il posizionamento, non la stessa immagine. [Schermata mobile](ricerca-competitor/growish-mobile.jpg)

**Adattamento proposto:** centrare il nome del festeggiato e l’occasione. Un gruppo per Mauro è più concreto di una spiegazione astratta delle collette. Nel percorso senza regalo scelto non serve inventare una fotografia prodotto: possono essere persone e adesioni a costituire il contenuto iniziale.

Eviterei per Gifty il carosello automatico come elemento necessario per capire il servizio. I due modi di iniziare devono essere presenti e selezionabili, non apparire a turno. Il vocabolario della raccolta di denaro va inoltre usato con precisione: prima dei versamenti, Gifty mostra adesioni e budget promesso, non denaro già disponibile su un conto della piattaforma.

## Troppotogo: il catalogo fa iniziare dalla scelta

I [contenuti pubblici della home](https://www.troppotogo.it/) presentano ricerca, occasioni, destinatari e prodotti personalizzabili. L’hero indicizzato in questa visita è promozionale; seguono prodotti, prezzi e recensioni. Questa struttura risponde alla domanda “cosa posso regalare?” e facilita l’ingresso in una categoria concreta.

Il browser ha però incontrato una verifica Cloudflare. Non sono quindi documentati in questa ricerca font, palette, spaziatura, comportamento mobile o posizione reale della prima azione. La conoscenza dei testi non è stata usata per inventare una valutazione visuale.

**Adattamento proposto:** nel catalogo Gifty, far trovare un oggetto attraverso foto leggibili, prezzo totale, quota per persona e filtri utili. Chi arriva dopo aver formato un budget deve poterlo conservare nella ricerca, senza rifare il ragionamento. Chi ha già scelto un prodotto deve poter proporlo al gruppo direttamente dalla scheda.

Non trasferirei la stessa densità alla home di organizzazione. La prima azione richiesta da Cri è creare il regalo di gruppo, anche senza prodotto. Un catalogo subito dominante, con molte categorie o promozioni, potrebbe rendere meno evidente questo ingresso. È un rischio progettuale da testare nel prototipo, non una conclusione sui risultati di Troppotogo.

## GroupTogether: il risultato è visibile prima dell’avvio

La visita renderizzata è stata reindirizzata alla [versione statunitense](https://www.grouptogether.com/us/). L’hero turchese mette insieme headline, azioni di avvio e demo e un’anteprima di biglietto con ManyCard. Il prodotto risultante è riconoscibile senza aprire il percorso di creazione. [Schermata desktop](ricerca-competitor/grouptogether-desktop.jpg)

Il rilievo dell’H1 identifica Modern Era a 64 px, con parte del titolo trattata in Recoleta; non è corretto descrivere tutti i titoli come serif. Su telefono il titolo è di circa 36,8 px e mantiene l’alternanza tipografica. Avvio e demo precedono il mockup e sono visibili nella prima schermata. Un messaggio di assistenza occupa parte del bordo inferiore nel campione mobile. [Schermata mobile](ricerca-competitor/grouptogether-mobile.jpg)

La localizzazione conta: una precedente lettura della pagina generale mostrava riferimenti ad AnyCard e funzioni riservate all’Australia, mentre il campione attuale mostra ManyCard. Le due versioni non vanno fuse in un’offerta unica, né considerate una verifica delle possibilità per utenti italiani.

**Adattamento proposto:** mostrare su Gifty il risultato dell’iniziativa, mantenendo distinguibili ciò che vede il gruppo e ciò che riceve il festeggiato. Una demo utile dovrebbe permettere di riconoscere questi due ruoli. Non basta una bella fotografia del regalo per spiegare quote, firme o scelta finale.

La demo resta secondaria rispetto all’avvio. Il modello del concorrente, nel quale si raccolgono contributi online, non autorizza promesse equivalenti su Gifty: nel progetto di Cri l’organizzatore acquista personalmente e registra o conferma i versamenti ricevuti.

## Thankbox: identità del servizio e personalità dei messaggi

La [home Thankbox](https://www.thankbox.com/) usa un fondo viola, accenti verde acqua e un collage di messaggi con foto e GIF. La [pagina raccolte](https://www.thankbox.com/online-group-gift-collection) presenta il contributo come aggiunta al biglietto e descrive la scelta del destinatario. Il sito distingue inoltre biglietto tradizionale e bacheca: sono due rappresentazioni visibili dello stesso tipo di contenuto, non solo due etichette commerciali.

Il font principale rilevato è Nunito; l’H1 desktop è di 54 px. Nel sorgente compaiono molte altre famiglie, che appartengono anche alla personalizzazione dei messaggi: non sono state scambiate per il sistema tipografico della navigazione. Viola `#5a499c` e verde acqua `#09d1aa` ricorrono nei CSS. [Schermata desktop](ricerca-competitor/thankbox-desktop.jpg)

Sul telefono headline e collage occupano la prima schermata; il pulsante di creazione rimane nell’intestazione. L’esempio fa capire il carattere personale del biglietto, ma lascia meno spazio iniziale alla gestione operativa. [Schermata mobile](ricerca-competitor/thankbox-mobile.jpg)

**Adattamento proposto:** tenere stabile l’interfaccia Gifty e lasciare la personalizzazione al biglietto. Dediche diverse possono avere colori, immagini e caratteri propri, mentre quote, pulsanti e stati devono restare consistenti. La pagina di consegna può essere più espressiva della dashboard dell’organizzatore.

Non copierei automaticamente invio programmato, reminder o disponibilità delle gift card: qui sono capacità pubblicate dal fornitore, non integrazioni già disponibili per Gifty. Per i tardivi, Cri ha stabilito che la consegna chiude i nuovi ingressi. Far coincidere questo momento con l’invio digitale è la proposta P01; mantenere l’accesso degli iscritti per saldare le quote è la proposta P02. Entrambe restano da confermare nella specifica.

## Cosa conservare, evitare e proporre

| Area | Conservare come lezione | Evitare in Gifty | Proposta da verificare nel prototipo |
|---|---|---|---|
| Prima schermata | Scena riconoscibile e risultato concreto | Immagine che nasconde l’avvio sul telefono | Una sola azione principale per organizzare; esempio compatto del gruppo |
| Due ingressi | Ingressi legati alla situazione della persona | Costringere tutti a partire dal catalogo | Scelta visibile tra raccogliere adesioni e proporre un regalo già scelto |
| Budget | Un obiettivo con significato personale | Trattare adesioni come incassi | Stato delle adesioni distinto da quote ricevute e ancora da ricevere |
| Catalogo | Oggetti, foto e filtri contestuali | Promozioni o falsa popolarità come sostituti della selezione | Conservare il budget e mostrare la quota per persona accanto al totale |
| Modifiche | Controlli vicini all’oggetto da cambiare | Un nuovo negoziato obbligatorio nell’app | L’organizzatore aggiorna regalo e quote dopo l’accordo su WhatsApp |
| Consegna | Anteprima del biglietto e del regalo | Confondere invio digitale e spedizione fisica | Un riepilogo che renda chiaro l’effetto dell’invio sui nuovi ingressi |
| Acquisto | Destinazione dell’azione riconoscibile | Far sembrare che Gifty venda o ordini il prodotto | Organizzatore indirizzato al checkout del rivenditore dopo la scelta |
| Personalizzazione | Espressività del contenuto degli auguri | Un font diverso per ogni elemento dell’interfaccia | Sistema stabile per le azioni, personalità libera nei messaggi |

## Direzione che la ricerca autorizza a esplorare

Il percorso Gifty deve rendere immediati tre oggetti: l’iniziativa per una persona, il regalo proposto e la quota. Questi oggetti cambiano peso a seconda del ruolo e del momento. La home spiega il servizio con un esempio; la pagina di invito fa aderire; la gestione dell’organizzatore serve a modificare e riscuotere; la consegna mostra il regalo e il biglietto al destinatario.

Il confronto suggerisce di esplorare una composizione che parta dal gruppo e renda il regalo concreto appena viene scelto. Non dimostra che questa combinazione sia unica, che il mercato la desideri o che superi i concorrenti. La verifica successiva è osservare se una persona riesce a iniziare nei due modi, capire la propria quota e riconoscere chi acquista, senza leggere un testo lungo.

La proposta UX/design collegata a questa ricerca dovrà quindi mostrare almeno home, scelta iniziale, invito, gestione del gruppo e consegna. Una sola homepage non basta a verificare il modello deciso. Prezzi, consenso e responsabilità rimangono leggibili nel punto in cui servono; le illustrazioni sostituiscono le spiegazioni ridondanti, non le informazioni necessarie per decidere.

## Riferimenti e controlli

Le otto schermate collegate sopra sono gli artefatti di osservazione desktop e mobile. I CSS e le estrazioni sono conservati nella lavorazione della ricerca. Troppotogo è segnalato come limite, senza una ricostruzione visuale ipotetica; Giftster, che ha restituito errore di accesso, non è incluso nel confronto.

Il testo finale è stato riletto applicando find-ai-slop a titoli, tabelle e prose. Sono state mantenute separate osservazioni, dichiarazioni dei fornitori e proposte, evitando una classifica senza criteri o promesse di originalità. Non è stata effettuata una verifica legale o commerciale completa delle offerte dei concorrenti.
