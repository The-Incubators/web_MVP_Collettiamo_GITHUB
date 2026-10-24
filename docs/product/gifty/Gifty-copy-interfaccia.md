# Gifty: copy per la proposta di interfaccia

24 ottobre 2026. Italiano, mercato italiano, testo rivolto all’organizzatore quando non è indicato un altro ruolo. Questo inventario contiene copy proposto per il prototipo, non funzionalità dichiarate disponibili sul sito attuale. Le variabili tra parentesi graffe devono provenire dai dati della singola iniziativa. Gli esempi del prototipo sono dichiarati come tali.

## Regole applicate

Titoli e azioni senza punto finale, anche quando il titolo va su più righe. Nessuna promessa di incasso, acquisto, reminder automatico, riservatezza o commissione garantiti. La pagina mostra oggetto, importi, stato e azioni; il testo aggiuntivo resta soltanto quando serve a comprendere una conseguenza o un trattamento dei dati.

Fonti di prodotto: [flussi e decisioni](Gifty-flussi-e-decisioni.md) e richieste di Cri nella conversazione. La ricerca [competitor](Gifty-analisi-competitor.md) serve a comprendere le diverse categorie di servizio; non fornisce promesse o testi da trasferire a Gifty.

## Inventario delle stringhe

| Chiave | Schermata ed elemento | Testo proposto | Fonte o condizione |
|---|---|---|---|
| `home.hero` | Home, titolo | Scegli il regalo di gruppo e tieni il conto delle quote | Due problemi descritti da Cri: scelta e quote; singolare rivolto a chi organizza |
| `home.organise` | Home, azione principale | Organizza un regalo di gruppo | Ingresso principale deciso da Cri |
| `home.browse` | Home, azione secondaria | Esplora le idee regalo | Catalogo disponibile senza imporre la scelta prima delle adesioni |
| `start.title` | Creazione, titolo | Per chi è il regalo? | Serve a raccogliere il destinatario |
| `start.recipient` | Creazione, campo | Nome festeggiato/a | Destinatario dell’iniziativa |
| `start.occasion` | Creazione, campo | Occasione | Dato già presente nel modello attuale |
| `start.branch` | Creazione, scelta | Da dove vuoi iniziare? | Domanda operativa con due risposte visibili |
| `start.pledgesFirst` | Creazione, prima scelta | Raccolgo adesioni prima | Primo percorso esplicito di Cri |
| `start.giftFirst` | Creazione, seconda scelta | Scelgo il regalo prima | Secondo percorso esplicito di Cri |
| `start.date` | Creazione, campo | Data celebrazione | Non assume ancora che coincida con spedizione o consegna fisica |
| `quote.title` | Quota, titolo | Quanto mettiamo a testa? | Percorso senza regalo scelto |
| `quote.amount` | Quota, campo importo | Quota proposta a testa | Importo discusso dal gruppo; non è un addebito |
| `quote.expectedPeople` | Quota, campo numero | Persone previste | Ipotesi iniziale, distinta dagli aderenti effettivi |
| `quote.estimate` | Regalo scelto, importo calcolato | {quota} a testa in {persone} | Solo quando quota e divisore sono disponibili; includere simbolo di valuta nel valore |
| `quote.save` | Modifica della quota, azione | Salva la quota | L’organizzatore riporta l’accordo preso in chat; nessuna riconferma individuale obbligatoria |
| `gift.browseTitle` | Catalogo, titolo | Trova il regalo per {nome} | Ricerca contestuale all’iniziativa |
| `gift.propose` | Scheda prodotto, azione | Proponi al gruppo | Salva una proposta; non avvia un acquisto |
| `gift.externalLink` | Regalo esterno, campo | Link del regalo | Percorso con prodotto già individuato |
| `invite.title` | Invito, titolo | Il regalo di gruppo per {nome} | Identifica subito l’iniziativa |
| `invite.proposedQuota` | Invito, etichetta importo | Quota proposta | Evita di presentare una stima come pagamento definitivo |
| `invite.joined` | Invito, conteggio | {numero} persone hanno aderito | Numero di adesioni effettive; non di invitati in chat |
| `invite.join` | Invito, nuovo utente | Iscriviti e partecipa | Iscrizione necessaria per aderire, come richiesto da Cri |
| `invite.decline` | Invito, azione secondaria | Non partecipo | Mostrare se il percorso registra la rinuncia senza adesione |
| `invite.open` | Invito, stato | Adesioni aperte | Solo prima dell’evento di chiusura stabilito dal prodotto |
| `signup.title` | Iscrizione, titolo | Crea il tuo account | Account richiesto a organizzatore e partecipante |
| `signup.name` | Iscrizione, campo | Nome | Dato di riconoscimento nel gruppo |
| `signup.email` | Iscrizione, campo | Email | Usare solo se email è il recapito scelto per l’accesso; metodo finale da confermare |
| `signup.create` | Iscrizione, azione | Crea il mio account | Non promette iscrizione alla newsletter |
| `signup.privacyLink` | Iscrizione, collegamento | Informativa privacy | Il testo legale finale dipende da titolare e trattamenti effettivi |
| `signup.newsletterOptIn` | Iscrizione, scelta facoltativa | Voglio ricevere via email idee regalo e novità di Gifty | Consenso marketing distinto, non preselezionato; finalità da confermare nel servizio newsletter |
| `workspace.title` | Gestione, titolo | Il regalo per {nome} | Area dell’iniziativa, non portafoglio di pagamento |
| `workspace.budget` | Gestione, importo | Budget previsto | Calcolato dalle adesioni; non confondere con denaro incassato |
| `workspace.received` | Gestione, importo | Ricevuto | Somma dei versamenti confermati da chi organizza |
| `workspace.outstanding` | Gestione, importo | Da ricevere | Saldo ancora dovuto, non ammontare dei soli pagamenti dichiarati |
| `workspace.people` | Gestione, sezione | Partecipanti | Elenco degli aderenti; eventuali invitati vanno distinguibili |
| `workspace.changeGift` | Gestione, azione | Cambia regalo | Modifica dell’organizzatore dopo accordo nel gruppo |
| `workspace.quota` | Gestione, campo in tabella | Quota a persona | Campo sempre disponibile nella tabella; il salvataggio conserva i versamenti e non richiede riconferme individuali |
| `workspace.share` | Gestione, azione | Condividi il link | Apre una modale e mantiene la pagina del gruppo; copiare il link non equivale a inviare un messaggio |
| `send.title` | Riepilogo invio, titolo | Invia il regalo a {nome} | Evento di invio al destinatario, distinto dall’acquisto |
| `send.closesJoins` | Riepilogo invio, conseguenza | Dopo l’invio non potranno aggiungersi altre persone | Da usare nel prototipo solo con P01: chiusura alla consegna digitale ancora da confermare |
| `send.confirm` | Riepilogo invio, azione principale | Invia al festeggiato | Testo per l’esempio Mauro; versione personalizzata preferita: “Invia a {nome}” |
| `send.back` | Riepilogo invio, azione secondaria | Torna al gruppo | Consente di controllare gli aderenti prima dell’invio |
| `recipient.title` | Destinatario, apertura | Un regalo per te, {nome} | Presentazione del regalo prima dell’acquisto fisico |
| `recipient.proposal` | Destinatario, regalo proposto | Abbiamo pensato a questo per te | Accompagna il prodotto, non sostituisce nome e immagine |
| `recipient.keep` | Destinatario, azione principale | Scelgo questo regalo | Registra la scelta; non ordina e non addebita |
| `recipient.alternatives` | Destinatario, azione secondaria | Guardo le alternative | Apertura delle opzioni ammesse dal budget e dal catalogo |
| `recipient.selected` | Destinatario, esito | Hai scelto {regalo} | Conferma soltanto la scelta salvata, non la spedizione |
| `organiser.buyAmazon` | Organizzatore, acquisto esterno | Acquista su Amazon | Collegamento esterno scelto dall’organizzatore; niente checkout delegato da Gifty |
| `payment.title` | Partecipante, titolo | La tua quota per {nome} | Riepilogo dell’importo corrente |
| `payment.amount` | Partecipante, importo | Da dare a {organizzatore} | Pagamento diretto a chi organizza |
| `payment.method` | Partecipante, scelta | Come vuoi pagare? | Solo i metodi effettivamente configurati dall’organizzatore |
| `payment.declare` | Partecipante, azione | Ho pagato | Dichiarazione, distinta dalla conferma del ricevimento |
| `payment.pending` | Partecipante, stato | In attesa della conferma di {organizzatore} | Stato successivo alla dichiarazione, prima della verifica dell’organizzatore |
| `payment.received` | Partecipante, stato | Quota ricevuta | Solo dopo conferma di chi organizza |
| `payment.confirmReceived` | Organizzatore, azione sulla riga | Conferma di aver ricevuto {importo} | Operazione che registra denaro ricevuto; importo esplicito |
| `closed.title` | Invito dopo la consegna, titolo | Le adesioni sono chiuse | Blocca nuovi ingressi, come deciso da Cri |
| `closed.reason` | Invito dopo la consegna, stato | Il regalo è stato consegnato | Evitare nomi o altri dettagli privati se il visitatore non è autorizzato |
| `closed.existingMember` | Invito chiuso, accesso esistente | Accedi al tuo gruppo | Solo per la proposta di mantenere accesso agli iscritti; non apre una nuova adesione |
| `common.loading` | Caricamento | Caricamento in corso | Indicatore transitorio, non un risultato vuoto |
| `common.retry` | Errore recuperabile, azione | Riprova | Ripete soltanto l’operazione fallita |
| `common.saveError` | Salvataggio fallito | Le modifiche non sono state salvate | Mostrare soltanto su errore confermato; conservare i dati inseriti |
| `common.save` | Modifica, azione | Salva le modifiche | Riferita all’oggetto modificato nella schermata |
| `common.saved` | Modifica, esito | Modifiche salvate | Solo dopo salvataggio riuscito |
| `common.missingName` | Campo destinatario, errore | Scrivi il nome di chi festeggiamo | Errore vicino al campo, senza cancellare gli altri valori |
| `members.grant` | Gestione ruoli, azione | Rendi co-organizzatore | Mostrare prima i permessi che verranno concessi; configurazione ancora proposta |
| `members.revoke` | Gestione ruoli, azione | Rimuovi il ruolo di co-organizzatore | Revoca il ruolo, non elimina la partecipazione |
| `members.invitePermission` | Gestione ruoli, permesso | Può invitare altre persone | Separato dai permessi sui dati economici e sugli acquisti |
| `newsletter.title` | Modulo newsletter, titolo | Idee regalo nella tua email | Invito separato dall’adesione al gruppo |
| `newsletter.subscribe` | Modulo newsletter, azione | Iscrivimi alla newsletter | Azione esplicita di marketing, non registrazione al servizio |
| `newsletter.confirmEmail` | Newsletter, stato | Controlla la tua email per confermare l’iscrizione | Solo con double opt-in effettivamente implementato e messaggio inviato |

