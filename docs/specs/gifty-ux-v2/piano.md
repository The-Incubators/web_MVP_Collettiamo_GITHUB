# Gifty UX v2: piano di lavoro

Aggiornato il 5 novembre 2026, dopo la revisione di Cri del sito con i PR 1 e 2.
Fatti: PR 1 (sistema, cornice, home, /regalo-di-gruppo, #23) e PR 2 (Idee regalo, niente banner, #24), entrambi su main.
Regola: si cambia il prototipo, Cri lo approva, poi si scrive il codice. Le correzioni che non toccano il disegno vanno direttamente nel codice.

## Revisione di Cri del 5 novembre

| # | Dove | Richiesta | Come | Passo |
|---|---|---|---|---|
| 1 | Piè di pagina | Colonne con lo stesso spazio fra l'una e l'altra | Griglia a colonne uguali, larghezza del contenuto | A |
| 2 | Piè di pagina | Togliere la riga «In qualità di Affiliato Amazon…» | Nuova pagina «Termini e condizioni», con la dichiarazione Amazon; link accanto a «Privacy e dati» | A |
| 3 | Piè di pagina | Colonna Account | Stesse voci del nuovo menu: I miei regali, I miei biglietti, Il mio account | A |
| 4 | Accesso | Togliere ogni avviso su Firebase | Via la nota «Senza Firebase l'accesso è immediato e finto» e ogni altro avviso di modalità memoria | A |
| 5 | Menu utente | «Organizza un regalo» diventa «I miei regali» | Elenco di tutti i regali, con la pillola «Di gruppo» sui regali di gruppo | B, poi E |
| 6 | Menu utente | Aggiungere «I miei biglietti» | Elenco dei biglietti avviati e firmati | B, poi E |
| 7 | Menu utente | «Il mio account»: dati personali con cancellazione dell'account, Ricorrenze, Preferiti | Cancellazione secondo il GDPR (art. 17 e 12): ricerca nel passo B | B, poi E |
| 8 | Menu utente | Togliere «Come trattiamo i dati» | Sta nella pagina Privacy | A |
| 9 | Menu utente | «Esci» solo nel menu a tendina | Via il pulsante «Esci» dalla pagina dell'account | A |
| 10 | Idee regalo | Dopo «per lei / per lui», un passo sulla fascia d'età | Fasce dai dati d'età già nel catalogo (`lib/dati/eta-prodotti.ts`); le domande passano da 3 a 4 passi | A |
| 11 | Ovunque | «Idee scelte da noi» diventa «Le nostre scelte» | Testo cambiato in tutto il sito e nei prototipi | A |
| 12 | Regalo di gruppo | «Guarda come si fa» deve sembrare una pillola, non un pulsante | Pillola piccola e tinta, staccata dal pulsante principale (accanto al titolo); regola valida per tutte le pagine | A (regola nel sistema) |
| 13 | Procedura guidata | A tutta pagina | Niente intestazione del sito né piè di pagina: solo chiudi, passo e avanzamento | B, poi C |
| 14 | Procedura guidata | Più snella, secondo le buone pratiche | Ricerca nel passo B: una domanda per schermata, valori già proposti, meno campi, riepilogo prima di condividere, accesso solo alla fine | B, poi C |
| 15 | Procedura guidata | Togliere «Puoi sceglierlo tu o far votare il gruppo.» | Via | C |
| 16 | Procedura guidata | Testo della lista vuota da votare | «Ancora nessuna: scegli almeno due prodotti dal catalogo e clicca su "Aggiungi al regalo"»; il pulsante diventa «Aggiungi al regalo» | C |
| 17 | Procedura guidata | Votazione con data di fine | Data e ora di fine al posto delle ore | B, poi C |
| 18 | Biglietto | Pagina più immersiva | Nuovo disegno della pagina Biglietto (le quattro tessere «Come lo apre il festeggiato» del prototipo sono troppo spoglie) | B, poi D |
| 19 | Biglietto | «Guarda un esempio» come la pillola del tutorial | Pillola «Guarda come si fa» | A |
| 20 | Tutto il sito | Controllo dei testi con /find-ai-slop | Su ogni pagina rifatta, con le correzioni | F |

## Ordine di lavoro

**A. Correzioni sulle pagine già rifatte** (un PR, subito): righe 1, 2, 3, 4, 8, 9, 10, 11, 12, 19. Il menu utente porta alle pagine che esistono oggi finché non arriva il passo E.

**B. Secondo giro di prototipi** (Cri approva prima del codice):
- procedura guidata a tutta pagina e più snella, con la data di fine della votazione (righe 13–17), con le fonti delle buone pratiche;
- area dell'account: menu utente, I miei regali, I miei biglietti, Il mio account con la cancellazione, Ricorrenze, Preferiti (righe 5–7), con i requisiti GDPR e le fonti;
- pagina Biglietto più immersiva (riga 18).

**C. PR procedura guidata**, dal prototipo approvato. Riprende i pezzi utili del lavoro parziale sul ramo `feat/gifty-ux-v2-crea` (commit `c98eef6`: logica in `lib/wizard/stato.ts` con 20 test, occasioni uniche, azioni del catalogo in modo gruppo; schermate mai provate nel browser). Da correggere lì: chi organizza va aggiunto fra chi partecipa (D-15), la durata fissa della votazione diventa una data di fine, e le pagine di gestione e invito devono reggere un gruppo partito dalle adesioni senza regalo.

**D. PR biglietto**: pagina, editor, gestione, apertura.

**E. PR pagine del regalo di gruppo** (chi organizza e chi è invitato) **e area dell'account**, con la cancellazione dell'account (dati in Firestore e utente in Firebase Auth).

**F. Controllo dei testi di tutto il sito** con /find-ai-slop, e correzioni in un PR.

Dopo: video dei tutorial (regalo di gruppo, biglietto), poi il ▶ sulla pillola. Prima del lancio: P-07 (chi è il titolare del trattamento), che serve anche alle pagine Privacy e Termini.

## Aperto

- Prima del lancio, su Firebase vero: provare la cancellazione dell'account (Admin SDK), le regole Firestore (test con l'emulatore, serve Java) e gli indici; cancellare anche le ricevute in Storage con l'account.
- Promemoria (D-12) e conferma via email della cancellazione: servono il servizio email (D-18).
- La cover iPhone di Gifty non compare più: rimetterla nel catalogo o toglierla.
