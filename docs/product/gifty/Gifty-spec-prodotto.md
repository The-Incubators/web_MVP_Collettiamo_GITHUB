# Gifty: specifica di prodotto

Versione del 5 novembre 2026. Scritta da Claude (CriCoder) per Cri e Stefano, dopo l'audit del main al commit `5882387` (merge della PR #12), eseguito in locale in modalità memoria. Non verificati in questo lavoro: il sito pubblicato, un telefono vero, l'accesso con Google e il collegamento via email.

Questa specifica è l'unica lista delle cose da fare per Gifty. Ogni PR indica l'ID della specifica che serve (per esempio `S-03`, `F-12`, `UX-07`). Una richiesta nuova si aggiunge prima qui, poi si costruisce. Sostituisce, dove si contraddicono, `Gifty-flussi-e-decisioni.md` (ramo `feat/gifty-ux-direction-a`) e le sezioni di `DECISIONI.md` che descrivono il comportamento dei flussi; resta valido lo stile approvato in `Gifty-UX-design-guidelines.md` e nella tavola [Gifty-UX-proposta-raccomandata.png](Gifty-UX-proposta-raccomandata.png).

## 1. Che cosa è Gifty

Gifty aiuta a regalare. Ha due servizi sulla stessa home, con lo stesso account e lo stesso backend.

| Servizio | A chi serve | Che cosa contiene |
|---|---|---|
| **Regalo di gruppo** | Chi organizza un regalo con altre persone, di solito da una chat WhatsApp | Avvio del gruppo, adesioni, scelta o votazione del regalo, quote, biglietto firmato da tutti, rimborsi all'organizzatore |
| **Idee regalo** | Chi cerca un'idea per una persona | «Trova il regalo» (le domande) e il catalogo; il biglietto anche da solo |

Regola fondante: i soldi non passano mai da Gifty. Chi partecipa rimborsa l'organizzatore direttamente (PayPal, Satispay, bonifico, contanti). Gifty non vende, non incassa e non usa Stripe. Le entrate della prima fase sono le commissioni di affiliazione Amazon.it sul catalogo.

## 2. Decisioni di Cri

