# Gifty: flussi e decisioni per guidare il lavoro

Specifica di lavoro del 24 ottobre 2026. Destinatari: Cri, Stefano e chi prepara design, copy, modello dei dati, codice e verifiche. Il documento descrive il prodotto da costruire; non attesta funzionalità già disponibili. Il codice esaminato è il commit `2eddae8` nel worktree separato. Il sito pubblicato, i dati reali e gli accordi commerciali non sono stati verificati in questa attività.

## 1. Obiettivo e uso della specifica

Gifty aiuta chi organizza un regalo di gruppo a scegliere cosa regalare, formare il gruppo, seguire le quote e presentare il regalo al destinatario. L’iniziativa può nascere senza un prodotto scelto oppure da una proposta precisa. Entrambi i percorsi confluiscono nello stesso gruppo, senza costringere chi parte dalle adesioni a inventare prima un regalo.

L’organizzatore mantiene il controllo. Il gruppo discute normalmente su WhatsApp e l’organizzatore riporta gli accordi in Gifty. L’app non richiede di ripetere ogni discussione, approvare ogni variazione individualmente o trasferire tutta la conversazione su un’altra piattaforma. Deve rendere visibili il regalo corrente, gli aderenti, la quota e i versamenti effettivi.

Questa è la direttrice dei lavori richiesta da Cri. La copia nel repository è `docs/product/gifty/Gifty-flussi-e-decisioni.md`; le copie consegnate nella cartella `outputs` sono esportazioni di lettura dello stesso insieme di specifiche. Ogni nuova schermata e modifica deve indicare quale decisione, regola e criterio di accettazione serve. Le proposte aperte non diventano decisioni perché compaiono in un mockup. Il primo mockup generato nella conversazione è superato: privilegiava il catalogo e non rappresentava correttamente i due ingressi e il controllo dell’organizzatore.

Documenti collegati: [analisi competitor](Gifty-analisi-competitor.md), [proposta UX/design](Gifty-proposta-UX-design.md) e inventario [Gifty-copy-interfaccia.md](Gifty-copy-interfaccia.md). Il copy del prototipo usa quest’ultimo inventario. La chiave `home.hero` identifica il titolo della home; questa specifica non introduce un titolo alternativo. Prima di suggerire nuovo copy si applica find-ai-slop all’intero testo, in qualsiasi lingua, e nuovamente dopo ogni revisione, comprese le parole dentro immagini e mockup.

## 2. Gerarchia delle fonti e provenienza

Le richieste di Cri nella conversazione definiscono i requisiti correnti. I suoi chiarimenti successivi prevalgono sulle interpretazioni precedenti dell’assistente. La call del 15 ottobre fornisce contesto e idee discusse; il repository descrive ciò che esiste. Le fonti ufficiali esterne servono a verificare capacità e vincoli di fornitori e norme, senza trasformarsi in autorizzazioni a integrare servizi o sostenere spese.

| Fonte | Contenuto utilizzato | Come va trattato |
|---|---|---|
| Prima richiesta di revisione | Scelta del regalo e raccolta delle quote, qualità di UX/copy/codice | Obiettivo del lavoro |
| Richiesta con nuovi input | Due percorsi, mercato italiano, registrazione, newsletter, alternative del destinatario, extra e deleghe | Requisiti e idee da valutare, con stato distinto |
| Chiarimento successivo | Accordi su WhatsApp, organizzatore acquirente, adesioni fino alla consegna | Decisioni correnti sui flussi |
| Richiesta attuale | Documento molto dettagliato come direttrice, poi competitor e proposta UX/design | Ordine e forma del lavoro |
| Call, 23:18–25:31 | Scelta, recupero quote, biglietto e momento della consegna | Evidenza del problema e delle idee |
| Call, 42:18–44:18 | Affiliazione ed extra con costo visibile | Ipotesi commerciali, nessun listino approvato |
| Call, 57:16–59:12 | Presentazione del regalo e alternativa prima dell’acquisto | Origine del percorso del destinatario |
| Call, 71:35–72:42 | Il gruppo si forma tramite chi apre il link e aderisce | Evitare l’importazione obbligatoria della rubrica |
| Call, 73:19–75:33 | Ingressi tardivi, quote e soldi all’organizzatore | Discussione poi precisata da Cri |

La trascrizione ha etichette dei parlanti incoerenti: gli orari sono più affidabili dell’attribuzione automatica di ogni frase. Dati sul mercato, percentuali di commissione e possibili partnership citati nella call non sono validati in questo documento.

## 3. Registro delle decisioni e degli indirizzi di Cri

“Deciso” indica una regola del prodotto espressa da Cri. “Da valutare” indica che Cri ha chiesto di esaminare una possibilità, senza approvarne prezzo, fornitore o implementazione. Gli identificativi consentono di collegare design e verifiche alla richiesta senza riscriverla.

