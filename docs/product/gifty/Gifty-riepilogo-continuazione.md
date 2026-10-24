# Gifty: riepilogo per continuare

Aggiornato il 24 ottobre 2026. Questo documento riassume lo stato verificato; la specifica di prodotto e le linee guida collegate restano i riferimenti dettagliati.

Sono già disponibili l’analisi UX/copy/codice, la ricerca competitor, la specifica dettagliata dei flussi, la tavola approvata, il frontend navigabile, il collegamento Firebase e i documenti di verifica. Questa sintesi sostituisce la cronologia per riprendere il lavoro; non riscrive le decisioni dettagliate.

## Obiettivo e perimetro

Gifty aiuta a scegliere un regalo e organizzare le quote. Mercato italiano, catalogo Amazon con affiliazione. Il denaro va direttamente all’organizzatore, non passa da Gifty.

Repository originale: `/Users/cri/dev/web_MVP_Collettiamo_GITHUB`. Main è stato aggiornato da origin/main in fast-forward al commit `2eddae8`; la versione Gifty resta esclusivamente sul branch dedicato, senza merge. Il lavoro corrente è nel worktree separato `/Users/cri/dev/web_MVP_Collettiamo_GITHUB-review`, ramo `feat/gifty-ux-direction-a`. La pagina locale è `http://127.0.0.1:4193/`, servita da `prototype/gifty/serve.py`. Questa interfaccia è separata dalle rotte Next originali. Non è stata pubblicata.

## Decisioni di prodotto

- Due ingressi: raccogliere adesioni prima e scegliere in base al budget, oppure scegliere prima il regalo e dividere il costo previsto
- L’organizzatore e il gruppo discutono eventuali cambi di regalo o quota nella propria chat; l’organizzatore aggiorna il gruppo
- Il festeggiato può scegliere il regalo proposto o un’alternativa entro il budget; poi l’organizzatore acquista personalmente seguendo il link affiliato e spedisce
- Si può aderire prima della consegna, non dopo
- I partecipanti in attesa di invito non contano nel budget; i pagamenti dichiarati non equivalgono a quote ricevute e confermate
- Privacy e comunicazioni commerciali sono distinte; nessuna preferenza commerciale preselezionata

## Design approvato e vincoli

Direzione A: verde scuro, carta chiara, arancione, logo Gifty con nastro; Urbanist, Source Sans 3 e Caveat. Hero fotografica a tutta larghezza, testo e azioni sovrapposti all’immagine. Conservare la composizione approvata e la navigazione Home, Catalogo, Trova regalo, Preferiti, Collette e profilo.

Italiano naturale, titoli senza punto finale, controllo find-ai-slop su ogni nuovo copy. Guidare attraverso controlli ed elementi visivi, senza paragrafi esplicativi. Ricerca competitor prima di una nuova direzione di brand, non reinterpretare quella già approvata.

## Implementato e verificato

Sono presenti i due percorsi, le viste di organizzatore, partecipante e festeggiato, quota modificabile nella tabella, condivisione in modale, lista di partecipanti e indirizzi da invitare, suggerimenti entro il budget, biglietto e registrazione di consegna/acquisto esterni. Miniatura del regalo e numero dei partecipanti nella pagina quota. Footer e descrizione dei dati.

Autenticazione collegata a Firebase esistente attraverso un nucleo condiviso con l’app originale: Google, link email, ritorno al regalo, recupero della sessione, profilo e consensi nel database dedicato, uscita. Profilo con nome, cognome, email in sola lettura, metodo di accesso e preferenza commerciale. Sessione valida salta la registrazione. I vecchi nomi e flag locali non costituiscono un account e non attribuiscono proprietà dei gruppi.

Verificati caricamento Firebase nel browser, autorizzazione dei due indirizzi locali, rotte del server e protezione dei file privati. Le 55 prove isolate complessive sono superate: 36 autenticazione/profilo, 9 catalogo, 7 avvio dal prodotto e 3 conservazione dei riferimenti storici. Le prove UI su origine separata verificano anche ricerca, filtri, caricamento 24→48 prodotti e prodotto mantenuto nel percorso del nuovo gruppo. Nessun account reale creato o email inviata durante le verifiche. La prova finale con Google ed email reali non è ancora documentata. Le dipendenze Next non sono installate e la sua suite completa non è stata eseguita.

## Limiti ancora presenti

Autenticazione e profilo sono reali; i dati dei gruppi restano nel browser e non sono sincronizzati fra utenti o dispositivi. Gli indirizzi aggiunti non ricevono automaticamente un invito. Acquisto, pagamento e consegna sono azioni esterne registrate dall’organizzatore. Il modello locale conserva ancora due posizioni A/B e può sostituire quella corrente solo dopo conferma. I gruppi precedenti privi di proprietario Firebase non vengono assegnati automaticamente. Titolare, contatti, conservazione e informativa legale definitiva restano da definire. Gift card, call ed extra a pagamento non sono servizi integrati.

## Home e catalogo completati

La home contiene un racconto interattivo con la sequenza corretta esplicitamente da Cri: crea il gruppo o scegli il regalo; proponi le opzioni o raccogli le adesioni; prepara il biglietto; consegna il regalo; tieni il conto dei rimborsi. Fotografie decorative, nastro, biglietti e navigazione da tastiera restano nello stile approvato. Nella sequenza narrativa della home non ripristinare il vecchio passo iniziale di ricerca separata e mostrare i rimborsi dopo la consegna; questo ordine non vieta pagamenti precedenti nella gestione effettiva del gruppo. Le linee guida consolidano il design approvato, le correzioni, i moduli, la tipografia, i testi e gli stati di accesso. La hero resta invariata.

Il catalogo usa direttamente 180 prodotti e foto della fonte di Stefano, con filtri reali e prezzi rilevati dal 14 al 16 ottobre 2026. Ricerca, classificazioni, fasce prezzo e affiliazione seguono il codice esistente. Non esiste una seconda copia dei dati o delle fotografie. Un prodotto assente da una fonte successiva non azzera i gruppi salvati. Ordine ed eliminazioni fatti solo nel backoffice Firebase e preferiti remoti non sono sincronizzati.

Non risulta una integrazione Amazon Creators API attiva; il documento API esistente è una ricerca e proposta del 20 ottobre, non una capacità già implementata. Il documento del catalogo distingue importazione Excel, JSON, seed, API Next amministrative protette e nuovi endpoint locali di sola lettura. Nessun seed, import o cambiamento remoto è stato eseguito.

## Documenti da leggere

Nel worktree: `docs/product/gifty/Gifty-flussi-e-decisioni.md`, `Gifty-UX-design-guidelines.md`, `Gifty-catalogo-e-API.md`, `Gifty-verifica-autenticazione.md`; avvio e limiti in `prototype/gifty/README.md`. La tavola approvata e le verifiche visive sono negli outputs di questa chat. I documenti descrivono decisioni, proposte e risultati separatamente.

## Continuità

Leggere questo riepilogo e le guidelines prima di modificare la UI. Mantenere il worktree corrente e il server locale; non creare una variante del brand o toccare main. Lo stato operativo sintetico è in `docs/product/gifty/STATUS.md`. Non trattare la prova Google/email reale o i gruppi condivisi come risultati verificati: restano distinti dai test isolati e dalla persistenza locale.
