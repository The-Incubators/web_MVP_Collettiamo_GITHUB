# Gifty: collegamento dell’autenticazione

24 ottobre 2026

L’interfaccia locale usa Firebase Authentication del progetto esistente, con Google e accesso tramite link email. Il trasporto è condiviso con l’adattatore dell’app originale; non sono state installate nuove dipendenze o cambiate impostazioni dei servizi. Il lavoro è nel worktree `web_MVP_Collettiamo_GITHUB-review`, sul ramo `feat/gifty-product-ux-spec`. Main resta al commit `966a8ad`.

## Comportamento implementato

- Nessun accesso fittizio: i vecchi flag locali non attribuiscono permessi
- Profilo e consensi nel documento dell’utente autenticato, nel database dedicato esistente
- Privacy distinta dalla scelta commerciale facoltativa; il ripristino della sessione non cambia la preferenza
- Recupero del regalo soltanto quando account, percorso e identificativo della bozza corrispondono
- Annullamento, errore di rete, link non valido e salvataggio del profilo non riuscito gestiti senza conferme false
- Uscita effettiva da Firebase e controlli della UI legati all’identificativo verificato dell’utente
- Inviti senza parametri o codici del link email

## Profilo e sessione

Il profilo mostra nome e cognome modificabili, email dell’identità Firebase in sola lettura, metodo di accesso, presa visione della privacy e preferenza commerciale. Il pulsante Esci è visibile nel profilo e nel menu. Una sessione già verificata salta la registrazione; durante il controllo iniziale viene mostrato soltanto lo stato di attesa. Il vecchio nome locale non viene convertito in una sessione autenticata.

## Verifiche eseguite

Le 36 prove isolate Node sono superate, insieme ai controlli sintattici e della differenza Git. Includono risposte ritardate dopo uscita o cambio account, ripristino della sessione, profilo, email non modificabile, preferenza commerciale e corrispondenza del regalo.

Firebase si inizializza nella pagina locale e abilita i controlli senza errori. Una lettura della configurazione pubblica conferma che gli indirizzi locali utilizzati sono autorizzati. Le prove HTTP verificano il ritorno `/accedi`, la configurazione pubblica limitata ai campi consentiti e la risposta 404 per file privati, percorsi esterni e sorgenti dei test. Il server non registra i parametri delle richieste di accesso.

Le prove di interfaccia usano un’origine separata con identità fittizie: annullamento Google, errore email con campi conservati, conferma dopo invio, ripresa del regalo, recupero dopo ricaricamento e blocco delle modifiche dopo l’uscita. La prova isolata del profilo verifica anche salvataggio del nome e della preferenza commerciale, recupero dopo ricaricamento, esclusione della registrazione per chi è già autenticato e uscita. A larghezza 390 px non c’è scorrimento orizzontale.

Nessuna email è stata inviata durante queste prove e nessun account reale è stato creato.

## Verifica ancora necessaria

La conclusione dell’accesso con un account Google reale e l’apertura di un’email effettivamente ricevuta richiedono la prova dell’utente. L’inizializzazione e i test isolati non attestano questi due esiti esterni. La suite completa Next non è stata eseguita perché le dipendenze non sono installate nel worktree.

I dati dei gruppi restano nel browser: questo intervento collega autenticazione e profilo, non introduce sincronizzazione dei gruppi fra utenti. I gruppi precedenti senza proprietario Firebase restano conservati e non vengono assegnati automaticamente a un account. La descrizione attuale dei dati non sostituisce l’informativa legale definitiva: titolare, contatti e conservazione restano da definire.
