# Regaloop · UX_V4 — Brief per Google Stitch

> Documento-prompt per generare il nuovo front-end di **Regaloop** con Google Stitch.
> Descrive **tutte le pagine** del sito: a cosa servono, cosa contengono, quali azioni offrono e quali stati devono avere.
> Obiettivo di UX_V4: **semplificare**. Meno testo, una sola azione principale per schermata, dettagli solo su richiesta.

---

## 0. Come usare questo file con Stitch

1. **Ogni generazione** parte incollando le sezioni **1, 2, 3 e 4** (contesto, principi, stile, componenti): sono il «sistema» comune.
2. Poi aggiungi **un gruppo di schermate alla volta** dalla sezione 6 (es. «Gruppo C — Chi partecipa»). Stitch lavora meglio con 3–6 schermate per richiesta.
3. Chiedi sempre **la versione mobile** (390 px) come prima; la versione desktop è un adattamento.
4. I testi tra «virgolette» sono **testi reali dell'interfaccia** da usare così come sono (già accorciati). Non inventare numeri, recensioni o statistiche.

---

## 1. Contesto del prodotto

**Regaloop** aiuta una persona a organizzare un **regalo di gruppo** (una «colletta») e un **biglietto di auguri firmato da tutti**.

- L'**organizzatore** sceglie un regalo dal catalogo (prodotti Amazon.it), imposta la quota, indica dove vuole essere pagato e ottiene **un link** da incollare nella chat del gruppo (WhatsApp).
- Chi **partecipa** apre il link, vede regalo e quota, paga con il metodo che preferisce e lo **dichiara con un tocco**. Nessuna registrazione.
- L'organizzatore vede chi ha pagato e chi manca, **conferma** gli accrediti, compra il regalo e chiude con un rendiconto.
- In parallelo esiste il **biglietto di auguri digitale**: ognuno firma con un messaggio (e una foto/GIF) e il biglietto arriva al festeggiato alla data scelta. Gratis.

**Principio fondante:** *i soldi non passano mai da Regaloop.* Si pagano direttamente all'organizzatore (PayPal, Satispay, bonifico, contanti). Il servizio non incassa e non chiede dati di pagamento a chi partecipa.

**Lingua dell'interfaccia:** italiano. **Uso prevalente:** telefono, spesso aperto da un link in WhatsApp.

### Tre tipi di utente

| Utente | Ha un account? | Dove vive |
|---|---|---|
| **Visitatore / organizzatore** | Sì, solo per creare e gestire (accesso con Google) | Sito completo con navigazione |
| **Partecipante alla colletta** | **Mai** | Una sola pagina, senza menu (`/c/…`) |
| **Firmatario del biglietto** | **Mai** | Poche pagine, senza menu (`/b/…`) |

### Dati del dominio (per riempire le schermate in modo realistico)

