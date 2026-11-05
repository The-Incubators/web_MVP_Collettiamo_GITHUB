# Controllo dei testi di tutto il sito (passo F)

5 novembre 2026, ramo `fix/gifty-testi` da `main` (8df0e82). Metodo: /find-ai-slop più le regole di Cri (niente avvisi senza motivo, persone per nome e non per ruolo, niente link di testo volanti, italiano naturale e breve, niente lineette né punti mediani, termini uguali in tutto il sito).

**Lingua e copertura.** Italiano, sito pubblico di Gifty. Ho estratto con il parser TypeScript tutte le stringhe e i testi JSX di `app/**`, `components/**` e `lib/**` (203 file, circa 2.200 stringhe, test esclusi) e le ho lette tutte, comprese etichette, `aria-label`, metadati, immagini di anteprima (OG), errori delle API e messaggi da condividere. Esclusi: test, commenti, documenti, backoffice del catalogo (`/backoffice`, `components/backoffice/**`) e la pagina delle statistiche `/gestisci/[slug]/dati`, che nessuna pagina collega. La dichiarazione di affiliazione Amazon (`lib/dominio/amazon.ts:101`) è rimasta identica.

## Correzioni a livello di sito

- **Voce.** Il sito parla con «noi» («Conserviamo», «Ti abbiamo scritto», «Non siamo riusciti a salvarla»), ma circa 40 errori dicevano «Non sono riuscito», «Non riesco», «Non trovo», «Non posso», «ho annullato». Ora sono tutti al plurale. I messaggi di attesa («Carico i preferiti…», «Controllo il link…») sono rimasti come sono: suonano naturali e non stonano.
- **«Colletta» → «regalo di gruppo».** Dove la parola si vede (errori, pagine non trovate, chiusura, privacy, invito al regalo dal biglietto). Nella pagina di chiusura, dove si parla di soldi, diventa «raccolta», parola che la pagina usava già.
- **«Collegamento» → «link»**, come nel resto del sito.
- **Punti mediani** tolti dai testi visibili (vedi sotto le eccezioni da decidere).

## Riscritture