| ID | Stato | Decisione o indirizzo |
|---|---|---|
| D01 | Deciso | Il servizio è pensato per il mercato italiano |
| D02 | Deciso | Affronta sia la scelta del regalo sia l’organizzazione delle quote |
| D03 | Deciso | L’organizzazione del regalo di gruppo è il flusso da rendere chiaro; il catalogo ne sostiene la scelta |
| D04 | Deciso | Si può iniziare senza regalo scelto, proporre una quota e formare un budget dalle adesioni |
| D05 | Deciso | Si può partire da un regalo scelto e da una stima della quota basata sul numero di persone |
| D06 | Deciso | Discussioni e accordi ordinari possono restare nel gruppo WhatsApp |
| D07 | Deciso | Il gruppo può cambiare regalo o concordare una spesa diversa; l’organizzatore aggiorna l’app |
| D08 | Deciso | Chi organizza si iscrive al servizio |
| D09 | Deciso | Chi aderisce tramite l’invito si iscrive al servizio |
| D10 | Deciso come esigenza | Iscrizione e partecipazione devono includere informazione e gestione corretta dei dati e delle comunicazioni |
| D11 | Deciso come funzionalità richiesta | Va prevista l’iscrizione alla newsletter, con trattamento separato e facoltativo rispetto al servizio |
| D12 | Indirizzo iniziale | Evitare di custodire il denaro del gruppo; i soldi vanno all’organizzatore |
| D13 | Deciso per il percorso descritto | È l’organizzatore a effettuare l’acquisto e disporre la spedizione |
| D14 | Deciso per la variante descritta | Il festeggiato può vedere il regalo pensato per lui e decidere se tenerlo prima dell’acquisto |
| D15 | Deciso per il percorso Amazon | L’organizzatore segue il link dal catalogo e completa personalmente l’acquisto su Amazon |
| D16 | Deciso | Prima della consegna possono aggiungersi persone |
| D17 | Deciso | Dopo la consegna non possono aggiungersi nuovi partecipanti |
| D18 | Deciso | L’organizzatore controlla l’invio del regalo e continua a occuparsi della riscossione |
| D19 | Richiesta di funzionalità | L’organizzatore può attribuire ad altri la facoltà di invitare; la portata degli altri permessi va progettata |
| D20 | Da valutare | Extra a pagamento, compreso un biglietto cofirmato con possibile prezzo per partecipante |
| D21 | Da valutare | Gift card con possibilità di scelta e momento di consegna condiviso tramite call |
| D22 | Deciso il 24 ottobre 2026 | Direzione A per un prototipo navigabile dei due ingressi, con viste organizzatore, partecipante e festeggiato, nel worktree separato senza modificare main |
| D23 | Correzione di Cri il 24 ottobre 2026 | Il prototipo deve mantenere lo stile e le grafiche della tavola approvata, compreso il marchio, e conservare le funzioni di navigazione di Stefano: Home, Catalogo, Trova regalo, Preferiti, Collette e menu profilo |
| D24 | Chiarimento di Cri il 24 ottobre 2026 | L’immagine occupa tutta la hero a schermo; titolo e pulsanti sono sovrapposti allo sfondo fotografico, non in un blocco separato prima della foto |
| D25 | Modifiche di Cri il 24 ottobre 2026 | Interfaccia della web app senza linguaggio provvisorio, footer completo, freccia dei select distanziata, diciture italiane richieste, quota modificabile nella tabella, condivisione in modale, gestione persone ed email nella pagina e due idee regalo entro il budget effettivo |

Queste righe non autorizzano azioni esterne o live. Il valore di 0,50 € resta un esempio. La newsletter facoltativa deriva dalla separazione delle finalità, non da un obbligo di marketing imposto da Cri.

## 4. Regole che ogni soluzione deve rispettare

| ID | Regola verificabile |
|---|---|
| R01 | Invitati, aperture del link e aderenti sono conteggi diversi |
| R02 | Il budget basato sulle adesioni non viene presentato come denaro ricevuto |
| R03 | Una persona iscritta ha una sola partecipazione alla stessa iniziativa |
| R04 | Il percorso senza regalo rappresenta l’assenza del prodotto, senza prodotti fittizi |
| R05 | Cambiare la quota non riscrive gli importi storici già ricevuti |
| R06 | Il gruppo può concordare le variazioni in chat, senza riconferma individuale obbligatoria nell’app |
| R07 | La prima quota ricevuta non determina da sola la chiusura delle adesioni |
| R08 | Una consegna effettuata blocca tutte le vie di aggiunta, anche quelle manuali o delegate |
| R09 | Il controllo di adesione viene eseguito quando il server salva, non soltanto quando si apre il link |
| R10 | Consegna digitale, acquisto e spedizione fisica sono fatti distinti |
| R11 | Il clic su Amazon non dimostra ordine effettuato o commissione maturata |
| R12 | La dichiarazione “Ho pagato” non incrementa il denaro ricevuto |
| R13 | Solo chi dispone del permesso di verifica può confermare il ricevimento |
| R14 | Una rinuncia non cancella un versamento registrato; un’eventuale restituzione resta distinta |
| R15 | Un permesso di invitare non concede automaticamente accesso ai dati economici privati |
| R16 | Rifiutare la newsletter non impedisce iscrizione, adesione e gestione del regalo |
| R17 | Prezzi, condizioni e funzionalità non disponibili non vengono inventati nel copy |
| R18 | Titoli senza punto finale; spiegazioni affidate prima a controlli, esempi e illustrazioni accessibili |

## 5. Proposte e punti aperti da non promuovere a decisioni

| ID | Punto | Assunzione utile al prototipo | Cosa cambia se non viene adottata |
|---|---|---|---|
| P01 | Momento che chiude le adesioni | Invio digitale al destinatario da parte dell’organizzatore | Va spostato il controllo al diverso evento di consegna concordato |
| P02 | Accesso degli iscritti dopo consegna | Conservare biglietto e gestione della propria quota | Serve un altro percorso per saldare e ricevere conferme |
| P03 | Anteprima prima dell’iscrizione | Mostrare dati minimi dell’iniziativa prima del login | L’accesso richiede subito identificazione, con conseguente maggiore attrito |
| P04 | Identità del destinatario | Accesso dedicato, senza visibilità dei dati del gruppo | Vanno definiti account, link personale, recupero e durata |
| P05 | Acquisto degli extra | Un acquisto dell’organizzatore, costo eventualmente ripartito | Checkout individuali richiedono un percorso e una riconciliazione diversi |
| P06 | Quota dell’organizzatore | Chiedere esplicitamente se partecipa alla divisione | Conteggio e quota cambiano; non dedurlo dal fatto che compra |
| P07 | Centesimi e restituzioni | Riepilogo trasparente di differenze e destinazioni | Serve una regola commerciale per ogni residuo |
| P08 | Gift card | Scelta prima dell’emissione mediante prodotto del fornitore | Dopo emissione valgono le condizioni specifiche della carta |
| P09 | Call | Data, ora e link esterno inseriti dall’organizzatore | Automazione video e calendari diventano un’integrazione distinta |
| P10 | Reminder | Canale scelto e comunicazioni riferite alla singola iniziativa | Frequenza, costi e fornitore cambiano per email, SMS o WhatsApp |
| P11 | Co-organizzatori | Permessi separati, revocabili | Un ruolo unico molto ampio aumenta dati e azioni accessibili |
| P12 | Privacy operativa | Informativa basata su titolare e fornitori reali | Non è pubblicabile una policy completa senza questi dati |
| P13 | Votazione | Funzione disponibile quando serve, non obbligatoria per ogni gruppo | Un voto vincolante richiederebbe regole e gestione dei pareggi |
| P14 | Invio fallito o incerto | Operazione ripetibile con identificativo stabile e stato visibile | Va definito quando chiudere o ripristinare le adesioni senza duplicare l’invio |