| ID | Decisione | Data e fonte |
|---|---|---|
| D-01 | Il sito si divide in due servizi, Regalo di gruppo e Idee regalo, sulla stessa home e sullo stesso backend | Cri, 28 ottobre 2026 |
| D-02 | «Idee regalo» vuol dire trovare idee per qualcuno: le domande di «Trova il regalo» più il catalogo | Cri, 5 novembre 2026 |
| D-03 | Il biglietto fa parte del regalo di gruppo e si offre anche da solo, a chi vuole solo il biglietto | Cri, 5 novembre 2026 |
| D-04 | Un utente ha un account che contiene i regali di gruppo e i biglietti che ha avviato, o entrambi | Cri, 5 novembre 2026 |
| D-05 | Il regalo di gruppo ha due partenze: «Facciamo il regalo?» (prima le adesioni) oppure «Ho scelto il regalo» (l'organizzatore lo manda al gruppo); la seconda può proporre un solo regalo o più regali da votare | Cri, 5 novembre 2026 |
| D-06 | Per aderire ci si iscrive a Gifty; chi ha aderito diventa un utente e può votare e suggerire regali | Cri, 28 ottobre e 5 novembre 2026 |
| D-07 | Il gruppo si crea una volta sola, su WhatsApp. L'organizzatore indica quante persone ci sono nella chat; Gifty mostra iscritti su attesi e l'organizzatore aggiunge per nome chi non si iscrive, per seguirne la quota | Cri, 5 novembre 2026 |
| D-08 | Nessun cambio di prodotto: l'organizzatore compra il regalo e lo consegna; il festeggiato non lo conferma prima. I resi si vedranno più avanti | Cri, 28 ottobre 2026 |
| D-09 | Il biglietto si crea in Gifty e si manda via WhatsApp con il suo link | Cri, 28 ottobre 2026 |
| D-10 | Gifty opera con una partita IVA, solo per fisco e amministrazione; non con Tempura. Nessuno Stripe | Cri, 28 ottobre e 5 novembre 2026 |
| D-11 | Più avanti: un catalogo talmente curato che le persone comprano anche per sé. Non in questa versione | Cri, 28 ottobre 2026 |

### Che cosa questa specifica toglie dalle versioni precedenti

| Prima | Ora |
|---|---|
| Direzione A D14 e S13–S14: il festeggiato vede il regalo e può sceglierne un altro prima dell'acquisto | Tolto (D-08). Il festeggiato riceve il biglietto e la sorpresa, non una scelta |
| Pagina del partecipante: «Nessuna registrazione: basta il tuo nome» (DECISIONI §4 punti 4–5, §5) | Per aderire serve l'account (D-06). Il recupero della riga per nome sparisce |
| Votazione che blocca le operazioni finché non si chiude (`lib/dominio/operazioni.ts:132`) | Si può aderire durante la votazione; si paga quando il regalo è deciso |
| Due home, varianti UX a cookie, `?modo=` come default (DECISIONI §25–28, §37–38) | Una home con due porte; il servizio da cui si entra decide il catalogo |
| «Reminder» al posto di «Collette» nella barra (DECISIONI §41) | Le collette tornano raggiungibili dalla navigazione; Reminder va nell'account (P-01) |

## 3. Proposte ancora da confermare

Non sono decisioni. Il lavoro può partire con l'assunzione indicata; se Cri decide diversamente, cambia solo la parte segnata.

| ID | Punto | Assunzione per lavorare | Cosa cambia altrimenti |
|---|---|---|---|
| P-01 | Dove sta Reminder | Nell'account, accanto a regali e biglietti; da ogni ricorrenza parte «Trova un regalo per {nome}» | Se resta nella barra, la barra ha cinque voci |
| P-02 | Accesso | Google e collegamento via email, come oggi; nessuna password | Un altro metodo richiede verifica e recupero propri |
| P-03 | Cosa vede chi apre il link prima di iscriversi | Festeggiato, organizzatore, regalo o scopo, quota proposta, iscritti su attesi | Se si chiede l'accesso subito, più attrito e meno adesioni |
| P-04 | Quando si chiudono le adesioni | Quando l'organizzatore consegna il regalo (invio del biglietto o «Regalo consegnato») | Va spostato il confine sul server |
| P-05 | L'organizzatore paga la sua quota? | Si chiede nel wizard: «Partecipi anche tu alla divisione?» | Cambiano divisore e quota |
| P-06 | Biglietto da solo e biglietto del gruppo | Un solo modello (`Biglietto` con `tipo` «solo-biglietto» o «con-colletta», già in `lib/tipi.ts:388`); il vecchio biglietto stampabile `/c/[slug]/biglietto` si ritira | Se restano due sistemi, due stili e due codici da tenere |
| P-07 | Titolare per l'informativa privacy | Il titolare della partita IVA. Il GDPR (art. 13) chiede di indicarlo nell'informativa: una riga nella pagina Privacy, nient'altro di visibile | Senza, l'informativa non si può pubblicare |

## 4. Persone

| Persona | Che cosa vuole | Da dove arriva | Che cosa fa in Gifty |
|---|---|---|---|
| Organizzatore | Fare il regalo senza rincorrere nessuno e sapere chi ha dato la quota | Dalla home o dopo aver scritto «Facciamo il regalo?» in chat | Crea il regalo di gruppo, condivide il link in chat, sceglie o mette ai voti il regalo, segue quote e rimborsi, prepara il biglietto, compra e consegna |
| Partecipante | Aderire, sapere quanto dare e a chi | Dal link nella chat WhatsApp | Si iscrive, aderisce, vota, suggerisce, firma il biglietto, rimborsa fuori da Gifty e lo dichiara |
| Membro della chat che non si iscrive | Niente in Gifty | Resta su WhatsApp | L'organizzatore lo aggiunge per nome e ne segue la quota (D-07) |
| Festeggiato | Ricevere il gesto | Dal link del biglietto | Apre il biglietto; non vede quote, pagamenti né recapiti |
| Chi cerca un'idea | Trovare un regalo per una persona | Home, catalogo, ricerca | Risponde alle domande, sfoglia, salva nei preferiti, va su Amazon; può fare un biglietto da solo |

## 5. Mappa del sito

Una sola home. Tutto il resto si raggiunge da tre ingressi: Idee regalo, Regalo di gruppo, account.

| ID | Pagina | Indirizzo | Note |
|---|---|---|---|
| S-01 | Home | `/` | Hero fotografica con le due porte, poi come funziona il regalo di gruppo, poi una selezione curata del catalogo |
| S-02 | Idee regalo | `/idee` (nuovo; raccoglie `/regalo` e `/catalogo`) | Ingresso alle domande e al catalogo; «Fai solo un biglietto» |
| S-03 | Trova il regalo | `/regalo` | Le domande; i risultati portano al catalogo filtrato |
| S-04 | Catalogo | `/catalogo` | Una sola griglia; azioni secondo il contesto (§9) |
| S-05 | Scheda prodotto | `/prodotto/[slug]` | Anche come finestra sopra il catalogo |
| S-06 | Regalo di gruppo | `/regalo-di-gruppo` | Spiega le due partenze e avvia il wizard |
| S-07 | Wizard del regalo di gruppo | `/crea` | Prima i dati, poi l'accesso (§7) |
| S-08 | Pagina del gruppo per l'organizzatore | `/gestisci/[slug]` | Persone, regalo o votazione, quote, biglietto, acquisto |
| S-09 | Pagina del gruppo per chi partecipa | `/c/[slug]` | Anteprima, iscrizione, adesione, voto, quota |
| S-10 | Biglietto | `/biglietto/nuovo`, `/b/[slug]` | Lo stesso per il gruppo e da solo (P-06) |
| S-11 | Account | `/account` (nuovo; raccoglie `/le-mie-collette`, `/reminder`, `/preferiti`) | Regali di gruppo, biglietti, ricorrenze, preferiti, profilo, Esci |
| S-12 | Accesso | `/accedi` | Ritorna sempre alla pagina da cui si è partiti |
| S-13 | Privacy e dati | `/privacy` | Titolare (P-07), fornitori, conservazione, diritti |

Navigazione: Home, Idee regalo, Regalo di gruppo, Preferiti (cuore con contatore), account. Sul telefono la barra in basso ha le stesse voci. La voce attiva si calcola sul segmento esatto dell'indirizzo, non sul prefisso.

Da ritirare: `/scegli-ux` e `components/SceltaUx.tsx`, `/home-nuova`, la costante `HOME_ATTIVA` e la home classica in `components/home/Home.tsx`, il parametro `?modo=` come scelta di default, le cartelle `Pagine_UX_V2`, `Pagine_UX_V3`, `Pagine_UX_V4` e `backup/`. Le cartelle `catalogo_amazon_*` si spostano in `scripts/dati/` se servono ancora agli import, altrimenti si eliminano. Prima di eliminare, Stefano conferma che non servono.

## 6. Account

- Un account per persona. Si crea all'iscrizione, da organizzatore o da partecipante (D-06).
- L'account contiene: i regali di gruppo avviati, quelli a cui si partecipa, i biglietti avviati, le ricorrenze (P-01), i preferiti, il profilo (nome, email in sola lettura, metodo di accesso, scelta newsletter), Esci.
- Preferiti e ricorrenze salvati nel browser passano all'account al primo accesso, come oggi (DECISIONI §13, §41).
- Il consenso alla newsletter è separato, facoltativo e non preselezionato; rifiutarlo non impedisce nulla.

## 7. Regalo di gruppo

### 7.1 Partenze

Il wizard chiede subito «Per chi è il regalo?» (nome, occasione, data) e poi «Da dove vuoi iniziare?» con due scelte:

| ID | Partenza | Che cosa succede |
|---|---|---|
| F-01 | **Facciamo il regalo?** Prima raccolgo le adesioni | Nessun prodotto. L'organizzatore propone una quota a testa (per esempio 10 €). Il budget previsto è quota × aderenti. Il regalo si sceglie dopo, nel budget, con un regalo solo o con una votazione |
| F-02 | **Ho scelto il regalo** | L'organizzatore sceglie un regalo dal catalogo (o incolla un link) e Gifty stima la quota dividendo il prezzo per le persone attese |
| F-03 | **Ho scelto alcuni regali: votiamo** | Variante di F-02: da 2 a 5 regali; chi ha aderito vota e può suggerirne altri se l'organizzatore lo consente. L'organizzatore chiude il voto e il regalo più votato diventa il regalo del gruppo; a pari voti decide l'organizzatore |

F-02 e F-03 sono la stessa partenza con uno o più regali: nel wizard è una sola scelta, «Ho scelto il regalo», con «Aggiungi un altro regalo da votare».

### 7.2 Passi del wizard

| Passo | Che cosa si chiede | Regole |
|---|---|---|
| 1 | Nome del festeggiato, occasione, data | Data nel futuro |
| 2 | Da dove vuoi iniziare | F-01 o F-02/F-03 |
| 3 | Quota proposta (F-01) oppure regalo o regali (F-02/F-03) | Prezzo in centesimi interi |
| 4 | Quante persone ci sono nella chat | Numero atteso (D-07); «Partecipi anche tu alla divisione?» (P-05) |
| 5 | Come ti rimborsano | PayPal, Satispay, IBAN, contanti; almeno uno |
| 6 | Accesso | Solo qui si chiede di accedere; la bozza resta e si riprende dopo l'accesso |
| 7 | Condividi | Messaggio pronto per WhatsApp con il link; anteprima neutra se il regalo è a sorpresa |

### 7.3 Adesione

- Chi apre il link vede l'anteprima (P-03) e «Partecipo». Il pulsante chiede l'accesso e poi riporta alla stessa pagina con l'adesione salvata.
- Una persona ha una sola partecipazione per regalo, legata al suo account, non al nome. Un secondo tocco o un secondo dispositivo ritrovano la stessa riga.
- Si può aderire durante la votazione e anche dopo l'acquisto, finché il regalo non è consegnato (P-04).
- «Non partecipo» registra la rinuncia senza chiedere l'accesso.

### 7.4 Iscritti, attesi e persone aggiunte a mano (D-07)

- L'organizzatore indica le persone attese (per esempio 10). La pagina del gruppo mostra «4 iscritti su 10».
- Nella lista delle persone, l'organizzatore usa «Aggiungi una persona» per chi è nella chat ma non si iscrive: nome e, se vuole, un recapito. La riga è segnata «aggiunta da te».
- Per le persone aggiunte a mano l'organizzatore segna lui quota, versamento e ricevuto. Non votano e non firmano il biglietto dentro Gifty.
- Se una persona aggiunta a mano si iscrive più tardi, l'organizzatore può collegare la sua riga all'account; non può farlo chi partecipa scegliendo un nome.
- I messaggi per la chat dicono quante persone mancano e riportano il link; non nominano nessuno.
- WhatsApp non permette a un sito di leggere i membri di una chat privata: il numero atteso lo scrive l'organizzatore.

### 7.5 Quote e rimborsi

| Termine | Significato | Chi lo cambia |
|---|---|---|
| Quota corrente | Quanto deve dare ciascuno adesso | Organizzatore; con F-01 è la quota proposta, con F-02/F-03 il prezzo diviso fra i partecipanti |
| Dichiarato | Quanto una persona dice di aver dato | La persona («Ho pagato») o l'organizzatore per le righe aggiunte a mano |
| Ricevuto | Quanto l'organizzatore conferma di aver ricevuto | Solo l'organizzatore |
| Saldo | Quota corrente meno ricevuto | Calcolato |

- Il budget previsto non è mai mostrato come denaro ricevuto.
- Se la quota cambia, il ricevuto resta; cambia il saldo. Per esempio: ricevuto 15 €, la quota sale a 18,75 €, il saldo diventa 3,75 €.
- Nessuna divisione per zero: senza aderenti non c'è una quota divisa.
- Il gruppo discute in chat; l'organizzatore riporta l'accordo in Gifty senza riconferme individuali.

### 7.6 Acquisto e consegna (D-08)

- L'organizzatore compra il regalo sul sito del venditore (link affiliato Amazon dal catalogo). Il clic non segna l'acquisto: l'organizzatore lo registra con la spesa effettiva.
- Il festeggiato non conferma e non sceglie alternative.
- «Regalo consegnato» chiude le nuove adesioni (P-04). Quote e rimborsi restano aperti finché non sono saldati.

### 7.7 Biglietto del gruppo (D-03, D-09)

- Dalla pagina del gruppo: «Prepara il biglietto». Il biglietto nasce collegato al regalo (`tipo: "con-colletta"`).
- Chi ha aderito firma dal link. L'organizzatore manda il biglietto al festeggiato con il link via WhatsApp.
- Il festeggiato vede biglietto, firme e, se l'organizzatore lo decide, il regalo; mai quote, pagamenti, recapiti.

## 8. Idee regalo

- S-02 offre due strade: «Rispondi a tre domande» e «Sfoglia il catalogo». Sotto, «Vuoi solo il biglietto?».
- Le domande restano quelle di oggi (DECISIONI §35) e finiscono sul catalogo filtrato.
- Il biglietto da solo usa lo stesso wizard del gruppo (`tipo: "solo-biglietto"`), si salva nell'account e si manda via WhatsApp.
- Dal catalogo, ogni prodotto può diventare un regalo di gruppo («Regalalo in gruppo»): porta a F-02 con il prodotto già scelto.

## 9. Catalogo e scheda prodotto

- Una sola griglia. Le azioni dipendono dal contesto, non da `?modo=`:
  - da Idee regalo: cuore, «Guarda su Amazon», «Regalalo in gruppo» come azione secondaria;
  - dentro un regalo di gruppo (scelta o proposta per il voto): «Scegli questo regalo» o «Aggiungi al voto», con la quota a testa calcolata sulle persone attese.
- Ordine di default: la selezione curata del backoffice (`stelle` e ordine in `impostazioni/catalogo`), non il prezzo crescente.
- Il cuore è l'unico modo di salvare nei preferiti: niente pulsante «Aggiungi ai preferiti» accanto.
- Il prodotto Gifty (cover iPhone) usa la stessa scheda degli altri, con la sua pagina `/prodotto/…` e nei Preferiti.
- Prezzi indicati come rilevati da Amazon, da verificare al checkout.

## 10. Stile e copy

Valgono `Gifty-UX-design-guidelines.md` e la tavola approvata. Punti che il main di oggi non rispetta e che questa specifica rende obbligatori:

- La fotografia della hero occupa tutta la larghezza; titolo e due porte stanno sopra la foto, non in un blocco prima. Fotografie distinte per desktop e telefono, già in `public/home/`.
- Il biglietto nella foto porta il suo testo (come nella tavola: «Il regalo di gruppo per Mauro», aderenti, quota, iniziali, etichetta «Esempio»), non una carta vuota.
- «Come funziona» del regalo di gruppo come racconto a passi con le scene della direzione A, nell'ordine scelto da Cri: crea il gruppo o scegli il regalo; proponi le opzioni o raccogli le adesioni; prepara il biglietto; consegna il regalo; tieni il conto dei rimborsi.
- Gerarchia dei pulsanti: una sola azione principale per blocco (verde pieno); le secondarie come link o pulsanti di contorno, non barre grigie a tutta larghezza.
- Stessa intestazione e stesso piè di pagina su tutte le pagine, compresi partecipante, biglietto e domande; le pagine del festeggiato usano l'intestazione ridotta.
- Copy in italiano naturale, solo ciò che il codice fa. Ogni testo nuovo passa da find-ai-slop. Nessun «nostri clienti», nessuna promessa di notifiche finché non esistono, niente inglese nell'interfaccia.

## 11. Audit del main al 5 novembre 2026

Verificato in locale, desktop 1280 px e telefono 375 px, modalità memoria. Gravità: P1 blocca o contraddice una decisione; P2 confonde o danneggia la fiducia; P3 rifinitura.

| ID | Gravità | Dove | Problema | Correzione (ID) |
|---|---|---|---|---|
| UX-01 | P1 | Navigazione | Il regalo di gruppo, servizio della prima fase, non ha una voce: «Collette» è stata sostituita da «Reminder» | §5 |
| UX-02 | P1 | Ovunque | Tre meccanismi paralleli di varianti: cookie di `/scegli-ux`, `HOME_ATTIVA`, `?modo=` | §5 |
| UX-03 | P1 | Home, `/regalo-di-gruppo`, `/c/[slug]` | «Nessuna registrazione» (`components/home/Home.tsx:194`, `components/partecipante/PaginaPartecipante.tsx:197`) contraddice D-06 | §7.3 |
| UX-04 | P1 | Home | La foto è una fascia sotto titolo e pulsanti; la hero non è immersiva come chiede la tavola | §10 |
| UX-05 | P2 | Home | La carta nella foto è vuota e sembra un contenuto mancante | §10 |
| UX-06 | P2 | Home | Titolo «Regalare qualcosa di originale, non è mai stato così facile…»: virgola fra soggetto e verbo, puntini, non dice che cosa fa Gifty | §10 |
| UX-07 | P2 | Home | Sette pulsanti della stessa forza prima della foto; sul telefono riempiono la prima schermata. «fatti aiutare dal nostro motore di ricerca (15 sec)» sembra un pulsante ed è un suggerimento | §10 |
| UX-08 | P1 | Home | «I Regali più amati dai nostri clienti…»: non ci sono clienti e le stelle sono un voto interno | §9, §10 |
| UX-09 | P2 | Home, catalogo | I primi prodotti sono un estrattore di semi da 4,99 € e un filtro per lavello: contraddicono «originale» | §9 |
| UX-10 | P2 | Home desktop | Due schede in una colonna stretta al centro di 1280 px, la terza da sola; titoli troncati | §10 |
| UX-11 | P2 | Navigazione | Su `/regalo-di-gruppo` è attiva «Trova regalo»: `components/Navigazione.tsx:29` confronta il prefisso `/regalo` | §5 |
| UX-12 | P2 | `/regalo-di-gruppo` | I «5 semplici passi» iniziano da «Usa il nostro motore di ricerca», contro l'ordine di Cri | §10 |
| UX-13 | P2 | `/regalo-di-gruppo` | «Noi teniamo il conto. Vedi chi ha pagato, senza chiedere»: Gifty registra dichiarazioni, non vede i pagamenti | §7.5 |
| UX-14 | P3 | `/regalo-di-gruppo` | «In 12: 1 € a testa» su prodotti da 5 € | §9 |
| UX-15 | P2 | Catalogo | Cuore e «Aggiungi ai preferiti» fanno la stessa cosa; due pulsanti per scheda; l'etichetta «3 gg» non è spiegata | §9 |
| UX-16 | P2 | Catalogo | La scheda della cover iPhone ha un'impaginazione diversa dalle altre | §9 |
| UX-17 | P1 | `/crea` | Accesso prima di qualunque dato: chi organizza non vede che cosa sta creando | §7.2 |
| UX-18 | P2 | `/accedi` | «Un attimo, con il tuo account Google» sopra un modulo email; «Sign in with Google» in inglese | §10 |
| UX-19 | P3 | `/c/[slug]` | «5 persone su 12 hanno già partecipato, 43%»: 5 su 12 fa 42%; da verificare nel calcolo | §7.4 |
| UX-20 | P2 | Biglietto | Linguaggio visivo proprio (rosa, emoji, nessun logo); su desktop l'anteprima è centrata in verticale e scende sotto la piega | §10 |
| UX-21 | P2 | Biglietto | Due sistemi di biglietto: quello stampabile `/c/[slug]/biglietto` e il wizard `/biglietto` | P-06 |
| UX-22 | P1 | Reminder | «Ti avviseremo qualche settimana prima» (`components/reminder/PaginaReminder.tsx:83`, `:157`): le notifiche non esistono | §10 |
| UX-23 | P3 | `/regalo` e home | «Tre domande, trenta secondi» contro «15 sec» | §10 |
| UX-24 | P3 | Ovunque | Parole inglesi nell'interfaccia («Reminder», «Sign in with Google») | §10 |

Cause comuni: ogni richiesta ha aggiunto una variante invece di trovare il suo posto in una struttura; la direzione A è stata portata come colori e caratteri (DECISIONI §42) senza hero, racconto e sistema delle schede; il copy non è stato riletto contro le decisioni.

## 12. Differenze dal codice

| ID | Codice di oggi | Che cosa serve | Livello |
|---|---|---|---|
| C-01 | `Colletta.prodotto` obbligatorio (`lib/tipi.ts:156`) | Regalo di gruppo senza prodotto (F-01) | 3 |
| C-02 | Votazione aperta blocca le operazioni (`lib/dominio/operazioni.ts:132`) | Adesione consentita durante il voto; pagamento quando il regalo è deciso | 3 |
| C-03 | Partecipanti con accesso anonimo e nome (`lib/auth/firebase.ts`); recupero della riga per nome (DECISIONI §4.5) | Adesione legata all'account; niente rivendicazione per nome | 3 |
| C-04 | La prima conferma congela la quota (DECISIONI §5) | Quota corrente modificabile; ricevuto e saldo separati | 3 |
| C-05 | `previsti` e liste chiuse con nomi (`lib/tipi.ts:161`, `:165`) | Attesi dalla chat, righe aggiunte a mano dall'organizzatore, collegamento a un account solo da parte sua | 3 |
| C-06 | Lo slug fa leggere IBAN, Satispay e PayPal dell'organizzatore e gli importi altrui (DECISIONI §1) | Dati di pagamento e importi dietro una funzione server con permessi | 3 |
| C-07 | Nessun confine «consegnato» sul server | «Regalo consegnato» chiude tutte le vie di aggiunta, verificato quando il server salva | 3 |
| C-08 | Biglietto stampabile e wizard separati | Un solo modello di biglietto (P-06) | 2 |
| C-09 | Varianti UX, due home, `?modo=` | Una home, catalogo secondo il contesto | 2 |
| C-10 | Regole Firestore dei reminder non pubblicate (DECISIONI §41) | Pubblicarle con il sito | 3 |

Livello 3 (dati, regole, accesso): revisione dell'architettura prima di scrivere codice, test delle regole sull'emulatore (oggi manca Java su entrambi i Mac), revisione indipendente, merge solo con l'approvazione di Stefano.

## 13. Fasi di lavoro

| Fase | Contenuto | Fatto quando |
|---|---|---|
| 0. Specifica | Questo documento; Cri risponde a P-01…P-07; Stefano lo legge e lo accetta come lista unica | Specifica sul main; nessuna PR senza ID |
| 1. Struttura | §5: home unica con due porte, nuova navigazione, `/idee`, `/account`; ritiro delle varianti; UX-01, UX-02, UX-11 | Ogni pagina raggiungibile da un ingresso; nessuna variante attiva; test e build verdi |
| 2. Stile e copy | §10: hero immersiva, racconto, schede, gerarchia, intestazione comune, copy rivisto; UX-03…UX-10, UX-12…UX-16, UX-18, UX-20, UX-22…UX-24 | Confronto con la tavola su desktop e a 390 px; design audit senza P1; find-ai-slop sul testo |
| 3. Regalo di gruppo | §7 e C-01…C-07: partenze, wizard con accesso alla fine, adesione con account, attesi e aggiunti a mano, quote, consegna, biglietto del gruppo | Criteri §14 verificati su emulatore e su un progetto di prova; revisione indipendente |
| 4. Idee regalo e biglietto da solo | §8, C-08 | Biglietto da solo creato, salvato nell'account, aperto da un altro dispositivo |
| 5. Prima del lancio | C-06, C-10, informativa con titolare (P-07), affiliazione Amazon intestata alla partita IVA, decisione sul progetto Firebase separato | Prova su telefono vero con un gruppo reale di persone |

## 14. Criteri di accettazione

| ID | Dato | Quando | Allora |
|---|---|---|---|
| AC-01 | Organizzatore senza regalo | Pubblica con «Facciamo il regalo?» | Esiste un regalo di gruppo valido senza prodotto |
| AC-02 | Organizzatore a metà wizard | Accede al passo 6 | Ritrova tutti i dati inseriti |
| AC-03 | Chi apre il link non ha account | Tocca «Partecipo» e accede | Torna alla stessa pagina con l'adesione salvata |
| AC-04 | Account già aderente | Preme di nuovo o apre da un altro dispositivo | Una sola partecipazione |
| AC-05 | Due persone con lo stesso nome | Aderiscono | Due partecipazioni distinte |
| AC-06 | Votazione aperta | Una persona aderisce | L'adesione è salvata |
| AC-07 | Votazione chiusa | Il regalo più votato | Diventa il regalo del gruppo e la quota si ricalcola |
| AC-08 | 10 attesi, 4 iscritti | L'organizzatore apre il gruppo | Vede «4 iscritti su 10» |
| AC-09 | Persona aggiunta a mano | L'organizzatore segna 10 € ricevuti | Il ricevuto del gruppo sale di 10 € |
| AC-10 | Partecipante che conosce un nome aggiunto a mano | Prova a prenderne la riga | Non può |
| AC-11 | Otto adesioni da 10 €, nessun versamento | Riepilogo | Budget previsto 80 €, ricevuto 0 € |
| AC-12 | Ricevuto 15 €, quota portata a 18,75 € | Riepilogo | Ricevuto 15 €, saldo 3,75 € |
| AC-13 | «Ho pagato» | La persona lo dichiara | Il ricevuto non cambia finché l'organizzatore non conferma |
| AC-14 | Regalo consegnato | Arriva una nuova adesione, anche da un link vecchio o aggiunta a mano | Il server la rifiuta |
| AC-15 | Organizzatore apre Amazon dal gruppo | Torna su Gifty | Nulla risulta comprato finché non registra l'acquisto |
| AC-16 | Festeggiato apre il biglietto | Lo guarda | Non vede quote, pagamenti né recapiti |
| AC-17 | Utente con un regalo di gruppo e un biglietto da solo | Apre l'account | Vede entrambi |
| AC-18 | Newsletter non scelta | Si iscrive e aderisce | Tutto funziona e non nasce alcun consenso commerciale |
| AC-19 | Chi partecipa legge direttamente il database | Chiede IBAN o importi altrui | La lettura è negata |
| AC-20 | Qualunque pagina pubblica | Telefono a 375 px | Nessuno scorrimento orizzontale; pulsanti di almeno 44 px |

## 15. Fuori da questa versione

Pagamenti dentro Gifty, Stripe, gift card, co-organizzatori con permessi, notifiche push dei reminder, resi, catalogo per comprare per sé (D-11), extra a pagamento sul biglietto.
