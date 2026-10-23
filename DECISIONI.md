# DECISIONI

Scelte prese dove la specifica taceva, punti «da verificare» con il ripiego implementato, limiti noti.
Ordine: prima ciò che serve sapere subito, poi le scelte per area.

## 1. Da sapere subito

**Che cosa è stato verificato e che cosa no.**

- Verificato: 40 test unitari sul dominio; 35 test sugli emulatori (26 sulle regole di sicurezza, 9 sull'adattatore Firestore reale con le regole vere); build e lint puliti; giro completo nel browser (Chromium desktop con viewport da telefono) sia in modalità memoria sia contro gli emulatori di Firestore e Auth; nessuno scorrimento orizzontale a 320 px su tutte le pagine pubbliche e sul wizard; prima schermata di `/c/[slug]` in circa 0,7 s con rete «Fast 3G» e CPU rallentata 4× (build di produzione, in locale).
- **Non verificato**: nessun progetto Firebase reale (solo emulatori), quindi l'invio del collegamento email, il login Google, Storage e le credenziali dell'Admin SDK non sono mai stati esercitati davvero. Nessuna prova su un telefono vero, nessuna anteprima vista in WhatsApp, Telegram o Slack (si è verificato solo che i metadati Open Graph e l'immagine 1200×630 siano corretti). Il criterio 1 (quattro minuti dal catalogo alla colletta aperta) e il giro sul telefono della sezione 21 vanno fatti da una persona: le esitazioni, quelle vere, le può annotare solo chi lo prova.
- La dashboard di chi organizza **non è stata provata in modalità Firestore dal browser** (l'accesso via email richiede un progetto reale); il suo codice è lo stesso della modalità memoria, che invece è stata percorsa per intero, e le sue scritture sono coperte dal test sull'adattatore.

**Avvertenza di sicurezza (richiesta dalla specifica, sezione 6).** Chi conosce lo slug legge anche l'IBAN, il numero Satispay e l'handle PayPal di chi organizza (sono nel documento della colletta). È accettabile per un prototipo perché lo slug è ad alta entropia (10 caratteri su 31 simboli, ≈ 49,5 bit, da generatore crittografico) e lo stesso dato oggi finisce in chiaro in una chat di gruppo. In produzione quei campi andranno dietro una funzione server con limitazione di frequenza. **Non risolto, come richiesto.**

**Un'altra conseguenza delle regole della sezione 6**, da conoscere: tutti i documenti dei partecipanti sono leggibili da chiunque sia autenticato (anche in anonimo) e abbia lo slug. Con la quota **libera** l'importo scelto da ciascuno è quindi leggibile a livello di database da un altro partecipante che sappia dove guardare. L'interfaccia non lo mostra mai e le righe consegnate dal server alla pagina pubblica non lo contengono, ma il vincolo «mai agli altri partecipanti» non è garantito dal database. Stesso rimedio: funzione server.

## 2. Stack e versioni

- Versioni fissate esatte, su linee mature e non sulle ultimissime uscite: Next 15.5.27, React 19.1.9, Tailwind **3.4**.19 (serve `tailwind.config.ts`, come da specifica), Firebase 12.19.0, firebase-admin 13.10.0, Vitest 3.2.7, TypeScript 5.9.3, ESLint 9. pnpm 10.34.7 via `packageManager`.
- `pnpm lint` lancia `eslint .` e non `next lint`, che in Next 15.5 è deprecato e stampa avvisi.
- I font arrivano da `next/font/google`: al build serve la rete.
- Il QR del bonifico usa `qrcode` (libreria locale, nessuna chiamata a servizi esterni) e viene disegnato come SVG a partire dai moduli, senza `innerHTML`.

## 3. Architettura dei dati

- **Due adattatori, scelti dal server.** `modalitaDati()` sceglie `firestore` solo se *tutte* le variabili client e *tutte* quelle Admin sono valorizzate; il layout passa la scelta al client, così server e browser non possono divergere.
- **Memoria.** Vive nel processo del server; il browser lo raggiunge con `POST /api/memoria` (ponte che esiste solo in modalità memoria) e simula il tempo reale con un sondaggio ogni 1,5 s. Ne segue che su un deploy serverless (Vercel) senza Firebase i dati si perderebbero fra un'istanza e l'altra: è uno strumento per provare in locale, non una modalità di produzione. L'identità in questa modalità è dichiarata dal client e i controlli (solo l'organizzatore conferma, nessuno elenca le collette altrui) sono dimostrativi, non sicurezza.
- **Istanti.** Nei tipi applicativi sono millisecondi; gli adattatori Firestore convertono da e verso `Timestamp`. I nomi dei campi sono quelli della sezione 5. La data del regalo è salvata alle 12:00 italiane per non slittare di giorno.
- **Un solo codice per le transizioni.** Ogni cambio di stato è la funzione pura `eseguiOperazione` (`lib/dominio/operazioni.ts`), eseguita dentro una transazione Firestore o un blocco sincrono in memoria, insieme all'aggiornamento dei totali (10.7). La stessa funzione serve per le azioni ottimistiche della dashboard e per la modalità dimostrativa.
- **Estensioni allo schema** (campi in più rispetto alla sezione 5): `nAderenti` sulla colletta (partecipanti con stato aderito, dichiarato o confermato: serve alla quota «divisa» senza leggere la sottocollezione) e `nota` sulla riga del partecipante (il «con nota» di «Non l'ho trovato»; la persona la vede e sa che deve ricontrollare).
- **`importoCent` sulla riga.** La specifica lo vuole compilato solo con la quota libera. Qui contiene sempre l'importo che la persona ha visto e dichiarato, e alla conferma diventa l'importo confermato (anche corretto da chi organizza): serve per togliere la cifra giusta dal totale se poi la riga viene tolta o rinuncia. Il totale conta solo i confermati, come richiesto.

## 4. Regole di sicurezza: dove si discostano dalla sezione 6

Il testo della specifica è stato riportato e poi stretto. Tutte le modifiche sono coperte da `tests/regole/regole.test.ts`.

1. **Contatori.** Con la sola regola della specifica, chi partecipa non potrebbe aggiornare `nAttesi` sulla colletta (solo l'organizzatore la scrive), ma 10.7 vuole i totali aggiornati nella stessa transazione. Ho aggiunto: un autenticato può aggiornare **solo** `nAttesi`, `nAderenti` e `aggiornatoIl`, di al più una unità, su una colletta aperta. Il totale confermato, `nConfermati` e la quota restano solo di chi organizza. Limite: chi partecipa potrebbe falsare quei due contatori (di una unità per volta).
2. **Eliminazione.** La specifica ha `delete: false` ma 9.10 vuole che le bozze si possano eliminare: ora si eliminano solo le bozze, solo da chi le ha create.
3. **Riga del partecipante.** Gli aggiornamenti sono limitati ai campi che gli spettano (`affectedKeys`), e una riga già confermata non si cambia più (altrimenti un confermato potrebbe mettersi «rinunciato» senza che i totali si muovano). Quindi: non può toccare `solleciti`, `nota`, `confermatoIl`.
4. **Rivendicare un nome** (liste chiuse): chi sceglie il proprio nome in un elenco aggiorna una riga `invitato` senza proprietario, cambiando solo `uidAnonimo` e portando lo stato ad `aderito`.
5. **«Hai già partecipato? Continua con il tuo nome»**: la specifica chiede di cercare per nome e, trovata la corrispondenza, di riprendere la riga. Con le regole originali non sarebbe possibile (la riga appartiene all'uid vecchio). Ora chi conosce il nome può **cambiare solo il proprietario** della riga, senza toccarne lo stato. Rischio accettato: un membro del gruppo con cattive intenzioni potrebbe prendere il posto di un altro (non può confermare niente; può solo, poi, dichiarare o rinunciare al suo posto).
6. **Colletta `demo`** in sola lettura per i partecipanti; **eventi** con tipo valido e `uidAnonimo` proprio (o dell'organizzatore); **creazione** solo come bozza.
7. **Lista chiusa non imposta dalle regole.** Che con la lista chiusa si possa aderire solo scegliendo un nome è imposto dal codice di dominio e dall'interfaccia, non dalle regole: un client malevolo con lo slug potrebbe crearsi una riga comunque.

## 5. Regole di dominio: scelte dove la specifica taceva

- **Quota «divisa».** Il divisore è `max(aderenti, previsti)` e l'arrotondamento è al centesimo **per eccesso**. Altrimenti il primo che aderisce vedrebbe il prezzo intero. Il pulsante **«Chiudi le adesioni»** (dashboard) congela la quota sul prezzo diviso per chi ha davvero aderito e impedisce nuove adesioni. La quota si congela anche alla prima conferma, in ogni modalità (10.3).
- **Restituzione dell'avanzo**: in parti uguali, per difetto (4 € su 12 persone → 0,33 € a testa, come nel criterio 12). I centesimi che avanzano restano a chi organizza.
- **«N persone su M hanno già partecipato»**: N conta i **confermati** (per non gonfiare la barra con autodichiarazioni, 10.6), M è il maggiore fra i previsti e gli attesi. Chi ha dichiarato vede però il proprio stato nella sua schermata.
- **Scadenza.** Se cade oggi o prima, la data non è compatibile e il wizard non lascia proseguire; propone `oggi + consegna + 2`. «Rimando di un giorno» sposta la scadenza di un giorno alle 20:00 italiane.
- **Causale.** Concatena tutte le lettere (`Anna Maria` → `ANNAMARIA`, massimo 10); in omonimia si aggiunge un numero. In caso di due omonimi che aderiscono nello stesso istante potrebbero ricevere la stessa causale (il controllo avviene prima della transazione, perché Firestore lato web non permette query in transazione).
- **Doppia dichiarazione**: una riga per uid, la seconda aggiorna e non ripete l'evento.
- **Contanti**: il partecipante non «dichiara», sceglie i contanti e la riga resta `aderito`; compare nella coda «Contanti da ricevere» e «Ricevuti» la porta a confermato.
- **Sorpresa.** Oltre al titolo neutro, anche la **descrizione** e l'immagine dell'anteprima non nominano il regalo né il festeggiato (la specifica prevedeva solo il titolo neutro): chi vede l'anteprima per sbaglio non deve poter dedurre il regalo. La pagina vera, per chi ha il link, mostra tutto.
- **Chi organizza partecipa anche lui**: se è autenticato sulla pagina pubblica usa la sua identità; le operazioni sono quelle del partecipante.
- **Lista chiusa:** chi non è nell'elenco legge «chiedi a <organizzatore> di aggiungerti»; chi organizza può aggiungere un nome dalla dashboard. «Non partecipo» senza nome registra solo l'evento `rinuncia`, senza riga.
- **Eventi.** L'imbuto conta **persone distinte** (uid), non clic. `apertura` si registra una volta per apertura della pagina da parte di una persona. `sollecito_preparato` si scrive quando chi organizza copia o apre WhatsApp su un promemoria (una sola volta per promemoria e per sessione) e incrementa `solleciti` sulle righe nominate che ne sono destinatarie.

## 6. Pagamenti: punti «da verificare» e ripiego

| Punto | Che cosa ho implementato | Stato |
|---|---|---|
| PayPal: il formato `paypal.me/<handle>/<importo>EUR` funziona con l'handle fornito? | Il pulsante apre il link con importo; sotto, sempre, il link al profilo senza importo e la cifra scritta grande. | **Da verificare** con un account reale. |
| Satispay: esiste un link pubblico con importo? | Non l'ho inventato: numero con pulsante di copia, due righe di istruzioni, importo scritto grande. | **Da verificare**; ripiego attivo. |
| Bonifico: QR giro-code EPC069-12 | Payload EPC versione 002 (UTF-8, SCT, BIC vuoto, causale nel campo libero), generato in locale e nascosto sotto «Oppure inquadra il codice». I tre pulsanti di copia (IBAN, causale, importo) funzionano da soli. Il pannello avvisa che il QR è da verificare. | **Da verificare su app bancarie italiane reali.** |

Copia negli appunti: `navigator.clipboard.writeText` nel gestore del click, con ripiego sulla selezione del testo; conferma «Copiato» per 1,5 s.

## 7. Promemoria

- Il servizio prepara, chi organizza inoltra: i quattro testi con copia e WhatsApp, ognuno con il momento in cui diventa opportuno. Mai più di quattro messaggi per persona (`solleciti` sulla riga; il testo non viene proposto se tutti i destinatari noti sono a quota), nessun tono di rimprovero, nessun nome, sempre il link. Con la lista aperta non si sa chi non ha aperto il link: il testo è per il gruppo e il numero di destinatari non è mostrato.
- Il promemoria «alla scadenza» è una scheda nella dashboard («Aspetta un giorno / Procedi lo stesso / Sollecita ancora»).
- **Cloud Function** in `functions/` (pianificata, ogni giorno alle 9:00 italiane): scrive l'evento `sollecito_preparato` per ogni momento maturo, con id stabile `<slug>_<momento>`, così rilanciarla non duplica. **Non è nel `firebase.json` e non è attiva**: richiede il piano a consumo (Blaze). Per attivarla: aggiungere a `firebase.json` `"functions": [{ "source": "functions", "codebase": "default" }]`, passare il progetto a Blaze e lanciare `cd functions && npm install && npm run build && pnpm exec firebase deploy --only functions`. Compila (`tsc`) ma non è mai stata eseguita; le regole di calendario ripetono quelle di `lib/dominio/promemoria.ts`.

## 8. Interfaccia

- Il wizard riparte dove era (`sessionStorage`); la bozza nasce su Firestore al passaggio dal passo 2 al 3 e si riscrive a ogni passo; le righe `invitato` della lista chiusa vengono create al passo 5 (e rifatte se si torna a cambiare i nomi, finché è bozza). `/crea?prodotto=…` parte direttamente dal passo 2.
- Il passo 1 con link incollato non fa scraping: modulo a mano con l'avviso richiesto.
- «Scelgo un regalo meno costoso» (chiusura) **cambia davvero il regalo** della colletta con un prodotto del catalogo che costi al massimo il raccolto. È l'unico caso in cui il prodotto cambia dopo la creazione; il prezzo non si modifica mai (fuori perimetro).
- Ricevuta: campo per il link sempre disponibile; il caricamento del file (max 5 MB, immagine o PDF) compare solo se `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` è valorizzato. Regole in `storage.rules`.
- Contrasto: il colore `--gold` su sfondo chiaro non raggiunge 4,5:1 (3,7–4,2) e `--ok` su `--ok-field` arriva a 4,34. Non sono usati per testo piccolo: gli errori sono in `--ink` con un simbolo ⚠ in oro, le etichette di stato in `--ink`. Tutte le altre coppie di token superano AA in entrambi i temi (calcolato).
- Il focus passa all'intestazione a ogni cambio di passo (wizard e flusso del partecipante); ogni controllo ha etichetta; le immagini hanno testo alternativo; l'area toccabile minima è 44 px.
- `/c/[slug]/biglietto` è pubblica (come il rendiconto): chiunque abbia il link la vede. Si stampa in A5 e nasconde tutti gli elementi dell'interfaccia.
- Il banner «Firebase non è configurato» compare in alto su tutte le pagine, anche sulla pagina del partecipante, finché si è in modalità memoria.

## 9. Limiti noti e fuori perimetro

- Prezzo cambiato dopo la creazione, co-organizzatori e perdita dell'accesso di chi organizza: fuori perimetro, come indicato.
- Nessuna notifica a chi organizza (la dashboard si aggiorna in tempo reale ma non avvisa).
- «Hai già partecipato?» cerca per nome esatto (senza maiuscole e accenti). Con nomi uguali di persone diverse propone entrambe e chiede conferma.
- Se due persone usano lo stesso browser (stesso localStorage) sono la stessa persona.
- Il funnel conta le aperture dall'avvio della pagina con identità nota: una persona che apre il link e chiude prima dell'accesso anonimo non viene contata.
- L'emulatore di Firestore richiede Java; sul computer di sviluppo non c'era e per i test ho usato un JRE Temurin 21 scaricato in `~/.local/jre-download` (fuori dal progetto).

## 10. Pubblicazione (Firebase App Hosting)

- **Dove:** progetto `users-database-e7ac6`, **condiviso con altre app attive** (stare-bene, two-lives, …). Scelta esplicita di Stefano di restare su quel progetto accettando il rischio. Backend App Hosting `colletta`, regione `europe-west4`: <https://colletta--users-database-e7ac6.europe-west4.hosted.app>. Deploy da sorgente locale: `pnpm exec firebase deploy --only apphosting --project users-database-e7ac6` (configurazione in `apphosting.yaml` e `firebase.json`).
- **Database dedicato.** Per non toccare le regole e i dati delle altre app, Colletta usa un database Firestore **`colletta`** (eur3), non `(default)`. Il database si sceglie con `NEXT_PUBLIC_FIRESTORE_DATABASE` (vuoto = `(default)`). `firebase.json` pubblica regole e indici **solo** su `colletta`; la configurazione per gli emulatori (database default) è in `firebase.test.json`.
- **Storage non usato.** Il bucket del progetto è condiviso e le regole di `storage.rules` lo sovrascriverebbero: non è nel `firebase.json` e la variabile del bucket non è impostata, quindi nelle ricevute resta il solo campo per il link.
- **Credenziali server.** Su App Hosting l'Admin SDK usa le credenziali di ambiente (`FIREBASE_ADMIN_ADC=true`), nessuna chiave da custodire. In locale servono ancora le `FIREBASE_ADMIN_*` (o ADC).
- **Seed.** Catalogo e colletta demo sono stati scritti nel database `colletta` con la sessione già autenticata della CLI Firebase (script una tantum, non incluso: `pnpm seed` e `pnpm seed:demo` restano il modo normale, con chiave di servizio o ADC).
- **Il progetto condiviso e Authentication (limite aperto).** L'accesso anonimo e il collegamento via email sono impostazioni **dell'intero progetto**: attivarli rende «autenticato» anche chi apre un link di Colletta anche per le altre app. Se le regole di quelle app controllano solo `request.auth != null`, potrebbero concedergli accesso. Non ho potuto leggere le loro regole. Rischio accettato da Stefano; il rimedio vero è un progetto Firebase separato.
- Alla pubblicazione la CLI mi ha restituito la configurazione di Authentication del progetto, che include il parametro di hash delle password usato per importare utenti: è comparso nell'output del terminale di questa sessione. Non è stato salvato in nessun file.

## 11. Votazione del regalo (funzione aggiunta dopo la prima consegna)

La specifica originale la escludeva («prevista, ma non in questa versione»); è stata aggiunta su richiesta.

**Come funziona.** Al passo 1 del wizard chi organizza sceglie «Lo sceglie il gruppo»: compone una lista di almeno due regali (dal catalogo o da link), imposta la durata in ore (1–336, preset 12/24/48/72) e decide se chi partecipa può proporne altri (massimo 3 a testa). La votazione parte quando si apre la raccolta. Chi apre il link vede tutte le idee e dà da 1 a 5 stelle a ciascuna (si può cambiare voto fino alla chiusura), può proporne di nuove e togliere le proprie. A tempo scaduto la più votata diventa il regalo della colletta e la pagina passa al flusso normale (partecipo → pago → dichiaro).

**Modello dati (estensioni).** `votazione` sul documento della colletta (`durataOre`, `consentiProposte`, `apertaIl`, `scade`, `chiusa`, `chiusaIl`, `propostaVincenteId`; `null` = regalo scelto da chi organizza); sottocollezioni `proposte/{id}` (regalo, autore, `daOrganizzatore`) e `voti/{uid}__{propostaId}` (stelle 1–5: un documento per persona e proposta, quindi nessuna contesa fra chi vota insieme). Regole in `firestore.rules` e testate: si vota e si propone solo a votazione aperta e non scaduta (orario del server), solo a proprio nome, stelle intere da 1 a 5; le proposte non si modificano; i voti li cancella solo chi organizza.

**Scelte dove la richiesta taceva.**
- **Vincitore:** media di stelle più alta; a parità, più voti; a parità ancora, la proposta inserita prima. Con zero voti vince la prima proposta. Si usa la media semplice (non una media pesata): una proposta con un solo voto da 5 stelle batte una con dieci voti da 4,8. Chi partecipa non vede le medie finché la votazione è aperta (per non influenzare); chi organizza vede una classifica provvisoria.
- **Durante il voto non si paga:** adesioni e pagamenti sono sospesi (lo impone il dominio) finché non c'è un regalo. Chi ha votato deve tornare sul link a votazione chiusa per partecipare: il messaggio «Il regalo è deciso…» è già scritto nella dashboard.
- **Prezzo e quota:** finché si vota il regalo è un segnaposto (prezzo medio, consegna massima dei candidati). Alla chiusura la quota si ricalcola sul prezzo del vincitore (fissa e libera: prezzo ÷ persone previste arrotondato all'euro; divisa: al centesimo) e la scadenza della raccolta sulla sua consegna (se non resta tempo, la raccolta dura un giorno). Per questo con il voto la «quota fissa» non si digita: si calcola alla chiusura e poi non cambia.
- **Vincolo di date:** la votazione deve finire prima della scadenza della raccolta calcolata sul regalo con la consegna più lunga; altrimenti il wizard non prosegue.
- **Chiusura a tempo senza processo pianificato.** Non c'è un cron (la Cloud Function resta inattiva). La chiusura la esegue il **server** (`POST /api/votazione/chiudi`, Admin SDK, in transazione e idempotente) quando qualcuno è sulla pagina allo scadere (timer nel browser, di chi partecipa o di chi organizza) o apre `/c/[slug]` dopo la scadenza (la pagina server la esegue prima di rendere). L'esito dipende solo da voti e orologio: ripetere la chiamata non cambia nulla. Se nessuno apre la pagina, la votazione resta formalmente «aperta» ma i voti sono già bloccati dalle regole; si chiude alla prima visita. Chi organizza può anche chiuderla subito o prolungarla di 24 ore.
- **Proposte moderate da chi organizza:** può togliere qualsiasi proposta (e con lei i voti).
- **Limiti noti:** il tetto di tre proposte a testa è imposto dal codice dell'adattatore e non dalle regole; il voto non è anonimo a livello di database (i documenti in `voti` sono leggibili da chi ha il link); chi ha l'identità anonima su un altro dispositivo vota di nuovo come persona diversa.

**Lista dei regali e «+» (aggiunta successiva).** Ogni riquadro del catalogo ha un «+» in alto a destra («Aggiungi alla lista dei regali» al passaggio del mouse; diventa ✓ se il regalo è già in lista e si toglie ritoccandolo). La lista vive nel browser (`localStorage`, con ripiego in memoria) e una barra in basso la mostra: con almeno due regali, «Fai votare il gruppo» apre il wizard con la votazione già attiva e quei regali come candidati (la lista si svuota quando il wizard la prende). Anche dentro il wizard il «+» sulle schede del catalogo funziona in ogni momento: nella colletta «semplice» passa alla votazione e il regalo già scelto diventa il primo della lista; scegliere «Lo sceglie il gruppo» con un regalo già scelto fa lo stesso. Da «Regalalo in gruppo» (catalogo e scheda prodotto) il wizard parte ora dal passo 1, così la scelta fra «Lo scelgo io» e «Lo sceglie il gruppo» è sempre visibile (prima si saltava al passo 2). La lista non è condivisa fra dispositivi.

## 12. Catalogo reale (30 prodotti di Amazon.it)

Il catalogo finto della specifica (24 prodotti con marchi inventati) è sostituito dai **30 prodotti reali** di `catalogo_amazon_prototipo/` (file Excel più foto), su richiesta.

- **Importazione ripetibile:** `python3 scripts/importa_catalogo.py` (solo libreria standard) legge l'Excel, **valida** i dati (ID `PRD-nnn` e ASIN univoci, link solo `https://www.amazon.it/dp/<ASIN>`, prezzo plausibile, immagine esistente e dentro `immagini/`), scrive `lib/dati/catalogo-amazon.json` e copia le foto in `public/foto-prodotti/`. Il contenuto del file è trattato come non fidato. `pnpm seed` porta poi il catalogo su Firestore e **toglie i prodotti che non ne fanno più parte** (quelli finti).
- **Foto:** si mostrano intere su fondo bianco in un riquadro 4:3 (le proporzioni vanno da molto verticali a quasi quadrate), servite dall'app stessa (nessun collegamento a immagini remote di Amazon). Dove manca la foto resta l'illustrazione deterministica (prodotti da link incollato).
- **Filtri:** il file non ha le occasioni né le nostre otto categorie, ma flag per Uomo/Donna e Viaggio/Tecnologia/Arredamento (un prodotto può stare in più gruppi). La pagina ha quindi tre filtri: **Per chi** (Uomo, Donna), **Tema** (Viaggio, Tecnologia, Arredamento), **Prezzo** (si offrono solo le fasce che contengono qualcosa: ora non c'è nulla sopra 150 €). Il campo `occasioni` resta vuoto; la `categoria` interna (otto icone) serve solo all'illustrazione di ripiego.
- **Consegna:** il file **non** dà i tempi. Si usa una stima di **3 giorni** per tutti (`CONSEGNA_STIMATA_GIORNI`) per calcolare la scadenza della raccolta, ed è indicata come «stimata» nell'interfaccia. Da correggere quando ci saranno dati veri.
- **Prezzi e disponibilità** sono quelli rilevati il **14 ottobre 2026**: l'interfaccia lo dice nel catalogo e sulla scheda prodotto. Il prezzo di una colletta resta fisso alla creazione (invariato). Il link «Vedi su Amazon.it» è quello del file (nessun codice affiliato), si apre in una scheda nuova con `rel="nofollow noopener"`.
- **Da verificare — diritti sulle immagini.** Le foto sono di Amazon: il `LEGGIMI` del pacchetto avverte di verificare le condizioni d'uso **prima di usarle su un sito pubblico**. Il sito è già pubblico su un indirizzo `*.hosted.app`: finché la verifica non è fatta conviene non diffondere il link o tornare alle illustrazioni (basta togliere `foto` da `catalogo-dati.ts`).
- La colletta dimostrativa `/c/demo` ora usa l'appendiabiti cactus (PRD-028, 116,65 €).

## 13. Preferiti

- **Dove si trovano:** un cuore in alto a destra sull'immagine di ogni scheda del catalogo, il link **Preferiti** nel menu (con il numero) e la pagina `/preferiti`. Il «+» della lista dei regali è ora in fondo alla scheda, a tutta larghezza, con la scritta «Aggiungi alla lista regali» («Nella lista regali» quando c'è già; si tocca per toglierlo).
- **Dove sono salvati:** chi ha un account (chi organizza) li ha su Firestore, in `/utenti/{uid}/preferiti/{slug del prodotto}`: li ritrova su ogni dispositivo. Chi non ha un account (chi partecipa, o chi visita il catalogo) li ha **nel browser** (`localStorage`, chiave `colletta.preferiti`, mai un errore se non è disponibile). Quando si accede, quelli del browser passano all'account e il browser si svuota. In modalità senza Firebase l'account è finto e i preferiti vivono nel processo del server.
- **Perché non per tutti su Firestore:** chi partecipa a una colletta non ha un account (requisito fondante: nessuna registrazione) e il catalogo è pubblico; un'identità anonima di Firebase cambia a ogni dispositivo e non avrebbe senso come «utente» dei preferiti.
- **Regole:** `utenti/{uid}/preferiti/{prodotto}` leggibile e scrivibile solo dal proprietario; il documento contiene solo la data (impostata dal server). Testate (3 test sulle regole, 1 sull'adattatore). **Le nuove regole vanno pubblicate** sul database `colletta` perché i preferiti con account funzionino online.
- **Limiti noti:** si salva solo lo slug; se un prodotto esce dal catalogo sparisce dalla pagina senza avvisi. Il tetto di 200 preferiti da ospite è nel codice. Il cuore è verde (colore d'accento): la palette non prevede il rosso per le azioni positive.

**Aggiunta del 15 ottobre: secondo pacchetto (PRD-031…080).** La cartella `catalogo_amazon_150_300_50_prodotti/` (50 prodotti da 150 a 300 €, rilevati il 15 ottobre 2026) è integrata con il catalogo esistente: ora i prodotti sono **80**. L'importatore legge un elenco di cartelle (`SORGENTI` in `scripts/importa_catalogo.py`): per aggiungerne altre basta metterle accanto e aggiungerle a quell'elenco. Controlli nuovi: ID, ASIN e nomi devono essere univoci **in tutto il catalogo** (non solo per file), e i file immagine devono essere davvero del formato dichiarato (si controlla l'intestazione) e sotto i 2 MB. Ogni prodotto porta ora `rilevatoIl` (la data di rilevazione del prezzo, dall'Excel): la scheda prodotto scrive «Prezzo rilevato… il 15 ottobre 2026», la pagina del catalogo «14 e 15 ottobre 2026». Con i nuovi prodotti compare la fascia di prezzo «Oltre 150 €» (50 prodotti). Valgono le stesse avvertenze: consegna stimata di 3 giorni (non è nel file) e diritti sulle foto da verificare. **Firestore e il sito pubblicato non sono ancora aggiornati**: servono `pnpm seed` (o lo script con la sessione della CLI) e il deploy.

## 14. Area riservata: ordine del catalogo

- **Indirizzo:** `/backoffice/catalogo`. Non c'è nessun collegamento nel sito (verificato: home e catalogo non lo contengono), ha `noindex` e intestazioni `X-Robots-Tag` e `Cache-Control: no-store`, e non sta in `robots.txt` (che lo renderebbe pubblico).
- **L'indirizzo nascosto non è la protezione.** Chi lo conosce vede solo il modulo di accesso. Il server controlla a **ogni richiesta** (`/api/admin/catalogo`, lettura e scrittura) il token di accesso Firebase: email **verificata**, non un accesso anonimo, e compresa nell'elenco `ADMIN_EMAILS` (variabile d'ambiente, email separate da virgola). Elenco vuoto = nessuno entra. Su App Hosting `ADMIN_EMAILS` è in `apphosting.yaml` (ora: l'email di Stefano); per aggiungere persone si modifica lì e si ripubblica. Un account non autorizzato vede solo «Accesso riservato». Nessuna limitazione di frequenza sulle richieste (prototipo).
- **Come si accede:** come chi organizza (link via email o Google) dalla pagina `/accedi`, che parte da sola aprendo l'indirizzo. In locale senza Firebase l'accesso è finto e conta l'email dichiarata: serve `ADMIN_EMAILS` anche lì (solo per le prove).
- **Due modi di ordinare**, a scelta nella pagina: **Trascinamento** (l'ordine è quello della lista; si trascina una riga oppure si usano le frecce ↑ ↓ e «In cima», che funzionano anche da tastiera e da telefono, dove il trascinamento non c'è) e **Stelle** (da 1 a 5 per ogni prodotto: prima le stelle più alte; senza voto un prodotto vale 3, quindi 4–5 salgono e 1–2 scendono; a parità conta la posizione nella lista del trascinamento). In modalità Stelle le frecce sono nascoste: si cambia l'ordine di parità tornando a «Trascinamento».
- **Come lo usa il sito:** al salvataggio il server scrive su ogni prodotto un campo `posizione` (1 = in cima), senza toccare il resto del prodotto, e salva le impostazioni (modo, lista, stelle, chi e quando) in `/impostazioni/catalogo`. Il catalogo, i filtri, la pagina Preferiti, il wizard e «scelgo un regalo meno costoso» ordinano tutti per `posizione`: l'ordine vale quindi anche **dopo i filtri**, nel senso che chi filtra vede i prodotti rimasti nell'ordine globale. I prodotti senza posizione (aggiunti dopo l'ultimo salvataggio) vanno in coda, per prezzo. Senza nessun salvataggio il sito ordina per prezzo, come prima. «Ripristina per prezzo» azzera lista e stelle.
- **Sicurezza dei dati:** `/impostazioni` non ha nessuna regola, quindi il browser non può né leggerla né scriverla (solo il server con l'Admin SDK); è coperto da un test. Chi apre la pagina non vede nulla finché il server non conferma l'email. `pnpm seed` ora usa `merge`, così riscrivere il catalogo non cancella le posizioni; lo script una tantum con la sessione della CLI usato per le pubblicazioni **le sovrascrive** (va corretto prima di riusarlo).
- **Limiti noti:** nessun salvataggio automatico (c'è un avviso se si lascia la pagina con modifiche); due persone che modificano insieme si sovrascrivono (vince l'ultimo salvataggio); una scheda è una sola posizione globale, non una per filtro.

**Aggiunta del 15 ottobre: terzo pacchetto, arredamento e design (PRD-081…130).** La cartella `catalogo_amazon_arredamento/` (50 prodotti da 152 a 291 €, rilevati il 15 ottobre 2026) è nell'elenco `SORGENTI` dell'importatore: il catalogo ha ora **130 prodotti**. Novità:
- **Sottocategoria** (colonna facoltativa del file): lampade da tavolo, lampade scenografiche, vasi e centrotavola, tavolini e contenitori, sedie e poltroncine, specchi, arte da parete, appendiabiti. Compare nel menu «Filtra» come gruppo **«Tipo (arredamento e design)»** (solo se esistono sottocategorie; una chiave non valida nell'indirizzo viene ignorata).
- **Fasce di prezzo:** con 100 prodotti sopra i 150 € la fascia unica «Oltre 150 €» era troppo larga: ora sono Fino a 30, 30–80, 80–150, **150–200**, **Oltre 200 €**.
- **Testi:** nel file le descrizioni sono i titoli originali di Amazon (lunghi, con sigle come «[Classe di efficienza energetica E]»), non testi redatti. Il segno di diametro arrivava corrotto («15ⵁx30») e l'importatore lo corregge in «Ø»: è una mia deduzione dal contesto, da controllare. L'importatore ora ripulisce tutti i testi (caratteri di controllo, spazi) e rifiuta nomi oltre 120 caratteri o descrizioni oltre 400.
- **Posizione dei nuovi prodotti:** non hanno una `posizione`, quindi finché non si salva un nuovo ordine dall'area riservata compaiono **dopo** quelli già ordinati (per prezzo). Caricandoli su Firestore bisogna **non sovrascrivere** i prodotti esistenti: `pnpm seed` lo fa (merge); gli script una tantum con la sessione della CLI devono usare una maschera dei campi, altrimenti cancellano le posizioni salvate.
- Valgono le stesse avvertenze di sempre: diritti sulle foto da verificare, consegna stimata di 3 giorni (il file non la dà).

**Aggiunta del 16 ottobre: quarto pacchetto, evergreen viaggio e creator (PRD-131…180).** La cartella `catalogo_amazon_evergreen/` (50 prodotti da 24,95 a 519,99 €, rilevati il 16 ottobre 2026) è nell'elenco `SORGENTI`: il catalogo ha ora **180 prodotti**. Differenze rispetto ai pacchetti precedenti:
- **Data in formato ISO.** In questo file la data di rilevazione è `2026-10-16T00:00:00.000Z`, non un seriale di Excel: `data_excel` ora accetta entrambi i formati. Il testo «Prezzi rilevati il…» del catalogo, con tre giorni diversi, diventa «14, 15 e 16 ottobre 2026» (prima con più di due giorni avrebbe scritto «il dal … al …»; ora c'è un test).
- **Colonna «Famiglia» non importata.** Il file raggruppa i prodotti in famiglie (Loop, AirPods, Kindle, Luci tech…), ma non c'è un filtro che le usi e «Sottocategoria» è un'altra cosa (gruppo «Tipo (arredamento e design)»): mischiarle avrebbe sporcato quel menu. Se serve un filtro per famiglia è un lavoro a parte.
- **Colonne già nel file e ignorate dall'importatore:** «Link affiliato Amazon» (il link affiliato lo costruisce comunque `catalogo-dati.ts` dal link pulito e dall'ASIN; i 50 del file coincidono con quelli che ne escono), «URL immagine originale», «Riscontro vendita».
- **Descrizioni:** come nel pacchetto precedente sono in parte titoli originali di Amazon (fino a 198 caratteri, sotto il limite di 400); il testo «Perché è interessante» è in parte generico (es. i quattro Loop hanno la stessa frase).
- **Oura Ring 5 (PRD-135):** il prezzo (429 €) è della misura 9, come dice il `LEGGIMI` del pacchetto; le altre misure possono costare diversamente. Il nome del prodotto riporta «misura 9».
- Valgono le avvertenze di sempre: nessuna `posizione` per i nuovi prodotti (compaiono in coda finché non si salva un nuovo ordine dall'area riservata), diritti sulle foto da verificare, consegna stimata di 3 giorni. **Firestore e il sito pubblicato non sono aggiornati**: servono `pnpm seed` (con `merge`, non cancella le posizioni) e il deploy.

## 15. Link affiliati Amazon.it (tag `pacestefano77-21`)

- **Una sola regola** in `lib/dominio/amazon.ts` (`affiliaLink`, `urlPerAcquisto`), con test. Si toccano solo i link di `amazon.it`, `www.amazon.it` e `m.amazon.it`: si aggiunge `tag=pacestefano77-21` in fondo ai parametri; se c'è già un `tag` lo si sostituisce **nella stessa posizione** (e si eliminano gli eventuali tag ripetuti); gli altri parametri e il frammento `#…` restano **identici, carattere per carattere** (si lavora sul testo, non su `URLSearchParams`, che li ricodificherebbe). Senza link ma con un ASIN valido si crea `https://www.amazon.it/dp/ASIN?tag=…`. È idempotente: un link già a posto resta uguale.
- **Non convertibili:** altri domini (amazon.com, amzn.to, domini che contengono «amazon.it» solo nel nome, immagini di Amazon) → *ignorati*, lasciati com'erano; indirizzi non validi, con spazi, con credenziali o con un protocollo diverso da http(s) → *malformati*, segnalati e non toccati; senza link né ASIN valido → *mancanti*. Con un link malformato **non** si usa l'ASIN per rimpiazzarlo: lo si segnala e basta.
- **Dove stanno i link:** `urlEsterno` nei prodotti (`/prodotti`, sorgente `lib/dati/catalogo-amazon.json` con i link puliti), copiato in `prodotto.urlEsterno` delle collette e delle proposte di votazione quando il regalo viene dal catalogo. **Dove si mostrano:** «Vedi su Amazon.it» (scheda prodotto), «Compra il regalo» (chiusura), «Vedi sul negozio» nelle liste di votazione.
- **Prodotti futuri:** `catalogo-dati.ts` converte ogni link quando costruisce il catalogo (e **rifiuta** un link non convertibile), quindi `pnpm seed` scrive sempre link affiliati; il file sorgente resta pulito. Tutti i pulsanti passano da `urlPerAcquisto` (anche per le copie salvate prima della migrazione e per i link incollati a mano, **solo al momento di mostrarli**: nei dati restano com'erano) e hanno `rel="sponsored nofollow noopener noreferrer"`.
- **Migrazione:** `pnpm migra:link` (prova, non scrive nulla), `--applica` (salva prima un backup in `backup/link-affiliati-<data>.json` con i valori prima e dopo), `--ripristina <file>` (rimette i valori originali, ma solo dove il campo vale ancora ciò che la migrazione aveva scritto). Scrive solo il campo del link, non altro. Testata con 12 test sulla regola, 4 sulla migrazione e un test completo sull'emulatore (conversione, seconda esecuzione senza modifiche, ripristino).
- **Eseguita sui dati veri il 15 ottobre 2026:** 131 campi aggiornati (130 prodotti del catalogo + 1 colletta, la dimostrativa), 0 link malformati, 0 mancanti, 18 ignorati (tutti `negozio-esempio.it`: proposte di prova create con il vecchio catalogo finto, in 3 collette di prova), 4 non pertinenti (3 collette e 1 proposta con un link incollato a mano). Rilanciata subito dopo: 0 modifiche. Backup: `backup/link-affiliati-2026-10-15T12-02-52-459Z.json` (131 voci).
- **Dichiarazione di affiliazione:** «In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.» (formula italiana del contratto operativo, `DICHIARAZIONE_AFFILIATO_AMAZON` in `lib/dominio/amazon.ts`). È nel **piè di pagina di tutte le pagine del sito** (catalogo, schede, preferiti, accesso, wizard, dashboard e chiusura) e in fondo alla **pagina di voto di chi partecipa**, che ha link a prodotti Amazon.it e non ha un piè di pagina proprio. Le altre pagine di chi partecipa (pagamento, rendiconto, biglietto) non hanno link ad Amazon e non la riportano. Non è nel biglietto stampato né nell'area riservata. **Da verificare:** la formula esatta e le regole di posizione vanno confermate sul regolamento aggiornato del programma di affiliazione (la ricerca che ho fatto è su fonti di terzi, non sul testo ufficiale di Amazon). Il tag vale solo con un account Associates attivo (la prima vendita qualificante va ottenuta entro 180 giorni dalla registrazione).

## 16. Pagina di accesso: solo Google

Su indicazione di Stefano (mockup «Pagina attuale / Modifiche da fare») `/accedi` ha: il titolo «Accedi per organizzare la colletta» (centrato), il pulsante **«Sign in with Google»** (stile indicato da Google, testo in inglese come nel mockup) e il campo facoltativo «Come ti chiami?» con «Lo vedranno i partecipanti.». Tolti il campo email, «Mandami il collegamento» e il testo introduttivo (che diceva anche «Chi partecipa non deve accedere mai»).
- **Il nome scritto vale più di quello del profilo Google** (che resta il ripiego se il campo è vuoto): serve a mostrare ai partecipanti «Marco organizza» invece del nome completo dell'account.
- **L'accesso via link email non è più raggiungibile dall'interfaccia**, ma il codice resta (`inviaLinkEmail`, `completaLinkEmail`): chi aveva un collegamento già inviato lo può ancora completare. Non risultava comunque attivato nel progetto Firebase (ne risulta attivo solo Google).
- **Senza Firebase** (solo prove in locale) la pagina mantiene il vecchio modulo con email finta, altrimenti non si potrebbe provare l'app; compare con l'avviso «l'accesso è finto».
- Se la finestra di Google non si può aprire (alcuni browser dentro le app) si passa dalla pagina di Google (`signInWithRedirect`); chiudere la finestra non è un errore.
- **L'area riservata** (`/backoffice/catalogo`) si raggiunge ora solo con l'accesso Google: l'email deve essere quella in `ADMIN_EMAILS` e verificata (lo è per un account Google).

## 17. Biglietto di auguri digitale — fase 1 (modelli e impaginazione)

Nuova funzionalità (specifica SPEC_BIGLIETTO), costruita nell'ordine della sua sezione 15. **Fase 1 di 8** fatta: il modello dati, i modelli di copertina e i componenti di resa del biglietto (una sola fonte di impaginazione per galleria, firma, anteprima, apertura, gestione e PDF, §11). Le fasi 2–8 (wizard, firma, anteprima/pubblicazione, gestione/PDF, consegna, AI, collegamento colletta) non sono ancora iniziate.

- **Dimensione logica fissa.** Il biglietto si rende a 700 × 990 px logici (rapporto A, 1 : 1,414) e si scala alla larghezza voluta (componente `Tela`): così testo e margini in px sono identici in miniatura, schermo e PDF (criterio «lo stile appare identico ovunque»). Dimensioni testo xs–xxl mappate in px in `lib/dominio/biglietto.ts`.
- **Impaginazione automatica** (`impaginaMessaggi`, pura e testata): i riquadri misurati vanno nella colonna più corta; quando non ci stanno si apre una pagina nuova; un riquadro più alto della pagina sta da solo. Il `Visualizzatore` misura le altezze reali (a larghezza di colonna logica) e impagina. Provato: 15 messaggi → 6 pagine a 1 colonna, 4 a 2, 4 a 3; sfogliabile con frecce, tasti e swipe; nessuno scorrimento orizzontale a 320 px.
- **Modelli nostri** (`lib/dati/modelli-biglietto.ts`): 12 copertine (4 per compleanno/feste), gradiente + motivo emoji + testo fisso + titolo editabile, nessuna illustrazione o marchio copiati. **Scostamento dalla §8.1:** lo `sfondo` è un descrittore (gradiente/tinta + motivo) reso da `Copertina`, non un `miniaturaUrl`/`sfondo: string` che punta a un file; adattato perché i disegni sono generati, non asset. I modelli vivono nel codice (come il catalogo); il seed su Firestore arriverà con le fasi successive.
- **Pagina di prova interna** `/biglietto/prova` (noindex, non linkata) per verificare la fase; va rimossa o sostituita quando il flusso è completo.
- **Sanitizzazione** del messaggio (HTML) e **persistenza** su Firestore non ci sono ancora: `RiquadroMessaggio` rende `messaggioHtml` così com'è (contenuto controllato nella prova). La ripulitura lato server è della fase «Firma» (§8.2). Niente di questa fase è pubblicato né wired nella navigazione del sito. *(Aggiornamento: ripulitura, salvataggio e navigazione sono arrivati con le fasi 2–4, vedi §18.)*

## 18. Biglietto di auguri — fasi 2–4 (wizard, firma, anteprima e pubblicazione)

Costruite di fila su richiesta («vai avanti più fasi senza fermarti»). Ora il flusso è completo dalla creazione alla firma: `/biglietto/nuovo` → `/biglietto/[id]/dettagli` → `/design` → `/anteprima` → pubblica → `/gestisci`; chi firma: `/b/[slug]` → `/firma` → `/i-tuoi-dati` → `/grazie`. Ingressi «Crea un biglietto di gruppo» in home e nella scheda prodotto. Restano da fare le fasi 5–8 (gestione completa e PDF, consegna programmata e busta animata, AI, collegamento con la colletta).

**Architettura e sicurezza (scostamento dalla §8.2–8.3).**
- **Tutti i dati del biglietto passano da rotte server** (`app/api/biglietti/**`, `app/api/b/**`) con l'Admin SDK o, senza Firebase, con un archivio in memoria (`lib/biglietti/`). Le regole Firestore negano esplicitamente ogni accesso dal browser a `biglietti/**` e `slugBiglietti` (testato sull'emulatore). Così email del destinatario, token e dati di chi firma non arrivano mai al browser sbagliato, senza regole campo per campo.
- **Niente accesso anonimo**: nel progetto Firebase risulta attivo solo Google. Al suo posto:
  - la **bozza** appartiene al browser che la crea tramite una **chiave segreta** (32 byte casuali) tenuta in localStorage; il server ne conserva solo l'impronta SHA-256. Alla pubblicazione la bozza passa all'account Google che pubblica (`organizzatoreUid`): da allora si gestisce anche da un altro dispositivo, dopo l'accesso. Una bozza mai pubblicata si apre solo dal browser che l'ha creata (lo dice la pagina, con «Accedi» e «Crea un nuovo biglietto»).
  - **chi firma** ha una chiave casuale del dispositivo (localStorage); l'id della firma è `sha256(chiave:bigliettoId)`: lo stesso dispositivo ritrova e aggiorna la sua firma (doppio tocco o modifica = aggiornamento, mai un doppione), senza che l'id riveli la chiave.
  - L'accesso si chiede **solo a «Pubblica e condividi»** (finestra «Accedi per continuare» con Google); dopo l'accesso la pubblicazione riparte da sola e la bozza non si perde.
- **S4 (App Check / limite per uid)** non ancora fatto: c'è un tetto di 500 firme per biglietto e ogni firma è legata a una chiave di dispositivo. App Check va aggiunto prima di un uso pubblico largo.
- **Link unico:** `/slugBiglietti/{slug}` prenotato in transazione al salvataggio del passo 2 (il vecchio link della stessa bozza si libera). Verifica mentre si scrive (600 ms), e se il link è stato preso nel frattempo il salvataggio fallisce con lo stesso avviso giallo. S5: il campo non si svuota e si propone `…-2`, `…-3`.
- **Data passata** alla pubblicazione: il server rifiuta e l'anteprima propone «Cambia la data». Un biglietto già aperto può tenere la sua data salvata.
- **HTML dei messaggi** ripulito sul server (solo `<b> <i> <u> <br>`); stile (carattere, colore, dimensione) accettato solo dagli elenchi ammessi.

**Immagini (scostamento dalla §4.3/§5.2 e dalla §8.2 «Storage»).**
- Niente Firebase Storage: le immagini caricate si **rimpiccioliscono nel browser** (lato lungo 1200 px, JPEG, poi 1000/800 se serve) e si salvano come byte in `biglietti/{id}/immagini/{nome}` (≤ 900 KB, sotto il limite di 1 MB per documento). Il server ne controlla il tipo **dal contenuto** (JPG/PNG/GIF/WebP), le serve da `/api/img/b/[id]/[nome]` con nomi casuali e cache permanente, e cancella la vecchia quando la si sostituisce. Le GIF restano animate fino a 900 KB.
- **Limite diverso dalla specifica:** le foto possono partire anche più grandi di 1 MB (fino a 15 MB) perché le riduciamo noi; per le GIF il limite è 900 KB. Per chi firma è più comodo che un rifiuto.
- L'immagine di chi firma si carica **solo al «Continua» finale** (non alla scelta): niente immagini orfane se si abbandona.
- **Copertine con immagine:** «Carica immagine o GIF» (immagine in alto, titolo sotto) e «Foto a tutta pagina» (foto piena, titolo sopra una sfumatura) sono modelli speciali sempre in testa alla galleria. Con questi modelli «Avanti» si abilita solo quando l'immagine c'è (la specifica non lo dice; consegnare il segnaposto «Carica la tua foto» non avrebbe senso).
- **GIPHY / Unsplash (S7):** rotte server `/api/libreria/gif|foto` già pronte, attive solo con `GIPHY_API_KEY` / `UNSPLASH_ACCESS_KEY`; senza chiavi la scheda «Libreria GIF» e «Scegli una GIF» non compaiono (oggi è così). Attribuzione «via GIPHY» / «Foto di X su Unsplash» sotto l'immagine.
- **AI (S8):** nessun pulsante AI (Copertina magica, Immagine magica, Scrittore magico, Assistente messaggi) finché la fase 7 non c'è, qualunque valore abbia `NEXT_PUBLIC_AI_ATTIVA`.

**Interfaccia.**
- Componenti comuni in `components/biglietto/comuni.tsx` (intestazione fissa con barra segmentata e pallino sorridente, pulsante a pillola grigio finché non è valido, aiuto «?», fumetto «i» con «Ho capito», coachmark una sola volta per utente) e `campi.tsx` (tendina personalizzata con tastiera, calendario con giorni passati barrati e oggi cerchiato, ora a passi di 15 minuti, fuso «Ora italiana · Cambia», campo ricco, anteprima del link).
- Ogni «Avanti» salva sul server; i campi del passo 2 e il titolo della copertina stanno anche in sessionStorage a ogni battitura (ricaricare non perde nulla, verificato). Il titolo della copertina si salva da solo 0,8 s dopo l'ultima battitura e sopravvive al cambio di modello; vuoto, diventa il nome del festeggiato.
- Il biglietto a schermo ha **angoli vivi** (spec 3.5) e pagine interne sempre chiare, anche col tema scuro (è un oggetto «di carta»).
- **Anteprima:** carosello con le vere pagine di chi firma (invito e firma) in modalità anteprima, senza scritture. «Modifica i dettagli» riapre il modulo del passo 2 in una finestra. Dopo la pubblicazione: finestra «Il tuo biglietto è pronto da condividere» (link, messaggio già scritto, copia, WhatsApp, «Vai alla gestione»).
- **Gestione (prima versione):** stato, contatore ed elenco firme (nome, cognome, email se lasciata, data, inizio del messaggio), condivisione, promemoria da copiare, data di consegna con «Modifica i dettagli», scelta 1/2/3 colonne, anteprima sfogliabile, «Cambia la copertina». Mancano (fase 5): riordino, modifica/eliminazione dei messaggi, messaggio dell'organizzatore, «Chiudi ora/Riapri», PDF.
- **Elenco «I miei biglietti»** non c'è ancora: dopo la pubblicazione la gestione si riapre dal link `/biglietto/[id]/gestisci` (o dal browser che l'ha creato).
- **S1:** «Fare un regalo insieme e firmare il biglietto» porta a `/crea?biglietto=1&occasione=…`; il collegamento vero con la colletta è la fase 8 (oggi `/crea` ignora il parametro).
- **S2:** riquadro chiuso «Vuoi anche fare un regalo di gruppo?» con link al catalogo e a una nuova colletta.

**Testi cambiati rispetto alla §13 (onestà sulle email).** Le email (copia a chi firma, promemoria, consegna) non sono ancora configurate, quindi:
- «I tuoi dati» dice «Così chi organizza sa chi ha firmato. Il messaggio lo puoi modificare da questo dispositivo finché il biglietto è aperto.» invece di «Ti mandiamo una copia del messaggio…»; sotto l'email facoltativa: «Lasciala se vuoi poter modificare il messaggio anche da un altro dispositivo.» (la modifica via link email è della fase successiva). Al posto della casella dei termini, una riga con il link alla nuova pagina **`/privacy`** «Come trattiamo i dati» (testo breve e fattuale del prototipo, **da far rivedere** prima di un lancio).
- La conferma non dice «Ti abbiamo mandato una copia».
- L'aiuto della data di consegna mantiene il testo della specifica («Ti ricordiamo tutto via email il giorno prima…»), che sarà vero con la fase 6.

**Verifiche.** 101 test unitari (compreso il percorso completo sulle rotte: bozza, dettagli, link occupato, copertina, pubblicazione con e senza account, firma, modifica senza doppioni, immagini, limiti) e 60 test sull’emulatore (regole, più l’archivio Firestore vero: slug in transazione, contatore firme anche con firme simultanee, immagini come byte). Prova nel browser (build di produzione senza Firebase, 390 e 320 px): 71 controlli superati, tra cui tutti i criteri di accettazione dei passi 1–4 e della firma, stile del testo identico tra firma e biglietto, nessun dato privato nell'HTML pubblico, nessuno scorrimento orizzontale. Non ancora provato con Firebase vero né da un telefono reale aperto da WhatsApp.

## 19. Secondo punto d'ingresso: `/regalo`, il percorso «Trova il regalo»

Richiesta: un **nuovo** punto d'accesso al catalogo e alle funzionalità di colletta e biglietto (la home resta com'è), copiando la UX e il front-end di `https://globe-tube-dev.web.app/regalo.html`.

**Da dove viene.** Il percorso è un questionario a quattro tappe (Relazione → Occasione → Interessi → Trovato!). Non avendo un browser a disposizione in quella sessione, l'ho ricostruito dal **sorgente** della pagina, che dà più della resa a schermo: `regalo.html`, `css/gift-finder.css`, le regole di `css/main.css` che servivano, e i moduli `js/gift-finder/{main,gift-finder,components,data,state,results,icons}.js`.

**Cosa è identico.** Testi, titoli, ordine delle domande, le 4 tappe con lo stepper a gradiente, il pannello bianco sovrapposto, i 2 generi, le 6 relazioni per genere, le 6 occasioni, le 6 categorie e i **36 interessi** (etichette e icone comprese), il limite di 3–5 interessi con la capsula a cinque caselle, la pausa di 1100 ms con l'animazione «Stiamo cercando i regali giusti…», la barra dei filtri dei risultati, lo stato vuoto, e l'accessibilità dell'originale (`aria-pressed`, `aria-current="step"`, regione `aria-live`, fuoco sul titolo e rientro in vista al cambio di tappa, Esc che chiude i filtri, aree di tocco da 44 px). Le icone sono le stesse **Material Symbols** del pacchetto di partenza (53 path, licenza Apache 2.0), generate in `lib/regalo/icone-material.ts` da un passaggio automatico: non si scrivono a mano. Il percorso lasciato a metà si riprende da `sessionStorage`, come nell'originale.

**Cosa è nostro, e perché.**
- **Le schede dei risultati sono le nostre** (`components/SchedaProdotto`): foto, marca, prezzo, consegna, il cuore dei preferiti, «Regalalo in gruppo» (che apre il wizard sul prodotto) e «Aggiungi alla lista regali». La scheda dell'altro sito portava solo «Scopri di più»: tenerla avrebbe staccato la pagina esattamente da ciò che si chiedeva di collegare. È lo **scostamento visibile principale**: dentro il pannello verde-salvia le schede hanno il nostro stile. Si può passare alla scheda dell'originale, ma si perdono quei quattro pulsanti.
- **Le fasce di prezzo sono quelle del catalogo** (`FASCE_PREZZO`: fino a 30, 30–80, 80–150, 150–200, oltre 200 €) e non quelle dell'originale (fino a 25, 25–50, oltre 50 €), che sul nostro catalogo (24,95–519,99 €) avrebbero messo quasi tutto in un'unica fascia.
- **«Più desiderati» è diventato «I nostri preferiti»**: l'originale ordinava per un punteggio di stranezza che non abbiamo; questo ordina per la `posizione` decisa nell'area riservata, che è la nostra graduatoria editoriale.
- **Niente «Riprova»**: i prodotti arrivano con la pagina, quindi non c'è una richiesta che possa fallire. La pausa animata resta perché nell'originale era già una pausa voluta, non un'attesa di rete.
- Il meccanismo con cui l'originale rimetteva a fuoco il pulsante appena premuto non serve: lì si riscriveva tutto l'HTML a ogni clic, qui i nodi restano gli stessi.

**L'affinità con i prodotti** (`lib/regalo/punteggio.ts`). L'originale pesava: parole chiave 3, categoria 2, occasione 2, destinatario 1. Da noi:
- **parole chiave 3**, cercate in nome, descrizione, «perché è interessante», marca e sottocategoria. Le radici si cercano **dall'inizio della parola**, così «arte» non pesca «cartella».
- **tema 1**, non 2: le categorie dell'altro sito erano sette e strette, i nostri temi sono tre e larghissimi (il solo arredamento è il 42% del catalogo). A 2 punti i risultati venivano fuori appiattiti, con decine di prodotti a pari punteggio; a 1 il tema separa i pari merito.
- **occasione 2**: regola scritta ma **inerte**, perché i prodotti del catalogo Amazon hanno `occasioni` vuoto. La domanda resta (è una delle tre) e finisce nella riga di riepilogo dei risultati, ma oggi non sposta la graduatoria. Per farla contare servirebbe riempire `occasioni` nell'Excel, o portare l'occasione scelta nel wizard (`/crea` oggi accetta solo `prodotto`, `lista`, `bozza`, `persone`).
- **destinatario 1**: distingue poco per com'è il catalogo, non per come è scritto il codice — **177 prodotti su 180 valgono «uomo; donna»**, quindi il punto scatta solo sui 3 pensati per una persona sola.
- **Falsi positivi trovati provando sul catalogo vero** e corretti nelle radici: `spa` pescava «Spacey, tavolino oro», `design` pescava le marche «Peak Design» e «Kare Design» (è nel 22% del catalogo), `auto` pescava «automatico», `eco` pescava «economico». C'è un test di regressione per ognuno. Ne resta uno noto e accettato: `moka` pesca lo specchio **«Moka XL»**, che esce sesto a 3 punti. Cercare parole dentro i nomi dei prodotti fa questo, a volte.

**Com'è fatto.** `app/(sito)/regalo/page.tsx` sta **dentro il layout del sito**: intestazione, menu, barra della lista regali e piè di pagina con la dichiarazione di affiliazione sono quelli di sempre, così la pagina resta collegata al resto. Il server legge i prodotti e li passa al componente client `components/regalo/TrovaRegalo.tsx`; le tappe 1–3 non usano i prodotti, la 4 ordina in locale (180 prodotti, istantaneo). La pagina pesa **31,4 KB compressi** contro i 151,5 KB di `/catalogo`. La voce **«Trova il regalo»** è nel menu a panino, dopo «Catalogo».

**Lo stile è confinato.** `app/(sito)/regalo/regalo.css` è la CSS dell'originale portata con **tutti i selettori prefissati `gf-`** e i token dichiarati dentro `.gf-page`: nessuna regola esce da questa pagina. Due conseguenze dichiarate:
- **I caratteri sono quelli dell'altro sito** (DM Sans e Space Grotesk, via `next/font`, caricati solo qui) invece di Bricolage Grotesque e IBM Plex Sans. È la scelta più fedele, ma convive con l'intestazione del sito, che resta con i nostri: per allinearla basta togliere le due variabili dalla pagina.
- **La pagina resta chiara anche con il sistema in tema scuro**, perché l'originale non ha un tema scuro e il pannello è dichiarato chiaro. Intestazione e piè di pagina, che stanno fuori da `.gf-page`, seguono il tema come sempre: con il sistema in scuro la cucitura si vede.

**Verifiche.** 23 test unitari nuovi (126 in tutto): la macchina a stati (tappe, limiti, ripresa da `sessionStorage` con dati sporchi, non si salta avanti) e l'affinità, compresi tre controlli **sul catalogo vero** (chi chiede viaggio trova prodotti da viaggio, chi chiede casa trova arredamento, risposte diverse danno risultati diversi) e i falsi positivi. Tipi, lint e build di produzione passano. Sulla pagina servita ho controllato l'HTML della **tappa 1**: stepper a 4 tappe, tappa attiva con `aria-current`, avanti disabilitato con il suo suggerimento, `noscript` con il link al catalogo, dichiarazione di affiliazione al suo posto.

**Non verificato:** le tappe 2, 3 e 4 e tutta l'interazione (chip, cerchi, animazione, filtri, griglia dei risultati) **non sono state provate in un browser**: in quella sessione non ne avevo uno. Vanno fatti un giro a mano e una prova su telefono.

## 20. Da «Colletta» a «Regaloop»: nome, logo e testo della home

Richiesta: cambiare nome e logo del progetto e sostituire il testo della home con quello fornito.

**Il logo.** Dal PNG consegnato (2172×724, fondo trasparente) ho ricavato gli asset con uno script della sola libreria standard, senza ridisegnare nulla a mano. I colori del marchio, campionati dal file, sono **verde #033922** e **arancio #FD5D17**. Ritagliato al disegno (x 222–1954, y 153–568) e ridotto con media a scatola su alfa premoltiplicato, se no i bordi prendono un alone scuro.

| file | cosa è | uso |
|---|---|---|
| `public/logo/regaloop.png` (400×105, 26 KB) | lockup completo | intestazione del sito e del biglietto |
| `public/logo/regaloop-scuro.png` (400×105, 17 KB) | come sopra, il verde diventa #E7EFEA | tema scuro |
| `public/logo/regaloop-icona.png` (256×292) | solo la scatola regalo | sorgente degli altri |
| `public/logo/regaloop-icona-scuro.png` | icona chiara | anteprime social, che hanno il fondo verde scuro |
| `app/icon.png` (256×256) | icona quadrata | favicon; sostituisce `app/icon.svg`, eliminato |

**Perché due file e non uno.** Il verde #033922 sul fondo del tema scuro (#18211d) sparirebbe. `components/ui/Logo.tsx` usa un `<picture>` con `media="(prefers-color-scheme: dark)"`: **non** due `<Image>` nascosti con `display: none`, perché il browser scaricherebbe comunque entrambi i file. Niente `next/image`: a 26 KB e già della misura giusta, l'ottimizzatore non aggiunge nulla. Un limite dichiarato: `<picture>` segue solo `prefers-color-scheme`, quindi l'override manuale `[data-theme]` previsto in `globals.css` qui non arriva — oggi non lo imposta nessuno, quando servirà andrà aggiunto anche al logo.

**Dove è cambiato il nome.** Intestazione del sito e del biglietto (il vecchio `Marchio`, il biglietto con tre punti, è stato tolto da `icone.tsx`: non lo usava più nessuno), `metadata` in `app/layout.tsx` (titolo, modello `%s · Regaloop`, `applicationName`, descrizione), `siteName` dell'anteprima della colletta, piè di pagina, e le due immagini social (`/c/[slug]` e `/b/[slug]`), dove il marchio ora è l'icona vera passata a `ImageResponse` come data URI — satori non legge i file del sito da sé — tramite `lib/marchio.ts`, che la legge dal disco una volta sola.

**Cosa NON ho rinominato, di proposito.**
- **La parola «colletta»**: è il nome comune della cosa («organizza una colletta», «Colletta chiusa», il tipo `Colletta`, la rotta `/c/`, la raccolta Firestore `collette`). È dominio, non marchio.
- **Le chiavi del browser** `colletta.preferiti`, `colletta.dopoAccesso`, `colletta.trova-regalo`: rinominarle farebbe **perdere a chi già usa il sito** i preferiti salvati e il percorso a metà.
- **L'infrastruttura**: nome del pacchetto, backend App Hosting `colletta`, database Firestore `colletta`, l'indirizzo `*.hosted.app`. Cambiarli significa rifare il deploy e migrare i dati; vanno affrontati insieme a un dominio vero.

**Il testo della home** è quello fornito: «Regaloop» come occhiello sopra il titolo, titolo «Il regalo di gruppo, senza dover rincorrere tutti.», poi il paragrafo sul link unico e la riga di chiusura «Più tempo per scegliere il regalo, meno per organizzarlo.» in evidenza. I tre passi, il riquadro del biglietto e quello su chi partecipa restano com'erano.

**La tavolozza del sito non è cambiata** e non era richiesto: l'accento resta il verde-acqua #0F7A63, che non è il verde del logo. Il logo convive, ma le due tinte di verde non sono la stessa: allineare la tavolozza al marchio (#033922 come accento, #FD5D17 come richiamo) è un lavoro a parte, da fare guardando i contrasti su tutte le pagine e su entrambi i temi.

**Verifiche.** Tipi, lint, 126 test e build di produzione passano. Sulla pagina servita: logo con la sorgente per il tema scuro e `alt="Regaloop"`, occhiello, titolo, paragrafo e chiusura nuovi, `<title>` e piè di pagina aggiornati, favicon servito. Le **due immagini social sono state generate davvero e guardate**: l'icona e la scritta «Regaloop» ci sono su entrambe. **Non verificato:** la resa del logo nel tema scuro e su un telefono vero — entrambe da guardare a occhio.

## 21. Prima tappa di `/regalo`: da «Relazione» a «Destinatario»

Modifiche chieste con un mockup a confronto (pagina attuale / modifiche da fare), applicate alla sola prima tappa:

| | prima | adesso |
|---|---|---|
| nome della tappa | Relazione | **Destinatario** |
| titolo del pannello | Genere & relazione | **Qualche domanda** *(30 sec)* |
| testo | «Per trovare i **regali perfetti** dobbiamo conoscere bene il destinatario: chi è e che tipo di relazione avete?» | «Per trovare il regalo giusto, abbiamo bisogno di qualche informazione» |
| domanda | — | **«Il regalo è per un uomo o per una donna?»**, centrata sopra i cerchi |
| chip della relazione | Fidanzata, Mamma, Sorella, Moglie, Amica, Altro (e i maschili) | **tolti** |
| suggerimento in fondo | «Scegli genere e relazione per continuare» | «Seleziona un’opzione per continuare» |

**La relazione è stata tolta davvero, non solo nascosta**: via la tabella `RELAZIONI`, il campo `relazione` dello stato, `scegliRelazione` e `relazioniPer`. Si poteva fare senza perdere nulla perché **non pesava sui risultati**: nel percorso di partenza la relazione valeva 1 punto confrontata con il campo `idealFor`, che il nostro catalogo non ha (vedi sezione 19), quindi da noi era già inerte. L'unico posto dove compariva era la riga di riepilogo dei risultati: al suo posto ora c'è il destinatario («Donna · Compleanno · Musica, Viaggi»). Chi avesse il percorso a metà in `sessionStorage` non si accorge di nulla: `ripulisci` ignora i campi che non riconosce. Se la relazione dovesse tornare, va riscritta: **questo progetto non è sotto controllo di versione**, quindi il codice tolto non si recupera dalla cronologia.

Conseguenza sulla prima tappa: ora si completa con **una** scelta sola, e il suggerimento al singolare lo dice.

**Una cosa nel mockup che NON ho replicato.** Nell'immagine «Destinatario» ha dietro un rettangolo scuro a spigoli vivi. È l'incollatura del mockup — la parola nuova è più lunga di «Relazione» e il riquadro copre quella vecchia — non un elemento di design: nello stepper non c'è nient'altro di simile, e il sistema usa forme arrotondate. L'etichetta attiva resta bianca in grassetto, come le altre.

**Resta aperto:** «Qualche domanda (30 sec)» è il titolo della **sola prima tappa**; la seconda e la terza tengono i loro («Occasione», «Interessi»), perché il mockup mostrava solo la prima. Se invece doveva diventare l'intestazione fissa di tutto il questionario, è una riga da cambiare.

**Verifiche.** Tipi, lint, 126 test e build di produzione passano. Sulla pagina servita, 14 controlli: nome della tappa, titolo con la nota piccola, testo nuovo, domanda centrata col gruppo dei cerchi etichettato da lei (`aria-labelledby`), suggerimento nuovo, sparizione di vecchio testo, chip e segnaposto, i due cerchi al loro posto, le altre tre tappe invariate. **Non verificato in un browser**: resa a schermo e su telefono.

## 22. `/regalo`: titolo nuovo e schermata d'avvio con due strade

Secondo mockup a confronto, sempre sulla pagina `/regalo`:

- **Titolo della pagina:** «Trova l'idea regalo giusta» → **«Trova il regalo perfetto»**. Ho allineato anche il `title` della scheda del browser, che era uguale al vecchio titolo. Il sottotitolo («Tre domande, pochi click…») non cambia.
- **All'arrivo non parte più il questionario.** Il pannello mostra due strade: il pulsante **«Rispondi alle 3 domande»**, la riga **«..o sfoglia direttamente il nostro catalogo»** e il pulsante **«Vai al catalogo regali»**, che porta a `/catalogo`. La prima domanda compare solo dopo aver premuto il primo pulsante.

Lo **stepper resta visibile** anche sulla schermata d'avvio, con «Destinatario» attivo, com'è nel mockup.

**I pulsanti** sono pillole piene petrolio **#336376** con bordo **#0d2332** da 2 px, larghezza uguale fra loro: colori presi dal mockup campionando i pixel, non scelti da me. Stanno fra il verde e il blu del gradiente dello stepper, quindi non stonano. Non usano i bottoni del sito (`components/ui/Bottone`): quelli sono verdi come l'accento di Regaloop e dentro questo pannello sarebbero un terzo verde.

**Chi aveva già cominciato non rivede la scelta:** la schermata d'avvio appare solo a percorso vuoto (prima tappa e nessun destinatario scelto), così chi torna con un percorso in `sessionStorage` riprende da dov'era. Lo stato «ho premuto Rispondi» vive solo nella pagina e non viene salvato: ricaricando senza aver scelto nulla si rivede la scelta.

**«Ripeti la ricerca» riparte da zero**, schermata d'avvio compresa: butta via le risposte (anche quelle salvate nella sessione, se no tornerebbero ricaricando la pagina), i filtri dei risultati e la categoria di interessi aperta. Chi ricomincia può quindi di nuovo scegliere fra le 3 domande e il catalogo. Tornare indietro a una tappa già fatta dallo stepper è un'altra cosa e non azzera niente.

**Dettagli di accessibilità.** Il pannello d'avvio non ha un titolo visibile, ma la sezione ne vuole uno: c'è un `<h2>` solo per screen reader, «Come vuoi cercare il regalo?». E il fuoco: premendo «Rispondi alle 3 domande» il pulsante sparisce, quindi il fuoco finirebbe sul corpo della pagina — ora si sposta sul titolo della prima domanda, come già succedeva fra una tappa e l'altra (la regola del fuoco guarda «cosa si vede nel pannello», non più solo il numero di tappa).

**Verifiche.** Tipi, lint, 126 test e build di produzione passano. Sulla pagina servita, 12 controlli: titolo nuovo e vecchio sparito, sottotitolo invariato, i due pulsanti con il testo di mezzo, il secondo che punta davvero a `/catalogo`, lo stepper ancora a quattro tappe, **nessuna domanda e nessuna freccia all'arrivo**, titolo nascosto presente, `title` della scheda allineato. **Non verificato in un browser:** la resa dei pulsanti e il passaggio alla prima domanda dopo il clic.

## 23. Eliminare un prodotto dal catalogo pubblico (area riservata)

Richiesta: un pulsante «Elimina» in `/backoffice/catalogo` che metta il prodotto in una categoria «eliminati», così sparisce dal catalogo pubblico pur restando nel catalogo.

**Come funziona.** Il prodotto prende un campo `eliminato: true`. Non si cancella niente: resta su Firestore, resta nel file sorgente e nell'Excel, e dall'area riservata si rimette con «Ripristina».

**Perché un campo nuovo e non `attivo`, che già esisteva.** `attivo` sembrava fatto apposta, ma **`pnpm seed` riscrive `attivo: true` a ogni importazione**: il primo seed dopo un'eliminazione avrebbe fatto riapparire il prodotto da solo. `eliminato` il seed non lo scrive mai, e il seed usa `merge`, quindi l'eliminazione sopravvive a tutte le importazioni successive. (Il seed cancella i prodotti che non sono più in catalogo: un prodotto eliminato è ancora in catalogo, quindi non viene toccato.)

**Dove sparisce.** Il filtro sta in un punto solo, `filtraProdotti` in `lib/dati/tipi.ts`, che è la strada di tutti e tre gli adattatori: quindi via dal catalogo, dai filtri, dalla pagina Preferiti, da «Trova il regalo», dal wizard e da «scelgo un regalo meno costoso». In più `prodotto(slug)` ritorna `null` per un prodotto eliminato in tutti gli adattatori, così **anche il link diretto alla scheda dà 404**: se non esiste per chi naviga, non deve esistere nemmeno per chi ha il link. Le **collette già create non cambiano**: si portano dietro una copia del prodotto.

**L'area riservata vede tutto.** Metodo nuovo `elencaProdottiPerGestione()` (eliminati compresi, stesso ordine del sito), usato dalla GET e anche dalla PUT dell'ordine: così un prodotto eliminato **resta nell'ordine** e ripristinandolo torna al suo posto, invece di finire in coda. Verificato.

**L'azione è immediata**, non passa dal pulsante «Salva l'ordine»: eliminare non è riordinare, e bundlarlo sarebbe stato una sorpresa. Nessuna finestra di conferma, perché l'operazione è reversibile con un clic e il messaggio dopo l'eliminazione dice dove ritrovare il prodotto. Gli eliminati stanno in una sezione «Eliminati (N)» in fondo alla pagina, con il conteggio.

**Dettaglio dell'ordinamento:** le frecce ↑↓ ora si muovono rispetto al **prodotto visibile vicino**, non alla posizione grezza nella lista; se no, con un eliminato in mezzo, un clic sembrava non fare nulla. Il comparatore dell'ordine è stato estratto in `confrontaProdotti`, condiviso fra il sito e l'area riservata.

**API:** `PATCH /api/admin/catalogo` con `{ slug, eliminato }`. Stesso controllo di sempre (email verificata e presente in `ADMIN_EMAILS`, a ogni richiesta). Le regole di Firestore non cambiano: `prodotti` resta in scrittura solo all'Admin SDK.

**Aggiunta: la pagina è a larghezza piena e ogni riga porta ad Amazon.** Si usa solo da desktop, quindi via il limite di 880 px (`max-w-dashboard`): con 180 prodotti e molte colonne i nomi finivano troncati dopo tre parole. Ogni riga ha ora **«Vedi prodotto su Amazon»**, che apre la scheda in una finestra nuova (`target="_blank"`, `rel="noopener noreferrer"`), anche fra gli eliminati: si guarda il prodotto prima di decidere dove metterlo o se ripristinarlo.

Quel link è **l'unico del progetto senza tag affiliato**: si costruisce dall'ASIN con `linkSchedaAmazon` (`lib/dominio/amazon.ts`), perché sono clic nostri mentre sistemiamo il catalogo, non traffico da monetizzare. L'ASIN si valida prima di finire in un indirizzo; senza un ASIN buono si ripiega sul link del prodotto. Ovunque altro vale sempre `urlPerAcquisto`, con il tag (sezione 15).

**Verifiche.** Tipi, lint, 130 test (2 nuovi sul filtro e sull'ordine, 2 sul link pulito) e build passano. **Provata davvero in locale**, con l'API: 403 senza autorizzazione (GET e PATCH), 400 con un corpo storto, 404 su uno slug inesistente; eliminando «loop-quiet-2» il catalogo pubblico è passato da 180 a 179 prodotti, la sua scheda da 200 a 404 e in `/regalo` è sparito, mentre l'area riservata continuava a vedere 180 con 1 eliminato; ripristinandolo è tornato tutto come prima, **posizione in cima compresa**. **Non verificato:** la pagina nel browser (pulsanti e sezione «Eliminati» a occhio), e il comportamento con Firestore vero — in locale gira l'adattatore in memoria.

## 24. Catalogo: miniature a due per riga e scheda prodotto in un popup

Richiesta: rendere il catalogo più comodo — prodotti più piccoli, **due per riga** — e far aprire la scheda in un **popup a schermo intero** con una **X** ben visibile in alto a destra che riporta esattamente al punto del catalogo da cui si era partiti.

**Due per riga.** La griglia partiva da una colonna sul telefono e arrivava a quattro: ora parte da **due** (`grid-cols-2`, poi 3 e 4 sugli schermi grandi). «Miniature più piccole» vuol dire schermo stretto: su desktop quattro colonne erano già piccole, è il telefono che mostrava una scheda gigante per volta.

**Scheda compatta, senza perdere funzioni.** `SchedaProdotto` ha una variante `compatta` che usa solo il catalogo: testi e spazi più stretti e la consegna **sotto** il prezzo invece che accanto, perché affiancati in ~170 px non ci stanno. Restano tutti: cuore dei preferiti, «Regalalo in gruppo» e lista dei regali. È una variante e non una modifica alla scheda perché le altre griglie (Preferiti, risultati di «Trova il regalo») su schermo stretto mostrano **una** scheda per riga: lì la forma larga è quella giusta, e non volevo cambiarle senza che fosse chiesto.

**Il popup: rotte intercettate di Next, non una finestra fatta a mano.** `app/(sito)/@modale/(.)prodotto/[slug]/page.tsx` intercetta `/prodotto/<slug>` quando ci si arriva navigando dentro al sito. Conseguenze, tutte volute:
- **Si torna esattamente dov'eri**: il catalogo resta montato sotto, con il suo scorrimento. Chiudere è un `router.back()`, quindi non c'è nessuna posizione da salvare e rimettere.
- Il **tasto «indietro»** del browser e la gesture del telefono chiudono il popup, come ci si aspetta.
- L'**indirizzo cambia** in `/prodotto/<slug>`: il link resta condivisibile, e aperto da fuori o ricaricato dà la **pagina intera**, non il popup. Niente di perso per i motori di ricerca.

Il contenuto della scheda è stato estratto in `components/DettaglioProdotto.tsx`, usato sia dalla pagina sia dal popup: così i due non possono divergere. Nella pagina il nome è `h1`, nel popup `h2` (il nome del dialogo lo annuncia già `aria-label`).

**Perché il `<dialog>` del browser.** Fuoco intrappolato dentro al popup, Esc che chiude, resto della pagina reso inerte: li fa il browser, meglio di come li rifaremmo. Si aggiunge solo il blocco dello scorrimento dietro (`overflow: hidden` sulla radice, con compensazione della barra per non far saltare la pagina di lato) e un `preventDefault` su `cancel`, se no Esc chiuderebbe il dialogo lasciando l'indirizzo su `/prodotto/<slug>`. La **X** è un tondo da 48 px in alto a destra, **appiccicato in alto**: resta in vista anche scorrendo una scheda lunga. Niente chiusura «cliccando fuori»: il popup occupa tutto lo schermo, un fuori non c'è.

**Verifiche.** Tipi, lint, 130 test e build passano. Sulla pagina servita: il catalogo ha due colonne da telefono, le schede sono nella forma compatta e hanno ancora cuore, «Regalalo in gruppo» e lista regali; il link diretto a `/prodotto/<slug>` dà la pagina intera con «Torna al catalogo» e il titolo come `h1`, senza popup. La rotta intercettata risulta registrata nel build (`/(sito)/@modale/(.)prodotto/[slug]/page → /(.)prodotto/[slug]`). **Non verificato in un browser:** l'apertura del popup al clic, la X, Esc, il tasto indietro e il ritorno al punto esatto del catalogo — tutte cose che vivono nel browser e che vanno provate a mano, anche da telefono.

## 25. «Scegli UX»: più varianti di front-end per lo stesso sito

Richiesta: una voce di menu **«Scegli UX»** da cui selezionare modalità di navigazione diverse. Il sito di oggi si chiama **UX_V1**; a breve arriverà una **UX_V2**.

**Cosa c'è adesso.** La pagina `/scegli-ux` (voce nel menu a panino, prima di «Come trattiamo i dati») elenca le varianti: **UX_V1 · Il sito come lo conosci**, selezionabile e attiva, e **UX_V2 · In arrivo**, annunciata ma non selezionabile — un riquadro tratteggiato, non un pulsante che non farebbe nulla.

**Dove vive l'elenco.** `lib/ux.ts`: una voce per variante con id, nome, descrizione, percorso d'ingresso e `disponibile`. Aggiungere UX_V2 vorrà dire una voce qui con `disponibile: true` e il suo percorso. **UX_V1 non è stata toccata**: le varianti nuove vivranno nelle loro rotte, così nessuna può rompere le altre.

**La scelta sta in un cookie**, non in `localStorage`, perché così la legge anche il server e la pagina nasce già con la variante giusta, senza il lampo di quella sbagliata. Lo scrive il browser: è una preferenza di interfaccia, non un dato da proteggere, e il server si limita a leggerla. Dura un anno. `varianteUx()` ripiega sempre su UX_V1 se il valore è sconosciuto, manomesso, o punta a una variante non ancora pronta: **un cookie non può attivare qualcosa che non esiste** (verificato con `regaloop.ux=v2` e con un valore storto).

Il nome del cookie usa il marchio nuovo (`regaloop.ux`), a differenza delle chiavi già in giro (`colletta.preferiti`, `colletta.listaRegali`): quelle hanno il vecchio prefisso solo per non far perdere a chi usa già il sito ciò che aveva salvato (sezione 20), mentre una chiave nuova non ha quel vincolo.

**Quello che ho lasciato fuori di proposito.** Nessun middleware e nessun dirottamento automatico verso la variante scelta: finché la V2 non esiste non so che forma avrà lo scambio, e costruirlo adesso vorrebbe dire indovinare. Il middleware è il posto naturale dove metterlo quando la V2 arriva. La pagina dice che collette, preferiti e lista dei regali **sono gli stessi in tutte le varianti**: cambia il front-end, non i dati.

**Verifiche.** Tipi, lint, 134 test (4 nuovi su `varianteUx`: predefinita, id unici, ripiego su valori storti o su una variante non pronta) e build passano. Sulla pagina servita: titolo, UX_V1 segnata «In uso adesso», UX_V2 presente ma non cliccabile (un solo `role="radio"` in pagina), `noindex`, e i due casi di cookie storto o prematuro che restano su UX_V1. **Non verificato in un browser:** il clic che scrive il cookie e il messaggio di conferma.

## 26. UX_V2 «Expressive Warmth»: fondamenta, home e primo passo della creazione

Materiale ricevuto in `Pagine_UX_V2/`: il design system (`regaloop_expressive_warmth/DESIGN.md`) e **due** layout HTML con screenshot — la **home mobile** e il **primo passo della creazione colletta**.

**Dove vive.** Tutto sotto `/v2`, con un layout suo. **UX_V1 non è stata toccata**: è la regola che ci eravamo dati alla sezione 25, e regge.

**I token senza rompere UX_V1.** Il problema: la tavolozza di UX_V2 usa nomi che qui esistono già con altri valori (`surface`, `error`). Risolto senza rinominare le classi dei mockup: i colori di UX_V2 stanno in variabili CSS dentro `.ux-v2` (globals.css) e i nomi Tailwind vi puntano. Dentro `.ux-v2` `--surface` vale `#f1fcf7`, fuori resta quello di UX_V1. Gli altri token (`surface-cream-card`, `forest-tint`, `tangerine-tint`, `gift-gold`…) sono nomi nuovi, aggiunti e basta. Lo stesso per la scala tipografica (`text-display-mobile`, `text-body-md`, `text-label-sm`…) e per le spaziature (`px-margin`, `gap-space-sm`…): additivi, non toccano niente di esistente. UX_V2 **non ha tema scuro**, come il design system.

**Caratteri e icone.** Titoli in Bricolage Grotesque, che il sito già carica; interfaccia in **Plus Jakarta Sans**, caricato con `next/font` solo in `/v2`. Le icone sono **Material Symbols**, come nei layout, ma il font si scarica **ridotto alle 28 icone che usiamo davvero** (parametro `icon_names` di Google Fonts) invece che intero. Perciò ogni icona nuova va aggiunta a `ICONE_V2` in `components/v2/Icona.tsx`: se no al suo posto compare il nome scritto.

**Le pagine sono collegate ai dati veri, non al finto dei mockup.**
- La card «Raccolta attiva» mostra la **colletta dimostrativa vera** (`/c/demo`): festeggiata, percentuale, raccolto, obiettivo, iniziali di chi ha confermato e conteggio arrivano da `avanzamento()` e dai partecipanti. Nei layout erano numeri inventati («Compleanno Marco», 180/200 €): mostrare dati finti come se fossero reali non va bene. Se la colletta demo non c'è, la card non compare.
- «Idee regalo in evidenza» prende i **primi due prodotti del catalogo** nell'ordine deciso nell'area riservata, con foto, prezzo e quota a testa calcolata con `quotaProposta` su 12 persone — le stesse 12 che il calcolatore della scheda prodotto propone.
- Le immagini `googleusercontent` dei mockup non sono entrate: erano segnaposto.

**Il primo passo della creazione funziona davvero.** Nome e occasione non restano nella pagina: vanno al wizard vero (`/crea?nome=…&occasione=…`), che ora legge quei due parametri e riparte da lì invece di richiedere le stesse cose. Le occasioni sono quelle del dominio; «Altro evento» non ne ha una corrispondente, quindi non passa nulla e la sceglie il wizard. Chi ha già l'accesso non si vede proporre il login.

### Quello che ancora NON c'è, ed è importante saperlo

I layout erano due, quindi le pagine di UX_V2 sono due. **I passi 2 e 3 della creazione, il catalogo, la scheda prodotto, la dashboard, la pagina di chi partecipa, il biglietto e «come funziona» non esistono in UX_V2**: la barra in basso ha già le voci «Catalogo», «Biglietto» e «Come funziona», che oggi puntano a pagine non ancora create. Il percorso della colletta si completa in UX_V1 (il wizard), quindi **funziona da cima a fondo**, ma a metà strada cambia aspetto.

Non ho inventato io le pagine mancanti: il design system dice come devono apparire i componenti, non come sono disposte quelle pagine, e indovinarlo avrebbe prodotto lavoro da rifare.

**Verifiche.** Tipi, lint, 135 test (1 nuovo: una variante non pronta non si attiva dal cookie) e build passano. Sulle pagine servite: tema applicato, font delle icone ridotto, hero e sezioni del mockup, barra in basso, dati veri nella card (43%, 50 € raccolti, la festeggiata della demo) e due prodotti veri del catalogo; sul primo passo, stepper, titolo, modulo, cinque occasioni e sezioni di rassicurazione. **Non verificato in un browser:** la resa a schermo delle due pagine e il passaggio da `/v2/crea` al wizard con i campi già pieni.

## 27. UX_V3 «Interactive Action»: home col simulatore, catalogo a due viste, creazione in una pagina

Materiale ricevuto in `Pagine_UX_V3/`: quattro layout (home, catalogo a griglia, catalogo a card singola, creazione colletta) e un `DESIGN.md` che è **identico** a quello di UX_V2 — stesso design system «Expressive Warmth», UX diversa.

**Conseguenza sul tema.** La classe dei token è stata rinominata da `.ux-v2` a **`.tema-warmth`** e la condividono le due varianti: il nome dice che è il design system, non la variante. UX_V1 resta fuori, com'è sempre stato.

**Le pagine.** `/v3` (home), `/v3/catalogo`, `/v3/crea`. I due layout del catalogo non sono due pagine: nei mockup sono lo **stesso** catalogo con un interruttore fra griglia e card singola, e così è stato fatto.

**Cosa c'è di vero sotto.**
- **Il simulatore della home** (budget + numero di amici → quota a testa) usa `quotaProposta`, la stessa funzione del wizard e della scheda prodotto: la cifra promessa in home è quella che si ritrova dopo. Le «idee pronte» sono prodotti veri del catalogo.
- **Il catalogo** monta i prodotti veri con filtri che filtrano davvero: destinatario, temi, sottocategorie e un intervallo di prezzo min/max, più ricerca testuale e tre ordinamenti (il primo è l'ordine deciso nell'area riservata). La quota a testa si aggiorna con il numero di amici.
- **La creazione** raccoglie festeggiato, fonte del regalo, budget, partecipanti e metodi di pagamento, e mostra l'anteprima del messaggio.

**Le categorie inventate dei mockup non sono entrate.** «Cose inutili ma belle», «Esperienze Gourmet», «Design & Casa» non corrispondono a nessun campo dei dati: un filtro che non filtra è peggio di un filtro in meno. Al loro posto ci sono i temi e le sottocategorie vere. Stesso discorso per i numeri decorativi («Oltre 450 idee», «+1.450 collette», «4.9/5 stelle», «Top Virale TikTok»): dove servivano cifre, si usano quelle vere (il conteggio dei prodotti), e le altre sono state tolte invece di inventate.

**Chi crea davvero la colletta resta il wizard.** `/v3/crea` **prepara** e poi passa tutto a `/crea` via parametri. Il wizard ora legge anche `festeggiato`, `persone` e `metodi` (che accendono le caselle dei pagamenti; il valore — nome Satispay, IBAN — si scrive lì, dove ha senso chiederlo). Rifare qui accesso, slug, scrittura su Firestore e dati di pagamento avrebbe duplicato la parte più delicata del sito in un secondo posto, con due versioni da tenere allineate.

**Niente vicoli ciechi.** «Biglietto» nella barra porta alla pagina di UX_V1, «Aiuto» scorre alla sezione «Come funziona» della home di UX_V3. Verificato seguendo **tutti** i link interni delle tre pagine: oltre 190 destinazioni, tutte 200.

**Quello che manca.** UX_V3 non ha una sua pagina prodotto, dashboard, pagina del partecipante o biglietto: si passa a UX_V1, che funziona. Il catalogo pesa **44,6 KB compressi** perché i 180 prodotti viaggiano al browser: è il prezzo dei filtri istantanei, e va tenuto d'occhio se il catalogo cresce molto.

**Verifiche.** Tipi, lint, 135 test e build passano. Sulle pagine servite: tema, icone ridotte all'elenco di UX_V3, hero e sezioni dei layout, simulatore, due viste del catalogo, filtri veri, conteggio reale (180), i tre passi della creazione e i metodi di pagamento. Il passaggio al wizard con i dati (`/crea?prodotto=…&persone=…&festeggiato=…&metodi=…`) risponde. **Non verificato in un browser:** tutta l'interazione — simulatore, filtri, scorrimento delle card, copia del messaggio — e la resa a schermo.

## 28. UX_V4: il nuovo front-end da Google Stitch, al posto di UX_V1

Materiale in `Pagine_UX_V4/`: il brief per Stitch (`PROMPT_STITCH_UX_V4.md`), l'export (23 schermate e un `DESIGN.md`, versione nuova di Expressive Warmth allineata al logo) e l'inventario con il confronto schermata per schermata (`INVENTARIO_UX_V4.md`). Lavoro sul branch `ux-v4`; lo stato di prima è l'etichetta git `ux-v1`.

**Sostituzione, non variante.** A differenza di V2 e V3, V4 copre tutte le pagine e prende il posto di V1 **sulle stesse rotte**: i link `/c/…` e `/b/…` girano già nelle chat e non devono cambiare. V1 si recupera da `ux-v1`. V2 e V3 (`/v2`, `/v3`, con i loro componenti e i token `.tema-warmth`) sono state tolte; il wizard non legge più i parametri che solo loro mandavano (`nome`, `festeggiato`, `metodi`): restano `occasione` (dal biglietto) e `persone` (dal catalogo). In «Scegli UX» resta UX_V4, predefinita; un cookie rimasto a `v1`, `v2` o `v3` ricade su V4 (testato).

**Logica intatta, aspetto nuovo.** Dominio, dati, regole e rotte server non cambiano, salvo il campo nuovo descritto sotto. L'HTML di Stitch è un riferimento visivo: le pagine sono componenti React collegati ai dati veri, con l'accessibilità di sempre (etichette, aree di tocco, fuoco al cambio di schermata).

**Fondamenta.**
- La palette V4 vive nei **token di sempre** (`--surface`, `--ink`, `--accent`…), così ogni pagina ha preso i colori nuovi senza toccarla; nuovi `--cta` (arancio del logo, #FD5D17), `--gold-vivo`, `--line-forte`, ombre `carta` e `sollevata`, raggi 24/16 px.
- **Niente tema scuro**: il design system non lo prevede. Il logo ha una sola versione.
- Testo in **Plus Jakarta Sans** (al posto di IBM Plex Sans), titoli in Bricolage Grotesque fino a 800, icone **Material Symbols** con il font ridotto all'elenco di `components/ui/Icona.tsx`: un'icona non elencata compare come parola scritta (il tipo `NomeIcona` lo impedisce in compilazione).
- **Contrasto dell'arancio.** Il bianco su #FD5D17 arriva a 3,1:1: basta solo come testo grande, cioè da 14 pt (18,7 px) in grassetto. La variante «azione» di `Bottone` e i pulsanti arancio scritti a mano usano 19 px; i numeri piccoli sull'arancio (contatori) sono scuri. Il verde di WhatsApp con il bianco è a 2:1: lì il testo è scuro.
- Intestazione con il tondo del profilo (voci secondarie) e, sul telefono, **barra di navigazione in basso** (Home, Catalogo, Trova regalo, Preferiti, Collette); non c'è nei percorsi a passi (`/crea`, `/gestisci`, `/accedi`), dove in fondo stanno i pulsanti del passo. Le pagine di chi partecipa e di chi firma non hanno menu né profilo.

**Scelte pagina per pagina dove il disegno taceva o andava corretto.**
- **Catalogo**: filtri, ricerca (`q`), persone della simulazione (`persone`) e quanti prodotti si vedono (`mostra`, 24 alla volta) stanno nell'indirizzo: la pagina filtrata resta condivisibile e resa sul server.
- **Trova il regalo**: riscritto con i componenti V4; tolti il foglio di stile di 876 righe e i caratteri del sito di partenza. Gli interessi non hanno una descrizione nei dati: schede con icona e nome, in due colonne. L'occasione «Altro» aveva un'icona invisibile (disegno in scala 24×24 in un riquadro 960×960): ora usa il regalo.
- **Wizard a 5 passi**: «La quota» e «Come ti pagano» in una schermata; nello stato restano i passi 3 e 4 (bozza e ripresa dalla sessione invariate). La modalità sorpresa è passata all'ultimo passo, accanto all'anteprima del link che cambia.
- **Chi partecipa**: metodo e «Hai pagato?» in una schermata; la vecchia schermata finale coincide ora con quella di stato, la stessa che vede chi riapre il link. Le dediche degli altri **non** compaiono nell'anteprima del biglietto né nel rendiconto, perché la pagina pubblica non riceve i messaggi altrui (`righePubbliche`).
- **Dashboard**: linguette Tutti / Confermati / In attesa / Da sollecitare; le azioni di ogni riga dietro «⋯». Niente sollecito al singolo (non abbiamo recapiti): restano i promemoria al gruppo.
- **Votazione**: niente «Salva i miei voti», perché ogni stella si salva al tocco (la pagina lo dice).
- **Testi di Stitch scartati** perché falsi o inventati: pagamenti con Amazon Pay, carte o Apple Pay, «bonifico sul conto dell'organizzatore a fine evento», PDF scaricabile, «link magico», «Ritrova la tua firma» da un altro dispositivo, promemoria «automatici», «ricevuta verificata», prezzi barrati, recensioni e numeri decorativi, categorie e interessi che non esistono nei dati, il dominio `regaloop.it`.

**Campo nuovo: «Ruolo o parentela» di chi firma il biglietto.** Facoltativo, `ruolo` sulla firma, ripulito e tagliato a 40 caratteri sul server (`MAX_RUOLO`). Si scrive in «Come ti firmi?» con quattro scelte rapide neutre, si vede **sotto la firma sul biglietto** (quindi anche dal festeggiato) e nell'elenco firme di chi organizza. Le firme salvate prima non ce l'hanno (il campo è opzionale nel tipo). I dati del biglietto passano solo dalle rotte server: nessuna regola Firestore da cambiare. Verificato nel test delle rotte del biglietto; la pagina «Come trattiamo i dati» lo cita.

**Rimandato a dopo il rilascio:** la foto nel messaggio del biglietto della colletta (nuovo campo, caricamento, regole e test).

**Verifiche.** Tipi, lint, 136 test e build passano. Ogni gruppo è stato percorso nel browser a 390 px in modalità senza Firebase, con un browser pilotato via DevTools Protocol: home, catalogo con filtri, scheda prodotto, Trova il regalo fino ai risultati, preferiti, accesso; wizard dal prodotto all'apertura, dashboard, chiusura; partecipante dalla prima schermata allo stato, rendiconto e votazione (con dati simulati); biglietto: primo passo di chi organizza e tutto il percorso di chi firma, ruolo compreso. **Non verificato:** nulla con Firebase vero (accesso Google, scritture reali, firme lette dal database), nessun telefono reale, e le pagine di chi organizza il biglietto dal secondo passo in poi (dettagli, copertina, anteprima, gestione), che hanno preso lo stile dai componenti comuni ma non sono state guardate a schermo.

## 29. Da «Regaloop» a «Gifty»: nome e logo

Richiesta: cambiare nome e logo del progetto in **Gifty**, con il logo consegnato, su tutte le pagine.

**Il logo.** L'originale (PNG 2066×761 con fondo trasparente) è in `marchio/gifty-originale.png`; gli asset si ricavano con `scripts/genera_marchio.py` (solo libreria standard, rilanciato: dà file identici). Lo script toglie l'alone semitrasparente del ritaglio (alfa sotto 40, dove stavano le macchioline rosse visibili attorno alle forme) e cerca puntini staccati (non ce n'erano), ritaglia al disegno e riduce con media a scatola su alfa premoltiplicato. Colori del marchio campionati: **arancio #FE6801**, **verde #035C32**.

| file | cosa è | uso |
|---|---|---|
| `public/logo/gifty.png` (350×120) | logo completo | intestazioni del sito, della pagina di chi partecipa e del biglietto (36 px di altezza) |
| `public/logo/gifty-icona.png` (256×256) | la scatola regalo, quadrata | sorgente della favicon (`app/icon.png`, uguale) |
| `public/logo/gifty-icona-chiara.png` (256×256) | la scatola con il verde schiarito (#E7EFEA) | anteprime social, che hanno il fondo verde scuro #0B5E4C, dove il verde del logo sparirebbe |

I file `regaloop*.png` sono stati tolti. Il logo completo ha proporzioni più compatte del vecchio (2,9:1 contro 3,8:1): alle intestazioni è passato da 28 a 36 px di altezza, per occupare circa lo stesso spazio.

**Dove è cambiato il nome:** `metadata` (titolo, modello `%s · Gifty`, `applicationName`), `siteName` dell'anteprima della colletta, nome nelle due immagini social (`NOME_PROGETTO` in `lib/marchio.ts`), occhiello della home, testi «Gifty non tocca i tuoi soldi» (partecipante, wizard, scheda prodotto, votazione, rendiconto), etichette accessibili del logo, README.

**Cosa NON è cambiato, di proposito** (come alla sezione 20): la parola «colletta» (è il nome della cosa, non del marchio); le chiavi del browser `colletta.*` e il cookie `regaloop.ux` della scelta d'interfaccia (rinominarli farebbe perdere a chi usa già il sito preferiti, lista e scelta); l'infrastruttura (pacchetto, backend App Hosting `colletta`, database `colletta`, indirizzo `*.hosted.app`), da affrontare insieme a un dominio vero.

**Da decidere:** il verde del nuovo logo (#035C32) è più chiaro del verde dell'interfaccia (`--accent` #033922, il verde del logo Regaloop su cui è costruita la palette V4). Convivono bene, ma non sono la stessa tinta; l'arancio (#FE6801 contro #FD5D17) è quasi identico. Allineare la palette al nuovo logo è un lavoro a parte, da fare guardando i contrasti (il verde nuovo con il bianco regge comunque l'AA).

## 30. Catalogo: filtri riordinati, «Nessun filtro» e categoria «Design»

Richiesta con un mockup (pagina attuale / modifiche da fare) sul foglio dei filtri del catalogo.

- **Ordine:** Prezzo, Per chi, Categoria (prima: Per chi, Tema, Tipo, Prezzo).
- **«Nessun filtro»** in fondo al prezzo e **«Uomo + Donna»** in fondo a Per chi: tolgono il filtro del gruppo e sono evidenziati quando nel gruppo non è scelto niente. Scelta confermata da Stefano: «Uomo + Donna» vuol dire «mostra tutti», non «solo i prodotti per entrambi» (che sarebbero 177 su 180, quasi la stessa cosa).
- **Categoria** al posto di Tema e Tipo: Tecnologia, Arredamento, **Design**, Viaggio. «Design» non è un tema nei dati: sono i 50 pezzi del pacchetto «arredamento e design», cioè i prodotti con una sottocategoria (lampade, vasi, specchi, sedie…), tutti anche in Arredamento (che ne conta 103). Nell'indirizzo resta `tema=` (con il valore `design`), così i link condivisi con un tema continuano a valere.
- **Il filtro per tipo è tolto** (scelta confermata): un link vecchio con `tipo=` si apre e lo ignora, mostrando il catalogo senza quel filtro.

Verificato nel browser a 390 px: il foglio nell'ordine nuovo, «Design» 50 idee, «Arredamento» 103, un vecchio link `tipo=specchi` 180.

## 31. Biglietto di esempio («Guarda un esempio»)

Richiesta: sotto «Crea un biglietto» nella home, un pulsante che mostri un biglietto già firmato da cinque persone, con messaggi e piccole foto nella pagina 2.

- **Pagina** `/biglietto/esempio` (fuori dai motori di ricerca), componente `components/biglietto/EsempioBiglietto.tsx`. Usa lo stesso `Visualizzatore` dei biglietti veri e si apre sulla pagina 2; la copertina («Palloncini», «Buon compleanno Giulia!») è una pagina indietro. In fondo, «Crea il tuo biglietto».
- **Tutto inventato e dichiarato come tale** («Nomi, messaggi e foto sono di esempio»): nulla viene letto dal database né salvato. Ogni messaggio ha un carattere e un colore diversi e il ruolo («Collega», «Famiglia»…), così si vedono anche lo stile del testo e il campo della sezione 28.
- **Le «foto» sono illustrazioni** generate nella pagina (sfumatura ed emoji), come nella pagina di prova interna: niente immagini di persone vere. Sono larghe e basse (5:2) perché i cinque messaggi stiano tutti nella pagina 2 su due colonne (verificato: «2 di 2»).
