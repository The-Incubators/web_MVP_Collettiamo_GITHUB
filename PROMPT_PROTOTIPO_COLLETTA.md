# Prototipo «Colletta» — specifica di sviluppo

Versione 1.0 · ottobre 2026 · progetto *Cosa Gli Regaliamo*

---

## 0. Come usare questo documento

Sei l'agente di sviluppo. Questo documento è la specifica completa del prototipo: contiene le decisioni già prese, il modello dati, le regole di sicurezza, le schermate e i criteri di accettazione.

Regole di ingaggio:

- **Non ridiscutere le decisioni della sezione 3.** Sono già state valutate.
- **Dove il documento non dice nulla, scegli l'opzione più semplice che funziona** e annotala in `DECISIONI.md`, senza fermarti a chiedere.
- **Dove il documento dice «da verificare», non inventare**: implementa il ripiego indicato e segnala il punto in `DECISIONI.md`.
- **Lavora nell'ordine della sezione 18.** Alla fine di ogni fase l'applicazione deve girare.
- Lingua dell'interfaccia: **italiano**. Nessuna internazionalizzazione.
- Lingua del codice: identificatori di dominio in italiano (`colletta`, `partecipante`, `quota`, `causale`), tutto il resto in inglese. I nomi dei campi Firestore sono quelli esatti della sezione 5: non tradurli.

---

## 1. Che cos'è

Un servizio che aiuta una persona a organizzare una colletta per un regalo di gruppo.

L'organizzatore sceglie un regalo dal catalogo, imposta la quota, indica su quali suoi conti vuole essere pagato e ottiene un link. Lo incolla nella chat del gruppo. Chi apre il link vede il regalo e la propria quota, paga con il metodo che preferisce e lo dichiara con un tocco. L'organizzatore vede chi ha pagato e chi manca, conferma gli accrediti e compra il regalo.

Il servizio **non incassa denaro**. È la decisione fondante: ne discende quasi tutta l'architettura.

---

## 2. Il principio che vincola tutto

> **I soldi non passano mai dal servizio.**

I partecipanti pagano direttamente l'organizzatore, sui conti che lui già possiede: il suo PayPal, il suo Satispay, il suo IBAN, i contanti.

Conseguenze da rispettare in ogni scelta tecnica:

