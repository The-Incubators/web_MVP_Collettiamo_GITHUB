# Gifty: verifica di gruppo, moduli e footer

24 ottobre 2026. Frontend locale aggiornato nel worktree separato `web_MVP_Collettiamo_GITHUB-review`, branch `feat/gifty-product-ux-spec`. Nessuna modifica a main, installazione, pubblicazione o invio esterno.

## Modifiche verificate

- Freccia del dropdown presente, a 18 px dal bordo destro; 52 px riservati al controllo per evitare sovrapposizioni
- Diciture esatte: Nome festeggiato/a, Data celebrazione, Raccolgo adesioni prima, Scelgo il regalo prima
- Rimossi dalla UI cornice e testi provvisori, inclusa “Privacy del prototipo”; footer con navigazione del catalogo, regali di gruppo e pagina “Privacy e dati”
- Quota globale modificabile direttamente nella tabella: da 10 a 12 €, con 10 € già ricevuti conservati, otto aderenti, budget 96 € e da ricevere 86 €
- Condivisione in modale: apertura, copia e chiusura con Escape mantengono l’indirizzo #group; il focus torna al pulsante di condivisione
- Persone e indirizzi da invitare nella stessa pagina; nuova email normalizzata e salvata, duplicato con maiuscole riconosciuto, nessun incremento di aderenti o budget
- Quota e invito ritrovati dopo ricaricamento e in un’altra scheda
- Gruppo consegnato: aggiunta degli invitati non disponibile; controlli delle scritture verificati nel sorgente
- Due regali suggeriti da 80 e 60 € entro il budget della verifica; il filtro non aggiunge prodotti oltre il budget o proposte fittizie quando non ci sono fondi
- Su un’origine senza dati: nessun gruppo, aderente o festeggiato precompilato; il footer apre il biglietto con titolo completo e ritorno alla home
- Modulo e gestione a 390 px CSS senza eccedenza orizzontale; etichette, valuta e icone della tabella allineate

Le prove con modifiche dei dati sono state eseguite su un’origine QA distinta (porta 4194) con fixture sintetiche e indirizzi example.test. I dati aperti dall’utente sulla porta 4193 non sono stati modificati dai test.

`node --check` e `git diff --check` superati. Revisione indipendente dei flussi e del copy con find-ai-slop. La verifica nel browser ha rilevato e risolto un conflitto di specificità CSS che nascondeva la nuova freccia.

## Stato tecnico e limiti

La UI non contiene più linguaggio provvisorio. Il funzionamento attuale resta locale: persistenza nel browser, profilo basato sul nome, nessun servizio di autenticazione o invio email collegato. Gli indirizzi aggiunti sono una lista di persone da invitare, non messaggi inviati o adesioni raccolte. Il collegamento pubblico a un gruppo condiviso fra utenti richiede ancora il backend.

La pagina “Privacy e dati” descrive questi trattamenti. Non sostituisce l’informativa legale definitiva: restano da definire titolare, contatti e trattamenti dell’ambiente pubblico. Nessuna newsletter inattiva, CMP fittizia o checkout Amazon senza destinazione reale viene presentato come servizio funzionante.

Il modello conserva ancora due posizioni locali A/B. Iniziare un nuovo regalo nella posizione corrente può sostituirne i dati; la conferma ora dichiara questa conseguenza e considera anche gli invitati in attesa. La conservazione di un numero libero di gruppi è un limite da risolvere nel modello dell’app prima dell’uso reale condiviso.
