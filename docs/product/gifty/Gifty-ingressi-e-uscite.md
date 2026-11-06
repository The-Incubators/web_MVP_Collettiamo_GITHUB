# Gifty: ingressi, uscite e memoria

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
| **Ritorno da Amazon** | Chi torna deve ritrovare quello che ha aperto e comprato | Gifty non ricorda nulla del clic |
| **Visti di recente** | Ritrovare l'idea guardata ieri | Non esiste nel codice |

## 2. Uscite

Dove una persona lascia Gifty, se torna e che cosa resta. **Amazon è l'uscita che vogliamo**: è lì che Gifty guadagna la commissione di affiliazione. Il lavoro non è trattenere chi esce, ma far sì che quando torna ritrovi quello che ha guardato.

| Uscita | Da dove | Torna? | Che cosa ricorda Gifty quando torna |
|---|---|---|---|
| **Amazon** («Guarda su Amazon», «Compralo su Amazon») | tessere, scheda, `/fai-un-regalo` | Si apre in una nuova scheda: Gifty resta aperto dietro | **Niente**: non sa che cosa ha aperto su Amazon, per chi, né se l'ha comprato. Al ritorno la pagina è identica a prima |
| WhatsApp, condividi il link | fine del wizard, pagina del gruppo, biglietto | Sì: chi organizza torna sulla pagina del gruppo | Il gruppo, nell'account |
| PayPal o Satispay per la quota | pagina del gruppo di chi partecipa | Deve tornare a toccare «Ho pagato» | La sua adesione; nessun richiamo se non torna |
| Accesso: Google o link via email | wizard, «Partecipo», account | Sì: torna alla pagina di partenza | La bozza o l'adesione |
| Chiudi il wizard o l'editor | `/crea`, `/biglietto/nuovo` | Quando vuole | La bozza, solo su quel browser |
| Il festeggiato ha aperto il biglietto | `/b/[slug]` | **Finisce lì**: l'unico pulsante riapre il biglietto | Niente: nessun «Ringrazia», nessun «Crea un biglietto anche tu» |
| Biglietto firmato | `/b/[slug]` | Finisce lì | Il biglietto in «I miei biglietti» se ha firmato con l'account |
| «Provalo» della cover iPhone | scheda della cover | Sito esterno | Niente (la cover oggi non è nel catalogo) |
| Cancella l'account | `/account/cancella` | No | Tutto cancellato |

## 3. Dove manca la memoria

1. **Il ritorno da Amazon.** È la strada «Lo regalo io», quella del catalogo che piace di più. Chi torna non ritrova i prodotti che ha guardato.
2. **Il festeggiato e chi firma.** Vedono Gifty senza averlo cercato e la pagina finisce senza una porta.
3. **Chi non ha pagato.** Senza email il solo richiamo è il messaggio che chi organizza inoltra a mano.

## 4. Il ritorno da Amazon

### 4.1 Che cosa possiamo sapere (regole Amazon.it)

Fonte: [Requisiti del programma](https://programma-affiliazione.amazon.it/help/operating/policies) e [Accordo operativo](https://programma-affiliazione.amazon.it/help/operating/agreement), letti il 6 novembre 2026.

- **Amazon non ci dice chi ha comprato che cosa**: solo totali, e non si possono dare tag diversi ai singoli utenti (Requisiti 2(b)). Possiamo sapere solo due cose: **il clic su Amazon**, che è nostro, e **quello che la persona ci dice** («L'ho preso»).
- Si possono usare **ID di monitoraggio diversi per sezione** (home, domande, catalogo, `/fai-un-regalo`): così il rapporto di Amazon dice quale strada fa comprare di più. Mai uno per persona.
- La scheda nuova (`target=_blank`) va bene; vietata solo una pagina intermedia che apre Amazon da sola (Allegato Commissioni 2(e), Requisiti 6(q)), e nessun premio in cambio del clic (6(g)).
- Link Amazon nelle email solo se l'email l'ha chiesta la persona (Requisiti 4), come un promemoria che ha chiesto lei.
- **Da sistemare prima del lancio**: i prezzi si possono mostrare solo se arrivano da Creators API o PA-API (2(b)) e le immagini dei prodotti non si possono salvare (Licenza 2(h)). Gifty mostra prezzi fotografati dalle playlist e tiene 517 foto in `public/foto-prodotti/` (da verificare con Stefano se sono foto Amazon). La soluzione è l'API Creators.

### 4.2 Visti di recente (scelta di Cri, 6 novembre)

Una striscia **«Visti di recente»** in home, sopra «Le nostre scelte», e basta: gli ultimi quattro prodotti aperti, il più recente per primo, con le stesse tessere del catalogo («Fai un regalo», «Guarda su Amazon», cuore). Restano sul dispositivo. Chi non ha ancora guardato nulla non vede la striscia. Prototipo: `docs/specs/gifty-ux-v2/prototipi/memoria.html`.

Scartato da Cri il 6 novembre perché troppo complicato: la domanda «L'hai preso?» sulla scheda e in «Fai un regalo», i segni di stato sulle tessere, la pagina «I tuoi regali» e i regali per persona.

Da correggere insieme: sul telefono la striscia di «Le nostre scelte» si ferma con la prima tessera attaccata al bordo dello schermo (manca `scroll-padding-inline` in `.striscia`).

### 4.3 Cookie e consenso

- «Visti di recente» sul dispositivo, mostrato come funzione e mai mandata ad analisi o pubblicità, per il Garante è uno strumento tecnico: basta l'informativa, niente banner ([Provv. 231/2021](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)).
- Contare i clic su Amazon nelle analisi (Firebase, con Stefano a fine lavoro) è un'altra cosa e chiede il consenso al banner.
- Promemoria via email o notifica sul telefono: consenso esplicito; il soft opt-in non vale perché Gifty non vende nulla ([art. 130 c. 4](https://www.osborneclarke.com/it/insights/soft-spam-italia-stiamo-correttamente-applicando-la-norma)).

### 4.4 Ordine proposto

1. **Visti di recente** in home.
2. **ID di monitoraggio per sezione**, da creare nel pannello Amazon di Stefano.
3. **API Creators** per prezzi e foto, prima del lancio.

## 5. Le altre uscite

| Uscita | Soluzione |
|---|---|
| Il festeggiato ha aperto il biglietto | Alla fine: «Ringrazia tutti» (un messaggio sulla bacheca) e una porta discreta «Crea un biglietto per qualcun altro» |
| Chi ha firmato | Dopo la firma: «Ricordami il compleanno di Mauro» (una ricorrenza) e «Crea un biglietto anche tu» |
| Chi non ha pagato la quota | Email individuale con il servizio email (D-17, D-18), oggi solo un messaggio da inoltrare |
| Ricerca Google | `robots.txt` e `sitemap.xml` con tutte le schede prodotto; sulla scheda di un prodotto tolto, «Idee simili» invece del 404 vuoto |