## 6. Persone, bisogni e contesto d’uso

| Persona | Obiettivo | Quando arriva | Cosa deve poter fare | Cosa non va presunto |
|---|---|---|---|---|
| Organizzatore | Portare a termine il regalo e sapere chi ha dato la quota | Da una chat già aperta o dalla home | Creare, invitare, scegliere, modificare, consegnare, acquistare, registrare versamenti | Che conosca già numero finale, prodotto o metodo di pagamento |
| Partecipante | Aderire e sapere quanto e a chi dare | Dal link condiviso | Iscriversi, aderire, vedere proposta e quota, pagare fuori dall’app, dichiarare il pagamento | Che voglia newsletter o abbia già un account Amazon |
| Co-organizzatore | Aiutare con un compito delegato | Da una promozione esplicita | Solo azioni concesse, con possibilità di perdere il ruolo | Che possa spendere denaro dell’organizzatore o cambiare il beneficiario |
| Destinatario | Ricevere il gesto e scegliere il regalo | Dalla presentazione preparata dal gruppo | Aprire biglietto, vedere proposta, confermare o esplorare alternative | Che debba vedere quote individuali, insoluti o recapiti dei partecipanti |
| Visitatore | Capire il servizio o cercare un’idea | Home o catalogo | Esplorare e iniziare un gruppo | Che cercare un regalo equivalga a partecipare a una colletta |

## 7. Oggetti e vocabolario condiviso

L’**iniziativa** è il regalo di gruppo nel suo insieme. Comprende il destinatario, gli aderenti, uno o più prodotti proposti, l’accordo corrente, il biglietto, la consegna e la posizione economica. Non equivale a un portafoglio custodito da Gifty.

La **partecipazione** collega una persona identificata all’iniziativa. Conserva adesione, eventuale rinuncia e ruolo. Una persona invitata ma non ancora aderente non contribuisce al budget. L’**accordo corrente** contiene regalo e regola di ripartizione riportati dall’organizzatore dopo la discussione del gruppo.

La **quota proposta** è l’importo corrente mostrato a chi deve aderire o saldare. Un **versamento dichiarato** è quanto una persona dice di avere dato. Un **versamento ricevuto** è quanto l’organizzatore conferma di avere ricevuto. Il **saldo** è la differenza tra dovuto corrente e ricevuti, tenendo conto di eventuali restituzioni registrate.

Il **regalo proposto** è l’oggetto presentato dal gruppo. Il **regalo scelto** è la scelta corrente che l’organizzatore può acquistare. La **consegna digitale** è la presentazione al destinatario nell’interpretazione P01. L’**acquisto** e la **spedizione fisica** vengono dopo o prima secondo il percorso, senza essere dedotti dall’apertura di una pagina.

Nell’interfaccia si preferiscono parole comuni già presenti nell’inventario copy. I nomi tecnici degli oggetti restano nella documentazione e nel codice; non diventano etichette obbligatorie da spiegare agli utenti.

## 8. Ciclo di vita su dimensioni indipendenti

| Dimensione | Stati proposti | Evento che la modifica | Conseguenza distinta |
|---|---|---|---|
| Pubblicazione | bozza, attiva, annullata, archiviata | pubblicazione o gestione organizzatore | Visibilità e disponibilità dell’iniziativa |
| Nuove adesioni | aperte, chiuse | consegna secondo P01 | Possibilità di aggiungere persone |
| Regalo | da scegliere, proposto, scelta corrente | selezione o modifica | Contenuto della proposta e costo previsto |
| Presentazione | non consegnata, consegnata | invio al destinatario secondo P01 | Destinatario può vedere il regalo |
| Scelta destinatario | non richiesta, in attesa, scelta effettuata | azione del destinatario | Organizzatore sa quale oggetto acquistare |
| Acquisto | da effettuare, registrato, eventualmente annullato | azione organizzatore | Esistenza dell’ordine e spesa effettiva |
| Spedizione | non registrata, registrata, ricevuta se dichiarata | aggiornamento organizzatore | Informazione logistica, non stato della colletta |
| Riscossione | nessuna richiesta, quote da ricevere, parzialmente ricevute, saldata | versamenti e conferme | Stato economico del gruppo |
| Biglietto | da preparare, firme aperte, pronto, consegnato | firme e invio | Contenuto degli auguri e accesso |

Questa tabella non propone nove menu o nove passaggi. Evita che una sola parola, come “chiuso”, significhi contemporaneamente nessun nuovo aderente, nessun pagamento e nessun accesso. La schermata mostra soltanto gli stati necessari al compito corrente.

Una combinazione valida può essere: regalo consegnato digitalmente, nuove adesioni chiuse, destinatario ancora in scelta, acquisto da effettuare e quote ancora da ricevere. Un’altra può essere: acquisto già effettuato, nuove adesioni ancora aperte e biglietto da consegnare. L’archiviazione è una sistemazione dell’area personale, non una cancellazione implicita delle posizioni economiche.

## 9. Importi, budget e aggiornamento delle quote

Nel percorso a quota proposta, il budget previsto deriva dagli aderenti effettivi. Se otto persone aderiscono per 10 € ciascuna, il totale previsto è 80 €. Un numero iniziale di dodici persone resta un’ipotesi, finché non aderiscono. Se nessuno ha pagato, l’importo ricevuto è zero anche quando il budget previsto consente di scegliere un regalo.

