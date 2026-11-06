# Gifty: ingressi, uscite e soluzioni

_6 novembre 2026, su main `c6a35c9` più il PR 34. Ogni ingresso è stato aperto in locale (modalità memoria, senza account) il 6 novembre; le pagine pubbliche anche sul sito live. Base: `Gifty-architettura-e-flussi.md`._

## 1. Ingressi

Da dove arriva una persona, dove atterra e che cosa succede. «OK» = provato e funziona.

### 1.1 Chi non conosce Gifty

| Ingresso | Atterra su | Esito |
|---|---|---|
| Nome del sito o pubblicità | `/` | OK |
| Ricerca Google su un'idea regalo | `/prodotto/[slug]`, `/catalogo`, `/idee` | Le pagine funzionano, ma **Google non le trova bene: mancano `robots.txt` e `sitemap.xml`** (404). Stefano li aveva rimandati alla fine con le analisi. |
| Link a un prodotto tolto dal catalogo | `/prodotto/[slug]` | 404 generico: **nessuna idea simile proposta**, la persona esce |
| Link WhatsApp del regalo di gruppo | `/c/[slug]` | OK: vede festeggiato, chi organizza e il regalo prima di accedere |
| Link sbagliato o incompleto del gruppo | `/c/[slug]` | OK: «Questo regalo di gruppo non esiste» con «Vai alla home» |
| Link del biglietto da firmare | `/b/[slug]` | OK; firma senza account |
| Link del biglietto per il festeggiato | `/b/[slug]` dopo la consegna | OK |
| Link sbagliato del biglietto | `/b/[slug]`, `/b/[slug]/firma` | OK: «Non troviamo questo biglietto» |
| Indirizzo che non esiste | qualsiasi | OK: «Pagina non trovata» |

### 1.2 Chi è già dentro Gifty

| Ingresso | Atterra su | Esito |
|---|---|---|
| Menu: Idee regalo, Regalo di gruppo, Biglietto | `/idee`, `/regalo-di-gruppo`, `/biglietto` | OK |
| Tre porte della home | `/crea`, `/idee`, `/biglietto/nuovo` | OK |
| Domande: per lei / per lui → età → … | `/regalo?per=…` → `/regalo/risultati` | OK; un valore sbagliato o risposte a metà riportano al passo giusto |
| Tessera o scheda: «Fai un regalo» | `/fai-un-regalo?prodotto=…` | OK |
| «Lo regaliamo in gruppo» con prodotto | `/crea?prodotto=…` | OK: il regalo è già scelto |
| Catalogo in modo gruppo: scegli / vota | `/crea?scegli=…`, `/crea?vota=…`, `/crea?lista=1` | OK |
| Prodotto inesistente nel link del wizard | `/crea?prodotto=…` | Il wizard parte vuoto senza dirlo (accettabile) |
| Pagina del gruppo: «Prepara il biglietto» | `/biglietto/nuovo?gruppo=…` | OK: parte dal nome, occasione già scritta |
| Gruppo inesistente nel link del biglietto | `/biglietto/nuovo?gruppo=…` | Parte un biglietto da solo senza dirlo (accettabile) |
| Account, I miei regali, I miei biglietti, Il tuo gruppo, da non connessi | `/account…`, `/gestisci/[slug]` | OK: chiede l'accesso e poi torna lì |
| Accesso con un `next` esterno | `/accedi?next=https://…` | OK: il ritorno esterno è bloccato |
| Vecchio indirizzo «Le mie collette» | `/le-mie-collette` | OK: porta a I miei regali |
| Preferiti e Ricorrenze senza account | `/preferiti`, `/reminder` | OK: salvati sul dispositivo, «Accedi per ritrovarli ovunque» |
| Biglietto in bozza da un altro dispositivo | `/biglietto/[id]/gestisci` | OK: spiega che la bozza si apre solo dove è nata |

### 1.3 Ingressi che mancano

