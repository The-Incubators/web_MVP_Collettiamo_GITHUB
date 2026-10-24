# Gifty: proposta UX e design

Proposta del 24 ottobre 2026. Basata su `Gifty-flussi-e-decisioni.md`, sulle correzioni di Cri e sulla ricerca dei competitor. Questo documento propone il sistema visivo e l’organizzazione delle schermate: non è un design approvato o un’app implementata. Il modulo `Gifty-copy-interfaccia.md` contiene il copy finale proposto; le stringhe qui servono a identificare gli elementi e il loro spazio.

## La scelta raccomandata

Riprendere il marchio verde con segno a nastro arancio e la composizione della tavola approvata, dando all’invito e al gruppo il primo piano. La correzione D23 richiede di preservare questi elementi nel prototipo. Il catalogo deve aiutare chi cerca un regalo, senza diventare un passaggio obbligatorio per chi vuole prima raccogliere adesioni.

La home promette un servizio comprensibile; le pagine operative mostrano regalo, persone e quota corrente; la consegna diventa una pagina personale per il festeggiato. Queste tre situazioni hanno densità diverse. Non vanno trasformate nello stesso elenco di card.

Il motivo visivo proposto è una fascia di nastro che raccoglie le iniziali dei partecipanti e arriva al regalo o al biglietto. Sulla home è un’illustrazione del servizio; nelle pagine operative diventa una sequenza di persone reali del gruppo; nella consegna lascia spazio al biglietto. Non è una progress bar di denaro incassato.

## Ricerca prima della direzione

Riferimenti osservati il 24 ottobre 2026. Le immagini si trovano in `ricerca-competitor/`. Sono state viste le schermate desktop a 1280 px e mobile a 390 px dei quattro servizi seguenti. Non sono stati completati acquisti o percorsi autenticati.