Nel percorso a regalo scelto, il prezzo totale e il numero di persone producono una stima. Un regalo da 150 € diviso fra dieci persone vale 15 € a testa; fra otto vale 18,75 €. Il gruppo può mantenere l’oggetto e concordare la maggiore spesa oppure scegliere un regalo da 120 €. L’organizzatore aggiorna il risultato della discussione, senza una riconferma individuale obbligatoria nell’app.

Per i calcoli si usano centesimi interi. La formattazione in euro avviene nella presentazione. La gestione di un residuo di divisione deve essere deterministica e visibile: non si assume che ogni centesimo residuo diventi un ricavo di Gifty. La regola esatta resta P07. Un gruppo senza aderenti non ha una quota calcolata dividendo per zero e non riceve una stima inventata.

Il costo degli extra va distinto dal valore del regalo. Con otto persone e un totale a testa di 10 € che include un extra ipotetico da 0,50 €, restano 76 € per il prodotto. Se l’extra è aggiuntivo, ciascuno deve 10,50 €. La UI deve mostrare quale delle due offerte si sta usando prima dell’adesione o dell’acquisto dell’extra.

Una variazione modifica il dovuto corrente, non la storia dei soldi. Se una persona ha già versato 15 € e la quota concordata sale a 18,75 €, il ricevuto resta 15 € e il saldo da dare è 3,75 €. Se la quota scende a 12 €, resta da sistemare una differenza di 3 €. Registrare una restituzione non significa che Gifty l’abbia eseguita: il trasferimento rimane diretto fra le persone.

Il prezzo rilevato nel catalogo è una stima da verificare al checkout del venditore. Se cambia, l’organizzatore può aggiornare il gruppo secondo D07. Non si promettono prezzo bloccato, disponibilità o consegna garantita senza un accordo del venditore che li sostenga.

## 10. Percorso A: prima le adesioni

| Passo | Persona e azione | Dati richiesti o visibili | Risposta dell’app e prosecuzione |
|---|---|---|---|
| A01 | Organizzatore avvia il gruppo | Destinatario e occasione | Apertura del percorso, senza richiesta di prodotto |
| A02 | Sceglie di partire dalle adesioni | Due modalità visibili | Selezione conservata nel lavoro salvato |
| A03 | Imposta quota proposta | Importo; persone previste se utili | Budget iniziale riconoscibile come previsione |
| A04 | Inserisce data e dettagli minimi | Data del regalo; titolo contestuale | Riepilogo pronto, nessun filtro di catalogo obbligatorio |
| A05 | Si iscrive o accede | Dati minimi, termini e informativa; newsletter facoltativa | Ripresa della stessa bozza dopo accesso |
| A06 | Pubblica e condivide il link | Anteprima dell’invito | Link valido; l’organizzatore sceglie come condividerlo |
| A07 | Invitati aprono e aderiscono | Quota e destinatario, poi account | Conteggio e budget aggiornati sulle adesioni effettive |
| A08 | Organizzatore consulta il gruppo | Aderenti e budget previsto | Può cercare regali in quel contesto |
| A09 | Propone un regalo | Catalogo o link esterno, prezzo corrente | Proposta salvata, senza avviare un ordine |
| A10 | Il gruppo concorda in chat | Regalo e quota correnti | Organizzatore può modificare entrambi nell’app |
| A11 | Prepara biglietto e presentazione | Contenuti del gruppo, eventuale call | Anteprima di quanto vedrà il destinatario |
| A12 | Invia al destinatario | Riepilogo corrente e conseguenza sulle adesioni | Consegna secondo P01; nuove adesioni chiuse |
| A13 | Destinatario sceglie; organizzatore compra e riscuote | Scelta, collegamento al venditore e saldi | Acquisto e versamenti registrati come fatti distinti |

## 11. Percorso B: prima il regalo

| Passo | Persona e azione | Informazione necessaria | Risultato |
|---|---|---|---|
| B01 | Organizzatore sceglie dal catalogo o inserisce un link | Prodotto, prezzo e destinatario | Proposta collegata a una nuova iniziativa |
| B02 | Indica persone previste | Numero dichiarato e inclusione dell’organizzatore secondo P06 | Quota stimata con divisore esplicito |
| B03 | Completa il gruppo e accede | Dati minimi e registrazione | Bozza preservata e pronta alla condivisione |
| B04 | Condivide la proposta | Regalo e quota visibili nell’invito | Nessun acquisto o incasso implicito |
| B05 | Le persone aderiscono | Iscrizione, proposta e quota corrente | Conteggio effettivo aggiornato |
| B06 | Gruppo concorda eventuali variazioni | Stima, aderenti e alternativa | Organizzatore cambia regalo o quota senza nuovo negoziato obbligatorio nell’app |
| B07 | Organizzatore consegna la presentazione | Biglietto, proposta e partecipanti | Nuove adesioni chiuse secondo P01 |
| B08 | Festeggiato sceglie e organizzatore acquista | Conferma o alternativa, poi link Amazon | Spedizione a cura dell’organizzatore; quote ancora riscuotibili |

## 12. Modifiche, rinunce e partecipanti tardivi

Chi rinuncia prima di pagare esce dal conteggio utile al budget. Se aveva dichiarato un pagamento, occorre distinguere la rinuncia dalla verifica di quel versamento. Se il versamento era già stato ricevuto, la storia resta conservata e l’organizzatore può gestire l’eventuale restituzione. Le regole economiche di una rinuncia dopo la consegna rimangono un punto da definire; non si promette una cancellazione automatica del debito.

I tardivi possono aggiungersi prima della consegna, anche quando il prodotto è stato già proposto o acquistato. Il fatto che cambino quota o avanzo non crea un blocco anticipato automatico. Il gruppo ne parla e l’organizzatore aggiorna quanto necessario.

Dopo la consegna non esiste una seconda via per aggiungere persone “manualmente”. La regola vale per organizzatore, co-organizzatori, collegamenti vecchi e richieste dirette. Correggere il nome di una persona già presente non equivale ad aggiungere un nuovo aderente; deve però essere una correzione dell’identità corretta, non un modo per sostituire il proprietario conoscendone il nome.

