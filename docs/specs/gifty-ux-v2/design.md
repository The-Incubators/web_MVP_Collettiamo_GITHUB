# Gifty UX v2: sistema visivo e schermate

_Proposta del 5 novembre 2026 da approvare prima di scrivere codice. Il secondo giro dello stesso giorno (revisione di Cri, `piano.md` righe 1–19) è nel §10 e cambia le righe indicate qui sotto. Prototipi in `prototipi/` (apri `prototipi/index.html` servendo la radice del repository), schermate a 390 e 1280 px in `schermate/`, valori numerici in `design-scale.json`. Dati di esempio, nessun backend._

Fonti vincolanti: tavola approvata `docs/product/gifty/Gifty-UX-proposta-raccomandata.png`; `Gifty-architettura-e-flussi.md`; `Gifty-spec-prodotto.md` (D-01…D-19); linee guida della direzione A sul ramo `feat/gifty-ux-direction-a` (`Gifty-UX-design-guidelines.md`, `Gifty-assets-direzione-A.md`, `Gifty-copy-interfaccia.md`, `Gifty-proposta-UX-design.md`); audit UX del 5 novembre (42 problemi). L'ultimo pannello della tavola (il festeggiato sceglie, «Guardo le alternative») non vale più: D-08.

## 1. Decostruzione della tavola approvata

La tavola è il riferimento scelto da Cri: non propongo direzioni alternative, la porto su tutte le schermate. La ricerca sui concorrenti (Satispay, Growish, GroupTogether, Thankbox, 24 ottobre 2026) è in `Gifty-proposta-UX-design.md` sul ramo della direzione A e resta valida; questo lavoro non la ripete.

| Meccanica | Che cosa fa la tavola | Come la porto |
|---|---|---|
| Griglia e densità | Hero a tutta larghezza; titolo a sinistra, molto aria; sotto, tre tessere prodotto grandi; schermate operative a una colonna da telefono | Pagine di presentazione larghe (max 1200 px), compiti in una colonna (max 560 px) con l'anteprima a destra solo su desktop |
| Tensione tipografica | Titolo Urbanist 800 verde molto grande (circa 4:1 sul corpo), corpo Source Sans regolare, scritta a mano solo sul biglietto | Scala in §3.2: 64/16 su desktop, 36/16 sul telefono; Caveat solo dentro gli oggetti-biglietto |
| Superfici | Fondo verde quasi bianco continuo; la foto non ha cornice; le schede operative sono bianche, piatte, con un filo sottile | Gruppi separati da spazio e filo `line`; ombra solo per oggetti appoggiati sulla scena; mai schede dentro schede |
| Controlli e flusso | Un pulsante verde pieno per schermata, campi alti con etichetta sopra, due partenze come scelte grandi con radio visibile | Una sola azione primaria per blocco; scelte da 2 a 5 come radio o chip visibili; nessun menu a tendina per l'occasione |
| Elemento distintivo | Il biglietto nella foto porta il testo vero del gruppo («Il regalo di gruppo per Mauro», 8 persone, 10 € a testa, iniziali, «Esempio») e un nastro arancio unisce i due biglietti | Il biglietto diventa l'oggetto del regalo di gruppo: lo stesso foglio di carta con la scritta a mano apre il wizard, la pagina del gruppo, la pagina di chi è invitato, l'editor e l'apertura. Il nastro compare solo in hero, nel racconto «Come funziona» e nell'apertura del biglietto |

Tolto dalla tavola: il link sottolineato «Esplora le idee regalo» sotto il pulsante (Cri: niente link di testo isolati), il menu a tendina «Compleanno» (diventa chip), il pannello del festeggiato che sceglie (D-08).

## 2. Direzione

Una scena di carta su un tavolo: biglietti avorio, iniziali colorate, nastro arancio, piante. Tutto il prodotto è fatto degli oggetti che il gruppo si scambia davvero (il biglietto, il nome di chi festeggiamo, le iniziali di chi aderisce, la quota), non di card SaaS. La differenza dagli altri siti di Cri è già fissata dalla tavola: verde bosco `#033922` con nastro `#FD5D17`, Urbanist con Source Sans 3 e Caveat.

Parole chiave: biglietto, nastro, tavolo, firma, quota.