## Testi da non anticipare

- Non scrivere “Il regalo è stato acquistato” dopo il clic su “Acquista su Amazon”: il clic non dimostra il completamento dell’ordine
- Non scrivere “Hai pagato” dopo “Ho pagato”: l’esito corretto è l’attesa della conferma di chi organizza
- Non scrivere “Reminder inviato” dopo una semplice copia del link o del messaggio
- Non promettere “Cambia gift card” finché il fornitore e lo stato di emissione non consentono quell’operazione
- Il prezzo del biglietto e degli extra viene dalla decisione commerciale e dalla relativa costante: nessun importo definitivo viene introdotto qui

## Punti aperti per la resa

1. P01: confermare che il momento che chiude le adesioni sia l’invio digitale al destinatario. La stringa della conseguenza dipende da questa interpretazione
2. Anteprima prima dell’iscrizione: proposta di UX, non decisione approvata. Se non viene adottata, l’invito mostra solo quanto autorizzato prima dell’accesso
3. Accesso degli iscritti dopo la consegna: proposta per consentire biglietto e saldo della propria quota. Non interpretare il pulsante di accesso come apertura di nuove adesioni
4. Titolare, termini, metodo d’accesso e canale dei reminder: non ancora definiti; non scrivere affermazioni legali o invii che presuppongano queste scelte

## Verifica editoriale

Inventario letto integralmente con find-ai-slop, incluse etichette, stati, titoli, condizioni e testi del documento. Eliminati lo slogan “Al gruppo ci pensa Gifty”, una formulazione al plurale incoerente con l’azione dell’organizzatore e descrizioni che avrebbero duplicato i controlli. Nessun punto finale nei titoli dell’interfaccia, nessun em dash. Le frasi informative conservano la punteggiatura normale. La verifica sul rendering e sulle immagini resta al lead e a ux-reviewer; questo file non la sostituisce.

## Interfaccia di gestione e footer

Le email aggiunte sono indicate come “Da invitare”, con azione “Aggiungi alla lista”. Non aumentano gli aderenti o il budget. Il footer usa “Scegli il regalo e organizza le quote”, le sezioni “Idee regalo” e “Regali di gruppo” e il collegamento “Privacy e dati”. La consegna registrata dall’organizzatore usa “Conferma consegna” e “Consegna registrata”; nessuna dicitura dichiara un invio automatico. Il profilo locale usa “Il tuo nome”, “Continua” e “Salva il nome”, senza promettere autenticazione non collegata.