## 13. Partecipante, iscrizione e ritorno al gruppo

Il collegamento identifica subito l’iniziativa. Nell’assunzione P03, prima dell’account mostra destinatario, proposta o scopo, quota corrente e chi organizza, con dati ridotti. Per aderire è richiesta la registrazione, come indicato da Cri. Il rifiuto della newsletter non cambia questo percorso.

L’account deve legare la partecipazione alla persona attraverso il metodo d’accesso scelto. Il nome visualizzato non è una prova d’identità: due persone possono chiamarsi nello stesso modo. Su un secondo dispositivo, l’accesso al medesimo account deve ritrovare la stessa riga, senza creare una nuova quota e senza appropriarsi di quella di un omonimo.

Un doppio tocco sul pulsante di adesione produce una sola partecipazione. Un account che ha già aderito vede il proprio stato e le azioni disponibili, non una nuova richiesta di iscrizione. Un accesso interrotto deve riportare all’iniziativa originale, evitando di perdere il collegamento ricevuto nella chat.

Per pagare, il partecipante vede importo corrente, nome dell’organizzatore e metodi configurati. Il trasferimento avviene fuori da Gifty. Il pulsante `payment.declare` registra una dichiarazione; il relativo esito attende conferma. Contanti, pagamento parziale, differenza dopo cambio di quota e importo non trovato devono avere stati leggibili, senza attribuire alla piattaforma una verifica bancaria che non compie.

## 14. Destinatario e scelta prima dell’acquisto

Il destinatario riceve il gesto del gruppo: biglietto, persone che partecipano e regalo pensato per lui. Non riceve automaticamente la dashboard dell’organizzatore. Quote individuali, pagamenti mancanti, numeri di telefono, email e ricevute non fanno parte della presentazione ordinaria.

Nel percorso descritto da Cri, il destinatario può scegliere il regalo proposto oppure guardare alternative. La scelta viene salvata e resa disponibile all’organizzatore, che procede personalmente all’acquisto. Nessun pulsante del destinatario deve effettuare un addebito a carico dell’organizzatore o un ordine Amazon implicito.

Le alternative mostrate devono rispettare il budget corrente e le disponibilità effettive del catalogo. Un regalo oltre il budget non diventa acquistabile automaticamente: richiede un accordo dell’organizzatore con il gruppo o una diversa modalità esplicita, ancora da progettare. La pagina non deve far credere che il gruppo abbia già autorizzato qualsiasi differenza di spesa.

## 15. Consegna, concorrenza e invio fallito

D16 e D17 stabiliscono il confine: adesioni consentite prima della consegna e vietate dopo. P01 ne dà un’interpretazione operativa per il prototipo: invio digitale del regalo o biglietto al destinatario, sotto il controllo dell’organizzatore. La ricezione del pacco successivo è un’informazione diversa. Questa interpretazione deve rimanere dichiarata finché non viene confermata come definizione di prodotto.

Prima dell’invio si mostra un riepilogo breve: destinatario, regalo, gruppo e conseguenza sulle nuove adesioni. Non è necessario un nuovo ciclo di approvazione dei partecipanti. L’organizzatore può tornare al gruppo se manca una persona e inviare quando il riepilogo è corretto.

La consegna e la chiusura dei nuovi ingressi devono usare lo stesso confine affidabile sul server. Se un’adesione e l’invio arrivano contemporaneamente, il sistema applica un ordine coerente: o la partecipazione entra prima e compare nel gruppo consegnato, oppure la consegna prevale e l’adesione viene rifiutata. Non basta disattivare il pulsante nella pagina già aperta.

Un doppio clic o una ripetizione della richiesta non deve generare due consegne. L’operazione conserva un identificativo stabile e una versione della presentazione. Se una modifica del regalo arriva durante il riepilogo, l’organizzatore vede che il contenuto è cambiato prima di inviare una versione superata.

Un messaggio preparato o copiato non è un invio riuscito. Se il canale esterno fallisce, la UI conserva il lavoro e segnala l’esito disponibile. Se l’esito è sconosciuto, non inventa successo o fallimento e non ripete alla cieca. P14 deve stabilire l’effetto sulle adesioni: riaprire automaticamente dopo un esito incerto potrebbe ammettere persone quando il destinatario ha già ricevuto il regalo.

## 16. Acquisto esterno e gift card

