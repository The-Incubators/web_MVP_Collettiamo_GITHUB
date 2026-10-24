# Gifty: catalogo, API e regole esistenti

Verifica del codice nel worktree separato, 24 ottobre 2026. Il collegamento locale è di sola lettura e non cambia main, dati Firebase o impostazioni dei servizi.

## Che cosa è stato portato nella nuova interfaccia

Il catalogo mostra i **180 prodotti del repository**, con nomi, marche, descrizioni, prezzi in centesimi, fotografie originali, classificazioni, ASIN e collegamenti Amazon.it. Non usa le tre immagini illustrative del mockup come foto dei prodotti in vendita.

La fonte resta `lib/dati/catalogo-amazon.json`; il server locale legge direttamente quel file. Non esiste una seconda copia del catalogo o delle 180 foto. Le foto vengono servite dalla cartella esistente `public/foto-prodotti/`. Tutte le 180 immagini sono presenti, per circa 4,23 MB complessivi.

I prezzi sono quelli rilevati **il 14, 15 e 16 ottobre 2026**, non quotazioni aggiornate in tempo reale. Il catalogo e ogni scheda mostrano la data; il prezzo e la disponibilità effettivi si verificano su Amazon. Le proposte e le quote usano il valore rilevato come base iniziale, mentre la spesa finale può essere registrata dall’organizzatore.

Il catalogo locale include ricerca per nome, marca, descrizione e tipo, temi, destinatario, età, fascia prezzo e sottocategoria. Mostra 24 prodotti per volta e permette di caricarne altri. Le immagini fuori schermo sono caricate progressivamente. Un errore della fonte mostra uno stato esplicito con Riprova, senza inserire prodotti fittizi o azzerare i riferimenti dei regali già salvati.

I sei riferimenti precedenti della UI sono conservati soltanto per risolvere regali già presenti nel browser. Non compaiono nel catalogo pubblico e non ricevono ASIN o link Amazon inventati. Anche gli identificativi dei vecchi preferiti restano archiviati, ma i contatori e la lista del catalogo contano i prodotti reali disponibili.

## Il percorso attuale dei dati di Stefano

| Passaggio | Fonte e comportamento verificato |
|---|---|
| Pacchetti editoriali | `catalogo_amazon_prototipo/`, `catalogo_amazon_150_300_50_prodotti/`, `catalogo_amazon_arredamento/`, `catalogo_amazon_evergreen/`: Excel e immagini |
| Importazione | `scripts/importa_catalogo.py` legge i fogli con la libreria standard Python, normalizza e valida i record, genera JSON e foto pubbliche |
| Modello del catalogo | `lib/dati/catalogo-dati.ts` converte le voci in `Prodotto`, applica affiliazione, fotografia e classificazione; i tre giorni di consegna sono una stima tecnica, non dati Amazon |
| Firebase | `scripts/seed.ts` scrive i prodotti in Firestore, preserva le posizioni esistenti e rimuove quelli non più presenti nella fonte |
| Lettura Next | `lib/dati/index.ts` sceglie l’adattatore; `lib/dati/firestore-admin.ts` e `lib/dati/firestore.ts` leggono il database; `lib/dati/memoria.ts` usa il catalogo locale nella modalità alternativa |
| Nuova interfaccia locale | `prototype/gifty/serve.py` espone `/catalogo.json` e solo le foto pubbliche con nome ammesso; `catalog.mjs` valida la risposta e `app.js` usa i prodotti nel catalogo, nelle proposte, nei preferiti e nel limite di budget |

Gli script di importazione e seed sono stati letti, non eseguiti. L’importazione riscrive la cartella delle foto; il seed può rimuovere prodotti da Firestore. Il nuovo collegamento non richiede queste operazioni.

## Regole del catalogo

- ID stabile `PRD-nnn`, ASIN di dieci lettere maiuscole o cifre, ID e ASIN univoci durante l’importazione
- Nome e descrizione obbligatori, con i limiti già imposti dall’importatore; prezzi da 100 a 100.000 centesimi
- URL di prodotto Amazon.it coerente con l’ASIN; immagini locali con estensione e firma binaria ammesse, fino a 2 MB ciascuna nell’importazione
- Slug normalizzato dal nome, con suffisso ID in caso di collisione
- Destinatari `uomo` e `donna`; temi `viaggio`, `tecnologia`, `arredamento`
- Età classificata editorialmente in `lib/dati/eta-prodotti.ts`, separata dall’Excel: bambino 0–12, adolescente 13–17, ragazzo 18–29, adulto 30+. Tutti i 180 prodotti sono classificati
- Sottocategoria facoltativa, oggi usata soprattutto per arredamento e design
- Fasce prezzo lette dalla costante esistente `FASCE_PREZZO` in `lib/tipi.ts`: fino a 30 €, 30–80 €, 80–150 €, 150–200 €, oltre 200 €. I confini seguono il codice originale: minimo escluso, massimo incluso
- Ordinamento del modello originale: posizione editoriale, poi prezzo crescente, poi nome. Nel locale il JSON non contiene le posizioni Firestore, quindi vale prezzo crescente e nome

## Affiliazione

