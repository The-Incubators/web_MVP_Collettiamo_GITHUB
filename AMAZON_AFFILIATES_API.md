# Amazon Affiliates API per Regaloop

**Verifica delle fonti: 20 ottobre 2026.** La pagina richiesta, [Associates Central Italia](https://programma-affiliazione.amazon.it/home), non ha restituito contenuto pubblico nella navigazione senza accesso (errore 503). Questo documento si basa sulle pagine pubbliche ufficiali di Amazon collegate al programma italiano e alla documentazione Creators API. Non sono stati verificati l'account di Regaloop, la sua idoneità né credenziali API.

## Sintesi operativa

Per Regaloop l'API utile è **Amazon Creators API**, che permette di cercare prodotti Amazon.it e leggere dati di catalogo per ASIN. La documentazione Amazon indirizza gli utilizzatori della precedente Product Advertising API (PA-API 5.0) alla migrazione verso Creators API: un'integrazione nuova dovrebbe quindi partire da quest'ultima. I link affiliati già presenti nel progetto possono continuare a funzionare senza API; l'API serve soprattutto per aggiornare il catalogo e, in seguito, trovare nuovi regali. [Introduzione Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) · [Guida alla migrazione](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi) · [Avviso PA-API 5](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation)

**Vincolo decisivo:** Amazon elenca come prerequisiti l'iscrizione al programma per il marketplace, la registrazione dell'accesso API, le credenziali e almeno **10 vendite idonee negli ultimi 30 giorni** per l'accesso al catalogo tramite Creators API. Inoltre l'accesso può essere perso se non arrivano vendite qualificate per 30 giorni consecutivi. Va controllato lo stato reale dentro Associates Central: il possesso di un tracking ID non dimostra che l'API sia già disponibile. [Prerequisiti](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) · [Limiti e continuità dell'accesso](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates)

## Che cosa possiamo farci

| Funzione | Uso proposto in Regaloop | Priorità |
|---|---|---|
| `GetItems` | Aggiornare per ASIN i 180 prodotti curati: titolo, immagine, eventuale prezzo e disponibilità, URL di dettaglio | Alta |
| `SearchItems` | Proporre candidati per occasione, fascia di prezzo e categoria nella gestione del catalogo; selezione editoriale prima della pubblicazione | Media |
| `GetVariations` | Individuare taglie/colori e scegliere un ASIN acquistabile preciso | Media |
| `GetBrowseNodes` | Organizzare categorie e filtri del catalogo | Bassa |

Queste sono le quattro operazioni pubblicate da Amazon. `GetItems` accetta fino a 10 ASIN per chiamata; per 180 prodotti servirebbero almeno 18 richieste per un passaggio completo. `SearchItems` restituisce fino a 10 prodotti per richiesta, quindi non va trattata come esportazione completa del catalogo. [Riferimento API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference) · [Buone pratiche](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices) · [SearchItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/search-items)

## Stato attuale del progetto

Regaloop usa Next.js 15, Firebase e un catalogo curato di **180 prodotti Amazon.it**. Gli ASIN e i link puliti entrano da file Excel tramite `scripts/importa_catalogo.py`, poi sono normalizzati in `lib/dati/catalogo-amazon.json` e caricati su Firestore con `pnpm seed`. `lib/dominio/amazon.ts` aggiunge il tracking ID italiano ai link di acquisto; il sito mostra già la dichiarazione di affiliazione. Sono presenti foto locali dei prodotti in `public/foto-prodotti/` e prezzi rilevati il 14–16 ottobre 2026. Il prezzo scelto viene copiato nella colletta e resta fisso. Si vedano [README.md](README.md), [DECISIONI.md](DECISIONI.md) §§ 12, 15, [catalogo-dati.ts](lib/dati/catalogo-dati.ts) e [amazon.ts](lib/dominio/amazon.ts).

### Implicazioni immediate

