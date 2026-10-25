# UX_V5 — Inventario degli screenshot

Branch `stefano/grafica_v5`, partito da `main` (2eddae8). Screenshot in `Pagine_UX_V5/screenshot/` (23 immagini, iPhone, 25 ottobre 2026).

## 0. Da dove vengono

Tutti gli screenshot sono dell'app **UAOO** (liste regalo con raccolta fondi). Li usiamo come riferimento di stile e di flusso, non come materiale da copiare:

- niente nome, logo, foto dei modelli d'invito o testi di UAOO;
- il marchio resta **Gifty**;
- UAOO raccoglie i soldi nell'app («0,00 €», «fondi raccolti», «UAOO Gift»). Gifty no: i soldi non passano dal servizio. Ogni cifra mostrata deve essere quella dichiarata dai partecipanti.

## 1. Design system ricavato

| Elemento | Negli screenshot | Note |
|---|---|---|
| Sfondo pagina | grigio-lavanda chiaro | quasi bianco, mai bianco puro |
| Colore principale | blu elettrico | è il colore del marchio UAOO: da decidere se tenerlo o usare il verde Gifty |
| Card "eroe" | gradiente blu → blu notte, testo bianco | dashboard, banner, attivazione |
| Card normali | bianche, angoli molto arrotondati (~20 px), nessun bordo | |
| Pulsante principale | pillola a tutta larghezza, fissato in basso, ombra colorata | «Continua →» |
| Barra in alto | pulsanti tondi (indietro, chiudi, menu «…») ai lati, logo al centro | linea di avanzamento sotto la barra nei passi del wizard |
| Intestazione di passo | riquadro icona lavanda + etichetta piccola grigia + titolo in grassetto | «Informazioni / Chi raggiunge il traguardo?» |
| Elenchi di campi | righe dentro una card: icona, titolo, valore o segnaposto, freccia | |
| Scelte | pannello dal basso (bottom sheet) con opzioni a pallino | orario, messaggio, invitati |
| Schermate di attesa | sfondo blu notte, icona al centro con cerchio che gira | |
| Caratteri | sans-serif di sistema, titoli molto grandi e in grassetto | |

## 2. Corrispondenza con le pagine di Gifty

| Screenshot | Cosa mostra | Pagina Gifty | Come si adatta |
|---|---|---|---|
| 2592 | Home dopo l'accesso: saluto, «Crea una lista», «I tuoi inviti», banner, promo, carosello mete | `/` | Saluto, «Organizza una colletta», «Le mie collette», banner «Come funziona», carosello di idee dal catalogo. Niente gift card né viaggi |
| 2593 | «Per chi è questa lista?» (per te / sorpresa) | `/crea` | Non serve: la colletta è sempre per un'altra persona. Si può riusare la grafica per il passo 1 («Lo scelgo io / Lo sceglie il gruppo») |
| 2594 | Griglia delle occasioni | `/crea` | Il campo occasione esiste già (`lib/tipi.ts`): può diventare questa griglia |
| 2595–2597 | Dati del festeggiato, elenco campi, scelta orario dal basso | `/crea` passo 2 (Per chi) | Stessa struttura: nome, data, occasione. Luogo, orario, dress code e descrizione della festa non esistono in Gifty |
| 2598–2599 | Galleria dei modelli d'invito e anteprima | `/biglietto/[id]/design` | Galleria dei nostri modelli di biglietto con filtri a pillola |
| 2600 | Riepilogo prima di confermare | `/crea` | Nuovo passo di riepilogo prima della creazione, con matita per modificare |
| 2601–2602 | Codice promo, data di attivazione, «Gratis», accettazione termini | `/crea` | Solo l'accettazione privacy/termini. Niente codici né attivazione programmata |
| 2603 | Attesa «Stiamo attivando la tua lista» | `/crea` | Schermata di attesa mentre la colletta viene creata |
| 2604–2606 | «Tutto pronto»: anteprima invito, messaggio, condividi (WhatsApp, Telegram, Email, SMS), copia link, QR | `/crea` passo 6 (Invita) | Corrispondenza quasi completa: abbiamo già condivisione, link e QR |
| 2607–2609 | «La tua lista»: card eroe con totale, conteggi, azioni rapide; card informazioni, ultimi regali, bacheca, album | `/gestisci/[slug]` | Card eroe con quote dichiarate / obiettivo, partecipanti, giorni mancanti; azioni rapide Partecipanti, Biglietto, Invita, Regalo |
| 2610 | Elenco invitati dal basso | `/gestisci/[slug]` | Elenco partecipanti con stato del pagamento |
| 2611–2613 | Bacheca con post, reazioni, nuovo post | — | Funzione che Gifty non ha |
| 2614 | Menu «…»: modifica, sposta scadenza, estendi, chiudi; card «Consegna il regalo» | `/gestisci/[slug]`, `/gestisci/[slug]/chiusura` | Modifica dati e chiusura esistono già |

## 3. Pagine senza screenshot

Catalogo, scheda prodotto, preferiti, accesso, le mie collette, pagina del partecipante (`/c/[slug]`) con i passi di pagamento, firma del biglietto (`/b/[slug]`), privacy.

## 4. Funzioni negli screenshot che Gifty non ha

Bacheca, album foto con conto alla rovescia, dettagli della festa (luogo, orario, dress code), codici promo, attivazione programmata, notifiche, gift card, viaggi, liste «per te».

## 5. Decisioni (25 ottobre 2026)

1. **Colore principale: verde Gifty** (#035C32). Dagli screenshot si prendono layout e componenti, non il blu. Le card "eroe" usano un gradiente verde → verde scuro.
2. **Pagine senza screenshot: stesso stile**, applicato a tutte le pagine per avere un'app coerente.
3. **Solo grafica in questo branch.** Le funzioni della sezione 4 non si sviluppano qui; se servono, ognuna su un branch suo.

Gli screenshot non vanno su GitHub (sono di un'altra app e pesano ~40 MB): la cartella è in `.gitignore`.