Gifty presenta il catalogo e il collegamento affiliato; l’organizzatore è il cliente che effettua il checkout su Amazon e dispone la spedizione. Il passaggio successivo alla scelta del destinatario rimane un acquisto dell’organizzatore. Le [condizioni del programma Amazon](https://programma-affiliazione.amazon.it/help/operating/participation) sono il riferimento per distinguere questo percorso dall’ordine eseguito dall’affiliato per conto di altri.

L’interfaccia non presenta il clic come acquisto completato. L’organizzatore può registrare di avere comprato, la spesa effettiva e, se il prodotto lo prevede, un riferimento o una ricevuta. La commissione affiliata non viene promessa al gruppo o considerata maturata dal semplice attraversamento del link. Per ordini personali e per conto dei clienti valgono le esclusioni illustrate nella [FAQ Amazon](https://programma-affiliazione.amazon.it/help/node/topic/G46FTB8KQF8NRUWG).

La gift card può essere un’alternativa al prodotto oppure un credito che il destinatario converte prima di scegliere un marchio. [MyGiftCardPlus](https://www.mygiftcard.it/mygiftcardplus) documenta un prodotto convertibile. Non dimostra un accordo con Gifty, margini o API disponibili per questo progetto. Una carta già emessa è diversa dal credito ancora convertibile: le [FAQ di MyGiftCard Square](https://www.mygiftcardsquare.it/faqs), per esempio, non consentono il cambio dopo l’acquisto della carta scelta.

Finché P08 non è risolto, il prototipo può mostrare la posizione della gift card nel percorso come opzione da valutare, senza un pulsante che prometta uno scambio non supportato. La gestione di resi, buoni emessi e rimborsi deve seguire le condizioni del venditore effettivo.

## 17. Extra, biglietto e call

Il biglietto cofirmato è un contenuto del regalo; la sua monetizzazione è D20, ancora da valutare. Un prezzo di 0,50 € per partecipante può essere usato soltanto in esempi dichiarati. Prima dell’implementazione servono prezzo approvato, unità di conteggio, soggetto pagante, eventuali imposte e comportamento in caso di rinuncia o annullamento.

P05 propone un solo acquisto dell’organizzatore. Un prezzo calcolato per partecipante non richiede necessariamente un checkout per ogni firma. Il costo eventualmente ripartito entra nel riepilogo delle quote prima che venga chiesto il pagamento. Un avanzo non viene trasformato automaticamente in acquisto di un extra.

Il biglietto deve preservare le firme già ricevute quando cambia il prodotto. Il numero di firmatari e il numero di persone che hanno dato denaro possono essere diversi; l’eventuale regola che li vincola va decisa, non dedotta dal fatto che entrambi appartengono al gruppo. Dopo la consegna, nuove firme o modifiche alle dediche devono seguire la regola del biglietto che verrà scelta, senza riaprire le adesioni economiche.

La call è un momento di consegna condivisa. P09 propone data, ora e link esterno gestiti dall’organizzatore, con accesso al biglietto durante l’incontro. Non sono verificate automazioni di chiamata WhatsApp, inviti di calendario o registrazioni video. Il link all’incontro non deve esporre informazioni private del gruppo a chi non è autorizzato; chi non partecipa alla call può comunque ricevere il regalo attraverso il percorso previsto.

## 18. Ruoli e permessi delegabili

| Azione | Organizzatore | Partecipante | Delegato agli inviti | Destinatario |
|---|---|---|---|---|
| Modificare regalo e quota | Sì | No, può proporre se consentito | No di default | Solo scelta fra alternative autorizzate |
| Condividere l’invito | Sì, prima della consegna | Se gli è concessa la facoltà | Sì, prima della consegna | No di default |
| Aggiungere manualmente persone | Sì, prima della consegna | No di default | Solo se il permesso lo comprende | No |
| Vedere la propria quota | Sì se partecipa | Sì | Sì se partecipa | Non pertinente |
| Vedere importi privati altrui | Sì per gestire la raccolta | No | No di default | No |
| Confermare denaro ricevuto | Sì | No | No di default | No |
| Cambiare coordinate di rimborso | Sì, con informazione corretta al gruppo | No | No | No |
| Consegnare il regalo | Sì | No | No di default | Riceve la presentazione |
| Comprare il regalo | Sì, sul sito del venditore | Non a carico dell’organizzatore | No automatico | Non a carico dell’organizzatore |
| Revocare una delega | Sì | No | No | No |

## 19. Iscrizione, privacy e visibilità dei dati

La registrazione richiesta da Cri è una scelta del servizio per riconoscere organizzatori e partecipanti. L’informativa spiega il trattamento; non è un consenso indistinto che autorizza qualsiasi finalità. I dati necessari al servizio e le scelte facoltative devono avere basi e controlli distinti, come illustra la guida [EDPB sulle basi giuridiche](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

La newsletter è separata. La scelta non è preselezionata e il rifiuto non impedisce l’adesione al regalo. Il double opt-in è una proposta per verificare l’indirizzo e documentare l’iscrizione, non una dichiarazione di obbligo universale italiano. Si conservano finalità, testo e versione, momento dell’azione, eventuale conferma e revoca. La presenza di un account non autorizza promozioni: riferimento [Garante, art. 130](https://garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10102462).

Cookie e memoria del dispositivo richiedono un inventario effettivo. I soli strumenti tecnici necessari non impongono il banner previsto per la profilazione; tracciamenti ulteriori vanno valutati e, quando necessario, bloccati prima del consenso. Riferimenti: [FAQ cookie del Garante](https://www.garanteprivacy.it/faq/Cookie) e [linee guida](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876). Il progetto non aggiunge pixel o analytics identificativi per il solo fatto di voler misurare l’uso.

| Dato | Organizzatore | Partecipante | Destinatario | Visitatore non iscritto |
|---|---|---|---|---|
| Proposta e informazioni minime | Sì | Sì | Nella presentazione autorizzata | Solo quanto ammesso da P03 |
| Quota individuale corrente | Sì | Solo propria | No di default | No |
| Versamenti, note e ricevute | Per gestione autorizzata | Solo propri dati necessari | No | No |
| Email e telefono | Solo per scopi e permessi definiti | Propri dati | Propri dati | No |
| Indirizzo di spedizione | Solo al soggetto che compra o spedisce | No | Proprio dato | No |
| Dediche e firme | Secondo regole del biglietto | Secondo accesso previsto | Nel biglietto consegnato | No di default |

Prima di pubblicare la policy restano da definire titolare legale, contatto, fornitori reali, canali, conservazione, cancellazione, trasferimenti e percorso per i diritti. Non si attribuisce il servizio a Tempura o Something Labs senza una decisione. L’app non può promettere riservatezza basandosi soltanto su dati nascosti nell’interfaccia: le letture dirette dal database devono rispettarla.

## 20. Errori, attese e ripresa

Ogni azione distingue caricamento, assenza di dati, fallimento e successo. Un elenco ancora in caricamento non mostra “nessun partecipante”. Una richiesta fallita conserva quanto inserito e offre la ripetizione dell’operazione, non il riavvio del gruppo. Un successo viene mostrato dopo il salvataggio confermato, non dopo il solo clic.

| Situazione | Comportamento richiesto |
|---|---|
| Accesso interrotto | Ritorno alla stessa bozza o iniziativa |
| Collegamento non valido | Nessun dettaglio privato, indicazione del problema e uscita utile |
| Gruppo consegnato durante l’adesione | Nuovo ingresso negato, dati dell’account non persi |
| Modifica concorrente di un organizzatore | Nessuna sovrascrittura silenziosa; mostrare il riepilogo aggiornato |
| Prodotto non disponibile | Consentire scelta alternativa senza perdere il gruppo |
| Pagamento non trovato | Stato e azione dell’organizzatore senza falsa accusa al partecipante |
| Invio esterno incerto | Stato incerto esplicito e percorso di verifica, senza duplicazione alla cieca |
| Delega revocata | Azione negata con ritorno alla vista ancora consentita |

Le pagine devono essere usabili da tastiera, mostrare focus, mantenere contrasto leggibile e rispettare il movimento ridotto. Le illustrazioni che portano un significato richiedono un’alternativa accessibile; non sostituiscono importi o conseguenze con un’immagine indecifrabile.

## 21. Mappa delle schermate e dei compiti

| ID | Schermata | Persona | Azione principale | Dipendenze |
|---|---|---|---|---|
| S01 | Home | Visitatore | Avviare il regalo di gruppo | D02, D03; `home.hero` e `home.organise` |
| S02 | Inizio del gruppo | Organizzatore | Inserire destinatario e scegliere il punto di partenza | D04, D05 |
| S03 | Quota e dati minimi | Organizzatore | Impostare proposta e previsione | R01, R02, P06 |
| S04 | Catalogo contestuale | Organizzatore | Proporre un regalo | D02, D07, prezzo corrente |
| S05 | Scheda prodotto | Organizzatore | Aggiungere la proposta al gruppo | Nessun acquisto implicito |
| S06 | Iscrizione e accesso | Organizzatore o partecipante | Identificarsi e riprendere | D08, D09, P12 |
| S07 | Invito | Invitato | Iscriversi e aderire | P03, consegna non effettuata |
| S08 | Gruppo | Organizzatore | Gestire persone, regalo e quote | D06, D07, R05 |
| S09 | La propria quota | Partecipante | Pagare fuori app e dichiarare | Metodi configurati, identità propria |
| S10 | Verifica versamenti | Organizzatore | Confermare il ricevuto | Permesso e importo esplicito |
| S11 | Biglietto e firme | Partecipanti e organizzatore | Scrivere o preparare gli auguri | Regole del biglietto ed extra approvati |
| S12 | Riepilogo consegna | Organizzatore | Inviare al destinatario | P01, P14, versione corrente |
| S13 | Apertura del regalo | Destinatario | Vedere biglietto e proposta | P04, dati privati esclusi |
| S14 | Scelta e alternative | Destinatario | Confermare il regalo | Acquisto non ancora effettuato |
| S15 | Acquisto e riepilogo finale | Organizzatore | Aprire Amazon e registrare spesa | D13, D15, R11 |
| S16 | Accesso chiuso e ritorno | Nuovo invitato o membro esistente | Capire la chiusura o accedere al gruppo | D17, P02 |

## 22. Differenze da applicare al codice esistente

| ID | Evidenza letta al commit `2eddae8` | Effetto sul nuovo flusso | Intervento minimo da progettare |
|---|---|---|---|
| C01 | `lib/tipi.ts:156`: prodotto obbligatorio nella colletta | Non rappresenta esplicitamente il percorso budget senza prodotto | Assenza del prodotto gestita in tipi, letture e dominio |
| C02 | `lib/dominio/operazioni.ts:132–134`: votazione aperta blocca tutte le operazioni | Blocca anche l’adesione durante la scelta | Limitare il vincolo alle azioni che richiedono il regalo deciso |
| C03 | `operazioni.ts:242–244`: prima conferma congela la quota | Conflitto con aggiornamenti dell’accordo dopo un versamento | Separare dovuto corrente, ricevuti e differenze |
| C04 | `Dashboard.tsx:494–506`: chiusura adesioni conserva la possibilità di pagare | Separazione utile già esistente | Riutilizzarla, collegandola al confine di consegna |
| C05 | `firestore.rules:98–99` e `creaInvitati`: aggiunta manuale senza controllo consegna | Via alternativa ai nuovi ingressi dopo il confine | Stessa regola per tutte le vie di aggiunta |
| C06 | `firestore.rules:76`, adattatore client e importi individuali | Il nascondimento UI non garantisce la privacy promessa | Letture filtrate e separazione dei dati privati |
| C07 | `firestore.rules:119–125`: recupero cambiando proprietario della riga | Il nome non garantisce identità e ritorno sicuro | Recupero mediante account senza rivendicazione per nome |
| C08 | `lib/dati/firestore.ts:199–220`: dominio e totali in transazione; tipi biglietto con consegna separata | Base utile, ma consegna e gruppo vanno coordinati | Controlli atomici, identificativo operazione e versione consegnata |

## 23. Criteri di accettazione da verificare

| ID | Dato | Quando | Allora |
|---|---|---|---|
| AC01 | Organizzatore senza prodotto | Pubblica dal percorso A | Esiste un gruppo valido senza prodotto fittizio |
| AC02 | Bozza del percorso A salvata | Accede da una nuova sessione | Ritrova destinatario, modalità e quota |
| AC03 | Dodici persone previste e nessuna adesione | Consulta il budget | La previsione non appare come denaro ricevuto |
| AC04 | Otto adesioni da 10 € e zero versamenti | Consulta il riepilogo | Budget previsto 80 €, ricevuto zero |
| AC05 | Prodotto scelto nel catalogo | Avvia il percorso B | Prodotto e numero persone passano al gruppo |
| AC06 | Regalo da 150 € e dieci previsti | Apre l’invito | Vede stima 15 € e divisore dieci |
| AC07 | Votazione ancora aperta | Un nuovo utente aderisce | L’adesione è consentita se non consegnato |
| AC08 | Account già aderente | Preme ancora il pulsante | Non nasce una seconda partecipazione |
| AC09 | Due richieste concorrenti dello stesso account | Entrambe arrivano al server | Conteggio e partecipazione aumentano una volta |
| AC10 | Due persone omonime | Si iscrivono e aderiscono | Restano identità e quote distinte |
| AC11 | Partecipante su secondo dispositivo | Accede al proprio account | Recupera la stessa partecipazione |
| AC12 | Persona conosce il nome altrui | Tenta di recuperare la riga | Non acquisisce la partecipazione altrui |
| AC13 | Newsletter non selezionata | Completa iscrizione e adesione | Il regalo funziona e non nasce consenso marketing |
| AC14 | Accesso interrotto durante l’invito | Riprende e completa login | Torna alla medesima iniziativa |
| AC15 | Gruppo concorda nuova quota in chat | Organizzatore la salva | Riepilogo aggiornato senza riconferme individuali obbligatorie |
| AC16 | Quota da 15 € passa a 18,75 € | Un partecipante ha già dato 15 € | Ricevuto invariato, saldo 3,75 € |
| AC17 | Quota scende sotto il ricevuto | Organizzatore aggiorna l’accordo | La differenza è visibile, non cancellata |
| AC18 | Persona con versamento ricevuto rinuncia | Organizzatore registra l’esito | Il movimento storico resta distinguibile |
| AC19 | Gruppo senza aderenti | Si calcola una quota divisa | Nessuna divisione per zero o cifra inventata |
| AC20 | Divisione con centesimi residui | Si forma il riepilogo | Regola e residuo corrispondono alla scelta P07 |
| AC21 | Prodotto già comprato, non consegnato | Arriva un nuovo aderente | L’acquisto da solo non impedisce l’ingresso |
| AC22 | Invito aperto prima della consegna | L’adesione arriva dopo il confine | Il server rifiuta il nuovo ingresso |
| AC23 | Adesione e consegna concorrenti | Il server decide l’ordine | La persona è inclusa prima oppure rifiutata dopo, senza stato intermedio incoerente |
| AC24 | Gruppo consegnato | Organizzatore aggiunge manualmente una persona | L’aggiunta è negata |
| AC25 | Gruppo consegnato | Delegato usa un vecchio invito o chiamata diretta | Il nuovo ingresso è negato |
| AC26 | Gruppo consegnato e quota mancante | Iscritto accede secondo P02 | Può seguire il saldo senza nuova adesione |
| AC27 | Iscritto dichiara di aver pagato | Salva la dichiarazione | Ricevuto non aumenta finché non viene confermato |
| AC28 | Pagamento già confermato | Arriva un retry della stessa conferma | Il totale non viene duplicato |
| AC29 | Contanti configurati | Organizzatore li riceve | Può registrare il ricevuto senza falsa conferma bancaria |
| AC30 | Destinatario apre la presentazione | Vede la proposta | Non vede importi privati o insoluti del gruppo |
| AC31 | Acquisto ancora da fare | Destinatario sceglie alternativa | La scelta si salva senza ordine o addebito implicito |
| AC32 | Acquisto registrato | Destinatario riapre la pagina | Non vede una promessa di cambio pre-ordine ancora disponibile |
| AC33 | Organizzatore segue il link Amazon | Ritorna su Gifty | Il semplice clic non marca acquisto o commissione |
| AC34 | Organizzatore registra spesa reale | La spesa differisce dalla stima | Il riepilogo mostra la nuova base e i saldi corretti |
| AC35 | Delega agli inviti revocata | Delegato salva da pagina già aperta | La scrittura non autorizzata viene negata |
| AC36 | Partecipante interroga direttamente i dati | Richiede importi o recapiti altrui | La lettura privata è negata oltre i permessi |
| AC37 | Doppio clic sull’invio | Due richieste raggiungono il servizio | Una sola consegna logica con identificativo stabile |
| AC38 | Invio esterno fallito o incerto | Organizzatore torna al gruppo | Vede l’esito reale e il percorso P14, senza successo inventato |
| AC39 | Dati ancora in caricamento | Si apre il gruppo | Non viene mostrato uno stato vuoto definitivo |
| AC40 | Salvataggio della modifica fallisce | Organizzatore corregge o riprova | I dati digitati restano e il successo non è anticipato |

## 24. Direttrice dei lavori e tracciabilità

Il lavoro procede dalla specifica al confronto con i competitor, poi alla proposta UX/design e al prototipo. La ricerca confronta servizi di raccolta, cataloghi di idee e strumenti di regalo condiviso, distinguendo il mercato italiano dai benchmark internazionali. Osservazioni su copy, font o colori non diventano automaticamente scelte per Gifty.

| Fase | Risultato concreto | Condizione per passare oltre |
|---|---|---|
| 1. Allineamento del prodotto | Registro D/R/P, flussi A/B e criteri AC | Nessun requisito di Cri perso o trasformato in altro |
| 2. Competitor | Pagine, fonti, osservazioni e limiti di accesso | Ricerca completata prima di proporre il brand design |
| 3. UX e direzioni visive | Mappa S01–S16, alternative e direzione raccomandata | Ogni scelta collegata a bisogno, decisione e ricerca |
| 4. Prototipo | Due ingressi e viste organizzatore, partecipante e destinatario | Copy dall’inventario, esempi etichettati, controlli comprensibili |
| 5. Architettura e piano | Incrementi C01–C08, dati, permessi e verifiche | Punti aperti risolti solo dove determinano il comportamento |
| 6. Implementazione isolata | Modifiche su branch o worktree, main intatta | Persistenza, permessi e flussi verificati nella destinazione prevista |
| 7. Eventuale rilascio | Risultato concreto pronto alla revisione | Approvazioni esatte richieste per azioni esterne o live |

Una modifica di design indica almeno un ID D o R, la schermata S coinvolta e il criterio AC che la verifica. Una proposta commerciale indica il relativo punto P e non introduce un prezzo definitivo nel codice o nel copy. Un cambio di stato definisce chi lo può eseguire, i dati letti, il confine di autorizzazione, il risultato salvato e la risposta a una ripetizione.

Controllo editoriale: lettura integrale secondo find-ai-slop per specifica italiana destinata a prodotto e sviluppo; controllati anche titoli, tabelle, condizioni e criteri. Nessun punto finale nei titoli e nessun em dash. La lettura tecnica e il controllo editoriale non sostituiscono la verifica del prototipo renderizzato o dei flussi implementati.