Controllo sui difetti tipici: nessun fondo crema con serif e terracotta (il fondo è verde quasi bianco, l'arancio è il nastro del marchio e non colora testi né pulsanti); nessun kit di card identiche (raggi per ruolo, ombra solo sugli oggetti di carta); nessuna etichetta maiuscola sopra i titoli; nessuna stringa con puntini mediani; nessuna freccia appesa ai pulsanti; numeri dei passi solo dove c'è una sequenza vera (racconto, wizard, domande).

## 3. Sistema

### 3.1 Colore

Contrasto calcolato con la formula WCAG sui valori esadecimali.

| Token | Valore | Ruolo | Contrasto |
|---|---|---|---|
| `paper` | `#F5FAF6` | fondo pagina | |
| `wall` | `#E9F2EC` | parete della scena: hero, lastre dei prodotti, scene del racconto | campionato dalla foto |
| `table` | `#EBE0D4` | piano del tavolo (riferimento, non usato come fondo) | |
| `surface` | `#FFFFFF` | campi, porte, pannelli, finestre | |
| `card-paper` | `#F7F0E6` | carta dei biglietti, solo negli oggetti-biglietto | |
| `ink` | `#142B20` | testo | 14,2:1 su `paper` |
| `muted` | `#52665B` | testo di supporto | 5,8:1 su `paper`, 5,4:1 su `wall`, 6,2:1 su bianco |
| `green` | `#033922` | titoli, azione primaria, selezione, focus | 12,3:1 su `paper`; bianco su verde 13:1 |
| `green-hover` / `green-press` | `#0B4A2F` / `#022A19` | stati del pulsante primario | |
| `green-field` | `#E3F2E7` | selezionato, hover dei controlli, stato «aperto» | verde su questo 11,2:1 |
| `line` | `#D9E4DC` | separatori | decorativo |
| `line-strong` | `#7A8C81` | bordi dei controlli | 3,6:1 su bianco (WCAG 1.4.11) |
| `orange` | `#FD5D17` | nastro, cuore pieno, tacca del passo attuale, sottolineatura della voce di menu attiva | 3,1:1 su bianco: solo grafica, mai testo |
| `peach` | `#FFE9DE` | consegna e festeggiato | `ink` su pesca 12,9:1 |
| `error` | `#B52525` | errori con testo | 6,5:1 su bianco |

Iniziali: otto tinte pastello (`c1`…`c8`) con testo `ink`; il colore distingue soltanto, l'identità la dà sempre il testo. Gli stati hanno sempre un'etichetta scritta.

### 3.2 Tipografia

Famiglie locali con licenza OFL, già presenti sul ramo della direzione A e copiate in `prototipi/font/`: Urbanist (titoli e cifre), Source Sans 3 (testo e controlli), Caveat (solo scritte a mano sui biglietti, mai etichette, importi o consensi).

| Passo | Telefono | Desktop | Peso | Interlinea | Tracking |
|---|---|---|---|---|---|
| `t-hero` | 36 | 64 | Urbanist 800 | 108% / 104% | −0,03 em |
| `t-pagina` (H1) | 32 | 40 | Urbanist 800 | 110% | −0,025 em |
| `t-sezione` (H2) | 24 | 24 | Urbanist 700 | 125% | −0,015 em |
| `t-titolo` (porte, passi del racconto) | 20 | 20 | Urbanist 700 | 130% | −0,01 em |
| `t-corpo` | 16 | 16 | Source Sans 3 400/600/700 | 145% | 0 |
| `t-piccolo` | 14 | 14 | Source Sans 3 400/700 | 140% | 0 |
| barra in basso | 12 | | Source Sans 3 600 | 120% | 0 |
| prezzo in tessera, cifre del gruppo | 20 / 24 | | Urbanist 700, cifre tabulari | | −0,01 em |
| scritta a mano | 24–64 | | Caveat 600/700 | 100–110% | 0 |

Tutte le cifre usano `tabular-nums` (impostato sul `body`); colonne di importi allineate a destra. Righe di testo sotto 80 caratteri (verificato dall'audit: nessuna riga oltre). Titoli senza punto finale.

### 3.3 Spazio, raggi, ombra, impaginazione

- Spazio a base 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Dentro un gruppo si usa meno spazio che fra gruppi.
- Raggi per ruolo: carta e foglietti 4 px; pulsanti e campi 10 px; porte, lastre, pannelli 20 px; pillole, chip e iniziali tondi. Miniature 12–14 px.
- Una sola ombra (`--ombra-carta`) per ciò che è appoggiato sulla scena: biglietti, porte sopra la foto, finestre. I pannelli sulla pagina sono piatti con filo `line`.
- Larghezze: pagina 1200 px, margini 20 px sul telefono e 40 px da 768 px; percorsi a passi 560 px più anteprima 400 px da 900 px; pagina di chi è invitato 560 px.
- Archetipi: presentazione larga (home, servizi), percorso a una colonna (domande, wizard, invito), registro (persone e quote), lavoro con anteprima (editor del biglietto).

### 3.4 Movimento

Solo in risposta a un gesto: pulsante premuto (1 px), immagine della tessera al passaggio (scala 1,04), passo del racconto selezionato. Niente animazioni d'ingresso. `prefers-reduced-motion` azzera tutto.

## 4. Componenti e stati

| Componente | Anatomia | Stati e regole |
|---|---|---|
| Intestazione | logo (nastro + «Gifty», porta alla home), Idee regalo, Regalo di gruppo, Biglietto, cuore con il numero dei preferiti, tondo dell'account che apre il menu utente (§10.3). Sul telefono: logo e cuore | Voce attiva: verde 700 con tratto arancio sotto, calcolata sul segmento esatto dell'indirizzo. Hover: fondo `green-field`. In home è trasparente sulla parete della scena. Uguale su tutte le pagine tranne quelle del festeggiato e l'editor a schermo intero |
| Barra in basso (telefono) | Home, Idee regalo, Gruppo, Biglietto, Account (apre il foglio del menu utente), icona e nome | Voce attiva verde 700; premuto `green-field`. Nascosta da 768 px |
| Hero | parete `wall` continua, titolo sulla parete, foto sotto con il bordo superiore sfumato nella parete, testo HTML posato sul biglietto con una trasformazione prospettica calcolata dai quattro vertici della faccia del biglietto (`posaSullaFoto` in `comuni.js`) | Foto desktop 1774×887 da 768 px, foto telefono 1374×1145 sotto; su desktop la foto è tagliata in basso a 46vw perché le tre azioni stiano nel primo schermo a 1280×800. Il testo sul biglietto è nascosto ai lettori di schermo; l'`alt` della foto lo riporta |
| Porta | segno (miniatura), nome del servizio, una riga, un'azione | Tre porte appoggiate sul bordo del tavolo. Regalo di gruppo ha il pulsante pieno, le altre due il contorno: una sola azione forte nella hero |
| Pulsante | 48 px, raggio 10, Source Sans 700 | Primario verde pieno; contorno verde; quieto (testo verde con fondo al passaggio, per azioni secondarie dentro un blocco). Hover, focus (anello verde 3 px a 2 px), premuto, disabilitato grigio, in corso con rotella e `aria-busy` |
| Pillola «Guarda come si fa» | piccola e tinta: fondo `green-field` alto 32 px dentro un'area da toccare di 44 px, testo verde 14 px 700 | Accanto al titolo del blocco, mai accanto all'azione principale (riga 12). Variante con ▶ in un tondo verde solo quando apre un video |
| Chip | tondo, 44 px | Scelta singola (`role="radio"`) o multipla (`aria-pressed`); selezionato verde pieno con spunta |
| Scelta grande | radio visibile, nome Urbanist 20, una riga di supporto | Selezionata: bordo verde e fondo `green-field`. Usata per le partenze e per i modi del biglietto |
| Campo | etichetta sopra, 48 px, bordo `line-strong` | Larghezza secondo il valore: nome 22 rem, importo 9 rem con «€» dentro a destra, data 11 rem, ora 9,5 rem, numero con contatore −/+. Errore accanto al campo, testo non cancellato |
| Tessera prodotto | lastra quadrata `wall` con la foto in `multiply` (il fondo bianco delle foto Amazon scompare nella parete), cuore in alto a destra, nome su due righe, prezzo e marca, «Guarda su Amazon» pieno, «Aggiungi a un regalo di gruppo» quieto | Il cuore è l'unico modo di salvare. Nel contesto del wizard la stessa tessera prende «Scegli questo regalo» o «Aggiungi al voto» (spec §9). La nota sui prezzi compare una volta per pagina |
| Indicatore dei passi | freccia indietro, «2 di 6», tacche (fatte verdi, attuale arancio) | Nelle domande sta sotto l'intestazione. Nel wizard del regalo di gruppo è la barra a tutta pagina del §10.1 |
| Biglietto (oggetto) | carta `card-paper` con grana, raggio 4, lieve rotazione, titolo a mano, righe in Urbanist o Source Sans, iniziali | Firma visiva del prodotto. Nel wizard si scrive mentre rispondi; nel gruppo e nell'invito è la testata |
| Registro | tabella su desktop (Persona, Quota, Dichiarato, Ricevuto, Saldo, azione), elenco sul telefono (nome, stato in parole, saldo a destra, azione sotto) | Cifre a destra e tabulari; «–» per vuoto; le righe aggiunte a mano portano «aggiunto da te» |
| Stato | pillola 32 px con testo | `green-field` per aperto o fatto, `peach` per consegna e quota da pagare, `wall` per neutro o chiuso |
| Finestra | foglio dal basso sul telefono, centrata su desktop | Chiudi con l'icona; usata per l'accesso |
| Barra dei voti | barra orizzontale verde, lunghezza proporzionale, etichetta diretta «3 voti» | Una sola serie: nessuna legenda; il numero è sempre scritto |

## 5. Schermate

Ogni file ha in alto a destra i link agli stati (strumento del prototipo, non del design; spariscono con `?scatto=1`).

| Schermata | File | Scopo e impaginazione | Passi per il compito principale |
|---|---|---|---|
| Home | `home.html` | Hero con il biglietto scritto; tre porte sul bordo del tavolo; «Le nostre scelte» (4 tessere, sul telefono a scorrimento); «Come funziona il regalo di gruppo»: cinque passi tutti visibili sul nastro (orizzontale su desktop, verticale sul telefono), ognuno con chi lo fa, una scena e una frase; un'azione sotto i passi (rifatto il 5 nov: le schede nascondevano quattro passi su cinque e non dicevano chi compra il regalo), pillola del tutorial nel blocco | 1 tocco per entrare in un servizio |
| Idee regalo | `idee.html` | La prima domanda («Per chi cerchi un regalo?», Per lei / Per lui) è già sulla pagina; accanto, «Sfoglia il catalogo»; sotto, «Le nostre scelte» | Domande: 1 tocco qui, 1 per l'età, 1 per l'occasione, 1–2 per gli interessi, «Mostra le idee»: 5–6 tocchi |
| Domande | `domande.html?passo=2|3|4` | Quattro passi (riga 10): età a quattro fasce dal catalogo (Bambina 0–12, Adolescente 13–17, Ragazza 18–29, Adulta 30 e più; al maschile dopo «Per lui»), occasione, interessi; età e occasione con passaggio automatico | |
| Risultati | `risultati.html` | Le risposte come chip modificabili, griglia, nota prezzi una volta | |
| Catalogo | `catalogo.html` | Temi a chip, fasce di prezzo a segmenti, ordine curato come predefinito | |
| Scheda prodotto | `prodotto.html` | Lastra grande con cuore; prezzo, descrizione, «perché» del catalogo; «Guarda su Amazon» pieno, «Aggiungi a un regalo di gruppo» contorno | 1 tocco per Amazon o per il wizard con il regalo già scelto |
| Regalo di gruppo | `regalo-di-gruppo.html` | Titolo con la pillola accanto, azione; le due partenze come due biglietti; racconto; «Guarda un regalo di gruppo di esempio» | |
| Wizard | `crea.html?passo=1…7` | Rifatto nel secondo giro, vedi §10.1: a tutta pagina; 1 Per chi, 2 Persone nella chat, 3 Da dove vuoi iniziare (tre scelte), 4 quota, regalo dal foglio del catalogo o regali da votare con la data di fine, 5 Rimborsi, 6 Riepilogo con l'accesso, 7 Condividi | Partenza A: 12 interazioni (erano 15); dal prodotto: 10 (erano 14) |
| Il tuo gruppo | `gestisci.html?stato=aperto|voto|consegnato` | Testata con nome, occasione, «Organizzato da Cri», stato, quattro cifre (Iscritti 3 su 10, Quota con matita, Ricevuto, Da ricevere); Persone con «Manda il link nella chat», posti occupati e vuoti, registro, «Aggiungi una persona»; a lato Il regalo («Scegli il regalo» nel budget o votazione con «Chiudi la votazione»), Biglietto, Consegna («Regalo consegnato»). Dopo la consegna: «Manda un promemoria a N persone» e il promemoria per riga (D-12) | Segnare un pagamento ricevuto: 1 tocco |
| Pagina di chi riceve il link | `invito.html?stato=…` | Anteprima D-14 (festeggiato, «Organizzato da Marco», regalo o scopo, nessuna quota né conteggio); «Partecipo» pieno e «Non partecipo»; accesso in un foglio; poi «Partecipi al regalo per Elena», voto e «Suggerisci un regalo», quota con i metodi di Marco e «Ho pagato», stato «In attesa della conferma di Marco», «Firma il biglietto»; stato chiuso | Aderire: «Partecipo» + «Accedi con Google» = 2 tocchi; dichiarare il pagamento: 1 |
| Biglietto | `biglietto.html?modo=…` | Rifatto nel secondo giro, vedi §10.4: scena con parete e tavolo, il biglietto aperto come oggetto principale; «Come lo apre Marta» con il telefono che mostra il modo scelto | 1 tocco per l'editor |
| Editor | `biglietto-editor.html?passo=1…6` | Schermo intero con barra (chiudi, passo, tacche); anteprima viva; pannello già aperto sul campo del passo (foglio in basso sul telefono, colonna a destra su desktop); Indietro/Avanti nel pannello; riepilogo con matita al passo 6 | 6 passi, nome già nel campo al passo 2 |
| Gestione biglietto | `biglietto-gestisci.html` | Indietro verso «I miei biglietti» (`biglietti.html`); anteprima; Firme con «Manda il link a chi firma»; «Manda il biglietto a Marta»; scelte come righe con matita | |
| Apertura per il festeggiato | `biglietto-apertura.html?stato=busta|aperto` | Pesca, nastro, busta «Per Marta» e «Apri il biglietto»; poi titolo, firmatari, eventuale regalo deciso dall'organizzatore, foglietti. Niente intestazione del sito, niente quote | 1 tocco |
| Menu utente | in ogni pagina, `?menu=1` | Tendina sotto il tondo su desktop, foglio dalla barra in basso sul telefono: I miei regali, I miei biglietti, Il mio account, Esci; senza accesso solo «Accedi» | 2 tocchi per ogni pagina dell'account |
| I miei regali | `regali.html` | Tutti i regali, in corso e consegnati, con la pillola «Di gruppo» e uno stato | |
| I miei biglietti | `biglietti.html` | Creati da te, firmati da te | |
| Il mio account | `mio-account.html` | Dati personali, Ricorrenze, Preferiti, Cancella l'account; niente «Esci» (riga 9). `account.html` rimanda qui | |
| Cancella l'account | `cancella-account.html?stato=…` | Che cosa cancelliamo, che cosa resta, conferma, nuovo accesso, fatto, errore (§10.3) | 3 tocchi con Google |

Stati coperti: errore di campo (wizard passo 1), vuoto neutro (posti vuoti tratteggiati), attesa (`aria-busy` nel pulsante, in `sistema.css`), successo («Regalo di gruppo creato», «Partecipi…»), chiuso («Le adesioni sono chiuse»). Non disegnati: errore di rete al salvataggio (testo previsto: «Le modifiche non sono state salvate», dati conservati) e caricamento delle liste dell'account.

## 6. I 42 problemi dell'audit

| ID | Come si risolve |
|---|---|
| T-01 | Piè di pagina per servizi in quattro colonne uguali: Idee regalo, Regalo di gruppo, Biglietto, Account (I miei regali, I miei biglietti, Il mio account); in fondo «Privacy e dati» e «Termini e condizioni» |
| T-02 | In home nessun «Guarda un esempio»; «Guarda un regalo di gruppo di esempio» sta nella pagina del regalo di gruppo, «Guarda un biglietto di esempio» in quella del biglietto |
| T-03 | L'editor è una finestra a schermo intero (`aria-modal`); nel codice il resto della pagina prende `inert` |
| T-04 | Niente «3 gg» né consegna stimata in tessere e scheda; la data limite la sceglie chi organizza (passo 4) |
| T-05 | Domande e wizard senza piè di pagina; l'intestazione resta |
| T-06 | Un solo elenco di occasioni in domande, wizard ed editor: Compleanno, Laurea, Pensione, Nascita, Matrimonio, Anniversario, San Valentino, Natale, Saluto, Altro (da confermare, §8) |
| T-07 | «Regalo di gruppo» ovunque; nessuna «colletta» o «raccolta» nell'interfaccia |
| H-01 | Tre porte, una sola azione ciascuna, una sola piena |
| H-02 | «Le nostre scelte» |
| H-03 | Titolo della home: «Gifty: idee regalo, regali di gruppo e biglietti» |
| H-04 | «Accedi con Google» e «Mandami il link per accedere», tutto in italiano |
| I-01 | La prima domanda è su `/idee`: un tocco porta alla seconda |
| I-02 | Indicatore dei passi sotto l'intestazione |
| I-03 | Nessun tempo; «1 di 3» coerente con «tre domande» della porta |
| I-04 | Passaggio automatico su genere e occasione |
| I-05 | Ogni interesse è un pulsante con il suo nome |
| I-06 | Ordine curato predefinito; il prezzo è un filtro a fasce, non l'ordine |
| I-07 | Solo il cuore |
| I-08 | «Aggiungi a un regalo di gruppo» su tessere e scheda; apre il wizard con il regalo già scelto (passo 2 lo mostra) |
| I-09 | Nota sui prezzi una volta per pagina |
| I-10 | La scheda prodotto non propone il biglietto |
| I-11 | «Leggi tutto» solo oltre tre righe; nel prototipo la descrizione è breve e non c'è |
| G-01 | Partenza A disegnata: passo 3A, pagina del gruppo senza regalo con «Scegli il regalo» nel budget o «Metti ai voti più regali» (funzione nuova) |
| G-02 | Passo 1 per chi, passo 2 da dove parti; il catalogo si apre a parte da «Cambia» o «Aggiungi un altro regalo da votare» |
| G-03 | Il catalogo non è più dentro il passo: nessun riquadro vuoto |
| G-04 | Nel wizard la tessera ha un solo gesto, «Scegli questo regalo» o «Aggiungi al voto» |
| G-05 | Campo «Fino a quando si può aderire» con data e ora |
| G-06 | Quota in un passo, rimborsi in un altro, nessuna nota |
| G-07 | Un numero con contatore: «Quante persone ci sono nella chat»; nessuna nota |
| G-08 | Con la sorpresa spuntata il messaggio non nomina il festeggiato; l'anteprima del messaggio cambia subito |
| G-09 | Il gruppo si crea prima del passo 7; i pulsanti per condividere compaiono solo lì |
| G-10 | Cifre separate: Iscritti, Quota, Ricevuto, Da ricevere; budget previsto nel blocco del regalo; il prezzo del regalo sta accanto al regalo |
| G-11 | «Manda un promemoria a N persone» dopo la consegna e il promemoria per riga, secondo D-12 e D-18 (funzione nuova; serve il servizio email) |
| G-12 | Un'azione per condividere (nel blocco Persone), una per chiudere («Regalo consegnato»), nessun filtro; pagina a 390 px alta circa 2.350 px con il piè di pagina |
| G-13 | Stessa intestazione del sito |
| G-14 | «Partecipo» chiede l'accesso e torna alla pagina con l'adesione salvata (funzione nuova, D-06) |
| G-15 | Le date si scrivono con l'articolo eliso dove serve («l'11 novembre»); regola per il formattatore delle date |
| G-16 | Racconto nell'ordine di Cri, uguale in home e nella pagina del servizio |
| B-01 | Il pannello parte aperto sul campo del passo |
| B-02 | Un solo editor; i vecchi passi `/biglietto/[id]/dettagli|design|anteprima` non compaiono (D-19) |
| B-03 | Indietro verso «I miei biglietti»; scelte come riepilogo con matita; niente contatori a zero né spiegazioni |
| B-04 | «I miei biglietti» nell'account |

## 7. Testi da completare (copywriter)

Testi segnati come bozza nei prototipi. Nessuno ha un punto finale nei titoli. Limiti misurati sulla resa a 390 px.

| Schermata | Elemento | Che cosa deve fare | Limite | Bozza |
|---|---|---|---|---|
| Home | titolo hero | dire che cosa fa Gifty | 3 righe a 390 px, 2 a 1280 (circa 55 caratteri) | «Scegli il regalo di gruppo e tieni il conto delle quote» (testo approvato della tavola) |
| Home | riga della porta Regalo di gruppo | dire che cosa si fa | 2 righe a 1280 px, circa 80 caratteri | «Raccogli le adesioni dalla chat, scegli il regalo e segna chi ti ha rimborsato.» |
| Home | riga della porta Idee regalo | idem | 80 | «Rispondi a quattro domande o sfoglia il catalogo che curiamo noi.» |
| Home | riga della porta Biglietto | idem | 80 | «Lo firmano tutti dal link e il festeggiato lo apre sul telefono.» |
| Home, porte | azioni | l'azione principale del servizio | 30 | «Organizza un regalo di gruppo», «Trova un'idea regalo», «Crea un biglietto» |
| Home, Idee regalo | titolo delle idee | senza affermazioni sui clienti | 30 | «Le nostre scelte» (Cri, 5 nov) |
| Tutte le griglie | nota prezzi | una volta per pagina | 1 riga a 1280 | «Prezzi rilevati su Amazon. Quello finale lo vedi su Amazon prima di comprare.» |
| Racconto | supporti dei passi 1–3 | una frase per passo | 120 | vedi `comuni.js`, `montaRacconto`; passi 4 e 5 usano i testi approvati delle linee guida |
| Regalo di gruppo | riga sotto il titolo | dire le due partenze | 80 | «Parti dalle adesioni o dal regalo. Il gruppo resta nella vostra chat.» |
| Biglietto | riga sotto il titolo | dire come funziona la firma | 60 | «Lo firmano tutti dal link e lo mandi tu, su WhatsApp.» (senza il ruolo «festeggiato») |
| Wizard 2 | supporto delle due scelte | conseguenza della scelta | 80 ciascuno | vedi `crea.html` |
| Wizard 7 | messaggio WhatsApp con e senza sorpresa | invito ad aderire, con la data limite | 160 | vedi `crea.html` |
| Invito | scopo quando il regalo non c'è | D-14 | 90 | «Il regalo lo scegliamo insieme, votando fra le proposte di Marco.» |
| Invito | quota durante il voto | spiegare perché non c'è «Ho pagato» | 70 | «La quota si conosce quando Marco chiude la votazione.» |
| Apertura | firma in fondo | marchio discreto | 20 | «Fatto con Gifty» |
| Esempi | foglietti, ricorrenze, nomi | dati di esempio | | inventati e segnati «Esempio» dove compaiono in pagine pubbliche |

Il testo di questo documento e dei prototipi è passato da un controllo find-ai-slop manuale: tolte «scelto da noi un regalo alla volta» (ornamento), una ripetizione di «Amazon» nella nota prezzi, un titolo ridondante sopra «Guarda un regalo di gruppo di esempio».

## 8. Decisioni da confermare

1. **Titolo della home.** Tengo quello approvato sulla tavola, che parla del regalo di gruppo; le porte coprono gli altri due servizi. In alternativa un titolo per tutti e tre i servizi, da scrivere.
2. **Editor del biglietto a schermo intero, senza intestazione del sito.** Il brief chiede di mantenerlo; la regola 4 dell'architettura chiede l'intestazione su tutte le pagine del biglietto. Le altre pagine del biglietto (servizio, gestione) hanno l'intestazione.
3. **Elenco unico delle occasioni** (§6, T-06): 10 voci. L'editor oggi ne ha 17 (Insegnante, Capo, Condoglianze…): con l'elenco unico spariscono.
4. **La prima domanda dentro `/idee`** invece di un ingresso con due porte (spec §8). Toglie un passaggio (I-01). «Vuoi solo il biglietto?» non sta più in Idee regalo, perché il biglietto ha la sua voce (architettura §2).
5. **Nell'account anche i regali che organizzo portano il nome**: «organizzato da Cri», non «organizzato da te», per seguire la regola dei nomi alla lettera.
6. **Taglio della foto desktop in basso** (46vw) per avere le tre azioni nel primo schermo a 1280×800: si perde parte di busta e penna, il biglietto resta intero.
7. **Nel registro dell'organizzatore il pulsante della riga** è «Segna ricevuto 10 €» quando la persona ha dichiarato, «Segna un pagamento» per chi è aggiunto a mano, «Promemoria» dopo la consegna. Una sola azione per riga.

## 9. Verifica

- Audit con `design-audit.mjs` su 20 viste a 390 e 1280 px (40 viste, Chrome, Playwright preso da un altro repository perché questo non lo ha): contrasto 0, dimensioni dei caratteri fuori scala 0, spaziatura 0, bersagli sotto 44 px 0, righe troppo lunghe 0, scorrimento orizzontale 0, cifre 0, raggi 0. Restano 28 segnalazioni di allineamento e 1 di ritmo, tutte dentro oggetti ruotati di proposito (biglietti, foglietti, partenze): la rotazione sposta i bordi di 1–3 px. Eccezione voluta.
- Ogni schermata guardata a 390 e 1280 px dopo due giri di correzioni. Primo giro: pannelli del racconto tutti visibili, prezzi con il punto, striscia delle idee tagliata, partenze fuori schermo, contatore a tutta larghezza, ora troncata, IBAN fuori riga, righe dell'account sfasate. Secondo giro: bersagli da 40 a 44 px, spazi fuori scala, raggio del fumetto, azioni della home portate nel primo schermo a 1280×800.
- I grafici sono solo le barre dei voti (HTML, non SVG): etichetta diretta, cifre tabulari.
- Non verificato: lettore di schermo reale, telefono reale, 320 px, testo ingrandito.

## 10. Secondo giro (5 novembre)

Revisione di Cri del 5 novembre (`piano.md`). Qui le righe 5–7 e 13–18; nei prototipi sono riportate anche le righe 1–4, 8–12 e 19, così restano la fonte del codice. Stesso sistema dei §3–4: nessun colore, carattere o raggio nuovo tranne il raggio 28 px della cornice del telefono (aggiunto a `design-scale.json`) e il colore `table` usato come piano del tavolo nella scena del biglietto. Schermate in `schermate/v2-*` a 390 e 1280 px.

### 10.1 Wizard del regalo di gruppo (righe 13–17)

**Fonti consultate il 5 novembre 2026**

| Fonte | Che cosa dice | Come la uso |
|---|---|---|
| GOV.UK Service Manual, [Structuring forms](https://www.gov.uk/service-manual/design/form-structure) | Una cosa per pagina: un'informazione, una decisione o una domanda; una domanda non vuol dire per forza un campo solo | Una decisione per schermata; nome, occasione e data stanno insieme perché sono una cosa sola (chi festeggiamo e quando) |
| GOV.UK Design System, [Question pages](https://design-system.service.gov.uk/patterns/question-pages/) | Indietro in alto in ogni pagina; pulsante «Continua» allineato a sinistra; il totale dei passi solo se si può contare con certezza; non chiedere due volte la stessa cosa | Barra con indietro in alto a sinistra; «Continua» a sinistra; ogni percorso ha lo stesso numero di passi (6, dal prodotto 4), quindi «Passo 3 di 6» è sempre vero |
| GOV.UK Design System, [Check answers](https://design-system.service.gov.uk/patterns/check-answers/) | Una pagina di controllo prima della conferma, con «Cambia» per ogni risposta; dopo la modifica si torna al riepilogo | Passo 6 «Controlla e crea il regalo di gruppo» con «Cambia» per riga |
| GOV.UK Design System, [Dates](https://design-system.service.gov.uk/patterns/dates/) | Il calendario serve per date vicine, quando conta il giorno della settimana | Campi data e ora nativi (con calendario) per la festa, la fine della votazione e la data limite: sono tutte date vicine |
| NN/g, Raluca Budiu, [Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/) (2017) | Valori predefiniti sensati; si può uscire a metà e ritrovare lo stato; passi autosufficienti | Quota 10 €, data limite e fine della votazione già proposte; bozza salvata all'uscita; ogni passo mostra quello che serve per decidere (la quota a testa accanto a ogni regalo) |
| NN/g, Raluca Budiu, [Login Walls Stop Users in Their Tracks](https://www.nngroup.com/articles/login-walls/) (2014) | Chiedere l'account dopo aver dato valore | Accesso solo nel riepilogo, dentro lo stesso passo (D-13, AC-02) |
| Baymard, Edward Scott, [Save Account Creation for the Confirmation Step](https://baymard.com/blog/delayed-account-creation) (2023) | La richiesta di account all'inizio distrae e fa abbandonare | Come sopra |
| Baymard, Edward Scott, [Checkout Optimization: 5 Ways to Minimize Form Fields](https://baymard.com/blog/checkout-flow-average-form-fields) (2024) | Il numero di campi pesa sull'usabilità più del numero di passi | Tolti tre campi (data e ora limite, durata del voto) a favore di valori proposti modificabili |
| Material Design 1, [Steppers](https://m1.material.io/components/steppers.html) | Sul telefono, barra di avanzamento per i percorsi lunghi o con passi che si aggiungono | Barra sottile più «Passo n di N» |

**Decisioni**

1. **A tutta pagina.** Niente intestazione, piè di pagina né barra in basso. In alto una barra sola: indietro, «Passo 3 di 6» con la barra di avanzamento, X per uscire. Dopo la creazione la barra dice «Regalo di gruppo creato» e la X porta alla pagina del gruppo.
2. **Uscire.** La X apre il foglio «Vuoi uscire?» con «La bozza del regalo per Mauro resta su questo dispositivo.», «Esci» e «Cancella la bozza». Al passo 1 vuoto la X esce senza chiedere. Rientrando in `/crea` con una bozza si vede «Riprendi il regalo per Mauro» con «Riprendi» e «Ricomincia da capo».
3. **Ordine dei passi.** 1 Per chi (nome, occasione, data della festa); 2 Quante persone ci sono nella chat (contatore, «Partecipo anch'io alla divisione» già spuntato, D-16); 3 Da dove vuoi iniziare; 4 quota, regalo o regali da votare; 5 Come ti rimborsano; 6 Riepilogo e accesso; poi Condividi. Le persone vengono prima del regalo perché così ogni tessera del catalogo mostra la quota a testa (spec §9). Cambia l'ordine della spec §7.2: da riportare lì.
4. **Tre partenze al passo 3, con passaggio automatico.** «Prima le adesioni», «Ho scelto il regalo», «Votiamo il regalo». La votazione ha campi suoi (la lista vuota con il testo di Cri, la data di fine), quindi è una decisione a parte e non un pulsante nascosto nel passo del regalo. Le stesse tre voci sono nella scena del racconto «Come funziona». Tolta «Puoi sceglierlo tu o far votare il gruppo.».
5. **Foglio del catalogo dentro il wizard** (mancava nel primo giro). Con «Ho scelto il regalo» si apre da solo; le tessere hanno un solo gesto: «Scegli questo regalo», che sceglie e passa ai rimborsi. Con «Votiamo il regalo» il passo mostra «Ancora nessuna: scegli almeno due prodotti dal catalogo e clicca su "Aggiungi al regalo"» e «Apri il catalogo»; nel foglio ogni tessera ha «Aggiungi al regalo», che diventa «Aggiunto» con la spunta (si toglie con un altro tocco), e in basso «2 regali da votare» con «Fatto». Temi a chip; niente cuore né scheda prodotto nel foglio. Sul telefono il foglio sale quasi a tutta altezza, su desktop è una finestra larga.
6. **Fine della votazione con data e ora** («Si vota fino al»), proposta a quattro giorni da oggi alle 20:00, sotto la lista dei regali.
7. **Data limite delle adesioni proposta, non chiesta.** Il giorno prima della festa alle 20:00; si vede e si cambia nel riepilogo (D-15 resta: è chi organizza a fissarla).
8. **Quota (partenza A)** in un campo da 9 rem già con 10 €; sotto, «Budget previsto, se aderite in 10» con la cifra.
9. **Dal prodotto** («Aggiungi a un regalo di gruppo») si saltano i passi 3 e 4: il regalo sta in cima al passo delle persone con «Cambia» e la quota stimata. Quattro passi in tutto.
10. **Riepilogo e accesso nello stesso passo.** Righe con «Cambia» (pillola tinta) e, sotto, «Accedi per creare il regalo di gruppo» con «Accedi con Google» oppure email e «Mandami il link per accedere». Toccare Google accede e crea. Chi ha già fatto l'accesso vede solo «Crea il regalo di gruppo». Con il link via email il passo mostra «Link mandato» e chiede di aprirlo dallo stesso dispositivo, perché lì c'è la bozza.
11. **Chi ha già fatto l'accesso** ritrova i metodi di rimborso dell'ultima volta già compilati (NN/g, valori predefiniti dagli usi precedenti).

**Tocchi contati.** Conto ogni tocco e ogni campo da scrivere, accettando i valori proposti, per chi organizza la prima volta e accede con Google. «Prima» è il prototipo del primo giro, che riprende il wizard costruito; per il voto conto un campo per la durata in ore e due tocchi per regalo (apri il catalogo, scegli), perché il catalogo nel primo giro non era disegnato.

| Partenza | Prima | Dopo | Che cosa toglie tocchi |
|---|---:|---:|---|
| Prima le adesioni | 15 (3 + 2 + 1 + 4 + 3 + 1 + 1) | 12 (3 + 2 + 1 + 1 + 3 + 1 + 1) | partenza con passaggio automatico; data e ora limite proposte |
| Ho scelto il regalo, dal wizard | 17 | 12 (3 + 2 + 1 + 1 + 3 + 1 + 1) | il catalogo si apre da solo e «Scegli questo regalo» va avanti |
| Ho scelto il regalo, da una tessera | 14 | 10 (3 + 2 + 3 + 1 + 1) | niente passo di partenza né passo del regalo |
| Votiamo il regalo, due regali | 20 | 16 (3 + 2 + 1 + 5 + 3 + 1 + 1) | un'apertura del catalogo per tutti i regali; fine del voto proposta |

Chi torna con l'accesso già fatto e i metodi salvati: 10 tocchi per la partenza A. Il riepilogo aggiunge un tocco («Crea» e accesso sono lo stesso tocco), compensato dagli altri tagli.

### 10.2 Menu utente e pagine dell'account (righe 5–9)

- **Menu.** Su desktop il tondo con l'iniziale apre una tendina: nome ed email, I miei regali, I miei biglietti, Il mio account, poi Esci. Sul telefono la voce Account della barra in basso apre un foglio con le stesse voci. Senza accesso il tondo mostra l'icona della persona e il menu ha solo «Accedi». Accedi ed Esci stanno solo qui. Il piè di pagina ripete le tre voci.
- **I miei regali** (`regali.html`). Tutti i regali di gruppo, organizzati da me o da altri, divisi in «In corso» e «Consegnati». Ogni riga: data della festa, «Il regalo per Mauro», «Compleanno, organizzato da Cri», la pillola «Di gruppo» (bordo, icona del gruppo) e uno stato colorato con il testo («3 su 10 hanno aderito», «Votazione aperta», «Quota da pagare», «2 quote da ricevere», «Saldato»). In alto «Organizza un regalo di gruppo». Vuoto: «Ancora nessun regalo» con lo stesso pulsante.
- **I miei biglietti** (`biglietti.html`). «Creati da te» e «Firmati da te»; stato «Da mandare», «Mandato a Giulia», «Non ancora mandato». In alto «Crea un biglietto». Vuoto: «Ancora nessun biglietto».
- **Il mio account** (`mio-account.html`). Dati personali (nome modificabile, email e metodo di accesso in sola lettura, newsletter non spuntata, «Salva le modifiche»), Ricorrenze, Preferiti, Cancella l'account. Su desktop indice laterale. Niente Esci.

### 10.3 Cancellazione dell'account (riga 7)

**Che cosa chiedono le fonti**

| Fonte | Requisito |
|---|---|
| GDPR [art. 17](https://gdpr-info.eu/art-17-gdpr/) | Cancellare «senza ingiustificato ritardo» quando i dati non servono più o la persona revoca il consenso (par. 1, lettere a e b). Eccezioni: obbligo di legge (par. 3, b) e accertamento, esercizio o difesa di un diritto in sede giudiziaria (par. 3, e) |
| GDPR [art. 12](https://gdpr-info.eu/art-12-gdpr/) | Informazioni concise, chiare e in linguaggio semplice (par. 1); facilitare l'esercizio dei diritti (par. 2); risposta entro un mese, prorogabile di due con motivazione (par. 3); gratis (par. 5); se ci sono dubbi sull'identità si possono chiedere altre informazioni (par. 6) |
| GDPR art. 19 e EDPB, [Respect individuals' rights](https://www.edpb.europa.eu/sme-data-protection-guide/respect-individuals-rights_en) | Avvisare della cancellazione chi ha ricevuto i dati, salvo sforzo sproporzionato; rendere possibile la richiesta anche per via elettronica |
| Garante privacy, [Diritto all'oblio](https://www.garanteprivacy.it/i-miei-diritti/diritti/oblio) | Cancellazione anche dopo la revoca del consenso |
| Firebase, [Manage users, Delete a user](https://firebase.google.com/docs/auth/web/manage-users) | Per cancellare un utente serve un accesso recente; altrimenti l'operazione fallisce e va ripetuto l'accesso con `reauthenticateWithCredential` |
| Firebase, [Delete User Data](https://extensions.dev/extensions/firebase/delete-user-data) | L'estensione cancella da Firestore solo i percorsi configurati; la pagina dice che le Firebase Extensions chiudono il 31 marzo 2027, quindi la cancellazione va scritta come funzione server |
| Apple, [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/) e Google Play, [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111) | Cancellazione vera, non disattivazione; facile da trovare nelle impostazioni dell'account; si può confermare l'identità ma non rendere difficile il percorso; dire quanto tempo serve, confermare quando è fatto e dire che cosa si tiene e perché |

**Il disegno**

- **Dove.** In fondo a «Il mio account», sezione «Cancella l'account» con una riga e la pillola rossa tinta «Cancella l'account».
- **Passo 1, che cosa sparisce** (`cancella-account.html`). Elenco con i nomi veri. Che cosa cancelliamo: nome, email e accesso; preferiti e ricorrenze; i regali che organizzo, che si chiudono e chi ha aderito (Luca, Sara, Davide) li vede chiusi nel proprio account; i biglietti che ho creato, il cui link smette di aprirsi; il mio voto e il mio messaggio nei regali di altri. Che cosa resta: il mio nome e la quota nei regali organizzati da altri, perché Marco possa chiudere il conto dei rimborsi. Poi «Lo cancelliamo subito e non si può annullare.», il pulsante rosso «Cancella l'account» e «Annulla».
- **Passo 2, nuovo accesso.** Foglio «Accedi di nuovo per confermare» con «Accedi con Google e cancella» (o il link via email per chi accede così). Lo chiede Firebase e vale come verifica dell'identità (art. 12, par. 6). Un solo tocco conferma e cancella.
- **In corso.** Pulsante con la rotella e «Cancellazione in corso».
- **Errore.** «L'account non è stato cancellato: l'accesso non è riuscito.» accanto al pulsante, che diventa «Riprova». Nessun dato toccato.
- **Fatto.** Pagina senza account: «Il tuo account è cancellato», data e ora, «Torna alla home». Conferma solo a schermo: il servizio email (D-18) non c'è ancora e la spec vieta di promettere avvisi che non esistono.
- **Tempi.** Subito, nella stessa funzione server: cancellazione dei documenti Firestore dell'utente, poi dell'utente in Firebase Auth, poi la richiesta di cancellare il contatto al servizio email quando ci sarà (art. 19). Ben dentro il mese dell'art. 12.
- **Tocchi:** 3 da «Il mio account» (Cancella l'account, Cancella l'account, Accedi con Google e cancella).

**Da far verificare (P-07, prima del lancio).** Il nome e la quota che restano nei regali di altri si reggono sull'interesse legittimo di chi organizza a tenere il conto del denaro ricevuto (art. 6, par. 1, f) e, se serve, sull'art. 17, par. 3, e. La riga diventa come una persona aggiunta a mano: solo nome e importi, nessun collegamento all'account, nessuna email. Serve il parere di chi segue il trattamento. Da scrivere nella pagina Privacy: quanto restano i dati nelle copie di sicurezza (dipende da come si configura il ripristino di Firestore, non ancora deciso).

### 10.4 Pagina Biglietto (righe 18–19)

- **Scena.** Come la hero della home: parete `wall` in alto e piano del tavolo `table` in basso, con un'ombra leggera sulla linea. Il biglietto aperto è l'oggetto principale: su desktop due ante (a sinistra il titolo a mano «Buon compleanno, Marta!», la dedica e una polaroid; a destra quattro foglietti firmati, due con foto), sotto la busta «Per Marta» e il nastro arancio sul tavolo. Sul telefono un'anta sola con titolo e foglietti, la busta dietro. Etichetta «Esempio».
- **Titolo.** «Biglietto» con la pillola «Guarda come si fa» accanto (riga 19), una riga, «Crea un biglietto».
- **Come lo apre Marta.** Al posto delle quattro tessere: un telefono su una lastra `wall` che mostra il biglietto nel modo scelto con i segmenti Griglia, Storia, Film, Scorrimento, e sotto una riga che cambia con il modo. Poi la pillola «Apri il biglietto di esempio». Il titolo usa il nome, non il ruolo.

### 10.5 Righe del passo A riportate nei prototipi

Piè di pagina a quattro colonne uguali, con «Privacy e dati» e «Termini e condizioni» in fondo e la colonna Account con le voci del menu (righe 1–3); nessun avviso su Firebase (4); il menu non ha «Come trattiamo i dati» e Esci sta solo lì (8–9); domande a quattro passi con l'età (10); «Le nostre scelte» (11); pillola piccola e tinta accanto al titolo in home, regalo di gruppo e biglietto (12, 19).

### 10.6 Testi nuovi (bozze per il copywriter)

| Schermata | Elemento | Che cosa deve fare | Limite | Bozza |
|---|---|---|---|---|
| Wizard 2 | spunta | dire che chi organizza paga la sua parte | 40 | «Partecipo anch'io alla divisione» |
| Wizard 3 | tre scelte e supporti | dire la conseguenza | nome 22, supporto 70 | «Prima le adesioni», «Ho scelto il regalo», «Votiamo il regalo»; vedi `crea.html` |
| Wizard 4V | lista vuota | testo di Cri, esatto | 2 righe a 390 | «Ancora nessuna: scegli almeno due prodotti dal catalogo e clicca su "Aggiungi al regalo"» (sul telefono si tocca, non si clicca; virgolette diritte come le ha scritte Cri) |
| Wizard 4V | campo | nome del campo | 20 | «Si vota fino al» |
| Foglio catalogo | piede | quanti regali e chiudere | 30 | «2 regali da votare», «Fatto» (da confermare: «Fatto» non dice dove porta) |
| Wizard 6 | titolo | dire che cosa si fa | 2 righe a 390 | «Controlla e crea il regalo di gruppo» |
| Wizard 6 | link via email | spiegare perché lo stesso dispositivo | 90 | «Aprilo da questo dispositivo: il regalo di gruppo si crea appena accedi.» |
| Wizard, uscita | foglio | dire che cosa succede alla bozza | 70 | «Vuoi uscire?», «La bozza del regalo per Mauro resta su questo dispositivo.» |
| Wizard, bozza | ripresa | | 40 | «Riprendi il regalo per Mauro», «La bozza è ferma al passo 4 di 6.» |
| Il mio account | cancellazione | conseguenza | 2 righe a 1280 | «Cancelliamo i tuoi dati, i regali che organizzi e i biglietti che hai creato. Prima ti mostriamo che cosa sparisce.» |
| Cancella l'account | righe dell'elenco | vedi `cancella-account.html` | 1 riga + 1 di supporto | |
| Cancella l'account | nuovo accesso | motivo | 50 | «Lo chiediamo per essere sicuri che sia tu.» |
| Cancella l'account | fatto | conferma con data | 120 | «Abbiamo cancellato i tuoi dati il 5 novembre 2026 alle 18:40. Puoi tornare quando vuoi con un account nuovo.» |
| Biglietto | quattro modi | una riga ciascuno | 60 | vedi `biglietto.html` |
| Domande | età | fasce dal catalogo | 12 | «Bambina», «Adolescente», «Ragazza», «Adulta» con gli anni; al maschile dopo «Per lui» |

### 10.7 Verifica

- `design-audit.mjs` su 22 viste a 390 e 1280 px (44 viste): contrasto 0, caratteri fuori scala 0, spaziatura 0, raggi 0, bersagli sotto 44 px 0, righe troppo lunghe 0, scorrimento orizzontale 0, cifre 0. Restano 58 segnalazioni di allineamento e 13 di ritmo, tutte dentro oggetti di carta ruotati di proposito (biglietto dell'anteprima, foglietti, partenze, scene del racconto), come nel primo giro.
- Primo giro di correzioni: dimensioni 22, 15, 13 e 11 px portate in scala (testo delle pillole secondarie a 16, scene del racconto a 12 e 24), cornice del telefono a 12 px di spazio, X del foglio di nuovo accesso a 44 px, la classe `.percorso` delle domande si scontrava con quella del racconto e toglieva i margini, piè di pagina a capo sul telefono, etichetta «Esempio» sopra il biglietto.
- Non disegnati: incolla un link (campo e anteprima del prodotto), errore di rete al salvataggio della bozza, «Cambia» del regalo da un passo successivo, la pagina Termini e condizioni. La pagina del regalo di gruppo descrive ancora due partenze (le due carte in alto): da allineare alle tre del wizard se Cri approva.
- Nelle schermate a 390 px l'ora appare come «08:00 PM» perché il browser segue la lingua del sistema; su un telefono italiano è «20:00».