- **Occasioni:** Compleanno, Laurea, Pensione, Nascita, Matrimonio, Saluto (addio/trasferimento).
- **Metodi di pagamento:** PayPal, Satispay, Bonifico, Contanti.
- **Modi di dividere la quota:** Quota fissa · Quota divisa (prezzo ÷ partecipanti) · Quota libera (ognuno mette quanto vuole, con cifra suggerita).
- **Stati del partecipante:** invitato → aderito → dichiarato (*«ho pagato»*) → confermato (dall'organizzatore) · oppure rinunciato. **Solo i confermati entrano nel totale.**
- **Stati della colletta:** bozza → aperta (eventualmente prima *in votazione*) → chiusa.
- **Catalogo:** ~180 prodotti reali, da 25 a 520 €. Filtri: **Per chi** (Uomo, Donna), **Tema** (Viaggio, Tecnologia, Arredamento), **Tipo** (lampade, vasi, specchi, sedie, arte da parete…), **Prezzo** (fino a 30 · 30–80 · 80–150 · 150–200 · oltre 200 €).
- Esempio realistico: *«Marco organizza il regalo per Giulia — Compleanno, 14 novembre — Appendiabiti Cactus, 116,65 € — 10 € a testa — 8 persone su 12 hanno già partecipato».*

---

## 2. Principi di UX_V4 (la semplificazione)

Il sito attuale è **troppo pieno di testi lunghi**. In UX_V4 valgono queste regole:

1. **Una schermata, un compito, un pulsante principale.** Le azioni secondarie sono link o pulsanti meno evidenti.
2. **Titolo ≤ 6 parole, sottotitolo ≤ 12 parole.** Nessun paragrafo oltre le 2 righe su telefono.
3. **Spiegazioni a richiesta:** le note («perché ti chiediamo questo», regole di calcolo, avvertenze) vanno dietro un'icona **«i»** o un elemento espandibile, non nel corpo della pagina.
4. **Numeri grandi, parole poche:** quota, totale, avanzamento e scadenza si leggono a colpo d'occhio (cifre grandi, barre, chip).
5. **Mostrare invece di spiegare:** anteprime (messaggio WhatsApp, biglietto, link) al posto di descrizioni.
6. **Scelte come schede tappabili** (card grandi con icona + 1 riga) invece di radio e testo.
7. **Progressione visibile:** i flussi a passi hanno uno stepper compatto e «Indietro» sempre disponibile.
8. **Stati vuoti amichevoli:** icona + 1 riga + 1 azione.
9. **Mobile-first:** area toccabile minima 44 px, nessuno scorrimento orizzontale a 320 px, pulsante principale raggiungibile col pollice (in basso, fisso quando serve).
10. **Accessibilità:** contrasto AA, ogni campo con etichetta, immagini con testo alternativo.

---

## 3. Direzione visiva

- **Marchio:** logo «Regaloop» (scatola regalo + scritta). Colori del logo: **verde foresta `#033922`** e **arancio `#FD5D17`**.
- **Tono:** caldo, amichevole, affidabile (si parla di soldi tra amici). Niente aspetto da e-commerce aggressivo.
- **Riferimento esistente (riutilizzabile):** design system *Expressive Warmth* già usato in UX_V2/V3 — fondo crema `#F7F3EB`, card `#FFFDF8`, primario verde scuro `#00251C`/`#0A3C30`, accento tangerine `#FE6A34`, oro regalo `#FDB022`, bordi caldi `#E6DFD5`; titoli in **Bricolage Grotesque**, testo in **Plus Jakarta Sans** (o IBM Plex Sans); icone **Material Symbols**; angoli arrotondati generosi; pulsanti a pillola.
- **Eccezione:** il **biglietto di auguri** è un oggetto «di carta» — pagine interne sempre chiare, angoli vivi, formato A (1 : 1,414).

---

## 4. Struttura globale e componenti ricorrenti

### 4.1 Navigazione del sito (solo area pubblica/organizzatore)

- **Header** minimo: logo a sinistra, icona profilo/menu a destra.
- **Barra di navigazione in basso (mobile)** con 4–5 voci: **Home · Catalogo · Trova il regalo · Preferiti (con contatore) · Le mie collette** (se non loggato: «Accedi»).
- **Menu secondario** (dal profilo): Biglietto di auguri, Organizza una colletta, Come trattiamo i dati, Esci.
- **Footer** di una riga: «I soldi non passano mai da qui.» + dichiarazione obbligatoria **«In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.»** (piccola, ma sempre presente nelle pagine con prodotti Amazon).

> ⚠️ Le pagine del **partecipante** (`/c/…`) e del **firmatario** (`/b/…`) **non hanno header, menu, barra in basso né pubblicità del catalogo.** Solo logo piccolo.

### 4.2 Componenti da disegnare una volta e riusare

| Componente | Contenuto |
|---|---|
| **Card prodotto** | Foto intera su fondo bianco (4:3), marca, nome (max 2 righe), prezzo, «Consegna stimata 3 gg», **cuore** preferiti (in alto a destra), pulsante **«Regalalo in gruppo»**, azione **«+ Lista regali»**. Variante compatta (2 per riga su mobile) e larga. |
| **Barra lista regali** | Barra fissa in basso quando la lista ha ≥ 1 regalo: miniature + «Fai votare il gruppo» (attivo da 2 regali). |
| **Blocco condivisione** | Link con «Copia», anteprima del messaggio per il gruppo con «Copia messaggio» e **«Apri WhatsApp»**. Conferma «Copiato!» per 1,5 s. |
| **Anteprima chat** | Come appare il link in WhatsApp: immagine, titolo, dominio. |
| **Barra di avanzamento** | Raccolto confermato / obiettivo, con «8 su 12 hanno partecipato». |
| **Riga partecipante** | Avatar con iniziali, nome, chip di stato (Invitato · Aderito · Ha pagato? · Confermato · Rinuncia), azioni. |
| **Stepper** | Puntini/segmenti con nome del passo corrente. |
| **Scheda scelta** | Card tappabile con icona, titolo, 1 riga di descrizione, stato selezionato evidente. |
| **Selettore persone** | − [ 12 ] + |
| **Pulsante copia** | Icona + etichetta, feedback «Copiato!». |
| **Avviso** | Info / successo / attenzione, 1 riga + eventuale azione. |
| **Dialogo / bottom sheet** | Per filtri, conferme, accesso, dettagli. |
| **Stelle 1–5** | Per votare un regalo. |

---

## 5. Mappa delle pagine

**26 pagine (rotte)** in 6 gruppi; alcune hanno più stati/schermate (in totale ~50 schermate da disegnare).

| # | Pagina | Percorso | Chi | Gruppo |
|---|---|---|---|---|
| A1 | Home | `/` | tutti | Scoperta |
| A2 | Catalogo | `/catalogo` | tutti | Scoperta |
| A3 | Scheda prodotto | `/prodotto/[slug]` | tutti | Scoperta |
| A4 | Trova il regalo | `/regalo` | tutti | Scoperta |
| A5 | Preferiti | `/preferiti` | tutti | Scoperta |
| A6 | Accedi | `/accedi` | organizzatore | Scoperta |
| B1 | Crea colletta (6 passi) | `/crea` | organizzatore | Colletta – organizzatore |
| B2 | Dashboard raccolta | `/gestisci/[slug]` | organizzatore | Colletta – organizzatore |
| B3 | Chiusura | `/gestisci/[slug]/chiusura` | organizzatore | Colletta – organizzatore |
| B4 | Dati della colletta | `/gestisci/[slug]/dati` | organizzatore | Colletta – organizzatore |
| B5 | Le mie collette | `/le-mie-collette` | organizzatore | Colletta – organizzatore |
| C1 | Pagina della colletta | `/c/[slug]` | partecipante | Colletta – partecipante |
| C2 | Biglietto stampabile | `/c/[slug]/biglietto` | tutti con il link | Colletta – partecipante |
| D1 | Nuovo biglietto | `/biglietto/nuovo` | organizzatore | Biglietto – organizzatore |
| D2 | Dettagli del biglietto | `/biglietto/[id]/dettagli` | organizzatore | Biglietto – organizzatore |
| D3 | Copertina | `/biglietto/[id]/design` | organizzatore | Biglietto – organizzatore |
| D4 | Anteprima e pubblica | `/biglietto/[id]/anteprima` | organizzatore | Biglietto – organizzatore |
| D5 | Gestione biglietto | `/biglietto/[id]/gestisci` | organizzatore | Biglietto – organizzatore |
| E1 | Invito a firmare | `/b/[slug]` | firmatario | Biglietto – firmatario |
| E2 | Scrivi la firma | `/b/[slug]/firma` | firmatario | Biglietto – firmatario |
| E3 | I tuoi dati | `/b/[slug]/i-tuoi-dati` | firmatario | Biglietto – firmatario |
| E4 | Grazie | `/b/[slug]/grazie` | firmatario | Biglietto – firmatario |
| F1 | Come trattiamo i dati | `/privacy` | tutti | Servizio |
| F2 | Pagina non trovata | 404 (generica, colletta, biglietto) | tutti | Servizio |
| F3 | Scegli UX | `/scegli-ux` | interno | Servizio |
| F4 | Area riservata catalogo | `/backoffice/catalogo` | admin (desktop) | Servizio |

### Flussi principali

```
ORGANIZZATORE COLLETTA
Home → Catalogo / Trova il regalo → Scheda prodotto → «Regalalo in gruppo»
     → Accedi (Google) → Crea colletta (6 passi) → Dashboard → Chiusura → Rendiconto

PARTECIPANTE (da WhatsApp)
/c/[slug] → «Partecipo» → Nome → Metodo + istruzioni → «Hai pagato?» → Due righe per il biglietto → Fatto

ORGANIZZATORE BIGLIETTO
Nuovo biglietto → Dettagli → Copertina → Anteprima → Pubblica (accesso Google) → Condividi → Gestione

FIRMATARIO (da WhatsApp)
/b/[slug] → «Firma il biglietto» → Scrivi messaggio + foto → I tuoi dati → Grazie
```

---

## 6. Le pagine, una per una

Formato di ogni scheda: **Scopo · Contenuto (in ordine dall'alto) · Azione principale · Azioni secondarie · Stati da disegnare.**

---

### GRUPPO A — Scoperta

#### A1 · Home `/`

- **Scopo:** far capire in 5 secondi cosa fa Regaloop e portare a iniziare.
- **Contenuto:**
  1. Hero: occhiello «Regaloop», titolo **«Il regalo di gruppo, senza dover rincorrere tutti.»**, sottotitolo «Un link, tutti dentro, tu sai chi manca.»
  2. Due pulsanti: **«Organizza un regalo»** (→ catalogo) e «Guarda cosa vede chi partecipa» (→ colletta demo `/c/demo`).
  3. **Come funziona in 3 passi** (icona + titolo + 1 riga ciascuno): *Scegli il regalo · Manda un link · Noi teniamo il conto.*
  4. Card **Biglietto di gruppo**: «Un biglietto firmato da tutti. Gratis.» → «Crea un biglietto».
  5. Card rassicurazione: «Chi partecipa non si registra: basta un nome.»
  6. (Facoltativo) 2–4 idee regalo in evidenza dal catalogo con quota a testa calcolata su 12 persone.
- **Azione principale:** Organizza un regalo.
- **Secondarie:** demo partecipante, crea biglietto, Trova il regalo.

#### A2 · Catalogo `/catalogo`

- **Scopo:** sfogliare idee regalo da dividere in gruppo.
- **Contenuto:**
  1. Titolo «Catalogo» + conteggio prodotti.
  2. Barra: ricerca (facoltativa) + pulsante **«Filtra»** (apre bottom sheet) + chip dei filtri attivi rimovibili.
  3. **Griglia di card prodotto**: 2 colonne su mobile, 3–4 su desktop.
  4. Nota piccola: «Prezzi rilevati il 14–16 ottobre 2026».
  5. Barra lista regali (se ci sono regali in lista).
- **Bottom sheet filtri:** Per chi · Tema · Tipo (arredamento e design) · Prezzo · «Mostra N prodotti» · «Azzera».
- **Azione principale per card:** «Regalalo in gruppo» (→ `/crea?prodotto=…`).
- **Secondarie:** cuore preferiti, + lista regali, tocco sulla card → scheda prodotto (popup).
- **Stati:** con risultati · nessun risultato («Nessun regalo con questi filtri.» + «Azzera filtri») · caricamento.
- **Filtri condivisibili:** restano nell'indirizzo della pagina.

#### A3 · Scheda prodotto `/prodotto/[slug]`

- **Scopo:** decidere se regalare quel prodotto e vedere quanto costa a testa.
- **Si apre come popup a schermo intero** sopra il catalogo (X fissa in alto a destra che riporta al punto esatto del catalogo); aperta da link esterno è una pagina intera con «← Catalogo».
- **Contenuto:**
  1. Foto grande, marca, nome, prezzo, «Consegna stimata 3 giorni», cuore.
  2. **Riquadro calcolo di gruppo** in evidenza: «In **12** siete a **10 €** a testa» con selettore − / + persone.
  3. Descrizione breve (max 3 righe, «Leggi tutto» per espandere).
  4. Link «Vedi su Amazon.it» (apre nuova scheda).
  5. Nota piccola «Prezzo rilevato il …».
- **Azione principale:** **«Organizza la colletta»**.
- **Secondarie:** + lista regali, preferiti, «Crea un biglietto di gruppo», Vedi su Amazon.

#### A4 · Trova il regalo `/regalo`

- **Scopo:** chi non ha idee risponde a 3 domande e riceve regali consigliati.
- **Schermate:**
  1. **Avvio:** titolo «Trova il regalo perfetto», sottotitolo «Tre domande, trenta secondi.» Due strade: **«Rispondi alle 3 domande»** · «…o vai al catalogo».
  2. **Domanda 1 — Destinatario:** «È per un uomo o per una donna?» — due grandi cerchi illustrati.
  3. **Domanda 2 — Occasione:** 6 chip con icona (Anniversario, San Valentino, Natale, Laurea, Compleanno, Altro).
  4. **Domanda 3 — Interessi:** scegli **da 3 a 5** fra 36 interessi raggruppati in 6 categorie (Cultura, Sport, Food&Drink, Adventure, Società, Altre passioni), chip con icona; indicatore «3/5 selezionati».
  5. **Caricamento:** animazione breve «Cerco i regali giusti…» (≈1 s).
  6. **Risultati:** riga riepilogo («Donna · Compleanno · Musica, Viaggi»), filtro fascia di prezzo, ordinamento («I nostri preferiti», prezzo), griglia di card prodotto, «Ripeti la ricerca».
- **Componenti:** stepper a 4 tappe (Destinatario → Occasione → Interessi → Trovato!), «Indietro», «Avanti» disabilitato finché non si sceglie.
- **Stati:** nessun risultato in quella fascia («Nessuna idea in questa fascia» + cambia filtri).

#### A5 · Preferiti `/preferiti`

- **Scopo:** ritrovare i prodotti salvati col cuore.
- **Contenuto:** titolo «I tuoi preferiti», griglia di card prodotto, nota piccola su dove sono salvati (account o dispositivo).
- **Stati:** vuoto («Nessun preferito, per ora. Tocca il cuore nel catalogo.» → «Vai al catalogo») · caricamento.

#### A6 · Accedi `/accedi`

- **Scopo:** accedere per organizzare (serve solo a chi crea).
- **Contenuto:** titolo centrato «Accedi per organizzare», pulsante **«Sign in with Google»** (stile ufficiale Google), campo facoltativo «Come ti chiami?» con suggerimento «Lo vedranno i partecipanti».
- **Nota:** chi partecipa non accede mai — non serve dirlo qui.

---

### GRUPPO B — Colletta: organizzatore

#### B1 · Crea colletta `/crea` — 6 passi

Stepper in alto (6 segmenti + nome del passo), «Indietro» sempre visibile, pulsante «Avanti» fisso in basso. Il lavoro si salva a ogni passo. Può arrivare già con prodotto, festeggiato, persone o metodi precompilati.

**B1.1 · Il regalo — «Chi sceglie il regalo?»**
- Due schede scelta:
  - **Lo scelgo io** — «Scegli un regalo e parti subito.»
  - **Lo sceglie il gruppo** — «Proponi alcune idee: vince la più votata.»
- *Se «Lo scelgo io»:* due schede «Dal catalogo» / «Incolla un link».
  - Dal catalogo: ricerca + griglia compatta di card selezionabili.
  - Incolla un link: campi Link, Nome del regalo, Prezzo (€), Giorni di consegna, Tipo di regalo.
- *Se «Lo sceglie il gruppo» (votazione):* lista delle idee (almeno 2, dal catalogo o da link), durata della votazione in ore (chip 12 / 24 / 48 / 72 + campo), interruttore «Chi partecipa può proporre altri regali» (max 3 a testa). Nota «i»: finché si vota nessuno paga.
- **Stato:** regalo selezionato (card con spunta).

**B1.2 · Per chi e quando**
- Campi: **Per chi è il regalo?** (nome), **Occasione** (menu), **Quando glielo date?** (data, minimo domani), **Il tuo nome** («Lo vedranno i partecipanti»).
- Riquadro in evidenza: **«La raccolta si chiude il …»** (calcolata dalla consegna; spiegazione dietro «i»).
- Avviso se la data non lascia tempo per la consegna + proposta della prima data possibile.
- Interruttore **Modalità sorpresa** (attivo di default; «i»: l'anteprima del link non mostra regalo né nome).

**B1.3 · La quota — «Come si divide il costo?»**
- Tre schede: **Quota fissa** · **Quota divisa** · **Quota libera** (1 riga ciascuna).
- Selettore **numero di persone** (− / +).
- Per la quota fissa: campo «Quota a testa (€)» con valore suggerito.
- **Riquadro live** (si aggiorna a ogni battitura): Quota a testa · Totale previsto · Prezzo del regalo · **Avanzo previsto** o **Mancherebbe** (in evidenza di attenzione).
- Con votazione: «Il prezzo si saprà a fine votazione».

**B1.4 · Come ti pagano**
- 4 righe con interruttore, il campo appare solo se attivo:
  - **PayPal** → nome utente o link PayPal.me
  - **Satispay** → numero di telefono
  - **Bonifico** → IBAN (validato) + intestatario
  - **Contanti** → nessun campo
- Almeno uno attivo. Nota rassicurante breve: «I soldi arrivano a te. Noi non li tocchiamo.»

**B1.5 · Chi partecipa**
- Due schede: **Lista aperta** — «Chi apre il link si aggiunge da solo.» · **Lista chiusa** — «Scrivi tu i nomi, sai chi manca.»
- Lista chiusa: area di testo «un nome per riga» con contatore.
- Nota: non chiediamo recapiti.

**B1.6 · Invita il gruppo**
- **Anteprima chat** (come apparirà su WhatsApp).
- **Blocco condivisione** (link + messaggio già scritto + Copia + Apri WhatsApp).
- Pulsante principale **«Apri la raccolta»** (→ dashboard). Nota: il link si attiva all'apertura.

#### B2 · Dashboard della raccolta `/gestisci/[slug]`

- **Scopo:** sapere a che punto si è e confermare i pagamenti. Aggiornata in tempo reale.
- **Contenuto (dall'alto, sezioni che compaiono solo se servono):**
  1. **Sommario:** titolo «Il regalo per Giulia», totale **confermato** / obiettivo con barra, quote mancanti, chip scadenza («Si chiude il 12 nov»). Se obiettivo raggiunto: avviso verde + «Chiudi e compra il regalo».
  2. **Votazione** (solo se in corso): tempo rimanente, classifica provvisoria con media stelle, aggiungi/togli idee, «Chiudi adesso», «Prolunga di 24 ore».
  3. **Da confermare** (solo se c'è qualcuno): righe con nome, metodo, importo, causale + **«Confermo»** / «Non l'ho trovato». Sottotitolo: «Conferma quando vedi arrivare i soldi.»
  4. **Contanti da ricevere:** righe con **«Ricevuti»**.
  5. **Partecipanti:** elenco completo con chip di stato; azioni per riga (registra pagamento, segna rinuncia); campo «Aggiungi un nome»; «Chiudi le adesioni».
  6. **Promemoria:** messaggi pronti da copiare e inoltrare («Da mandare adesso» / «Da mandare domani»).
  7. **Il link:** blocco condivisione sempre a portata di mano.
  8. Link a «Chiusura» e «Dati della colletta».
- **Stati:** caricamento · nessun partecipante («Ancora nessuno. Manda il link!») · obiettivo raggiunto · raccolta scaduta · colletta chiusa · connessione persa (avviso discreto).
- **Comportamento:** azioni immediate (ottimistiche) con annulla/avviso se falliscono.

#### B3 · Chiusura `/gestisci/[slug]/chiusura`

- **Scopo:** comprare il regalo, gestire ciò che manca o avanza, chiudere.
- **Stati / schermate:**
  1. **Votazione ancora aperta:** «Prima si sceglie il regalo» → torna alla raccolta.
  2. **Mancano soldi:** cifra mancante in grande + tre schede «Come procedere»:
     - **Ci metto io la differenza**
     - **Scelgo un regalo meno costoso** (mostra prodotti del catalogo entro il raccolto)
     - **Rimando di un giorno e sollecito** (nuova scadenza + messaggio pronto)
  3. **Obiettivo raggiunto:** «Hai tutto quello che serve.» → **«Compra il regalo»** (apre Amazon), campo «Quanto hai speso? (€)», ricevuta (link o file immagine/PDF ≤ 5 MB).
  4. **Avanzo** (se positivo): tre schede «Lo tengo per biglietto e confezione» · «Lo restituisco» (mostra cifra per persona) · «Lo aggiungo come extra al regalo».
  5. Pulsante finale **«Ho comprato il regalo: chiudi la colletta»**.
  6. **Chiusa:** riepilogo **Rendiconto** (Raccolto · Speso · Avanzo + destinazione) + «Biglietto da stampare».

#### B4 · Dati della colletta `/gestisci/[slug]/dati`

- **Scopo:** statistiche semplici per l'organizzatore.
- **Contenuto:** imbuto (aperture → partecipo → nome → metodo → ho pagato → confermato) con numero di persone, % sul passaggio precedente e tempo mediano; tempo mediano fra «ho scelto come pagare» e «ho pagato». Nota: persone distinte, nessun tracciamento di terze parti.
- **Stile:** grafico a imbuto o barre orizzontali, molto leggibile. Stato vuoto «Nessuno ancora».

#### B5 · Le mie collette `/le-mie-collette`

- **Scopo:** ritrovare tutte le proprie collette.
- **Contenuto:** titolo + pulsante «Organizza un regalo»; lista di card con festeggiato, regalo (miniatura), chip di stato (**Bozza · In votazione · Aperta · Chiusa**), barra di avanzamento, scadenza. Bozza: «Riprendi» / «Elimina» e nota «Il link non funziona ancora».
- **Stati:** vuoto («Non hai ancora organizzato nessun regalo.» → Organizza) · caricamento · errore.

---

### GRUPPO C — Colletta: chi partecipa

> Vincoli assoluti: **nessuna registrazione, nessun login, nessuna email**; leggibile in meno di un secondo su telefono; **niente header, menu, catalogo**. Una pagina, un compito. Logo piccolo in alto.

#### C1 · Pagina della colletta `/c/[slug]`

È **una sola pagina** che cambia stato. Schermate da disegnare:

**C1.a · Prima schermata (colletta aperta)**
1. «**Marco** organizza» (avatar con iniziale).
2. Titolo **«Il regalo per Giulia»** + chip occasione e data.
3. Card regalo: foto, nome, prezzo.
4. **La tua quota: 10 €** — molto grande. (Quota libera: «Metti quello che vuoi · 10 € suggeriti».)
5. Barra di avanzamento: «8 persone su 12 hanno partecipato».
6. Pulsante principale **«Partecipo»**; sotto, discreto, «Non partecipo».

**C1.b · Votazione in corso**
- Chip «Votazione in corso» + tempo rimanente. «Dai da 1 a 5 stelle a ogni idea.»
- Lista di idee: foto, nome, prezzo, «Vedi sul negozio», **stelle 1–5**.
- (Se consentito) «Proponi un'idea» + campo nome. Footer con dichiarazione affiliato Amazon.
- Nota: finché si vota non si paga.

**C1.c · Il gruppo ha scelto** — card del regalo vincente + «Ora si parte con la colletta».

**C1.d · Passo 1 — Nome:** «Come ti chiami?» un solo campo («È l'unica cosa che ti chiediamo»). Con lista chiusa: «Tocca il tuo nome» (elenco di chip). Link «Hai già partecipato?» per ritrovarsi.

**C1.e · Passo 2 — Come vuoi pagare?** Solo i metodi attivati, un pulsante grande ciascuno (icona + nome + 1 riga). Quota libera: campo «Quanto metti? (€)». Alla scelta si apre il **pannello del metodo**:
- **PayPal:** pulsante «Paga 10 € con PayPal» (apre PayPal).
- **Satispay:** numero con «Copia» + «Apri Satispay e scegli Invia denaro» + causale da copiare.
- **Bonifico:** intestatario + tre righe copiabili **IBAN · Causale · Importo** + QR code (giro-code) da inquadrare con l'app della banca.
- **Contanti:** «Darai 10 € a Marco di persona.»
- Poi pulsante **«Fatto, ho pagato»**.

**C1.f · Passo 3 — Conferma (la schermata più importante):** «**Hai pagato?** Confermalo qui, così Marco non deve chiedertelo.» → **«Sì, ho pagato»** / «Non ancora, lo faccio dopo». (Quota libera: «Quanto hai dato? (€)».)

**C1.g · Passo 4 — Biglietto (facoltativo):** «Due righe per Giulia» — area di testo max 240 caratteri con contatore, «Finiranno sul biglietto firmato da tutti.» → «Salva il messaggio» / «Salta».

**C1.h · Il tuo stato (chi torna sul link)** — una card di stato al posto del flusso:
- «Hai dichiarato il pagamento» (in attesa di conferma) · «**Il tuo pagamento è confermato**» ✓ · «Hai scelto i contanti» · «Hai detto che non partecipi» (con «Partecipo» per ripensarci).
- Avanzamento aggiornato, «Modifica il tuo messaggio per il biglietto», «Cambia modo di pagare».
- In fondo, discreto: «Organizzi anche tu un regalo di gruppo?»

**C1.i · Raccolta scaduta** — avviso «La raccolta è scaduta» + avanzamento.

**C1.j · Colletta chiusa → Rendiconto** — «Regalo acquistato» ✓, card regalo, **Raccolto · Speso · Avanzo** (+ destinazione), link al biglietto collettivo, «Guarda il catalogo».

**C1.k · Colletta dimostrativa** (`/c/demo`) — come C1.a con un'etichetta «Colletta dimostrativa».

**Anteprima social:** disegnare anche l'**immagine 1200×630** che compare in WhatsApp: logo, «Il regalo per Giulia», foto del regalo, quota (in modalità sorpresa: niente regalo né nome).

#### C2 · Biglietto stampabile `/c/[slug]/biglietto`

- **Scopo:** stampare in A5 tutti i messaggi raccolti nella colletta.
- **Contenuto:** titolo «Per Giulia», i messaggi con firma in una griglia, chiusura «Con affetto, da tutti noi». Pulsante «Stampa» (nascosto in stampa).
- **Stato vuoto:** «Nessun messaggio: lo spazio resta libero per scrivere a mano.»

---

### GRUPPO D — Biglietto di auguri: organizzatore

Flusso a 4 passi con **intestazione fissa** (barra segmentata), pulsante a pillola in basso (grigio finché non valido), aiuti «?» e fumetti «i» al posto dei testi lunghi.

#### D1 · Nuovo biglietto `/biglietto/nuovo`

- **«Voglio invitare il gruppo a…»** — due schede:
  - **Firmare un biglietto** — «Ognuno aggiunge il suo messaggio.»
  - **Fare un regalo insieme e firmare il biglietto** — «Quota per il regalo + biglietto.» (→ crea colletta)
- Nota: «Il biglietto è gratis.»
- Card secondaria: «Cerchi un'idea regalo?» → catalogo.

#### D2 · Dettagli `/biglietto/[id]/dettagli` — «Cominciamo dalle basi»

- Campi: **Nome del festeggiato** · **Da parte di** (es. «I colleghi del marketing») · **A chi lo mandiamo?** (scheda «All'email del festeggiato» con campo email · scheda «A me, lo inoltro io») · **Data e ora di consegna** (calendario + ora a passi di 15 min, «Ora italiana») · **Messaggio al gruppo** (testo ricco breve) · **Nome del biglietto** (es. «Compleanno dei 30 di Nicola», crea il link: verifica disponibilità mentre si scrive).
- Card chiusa: «Vuoi anche fare un regalo di gruppo?»

#### D3 · Copertina `/biglietto/[id]/design` — «Scegli la copertina»

- Anteprima grande della copertina con titolo modificabile al tocco («Il tuo titolo qui»).
- **Galleria di modelli** con filtro per occasione (chip scorrevoli: Tutti, Compleanno, Feste…): 12 copertine (gradiente + motivo) + due speciali in testa: **«Carica immagine o GIF»** e **«Foto a tutta pagina»**.
- Caricamento immagine (finestra dedicata).

#### D4 · Anteprima e pubblica `/biglietto/[id]/anteprima` — «Ecco cosa vedrà il gruppo»

- **Carosello** delle schermate reali del firmatario (invito, firma) in sola lettura.
- «Modifica i dettagli» (apre dialogo).
- Pulsante principale **«Pubblica e condividi»**.
- **Dialogo «Accedi per continuare»** (Google) se non loggato: «Serve per gestirlo anche da un altro dispositivo.»
- **Dialogo di successo «Il tuo biglietto è pronto!»**: blocco condivisione + «Vai alla gestione».
- Stato errore: data già passata → «Cambia la data».

#### D5 · Gestione biglietto `/biglietto/[id]/gestisci`

- **Contenuto:**
  1. Chip stato: **Bozza · Aperto (si può firmare) · Consegnato**.
  2. **Firme:** contatore + elenco (nome, data, inizio del messaggio, email se lasciata).
  3. **Condividi:** blocco condivisione.
  4. **Promemoria:** messaggio pronto per chi non ha firmato + «Copia».
  5. **Consegna:** data/ora e destinatario + «Modifica i dettagli».
  6. **Il biglietto:** anteprima sfogliabile, scelta colonne 1 / 2 / 3, «Cambia la copertina».
- **Stato vuoto:** «Ancora nessuno ha firmato. Manda il link!»

---

### GRUPPO E — Biglietto di auguri: chi firma

> Nessun account, nessun menu. Esperienza emozionale: la **busta** con la copertina è protagonista.

#### E1 · Invito `/b/[slug]`

- Chip in alto a destra «5 hanno già firmato».
- Titolo grande: nome del biglietto. Messaggio dell'organizzatore al gruppo.
- **«Firma il biglietto»** (pulsante grande).
- **Busta illustrata** con la copertina che spunta.
- **Stati:** già firmato da questo dispositivo («✓ Hai già firmato» → «Modifica il tuo messaggio» / «Sono un'altra persona») · biglietto già consegnato.

#### E2 · Scrivi la firma `/b/[slug]/firma` — «Il tuo messaggio»

- **Editor** su una pagina del biglietto: area testo («Scrivi qui il tuo messaggio…»), barra formato (Grassetto, Corsivo, Sottolineato, Emoji), pannello **Stile** (Carattere: senza grazie / con grazie / scritto a mano / decorativo · Colore · Dimensione).
- Aggiungi **foto o GIF** (anteprima + «Togli»).
- «Guarda l'anteprima del biglietto».
- Pulsante **«Continua»** (o «Salva le modifiche» se già firmato).

#### E3 · I tuoi dati `/b/[slug]/i-tuoi-dati`

- Campi: **Nome** · Cognome (facoltativo) · Email (facoltativa, «per modificare da un altro dispositivo»).
- Link «Come trattiamo i dati». Pulsante **«Continua»**.

#### E4 · Grazie `/b/[slug]/grazie`

- **«Fatto! Il tuo messaggio è sul biglietto»** con animazione festosa.
- «Condividi il link con chi manca» + Copia link / WhatsApp.
- Discreto: «Vuoi organizzare anche tu un regalo di gruppo?»

---

### GRUPPO F — Servizio

#### F1 · Come trattiamo i dati `/privacy`
Pagina di testo breve in 3 blocchi con icona: **Chi firma un biglietto** · **Chi organizza** · **Soldi** («Non passano mai da noi»). Massimo 3 righe per blocco.

#### F2 · Pagina non trovata (404)
Tre varianti con illustrazione + 1 riga + 1 pulsante: generica («Pagina non trovata» → Home), colletta («Questa colletta non esiste o è stata rimossa»), biglietto («Questo biglietto non esiste»).

#### F3 · Scegli UX `/scegli-ux` (interno)
Elenco di varianti di interfaccia (UX_V1, V2, V3, **V4**) come schede scelta con nome, una riga e chip «In uso adesso». Nota: dati condivisi tra le varianti.

#### F4 · Area riservata catalogo `/backoffice/catalogo` (interno, solo desktop)
Pagina tabellare a tutta larghezza per l'admin: scelta modo di ordinamento (**Trascinamento** / **Stelle**), lista prodotti con maniglia di trascinamento, frecce ↑ ↓, «In cima», stelle 1–5, «Vedi su Amazon», **Elimina** / **Ripristina**; sezione «Eliminati (N)»; pulsante **«Salva l'ordine»** con avviso modifiche non salvate. Stato «Accesso riservato» per account non autorizzati. *Priorità bassa nel redesign.*

---

## 7. Stati trasversali da prevedere ovunque

- **Caricamento:** skeleton delle card, non spinner a pagina intera.
- **Errore di rete:** avviso discreto «Non riesco a collegarmi, riprovo da solo.»
- **Errore di salvataggio:** «Non sono riuscito a salvare. Riprova.» vicino al pulsante.
- **Conferma copia:** «Copiato!» per 1,5 s.
- **Campi non validi:** messaggio sotto il campo, 1 riga.
- **Vuoto:** icona + 1 riga + 1 azione.

## 8. Cosa NON inventare

- Nessun carrello, checkout o pagamento dentro l'app.
- Nessuna recensione, statistica o numero decorativo («+1.450 collette», «4.9/5»).
- Nessuna categoria di catalogo diversa da quelle elencate (Per chi, Tema, Tipo, Prezzo).
- Nessun login o email per partecipanti e firmatari.
- Nessun totale che conti i pagamenti solo dichiarati: la barra mostra **solo i confermati**.