| # | File:riga | Originale | Problema | Riscrittura | Applicata |
|---|---|---|---|---|---|
| 1 | `app/(sito)/catalogo/page.tsx:14` | Le idee regalo scelte da noi, per tema e per prezzo. | Termine: «scelte da noi» è la formula tolta in tutto il sito (riga 11 del piano) | Le nostre idee regalo, per tema e per prezzo. | sì |
| 2 | `app/(sito)/privacy/page.tsx:21` | Per pubblicare un biglietto o una colletta accedi con Google | Termine: «colletta» al posto di «regalo di gruppo» | Per pubblicare un biglietto o un regalo di gruppo accedi con Google | sì |
| 3 | `app/(sito)/privacy/page.tsx:37` | Questo è un prototipo: ecco, in breve, cosa conserviamo e perché. | Superfluo: «ecco, in breve» non aggiunge nulla | Questo è un prototipo. Qui trovi che cosa conserviamo e perché. | sì |
| 4 | `app/(sito)/termini/page.tsx:23` | I prodotti del catalogo si comprano su Amazon.it: l’acquisto lo fai su Amazon, non su Gifty. | Ridondante: dice due volte che si compra su Amazon | I prodotti del catalogo si comprano su Amazon.it, non su Gifty. | sì |
| 5 | `app/api/biglietti/[id]/route.ts:138` | Non sono riuscito a creare il link. Riprova. | Voce: il sito parla al plurale («Conserviamo», «Ti abbiamo scritto»), qui al singolare | Non siamo riusciti a creare il link. Riprova. | sì |
| 6 | `app/b/[slug]/not-found.tsx:6` | Non trovo questo biglietto | Voce: prima persona singolare, il resto del sito usa «noi» | Non troviamo questo biglietto | sì |
| 7 | `components/biglietto/StatoBozza.tsx:15` | Non trovo questo biglietto | Voce: come sopra | Non troviamo questo biglietto | sì |
| 8 | `app/c/[slug]/opengraph-image.tsx:15` | Anteprima della colletta | Termine: «colletta» | Anteprima del regalo di gruppo | sì |
| 9 | `app/c/[slug]/opengraph-image.tsx:34` | ? "persona" : "persone"} su ${Math.max(visibile.previsti, visibile.nAttesi)} hanno già partecipato | Grammatica: con 1 persona usciva «1 persona su 5 hanno» | ? "persona" : "persone"} su ${Math.max(visibile.previsti, visibile.nAttesi)} ${visibile.nConfermati === 1 ? "ha" : "hanno"} già partecipato | sì |
| 10 | `app/c/not-found.tsx:6` | Questa colletta non esiste | Termine: «colletta» | Questo regalo di gruppo non esiste | sì |
| 11 | `app/layout.tsx:36` | Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete. I soldi arrivano direttamente a te. | Vago e solo sul regalo di gruppo: «coinvolgere tutti e seguire i contributi» è uno slogan e la descrizione del sito ignora idee regalo e biglietti | Trova un’idea regalo, organizza un regalo di gruppo con un solo link e crea un biglietto di auguri da firmare insieme. I soldi arrivano direttamente a chi organizza. | sì |
| 12 | `components/BottoneListaRegali.tsx:28` | Aggiungi alla lista per votazione | Manca l'articolo («per votazione») | Aggiungi alla lista per la votazione | sì |
| 13 | `components/FormAccesso.tsx:36` | Il collegamento non è più valido. Chiedine uno nuovo. | Termine: «collegamento» qui, «link» nel resto del sito | Il link non è più valido. Chiedine uno nuovo. | sì |
| 14 | `components/FormAccesso.tsx:59` | Non sono riuscito a mandare il collegamento. Riprova fra poco. | Voce e termine: singolare e «collegamento» | Non siamo riusciti a mandare il link. Riprova fra poco. | sì |
| 15 | `components/FormAccesso.tsx:114` | Apri il collegamento da questo dispositivo per entrare. | Termine: «collegamento» | Apri il link da questo dispositivo per entrare. | sì |
| 16 | `components/FormAccesso.tsx:95` | Un attimo, con il tuo account Google. | Frase spezzata: «Un attimo, con il tuo account Google» non si capisce che cosa voglia dire | Ti basta il tuo account Google. | sì |
| 17 | `components/account/MieiBiglietti.tsx:56` | Non sono riuscito a caricare i biglietti. | Voce: singolare | Non siamo riusciti a caricare i biglietti. | sì |
| 18 | `components/account/MieiRegali.tsx:70` | Non sono riuscito a caricare i regali. | Voce: singolare | Non siamo riusciti a caricare i regali. | sì |
| 19 | `components/biglietto/bacheca/EditorNota.tsx:66` | Non sono riuscito a leggere l’immagine. | Voce: singolare | Non siamo riusciti a leggere l’immagine. | sì |
| 20 | `components/biglietto/bacheca/PaginaBacheca.tsx:162` | Non sono riuscito a pubblicare il messaggio. | Voce: singolare | Non siamo riusciti a pubblicare il messaggio. | sì |
| 21 | `components/biglietto/bacheca/PaginaBacheca.tsx:178 (×2)` | Non sono riuscito a eliminare il messaggio. | Voce: singolare (due volte) | Non siamo riusciti a eliminare il messaggio. | sì |
| 22 | `components/biglietto/bacheca/PaginaBacheca.tsx:190` | Non ci sono riuscito. Riprova. | Voce: singolare | Non ci siamo riusciti. Riprova. | sì |
| 23 | `components/biglietto/bacheca/PaginaBacheca.tsx:219` | Non sono riuscito a consegnare il biglietto. | Voce: singolare | Non siamo riusciti a consegnare il biglietto. | sì |
| 24 | `components/biglietto/bacheca/PaginaBacheca.tsx:328` | Scrivi tu il primo: gli altri seguiranno. | Promessa vuota: «gli altri seguiranno» non dice nulla di utile | Scrivi tu il primo. | sì |
| 25 | `components/biglietto/bacheca/PaginaRivelazione.tsx:37` | Non sono riuscito a riaprire il biglietto. | Voce: singolare | Non siamo riusciti a riaprire il biglietto. | sì |
| 26 | `components/biglietto/bacheca/PaginaRivelazione.tsx:46` | Anteprima · torna alla bacheca | Punto mediano; «Anteprima» è già chiaro dalla pagina | Torna alla bacheca | sì |
| 27 | `components/biglietto/campi.tsx:348` | ${etichettaFuso(f, Date.now())} · Ora italiana | Punto mediano | ${etichettaFuso(f, Date.now())}, ora italiana | sì |
| 28 | `components/biglietto/crea/CreaBiglietto.tsx:202` | Non sono riuscito a creare il biglietto. | Voce: singolare | Non siamo riusciti a creare il biglietto. | sì |
| 29 | `components/biglietto/firma/EditorFirma.tsx:211` | " · accorcia un po’ il messaggio" | Punto mediano dopo il contatore dei caratteri | ": accorcia un po’ il messaggio" | sì |
| 30 | `components/biglietto/pagine/Gestione.tsx:83` | Non sono riuscito a salvare. Riprova. | Voce: singolare | Non siamo riusciti a salvare. Riprova. | sì |
| 31 | `components/biglietto/pagine/Gestione.tsx:100` | Non sono riuscito a caricare la musica. | Voce: singolare | Non siamo riusciti a caricare la musica. | sì |
| 32 | `components/biglietto/pagine/Gestione.tsx:120` | Non ci sono riuscito. Riprova. | Voce: singolare | Non ci siamo riusciti. Riprova. | sì |
| 33 | `components/biglietto/pagine/Passo2.tsx:89` | Non sono riuscito a salvare. Riprova. | Voce: singolare | Non siamo riusciti a salvare. Riprova. | sì |
| 34 | `components/biglietto/pagine/Passo2.tsx:202` | Con una colletta ognuno mette la sua quota | Termine: «colletta» | Con un regalo di gruppo ognuno mette la sua quota | sì |
| 35 | `components/biglietto/pagine/Passo2.tsx:208` | Organizza una colletta | Termine: «colletta» | Organizza un regalo di gruppo | sì |
| 36 | `components/biglietto/pagine/Passo3.tsx:84` | Non sono riuscito a caricare l'immagine. | Voce: singolare | Non siamo riusciti a caricare l'immagine. | sì |
| 37 | `components/biglietto/pagine/Passo3.tsx:99` | Non sono riuscito a salvare. Riprova. | Voce: singolare | Non siamo riusciti a salvare. Riprova. | sì |
| 38 | `components/biglietto/pagine/Passo4.tsx:91` | Non sono riuscito a pubblicare. Riprova. | Voce: singolare | Non siamo riusciti a pubblicare. Riprova. | sì |
| 39 | `components/biglietto/pagine/Passo4.tsx:41` | "1 di 2 · L’invito" : "2 di 2 · La firma" | Punto mediano | "1 di 2: l’invito" : "2 di 2: la firma" | sì |
| 40 | `components/gestione/Chiusura.tsx:68` | Questa colletta non esiste. | Termine: «colletta» | Questo regalo di gruppo non esiste. | sì |
| 41 | `components/gestione/Chiusura.tsx:104` | Non sono riuscito a chiudere la colletta. | Voce e termine: singolare e «colletta» | Non siamo riusciti a chiudere la raccolta. | sì |
| 42 | `components/gestione/Chiusura.tsx:128` | Colletta chiusa | Termine: «colletta» (la pagina parla già di «raccolta») | Raccolta chiusa | sì |
| 43 | `components/gestione/Chiusura.tsx:197 (×2)` | Chiudi la colletta | Termine: «colletta» (due volte) | Chiudi la raccolta | sì |
| 44 | `components/gestione/Chiusura.tsx:189` | "confermati"} · Raccolta completata | Punto mediano | "confermati"}, raccolta completata | sì |
| 45 | `components/gestione/Chiusura.tsx:214` | Nessuna di queste strade scrive a chi non ha pagato. | Calco e immagine forzata: le «strade» che «scrivono» | Nessuna di queste scelte manda messaggi a chi non ha pagato. | sì |
| 46 | `components/gestione/PaginaGruppo.tsx:104` | Non posso farlo adesso. | Voce: «Non posso» in prima persona singolare | Adesso non si può fare. | sì |
| 47 | `components/gestione/PaginaGruppo.tsx:115 (×2)` | Non sono riuscito a salvare: ho annullato la modifica. Riprova fra poco. | Voce: singolare, e «ho annullato» fa parlare il sito come una persona (due volte) | Non siamo riusciti a salvare e la modifica è stata annullata. Riprova fra poco. | sì |
| 48 | `components/gestione/useGestione.ts:87` | Non posso farlo adesso. | Voce: come sopra | Adesso non si può fare. | sì |
| 49 | `components/gestione/useGestione.ts:95 (×2)` | Non sono riuscito a salvare: ho annullato la modifica. Riprova fra poco. | Voce: come sopra (due volte) | Non siamo riusciti a salvare e la modifica è stata annullata. Riprova fra poco. | sì |
| 50 | `components/gestione/useGestione.ts:127` | Non sono riuscito ad aggiungere il nome. | Voce: singolare | Non siamo riusciti ad aggiungere il nome. | sì |
| 51 | `components/partecipante/PaginaInvito.tsx:87 (×2)` | Non sono riuscito a salvare. Controlla la connessione e riprova. | Voce: singolare (due volte) | Non siamo riusciti a salvare. Controlla la connessione e riprova. | sì |
| 52 | `components/partecipante/PaginaInvito.tsx:450` | Non sono riuscito a mandare il collegamento. Riprova fra poco. | Voce e termine: singolare e «collegamento» | Non siamo riusciti a mandare il link. Riprova fra poco. | sì |
| 53 | `components/partecipante/PannelloPagamento.tsx:98` | Giro-code (EPC): da verificare su app bancarie italiane. Se non funziona, usa i dati qui sopra. | Nota tecnica per lo sviluppo, mostrata a chi paga (EPC, «da verificare») | Se il codice non funziona, usa i dati qui sopra. | sì |
| 54 | `components/reminder/PaginaReminder.tsx:145` | Aggiungi il primo compleanno: lo vedrai nel calendario e non ti sfuggirà più. | Promessa che il sito non mantiene: i promemoria non esistono ancora (D-12) | Aggiungi il primo compleanno: lo vedrai nel calendario. | sì |
| 55 | `components/wizard/PassoAccesso.tsx:60` | Non sono riuscito a mandare il collegamento. Riprova fra poco. | Voce e termine: singolare e «collegamento» | Non siamo riusciti a mandare il link. Riprova fra poco. | sì |
| 56 | `lib/biglietti/immaginiClient.ts:51` | Non riesco ad aprire questa immagine. | Voce: singolare | Non riusciamo ad aprire questa immagine. | sì |
| 57 | `lib/biglietti/immaginiClient.ts:65` | Non riesco a preparare l'immagine. | Voce: singolare | Non riusciamo a preparare l'immagine. | sì |
| 58 | `lib/dati/firestore.ts:268 (×2)` | Questa colletta non esiste. | Termine: «colletta» (due volte) | Questo regalo di gruppo non esiste. | sì |
| 59 | `lib/dati/firestore.ts:39` | Non sei collegato. Ricarica la pagina. | Ambiguo: «collegato» si legge come connessione a internet, si tratta dell'accesso | Non hai fatto l'accesso. Ricarica la pagina. | sì |
| 60 | `lib/dati/memoria.ts:72` | Questa è la colletta dimostrativa: si può guardare, non modificare. | Termine: «colletta» | Questo è un regalo di gruppo di esempio: si può guardare, non modificare. | sì |
| 61 | `lib/dati/memoria.ts:77` | Questa colletta non esiste. | Termine: «colletta» | Questo regalo di gruppo non esiste. | sì |
| 62 | `lib/dati/memoria.ts:247` | Non puoi creare una colletta per un altro. | Termine: «colletta»; «per un altro» è vago | Non puoi creare un regalo di gruppo a nome di un altro. | sì |
| 63 | `lib/dati/memoria.ts:249` | Una colletta nuova parte da zero. | Termine: «colletta» | Un regalo di gruppo nuovo parte da zero. | sì |
| 64 | `lib/dati/memoria.ts:271` | Non puoi elencare le collette di altri. | Termine: «colletta» | Non puoi elencare i regali di gruppo di altri. | sì |
| 65 | `lib/dominio/operazioni.ts:146` | La colletta è chiusa. | Termine: «colletta» | Il regalo di gruppo è chiuso. | sì |
| 66 | `lib/dominio/operazioni.ts:147` | Partecipante non trovato. | Ruolo al posto della persona: «Partecipante» | Persona non trovata. | sì |
| 67 | `lib/dominio/operazioni.ts:156` | Non trovo questo nome. | Voce: singolare | Questo nome non è nell'elenco. | sì |
| 68 | `lib/dominio/operazioni.ts:182 (×3)` | Prima partecipa alla colletta. | Termine: «colletta» (tre volte) | Prima partecipa al regalo di gruppo. | sì |
| 69 | `lib/dominio/operazioni.ts:277` | Non trovo la tua partecipazione. | Voce: singolare | Non troviamo la tua partecipazione. | sì |
| 70 | `lib/dominio/slug.ts:38` | Non riesco a generare un link libero, riprova. | Voce: singolare; «generare» è gergo tecnico | Non riusciamo a creare un link libero. Riprova. | sì |
| 71 | `lib/tipi.ts:258` | voce: "Guarisci presto" | Calco dall'inglese (get well soon) e incoerente con i modelli del biglietto, che dicono «Rimettiti presto» | voce: "Rimettiti presto" | sì |
| 72 | `lib/regalo/punteggio.ts:20` | Dal meno economico | Giro di parole: «dal meno economico» per dire «dal più caro» | Dal più caro | sì |
| 73 | `lib/dominio/gruppo.ts:75` | "Ha pagato, ricevuto" | Telegrafico e poco chiaro: «Ha pagato, ricevuto» | "Ha pagato tutto" | sì |
| 74 | `lib/dominio/messaggi.ts:20` | Regalo per ${input.festeggiato} · ${formattaEuro(input.quotaCent)} a testa | Punto mediano nel titolo dell'anteprima del link | Regalo per ${input.festeggiato}, ${formattaEuro(input.quotaCent)} a testa | sì |
| 75 | `lib/dominio/account.ts:64` | Del regalo di gruppo, ${firme(b.nFirme)} | Frase tronca: «Del regalo di gruppo, 3 firme» | Con il regalo di gruppo, ${firme(b.nFirme)} | sì |

