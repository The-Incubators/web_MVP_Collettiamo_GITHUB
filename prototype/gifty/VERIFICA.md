# Gifty: verifica del prototipo direzione A

24 ottobre 2026. Revisione dopo il confronto con la tavola approvata. Worktree `web_MVP_Collettiamo_GITHUB-review`, branch `feat/gifty-product-ux-spec`, base `2eddae8`. Anteprima locale: http://127.0.0.1:4193. Main e codice dell’app Next.js invariati; nessun commit, installazione, invio o deploy eseguito.

## Risultato visivo verificato

Unica hero fotografica a tutta larghezza, con titolo e azioni sovrapposti allo sfondo con due biglietti, nastro, piante e penna; marchio verde con segno arancio; tre scene prodotto ambientate. Sono elementi HTML reali il titolo, le azioni e il testo sulla carta. La fotografia si adatta come sfondo alla superficie della hero anche sul telefono. Tipografia locale Urbanist e Source Sans 3, lettering Caveat soltanto nel biglietto illustrato. File e licenze da [Google Fonts](https://github.com/google/fonts/tree/main/ofl).

Confrontati nel browser home desktop/mobile, avvio con scelte illustrate, gruppo con riepilogo a icone e destinatario su fondo pesca. Le otto righe del gruppo senza versamenti misurano 48 px sul telefono; la ricerca del regalo precede le azioni secondarie. I dettagli degli importi rimangono per versamenti e pagamenti da verificare. La pagina del destinatario conserva il solo marchio e non espone le quote.

Misurate home a 1280 e 390 pixel CSS, gruppo e destinatario a 390: nessuna eccedenza orizzontale nelle viste controllate. Logo, foto e font richiesti localmente; nessuna immagine mancante nella home. Le catture possono avere una risoluzione nativa diversa dalle dimensioni CSS.

Le immagini sono ricostruzioni degli asset della tavola, non un ritaglio della sua interfaccia. Le proporzioni responsive e la resa del nastro sul prodotto non sono identiche a ogni pixel del raster. Non è stata eseguita una certificazione di accessibilità o una prova su telefono fisico.

Misura dopo il chiarimento D24: hero e sfondo iniziano a x=0 e occupano la larghezza del viewport (1422 px CSS rilevati), con testo compreso nella stessa superficie e nessuna eccedenza orizzontale. L’altezza può superare il viewport. Controlli dimostrativi aperti e cambio A/B verificati dopo la sovrapposizione dell’intestazione.

## Menu e azioni ricontrollati in questa revisione

- Home, Catalogo, Trova regalo, Preferiti e Collette presenti e navigabili; menu mobile e barra inferiore sulle pagine principali
- Aggiunta dello speaker ai preferiti, conteggio aggiornato e presenza dopo ricaricamento; posizione e focus conservati dal controllo
- Trova regalo con interesse Musica e budget 50 € mostra il mini speaker da 30 €
- Collette apre i due esempi conservando otto e undici aderenti prima del ripristino del solo esempio B
- Menu profilo con account, organizzazione, biglietto, collette e privacy; apertura e chiusura con Escape provate
- Consegna simulata del secondo esempio ricontrollata; destinatario vede regalo e alternative senza dati economici del gruppo
- Collegamento da tastiera al contenuto: mantiene la pagina corrente e porta il focus al contenuto; corretto il precedente conflitto con il router degli indirizzi

## Flussi e calcoli

I due ingressi, la creazione senza prodotto, le adesioni, la dichiarazione distinta dal ricevuto, la conferma dell’organizzatore, il cambio quota con ricevuti conservati, le alternative e l’acquisto simulato erano stati attraversati nella prima verifica. Le relative regole sono rimaste nella revisione visiva. Gli ID dei prodotti e gli importi d’esempio sono conservati; i tre nomi visibili ora corrispondono alle nuove fotografie: Speaker portatile, Lampada da tavolo, Zaino da città.

La verifica precedente ha incluso: nuovo gruppo con zero aderenti; otto adesioni da 10 € con budget previsto 80 € e ricevuto zero; regalo da 150 € stimato in dieci a 15 €; dichiarazione da 10 € senza aumento del ricevuto; conferma e successiva quota da 12 € con 10 € ricevuti conservati; invito chiuso dopo la consegna; accesso del membro già iscritto. Questa revisione non presenta tali prove come nuovi test completi di backend.

`node --check prototype/gifty/app.js` e `git diff --check` superati dopo le modifiche. Ricontrollata la funzione reale di salvataggio con memoria locale indisponibile: restituisce errore e ripristina l’ultimo stato valido; il test rifiuta una versione alterata che restituisce un falso successo. Revisione indipendente di sorgenti, copy e schermate; find-ai-slop applicato anche ai nuovi testi del menu e della ricerca. Specialisti con modello ereditato dalla sessione.

## Limiti operativi

Account, pagamenti, invii e acquisti sono simulati. I dati sono sintetici e restano nel browser; il selettore delle viste non rappresenta autenticazione o permessi reali. Nessuna API Firebase, email o acquisto Amazon viene chiamata. Immagini, nomi e prezzi non attestano disponibilità commerciale. Newsletter, gift card, call ed extra a pagamento non sono attivati.

P01, chiusura all’invio digitale, P02, accesso degli iscritti dopo la consegna, e P07, arrotondamenti, restano ipotesi per esplorare il percorso. Per il prodotto reale occorrono decisioni definitive, persistenza server, permessi e informative effettive. Non sono state installate o eseguite le dipendenze dell’app esistente.