| Ingresso | Perché serve | Oggi |
|---|---|---|
| **Email** (promemoria, quota da pagare, biglietto da firmare, biglietto arrivato, ricorrenza in arrivo) | È il modo per far tornare chi è uscito | Non esiste: nessun servizio email (D-18) |
| **Notifica sul telefono** (Ricorrenze) | Ricordare la data senza email | Non esiste (`dataAvviso` pronto) |
| **Ritorno da Amazon** | La scheda di Gifty resta aperta: chi torna trova la stessa pagina, senza nulla di nuovo | Nessun riconoscimento del ritorno |
| **Visti di recente** | Ritrovare l'idea guardata ieri | Non esiste nel codice |

## 2. Uscite

Dove una persona lascia Gifty, se torna e che cosa resta.

| Uscita | Da dove | Torna? | Che cosa resta a Gifty |
|---|---|---|---|
| **Amazon** («Guarda su Amazon», «Compralo su Amazon») | tessere, scheda, `/fai-un-regalo` | Si apre in una nuova scheda: Gifty resta aperto dietro | Niente: non sappiamo che cosa ha guardato né se ha comprato; nessun motivo per tornare |
| WhatsApp, condividi il link | fine del wizard, pagina del gruppo, biglietto | Sì, è previsto: chi organizza torna sulla pagina del gruppo | Il gruppo è salvato nell'account |
| PayPal o Satispay per la quota | pagina del gruppo di chi partecipa | Deve tornare a toccare «Ho pagato» | Nessun richiamo se non torna |
| Accesso: Google o link via email | wizard, «Partecipo», account | Sì: torna alla pagina di partenza con la bozza o l'adesione | OK |
| Chiudi il wizard o l'editor | `/crea`, `/biglietto/nuovo` | La bozza resta nel browser | Persa se cambia dispositivo |
| Il festeggiato ha aperto il biglietto | `/b/[slug]` | **Finisce lì**: l'unico pulsante riapre il biglietto | Niente: nessun «Ringrazia», nessun «Crea un biglietto anche tu» |
| Biglietto firmato | `/b/[slug]` | Finisce lì | Il biglietto in «I miei biglietti» se ha firmato con l'account |
| «Provalo» della cover iPhone | scheda della cover | Sito esterno | Niente (la cover oggi non è nel catalogo) |
| Cancella l'account | `/account/cancella` | No | Tutto cancellato |

## 3. Le uscite più costose

1. **Amazon.** È l'uscita di tutta la strada «Lo regalo io», cioè della parte che piace di più (il catalogo). Dopo il clic Gifty non lascia niente.
2. **Il festeggiato e chi firma.** Sono le persone che vedono Gifty senza averlo cercato, il canale di crescita gratis, e la pagina finisce senza una porta.
3. **Chi non ha pagato.** Senza email il solo richiamo è il messaggio che chi organizza inoltra a mano.

## 4. Soluzioni per l'uscita verso Amazon

### 4.1 Che cosa non si può fare (regole Amazon.it)