## Da decidere

| # | File:riga | Testo | Perché non l'ho cambiato | Proposta |
|---|---|---|---|---|
| D1 | `components/biglietto/pagine/Passo2.tsx:138` | «Manderemo il biglietto in automatico alla data e all’ora che scegli. Ti ricordiamo tutto via email il giorno prima, con un link per modificarlo.» | Promette email che il sito non manda ancora (D-18): è una scelta di prodotto | Finché non c'è il servizio email: «Il biglietto si consegna alla data e all’ora che scegli.», o togliere la frase |
| D2 | `components/biglietto/pagine/Passo2.tsx:127` | «Ti avvisiamo quando gli è stato consegnato.» | Come D1 | Togliere finché non c'è l'email |
| D3 | `components/biglietto/pagine/Passo2.tsx:160` | «Lo usiamo nelle email al gruppo e per creare il link da condividere.» | Come D1 | «Lo usiamo per creare il link da condividere.» |
| D4 | `components/reminder/FormReminder.tsx:180` | «Avvisami prima di» | Il promemoria non parte ancora (D-12): il campo promette un avviso | Tenerlo e aggiungere l'email, o nasconderlo fino a D-12 |
| D5 | `app/(sito)/privacy/page.tsx:21` | «… accedi con Google: conserviamo nome, email…» | Testo della privacy; nella procedura guidata e nell'invito si accede anche con il link via email | «… accedi con Google o con un link via email: …», da far rivedere con P-07 |
| D6 | `app/(sito)/privacy/page.tsx:4, 36` | Titolo «Come trattiamo i dati» | Il piè di pagina dice «Privacy e dati», i Termini «pagina sulla privacy», l'invito «informativa privacy»: quattro nomi per una pagina | Un nome solo, per esempio «Privacy e dati» |
| D7 | `app/(sito)/privacy/page.tsx:37` | «Questo è un prototipo.» | È un avviso; serve finché il sito è un prototipo, ma la scelta è di Cri | Toglierlo al lancio |
| D8 | `app/layout.tsx:34` | Titolo «Gifty · Regali di gruppo…» e modello «%s · Gifty» | Punto mediano nei titoli delle schede del browser, dove un separatore è normale | Titolo «Gifty: regali di gruppo, idee regalo e biglietti di auguri»; per il modello scegliere il separatore |
| D9 | `components/biglietto/RiquadroMessaggio.tsx:25`, `components/biglietto/bacheca/EditorNota.tsx:113` | «— Chiara» prima della firma | Lineetta come segno grafico della firma: è disegno, non testo | Firma senza lineetta |
| D10 | `components/biglietto/Copertina.tsx:120`, `components/biglietto/pagine/Passo3.tsx:140` | «📷 CARICA LA TUA FOTO», «🖼️ CARICA UN'IMMAGINE» | Maiuscolo ed emoji: scelta di disegno della copertina | «Carica la tua foto» |
| D11 | `components/BottoneListaRegali.tsx`, `components/DettaglioProdotto.tsx`, `components/TesseraProdotto.tsx`, `components/wizard/Fogli.tsx` | «lista dei regali», «lista per la votazione», «In lista votazione», «Aggiungi al voto», «Aggiungi al regalo» | Cinque modi di dire la stessa azione; la riga 16 del piano sceglie «Aggiungi al regalo», ma per la procedura guidata (passo C) | Un solo termine in tutto il sito, da fissare nel passo C |
| D12 | `components/SchedaProdotto.tsx:102` | «* Il prezzo potrebbe variare, controlla su Amazon» | Dice la stessa cosa di `NOTA_PREZZI` con altre parole; è una nota sui prezzi Amazon, meglio non toccarla senza Cri | Usare `NOTA_PREZZI` anche qui |
| D13 | `components/Stelle.tsx:30` | «1,2k likes» | Inglese; si vede solo sul sito di prova (`LIKES_DIMOSTRATIVI=1`) | «1,2k mi piace», o toglierli |
| D14 | `components/home/Home.tsx:77` | H1 della home «Scegli il regalo di gruppo e tieni il conto delle quote» | Parla solo del regalo di gruppo, ma la home presenta tre servizi; è il testo approvato del prototipo | Da rivedere con il prototipo della home |
| D15 | `app/(sito)/regalo-di-gruppo/page.tsx:7`, `components/regalo-di-gruppo/PaginaRegaloDiGruppo.tsx:22` | «Parti dalle adesioni o dal regalo. Il gruppo resta nella vostra chat.» | Come descrizione per i motori di ricerca è poco chiara per chi non conosce Gifty; in pagina va bene | Solo nei metadati: «Organizza un regalo con amici o colleghi: un solo link da mandare nella vostra chat.» |
| D16 | `components/regalo-di-gruppo/PaginaRegaloDiGruppo.tsx:29` | `aria-label` «Le due partenze» | Lo legge solo il lettore di schermo, ma «partenze» è forzato | «I due modi di cominciare» |

