# Gifty: stato operativo

Aggiornato il 24 ottobre 2026

## Active focus

Interfaccia locale direzione A nel worktree `/Users/cri/dev/web_MVP_Collettiamo_GITHUB-review`, ramo `feat/gifty-ux-direction-a`. Main originale aggiornato da origin/main in fast-forward al commit `2eddae8`, senza merge della versione Gifty. Server: `python3 prototype/gifty/serve.py`, `http://127.0.0.1:4193/`. Nessuna pubblicazione.

## Next

Per continuare leggere il riepilogo e le guidelines. La prova finale con un account Google reale e un link email ricevuto dall’utente resta senza un esito documentato.

## Blockers e limiti

- Gruppi e preferiti della nuova UI restano nel browser; autenticazione e profilo usano Firebase
- Nessun invito, pagamento o ordine automatico; biglietto e gruppo condiviso richiedono il relativo backend
- Due posizioni locali A/B; vecchi gruppi privi di UID non sono assegnati automaticamente
- Ordine ed eliminazioni del backoffice Firestore non sono sincronizzati dal catalogo locale
- Titolare, contatti, conservazione e informativa definitiva non sono ancora definiti
- Dipendenze Next non installate; suite completa Next non eseguita

## Recent moves

- 24 ottobre: Come funziona corretto su richiesta di Cri: gruppo/regalo, opzioni/adesioni, biglietto, consegna, rimborsi; hero invariata
- 24 ottobre: 180 prodotti e foto originali collegati; filtri, affiliazione e prezzi rilevati documentati
- 24 ottobre: avvio dal prodotto corretto e riferimenti storici conservati dopo rimozione dal catalogo
- 24 ottobre: Firebase Google/email, profilo e uscita collegati; 55 test isolati complessivi superati
- 24 ottobre: guidelines e riepilogo di continuità consolidati e collegati dal README

## Standing links

- [Riepilogo per continuare](Gifty-riepilogo-continuazione.md)
- [UX e design guidelines](Gifty-UX-design-guidelines.md)
- [Flussi e decisioni](Gifty-flussi-e-decisioni.md)
- [Catalogo, API e regole](Gifty-catalogo-e-API.md)
- [Verifica autenticazione](Gifty-verifica-autenticazione.md)
- [Frontend e avvio](../../../prototype/gifty/README.md)