Fonte: [Requisiti del programma](https://programma-affiliazione.amazon.it/help/operating/policies) e [Accordo operativo](https://programma-affiliazione.amazon.it/help/operating/agreement), letti il 6 novembre 2026.

- **Niente pagina intermedia automatica** («Stai lasciando Gifty…» che reindirizza da sola): gli acquisti non contano (Allegato Commissioni 2(e)) e aprire Amazon senza il clic della persona è vietato (Requisiti 6(q)). La scheda nuova con `target=_blank` va bene.
- **Niente premi in cambio del clic** («lasciaci l'email e ti diamo uno sconto»): vietato (6(g)). Chiedere l'email per un servizio, senza premio, si può.
- **Non sapremo mai chi ha comprato**: Amazon dà solo totali; non si possono assegnare tag ai singoli utenti (2(b)). L'unico modo di saperlo è chiederlo alla persona.
- **Link Amazon nelle email solo se richieste** dalla persona (Requisiti 4), come un promemoria che ha chiesto lei.
- **Attenzione, oggi**: si possono mostrare i prezzi solo se arrivano da Creators API o PA-API (2(b)), e le **immagini dei prodotti non si possono salvare** (Licenza 2(h)). Gifty mostra prezzi fotografati dalle playlist e tiene 517 foto dei prodotti in `public/foto-prodotti/` (da verificare con Stefano se sono foto Amazon). Va sistemato con l'API Creators prima del lancio.

### 4.2 Le opzioni

**A. Prima del clic: lasciare una traccia**

| # | Soluzione | Che cosa resta | Serve |
|---|---|---|---|
| A1 | **Visti di recente**: una fila «Li hai guardati di recente» in home, in Idee regalo e sotto la scheda | L'idea guardata ieri si ritrova in un tocco | Solo il browser. Se la lista resta sul dispositivo ed è mostrata come funzione, per il Garante è uno strumento tecnico: basta l'informativa, niente banner ([Provv. 231/2021](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)). Se va in Firestore o nelle analisi, serve il consenso. |
| A2 | **«Per chi è?»** in «Lo regalo io»: nome e data facoltativi prima di «Compralo su Amazon» | Una ricorrenza con l'idea dentro: «Marta, 12 marzo, cuffie» | Le Ricorrenze ci sono già |
| A3 | **Cuore accanto a «Compralo su Amazon»** in `/fai-un-regalo` (oggi c'è solo sulla tessera e sulla scheda) | L'idea nei Preferiti | Niente di nuovo |

**B. Al ritorno: la scheda di Gifty è ancora aperta**

| # | Soluzione | Come funziona |
|---|---|---|
| B1 | **«L'hai preso?»** quando la persona torna sulla scheda di Gifty dopo il clic verso Amazon | Un riquadro sulla stessa pagina, una volta sola. **Sì** → «Segnato come regalato a…» con due proposte: «Aggiungi un biglietto da firmare» e «Ricordami il prossimo compleanno». **Non ancora** → «Salvalo nei preferiti», «Fallo in gruppo» (stessa idea, prezzo diviso) o «Idee simili». La risposta della persona è l'unico dato sull'acquisto che possiamo avere, e non viola le regole perché non c'è premio. |
| B2 | **«Fallo in gruppo»** quando il prezzo è alto | Chi è uscito per un regalo da 120 € trova la quota a testa: «Con 8 persone sono 15 € a testa» |

**C. Dopo: un motivo per tornare**

| # | Soluzione | Serve |
|---|---|---|
| C1 | **Promemoria della ricorrenza** una settimana prima, con tre idee | Servizio email e consenso esplicito; il soft opt-in non vale perché Gifty non vende nulla ([art. 130 c. 4](https://www.osborneclarke.com/it/insights/soft-spam-italia-stiamo-correttamente-applicando-la-norma)) |
| C2 | **Notifica sul telefono** per la stessa ricorrenza | Permesso del browser chiesto dopo che la persona salva una ricorrenza |
| C3 | **«Che cosa le hai regalato»**: nell'account, i regali segnati con B1 per persona | Così l'anno dopo non regala la stessa cosa |
| C4 | **Avviso di calo del prezzo** su un preferito | API Creators (prezzi veri); dopo il lancio |

### 4.3 Raccomandazione

Prima **A1, A2 e B1**: funzionano senza email né account, usano pagine che esistono già (Ricorrenze, Preferiti, wizard) e trasformano l'uscita verso Amazon in un «L'hai preso?» che porta al biglietto o al regalo di gruppo. Poi **C1 e C2** quando c'è il servizio email (serve anche al Reminder del regalo di gruppo). **C4** dopo l'API Creators, che va fatta comunque per i prezzi e le foto.

## 5. Le altre uscite

| Uscita | Soluzione |
|---|---|
| Il festeggiato ha aperto il biglietto | Alla fine: «Ringrazia tutti» (un messaggio sulla bacheca) e una porta discreta «Crea un biglietto per qualcun altro» |
| Chi ha firmato | Dopo la firma: «Ricordami il compleanno di Mauro» (una ricorrenza) e «Crea un biglietto anche tu» |
| Chi non ha pagato la quota | Email individuale con il servizio email (D-17, D-18), oggi solo un messaggio da inoltrare |
| Ricerca Google | `robots.txt` e `sitemap.xml` con tutte le schede prodotto; sulla scheda di un prodotto tolto, «Idee simili» invece del 404 vuoto |