| Conseguenza | Implicazione |
|---|---|
| Nessuna integrazione con fornitori di pagamento | Non installare Stripe, PayPal SDK, Mangopay o simili. I «pulsanti di pagamento» sono link e copia-incolla verso gli strumenti dell'organizzatore. |
| Il servizio non sa se un pagamento è avvenuto | Esiste lo stato `dichiarato` (lo dice il partecipante) e lo stato `confermato` (lo conferma l'organizzatore). **Solo `confermato` entra nei totali.** |
| Nessun rimborso automatico | L'avanzo si calcola e si comunica; a restituire i soldi è l'organizzatore. |
| Nessun dato di pagamento del partecipante | Non chiedere mai numeri di carta, IBAN del partecipante o credenziali. |

Se durante lo sviluppo una funzione sembra richiedere che il servizio tocchi il denaro, la funzione è sbagliata: fermati e segnala.

---

## 3. Stack e vincoli tecnici

Decisioni prese. Non cambiarle.

| Area | Scelta | Perché |
|---|---|---|
| Framework | **Next.js, App Router, TypeScript** | Serve il rendering lato server per le anteprime dei link nelle chat (sezione 11). Nessun'altra scelta lo dà gratis. |
| Stile | **Tailwind CSS** con i token della sezione 15 | Rapidità, e i token tengono il design coerente. |
| Database | **Firebase Firestore** | Richiesto dal committente. |
| Autenticazione | **Firebase Auth** | Richiesto. Due modalità distinte, sezione 7. |
| Accesso server | **Firebase Admin SDK** nelle route server | Serve per il rendering della pagina pubblica e dei metadati. |
| Font | `next/font/google`: **Bricolage Grotesque** (display) e **IBM Plex Sans** (testo) | Già scelti nel prototipo visivo. |
| Gestore pacchetti | `pnpm` | — |
| Deploy | Vercel (prima scelta) o Firebase App Hosting | Il codice non deve dipendere dall'uno o dall'altro. |
| Test | `vitest` per la logica di dominio, `@firebase/rules-unit-testing` per le regole | I criteri di accettazione 5 e 11 non sono verificabili a mano. |

Fissa ogni dipendenza a una versione esatta. Usa versioni stabili già mature, non le ultimissime uscite.

**Non usare**: librerie di componenti pesanti, state manager globali, ORM sopra Firestore, i18n, CSS-in-JS.

---

## 4. Variabili d'ambiente

Firebase non è ancora configurato. Crea `.env.local.example` con questi segnaposto, leggi tutto da `process.env` e **non mettere mai valori reali nel codice**.

```bash
# --- Client (esposte al browser) ---
NEXT_PUBLIC_FIREBASE_API_KEY=INSERIRE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=INSERIRE
NEXT_PUBLIC_FIREBASE_PROJECT_ID=INSERIRE
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=INSERIRE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=INSERIRE
NEXT_PUBLIC_FIREBASE_APP_ID=INSERIRE

# --- Server (mai esposte) ---
FIREBASE_ADMIN_PROJECT_ID=INSERIRE
FIREBASE_ADMIN_CLIENT_EMAIL=INSERIRE
FIREBASE_ADMIN_PRIVATE_KEY="INSERIRE"

# --- Applicazione ---
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Finché le variabili valgono `INSERIRE`, l'applicazione deve:

1. avviarsi lo stesso, senza crash;
2. mostrare un avviso visibile in alto: «Firebase non è configurato: i dati sono finti e non vengono salvati»;
3. **funzionare comunque**, con un adattatore in memoria.

Questo punto è importante: tutto l'accesso ai dati passa da un modulo `lib/dati/` con due implementazioni intercambiabili, `firestore.ts` e `memoria.ts`, selezionate a runtime in base alla presenza delle variabili. Così il prototipo si può provare e dimostrare prima che Firebase esista, e il passaggio al database reale è una riga di configurazione.

Predisponi anche `firebase.json`, `firestore.rules` e `firestore.indexes.json` nel repository, pronti per `firebase deploy`.

---

## 5. Modello dati Firestore

Timestamp sempre `Timestamp` di Firestore. Importi sempre in **centesimi, interi** (`quotaCent: 1000` = 10,00 €), per evitare errori di arrotondamento; la formattazione in euro avviene solo nella presentazione.

### `/prodotti/{prodottoId}`

Catalogo finto, scritto solo dallo script di seed.

```ts
{
  slug: string;              // "cuffie-silenzio-pro"
  nome: string;
  marca: string;             // marchi inventati, vedi sezione 14
  prezzoCent: number;
  categoria: "audio" | "casa" | "cucina" | "benessere" | "esperienze" | "viaggio" | "gioco" | "ufficio";
  occasioni: string[];        // "compleanno" | "laurea" | "pensione" | "nascita" | "matrimonio" | "saluto"
  descrizione: string;        // 1-2 frasi
  consegnaGiorni: number;     // 1-7
  urlEsterno: string;         // finto: "https://negozio-esempio.it/p/<slug>"
  immagine: { seme: string; icona: string };   // vedi sezione 14
  attivo: boolean;
}
```

### `/utenti/{uid}`

```ts
{ nome: string; email: string | null; creatoIl: Timestamp; }
```

### `/collette/{slug}`

Il documento ha come id lo **slug pubblico**: è la chiave del link. Vedi sezione 10.2 per come si genera.

```ts
{
  slug: string;
  organizzatoreUid: string;
  organizzatoreNome: string;        // denormalizzato: appare nella pagina pubblica

  festeggiato: string;
  occasione: string;
  dataRegalo: Timestamp;
  scadenza: Timestamp;              // calcolata, vedi 10.1
  sorpresa: boolean;                // true = noindex + anteprima neutra

  prodotto: {                       // denormalizzato: il catalogo può cambiare
    prodottoId: string | null;      // null se incollato da link
    nome: string;
    prezzoCent: number;
    consegnaGiorni: number;
    urlEsterno: string;
    immagine: { seme: string; icona: string };
  };

  modoQuota: "fissa" | "divisa" | "libera";
  quotaCent: number;                // per "libera" è la quota suggerita
  quotaCongelata: boolean;          // vedi 10.3
  previsti: number;

  metodi: {
    paypal:   { attivo: boolean; valore: string };   // handle o link paypal.me
    satispay: { attivo: boolean; valore: string };   // numero di telefono
    bonifico: { attivo: boolean; valore: string; intestatario: string };  // IBAN
    contanti: { attivo: boolean };
  };

  listaAperta: boolean;             // true = chi apre il link si aggiunge da solo
  stato: "bozza" | "aperta" | "chiusa";

  // denormalizzati, aggiornati in transazione a ogni cambio di stato partecipante
  totaleConfermatoCent: number;
  nConfermati: number;
  nAttesi: number;                  // partecipanti non rinunciati

  acquisto: {                       // compilato alla chiusura
    fatto: boolean;
    speseCent: number | null;
    ricevutaUrl: string | null;
    destinazioneAvanzo: "biglietto" | "restituito" | "extra" | null;
  } | null;

  creatoIl: Timestamp;
  aggiornatoIl: Timestamp;
}
```

### `/collette/{slug}/partecipanti/{partecipanteId}`

`partecipanteId` = l'uid anonimo di chi ha creato la riga, quando la crea il partecipante; un id generato, quando la crea l'organizzatore dalla lista.

```ts
{
  nome: string;
  uidAnonimo: string | null;        // null per righe create dall'organizzatore e non ancora rivendicate
  stato: "invitato" | "aderito" | "dichiarato" | "confermato" | "rinunciato";
  metodo: "paypal" | "satispay" | "bonifico" | "contanti" | null;
  importoCent: number | null;       // compilato solo con modoQuota "libera"
  causale: string;                  // vedi 10.4
  messaggio: string | null;         // per il biglietto collettivo
  creatoIl: Timestamp;
  dichiaratoIl: Timestamp | null;
  confermatoIl: Timestamp | null;
  solleciti: number;                // quanti promemoria ha già ricevuto
}
```

### `/collette/{slug}/eventi/{eventoId}`

Lo strumento di misura. Vedi sezione 13. Scrittura sola, mai modifica.

```ts
{
  tipo: "apertura" | "adesione" | "metodo_scelto" | "dichiarazione"
      | "messaggio" | "rinuncia" | "sollecito_preparato" | "conferma";
  uidAnonimo: string | null;
  partecipanteId: string | null;
  meta: Record<string, string | number | boolean>;
  ts: Timestamp;
}
```

### Indici

In `firestore.indexes.json`: `collette` su `organizzatoreUid` + `creatoIl desc`; `prodotti` su `attivo` + `categoria`; `prodotti` su `attivo` + `occasioni` (array-contains) + `prezzoCent`.

---

## 6. Regole di sicurezza

Le regole devono far rispettare al database una regola di prodotto: **il partecipante non può dichiararsi confermato**. Scrivile in `firestore.rules` e coprile con i test.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function autenticato() { return request.auth != null; }

    function collettaDi(slug) {
      return get(/databases/$(database)/documents/collette/$(slug)).data;
    }
    function sonoOrganizzatore(slug) {
      return autenticato() && collettaDi(slug).organizzatoreUid == request.auth.uid;
    }

    match /prodotti/{id} {
      allow read: if autenticato();
      allow write: if false;                 // solo Admin SDK (script di seed)
    }

    match /utenti/{uid} {
      allow read, write: if autenticato() && request.auth.uid == uid;
    }

    match /collette/{slug} {
      // chi ha il link legge; nessuno può elencare le collette altrui
      allow get: if autenticato();
      allow list: if autenticato()
                  && request.query.limit <= 50
                  && resource.data.organizzatoreUid == request.auth.uid;

      allow create: if autenticato()
                  && request.resource.data.organizzatoreUid == request.auth.uid
                  && request.resource.data.totaleConfermatoCent == 0
                  && request.resource.data.nConfermati == 0;

      allow update: if sonoOrganizzatore(slug)
                  && request.resource.data.organizzatoreUid == resource.data.organizzatoreUid;

      allow delete: if false;

      match /partecipanti/{pid} {
        allow read: if autenticato();

        function miaRiga() {
          return autenticato() && resource.data.uidAnonimo == request.auth.uid;
        }
        function statiConsentitiAlPartecipante() {
          return request.resource.data.stato in ['aderito', 'dichiarato', 'rinunciato'];
        }

        // il partecipante crea la propria riga, con il proprio uid
        allow create: if autenticato()
          && request.resource.data.uidAnonimo == request.auth.uid
          && pid == request.auth.uid
          && statiConsentitiAlPartecipante()
          && request.resource.data.confermatoIl == null;

        // l'organizzatore crea righe della lista degli attesi
        allow create: if sonoOrganizzatore(slug)
          && request.resource.data.stato == 'invitato';

        // il partecipante aggiorna solo la propria riga e mai lo stato 'confermato'
        allow update: if miaRiga()
          && request.resource.data.uidAnonimo == resource.data.uidAnonimo
          && statiConsentitiAlPartecipante()
          && request.resource.data.confermatoIl == resource.data.confermatoIl;

        // l'organizzatore può tutto sulle righe della sua colletta
        allow update, delete: if sonoOrganizzatore(slug);
      }

      match /eventi/{eid} {
        allow create: if autenticato()
                      && request.resource.data.ts == request.time;
        allow read: if sonoOrganizzatore(slug);
        allow update, delete: if false;
      }
    }
  }
}
```

**Avvertenza da riportare in `DECISIONI.md`:** chi conosce lo slug legge anche l'IBAN dell'organizzatore. È accettabile per un prototipo perché lo slug è ad alta entropia (sezione 10.2) e lo stesso dato oggi finisce in chiaro in una chat di gruppo. In produzione quei campi andranno dietro una funzione server con limitazione di frequenza. Non risolverlo adesso; scrivilo.

---

## 7. Autenticazione

Due tipi di persona, due trattamenti diversi. È una decisione di prodotto, non tecnica.

### Organizzatore — account vero

Firebase Auth con **collegamento via email** (email link / passwordless) e, se banale da aggiungere, Google. Niente password da ricordare.
Alla prima autenticazione crea `/utenti/{uid}`.
Protetto: `/crea`, `/gestisci/**`, `/le-mie-collette`.

### Partecipante — nessuna registrazione, mai

Chi apre il link **non deve registrarsi, né lasciare un'email, né installare nulla**. Questo è il requisito più importante dell'intero prototipo: ogni attrito qui fa fallire la colletta.

Implementazione: `signInAnonymously()` al primo caricamento della pagina pubblica, in silenzio e senza alcuna interfaccia. L'uid anonimo serve a due cose: far funzionare le regole di sicurezza e riconoscere la persona se torna sul link.

- Salva l'uid in `localStorage` sotto `colletta.uid` per ritrovare la riga al ritorno.
- Se `localStorage` non è disponibile o l'uid non corrisponde a nessuna riga, trattala come una persona nuova. Non mostrare errori.
- Al partecipante chiedi **solo il nome**. Nient'altro è obbligatorio, mai.

Se un partecipante è anche organizzatore ed è già autenticato, usa quell'identità invece di quella anonima.

---

## 8. Mappa delle rotte

| Rotta | Resa | Accesso | Contenuto |
|---|---|---|---|
| `/` | statica | pubblica | Che cos'è, come funziona in tre passi, pulsante «Organizza un regalo» |
| `/catalogo` | server | pubblica | Griglia prodotti, filtri per occasione, categoria, fascia di prezzo |
| `/prodotto/[slug]` | server | pubblica | Scheda prodotto, pulsante «Regalalo in gruppo» |
| `/accedi` | client | pubblica | Collegamento via email |
| `/crea` | client | organizzatore | Wizard in sei passi (9.4) |
| `/crea?prodotto=[slug]` | client | organizzatore | Wizard con il passo 1 già compilato |
| `/c/[slug]` | **server** | pubblica + anonimo | Pagina del partecipante. Metadati Open Graph. |
| `/c/[slug]/opengraph-image` | server | pubblica | Immagine dell'anteprima, generata |
| `/gestisci/[slug]` | client | solo organizzatore | Dashboard della raccolta (9.8) |
| `/gestisci/[slug]/chiusura` | client | solo organizzatore | Chiusura, acquisto, avanzo, biglietto (9.9) |
| `/le-mie-collette` | client | organizzatore | Elenco delle proprie collette |

Chi non è l'organizzatore e apre `/gestisci/[slug]` viene rimandato a `/c/[slug]` senza messaggi di errore allarmanti.

---

## 9. Le schermate

Il riferimento visivo è il prototipo cliccabile già approvato. Qui conta il comportamento.

### 9.1 Home `/`

Spiega il servizio in poche righe: *scegli il regalo, manda un link, noi teniamo il conto e ricordiamo a chi manca*. Tre passi illustrati, poi due inviti all'azione: «Organizza un regalo» (porta al catalogo) e «Guarda come appare a chi partecipa» (porta a una colletta dimostrativa in sola lettura).

### 9.2 Catalogo `/catalogo`

Griglia responsiva (1 colonna su telefono, 2 su tablet, 3-4 su desktop). Filtri: occasione, categoria, fascia di prezzo (fino a 30 € / 30-80 € / 80-150 € / oltre 150 €). I filtri vivono nella query string, così il link è condivisibile. Ogni scheda: immagine, nome, marca, prezzo, tempi di consegna, pulsante «Regalalo in gruppo» che porta a `/crea?prodotto=<slug>`.

Nessun carrello, nessun acquisto, nessun login per guardare.

### 9.3 Scheda prodotto `/prodotto/[slug]`

Immagine grande, nome, marca, prezzo, descrizione, consegna, link esterno finto («Vedi sul negozio», `rel="nofollow noopener"`, apre in una scheda nuova). Riquadro in evidenza: «Regalo di gruppo: con 12 persone sono 10 € a testa» con il calcolo aggiornato da un piccolo selettore del numero di persone. È il ponte verso il wizard: il pulsante «Organizza la colletta» passa il prodotto a `/crea`.

### 9.4 Creazione `/crea` — wizard in sei passi

Un passo per schermata, barra di avanzamento, «Indietro» sempre disponibile. Lo stato si salva in `sessionStorage` a ogni passo, così un ricaricamento non perde il lavoro. La colletta nasce su Firestore come `stato: "bozza"` al passo 2 e viene aggiornata a ogni passo; diventa `"aperta"` solo al passo 6.

**Passo 1 — Il regalo.** Due modi: scegli dal catalogo (ricerca + griglia compatta) oppure incolla un link. Per il link: nel prototipo **non** fare scraping; mostra un modulo in cui l'organizzatore scrive a mano nome, prezzo e giorni di consegna, con l'avviso «Nella versione definitiva questi dati li leggiamo noi dalla pagina».

**Passo 2 — Per chi e quando.** Nome del festeggiato, occasione (elenco a tendina), data del regalo (selettore di data, minimo domani). Sotto, in evidenza, la scadenza calcolata (10.1) con la spiegazione del calcolo. Se la data scelta non lascia tempo alla consegna, avvisa e proponi la prima data possibile. Interruttore «modalità sorpresa», attivo di default.

**Passo 3 — La quota.** Tre modalità in schede selezionabili (10.3), numero di persone previste, e per la quota fissa il campo dell'importo. Un riquadro ricalcola in tempo reale la quota a testa, il totale previsto e l'avanzo. Deve aggiornarsi a ogni battitura.

**Passo 4 — Come ti pagano.** Quattro interruttori con il campo corrispondente: PayPal (handle o link), Satispay (numero), bonifico (IBAN + intestatario), contanti (nessun campo). Valida il formato dell'IBAN (lunghezza e checksum IBAN, non solo la forma). Almeno un metodo deve essere attivo. Nota ben visibile: «Questi dati li vede solo chi apre il link della colletta. I soldi arrivano direttamente a te: il servizio non li tocca mai.»

**Passo 5 — Chi partecipa.** Scelta tra lista chiusa (area di testo, un nome per riga, con il conteggio aggiornato) e lista aperta (chi apre il link si aggiunge). Con la lista chiusa, crea una riga `invitato` per ogni nome. I recapiti sono **facoltativi** e per ora non si chiedono: i promemoria li inoltra l'organizzatore (sezione 12).

**Passo 6 — Invita.** Mostra: l'anteprima della scheda come apparirà nella chat, il link completo con pulsante di copia, e il messaggio già scritto con pulsante di copia e un pulsante «Apri WhatsApp» (`https://wa.me/?text=<messaggio+url codificato>`). Poi «Apri la raccolta» che porta a `/gestisci/[slug]` e imposta `stato: "aperta"`.

### 9.5 Pagina pubblica `/c/[slug]`

**Resa lato server** con Admin SDK: serve per i metadati e perché la prima schermata deve comparire immediatamente, anche con una rete lenta. I dati dinamici (avanzamento) si aggiornano poi dal client con `onSnapshot`.

Prima schermata, nell'ordine: chi organizza, il titolo («Il regalo per Giulia»), occasione e data, la scheda del regalo con immagine e prezzo, **la quota in grande**, la barra di avanzamento con «8 persone su 12 hanno già partecipato», il pulsante «Partecipo», e sotto, discreto, «Non partecipo».

Vincoli di questa pagina, da rispettare alla lettera:

- **Nessuna registrazione, nessun login, nessuna richiesta di email.**
- Deve essere leggibile e utilizzabile in meno di un secondo su telefono.
- Niente intestazione del sito, niente menu di navigazione, niente pubblicità del catalogo: la pagina ha un solo compito.
- Se la colletta è `chiusa`, mostra lo stato finale (regalo acquistato, biglietto) invece del flusso di pagamento.

### 9.6 Il flusso del partecipante

Dopo «Partecipo», tre passi:

1. **Nome.** Un solo campo. Crea la riga partecipante con stato `aderito` e genera la causale.
2. **Metodo.** Solo i metodi attivati dall'organizzatore, uno per pulsante. Alla scelta si apre il pannello del metodo (10.5). Poi un pulsante «Fatto, ho pagato».
3. **Conferma.** La schermata più importante del prototipo: *«Hai pagato? Confermalo qui, così Marco non deve chiedertelo.»* con due risposte: «Sì, ho pagato» (→ stato `dichiarato`, registra l'evento `dichiarazione`) e «Non ancora, lo faccio dopo» (resta `aderito`).

Poi il biglietto (9.7) e una schermata di chiusura con l'avanzamento aggiornato e l'invito a organizzare la prossima colletta.

Chi torna sul link dopo aver già dichiarato vede il proprio stato, non il flusso da capo.

### 9.7 Biglietto

Dopo la dichiarazione: «Due righe per Giulia — finiranno sul biglietto firmato da tutto il gruppo». Area di testo, massimo 240 caratteri, facoltativa. Salva in `messaggio`.

### 9.8 Dashboard organizzatore `/gestisci/[slug]`

Dati in tempo reale con `onSnapshot`. Dall'alto:

1. **Sommario**: totale confermato su obiettivo, barra, quante quote mancano, scadenza.
2. **Da confermare** — compare solo se c'è qualcosa. Una riga per ogni `dichiarato`, con nome, metodo dichiarato, causale, e due pulsanti: «Confermo» (→ `confermato`, aggiorna i totali in transazione) e «Non l'ho trovato» (→ torna `aderito`, con nota).
3. **Contanti da ricevere** — righe con metodo `contanti`, pulsante «Ricevuti» (→ `confermato`).
4. **Tutti i partecipanti** — elenco completo con lo stato di ciascuno. L'organizzatore può aggiungere un nome, segnare una rinuncia, registrare un pagamento al posto di qualcuno.
5. **Solleciti** — i testi già pronti (sezione 12) con il pulsante per inoltrarli.
6. **Il link** — sempre a portata di mano, con copia e «Apri WhatsApp».

Le azioni devono essere **ottimistiche**: l'interfaccia si aggiorna subito, e torna indietro con un avviso se la scrittura fallisce.

### 9.9 Chiusura `/gestisci/[slug]/chiusura`

Accessibile sempre, in evidenza dalla scadenza.

- Se mancano quote: il conto esatto di quanto manca e tre strade — ci metto io la differenza, scelgo un regalo meno costoso, rimando di un giorno e sollecito. Ogni scelta spiega la conseguenza. Nessuna di esse scrive a nessuno che non ha pagato.
- Se l'obiettivo è raggiunto: pulsante «Compra il regalo» che apre `urlEsterno` in una scheda nuova, campo per la spesa reale, caricamento della ricevuta (Firebase Storage; se non configurato, un campo per il link).
- **Avanzo** = totale confermato − spesa reale. Se positivo, tre destinazioni: tienilo per biglietto e confezione, restituisci (il servizio calcola la cifra per persona e la elenca; i bonifici li fa l'organizzatore), aggiungi un extra al regalo.
- **Biglietto collettivo**: tutti i messaggi raccolti, su una pagina stampabile (`/c/[slug]/biglietto`, resa server, adatta alla stampa in A5).
- **Rendiconto**: pagina pubblica in sola lettura con regalo, spesa, ricevuta, partecipanti e destinazione dell'avanzo. Alla chiusura, `/c/[slug]` mostra questo.

### 9.10 Le mie collette `/le-mie-collette`

Elenco delle collette dell'organizzatore con stato, avanzamento e scadenza. Le bozze si possono riprendere o eliminare.

---

## 10. Regole di dominio

Vanno in `lib/dominio/`, come **funzioni pure senza dipendenze da Firebase**, con test unitari. Non duplicarle nei componenti.

### 10.1 Scadenza

```
scadenza = dataRegalo − (consegnaGiorni + 1 giorno di margine)
```

Se il risultato è oggi o nel passato, la data del regalo non è compatibile: avvisa e proponi `oggi + consegnaGiorni + 2`. La scadenza è un momento della giornata: fissala alle 20:00 locali, orario italiano.

### 10.2 Slug

10 caratteri dall'alfabeto `23456789abcdefghjkmnpqrstuvwxyz` (niente caratteri ambigui), estratti con un generatore crittografico. Circa 50 bit: non indovinabile. Verifica che non esista già prima di scrivere.

### 10.3 Quota

| Modalità | Calcolo | Comportamento |
|---|---|---|
| `fissa` | La decide l'organizzatore; proposta iniziale `ceil(prezzo / previsti)` arrotondata all'euro | Non cambia mai. L'eccedenza va in avanzo. |
| `divisa` | `prezzo / numero di aderenti`, al centesimo | Si ricalcola a ogni nuova adesione **finché non è congelata** |
| `libera` | Quota suggerita `ceil(prezzo / previsti)`; ognuno inserisce il proprio importo | L'importo è visibile **solo all'organizzatore**, mai agli altri partecipanti |

**Congelamento** (regola importante): la quota si congela — `quotaCongelata: true` — al primo passaggio di un partecipante a `confermato`, oppure quando l'organizzatore chiude le adesioni. Da quel momento chi si aggiunge paga la quota congelata e la differenza finisce nell'avanzo.

Senza questa regola, ogni nuovo partecipante costringerebbe a ricalcolare le quote di chi ha già pagato, generando micro-rimborsi che nessuno fa. Non ometterla.

### 10.4 Causale

```
causale = <FESTEGGIATO>-<NOME>
```

Solo A-Z, maiuscole, accenti rimossi, massimo 10 caratteri per parte. In caso di omonimia nella stessa colletta aggiungi un numero: `GIULIA-MARCO2`. La causale è il meccanismo che permette all'organizzatore di riconoscere un bonifico sul proprio estratto conto: mostrala sempre con un pulsante di copia accanto.

### 10.5 Pannelli di pagamento

| Metodo | Comportamento | Ripiego |
|---|---|---|
| PayPal | Link `https://paypal.me/<handle>/<importo>EUR` in una scheda nuova. **Da verificare** che il formato con importo funzioni con l'handle fornito. | Link al profilo senza importo, con la cifra scritta grande accanto |
| Satispay | **Da verificare** se esista un link pubblico con importo. Finché non è verificato: non inventarlo. | Numero dell'organizzatore con pulsante di copia e istruzioni in due righe |
| Bonifico | Tre pulsanti di copia: IBAN, causale, importo. In più, se riesci: codice QR nello standard **EPC069-12** (giro-code) generato con una libreria QR locale. Marca il QR come da verificare su app bancarie italiane reali. | I tre pulsanti di copia da soli bastano e devono funzionare sempre |
| Contanti | Nessun link. Testo: «Darai 10 € a Marco di persona, li segnerà lui» | — |

Ogni pulsante di copia usa `navigator.clipboard.writeText` dentro il gestore del click, con ricaduta sulla selezione del testo se viene rifiutato. Dopo la copia, conferma visibile per circa un secondo e mezzo.

### 10.6 Stati del partecipante

```
invitato ──► aderito ──► dichiarato ──► confermato
    │           │             │
    └───────────┴─────────────┴──────► rinunciato

contanti: aderito ──► (l'organizzatore registra) ──► confermato
```

- `dichiarato` lo scrive **solo** il partecipante.
- `confermato` lo scrive **solo** l'organizzatore (imposto dalle regole, sezione 6).
- Il totale mostrato al gruppo conta **solo** i `confermati`. Una dichiarazione in attesa non gonfia mai la barra: un servizio che dicesse «raccolti 120 €» basandosi su autodichiarazioni perderebbe credibilità alla prima colletta andata storta.

### 10.7 Totali

`totaleConfermatoCent`, `nConfermati` e `nAttesi` si aggiornano **dentro una transazione Firestore** insieme al cambio di stato del partecipante. Non calcolarli leggendo tutta la sottocollezione a ogni resa.

---

## 11. Link, anteprime e condivisione

L'anteprima nella chat è la prima impressione del servizio e decide se il link viene aperto. Trattala come una schermata.

Su `/c/[slug]`, con `generateMetadata`:

- `title`: `Regalo per <festeggiato> · <quota> a testa`
- `description`: `<prodotto>. <organizzatore> sta organizzando un regalo di gruppo. Ci metti un minuto.`
- `openGraph` + `twitter` completi, con `images` che punta a `/c/[slug]/opengraph-image`
- Se `sorpresa`: `robots: { index: false, follow: false }` e un titolo neutro, `Un regalo a sorpresa`, perché il festeggiato potrebbe vedere l'anteprima per sbaglio.

L'immagine dell'anteprima si genera con `ImageResponse` di `next/og`, 1200×630: fondo con i colori del marchio, nome del regalo, quota in grande, avanzamento. Nessun font esterno non incorporato.

Il messaggio precompilato:

> Ciao! Facciamo un regalo di gruppo a **<festeggiato>**. Sono **<quota>** a testa, entro **<scadenza>**. Qui c'è tutto, ci metti un minuto: <url>

Pulsante «Apri WhatsApp» con `https://wa.me/?text=<encodeURIComponent(messaggio)>`. Accanto, sempre, il pulsante di copia: su desktop il link `wa.me` può non fare nulla, e il prototipo non deve dipendere da esso.

---

## 12. Promemoria

Senza i recapiti dei partecipanti il servizio non può scrivere a nessuno. Il prototipo quindi fa questo:

**Il servizio prepara, l'organizzatore inoltra.** La dashboard mostra, per ogni momento previsto, il testo già scritto, con il pulsante di copia e il pulsante WhatsApp. Un tocco, e il messaggio parte dal telefono dell'organizzatore.

Calendario (calcolato rispetto alla scadenza):

| Quando | A chi | Testo |
|---|---|---|
| Subito dopo l'invito | chi non ha ancora aperto il link | «<organizzatore> sta organizzando il regalo per <festeggiato>. Dai un'occhiata: <url>» |
| 5 giorni prima | chi non ha aderito | «Partecipi al regalo per <festeggiato>? Bastano <quota>: <url>» |
| 3 giorni prima | chi ha aderito e non ha pagato | «Manca la tua quota per il regalo di <festeggiato>: <quota>. <url>» |
| 1 giorno prima | chi ancora manca | «Domani <organizzatore> compra il regalo. Se vuoi esserci, è il momento: <url>» |
| Alla scadenza | all'organizzatore | «Mancano N quote. Vuoi aspettare un giorno, procedere lo stesso o sollecitare ancora?» |

Tre regole da rispettare nel codice:

1. **Mai più di quattro messaggi per persona** in tutta la colletta: conta `solleciti` sulla riga e non proporre oltre.
2. **Mai un tono di rimprovero.** Il messaggio informa e dà il link. Non dice «sei l'unico che manca» e non elenca chi ha già pagato.
3. **Sempre un modo per uscire**: ogni messaggio contiene il link, e la pagina ha il pulsante «Non partecipo».

Predisponi `functions/` con una Cloud Function pianificata giornaliera (`scheduler`) che calcola chi andrebbe sollecitato e scrive un evento `sollecito_preparato`. **Non attivarla**: richiede il piano a consumo. Lasciala pronta e documentata in `DECISIONI.md`. L'invio per email è fuori perimetro.

---

## 13. Misurazione

Il prototipo esiste per rispondere a una domanda:

> **Dopo aver pagato, il partecipante torna sulla pagina e tocca «Ho pagato» senza che nessuno glielo chieda?**

Perché sia misurabile, registra gli eventi della sezione 5 in `/collette/{slug}/eventi`. Poi costruisci `/gestisci/[slug]/dati`, visibile solo all'organizzatore, con l'imbuto:

```
aperture → adesioni → metodo scelto → dichiarazioni → messaggi lasciati
```

Per ogni passaggio: numero assoluto, percentuale sul passaggio precedente e tempo mediano. In più: la ripartizione dei metodi scelti, il tempo mediano fra `metodo_scelto` e `dichiarazione`, e quante dichiarazioni sono arrivate **prima** di qualunque sollecito — che è la metrica che conta.

Nessuno strumento di analisi di terze parti. Nessun cookie di tracciamento. Gli eventi non contengono dati personali oltre al nome già inserito.

---

## 14. Catalogo finto

Script `scripts/seed.ts`, eseguibile con `pnpm seed`, che scrive i prodotti con l'Admin SDK. Idempotente: usa lo slug come id del documento.

**Marchi e prodotti sono inventati.** Non usare marchi reali.

| slug | nome | marca | € | categoria | occasioni | gg |
|---|---|---|---|---|---|---|
| cuffie-silenzio-pro | Cuffie over-ear a cancellazione di rumore | Norvent | 116 | audio | compleanno, laurea, pensione | 3 |
| giradischi-salotto | Giradischi con altoparlanti integrati | Norvent | 149 | audio | compleanno, matrimonio | 4 |
| cassa-portatile-riva | Cassa portatile impermeabile | Norvent | 69 | audio | compleanno, saluto | 2 |
| macchina-caffe-dedica | Macchina da caffè a leva con montalatte | Casa Lumen | 169 | cucina | matrimonio, pensione | 2 |
| set-coltelli-damasco | Set di tre coltelli da cucina forgiati | Casa Lumen | 98 | cucina | matrimonio, compleanno | 3 |
| planetaria-compatta | Impastatrice planetaria compatta | Casa Lumen | 189 | cucina | matrimonio | 5 |
| teiera-ghisa | Teiera in ghisa con servizio da quattro | Casa Lumen | 54 | cucina | saluto, compleanno | 3 |
| lampada-tramonto | Lampada da tavolo a luce calda regolabile | Orto Vivo | 72 | casa | compleanno, nascita | 2 |
| diffusore-essenze | Diffusore di essenze in ceramica | Orto Vivo | 45 | benessere | saluto, compleanno | 2 |
| plaid-lana-merino | Plaid in lana merino | Orto Vivo | 89 | casa | nascita, matrimonio | 4 |
| vaso-autoirrigante | Set di tre vasi autoirriganti | Orto Vivo | 38 | casa | saluto | 3 |
| cofanetto-vini | Cofanetto degustazione di sei vini | Vigna Corta | 89 | esperienze | pensione, laurea | 5 |
| corso-cucina | Corso di cucina per due persone | Vigna Corta | 130 | esperienze | matrimonio, compleanno | 1 |
| volo-mongolfiera | Volo in mongolfiera per due | Vigna Corta | 290 | esperienze | matrimonio, pensione | 1 |
| abbonamento-caffe | Abbonamento caffè, sei mesi | Vigna Corta | 96 | esperienze | saluto, pensione | 1 |
| zaino-fotografico | Zaino fotografico da 20 litri | Rotta Nord | 148 | viaggio | laurea, compleanno | 4 |
| trolley-cabina | Trolley da cabina in policarbonato | Rotta Nord | 119 | viaggio | laurea, pensione | 3 |
| borraccia-termica | Borraccia termica da un litro | Rotta Nord | 34 | viaggio | saluto | 2 |
| tappetino-yoga | Tappetino da yoga in sughero | Equilibrio | 64 | benessere | compleanno, nascita | 3 |
| massaggiatore-cervicale | Massaggiatore cervicale elettrico | Equilibrio | 82 | benessere | pensione, compleanno | 3 |
| gioco-strategia | Gioco da tavolo di strategia, 2-4 giocatori | Mastro Gioco | 49 | gioco | compleanno, saluto | 2 |
| puzzle-mille | Puzzle da mille pezzi con stampa d'autore | Mastro Gioco | 29 | gioco | saluto, nascita | 2 |
| penna-stilografica | Penna stilografica con incisione | Scrittoio | 95 | ufficio | laurea, pensione | 4 |
| lampada-scrivania | Lampada da scrivania con ricarica senza fili | Scrittoio | 78 | ufficio | laurea, compleanno | 3 |

Descrizioni: una o due frasi, scritte da te, concrete e senza enfasi pubblicitaria.
`urlEsterno`: `https://negozio-esempio.it/p/<slug>`.

**Immagini.** Niente file esterni e niente servizi di immagini remote. Scrivi un componente `<ImmagineProdotto prodotto={p} />` che disegna un SVG deterministico a partire da `immagine.seme`: fondo con un gradiente a due tinte derivate dal seme (tonalità ricavata con un hash del seme, saturazione e luminosità fisse e coerenti con la palette), più un'icona a tratto per la categoria (otto icone, una per categoria, disegnate a mano in SVG). Stesso prodotto, stessa immagine, sempre. Sostituibili con foto vere in seguito senza toccare il resto.

Crea anche **una colletta dimostrativa** (`scripts/seed-demo.ts`): slug fisso `demo`, dodici partecipanti negli stati della sezione 10.6, quattro messaggi sul biglietto. Serve alla home e alle dimostrazioni, e non va mai mostrata come colletta reale.

---

## 15. Design system

Riproduci questi token esatti in `app/globals.css` e mappali in `tailwind.config.ts`. Non inventare una palette nuova.

```css
:root{
  --field:#EDF1EE; --surface:#FFFFFF; --surface-2:#F6F9F7;
  --ink:#16241F; --ink-soft:#5B6D66; --line:#DBE3DE;
  --accent:#0F7A63; --accent-2:#0B5E4C; --on-accent:#FFFFFF; --accent-field:#E6F2EE;
  --gold:#A8701F; --gold-field:#FBF1DF; --gold-line:#E8D3AC;
  --ok:#2E7D59; --ok-field:#E4F2EA;
}
```

Tema scuro: ripeti i token sotto `@media (prefers-color-scheme: dark)` con il selettore `:root:not([data-theme="light"])` e di nuovo sotto `:root[data-theme="dark"]`, con `color-scheme: dark`.

```css
--field:#0E1613; --surface:#18211D; --surface-2:#1E2925;
--ink:#E7EFEA; --ink-soft:#9AADA5; --line:#2B3833;
--accent:#43AC8E; --accent-2:#5BC2A3; --on-accent:#08130F; --accent-field:#172A24;
--gold:#D7A458; --gold-field:#2A2318; --gold-line:#453722;
--ok:#5CBE92; --ok-field:#17291F;
```

**Tipografia.** Bricolage Grotesque per titoli e cifre (500 e 700), IBM Plex Sans per il testo (400, 500, 600), via `next/font/google`. Gli importi usano `font-variant-numeric: tabular-nums`.

**Componenti da costruire una volta sola** in `components/ui/`: `Bottone` (primario, secondario, testuale, piccolo), `Campo`, `SchedaScelta`, `Barra`, `Etichetta` (stati: confermato, da confermare, contanti), `RigaPartecipante`, `PannelloCopia`, `Avviso` (neutro, attenzione, positivo), `ImmagineProdotto`.

**Regole di resa.** Raggio 14 px per i contenitori, 10 px per i controlli. Spaziatura con flex/grid e `gap`, mai margini per elemento. Area toccabile minima 44 px. Stato di messa a fuoco sempre visibile. `prefers-reduced-motion` rispettato. Gutter laterale di almeno 16 px a ogni larghezza, e **mai** scorrimento orizzontale della pagina.

**Larghezze.** La pagina del partecipante è una colonna da massimo 420 px, centrata: è pensata per il telefono e su desktop resta stretta. La dashboard arriva a 880 px. Il catalogo è a tutta larghezza fino a 1200 px.

---

## 16. Casi limite da gestire

| Caso | Comportamento |
|---|---|
| Importo diverso dalla quota | In conferma, l'organizzatore inserisce l'importo reale. Se inferiore, la differenza resta nell'ammanco; se superiore, va in avanzo. |
| Doppia dichiarazione della stessa persona | Una riga per uid: la seconda dichiarazione aggiorna, non duplica. |
| Chi non paga mai | Resta `aderito`. Visibile **solo** all'organizzatore. Mai esposto al gruppo. |
| Slug inesistente | Pagina 404 dedicata: «Questa colletta non esiste o è stata chiusa». Nessun dettaglio tecnico. |
| Colletta scaduta ma aperta | Banner «La raccolta è scaduta», il flusso di pagamento resta disponibile finché l'organizzatore non chiude. |
| Partecipante che cambia dispositivo | Nuovo uid anonimo, quindi nuova riga. Offri «Hai già partecipato? Continua con il tuo nome» che cerca per nome e, se trova corrispondenza, chiede conferma. |
| Prezzo cambiato | Fuori perimetro: il prezzo è fisso alla creazione. Scrivilo in `DECISIONI.md`. |
| Organizzatore che perde l'accesso | Fuori perimetro. Nessun co-organizzatore in questa versione. |
| `localStorage` non disponibile | Tutto funziona lo stesso: la persona è trattata come nuova. Mai un errore visibile. |
| Firestore irraggiungibile | Avviso non bloccante e nuovo tentativo. Le azioni ottimistiche tornano indietro. |

---

## 17. Che cosa NON costruire

- Qualunque incasso, pagamento, deposito in garanzia o rimborso automatico.
- Integrazioni con fornitori di pagamento o con le API bancarie.
- Invio di email o SMS.
- Registrazione per il partecipante, in qualunque forma.
- Pannello di amministrazione, ruoli, co-organizzatori.
- Votazione fra più regali (prevista, ma non in questa versione).
- Applicazione nativa, PWA, notifiche push.
- Internazionalizzazione, modalità multivaluta.
- Strumenti di analisi di terze parti.
- Scraping di pagine prodotto esterne.

---

## 18. Ordine di lavoro

Sei fasi. **Alla fine di ognuna l'applicazione deve avviarsi e funzionare**, prima con l'adattatore in memoria, poi con Firestore.

1. **Fondamenta.** Progetto Next.js, Tailwind, token e font, componenti di base, adattatore dati con le due implementazioni, pagina home. *Fatto quando*: `pnpm dev` mostra una home curata e `pnpm build` passa.
2. **Catalogo.** Script di seed, componente immagine, `/catalogo` con filtri, `/prodotto/[slug]`. *Fatto quando*: si naviga il catalogo e il calcolo «quanto a testa» funziona.
3. **Creazione.** Autenticazione dell'organizzatore, wizard completo, regole di dominio con i loro test, scrittura della colletta, pagina dell'invito. *Fatto quando*: si crea una colletta e si ottiene un link funzionante.
4. **Partecipante.** `/c/[slug]` resa server, autenticazione anonima, flusso in tre passi, pannelli di pagamento, biglietto, anteprime Open Graph. *Fatto quando*: da un telefono vero, aperto il link da WhatsApp, si arriva a «Ho pagato» in meno di un minuto.
5. **Dashboard e chiusura.** Tempo reale, code di conferma, contanti, solleciti, chiusura, avanzo, biglietto, rendiconto. *Fatto quando*: il giro completo organizzatore → partecipante → conferma → chiusura funziona.
6. **Misura e rifinitura.** Eventi, pagina dei dati, regole di sicurezza con i test, casi limite, accessibilità, prestazioni. *Fatto quando*: tutti i criteri della sezione 19 passano.

---

## 19. Criteri di accettazione

Da verificare uno per uno prima di dichiarare finito. Dove è indicato, serve un test automatico.

1. **Creazione.** Da `/catalogo` si arriva a una colletta aperta con link valido in meno di quattro minuti, senza aiuto esterno.
2. **Anteprima.** Incollando il link in WhatsApp, Telegram e Slack compare una scheda con immagine, nome del regalo e quota. In modalità sorpresa il titolo è neutro.
3. **Nessuna registrazione.** Dall'apertura del link alla dichiarazione di pagamento non viene chiesto né un indirizzo email, né una password, né un'installazione. Il campo obbligatorio è uno: il nome.
4. **Velocità.** Su telefono con rete simulata «Fast 3G», la prima schermata utile di `/c/[slug]` compare in meno di 1,5 secondi.
5. **Il partecipante non può confermarsi.** *Test automatico sulle regole*: un client autenticato in anonimo che tenta di scrivere `stato: "confermato"` sulla propria riga viene rifiutato.
6. **Conferma.** L'organizzatore conferma una dichiarazione e il totale sale della quota esatta, in tempo reale anche su un'altra scheda del browser già aperta.
7. **«Non l'ho trovato».** Riporta la riga ad `aderito` e il totale non cambia.
8. **Contanti.** Un partecipante che sceglie contanti compare nella coda dedicata, e il pulsante «Ricevuti» lo porta a confermato.
9. **Congelamento della quota.** *Test unitario*: in modalità `divisa`, dopo la prima conferma la quota non cambia più al variare degli aderenti.
10. **Causale.** Due partecipanti con lo stesso nome nella stessa colletta ricevono causali diverse.
11. **Isolamento.** *Test automatico sulle regole*: un organizzatore non legge né scrive i partecipanti di una colletta altrui; nessuno può elencare le collette di altri.
12. **Avanzo.** Con 12 quote da 10 € e una spesa di 116 €, la chiusura propone 4 € di avanzo e, scegliendo la restituzione, calcola 0,33 € a testa.
13. **Biglietto.** I messaggi lasciati compaiono tutti nella pagina del biglietto, che si stampa in A5 senza elementi dell'interfaccia.
14. **Imbuto.** `/gestisci/[slug]/dati` mostra aperture, adesioni, dichiarazioni e messaggi, e quante dichiarazioni sono arrivate prima di qualunque sollecito.
15. **Senza Firebase.** Con le variabili d'ambiente ai valori segnaposto, l'applicazione si avvia, avvisa che i dati sono finti e permette di percorrere l'intero flusso.
16. **Accessibilità.** Navigazione completa da tastiera, messa a fuoco sempre visibile, contrasto conforme ad AA in entrambi i temi, tutte le immagini con testo alternativo.
17. **Nessuno scorrimento orizzontale** a 320 px di larghezza, su tutte le pagine.
18. **Build pulita.** `pnpm build` e `pnpm lint` passano senza avvisi. Nessun `any` non giustificato.

---

## 20. Che cosa consegnare

```
/app                  rotte
/components/ui        componenti di base (sezione 15)
/components/...       componenti di dominio
/lib/dati             adattatore: firestore.ts, memoria.ts, index.ts
/lib/dominio          regole pure + test
/lib/firebase         client.ts, admin.ts
/scripts              seed.ts, seed-demo.ts
/functions            Cloud Function dei promemoria, pronta e non attiva
firestore.rules
firestore.indexes.json
.env.local.example
README.md
DECISIONI.md
```

`README.md`: avvio in locale, configurazione di Firebase quando arriveranno le credenziali, esecuzione del seed, deploy delle regole, comandi di test.

`DECISIONI.md`: ogni scelta presa dove la specifica taceva, ogni punto marcato «da verificare» con quello che hai implementato come ripiego, ogni limite noto. Scrivilo mentre lavori, non alla fine.

---

## 21. Quando avrai finito

Fai il giro completo su un telefono vero, con un link aperto davvero da WhatsApp, e annota dove hai esitato. Quelle esitazioni valgono più di qualunque collaudo: sono le stesse che avrà la persona che riceverà il link.