## Link di testo volanti trovati (non ristilizzati)

Pulsanti o link sottolineati, da fare pillole tinte:

- `components/biglietto/pagine/Passo2.tsx:204` «Sfoglia le idee regalo» e `:207` «Organizza un regalo di gruppo»
- `components/biglietto/pagine/Passo3.tsx:150` «Cambia immagine» e `:153` «Togli l’immagine»
- `components/biglietto/pagine/Passo4.tsx:131` «Modifica i dettagli»
- `components/biglietto/campi.tsx:333` «Cambia» (fuso orario) e `:541` il link suggerito
- `components/biglietto/firma/PaginaFirma.tsx:156` «Non sei tu? Aggiungi un’altra firma»
- `components/biglietto/firma/PaginaInvito.tsx:80` «Modifica il tuo messaggio»
- `components/biglietto/bacheca/EditorNota.tsx:165` «Non sei tu? Scrivi un nuovo messaggio»
- `components/reminder/PaginaReminder.tsx:265` «Torna a oggi» e `:325` «Tutto il mese»
- `components/reminder/FormReminder.tsx:218` «Elimina questa ricorrenza» (sottolineato al passaggio)

Link dentro una frase (probabilmente accettabili, ma da guardare): `components/ElencoPreferiti.tsx:30` e `components/reminder/PaginaReminder.tsx:87` «Accedi per ritrovarli ovunque», `components/partecipante/PannelloPagamento.tsx:57` «apri il profilo di…», `components/partecipante/PaginaInvito.tsx:500` «informativa privacy».