| Riferimento | Meccaniche osservate | Conseguenza per Gifty |
|---|---|---|
| [Satispay](https://www.satispay.com/it-it/privati/pagare/) | Hero diviso tra titolo molto grande e fotografia d’uso; arancio, fondo chiaro, testo bruno; H1 Bricolage Grotesque, 88 px, peso 800 nel desktop verificato | Non continuare con una hero Bricolage/arancio simile. Mostrare invito e gruppo, invece di un’altra fotografia generica di pagamento |
| [Growish](https://growish.com/home) | Hero fotografico a carosello, titolo e CTA sovrapposti, obiettivo personale, navigazione blu e azione arancio; CSS applicativo con Roboto e Lato | Conservare la concretezza della persona e dell’occasione; evitare carosello, testo sulle foto e linguaggio da raccolta con fondi già custoditi |
| [GroupTogether](https://www.grouptogether.com/) | Ampia superficie turchese, anteprima del biglietto e della gift card, azioni avvio e demo; titolo con Modern Era e frase serif | Mostrare il risultato del servizio con un esempio realistico. Non importare il suo serif, la palette o il modello di pagamento |
| [Thankbox](https://www.thankbox.com/) | Hero viola, azioni verde acqua, Nunito, collage di messaggi; il biglietto è il prodotto mostrato, non un’illustrazione estranea | Fare spazio alle firme e alla consegna, ma senza presentare Gifty come un servizio di soli biglietti |

Troppotogo rimane utile per ricerca e catalogazione dei regali, ma il browser ha mostrato una verifica anti-bot. Non uso quella pagina per dedurre font, palette o composizione visuale.

Il confronto mobile cambia la proposta: Satispay mette la fotografia prima del titolo e la CTA non appare nel primo schermo osservato; Thankbox dà molto spazio al collage, lasciando l’avvio nell’intestazione; Growish mantiene la CTA sovrapposta alla fotografia; GroupTogether mantiene titolo e avvio prima dell’esempio. Per Gifty scelgo azione principale e identità del servizio prima dell’illustrazione, con un invito più compatto. La variante di GroupTogether osservata durante la navigazione si è spostata sul sito USA e mostra ManyCard: non va confusa con AnyCard citata nelle pagine australiane della ricerca.

La differenza proposta di Gifty è il collegamento tra gruppo, scelta e consegna con acquisto personale dell’organizzatore. È una scelta progettuale da provare con utenti italiani, non un vantaggio competitivo già dimostrato.

## Le tre direzioni da confrontare

Le direzioni cambiano il modo di entrare e la densità, non soltanto i colori. Nessuna richiede di cambiare nome o ridisegnare il logo prima dell’approvazione.

### A: Il gruppo prende forma

**Raccomandata.** Home centrata sull’invito, spazio operativo con persone e quote a righe, consegna centrata sul biglietto. Mantiene la continuità del marchio senza mantenere l’attuale composizione stretta.

| Ruolo | Proposta |
|---|---|
| Fondo | `#F5FAF6`, verde quasi bianco |
| Superficie | `#FFFFFF` |
| Testo e azione primaria | `#033922`, verde del marchio |
| Testo di supporto | `#52665B` |
| Accento del nastro | `#FD5D17`, arancio del marchio |
| Superficie di consegna | `#FFE9DE`, pesca chiaro |
| Titoli | Urbanist 700 |
| Testo e controlli | Source Sans 3 400/600 |
| Elemento distintivo | Nastro che collega il gruppo al regalo, senza decorazioni su ogni controllo |

Il verde fa riconoscere le azioni primarie. L’arancio conserva il legame con il logo e marca il momento di preparare o inviare il regalo, senza diventare il colore di ogni stato.

```text
390 px
┌──────────────────────────┐
│ Gifty             Accedi │
│                          │
│ [Titolo sul regalo       │
│  di gruppo, 2–3 righe]    │
│ [Supporto solo se utile] │
│ [Organizza un regalo]    │
│ Idee regalo              │
│                          │
│   invito + iniziali      │
│   gruppo → regalo        │
│   esempio dichiarato     │
├──────────────────────────┤
│ Idee per il vostro regalo│
│ [prodotto] [prodotto]     │
└──────────────────────────┘
```

La hero segue il chiarimento D24: un’unica superficie fotografica a tutta larghezza, con titolo e azioni sovrapposti allo sfondo e biglietti nella parte bassa. Testo e foto non sono blocchi in sequenza. Su mobile la stessa composizione conserva azioni leggibili e immagine di sfondo. Il riferimento visivo fornito da Cri prevale sulla precedente indicazione a due colonne. I due modi di iniziare compaiono dopo l’azione principale, non come due servizi rivali nella hero. Titolo da integrare dal modulo del copywriter: “Scegli il regalo di gruppo e tieni il conto delle quote”; azione primaria “Organizza un regalo di gruppo”, secondaria “Esplora le idee regalo”. Non aggiungere sotto il titolo una frase che ripeta le stesse due funzioni se l’esempio già le mostra.

### B: L’invito sulla tavola

Home impostata come un invito d’occasione. Una fascia iniziale presenta destinatario, ricorrenza e data; il gruppo è visibile subito. Nella pagina dell’organizzatore, agenda della consegna e lista persone hanno peso maggiore del catalogo. È la direzione più densa e sociale.

| Ruolo | Proposta |
|---|---|
| Fondo | `#F3F6FF`, azzurro quasi bianco |
| Superficie | `#FFFFFF` |
| Testo | `#182D54` |
| Azione primaria | `#264BB8` |
| Accento | `#FF956F` |
| Titoli | Fraunces 650, usato come famiglia intera senza singole parole decorative |
| Testo e controlli | Hanken Grotesk 400/600 |
| Elemento distintivo | Invito disteso e gruppo disposto sul bordo, come posti attorno a una tavola |

```text
390 px
┌──────────────────────────┐
│ Gifty             Accedi │
│ [Titolo breve]           │
│ ┌ invito d’esempio ─────┐ │
│ │ Per Mauro            │ │
│ │ Compleanno / data    │ │
│ │ A  L  G  M  +4       │ │
│ └──────────────────────┘ │
│ [Organizza un regalo]    │
│                          │
│ [gruppo] [regalo]        │
│ Prepariamo la consegna   │
└──────────────────────────┘
```

**Tradeoff:** rende bene compleanni, colleghi e call di consegna; può sembrare un servizio per organizzare feste. La coppia serif/sans rischia inoltre di avvicinarsi al linguaggio editoriale di GroupTogether. Non è la prima scelta per spiegare quote e acquisto.

### C: La proposta regalo

Home e ricerca sono un banco di proposte: grande immagine di un regalo, prezzo e quota, due o tre alternative confrontabili. La creazione del gruppo rimane sempre raggiungibile e il ramo senza regalo deve avere lo stesso rilievo. È la direzione più orientata alla scoperta dei prodotti.

| Ruolo | Proposta |
|---|---|
| Fondo | `#FAF8F6`, neutro chiaro |
| Superficie | `#FFFFFF` |
| Testo | `#342420` |
| Azione primaria | `#9E302A`, rosso profondo |
| Accento | `#FFD6B8` |
| Titoli | Archivo 700/800 |
| Testo e controlli | Manrope 400/600 |
| Elemento distintivo | Foto prodotto con cartellino quota e selezione delle alternative su una fascia comune |

```text
390 px
┌──────────────────────────┐
│ Gifty             Accedi │
│ [Titolo breve]           │
│ ┌──────────────────────┐ │
│ │ un regalo concreto   │ │
│ │ 150 € / in 10: 15 €   │ │
│ └──────────────────────┘ │
│ [Organizza un regalo]    │
│ Prima le adesioni        │
│                          │
│ [idea] [idea] [idea]      │
└──────────────────────────┘
```

**Tradeoff:** aiuta chi non sa scegliere, ma spinge spontaneamente a cercare un prodotto prima di formare il gruppo. Ripropone quindi il limite del primo mockup. La raccomandazione è usare questa densità nel catalogo della direzione A, non come identità della home.

## Perché raccomando A

Le parole del prodotto sono gruppo, invito, regalo, firma, quota e consegna. La direzione A usa questi oggetti e conserva il marchio attuale. Il titolo cambia famiglia per non mantenere l’associazione Bricolage/arancio osservata in Satispay. Evita il viola festoso di Thankbox, la superficie turchese e il serif di GroupTogether e il carosello fotografico di Growish.

Il gesto caratteristico è il gruppo che si ricompone nel biglietto, non una fotografia di una scatola con un pannello di metriche sovrapposto. Sulle pagine operative il motivo visuale arretra: contano leggibilità, persone e azioni.

Ho escluso da A gradienti, collage di card ruotate, titoli con una parola colorata, etichette tutte maiuscole e tre box identici per spiegare il servizio. Il nastro compare nella hero e nella consegna; non sotto ogni titolo.

## Fondamenta della direzione A

### Tipografia

Le famiglie sono proposte, non font già caricati o verificati nel browser. Prima della costruzione vanno verificati provenienza ufficiale, licenza, disponibilità dei pesi, cifre e resa italiana. La scelta non autorizza installazioni.

| Ruolo | Desktop | Mobile | Peso e interlinea |
|---|---|---|---|
| Hero | 64 px | 36 px | Urbanist 700, 105–110%, tracking −0,025 em |
| Titolo pagina operativa | 28 px | 28 px | Urbanist 700, 120%, tracking −0,02 em |
| Titolo sezione | 24 px | 24 px | Urbanist 700, 125%, tracking −0,015 em |
| Testo e controlli | 18 px nella hero; 16 px nell’app | 16 px | Source Sans 3 400/600, 140% |
| Dettaglio utile | 14 px | 14 px | Source Sans 3 400/600, 140% |

Per ogni pannello operativo usare soltanto titolo, corpo e dettaglio. Il prezzo non introduce una quarta dimensione: usa quella del titolo. Le cifre sono tabulari; importi e unità rimangono vicini. I titoli non terminano con il punto, neppure quando vanno su più righe.

### Colore e contrasto

Rapporti calcolati sui valori proposti, non misurati su una UI implementata. Il contrasto va ricontrollato sul risultato reale, compresi opacità e stati.

| Coppia proposta | Contrasto calcolato | Uso |
|---|---|---|
| Verde `#033922` su bianco | 13,03:1 | Testo, bottoni bianchi con bordo, icone |
| Bianco su verde `#033922` | 13,03:1 | Azione principale |
| Verde `#033922` sul fondo `#F5FAF6` | 12,34:1 | Titoli e corpo |
| Supporto `#52665B` su bianco | 6,16:1 | Date, dettagli, stato secondario |
| Supporto `#52665B` sul fondo | 5,83:1 | Informazioni secondarie |
| Testo `#142B20` su arancio `#FD5D17` | 4,84:1 | Azione di consegna e superfici arancio |
| Errore `#B52525` su bianco | 6,45:1 | Errori con testo, mai solo colore |

Arancio e verde non rappresentano da soli soldi ricevuti o mancanti: ogni stato ha un’etichetta. Evitare rosso per indicare una persona che deve ancora rimborsare; usare testo neutro e azione pertinente.

### Spazio, superfici e geometria

- Scala a base 4 px: 4, 8, 12, 16, 24, 32, 48, 64 e 96
- Pagina desktop: larghezza massima 1200 px, margini di almeno 40 px; hero 7/5 colonne, spazio fra colonne 48 px
- Pagina mobile: 390 px di riferimento, margini 20 px; contenuto utile 350 px; verificare anche 320 px senza scorrimento orizzontale
- Testo lungo: limite 64 caratteri di riga; i testi legali rimangono in un documento leggibile, non dentro una successione di card
- Raggi: controlli 10 px, grandi superfici 20 px, avatar tondi; pillole solo per filtri e conteggi brevi
- Ombre: una sola ombra per fogli o elementi realmente sovrapposti; nessuna ombra ripetuta su tutte le righe
- Le sezioni si separano prima con spazio e allineamento, poi con una linea; niente contenitori con bordo dentro contenitori con bordo

### Controlli

Bottoni alti almeno 48 px, aree interattive minime 44 px. Campi a 16 px per evitare l’ingrandimento automatico su telefono. Importi e numero di persone hanno larghezza proporzionata; destinatario e dedica possono occupare la riga. Due alternative si mostrano come radio visibili o scelte affiancate, non in un menu a tendina.

Stati indispensabili: normale, hover, focus evidente, premuto, selezionato, disabilitato e salvataggio. Un errore rimane accanto al campo e non cancella quanto scritto. Il testo del bottone indica l’azione; i dettagli sul funzionamento non vengono aggiunti sotto ogni controllo.

## Mappa dei requisiti nelle schermate

Gli identificativi UX qui sotto servono alla tracciabilità del design. Il master dei flussi prevale e potrà assegnare identificativi definitivi ai requisiti.

| ID | Requisito da coprire | Schermate |
|---|---|---|
| UX-R01 | Organizzare senza aver scelto un regalo | Home, avvio, adesioni, catalogo contestuale |
| UX-R02 | Proporre un regalo già scelto con quota corrente | Avvio, catalogo, invito, area partecipante |
| UX-R03 | Iscrizione di organizzatore e partecipante; newsletter facoltativa | Accesso contestuale, impostazioni, newsletter |
| UX-R04 | Accordi in chat, modifiche riportate dall’organizzatore senza riconferme obbligatorie individuali | Spazio organizzatore, modifica regalo e quota |
| UX-R05 | Adesioni e soldi ricevuti distinti | Invito, spazio organizzatore, quota personale |
| UX-R06 | Destinatario può scegliere prima che compri l’organizzatore | Anteprima consegna, pagina destinatario, acquisto |
| UX-R07 | La consegna chiude nuove adesioni; invio digitale come confine proposto P01 | Preparazione consegna, invito chiuso, gestione gruppo |
| UX-R08 | Organizzatore acquista su Amazon e riscuote direttamente | Acquisto, quota personale, conferma ricezione |
| UX-R09 | Biglietto, gift card e call come possibilità da definire e non obblighi del percorso | Biglietto, scelta finale, consegna, riepilogo extra |
| UX-R10 | Invito delegabile senza concedere automaticamente dati o poteri finanziari | Persone e permessi |

## Schermate e comportamento

### 1 Home

**Persona e domanda:** chi vuole organizzare, “posso farlo qui anche se non ho un’idea?”

**Anatomia:** logo e accesso; titolo del modulo copy, che nomina già scelta e quote; azione principale di organizzazione; collegamento al catalogo; esempio composto da invito, persone e regalo; idee regalo sotto la prima schermata; biglietto e consegna più in basso. La frase di supporto resta uno slot disponibile solo se il rendering mostra un’informazione necessaria non già espressa: non è obbligatoria.

Il contenuto visuale deve mostrare il passaggio tra gruppo e regalo. Non mostrare una dashboard di incassi finti né presentare la newsletter come un passaggio obbligatorio. Preferiti e le proprie iniziative rimangono raggiungibili dopo l’accesso; non serve una barra con cinque funzioni di pari peso al primo ingresso.

**Budget di interazione proposto:** una pressione per iniziare; una pressione alternativa per esplorare le idee. Nessuna domanda richiesta prima di vedere se il servizio è pertinente.

### 2 Avvio dell’iniziativa

**Persona e domanda:** organizzatore, “per chi lo facciamo e da dove parto?”

**Anatomia:** destinatario, occasione e data nella stessa schermata; due scelte visibili: partire dalle adesioni o da un regalo. Ogni scelta ha una piccola illustrazione: persone e quota nel primo caso, prodotto e quota nel secondo.

La modalità scelta modifica il contenuto successivo senza aprire un altro servizio. È possibile tornare indietro senza perdere destinatario e data. L’account si richiede nel momento in cui serve salvare o condividere, prima dell’effettiva pubblicazione dell’invito; il timing esatto è una proposta UX, non una decisione già presa da Cri.

**Budget di interazione proposto:** tre dati di base, una scelta di percorso e una continuazione. La data è una scelta normale di calendario, non un’ulteriore pagina.

### 3A Prima le adesioni

**Persona e domanda:** organizzatore, “quanto chiediamo e dove invito gli altri?”

**Anatomia:** quota proposta; eventuale numero indicativo di persone, chiaramente distinto dalle adesioni; anteprima dell’invito con destinatario e quota; azione per creare e condividere. I metodi di versamento si possono configurare quando si devono raccogliere soldi, senza impedire di ottenere prima adesioni.

Il budget mostra una relazione leggibile: numero di adesioni per quota proposta. Prima della prima adesione non c’è una barra vuota che suggerisca un errore. Lo stato neutro mostra invito pronto e azione di condivisione.

### 3B Il regalo è già scelto

**Persona e domanda:** organizzatore, “posso proporre questo e far vedere quanto viene a testa?”

**Anatomia:** prodotto da catalogo o link esterno, prezzo e numero previsto di persone; quota stimata; anteprima dell’invito; azione per condividere. Il prezzo totale non viene nascosto dietro la quota. Il prodotto può essere modificato; non si richiedono dati del destinatario per la spedizione prima di sapere se il regalo verrà comprato.

**Budget di interazione proposto:** selezione prodotto, verifica prezzo, numero previsto di persone, continuazione. Se si arriva dal catalogo, i valori già impostati sono portati avanti.

### 4 Invito di partecipazione

**Persona e domanda:** chi arriva da WhatsApp, “a chi facciamo il regalo, quanto si pensa di spendere e ci sto?”

**Anatomia:** destinatario e organizzatore; regalo se già scelto oppure illustrazione neutra del gruppo; quota proposta o stimata; data; azione di adesione e scelta di non partecipare meno evidente. Nessun elenco di dati privati degli altri prima dell’iscrizione.

L’anteprima è leggibile senza account come proposta UX; l’iscrizione è richiesta per aderire, secondo la decisione di Cri. Non chiedere la newsletter per proseguire. Dopo l’adesione si torna alla stessa iniziativa, senza dover ritrovare il link o riscrivere i dati.

### 5 Accesso contestuale

**Persona e domanda:** organizzatore o partecipante, “come continuo senza perdere quello che stavo facendo?”

**Anatomia:** identità dell’iniziativa ridotta in alto; metodo d’accesso che il prodotto implementerà realmente; informativa e termini distinti; newsletter facoltativa non preselezionata; ritorno automatico alla specifica azione dopo accesso riuscito.

**Stati:** invio in corso, attesa di verifica, link scaduto, errore di rete, account già esistente, annullamento. Non usare testo che prometta un metodo d’accesso non implementato. In una proposta statica l’interazione va etichettata come dimostrazione.

### 6 Spazio dell’organizzatore

**Persona e domanda:** organizzatore, “a che punto siamo e cosa devo fare adesso?”

**Desktop:** testata con destinatario e data; corpo principale con regalo e persone; colonna laterale con quota, stato dell’acquisto e prossima azione. Le persone sono righe con nome, stato e azione pertinente, non schede uguali impilate.

**Mobile:** titolo, prossimo compito, regalo, conteggio adesioni, quota corrente, persone. Le azioni meno frequenti sono nel menu di ciascuna riga. Una barra di navigazione non deve sovrapporsi ai pulsanti della schermata.

Prima dell’acquisto mostrare adesioni e budget previsto. Quando si stanno riscuotendo quote mostrare denaro ricevuto e ancora da ricevere. Se entrambe le informazioni servono, usare gruppi di righe con etichette esplicite, evitando due grandi indicatori identici.

**Azioni:** condividere invito, scegliere o cambiare regalo, aggiornare quota, gestire persone e permessi, preparare consegna, segnare acquisto e confermare quote ricevute. Nessuna azione di pagamento automatico viene implicata dal visual.

### 7 Ricerca e scelta del regalo

**Persona e domanda:** organizzatore o partecipante autorizzato, “cosa possiamo regalare con questo budget?”

**Anatomia:** contesto del gruppo sempre visibile; budget corrente; ricerca; filtri pertinenti; prodotti con immagine, nome, prezzo totale e quota nello scenario corrente; selezione e preferiti con significati distinti. Le categorie non vengono inventate se non esistono nei dati.

Su desktop griglia più densa della home; su mobile due colonne soltanto se titolo, quota e azioni rimangono leggibili. La scheda di dettaglio mostra la proposta nel contesto del gruppo. Un prezzo non aggiornato è indicato nel punto in cui serve decidere; la disponibilità viene verificata sul sito di acquisto.

La votazione già presente nel prodotto rimane una modalità facoltativa del gruppo; la proposta non elimina proposte e voti. Non deve diventare un blocco per chi ha già deciso nella chat.

### 8 Cambiare regalo o quota

**Persona e domanda:** organizzatore, “abbiamo deciso diversamente in chat, come aggiorno qui?”

**Anatomia:** regalo o quota attuale, controllo di modifica, nuovo riepilogo e salvataggio. Il vecchio valore è visibile durante la modifica. Se esistono versamenti, il riepilogo conserva quanto già registrato e mostra la nuova differenza, senza cancellare i movimenti o dichiarare rimborsi automatici.

Non introdurre un voto obbligatorio, un tetto per partecipante o una nuova accettazione individuale. L’accordo avviene in WhatsApp e l’organizzatore lo riporta nell’app. La schermata segnala la modifica quando il partecipante torna; l’eventuale notifica operativa è una capacità da progettare e verificare.

### 9 Biglietto e preparazione della consegna

**Persona e domanda:** organizzatore, “siamo pronti a mandarglielo?”

**Anatomia:** anteprima del regalo proposto e del biglietto se scelto; firme; destinatario e canale reale di invio; data/ora della call se configurata; conteggio dei partecipanti; azione di invio. L’effetto sulla chiusura del gruppo è indicato vicino all’azione, non in un documento da scoprire dopo.

L’invio al destinatario è il confine dei nuovi ingressi nell’interpretazione operativa attuale. Prima di implementarlo occorre confermare che questo evento sia il significato preciso di “consegnato”, distinto dalla spedizione fisica. Un fallimento dell’invio non deve apparire come consegna avvenuta.

Un extra a pagamento è mostrato con prezzo, totale e soggetto pagante prima dell’acquisto. Non visualizzare 0,50 € come listino approvato: è soltanto un’ipotesi discussa. La consegna funziona anche senza aver scelto tutti gli extra.

### 10 Il regalo per il festeggiato

**Persona e domanda:** destinatario, “chi ha pensato a me e cosa mi stanno regalando?”

**Prima vista:** regalo e messaggio del gruppo. Le firme e il biglietto hanno il posto che un oggetto regalo merita, senza una dashboard di quote individuali. Non mostrare saldi, persone da sollecitare o coordinate di rimborso.

**Scelta:** mantenere il regalo proposto oppure vedere alternative. Il budget disponibile accompagna la selezione; un prodotto oltre il budget rimane una possibilità da concordare, non una spesa già autorizzata. La scelta viene comunicata all’organizzatore, che acquista personalmente. Nessun bottone del destinatario addebita automaticamente l’organizzatore.

La gift card compare solo se il prodotto del fornitore e il relativo accordo sono realmente disponibili. La sostituzione prima dell’emissione non viene confusa con il cambio di una carta già comprata.

### 11 Acquisto dell’organizzatore

**Persona e domanda:** organizzatore, “quale regalo devo comprare adesso?”

**Anatomia:** scelta confermata del destinatario, prezzo di riferimento, collegamento Amazon riconoscibile, azione per segnare l’acquisto e spesa reale. Il passaggio all’esterno deve essere chiaro nell’etichetta o nell’icona con nome accessibile. Il ritorno in Gifty non dimostra da solo che l’acquisto sia avvenuto.

Il codice affiliato riguarda Gifty; l’ordine e la spedizione sono effettuati personalmente dall’organizzatore cliente. Non rappresentare il collegamento come un checkout interno o garantire una commissione.

### 12 La quota personale e il rimborso

**Persona e domanda:** partecipante già iscritto, “quanto devo ancora dare e a chi?”

**Anatomia:** importo personale corrente, importo già ricevuto se presente, saldo, organizzatore e metodi disponibili. Dati da copiare e ritorno dal pagamento sono nello stesso contesto. L’azione che dichiara di aver pagato è distinta dalla conferma di ricezione dell’organizzatore.

Usare stati leggibili: quota da dare, pagamento dichiarato, quota ricevuta. I dettagli di conto e causale si aprono soltanto per il metodo scelto. Nessuna nuova newsletter o registrazione per saldare una quota quando si è già riconosciuti.

La possibilità di continuare ad accedere dopo la consegna per saldare la propria quota è una proposta ancora da confermare, non una regola già approvata da Cri. Il design deve quindi avere uno stato dedicato invece di assumere che tutti gli accessi siano aperti o tutti chiusi.

### 13 Invito chiuso dopo la consegna

**Persona e domanda:** nuovo visitatore del vecchio link, “posso ancora aggiungermi?”

**Anatomia:** iniziativa riconoscibile e stato di consegna; nessuna azione di adesione disponibile. Non mostrare una schermata di accesso che, dopo l’iscrizione, prometta di poter partecipare. Chi è già membro usa il proprio percorso di accesso, se la regola di accesso post-consegna verrà confermata.

Le richieste avviate prima della chiusura ma inviate dopo devono essere rifiutate dal server e spiegate con lo stato corrente, senza creare un mezzo partecipante o richiedere la quota a chi non è entrato.

### 14 Persone e co-organizzatori

**Persona e domanda:** organizzatore, “chi può aiutarmi e in cosa?”

**Anatomia:** elenco persone, ruolo effettivo e permessi pertinenti. Dare il permesso di invitare non concede automaticamente accesso a importi privati, conferma dei rimborsi o cambio delle coordinate del beneficiario.

Il ruolo “co-organizzatore” deve riassumere i permessi realmente concessi. Una revoca non cancella adesione, firma o versamenti già registrati della persona. Prima della consegna il delegato può invitare solo se autorizzato; dopo la consegna il blocco dei nuovi ingressi vale anche per lui.

### 15 Newsletter, cookie e informazioni legali

Newsletter nel footer o al termine di un compito riuscito, mai come passaggio per aderire al regalo. Il modulo dice cosa si riceverà; scelta non preselezionata e disiscrizione disponibili. Non è un prodotto già attivo finché invio, consenso e cancellazione non sono implementati.

Il banner cookie dipende dagli strumenti realmente usati. Se necessario, il rifiuto è accessibile e il sito resta utilizzabile; il design non inserisce un banner finto solo per riempire il footer. Privacy e termini devono avere un percorso di lettura completo e dati reali del titolare.

## Stati e recupero

| Stato | La schermata mostra | Azione disponibile | Da evitare |
|---|---|---|---|
| Nessuna adesione | Invito e quota proposti | Condividere il link | “0 raccolti” come errore o denaro previsto come incassato |
| Nessun regalo scelto | Gruppo, quota e budget da adesioni | Cercare un regalo | Prodotto finto a zero euro |
| Nessun risultato nel catalogo | Filtri attivi e ricerca corrente | Modificare filtri o ricerca | Generare prodotti che non esistono |
| Salvataggio in corso | Controllo impegnato e contenuto conservato | Attendere, senza doppio invio | Perdere i dati o invitare a ricominciare |
| Salvataggio fallito | Errore vicino all’azione | Riprovare senza riscrivere | Mostrare successo o svuotare la schermata |
| Accesso interrotto | Iniziativa e azione da riprendere | Tornare all’accesso | Perdere il contesto del gruppo |
| Quote cambiate | Quota corrente e saldo personale aggiornato | Vedere il dettaglio utile | Richiedere automaticamente un voto a tutti |
| Consegna non riuscita | Anteprima conservata, invio fallito | Correggere o riprovare | Chiudere il gruppo come se il destinatario l’avesse ricevuto |
| Regalo consegnato | Nessuna nuova adesione | Accesso membri secondo regola da confermare | Usare il vecchio link per creare nuovi membri |
| Pagamento dichiarato | Stato in attesa di conferma | Organizzatore conferma ricezione | Mostrare il denaro come già verificato |
| Prodotto cambiato di prezzo | Prezzo di riferimento e necessità di verifica esterna | Cambiare proposta o aggiornare la spesa | Garantire disponibilità o prezzo Amazon |
| Firma mancante | Invito alla dedica nella propria area | Firmare se consentito | Confondere mancata firma e mancato pagamento |

## Slot di copy

Le stringhe del modulo del copywriter prevalgono. I limiti sono obiettivi di layout da verificare nel rendering, non limiti che troncano nomi o messaggi degli utenti.

| Superficie | Elemento e compito | Spazio proposto |
|---|---|---|
| Home | Titolo che nomina il regalo di gruppo | 60 caratteri, 2 righe desktop o 3 mobile |
| Home | Eventuale frase di supporto, solo se aggiunge un’informazione necessaria | Facoltativa; massimo 2 righe mobile, senza ripetere il titolo |
| Home | Azione di avvio | 32 caratteri, una riga a 390 px |
| Avvio | Due ingressi riconoscibili | 32 caratteri ciascuno |
| Invito | Titolo con nome del festeggiato | Nome completo senza troncamento obbligatorio |
| Invito | Quota corrente con unità | Importo e “a testa” su una riga |
| Organizzatore | Stato del budget o dei rimborsi | Una riga informativa per gruppo di dati |
| Modifica | Azioni regalo e quota | 24 caratteri |
| Consegna | Conseguenza sul blocco delle adesioni | Una frase breve accanto all’invio |
| Destinatario | Tenere proposta o vedere alternative | 28 caratteri ciascuno |
| Acquisto | Passaggio ad Amazon | 26 caratteri con destinazione riconoscibile |
| Rimborso | Dichiarazione e conferma separate | 28 caratteri ciascuna |
| Invito chiuso | Stato e prossima possibilità reale | Titolo e al massimo una frase |
| Newsletter | Finalità dell’iscrizione | Una frase con contenuto effettivo |

## Tavole visuali e verifica

| Artefatto | Contenuto | Uso e limite |
|---|---|---|
| [Tre direzioni](Gifty-direzioni-design.png) | A, B e C con lo stesso titolo e le stesse azioni principali | Confronto del carattere visivo e degli archetipi; non tre implementazioni |
| [Direzione raccomandata](Gifty-UX-proposta-raccomandata.png) | Home desktop, avvio, gruppo con adesioni aperte e consegna al destinatario | Esempi di momenti diversi della stessa iniziativa, non stati simultanei |
| [Prompt delle tavole](Gifty-prompts-mockup.md) | Specifiche usate per la generazione integrata | Consente di confrontare le richieste con il risultato, senza trattare l’immagine come prova di funzionamento |

Le immagini sono state generate con imagegen integrato e copiate negli output. Font e marchio sono rappresentazioni raster: non sono i font caricati nel sito, asset del logo esportati dal repository o una proposta di sostituire il marchio esistente. Le fotografie dei prodotti e i nomi dei partecipanti sono illustrativi. Non provano prezzi, disponibilità o vendite.

La home della tavola raccomandata ha titolo e azioni sovrapposti allo sfondo fotografico della stessa hero. È la composizione da mantenere nel prototipo, come precisato da Cri nella correzione del 24 ottobre. La tavola non è uno screenshot a 1280 px né una misura dei controlli a 390 px. Non comprende una home mobile completa, l’invito del partecipante o il passaggio di acquisto dell’organizzatore: queste viste sono descritte nella specifica e restano da visualizzare nel prototipo. Il prototipo eseguibile deve conservare composizione, marchio con segno a nastro, fotografia ambientata, illustrazioni e gerarchia visibili nella tavola; i controlli e i testi restano elementi HTML navigabili.

Verifica visuale eseguita sulle tavole:

- Titolo e azioni principali sono in italiano e non terminano con il punto
- Le tre direzioni condividono il titolo del modulo copy e l’azione di organizzazione
- L’esempio è dichiarato; Mauro ha otto adesioni da 10 €, con budget previsto di 80 €
- Lo spazio dell’organizzatore mostra “Ricevuto 0 €”, non un avanzamento di denaro incassato
- Il gruppo con adesioni aperte non ha ancora un prodotto scelto; offre la ricerca del regalo
- La vista del destinatario appartiene al momento successivo e permette di scegliere il regalo o le alternative; non presenta un checkout Amazon o un addebito
- Nella tavola raccomandata le iniziali della home, dell’elenco persone e della consegna restano coerenti
- “Continua”, le denominazioni illustrative dei prodotti e “Dal tuo gruppo” sono stati riletti editorialmente insieme al resto dell’immagine: identificano azioni o contenuti e non aggiungono promesse commerciali

È stata applicata e ricontrollata una sola correzione mirata della tavola delle direzioni: sostituita la formula generica “Idee regalo per ogni occasione” con “Idee regalo”. Il controllo dell’immagine non sostituisce la verifica del rendering futuro o dei percorsi reali.

Il testo e gli slot proposti sono stati riletti con find-ai-slop in italiano: rimossi titoli enfatici, promesse di automazione, spiegazioni che replicavano i controlli e punti finali dai titoli. Le coppie di colore indicate sono state calcolate; nessun contrasto è dichiarato come misurato su una pagina che non esiste ancora.

Prima della costruzione del prodotto, la direzione scelta va mostrata su home desktop e mobile, invito, spazio organizzatore e consegna al destinatario. Gli stessi dati d’esempio devono restare coerenti tra le schermate. La verifica deve controllare comprensione dei due ingressi, distinzione tra adesioni e soldi ricevuti, ruolo dell’organizzatore nel checkout e impossibilità di aderire dopo la consegna, applicando P01 soltanto se confermata.

In questo incarico sono state create tavole raster, senza HTML o componenti applicativi. Sono proposte, non prove di funzionamento. Le fonti del settore sono state analizzate prima di proporre queste direzioni. Il confronto con gli altri prodotti di Cri è servito soltanto a non riusarne l’identità: il dashboard finanziario usa IBM Plex Sans con verde operativo, WallKept una base chiara con accento lime; nessuno dei due diventa il riferimento estetico di Gifty.
