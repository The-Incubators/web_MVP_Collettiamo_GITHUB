# Gifty (Colletta)

Web app per organizzare un regalo di gruppo in Italia: si sceglie il regalo, il gruppo vota, ognuno paga la sua quota e si firma un biglietto digitale. Nome di progetto: «Cosa gli regaliamo?». Nel codice e nell'infrastruttura il nome resta `colletta`.

**Principio fondante:** i soldi non passano mai dal servizio. Chi partecipa paga direttamente chi organizza (PayPal, Satispay, IBAN, contanti).

## Direttrice del prossimo sviluppo

La [specifica dettagliata Gifty](docs/product/gifty/Gifty-flussi-e-decisioni.md) del 24 ottobre 2026 guida le nuove modifiche di prodotto. Distingue decisioni di Cri, proposte da confermare e criteri di accettazione. Le sezioni sull’app Next descrivono il codice originale. L’interfaccia locale separata segue i nuovi flussi: autenticazione e profilo usano Firebase, mentre i dati dei gruppi restano nel browser.

Documenti collegati: [competitor](docs/product/gifty/Gifty-analisi-competitor.md), [proposta UX/design e tavole](docs/product/gifty/Gifty-proposta-UX-design.md), [copy di interfaccia](docs/product/gifty/Gifty-copy-interfaccia.md). Sono proposte e specifiche, non funzionalità già rilasciate.

## Interfaccia locale direzione A

Frontend in [prototype/gifty](prototype/gifty/README.md), con le viste di organizzatore, partecipante e festeggiato, home fotografica e racconto interattivo Come funziona. Avvio: `python3 prototype/gifty/serve.py`, poi [apri Gifty](http://127.0.0.1:4193). Google, link email e profilo sono collegati al progetto Firebase esistente; il catalogo legge i 180 prodotti e le foto della fonte di Stefano. I gruppi restano locali e non sono sincronizzati fra utenti. Nessun pagamento, invito o acquisto viene effettuato automaticamente.

Riferimenti: [UX e design guidelines](docs/product/gifty/Gifty-UX-design-guidelines.md), [catalogo, API e regole](docs/product/gifty/Gifty-catalogo-e-API.md), [riepilogo per continuare](docs/product/gifty/Gifty-riepilogo-continuazione.md), [stato operativo](docs/product/gifty/STATUS.md), [verifica autenticazione](docs/product/gifty/Gifty-verifica-autenticazione.md). Le sezioni seguenti descrivono l’app Next originale.

## Due porte d'ingresso

- **«Cerco un'idea»**: catalogo di prodotti selezionati (Amazon.it, link affiliati) e percorso «Trova il regalo» (`/regalo`).
- **«Organizzo un regalo di gruppo»**: si crea la colletta, si condivide un link nel gruppo WhatsApp, chi partecipa entra senza registrarsi.

## Cosa fa oggi

| Funzione | Rotte |
|---|---|
| Catalogo, scheda prodotto, preferiti | `/catalogo`, `/prodotto/[slug]`, `/preferiti` |
| Creazione della colletta (wizard) | `/crea` |
| Votazione del regalo | dentro la colletta |
| Pagina di chi partecipa | `/c/[slug]` |
| Dashboard e chiusura di chi organizza | `/gestisci/[slug]`, `/le-mie-collette` |
| Biglietto digitale | `/biglietto`, `/b/[slug]` |
| Ordine del catalogo (area riservata) | `/backoffice/catalogo` |
| Varianti di UX (V1, V2, V3) | `/scegli-ux`, `/v2`, `/v3` |

Online: https://colletta--users-database-e7ac6.europe-west4.hosted.app

## Stack

Next.js 15.5, React 19.1, Tailwind 3.4, Firebase (Firestore, database `colletta`; Auth), pnpm 10. Pubblicato su Firebase App Hosting, backend `colletta`, regione europe-west4.

## Avvio in locale

```bash
pnpm install
pnpm dev
```

Senza le variabili Firebase l'app gira in **modalità memoria**: i dati vivono nel processo del server e si perdono al riavvio. Per usare Firestore copia `.env.local.example` in `.env.local` e compila tutte le variabili, client e Admin.

Controlli: `pnpm typecheck`, `pnpm lint`, `pnpm test`; regole Firestore con `pnpm test:rules` (servono gli emulatori Firebase e Java).

## Documenti

- `PROMPT_PROTOTIPO_COLLETTA.md`: specifica del prototipo precedente; per i nuovi flussi usare la direttrice Gifty collegata sopra.
- `DECISIONI.md`: scelte prese, limiti noti, cosa è verificato e cosa no. Da leggere prima di cambiare qualcosa.
- `AMAZON_AFFILIATES_API.md`: integrazione con il programma di affiliazione Amazon.

## Limiti noti

Dettagli in `DECISIONI.md`, sezioni 1 e 10.

- Chi ha lo slug di una colletta può leggere i dati di pagamento di chi organizza.
- Il progetto Firebase è condiviso con altre app.
- Mai provato su un telefono vero né in un'anteprima WhatsApp.
