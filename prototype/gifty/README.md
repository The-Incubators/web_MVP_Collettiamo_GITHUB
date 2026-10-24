# Gifty: frontend locale

Interfaccia della web app Gifty nel worktree separato, direzione A. La [specifica di prodotto](../../docs/product/gifty/Gifty-flussi-e-decisioni.md) guida il lavoro; le modifiche attuali seguono D25. L’accesso usa il progetto Firebase esistente; la persistenza condivisa dei regali resta da integrare.

## Avvio

Dalla cartella del worktree: `python3 prototype/gifty/serve.py`, poi aprire http://127.0.0.1:4193. Il server è limitato al computer corrente e serve soltanto le risorse pubbliche ammesse, il catalogo e il nucleo di autenticazione condiviso. Non richiede installazioni. Ctrl+C nel terminale arresta il server.

## Interfaccia disponibile

- Due ingressi: raccogliere adesioni prima o scegliere il regalo prima
- Menu Home, Catalogo, Trova regalo, Preferiti, Collette e profilo
- Home fotografica e racconto Come funziona in cinque passaggi, con controlli da tastiera
- Catalogo dei 180 prodotti di Stefano: foto originali, filtri, ricerca, pagine da 24 elementi e affiliazione; prezzi rilevati, non aggiornati in tempo reale
- Quota globale modificabile nella tabella, con ricevuti conservati
- Condivisione in modale, senza uscire dal gruppo
- Partecipanti e indirizzi da invitare nella stessa pagina; gli inviti non aumentano budget o aderenti
- Fino a due regali nel budget effettivo e collegamento al catalogo
- Biglietto, scelta del festeggiato e registrazione di consegna e acquisto fatti fuori dall’app
- Profilo con nome e cognome modificabili, email verificata in sola lettura, metodo di accesso, stato privacy, preferenza commerciale salvata ed Esci
- Footer e pagina Privacy e dati; nessuna cornice o dicitura provvisoria nella UI

Hero e illustrazioni seguono la tavola approvata; le foto dei prodotti acquistabili provengono dalla fonte originale del catalogo. Font locali Urbanist, Source Sans 3 e Caveat, con licenze OFL nella cartella assets. Nessun font è installato nel sistema.

## Persistenza e servizi

I dati restano nel browser su questa origine. Un nuovo browser parte senza gruppi o aderenti fittizi. La vecchia chiave di archiviazione viene conservata per non perdere i dati già inseriti. Non esiste ancora una persistenza condivisa fra computer o utenti.

L’accesso usa Firebase Authentication con Google o collegamento email. L’app pubblica il regalo o registra l’adesione soltanto dopo una sessione Firebase verificata e il salvataggio del profilo con presa visione della privacy. Nome, cognome e scelta facoltativa sulle comunicazioni commerciali vengono salvati nel profilo autenticato; la preferenza non attiva una newsletter. I campi restano visibili in caso di errore, i controlli sono disabilitati durante le richieste e nessun errore crea account o adesioni locali. Un account già autenticato apre il profilo senza ripassare dal modulo di registrazione; finché Firebase recupera la sessione compare soltanto lo stato di verifica. I vecchi flag locali di accesso non attribuiscono permessi. I gruppi già pubblicati senza un UID proprietario non vengono assegnati automaticamente al nuovo account.

Il server locale legge la configurazione pubblica del progetto Firebase esistente senza servire file di ambiente o credenziali amministrative. Google e link email richiedono provider e dominio già autorizzati nel progetto. Non è prevista una modalità di accesso fittizia. Le email aggiunte al gruppo restano invece nella lista Da invitare: nessun invito, pagamento o ordine viene effettuato da questo codice. La consegna e l’acquisto sono registrazioni dell’organizzatore di azioni eseguite esternamente.

Il modello conserva due posizioni locali A/B. Un nuovo gruppo può sostituire quello nella posizione corrente: la conferma dichiara questa conseguenza, includendo eventuali indirizzi ancora da invitare. La conservazione di gruppi distinti senza questo limite va risolta prima dell’uso reale condiviso.

## Privacy e rilascio

Target Italia. Nessun tracker o servizio newsletter è collegato a questo frontend. Il servizio email di Firebase viene usato soltanto su richiesta esplicita di accesso. I dati del gruppo restano locali; autenticazione e profilo usano il progetto Firebase esistente. Titolare legale e contatto, tempi di conservazione, fornitori dell’ambiente pubblico e percorso per i diritti restano da definire prima del rilascio. La pagina Privacy e dati descrive il funzionamento attuale, senza attestare una policy legale completa.

P01, confine della consegna digitale, P02, accesso dopo la consegna, e P07, arrotondamenti, restano punti da confermare nella specifica di prodotto.

[Verifica di gruppo, moduli e footer](../../docs/product/gifty/Gifty-verifica-gruppo-footer.md). Le prove che modificano dati usano un’origine QA distinta; non scrivono nei dati aperti dall’utente sulla porta 4193.

## Verifica autenticazione

`node --test prototype/gifty/tests/auth.test.mjs prototype/gifty/tests/auth-ui-intent.test.mjs` esegue prove isolate senza inviare email o creare account reali. Le prove coprono accesso e profilo, ripristino della sessione, consenso commerciale, associazione della bozza, logout e cambio account con risposte ritardate, pulizia del callback e URL di ritorno. I link di invito usano soltanto origine e `/#invite`; non includono i parametri del collegamento di accesso.

Riferimenti consolidati: [UX e design guidelines](../../docs/product/gifty/Gifty-UX-design-guidelines.md), [catalogo e API](../../docs/product/gifty/Gifty-catalogo-e-API.md), [riepilogo per continuare](../../docs/product/gifty/Gifty-riepilogo-continuazione.md) e [stato operativo](../../docs/product/gifty/STATUS.md).