La costante del tracking ID è già in `lib/dominio/amazon.ts`: **`pacestefano77-21`**. Il server la legge dalla fonte esistente. I collegamenti del nuovo catalogo accettano soltanto HTTPS verso `amazon.it`, `www.amazon.it` o `m.amazon.it`, senza credenziali o porte aggiunte, con percorso `/dp/ASIN` coerente. Il tag viene aggiunto o corretto senza duplicazioni.

La scheda del prodotto consente di vedere il prodotto su Amazon. La pagina di acquisto permette di seguire il collegamento affiliato; l’organizzatore registra poi l’acquisto fatto esternamente. Nessun pulsante esegue ordini o pagamenti automatici. I link sono aperti con `rel="sponsored nofollow noopener noreferrer"`.

La dichiarazione affiliata nel footer viene letta dalla costante originale `DICHIARAZIONE_AFFILIATO_AMAZON`, senza riscriverne il testo. Il port non certifica la titolarità o la licenza delle foto esistenti: il documento Amazon del progetto ne indica già la verifica prima della pubblicazione.

## API effettivamente presenti

| Percorso | Stato verificato |
|---|---|
| `GET /api/admin/catalogo` | Endpoint Next protetto: prodotti, ordine e impostazioni per il backoffice |
| `PUT /api/admin/catalogo` | Endpoint Next protetto: salva modo, ordine manuale e stelle e aggiorna le posizioni |
| `PATCH /api/admin/catalogo` | Endpoint Next protetto: elimina o ripristina un prodotto con il flag `eliminato`; non cancella il documento |
| `POST /api/memoria` | Ponte Next verso l’adattatore in memoria, con metodi ammessi fra cui `elencaProdotti` e `prodotto`; restituisce 404 se il progetto usa Firestore. Non è una API Amazon |
| `GET /catalogo.json` | Nuovo endpoint locale di sola lettura: campi editoriali consentiti, classificazione età, fasce prezzo e metadati affiliati. Nessuna credenziale Admin o altro ambiente è esposto |
| `GET /foto-prodotti/PRD-nnn.ext` | Nuova lettura delle fotografie pubbliche già esistenti, con nome ed estensione controllati |

L’endpoint amministrativo non è stato copiato o reso pubblico dal server locale. In Firestore la collezione prodotti richiede autenticazione per la lettura ed è scrivibile solo dal server Admin; il port locale legge il file editoriale nel repository, senza cambiare queste regole.

## Amazon Creators API: progetto documentato, integrazione assente

`AMAZON_AFFILIATES_API.md` contiene una ricerca datata **20 ottobre 2026** e una proposta di integrazione con Creators API: `GetItems`, `SearchItems`, `GetVariations`, `GetBrowseNodes`, aggiornamenti a lotti, cache e selezione editoriale. La stessa fonte dichiara che accesso all’account, idoneità e credenziali non erano stati verificati.

Nel codice portato non è presente un client Creators API operativo, né una sincronizzazione programmata di prezzi o disponibilità. Il documento esistente è un riferimento per quel lavoro futuro, non prova che l’API sia già collegata. Questo intervento non ha chiamato Amazon, richiesto credenziali, creato account o cambiato il catalogo remoto.

## Limiti espliciti del collegamento locale

Il JSON e le foto sono la fonte editoriale presente nel worktree. Modifiche all’ordine, eliminazioni e aggiornamenti fatti esclusivamente nel backoffice Firestore non vengono sincronizzati in questa UI locale. Anche i preferiti della UI restano nel browser, come il resto dello stato dei gruppi; non vengono migrati nei preferiti Firestore dell’app originale. La sincronizzazione dei due ambienti è un intervento distinto.

## Avvio dal catalogo

Da una scheda prodotto, Proponi al gruppo avvia il percorso con regalo già scelto se non è stato ancora indicato il festeggiato. Il prodotto resta selezionato mentre si compilano nome, occasione e data; poi si apre la pagina della quota con la miniatura del regalo. Se esiste un gruppo che verrebbe sostituito, si usa la conferma già presente: prima della conferma e dopo Annulla i dati restano intatti. Anche dopo la conferma il nuovo prodotto è soltanto una scelta in preparazione; la sostituzione avviene quando si invia il modulo del nuovo gruppo. Nei percorsi già avviati si conservano modo A/B e destinatario, mentre chi gestisce un gruppo esistente può cambiarne il regalo.

## Verifiche

Nove test del nuovo adattatore coprono i 180 record, prezzi e foto della fonte, conversione affiliata, rifiuto dei link pericolosi, dati non validi, fasce prezzo, filtri combinati, ordinamento, errore di rete e date di rilevazione. Sette prove aggiuntive eseguono le funzioni reali di proposta e il gestore reale del modulo: avvio fresco, conservazione del prodotto, conferma/annullamento della sostituzione, modifica di un gruppo posseduto e conservazione dei percorsi già avviati. Le 36 prove di autenticazione esistenti restano superate, per 55 prove complessive. Tre prove aggiuntive verificano il ripristino reale dello stato quando un prodotto è stato rimosso dalla fonte: gruppi, quote, partecipanti e identificativi dei preferiti vengono conservati; identificativi malformati o di tipo errato restano respinti. Il prodotto rimosso non viene ricreato come voce acquistabile e nel gruppo compare uno stato esplicito di indisponibilità. Il server è stato controllato anche con la sua funzione reale di composizione: 180 prodotti, cinque fasce prezzo e 180 classificazioni d’età.