1. **Foto:** la licenza italiana vieta di memorizzare o mettere in cache i contenuti immagine Amazon; permette di memorizzare il *link* all'immagine per un massimo di 24 ore. Le foto locali attuali vanno quindi esaminate e, se sono contenuti Amazon, sostituite con URL immagine ottenuti secondo licenza oppure con immagini originali di cui possediamo i diritti. L'accesso API non sana retroattivamente una copia locale. [Licenza PI italiana](https://programma-affiliazione.amazon.it/help/operating/license).
2. **Prezzi e disponibilità:** la licenza permette la cache di altri dati di prodotto per non oltre 24 ore e richiede aggiornamento alla scadenza. Se sono aggiornati meno spesso di ogni ora, accanto a prezzo/disponibilità occorrono data e ora; è richiesta anche l'informativa sul fatto che prezzo e disponibilità possono cambiare e che valgono quelli mostrati su Amazon all'acquisto. Le sole date oggi mostrate nel sito non bastano per contenuti di prezzo alimentati dall'API. Per la cifra della colletta conviene usare un **budget deciso dall'organizzatore**, distinto visivamente dal prezzo Amazon aggiornato. [Licenza PI italiana](https://programma-affiliazione.amazon.it/help/operating/license).
3. **Link:** quando la Creators API restituisce l'URL del prodotto, Amazon chiede di usarlo senza modificarne i parametri per preservare l'attribuzione. L'attuale funzione che riscrive il parametro `tag` può continuare a servire per i link manuali, ma **gli URL restituiti dall'API devono passare invariati**. Serve un tracking ID valido per Amazon.it in ogni richiesta. [Limiti e attribuzione](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates) · [Parametri comuni](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/common-request-headers-and-parameters).
4. **Dichiarazione:** il testo già usato dal progetto, «In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei», coincide con la formula dell'accordo italiano. Amazon richiede che sia chiaro e visibile e richiede inoltre un avviso legalmente conforme insieme ai link; va verificata la resa su ogni schermata che mostra link affiliati. [Accordo operativo italiano](https://programma-affiliazione.amazon.it/help/operating/agreement) · [Aiuto Amazon sulla dichiarazione](https://programma-affiliazione.amazon.it/help/node/topic/GHQNZAU6669EZS98).

## Come integrarla

**Prerequisiti amministrativi.** Accedere con l'account principale a [Associates Central Italia](https://programma-affiliazione.amazon.it/home), controllare che sito e tracking ID di Regaloop siano registrati, verificare l'idoneità alle API e registrare Creators API. Le credenziali sono segreti dell'applicazione: conservarle solo sul server, mai in variabili `NEXT_PUBLIC_*`, nel browser, in Firestore pubblico o nel repository. [Onboarding](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding).

**Flusso tecnico.** Un servizio server Next.js o un job pianificato ottiene un token OAuth 2.0 con `client_credentials`, lo riusa fino alla scadenza (un'ora) e chiama `https://creatorsapi.amazon/catalog/v1/getItems` o `searchItems` con `Authorization: Bearer ...`, `x-marketplace: www.amazon.it`, `marketplace: www.amazon.it` e il `partnerTag` italiano. Per credenziali EU versione 3.2, la guida indica `https://api.amazon.co.uk/auth/o2/token`; controllare la versione delle credenziali ottenute prima di fissare l'endpoint. Amazon pubblica SDK Node.js, oltre a esempi cURL. [Guida cURL](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl) · [Marketplace Italia](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/locale-reference/italy) · [SDK](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-sdk).

**Dati.** Tenere separati: (a) record editoriale stabile di Regaloop (`id`, ASIN, categorie/occasioni, testo originale, ordine); (b) dati Amazon temporanei con `fetchedAt` e scadenza; (c) budget della colletta, congelato alla creazione. Nel record temporaneo conservare l'URL restituito dall'API senza modificarlo e, per le immagini Amazon, soltanto l'URL nei limiti della licenza. Alla scadenza aggiornare o non mostrare i dati Amazon obsoleti; non usare il vecchio prezzo come se fosse corrente. Questa è una proposta architetturale derivata dalle regole di cache, non uno schema imposto da Amazon.

**Limiti e errori.** Amazon dichiara inizialmente fino a 1 richiesta al secondo e 8.640 al giorno per i primi 30 giorni dalle credenziali; poi la quota dipende dai ricavi attribuiti e può essere revocata. Applicare rate limiting centrale, richieste in batch, cache del token e retry con attesa per `429`; non chiamare l'API a ogni visita alla pagina. Verificare la quota effettiva nell'account. [Limiti](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates) · [Errori](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/troubleshooting/error-codes-and-messages).

## Sequenza consigliata

1. **Subito, anche senza API:** verificare l'account affiliato, le vendite richieste e la registrazione del sito; mettere in regola foto e presentazione dei prezzi già pubblicati. Mantenere i link affiliati esistenti.
2. **Quando l'accesso è attivo:** fare una prova server con 2–3 ASIN già presenti, controllando campi disponibili per Amazon.it, URL e attribuzione; non cambiare il catalogo pubblico durante la prova.
3. **Prima versione:** sincronizzazione programmata dei 180 ASIN, con batch e scadenza dei dati; mostrare foto via URL consentito, prezzo con data/ora e informativa, stato di prodotto non disponibile, e budget della colletta distinto.
4. **Poi:** ricerca di nuovi candidati con `SearchItems` nell'area amministrativa, mantenendo la selezione umana e la classificazione Regaloop.

### Punti da verificare nell'account

- Accesso Creators API realmente concesso e volume di vendite qualificate degli ultimi 30 giorni.
- Versione/area delle credenziali, quota effettiva e tracking ID corretto per Amazon.it.
- Campi `OffersV2`, immagini e `detailPageURL` effettivamente restituiti per gli ASIN del catalogo.
- Interpretazione contrattuale delle foto già copiate e dei prezzi statici esistenti; in caso di dubbio usare [il supporto Amazon Italia](https://programma-affiliazione.amazon.it/contact).
